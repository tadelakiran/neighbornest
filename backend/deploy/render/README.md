# NeighborNest — Render Free Tier Deployment Guide

## Overview

This guide deploys all 8 NeighborNest microservices on **Render Free Tier** (512MB RAM per service).

### Architecture on Render

```
┌─────────────────────────────────────────────────────────────────┐
│                     Render Free Tier                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ PlanetScale   │  │ CloudAMQP    │  │ eureka-service       │  │
│  │ (MySQL)       │  │ (RabbitMQ)   │  │ (512MB)              │  │
│  │ Free tier     │  │ Free tier    │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                  │                      │               │
│  ┌──────┴──────────────────┴──────────────────────┴──────────┐  │
│  │                    Each service = 512MB                    │  │
│  │                                                            │  │
│  │  auth-service (8081)      matching-service (8083)         │  │
│  │  user-service (8082)      nest-service (8084)             │  │
│  │  chat-service (8085)      notification-service (8086)     │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│  │              api-gateway (8080)                             │  │
│  │              PUBLIC URL: *.onrender.com                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **GitHub account** with the NeighborNest repo
2. **Render account** (free tier)
3. **PlanetScale account** (free tier) — for MySQL
4. **CloudAMQP account** (free tier) — for RabbitMQ

---

## Step 1: Set Up External MySQL (PlanetScale)

1. Go to https://planetscale.com and create a free account
2. Create a new database called `neighbornest`
3. Note the connection details:
   - Host: `aws.connect.psdb.cloud`
   - Port: `3306`
   - Username: `your-username`
   - Password: `your-password`
   - SSL: `true`

4. Create the 6 service databases. Go to your PlanetScale dashboard → Console → run:

```sql
CREATE DATABASE IF NOT EXISTS neighbornest_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS matching_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS nest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS chat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> **Note:** PlanetScale uses `?ssl={"rejectUnauthorized":true}` in the JDBC URL.

---

## Step 2: Set Up External RabbitMQ (CloudAMQP)

1. Go to https://www.cloudamqp.com and create a free account
2. Create a new instance with the "Little Lemur" plan (free)
3. Note the AMQP URL from the dashboard:
   - Host: `your-vhost.rmq.cloudamqp.com`
   - Port: `5672`
   - Username: `your-username`
   - Password: `your-password`

4. Enable the STOMP plugin:
   - Go to CloudAMQP dashboard → RabbitMQ Manager
   - Enable the `rabbitmq_stomp` plugin
   - Note the STOMP port (usually `61613` or `1883`)

---

## Step 3: Generate Secrets

```bash
# Generate JWT Secret (base64, 64 bytes)
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET"

# Generate Internal API Key (hex, 32 bytes)
INTERNAL_API_KEY=$(openssl rand -hex 32)
echo "INTERNAL_API_KEY=$INTERNAL_API_KEY"
```

---

## Step 4: Deploy to Render

### Option A: Using render.yaml Blueprint (Recommended)

1. Push the repo to GitHub
2. Go to https://dashboard.render.com/blueprints
3. Click "New Blueprint" → connect your GitHub repo
4. Render will auto-detect `backend/render.yaml` and create all services
5. Go to each service's Environment tab and set the `sync: false` variables

### Option B: Manual Setup

1. Go to https://dashboard.render.com
2. For each service, click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure each service:

| Service | Root Directory | Dockerfile | Port |
|---------|---------------|------------|------|
| eureka-service | `backend` | `backend/eureka-service/Dockerfile` | 8761 |
| auth-service | `backend` | `backend/auth-service/Dockerfile` | 8081 |
| user-service | `backend` | `backend/user-service/Dockerfile` | 8082 |
| matching-service | `backend` | `backend/matching-service/Dockerfile` | 8083 |
| nest-service | `backend` | `backend/nest-service/Dockerfile` | 8084 |
| chat-service | `backend` | `backend/chat-service/Dockerfile` | 8085 |
| notification-service | `backend` | `backend/notification-service/Dockerfile` | 8086 |
| api-gateway | `backend` | `backend/api-gateway/Dockerfile` | 8080 |

---

## Step 5: Set Environment Variables

### For each Java service, set these in Render Dashboard → Environment:

#### Eureka Service
```
JAVA_TOOL_OPTIONS=-Xmx200m -Xms128m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-service.onrender.com/eureka/
```

