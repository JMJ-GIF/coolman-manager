# Python 기반 이미지
FROM python:3.10-slim

# 필요한 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 환경 변수 설정
ENV PYTHONDONTWRITEBYTECODE = 1  
ENV PYTHONUNBUFFERED = 1         

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
