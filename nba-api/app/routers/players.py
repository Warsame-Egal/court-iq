import logging

from fastapi import APIRouter, HTTPException, Query

from app.schemas.pagination import PaginatedResponse, PaginationParams
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
from app.utils.season import get_current_season, validate_season

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
    response_model=PaginatedResponse[PlayerSummary],
    tags=["players"],
)
async def search_players_route(
    search_term: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    try:
        full = await search_players(search_term)
        params = PaginationParams(page=page, limit=limit)
        total = len(full)
        data = full[params.offset : params.offset + params.limit]
        return PaginatedResponse(
            data=data,
            page=params.page,
            limit=params.limit,
            total=total,
            has_more=params.offset + len(data) < total,
        )
    except HTTPException:
        raise


@router.get(
    "/players/season-leaders",
    response_model=PaginatedResponse[SeasonLeadersCategory],
    tags=["players"],
)
async def get_season_leaders_route(
    season: str = Query(default_factory=get_current_season),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    try:
        validate_season(season)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    try:
        resp = await get_season_leaders(season)
        params = PaginationParams(page=page, limit=limit)
        categories = resp.categories
        total = len(categories)
        data = categories[params.offset : params.offset + params.limit]
        return PaginatedResponse(
            data=data,
            page=params.page,
            limit=params.limit,
            total=total,
            has_more=params.offset + len(data) < total,
        )
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
async def get_player_game_log_route(
    player_id: str,
    season: str = Query(default_factory=get_current_season),
):
    try:
        validate_season(season)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
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
