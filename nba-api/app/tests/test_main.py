import json
from types import SimpleNamespace
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app

client = TestClient(app)


# ============================================================================
# Health Check Tests
# ============================================================================


def test_home_endpoint():
    """Test the root health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "CourtIQ NBA API is running"}


# ============================================================================
# Player Endpoint Tests
# ============================================================================


@patch("app.routers.players.getPlayer")
def test_get_player_success(mock_get_player):
    """Test successful player retrieval with valid ID."""
    mock_player = {
        "PERSON_ID": 2544,
        "PLAYER_LAST_NAME": "James",
        "PLAYER_FIRST_NAME": "LeBron",
        "PLAYER_SLUG": "lebron-james",
        "TEAM_ID": 1610612747,
        "TEAM_ABBREVIATION": "LAL",
        "TEAM_CITY": "Los Angeles",
        "TEAM_NAME": "Lakers",
        "CURRENT_SEASON_STATS": {
            "PTS": 25.0,
            "REB": 7.0,
            "AST": 8.0,
        },
        "RECENT_GAMES": [],
    }

    async def mock_get_player_async(*args, **kwargs):
        return mock_player

    mock_get_player.side_effect = mock_get_player_async

    response = client.get("/api/v1/player/2544")
    assert response.status_code == 200
    data = response.json()
    assert data["PERSON_ID"] == 2544
    assert data["PLAYER_LAST_NAME"] == "James"
    assert "PLAYER_FIRST_NAME" in data


@patch("app.routers.players.getPlayer")
def test_get_player_not_found(mock_get_player):
    """Test 404 error for invalid player ID."""
    from fastapi import HTTPException

    mock_get_player.side_effect = HTTPException(
        status_code=404, detail="Player not found"
    )

    response = client.get("/api/v1/player/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@patch("app.routers.players.search_players")
def test_search_players_success(mock_search):
    """Test successful player search."""
    mock_results = [
        {
            "PERSON_ID": 2544,
            "PLAYER_LAST_NAME": "James",
            "PLAYER_FIRST_NAME": "LeBron",
            "TEAM_ABBREVIATION": "LAL",
        }
    ]

    async def mock_search_async(*args, **kwargs):
        return mock_results

    mock_search.side_effect = mock_search_async

    response = client.get("/api/v1/players/search/lebron")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "PLAYER_LAST_NAME" in data[0]


# ============================================================================
# Team Endpoint Tests
# ============================================================================


@patch("app.routers.teams.get_team")
def test_get_team_success(mock_get_team):
    """Test successful team retrieval."""
    mock_team = {
        "team_id": 1610612747,
        "team_name": "Lakers",
        "team_city": "Los Angeles",
        "abbreviation": "LAL",
        "arena": "Crypto.com Arena",
        "head_coach": "Darvin Ham",
    }

    async def mock_get_team_async(*args, **kwargs):
        return mock_team

    mock_get_team.side_effect = mock_get_team_async

    response = client.get("/api/v1/teams/1610612747")
    assert response.status_code == 200
    data = response.json()
    assert data["team_id"] == 1610612747
    assert data["team_name"] == "Lakers"
    assert "abbreviation" in data


# ============================================================================
# Scoreboard Endpoint Tests
# ============================================================================


@patch("app.routers.scoreboard.getBoxScore")
def test_get_boxscore_success(mock_get_boxscore):
    """Test successful box score retrieval."""
    mock_boxscore = {
        "game_id": "0022500447",
        "status": "Final",
        "home_team": {
            "team_id": 1610612747,
            "team_name": "Lakers",
            "score": 110,
            "field_goal_pct": 0.45,
            "three_point_pct": 0.35,
            "free_throw_pct": 0.80,
            "rebounds_total": 45,
            "assists": 25,
            "steals": 8,
            "blocks": 5,
            "turnovers": 12,
            "players": [],
        },
        "away_team": {
            "team_id": 1610612738,
            "team_name": "Celtics",
            "score": 105,
            "field_goal_pct": 0.42,
            "three_point_pct": 0.33,
            "free_throw_pct": 0.78,
            "rebounds_total": 42,
            "assists": 23,
            "steals": 7,
            "blocks": 4,
            "turnovers": 14,
            "players": [],
        },
    }

    async def mock_get_boxscore_async(*args, **kwargs):
        return mock_boxscore

    mock_get_boxscore.side_effect = mock_get_boxscore_async

    response = client.get("/api/v1/scoreboard/game/0022500447/boxscore")
    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == "0022500447"
    assert "home_team" in data
    assert "away_team" in data
    assert "players" in data["home_team"]


@patch("app.services.scoreboard._fetch_historical_box_score", new_callable=AsyncMock)
@patch("app.services.scoreboard.fetch_nba_scoreboard", new_callable=AsyncMock)
@patch("app.services.scoreboard.rate_limit", new_callable=AsyncMock)
@patch("app.services.scoreboard.asyncio.to_thread")
def test_get_boxscore_empty_nba_response_returns_404(
    mock_to_thread,
    mock_rate_limit,
    mock_fetch_scoreboard,
    mock_historical_box,
):
    """When live and historical box score are empty and game is not on scoreboard, return 404."""
    mock_to_thread.side_effect = json.JSONDecodeError("Expecting value", "", 0)
    mock_fetch_scoreboard.return_value = {"games": []}
    mock_historical_box.return_value = None

    from app.services.scoreboard import getBoxScore

    with patch("app.services.scoreboard.get_api_kwargs", return_value={}):
        with patch("app.routers.scoreboard.getBoxScore", wraps=getBoxScore):
            response = client.get("/api/v1/scoreboard/game/0042500316/boxscore")

    assert response.status_code == 404
    assert "not available" in response.json()["detail"].lower()


@patch("app.services.scoreboard._fetch_historical_box_score", new_callable=AsyncMock)
@patch("app.services.scoreboard.fetch_nba_scoreboard", new_callable=AsyncMock)
@patch("app.services.scoreboard.rate_limit", new_callable=AsyncMock)
@patch("app.services.scoreboard.asyncio.to_thread")
def test_get_boxscore_empty_nba_response_returns_empty_stats_when_on_scoreboard(
    mock_to_thread, mock_rate_limit, mock_fetch_scoreboard, mock_historical_box
):
    """When box score is empty but game is on today's scoreboard, return zeroed stats."""
    mock_to_thread.side_effect = json.JSONDecodeError("Expecting value", "", 0)
    mock_historical_box.return_value = None
    mock_fetch_scoreboard.return_value = {
        "games": [
            {
                "gameId": "0042500316",
                "gameStatusText": "Scheduled",
                "homeTeam": {"teamId": 1, "teamName": "Home"},
                "awayTeam": {"teamId": 2, "teamName": "Away"},
            }
        ]
    }

    from app.services.scoreboard import getBoxScore

    with patch("app.services.scoreboard.get_api_kwargs", return_value={}):
        with patch("app.routers.scoreboard.getBoxScore", wraps=getBoxScore):
            response = client.get("/api/v1/scoreboard/game/0042500316/boxscore")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Scheduled"
    assert data["home_team"]["score"] == 0
    assert data["away_team"]["players"] == []


