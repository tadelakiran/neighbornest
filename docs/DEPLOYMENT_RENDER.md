# 🚀 Deploying the Backend — Render (or a free VM/VPS)

This guide covers deploying the NeighborNest backend as a **single container**
that bundles MySQL 8 + RabbitMQ + Eureka + all six domain services + the API
Gateway, with the React frontend on **Vercel**.

```
 Browser ── HTTPS ──> Vercel (React app)
     │                    │  REST + WSS /ws/chat
     │                    ▼
     │            https://<backend-url>          (Render HTTPS or Caddy on a VM)
     │                    │
     │                    ▼
     │     ┌──────────────────────────────────────────────┐
     │     │   ONE container (neighbornest image)          │
     │     │   mysql:3306 · rabbitmq:5672/61613            │
     │     │   eureka:8761 · services 8081-8086            │
     │     │   api-gateway on $PORT (health: /health)      │
     │     └──────────────────────────────────────────────┘
     └───────────── persistent disk → /var/lib (MySQL + RabbitMQ data)
```

The image is built from `backend/deploy/single-container/Dockerfile`
(build context `backend/`), orchestrated by `start.sh`. Because every service
already defaults to `localhost` for Eureka, MySQL, RabbitMQ and the STOMP
relay, **no application code or configuration is changed** — the container
just runs the existing jars with the same env vars as `docker-compose.prod.yml`.

---

## ⚠️ Read this first: Render's free tier cannot run this stack

| Requirement | Render free | Render Standard (paid) |
|---|---|---|
| RAM (stack needs ~4–5 GB) | 512 MB ❌ | 4 GB (`standard`, ~$25/mo) or 8 GB ✔ |
| Persistent disk (MySQL/RabbitMQ data) | Not available ❌ | Attach at `/var/lib` ✔ |
| Raw TCP (AMQP :5672 / STOMP :61613) | Not exposed ❌ | Private services only — the single container sidesteps this by using localhost ✔ |

There is **no free path on Render** for this stack. If you must stay at $0,
use **Path A** below (your existing Oracle Cloud Always Free VM, or any small
VPS) — the same image runs there. If you can spend ~$25–50/mo, use **Path B**
(Render).

---

## Path A — FREE: run the single container on a VM/VPS

Works on your existing Oracle Cloud Always Free VM (or a $5–10 VPS like
Hetzner/Linode). All-in-one image ≈ 2 containers instead of 10.

```bash
# from the repo root
docker build -f backend/deploy/single-container/Dockerfile -t neighbornest backend

# data lives in a named volume (survives container restarts/recreates)
docker run -d --name neighbornest \
  -p 8080:8080 \
  -v neighbornest-data:/var/lib \
  --env-file backend/deploy/single-container/.env \
  neighbornest
```

- Set `MYSQL_PASSWORD` (required), `JWT_SECRET`, `INTERNAL_API_KEY`,
  `CORS_ALLOWED_ORIGINS=https://<your-app>.vercel.app`,
  `NOTIFICATION_BASE_URL=https://<your-app>.vercel.app` in the env file
  (see `backend/deploy/single-container/.env.example`).
- Verify: `curl http://<host>:8080/health` → `{"status":"UP"}`.
- **HTTPS/WSS:** browsers block HTTP from HTTPS pages, so put a reverse proxy
  in front: reuse the Caddyfile from the old deployment (`backend/deploy/`
  + `docker-compose.prod.yml`'s caddy service, pointing `api-gateway` at this
  container) or any other TLS proxy. The chat needs `wss://` to reach
  `/ws/chat`.

> On the Oracle VM you may also simply keep the existing
> `docker-compose.yml` + `docker-compose.prod.yml` stack — it already works
> there. The single container is an alternative that is easier to move to
> Render later.

---

## Path B — Render (paid Standard instance)

### 1. One-time setup
1. Create a Render account, connect your GitHub repo
   (`tadelakiran/neighbornest`).
2. **New → Blueprint** and select the repo. Render reads
   `backend/deploy/single-container/render.yaml`, which defines the service,
   the persistent disk at `/var/lib` (10 GB), the `/health` health check, and
   the env vars. It will prompt you for the `sync: false` secrets:
   - `MYSQL_PASSWORD` — strong random value (all services log in as root)
   - `JWT_SECRET` — `openssl rand -base64 64`
   - `INTERNAL_API_KEY` — any long random string
   - `CORS_ALLOWED_ORIGINS` — `https://<your-app>.vercel.app` (from step 2)
   - `NOTIFICATION_BASE_URL` — `https://<your-app>.vercel.app`
   - `RABBITMQ_PASSWORD`
3. Choose instance type: **Standard 4 GB** minimum (the blueprint defaults to
   a tightened JVM budget to fit), **8 GB** recommended.
