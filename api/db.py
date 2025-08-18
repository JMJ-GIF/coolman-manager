import os
import logging
from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.declarative import declarative_base

from auth.jwt import verify_token

DATABASE_URL = os.getenv('DATABASE_URL')
member_session_engine = create_engine(DATABASE_URL + '/' + 'coolman')
demo_session_engine = create_engine(DATABASE_URL + '/' + 'demo')

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=member_session_engine)
DemoSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=demo_session_engine)

Base = declarative_base()

logging.basicConfig(level=logging.DEBUG)

def get_db(request: Request):
    try:
        token = request.cookies.get("access_token")
        if token:
            payload = verify_token(token) or {}
            if payload.get("session_type") == "demo":
                db = DemoSessionLocal()
                try:
                    yield db
                finally:
                    db.close()
                return
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    except OperationalError as e:
        logging.error("Database connection failed:", exc_info=True)
 