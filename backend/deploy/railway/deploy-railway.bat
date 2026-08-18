@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM  NeighborNest — Railway Automated Deployment (Windows CMD)
REM ============================================================================
REM
REM  This script creates a Railway project and all 10 services, sets build
REM  configuration, and deploys them in the correct order.
REM
REM  PREREQUISITES:
REM    1. Node.js 16+ installed (for Railway CLI)
REM    2. Git installed
REM    3. Your GitHub repo connected to Railway (via Railway dashboard once)
REM
REM  USAGE:
REM    cd backend\deploy\railway
REM    deploy-railway.bat
REM
REM  WHAT THIS SCRIPT DOES (automated):
REM    - Installs Railway CLI if missing
REM    - Authenticates with Railway
REM    - Creates the project
REM    - Adds MySQL database
REM    - Adds RabbitMQ (with STOMP) as a Docker image service
REM    - Adds all 8 Java services from GitHub
REM    - Sets build config (Dockerfile path) for each service
REM    - Sets environment variables for each service
REM    - Deploys services in the correct order
REM
REM  WHAT YOU MUST DO MANUALLY IN RAILWAY DASHBOARD (after running script):
REM    1. Set "Root Directory" to "backend" for each Java service
REM    2. Run the MySQL init SQL (6 CREATE DATABASE statements)
REM    3. Update variable references to use ${{Service.VAR}} syntax
REM    4. Enable Public Networking on api-gateway
REM    5. Set CORS_ALLOWED_ORIGINS and NOTIFICATION_BASE_URL
REM
REM ============================================================================

echo.
echo ============================================================
echo   NeighborNest — Railway Deployment Script
echo ============================================================
echo.

REM ── Configuration ──────────────────────────────────────────────────────────
set "PROJECT_NAME=neighbornest"
set "GITHUB_REPO=tadelakiran/neighbornest"
set "GITHUB_BRANCH=main"
set "JWT_SECRET=CHANGE_ME_generate_with_openssl_rand_base64_64"
set "INTERNAL_API_KEY=CHANGE_ME_generate_with_openssl_rand_hex_32"

REM ── Step 1: Install Railway CLI ────────────────────────────────────────────
echo [1/10] Checking Railway CLI...
where railway >nul 2>&1
if %errorlevel% neq 0 (
    echo       Installing Railway CLI...
    call npm i -g @railway/cli
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Railway CLI. Install manually: npm i -g @railway/cli
        exit /b 1
    )
    echo       Railway CLI installed successfully.
) else (
    echo       Railway CLI found.
)
echo.

REM ── Step 2: Login ─────────────────────────────────────────────────────────
echo [2/10] Checking Railway authentication...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo       Not logged in. Opening browser for authentication...
    echo       If the browser does not open, use: railway login --browserless
    call railway login
    if %errorlevel% neq 0 (
        echo ERROR: Login failed. Run 'railway login' manually first.
        exit /b 1
    )
) else (
    echo       Already authenticated.
)
echo.

REM ── Step 3: Create Project ────────────────────────────────────────────────
echo [3/10] Creating Railway project "%PROJECT_NAME%"...
railway init --name %PROJECT_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    echo       Project may already exist. Linking to existing project...
    railway link
)
echo       Project created/linked.
echo.

REM ── Step 4: Add MySQL ─────────────────────────────────────────────────────
echo [4/10] Adding MySQL database...
railway add --database mysql --service mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo       MySQL service may already exist. Continuing...
)
echo       MySQL added.
echo.

REM ── Step 5: Add RabbitMQ ──────────────────────────────────────────────────
echo [5/10] Adding RabbitMQ with STOMP plugin...
railway add --image rabbitmq:3-management --service rabbitmq >nul 2>&1
if %errorlevel% neq 0 (
    echo       RabbitMQ service may already exist. Continuing...
)

REM NOTE: RabbitMQ start command must be set in Railway dashboard:
REM   Service > Settings > Deploy > Custom Start Command:
REM   sh -c "rabbitmq-plugins enable --offline rabbitmq_stomp ^&^& rabbitmq-server"
REM   (The ^&^& is CMD escaping for &&)

railway variable set "PORT=5672" --service rabbitmq --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_DEFAULT_USER=neighbornest" --service rabbitmq --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_DEFAULT_PASS=neighbornest" --service rabbitmq --skip-deploys >nul 2>&1

echo       RabbitMQ added with STOMP.
echo.

REM ── Step 6: Add Java Services ─────────────────────────────────────────────
echo [6/10] Adding Java services...

REM -- eureka-service --
echo       Adding eureka-service...
railway add --repo %GITHUB_REPO% --branch %GITHUB_BRANCH% --service eureka-service >nul 2>&1
railway variable set "RAILWAY_DOCKERFILE_PATH=eureka-service/Dockerfile" --service eureka-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-service.railway.internal:8761/eureka/" --service eureka-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_INSTANCE_PREFER_IP_ADDRESS=false" --service eureka-service --skip-deploys >nul 2>&1

