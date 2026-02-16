# NEXUS PROTOCOL - LAN MULTIPLAYER SETUP GUIDE

**Complete Guide for Setting Up Multiple PCs on Local Network**  
**Version**: 1.0.0  
**Last Updated**: December 20, 2025  

---

## 🌐 OVERVIEW

This guide will help you set up Nexus Protocol for multiple client PCs connecting to a central server computer via LAN (Local Area Network). Perfect for gaming events, tournaments, or office setups.

### Architecture
```
Server PC (192.168.1.100)
├── Backend Server (Port 3000)
├── Database (SQLite/PostgreSQL)
├── Game Engine
└── Monitor Server (Port 8000)

Client PC 1 (192.168.1.101) ──┐
Client PC 2 (192.168.1.102) ──┼── LAN Network ──► Server PC
Client PC 3 (192.168.1.103) ──┘
```

## 🚀 PARROT OS QUICK SETUP

### For Parrot OS Users (Recommended)
If you're using Parrot OS, we have specialized setup scripts:

```bash
# Quick setup (5 minutes)
chmod +x install-parrot-enhanced.sh
./install-parrot-enhanced.sh
./quick-start.sh

# Full development setup (15 minutes)
chmod +x setup-parrot-os.sh
./setup-parrot-os.sh
./start-all.sh
```

See `README-PARROT-SETUP.md` for detailed Parrot OS instructions.

### For Other Linux Distributions
Continue with the standard setup below.

---

## 🖥️ SERVER SETUP (Main Computer)

### Step 1: Prepare the Server Computer

1. **Install Prerequisites**
   ```bash
   # Run the installation script
   install.bat
   ```

2. **Configure Network Settings**
   - Find your server's IP address:
   ```cmd
   ipconfig
   ```
   - Note the IPv4 Address (e.g., 192.168.1.100)

3. **Configure Environment for LAN**
   - Copy `backend/.env.example` to `backend/.env`
   - Edit the `.env` file:
   ```env
   # Server Configuration - IMPORTANT: Use 0.0.0.0 to accept connections from all IPs
   HOST=0.0.0.0
   PORT=3000
   
   # CORS Configuration - Allow connections from LAN
   CORS_ORIGIN=http://192.168.1.*:5173,http://10.0.0.*:5173,http://172.16.*:5173,http://localhost:5173
   
   # Database (keep as localhost on server)
   DATABASE_URL=postgresql://nexus_user:secure_password@localhost:5432/nexusprotocol
   ```

4. **Configure Windows Firewall**
   ```cmd
   # Run as Administrator
   netsh advfirewall firewall add rule name="Nexus Protocol Backend" dir=in action=allow protocol=TCP localport=3000
   netsh advfirewall firewall add rule name="Nexus Protocol Frontend" dir=in action=allow protocol=TCP localport=5173
   ```

5. **Start the Server**
   ```bash
   start-all.bat
   ```

### Step 2: Verify Server is Running

1. **Check Local Access**
   - Backend: http://localhost:3000/health
   - Frontend: http://localhost:5173

2. **Check Network Access** (from another PC)
   - Backend: http://[SERVER_IP]:3000/health
   - Frontend: http://[SERVER_IP]:5173

---

## 💻 CLIENT SETUP (Player Computers)

### Method 1: Frontend Only (Recommended)

Each client PC only needs to run the frontend and connect to the server.

1. **Install Node.js** on each client PC
   - Download from: https://nodejs.org/

