# WebSocket managers for broadcasting live NBA scores to clients.

import asyncio
import copy
import logging
import time
from typing import Dict, List, Optional, Set

from fastapi import WebSocket

from app.services.data_cache import data_cache

logger = logging.getLogger(__name__)


class ScoreboardWebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.current_games: List[Dict] = []
        self._lock = asyncio.Lock()
        self.last_update_timestamp: Dict[str, float] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        logger.info(f"New scoreboard client connected: {websocket.client}")
        self.active_connections.add(websocket)

    async def disconnect(self, websocket: WebSocket):
        try:
            if websocket.client_state.name != "DISCONNECTED":
                await websocket.close()
        except Exception:
            pass
        finally:
            self.active_connections.discard(websocket)
            if not self.active_connections:
                self.last_update_timestamp.clear()
            logger.info(f"Client disconnected from scoreboard: {websocket.client}")

    def get_connection_count(self) -> int:
        return len(self.active_connections)

    async def _periodic_cleanup(self):
        logger.info("Scoreboard WebSocket cleanup task started")

        while True:
            try:
                await asyncio.sleep(600)

                current_time = time.time()
                stale_threshold = 3600.0

                stale_keys = [
                    game_id
                    for game_id, timestamp in self.last_update_timestamp.items()
                    if current_time - timestamp > stale_threshold
                ]

                for key in stale_keys:
                    self.last_update_timestamp.pop(key, None)

                if stale_keys:
                    logger.debug(
                        f"Cleaned up {len(stale_keys)} stale timestamps from scoreboard WebSocket manager"
                    )

            except asyncio.CancelledError:
                logger.info("Scoreboard WebSocket cleanup task cancelled")
                raise
            except Exception as e:
                logger.error(f"Error in scoreboard WebSocket cleanup: {e}")
                await asyncio.sleep(60)

    def start_cleanup_task(self):
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
            logger.info("Started scoreboard WebSocket cleanup task")

    async def stop_cleanup_task(self):
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            logger.info("Stopped scoreboard WebSocket cleanup task")

    async def send_initial_scoreboard(self, websocket: WebSocket):
        try:
            if websocket not in self.active_connections:
                return

            scoreboard_data = await data_cache.get_scoreboard()

            if scoreboard_data:
                games_data = scoreboard_data.model_dump()
                await websocket.send_json(games_data)
            else:
                await websocket.send_json({"scoreboard": {"gameDate": "", "games": []}})
        except Exception as e:
            error_msg = str(e) if str(e) else type(e).__name__
            logger.warning(f"Could not send initial scoreboard: {error_msg}")
            self.active_connections.discard(websocket)

    def has_game_data_changed(self, new_data: List[Dict], old_data: List[Dict]) -> bool:
        current_time = time.time()

        new_map = {game["gameId"]: game for game in new_data}
        old_map = {game["gameId"]: game for game in old_data}

        for game_id, new_game in new_map.items():
            if game_id not in old_map:
                return True

            old_game = old_map[game_id]

            try:
                new_home_score = new_game["homeTeam"].get("score", 0)
                new_away_score = new_game["awayTeam"].get("score", 0)
                old_home_score = old_game["homeTeam"].get("score", 0)
                old_away_score = old_game["awayTeam"].get("score", 0)

                if (
                    new_game["gameStatus"] != old_game["gameStatus"]
                    or new_game["period"] != old_game["period"]
                    or new_home_score != old_home_score
                    or new_away_score != old_away_score
                ):
                    if (
                        game_id not in self.last_update_timestamp
                        or (current_time - self.last_update_timestamp[game_id]) >= 5.0
                    ):
                        self.last_update_timestamp[game_id] = current_time
                        return True
            except KeyError as e:
                logger.warning(f"Missing data in game {game_id}: {e}")

        return False

    async def broadcast_updates(self):
        logger.info("Scoreboard broadcasting started")

        while True:
            try:
                if not self.active_connections:
                    await asyncio.sleep(5)
                    continue

                scoreboard_data = await data_cache.get_scoreboard()

                if not scoreboard_data:
                    await asyncio.sleep(8)
                    continue

                standardized_data = scoreboard_data.model_dump()

                async with self._lock:
                    previous_games = copy.deepcopy(self.current_games)
                    self.current_games = standardized_data["scoreboard"]["games"]

                if not self.has_game_data_changed(self.current_games, previous_games):
                    await asyncio.sleep(8)
                    continue

                logger.info(
                    f"Broadcasting score updates for {len(self.current_games)} games"
                )

                disconnected_clients = []
                for connection in list(self.active_connections):
                    try:
                        await connection.send_json(standardized_data)
                    except Exception as e:
                        logger.warning(f"Error sending update to client: {e}")
                        disconnected_clients.append(connection)

                for connection in disconnected_clients:
                    await self.disconnect(connection)

                await asyncio.sleep(8)

            except asyncio.CancelledError:
                logger.info("Scoreboard broadcast cancelled")
                raise
            except Exception as e:
                logger.error(f"Error in scoreboard broadcast: {e}")
                await asyncio.sleep(5)


class PlayByPlayWebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.current_playbyplay: Dict[str, List[Dict]] = {}
        self._lock = asyncio.Lock()
        self.last_update_timestamp: Dict[str, float] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket, game_id: str):
        await websocket.accept()
        logger.info(
            f"New play-by-play client connected: game {game_id}, client {websocket.client}"
        )

        if game_id not in self.active_connections:
            self.active_connections[game_id] = set()

        self.active_connections[game_id].add(websocket)
        await self.send_initial_playbyplay(websocket, game_id)

    def get_connection_count(self) -> int:
        return sum(len(connections) for connections in self.active_connections.values())

    def get_connection_stats(self) -> Dict[str, int]:
        return {
            game_id: len(connections)
            for game_id, connections in self.active_connections.items()
        }

    async def disconnect(self, websocket: WebSocket, game_id: str):
        try:
            if websocket.client_state.name != "DISCONNECTED":
                await websocket.close()
        except Exception:
            pass
        finally:
            if game_id in self.active_connections:
                self.active_connections[game_id].discard(websocket)
                logger.info(f"Client disconnected from play-by-play: game {game_id}")

                if not self.active_connections[game_id]:
                    del self.active_connections[game_id]
                    if game_id in self.current_playbyplay:
                        del self.current_playbyplay[game_id]
                    if game_id in self.last_update_timestamp:
                        self.last_update_timestamp.pop(game_id, None)

    async def send_initial_playbyplay(self, websocket: WebSocket, game_id: str):
        try:
            if (
                game_id not in self.active_connections
                or websocket not in self.active_connections[game_id]
            ):
                return

            playbyplay_data = await data_cache.get_playbyplay(game_id)

            if playbyplay_data:
                plays_data = playbyplay_data.model_dump()
                await websocket.send_json(plays_data)
            else:
                await websocket.send_json({"game_id": game_id, "plays": []})
        except Exception as e:
            error_msg = str(e) if str(e) else type(e).__name__
            logger.warning(
                f"Could not send initial play-by-play for game {game_id}: {error_msg}"
            )
            if game_id in self.active_connections:
                self.active_connections[game_id].discard(websocket)

    def has_playbyplay_changed(
        self, new_data: List[Dict], old_data: List[Dict]
    ) -> bool:
        current_time = time.time()

        new_action_numbers = {play["action_number"] for play in new_data}
        old_action_numbers = {play["action_number"] for play in old_data}

        if new_action_numbers != old_action_numbers:
            if (current_time - self.last_update_timestamp.get("playbyplay", 0)) >= 2.0:
                self.last_update_timestamp["playbyplay"] = current_time
                return True

        return False

    async def broadcast_playbyplay_updates(self):
        logger.info("Play-by-play broadcasting started")

        while True:
            try:
                async with self._lock:
                    for game_id in list(self.active_connections.keys()):
                        if (
                            game_id not in self.active_connections
                            or not self.active_connections[game_id]
                        ):
                            continue

                        playbyplay_data = await data_cache.get_playbyplay(game_id)

                        if not playbyplay_data:
                            continue

                        standardized_data = playbyplay_data.model_dump()

                        previous_playbyplay = copy.deepcopy(
                            self.current_playbyplay.get(game_id, [])
                        )
                        self.current_playbyplay[game_id] = standardized_data["plays"]

                        if not self.has_playbyplay_changed(
                            self.current_playbyplay[game_id], previous_playbyplay
                        ):
                            continue

                        logger.info(
                            f"Broadcasting {len(self.current_playbyplay[game_id])} plays for game {game_id}"
                        )

                        disconnected_clients = []
                        for connection in list(self.active_connections[game_id]):
                            try:
                                await connection.send_json(standardized_data)
                            except Exception as e:
                                logger.warning(
                                    f"Error sending play-by-play update: {e}"
                                )
                                disconnected_clients.append(connection)

                        for connection in disconnected_clients:
                            await self.disconnect(connection, game_id)

                await asyncio.sleep(2)

            except asyncio.CancelledError:
                logger.info("Play-by-play broadcast cancelled")
                raise
            except Exception as e:
                logger.error(f"Error in play-by-play broadcast: {e}")
                await asyncio.sleep(5)

    async def _periodic_cleanup(self):
        logger.info("Play-by-play WebSocket cleanup task started")

        while True:
            try:
                await asyncio.sleep(600)

                current_time = time.time()
                stale_threshold = 3600.0

                stale_keys = [
                    key
                    for key, timestamp in self.last_update_timestamp.items()
                    if current_time - timestamp > stale_threshold
                ]

                for key in stale_keys:
                    self.last_update_timestamp.pop(key, None)

                games_to_remove = [
                    game_id
                    for game_id in self.current_playbyplay.keys()
                    if game_id not in self.active_connections
                    or not self.active_connections.get(game_id)
                ]
                for game_id in games_to_remove:
                    self.current_playbyplay.pop(game_id, None)

                if stale_keys or games_to_remove:
                    logger.debug(
                        f"Cleaned up {len(stale_keys)} stale timestamps, "
                        f"{len(games_to_remove)} inactive games from play-by-play WebSocket manager"
                    )

            except asyncio.CancelledError:
                logger.info("Play-by-play WebSocket cleanup task cancelled")
                raise
            except Exception as e:
                logger.error(f"Error in play-by-play WebSocket cleanup: {e}")
                await asyncio.sleep(60)

    def start_cleanup_task(self):
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
            logger.info("Started play-by-play WebSocket cleanup task")

    async def stop_cleanup_task(self):
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            logger.info("Stopped play-by-play WebSocket cleanup task")


playbyplay_websocket_manager = PlayByPlayWebSocketManager()
scoreboard_websocket_manager = ScoreboardWebSocketManager()
