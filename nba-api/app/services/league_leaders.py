import asyncio
import logging
from typing import Any, List, Optional

from fastapi import HTTPException
from nba_api.stats.endpoints import leagueleaders
from nba_api.stats.library.parameters import (
    PerMode48,
    Scope,
    SeasonTypeAllStar,
    StatCategoryAbbreviation,
)

from app.config import get_api_kwargs
from app.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

async def get_league_leaders(
    stat_category: str = "PTS",
    season: Optional[str] = None,
    top_n: int = 5,
) -> List[dict[str, Any]]:
    """
    Get top N league leaders for a specific stat category.

    Fetches league leaders from NBA API using the LeagueLeaders endpoint.
    Returns top players sorted by the specified stat (points, rebounds, assists, steals, or blocks).
    Rate-limited to respect nba_api; not cached here (Spring caches league leaders).

    This service is used by the League Leaders Dashboard in the frontend to display
    top performers across different stat categories.

    Args:
        stat_category: Stat category (PTS, REB, AST, STL, BLK)
        season: Season in format "YYYY-YY" (defaults to current season)
        top_n: Number of top players to return (default: 5)

    Returns:
        List of dictionaries with player info:
        - player_id: NBA player ID
        - name: Player full name
        - team: Team abbreviation
        - stat_value: Stat value (e.g., points per game)
        - rank: Rank in the category (1-based)
        - games_played: Number of games played

    Raises:
        HTTPException: If API error or invalid stat category
    """
    # Validate stat category
    valid_categories = {"PTS", "REB", "AST", "STL", "BLK"}
    stat_category = stat_category.upper()
    if stat_category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stat category. Must be one of: {', '.join(valid_categories)}",
        )

    # Use current season if not provided
    if season is None:
        from app.utils.season import get_current_season

        season = get_current_season()

    try:
        api_kwargs = get_api_kwargs()

        # Map stat category to StatCategoryAbbreviation
        stat_map = {
            "PTS": StatCategoryAbbreviation.pts,
            "REB": StatCategoryAbbreviation.reb,
            "AST": StatCategoryAbbreviation.ast,
            "STL": StatCategoryAbbreviation.stl,
            "BLK": StatCategoryAbbreviation.blk,
        }

        stat_abbrev = stat_map.get(stat_category, StatCategoryAbbreviation.pts)

        await rate_limit()
        leaders_data = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: leagueleaders.LeagueLeaders(
                    season=season,
                    stat_category_abbreviation=stat_abbrev,
                    per_mode48=PerMode48.per_game,
                    scope=Scope.rs,
                    season_type_all_star=SeasonTypeAllStar.regular,
                    **api_kwargs,
                ).get_data_frames()[0]
            ),
            timeout=15.0,
        )

        if leaders_data.empty:
            logger.warning(
                f"No league leaders data found for {stat_category} in {season}"
            )
            return []

        # Get top N players and convert to native types immediately
        top_leaders_df = leaders_data.head(top_n)
        leaders_data_list = top_leaders_df.to_dict(orient="records")
        del top_leaders_df  # Delete filtered DataFrame
        del leaders_data  # Delete original DataFrame

        # Get top N players
        leaders_list = []
        for idx, row in enumerate(leaders_data_list):
            try:
                player_id = int(row.get("PLAYER_ID", 0))
                player_name = str(row.get("PLAYER", "")).strip()
                team = str(row.get("TEAM", "")).strip()
                games_played = int(row.get("GP", 0))

                # Get the stat value based on category
                stat_value = None
                if stat_category == "PTS":
                    stat_value = (
                        float(row.get("PTS", 0)) if row.get("PTS") is not None else 0.0
                    )
                elif stat_category == "REB":
                    stat_value = (
                        float(row.get("REB", 0)) if row.get("REB") is not None else 0.0
                    )
                elif stat_category == "AST":
                    stat_value = (
                        float(row.get("AST", 0)) if row.get("AST") is not None else 0.0
                    )
                elif stat_category == "STL":
                    stat_value = (
                        float(row.get("STL", 0)) if row.get("STL") is not None else 0.0
                    )
                elif stat_category == "BLK":
                    stat_value = (
                        float(row.get("BLK", 0)) if row.get("BLK") is not None else 0.0
                    )

                rank = int(row.get("RANK", idx + 1))

                if player_id and player_name:
                    leaders_list.append(
                        {
                            "player_id": player_id,
                            "name": player_name,
                            "team": team,
                            "stat_value": (
                                round(stat_value, 1) if stat_value is not None else 0.0
                            ),
                            "rank": rank,
                            "games_played": games_played,
                        }
                    )
            except (ValueError, TypeError, KeyError) as e:
                logger.warning(f"Error parsing league leader row: {e}")
                continue

        logger.info(
            f"Fetched {len(leaders_list)} league leaders for {stat_category} in {season}"
        )
        return leaders_list

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error fetching league leaders for {stat_category} in {season}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500, detail=f"Error fetching league leaders: {str(e)}"
        )
