# NeighborNest — Railway Deployment

## Quick Start (Automated)

```cmd
cd backend\deploy\railway
deploy-railway.bat
```

Or with PowerShell:

```powershell
cd backend\deploy\railway
.\deploy-railway.ps1
```

The script automates: CLI install, auth, project creation, adding all 10 services, setting build config and env vars, and deploying in the correct order.

**After the script finishes, you must do these manual steps in the Railway dashboard.**

---

## What the Script Does (Automated)

| Step | Action |
|------|--------|
| 1 | Installs Railway CLI (`npm i -g @railway/cli`) if missing |
| 2 | Authenticates with Railway |
| 3 | Creates project `neighbornest` |
| 4 | Adds MySQL database service |
| 5 | Adds RabbitMQ (Docker image with STOMP start command) |
| 6 | Adds all 8 Java services from GitHub with `RAILWAY_DOCKERFILE_PATH` |
| 7 | Sets environment variables for each service |
| 8 | Deploys in order: eureka → rabbitmq → domain services → gateway |

---

## What You Must Do Manually

### 1. Set Root Directory (CRITICAL)

Railway CLI does not support setting the root directory. For **each Java service**, go to:

**Dashboard → Service → Settings → Source → Root Directory → set to `backend`**

Services requiring this:
- `eureka-service`
- `auth-service`
- `user-service`
- `matching-service`
- `nest-service`
- `chat-service`
- `notification-service`
- `api-gateway`

> **Why?** Each Dockerfile lives at `backend/<service>/Dockerfile` and references `backend/pom.xml` and sibling module POMs. Railway must use `backend/` as the Docker build context.

### 2. Set RabbitMQ Start Command

**RabbitMQ service → Settings → Deploy → Custom Start Command** and set:

```
sh -c "rabbitmq-plugins enable --offline rabbitmq_stomp && rabbitmq-server"
```

This enables the STOMP plugin required by chat-service.

### 3. Initialize MySQL Databases

Railway's MySQL plugin creates one database. You need six. Go to:

**MySQL service → Data tab → Query** and run:

```sql
CREATE DATABASE IF NOT EXISTS neighbornest_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS matching_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS nest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS chat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Update MySQL Variable References

The script sets `MYSQL_HOST`, `MYSQL_PORT`, etc. as literal values. For cross-service references, update these in **each Java service's Variables tab**:

| Variable | Set To |
|----------|--------|
| `MYSQLHOST` | `${{MySQL.MYSQLHOST}}` |
| `MYSQLPORT` | `${{MySQL.MYSQLPORT}}` |
| `MYSQL_USER` | `${{MySQL.MYSQLUSER}}` |
| `MYSQL_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |

> **Why?** Railway variable references (`${{Service.VAR}}`) can only be set via the dashboard UI. The CLI `--variables` flag only accepts literal values.

### 5. Enable Public Networking

Go to **api-gateway → Settings → Networking → Generate Domain**.

This gives you a `*.up.railway.app` URL.

### 6. Update Frontend URL

After getting the public URL, update:

| Service | Variable | Value |
|---------|----------|-------|
| `api-gateway` | `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` |
| `notification-service` | `NOTIFICATION_BASE_URL` | `https://your-frontend.vercel.app` |
| Frontend | `VITE_API_URL` | `https://api-gateway-xxx.up.railway.app` |

### 7. Generate Production Secrets

```bash
# Generate JWT Secret (base64, 64 bytes)
openssl rand -base64 64

# Generate Internal API Key (hex, 32 bytes)
openssl rand -hex 32
```

Update `JWT_SECRET` and `INTERNAL_API_KEY` in all services that use them.

---

## Architecture on Railway

```
┌──────────────────────────────────────────────────────────┐
│                    Railway Project                        │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   MySQL 8   │  │  RabbitMQ   │  │  eureka-service  │  │
│  │ (Railway    │  │ (Docker:    │  │   (internal)     │  │
│  │  plugin)    │  │  3-mgmt +   │  │  Port 8761       │  │
│  │             │  │  STOMP)     │  │                  │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │
│         │                │                   │            │
│  ┌──────┴────────────────┴───────────────────┴──────────┐ │
│  │              Railway Private Network                  │ │
│  │                                                      │ │
│  │  auth-service (8081)     matching-service (8083)     │ │
│  │  user-service (8082)     nest-service (8084)         │ │
│  │  chat-service (8085)     notification-service (8086) │ │
│  └──────────────────────────┬───────────────────────────┘ │
│                             │                             │
│  ┌──────────────────────────┴───────────────────────────┐ │
│  │              api-gateway (8080)                       │ │
│  │              PUBLIC URL: *.up.railway.app             │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Service Reference

| Service | Port | Dockerfile | Databases | Needs RabbitMQ |
|---------|------|-----------|-----------|----------------|
| eureka-service | 8761 | `eureka-service/Dockerfile` | — | No |
| auth-service | 8081 | `auth-service/Dockerfile` | `neighbornest_auth` | No |
| user-service | 8082 | `user-service/Dockerfile` | `user_db` | Yes |
| matching-service | 8083 | `matching-service/Dockerfile` | `matching_db` | Yes |
| nest-service | 8084 | `nest-service/Dockerfile` | `nest_db` | Yes |
| chat-service | 8085 | `chat-service/Dockerfile` | `chat_db` | Yes (+STOMP) |
| notification-service | 8086 | `notification-service/Dockerfile` | `notification_db` | Yes |
| api-gateway | 8080 | `api-gateway/Dockerfile` | — | No |

## Files Created

```
backend/deploy/railway/
├── README.md                      # This file
├── deploy-railway.bat             # Windows CMD deployment script
├── deploy-railway.ps1             # PowerShell deployment script (recommended)
├── railway-env-template.env       # All env vars per service (reference)
├── mysql-init/
│   ├── Dockerfile                 # MySQL init container image
│   └── init.sql                   # Creates all 6 databases
└── rabbitmq-stomp/
    └── Dockerfile                 # RabbitMQ 3 with STOMP plugin pre-enabled
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails: "Dockerfile not found" | Set Root Directory to `backend` in service Settings |
| Service can't connect to MySQL | Update `MYSQLHOST` to `${{MySQL.MYSQLHOST}}` in Variables |
| Eureka not registering | Verify `EUREKA_INSTANCE_PREFER_IP_ADDRESS=false` is set |
| Gateway returns 503 | Services haven't registered with Eureka yet — wait and retry |
| STOMP connection fails | Check RabbitMQ logs — STOMP plugin must be enabled |
| CORS errors | Update `CORS_ALLOWED_ORIGINS` with your frontend URL |
| MySQL: "Unknown database" | Run the CREATE DATABASE SQL in MySQL Data tab |

## Prerequisites

- **Node.js 16+** (for Railway CLI)
- **Git** (for repo connection)
- **Railway account** — Hobby plan ($5/mo) recommended for 8+ services
- **GitHub repo connected to Railway** — install the Railway GitHub App at https://railway.app/account/tokens
