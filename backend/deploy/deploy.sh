#!/usr/bin/env bash
# ============================================================================
# NeighborNest — build & deploy the production stack (Oracle free VM)
# ============================================================================
# Run from anywhere; resolves paths relative to this script:
#
#   bash backend/deploy/deploy.sh
#
# - Creates backend/.env.prod automatically on first run (secrets generated,
#   URL variables left blank for you to fill in).
# - Validates the compose config, then builds each image SEQUENTIALLY
#   (parallel Maven builds can OOM the free VM), starts everything, and waits
#   for the gateway to report healthy.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$BACKEND_DIR/.env.prod"
BASE_COMPOSE="$BACKEND_DIR/docker-compose.yml"
PROD_COMPOSE="$BACKEND_DIR/docker-compose.prod.yml"

# Services that build from a Dockerfile (mysql/caddy are images only).
BUILD_SERVICES=(eureka-service auth-service user-service matching-service nest-service chat-service notification-service api-gateway)

log()  { echo -e "\033[1;32m[deploy]\033[0m $*"; }
warn() { echo -e "\033[1;33m[deploy]\033[0m $*"; }
die()  { echo -e "\033[1;31m[deploy]\033[0m $*" >&2; exit 1; }

cd "$BACKEND_DIR"

# ---------------------------------------------------------------------------
# 1. .env.prod — create with generated secrets if missing
# ---------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  log "No .env.prod found — creating it with generated secrets."
  cp "$SCRIPT_DIR/.env.prod.example" "$ENV_FILE"
  gen() { openssl rand -hex 16; }
  sed -i "s/^MYSQL_PASSWORD=$/MYSQL_PASSWORD=$(gen)/" "$ENV_FILE"
  sed -i "s|^JWT_SECRET=$|JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')|" "$ENV_FILE"
  sed -i "s/^INTERNAL_API_KEY=$/INTERNAL_API_KEY=$(gen)/" "$ENV_FILE"
  warn "Fill in API_DOMAIN, CORS_ALLOWED_ORIGINS and NOTIFICATION_BASE_URL in $ENV_FILE, then re-run."
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Validate required variables
# ---------------------------------------------------------------------------
missing=0
for var in API_DOMAIN MYSQL_PASSWORD JWT_SECRET INTERNAL_API_KEY CORS_ALLOWED_ORIGINS NOTIFICATION_BASE_URL; do
  if ! grep -qE "^${var}=.+" "$ENV_FILE"; then
    warn "Missing variable: ${var} (set it in $ENV_FILE)"
    missing=1
  fi
done
[ "$missing" -eq 0 ] || die "Fix the variables above, then re-run."

# ---------------------------------------------------------------------------
# 3. Validate the merged compose config
# ---------------------------------------------------------------------------
log "Validating compose configuration..."
docker compose --env-file "$ENV_FILE" -f "$BASE_COMPOSE" -f "$PROD_COMPOSE" config -q \
  || die "docker compose config failed — fix the error above."

# ---------------------------------------------------------------------------
# 4. Build images sequentially (parallel Maven builds can OOM the free VM)
# ---------------------------------------------------------------------------
log "Building ${#BUILD_SERVICES[@]} service images sequentially (first run is slow)..."
for svc in "${BUILD_SERVICES[@]}"; do
  log "Building $svc..."
  docker compose --env-file "$ENV_FILE" -f "$BASE_COMPOSE" -f "$PROD_COMPOSE" build "$svc"
done

# ---------------------------------------------------------------------------
# 5. Start the stack
# ---------------------------------------------------------------------------
log "Starting the stack..."
docker compose --env-file "$ENV_FILE" -f "$BASE_COMPOSE" -f "$PROD_COMPOSE" up -d --no-build

# ---------------------------------------------------------------------------
# 6. Wait for the API gateway to become healthy
# ---------------------------------------------------------------------------
log "Waiting for the API gateway to become healthy (cold JVM boot can take a few minutes)..."
# Loopback-only gateway port (see docker-compose.yml) + the actuator health
# endpoint = a simple, robust readiness probe from the VM host.
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8080/actuator/health 2>/dev/null | grep -q '"UP"'; then
    log "API gateway is healthy — deployment complete!"
    break
  fi
  sleep 10
done

echo
log "Stack status:"
docker compose --env-file "$ENV_FILE" -f "$BASE_COMPOSE" -f "$PROD_COMPOSE" ps

echo
log "API is live at https://$(grep '^API_DOMAIN=' "$ENV_FILE" | cut -d= -f2)"
log "Health check: curl -s https://$(grep '^API_DOMAIN=' "$ENV_FILE" | cut -d= -f2)/actuator/health"
log "Troubleshoot with: bash $SCRIPT_DIR/logs.sh"
