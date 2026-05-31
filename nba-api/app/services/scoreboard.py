import asyncio
import json
import logging
import time
from datetime import date
from typing import List, Dict, Optional

from fastapi import HTTPException
from nba_api.live.nba.endpoints import boxscore, playbyplay, scoreboard
from nba_api.stats.endpoints import (
    boxscoretraditionalv3,
    commonteamroster,
    playbyplayv3,
    scoreboardv2,
)
from nba_api.stats.static import teams

from app.schemas.player import Player, TeamRoster
from app.schemas.coach import Coach
from app.schemas.scoreboard import (
    BoxScoreResponse,
    LiveGame,
    PlayByPlayEvent,
    PlayByPlayResponse,
    PlayerBoxScoreStats,
    Scoreboard,
    ScoreboardResponse,
    Team,
    TeamBoxScoreStats,
)
from app.config import get_api_kwargs
from app.constants import (
    GAME_STATUS_FINAL,
    GAME_STATUS_LIVE,
    GAME_STATUS_SCHEDULED,
)
from app.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

NBA_TEAMS_BY_ID = {team["id"]: team for team in teams.get_teams()}
NBA_TEAM_ABBREV = {team["id"]: team["abbreviation"] for team in teams.get_teams()}

_BOXSCORE_UNAVAILABLE_DETAIL = (
    "Box score not available. The game may not have started, or NBA data is unavailable."
)


def _is_nba_empty_response_error(exc: Exception) -> bool:
    if isinstance(exc, json.JSONDecodeError):
        return True
    msg = str(exc).lower()
    return "expecting value" in msg or "line 1 column 1" in msg


def _today_iso() -> str:
    return date.today().isoformat()


def _parse_wins_losses(record: Optional[str]) -> tuple[Optional[int], Optional[int]]:
    if not record or "-" not in str(record):
        return None, None
    parts = str(record).split("-", 1)
    try:
        return int(parts[0]), int(parts[1])
    except (ValueError, IndexError):
        return None, None


def _result_set(games_data: dict, name: str) -> Optional[dict]:
    for result in games_data.get("resultSets", []):
        if result.get("name") == name:
            return result
    return None


def _rows_as_dicts(result: Optional[dict]) -> List[dict]:
    if not result or "headers" not in result:
        return []
    headers = result["headers"]
    out = []
    for row in result.get("rowSet", []):
        if len(row) != len(headers):
            continue
        out.append(dict(zip(headers, row)))
    return out


def _build_line_score_index(games_data: dict) -> Dict[str, Dict[int, dict]]:
    index: Dict[str, Dict[int, dict]] = {}
    for row in _rows_as_dicts(_result_set(games_data, "LineScore")):
        game_id = str(row.get("GAME_ID", "")).zfill(10)
        team_id = row.get("TEAM_ID")
        if game_id and team_id is not None:
            index.setdefault(game_id, {})[int(team_id)] = row
    return index


def _team_from_line_score(team_id: int, line: Optional[dict]) -> Team:
    if line:
        wins, losses = _parse_wins_losses(line.get("TEAM_WINS_LOSSES"))
        return Team(
            teamId=team_id,
            teamName=line.get("TEAM_NAME") or NBA_TEAMS_BY_ID.get(team_id, {}).get(
                "nickname", "Unknown"
            ),
            teamCity=line.get("TEAM_CITY_NAME")
            or NBA_TEAMS_BY_ID.get(team_id, {}).get("city", ""),
            teamTricode=line.get("TEAM_ABBREVIATION")
            or NBA_TEAM_ABBREV.get(team_id, "UNK"),
            wins=wins,
            losses=losses,
            score=int(line.get("PTS") or 0),
            timeoutsRemaining=0,
        )
    meta = NBA_TEAMS_BY_ID.get(team_id, {})
    return Team(
        teamId=team_id,
        teamName=meta.get("nickname", "Unknown"),
        teamCity=meta.get("city", ""),
        teamTricode=meta.get("abbreviation", "UNK"),
        wins=None,
        losses=None,
        score=0,
        timeoutsRemaining=0,
    )