@patch("app.routers.scoreboard.getScoreboard", new_callable=AsyncMock)
def test_scoreboard_today_with_past_date_uses_stats_path(mock_get_scoreboard):
    """Past dates bypass the live cache and call getScoreboard with the date."""
    from app.schemas.scoreboard import LiveGame, Scoreboard, ScoreboardResponse, Team

    mock_get_scoreboard.return_value = ScoreboardResponse(
        scoreboard=Scoreboard(
            gameDate="2024-01-15",
            games=[
                LiveGame(
                    gameId="0022400567",
                    gameStatus=3,
                    gameStatusText="Final",
                    period=4,
                    gameClock=None,
                    gameTimeUTC="2024-01-15",
                    homeTeam=Team(
                        teamId=1610612747,
                        teamName="Lakers",
                        teamCity="Los Angeles",
                        teamTricode="LAL",
                        score=110,
                    ),
                    awayTeam=Team(
                        teamId=1610612738,
                        teamName="Celtics",
                        teamCity="Boston",
                        teamTricode="BOS",
                        score=105,
                    ),
                )
            ],
        )
    )

    response = client.get("/api/v1/scoreboard/today?date=2024-01-15")
    assert response.status_code == 200
    data = response.json()
    assert data["scoreboard"]["gameDate"] == "2024-01-15"
    assert len(data["scoreboard"]["games"]) == 1
    mock_get_scoreboard.assert_awaited_once_with("2024-01-15")


