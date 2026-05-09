from typing import List, Optional
from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Query

from db import get_db
from product.rank.router import router
from product.rank.schema import (
    UserAllStats, UserParticipation, UserStatsOpposingTeam,
    UserStatsPosition, OpposingTeamAllStats
)

@router.get("", response_model=List[UserAllStats])
def get_user_all_stats(
    year: Optional[int] = Query(None, description="연도 필터 (예: 2025)"),
    db: Session = Depends(get_db)
):
    # 연도 필터 조건 생성
    year_filter = f"AND EXTRACT(YEAR FROM m.dt) = {year}" if year else ""

    sql = f"""
        select
                a.user_idx,
                a.name,
                a.back_number,
                a.position,
                a.role,
                a.image_url,
                case when coalesce(b.match_cnt, 0) >= max_match_cnt then coalesce(b.match_cnt, 0)
                     else max_match_cnt end as max_match_cnt,
                coalesce(b.match_cnt, 0) as match_cnt,
                case when coalesce(b.match_cnt, 0) >= max_match_cnt then 1
                     when coalesce(b.match_cnt, 0) = 0 then 0
                     else cast(b.match_cnt as float) / a.max_match_cnt end as ratio,
                coalesce(c.goal_cnt, 0) as goal_cnt,
                coalesce(d.assist_cnt, 0) as assist_cnt,
                coalesce(b.quarter_cnt, 0) as quarter_cnt,
                coalesce(e.clean_cnt, 0) as clean_cnt
        from
        (
            select
                    u.user_idx,
                    u.name,
                    u.back_number,
                    u.position,
                    u.role,
                    u.image_url,
                    count(distinct m.match_idx) as max_match_cnt
            from users u
                left join matches m on m.dt >= DATE(u.join_date)
            WHERE 1=1 {year_filter}
            group by 1,2,3,4,5,6

        ) a
        left join
        (
            select
                    ql.player_idx as user_idx,
                    count(distinct m.match_idx) as match_cnt,
                    count(distinct ql.quarter_idx) as quarter_cnt
            from matches m
                join quarters q on m.match_idx = q.match_idx
                join quarters_lineup ql on ql.quarter_idx = q.quarter_idx
            WHERE 1=1 {year_filter}
            group by 1
        ) b on a.user_idx = b.user_idx
        left join
        (
            select
                    g.goal_player_id as user_idx,
                    count(1) as goal_cnt
            from goals g
                join quarters q on g.quarter_idx = q.quarter_idx
                join matches m on q.match_idx = m.match_idx
            where g.goal_type = '득점'
                {year_filter}
            group by 1
        ) c on a.user_idx = c.user_idx
        left join
        (
            select
                    g.assist_player_id as user_idx,
                    count(1) as assist_cnt
            from goals g
                join quarters q on g.quarter_idx = q.quarter_idx
                join matches m on q.match_idx = m.match_idx
            where g.goal_type = '득점'
                {year_filter}
            group by 1
        ) d on a.user_idx = d.user_idx
        left join
        (
            select
                    ql.player_idx as user_idx,
                    count(distinct ql.quarter_idx) as clean_cnt
            from quarters_lineup ql
                join quarters q on ql.quarter_idx = q.quarter_idx
                join matches m on q.match_idx = m.match_idx
                join positions p on ql.position_idx = p.position_idx
            where (
                (p.name = 'GK' or p.name like '%B')
                or (q.tactics in ('4-1-2-3', '4-2-3-1', '4-1-4-1') and p.name in ('CDM', 'LCDM', 'RCDM'))
            )
            and not exists (
                select 1 from goals g
                where g.quarter_idx = q.quarter_idx
                and g.goal_type in ('실점', '자살골')
            )
            {year_filter}
            group by 1
        ) e on a.user_idx = e.user_idx
    """

    result = db.execute(text(sql)).mappings().all()

    if not result:
        raise HTTPException(status_code=404, detail="No user statistics found.")

    return result

