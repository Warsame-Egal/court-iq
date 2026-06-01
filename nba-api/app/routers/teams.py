import logging

from fastapi import APIRouter, HTTPException, Query

from app.schemas.team import TeamDetailsResponse
from app.schemas.teamgamelog import TeamGameLogResponse
from app.schemas.teamplayerstats import TeamPlayerStatsResponse
from app.schemas.teamstats import TeamStatsResponse
from app.services.teamgamelog import get_team_game_log
from app.services.teamplayerstats import get_team_player_stats
from app.services.teams import get_team
from app.services.teamstats import get_team_stats
from app.utils.errors import upstream_error

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/teams/stats", response_model=TeamStatsResponse, tags=["teams"])
async def get_team_stats_route(season: str = Query(...)):
    try:
        return await get_team_stats(season)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team stats: {e}", exc_info=True)
        raise upstream_error("teams", str(e))


@router.get("/teams/{team_id}", response_model=TeamDetailsResponse, tags=["teams"])
async def fetch_team(team_id: int):
    try:
        return await get_team(team_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team {team_id}: {e}")
        raise upstream_error("teams", str(e)) from e


@router.get(
    "/teams/{team_id}/game-log", response_model=TeamGameLogResponse, tags=["teams"]
)
async def get_team_game_log_route(team_id: int, season: str = Query(...)):
    try:
        return await get_team_game_log(str(team_id), season)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team game log: {e}", exc_info=True)
        raise upstream_error("teams", str(e))


@router.get(
    "/teams/{team_id}/player-stats",
    response_model=TeamPlayerStatsResponse,
    tags=["teams"],
)
async def get_team_player_stats_route(team_id: int, season: str = Query(...)):
    try:
        return await get_team_player_stats(team_id, season)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team player stats: {e}", exc_info=True)
        raise upstream_error("teams", str(e))
