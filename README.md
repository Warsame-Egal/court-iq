# CourtIQ

[![CI](https://github.com/Warsame-Egal/court-iq/actions/workflows/ci.yml/badge.svg)](https://github.com/Warsame-Egal/court-iq/actions/workflows/ci.yml)

NBA live scores, stats, and standings — React, Spring WebFlux API, FastAPI, and [`nba_api`](https://github.com/swar/nba_api).

## Demo

![CourtIQ demo](docs/demo.gif)

Live scoreboard with games updating in place; click a game to open box score and play-by-play.

## Quickstart

```bash
git clone https://github.com/Warsame-Egal/court-iq.git
cd court-iq
cp .env.example .env
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Spring API + Swagger | http://localhost:8080 · http://localhost:8080/swagger-ui.html |
| Health | http://localhost:8080/actuator/health |

## Architecture

**React → Spring Boot (WebFlux) → FastAPI → [`nba_api`](https://github.com/swar/nba_api) → NBA.com**

Spring proxies and caches JSON; FastAPI polls live scoreboard/play-by-play and exposes WebSockets. No database.

```
React  --REST-->  Spring (:8080)  --REST-->  FastAPI (:8000)  --nba_api-->  NBA
   |                                              ^
   +------------ WebSocket (live scoreboard) -----+
```

### Why this design

CourtIQ is split on purpose, not by accident. **FastAPI owns the data layer** because the unofficial [`nba_api`](https://github.com/swar/nba_api) library is Python-only — CourtIQ wraps that client (rate limiting, proxy rotation, polling, REST/WebSocket routes); it does not replace it. **Spring WebFlux is the public edge**: it sits in front of FastAPI with per-endpoint Caffeine caches and reactive I/O, so the browser talks to one stable API while the internal data service stays private. **Spring passes upstream JSON through as opaque strings** (`Mono<String>` end-to-end rather than re-mapped DTOs) so the gateway stays a thin cache layer; typed Pydantic schemas live in FastAPI where the data originates. These are deliberate choices for a learning/portfolio project — not a claim of production-grade scale.

## API

- Paginated lists: `{ "data", "page", "pageSize", "total" }`
- Swagger: `/swagger-ui.html` · OpenAPI: `/api-docs`
- FastAPI routes: [`nba-api/API.md`](nba-api/API.md)
- Deploy overview: [`DEPLOY.md`](DEPLOY.md) · personal steps: copy [`DEPLOY.local.md.example`](DEPLOY.local.md.example) → `DEPLOY.local.md` (gitignored)

## Configuration

| Variable | Service | Purpose |
|----------|---------|---------|
| `FASTAPI_BASE_URL` | Spring | Upstream data service |
| `SERVER_URL` | Spring | Public Spring URL (Swagger; set on GCP — see DEPLOY.md) |
| `CORS_ALLOWED_ORIGINS` | Spring | Browser origins allowed to call Spring |
| `ALLOWED_ORIGINS` | FastAPI | Origins allowed to call FastAPI (Spring in prod) |
| `VITE_API_BASE_URL` | React | Spring base URL |
| `VITE_WS_URL` | React | FastAPI host for WebSockets |
| `NBA_API_PROXY` | FastAPI | Comma-separated proxies when cloud IPs are blocked |

Copy [`.env.example`](.env.example). On cloud deploy, set `NBA_API_PROXY` on the FastAPI service when NBA.com blocks the host IP; Docker runs `patch_scoreboard.py` and `patch_http.py` at startup (`nba-api/docker-entrypoint.sh`). Data source: [swar/nba_api](https://github.com/swar/nba_api).

## Manual run

**FastAPI (:8000) → Spring (:8080) → React (:3000)**

```bash
cd nba-api && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt && uvicorn app.main:app --reload

mvn spring-boot:run   # repo root

cd frontend && npm install && npm run dev
```

## Layout

- `src/` — Spring Boot
- `nba-api/` — FastAPI
- `frontend/` — React

## Credits

All NBA data comes from [swar/nba_api](https://github.com/swar/nba_api) — an unofficial Python client for NBA.com. CourtIQ's `nba-api/` service is a wrapper around that library (caching, rate limiting, proxy support, REST, and WebSockets). CourtIQ is not affiliated with NBA.com or the `nba_api` project.

## Contributing

To use the commit message template:

```bash
git config commit.template .gitmessage
```

Subjects should be imperative, ~50 characters, with an optional body explaining *why* (see commented examples in `.gitmessage`).
