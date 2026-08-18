#!/usr/bin/env bash
# ============================================================================
# NeighborNest — one-time Oracle Cloud Always Free VM setup
# ============================================================================
# Run ONCE on a fresh Ubuntu 22.04/24.04 VM:
#
#   bash backend/deploy/setup_vm.sh
#
# Installs Docker Engine + Compose plugin (required to run the stack) and
# creates a 4 GB swap file as headroom for the 8 JVM services + first build.
# Idempotent — safe to re-run.
# ============================================================================
set -euo pipefail

log()  { echo -e "\033[1;32m[setup]\033[0m $*"; }
warn() { echo -e "\033[1;33m[setup]\033[0m $*"; }

# ---------------------------------------------------------------------------
# 1. Docker Engine + Compose plugin (Ubuntu/Debian)
# ---------------------------------------------------------------------------
if command -v docker >/dev/null 2>&1; then
  log "Docker already installed ($(docker --version))."
else
  log "Installing Docker Engine + Compose plugin..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg
  sudo apt-get install -y curl  # used by deploy.sh as a health probe
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  # shellcheck disable=SC1091
  . /etc/os-release
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
     https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  log "Docker installed."
fi

if ! docker compose version >/dev/null 2>&1; then
  warn "docker compose plugin missing — install it manually, or the deploy will fail."
else
  log "Compose plugin: $(docker compose version --short)"
fi

# Allow the current user to run docker without sudo.
if ! groups "$USER" | grep -q docker; then
  log "Adding $USER to the 'docker' group (re-login may be required)."
  sudo usermod -aG docker "$USER"
fi

# ---------------------------------------------------------------------------
# 2. Swap file (4 GB) — cheap insurance for JVM overhead + the first Maven build
# ---------------------------------------------------------------------------
if ! swapon --show | grep -q swap; then
  log "Creating a 4 GB swap file..."
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
else
  log "Swap already enabled: $(swapon --show --noheadings | awk '{print $1}')"
fi

# ---------------------------------------------------------------------------
# 3. Next steps
# ---------------------------------------------------------------------------
echo
log "VM setup complete."
cat <<'EOF'

Next steps:
  1. Create backend/.env.prod (secrets):
       cp backend/deploy/.env.prod.example backend/.env.prod
       # generate secrets:
       #   openssl rand -base64 64   -> JWT_SECRET
       #   openssl rand -hex 16      -> MYSQL_PASSWORD and INTERNAL_API_KEY
       # then set API_DOMAIN (DuckDNS), CORS_ALLOWED_ORIGINS and
       # NOTIFICATION_BASE_URL (Vercel app URL).

  2. Build & start the stack (first build downloads Maven deps — 20-60 min):
       bash backend/deploy/deploy.sh

  3. Watch it come up:
       docker compose --env-file backend/.env.prod -f backend/docker-compose.yml \
         -f backend/docker-compose.prod.yml ps

  4. Open the Oracle VCN security list for ports 80 (HTTP) and 443 (HTTPS)
     so Caddy can serve the Let's Encrypt challenge and the API.
EOF
