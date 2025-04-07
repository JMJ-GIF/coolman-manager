import os
import requests
from dotenv import load_dotenv
from sqlalchemy.sql import text
from sqlalchemy.orm import Session 
from fastapi import HTTPException, Query, Header, Request, Depends

from db import get_db
from auth.router import router
from auth.jwt import verify_token

load_dotenv()

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
AUTH_COOKIE_NAME = "access_token"
NAVER_REDIRECT_URI = os.getenv("NAVER_REDIRECT_URI")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

@router.get("/naver/token")
async def get_naver_token(code: str = Query(...), state: str = Query(...)):    
    NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
    
    params = {
        "grant_type": "authorization_code",
        "client_id": NAVER_CLIENT_ID,
        "client_secret": NAVER_CLIENT_SECRET,
        "code": code,
        "state": state,
        "redirect_uri" : NAVER_REDIRECT_URI
    }    
    print("📌 인가 코드:", code)
    print("📌 상태 값:", state)
    print("📌 Redirect URI:", NAVER_REDIRECT_URI)

    response = requests.get(NAVER_TOKEN_URL, params=params)
    token_data = response.json()
    print('token_data', token_data)

    if "access_token" not in token_data:
        raise HTTPException(status_code=400, detail="네이버 Access Token 발급 실패")

    return token_data  

@router.get("/naver/user")
async def get_naver_user(authorization: str = Header(...)):    
    NAVER_USER_INFO_URL = "https://openapi.naver.com/v1/nid/me"

    headers = {
        "Authorization": authorization,  
        "Content-Type": "application/json",
    }

    response = requests.get(NAVER_USER_INFO_URL, headers=headers)
    user_data = response.json()

    print(f"📌 네이버 사용자 정보 응답: {user_data}")

    if "response" not in user_data:
        raise HTTPException(status_code=400, detail=f"네이버 사용자 정보 조회 실패: {user_data}")

    return user_data["response"]

@router.get("/me")
async def get_user_data(request: Request, db: Session = Depends(get_db)):
    """
    현재 로그인된 유저 정보 확인
    """
    token = request.cookies.get(AUTH_COOKIE_NAME)

    # 🔥 쿠키 확인용 로그
    print(f"🔍 요청된 쿠키: {request.cookies}")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_exists = db.execute(text("SELECT user_idx FROM users WHERE user_idx = :user_idx"), 
                             {"user_idx": user["user_idx"]}).fetchone()
    
    if not user_exists:
        raise HTTPException(status_code=401, detail="User does not exist")

    return {"user_idx": user["user_idx"]}