def _live_game_from_v2_row(game_row: dict, line_index: Dict[str, Dict[int, dict]]) -> Optional[LiveGame]:
    game_id = game_row.get("GAME_ID")
    if game_id is None:
        return None
    game_id_str = str(game_id).zfill(10)
    home_id = game_row.get("HOME_TEAM_ID")
    away_id = game_row.get("VISITOR_TEAM_ID")
    if home_id is None or away_id is None:
        return None
    home_id = int(home_id)
    away_id = int(away_id)
    lines = line_index.get(game_id_str, {})
    status_id = int(game_row.get("GAME_STATUS_ID") or GAME_STATUS_SCHEDULED)
    status_text = str(game_row.get("GAME_STATUS_TEXT") or "Unknown").strip()
    period = int(game_row.get("LIVE_PERIOD") or 0)
    if status_id == GAME_STATUS_FINAL and period == 0:
        period = 4
    game_clock = game_row.get("LIVE_PC_TIME") or None
    if game_clock in ("", " "):
        game_clock = None
    game_date_est = game_row.get("GAME_DATE_EST") or ""
    game_time_utc = str(game_date_est) if game_date_est else ""
    return LiveGame(
        gameId=game_id_str,
        gameStatus=status_id,
        gameStatusText=status_text,
        period=period,
        gameClock=game_clock,
        gameTimeUTC=game_time_utc,
        homeTeam=_team_from_line_score(home_id, lines.get(home_id)),
        awayTeam=_team_from_line_score(away_id, lines.get(away_id)),
        gameLeaders=None,
    )


async def fetch_scoreboard_v2(game_date: str) -> dict:
    api_kwargs = get_api_kwargs()
    await rate_limit()
    return await asyncio.wait_for(
        asyncio.to_thread(
            lambda: scoreboardv2.ScoreboardV2(
                game_date=game_date, **api_kwargs
            ).get_dict()
        ),
        timeout=30.0,
    )


async def fetch_nba_scoreboard():
    """
    Get the raw scoreboard data from the NBA API.
    Retries up to 3 times with 2s delay to avoid stale cache from transient failures.

    Returns:
        dict: Raw scoreboard data with all game information, or {} on failure
    """
    last_error = None
    for attempt in range(1, 4):
        try:
            api_kwargs = get_api_kwargs()
            board = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: scoreboard.ScoreBoard(**api_kwargs).get_dict()
                ),
                timeout=15.0,
            )
            out = board.get("scoreboard", {})
            if out:
                return out
            last_error = ValueError("Empty scoreboard in response")
        except asyncio.TimeoutError as e:
            last_error = e
            logger.warning(
                "Timeout fetching scoreboard from NBA API (attempt %s/3, timeout 15s)",
                attempt,
            )
        except (ValueError, KeyError) as e:
            err_str = str(e)
            if "Expecting value" in err_str or "line 1 column 1" in err_str:
                logger.info("NBA API returned empty response (off-season or no games today)")
                return {"games": [], "gameDate": ""}
            last_error = e
            logger.warning("Value error fetching scoreboard (attempt %s/3): %s", attempt, e)
        except Exception as e:
            last_error = e
            logger.warning(
                "Error fetching scoreboard from NBA API (attempt %s/3): %s", attempt, e
            )
        if attempt < 3:
            await asyncio.sleep(2)
    logger.error(
        "Scoreboard fetch failed after 3 attempts. Last error: %s. Cache will not update.",
        last_error,
    )
    return {}


