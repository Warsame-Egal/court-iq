import logging

from fastapi import APIRouter, HTTPException, Query

from app.schemas.league import LeagueLeader, LeagueLeadersResponse
from app.services.league_leaders import get_league_leaders
from app.utils.errors import upstream_error

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/league/leaders", response_model=LeagueLeadersResponse, tags=["league"])
async def get_league_leaders_endpoint(
    stat_category: str = Query(...),
    season: str = Query(...),
):
    try:
        leaders_data = await get_league_leaders(
            stat_category=stat_category, season=season, top_n=5
        )
        leaders = [LeagueLeader(**leader_dict) for leader_dict in leaders_data]

        return LeagueLeadersResponse(
            category=stat_category.upper(), season=season, leaders=leaders
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching league leaders: {e}", exc_info=True)
        raise upstream_error("league", str(e))
