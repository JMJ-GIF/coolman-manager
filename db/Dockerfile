# PostgreSQL 공식 이미지 기반
FROM postgres:15

# 초기화 스크립트를 컨테이너로 복사
COPY init.sql /docker-entrypoint-initdb.d/

# 컨테이너 시작 시 PostgreSQL 서버 실행
CMD ["postgres"]
