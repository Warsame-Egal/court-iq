"""
Application-wide constants for NBA Tracker API.

Game status values match the NBA API scoreboard response (gameStatus field).
"""

# Game status (NBA API scoreboard gameStatus)
GAME_STATUS_SCHEDULED = 1
GAME_STATUS_LIVE = 2  # In Progress
GAME_STATUS_FINAL = 3

# NBA API rate limiting (used by rate_limiter and health)
NBA_API_MIN_DELAY_SECONDS = 0.6  # 600ms between calls
