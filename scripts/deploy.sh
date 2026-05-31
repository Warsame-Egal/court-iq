#!/usr/bin/env bash
# Run on the GCP VM (manually or via GitHub Actions SSH).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

git pull --ff-only origin main
docker compose -f docker-compose.prod.yml up -d --build

echo "Deploy finished: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
