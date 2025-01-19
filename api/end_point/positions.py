from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from db import get_db
from schemas.positions import Position, PositionCreate, PositionUpdate
from models.positions import Positions
from crud import CRUDBase

router = APIRouter()
position_crud = CRUDBase[Positions, PositionCreate, PositionUpdate](Positions, primary_key="position_idx")


# 특정 Position 조회
@router.get("/{position_idx}", response_model=Position)
def get_position(position_idx: int, db: Session = Depends(get_db)):
    position = position_crud.get(db, position_idx)
    if not position:
        raise HTTPException(status_code=404, detail=f"Position with ID {position_idx} not found")
    return position


# 전체 또는 특정 그룹의 Position 조회
@router.get("/", response_model=List[Position])
def get_positions(
    position_ids: Optional[str] = Query(
        None, description="Comma-separated list of position IDs to fetch"
    ),
    db: Session = Depends(get_db),
):
    if position_ids:
        try:
            # 콤마로 구분된 문자열을 리스트로 변환
            position_id_list = [int(id.strip()) for id in position_ids.split(",")]
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid position ID format. Must be a comma-separated list of integers."
            )

        positions = position_crud.get_multi(db, position_id_list)
        if not positions:
            raise HTTPException(status_code=404, detail="No positions found with the given IDs")
        return positions
    else:
        positions = position_crud.get_all(db)
        if not positions:
            raise HTTPException(status_code=404, detail="No positions found")
        return positions
