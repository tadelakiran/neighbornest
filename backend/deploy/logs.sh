#!/usr/bin/env bash
# NeighborNest — production stack logs/status helper.
#
#   bash backend/deploy/logs.sh           # status of all services
#   bash backend/deploy/logs.sh auth-service   # tail logs of one service
#   bash backend/deploy/logs.sh --all     # tail logs of every service
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$BACKEND_DIR/.env.prod"

cd "$BACKEND_DIR"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f docker-compose.yml -f docker-compose.prod.yml)

if [ $# -eq 0 ]; then
  "${COMPOSE[@]}" ps
elif [ "$1" = "--all" ]; then
  "${COMPOSE[@]}" logs -f --tail=100
else
  "${COMPOSE[@]}" logs -f --tail=200 "$1"
fi