def extract_team_data(team_data):
    """
    Take raw team data from the API and convert it to our Team format.

    Args:
        team_data: Raw team data from NBA API

    Returns:
        Team: Clean team data in our format
    """
    return Team(
        teamId=team_data["teamId"],
        teamName=team_data["teamName"],
        teamCity=team_data["teamCity"],
        teamTricode=team_data["teamTricode"],
        wins=team_data.get("wins", 0),
        losses=team_data.get("losses", 0),
        score=team_data.get("score", 0),
        timeoutsRemaining=team_data.get("timeoutsRemaining", 0),
    )


async def getScoreboard(game_date: Optional[str] = None) -> ScoreboardResponse:
    """
    Get NBA scores for today (live feed) or a specific date (stats ScoreboardV2).

    Args:
        game_date: Optional YYYY-MM-DD. Omitted or today uses the live scoreboard feed.

    Returns:
        ScoreboardResponse: Games in the standard live scoreboard shape.
    """
    if game_date is None or game_date == _today_iso():
        return await _get_live_scoreboard_response()
    return await _get_scoreboard_v2_response(game_date)


async def _get_live_scoreboard_response() -> ScoreboardResponse:
    try:
        raw_scoreboard_data = await fetch_nba_scoreboard()
        if not raw_scoreboard_data:
            logger.info("No scoreboard data — returning empty games list")
            return ScoreboardResponse(scoreboard=Scoreboard(gameDate="", games=[]))

        game_date = raw_scoreboard_data.get("gameDate", "Unknown Date")
        raw_games = raw_scoreboard_data.get("games", [])

        games = []
        for game in raw_games:
            try:
                home_team = extract_team_data(game["homeTeam"])
                away_team = extract_team_data(game["awayTeam"])
                games.append(
                    LiveGame(
                        gameId=game["gameId"],
                        gameStatus=game["gameStatus"],
                        gameStatusText=game["gameStatusText"].strip(),
                        period=game["period"],
                        gameClock=game.get("gameClock", ""),
                        gameTimeUTC=game["gameTimeUTC"],
                        homeTeam=home_team,
                        awayTeam=away_team,
                        gameLeaders=None,
                    )
                )
            except KeyError as e:
                logger.warning(f"Missing required data in game, skipping: {e}")

        return ScoreboardResponse(
            scoreboard=Scoreboard(gameDate=game_date, games=games)
        )
    except Exception as e:
        logger.error(f"Error fetching live scoreboard: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching live scores: {e}")


async def _get_scoreboard_v2_response(game_date: str) -> ScoreboardResponse:
    try:
        games_data = await fetch_scoreboard_v2(game_date)
        if "resultSets" not in games_data or not games_data["resultSets"]:
            logger.info("No ScoreboardV2 data for %s", game_date)
            return ScoreboardResponse(
                scoreboard=Scoreboard(gameDate=game_date, games=[])
            )

        line_index = _build_line_score_index(games_data)
        games: List[LiveGame] = []
        processed_ids: set[str] = set()

        for game_row in _rows_as_dicts(_result_set(games_data, "GameHeader")):
            live_game = _live_game_from_v2_row(game_row, line_index)
            if not live_game or live_game.gameId in processed_ids:
                continue
            processed_ids.add(live_game.gameId)
            games.append(live_game)

        return ScoreboardResponse(
            scoreboard=Scoreboard(gameDate=game_date, games=games)
        )
    except asyncio.TimeoutError as e:
        logger.error("Timeout fetching ScoreboardV2 for %s: %s", game_date, e)
        raise HTTPException(
            status_code=500,
            detail=f"Timeout retrieving scoreboard for {game_date}. Please try again.",
        )
    except Exception as e:
        logger.error("Error fetching ScoreboardV2 for %s: %s", game_date, e)
        raise HTTPException(
            status_code=500, detail=f"Error fetching scoreboard for {game_date}: {e}"
        )


