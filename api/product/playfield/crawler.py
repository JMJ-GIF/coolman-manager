#!/usr/bin/env python3
"""
학교 운동장 공고 수집 배치 스크립트.

실행 방법:
  docker exec coolman-manager-api-1 python /usr/src/app/product/playfield/crawler.py

서버 crontab 등록 예시 (매일 새벽 3시):
  0 3 * * * docker exec coolman-manager-api-1 python /usr/src/app/product/playfield/crawler.py > /var/log/crawler.log 2>&1
"""

import os
import re
import ssl
import sys
import logging
import urllib3
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlencode
from requests.adapters import HTTPAdapter
from sqlalchemy import create_engine, text

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

_LOG_FILE = os.getenv('CRAWLER_LOG_FILE', '/var/log/crawler.log')
_handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
try:
    _fh = logging.FileHandler(_LOG_FILE, mode='w', encoding='utf-8')
    _handlers.append(_fh)
except OSError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=_handlers,
)
log = logging.getLogger(__name__)

KEYWORD = '운동장'  # 서버 사이드 검색어 (단일)
KEYWORDS = [        # 로컬 제목 필터 (OR 조건)
    '운동장',
    '인조잔디',
    '장기사용',
    '장기이용',
    '개방 이용',
    '사용허가',
]

SCHOOLS = [
    {"name": "신도림고등학교", "url": "https://shindorim.sen.hs.kr/8734/subMenu.do"},
    {"name": "인헌고등학교",   "url": "https://inhun.sen.hs.kr/76965/subMenu.do"},
    {"name": "경문고등학교",   "url": "https://kyungmoon.sen.hs.kr/72563/subMenu.do"},
    {"name": "상문고등학교",   "url": "https://sangmoon.sen.hs.kr/18168/subMenu.do"},
    {"name": "중경고등학교",   "url": "https://jungkyung.sen.hs.kr/66491/subMenu.do"},
    {"name": "대영고등학교",   "url": "https://dy.sen.hs.kr/74523/subMenu.do"},
    {"name": "언남고등학교",   "url": "https://eonnam.sen.hs.kr/16877/subMenu.do"},
    {"name": "장훈고등학교",   "url": "https://www.janghoon.hs.kr/?r=home&m=bbs&bid=45&where=subject%7Ctag&keyword=%EC%9A%B4%EB%8F%99%EC%9E%A5"},
    {"name": "영락고등학교",   "url": "https://yrgo.sen.hs.kr/74270/subMenu.do"},
    {"name": "동작고등학교",   "url": "https://dongjak.sen.hs.kr/18283/subMenu.do"},
    {"name": "남강고등학교",   "url": "https://namkang.sen.hs.kr/75213/subMenu.do"},
]

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
}

def _is_relevant(title):
    return any(k in title for k in KEYWORDS)

DATE_PATTERN      = re.compile(r'\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}')
# fnView(nttId)  — 단일 인자
FNVIEW_ID_PATTERN  = re.compile(r'fnView\s*\(\s*[\'"]?(\d+)[\'"]?\s*\)')
# fnView('BBSMSTR_...', 'nttId')  — DGGB 이중 인자
FNVIEW_ID2_PATTERN = re.compile(
    r'fnView\s*\(\s*[\'"]([A-Za-z0-9_]+)[\'"]\s*,\s*[\'"]?(\d+)[\'"]?\s*\)'
)


# ─── SSL 어댑터 ───────────────────────────────────────────────────────────────

class LegacySSLAdapter(HTTPAdapter):
    """한국 교육청 사이트의 구형 SSL / 자체서명 인증서 대응용 어댑터."""

    def __init__(self, *args, **kwargs):
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.set_ciphers('ALL:@SECLEVEL=0')
        self._ssl_ctx = ctx
        super().__init__(*args, **kwargs)

    def init_poolmanager(self, *args, **kwargs):
        kwargs['ssl_context'] = self._ssl_ctx
        super().init_poolmanager(*args, **kwargs)

    def send(self, request, **kwargs):
        kwargs['verify'] = False
        return super().send(request, **kwargs)


SESSION = requests.Session()
SESSION.mount('https://', LegacySSLAdapter())


