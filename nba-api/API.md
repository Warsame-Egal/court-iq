# CourtIQ FastAPI — internal data service

FastAPI wrapper around [`swar/nba_api`](https://github.com/swar/nba_api). No database. Spring Boot proxies these REST routes; React uses WebSockets here for live scoreboard and play-by-play. CourtIQ adds rate limiting, caching, and HTTP/WebSocket routes on top of that client — it does not replace it.

Base URL (local): `http://localhost:8000`

See root [README](../README.md) for the full stack and credits.

## Live data (`data_cache`)

Background polling for today’s scoreboard and in-progress play-by-play. Box score and roster are fetched on demand.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/scoreboard/today` | Live cache; optional `?date=YYYY-MM-DD` |
| GET | `/api/v1/scoreboard/game/{game_id}/boxscore` | |
| GET | `/api/v1/scoreboard/game/{game_id}/play-by-play` | |
| GET | `/api/v1/scoreboard/team/{team_id}/roster/{season}` | |
| WS | `/api/v1/ws` | Scoreboard push (~8s) |
| WS | `/api/v1/ws/{game_id}/play-by-play` | Per-game PBP |

## Stats (on-demand; Spring Caffeine caches upstream JSON)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/player/{player_id}` | |
| GET | `/api/v1/player/{player_id}/game-log` | `?season=YYYY-YY` |
| GET | `/api/v1/players/search/{search_term}` | `page`, `limit` |
| GET | `/api/v1/players/season-leaders` | `season`, `page`, `limit` |
| GET | `/api/v1/players/league-roster` | |
| GET | `/api/v1/teams/{team_id}` | |
| GET | `/api/v1/teams/stats` | `?season=YYYY-YY` |
| GET | `/api/v1/teams/{team_id}/game-log` | |
| GET | `/api/v1/teams/{team_id}/player-stats` | |
| GET | `/api/v1/standings/season/{season}` | `page`, `limit` |
| GET | `/api/v1/league/leaders` | `stat_category`, `season` |
| GET | `/api/v1/search` | `q` required |
| GET | `/api/v1/schedule/date/{date}` | `YYYY-MM-DD` |

## Health

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/health` | Polling status, `live_cache`, WebSocket counts |
