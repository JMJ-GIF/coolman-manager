from pydantic import BaseModel, Field

class Position(BaseModel):
    position_idx: int = Field(..., description="포지션 고유 ID")
    tactics: str = Field(..., max_length=255, description="전술 이름")
    name: str = Field(..., max_length=255, description="포지션 이름")
    description: str = Field(..., max_length=255, description="포지션 설명")
    top_coordinate: int = Field(..., description="포지션 상단 좌표")
    left_coordinate: int = Field(..., description="포지션 좌측 좌표")