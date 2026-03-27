@echo off
title Nexus Protocol - Stopping All Servers
color 0C

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║        NEXUS PROTOCOL - STOPPING ALL SERVERS          ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

:: Kill by named window titles first (cleanest)
taskkill /FI "WINDOWTITLE eq NexusProtocol-Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NexusProtocol-Frontend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Round1-Vidyatech" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Round1-Monitor" /F >nul 2>&1

:: Kill by port as fallback
for %%p in (3000 5173 5000 8080) do (
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :%%p ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo  All servers stopped.
echo.
pause
