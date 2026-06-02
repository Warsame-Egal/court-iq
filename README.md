# NBA Scoreboard

[![CI](https://github.com/Warsame-Egal/nba-scoreboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Warsame-Egal/nba-scoreboard/actions/workflows/ci.yml)

Live NBA scores, stats, and standings.

**React → Spring Boot → FastAPI → [`nba_api`](https://github.com/swar/nba_api)**

The React app calls Spring Boot on port 8080. Spring Boot proxies requests to the FastAPI service, which fetches data from [swar/nba_api](https://github.com/swar/nba_api). No database.

## Docker

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
| Spring health | http://localhost:8080/actuator/health |

Stop / rebuild: `docker compose down` · `docker compose up --build`

Deploy overview: [`DEPLOY.md`](DEPLOY.md). Full runbook: [`DEPLOY.local.md.example`](DEPLOY.local.md.example) (copy to `DEPLOY.local.md`, gitignored).

## Spring Boot

From repo root:

```bash
./mvnw spring-boot:run
```

Windows: `mvnw.cmd spring-boot:run`

- Swagger: http://localhost:8080/swagger-ui.html
- Live WebSockets: `ws://localhost:8080/api/v1/ws` and `ws://localhost:8080/api/v1/ws/{gameId}/play-by-play`

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

Copy [`.env.example`](.env.example). Main vars: `FASTAPI_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `VITE_API_BASE_URL`, `VITE_WS_URL` (Spring host, same as REST).

## License

[MIT](LICENSE)

## Credits

Data from [swar/nba_api](https://github.com/swar/nba_api). Not affiliated with NBA.com or that project.
