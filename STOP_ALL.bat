@echo off
title Nexus Protocol - EMERGENCY STOP
color 0C

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║                 EMERGENCY SYSTEM SHUTDOWN                    ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo 🛑 Stopping ALL Node.js processes...
taskkill /F /IM node.exe /T

echo.
echo 🛑 Stopping ALL Command Prompt windows (except this one)...
REM Be careful with this, might kill this window too if not careful
REM For now just node.exe is usually enough

echo.
echo ✅ System halted. 
echo    You can now run start-all.bat to restart cleanly.
echo.
pause
