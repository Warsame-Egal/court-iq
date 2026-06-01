import logging

from fastapi import APIRouter, HTTPException, Query

from app.schemas.player import PlayerSummary
from app.schemas.playergamelog import PlayerGameLogResponse
from app.schemas.seasonleaders import SeasonLeadersCategory
from app.services.players import (
    get_league_roster,
    get_player_game_log,
    get_season_leaders,
    getPlayer,
    search_players,
)
from app.utils.errors import upstream_error

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/player/{player_id}", response_model=PlayerSummary, tags=["players"])
async def fetch_player(player_id: str):
    try:
        return await getPlayer(player_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player {player_id}: {e}", exc_info=True)
        raise upstream_error("players", str(e))


@router.get(
    "/players/search/{search_term}",
    response_model=list[PlayerSummary],
    tags=["players"],
)
async def search_players_route(search_term: str):
    try:
        return await search_players(search_term)
    except HTTPException:
        raise


@router.get(
    "/players/season-leaders",
    response_model=list[SeasonLeadersCategory],
    tags=["players"],
)
async def get_season_leaders_route(season: str = Query(...)):
    try:
        resp = await get_season_leaders(season)
        return resp.categories
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching season leaders: {e}", exc_info=True)
        raise upstream_error("players", str(e))


@router.get(
    "/player/{player_id}/game-log",
    response_model=PlayerGameLogResponse,
    tags=["players"],
)
async def get_player_game_log_route(player_id: str, season: str = Query(...)):
    try:
        return await get_player_game_log(player_id, season)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching game log: {e}", exc_info=True)
        raise upstream_error("players", str(e))


@router.get(
    "/players/league-roster", response_model=list[PlayerSummary], tags=["players"]
)
async def get_league_roster_route():
    try:
        return await get_league_roster()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching league roster: {e}", exc_info=True)
        raise upstream_error("players", str(e))