@patch("app.services.scoreboard._fetch_historical_box_score", new_callable=AsyncMock)
@patch("app.services.scoreboard.rate_limit", new_callable=AsyncMock)
@patch("app.services.scoreboard.asyncio.to_thread")
def test_get_boxscore_uses_historical_fallback(mock_to_thread, mock_rate_limit, mock_historical):
    """Completed games use BoxScoreTraditionalV3 when the live feed is empty."""
    mock_to_thread.return_value = {}
    from app.schemas.scoreboard import BoxScoreResponse, PlayerBoxScoreStats, TeamBoxScoreStats

    mock_historical.return_value = BoxScoreResponse(
        game_id="0042500316",
        status="Final",
        home_team=TeamBoxScoreStats(
            team_id=1,
            team_name="Home",
            score=100,
            field_goal_pct=0.45,
            three_point_pct=0.35,
            free_throw_pct=0.8,
            rebounds_total=40,
            assists=20,
            steals=5,
            blocks=4,
            turnovers=10,
            players=[
                PlayerBoxScoreStats(
                    player_id=1,
                    name="Player One",
                    points=20,
                    rebounds=5,
                    assists=3,
                    steals=1,
                    blocks=0,
                    turnovers=2,
                )
            ],
        ),
        away_team=TeamBoxScoreStats(
            team_id=2,
            team_name="Away",
            score=95,
            field_goal_pct=0.42,
            three_point_pct=0.33,
            free_throw_pct=0.78,
            rebounds_total=38,
            assists=18,
            steals=4,
            blocks=3,
            turnovers=11,
            players=[],
        ),
    )

    from app.services.scoreboard import getBoxScore

    with patch("app.services.scoreboard.get_api_kwargs", return_value={}):
        with patch("app.routers.scoreboard.getBoxScore", wraps=getBoxScore):
            response = client.get("/api/v1/scoreboard/game/0042500316/boxscore")

    assert response.status_code == 200
    assert response.json()["status"] == "Final"
    assert response.json()["home_team"]["score"] == 100


@patch("app.services.scoreboard._fetch_historical_play_by_play", new_callable=AsyncMock)
@patch("app.services.scoreboard.rate_limit", new_callable=AsyncMock)
@patch("app.services.scoreboard.asyncio.to_thread")
def test_get_playbyplay_uses_historical_fallback(mock_to_thread, mock_rate_limit, mock_historical_pbp):
    """Completed games use PlayByPlayV3 when the live feed has no actions."""
    mock_to_thread.return_value = {"game": {"actions": []}}
    from app.schemas.scoreboard import PlayByPlayEvent

    mock_historical_pbp.return_value = [
        PlayByPlayEvent(
            action_number=1,
            clock="PT12M00.00S",
            period=1,
            team_id=1610612747,
            team_tricode="LAL",
            action_type="period",
            description="Period Start",
            player_id=None,
            player_name=None,
            score_home="0",
            score_away="0",
        )
    ]

    from app.services.scoreboard import getPlayByPlay

    with patch("app.services.scoreboard.get_api_kwargs", return_value={}):
        with patch("app.routers.scoreboard.getPlayByPlay", wraps=getPlayByPlay):
            response = client.get("/api/v1/scoreboard/game/0042500316/play-by-play")

    assert response.status_code == 200
    data = response.json()
    assert len(data["plays"]) == 1
    assert data["plays"][0]["description"] == "Period Start"


