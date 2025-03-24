# coolman-manager
동호회에서 사용하기 위한 축구 전적관리 플랫폼입니다


# docker build
```
docker login

docker build --platform=linux/amd64 -t minjejin/coolman-manager-react:latest -f react-app/Dockerfile.prod ./react-app
docker push minjejin/coolman-manager-react:latest

docker build --platform=linux/amd64 -t minjejin/coolman-manager-api:latest ./api
docker push minjejin/coolman-manager-api:latest
```

# Local SSL
```
-- 처음 한번만
brew install mkcert
mkcert -install

-- 인증서 발급
mkcert 127.0.0.1 localhost
```

# .env 파일 서버에서도 생성해주기

# Server SSL
```

```