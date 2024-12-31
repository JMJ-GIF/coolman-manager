from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

class MatchBase(BaseModel):
    dt: date
    result: str = Field(..., max_length=20)
    winning_point: int
    losing_point: int
    opposing_team: str = Field(..., max_length=255)
    location: str = Field(..., max_length=255)
    start_time: datetime
    end_time: datetime
    weather: str = Field(..., max_length=100)
    num_players: int
    main_tactics: str = Field(..., max_length=255)
    status: str = Field(..., max_length=50)

class MatchCreate(MatchBase):
    pass

class MatchUpdate(BaseModel):
    dt: Optional[date]
    result: Optional[str] = Field(None, max_length=20)
    winning_point: Optional[int]
    losing_point: Optional[int]
    opposing_team: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    weather: Optional[str] = Field(None, max_length=100)
    num_players: Optional[int]
    main_tactics: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)

class Match(MatchBase):
    match_idx: int
    created_at: datetime

    class Config:
        orm_mode = True
