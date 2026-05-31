import pytest

from app.utils.season import get_current_season, validate_season


def test_validate_season_accepts_yyyy_yy_format():
    assert validate_season("2024-25") == "2024-25"


def test_validate_season_rejects_invalid_format():
    with pytest.raises(ValueError, match="Invalid season format"):
        validate_season("2024")


def test_get_current_season_matches_pattern():
    season = get_current_season()
    assert validate_season(season) == season