async def fetchTeamRoster(team_id: int, season: str) -> TeamRoster:
    """
    Get the full team roster (all players and coaches) for a team.

    Args:
        team_id: The NBA team ID (like 1610612737 for Lakers)
        season: The season year like "2024-25"

    Returns:
        TeamRoster: All players and coaches on the team

    Raises:
        HTTPException: If team not found or API error
    """
    try:
        # Get roster data from NBA API
        api_kwargs = get_api_kwargs()
        await rate_limit()
        raw_roster = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: commonteamroster.CommonTeamRoster(
                    team_id=team_id, season=season, **api_kwargs
                ).get_dict()
            ),
            timeout=10.0,
        )
        player_data = raw_roster["resultSets"][0]["rowSet"]

        # Try to get coach information if available
        coaches: List[Coach] = []
        try:
            coaches_set = [
                r for r in raw_roster["resultSets"] if r["name"] == "Coaches"
            ][0]
            coach_headers = coaches_set["headers"]
            for row in coaches_set["rowSet"]:
                coach_dict = dict(zip(coach_headers, row))
                coaches.append(
                    Coach(
                        coach_id=int(coach_dict["COACH_ID"]),
                        name=coach_dict["COACH_NAME"],
                        role=coach_dict["COACH_TYPE"],
                        is_assistant=bool(coach_dict["IS_ASSISTANT"]),
                    )
                )
        except (KeyError, IndexError):
            # If no coach data, that's okay - just use empty list
            coaches = []

        if not player_data:
            raise HTTPException(
                status_code=404,
                detail=f"No roster found for team ID {team_id} in {season}",
            )

        # Get the column names so we can map the data correctly
        column_names = raw_roster["resultSets"][0]["headers"]

        # Convert raw player data into Player objects
        players: List[Player] = []
        for row in player_data:
            player_dict = dict(zip(column_names, row))

            players.append(
                Player(
                    player_id=int(player_dict["PLAYER_ID"]),
                    name=player_dict["PLAYER"],
                    jersey_number=player_dict["NUM"] or None,
                    position=player_dict["POSITION"] or None,
                    height=player_dict["HEIGHT"] or None,
                    weight=(
                        int(player_dict["WEIGHT"]) if player_dict["WEIGHT"] else None
                    ),
                    birth_date=player_dict["BIRTH_DATE"] or None,
                    age=int(player_dict["AGE"]) if player_dict["AGE"] else None,
                    experience=(
                        "Rookie"
                        if str(player_dict["EXP"]).upper() == "R"
                        else str(player_dict["EXP"])
                    ),
                    school=player_dict["SCHOOL"] or None,
                )
            )

        # Return the complete roster
        return TeamRoster(
            team_id=team_id,
            team_name=player_data[0][1],  # Team name is in the second column
            season=season,
            players=players,
            coaches=coaches,
        )

    except Exception as e:
        logger.error(
            f"Error fetching team roster for team {team_id}, season {season}: {e}"
        )
        raise HTTPException(status_code=500, detail=f"Error fetching team roster: {e}")


async def _get_game_info_from_scoreboard(game_id: str):
    """
    Helper function to get basic game info from scoreboard when boxscore is not available.

    Args:
        game_id: The unique game ID from NBA

    Returns:
        dict: Basic game info with team names and status, or None if not found
    """
    try:
        game_id_norm = str(game_id).zfill(10)
        raw_scoreboard_data = await fetch_nba_scoreboard()
        if not raw_scoreboard_data:
            return None

        raw_games = raw_scoreboard_data.get("games", [])
        for game in raw_games:
            if str(game.get("gameId", "")).zfill(10) == game_id_norm:
                return {
                    "gameId": game_id,
                    "status": game.get("gameStatusText", "Scheduled"),
                    "homeTeam": {
                        "teamId": game["homeTeam"].get("teamId"),
                        "teamName": game["homeTeam"].get("teamName", "Home Team"),
                    },
                    "awayTeam": {
                        "teamId": game["awayTeam"].get("teamId"),
                        "teamName": game["awayTeam"].get("teamName", "Away Team"),
                    },
                }
        return None
    except Exception as e:
        logger.warning(
            f"Error fetching game info from scoreboard for game {game_id}: {e}"
        )
        return None


