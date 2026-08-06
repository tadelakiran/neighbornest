# 🏘️ NeighborNest

**NeighborNest** — A platform that matches newcomers to a city into small curated groups (*Nests*) with local *Anchors* to form authentic friendships.

This repository contains the backend microservices for the NeighborNest platform.

---

## 🧱 Architecture

```
┌───────────────────────────────────────────────┐
│               API Gateway                     │  (Spring Cloud Gateway — port 8080)
└───┬──────────┬──────────┬──────────┬──────────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Auth    │ │  User    │ │ Matching │ │   Nest   │
│ Service  │ │ Service  │ │ Service  │ │ Service  │
│ (8081)   │ │ (8082)   │ │ (8083)   │ │ (8084)   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
     │             │  ▲         │  ▲         │
     └─────────────┴──┴─────────┴──┴─────────┘
              Feign (service-to-service)
                     │
                     ▼
┌───────────────────────────────────────────────┐
│            Eureka Service Discovery           │  (port 8761)
│           RabbitMQ (events, 5672/15672)       │
│      MySQL: neighbornest_auth · user_db · matching_db · nest_db
└───────────────────────────────────────────────┘
```

### Services

| Service           | Port | Description                                       | DB            |
|-------------------|------|---------------------------------------------------|---------------|
| **Eureka**        | 8761 | Service Discovery (Netflix Eureka)                | —             |
| **API Gateway**   | 8080 | Spring Cloud Gateway, routes + circuit breakers   | —             |
| **Auth Service**  | 8081 | Authentication, JWT, users                        | auth_db       |
| **User Service**  | 8082 | Profiles, onboarding, anchor applications         | user_db       |
| **Matching Service** | 8083 | Compatibility engine, Nest proposals           | matching_db   |
| **Nest Service**  | 8084 | Nest lifecycle, meetings, expenses, vibe checks   | nest_db       |

### Cross-service communication

- **Feign (OpenFeign + Resilience4j)** — synchronous calls with fallback factories:
  - `user-service → auth-service` (token ownership validation)
  - `matching-service → user-service` (match-ready users + onboarding answers)
  - `matching-service → nest-service` (create Nest after proposal acceptance)
  - `nest-service → user-service` (member profile display names)
- **RabbitMQ** — asynchronous Nest lifecycle events:
  - `NestCreatedEvent` published when a Nest moves to ACTIVE
  - `NestGraduatedEvent` published when a Nest graduates

---

## 🚀 Prerequisites

- **Java 17+**
- **Maven 3.9+**
- **MySQL 8+** (or Docker)
- **RabbitMQ 3.x** (or Docker) — required by matching-service and nest-service
- **Docker** (optional, recommended for full-stack bring-up)

---

## 🐳 Quick Start (Docker Compose)

The fastest way to run the entire platform:

```bash
docker compose up --build
```

This starts:
- 4 MySQL instances (auth `3310`, user `3307`, matching `3308`, nest `3309` — auth uses `3310` on the host because `3306` is usually reserved for a local MySQL)
- RabbitMQ management (`5672` AMQP, `15672` console — user/pass `neighbornest`/`neighbornest` by default)
- All 6 services (Eureka `8761`, Gateway `8080`, auth `8081`, user `8082`, matching `8083`, nest `8084`)

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

All four MySQL containers and the Spring services share these values, so keeping
`MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD` in sync is all you need.

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
# MySQL databases (adapt for your MySQL instance)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS neighbornest_auth; CREATE DATABASE IF NOT EXISTS user_db; CREATE DATABASE IF NOT EXISTS matching_db; CREATE DATABASE IF NOT EXISTS nest_db;"

# RabbitMQ (via Docker)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

> **Important — local DB ports.** `auth-service` connects to `localhost:3306`, while
> `user-service` / `matching-service` / `nest-service` default to **3307 / 3308 / 3309**
> (these match the Docker Compose host ports). If you run the services locally against a
> **single** MySQL on the standard port `3306`, point them all at it with the `MYSQL_PORT`
> env var, e.g. in your IDE run config:
>
> ```
> MYSQL_PORT=3306
> ```
>
> (Each service still uses its own database: `user_db`, `matching_db`, `nest_db`.)
> The MySQL username/password come from `MYSQL_USER` / `MYSQL_PASSWORD` — defaults are
> `root` / your local password, set in `backend/.env` for Docker or as IDE env vars locally.

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
| POST   | `/api/nests/{id}/meetings`        | Schedule meeting                         |
| GET    | `/api/nests/{id}/meetings`        | List meetings                            |
| POST   | `/api/nests/{id}/expenses`        | Create expense (EQUAL/CUSTOM splits)     |
| GET    | `/api/nests/{id}/expenses`        | List expenses                            |
| POST   | `/api/nests/{id}/vibe-check`      | Submit vibe check                        |
| GET    | `/api/nests/{id}/vibe-check/status` | Aggregated scores (admin view)         |
| POST   | `/api/nests/{id}/graduate`        | Mark graduated (publishes event)         |
| POST   | `/api/nests/{id}/disband`         | Disband                                  |

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
- Exchange: `nest.events` (topic)
- Routing keys / queues:
  - `nest.created` → `nest.created.queue`
  - `nest.graduated` → `nest.graduated.queue`

---

## 🐳 Docker

Each service has its own `Dockerfile`. Build individual images:

```bash
docker build -t neighbornest/eureka-service ./eureka-service
docker build -t neighbornest/api-gateway ./api-gateway
docker build -t neighbornest/auth-service ./auth-service
docker build -t neighbornest/user-service ./user-service
docker build -t neighbornest/matching-service ./matching-service
docker build -t neighbornest/nest-service ./nest-service
```

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
