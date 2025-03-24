from sqlalchemy.sql import text  
from sqlalchemy.orm import Session 
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, Depends, Query

from db import get_db
from product.matches.router import router
from product.matches.schema import *

@router.delete("")
def delete_matches(match_ids: List[int] = Query(...), db: Session = Depends(get_db)):
    try:
        with db.begin():
            # 🔹 존재하는 match_idx 조회
            existing_matches = db.execute(
                text("SELECT match_idx FROM matches WHERE match_idx IN :ids"),
                {"ids": tuple(match_ids)}
            ).fetchall()
            existing_match_ids = {m[0] for m in existing_matches}

            # 🔹 삭제 요청한 match_idx 중 존재하지 않는 것 필터링
            invalid_ids = set(match_ids) - existing_match_ids
            if invalid_ids:
                raise HTTPException(status_code=404, detail=f"Matches not found: {list(invalid_ids)}")

            # 🔹 삭제 실행 (ON DELETE CASCADE)
            db.execute(text("DELETE FROM matches WHERE match_idx IN :ids"), {"ids": tuple(match_ids)})

        return {"message": "Matches deleted successfully", "deleted_ids": match_ids}
    
    except SQLAlchemyError as e:
        print(f"SQL Error while inserting quarter: {e}")
        db.rollback()  # 실패 시 모든 작업 롤백
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")