def _player_box_from_live(player: dict) -> PlayerBoxScoreStats:
    stats = player.get("statistics") or {}
    return PlayerBoxScoreStats(
        player_id=player["personId"],
        name=player["name"],
        position=player.get("position", "N/A"),
        minutes=stats.get("minutesCalculated", "N/A"),
        points=stats.get("points", 0),
        rebounds=stats.get("reboundsTotal", 0),
        assists=stats.get("assists", 0),
        steals=stats.get("steals", 0),
        blocks=stats.get("blocks", 0),
        turnovers=stats.get("turnovers", 0),
        field_goals_made=stats.get("fieldGoalsMade"),
        field_goals_attempted=stats.get("fieldGoalsAttempted"),
        free_throws_made=stats.get("freeThrowsMade"),
        free_throws_attempted=stats.get("freeThrowsAttempted"),
        rebounds_offensive=stats.get("reboundsOffensive"),
        rebounds_defensive=stats.get("reboundsDefensive"),
        fouls_personal=stats.get("foulsPersonal"),
    )


def _team_box_from_live(team: dict) -> TeamBoxScoreStats:
    stats = team.get("statistics") or {}
    return TeamBoxScoreStats(
        team_id=team["teamId"],
        team_name=team["teamName"],
        score=team["score"],
        field_goal_pct=stats.get("fieldGoalsPercentage", 0.0),
        three_point_pct=stats.get("threePointersPercentage", 0.0),
        free_throw_pct=stats.get("freeThrowsPercentage", 0.0),
        rebounds_total=stats.get("reboundsTotal", 0),
        assists=stats.get("assists", 0),
        steals=stats.get("steals", 0),
        blocks=stats.get("blocks", 0),
        turnovers=stats.get("turnovers", 0),
        players=[_player_box_from_live(p) for p in team.get("players", [])],
    )


def _box_score_from_live(game_info: dict) -> BoxScoreResponse:
    home_team = game_info["homeTeam"]
    away_team = game_info["awayTeam"]
    return BoxScoreResponse(
        game_id=str(game_info["gameId"]).zfill(10),
        status=game_info["gameStatusText"],
        home_team=_team_box_from_live(home_team),
        away_team=_team_box_from_live(away_team),
    )


def _player_box_from_v3(player: dict) -> PlayerBoxScoreStats:
    stats = player.get("statistics") or {}
    first = player.get("firstName", "")
    last = player.get("familyName", "")
    name = player.get("nameI") or f"{first} {last}".strip() or "Unknown"
    return PlayerBoxScoreStats(
        player_id=int(player["personId"]),
        name=name,
        position=player.get("position") or "N/A",
        minutes=stats.get("minutes") or "N/A",
        points=int(stats.get("points") or 0),
        rebounds=int(stats.get("reboundsTotal") or 0),
        assists=int(stats.get("assists") or 0),
        steals=int(stats.get("steals") or 0),
        blocks=int(stats.get("blocks") or 0),
        turnovers=int(stats.get("turnovers") or 0),
        field_goals_made=stats.get("fieldGoalsMade"),
        field_goals_attempted=stats.get("fieldGoalsAttempted"),
        free_throws_made=stats.get("freeThrowsMade"),
        free_throws_attempted=stats.get("freeThrowsAttempted"),
        rebounds_offensive=stats.get("reboundsOffensive"),
        rebounds_defensive=stats.get("reboundsDefensive"),
        fouls_personal=stats.get("foulsPersonal"),
    )


