from pydantic import BaseModel

class LoginRequest(BaseModel):
    user_idx: int