# ─── HTTP 유틸 ────────────────────────────────────────────────────────────────

def fetch_html(url, method='get', data=None, params=None):
    try:
        if method == 'post':
            resp = SESSION.post(url, headers=HEADERS, data=data, timeout=15)
        else:
            resp = SESSION.get(url, headers=HEADERS, params=params, timeout=15)
        resp.raise_for_status()
        if resp.encoding and resp.encoding.lower() in ('iso-8859-1', 'ascii'):
            resp.encoding = resp.apparent_encoding or 'utf-8'
        return resp.text
    except Exception as e:
        log.warning(f"Fetch failed [{url}]: {e}")
        return None


# ─── NEIS 게시판 URL 탐색 ────────────────────────────────────────────────────

# HTML 내 .do URL 패턴 (따옴표/백틱 모두)
_ANY_DO_URL_RE = re.compile(
    r'["\'`]([^"\'`\s<>]{0,80}(?:board|bbs|notice|select)[^"\'`\s<>]{0,80}\.do(?:\?[^"\'`\s<>]*)?)["\' `]',
    re.IGNORECASE,
)
_FORM_ACTION_RE = re.compile(r'action\s*=\s*["\']([^"\']+\.do[^"\']*)["\']', re.IGNORECASE)
# bbsId: JS 리터럴 방식
_BBS_ID_RE      = re.compile(r'bbsId["\']?\s*[:=,]\s*["\']([A-Za-z0-9_]{5,60})["\']')
# bbsId: URL 파라미터 방식 (?bbsId=BBSMSTR_... 또는 &bbsId=...)
_BBS_ID_URL_RE  = re.compile(r'[?&]bbsId=([A-Za-z0-9_]{5,60})')
# BBSMSTR_ 직접 패턴 (함수 인자 등 모든 문맥)
_BBSMSTR_RE     = re.compile(r'(BBSMSTR_[A-Za-z0-9]{10,30})')
# href 에 포함된 보드 URL 직접 추출 (bbsId 포함)
_BOARD_HREF_RE  = re.compile(
    r'href=["\']([^"\']*(?:selectBoardList|boardList|bbsList|noticeList)\.do\?[^"\']*bbsId=[^"\'&\s]+[^"\']*)["\']',
    re.IGNORECASE,
)
# fn_egov_link_page('/path/selectBoardList.do?bbsId=...') 패턴
_FN_EGOV_RE = re.compile(
    r'fn_egov_link_page\s*\(\s*["\']([^"\']+\.do[^"\']*)["\']',
    re.IGNORECASE,
)


def _extract_bbs_ids(html):
    """HTML에서 bbsId 목록을 다양한 패턴으로 추출."""
    ids = list(dict.fromkeys(
        _BBS_ID_RE.findall(html) + _BBS_ID_URL_RE.findall(html) + _BBSMSTR_RE.findall(html)
    ))
    return ids