@patch("app.routers.scoreboard.fetchTeamRoster")
def test_get_team_roster_success(mock_get_roster):
    """Test successful team roster retrieval."""
    mock_roster = {
        "team_id": 1610612747,
        "team_name": "Lakers",
        "season": "2024-25",
        "players": [
            {
                "player_id": 2544,
                "name": "LeBron James",
                "jersey_number": "6",
                "position": "F",
            }
        ],
        "coaches": [],
    }

    async def mock_get_roster_async(*args, **kwargs):
        return mock_roster

    mock_get_roster.side_effect = mock_get_roster_async

    response = client.get("/api/v1/scoreboard/team/1610612747/roster/2024-25")
    assert response.status_code == 200
    data = response.json()
    assert data["team_id"] == 1610612747
    assert "players" in data
    assert isinstance(data["players"], list)


# ============================================================================
# Standings Endpoint Tests
# ============================================================================


@patch("app.routers.standings.getSeasonStandings")
def test_get_standings_success(mock_get_standings):
    """Test successful standings retrieval (paginated)."""
    mock_list = [
        {
            "season_id": "22024",
            "team_id": 1610612738,
            "team_city": "Boston",
            "team_name": "Celtics",
            "conference": "East",
            "division": "Atlantic",
            "wins": 50,
            "losses": 20,
            "win_pct": 0.714,
            "playoff_rank": 1,
            "home_record": "28-8",
            "road_record": "22-12",
            "conference_record": "32-12",
            "division_record": "10-4",
            "l10_record": "8-2",
            "current_streak": 4,
            "current_streak_str": "W4",
            "games_back": "0.0",
        }
    ]

    async def mock_get_standings_async(*args, **kwargs):
        return SimpleNamespace(standings=mock_list)

    mock_get_standings.side_effect = mock_get_standings_async

    response = client.get("/api/v1/standings/season/2024-25")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["wins"] >= 0
    assert data[0]["losses"] >= 0


# ============================================================================
# Search Endpoint Tests
# ============================================================================


@patch("app.routers.search.search_entities")
def test_search_success(mock_search):
    """Test successful search for players and teams."""
    mock_results = {
        "players": [
            {
                "id": 2544,
                "name": "LeBron James",
                "team_id": 1610612747,
                "team_abbreviation": "LAL",
            }
        ],
        "teams": [
            {"id": 1610612747, "name": "Los Angeles Lakers", "abbreviation": "LAL"}
        ],
    }

    async def mock_search_async(*args, **kwargs):
        return mock_results

    mock_search.side_effect = mock_search_async

    response = client.get("/api/v1/search?q=lakers")
    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    assert "teams" in data
    assert isinstance(data["players"], list)
    assert isinstance(data["teams"], list)


@patch("app.routers.search.search_entities")
def test_search_empty_results(mock_search):
    """Test search with no results returns empty lists."""
    mock_results = {"players": [], "teams": []}

    async def mock_search_async(*args, **kwargs):
        return mock_results

    mock_search.side_effect = mock_search_async

    response = client.get("/api/v1/search?q=nonexistent")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["players"], list)
    assert isinstance(data["teams"], list)
    assert len(data["players"]) == 0
    assert len(data["teams"]) == 0


def test_search_missing_query_parameter():
    """Test search endpoint requires query parameter."""
    response = client.get("/api/v1/search")
    assert response.status_code == 422  # Validation error


@patch("app.routers.search.search_entities")
def test_search_empty_query_parameter(mock_search):
    """Empty query is accepted at FastAPI; Spring validates non-empty at the edge."""
    async def mock_search_async(*args, **kwargs):
        return {"players": [], "teams": []}

    mock_search.side_effect = mock_search_async

    response = client.get("/api/v1/search?q=")
    assert response.status_code == 200


# ============================================================================
# Schema Validation Tests
# ============================================================================


