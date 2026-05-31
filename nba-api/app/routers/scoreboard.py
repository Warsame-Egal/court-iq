import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect

from app.schemas.player import TeamRoster
from app.schemas.scoreboard import BoxScoreResponse, PlayByPlayResponse
from app.services.data_cache import data_cache
from app.services.scoreboard import (
    fetchTeamRoster,
    getBoxScore,
    getPlayByPlay,
    getScoreboard,
)
from app.services.websockets_manager import (
    playbyplay_websocket_manager,
    scoreboard_websocket_manager,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await scoreboard_websocket_manager.connect(websocket)

    try:
        await scoreboard_websocket_manager.send_initial_scoreboard(websocket)

        if websocket not in scoreboard_websocket_manager.active_connections:
            return

        while True:
            try:
                await websocket.receive_text()
            except RuntimeError as e:
                if "not connected" in str(e).lower() or "accept" in str(e).lower():
                    break
                raise
    except WebSocketDisconnect:
        logger.info("Client disconnected from scoreboard WebSocket")
    except Exception as e:
        logger.error(f"Error in scoreboard WebSocket: {e}", exc_info=True)
    finally:
        await scoreboard_websocket_manager.disconnect(websocket)


@router.get("/scoreboard/today", tags=["scoreboard"])
async def get_scoreboard_today(
    date_param: Optional[str] = Query(
        None,
        alias="date",
        description="Game date in YYYY-MM-DD. Omit or use today for live cached scoreboard.",
    ),
):
    today = date.today().isoformat()
    if date_param is None or date_param == today:
        scoreboard_data = await data_cache.get_scoreboard()
        if not scoreboard_data:
            return {"scoreboard": {"gameDate": today, "games": []}}
        return scoreboard_data.model_dump()

    scoreboard_data = await getScoreboard(date_param)
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


@router.websocket("/ws/{game_id}/play-by-play")
async def playbyplay_websocket_endpoint(websocket: WebSocket, game_id: str):
    await playbyplay_websocket_manager.connect(websocket, game_id)

    try:
        if (
            game_id not in playbyplay_websocket_manager.active_connections
            or websocket not in playbyplay_websocket_manager.active_connections[game_id]
        ):
            return

        while True:
            try:
                await websocket.receive_text()
            except RuntimeError as e:
                if "not connected" in str(e).lower() or "accept" in str(e).lower():
                    break
                raise
    except WebSocketDisconnect:
        logger.info(
            f"Client disconnected from play-by-play WebSocket for game {game_id}"
        )
    except Exception as e:
        logger.error(f"Error in play-by-play WebSocket: {e}", exc_info=True)
    finally:
        await playbyplay_websocket_manager.disconnect(websocket, game_id)
