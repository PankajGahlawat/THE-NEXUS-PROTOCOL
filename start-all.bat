@echo off
title Nexus Protocol - All Servers Launcher
color 0A

echo.
echo  ╔═══════════════════════════════════════════════╗
echo  ║   NEXUS PROTOCOL - STARTING ALL SERVERS       ║
echo  ╚═══════════════════════════════════════════════╝
echo.

:: ── Main Backend (Port 3000) ──
echo [1/10] Starting Main Backend (Port 3000)...
start "NexusProtocol-Backend" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\backend && node index_enhanced.js"
timeout /t 2 /nobreak >nul

:: ── Main Frontend (Port 5173) ──
echo [2/10] Starting Main Frontend (Port 5173)...
start "NexusProtocol-Frontend" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\frontend && npm run dev"
timeout /t 2 /nobreak >nul

:: ── Branch A Backend (Port 3001) ──
echo [3/10] Starting Branch A Backend (Port 3001)...
start "BranchA-Backend" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-a\backend && node server.js"
timeout /t 1 /nobreak >nul

:: ── Branch B Backend (Port 3002) ──
echo [4/10] Starting Branch B Backend (Port 3002)...
start "BranchB-Backend" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-b\backend && node server.js"
timeout /t 1 /nobreak >nul

:: ── Branch C Backend (Port 3003) ──
echo [5/10] Starting Branch C Backend (Port 3003)...
start "BranchC-Backend" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-c\backend && node server.js"
timeout /t 2 /nobreak >nul

:: ── Branch A Frontend (Port 5175) ──
echo [6/10] Starting Branch A Frontend (Port 5175)...
start "BranchA-Frontend" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-a\frontend && npx vite --port 5175"
timeout /t 1 /nobreak >nul

:: ── Branch B Frontend (Port 5176) ──
echo [7/10] Starting Branch B Frontend (Port 5176)...
start "BranchB-Frontend" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-b\frontend && npx vite --port 5176"
timeout /t 1 /nobreak >nul

:: ── Branch C Frontend (Port 5177) ──
echo [8/10] Starting Branch C Frontend (Port 5177)...
start "BranchC-Frontend" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-c\frontend && npx vite --port 5177"
timeout /t 1 /nobreak >nul

:: ── NexusCore Round 2 (Port 7007) ──
echo [9/10] Starting NexusCore (Port 7007)...
start "NexusCore" /min cmd /c "cd /d d:\THE-NEXUS-PROTOCOL\rounds\round2\nexuscore && python app.py"
timeout /t 2 /nobreak >nul

echo.
echo  ╔═══════════════════════════════════════════════╗
echo  ║   ALL SERVERS STARTED SUCCESSFULLY!            ║
echo  ╠═══════════════════════════════════════════════╣
echo  ║                                               ║
echo  ║   Main Game:    http://localhost:5173           ║
echo  ║   Branch A:     http://localhost:5175           ║
echo  ║   Branch B:     http://localhost:5176           ║
echo  ║   Branch C:     http://localhost:5177           ║
echo  ║   NexusCore:    http://localhost:7007           ║
echo  ║                                               ║
echo  ╚═══════════════════════════════════════════════╝
echo.
echo  Press any key to open the main game in browser...
pause >nul
start http://localhost:5173
