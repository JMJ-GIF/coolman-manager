# 1️⃣ 빌드 스테이지 (Node.js에서 React 앱 빌드)
FROM node:22.12.0 AS builder
WORKDIR /usr/src/app

# package.json만 복사하여 npm install 캐싱 활용
COPY package.json package-lock.json ./
RUN npm install --only=production  # 개발용 패키지 제외

# 소스 코드 복사 후 빌드 실행
COPY . .
RUN npm run build

# 2️⃣ 실행 스테이지 (Nginx를 사용하여 빌드된 정적 파일 서빙)
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# React 빌드 결과물만 복사 (이미지 크기 최소화)
COPY --from=builder /usr/src/app/build .

# Nginx 기본 설정 사용
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
