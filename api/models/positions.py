from sqlalchemy import Column, Integer, String
from db import Base 

class Positions(Base):
    __tablename__ = "positions"

    position_idx = Column(Integer, primary_key=True, autoincrement=True)
    tactics = Column(String(255), nullable=False, doc="전술에 대한 설명")
    name = Column(String(255), nullable=False, doc="포지션 이름")
    description = Column(String(255), nullable=False, doc="포지션에 대한 추가 설명")
    top_coordinate = Column(Integer, nullable=False, doc="포지션 상단 좌표")
    left_coordinate = Column(Integer, nullable=False, doc="포지션 하단 좌표")