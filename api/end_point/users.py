from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from db import get_db
from schemas.users import User, UserCreate, UserUpdate
from models.users import Users
from crud import CRUDBase

router = APIRouter()
user_crud = CRUDBase[Users, UserCreate, UserUpdate](Users, primary_key="user_idx")

# 특정 유저 조회
@router.get("/{user_idx}", response_model=User)
def get_user(user_idx: int, db: Session = Depends(get_db)):
    user = user_crud.get(db, user_idx)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_idx} not found")
    return user


# 전체 또는 특정 유저 그룹 조회
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
        
        users = user_crud.get_multi(db, user_ids)
        if not users:
            raise HTTPException(status_code=404, detail="No users found with the given IDs")
        return users
    else:
        users = user_crud.get_all(db)
        if not users:
            raise HTTPException(status_code=404, detail="No users found")
        return users