@router.get("/{user_idx}/participation", response_model=List[UserParticipation])
def get_user_participation(user_idx: int, db: Session = Depends(get_db)):
    sql = f"""
        select
                u.user_idx,
                a.dt,
                a.is_participation,
                a.quarter_cnt

        from
        (
            select

                    coalesce(ql.player_idx, {user_idx}) as user_idx,
                    m.dt,
                    MAX(case when ql.player_idx is null then 0 else 1 end) as is_participation,
                    sum(case when ql.quarter_idx is null then 0 else 1 end) as quarter_cnt
            from matches m
                join quarters q on m.match_idx = q.match_idx
                left join
                (
                    select
                            ql.quarter_idx,
                            ql.player_idx
                    from quarters_lineup ql
                    where player_idx = {user_idx}
                ) ql on ql.quarter_idx = q.quarter_idx
            group by 1,2
        ) a
        join users u on a.user_idx = u.user_idx
    """

    result = db.execute(text(sql)).mappings().all()

    if not result:
        raise HTTPException(status_code=404, detail=f"No participation data found for user {user_idx}.")

    return result


@router.get("/{user_idx}/opposing_team", response_model=List[UserStatsOpposingTeam])
def get_user_stats_by_opposing_team(user_idx: int, db: Session = Depends(get_db)):
    sql = f"""
        select
            base.opposing_team,
            {user_idx} as user_idx,
            coalesce(goal.goal_cnt, 0) as goal_cnt,
            coalesce(assist.assist_cnt, 0) as assist_cnt,
            base.match_cnt,
            coalesce(clean.clean_cnt, 0) as clean_cnt

        from
        (
            select
                    m.opposing_team,
                    count(distinct m.match_idx) as match_cnt
            from matches m
                join quarters q on m.match_idx = q.match_idx
                join quarters_lineup ql on q.quarter_idx = ql.quarter_idx
            where ql.player_idx = {user_idx}
            group by 1
        ) base
        left join
        (
            select
                    m.opposing_team,
                    count(1) as goal_cnt
            from goals g
                join matches m on g.match_idx = m.match_idx
            where g.goal_type = '득점'
                and g.goal_player_id = {user_idx}
            group by 1
        ) goal on base.opposing_team = goal.opposing_team
        left join
        (
            select
                    m.opposing_team,
                    count(1) as assist_cnt
            from goals g
                join matches m on g.match_idx = m.match_idx
            where g.goal_type = '득점'
                and g.assist_player_id = {user_idx}
            group by 1
        ) assist on base.opposing_team = assist.opposing_team
        left join
        (
            select
                    m.opposing_team,
                    count(distinct ql.quarter_idx) as clean_cnt
            from quarters_lineup ql
                join quarters q on ql.quarter_idx = q.quarter_idx
                join matches m on q.match_idx = m.match_idx
                join positions p on ql.position_idx = p.position_idx
            where ql.player_idx = {user_idx}
                and (
                    (p.name = 'GK' or p.name like '%B')
                    or (q.tactics in ('4-1-2-3', '4-2-3-1', '4-1-4-1') and p.name in ('CDM', 'LCDM', 'RCDM'))
                )
                and not exists (
                    select 1 from goals g
                    where g.quarter_idx = q.quarter_idx
                    and g.goal_type in ('실점', '자살골')
                )
            group by 1
        ) clean on base.opposing_team = clean.opposing_team
    """

    result = db.execute(text(sql)).mappings().all()

    if not result:
        raise HTTPException(status_code=404, detail=f"No opposing team stats found for user {user_idx}.")

    return result

