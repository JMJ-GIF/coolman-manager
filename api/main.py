from fastapi import FastAPI
from api.end_point import matches

app = FastAPI()

# 라우터 등록
app.include_router(matches.router, prefix="/matches", tags=["matches"])