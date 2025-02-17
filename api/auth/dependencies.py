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