def _team_box_from_v3(team: dict) -> TeamBoxScoreStats:
    stats = team.get("statistics") or {}
    city = team.get("teamCity", "")
    name = team.get("teamName", "Unknown")
    display_name = f"{city} {name}".strip() if city else name
    return TeamBoxScoreStats(
        team_id=int(team["teamId"]),
        team_name=display_name,
        score=int(stats.get("points") or 0),
        field_goal_pct=float(stats.get("fieldGoalsPercentage") or 0.0),
        three_point_pct=float(stats.get("threePointersPercentage") or 0.0),
        free_throw_pct=float(stats.get("freeThrowsPercentage") or 0.0),
        rebounds_total=int(stats.get("reboundsTotal") or 0),
        assists=int(stats.get("assists") or 0),
        steals=int(stats.get("steals") or 0),
        blocks=int(stats.get("blocks") or 0),
        turnovers=int(stats.get("turnovers") or 0),
        players=[_player_box_from_v3(p) for p in team.get("players", [])],
    )


def _box_score_from_v3(box: dict, game_id: str) -> Optional[BoxScoreResponse]:
    home = box.get("homeTeam")
    away = box.get("awayTeam")
    if not home or not away:
        return None
    return BoxScoreResponse(
        game_id=game_id,
        status="Final",
        home_team=_team_box_from_v3(home),
        away_team=_team_box_from_v3(away),
    )


async def _fetch_historical_box_score(game_id: str) -> Optional[BoxScoreResponse]:
    try:
        api_kwargs = get_api_kwargs()
        await rate_limit()
        raw = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: boxscoretraditionalv3.BoxScoreTraditionalV3(
                    game_id=game_id, **api_kwargs
                ).get_dict()
            ),
            timeout=10.0,
        )
        box = raw.get("boxScoreTraditional")
        if not box:
            return None
        return _box_score_from_v3(box, game_id)
    except Exception as e:
        logger.warning(
            "Historical box score unavailable for game %s: %s - %s",
            game_id,
            type(e).__name__,
            e,
        )
        return None


def _empty_box_score_from_game_info(game_info: dict, game_id: str) -> BoxScoreResponse:
    return BoxScoreResponse(
        game_id=game_id,
        status=game_info["status"],
        home_team=TeamBoxScoreStats(
            team_id=game_info["homeTeam"]["teamId"],
            team_name=game_info["homeTeam"]["teamName"],
            score=0,
            field_goal_pct=0.0,
            three_point_pct=0.0,
            free_throw_pct=0.0,
            rebounds_total=0,
            assists=0,
            steals=0,
            blocks=0,
            turnovers=0,
            players=[],
        ),
        away_team=TeamBoxScoreStats(
            team_id=game_info["awayTeam"]["teamId"],
            team_name=game_info["awayTeam"]["teamName"],
            score=0,
            field_goal_pct=0.0,
            three_point_pct=0.0,
            free_throw_pct=0.0,
            rebounds_total=0,
            assists=0,
            steals=0,
            blocks=0,
            turnovers=0,
            players=[],
        ),
    )


