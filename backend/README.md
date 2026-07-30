# 🏘️ NeighborNest

**NeighborNest** — A platform that matches newcomers to a city into small curated groups (*Nests*) with local *Anchors* to form authentic friendships.

This repository contains the backend microservices for the NeighborNest platform.

---

## 🧱 Architecture

```
┌─────────────────┐
│   API Gateway   │  (Spring Cloud Gateway — port 8080)
└────────┬────────┘
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
┌──────────────────┐                  ┌──────────────────────┐
│   Auth Service   │                  │   User Service (TBD) │
│   (port 8081)    │                  │                      │
└──────────────────┘                  └──────────────────────┘
         │                                         │
         ▼                                         ▼
┌───────────────────────────────────────────────────────────┐
│               Eureka Service Discovery                     │
│                    (port 8761)                             │
└───────────────────────────────────────────────────────────┘
```

### Services

| Service          | Port | Description                              |
|------------------|------|------------------------------------------|
| **Eureka**       | 8761 | Service Discovery (Netflix Eureka)       |
| **API Gateway**  | 8080 | Spring Cloud Gateway, routes + JWT auth  |
| **Auth Service** | 8081 | Authentication & user management          |

---

## 🚀 Prerequisites

- **Java 17+** (tested with Java 25)
- **Maven 3.9+**
- **MySQL 8+**
- **Docker** (optional, for containerized deployment)

---

## ⚙️ Configuration

### 1. MySQL Database

Create the database:

```sql
CREATE DATABASE IF NOT EXISTS neighbornest_auth;
```

This is handled automatically by JPA `ddl-auto: update` in dev mode.

### 2. application.yml

Each service has its own `application.yml`. Key properties to customize:

**Auth Service** (`auth-service/src/main/resources/application.yml`):
- `spring.datasource.url` — your MySQL connection string
- `spring.datasource.username` — MySQL username
- `spring.datasource.password` — MySQL password
- `app.jwt.secret` — a Base64-encoded secret (generate one: `openssl rand -base64 64`)
- `app.jwt.expiration-ms` — access token expiry in ms (default: 15 minutes)

---

## 🏃 Running Locally

### Option 1: Run all services manually

```bash
# 1. Start Eureka
cd eureka-service
mvn spring-boot:run

# 2. Start Auth Service (in a new terminal)
cd auth-service
mvn spring-boot:run

# 3. Start API Gateway (in a new terminal)
cd api-gateway
mvn spring-boot:run
```

### Option 2: Using Docker Compose (coming soon)

```bash
docker-compose up --build
```

---

## 🧪 Running Tests

```bash
# Auth Service tests
cd auth-service
mvn test
```

---

## 📖 API Documentation (Swagger)

Once all services are running, access Swagger UI:

| Service      | Swagger URL                                   |
|--------------|-----------------------------------------------|
| Auth Service | http://localhost:8081/swagger-ui/index.html   |
| API Gateway  | http://localhost:8080/swagger-ui/index.html    |

---

## 🔐 API Endpoints

### Auth Service — Public Endpoints

| Method | Endpoint              | Description          | Request Body                        |
|--------|-----------------------|----------------------|-------------------------------------|
| POST   | `/api/auth/register`  | Register new user    | `{ fullName, email, password }`     |
| POST   | `/api/auth/login`     | Login user           | `{ email, password }`               |
| POST   | `/api/auth/refresh`   | Refresh access token | `{ refreshToken }`                  |

### Auth Service — Protected Endpoints (Bearer Token required)

| Method | Endpoint              | Description          | Request Body                        |
|--------|-----------------------|----------------------|-------------------------------------|
| POST   | `/api/auth/logout`    | Logout user          | `{ refreshToken }`                  |
| GET    | `/api/users/me`       | Get current user     | —                                   |

### Testing via Swagger

1. Start all services.
2. Open http://localhost:8081/swagger-ui/index.html.
3. Call `POST /api/auth/register` to create an account.
4. Call `POST /api/auth/login` with the credentials — copy the `accessToken`.
5. Click the **Authorize** button in Swagger and paste: `Bearer <accessToken>`.
6. Now you can call `GET /api/users/me` and `POST /api/auth/logout`.

---

## 📦 Build

```bash
# Build all services
mvn clean package -DskipTests

# Build individual service
cd auth-service && mvn clean package -DskipTests
```

---

## 🐳 Docker

Each service has its own `Dockerfile`. Build images:

```bash
docker build -t neighbornest/eureka-service ./eureka-service
docker build -t neighbornest/api-gateway ./api-gateway
docker build -t neighbornest/auth-service ./auth-service
```

---

## 🛠️ Tech Stack

- **Java 17+**
- **Spring Boot 3.4.4**
- **Spring Cloud 2024.0.1**
- **Spring Security + JWT**
- **Spring Data JPA + MySQL**
- **Eureka Discovery Service**
- **Spring Cloud Gateway**
- **Lombok**
- **jjwt 0.12.6**
- **SpringDoc OpenAPI 2.8.6**
- **JUnit 5 + Mockito**