2. **Clone/Copy Project** to each client PC
   ```bash
   git clone [your-repo-url]
   cd nexus-protocol
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure Client Connection**
   Create `frontend/.env.local`:
   ```env
   VITE_API_URL=http://[SERVER_IP]:3000
   VITE_WS_URL=ws://[SERVER_IP]:3000
   ```
   Replace `[SERVER_IP]` with your server's actual IP (e.g., 192.168.1.100)

5. **Start Client**
   ```bash
   npm run dev -- --host 0.0.0.0
   ```

### Method 2: Full Installation (Alternative)

If you want each PC to be capable of being a server:

1. **Full Installation** on each PC
   ```bash
   install.bat
   ```

2. **Configure as Client**
   - Edit `backend/.env` to point to server database
   - Or simply don't start the backend, only frontend

---

## 🔧 NETWORK CONFIGURATION

### Server Computer Configuration

1. **Backend Server Settings**
   ```javascript
   // backend/index_enhanced.js - Already configured for LAN
   const server = http.createServer(app);
   server.listen(PORT, '0.0.0.0', () => {
     console.log(`Server running on http://0.0.0.0:${PORT}`);
   });
   ```

2. **CORS Configuration**
   ```javascript
   // Allow connections from LAN
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'http://127.0.0.1:5173',
       /^http:\/\/192\.168\.1\.\d+:5173$/,
       /^http:\/\/10\.0\.0\.\d+:5173$/,
       /^http:\/\/172\.16\.\d+:5173$/
     ],
     credentials: true
   }));
   ```

### Client Configuration

1. **Frontend API Configuration**
   ```typescript
   // frontend/src/config/api.ts
   const getApiUrl = () => {
     // Check for environment variable first
     if (import.meta.env.VITE_API_URL) {
       return import.meta.env.VITE_API_URL;
     }
     
     // Auto-detect server IP (for development)
     const hostname = window.location.hostname;
     if (hostname === 'localhost' || hostname === '127.0.0.1') {
       return 'http://localhost:3000';
     }
     
     // Use same IP as frontend but port 3000
     return `http://${hostname}:3000`;
   };
   
   export const API_BASE_URL = getApiUrl();
   ```

---

## 🚀 QUICK START SCRIPTS

### Server Start Script
Create `start-server.bat`:
```batch
@echo off
echo Starting Nexus Protocol Server...
echo.

echo Starting Backend Server...
cd backend
start "Nexus Backend" cmd /k "npm start"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
cd ../frontend
start "Nexus Frontend" cmd /k "npm run dev -- --host 0.0.0.0"

echo.
echo ========================================
echo  NEXUS PROTOCOL SERVER STARTED
echo ========================================
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173
echo  Network:  http://[YOUR_IP]:5173
echo ========================================
echo.
echo Find your IP address with: ipconfig
echo Share the Network URL with other players
echo.
pause
```

### Client Start Script
Create `start-client.bat`:
```batch
@echo off
echo Starting Nexus Protocol Client...
echo.

set /p SERVER_IP="Enter Server IP Address (e.g., 192.168.1.100): "

echo Creating client configuration...
cd frontend
echo VITE_API_URL=http://%SERVER_IP%:3000 > .env.local
echo VITE_WS_URL=ws://%SERVER_IP%:3000 >> .env.local

echo Starting Frontend Client...
start "Nexus Client" cmd /k "npm run dev -- --host 0.0.0.0"

