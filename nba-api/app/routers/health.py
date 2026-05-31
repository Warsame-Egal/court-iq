"""
Health and observability endpoint.

Returns cache stats, polling status, WebSocket connection counts, and uptime.
"""

import time
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["health"])
_app_start_time = time.time()


@router.get("/health")
async def health():
    try:
        from app.services.data_cache import data_cache
        from app.services.websockets_manager import (
            playbyplay_websocket_manager,
            scoreboard_websocket_manager,
        )
    except Exception:
        return _minimal_health()

    try:
        cache_stats = data_cache.get_health_stats()
    except Exception:
        cache_stats = {
            "scoreboard_cached": False,
            "scoreboard_age_seconds": None,
            "playbyplay_games_cached": 0,
            "active_games_tracked": 0,
            "scoreboard_task_running": False,
            "playbyplay_task_running": False,
        }

    try:
        scoreboard_connections = scoreboard_websocket_manager.get_connection_count()
    except Exception:
        scoreboard_connections = 0

    try:
        playbyplay_connections_by_game = (
            playbyplay_websocket_manager.get_connection_stats()
        )
    except Exception:
        playbyplay_connections_by_game = {}

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(time.time() - _app_start_time),
        "polling": {
            "scoreboard": {
                "status": (
                    "running"
                    if cache_stats.get("scoreboard_task_running")
                    else "stopped"
                ),
                "last_updated_seconds_ago": cache_stats.get("scoreboard_age_seconds"),
                "poll_interval_seconds": data_cache.SCOREBOARD_POLL_INTERVAL,
            },
            "playbyplay": {
                "status": (
                    "running"
                    if cache_stats.get("playbyplay_task_running")
                    else "stopped"
                ),
                "active_games_tracked": cache_stats.get("active_games_tracked", 0),
                "poll_interval_seconds": data_cache.PLAYBYPLAY_POLL_INTERVAL,
            },
        },
        "live_cache": {
            "scoreboard_cached": cache_stats.get("scoreboard_cached", False),
            "scoreboard_age_seconds": cache_stats.get("scoreboard_age_seconds"),
            "playbyplay_games_cached": cache_stats.get("playbyplay_games_cached", 0),
        },
        "data_layer": "fastapi",
        "websockets": {
            "scoreboard_connections": scoreboard_connections,
            "playbyplay_connections_by_game": playbyplay_connections_by_game,
        },
        "nba_api": {
            "rate_limit_ms": 600,
            "last_call_ms_ago": None,
        },
    }


def _minimal_health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(time.time() - _app_start_time),
        "polling": {
            "scoreboard": {"status": "unknown"},
            "playbyplay": {"status": "unknown"},
        },
        "live_cache": {},
        "data_layer": "fastapi",
        "websockets": {
            "scoreboard_connections": 0,
            "playbyplay_connections_by_game": {},
        },
        "nba_api": {"rate_limit_ms": 600, "last_call_ms_ago": None},
    }
