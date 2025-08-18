from auth.jwt import verify_token
from fastapi import HTTPException, Request

def get_current_user(request: Request):
    """
    쿠키에서 JWT를 검증하고 user_idx를 반환
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user

def check_member_permission(request: Request):
    """
    Demo 세션이 아닌 Member 세션인지 확인
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    session_type = user.get("session_type", "member")
    if session_type == "demo":
        raise HTTPException(status_code=403, detail="Demo session cannot modify data")
    
    return user

def get_session_type(request: Request):
    """
    현재 세션 타입 반환 (demo/member)
    """
    token = request.cookies.get("access_token")
    if not token:
        return None
    
    user = verify_token(token)
    if not user:
        return None
    
    return user.get("session_type", "member")