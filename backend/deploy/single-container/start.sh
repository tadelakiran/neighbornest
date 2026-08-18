#!/usr/bin/env bash
# ============================================================================
# NeighborNest — single-container startup orchestrator
# ============================================================================
# Order of operations (the gateway must come up last, everything else first):
#   1. MySQL  — initialize the data dir on first boot, start it, create the
#               six databases + a root account with MYSQL_PASSWORD.
#   2. Import — if IMPORT_DUMP_PATH points at a mysqldump of the six app
#               databases, load it before any service starts (so Hibernate's
#               ddl-auto=update upgrades, not recreates, the schema).
#   3. RabbitMQ — start it, enable the STOMP plugin, create the app user.
#   4. Services — Eureka first (services register with it), then the six
#               domain services, then the API Gateway in the FOREGROUND on
#               $PORT (Render) or 8080. If the gateway dies the container
#               exits and the platform restarts everything.
#
# Required environment: MYSQL_PASSWORD (all services log into MySQL as root).
# Everything else has a default or a per-service default baked into the
# application.yml files (localhost for MySQL/RabbitMQ/Eureka/STOMP).
# ============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration (with safe defaults — secrets have NO defaults on purpose)
# ---------------------------------------------------------------------------
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD must be set — all services log into MySQL as root with it}"

MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"

RABBITMQ_HOST="${RABBITMQ_HOST:-localhost}"
RABBITMQ_PORT="${RABBITMQ_PORT:-5672}"
RABBITMQ_USER="${RABBITMQ_USER:-neighbornest}"
RABBITMQ_PASSWORD="${RABBITMQ_PASSWORD:-neighbornest}"

STOMP_RELAY_HOST="${STOMP_RELAY_HOST:-localhost}"
STOMP_RELAY_PORT="${STOMP_RELAY_PORT:-61613}"

# Shared JWT secret — the application.yml default is the DEV key; override in
# production (openssl rand -base64 64).
JWT_SECRET="${JWT_SECRET:-VGhpcyBpcyBhIHNlY3JldCBrZXkgZm9yIE5laWdoYm9yTmVzdCBKV1QgdG9rZW4gc2lnbmluZyAtIGRldmVsb3BtZW50IG9ubHk=}"

# Path to a mysqldump (the six app databases) to import on first boot.
IMPORT_DUMP_PATH="${IMPORT_DUMP_PATH:-}"

# JVM memory budget. Defaults match docker-compose.prod.yml. On a 4 GB
# instance override JAVA_TOOL_OPTIONS to something tighter (e.g.
# -Xmx384m -Xms192m -XX:MaxMetaspaceSize=192m) so 8 JVMs + MySQL + RabbitMQ fit.
JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:--Xmx512m -Xms256m -XX:MaxMetaspaceSize=256m}"
JAVA_TOOL_OPTIONS_EUREKA="${JAVA_TOOL_OPTIONS_EUREKA:--Xmx256m -Xms128m -XX:MaxMetaspaceSize=192m}"

MYSQL_SOCKET=/var/run/mysqld/mysqld.sock

log() { echo "[start.sh] $*"; }

ALL_PIDS=()

cleanup() {
  log "shutting down..."
  # Signal every tracked child (the gateway, the domain services, MySQL).
  if [ "${#ALL_PIDS[@]}" -gt 0 ]; then
    kill "${ALL_PIDS[@]}" 2>/dev/null || true
  fi
  rabbitmqctl stop >/dev/null 2>&1 || true
  wait 2>/dev/null || true
  exit 0
}
trap cleanup TERM INT

# ---------------------------------------------------------------------------
# 1. MySQL
# ---------------------------------------------------------------------------
log "Starting MySQL..."
# /var/lib/mysql-files is MySQL 8's default --secure-file-priv directory;
# create it defensively (the -core package leaves it missing) or mysqld aborts.
mkdir -p /var/run/mysqld /var/lib/mysql /var/lib/mysql-files
chown -R mysql:mysql /var/run/mysqld /var/lib/mysql /var/lib/mysql-files

if [ ! -d /var/lib/mysql/mysql ]; then
  log "First boot — initializing MySQL data directory..."
  mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql
fi

mysqld --user=mysql --datadir=/var/lib/mysql \
  --socket="$MYSQL_SOCKET" \
  --pid-file=/var/run/mysqld/mysqld.pid \
  --bind-address=127.0.0.1 &
ALL_PIDS+=("$!")

for _ in $(seq 1 60); do
  if mysqladmin --socket="$MYSQL_SOCKET" -uroot ping >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
log "MySQL accepting connections — creating databases and accounts..."

# root@localhost has an empty password right after --initialize-insecure, so
# this first block runs over the socket without one.
mysql --socket="$MYSQL_SOCKET" -uroot <<SQL
CREATE DATABASE IF NOT EXISTS neighbornest_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS matching_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS nest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS chat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL

# 2. Optional dump import — before any service starts. The file is renamed
#    after a successful import so it is never re-imported on the next boot
#    (a mysqldump DROPs and recreates tables, so re-importing would wipe data).
if [ -n "$IMPORT_DUMP_PATH" ] && [ -f "$IMPORT_DUMP_PATH" ]; then
  log "Importing database dump from $IMPORT_DUMP_PATH ..."
  mysql --socket="$MYSQL_SOCKET" -uroot -p"$MYSQL_PASSWORD" --force < "$IMPORT_DUMP_PATH"
  mv "$IMPORT_DUMP_PATH" "$IMPORT_DUMP_PATH.imported"
  log "Dump imported (file renamed to .imported so it runs once)."
fi

# ---------------------------------------------------------------------------
# 3. RabbitMQ (STOMP plugin for the chat WebSocket relay)
# ---------------------------------------------------------------------------
log "Starting RabbitMQ..."
rabbitmq-server -detached
# Wait for the node to be fully started — `rabbitmq-diagnostics ping` can
# succeed before the user store is writable, which would make add_user below
# fail. await_startup blocks until the broker is truly ready.
for _ in $(seq 1 60); do
  if rabbitmq-diagnostics -q ping >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
rabbitmqctl await_startup
rabbitmq-plugins enable rabbitmq_stomp
# Create (or refresh) the app user. Deliberately NOT silenced with `|| true`:
# a missing user silently breaks chat/notification with ACCESS_REFUSED.
if rabbitmqctl list_users 2>/dev/null | grep -qE "^${RABBITMQ_USER}[[:space:]]"; then
  rabbitmqctl change_password "$RABBITMQ_USER" "$RABBITMQ_PASSWORD"
else
  rabbitmqctl add_user "$RABBITMQ_USER" "$RABBITMQ_PASSWORD"
fi
rabbitmqctl set_permissions -p / "$RABBITMQ_USER" ".*" ".*" ".*"
rabbitmqctl set_user_tags "$RABBITMQ_USER" administrator || true
log "RabbitMQ ready (STOMP enabled on $STOMP_RELAY_PORT)."

# ---------------------------------------------------------------------------
# 4. Environment shared by every service (localhost defaults already match)
# ---------------------------------------------------------------------------
export MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD
export RABBITMQ_HOST RABBITMQ_PORT RABBITMQ_USER RABBITMQ_PASSWORD
export STOMP_RELAY_HOST STOMP_RELAY_PORT
export EUREKA_SERVER_URL="${EUREKA_SERVER_URL:-http://localhost:8761/eureka/}"
export JWT_SECRET

# ---------------------------------------------------------------------------
# 5. Services — Eureka first, then the domain services, then the gateway.
# ---------------------------------------------------------------------------
start_svc() {
  local name="$1"
  local opts="$2"
  shift 2
  (JAVA_TOOL_OPTIONS="$opts" exec java -jar "/app/jars/${name}.jar" "$@") \
    >> "/app/logs/${name}.log" 2>&1 &
  ALL_PIDS+=("$!")
  log "started ${name} (log: /app/logs/${name}.log)"
}

log "Starting Eureka..."
start_svc eureka-service "$JAVA_TOOL_OPTIONS_EUREKA"
for _ in $(seq 1 90); do
  if curl -fsS http://localhost:8761/actuator/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
log "Eureka is up."

log "Starting domain services..."
start_svc auth-service "$JAVA_TOOL_OPTIONS"
start_svc user-service "$JAVA_TOOL_OPTIONS"
start_svc matching-service "$JAVA_TOOL_OPTIONS"
start_svc nest-service "$JAVA_TOOL_OPTIONS"
start_svc chat-service "$JAVA_TOOL_OPTIONS"
start_svc notification-service "$JAVA_TOOL_OPTIONS"

# The gateway is the front door: keep it from routing until every routed
# service is actually healthy (actuator reports UP only once the DB works).
# Otherwise the first minutes after boot hit circuit-breaker 503 fallbacks.
# Same gating the docker-compose stack gets from depends_on + healthchecks.
log "Waiting for domain services to become healthy before starting the gateway..."
for svc in auth-service:8081 user-service:8082 matching-service:8083 nest-service:8084 chat-service:8085 notification-service:8086; do
  name="${svc%%:*}"
  port="${svc##*:}"
  healthy=""
  for _ in $(seq 1 120); do
    if curl -fsS "http://localhost:${port}/actuator/health" >/dev/null 2>&1; then
      healthy=1
      break
    fi
    sleep 5
  done
  if [ -n "$healthy" ]; then
    log "${name} is healthy."
  else
    log "WARNING: ${name} did not report healthy within 10 minutes — starting the gateway anyway."
  fi
done

# The gateway is the front door: bring it up last, in the foreground, on the
# port the platform expects ($PORT on Render, 8080 elsewhere).
GATEWAY_PORT="${PORT:-8080}"
log "Starting API Gateway on port ${GATEWAY_PORT}..."
(JAVA_TOOL_OPTIONS="$JAVA_TOOL_OPTIONS" exec java -jar /app/jars/api-gateway.jar --server.port="${GATEWAY_PORT}") \
  >> /app/logs/api-gateway.log 2>&1 &
GW_PID=$!
ALL_PIDS+=("$GW_PID")

log "All services started — the container stays alive with the gateway."
wait "$GW_PID"
