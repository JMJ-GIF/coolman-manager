from pydantic import BaseModel
from typing import Optional, List

class MVPCheckResponse(BaseModel):
    has_data: bool

class MVPComment(BaseModel):
    comment_idx: int
    mvp_idx: int
    description: str

class MVPData(BaseModel):
    mvp_idx: int
    year: int
    player_idx: int
    position_type: str
    mvp_image_url: Optional[str] = None
    main_title: str
    player_name: str
    player_back_number: int
    player_image_url: Optional[str] = None
    main_position: Optional[str] = None
    comments: List[MVPComment] = []

class UserStats(BaseModel):
    total_goals: int
    total_assists: int
    total_quarters: int
    total_matches: int
    attendance_rate: float
