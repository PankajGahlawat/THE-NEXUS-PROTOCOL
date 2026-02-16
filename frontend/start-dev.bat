@echo off
title Nexus Protocol - Frontend Development Server
color 0C

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║             NEXUS PROTOCOL FRONTEND DEV SERVER              ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo 🎮 Starting Vite development server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
    echo.
)

echo 🚀 Starting development server on http://localhost:5173
echo.

REM Start the development server
call npm run dev

echo.
echo ❌ Development server stopped. Press any key to close...
pause >nul