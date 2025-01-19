from sqlalchemy import Column, Integer, String, TIMESTAMP, CheckConstraint
from datetime import datetime
from db import Base  # Base는 SQLAlchemy Base 클래스

class Users(Base):
    __tablename__ = "users"

    user_idx = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    position = Column(String(20), nullable=False)
    back_number = Column(Integer, unique=True, nullable=False)
    join_date = Column(TIMESTAMP, nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("role IN ('선수', '감독', '용병')", name="check_user_role"),
    )