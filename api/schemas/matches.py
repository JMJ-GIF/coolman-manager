from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

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

class Match(MatchBase):
    match_idx: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuarterBase(BaseModel):
    match_idx: int = Field(..., description="Matches 테이블의 외래 키")
    quarter_number: int = Field(..., description="경기의 몇 번째 쿼터인지 (e.g., 1, 2, 3, 4)")
    tactics: str = Field(..., max_length=255, description="쿼터에 사용된 전술 정보")

class QuarterCreate(QuarterBase):
    pass

class QuarterUpdate(QuarterBase):
    pass

class Quarter(QuarterBase):
    quarter_idx: int = Field(..., description="쿼터의 고유 ID")
    created_at: Optional[datetime] = Field(None, description="쿼터가 생성된 시간 (기본값: 현재 시간)")

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    match_idx: int = Field(..., description="Matches 테이블의 외래 키")
    quarter_idx: int = Field(..., description="경기 쿼터")
    goal_player_id: Optional[int] = Field(None, description="골을 넣은 선수 ID")
    assist_player_id: Optional[int] = Field(None, description="도움을 준 선수 ID")
    goal_type: str = Field(..., max_length=50, description="골의 종류")        

class GoalCreate(GoalBase):
    pass

class GoalUpdate(GoalBase):
    pass

class Goal(GoalBase):
    goal_idx: int
    created_at: Optional[datetime] = Field(None, description="골이 생성된 시간 (기본값: 현재 시간)")

    class Config:
        from_attributes = True

class LineupBase(BaseModel):
    player_idx: int = Field(..., description="선수 ID")
    quarter_idx: int = Field(..., description="Quarters 테이블의 외래 키")
    position_idx: int = Field(..., description="포지션 ID")

class LineupCreate(LineupBase):
    pass

class LineupUpdate(LineupBase):
    pass

class Lineup(LineupBase):
    lineup_idx: int = Field(..., description="라인업의 고유 ID")
    created_at: Optional[datetime] = Field(None, description="라인업이 생성된 시간")

    class Config:
        from_attributes = True

class LineupDetail(BaseModel):
    match_idx: int
    quarter_idx: int
    quarter_number: int
    tactics: str
    lineup_idx: int
    position_name: str
    user_name: str
    top_coordinate: int
    left_coordinate: int

    class Config:
        from_attributes = True