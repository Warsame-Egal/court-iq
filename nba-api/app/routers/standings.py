import logging

from fastapi import APIRouter, HTTPException

from app.schemas.standings import StandingRecord
from app.utils.errors import upstream_error
from app.services.standings import getSeasonStandings

logger = logging.getLogger(__name__)

router = APIRouter()


# Get standings endpoint
@router.get(
    "/standings/season/{season}",
    response_model=list[StandingRecord],
    tags=["standings"],
    summary="Get NBA Standings for a Given Season",
    description="Get the win/loss records and rankings for all teams in a season.",
)
async def season_standings(season: str):
    """
    Get the standings (win/loss records) for all teams in a season.
    Shows playoff rankings and team records.
    """
    try:
        resp = await getSeasonStandings(season)
        return resp.standings
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error fetching standings for season {season}: {e}")
        raise upstream_error("standings", str(e))
