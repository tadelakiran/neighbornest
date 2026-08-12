# 🏘️ NeighborNest

**NeighborNest** — A platform that matches newcomers to a city into small curated groups (*Nests*) with local *Anchors* to form authentic friendships.

This repository contains the backend microservices for the NeighborNest platform.

---

## 🧱 Architecture

```
┌──────────────────────────────────────────────────────┐
│                  API Gateway                         │  (Spring Cloud Gateway — port 8080)
└───┬──────────┬──────────┬──────────┬──────────┬──────┘
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  Auth    │ │  User    │ │ Matching │ │   Nest   │ │  Chat + Notif │
│ Service  │ │ Service  │ │ Service  │ │ Service  │ │ (8085 / 8086) │
│ (8081)   │ │ (8082)   │ │ (8083)   │ │ (8084)   │ │  (WebSocket)  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘
     │             │  ▲         │  ▲         │  ▲        │
     └─────────────┴──┴─────────┴──┴─────────┴──┴────────┘
              Feign (service-to-service) · STOMP over RabbitMQ
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│            Eureka Service Discovery                 │  (port 8761)
│            RabbitMQ (events + STOMP, 5672/15672/61613) │
│   MySQL (single local instance on 3306 — see below) │
└──────────────────────────────────────────────────────┘
```

### Services

| Service           | Port | Description                                       | DB                |
|-------------------|------|---------------------------------------------------|-------------------|
| **Eureka**        | 8761 | Service Discovery (Netflix Eureka)                | —                 |
| **API Gateway**   | 8080 | Spring Cloud Gateway, routes + circuit breakers   | —                 |
| **Auth Service**  | 8081 | Authentication, JWT, users                        | neighbornest_auth |
| **User Service**  | 8082 | Profiles, onboarding, anchor applications         | user_db           |
| **Matching Service** | 8083 | Compatibility engine, Nest proposals           | matching_db       |
| **Nest Service**  | 8084 | Nest lifecycle, meetings, expenses, vibe checks   | nest_db           |
| **Chat Service**  | 8085 | Group + DM chat (STOMP WebSocket, RabbitMQ relay) | chat_db           |
| **Notification Service** | 8086 | Inbox, preferences, emails, event listeners  | notification_db   |

### Cross-service communication

- **Feign (OpenFeign + Resilience4j)** — synchronous calls with fallback factories:
  - `user-service → auth-service` (token ownership validation)
  - `matching-service → user-service` (match-ready users + onboarding answers)
  - `matching-service → nest-service` (create Nest after proposal acceptance)
  - `nest-service → user-service` (member profile display names)
  - `chat-service → user-service` + `nest-service` (sender names, membership checks)
  - `notification-service → user-service` + `nest-service` (recipient resolution)
- **RabbitMQ** — asynchronous events on the `nest.events` topic exchange:
  - `nest.created` / `nest.graduated` — Nest lifecycle (chat SYSTEM messages, welcome emails)
  - `chat.message.sent` — published by chat-service after every message; the
    notification-service fans out per-recipient in-app notifications (DMs → the
    other participant; group messages → every other active Nest member)
- **Chat WebSockets** — SockJS + STOMP via the gateway at `/ws/chat`, relayed to
  RabbitMQ's STOMP plugin (port 61613). Broker destinations are dot-separated
  because the RabbitMQ STOMP plugin rejects slashes in routing keys:
  - group room: `/topic/nest.{nestId}.messages` / `.typing`
  - private queue: `/queue/user.{profileId}.dm` / `.typing`

---

## 🚀 Prerequisites

- **Java 17+**
- **Maven 3.9+**
- **MySQL 8+** (or Docker)
- **RabbitMQ 3.x** (or Docker) — required by matching-service and nest-service
- **Docker** (optional, recommended for full-stack bring-up)

---

## 🐳 Quick Start (Docker Compose)

**Databases are NOT dockerized.** All services share a single local MySQL on
`localhost:3306` so the data is easy to inspect with any SQL client. Containers
reach it via `host.docker.internal`.

### 1. One-time MySQL setup (run as a MySQL admin)

```bash
mysqlsh --sql --uri=root@localhost:3306 -f backend/scripts/setup_local_mysql.sql
# (or run backend/scripts/setup_local_mysql.sql from Workbench / any client)
```

