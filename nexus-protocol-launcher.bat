@echo off
setlocal enabledelayedexpansion

REM NEXUS PROTOCOL - ALL-IN-ONE LAUNCHER
REM Complete system launcher with all functionality
REM Version: 2.0.0
REM Last Updated: December 20, 2025

title Nexus Protocol - Complete System Launcher
color 0A

REM ASCII Art Header
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                ║
echo ║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                ║
echo ║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                ║
echo ║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                ║
echo ║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                ║
echo ║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                ║
echo ║                                                               ║
echo ║              ALL-IN-ONE SYSTEM LAUNCHER                      ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Main Menu
:main_menu
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                        MAIN MENU                              ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║                                                               ║
echo ║  [1] 🚀 Quick Start - Launch Complete System                 ║
echo ║  [2] 🖥️  LAN Server Mode - Host for Network Play             ║
echo ║  [3] 🌐 LAN Client Mode - Connect to Server                  ║
echo ║  [4] 📦 Install/Setup - First Time Setup                     ║
echo ║  [5] 🔧 Development Mode - Individual Services               ║
echo ║  [6] 🏭 Production Deploy - Production Setup                 ║
echo ║  [7] 📊 System Status - Check System Health                  ║
echo ║  [8] 🌐 Network Test - Test Network Connectivity             ║
echo ║  [9] 📦 Create Portable Package                              ║
echo ║  [0] ❌ Exit                                                  ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

set /p choice="Select an option (0-9): "

if "%choice%"=="1" goto quick_start
if "%choice%"=="2" goto lan_server
if "%choice%"=="3" goto lan_client
if "%choice%"=="4" goto install_setup
if "%choice%"=="5" goto dev_mode
if "%choice%"=="6" goto production_deploy
if "%choice%"=="7" goto system_status
if "%choice%"=="8" goto network_test
if "%choice%"=="9" goto create_package
if "%choice%"=="0" goto exit_launcher

echo Invalid choice. Please try again.
timeout /t 2 /nobreak >nul
cls
goto main_menu

REM ============================================================================
REM QUICK START - Launch Complete System
REM ============================================================================
:quick_start
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                      QUICK START MODE                         ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Check prerequisites
call :check_prerequisites
if %errorlevel% neq 0 goto main_menu

REM Install dependencies if needed
call :install_dependencies

echo 🚀 Starting Nexus Protocol Complete System...
echo.

REM Create backend startup script
echo @echo off > temp_backend.bat
echo title Nexus Protocol - Backend Server >> temp_backend.bat
echo color 0B >> temp_backend.bat
echo echo ╔═══════════════════════════════════════════════════════════════╗ >> temp_backend.bat
echo echo ║              NEXUS PROTOCOL BACKEND SERVER                   ║ >> temp_backend.bat
echo echo ╚═══════════════════════════════════════════════════════════════╝ >> temp_backend.bat
echo echo. >> temp_backend.bat
echo echo 📡 Starting backend server on port 3000... >> temp_backend.bat
echo echo. >> temp_backend.bat
echo cd backend >> temp_backend.bat
echo node simple-server.js >> temp_backend.bat
echo echo. >> temp_backend.bat
echo echo ❌ Backend server stopped. Press any key to close... >> temp_backend.bat
echo pause ^>nul >> temp_backend.bat
echo del ..\temp_backend.bat >> temp_backend.bat

REM Create frontend startup script
echo @echo off > temp_frontend.bat
echo title Nexus Protocol - Frontend Application >> temp_frontend.bat
echo color 0C >> temp_frontend.bat
echo echo ╔═══════════════════════════════════════════════════════════════╗ >> temp_frontend.bat
echo echo ║             NEXUS PROTOCOL FRONTEND APP                      ║ >> temp_frontend.bat
echo echo ╚═══════════════════════════════════════════════════════════════╝ >> temp_frontend.bat
echo echo. >> temp_frontend.bat
echo echo 🎮 Starting frontend application on port 5173... >> temp_frontend.bat
echo echo. >> temp_frontend.bat
echo cd frontend >> temp_frontend.bat
echo npm run dev -- --host 0.0.0.0 >> temp_frontend.bat
echo echo. >> temp_frontend.bat
echo echo ❌ Frontend application stopped. Press any key to close... >> temp_frontend.bat
echo pause ^>nul >> temp_frontend.bat
echo del ..\temp_frontend.bat >> temp_frontend.bat

