# NBA Scoreboard — data service

Wraps [`swar/nba_api`](https://github.com/swar/nba_api) and returns plain JSON. Spring Boot is the public entry point for the app.

Base URL (local dev, internal): `http://localhost:8000`

See root [README](../README.md) for the full stack and credits.

## Scoreboard & play-by-play

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/scoreboard/today` | Optional `?date=YYYY-MM-DD` (defaults to today) |
| GET | `/api/v1/scoreboard/game/{game_id}/boxscore` | |
| GET | `/api/v1/scoreboard/game/{game_id}/play-by-play` | |
| GET | `/api/v1/scoreboard/team/{team_id}/roster/{season}` | `season` required |

## Stats (on-demand)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/player/{player_id}` | |
| GET | `/api/v1/player/{player_id}/game-log` | `season` required (`YYYY-YY`) |
| GET | `/api/v1/players/search/{search_term}` | Plain JSON array |
| GET | `/api/v1/players/season-leaders` | `season` required; plain JSON array |
| GET | `/api/v1/players/league-roster` | |
| GET | `/api/v1/teams/{team_id}` | |
| GET | `/api/v1/teams/stats` | `season` required |
| GET | `/api/v1/teams/{team_id}/game-log` | `season` required |
| GET | `/api/v1/teams/{team_id}/player-stats` | `season` required |
| GET | `/api/v1/standings/season/{season}` | Plain JSON array |
| GET | `/api/v1/league/leaders` | `stat_category` and `season` required |
| GET | `/api/v1/search` | `q` query param |
| GET | `/api/v1/schedule/date/{date}` | `YYYY-MM-DD` |

## Health

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/health` | Liveness for Docker healthchecks |
