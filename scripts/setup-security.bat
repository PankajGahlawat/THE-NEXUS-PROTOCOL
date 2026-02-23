@echo off
REM NEXUS PROTOCOL - Security Setup Script (Windows)
REM Generates secure credentials and creates .env file

echo ============================================
echo NEXUS PROTOCOL - Security Setup
echo ============================================
echo.

REM Check if .env already exists
if exist .env (
    echo WARNING: .env file already exists!
    set /p overwrite="Do you want to overwrite it? (yes/no): "
    if not "!overwrite!"=="yes" (
        echo Setup cancelled.
        exit /b 0
    )
    echo.
)

echo Generating JWT secret...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i

echo Generating database password...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set DB_PASSWORD=%%i

echo.
echo CORS Configuration
set /p CORS_ORIGIN="Enter allowed CORS origins (comma-separated, e.g., http://localhost:3000): "
if "%CORS_ORIGIN%"=="" set CORS_ORIGIN=http://localhost:3000

echo.
echo Creating .env file...

(
echo # NEXUS PROTOCOL Environment Configuration
echo # Generated: %date% %time%
echo # SECURITY: Keep this file secure and never commit to version control
echo.
echo # Application Settings
echo NODE_ENV=production
echo LOG_LEVEL=info
echo.
echo # Server Ports
echo FRONTEND_PORT=3000
echo BACKEND_PORT=3001
echo POSTGRES_PORT=5432
echo.
echo # Database Configuration
echo DATABASE_TYPE=postgresql
echo POSTGRES_HOST=postgres
echo POSTGRES_PORT=5432
echo POSTGRES_DB=nexus_protocol
echo POSTGRES_USER=nexus
echo POSTGRES_PASSWORD=%DB_PASSWORD%
echo.
echo # Connection Pool
echo POSTGRES_POOL_MIN=10
echo POSTGRES_POOL_MAX=50
echo.
echo # Security Settings
echo JWT_SECRET=%JWT_SECRET%
echo JWT_EXPIRATION=24h
echo CORS_ORIGIN=%CORS_ORIGIN%
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW=60000
echo RATE_LIMIT_MAX=100
echo DDOS_THRESHOLD=50
echo.
echo # Frontend Configuration
echo VITE_API_URL=http://localhost:3001
echo VITE_WS_URL=ws://localhost:3001
echo.
echo # Cyber Range Configuration
echo CYBER_RANGE_NETWORK=192.168.100.0/24
echo CYBER_RANGE_GATEWAY=192.168.100.1
echo TIER1_IP_RANGE=192.168.100.10-19
echo TIER2_IP_RANGE=192.168.100.20-29
echo TIER3_IP_RANGE=192.168.100.30-39
echo.
echo # VM Manager
echo VM_MANAGER_PORT=9000
echo HEALTH_CHECK_INTERVAL=30000
echo MAX_RESTART_ATTEMPTS=3
echo.
echo # Game Configuration
echo ROUND_DURATION=3600
echo PHASE_DURATIONS=1200,1200,1200
echo SPEED_BONUS_MULTIPLIER=10
echo STEALTH_BONUS_MULTIPLIER=20
echo TRACE_DECAY_RATE=0.01
echo BURN_THRESHOLDS=25,50,75
echo.
echo # Logging Configuration
echo AUDIT_LOG_DIR=./logs
echo AUDIT_LOG_MAX_SIZE=10485760
echo AUDIT_LOG_MAX_FILES=10
echo.
echo # WebSocket Configuration
echo WS_MESSAGE_RATE_LIMIT=10
echo WS_MESSAGE_SIZE_LIMIT=100000
echo.
echo # Emergency Settings
echo EMERGENCY_CONTACT_EMAIL=admin@nexus-protocol.local
echo EMERGENCY_NOTIFICATION_WEBHOOK=
echo.
echo # Development Settings
echo DEBUG=false
echo ENABLE_SWAGGER=false
echo MOCK_VM_VALIDATION=false
) > .env

echo.
echo ============================================
echo Security setup complete!
echo ============================================
echo.
echo Generated credentials have been saved to .env
echo.
echo IMPORTANT SECURITY NOTES:
echo   1. .env file has been created
echo   2. NEVER commit .env to version control
echo   3. Keep these credentials secure
echo   4. Rotate credentials regularly
echo   5. Use different credentials for each environment
echo.
echo Next steps:
echo   1. Review .env file: type .env
echo   2. Start services: docker-compose up -d
echo   3. Check logs: docker-compose logs -f
echo.
pause
