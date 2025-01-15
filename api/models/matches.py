from db import Base
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, ForeignKey


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

    # Relationships
    goals = relationship("Goals", back_populates="match", cascade="all, delete-orphan")
    quarters = relationship("Quarters", back_populates="match", cascade="all, delete-orphan")


class Quarters(Base):
    __tablename__ = "quarters"

    quarter_idx = Column(Integer, primary_key=True, index=True)
    match_idx = Column(Integer, ForeignKey("matches.match_idx", ondelete="CASCADE"), nullable=False)
    quarter_number = Column(Integer, nullable=False)
    tactics = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, default="CURRENT_TIMESTAMP")

    # Relationships
    match = relationship("Matches", back_populates="quarters")
    goals = relationship("Goals", back_populates="quarter", cascade="all, delete-orphan")
    lineups = relationship("Lineups", back_populates="quarter", cascade="all, delete-orphan")


class Goals(Base):
    __tablename__ = 'goals'

    goal_idx = Column(Integer, primary_key=True, autoincrement=True) 
    match_idx = Column(Integer, ForeignKey('matches.match_idx', ondelete='CASCADE'), nullable=False) 
    quarter_idx = Column(Integer, ForeignKey('quarters.quarter_idx', ondelete='CASCADE'), nullable=False)
    goal_player_id = Column(Integer, nullable=True)  
    assist_player_id = Column(Integer, nullable=True) 
    goal_type = Column(String(50), nullable=False)        
    created_at = Column(TIMESTAMP, default="CURRENT_TIMESTAMP") 
    
    # Relationships
    match = relationship("Matches", back_populates="goals")
    quarter = relationship("Quarters", back_populates="goals")


class Lineups(Base):
    __tablename__ = "quarters_lineup"

    lineup_idx = Column(Integer, primary_key=True, index=True)
    player_idx = Column(Integer, nullable=False)
    quarter_idx = Column(Integer, ForeignKey("quarters.quarter_idx", ondelete="CASCADE"), nullable=False)
    position_idx = Column(Integer, nullable=False)

    # Relationships
    quarter = relationship("Quarters", back_populates="lineups")
