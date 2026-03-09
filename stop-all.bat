@echo off
title Nexus Protocol - Stopping All Servers
color 0C

echo.
echo  Stopping all Nexus Protocol servers...
echo.

:: Kill all node processes on known ports
for %%p in (3000 3001 3002 3003 5173 5175 5176 5177) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

:: Kill Python (NexusCore on 7007)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7007 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  All servers stopped.
echo.
pause
