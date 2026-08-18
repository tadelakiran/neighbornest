# ============================================================================
#  NeighborNest — Railway Automated Deployment (PowerShell)
# ============================================================================
#
#  This script creates a Railway project and all 10 services, sets build
#  configuration, and deploys them in the correct order.
#
#  PREREQUISITES:
#    1. Node.js 16+ installed (for Railway CLI)
#    2. Git installed
#    3. Your GitHub repo connected to Railway (via Railway dashboard once)
#
#  USAGE:
#    cd backend\deploy\railway
#    .\deploy-railway.ps1
#
#  WHAT THIS SCRIPT DOES (automated):
#    - Installs Railway CLI if missing
#    - Authenticates with Railway
#    - Creates the project
#    - Adds MySQL database
#    - Adds RabbitMQ (with STOMP) as a Docker image service
#    - Adds all 8 Java services from GitHub
#    - Sets build config (Dockerfile path) for each service
#    - Sets environment variables for each service
#    - Deploys services in the correct order
#
#  WHAT YOU MUST DO MANUALLY IN RAILWAY DASHBOARD (after running script):
#    1. Set "Root Directory" to "backend" for each Java service
#    2. Run the MySQL init SQL (6 CREATE DATABASE statements)
#    3. Update variable references to use ${{Service.VAR}} syntax
#    4. Enable Public Networking on api-gateway
#    5. Set CORS_ALLOWED_ORIGINS and NOTIFICATION_BASE_URL
#
# ============================================================================

$ErrorActionPreference = "Continue"

# ── Configuration ──────────────────────────────────────────────────────────
$PROJECT_NAME   = "neighbornest"
$GITHUB_REPO    = "tadelakiran/neighbornest"
$GITHUB_BRANCH  = "main"
$JWT_SECRET     = "CHANGE_ME_generate_with_openssl_rand_base64_64"
$INTERNAL_API_KEY = "CHANGE_ME_generate_with_openssl_rand_hex_32"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  NeighborNest — Railway Deployment Script (PowerShell)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Helper function ────────────────────────────────────────────────────────
function Invoke-Railway {
    param([string[]]$Args)
    $result = & railway @Args 2>&1
    return $result
}

function Set-ServiceVar {
    param(
        [string]$Service,
        [string]$Key,
        [string]$Value
    )
    Write-Host "         $Key" -ForegroundColor DarkGray
    railway variable set "$Key=$Value" --service $Service --skip-deploys 2>$null | Out-Null
}

# ── Step 1: Install Railway CLI ────────────────────────────────────────────
Write-Host "[1/10] Checking Railway CLI..." -ForegroundColor Yellow
$cliPath = Get-Command railway -ErrorAction SilentlyContinue
if (-not $cliPath) {
    Write-Host "       Installing Railway CLI..." -ForegroundColor White
    npm i -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install Railway CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "       Railway CLI installed." -ForegroundColor Green
} else {
    Write-Host "       Railway CLI found." -ForegroundColor Green
}
Write-Host ""

# ── Step 2: Login ─────────────────────────────────────────────────────────
Write-Host "[2/10] Checking Railway authentication..." -ForegroundColor Yellow
railway whoami 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "       Not logged in. Opening browser..." -ForegroundColor White
    Write-Host "       If browser doesn't open, use: railway login --browserless" -ForegroundColor DarkGray
    railway login
} else {
    Write-Host "       Already authenticated." -ForegroundColor Green
}
Write-Host ""

# ── Step 3: Create Project ────────────────────────────────────────────────
Write-Host "[3/10] Creating Railway project '$PROJECT_NAME'..." -ForegroundColor Yellow
railway init --name $PROJECT_NAME 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "       Project may exist. Linking..." -ForegroundColor DarkGray
    railway link 2>$null | Out-Null
}
Write-Host "       Project ready." -ForegroundColor Green
Write-Host ""

# ── Step 4: Add MySQL ─────────────────────────────────────────────────────
Write-Host "[4/10] Adding MySQL database..." -ForegroundColor Yellow
railway add --database mysql --service mysql 2>$null | Out-Null
Write-Host "       MySQL added." -ForegroundColor Green
Write-Host ""

