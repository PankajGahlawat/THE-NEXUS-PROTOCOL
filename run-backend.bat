@echo off
title Nexus Protocol - Backend Server
color 0B
cd backend
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║              NEXUS PROTOCOL BACKEND SERVER                   ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo 📡 Starting backend server on port 3000...
echo.
node simple-server.js
echo.
echo ❌ Backend server stopped unexpectedly!
echo.
pause
