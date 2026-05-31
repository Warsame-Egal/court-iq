# CourtIQ

[![CI](https://github.com/Warsame-Egal/court-iq/actions/workflows/ci.yml/badge.svg)](https://github.com/Warsame-Egal/court-iq/actions/workflows/ci.yml)

NBA live scores, stats, and standings. **React → Spring → FastAPI → [`nba_api`](https://github.com/swar/nba_api)**

![Demo](docs/demo.gif)

## Architecture

CourtIQ uses **Spring Boot (Java)** as the public REST API and **FastAPI (Python)** to call [swar/nba_api](https://github.com/swar/nba_api), which is Python-only. The FastAPI service is a thin wrapper around that library — not a replacement for it.

**React** → **Spring** (REST, caching) → **FastAPI** (`nba_api`, live polling, WebSockets) → NBA.com

The browser talks to Spring. Spring forwards requests to FastAPI for NBA data. No database.

## Docker

```bash
git clone https://github.com/Warsame-Egal/court-iq.git
cd court-iq
cp .env.example .env
docker compose up --build
```

| | URL |
|--|-----|
| App | http://localhost:3000 |
| Spring + Swagger | http://localhost:8080/swagger-ui.html |
| Spring health | http://localhost:8080/actuator/health |
| FastAPI docs | http://localhost:8000/docs |
| FastAPI health | http://localhost:8000/api/v1/health |

Stop / rebuild: `docker compose down` · `docker compose up --build`

Production: [`DEPLOY.md`](DEPLOY.md)

## Spring API

From repo root:

```bash
mvn spring-boot:run
```

- Swagger: http://localhost:8080/swagger-ui.html
- Lists return `{ "data", "page", "pageSize", "total" }`

## FastAPI

```bash
cd nba-api
python -m venv venv
```

**Bash:** `source venv/bin/activate`  
**PowerShell:** `.\venv\Scripts\Activate.ps1`

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Docs: http://localhost:8000/docs
- Routes: [`nba-api/API.md`](nba-api/API.md)

## React

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3000 — proxies `/api` to Spring when `VITE_API_BASE_URL` is unset.

## Config

Copy [`.env.example`](.env.example). Main vars: `FASTAPI_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `ALLOWED_ORIGINS`, `VITE_API_BASE_URL`, `VITE_WS_URL`.

## Credits

Data from [swar/nba_api](https://github.com/swar/nba_api). Not affiliated with NBA.com or that project.