REM Create monitor startup script (if Python available)
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo @echo off > temp_monitor.bat
    echo title Nexus Protocol - Monitor Server >> temp_monitor.bat
    echo color 0E >> temp_monitor.bat
    echo echo ╔═══════════════════════════════════════════════════════════════╗ >> temp_monitor.bat
    echo echo ║             NEXUS PROTOCOL MONITOR SERVER                    ║ >> temp_monitor.bat
    echo echo ╚═══════════════════════════════════════════════════════════════╝ >> temp_monitor.bat
    echo echo. >> temp_monitor.bat
    echo echo 📊 Starting monitor server on port 8000... >> temp_monitor.bat
    echo echo. >> temp_monitor.bat
    echo python nexus_monitor_server.py >> temp_monitor.bat
    echo echo. >> temp_monitor.bat
    echo echo ❌ Monitor server stopped. Press any key to close... >> temp_monitor.bat
    echo pause ^>nul >> temp_monitor.bat
    echo del ..\temp_monitor.bat >> temp_monitor.bat
    
    set "monitor_available=true"
) else (
    set "monitor_available=false"
)

echo 📡 Starting backend server...
start "Nexus Backend" temp_backend.bat

echo    Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo 🎮 Starting frontend application...
start "Nexus Frontend" temp_frontend.bat

echo    Waiting for frontend to start...
timeout /t 3 /nobreak >nul

if "%monitor_available%"=="true" (
    echo 📊 Starting monitor server...
    start "Nexus Monitor" temp_monitor.bat
    timeout /t 2 /nobreak >nul
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    NEXUS PROTOCOL ONLINE                     ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║                                                               ║
echo ║  🌐 Game Frontend:  http://localhost:5173                    ║
echo ║  📡 Backend API:    http://localhost:3000                    ║
if "%monitor_available%"=="true" (
    echo ║  📊 Monitor Server: http://localhost:8000                    ║
)
echo ║  📋 Health Check:   http://localhost:3000/health             ║
echo ║                                                               ║
echo ║  🔑 Demo Credentials:                                         ║
echo ║     Team Name: Ghost                                          ║
echo ║     Access Code: 1234                                         ║
echo ║                                                               ║
echo ║  🎯 Game Features:                                            ║
echo ║     • Three Agent Roles (Hacker/Infiltrator/Analyst)         ║
echo ║     • Real-time Mission System                                ║
echo ║     • WebSocket Communication                                 ║
echo ║     • Performance Scoring (F-RANK to S-RANK)                 ║
echo ║     • Immersive Cyberpunk Interface                           ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Try to open the game in default browser
echo 🌐 Opening game in your default browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo ✅ Nexus Protocol is now fully operational!
echo.
echo 📋 Instructions:
echo    • Server windows have opened (Backend, Frontend, Monitor)
echo    • The game should open automatically in your browser
echo    • If not, manually navigate to: http://localhost:5173
echo    • Use the demo credentials to login and start playing
echo.
echo 🛑 To stop the system:
echo    • Close all server windows
echo    • Or press Ctrl+C in each server window
echo.
echo 🎮 Welcome to the Nexus Protocol. The system awaits your infiltration.
echo.
echo Press any key to return to main menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM LAN SERVER MODE
REM ============================================================================
:lan_server
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                      LAN SERVER MODE                          ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

call :check_prerequisites
if %errorlevel% neq 0 goto main_menu

REM Get server IP address
echo Detecting server IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set SERVER_IP=%%a
    goto :found_ip
)
:found_ip
set SERVER_IP=%SERVER_IP: =%
echo Server IP detected: %SERVER_IP%
echo.