@patch("app.routers.players.getPlayer")
def test_player_schema_validation(mock_get_player):
    """Test that player response matches expected schema."""
    mock_player = {
        "PERSON_ID": 2544,
        "PLAYER_LAST_NAME": "James",
        "PLAYER_FIRST_NAME": "LeBron",
        "PLAYER_SLUG": "lebron-james",
        "TEAM_ID": 1610612747,
        "TEAM_ABBREVIATION": "LAL",
        "TEAM_CITY": "Los Angeles",
        "TEAM_NAME": "Lakers",
        "CURRENT_SEASON_STATS": {
            "PTS": 25.0,
            "REB": 7.0,
            "AST": 8.0,
        },
        "RECENT_GAMES": [],
    }

    async def mock_get_player_async(*args, **kwargs):
        return mock_player

    mock_get_player.side_effect = mock_get_player_async

    response = client.get("/api/v1/player/2544")
    assert response.status_code == 200
    data = response.json()

    # Validate required fields
    assert "PERSON_ID" in data
    assert "PLAYER_LAST_NAME" in data
    assert "PLAYER_FIRST_NAME" in data
    assert isinstance(data["PERSON_ID"], int)
    assert isinstance(data["PLAYER_LAST_NAME"], str)


@patch("app.routers.scoreboard.getBoxScore")
def test_boxscore_schema_validation(mock_get_boxscore):
    """Test that box score response matches expected schema."""
    mock_boxscore = {
        "game_id": "0022500447",
        "status": "Final",
        "home_team": {
            "team_id": 1610612747,
            "team_name": "Lakers",
            "score": 110,
            "field_goal_pct": 0.45,
            "three_point_pct": 0.35,
            "free_throw_pct": 0.80,
            "rebounds_total": 45,
            "assists": 25,
            "steals": 8,
            "blocks": 5,
            "turnovers": 12,
            "players": [],
        },
        "away_team": {
            "team_id": 1610612738,
            "team_name": "Celtics",
            "score": 105,
            "field_goal_pct": 0.42,
            "three_point_pct": 0.33,
            "free_throw_pct": 0.78,
            "rebounds_total": 42,
            "assists": 23,
            "steals": 7,
            "blocks": 4,
            "turnovers": 14,
            "players": [],
        },
    }

    async def mock_get_boxscore_async(*args, **kwargs):
        return mock_boxscore

    mock_get_boxscore.side_effect = mock_get_boxscore_async

    response = client.get("/api/v1/scoreboard/game/0022500447/boxscore")
    assert response.status_code == 200
    data = response.json()

    # Validate schema structure
    assert "game_id" in data
    assert "home_team" in data
    assert "away_team" in data
    assert "team_id" in data["home_team"]
    assert "team_name" in data["home_team"]
    assert "score" in data["home_team"]
    assert "players" in data["home_team"]
    assert isinstance(data["home_team"]["players"], list)


@patch("app.routers.standings.getSeasonStandings")
def test_standings_schema_validation(mock_get_standings):
    """Test that standings response matches expected schema."""
    mock_standings = {
        "standings": [
            {
                "season_id": "22024",
                "team_id": 1610612738,
                "team_city": "Boston",
                "team_name": "Celtics",
                "conference": "East",
                "division": "Atlantic",
                "wins": 50,
                "losses": 20,
                "win_pct": 0.714,
                "playoff_rank": 1,
                "home_record": "28-8",
                "road_record": "22-12",
                "conference_record": "32-12",
                "division_record": "10-4",
                "l10_record": "8-2",
                "current_streak": 4,
                "current_streak_str": "W4",
                "games_back": "0.0",
            }
        ]
    }

    async def mock_get_standings_async(*args, **kwargs):
        return SimpleNamespace(standings=mock_standings["standings"])

    mock_get_standings.side_effect = mock_get_standings_async

    response = client.get("/api/v1/standings/season/2024-25")
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    if len(data) > 0:
        standing = data[0]
        assert "team_id" in standing
        assert "team_name" in standing
        assert "wins" in standing
        assert "losses" in standing
        assert "win_pct" in standing
        assert isinstance(standing["wins"], int)
        assert isinstance(standing["losses"], int)
        assert isinstance(standing["win_pct"], float)


# ============================================================================
# Error Handling Tests
# ============================================================================


def test_404_nonexistent_endpoint():
    """Test 404 for endpoint that doesn't exist."""
    response = client.get("/api/v1/nonexistent")
    assert response.status_code == 404


def test_405_method_not_allowed():
    """Test 405 for unsupported HTTP method."""
    response = client.post("/api/v1/player/2544")
    assert response.status_code == 405  # Method not allowed
