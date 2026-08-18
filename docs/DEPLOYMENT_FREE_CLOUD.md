# 🆓 Free Cloud Deployment — Oracle VM + Vercel

Deploys the **entire NeighborNest stack** (8 Spring Boot microservices, MySQL,
RabbitMQ with STOMP, realtime chat WebSockets) to the public internet for
**$0/month**:

| Piece | Where | Cost |
|---|---|---|
| Backend (8 services + MySQL + RabbitMQ) | Oracle Cloud **Always Free** ARM VM | $0 |
| HTTPS for the API | Caddy (Let's Encrypt) on the VM | $0 |
| DNS for the API | DuckDNS free subdomain | $0 |
| Frontend (React/Vite) | Vercel Hobby (free) | $0 |

```
 Browser ── HTTPS ──> Vercel (React app)
     │                    │  REST + WSS /ws/chat
     │                    ▼
     │            https://<your-api>.duckdns.org   (Caddy, auto-HTTPS)
     │                    │
     │                    ▼
     │            api-gateway:8080 ──> eureka ──> 7 domain services
     └─────────────────────┴────────── MySQL (6 DBs) · RabbitMQ (STOMP)
```

> **Why HTTPS matters:** Vercel serves the frontend over HTTPS, and browsers
> block HTTP requests from HTTPS pages (mixed content). The API must therefore
> also be HTTPS — Caddy on the VM provides that for free.

---

## Part 0 — What you need

- GitHub account with this repo (`tadelakiran/neighbornest`).
- Email + credit/debit card for the Oracle sign-up (**never charged** for the
  free tier — Oracle uses it only to verify the account).
- ~10 minutes of hands-on account setup; the rest is scripted.

---

## Part 1 — Oracle Cloud VM (the backend host)

1. Sign up at <https://signup.cloud.oracle.com> (choose **Free Tier**; don't
   upgrade to PAYG).
2. In the console: **Compute → Instances → Create instance**:
   - **Image**: Canonical Ubuntu 22.04 (or 24.04) **Minimal/Server**.
   - **Shape**: **Ampere A1 (ARM)**. Always Free covers 4 OCPU / 24 GB RAM
     (recent accounts may see 2 OCPU / 12 GB — the stack fits either; 4/24 is
     preferred).
   - **Boot volume**: default (50 GB) is fine.
   - **SSH key**: add your public key (or generate a new key pair and save the
     `.pem`).
   - Leave everything else default → **Create**.
