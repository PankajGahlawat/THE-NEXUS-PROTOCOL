@echo off
title Nexus Protocol - Network Test
color 0E

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    NEXUS PROTOCOL NETWORK TEST                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Testing network connectivity...
echo.

REM Get local IP addresses
echo 📍 Your IP Addresses:
ipconfig | findstr /c:"IPv4 Address"
echo.

REM Test localhost connections
echo 🌐 Testing localhost connections...
echo    Backend (localhost:3000):
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '   ✅ SUCCESS: Backend is accessible' } else { Write-Host '   ❌ FAILED: Backend returned status' $response.StatusCode } } catch { Write-Host '   ❌ FAILED: Cannot reach backend' }"

echo    Frontend (localhost:5173):
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '   ✅ SUCCESS: Frontend is accessible' } else { Write-Host '   ❌ FAILED: Frontend returned status' $response.StatusCode } } catch { Write-Host '   ❌ FAILED: Cannot reach frontend' }"
echo.

REM Check port status
echo 🔌 Port Status:
netstat -an | findstr :3000 >nul && echo    ✅ Port 3000 (Backend): LISTENING || echo    ❌ Port 3000 (Backend): NOT LISTENING
netstat -an | findstr :5173 >nul && echo    ✅ Port 5173 (Frontend): LISTENING || echo    ❌ Port 5173 (Frontend): NOT LISTENING
echo.

REM Check running processes
echo 🔥 Running Node.js Processes:
tasklist /fi "imagename eq node.exe" /fo table 2>nul | findstr node.exe >nul && (
    echo    ✅ Node.js processes found:
    tasklist /fi "imagename eq node.exe" /fo table | findstr node.exe
) || echo    ❌ No Node.js processes found
echo.

REM Network access URLs
echo 🌍 Network Access URLs:
echo    Local Access:
echo      Game: http://localhost:5173
echo      API:  http://localhost:3000
echo.
echo    Network Access (from other devices):
echo      Game: http://192.168.88.1:5173
echo      Game: http://192.168.181.1:5173  
echo      Game: http://192.168.1.13:5173
echo      API:  http://192.168.88.1:3000
echo      API:  http://192.168.181.1:3000
echo      API:  http://192.168.1.13:3000
echo.

echo 📋 Troubleshooting Tips:
echo    • If ports show NOT LISTENING, start the servers first
echo    • If localhost works but network doesn't, check Windows Firewall
echo    • Use the network URLs above to access from other devices
echo    • Demo credentials: Team Name: Ghost, Access Code: 1234
echo.

echo Press any key to exit...
pause >nul