REM -- auth-service --
echo       Adding auth-service...
railway add --repo %GITHUB_REPO% --branch %GITHUB_BRANCH% --service auth-service >nul 2>&1
railway variable set "RAILWAY_DOCKERFILE_PATH=auth-service/Dockerfile" --service auth-service --skip-deploys >nul 2>&1
railway variable set "DB_NAME=neighbornest_auth" --service auth-service --skip-deploys >nul 2>&1
railway variable set "JWT_SECRET=%JWT_SECRET%" --service auth-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_SERVER_URL=http://eureka-service.railway.internal:8761/eureka/" --service auth-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_INSTANCE_PREFER_IP_ADDRESS=false" --service auth-service --skip-deploys >nul 2>&1
railway variable set "INTERNAL_API_KEY=%INTERNAL_API_KEY%" --service auth-service --skip-deploys >nul 2>&1

REM -- user-service --
echo       Adding user-service...
railway add --repo %GITHUB_REPO% --branch %GITHUB_BRANCH% --service user-service >nul 2>&1
railway variable set "RAILWAY_DOCKERFILE_PATH=user-service/Dockerfile" --service user-service --skip-deploys >nul 2>&1
railway variable set "DB_NAME=user_db" --service user-service --skip-deploys >nul 2>&1
railway variable set "JWT_SECRET=%JWT_SECRET%" --service user-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_SERVER_URL=http://eureka-service.railway.internal:8761/eureka/" --service user-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_INSTANCE_PREFER_IP_ADDRESS=false" --service user-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_HOST=rabbitmq.railway.internal" --service user-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PORT=5672" --service user-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_USER=neighbornest" --service user-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PASSWORD=neighbornest" --service user-service --skip-deploys >nul 2>&1

REM -- matching-service --
echo       Adding matching-service...
railway add --repo %GITHUB_REPO% --branch %GITHUB_BRANCH% --service matching-service >nul 2>&1
railway variable set "RAILWAY_DOCKERFILE_PATH=matching-service/Dockerfile" --service matching-service --skip-deploys >nul 2>&1
railway variable set "DB_NAME=matching_db" --service matching-service --skip-deploys >nul 2>&1
railway variable set "JWT_SECRET=%JWT_SECRET%" --service matching-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_SERVER_URL=http://eureka-service.railway.internal:8761/eureka/" --service matching-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_INSTANCE_PREFER_IP_ADDRESS=false" --service matching-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_HOST=rabbitmq.railway.internal" --service matching-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PORT=5672" --service matching-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_USER=neighbornest" --service matching-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PASSWORD=neighbornest" --service matching-service --skip-deploys >nul 2>&1

REM -- nest-service --
echo       Adding nest-service...
railway add --repo %GITHUB_REPO% --branch %GITHUB_BRANCH% --service nest-service >nul 2>&1
railway variable set "RAILWAY_DOCKERFILE_PATH=nest-service/Dockerfile" --service nest-service --skip-deploys >nul 2>&1
railway variable set "DB_NAME=nest_db" --service nest-service --skip-deploys >nul 2>&1
railway variable set "JWT_SECRET=%JWT_SECRET%" --service nest-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_SERVER_URL=http://eureka-service.railway.internal:8761/eureka/" --service nest-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_INSTANCE_PREFER_IP_ADDRESS=false" --service nest-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_HOST=rabbitmq.railway.internal" --service nest-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PORT=5672" --service nest-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_USER=neighbornest" --service nest-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PASSWORD=neighbornest" --service nest-service --skip-deploys >nul 2>&1

REM -- chat-service --
echo       Adding chat-service...
railway add --repo %GITHUB_REPO% --branch %GITHUB_BRANCH% --service chat-service >nul 2>&1
railway variable set "RAILWAY_DOCKERFILE_PATH=chat-service/Dockerfile" --service chat-service --skip-deploys >nul 2>&1
railway variable set "DB_NAME=chat_db" --service chat-service --skip-deploys >nul 2>&1
railway variable set "JWT_SECRET=%JWT_SECRET%" --service chat-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_SERVER_URL=http://eureka-service.railway.internal:8761/eureka/" --service chat-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_INSTANCE_PREFER_IP_ADDRESS=false" --service chat-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_HOST=rabbitmq.railway.internal" --service chat-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PORT=5672" --service chat-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_USER=neighbornest" --service chat-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PASSWORD=neighbornest" --service chat-service --skip-deploys >nul 2>&1
railway variable set "STOMP_RELAY_HOST=rabbitmq.railway.internal" --service chat-service --skip-deploys >nul 2>&1
railway variable set "STOMP_RELAY_PORT=61613" --service chat-service --skip-deploys >nul 2>&1