# ── Step 5: Add RabbitMQ ──────────────────────────────────────────────────
Write-Host "[5/10] Adding RabbitMQ with STOMP plugin..." -ForegroundColor Yellow
railway add --image "rabbitmq:3-management" --service rabbitmq 2>$null | Out-Null
Set-ServiceVar "rabbitmq" "RAILWAY_START_COMMAND" "sh -c 'rabbitmq-plugins enable --offline rabbitmq_stomp && rabbitmq-server'"
Set-ServiceVar "rabbitmq" "RABBITMQ_DEFAULT_USER" "neighbornest"
Set-ServiceVar "rabbitmq" "RABBITMQ_DEFAULT_PASS" "neighbornest"
Set-ServiceVar "rabbitmq" "PORT" "5672"
Write-Host "       RabbitMQ added with STOMP." -ForegroundColor Green
Write-Host ""

# ── Step 6: Add Java Services ─────────────────────────────────────────────
Write-Host "[6/10] Adding Java services..." -ForegroundColor Yellow

# Common variables for services that need MySQL + RabbitMQ
$commonMysqlVars = @(
    @("MYSQLHOST", '${{MySQL.MYSQLHOST}}'),
    @("MYSQLPORT", '${{MySQL.MYSQLPORT}}'),
    @("MYSQL_USER", '${{MySQL.MYSQLUSER}}'),
    @("MYSQL_PASSWORD", '${{MySQL.MYSQLPASSWORD}}')
)

$commonRabbitVars = @(
    @("RABBITMQ_HOST", "rabbitmq.railway.internal"),
    @("RABBITMQ_PORT", "5672"),
    @("RABBITMQ_USER", "neighbornest"),
    @("RABBITMQ_PASSWORD", "neighbornest")
)

$commonEurekaVars = @(
    @("EUREKA_SERVER_URL", "http://eureka-service.railway.internal:8761/eureka/"),
    @("EUREKA_INSTANCE_PREFER_IP_ADDRESS", "false")
)

# ── eureka-service ──
Write-Host "       Adding eureka-service..." -ForegroundColor White
railway add --repo $GITHUB_REPO --branch $GITHUB_BRANCH --service eureka-service 2>$null | Out-Null
Set-ServiceVar "eureka-service" "RAILWAY_DOCKERFILE_PATH" "eureka-service/Dockerfile"
Set-ServiceVar "eureka-service" "EUREKA_CLIENT_SERVICEURL_DEFAULTZONE" "http://eureka-service.railway.internal:8761/eureka/"
Set-ServiceVar "eureka-service" "EUREKA_INSTANCE_PREFER_IP_ADDRESS" "false"

# ── auth-service ──
Write-Host "       Adding auth-service..." -ForegroundColor White
railway add --repo $GITHUB_REPO --branch $GITHUB_BRANCH --service auth-service 2>$null | Out-Null
Set-ServiceVar "auth-service" "RAILWAY_DOCKERFILE_PATH" "auth-service/Dockerfile"
Set-ServiceVar "auth-service" "DB_NAME" "neighbornest_auth"
Set-ServiceVar "auth-service" "JWT_SECRET" $JWT_SECRET
Set-ServiceVar "auth-service" "INTERNAL_API_KEY" $INTERNAL_API_KEY
foreach ($v in $commonMysqlVars)   { Set-ServiceVar "auth-service" $v[0] $v[1] }
foreach ($v in $commonEurekaVars)  { Set-ServiceVar "auth-service" $v[0] $v[1] }

# ── user-service ──
Write-Host "       Adding user-service..." -ForegroundColor White
railway add --repo $GITHUB_REPO --branch $GITHUB_BRANCH --service user-service 2>$null | Out-Null
Set-ServiceVar "user-service" "RAILWAY_DOCKERFILE_PATH" "user-service/Dockerfile"
Set-ServiceVar "user-service" "DB_NAME" "user_db"
Set-ServiceVar "user-service" "JWT_SECRET" $JWT_SECRET
foreach ($v in $commonMysqlVars)    { Set-ServiceVar "user-service" $v[0] $v[1] }
foreach ($v in $commonEurekaVars)   { Set-ServiceVar "user-service" $v[0] $v[1] }
foreach ($v in $commonRabbitVars)   { Set-ServiceVar "user-service" $v[0] $v[1] }

