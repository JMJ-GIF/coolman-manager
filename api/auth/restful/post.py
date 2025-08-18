import os
from dotenv import load_dotenv
from fastapi import HTTPException, Response, Request

from auth.router import router
from auth.schema import LoginRequest
from auth.jwt import create_access_token, create_refresh_token, verify_token

load_dotenv()

AUTH_COOKIE_NAME = "access_token"
AUTH_REFRESH_COOKIE_NAME = "refresh_token"

@router.post("/login")
async def login(response: Response, login_data: LoginRequest):
    """
    로그인 후 JWT 발급
    """
    user_idx = login_data.user_idx

    if not user_idx:
        raise HTTPException(status_code=400, detail="Invalid user data")

    # JWT 생성
    access_token = create_access_token(user_idx, session_type="member")
    refresh_token = create_refresh_token(user_idx, session_type="member")

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

@router.post("/demo-login")
async def demo_login(response: Response):
    # 기존 쿠키 삭제 - 더 강력한 삭제 방법
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        domain=None,  # 명시적으로 domain 설정
        samesite="None",
        secure=True,
        httponly=True,  # httponly도 명시
    )
    response.delete_cookie(
        key=AUTH_REFRESH_COOKIE_NAME,
        path="/",
        domain=None,  # 명시적으로 domain 설정
        samesite="None",
        secure=True,
        httponly=True,  # httponly도 명시
    )
    
    # 추가로 다른 가능한 경로들도 삭제
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/api",
        domain=None,
        samesite="None",
        secure=True,
        httponly=True,
    )
    response.delete_cookie(
        key=AUTH_REFRESH_COOKIE_NAME,
        path="/api",
        domain=None,
        samesite="None",
        secure=True,
        httponly=True,
    )
    
    # 새로운 Demo 토큰 생성
    access_token = create_access_token(user_idx=1, session_type="demo")
    refresh_token = create_refresh_token(user_idx=1, session_type="demo")

    # JWT를 HttpOnly 쿠키에 저장 - max_age 추가
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=True,  
        samesite="None",
        max_age=3600,  # 1시간
        path="/",
    )
    response.set_cookie(
        key=AUTH_REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=True,  
        samesite="None",
        max_age=86400,  # 24시간
        path="/",
    )

    return {"message": "Demo Login successful"}

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
    session_type = user_data.get("session_type", "member")
    new_access_token = create_access_token(user_data["user_idx"], session_type=session_type)
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
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",  # 🔥 설정한 path와 동일하게
        samesite="None",
        secure=True,
    )
    response.delete_cookie(
        key=AUTH_REFRESH_COOKIE_NAME,
        path="/",
        samesite="None",
        secure=True,
    )

    # ✅ 쿠키를 강제로 만료시키는 추가적인 Set-Cookie 헤더 설정
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value="",
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
        max_age=0,  # 즉시 만료
    )
    response.set_cookie(
        key=AUTH_REFRESH_COOKIE_NAME,
        value="",
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
        max_age=0,  # 즉시 만료
    )

    return {"message": "Logged out successfully"}
