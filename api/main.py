from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.router import router as auth_router
from product.rank.router import router as rank_router
from product.users.router import router as users_router
from product.matches.router import router as matches_router
from product.positions.router import router as position_router

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용 (GET, POST 등)
    allow_headers=["*"],  # 모든 헤더 허용
)

app.include_router(matches_router, prefix="/matches", tags=["Matches"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(position_router, prefix="/positions", tags=["Positions"])
app.include_router(rank_router, prefix='/rank', tags=["Rank"])
app.include_router(auth_router, prefix='/auth', tags=["oAuth"])