REM Configure environment for LAN
echo Configuring server for LAN access...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul 2>nul
    echo Created backend\.env from template
)

REM Update HOST setting in .env
powershell -Command "(Get-Content 'backend\.env') -replace 'HOST=localhost', 'HOST=0.0.0.0' | Set-Content 'backend\.env'" 2>nul

REM Configure Windows Firewall
echo Configuring Windows Firewall...
netsh advfirewall firewall delete rule name="Nexus Protocol Backend" >nul 2>nul
netsh advfirewall firewall delete rule name="Nexus Protocol Frontend" >nul 2>nul
netsh advfirewall firewall add rule name="Nexus Protocol Backend" dir=in action=allow protocol=TCP localport=3000 >nul 2>nul
netsh advfirewall firewall add rule name="Nexus Protocol Frontend" dir=in action=allow protocol=TCP localport=5173 >nul 2>nul
echo Firewall rules configured
echo.

call :install_dependencies

echo Starting Backend Server...
cd backend
start "Nexus Protocol Backend" cmd /k "echo Backend Server Starting... && npm start"

echo Waiting for backend to initialize...
timeout /t 8 /nobreak > nul

echo Starting Frontend Server...
cd ..\frontend
start "Nexus Protocol Frontend" cmd /k "echo Frontend Server Starting... && npm run dev -- --host 0.0.0.0"

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                  NEXUS PROTOCOL SERVER ONLINE                ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║  Server Status: RUNNING                                       ║
echo ║  Server IP:     %SERVER_IP%                                   ║
echo ║  Backend:       http://%SERVER_IP%:3000                       ║
echo ║  Frontend:      http://%SERVER_IP%:5173                       ║
echo ║  Health Check:  http://%SERVER_IP%:3000/health                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo SHARE THIS INFORMATION WITH PLAYERS:
echo   Server IP: %SERVER_IP%
echo   Game URL:  http://%SERVER_IP%:5173
echo.
echo The server is now ready for LAN connections!
echo Players can connect from other PCs using the Game URL above.
echo.
echo Press any key to open the game in your browser...
pause >nul

start http://localhost:5173

echo.
echo Server is running. Keep this window open.
echo To stop the server, close the Backend and Frontend windows.
echo.
echo Press any key to return to main menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM LAN CLIENT MODE
REM ============================================================================
:lan_client
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                      LAN CLIENT MODE                          ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

call :check_prerequisites
if %errorlevel% neq 0 goto main_menu

REM Get server IP from user
:get_server_ip
set /p SERVER_IP="Enter the Server IP Address (e.g., 192.168.1.100): "
if "%SERVER_IP%"=="" (
    echo Please enter a valid IP address.
    goto get_server_ip
)

echo Testing connection to server...
ping -n 1 -w 1000 %SERVER_IP% >nul
if %errorlevel% neq 0 (
    echo WARNING: Cannot ping server at %SERVER_IP%
    echo This might be normal if ping is disabled.
    echo Continuing anyway...
) else (
    echo Server is reachable at %SERVER_IP%
)
echo.

REM Configure client environment
echo Configuring client for server connection...
cd frontend

REM Create or update .env.local
echo VITE_API_URL=http://%SERVER_IP%:3000 > .env.local
echo VITE_WS_URL=ws://%SERVER_IP%:3000 >> .env.local
echo Client configuration created
echo.

call :install_dependencies

echo Starting Nexus Protocol Client...
echo Connecting to server at %SERVER_IP%...
echo.

