@echo off
title Nexus Protocol - All Servers Launcher
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║        NEXUS PROTOCOL - STARTING ALL SERVERS          ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

:: ── Install backend dependencies if needed ──
if not exist "%~dp0backend\node_modules" (
    echo [SETUP] Installing backend dependencies...
    cd /d "%~dp0backend" && npm install --silent
    echo [SETUP] Backend dependencies installed.
    echo.
)

:: ── Install frontend dependencies if needed ──
if not exist "%~dp0frontend\node_modules" (
    echo [SETUP] Installing frontend dependencies...
    cd /d "%~dp0frontend" && npm install --silent
    echo [SETUP] Frontend dependencies installed.
    echo.
)

:: ── Init database (creates tables + registers teams) ──
echo [DB] Initialising database...
cd /d "%~dp0backend" && node scripts/init-database.js
echo.

:: ── Main Backend (Port 3000) ──
echo [1/4] Starting Main Backend (Port 3000)...
start "NexusProtocol-Backend" /min cmd /c "cd /d %~dp0backend && node index_enhanced.js"
timeout /t 3 /nobreak >nul

:: ── Main Frontend (Port 5173) ──
echo [2/4] Starting Main Frontend (Port 5173)...
start "NexusProtocol-Frontend" /min cmd /c "cd /d %~dp0frontend && node serve.cjs"
timeout /t 2 /nobreak >nul

:: ── Round 1: Vidyatech (Port 5000) ──
echo [3/4] Starting Round 1 - Vidyatech (Port 5000)...
start "Round1-Vidyatech" /min cmd /c "cd /d %~dp0RS\Round 1\Vidyatech\Vidyatech\vidyatech && python app.py"
timeout /t 2 /nobreak >nul

:: ── Round 1: Vidyatech Monitor (Port 8080) ──
echo [4/4] Starting Round 1 Monitor (Port 8080)...
start "Round1-Monitor" /min cmd /c "cd /d %~dp0RS\Round 1\Vidyatech\Vidyatech\vidyatech && python monitor/server.py"
timeout /t 2 /nobreak >nul

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║          ALL SERVERS STARTED SUCCESSFULLY             ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║                                                       ║
echo  ║   Main Game  :  http://localhost:5173                 ║
echo  ║   Backend API:  http://localhost:3000                 ║
echo  ║   Round 1    :  http://localhost:5000                 ║
echo  ║   R1 Monitor :  http://localhost:8080                 ║
echo  ║                                                       ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║   CREDENTIALS                                         ║
echo  ║   Red  Team  :  RedTeam  /  RED@Nexus2024!            ║
echo  ║   Blue Team  :  BlueTeam /  BLUE@Nexus2024!           ║
echo  ║   Admin Code :  ADMIN-8821                            ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║   ROUND 1 - VIDYATECH (15 Vulnerabilities)            ║
echo  ║   Beginner (10): SQLi, XSS, DefaultCreds,             ║
echo  ║     DirTraversal, DataExposure, HardcodedAdmin,       ║
echo  ║     DocUpload, Clickjacking, WeakPassword, CSRF       ║
echo  ║   Intermediate (3): JWT, IDOR, CmdInjection           ║
echo  ║   Advanced (2): YAML RCE, Debug+SSRF                  ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.
echo  Press any key to open the main game in browser...
pause >nul
start http://localhost:5173
