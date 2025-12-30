# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coolman Manager is a football team management application with a React frontend and FastAPI backend, deployed using Docker. The system manages matches, players, positions, and statistics for a football team.

## Architecture

### Multi-Container Docker Setup
- **react-app**: React 19 frontend served through nginx
- **api**: FastAPI Python backend
- **db**: PostgreSQL 15 database
- **nginx**: Reverse proxy (dev only, prod uses embedded nginx in react-app container)

### Dual Database System
The application uses two PostgreSQL databases in the same instance:
- **coolman**: Production data for authenticated users
- **demo**: Demo data for guest/trial sessions

Database selection is determined by JWT token payload (`session_type: "demo"` or regular). See `api/db.py:get_db()` for the session routing logic.

### API Structure
The FastAPI backend (`api/`) is organized by domain:
- `auth/`: OAuth authentication (Naver Login) and JWT handling
- `product/matches/`: Match management endpoints
- `product/users/`: User/player management endpoints
- `product/positions/`: Position and tactics management
- `product/rank/`: Ranking and statistics endpoints

Each domain follows a consistent structure:
- `router.py`: FastAPI route definitions
- `service.py`: Business logic
- `schema.py`: Pydantic models for request/response validation
- `crud.py`: Database operations

### Frontend Structure
React app (`react-app/src/`) uses:
- **Context Providers**:
  - `AuthContext`: JWT-based authentication state
  - `AlertContext`: Global alert/notification system
  - `ProtectedRoute`: Route guard for authenticated pages
- **Pages**: Main route components (login, match, player, profile, record)
- **Components**: Reusable UI components (NavigationBar, FloatingBar, ImageCropper, etc.)

## Development Commands

### Local Development (with Docker)
```bash
# Start all services in development mode
docker compose -f docker-compose.dev.yml up

# Frontend runs on https://127.0.0.1:443 (proxied through nginx)
# API runs on http://localhost:8000
# Database runs on localhost:5432
```

### Frontend Only (without Docker)
```bash
cd react-app
npm install
npm start  # Runs on port 3000
npm test
npm run build
```

### Database Operations

**Backup database:**
```bash
docker exec -t coolman-manager-db-1 pg_dump -U jmj -d coolman > backup_$(date +%Y_%m_%d).sql
```

**Restore database:**
```bash
# Comment out init.sql in docker-compose first, then:
cat backup_2025_03_31.sql | docker exec -i coolman-manager-db-1 psql -U jmj -d coolman
```

## Deployment

### CI/CD Pipeline
The project uses GitHub Actions (`.github/workflows/docker-publish.yml`) for automated deployment:

1. **Build Phase**:
   - Builds multi-platform (linux/amd64) Docker images
   - Tags images with GitHub run number
   - Pushes to Docker Hub as `minjejin/coolman-manager-react` and `minjejin/coolman-manager-api`

2. **Deploy Phase**:
   - Dynamically adds GitHub Actions IP to Naver Cloud Platform (NCP) security group
   - SSH into NCP server
   - Pulls latest code and creates `.env` from GitHub secrets
   - Runs `docker compose -f docker-compose.prod.yml up -d`
   - Removes old Docker images
   - Removes GitHub Actions IP from security group

### Manual Production Build
```bash
# Login to Docker Hub
docker login

# Build and push React image
docker build --platform=linux/amd64 -t minjejin/coolman-manager-react:latest -f react-app/Dockerfile.prod .
docker push minjejin/coolman-manager-react:latest

# Build and push API image
docker build --platform=linux/amd64 -t minjejin/coolman-manager-api:latest ./api
docker push minjejin/coolman-manager-api:latest
```

## Environment Configuration

### Required Environment Variables
The `.env` file (not in git) must contain:
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: Naver OAuth credentials
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION_NAME`: NCP Object Storage credentials
- `VALID_NAME_LIST`: Comma-separated list of authorized user names
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Database credentials
- `REACT_APP_LOGIN_CLIENT_ID`: Frontend Naver OAuth client ID
- `REACT_APP_VALID_NAME_LIST`: Frontend copy of authorized names
- `IMAGE_TAG`: Docker image tag for production deployment

### Stage-Specific Configuration
- **Development**: Uses `docker-compose.dev.yml` with local SSL (mkcert), redirect to `https://127.0.0.1/callback`
- **Production**: Uses `docker-compose.prod.yml` with Let's Encrypt SSL, redirect to `https://coolman-manager.com/callback`

## Authentication Flow

1. User clicks Naver Login button
2. Redirects to Naver OAuth with `REACT_APP_LOGIN_CLIENT_ID`
3. Naver redirects to `/callback` with authorization code
4. Backend exchanges code for Naver access token
5. Backend fetches user info from Naver
6. Backend validates user name against `VALID_NAME_LIST`
7. Backend issues JWT token (with `session_type: "demo"` for demo users)
8. JWT stored in httpOnly cookie
9. All subsequent API requests include JWT cookie for authentication

## Image Storage

User profile images are stored in Naver Cloud Platform Object Storage:
- Bucket: `coolman-storage`
- Endpoint: `https://kr.object.ncloudstorage.com`
- Paths: `dev/member/` (development), `prod/member/` (production)
- Upload handled via `api/image_client.py` using boto3

## Database Schema

Key tables:
- `users`: Players and coaches (social_uuid links to Naver OAuth ID)
- `matches`: Match metadata (date, result, opponent, location, tactics)
- `quarters`: Match subdivisions with quarter-specific tactics
- `quarters_lineup`: Player lineup per quarter (선발/후보 status)
- `goals`: Goal events linked to match, quarter, and players
- `positions`: Tactical positions with field coordinates (top/left for rendering)

See `db/init.dev.sql` and `db/init.prod.sql` for full schema definitions.

## SSL Certificates

### Local Development
```bash
brew install mkcert
mkcert -install
mkcert 127.0.0.1 localhost
# Place certificates in nginx/certs/
```

### Production (Let's Encrypt)
SSL renewal is automated via cron job that runs monthly. See README.md for manual renewal process.

## Key Dependencies

- **Frontend**: React 19, React Router 7, react-hook-form, axios, cropperjs, framer-motion, workbox (PWA)
- **Backend**: FastAPI, SQLAlchemy, python-jose (JWT), boto3 (S3), psycopg2 (PostgreSQL)