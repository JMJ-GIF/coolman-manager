# coolman-manager
동호회에서 사용하기 위한 축구 전적관리 플랫폼입니다


# docker build
```
docker login

docker build -t minjejin/coolman-manager-react:latest .
docker push minjejin/coolman-manager-react:latest

docker build -t minjejin/coolman-manager-api:latest .
docker push minjejin/coolman-manager-api:latest

docker build -t minjejin/coolman-manager-db:latest .
docker push minjejin/coolman-manager-db:latest
```