from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from schemas.users import User, UserCreate, UserUpdate
from models.users import Users
from crud import CRUDBase

router = APIRouter()
user_crud = CRUDBase[Users, UserCreate, UserUpdate](Users, primary_key="user_idx")

@router.get("/{user_idx}", response_model=User)
def get_user(user_idx: int, db: Session = Depends(get_db)):
    user = user_crud.get(db, user_idx)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/", response_model=List[User])
def get_users(user_list: str = Query(...), db: Session = Depends(get_db)): 
    user_ids = [int(id.strip()) for id in user_list.split(",")]
    users = user_crud.get_multi(db, user_ids)
    if not users:
        raise HTTPException(status_code=404, detail="User not found")
    return users