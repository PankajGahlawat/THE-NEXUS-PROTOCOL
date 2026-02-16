@echo off
title Nexus Protocol - System Monitor
color 0E

:monitor_loop
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║             NEXUS PROTOCOL SYSTEM MONITOR                    ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Frontend: http://localhost:5173
echo 📡 Backend:  http://localhost:3000
echo 📋 Health:   http://localhost:3000/health
echo.
echo 📊 System Status:

netstat -an | findstr :3000 >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend Server: ONLINE
) else (
    echo ❌ Backend Server: OFFLINE
)

netstat -an | findstr :5173 >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Frontend App: ONLINE
) else (
    echo ❌ Frontend App: OFFLINE
)

echo.
echo 🎮 Admin Credentials:
echo    Code: NEXUS-MASTER-ADMIN-8821
echo.
echo Press Ctrl+C to stop monitoring...
timeout /t 5 /nobreak >nul
goto monitor_loop
