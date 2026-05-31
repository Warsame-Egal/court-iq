#!/usr/bin/env bash
# Run on the GCP VM (manually or via GitHub Actions SSH).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Match GitHub exactly (handles force-pushes; VM is deploy-only, not a dev clone).
git fetch origin main
git reset --hard origin/main

docker compose -f docker-compose.prod.yml up -d --build

echo "Deploy finished: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
