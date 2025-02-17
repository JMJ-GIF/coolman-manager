from sqlalchemy.sql import text
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Query

from db import get_db
from product.positions.router import router
from product.positions.schema import Position

@router.get("/{position_idx}", response_model=Position)
def get_position(position_idx: int, db: Session = Depends(get_db)):
    sql = "SELECT * FROM positions WHERE position_idx = :position_idx"
    result = db.execute(text(sql), {"position_idx": position_idx}).mappings().fetchone()

    if not result:
        raise HTTPException(status_code=404, detail=f"Position with ID {position_idx} not found")

    return result


@router.get("/", response_model=List[Position])
def get_positions(
    position_ids: Optional[str] = Query(
        None, description="Comma-separated list of position IDs to fetch"
    ),
    db: Session = Depends(get_db),
):
    if position_ids:
        try:            
            position_id_list = [int(id.strip()) for id in position_ids.split(",")]
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid position ID format. Must be a comma-separated list of integers."
            )

        sql = f"SELECT * FROM positions WHERE position_idx IN ({','.join([':id' + str(i) for i in range(len(position_id_list))])})"
        params = {f"id{i}": position_id_list[i] for i in range(len(position_id_list))}

        result = db.execute(text(sql), params).mappings().all()
        
        if not result:
            raise HTTPException(status_code=404, detail="No positions found with the given IDs")

        return result

    else:
        sql = "SELECT * FROM positions"
        result = db.execute(text(sql)).mappings().all()

        if not result:
            raise HTTPException(status_code=404, detail="No positions found")

        return result