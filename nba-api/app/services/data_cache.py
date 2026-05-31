# Live data only: background polling for scoreboard and play-by-play.
# WebSockets and GET /scoreboard/today read from this cache.

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional, Set

from app.constants import (
    CACHE_CLEANUP_INTERVAL_SECONDS,
    CACHE_PLAYBYPLAY_TIMEOUT_SECONDS,
    GAME_STATUS_FINAL,
    GAME_STATUS_LIVE,
    PLAYBYPLAY_POLL_INTERVAL_SECONDS,
    SCOREBOARD_POLL_INTERVAL_SECONDS,
)
from app.schemas.scoreboard import PlayByPlayResponse, ScoreboardResponse
from app.services.scoreboard import getPlayByPlay, getScoreboard

logger = logging.getLogger(__name__)


class DataCache:
    def __init__(self):
        self._scoreboard_cache: Optional[ScoreboardResponse] = None
        self._scoreboard_last_updated: float = 0.0
        self._playbyplay_cache: Dict[str, PlayByPlayResponse] = {}
        self._playbyplay_timestamps: Dict[str, float] = {}
        self._lock = asyncio.Lock()
        self._active_game_ids: Set[str] = set()

        self.SCOREBOARD_POLL_INTERVAL = SCOREBOARD_POLL_INTERVAL_SECONDS
        self.PLAYBYPLAY_POLL_INTERVAL = PLAYBYPLAY_POLL_INTERVAL_SECONDS
        self.CLEANUP_INTERVAL = CACHE_CLEANUP_INTERVAL_SECONDS

        self._scoreboard_task: Optional[asyncio.Task] = None
        self._playbyplay_task: Optional[asyncio.Task] = None
        self._cleanup_task: Optional[asyncio.Task] = None

    async def get_scoreboard(self) -> Optional[ScoreboardResponse]:
        async with self._lock:
            return self._scoreboard_cache

    async def get_playbyplay(self, game_id: str) -> Optional[PlayByPlayResponse]:
        async with self._lock:
            return self._playbyplay_cache.get(game_id)

    def _remove_playbyplay(self, game_id: str) -> None:
        self._playbyplay_cache.pop(game_id, None)
        self._playbyplay_timestamps.pop(game_id, None)

    def _set_playbyplay(self, game_id: str, value: PlayByPlayResponse) -> None:
        self._playbyplay_cache[game_id] = value
        self._playbyplay_timestamps[game_id] = time.time()

    def _clear_old_playbyplay(self, max_age_seconds: float) -> int:
        current_time = time.time()
        keys_to_remove = [
            key
            for key, timestamp in self._playbyplay_timestamps.items()
            if current_time - timestamp > max_age_seconds
        ]
        for key in keys_to_remove:
            self._remove_playbyplay(key)
        return len(keys_to_remove)

    async def _cleanup_finished_games(self) -> None:
        async with self._lock:
            scoreboard_data = self._scoreboard_cache
            if not scoreboard_data or not scoreboard_data.scoreboard:
                return

            finished_game_ids = [
                game.gameId
                for game in scoreboard_data.scoreboard.games
                if game.gameStatus == GAME_STATUS_FINAL
            ]

            removed_count = 0
            for game_id in finished_game_ids:
                if game_id in self._playbyplay_cache:
                    self._remove_playbyplay(game_id)
                    removed_count += 1
                self._active_game_ids.discard(game_id)

            if removed_count > 0:
                logger.info(
                    f"Cleaned up {removed_count} finished games from play-by-play cache"
                )

    async def _periodic_cleanup(self) -> None:
        logger.info("Periodic cache cleanup started")

        while True:
            try:
                await asyncio.sleep(self.CLEANUP_INTERVAL)
                await self._cleanup_finished_games()

                async with self._lock:
                    removed = self._clear_old_playbyplay(max_age_seconds=86400)
                    if removed > 0:
                        logger.info(
                            f"Removed {removed} old games from play-by-play cache"
                        )

            except asyncio.CancelledError:
                logger.info("Periodic cache cleanup cancelled")
                raise
            except Exception as e:
                logger.error(f"Error in periodic cache cleanup: {e}")
                await asyncio.sleep(60)

    def _get_next_poll_interval(self) -> float:
        """Slow down polling when there are no live games."""
        if not self._scoreboard_cache or not self._scoreboard_cache.scoreboard:
            return 900.0  # 15 min — off-season or failed fetch

        games = self._scoreboard_cache.scoreboard.games
        if not games:
            return 900.0  # no games today

        statuses = {game.gameStatus for game in games}

        if GAME_STATUS_LIVE in statuses:
            return float(self.SCOREBOARD_POLL_INTERVAL)  # 8s — live action

        if all(s == GAME_STATUS_FINAL for s in statuses):
            return 300.0  # all done for today

        return 60.0  # games scheduled later today

    async def _poll_scoreboard(self) -> None:
        logger.info("Scoreboard polling started")

        while True:
            try:
                try:
                    scoreboard_data = await asyncio.wait_for(
                        getScoreboard(), timeout=50.0
                    )

                    async with self._lock:
                        old_active_games = self._active_game_ids.copy()
                        self._scoreboard_cache = scoreboard_data
                        self._scoreboard_last_updated = time.time()

                        if scoreboard_data and scoreboard_data.scoreboard:
                            active_games = [
                                game.gameId
                                for game in scoreboard_data.scoreboard.games
                                if game.gameStatus == GAME_STATUS_LIVE
                            ]
                            self._active_game_ids = set(active_games)

                            finished_games = old_active_games - self._active_game_ids
                            if finished_games:
                                for game_id in finished_games:
                                    self._remove_playbyplay(game_id)

                except asyncio.TimeoutError:
                    logger.warning("Timeout fetching scoreboard, will retry")
                except Exception as e:
                    logger.warning("Error fetching scoreboard: %s, will retry", e)

                interval = self._get_next_poll_interval()
                games = (
                    self._scoreboard_cache.scoreboard.games
                    if self._scoreboard_cache and self._scoreboard_cache.scoreboard
                    else []
                )
                if not games:
                    logger.info("No NBA games today — polling at %.0fs interval", interval)
                logger.debug("Next scoreboard poll in %.0fs", interval)
                await asyncio.sleep(interval)

            except asyncio.CancelledError:
                logger.info("Scoreboard polling cancelled")
                raise
            except Exception as e:
                logger.error(f"Unexpected error in scoreboard polling: {e}")
                await asyncio.sleep(5)

    async def _poll_playbyplay(self) -> None:
        logger.info("Play-by-play polling started")

        while True:
            try:
                await self._cleanup_finished_games()

                async with self._lock:
                    games_to_poll = list(self._active_game_ids)

                for game_id in games_to_poll:
                    async with self._lock:
                        scoreboard_data = self._scoreboard_cache
                        if scoreboard_data and scoreboard_data.scoreboard:
                            game = next(
                                (
                                    g
                                    for g in scoreboard_data.scoreboard.games
                                    if g.gameId == game_id
                                ),
                                None,
                            )
                            if not game or game.gameStatus != GAME_STATUS_LIVE:
                                self._remove_playbyplay(game_id)
                                self._active_game_ids.discard(game_id)
                                continue

                    try:
                        playbyplay_data = await asyncio.wait_for(
                            getPlayByPlay(game_id),
                            timeout=CACHE_PLAYBYPLAY_TIMEOUT_SECONDS,
                        )

                        async with self._lock:
                            scoreboard_data = self._scoreboard_cache
                            if scoreboard_data and scoreboard_data.scoreboard:
                                game = next(
                                    (
                                        g
                                        for g in scoreboard_data.scoreboard.games
                                        if g.gameId == game_id
                                    ),
                                    None,
                                )
                                if game and game.gameStatus == GAME_STATUS_LIVE:
                                    self._set_playbyplay(game_id, playbyplay_data)

                    except asyncio.TimeoutError:
                        logger.debug(
                            f"Timeout fetching play-by-play for game {game_id}"
                        )
                    except Exception as e:
                        logger.debug(
                            f"Error fetching play-by-play for game {game_id}: {e}"
                        )

                    await asyncio.sleep(0.5)

                await asyncio.sleep(self.PLAYBYPLAY_POLL_INTERVAL)

            except asyncio.CancelledError:
                logger.info("Play-by-play polling cancelled")
                raise
            except Exception as e:
                logger.error(f"Unexpected error in play-by-play polling: {e}")
                await asyncio.sleep(5)

    def get_health_stats(self) -> Dict[str, Any]:
        try:
            return {
                "scoreboard_cached": self._scoreboard_cache is not None,
                "scoreboard_age_seconds": (
                    round(time.time() - self._scoreboard_last_updated, 1)
                    if self._scoreboard_last_updated
                    else None
                ),
                "playbyplay_games_cached": len(self._playbyplay_cache),
                "active_games_tracked": len(self._active_game_ids),
                "scoreboard_task_running": self._scoreboard_task is not None
                and not self._scoreboard_task.done(),
                "playbyplay_task_running": self._playbyplay_task is not None
                and not self._playbyplay_task.done(),
            }
        except Exception:
            return {
                "scoreboard_cached": False,
                "scoreboard_age_seconds": None,
                "playbyplay_games_cached": 0,
                "active_games_tracked": 0,
                "scoreboard_task_running": False,
                "playbyplay_task_running": False,
            }

    def start_polling(self) -> None:
        if self._scoreboard_task is None or self._scoreboard_task.done():
            self._scoreboard_task = asyncio.create_task(self._poll_scoreboard())

        if self._playbyplay_task is None or self._playbyplay_task.done():
            self._playbyplay_task = asyncio.create_task(self._poll_playbyplay())

        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())

    async def stop_polling(self) -> None:
        logger.info("Stopping data cache polling...")

        for task in (self._scoreboard_task, self._playbyplay_task, self._cleanup_task):
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass


data_cache = DataCache()
