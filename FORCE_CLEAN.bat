@echo off
title FORCE CLEANUP - NEXUS PROTOCOL
color 4F
echo.
echo ===================================================
echo   FORCE CLEANUP: KILLING ALL NODE.JS PROCESSES
echo ===================================================
echo.

echo 1. Creating a list of all Node processes...
tasklist /FI "IMAGENAME eq node.exe"

echo.
echo 2. TERMINATING ALL NODE.JS PROCESSES (Forcefully)...
taskkill /F /IM node.exe /T

echo.
echo 3. Verifying port 3000 is free...
netstat -ano | findstr :3000
if %ERRORLEVEL%==0 (
    echo [WARNING] Port 3000 is still in use!
    echo Use Task Manager to kill the process manually.
) else (
    echo [SUCCESS] Port 3000 is free.
)

echo.
echo ===================================================
echo   CLEANUP COMPLETE. 
echo   Now run start-all.bat.
echo ===================================================
echo.
pause