def _neis_board_candidates(html, base_url, keyword):
    """
    NEIS subMenu.do 게시판 검색 (url, params) 후보 목록 생성.

    전략:
    0) HTML href/fn_egov 에서 board URL + bbsId 직접 추출 → 최우선 시도
    1) 메뉴코드로 boardList.do / selectBoardList.do 직접 구성 (NEIS 공통 패턴)
    2) HTML 원문에서 .do URL / form action / bbsId 추출 후 조합
    """
    m_host = re.match(r'https?://[^/]+', base_url)
    if not m_host:
        return []
    host = m_host.group()

    menu_m    = re.search(r'/(\d+)/subMenu\.do', base_url)
    menu_code = menu_m.group(1) if menu_m else ''

    # ── HTML에서 URL / bbsId 추출 ────────────────────────────────────
    do_paths     = list(dict.fromkeys(_ANY_DO_URL_RE.findall(html)))
    form_acts    = list(dict.fromkeys(_FORM_ACTION_RE.findall(html)))
    bbs_ids      = _extract_bbs_ids(html)
    board_hrefs  = list(dict.fromkeys(_BOARD_HREF_RE.findall(html)))
    fn_egov_urls = list(dict.fromkeys(_FN_EGOV_RE.findall(html)))

    log.debug(f"  do_paths: {do_paths[:8]}")
    log.debug(f"  form_actions: {form_acts[:5]}")
    log.debug(f"  bbs_ids: {bbs_ids[:5]}")
    log.debug(f"  board_hrefs: {board_hrefs[:5]}")
    log.debug(f"  fn_egov_urls: {fn_egov_urls[:5]}")

    candidates = []

    # 0) href/fn_egov 에서 직접 추출한 보드 URL (bbsId 포함) → 최우선
    for raw in board_hrefs + fn_egov_urls:
        url = raw if raw.startswith('http') else urljoin(base_url, raw)
        if host not in url:
            continue
        for fld in ('searchWrd', 'searchWord'):
            for cnd in ('1', '0'):
                candidates.append((url, {fld: keyword, 'searchCnd': cnd, 'pageIndex': '1'}))

    # 1) 메뉴코드로 selectBoardList.do / boardList.do 직접 구성
    if menu_code:
        for board_endpoint in ('selectBoardList.do', 'boardList.do', 'bbsList.do',
                               'noticeList.do'):
            direct_url = f"{host}/{menu_code}/{board_endpoint}"
            for fld in ('searchWrd', 'searchWord'):
                for cnd in ('1', '0', ''):
                    p = {fld: keyword, 'pageIndex': '1'}
                    if cnd:
                        p['searchCnd'] = cnd
                    candidates.append((direct_url, p))
                    for bbs_id in bbs_ids[:5]:
                        candidates.append((direct_url, {**p, 'bbsId': bbs_id}))

    # 2) HTML에서 추출한 경로
    for raw in do_paths + form_acts:
        url = raw if raw.startswith('http') else urljoin(base_url, raw)
        if host not in url:
            continue
        for fld in ('searchWrd', 'searchWord'):
            base_p = {fld: keyword, 'pageIndex': '1'}
            candidates.append((url, base_p))
            for bbs_id in bbs_ids[:3]:
                candidates.append((url, {**base_p, 'bbsId': bbs_id, 'searchCnd': '1'}))

    # 중복 제거 (url + sorted params 기준)
    seen_keys = set()
    deduped = []
    for url, params in candidates:
        key = url + '|' + '&'.join(f'{k}={v}' for k, v in sorted(params.items()))
        if key not in seen_keys:
            seen_keys.add(key)
            deduped.append((url, params))

    return deduped


# ─── 검색 실행 ────────────────────────────────────────────────────────────────

def _submit_form(soup, base_url, keyword):
    """일반 <form> 방식 검색 처리."""
    search_input = (
        soup.find('input', {'id': 'searchWrd'}) or
        soup.find('input', {'name': 'searchWrd'}) or
        soup.find('input', {'id': 'searchWord'}) or
        soup.find('input', {'name': 'searchWord'})
    )
    if not search_input:
        return None

    form = search_input.find_parent('form')
    if not form:
        return None

    field_name = search_input.get('id') or search_input.get('name') or 'searchWrd'
    action = (form.get('action') or '').strip() or base_url
    if not action.startswith('http'):
        action = urljoin(base_url, action)

    method = form.get('method', 'get').lower()
    form_data = {
        inp.get('name'): inp.get('value', '')
        for inp in form.find_all('input')
        if inp.get('name') and inp.get('name') not in ('searchWrd', 'searchWord')
    }
    form_data.setdefault('searchCnd', '1')
    form_data[field_name] = keyword

    log.debug(f"  Form submit → {action} [{method.upper()}] params={list(form_data)}")
    if method == 'post':
        return fetch_html(action, method='post', data=form_data)
    return fetch_html(action, params=form_data)


