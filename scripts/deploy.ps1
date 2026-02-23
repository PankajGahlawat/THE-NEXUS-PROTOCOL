# NEXUS PROTOCOL - Quick Deployment Script
# Run this script to deploy the entire system

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXUS PROTOCOL - Quick Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "[1/6] Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if .env exists
Write-Host ""
Write-Host "[2/6] Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Update .env with production values before deploying to production!" -ForegroundColor Yellow
}

# Stop any existing containers
Write-Host ""
Write-Host "[3/6] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "✓ Cleanup complete" -ForegroundColor Green

# Pull images (optional but recommended)
Write-Host ""
Write-Host "[4/6] Pulling Docker images..." -ForegroundColor Yellow
Write-Host "(This may take a few minutes on first run)" -ForegroundColor Gray
docker-compose pull
Write-Host "✓ Images ready" -ForegroundColor Green

# Start services
Write-Host ""
Write-Host "[5/6] Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be healthy
Write-Host ""
Write-Host "[6/6] Waiting for services to be healthy..." -ForegroundColor Yellow
Write-Host "(This may take 30-60 seconds)" -ForegroundColor Gray

$maxAttempts = 30
$attempt = 0
$allHealthy = $false

while ($attempt -lt $maxAttempts -and -not $allHealthy) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $allHealthy = $true
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

Write-Host ""

if ($allHealthy) {
    Write-Host "✓ All services are healthy!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Services are starting but not yet healthy" -ForegroundColor Yellow
    Write-Host "   Run 'docker-compose ps' to check status" -ForegroundColor Gray
}

# Display status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Access URLs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend:      " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API:   " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host "Health Check:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "API Docs:      " -NoNewline -ForegroundColor White
Write-Host "See documentation/API.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Quick Commands" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs:     " -NoNewline -ForegroundColor White
Write-Host "docker-compose logs -f" -ForegroundColor Gray
Write-Host "Stop services: " -NoNewline -ForegroundColor White
Write-Host "docker-compose down" -ForegroundColor Gray
Write-Host "Restart:       " -NoNewline -ForegroundColor White
Write-Host "docker-compose restart" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open http://localhost:3000 to start playing!" -ForegroundColor Yellow
Write-Host ""
Write-Host "For troubleshooting, see:" -ForegroundColor White
Write-Host "  - DEPLOY_NOW.md" -ForegroundColor Gray
Write-Host "  - documentation/OPERATOR_GUIDE.md" -ForegroundColor Gray
Write-Host ""