3. Note the VM's **public IP**.
4. **Open ports 22, 80, 443**: in the console go to **Networking → Virtual
   Cloud Networks → your VCN → Security Lists → Default Security List → Add
   Ingress Rules** and add:
   - `22/tcp` (SSH), `80/tcp` (Caddy HTTP → Let's Encrypt challenge),
     `443/tcp` (HTTPS API).
   - Source CIDR `0.0.0.0/0` for all three. Ports 8080/8081/… stay **closed** —
     only Caddy (80/443) is public.
5. SSH in (from your machine):
   ```bash
   ssh -i your-key.pem ubuntu@<PUBLIC_IP>
   ```

## Part 2 — DuckDNS (free domain for the API)

1. Create a free account at <https://www.duckdns.org> (login with any social/email).
2. Add a subdomain, e.g. `neighbornest-api`, and set its **A record to the VM's
   public IP**.
3. Verify it resolves: `ping neighbornest-api.duckdns.org`.

## Part 3 — Deploy the backend on the VM

```bash
# 1. Clone the repo (or copy it over with scp)
git clone git@github.com:tadelakiran/neighbornest.git
cd neighbornest/backend

# 2. One-time VM setup (Docker + Compose plugin + swap)
bash deploy/setup_vm.sh
#    ...re-login if it added you to the docker group

# 3. Create secrets (script auto-generates MYSQL_PASSWORD/JWT_SECRET/INTERNAL_API_KEY)
#    then EDIT backend/.env.prod and fill in:
#      API_DOMAIN=neighbornest-api.duckdns.org
#      CORS_ALLOWED_ORIGINS=https://<your-app>.vercel.app   (from Part 4 — or set after)
#      NOTIFICATION_BASE_URL=https://<your-app>.vercel.app

# 4. Build & start (first build downloads Maven deps — 20–60 min on the free VM)
bash deploy/deploy.sh
```

When `deploy.sh` prints **"API gateway is healthy"** the backend is live.
Verify:

```bash
curl -s https://neighbornest-api.duckdns.org/actuator/health
# → {"status":"UP"}
```

Debug with `bash deploy/logs.sh <service>`.

## Part 4 — Deploy the frontend on Vercel

1. Push the repo to GitHub (the changes include `frontend/vercel.json`, which
   adds the SPA rewrite so deep links like `/login` work).
2. Go to <https://vercel.com/new> → **Import** the `neighbornest` repo.
3. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (default) · **Output**: `dist`
4. Under **Environment Variables** add:
   - `VITE_API_URL` = `https://neighbornest-api.duckdns.org`
5. **Deploy**. Vercel gives you `https://<your-app>.vercel.app`.

> If you set the Vercel URL *after* deploying the backend, update
> `CORS_ALLOWED_ORIGINS` in `backend/.env.prod` on the VM and re-run
> `bash deploy/deploy.sh` (or `docker compose ... up -d` for the gateway).

## Part 5 — Smoke test

1. Open `https://<your-app>.vercel.app` → register a new account.
2. Complete the profile + onboarding.
3. Open the Messages page — the chat WebSocket connects over
   `wss://neighbornest-api.duckdns.org/ws/chat` (SockJS → STOMP → RabbitMQ).

## ⚡ Health / keep-alive (`GET /health`)

The API Gateway exposes a dedicated, isolated liveness endpoint:

```
GET https://<your-api-domain>/health
→ 200 {"status":"UP"}
```

- It returns **HTTP 200** with a tiny `{"status":"UP"}` body.
- It performs **no database (MySQL) queries**, **no RabbitMQ access**, **no
  calls to other microservices**, and **no authentication logic**. It does not
  read or modify any application state and logs nothing per request.
- It is served directly by the API Gateway process itself, so it works behind
  the gateway with no extra routing. The infrastructure `/actuator/health`
  endpoint (used by Docker healthchecks and `deploy.sh`) is unchanged.

> ⚠️ **A browser cannot keep the backend awake by itself.** The optional
> frontend keep-alive below only runs while someone has the app open in a
> tab. It must never be relied on as the primary mechanism for keeping a
> sleeping backend alive (e.g. Render's free tier).

**Recommended: external uptime/monitoring.** Point a free uptime/monitoring
service (UptimeRobot, Cronitor, Better Uptime, a cron job, or a Render
Cron Job) at `/health` and have it ping the endpoint every few minutes. That
runs 24/7 regardless of whether anyone has the frontend open, and it doubles
as an availability alert.

### Optional browser keep-alive (disabled by default)

A small, invisible keep-alive ships with the frontend for convenience. It is
**disabled by default** and must be enabled explicitly via environment
variables on Vercel (or your frontend host):

| Variable | Value |
|---|---|
| `VITE_ENABLE_KEEP_ALIVE` | `true` to enable, `false` (default) to disable |
| `VITE_KEEP_ALIVE_INTERVAL_MS` | Ping interval in ms (default `600000` = 10 min) |

When enabled, the app silently pings `GET /health` on `VITE_API_URL` at the
configured interval. It renders nothing, blocks nothing, and does not touch
auth state, storage, routing, or the chat WebSockets. Setting
`VITE_ENABLE_KEEP_ALIVE=false` (or removing it) fully disables it — no
periodic requests are made.

## Maintenance

| Task | Command (on the VM, in `backend/`) |
|---|---|
| Pull latest + rebuild | `git pull && bash deploy/deploy.sh` |
| Restart a service | `bash deploy/logs.sh` → or `docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml restart <svc>` |
| View logs | `bash deploy/logs.sh chat-service` / `bash deploy/logs.sh --all` |
| Database backup | `docker exec neighbornest-mysql mysqldump -uroot -p"$MYSQL_PASSWORD" --all-databases > backup.sql` |
| All services auto-restart | on VM reboot (every container has `restart: unless-stopped`) |

## Troubleshooting

| Symptom | Fix |
|---|---|
| `curl https://…/actuator/health` times out | Ports 80/443 not open in the Oracle **security list** (Part 1, step 4). |
| Certificate errors on the API | DuckDNS A record must point at the VM's public IP *before* Caddy starts; then `docker compose ... restart caddy`. |
| Login/register fails, gateway returns 503 fallback | A service hasn't finished cold-booting or hit the DB — `bash deploy/logs.sh <svc>` and check MySQL is healthy (`docker compose ... ps mysql`). |
| Browser blocks API calls (mixed content) | `VITE_API_URL` on Vercel must be `https://…`, never `http://`. |
| Chat won't connect | Check the RabbitMQ STOMP relay in `chat-service` logs; confirm the browser reaches `wss://…/ws/chat` (Network tab). |
| VM feels slow during first build | Expected — 2 OCPU. Subsequent rebuilds are fast (shared Maven cache + BuildKit). |
| No real OTP emails | Replace the default EmailJS keys in `backend/.env.prod` with your own dashboard keys. |