def submit_search(html, base_url, keyword):
    """
    검색 결과 HTML 반환.

    NEIS subMenu.do 사이트:
      실제 게시판은 boardList.do 등 별도 URL 에서 AJAX 로 로드된다.
      1) 페이지 HTML/JS 에서 board URL + bbsId + 검색 파라미터명을 추출
      2) 추출된 조합으로 직접 요청 → 행 파싱 성공 시 반환
    기타 사이트:
      <form> 파싱 후 제출.
    """
    if 'subMenu.do' in base_url:
        candidates = _neis_board_candidates(html, base_url, keyword)
        for url, params in candidates:
            log.debug(f"  Trying: {url}?{urlencode(params)}")
            result_html = fetch_html(url, params=params)
            if not result_html:
                continue
            rows = parse_board_rows(result_html, url)
            log.debug(f"  → {len(rows)} rows")
            if rows:
                return result_html
        return None

    # ── 기타 사이트: DOM 파싱 ────────────────────────────────────────
    soup = BeautifulSoup(html, 'html.parser')
    result_html = _submit_form(soup, base_url, keyword)
    if result_html and parse_board_rows(result_html, base_url):
        return result_html

    return None


# ─── 결과 파싱 ────────────────────────────────────────────────────────────────

def find_date(element):
    m = DATE_PATTERN.search(element.get_text(' ', strip=True))
    return m.group() if m else ''


def _extract_fnview_id(text):
    m = FNVIEW_ID_PATTERN.search(text or '')
    return m.group(1) if m else None


def _get_fnview_base_url(soup, base_url):
    """
    페이지 <script>에서 fnView 함수 바디를 파싱해 상세 URL 접두사를 반환.
    예: '/8734/bbsDetail.do?bbsIdx=' → 'https://school.sen.hs.kr/8734/bbsDetail.do?bbsIdx='
    """
    scripts = '\n'.join(tag.string or '' for tag in soup.find_all('script'))
    fn_match = re.search(
        r'function\s+fnView\s*\([^)]*\)\s*\{(.*?)\}',
        scripts, re.DOTALL,
    )
    if not fn_match:
        return None
    fn_body = fn_match.group(1)

    # location.href = '/path/bbsDetail.do?bbsIdx=' + var
    href_m = re.search(
        r'location\.href\s*=\s*["\']([^"\']+)["\']',
        fn_body,
    )
    if href_m:
        return urljoin(base_url, href_m.group(1))

    # 문자열 리터럴에서 bbsDetail 경로 탐색
    path_m = re.search(r'["\']([^"\']*bbsDetail[^"\']*)["\']', fn_body)
    if path_m:
        return urljoin(base_url, path_m.group(1))

    return None


def parse_board_rows(html, base_url):
    """
    검색 결과 페이지의 테이블 행에서 제목/날짜/링크를 추출.
    NEIS 사이트는 href="javascript:fnView(id)" 패턴을 사용하므로
    fnView 함수를 파싱해 실제 URL 을 역산한다.
    """
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    seen = set()

    fnview_base = _get_fnview_base_url(soup, base_url)
    log.debug(f"  fnview_base: {fnview_base}")

    for row in soup.find_all('tr'):
        cells = row.find_all('td')
        if len(cells) < 2:
            continue

        # 링크가 있는 셀 찾기 (href 또는 onclick)
        link_cell, a_tag = None, None
        for cell in cells:
            a = cell.find('a')
            if a and a.get_text(strip=True):
                link_cell, a_tag = cell, a
                break

        if not a_tag:
            continue

        title = a_tag.get_text(strip=True)
        if not title:
            continue

        href    = (a_tag.get('href')    or '').strip()
        onclick = (a_tag.get('onclick') or '').strip()
        link    = None

        # 일반 href
        if href and not href.startswith('javascript') and href not in ('#', ''):
            link = href if href.startswith('http') else urljoin(base_url, href)

        # DGGB 이중 인자: fnView('BBSMSTR_...', 'nttId')
        if not link:
            m2 = FNVIEW_ID2_PATTERN.search(onclick) or FNVIEW_ID2_PATTERN.search(href)
            if m2:
                # 플레이스홀더 → crawl_school 에서 boardView.do URL 로 교체
                link = f"#neis:{m2.group(1)}:{m2.group(2)}"

        # 단일 인자: fnView(nttId)
        if not link:
            fn_id = _extract_fnview_id(href) or _extract_fnview_id(onclick)
            if fn_id:
                if fnview_base:
                    link = fnview_base + fn_id
                else:
                    board_m = re.search(r'/(\d+)/subMenu\.do', base_url)
                    if board_m:
                        scheme_host = re.match(r'https?://[^/]+', base_url)
                        if scheme_host:
                            link = f"{scheme_host.group()}/{board_m.group(1)}/bbsDetail.do?bbsIdx={fn_id}"

        if not link or link in seen:
            continue
        seen.add(link)

        # 날짜는 링크 셀이 아닌 다른 셀에서 탐색
        date_str = ''
        for cell in cells:
            if cell is link_cell:
                continue
            date_str = find_date(cell)
            if date_str:
                break

        results.append({
            'title': title[:500],
            'link': link,
            'upload_date': date_str,
        })

    if not results:
        raw_tables = html.count('<table')
        raw_board  = html.count('boardList')
        log.debug(f"  No rows parsed (tables={raw_tables}, boardList={raw_board})")

    return results


