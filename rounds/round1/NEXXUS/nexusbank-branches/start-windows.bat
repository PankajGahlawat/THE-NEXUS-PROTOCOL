@echo off
set PATH=%PATH%;C:\Program Files\nodejs

echo.
echo ================================================
echo   🏦 NexusBank CTF - Starting All 6 Servers
echo ================================================
echo.

echo 📦 Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js found

echo.
echo 📦 Installing dependencies (this may take a few minutes)...
echo.

echo [1/6] Branch A Backend...
cd branch-a\backend && call npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install Branch A backend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo [2/6] Branch A Frontend...
cd branch-a\frontend && call npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install Branch A frontend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo [3/6] Branch B Backend...
cd branch-b\backend && call npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install Branch B backend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo [4/6] Branch B Frontend...
cd branch-b\frontend && call npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install Branch B frontend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo [5/6] Branch C Backend...
cd branch-c\backend && call npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install Branch C backend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo [6/6] Branch C Frontend...
cd branch-c\frontend && call npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install Branch C frontend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo ✅ All dependencies installed successfully!
echo.
echo 🚀 Starting servers...
echo.

echo 🔵 Starting backends...
start "Branch A Backend (Port 3001)" cmd /k "cd branch-a\backend && node server.js"
timeout /t 1 /nobreak >nul
start "Branch B Backend (Port 3002)" cmd /k "cd branch-b\backend && node server.js"
timeout /t 1 /nobreak >nul
start "Branch C Backend (Port 3003)" cmd /k "cd branch-c\backend && node server.js"

echo ⏳ Waiting for backends to start...
timeout /t 3 /nobreak >nul

echo 🟢 Starting frontends...
start "Branch A Frontend (Port 5173)" cmd /k "cd branch-a\frontend && npm run dev"
timeout /t 1 /nobreak >nul
start "Branch B Frontend (Port 5174)" cmd /k "cd branch-b\frontend && npm run dev"
timeout /t 1 /nobreak >nul
start "Branch C Frontend (Port 5175)" cmd /k "cd branch-c\frontend && npm run dev"

echo.
echo ================================================
echo   ✅ ALL SERVERS STARTED!
echo ================================================
echo.
echo   🏦 Branch A (Andheri) → http://localhost:5173
echo   🏦 Branch B (Bandra)  → http://localhost:5174
echo   🏦 Branch C (Colaba)  → http://localhost:5175
echo.
echo   📝 Login credentials in README.md
echo   🔧 Troubleshooting: See IMPROVEMENTS.md
echo.
echo   ⚠️  Close the terminal windows to stop servers
echo ================================================
echo.
pause
