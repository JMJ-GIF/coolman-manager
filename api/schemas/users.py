from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, Literal

# User Models
class UserBase(BaseModel):
    user_id: str = Field(..., max_length=20, description="유저 고유 ID")
    name: str = Field(..., max_length=50, description="이름")
    position: str = Field(..., max_length=20, description="포지션")
    back_number: int = Field(..., description="등번호")
    join_date: datetime = Field(..., description="가입일")
    role: Literal['선수', '감독', '용병'] = Field(..., description="역할 ('선수' 또는 '감독', '용병')")

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50, description="이름")
    position: Optional[str] = Field(None, max_length=20, description="포지션")
    back_number: Optional[int] = Field(None, description="등번호")
    join_date: Optional[datetime] = Field(None, description="가입일")
    role: Optional[Literal['선수', '감독', '용병']] = Field(None, description="역할 ('선수' 또는 '감독', '용병')")

class User(UserBase):
    user_idx: int = Field(..., description="유저 고유 인덱스")
    created_at: datetime = Field(..., description="생성된 시간")

    class Config:
        from_attributes = True