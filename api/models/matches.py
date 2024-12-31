from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, ForeignKey
from api.db import Base

class Matches(Base):
    __tablename__ = "matches"
    
    match_idx = Column(Integer, primary_key=True, index=True)
    dt = Column(Date, nullable=False)
    result = Column(String(20), nullable=False)
    winning_point = Column(Integer, nullable=False)
    losing_point = Column(Integer, nullable=False)
    opposing_team = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    start_time = Column(TIMESTAMP, nullable=False)
    end_time = Column(TIMESTAMP, nullable=False)
    weather = Column(String(100), nullable=False)
    num_players = Column(Integer, nullable=False)
    main_tactics = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP, default="CURRENT_TIMESTAMP")