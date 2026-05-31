"""
Application-wide constants for NBA Tracker API.

Game status values match the NBA API scoreboard response (gameStatus field).
"""

# Game status (NBA API scoreboard gameStatus)
GAME_STATUS_SCHEDULED = 1
GAME_STATUS_LIVE = 2  # In Progress
GAME_STATUS_FINAL = 3

# Live data cache (scoreboard / play-by-play polling)
CACHE_CLEANUP_INTERVAL_SECONDS = 300  # 5 minutes
CACHE_PLAYBYPLAY_TIMEOUT_SECONDS = 10.0
SCOREBOARD_POLL_INTERVAL_SECONDS = 8
PLAYBYPLAY_POLL_INTERVAL_SECONDS = 5

# NBA API rate limiting (used by rate_limiter and health)
NBA_API_MIN_DELAY_SECONDS = 0.6  # 600ms between calls