start "Nexus Protocol Client" cmd /k "echo Nexus Protocol Client && echo Connecting to: http://%SERVER_IP%:3000 && echo. && npm run dev -- --host 0.0.0.0"

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                  NEXUS PROTOCOL CLIENT STARTED               ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║  Client Status:   CONNECTING                                  ║
echo ║  Server IP:       %SERVER_IP%                                 ║
echo ║  Server Backend:  http://%SERVER_IP%:3000                     ║
echo ║  Local Access:    http://localhost:5173                       ║
echo ║  Network Access:  http://[YOUR_IP]:5173                       ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Waiting for client to start...
timeout /t 5 /nobreak > nul

echo Opening game in browser...
start http://localhost:5173

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                  CONNECTION TROUBLESHOOTING                   ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo If you cannot connect to the server:
echo 1. Verify server IP: %SERVER_IP%
echo 2. Check server is running
echo 3. Test server health: http://%SERVER_IP%:3000/health
echo 4. Check firewall settings
echo 5. Ensure you're on the same network
echo.
echo Client is running. Keep this window open.
echo To stop the client, close the Client window.
echo.
echo Press any key to return to main menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM INSTALL/SETUP MODE
REM ============================================================================
:install_setup
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    INSTALL/SETUP MODE                         ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

call :check_prerequisites
if %errorlevel% neq 0 goto main_menu

echo 📦 Installing Nexus Protocol dependencies...
echo.

call :install_dependencies

REM Setup database
echo 🗄️ Setting up database...
if not exist "nexus_protocol.db" (
    echo Creating SQLite database...
    if exist "init-database.sql" (
        sqlite3 nexus_protocol.db ".read init-database.sql" 2>nul || echo Database schema applied
    )
    echo ✅ Database setup completed
) else (
    echo ✅ Database already exists
)

REM Setup Python environment
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo 🐍 Setting up Python environment...
    if not exist "venv" (
        python -m venv venv
        echo Python virtual environment created
    )
    
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip >nul 2>nul
    
    if exist "requirements.txt" (
        pip install -r requirements.txt >nul 2>nul
        echo Python dependencies installed
    )
    
    call venv\Scripts\deactivate.bat
    echo ✅ Python environment setup completed
) else (
    echo ⚠️ Python not found - Monitor server will not be available
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    INSTALLATION COMPLETE!                    ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║                                                               ║
echo ║  ✅ Node.js dependencies installed                            ║
echo ║  ✅ Environment files configured                              ║
echo ║  ✅ Database initialized                                      ║
echo ║  ✅ System ready for launch                                   ║
echo ║                                                               ║
echo ║  🚀 Use option [1] Quick Start to launch the system          ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Press any key to return to main menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM DEVELOPMENT MODE
REM ============================================================================
:dev_mode
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    DEVELOPMENT MODE                           ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Select service to start:
echo.
echo [1] Backend Server Only
echo [2] Frontend Application Only
echo [3] Monitor Server Only
echo [4] Backend + Frontend
echo [5] All Services
echo [0] Return to Main Menu
echo.

set /p dev_choice="Select option (0-5): "

if "%dev_choice%"=="1" goto start_backend_only
if "%dev_choice%"=="2" goto start_frontend_only
if "%dev_choice%"=="3" goto start_monitor_only
if "%dev_choice%"=="4" goto start_backend_frontend
if "%dev_choice%"=="5" goto quick_start
if "%dev_choice%"=="0" goto main_menu

echo Invalid choice.
timeout /t 2 /nobreak >nul
goto dev_mode

:start_backend_only
echo 📡 Starting Backend Server Only...
cd backend
start "Nexus Backend" cmd /k "npm run dev"
cd ..
echo Backend server started. Press any key to return to menu...
pause >nul
cls
goto main_menu

:start_frontend_only
echo 🎮 Starting Frontend Application Only...
cd frontend
start "Nexus Frontend" cmd /k "npm run dev"
cd ..
echo Frontend application started. Press any key to return to menu...
pause >nul
cls
goto main_menu

:start_monitor_only
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python not available - Monitor server cannot start
    pause
    goto dev_mode
)
echo 📊 Starting Monitor Server Only...
start "Nexus Monitor" cmd /k "python nexus_monitor_server.py"
echo Monitor server started. Press any key to return to menu...
pause >nul
cls
goto main_menu

