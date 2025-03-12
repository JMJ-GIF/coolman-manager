from datetime import datetime, date
from typing import Optional, Literal
from pydantic import BaseModel, Field

class User(BaseModel):
    user_idx: int = Field(..., description="유저 고유 인덱스")
    name: str = Field(..., max_length=50, description="이름")
    position: str = Field(..., max_length=20, description="포지션")
    back_number: int = Field(..., description="등번호")
    join_date: datetime = Field(..., description="가입일")
    role: Literal['선수', '감독', '용병'] = Field(..., description="역할 ('선수' 또는 '감독', '용병')")
    created_at: datetime = Field(..., description="생성된 시간")

class UserCheck(BaseModel):
    user_idx: Optional[int] = None 
    exists: bool 

class UserCreate(BaseModel):
    name: str
    position: str
    back_number: int
    role: str
    social_uuid: str
    image: Optional[str] = None