This creates the six databases (`neighbornest_auth`, `user_db`, `matching_db`,
`nest_db`, `chat_db`, `notification_db`) and the `neighbornest` user the Docker
containers authenticate as.

### 2. Bring up the stack

```bash
docker compose up --build
```

This starts RabbitMQ (`5672` AMQP, `15672` console, `61613` STOMP — user/pass
`neighbornest`/`neighbornest` by default) and all 8 services (Eureka `8761`,
Gateway `8080`, auth `8081`, user `8082`, matching `8083`, nest `8084`,
chat `8085`, notification `8086`).

Customize credentials with environment variables, e.g.:

```bash
MYSQL_ROOT_PASSWORD=secret JWT_SECRET=$(openssl rand -base64 64) docker compose up --build
```

### Credentials via `.env` (recommended)

Create a `backend/.env` file (docker-compose reads it automatically). It is git-ignored so your
password never gets committed:

```bash
# backend/.env
MYSQL_USER=root
MYSQL_ROOT_PASSWORD=your-mysql-root-password
MYSQL_PASSWORD=your-mysql-root-password
RABBITMQ_USER=neighbornest
RABBITMQ_PASSWORD=neighbornest
JWT_SECRET=VGhpcyBpcyBhIHNlY3JldCBrZXkgZm9yIE5laWdoYm9yTmVzdCBKV1QgdG9rZW4gc2lnbmluZyAtIGRldmVsb3BtZW50IG9ubHk=
```

`MYSQL_USER`/`MYSQL_PASSWORD` are the credentials the containers use against the
local MySQL (default `neighbornest` / the root password from `.env`).

---

## ⚙️ Configuration

Each service has its own `application.yml`. Key properties to customize:

**All services**
- `eureka.client.service-url.defaultZone` — Eureka URL (`EUREKA_SERVER_URL` env var)

**Auth Service** (`auth-service/src/main/resources/application.yml`)
- `spring.datasource.url` — MySQL connection string (`neighbornest_auth` / port 3306)
- `app.jwt.secret` — Base64-encoded secret shared by ALL services (`JWT_SECRET` env var)

**User Service** (`user-service/.../application.yml`)
- `spring.datasource.url` — defaults to `localhost:3307/user_db` (set `MYSQL_HOST`, `MYSQL_PORT`, `DB_NAME` for Docker)

**Matching Service** (`matching-service/.../application.yml`)
- `app.matching.top-n` — number of top compatible users (default 20)
- `app.matching.proposal-expiry-hours` — proposal validity (default 72h)
- `app.matching.weights.{values,lifestyle,interest}` — scoring weights (40/35/25)

**Nest Service** (`nest-service/.../application.yml`)
- `app.nest.event-exchange` / `created-routing-key` / `graduated-routing-key` — RabbitMQ bindings

---

## 🏃 Running Locally (manual)

### 1. Infrastructure

```bash
# MySQL databases — one shared local instance, six databases
mysqlsh --sql --uri=root@localhost:3306 -f backend/scripts/setup_local_mysql.sql

# RabbitMQ (via Docker) — note the STOMP plugin port
# The docker-compose `rabbitmq` service already does this; for a standalone broker:
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 -p 61613:61613 rabbitmq:3-management
```

> **All six databases live on one MySQL instance.** Every service defaults to
> `MYSQL_HOST=localhost`, `MYSQL_PORT=3306`, with its own database name
> (`user_db`, `matching_db`, `nest_db`, `chat_db`, `notification_db`, `neighbornest_auth`).
> Run them from the IDE with `MYSQL_PORT=3306` and the credentials from `backend/.env`.

### 2. Services — startup order matters

```bash
# 1. Eureka (service discovery)
cd eureka-service && mvn spring-boot:run

# 2. Auth Service
cd ../auth-service && mvn spring-boot:run

# 3. User Service
cd ../user-service && mvn spring-boot:run

# 4. Matching Service
cd ../matching-service && mvn spring-boot:run

# 5. Nest Service
cd ../nest-service && mvn spring-boot:run

# 6. API Gateway (last — routes to everything)
cd ../api-gateway && mvn spring-boot:run
```

Or build & run everything:

```bash
mvn clean package -DskipTests
java -jar eureka-service/target/eureka-service.jar
# ...and so on for each service
```

---

## 🧪 Running Tests