echo.
echo ========================================
echo  NEXUS PROTOCOL CLIENT STARTED
echo ========================================
echo  Connecting to: http://%SERVER_IP%:3000
echo  Local Access:  http://localhost:5173
echo ========================================
echo.
pause
```

---

## 🔍 TROUBLESHOOTING

### Common Issues

1. **"Cannot connect to server"**
   - Check server IP address: `ipconfig`
   - Verify firewall settings
   - Test connection: `ping [SERVER_IP]`
   - Check if ports are open: `telnet [SERVER_IP] 3000`

2. **"CORS Error"**
   - Verify CORS_ORIGIN in server `.env`
   - Check client is using correct server IP
   - Restart server after changing CORS settings

3. **"WebSocket connection failed"**
   - Ensure WebSocket port (3000) is open
   - Check if antivirus is blocking connections
   - Verify client is using correct WebSocket URL

4. **"Slow performance"**
   - Check network speed: `ping [SERVER_IP] -t`
   - Ensure server has adequate resources
   - Close unnecessary applications

### Network Testing

1. **Test Server Connectivity**
   ```bash
   # From client PC
   curl http://[SERVER_IP]:3000/health
   ```

2. **Test WebSocket Connection**
   ```javascript
   // Browser console on client
   const socket = io('http://[SERVER_IP]:3000');
   socket.on('connect', () => console.log('Connected!'));
   ```

3. **Monitor Network Traffic**
   ```bash
   # On server (if available)
   netstat -an | findstr :3000
   ```

---

## 🎮 GAME SESSION MANAGEMENT

### Multiple Teams Setup

1. **Create Teams** (on server)
   - Each PC can represent a different team
   - Teams: "Alpha", "Bravo", "Charlie", "Delta"
   - Access codes: "1234", "5678", "9012", "3456"

2. **Session Management**
   - Each team logs in with their credentials
   - Real-time updates via WebSocket
   - Centralized scoring and leaderboard

### Tournament Mode

1. **Bracket Management**
   - Use server PC for tournament control
   - Display leaderboard on main screen
   - Coordinate mission timing

2. **Spectator Mode**
   - Additional PCs can connect as observers
   - Real-time mission progress
   - Live scoring updates

---

## 📊 PERFORMANCE OPTIMIZATION

### Server Optimization

1. **Hardware Requirements**
   - CPU: 4+ cores recommended
   - RAM: 8GB minimum, 16GB recommended
   - Network: Gigabit Ethernet
   - Storage: SSD recommended

2. **Software Optimization**
   ```env
   # backend/.env - Performance settings
   DB_POOL_MAX=20
   WS_MAX_CONNECTIONS_PER_IP=10
   COMPRESSION_LEVEL=6
   ```

### Network Optimization

1. **Switch Configuration**
   - Use managed switch if available
   - Enable QoS for gaming traffic
   - Prioritize ports 3000 and 5173

2. **Client Optimization**
   - Close unnecessary network applications
   - Use wired connections when possible
   - Disable Windows updates during gameplay

---

## 🔒 SECURITY CONSIDERATIONS

### Network Security

1. **Firewall Rules**
   - Only open necessary ports (3000, 5173)
   - Restrict to LAN subnet only
   - Block external internet access if needed

2. **Access Control**
   - Use strong team access codes
   - Monitor active sessions
   - Implement session timeouts

### Data Protection

1. **Local Network Only**
   - Ensure server is not accessible from internet
   - Use private IP ranges only
   - Consider VPN for remote access

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Event Setup
- [ ] Server PC configured and tested
- [ ] All client PCs have Node.js installed
- [ ] Network infrastructure tested
- [ ] Firewall rules configured
- [ ] Team credentials prepared
- [ ] Backup server PC ready (optional)

### Day of Event
- [ ] Start server first
- [ ] Verify server health endpoint
- [ ] Connect one client PC for testing
- [ ] Distribute server IP to all clients
- [ ] Test all client connections
- [ ] Verify WebSocket connectivity
- [ ] Test game functionality end-to-end

### During Event
- [ ] Monitor server performance
- [ ] Watch for connection issues
- [ ] Keep backup procedures ready
- [ ] Monitor network traffic
- [ ] Assist with client troubleshooting

---

## 🎉 CONCLUSION

Your Nexus Protocol game is now configured for LAN multiplayer! The setup supports:

- **Centralized Server**: One PC hosts the game engine and database
- **Multiple Clients**: Each player PC connects to the central server
- **Real-time Updates**: WebSocket communication for live gameplay
- **Scalable Architecture**: Easy to add more client PCs
- **Tournament Ready**: Perfect for gaming events and competitions

The system is designed to be robust and easy to deploy in any LAN environment.

**Ready for multiplayer action! 🚀**