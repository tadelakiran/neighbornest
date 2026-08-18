# ============================================================================
# NeighborNest — single-container image
# ============================================================================
# Builds ALL eight microservices plus MySQL 8 and RabbitMQ into ONE image so
# the whole backend runs as a single container (one URL, one health check).
#
#   docker build -f backend/deploy/single-container/Dockerfile -t neighbornest backend
#
# Works on:
#   * Render (Web Service, Docker runtime — REQUIRES a paid Standard instance,
#     see render.yaml in this folder; the free tier is too small and has no
#     persistent disk).
#   * Any VM/VPS with Docker (free Oracle Cloud VM, Hetzner, Linode, ...) with
#     a volume mounted at /var/lib for MySQL/RabbitMQ data.
#
# Everything talks over localhost inside the container — every service already
# defaults to localhost for Eureka, MySQL, RabbitMQ and the STOMP relay, so no
# application code or configuration is changed.
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1 — build all service jars with Maven
# ----------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
# Copy every module's POM so Maven can resolve the full reactor (the parent
# POM hard-fails if any sibling pom is missing from the build context).
COPY eureka-service/pom.xml eureka-service/pom.xml
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY user-service/pom.xml user-service/pom.xml
COPY matching-service/pom.xml matching-service/pom.xml
COPY nest-service/pom.xml nest-service/pom.xml
COPY chat-service/pom.xml chat-service/pom.xml
COPY notification-service/pom.xml notification-service/pom.xml
# The retry loop absorbs flaky Maven Central connections.
RUN sh -c 'for i in 1 2 3 4 5; do mvn -q dependency:go-offline -B -U && exit 0 || echo "go-offline attempt $i failed, retrying..."; done; echo "go-offline failed after 5 attempts"; exit 1'
COPY eureka-service/src eureka-service/src
COPY api-gateway/src api-gateway/src
COPY auth-service/src auth-service/src
COPY user-service/src user-service/src
COPY matching-service/src matching-service/src
COPY nest-service/src nest-service/src
COPY chat-service/src chat-service/src
COPY notification-service/src notification-service/src
RUN sh -c 'for i in 1 2 3; do mvn -q clean package -DskipTests -B && exit 0 || echo "package attempt $i failed, retrying..."; done; echo "package failed after 3 attempts"; exit 1'

# ----------------------------------------------------------------------------
# Stage 2 — runtime: JRE + MySQL 8 + RabbitMQ + all jars
# ----------------------------------------------------------------------------
FROM eclipse-temurin:17-jammy

# policy-rc.d suppresses service auto-starts during package installs (no
# systemd inside the container); services are started by start.sh instead.
RUN printf '#!/bin/sh\nexit 101\n' > /usr/sbin/policy-rc.d \
    && chmod +x /usr/sbin/policy-rc.d \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
         mysql-server-core-8.0 \
         mysql-client-core-8.0 \
         rabbitmq-server \
         curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /usr/sbin/policy-rc.d

# mysql-server-core does not ship the system user (that is mysql-server-8.0's
# maintainer script) — create it so mysqld can drop privileges. Also create
# /var/lib/mysql-files (MySQL 8's default --secure-file-priv dir) which the
# -core package leaves missing; mysqld aborts at startup without it.
RUN useradd --system --home-dir /var/lib/mysql --shell /usr/sbin/nologin mysql \
    && mkdir -p /var/run/mysqld /var/lib/mysql-files /app/jars /app/logs \
    && chown mysql:mysql /var/run/mysqld /var/lib/mysql-files \
    && chmod +x /usr/sbin/rabbitmq-server

WORKDIR /app

# All eight jars built in stage 1.
COPY --from=builder /build/eureka-service/target/eureka-service.jar /app/jars/
COPY --from=builder /build/api-gateway/target/api-gateway.jar /app/jars/
COPY --from=builder /build/auth-service/target/auth-service.jar /app/jars/
COPY --from=builder /build/user-service/target/user-service.jar /app/jars/
COPY --from=builder /build/matching-service/target/matching-service.jar /app/jars/
COPY --from=builder /build/nest-service/target/nest-service.jar /app/jars/
COPY --from=builder /build/chat-service/target/chat-service.jar /app/jars/
COPY --from=builder /build/notification-service/target/notification-service.jar /app/jars/

COPY deploy/single-container/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# The API Gateway binds to $PORT (Render injects it) or 8080 elsewhere.
EXPOSE 8080

CMD ["/app/start.sh"]