# ── matching-service ──
Write-Host "       Adding matching-service..." -ForegroundColor White
railway add --repo $GITHUB_REPO --branch $GITHUB_BRANCH --service matching-service 2>$null | Out-Null
Set-ServiceVar "matching-service" "RAILWAY_DOCKERFILE_PATH" "matching-service/Dockerfile"
Set-ServiceVar "matching-service" "DB_NAME" "matching_db"
Set-ServiceVar "matching-service" "JWT_SECRET" $JWT_SECRET
foreach ($v in $commonMysqlVars)    { Set-ServiceVar "matching-service" $v[0] $v[1] }
foreach ($v in $commonEurekaVars)   { Set-ServiceVar "matching-service" $v[0] $v[1] }
foreach ($v in $commonRabbitVars)   { Set-ServiceVar "matching-service" $v[0] $v[1] }

# ── nest-service ──
Write-Host "       Adding nest-service..." -ForegroundColor White
railway add --repo $GITHUB_REPO --branch $GITHUB_BRANCH --service nest-service 2>$null | Out-Null
Set-ServiceVar "nest-service" "RAILWAY_DOCKERFILE_PATH" "nest-service/Dockerfile"
Set-ServiceVar "nest-service" "DB_NAME" "nest_db"
Set-ServiceVar "nest-service" "JWT_SECRET" $JWT_SECRET
foreach ($v in $commonMysqlVars)    { Set-ServiceVar "nest-service" $v[0] $v[1] }
foreach ($v in $commonEurekaVars)   { Set-ServiceVar "nest-service" $v[0] $v[1] }
foreach ($v in $commonRabbitVars)   { Set-ServiceVar "nest-service" $v[0] $v[1] }

# ── chat-service ──
Write-Host "       Adding chat-service..." -ForegroundColor White
railway add --repo $GITHUB_REPO --branch $GITHUB_BRANCH --service chat-service 2>$null | Out-Null
Set-ServiceVar "chat-service" "RAILWAY_DOCKERFILE_PATH" "chat-service/Dockerfile"
Set-ServiceVar "chat-service" "DB_NAME" "chat_db"
Set-ServiceVar "chat-service" "JWT_SECRET" $JWT_SECRET
Set-ServiceVar "chat-service" "STOMP_RELAY_HOST" "rabbitmq.railway.internal"
Set-ServiceVar "chat-service" "STOMP_RELAY_PORT" "61613"
foreach ($v in $commonMysqlVars)    { Set-ServiceVar "chat-service" $v[0] $v[1] }
foreach ($v in $commonEurekaVars)   { Set-ServiceVar "chat-service" $v[0] $v[1] }
foreach ($v in $commonRabbitVars)   { Set-ServiceVar "chat-service" $v[0] $v[1] }

# ── notification-service ──
Write-Host "       Adding notification-service..." -ForegroundColor White
railway add --repo $GITHUB_REPO --branch $GITHUB_BRANCH --service notification-service 2>$null | Out-Null
Set-ServiceVar "notification-service" "RAILWAY_DOCKERFILE_PATH" "notification-service/Dockerfile"
Set-ServiceVar "notification-service" "DB_NAME" "notification_db"
Set-ServiceVar "notification-service" "JWT_SECRET" $JWT_SECRET
Set-ServiceVar "notification-service" "INTERNAL_API_KEY" $INTERNAL_API_KEY
Set-ServiceVar "notification-service" "NOTIFICATION_BASE_URL" "https://your-frontend.vercel.app"
foreach ($v in $commonMysqlVars)    { Set-ServiceVar "notification-service" $v[0] $v[1] }
foreach ($v in $commonEurekaVars)   { Set-ServiceVar "notification-service" $v[0] $v[1] }
foreach ($v in $commonRabbitVars)   { Set-ServiceVar "notification-service" $v[0] $v[1] }

# ── api-gateway ──
Write-Host "       Adding api-gateway..." -ForegroundColor White
railway add --repo $GITHUB_REPO --branch $GITHUB_BRANCH --service api-gateway 2>$null | Out-Null
Set-ServiceVar "api-gateway" "RAILWAY_DOCKERFILE_PATH" "api-gateway/Dockerfile"
Set-ServiceVar "api-gateway" "JWT_SECRET" $JWT_SECRET
Set-ServiceVar "api-gateway" "CORS_ALLOWED_ORIGINS" "https://your-frontend.vercel.app"
foreach ($v in $commonEurekaVars)   { Set-ServiceVar "api-gateway" $v[0] $v[1] }