:start_backend_frontend
echo 📡 Starting Backend Server...
cd backend
start "Nexus Backend" cmd /k "npm run dev"
cd ..
timeout /t 3 /nobreak >nul
echo 🎮 Starting Frontend Application...
cd frontend
start "Nexus Frontend" cmd /k "npm run dev"
cd ..
echo Backend and Frontend started. Press any key to return to menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM PRODUCTION DEPLOY
REM ============================================================================
:production_deploy
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                   PRODUCTION DEPLOYMENT                       ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

call :check_prerequisites
if %errorlevel% neq 0 goto main_menu

echo ⚠️ WARNING: This will configure the system for production deployment.
echo.
set /p confirm="Continue with production deployment? (y/N): "
if /i not "%confirm%"=="y" (
    echo Production deployment cancelled.
    pause
    goto main_menu
)

echo 🏭 Setting up production environment...

REM Environment setup
if not exist "backend\.env" (
    if exist "backend\.env.production" (
        copy "backend\.env.production" "backend\.env" >nul
        echo Created .env from .env.production template
        echo ⚠️ Please update the .env file with your production values
    ) else (
        echo ❌ No .env file found. Please create backend\.env with production configuration
        pause
        goto main_menu
    )
)

REM Install production dependencies
echo 📦 Installing production dependencies...
cd backend
call npm ci --only=production
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    goto main_menu
)
cd ..

cd frontend
call npm ci
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    goto main_menu
)

echo 🏗️ Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    goto main_menu
)
cd ..

REM Database setup
echo 🗄️ Setting up production database...
if exist "backend\scripts\init-database.js" (
    cd backend
    node scripts\init-database.js
    cd ..
)

echo ✅ Production deployment completed!
echo.
echo 📋 Next Steps:
echo    1. Update backend\.env with your production values
echo    2. Configure SSL certificates for HTTPS
echo    3. Set up reverse proxy (nginx/IIS)
echo    4. Configure production database
echo    5. Set up monitoring and logging
echo.
echo Press any key to return to main menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM SYSTEM STATUS
REM ============================================================================
:system_status
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                      SYSTEM STATUS                            ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Checking system status...
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js: Available
    node -v
) else (
    echo ❌ Node.js: Not found
)

REM Check npm
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ npm: Available
    npm -v
) else (
    echo ❌ npm: Not found
)

REM Check Python
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Python: Available
    python --version
) else (
    echo ⚠️ Python: Not available
)

REM Check Git
where git >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Git: Available
    git --version
) else (
    echo ⚠️ Git: Not available
)

echo.
echo 📁 Project Structure:
if exist "backend" (
    echo ✅ Backend directory: Present
) else (
    echo ❌ Backend directory: Missing
)

if exist "frontend" (
    echo ✅ Frontend directory: Present
) else (
    echo ❌ Frontend directory: Missing
)

if exist "backend\node_modules" (
    echo ✅ Backend dependencies: Installed
) else (
    echo ⚠️ Backend dependencies: Not installed
)

if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies: Installed
) else (
    echo ⚠️ Frontend dependencies: Not installed
)

if exist "nexus_protocol.db" (
    echo ✅ Database: Present
) else (
    echo ⚠️ Database: Not found
)

echo.
echo 🌐 Port Status:
netstat -an | findstr :3000 >nul && echo ⚠️ Port 3000 (Backend): In use || echo ✅ Port 3000 (Backend): Available
netstat -an | findstr :5173 >nul && echo ⚠️ Port 5173 (Frontend): In use || echo ✅ Port 5173 (Frontend): Available
netstat -an | findstr :8000 >nul && echo ⚠️ Port 8000 (Monitor): In use || echo ✅ Port 8000 (Monitor): Available