REM -- notification-service --
echo       Adding notification-service...
railway add --repo %GITHUB_REPO% --branch %GITHUB_BRANCH% --service notification-service >nul 2>&1
railway variable set "RAILWAY_DOCKERFILE_PATH=notification-service/Dockerfile" --service notification-service --skip-deploys >nul 2>&1
railway variable set "DB_NAME=notification_db" --service notification-service --skip-deploys >nul 2>&1
railway variable set "JWT_SECRET=%JWT_SECRET%" --service notification-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_SERVER_URL=http://eureka-service.railway.internal:8761/eureka/" --service notification-service --skip-deploys >nul 2>&1
railway variable set "EUREKA_INSTANCE_PREFER_IP_ADDRESS=false" --service notification-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_HOST=rabbitmq.railway.internal" --service notification-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PORT=5672" --service notification-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_USER=neighbornest" --service notification-service --skip-deploys >nul 2>&1
railway variable set "RABBITMQ_PASSWORD=neighbornest" --service notification-service --skip-deploys >nul 2>&1
railway variable set "INTERNAL_API_KEY=%INTERNAL_API_KEY%" --service notification-service --skip-deploys >nul 2>&1
railway variable set "NOTIFICATION_BASE_URL=https://your-frontend.vercel.app" --service notification-service --skip-deploys >nul 2>&1

REM -- api-gateway --
echo       Adding api-gateway...
railway add --repo %GITHUB_REPO% --branch %GITHUB_BRANCH% --service api-gateway >nul 2>&1
railway variable set "RAILWAY_DOCKERFILE_PATH=api-gateway/Dockerfile" --service api-gateway --skip-deploys >nul 2>&1
railway variable set "JWT_SECRET=%JWT_SECRET%" --service api-gateway --skip-deploys >nul 2>&1
railway variable set "EUREKA_SERVER_URL=http://eureka-service.railway.internal:8761/eureka/" --service api-gateway --skip-deploys >nul 2>&1
railway variable set "EUREKA_INSTANCE_PREFER_IP_ADDRESS=false" --service api-gateway --skip-deploys >nul 2>&1
railway variable set "CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app" --service api-gateway --skip-deploys >nul 2>&1

echo       All 8 Java services added.
echo.

REM ── Step 7: Summary ───────────────────────────────────────────────────────
echo ============================================================
echo   Services Created. Manual Steps Required:
echo ============================================================
echo.
echo   Open the Railway dashboard: https://railway.app
echo.
echo   1. SET ROOT DIRECTORY (for each Java service):
echo      Click service ^> Settings ^> Source ^> Root Directory = "backend"
echo      Services: eureka-service, auth-service, user-service,
echo                matching-service, nest-service, chat-service,
echo                notification-service, api-gateway
echo.
echo   2. SET RABBITMQ START COMMAND:
echo      Click rabbitmq ^> Settings ^> Deploy ^> Custom Start Command:
echo      sh -c "rabbitmq-plugins enable --offline rabbitmq_stomp ^&^& rabbitmq-server"
echo.
echo   3. INITIALIZE MySQL DATABASES:
echo      Click MySQL service ^> Data tab ^> Query, then run:
echo        CREATE DATABASE IF NOT EXISTS neighbornest_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo        CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo        CREATE DATABASE IF NOT EXISTS matching_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo        CREATE DATABASE IF NOT EXISTS nest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo        CREATE DATABASE IF NOT EXISTS chat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo        CREATE DATABASE IF NOT EXISTS notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo.
echo   4. SET MySQL VARIABLE REFERENCES (for each Java service):
echo      In each service's Variables tab, update:
echo        MYSQLHOST = ${{MySQL.MYSQLHOST}}
echo        MYSQLPORT = ${{MySQL.MYSQLPORT}}
echo        MYSQL_USER = ${{MySQL.MYSQLUSER}}
echo        MYSQL_PASSWORD = ${{MySQL.MYSQLPASSWORD}}
echo.
echo   5. ENABLE PUBLIC NETWORKING on api-gateway:
echo      Click api-gateway ^> Settings ^> Networking ^> Generate Domain
echo.
echo   6. UPDATE CORS and NOTIFICATION URL after getting the public URL.
echo.
echo ============================================================
echo.

REM ── Step 8: Deploy in Order ──────────────────────────────────────────────
echo [8/10] Deploying services in order...
echo.

echo       Deploying eureka-service (must start first)...
railway up --service eureka-service --detach 2>nul
echo       Waiting 60s for eureka-service to start...
timeout /t 60 /nobreak >nul

echo       Deploying infrastructure services...
railway up --service rabbitmq --detach 2>nul

echo       Deploying domain services...
railway up --service auth-service --detach 2>nul
railway up --service user-service --detach 2>nul
railway up --service matching-service --detach 2>nul
railway up --service nest-service --detach 2>nul
railway up --service chat-service --detach 2>nul
railway up --service notification-service --detach 2>nul

echo       Deploying api-gateway (last)...
railway up --service api-gateway --detach 2>nul

echo.
echo ============================================================
echo   Deployment triggered! Check progress at:
echo   https://railway.app/project
echo ============================================================
echo.
echo   Generate production secrets with:
echo     openssl rand -base64 64    ^(for JWT_SECRET^)
echo     openssl rand -hex 32       ^(for INTERNAL_API_KEY^)
echo.
echo   Then update the variables in the Railway dashboard.
echo.
pause