async def getBoxScore(game_id: str) -> BoxScoreResponse:
    """
    Get the full box score (detailed stats) for a specific game.

    Args:
        game_id: The unique game ID from NBA (accepts 8-digit or 10-digit format)

    Returns:
        BoxScoreResponse: Complete stats for both teams and all players

    Raises:
        HTTPException: If game not found or API error
    """
    game_id = str(game_id).zfill(10)
    live_error: Optional[Exception] = None

    try:
        api_kwargs = get_api_kwargs()
        await rate_limit()
        game_data = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: boxscore.BoxScore(game_id, **api_kwargs).get_dict()
            ),
            timeout=10.0,
        )
        if "game" in game_data:
            return _box_score_from_live(game_data["game"])

        logger.warning(
            "Live box score missing game payload for %s; trying historical stats",
            game_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        live_error = e
        if not _is_nba_empty_response_error(e):
            logger.warning(
                "Live box score failed for %s: %s - %s",
                game_id,
                type(e).__name__,
                e,
            )

    historical = await _fetch_historical_box_score(game_id)
    if historical:
        return historical

    game_info = await _get_game_info_from_scoreboard(game_id)
    if game_info:
        return _empty_box_score_from_game_info(game_info, game_id)

    if live_error and not _is_nba_empty_response_error(live_error):
        logger.error("Error retrieving box score for game %s: %s", game_id, live_error)
        raise HTTPException(
            status_code=500, detail=f"Error retrieving box score: {str(live_error)}"
        )

    raise HTTPException(
        status_code=404,
        detail=f"{_BOXSCORE_UNAVAILABLE_DETAIL} (game {game_id})",
    )


def _plays_from_actions(game_id: str, actions: List[dict]) -> List[PlayByPlayEvent]:
    plays: List[PlayByPlayEvent] = []
    for action in actions:
        if action.get("actionNumber") is None:
            continue
        plays.append(
            PlayByPlayEvent(
                action_number=action["actionNumber"],
                clock=action.get("clock") or "",
                period=int(action.get("period") or 0),
                team_id=action.get("teamId"),
                team_tricode=action.get("teamTricode"),
                action_type=action.get("actionType") or "",
                description=action.get("description") or "",
                player_id=action.get("personId"),
                player_name=action.get("playerName"),
                score_home=(
                    str(action["scoreHome"])
                    if action.get("scoreHome") is not None
                    else None
                ),
                score_away=(
                    str(action["scoreAway"])
                    if action.get("scoreAway") is not None
                    else None
                ),
            )
        )
    return plays


async def _fetch_historical_play_by_play(game_id: str) -> List[PlayByPlayEvent]:
    try:
        api_kwargs = get_api_kwargs()
        await rate_limit()
        raw = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: playbyplayv3.PlayByPlayV3(game_id=game_id, **api_kwargs).get_dict()
            ),
            timeout=10.0,
        )
        actions = raw.get("game", {}).get("actions") or []
        return _plays_from_actions(game_id, actions)
    except Exception as e:
        logger.warning(
            "Historical play-by-play unavailable for game %s: %s - %s",
            game_id,
            type(e).__name__,
            e,
        )
        return []


async def getPlayByPlay(game_id: str) -> PlayByPlayResponse:
    """
    Get the play-by-play (all game events) for a specific game.

    Uses the live feed for in-progress games; completed games fall back to PlayByPlayV3.
    """
    game_id = str(game_id).zfill(10)
    live_error: Optional[Exception] = None

    try:
        api_kwargs = get_api_kwargs()
        await rate_limit()
        play_by_play_data = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: playbyplay.PlayByPlay(game_id, **api_kwargs).get_dict()
            ),
            timeout=10.0,
        )
        actions = play_by_play_data.get("game", {}).get("actions") or []
        if actions:
            return PlayByPlayResponse(
                game_id=game_id, plays=_plays_from_actions(game_id, actions)
            )
    except HTTPException:
        raise
    except Exception as e:
        live_error = e
        if not _is_nba_empty_response_error(e):
            logger.warning(
                "Live play-by-play failed for %s: %s - %s",
                game_id,
                type(e).__name__,
                e,
            )

    historical_plays = await _fetch_historical_play_by_play(game_id)
    if historical_plays:
        return PlayByPlayResponse(game_id=game_id, plays=historical_plays)

    if live_error and _is_nba_empty_response_error(live_error):
        logger.warning(
            "Play-by-play not available for game %s (live and stats empty)",
            game_id,
        )
        return PlayByPlayResponse(game_id=game_id, plays=[])

    if live_error:
        logger.error("Error retrieving play-by-play for game %s: %s", game_id, live_error)
        raise HTTPException(
            status_code=500, detail=f"Error retrieving play-by-play: {str(live_error)}"
        )

    return PlayByPlayResponse(game_id=game_id, plays=[])
