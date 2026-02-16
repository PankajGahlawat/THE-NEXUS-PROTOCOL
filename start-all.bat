@echo off
setlocal enabledelayedexpansion
title Nexus Protocol - System Launcher
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                ║
echo ║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                ║
echo ║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                ║
echo ║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                ║
echo ║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                ║
echo ║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                ║
echo ║                                                               ║
echo ║              SYSTEM LAUNCHER v4.0 (Robust)                   ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo ⚠️  IMPORTANT: This will close ALL existing Node.js processes.
echo.

:CLEANUP
echo 🧹 Step 1: Cleaning up existing processes...
taskkill /F /IM node.exe /T >nul 2>nul
timeout /t 2 /nobreak >nul

REM Double check if port 3000 is free
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ❌ Port 3000 is STILL in use!
    echo    Attempting force kill again...
    taskkill /F /IM node.exe /T >nul 2>nul
    timeout /t 2 /nobreak >nul
    
    netstat -ano | findstr :3000 | findstr LISTENING >nul
    if !errorlevel!==0 (
        echo ⛔ CRITICAL ERROR: Port 3000 is blocked by a non-Node process or stuck socket.
        echo    Please manually close any applications using port 3000.
        echo.
        pause
        goto CLEANUP
    )
)
echo ✅ System clean. Port 3000 is free.

echo.
echo 🚀 Step 2: Starting Backend Server...
start "Nexus Backend" run-backend.bat

echo    Waiting for backend to initialize (5s)...
timeout /t 5 /nobreak >nul

REM Verify backend started
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo ⚠️  WARNING: Backend server might not have started correctly.
    echo    Please check the "Nexus Backend" window for errors.
    timeout /t 3 /nobreak >nul
) else (
    echo ✅ Backend is listening on port 3000.
)

echo.
echo 🎮 Step 3: Starting Frontend Application...
start "Nexus Frontend" run-frontend.bat

echo.
echo 📊 Step 4: Starting System Monitor...
start "Nexus Monitor" run-monitor.bat

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    NEXUS PROTOCOL ONLINE                     ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║                                                               ║
echo ║  🌐 Game Frontend:  http://localhost:5173                    ║
echo ║  📡 Backend API:    http://localhost:3000                    ║
echo ║  🔑 Admin Panel:    http://localhost:5173/admin              ║
echo ║  🔐 Admin Code:     NEXUS-MASTER-ADMIN-8821                  ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo 🌐 Opening Admin Panel in default browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173/admin

echo.
echo This window can be closed, but keep the other windows open!
pause