#!/bin/bash
set -e

# Patch nba_api in site-packages (needs write access — run before dropping privileges)
if [ -f /app/patch_scoreboard.py ]; then
    python3 /app/patch_scoreboard.py || echo "Warning: scoreboard patch failed"
fi

if [ -n "$NBA_API_PROXY" ] && [ -f /app/patch_http.py ]; then
    python3 /app/patch_http.py || echo "Warning: http proxy patch failed"
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