#### Auth Service
```
JAVA_TOOL_OPTIONS=-Xmx350m -Xms192m -XX:MaxMetaspaceSize=192m -XX:+UseG1GC
EUREKA_SERVER_URL=http://eureka-service.onrender.com/eureka/
SPRING_DATASOURCE_URL=jdbc:mysql://aws.connect.psdb.cloud:3306/neighbornest_auth?ssl={"rejectUnauthorized":true}&createDatabaseIfNotExist=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=your-planetscale-username
SPRING_DATASOURCE_PASSWORD=your-planetscale-password
JWT_SECRET=your-generated-jwt-secret
INTERNAL_API_KEY=your-generated-internal-api-key
```

#### User Service
```
JAVA_TOOL_OPTIONS=-Xmx350m -Xms192m -XX:MaxMetaspaceSize=192m -XX:+UseG1GC
EUREKA_SERVER_URL=http://eureka-service.onrender.com/eureka/
MYSQL_HOST=aws.connect.psdb.cloud
MYSQL_PORT=3306
MYSQL_USER=your-planetscale-username
MYSQL_PASSWORD=your-planetscale-password
DB_NAME=user_db
JWT_SECRET=your-generated-jwt-secret
RABBITMQ_HOST=your-vhost.rmq.cloudamqp.com
RABBITMQ_PORT=5672
RABBITMQ_USER=your-cloudamqp-username
RABBITMQ_PASSWORD=your-cloudamqp-password
```

#### Matching Service
```
JAVA_TOOL_OPTIONS=-Xmx350m -Xms192m -XX:MaxMetaspaceSize=192m -XX:+UseG1GC
EUREKA_SERVER_URL=http://eureka-service.onrender.com/eureka/
MYSQL_HOST=aws.connect.psdb.cloud
MYSQL_PORT=3306
MYSQL_USER=your-planetscale-username
MYSQL_PASSWORD=your-planetscale-password
DB_NAME=matching_db
JWT_SECRET=your-generated-jwt-secret
RABBITMQ_HOST=your-vhost.rmq.cloudamqp.com
RABBITMQ_PORT=5672
RABBITMQ_USER=your-cloudamqp-username
RABBITMQ_PASSWORD=your-cloudamqp-password
```

#### Nest Service
```
JAVA_TOOL_OPTIONS=-Xmx350m -Xms192m -XX:MaxMetaspaceSize=192m -XX:+UseG1GC
EUREKA_SERVER_URL=http://eureka-service.onrender.com/eureka/
MYSQL_HOST=aws.connect.psdb.cloud
MYSQL_PORT=3306
MYSQL_USER=your-planetscale-username
MYSQL_PASSWORD=your-planetscale-password
DB_NAME=nest_db
JWT_SECRET=your-generated-jwt-secret
RABBITMQ_HOST=your-vhost.rmq.cloudamqp.com
RABBITMQ_PORT=5672
RABBITMQ_USER=your-cloudamqp-username
RABBITMQ_PASSWORD=your-cloudamqp-password
```

#### Chat Service
```
JAVA_TOOL_OPTIONS=-Xmx350m -Xms192m -XX:MaxMetaspaceSize=192m -XX:+UseG1GC
EUREKA_SERVER_URL=http://eureka-service.onrender.com/eureka/
MYSQL_HOST=aws.connect.psdb.cloud
MYSQL_PORT=3306
MYSQL_USER=your-planetscale-username
MYSQL_PASSWORD=your-planetscale-password
DB_NAME=chat_db
JWT_SECRET=your-generated-jwt-secret
RABBITMQ_HOST=your-vhost.rmq.cloudamqp.com
RABBITMQ_PORT=5672
RABBITMQ_USER=your-cloudamqp-username
RABBITMQ_PASSWORD=your-cloudamqp-password
STOMP_RELAY_HOST=your-vhost.rmq.cloudamqp.com
STOMP_RELAY_PORT=61613
```

