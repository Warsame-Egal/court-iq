# Throttles NBA API calls to avoid getting rate limited.
# Waits at least 600ms between calls as recommended by nba_api.

import asyncio
import logging
import time
from typing import Optional

from app.constants import NBA_API_MIN_DELAY_SECONDS

logger = logging.getLogger(__name__)

_last_call_time: Optional[float] = None
_lock = asyncio.Lock()
_min_delay_seconds = NBA_API_MIN_DELAY_SECONDS


async def rate_limit():
    # Wait if less than 600ms has passed since the last NBA API call.
    async with _lock:
        global _last_call_time

        current_time = time.time()

        if _last_call_time is not None:
            time_since_last_call = current_time - _last_call_time

            if time_since_last_call < _min_delay_seconds:
                delay = _min_delay_seconds - time_since_last_call
                await asyncio.sleep(delay)

        _last_call_time = time.time()


async def safe_api_call(coro, timeout: float = 10.0, max_retries: int = 2):
    # Make an NBA API call with rate limiting, timeout, and retries.
    await rate_limit()

    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            result = await asyncio.wait_for(coro, timeout=timeout)
            return result
        except asyncio.TimeoutError as e:
            last_exception = e
            if attempt < max_retries:
                wait_time = (attempt + 1) * 2.0
                logger.warning(
                    f"API call timed out (attempt {attempt + 1}/{max_retries + 1}), retrying in {wait_time}s..."
                )
                await asyncio.sleep(wait_time)
                await rate_limit()
            else:
                logger.error(f"API call timed out after {max_retries + 1} attempts")
        except Exception as e:
            logger.error(f"API call failed: {e}")
            raise

    raise last_exception
