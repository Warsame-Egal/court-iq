import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from pythonjsonlogger import jsonlogger

from app.routers.health import router as health_router
from app.routers.league import router as league_router
from app.routers.players import router as player_router
from app.routers.schedule import router as schedule_router
from app.routers.scoreboard import router as scoreboard_router
from app.routers.search import router as search_router
from app.routers.standings import router as standings_router
from app.routers.teams import router as team_router

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

app = FastAPI(
    title="CourtIQ NBA API",
    description=(
        "Internal NBA data service. Wraps swar/nba_api (https://github.com/swar/nba_api) "
        "with rate limiting and proxy support. Spring Boot is the public API gateway."
    ),
    version="1.0.0",
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
