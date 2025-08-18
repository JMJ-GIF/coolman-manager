import os
import secrets
from dotenv import load_dotenv
from jose import JWTError, jwt
from datetime import datetime, timedelta

load_dotenv()

AUTH_SECRET_KEY = secrets.token_hex(32)  
AUTH_ALGORITHM = 'HS256'
AUTH_ACCESS_TOKEN_EXPIRE_MINUTES = 30
AUTH_REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(user_idx: int, session_type: str = "member"):
    """
    Access Token 생성 (30분 만료)
    """
    payload = {
        "user_idx": user_idx,
        "session_type": session_type,
        "exp": datetime.utcnow() + timedelta(minutes=AUTH_ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, AUTH_SECRET_KEY, algorithm=AUTH_ALGORITHM)

def create_refresh_token(user_idx: int, session_type: str = "member"):
    """
    Refresh Token 생성 (7일 만료)
    """
    payload = {
        "user_idx": user_idx,
        "session_type": session_type,
        "exp": datetime.utcnow() + timedelta(days=AUTH_REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh"
    }
    return jwt.encode(payload, AUTH_SECRET_KEY, algorithm=AUTH_ALGORITHM)

def verify_token(token: str):
    """
    JWT 검증 함수
    """
    try:
        payload = jwt.decode(token, AUTH_SECRET_KEY, algorithms=[AUTH_ALGORITHM])
        return payload
    except JWTError:
        return None