```bash
# All services
mvn test

# Individual services
cd auth-service && mvn test
cd user-service && mvn test
cd matching-service && mvn test
cd nest-service && mvn test
```

Coverage highlights:
- `matching-service`: `ScoringEngineTest` (dimension scoring, weights, dealbreakers), `MatchingAlgorithmServiceTest`
- `nest-service`: `NestServiceTest` (creation, graduation, disband, event publishing)

---

## 📖 API Documentation (Swagger)

| Service          | Swagger URL                                        |
|------------------|----------------------------------------------------|
| Auth Service     | http://localhost:8081/swagger-ui/index.html        |
| User Service     | http://localhost:8082/swagger-ui/index.html        |
| Matching Service | http://localhost:8083/swagger-ui/index.html        |
| Nest Service     | http://localhost:8084/swagger-ui/index.html        |
| API Gateway      | http://localhost:8080/swagger-ui/index.html         |

All domain-service endpoints require a `Bearer` token (see the auth flow below).

---

## 🔐 API Endpoints

### Auth Service — Public (`/api/auth/**`)

| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| POST   | `/api/auth/register` | Register new user    |
| POST   | `/api/auth/login`    | Login, get tokens    |
| POST   | `/api/auth/refresh`  | Refresh access token |

### User Service — Protected (`/api/users/**`)

| Method | Endpoint                         | Description                                     |
|--------|----------------------------------|-------------------------------------------------|
| POST   | `/api/users/profile`             | Create profile (authUserId from JWT)            |
| GET    | `/api/users/me`                  | Get current profile + onboarding answers        |
| PUT    | `/api/users/me`                  | Update profile fields                           |
| DELETE | `/api/users/me`                  | Delete profile + answers + anchor applications |
| POST   | `/api/users/me/photo`            | Upload profile photo (JPG/PNG/WEBP/GIF, 5 MB)   |
| GET    | `/api/users/photo/{fileName}`    | Serve a stored profile photo                    |
| POST   | `/api/users/onboarding`          | Submit onboarding answers (marks onboarded)     |
| GET    | `/api/users/onboarding/status`   | Check onboarding completion                     |
| POST   | `/api/users/anchor-apply`        | Submit anchor application                       |
| GET    | `/api/users/anchor-application`  | Get my anchor application                       |
| GET    | `/api/users/anchor-applications` | List anchor applications (ADMIN, optional `?status=` filter) |
| PUT    | `/api/users/anchor-applications/{id}/review` | Approve/reject application (ADMIN)    |
| GET    | `/api/users/{userId}/profile`    | Public profile view (for Nest members)          |
| GET    | `/api/users/ready-for-match`     | Users ready for matching (used via Feign)       |

### Matching Service — Protected (`/api/matching/**`)

| Method | Endpoint                              | Description                                      |
|--------|---------------------------------------|--------------------------------------------------|
| POST   | `/api/matching/calculate/{userId}`    | Trigger compatibility calculation                |
| GET    | `/api/matching/compatibles/{userId}`  | Top-N compatible users with scores               |
| POST   | `/api/matching/propose`               | Create a proposal (members + anchors)            |
| POST   | `/api/matching/proposals/{id}/respond`| Accept/decline a proposal                        |
| GET    | `/api/matching/proposals/pending/{userId}` | Pending proposals for a user                |
| POST   | `/api/matching/execute/{proposalId}`  | Execute accepted proposal (creates Nest)         |

### Nest Service — Protected (`/api/nests/**`)

| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/api/nests`                      | Create Nest (called by matching-service) |
| GET    | `/api/nests/{nestId}`             | Nest details with members                |
| GET    | `/api/nests/my-nests`             | My active/graduated Nests                |
| POST   | `/api/nests/{id}/meetings`        | Schedule meeting (members only)          |
| GET    | `/api/nests/{id}/meetings`        | List meetings (members only)             |
| POST   | `/api/nests/{id}/meetings/{meetingId}/complete` | Mark meeting completed (members only) |
| POST   | `/api/nests/{id}/meetings/{meetingId}/cancel`  | Cancel meeting (members only)      |
| POST   | `/api/nests/{id}/expenses`        | Create expense (EQUAL/CUSTOM splits)     |
| GET    | `/api/nests/{id}/expenses`        | List expenses (members only)             |
| PATCH  | `/api/nests/{id}/expenses/{expenseId}/settle` | Settle my split on an expense   |
| POST   | `/api/nests/{id}/vibe-check`      | Submit vibe check (members only)         |
| GET    | `/api/nests/{id}/vibe-check/status` | Aggregated scores (members only)       |
| POST   | `/api/nests/{id}/graduate`        | Mark graduated (publishes event)         |
| POST   | `/api/nests/{id}/disband`         | Disband                                  |
| POST   | `/api/nests/{id}/leave`           | Leave the Nest                           |
| DELETE | `/api/nests/{id}/members/{userId}`| Remove a member (anchors only)           |

### Testing via Swagger

1. Start all services.
2. Open http://localhost:8081/swagger-ui/index.html.
3. Call `POST /api/auth/register` to create an account.
4. Call `POST /api/auth/login` — copy the `accessToken`.
5. Click the **Authorize** button and paste `Bearer <accessToken>`.
6. Call `POST /api/users/profile` (or use the gateway), then `POST /api/users/onboarding`,
   then `POST /api/matching/calculate/{profileId}` to see the matching flow.

---

## 🔍 RabbitMQ

- Management console: http://localhost:15672 (default `neighbornest`/`neighbornest`)
- AMQP port `5672` · STOMP plugin port `61613`
- Exchanges (topic):
  - `nest.events` — Nest lifecycle events
  - `chat.events` — chat messages (`chat.message.sent`)
- Routing keys / queues:
  - `nest.created` → `nest.created.queue` (chat SYSTEM messages, welcome emails)
  - `nest.graduated` → `nest.graduated.queue`
  - `chat.message.sent` → `notification.chat.message` (per-recipient fan-out)

> ⚠️ **STOMP destination format:** the RabbitMQ STOMP plugin rejects slashes in
> routing keys, so all WebSocket destinations are dot-separated:
> `/topic/nest.{nestId}.messages`, `/queue/user.{profileId}.dm`, etc. Do not
> reintroduce slashes (e.g. `/topic/nest/1/messages`) — they will silently fail.

---

## 🐳 Docker

Each service has its own multi-stage `Dockerfile` that compiles the jar inside
the image — no local `mvn package` is required. **The build context must be the
`backend/` root** (the Dockerfiles copy the parent POM and sibling module POMs,
so building from a service folder will not work):

```bash
# From backend/
docker compose build                 # all 8 images
docker compose build chat-service    # just one service
```

Or with plain `docker build`:

```bash
# From backend/
docker build -f eureka-service/Dockerfile -t backend-eureka-service .
docker build -f api-gateway/Dockerfile -t backend-api-gateway .
docker build -f auth-service/Dockerfile -t backend-auth-service .
docker build -f user-service/Dockerfile -t backend-user-service .
docker build -f matching-service/Dockerfile -t backend-matching-service .
docker build -f nest-service/Dockerfile -t backend-nest-service .
docker build -f chat-service/Dockerfile -t backend-chat-service .
docker build -f notification-service/Dockerfile -t backend-notification-service .
```

Build notes:

- **First build is slow.** Every service compiles with Maven inside Docker and
  downloads its dependencies from Maven Central on the first run.
- **Shared dependency cache.** All Dockerfiles mount one BuildKit cache at
  `/root/.m2`, so dependencies are downloaded once and reused across all
  services and rebuilds.
- **Flaky-network handling.** Maven steps retry automatically (5 attempts for
  dependency resolution, 3 for packaging), so an interrupted download from
  Maven Central does not fail the build.
- **Prefer sequential builds on slow connections.** `docker compose build`
  builds services in parallel; if downloads keep failing, build services one
  at a time (`docker compose build <service>`).
- The `maven:3.9` builder image is pinned intentionally (`dependency:go-offline`
  is deprecated in Maven 3.9 and removed in Maven 4).

---

## 🛠️ Tech Stack

- **Java 17+**
- **Spring Boot 3.4.4**
- **Spring Cloud 2024.0.1**
- **Spring Security + JWT**
- **Spring Data JPA + MySQL**
- **Spring Cloud OpenFeign + Resilience4j**
- **Spring AMQP / RabbitMQ**
- **Eureka Discovery Service**
- **Spring Cloud Gateway**
- **Lombok**
- **jjwt 0.12.6**
- **SpringDoc OpenAPI 2.8.6**
- **JUnit 5 + Mockito**