#### Notification Service
```
JAVA_TOOL_OPTIONS=-Xmx350m -Xms192m -XX:MaxMetaspaceSize=192m -XX:+UseG1GC
EUREKA_SERVER_URL=http://eureka-service.onrender.com/eureka/
MYSQL_HOST=aws.connect.psdb.cloud
MYSQL_PORT=3306
MYSQL_USER=your-planetscale-username
MYSQL_PASSWORD=your-planetscale-password
DB_NAME=notification_db
JWT_SECRET=your-generated-jwt-secret
INTERNAL_API_KEY=your-generated-internal-api-key
RABBITMQ_HOST=your-vhost.rmq.cloudamqp.com
RABBITMQ_PORT=5672
RABBITMQ_USER=your-cloudamqp-username
RABBITMQ_PASSWORD=your-cloudamqp-password
NOTIFICATION_BASE_URL=https://your-frontend.vercel.app
EMAILJS_PUBLIC_KEY=your-emailjs-public-key
EMAILJS_PRIVATE_KEY=your-emailjs-private-key
EMAILJS_SERVICE_ID=your-emailjs-service-id
```

#### API Gateway
```
JAVA_TOOL_OPTIONS=-Xmx300m -Xms192m -XX:MaxMetaspaceSize=192m -XX:+UseG1GC
EUREKA_SERVER_URL=http://eureka-service.onrender.com/eureka/
JWT_SECRET=your-generated-jwt-secret
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

---

## Step 6: Deploy Order

Deploy in this order (Render will try to deploy all at once, but health checks depend on Eureka):

1. **eureka-service** (must be first)
2. **auth-service, user-service, matching-service, nest-service, chat-service, notification-service** (can deploy in parallel)
3. **api-gateway** (deploy last — depends on all services registering with Eureka)

> **Tip:** After deploying, wait 2-3 minutes for all services to register with Eureka before testing.

---

## Step 7: Update Frontend

After deployment, update your frontend's API URL:

```bash
# Your API Gateway URL (from Render dashboard)
VITE_API_URL=https://api-gateway-xxxx.onrender.com
```

---

## Limitations of Render Free Tier

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| **512MB RAM per service** | Tight for Spring Boot | Aggressive JVM tuning (`-Xmx350m`) |
| **Spin down after 15 min** | 30-60s cold start | Keep services alive with periodic pings |
| **No persistent disk** | MySQL/RabbitMQ must be external | Use PlanetScale + CloudAMQP |
| **Public URLs only** | No private networking | All communication goes through public URLs |
| **No custom domains** | Must use *.onrender.com | Upgrade to paid for custom domain |
| **Build time limit** | 20 min per build | Our optimized Dockerfiles build in ~2 min |
| **100GB bandwidth/mo** | May be tight with 8 services | Monitor usage |

---

## Keeping Services Alive (Preventing Spin-Down)

Render free tier spins down services after 15 minutes of inactivity. To prevent this, you can:

1. **Use a free cron service** (e.g., cron-job.org) to ping each service's health endpoint every 10 minutes:

```
GET https://eureka-service-xxxx.onrender.com/actuator/health
GET https://auth-service-xxxx.onrender.com/actuator/health
GET https://user-service-xxxx.onrender.com/actuator/health
GET https://matching-service-xxxx.onrender.com/actuator/health
GET https://nest-service-xxxx.onrender.com/actuator/health
GET https://chat-service-xxxx.onrender.com/actuator/health
GET https://notification-service-xxxx.onrender.com/actuator/health
GET https://api-gateway-xxxx.onrender.com/actuator/health
```

2. **Or upgrade to Render Starter** ($7/mo per service) for always-on services.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Service won't start (OOM) | Reduce `-Xmx` value (try `-Xmx300m`) |
| Eureka registration fails | Check `EUREKA_SERVER_URL` is correct |
| MySQL connection refused | Verify PlanetScale credentials and SSL setting |
| RabbitMQ connection refused | Verify CloudAMQP credentials and STOMP plugin |
| Gateway returns 503 | Services haven't registered with Eureka yet — wait and retry |
| Cold start timeout | Increase Render's health check timeout in service settings |
| Build fails | Check Dockerfile path and root directory in Render settings |

---

## Cost Summary (Free Tier)

| Service | Cost |
|---------|------|
| 8× Render Web Services | **$0** (free tier) |
| PlanetScale MySQL | **$0** (free tier, 5GB storage) |
| CloudAMQP RabbitMQ | **$0** (free tier, "Little Lemur") |
| **Total** | **$0/month** |

> **Note:** Free tier services spin down after inactivity. For production, upgrade to Render Starter ($7/mo per service = $56/mo total).