4. Deploy. First deploy compiles all eight jars inside Docker — expect
   15–40 min. Later deploys are much faster.

### 2. Deploy the frontend on Vercel
1. **Vercel → New Project** → import the repo, root directory `frontend`,
   framework Vite.
2. Environment variable: `VITE_API_URL = https://neighbornest-backend.onrender.com`
3. Deploy. Note the URL (e.g. `https://<your-app>.vercel.app`) — update
   `CORS_ALLOWED_ORIGINS`/`NOTIFICATION_BASE_URL` on Render if you set them
   before deploying.

### 3. Verify
```bash
curl -i https://neighbornest-backend.onrender.com/health   # → 200 {"status":"UP"}
curl -i https://neighbornest-backend.onrender.com/api/auth/login  # → 400/401 (routing works)
```
Register/login through the Vercel app, then open the Messages page — the chat
WebSocket connects over `wss://neighbornest-backend.onrender.com/ws/chat`.

---

## 🔄 Migrating existing data (optional)

1. On the old host, dump only the six app databases (do **not** include system
   schemas such as `mysql`):
   ```bash
   mysqldump -uroot -p --databases \
     neighbornest_auth user_db matching_db nest_db chat_db notification_db \
     > dump.sql
   ```
2. Get `dump.sql` onto the container's persistent storage and tell the image
   to import it **before the first service boot**:
   - **VM/VPS:** `docker cp dump.sql neighbornest:/var/lib/import/dump.sql`
     (or bind-mount the file), then set `IMPORT_DUMP_PATH=/var/lib/import/dump.sql`.
   - **Render:** Render Shell (or SCP) → create `/var/lib/import/`, upload the
     file, set the `IMPORT_DUMP_PATH` env var, redeploy.
3. On boot, `start.sh` imports the dump, then renames it to
   `dump.sql.imported` so it is never re-imported. Hibernate's
   `ddl-auto=update` upgrades the existing schema afterwards.

---

## ⚡ Keep-alive / staying awake

- The backend exposes **`GET /health`** → `200 {"status":"UP"}` — no database,
  no RabbitMQ, no auth, no logging. Render uses it as the health check.
- **Frontend keep-alive is optional and disabled by default**
  (`VITE_ENABLE_KEEP_ALIVE=false`). A browser only pings while someone has the
  app open — it **cannot** keep a sleeping Render instance awake when no
  browser is open.
- **Recommended:** point an external uptime/monitoring service (UptimeRobot,
  Cronitor, a cron job, or a Render Cron Job) at
  `https://neighbornest-backend.onrender.com/health` every few minutes. That
  runs 24/7 and doubles as an availability alert. Note that Render paid
  instances can also be configured to not sleep.
- See `docs/DEPLOYMENT_FREE_CLOUD.md` → "Health / keep-alive" for details.

---

## 🔧 Environment variables (all optional except `MYSQL_PASSWORD`)

See `backend/deploy/single-container/.env.example`. Highlights:

| Variable | Purpose |
|---|---|
| `MYSQL_PASSWORD` | **Required.** Root password for MySQL; all services use it |
| `JWT_SECRET` | JWT signing secret (Base64) — shared by all services |
| `INTERNAL_API_KEY` | auth-service ↔ notification-service internal calls |
| `CORS_ALLOWED_ORIGINS` | Gateway CORS — the Vercel app URL |
| `NOTIFICATION_BASE_URL` | Frontend URL in email deep links |
| `RABBITMQ_USER` / `RABBITMQ_PASSWORD` | Broker credentials (STOMP relay uses them too) |
| `IMPORT_DUMP_PATH` | mysqldump to import on first boot (renamed after import) |
| `JAVA_TOOL_OPTIONS` | JVM heap budget; tighten on a 4 GB instance |
| `EMAILJS_*` | Replace the dev EmailJS keys in production |

## 🧪 Test the container locally

```bash
docker build -f backend/deploy/single-container/Dockerfile -t neighbornest backend
docker run --rm -p 8080:8080 -e MYSQL_PASSWORD=local-secret -e CORS_ALLOWED_ORIGINS=http://localhost:5173 neighbornest
curl http://localhost:8080/health           # → 200 {"status":"UP"}
curl http://localhost:8080/actuator/health  # gateway actuator still works
```

## 🔁 Maintenance

| Task | Command |
|---|---|
| Rebuild/redeploy | push to GitHub (auto-deploy) or `docker build ... && docker run ...` on a VM |
| Logs (VM) | `docker logs -f neighbornest` / per-service: `docker exec neighbornest tail -f /app/logs/<service>.log` |
| Logs (Render) | Render dashboard → service → Logs |
| Back up data | `docker exec neighbornest mysqldump -uroot -p"$MYSQL_PASSWORD" --databases ... > backup.sql` |
| Restart one service | `docker exec neighbornest kill <pid>` (it restarts only on container restart) |
