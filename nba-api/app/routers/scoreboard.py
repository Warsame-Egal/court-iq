import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.player import TeamRoster
from app.schemas.scoreboard import BoxScoreResponse, PlayByPlayResponse
from app.services.scoreboard import (
    fetchTeamRoster,
    getBoxScore,
    getPlayByPlay,
    getScoreboard,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/scoreboard/today", tags=["scoreboard"])
async def get_scoreboard_today(
    date_param: Optional[str] = Query(
        None,
        alias="date",
        description="Game date in YYYY-MM-DD. Defaults to today.",
    ),
):
    today = date.today().isoformat()
    scoreboard_data = await getScoreboard(date_param or today)
    return scoreboard_data.model_dump()


@router.get(
    "/scoreboard/team/{team_id}/roster/{season}",
    response_model=TeamRoster,
    tags=["teams"],
)
async def get_team_roster(team_id: int, season: str):
    try:
        return await fetchTeamRoster(team_id, season)
    except HTTPException as e:
        raise e


@router.get(
    "/scoreboard/game/{game_id}/boxscore",
    response_model=BoxScoreResponse,
    tags=["boxscore"],
)
async def get_game_boxscore(game_id: str):
    try:
        return await getBoxScore(game_id)
    except HTTPException as e:
        raise e


@router.get(
    "/scoreboard/game/{game_id}/play-by-play",
    response_model=PlayByPlayResponse,
    tags=["play-by-play"],
)
async def get_game_playbyplay(game_id: str):
    try:
        return await getPlayByPlay(game_id)
    except HTTPException as e:
        raise e
