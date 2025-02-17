from sqlalchemy.sql import text
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Query

from db import get_db
from product.users.router import router
from product.users.schema import User, UserCheck


@router.get("/{user_idx}", response_model=User)
def get_user(user_idx: int, db: Session = Depends(get_db)):
    sql = "SELECT * FROM users WHERE user_idx = :user_idx"
    result = db.execute(text(sql), {"user_idx": user_idx}).mappings().fetchone()

    if not result:
        raise HTTPException(status_code=404, detail=f"User with ID {user_idx} not found")

    return result


@router.get("/", response_model=List[User])
def get_users(
    user_list: Optional[str] = Query(None, description="Comma-separated list of user IDs to fetch"),
    db: Session = Depends(get_db),
):
    if user_list:
        try:
            # 콤마로 구분된 문자열을 리스트로 변환
            user_ids = [int(id.strip()) for id in user_list.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format. Must be a comma-separated list of integers.")

        if not user_ids:
            raise HTTPException(status_code=400, detail="User ID list cannot be empty.")

        placeholders = ", ".join([f":id{i}" for i in range(len(user_ids))])
        sql = f"SELECT * FROM users WHERE user_idx IN ({placeholders})"
        params = {f"id{i}": user_ids[i] for i in range(len(user_ids))}

        result = db.execute(text(sql), params).mappings().all()

        if not result:
            raise HTTPException(status_code=404, detail="No users found with the given IDs")

        return result

    else:
        sql = "SELECT * FROM users"
        result = db.execute(text(sql)).mappings().all()

        if not result:
            raise HTTPException(status_code=404, detail="No users found")

        return result

    
@router.get("/uuid/exists", response_model=UserCheck)
def check_user_exists(uuid: str = Query(...), db: Session = Depends(get_db)):      
    
    if not uuid: 
        raise HTTPException(status_code=400, detail="UUID 값이 제공되지 않았습니다.")

    print(f"📌 받은 UUID: {uuid}")  

    sql = """
        SELECT user_idx FROM users WHERE social_uuid = :uuid
    """

    result = db.execute(text(sql), {"uuid": uuid}).mappings().fetchone()

    if result:
        return UserCheck(exists=True, user_idx=result.user_idx) 
    else:
        return UserCheck(exists=False, user_idx=None)  