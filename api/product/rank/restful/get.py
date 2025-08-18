from typing import List
from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException

from db import get_db
from product.rank.router import router
from product.rank.schema import (
    UserAllStats, UserParticipation, UserStatsOpposingTeam,
    UserStatsPosition, OpposingTeamAllStats
)

@router.get("", response_model=List[UserAllStats])
def get_user_all_stats(db: Session = Depends(get_db)):
    sql = """
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
                coalesce(b.quarter_cnt, 0) as quarter_cnt
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
            group by 1
        ) b on a.user_idx = b.user_idx
        left join 
        (
            select  	
                    goal_player_id as user_idx,
                    count(1) as goal_cnt
            from goals g 
            where goal_type = '득점'
            group by 1
        ) c on a.user_idx = c.user_idx
        left join 
        (
            select  	
                    assist_player_id as user_idx,
                    count(1) as assist_cnt
            from goals g 
            where goal_type = '득점'
            group by 1
        ) d on a.user_idx = d.user_idx
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
            a.opposing_team,
            a.player_idx as user_idx,
            SUM(goal_cnt) as goal_cnt,
            SUM(assist_cnt) as assist_cnt,
            count(distinct a.match_idx) as match_idx
            
        from
        (
            select
                    m.match_idx,
                    m.opposing_team,
                    ql.player_idx			
            from matches m
                join quarters q on m.match_idx = q.match_idx 
                join quarters_lineup ql on q.quarter_idx = ql.quarter_idx
            where ql.player_idx = {user_idx}
            group by 1,2,3
        ) a
        left join
        (
            select  	
                    match_idx,
                    count(1) as goal_cnt
            from goals g 
            where goal_type = '득점'
                and goal_player_id = {user_idx}
            group by 1
            
        ) b on a.match_idx = b.match_idx
        left join
        (
            select  	
                    match_idx,
                    count(1) as assist_cnt
            from goals g 
            where goal_type = '득점'
                and assist_player_id = {user_idx}
            group by 1
        ) c on a.match_idx = c.match_idx
        group by 1,2
    """

    result = db.execute(text(sql)).mappings().all()

    if not result:
        raise HTTPException(status_code=404, detail=f"No opposing team stats found for user {user_idx}.")

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
def get_opposing_team_all_stat(db: Session = Depends(get_db)):
    sql = f"""
        select 
                m.opposing_team,
                sum(case when "result" = '승리' then 1 else 0 end) as win_match,
                sum(case when "result" = '패배' then 1 else 0 end) as lose_match,
                sum(case when "result" = '무승부' then 1 else 0 end) as draw_match,
                sum(winning_point) as winning_point,
                sum(losing_point) as losing_point
        from matches m
        group by 1
    """

    result = db.execute(text(sql)).mappings().all()

    if not result:
        raise HTTPException(status_code=404, detail="No opposing team statistics found.")

    return result