def parse_by_keyword(html, base_url):
    """폼 제출이 불가능할 때 현재 페이지에서 키워드 포함 앵커를 직접 탐색."""
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    seen = set()

    for a in soup.find_all('a', href=True):
        title = a.get_text(strip=True)
        if not _is_relevant(title):
            continue
        href = a['href'].strip()
        if not href or href.startswith('javascript'):
            continue
        link = href if href.startswith('http') else urljoin(base_url, href)
        if link in seen:
            continue
        seen.add(link)

        date_str = ''
        for tag in ('tr', 'li', 'article', 'div'):
            ancestor = a.find_parent(tag)
            if ancestor:
                date_str = find_date(ancestor)
                if date_str:
                    break

        results.append({'title': title[:500], 'link': link, 'upload_date': date_str})

    return results


# ─── 학교별 크롤링 ────────────────────────────────────────────────────────────

def _collect_candidates(url, html):
    """
    메인 페이지 + 포함된 iframe/frame 을 모두 수집.
    NEIS 학교 사이트는 게시판 내용을 iframe 안에 로드함.
    """
    candidates = [(url, html)]
    soup = BeautifulSoup(html, 'html.parser')

    for tag in soup.find_all(['iframe', 'frame'], src=True):
        src = tag.get('src', '').strip()
        if not src or src.startswith('javascript'):
            continue
        frame_url = src if src.startswith('http') else urljoin(url, src)
        frame_html = fetch_html(frame_url)
        if frame_html:
            has_sw = 'searchWord' in frame_html
            log.debug(f"  iframe: {frame_url}  (has searchWord: {has_sw})")
            candidates.append((frame_url, frame_html))

    return candidates


def crawl_school(school):
    name = school['name']
    url = school['url']
    log.info(f"Crawling: {name}")

    html = fetch_html(url)
    if not html:
        return []

    log.debug(f"  Main HTML size: {len(html)},  has 'searchWord': {'searchWord' in html}")

    # 메인 페이지 + iframe 목록 수집
    candidates = _collect_candidates(url, html)

    # 각 후보 페이지에서 검색 폼 제출 시도
    for cand_url, cand_html in candidates:
        result_html = submit_search(cand_html, cand_url, KEYWORD)
        if result_html:
            items = parse_board_rows(result_html, cand_url)
            if items:
                for item in items:
                    item['school_name'] = name
                    item['link'] = url  # 브라우저에서 열 수 있는 학교 게시판 URL

                # 서버 검색이 불완전할 경우를 대비해 키워드 재필터
                items = [it for it in items if _is_relevant(it['title'])]
                if items:
                    log.info(f"  → {len(items)} item(s) found (via search form)")
                    return items

    # fallback 1: NEIS 게시판 - 페이지 순회로 로컬 필터링
    if 'subMenu.do' in url:
        paginated = _crawl_neis_paginated(name, url, html)
        if paginated:
            return paginated

    # 최종 fallback: 모든 후보 페이지에서 키워드 앵커 스캔
    seen, all_items = set(), []
    for cand_url, cand_html in candidates:
        for item in parse_by_keyword(cand_html, cand_url):
            if item['link'] not in seen:
                seen.add(item['link'])
                all_items.append(item)

    for item in all_items:
        item['school_name'] = name
    log.info(f"  → {len(all_items)} item(s) found (via keyword scan)")
    return all_items


