from pydantic import BaseModel, Field
from datetime import  date, datetime
from typing import Optional

class UserAllStats(BaseModel):
    user_idx: int
    name: str
    back_number: int
    position: str
    role: str
    match_cnt: int
    max_match_cnt: int
    ratio: float
    goal_cnt: int
    assist_cnt: int
    quarter_cnt: int

class UserParticipation(BaseModel):
    user_idx: int    
    dt: date
    is_participation: int
    quarter_cnt: int

class UserStatsOpposingTeam(BaseModel):
    opposing_team: Optional[str]
    user_idx: Optional[int]
    goal_cnt: Optional[int]
    assist_cnt: Optional[int]
    match_cnt: Optional[int]

class UserStatsPosition(BaseModel):
    user_idx: Optional[int]
    tactics: Optional[str]
    position_name: Optional[str]
    goal_cnt: Optional[int]
    assist_cnt: Optional[int]
    quarter_cnt: Optional[int]

class OpposingTeamAllStats(BaseModel):
    opposing_team: Optional[str]
    win_match: Optional[int]
    lose_match: Optional[int]
    draw_match: Optional[int]
    winning_point: Optional[int]
    losing_point: Optional[int]