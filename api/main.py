from fastapi import FastAPI
from end_point.matches import router as matches_router
from end_point.users import router as users_router
from end_point.positions import router as position_router
from end_point.rank import router as rank_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (개발 중)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용 (GET, POST 등)
    allow_headers=["*"],  # 모든 헤더 허용
)

# matches 엔드포인트를 /matches 경로에 연결
app.include_router(matches_router, prefix="/matches", tags=["Matches"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(position_router, prefix="/positions", tags=["Positions"])
app.include_router(rank_router, prefix='/rank', tags=["Rank"])