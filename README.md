# NBA Scoreboard

[![CI](https://github.com/Warsame-Egal/nba-scoreboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Warsame-Egal/nba-scoreboard/actions/workflows/ci.yml)

NBA live scores, standings, schedules, and player/team stats.

**React → Spring Boot → FastAPI → [`nba_api`](https://github.com/swar/nba_api)**

The React app talks only to the Spring service, which handles validation, pagination, caching, error handling, and the live WebSockets. Spring calls the FastAPI service for data; FastAPI wraps [swar/nba_api](https://github.com/swar/nba_api) and returns plain JSON. No database.

## Run with Docker

```bash
git clone https://github.com/Warsame-Egal/nba-scoreboard.git
cd nba-scoreboard
cp .env.example .env
docker compose up --build
```

| | URL |
|--|-----|
| App | http://localhost:3000 |
| Spring + Swagger | http://localhost:8080/swagger-ui.html |
| FastAPI docs | http://localhost:8000/docs |

## Run locally (no Docker)

Spring (repo root):

```bash
mvn spring-boot:run
```

FastAPI:

```bash
cd nba-api
python -m venv venv && source venv/bin/activate   # PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

React:

```bash
cd frontend
npm install
npm run dev
```

## Config

Copy `.env.example`. Key vars: `FASTAPI_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `VITE_API_BASE_URL`, `VITE_WS_URL`.

- Endpoints: [`nba-api/API.md`](nba-api/API.md)
- Deploy: [`DEPLOY.md`](DEPLOY.md)

## Credits

Data via [swar/nba_api](https://github.com/swar/nba_api). Not affiliated with the NBA or that project.
