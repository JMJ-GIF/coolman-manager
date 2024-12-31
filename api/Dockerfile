# Python 기반 이미지
FROM python:3.10-slim

# 컨테이너 내부 작업 디렉토리
WORKDIR /usr/src/app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 복사
COPY . .

# FastAPI 앱 실행 (uvicorn 사용)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# 컨테이너 포트 노출
EXPOSE 8000
