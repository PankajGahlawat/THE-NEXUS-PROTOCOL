@echo off
title Nexus Protocol - Frontend Application
color 0C
cd frontend
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║             NEXUS PROTOCOL FRONTEND APP                      ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo 🎮 Starting frontend application...
echo.
npm run dev
echo.
echo ❌ Frontend application stopped. Press any key to close...
pause >nul