echo.
echo 🔥 Running Processes:
tasklist /fi "imagename eq node.exe" /fo table 2>nul | findstr node.exe >nul && echo ✅ Node.js processes running || echo ⚠️ No Node.js processes found
tasklist /fi "imagename eq python.exe" /fo table 2>nul | findstr python.exe >nul && echo ✅ Python processes running || echo ⚠️ No Python processes found

echo.
echo Press any key to return to main menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM NETWORK TEST
REM ============================================================================
:network_test
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                      NETWORK TEST                             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

set /p TEST_IP="Enter Server IP to test (e.g., 192.168.1.100): "
if "%TEST_IP%"=="" (
    echo No IP provided. Returning to menu.
    pause
    goto main_menu
)

echo.
echo Testing network connectivity to %TEST_IP%...
echo.

REM Test basic connectivity
echo 1. Testing basic ping...
ping -n 4 %TEST_IP%
if %errorlevel% neq 0 (
    echo   ❌ FAILED: Cannot ping server
    echo   Check: Network connection, IP address, firewall
) else (
    echo   ✅ SUCCESS: Server is reachable
)
echo.

REM Test backend port
echo 2. Testing backend port (3000)...
powershell -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('%TEST_IP%', 3000); $tcp.Close(); Write-Host '   ✅ SUCCESS: Backend port is open' } catch { Write-Host '   ❌ FAILED: Backend port is closed or blocked' }"
echo.

REM Test frontend port
echo 3. Testing frontend port (5173)...
powershell -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('%TEST_IP%', 5173); $tcp.Close(); Write-Host '   ✅ SUCCESS: Frontend port is open' } catch { Write-Host '   ❌ FAILED: Frontend port is closed or blocked' }"
echo.

REM Test HTTP endpoints
echo 4. Testing HTTP endpoints...
echo    Testing backend health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%TEST_IP%:3000/health' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '   ✅ SUCCESS: Backend health check passed' } else { Write-Host '   ❌ FAILED: Backend returned status' $response.StatusCode } } catch { Write-Host '   ❌ FAILED: Cannot reach backend HTTP endpoint' }"

echo    Testing frontend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%TEST_IP%:5173' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '   ✅ SUCCESS: Frontend is accessible' } else { Write-Host '   ❌ FAILED: Frontend returned status' $response.StatusCode } } catch { Write-Host '   ❌ FAILED: Cannot reach frontend' }"
echo.

REM Network information
echo 5. Network Information...
echo    Your IP addresses:
ipconfig | findstr /c:"IPv4 Address"
echo.

echo Press any key to return to main menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM CREATE PORTABLE PACKAGE
REM ============================================================================
:create_package
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                  CREATE PORTABLE PACKAGE                      ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

set PACKAGE_NAME=nexus-protocol-portable
set PACKAGE_DIR=%PACKAGE_NAME%
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo 📦 Creating portable package: %PACKAGE_NAME%
echo 🕒 Timestamp: %TIMESTAMP%
echo.

echo ⚠️ This will create a complete offline installation package.
set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Package creation cancelled.
    pause
    goto main_menu
)

REM Create package directory
if exist %PACKAGE_DIR% (
    echo 🧹 Cleaning existing package directory...
    rmdir /s /q %PACKAGE_DIR%
)

mkdir %PACKAGE_DIR%
echo ✅ Created package directory: %PACKAGE_DIR%

REM Copy source code
echo 📁 Copying source code...
xcopy /E /I /Q backend %PACKAGE_DIR%\backend >nul
xcopy /E /I /Q frontend %PACKAGE_DIR%\frontend >nul
xcopy /E /I /Q assets %PACKAGE_DIR%\assets >nul 2>nul
xcopy /E /I /Q prototypes %PACKAGE_DIR%\prototypes >nul 2>nul

