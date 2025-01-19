from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from schemas.matches import (
    Match, MatchCreate, MatchUpdate, 
    Quarter, QuarterCreate, QuarterUpdate,
    Goal, GoalCreate, GoalUpdate,
    Lineup, LineupCreate, LineupUpdate,
    LineupDetail
)
from models.matches import Matches, Quarters, Goals, Lineups
from models.positions import Positions
from models.users import Users
from crud import CRUDBase

router = APIRouter()
match_crud = CRUDBase[Matches, MatchCreate, MatchUpdate](Matches, primary_key="match_idx")
quarter_crud = CRUDBase[Quarters, QuarterCreate, QuarterUpdate](Quarters, primary_key='quarter_idx')
goal_crud = CRUDBase[Goals, GoalCreate, GoalUpdate](Goals, primary_key="goal_idx")
lineup_crud = CRUDBase[Lineups, LineupCreate, LineupUpdate](Lineups, primary_key="lineup_idx")

# CREATE
@router.post("/", response_model=Match)
def create_match(match_data: MatchCreate, db: Session = Depends(get_db)):    
    match = match_crud.create(db, match_data)
    return match

# READ
@router.get("/{match_idx}", response_model=Match)
def get_match(match_idx: int, db: Session = Depends(get_db)):
    match = match_crud.get(db, match_idx)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.get("/{match_idx}/quarters", response_model=List[Quarter])
def get_quarters_in_match(match_idx: int, db: Session = Depends(get_db)):
    quarters = quarter_crud.get_by_id(db, id_col = 'match_idx', id_value = match_idx)
    if not quarters:
        raise HTTPException(status_code=404, detail="Quarter not found")
    return quarters

from sqlalchemy.orm import aliased

@router.get("/{match_idx}/goals", response_model=List[Goal])
def get_goals_in_match(match_idx: int, db: Session = Depends(get_db)):
    
    GoalPlayer = aliased(Users)
    AssistPlayer = aliased(Users)

    query = (
        db.query(
            Goals.goal_idx,
            Goals.match_idx,
            Goals.quarter_idx,
            Goals.goal_player_id,
            GoalPlayer.name.label("goal_player_name"),
            GoalPlayer.back_number.label("goal_player_back_number"),
            Goals.assist_player_id,
            AssistPlayer.name.label("assist_player_name"),
            AssistPlayer.back_number.label("assist_player_back_number"),
            Goals.goal_type,
            Goals.created_at
        )
        .outerjoin(GoalPlayer, Goals.goal_player_id == GoalPlayer.user_idx)  # 골 넣은 사람
        .outerjoin(AssistPlayer, Goals.assist_player_id == AssistPlayer.user_idx)  # 어시스트한 사람
        .filter(Goals.match_idx == match_idx)
    )

    goals = query.all()
    
    if not goals:
        raise HTTPException(status_code=404, detail="Goals not found")
    return goals


@router.get("/{match_idx}/lineups", response_model=List[LineupDetail])
def get_lineups_in_match(match_idx: int, db: Session = Depends(get_db)):
    query = (
        db.query(
            Quarters.match_idx,
            Quarters.quarter_idx,
            Quarters.quarter_number,
            Quarters.tactics,
            Lineups.lineup_idx,
            Positions.name.label("position_name"),
            Positions.top_coordinate,
            Positions.left_coordinate,
            Users.back_number,
            Users.name.label("user_name"),
            Lineups.lineup_status          
        )
        .join(Quarters, Lineups.quarter_idx == Quarters.quarter_idx)
        .outerjoin(Positions, Lineups.position_idx == Positions.position_idx)
        .join(Users, Lineups.player_idx == Users.user_idx)
        .filter(Quarters.match_idx == match_idx) 
    )
    lineups = query.all()    
    if not lineups:
        raise HTTPException(status_code=404, detail="Lineup not found")
    return lineups

@router.get("/", response_model=List[Match])
def get_match_for_pagination(last_item_id: int = None, last_item_dt: str = None,  
                             page_size: int = 10, db: Session = Depends(get_db)):
    match = match_crud.get_by_last_item_with_dt(
        db = db,
        last_item_id=last_item_id,
        last_item_dt=last_item_dt,
        page_size=page_size
    )
    return match

# UPDATE
@router.put("/{match_idx}", response_model=Match)
def update_match(match_idx: int, update_data: MatchUpdate, db: Session = Depends(get_db)):
    match = match_crud.update(db, match_idx, update_data)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

# DELETE
@router.delete("/{match_idx}", response_model=dict)
def delete_match_endpoint(match_idx: int, db: Session = Depends(get_db)):
    match = match_crud.delete(db, match_idx)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"detail": "Match deleted successfully"}