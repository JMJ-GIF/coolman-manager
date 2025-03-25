# Local Settings & Prod Settings

## Install Docker in Server (docker-compose 는 binary 파일로 설치할 것)

## docker build and push docker hub
```
docker login

docker build --platform=linux/amd64 -t minjejin/coolman-manager-react:latest -f react-app/Dockerfile.prod .
docker push minjejin/coolman-manager-react:latest

docker build --platform=linux/amd64 -t minjejin/coolman-manager-api:latest ./api
docker push minjejin/coolman-manager-api:latest
```

## Local SSL
```
-- 처음 한번만
brew install mkcert
mkcert -install

-- 인증서 발급
mkcert 127.0.0.1 localhost
```

## .env 파일 서버에서도 생성해주기

## Server SSL
```
-- 서버에서 운영중인 nginx 80 포트를 내려야만 가능한 방법
sudo apt-get install certbot
sudo certbot certonly --standalone -d coolman-manager.com -d www.coolman-manager.com
cp /etc/letsencrypt/live/coolman-manager.com/fullchain.pem /root/coolman-manager/nginx/certs
cp /etc/letsencrypt/live/coolman-manager.com/privkey.pem /root/coolman-manager/nginx/certs
```

## Set Cron for renewing ssl

1. 파일 생성하기
```
-- /usr/local/bin/certbot_renew_and_deploy.sh
#!/bin/bash

# 1. 인증서 갱신 시도
/usr/bin/certbot renew --quiet

# 2. (옵션) PEM 파일 복사 (갱신되지 않았으면 아무 변화 없음)
cp /etc/letsencrypt/live/coolman-manager.com/fullchain.pem /root/coolman-manager/nginx/certs
cp /etc/letsencrypt/live/coolman-manager.com/privkey.pem   /root/coolman-manager/nginx/certs

# 3. Nginx 컨테이너에 새 인증서 반영 (reload)
docker compose -f /path/to/your/project/docker-compose.prod.yml exec react-app nginx -s reload
```

2. 권한 부여하기
```
sudo chmod +x /usr/local/bin/certbot_renew_and_deploy.sh
```

3. 크론 설정하기 (한달에 한 번 갱신)
```
sudo crontab -e
0 3 1 * * /usr/local/bin/certbot_renew_and_deploy.sh >> /var/log/certbot-renew.log 2>&1
```
