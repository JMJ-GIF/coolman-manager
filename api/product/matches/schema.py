from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, Field

class Match(BaseModel):
    match_idx: int
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
    created_at: datetime

class Quarter(BaseModel):
    quarter_idx: int = Field(..., description="쿼터의 고유 ID")
    match_idx: int = Field(..., description="Matches 테이블의 외래 키")
    quarter_number: int = Field(..., description="경기의 몇 번째 쿼터인지 (e.g., 1, 2, 3, 4)")
    tactics: str = Field(..., max_length=255, description="쿼터에 사용된 전술 정보")
    created_at: Optional[datetime] = Field(None, description="쿼터가 생성된 시간 (기본값: 현재 시간)")

class GoalDetail(BaseModel):
    goal_idx: int
    match_idx: int = Field(..., description="Matches 테이블의 외래 키")
    quarter_idx: int = Field(..., description="경기 쿼터")
    goal_player_id: Optional[int] = Field(None, description="골을 넣은 선수 ID")
    goal_player_name: Optional[str] = Field(None, description="골을 넣은 선수 이름")
    goal_player_back_number: Optional[int] = Field(None, description="골을 넣은 선수 등번호")
    assist_player_id: Optional[int] = Field(None, description="도움을 준 선수 ID")
    assist_player_name: Optional[str] = Field(None, description="도움을 준 선수 이름")
    assist_player_back_number: Optional[int] = Field(None, description="도움을 준 선수 등번호")
    created_at: Optional[datetime] = Field(None, description="골이 생성된 시간 (기본값: 현재 시간)")
    goal_type: str = Field(..., max_length=50, description="골의 종류") 
       
class LineupDetail(BaseModel):
    match_idx: int
    quarter_idx: int
    quarter_number: int
    tactics: str
    lineup_idx: int
    position_name: Optional[str] = None 
    user_name: str
    back_number: int
    lineup_status: str
    top_coordinate: Optional[int] = None 
    left_coordinate: Optional[int] = None 