def _crawl_neis_paginated(name, school_url, html):
    """
    NEIS 서버 keyword 검색이 작동하지 않는 학교:
    게시판 전체를 페이지별로 가져와 제목에서 로컬 필터링.
    최대 MAX_PAGES 페이지까지 탐색.
    """
    MAX_PAGES = 20

    m_host = re.match(r'https?://[^/]+', school_url)
    if not m_host:
        return []
    host = m_host.group()

    bbs_ids = _extract_bbs_ids(html)
    if not bbs_ids:
        log.debug("  paginated: no bbsId found, skipping")
        return []

    board_url = f"{host}/dggb/module/board/selectBoardListAjax.do"
    log.debug(f"  paginated fallback: bbsIds={bbs_ids[:3]}, board={board_url}")

    results = []
    seen_titles = set()

    for bbs_id in bbs_ids[:3]:
        # submit_search 에서 엉뚱한 URL들을 방문하면 세션 상태가 깨질 수 있으므로
        # 학교 메인 페이지를 다시 방문해 세션을 재초기화
        fetch_html(school_url)

        for page in range(1, MAX_PAGES + 1):
            page_html = fetch_html(board_url, params={'bbsId': bbs_id, 'pageIndex': str(page)})
            if not page_html:
                break
            rows = parse_board_rows(page_html, board_url)
            if not rows:
                break
            log.debug(f"  page {page}: {len(rows)} rows")
            matched = [r for r in rows if _is_relevant(r['title']) and r['title'] not in seen_titles]
            for r in matched:
                seen_titles.add(r['title'])
                r['school_name'] = name
                r['link'] = school_url
                results.append(r)
            if len(rows) < 10:
                break

    log.info(f"  → {len(results)} item(s) found (via pagination)")
    return results


# ─── DB 저장 ─────────────────────────────────────────────────────────────────

def upsert(engine, items):
    if not items:
        return 0
    count = 0
    with engine.connect() as conn:
        for item in items:
            r = conn.execute(text("""
                INSERT INTO playground_announcements
                    (school_name, title, upload_date, link, is_new)
                VALUES
                    (:school_name, :title, :upload_date, :link, TRUE)
                ON CONFLICT (school_name, title, upload_date) DO NOTHING
            """), item)
            count += r.rowcount
        conn.commit()
    return count


def update_last_crawled(engine):
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO crawler_metadata (key, value)
            VALUES ('last_crawled_at', NOW()::TEXT)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        """))
        conn.commit()


# ─── 엔트리포인트 ────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('schools', nargs='*', help='크롤링할 학교 이름 (없으면 전체)')
    parser.add_argument('--no-db', action='store_true', help='DB 저장 없이 결과만 출력')
    args = parser.parse_args()

    targets = SCHOOLS
    if args.schools:
        targets = [s for s in SCHOOLS if any(k in s['name'] for k in args.schools)]
        if not targets:
            log.error(f"매칭되는 학교 없음: {args.schools}")
            sys.exit(1)

    engine = None
    if not args.no_db:
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            log.error("DATABASE_URL is not set (--no-db 옵션으로 DB 없이 실행 가능)")
            sys.exit(1)
        engine = create_engine(db_url + '/coolman')

    start = datetime.now()
    log.info(f"=== 크롤러 시작: {start.strftime('%Y-%m-%d %H:%M:%S')} ===")

    all_items = []
    for school in targets:
        try:
            items = crawl_school(school)
            all_items.extend(items)
            log.info(f"  [{school['name']}] {len(items)}건")
        except Exception as e:
            log.error(f"  [{school['name']}] 오류: {e}")

    elapsed = int((datetime.now() - start).total_seconds())

    if engine:
        inserted = upsert(engine, all_items)
        update_last_crawled(engine)
        log.info(f"=== 완료: 총 {len(all_items)}건 수집 / {inserted}건 신규 저장 / {elapsed}초 소요 ===")
    else:
        log.info(f"=== 완료 (--no-db): 총 {len(all_items)}건 수집 / {elapsed}초 소요 ===")


if __name__ == '__main__':
    main()
