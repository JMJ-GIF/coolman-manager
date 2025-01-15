from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from schemas.positions import Position, PositionCreate, PositionUpdate
from models.positions import Positions
from crud import CRUDBase

router = APIRouter()
position_crud = CRUDBase[Positions, PositionCreate, PositionUpdate](Positions, primary_key="position_idx")

@router.get("/{position_idx}", response_model=Position)
def get_position(position_idx: int, db: Session = Depends(get_db)):
    position = position_crud.get(db, position_idx)
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    return position