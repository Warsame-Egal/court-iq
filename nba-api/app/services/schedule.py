import asyncio
import logging
from typing import Optional

from fastapi import HTTPException
from nba_api.stats.endpoints import scoreboardv2
from nba_api.stats.static import teams

from app.schemas.schedule import (
    GamesResponse,
    GameSummary,
    TeamSummary,
    TopScorer,
)
from app.config import get_api_kwargs
from app.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

NBA_TEAMS = {team["id"]: team["abbreviation"] for team in teams.get_teams()}


def parse_game_time_from_status(game_status: str, game_date: str) -> Optional[str]:
    return None


async def getGamesForDate(date: str) -> GamesResponse:
    """
    Get all NBA games for a specific date.
    Returns games that were played or scheduled for that day.

    Args:
        date: The date in YYYY-MM-DD format

    Returns:
        GamesResponse: List of all games for that date

    Raises:
        HTTPException: If no games found or API error
    """
    try:
        # Get game data from NBA API for the specified date
        api_kwargs = get_api_kwargs()
        await rate_limit()
        games_data = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: scoreboardv2.ScoreboardV2(
                    game_date=date, **api_kwargs
                ).get_dict()
            ),
            timeout=30.0,
        )

        # Check if we got valid data
        if "resultSets" not in games_data or not games_data["resultSets"]:
            raise HTTPException(
                status_code=404, detail=f"No game data found for {date}"
            )

        # Extract different parts of the game data
        # GameHeader has basic game info (teams, status, etc.)
        game_header_data = next(
            (r for r in games_data["resultSets"] if r["name"] == "GameHeader"), None
        )
        # TeamLeaders has the top scorer for each game
        team_leaders_data = next(
            (r for r in games_data["resultSets"] if r["name"] == "TeamLeaders"), None
        )
        # LineScore has the final scores
        line_score_data = next(
            (r for r in games_data["resultSets"] if r["name"] == "LineScore"), None
        )

        # If no game header data, return 404 error
        if not game_header_data or "rowSet" not in game_header_data:
            raise HTTPException(
                status_code=404, detail=f"No game header data found for {date}"
            )

        # Get the column names and game data
        game_headers = game_header_data["headers"]
        games_list = game_header_data["rowSet"]

        # Log number of games found
        if games_list:
            logger.info(f"Found {len(games_list)} games for date {date}")

        # Get headers and data for team leaders and scores (if available)
        team_leaders_headers = team_leaders_data["headers"] if team_leaders_data else []
        team_leaders_list = team_leaders_data["rowSet"] if team_leaders_data else []

        line_score_headers = line_score_data["headers"] if line_score_data else []
        line_score_list = line_score_data["rowSet"] if line_score_data else []

        games = []
        processed_game_ids = set()  # Track processed game IDs to avoid duplicates

        # Process each game
        for game in games_list:
            try:
                # Validate that headers and game row have the same length
                if len(game_headers) != len(game):
                    logger.warning(
                        f"Game row length ({len(game)}) doesn't match headers length ({len(game_headers)}), skipping"
                    )
                    continue

                # Convert the game data to a dictionary
                # Only include fields that exist in the data
                game_dict = {}
                for i, header in enumerate(game_headers):
                    if i < len(game):
                        game_dict[header] = game[i]
                    # If header doesn't have corresponding data, skip it (don't add None)
                    # This prevents KeyError when accessing optional fields

                # Skip if game ID is missing
                if "GAME_ID" not in game_dict or game_dict.get("GAME_ID") is None:
                    continue

                # Log available keys for first game to help debug
                if len(games) == 0:
                    logger.debug(f"First game available keys: {list(game_dict.keys())}")

                game_id = game_dict.get("GAME_ID")

                # Skip if we've already processed this game (avoid duplicates)
                if game_id in processed_game_ids:
                    continue

                processed_game_ids.add(game_id)

                home_team_id = game_dict.get("HOME_TEAM_ID")
                away_team_id = game_dict.get("VISITOR_TEAM_ID")

                # Skip if either team ID is missing
                if home_team_id is None or away_team_id is None:
                    continue

                # Make sure both IDs are integers
                try:
                    home_team_id = int(home_team_id)
                    away_team_id = int(away_team_id)
                except (TypeError, ValueError):
                    continue

                # Find the home team's score from the line score data
                # Convert game_id to string for consistent comparison
                game_id_str = str(game_id)
                home_score = next(
                    (
                        dict(zip(line_score_headers, s)).get("PTS", 0)
                        for s in line_score_list
                        if len(line_score_headers) == len(s)
                        and str(dict(zip(line_score_headers, s)).get("GAME_ID", ""))
                        == game_id_str
                        and dict(zip(line_score_headers, s)).get("TEAM_ID")
                        == home_team_id
                    ),
                    0,
                )
                # Find the away team's score
                away_score = next(
                    (
                        dict(zip(line_score_headers, s)).get("PTS", 0)
                        for s in line_score_list
                        if len(line_score_headers) == len(s)
                        and str(dict(zip(line_score_headers, s)).get("GAME_ID", ""))
                        == game_id_str
                        and dict(zip(line_score_headers, s)).get("TEAM_ID")
                        == away_team_id
                    ),
                    0,
                )

                # Create TeamSummary objects for both teams
                home_team = TeamSummary(
                    team_id=home_team_id,
                    team_abbreviation=NBA_TEAMS.get(home_team_id, "N/A"),
                    points=home_score,
                )
                away_team = TeamSummary(
                    team_id=away_team_id,
                    team_abbreviation=NBA_TEAMS.get(away_team_id, "N/A"),
                    points=away_score,
                )

                # Try to find the top scorer for this game
                top_scorer = None
                try:
                    top_scorer = next(
                        (
                            TopScorer(
                                player_id=d.get("PTS_PLAYER_ID", 0),
                                player_name=d.get("PTS_PLAYER_NAME", "Unknown"),
                                team_id=d.get("TEAM_ID", 0),
                                points=d.get("PTS", 0),
                                rebounds=d.get("REB", 0),
                                assists=d.get("AST", 0),
                            )
                            for leader_row in team_leaders_list
                            if len(team_leaders_headers) == len(leader_row)
                            for d in [dict(zip(team_leaders_headers, leader_row))]
                            if str(d.get("GAME_ID", "")) == str(game_id)
                        ),
                        None,
                    )
                except (KeyError, ValueError, TypeError) as e:
                    logger.warning(
                        f"Error extracting top scorer for game {game_id}: {e}"
                    )
                    top_scorer = None

                game_leaders = None
                game_time_utc = None

                # Create a GameSummary with all the game information
                # Use the requested date, not the API's game_date (which might be different)
                # Normalize game_id to 10 digits so detail page and API lookups work
                games.append(
                    GameSummary(
                        game_id=str(game_id).zfill(10),
                        game_date=date,  # Use the requested date
                        game_time_utc=game_time_utc,
                        matchup=f"{home_team.team_abbreviation} vs {away_team.team_abbreviation}",
                        game_status=game_dict.get("GAME_STATUS_TEXT", "Unknown"),
                        arena=game_dict.get("ARENA_NAME"),
                        home_team=home_team,
                        away_team=away_team,
                        top_scorer=top_scorer,
                        gameLeaders=game_leaders,
                    )
                )
            except KeyError as e:
                # If a key is missing, log and skip this game
                logger.warning(
                    f"Missing key in game data: {e}, skipping game. Available keys: {list(game_dict.keys())[:10]}"
                )
                continue
            except Exception as e:
                # Catch any other errors and skip this game
                logger.warning(
                    f"Error processing game: {e}, skipping. Game ID: {game_dict.get('GAME_ID', 'unknown')}"
                )
                continue

        return GamesResponse(games=games)

    except HTTPException:
        raise
    except asyncio.TimeoutError as e:
        logger.error(f"Timeout retrieving games for date {date}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Timeout retrieving games for date {date}. Please try again.",
        )
    except Exception as e:
        logger.error(f"Error retrieving games for date {date}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving games: {str(e)}")
