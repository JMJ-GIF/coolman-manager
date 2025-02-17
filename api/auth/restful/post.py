import os
from dotenv import load_dotenv
from fastapi import HTTPException, Response, Request

from auth.router import router
from auth.schema import LoginRequest
from auth.jwt import create_access_token, create_refresh_token, verify_token

load_dotenv()

AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME")
AUTH_REFRESH_COOKIE_NAME = os.getenv("AUTH_REFRESH_COOKIE_NAME")

@router.post("/login")
async def login(response: Response, login_data: LoginRequest):
    """
    로그인 후 JWT 발급
    """
    user_idx = login_data.user_idx

    if not user_idx:
        raise HTTPException(status_code=400, detail="Invalid user data")

    # JWT 생성
    access_token = create_access_token(user_idx)
    refresh_token = create_refresh_token(user_idx)

    # JWT를 HttpOnly 쿠키에 저장
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=True,  
        samesite="None",  
    )
    response.set_cookie(
        key=AUTH_REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=True,  
        samesite="None",
    )

    return {"message": "Login successful"}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """
    Refresh Token을 이용해 Access Token 갱신
    """
    refresh_token = request.cookies.get(AUTH_REFRESH_COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token provided")

    user_data = verify_token(refresh_token)
    if not user_data or user_data.get("type") != "refresh":
        print("🚨 Invalid or expired refresh_token.")
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # 새로운 Access Token 발급
    new_access_token = create_access_token(user_data["user_idx"])
    print(f"✅ Issued new access_token: {new_access_token}")

    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=new_access_token,
        httponly=True,
        secure=True,
        samesite="None",
    )
    print(f"✅ access_token is set in response cookies.")

    return {"message": "Token refreshed"}

@router.post("/logout")
async def logout(response: Response):
    """
    로그아웃 - 쿠키 삭제
    """
    response.delete_cookie(AUTH_COOKIE_NAME)
    response.delete_cookie(AUTH_REFRESH_COOKIE_NAME)
    return {"message": "Logged out successfully"}