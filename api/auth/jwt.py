import os
from dotenv import load_dotenv
from jose import JWTError, jwt
from datetime import datetime, timedelta

load_dotenv()

AUTH_SECRET_KEY = os.getenv('AUTH_SECRET_KEY')
AUTH_ALGORITHM = os.getenv('AUTH_ALGORITHM')
AUTH_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('AUTH_ACCESS_TOKEN_EXPIRE_MINUTES'))
AUTH_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('AUTH_REFRESH_TOKEN_EXPIRE_DAYS'))

def create_access_token(user_idx: int):
    """
    Access Token 생성 (30분 만료)
    """
    payload = {
        "user_idx": user_idx,
        "exp": datetime.utcnow() + timedelta(minutes=AUTH_ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, AUTH_SECRET_KEY, algorithm=AUTH_ALGORITHM)

def create_refresh_token(user_idx: int):
    """
    Refresh Token 생성 (7일 만료)
    """
    payload = {
        "user_idx": user_idx,
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
