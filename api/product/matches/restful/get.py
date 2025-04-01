from typing import List
from sqlalchemy.sql import text
from sqlalchemy.orm import Session 
from fastapi import Depends, HTTPException

from db import get_db
from product.matches.router import router
from product.matches.schema import Match, Quarter, GoalDetail, LineupDetail

@router.get("/{match_idx}", response_model=Match)
def get_match(match_idx: int, db: Session = Depends(get_db)):
    sql = "SELECT * FROM matches WHERE match_idx = :match_idx"
    result = db.execute(text(sql), {"match_idx": match_idx}).mappings().fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Match not found")
    
    return result

@router.get("/{match_idx}/quarters", response_model=List[Quarter])
def get_quarters_in_match(match_idx: int, db: Session = Depends(get_db)):
    sql = "SELECT * FROM quarters WHERE match_idx = :match_idx"
    result = db.execute(text(sql), {"match_idx": match_idx}).mappings().all()
    
    if not result:
        raise HTTPException(status_code=404, detail="Quarter not found")

    return result


@router.get("/{match_idx}/goals", response_model=List[GoalDetail])
def get_goals_in_match(match_idx: int, db: Session = Depends(get_db)):
    sql = """
    SELECT 
        g.goal_idx, g.match_idx, g.quarter_idx, 
        g.goal_player_id, goal_user.name AS goal_player_name, goal_user.back_number AS goal_player_back_number,
        g.assist_player_id, assist_user.name AS assist_player_name, assist_user.back_number AS assist_player_back_number,
        g.goal_type, g.created_at
    FROM goals g
    LEFT JOIN users goal_user ON g.goal_player_id = goal_user.user_idx
    LEFT JOIN users assist_user ON g.assist_player_id = assist_user.user_idx
    WHERE g.match_idx = :match_idx
    ORDER BY goal_idx
    """
    result = db.execute(text(sql), {"match_idx": match_idx}).mappings().all()
    
    if not result:
        raise HTTPException(status_code=404, detail="Goals not found")

    return result

@router.get("/{match_idx}/lineups", response_model=List[LineupDetail])
def get_lineups_in_match(match_idx: int, db: Session = Depends(get_db)):
    sql = """
    SELECT 
        l.lineup_idx,
        q.match_idx, q.quarter_idx, q.quarter_number, q.tactics, 
        l.lineup_idx, p.name AS position_name, p.position_idx, p.top_coordinate, p.left_coordinate, 
        u.back_number, u.name AS user_name, u.user_idx, l.lineup_status, u.image_url, u.role
    FROM quarters q
    JOIN quarters_lineup l ON q.quarter_idx = l.quarter_idx
    LEFT JOIN positions p ON l.position_idx = p.position_idx
    JOIN users u ON l.player_idx = u.user_idx
    WHERE q.match_idx = :match_idx
    """
        
    result = db.execute(text(sql), {"match_idx": match_idx}).mappings().all()
    
    if not result:
        raise HTTPException(status_code=404, detail="Lineup not found")

    return result

@router.get("", response_model=List[Match])
def get_match_for_pagination(
    last_item_id: int = None, last_item_dt: str = None,  
    page_size: int = 10, db: Session = Depends(get_db)
):
    sql = """
    SELECT * FROM matches
    WHERE (:last_item_id IS NULL OR 
           (dt < :last_item_dt) OR 
           (dt = :last_item_dt AND match_idx < :last_item_id))
    ORDER BY dt DESC, match_idx DESC
    LIMIT :page_size;
    """

    params = {
        "last_item_id": last_item_id,
        "last_item_dt": last_item_dt,
        "page_size": page_size
    }

    result = db.execute(text(sql), params).mappings().all()
    return result