@router.get("/{user_idx}/clean")
def get_user_clean_cnt(user_idx: int, db: Session = Depends(get_db)):
    sql = f"""
        select count(distinct ql.quarter_idx) as clean_cnt
        from quarters_lineup ql
            join quarters q on ql.quarter_idx = q.quarter_idx
            join matches m on q.match_idx = m.match_idx
            join positions p on ql.position_idx = p.position_idx
        where ql.player_idx = {user_idx}
            and (
                (p.name = 'GK' or p.name like '%B')
                or (q.tactics in ('4-1-2-3', '4-2-3-1', '4-1-4-1') and p.name in ('CDM', 'LCDM', 'RCDM'))
            )
            and not exists (
                select 1 from goals g2
                where g2.quarter_idx = q.quarter_idx
                and g2.goal_type in ('실점', '자살골')
            )
    """
    result = db.execute(text(sql)).mappings().first()
    return {"clean_cnt": result["clean_cnt"] if result else 0}

@router.get("/{user_idx}/clean_matches")
def get_user_clean_matches(user_idx: int, db: Session = Depends(get_db)):
    sql = f"""
        select
            m.match_idx,
            m.dt,
            m.opposing_team,
            string_agg(q.quarter_number::text, ',' order by q.quarter_number) as quarter_info
        from quarters_lineup ql
            join quarters q on ql.quarter_idx = q.quarter_idx
            join matches m on q.match_idx = m.match_idx
            join positions p on ql.position_idx = p.position_idx
        where ql.player_idx = {user_idx}
            and (
                (p.name = 'GK' or p.name like '%B')
                or (q.tactics in ('4-1-2-3', '4-2-3-1', '4-1-4-1') and p.name in ('CDM', 'LCDM', 'RCDM'))
            )
            and not exists (
                select 1 from goals g2
                where g2.quarter_idx = q.quarter_idx
                and g2.goal_type in ('실점', '자살골')
            )
        group by m.match_idx, m.dt, m.opposing_team
        order by m.dt desc
    """
    result = db.execute(text(sql)).mappings().all()
    return result

@router.get("/{user_idx}/position", response_model=List[UserStatsPosition])
def get_user_stats_by_position(user_idx: int, db: Session = Depends(get_db)):
    sql = f"""
        select
                {user_idx} as user_idx,
                p.tactics,
                p.name as position_name,
                sum(case when goal_player_id = {user_idx} and goal_type = '득점' then 1 else 0 end) as goal_cnt,
                sum(case when assist_player_id = {user_idx} and goal_type = '득점' then 1 else 0 end) as assist_cnt,
                count(distinct ql.quarter_idx) as quarter_cnt
        from matches m
            join quarters q on m.match_idx = q.match_idx
            join quarters_lineup ql on q.quarter_idx = ql.quarter_idx
            left join goals g on g.quarter_idx = q.quarter_idx
            join positions p on ql.position_idx = p.position_idx
        where
            ql.player_idx = {user_idx}
        group by 1,2,3
    """

    result = db.execute(text(sql)).mappings().all()

    if not result:
        raise HTTPException(status_code=404, detail=f"No position statistics found for user {user_idx}.")

    return result

@router.get("/opposing_team", response_model=List[OpposingTeamAllStats])
def get_opposing_team_all_stat(
    year: Optional[int] = Query(None, description="연도 필터 (예: 2025)"),
    db: Session = Depends(get_db)
):
    # 연도 필터 조건 생성
    year_filter = f"WHERE EXTRACT(YEAR FROM m.dt) = {year}" if year else ""

    sql = f"""
        select
                m.opposing_team,
                sum(case when "result" = '승리' then 1 else 0 end) as win_match,
                sum(case when "result" = '패배' then 1 else 0 end) as lose_match,
                sum(case when "result" = '무승부' then 1 else 0 end) as draw_match,
                sum(winning_point) as winning_point,
                sum(losing_point) as losing_point
        from matches m
        {year_filter}
        group by 1
    """

    result = db.execute(text(sql)).mappings().all()

    if not result:
        raise HTTPException(status_code=404, detail="No opposing team statistics found.")

    return result