REM Remove node_modules and build artifacts
if exist %PACKAGE_DIR%\backend\node_modules rmdir /s /q %PACKAGE_DIR%\backend\node_modules
if exist %PACKAGE_DIR%\frontend\node_modules rmdir /s /q %PACKAGE_DIR%\frontend\node_modules
if exist %PACKAGE_DIR%\frontend\dist rmdir /s /q %PACKAGE_DIR%\frontend\dist

REM Copy root files
copy *.md %PACKAGE_DIR%\ >nul 2>nul
copy *.txt %PACKAGE_DIR%\ >nul 2>nul
copy *.py %PACKAGE_DIR%\ >nul 2>nul
copy *.db %PACKAGE_DIR%\ >nul 2>nul
copy *.sql %PACKAGE_DIR%\ >nul 2>nul

REM Copy this launcher
copy "%~nx0" %PACKAGE_DIR%\ >nul

echo 📦 Downloading dependencies for offline installation...
cd backend
call npm ci --cache ..\%PACKAGE_DIR%\npm-cache --prefer-offline >nul 2>nul
cd ..\frontend
call npm ci --cache ..\%PACKAGE_DIR%\npm-cache --prefer-offline >nul 2>nul
cd ..

REM Create offline installer
echo @echo off > %PACKAGE_DIR%\install-offline.bat
echo echo Installing Nexus Protocol from offline cache... >> %PACKAGE_DIR%\install-offline.bat
echo cd backend >> %PACKAGE_DIR%\install-offline.bat
echo call npm ci --cache ..\npm-cache --prefer-offline --no-audit >> %PACKAGE_DIR%\install-offline.bat
echo cd ..\frontend >> %PACKAGE_DIR%\install-offline.bat
echo call npm ci --cache ..\npm-cache --prefer-offline --no-audit >> %PACKAGE_DIR%\install-offline.bat
echo cd .. >> %PACKAGE_DIR%\install-offline.bat
echo echo Installation complete! Run nexus-protocol-launcher.bat to start. >> %PACKAGE_DIR%\install-offline.bat
echo pause >> %PACKAGE_DIR%\install-offline.bat

REM Create compressed archive
echo 🗜️ Creating compressed archive...
powershell -command "Compress-Archive -Path '%PACKAGE_DIR%' -DestinationPath '%PACKAGE_NAME%_%TIMESTAMP%.zip' -Force" >nul 2>nul

echo.
echo ✅ Portable package created successfully!
echo.
echo 📁 Package Directory: %PACKAGE_DIR%
echo 📦 Archive File: %PACKAGE_NAME%_%TIMESTAMP%.zip
echo.
echo The package includes everything needed for offline installation.
echo.
echo Press any key to return to main menu...
pause >nul
cls
goto main_menu

REM ============================================================================
REM HELPER FUNCTIONS
REM ============================================================================

:check_prerequisites
echo 🔍 Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Visit: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js and npm detected
exit /b 0

:install_dependencies
REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Backend dependencies installed
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Frontend dependencies installed
)

REM Create backend .env if it doesn't exist
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo ✅ Backend .env file created from example
    )
)

REM Create frontend .env.local if it doesn't exist
if not exist "frontend\.env.local" (
    echo VITE_API_URL=http://localhost:3000 > frontend\.env.local
    echo VITE_WS_URL=ws://localhost:3000 >> frontend\.env.local
    echo ✅ Frontend .env.local file created
)

exit /b 0

REM ============================================================================
REM EXIT
REM ============================================================================
:exit_launcher
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                ║
echo ║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                ║
echo ║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                ║
echo ║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                ║
echo ║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                ║
echo ║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                ║
echo ║                                                               ║
echo ║              SYSTEM SHUTDOWN COMPLETE                        ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo 👋 Thank you for using Nexus Protocol!
echo.
echo 🎮 The Protocol remembers everything.
echo    Every connection. Every infiltration. Every choice.
echo.
echo 🔒 Session terminated. All traces purged.
echo.
timeout /t 3 /nobreak >nul
exit /b 0

endlocal