"""
Health endpoint for Docker healthchecks and liveness probes.
"""

import time
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["health"])
_app_start_time = time.time()


@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(time.time() - _app_start_time),
        "data_layer": "fastapi",
        "nba_api": {
            "rate_limit_ms": 600,
            "last_call_ms_ago": None,
        },
    }
