from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from db import get_db
from schemas.rank import UserAllStats, UserParticipation, UserStatsOpposingTeam, UserStatsPosition, OpposingTeamAllStats
from sqlalchemy.sql import text

router = APIRouter()

@router.get("/", response_model=List[UserAllStats])
def get_user_all_stats(db: Session = Depends(get_db)):
    query = """
        select
                a.*,
                coalesce(b.match_cnt, 0) as match_cnt,
                case when b.match_cnt = 0 then 0 
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
                    count(distinct m.match_idx) as max_match_cnt
            from users u  	 	 	
                left join matches m on m.dt >= u.join_date  
            group by 1,2,3,4,5            

        ) a
        join
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
        ) d on d.user_idx = c.user_idx
    """
    
    result = db.execute(text(query)).fetchall()
    
    return [
        UserAllStats(
            user_idx=row.user_idx,
            name=row.name,
            back_number=row.back_number,
            position=row.position,
            role=row.role,
            match_cnt=row.match_cnt,
            max_match_cnt=row.max_match_cnt,
            ratio=row.ratio,
            goal_cnt=row.goal_cnt,
            assist_cnt=row.assist_cnt,
            quarter_cnt=row.quarter_cnt
        )
        for row in result
    ]

@router.get("/{user_idx}/participation", response_model=List[UserParticipation])
def get_user_participation(user_idx: int, db: Session = Depends(get_db)):
    query = f"""
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
                    case when ql.player_idx is null then 0 else 1 end as is_participation,
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
            group by 1,2,3
        ) a
        join users u on a.user_idx = u.user_idx 
        where a.dt >= u.join_date 
    """

    result = db.execute(text(query)).fetchall()

    return [
        UserParticipation(
            user_idx=row.user_idx,            
            dt=row.dt,
            is_participation=row.is_participation,
            quarter_cnt = row.quarter_cnt
        )
        for row in result
    ]    


@router.get("/{user_idx}/opposing_team", response_model=List[UserStatsOpposingTeam])
def get_user_stats_by_opposing_team(user_idx: int, db: Session = Depends(get_db)):
    query = f"""
        select                 
                m.opposing_team,
                {user_idx} as user_idx,
                sum(case when goal_player_id = {user_idx} and goal_type = '득점' then 1 else 0 end) as goal_cnt,
                sum(case when assist_player_id = {user_idx} and goal_type = '득점' then 1 else 0 end) as assist_cnt,
                count(distinct m.match_idx) as match_cnt
        from matches m
            join quarters q on m.match_idx = q.match_idx 
            join quarters_lineup ql on q.quarter_idx = ql.quarter_idx
            left join goals g on g.quarter_idx = q.quarter_idx
            join positions p on ql.position_idx = p.position_idx
         where
            ql.player_idx = {user_idx}  
        group by 1,2
    """

    result = db.execute(text(query)).fetchall()

    return [
        UserStatsOpposingTeam(
            opposing_team=row.opposing_team,
            user_idx=row.user_idx, 
            goal_cnt=row.goal_cnt,
            assist_cnt=row.assist_cnt,
            match_cnt=row.match_cnt           
        )
        for row in result
    ]    

@router.get("/{user_idx}/position", response_model=List[UserStatsPosition])
def get_user_stats_by_position(user_idx: int, db: Session = Depends(get_db)):
    query = f"""
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

    result = db.execute(text(query)).fetchall()

    return [
        UserStatsPosition(
            user_idx=row.user_idx,
            tactics=row.tactics, 
            position_name=row.position_name,
            goal_cnt=row.goal_cnt,
            assist_cnt=row.assist_cnt,
            quarter_cnt=row.quarter_cnt
        )
        for row in result
    ]    

@router.get("/opposing_team", response_model=List[OpposingTeamAllStats])
def get_opposing_team_all_stat(db: Session = Depends(get_db)):
    query = f"""
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

    result = db.execute(text(query)).fetchall()

    return [
        OpposingTeamAllStats(
            opposing_team=row.opposing_team,
            win_match=row.win_match, 
            lose_match=row.lose_match,
            draw_match=row.draw_match,
            winning_point=row.winning_point,
            losing_point=row.losing_point
        )
        for row in result
    ]    