Write-Host "       All 8 Java services added." -ForegroundColor Green
Write-Host ""

# ── Step 7: Manual Steps Summary ──────────────────────────────────────────
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Services Created. Manual Steps Required:" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Open the Railway dashboard: https://railway.app" -ForegroundColor White
Write-Host ""
Write-Host "  1. SET ROOT DIRECTORY (for each Java service):" -ForegroundColor Yellow
Write-Host "     Click service > Settings > Source > Root Directory = "backend"" -ForegroundColor White
Write-Host "     Services: eureka-service, auth-service, user-service," -ForegroundColor DarkGray
Write-Host "               matching-service, nest-service, chat-service," -ForegroundColor DarkGray
Write-Host "               notification-service, api-gateway" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. SET RABBITMQ START COMMAND:" -ForegroundColor Yellow
Write-Host "     Click rabbitmq > Settings > Deploy > Custom Start Command:" -ForegroundColor White
Write-Host '     sh -c "rabbitmq-plugins enable --offline rabbitmq_stomp && rabbitmq-server"' -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. INITIALIZE MySQL DATABASES:" -ForegroundColor Yellow
Write-Host "     Click MySQL service > Data tab > Query, then run:" -ForegroundColor White
Write-Host "       CREATE DATABASE IF NOT EXISTS neighbornest_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor DarkGray
Write-Host "       CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor DarkGray
Write-Host "       CREATE DATABASE IF NOT EXISTS matching_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor DarkGray
Write-Host "       CREATE DATABASE IF NOT EXISTS nest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor DarkGray
Write-Host "       CREATE DATABASE IF NOT EXISTS chat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor DarkGray
Write-Host "       CREATE DATABASE IF NOT EXISTS notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  4. SET MySQL VARIABLE REFERENCES (for each Java service):" -ForegroundColor Yellow
Write-Host "     In each service's Variables tab, update:" -ForegroundColor White
Write-Host "       MYSQLHOST = `${{MySQL.MYSQLHOST}}" -ForegroundColor DarkGray
Write-Host "       MYSQLPORT = `${{MySQL.MYSQLPORT}}" -ForegroundColor DarkGray
Write-Host "       MYSQL_USER = `${{MySQL.MYSQLUSER}}" -ForegroundColor DarkGray
Write-Host "       MYSQL_PASSWORD = `${{MySQL.MYSQLPASSWORD}}" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  5. ENABLE PUBLIC NETWORKING on api-gateway:" -ForegroundColor Yellow
Write-Host "     Click api-gateway > Settings > Networking > Generate Domain" -ForegroundColor White
Write-Host ""
Write-Host "  6. UPDATE CORS and NOTIFICATION URL after getting the public URL." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 8: Deploy in Order ──────────────────────────────────────────────
Write-Host "[8/10] Deploying services in order..." -ForegroundColor Yellow
Write-Host ""

Write-Host "       Deploying eureka-service (must start first)..." -ForegroundColor White
railway up --service eureka-service --detach 2>$null
Write-Host "       Waiting 60s for eureka-service to initialize..." -ForegroundColor DarkGray
Start-Sleep -Seconds 60

Write-Host "       Deploying infrastructure services..." -ForegroundColor White
railway up --service rabbitmq --detach 2>$null

Write-Host "       Deploying domain services..." -ForegroundColor White
railway up --service auth-service --detach 2>$null
railway up --service user-service --detach 2>$null
railway up --service matching-service --detach 2>$null
railway up --service nest-service --detach 2>$null
railway up --service chat-service --detach 2>$null
railway up --service notification-service --detach 2>$null

Write-Host "       Deploying api-gateway (last)..." -ForegroundColor White
railway up --service api-gateway --detach 2>$null

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Deployment triggered! Check progress at:" -ForegroundColor Green
Write-Host "  https://railway.app/project" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Generate production secrets with:" -ForegroundColor Yellow
Write-Host "    openssl rand -base64 64    (for JWT_SECRET)" -ForegroundColor DarkGray
Write-Host "    openssl rand -hex 32       (for INTERNAL_API_KEY)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Then update the variables in the Railway dashboard." -ForegroundColor White
Write-Host ""
