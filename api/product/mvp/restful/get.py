from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from fastapi import Depends, Request, Query, HTTPException
from typing import Optional

from db import get_db
from product.mvp.schema import MVPCheckResponse, MVPData, MVPComment, UserStats
from product.mvp.router import router

@router.get("/check", response_model=MVPCheckResponse)
def check_mvp_data(
    year: Optional[int] = Query(None, description="연도 필터 (예: 2025)"),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    주어진 연도에 MVP 데이터가 있는지 확인하는 엔드포인트
    """
    if not year:
        return MVPCheckResponse(has_data=False)

    try:
        # mvp 테이블에서 해당 연도의 데이터가 있는지 확인
        query = text("""
            SELECT COUNT(*) as count
            FROM mvp
            WHERE year = :year
        """)

        result = db.execute(query, {"year": year}).fetchone()
        has_data = result[0] > 0 if result else False

        return MVPCheckResponse(has_data=has_data)

    except Exception as e:
        print(f"Error checking MVP data: {e}")
        return MVPCheckResponse(has_data=False)


@router.get("/{position_type}/{year}", response_model=MVPData)
def get_mvp_by_position_and_year(
    position_type: str,
    year: int,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    포지션 타입과 연도로 MVP 데이터 조회
    """
    try:
        # MVP 데이터와 플레이어 정보 가져오기
        mvp_query = text("""
            SELECT
                m.mvp_idx, m.year, m.player_idx, m.position_type,
                m.mvp_image_url, m.main_title,
                u.name as player_name, u.back_number as player_back_number,
                u.image_url as player_image_url
            FROM mvp m
            JOIN users u ON m.player_idx = u.user_idx
            WHERE m.position_type = :position_type AND m.year = :year
            LIMIT 1
        """)

        mvp_result = db.execute(mvp_query, {
            "position_type": position_type,
            "year": year
        }).fetchone()

        if not mvp_result:
            raise HTTPException(status_code=404, detail="MVP data not found")

        # MVP 댓글 가져오기
        comments_query = text("""
            SELECT comment_idx, mvp_idx, description
            FROM mvp_comment
            WHERE mvp_idx = :mvp_idx
            ORDER BY created_at ASC
        """)

        comments_result = db.execute(comments_query, {
            "mvp_idx": mvp_result[0]
        }).fetchall()

        comments = [
            MVPComment(
                comment_idx=comment[0],
                mvp_idx=comment[1],
                description=comment[2]
            )
            for comment in comments_result
        ]

        # 해당 연도의 메인 포지션 계산 (가장 많이 출전한 포지션)
        main_position_query = text("""
            SELECT p.name as position_name, COUNT(*) as count
            FROM quarters_lineup ql
            JOIN positions p ON ql.position_idx = p.position_idx
            JOIN quarters q ON ql.quarter_idx = q.quarter_idx
            JOIN matches m ON q.match_idx = m.match_idx
            WHERE ql.player_idx = :player_idx
            AND EXTRACT(YEAR FROM m.dt) = :year
            GROUP BY p.name
            ORDER BY count DESC
            LIMIT 1
        """)

        main_position_result = db.execute(main_position_query, {
            "player_idx": mvp_result[2],
            "year": year
        }).fetchone()

        main_position = main_position_result[0] if main_position_result else None

        return MVPData(
            mvp_idx=mvp_result[0],
            year=mvp_result[1],
            player_idx=mvp_result[2],
            position_type=mvp_result[3],
            mvp_image_url=mvp_result[4],
            main_title=mvp_result[5],
            player_name=mvp_result[6],
            player_back_number=mvp_result[7],
            player_image_url=mvp_result[8],
            main_position=main_position,
            comments=comments
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching MVP data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{player_idx}/{year}", response_model=UserStats)
def get_mvp_player_stats(
    player_idx: int,
    year: int,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    특정 연도의 플레이어 통계 조회
    """
    try:
        stats_query = text(f"""
            SELECT
                COUNT(DISTINCT CASE WHEN g.goal_type = '득점' THEN g.goal_idx END) AS total_goals,
                COUNT(DISTINCT CASE WHEN g.assist_player_id = :player_idx THEN g.goal_idx END) AS total_assists,
                COUNT(DISTINCT ql.quarter_idx) AS total_quarters,
                COUNT(DISTINCT m.match_idx) AS total_matches,
                ROUND(
                    (COUNT(DISTINCT m.match_idx)::NUMERIC / NULLIF(
                        (SELECT COUNT(DISTINCT match_idx)
                         FROM matches
                         WHERE EXTRACT(YEAR FROM dt) = {year}), 0
                    )) * 100, 2
                ) AS attendance_rate
            FROM users u
            LEFT JOIN quarters_lineup ql ON u.user_idx = ql.player_idx
            LEFT JOIN quarters q ON ql.quarter_idx = q.quarter_idx
            LEFT JOIN matches m ON q.match_idx = m.match_idx AND EXTRACT(YEAR FROM m.dt) = {year}
            LEFT JOIN goals g ON g.goal_player_id = u.user_idx AND g.match_idx = m.match_idx
            WHERE u.user_idx = :player_idx
            GROUP BY u.user_idx
        """)

        stats_result = db.execute(stats_query, {"player_idx": player_idx}).fetchone()

        if not stats_result:
            return UserStats(
                total_goals=0,
                total_assists=0,
                total_quarters=0,
                total_matches=0,
                attendance_rate=0.0
            )

        return UserStats(
            total_goals=stats_result[0] or 0,
            total_assists=stats_result[1] or 0,
            total_quarters=stats_result[2] or 0,
            total_matches=stats_result[3] or 0,
            attendance_rate=float(stats_result[4] or 0.0)
        )

    except Exception as e:
        print(f"Error fetching player stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
