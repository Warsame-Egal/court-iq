import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pythonjsonlogger import jsonlogger

from app.routers.health import router as health_router
from app.routers.league import router as league_router
from app.routers.players import router as player_router
from app.routers.schedule import router as schedule_router
from app.routers.scoreboard import router as scoreboard_router
from app.routers.search import router as search_router
from app.routers.standings import router as standings_router
from app.routers.teams import router as team_router
from app.services.data_cache import data_cache
from app.services.websockets_manager import (
    playbyplay_websocket_manager,
    scoreboard_websocket_manager,
)

logger = logging.getLogger(__name__)


def setup_logging() -> None:
    root = logging.getLogger()
    for h in root.handlers[:]:
        root.removeHandler(h)
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)
    root.addHandler(handler)
    root.setLevel(logging.INFO)


setup_logging()

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NBA data polling and WebSocket broadcasting...")
    data_cache.start_polling()

    scoreboard_task = asyncio.create_task(
        scoreboard_websocket_manager.broadcast_updates()
    )
    playbyplay_task = asyncio.create_task(
        playbyplay_websocket_manager.broadcast_playbyplay_updates()
    )
    scoreboard_websocket_manager.start_cleanup_task()
    playbyplay_websocket_manager.start_cleanup_task()

    try:
        yield
    finally:
        logger.info("Shutting down background tasks...")
        await data_cache.stop_polling()
        await scoreboard_websocket_manager.stop_cleanup_task()
        await playbyplay_websocket_manager.stop_cleanup_task()
        scoreboard_task.cancel()
        playbyplay_task.cancel()
        try:
            await scoreboard_task
        except asyncio.CancelledError:
            pass
        try:
            await playbyplay_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="CourtIQ NBA API",
    description=(
        "Internal NBA data service. Wraps swar/nba_api (https://github.com/swar/nba_api) "
        "with rate limiting, proxy support, and live polling. Spring Boot is the public API gateway."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "CourtIQ NBA API is running"}


app.include_router(scoreboard_router, prefix="/api/v1")
app.include_router(schedule_router, prefix="/api/v1")
app.include_router(standings_router, prefix="/api/v1")
app.include_router(player_router, prefix="/api/v1")
app.include_router(team_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(league_router, prefix="/api/v1")
app.include_router(health_router)
