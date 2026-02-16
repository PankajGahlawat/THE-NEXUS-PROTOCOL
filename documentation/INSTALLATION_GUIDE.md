# NEXUS PROTOCOL - Installation Guide

**Version:** 2.0.0  
**Last Updated:** February 16, 2026

---

## 📋 Prerequisites

Before installing Nexus Protocol, ensure you have the following installed:

### Required Software

1. **Node.js** (version 18.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (version 8.0.0 or higher)
   - Comes with Node.js
   - Verify installation: `npm --version`

3. **Git** (optional, for cloning repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

### System Requirements

**Minimum:**
- OS: Windows 10, macOS 10.15, or Linux
- RAM: 4GB
- Storage: 500MB free space
- Browser: Chrome 90+, Firefox 88+, Edge 90+

**Recommended:**
- OS: Windows 11, macOS 12+, or Linux
- RAM: 8GB
- Storage: 1GB free space
- Browser: Latest Chrome, Firefox, or Edge

---

## 🚀 Quick Start (Windows)

### Option 1: Automated Setup

1. **Navigate to project directory**
   ```cmd
   cd path\to\Cyber Game
   ```

2. **Run the start script**
   ```cmd
   start-all.bat
   ```

3. **Access the game**
   - The browser will automatically open to `http://localhost:5173`
   - Backend runs on `http://localhost:3000`

### Option 2: Manual Setup

1. **Install backend dependencies**
   ```cmd
   cd backend
   npm install
   ```

2. **Install frontend dependencies**
   ```cmd
   cd ..\frontend
   npm install
   ```

3. **Start backend server**
   ```cmd
   cd ..\backend
   node simple-server.js
   ```

4. **Start frontend (in new terminal)**
   ```cmd
   cd frontend
   npm run dev
   ```

5. **Open browser**
   - Navigate to `http://localhost:5173`

---

## 🐧 Installation on Linux/macOS

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Make Scripts Executable

```bash
chmod +x start-production.sh
chmod +x stop-services.sh
```

### Step 3: Start Services

```bash
# Start all services
./start-production.sh

# Or start individually
cd backend && node simple-server.js &
cd frontend && npm run dev &
```

### Step 4: Access Application

Open browser to `http://localhost:5173`

---

## 📦 Detailed Installation Steps

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   This installs:
   - express (web framework)
   - cors (cross-origin resource sharing)
   - sqlite3 (database)
   - socket.io (real-time communication)
   - uuid (unique ID generation)
   - bcryptjs (password hashing)
   - jsonwebtoken (authentication)

3. **Initialize database**
   ```bash
   node scripts/init-database.js
   ```
   
   Or the database will auto-initialize on first run.

4. **Configure environment (optional)**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-secret-key
   ```

5. **Start backend**
   ```bash
   node simple-server.js
   ```

   You should see:
   ```
   ╔═══════════════════════════════════════════════════════════════╗
   ║              NEXUS PROTOCOL BACKEND SERVER                   ║
   ║                   (SQLite Persistent)                        ║
   ╚═══════════════════════════════════════════════════════════════╝
   
   📡 Server running on port 3000
   🗄️  Database: SQLite (nexus_protocol.db)
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   This installs:
   - react (UI framework)
   - react-router-dom (routing)
   - typescript (type safety)
   - vite (build tool)
   - tailwindcss (styling)
   - gsap (animations)
   - socket.io-client (real-time)

3. **Configure environment (optional)**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=ws://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   VITE v5.4.21  ready in 244 ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.x.x:5173/
   ```

---

## 🔧 Configuration

### Backend Configuration

**File:** `backend/.env`

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=sqlite:../nexus_protocol.db

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Admin
ADMIN_CODE=NEXUS-MASTER-ADMIN-8821
```

### Frontend Configuration

**File:** `frontend/.env.local`

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Feature Flags
VITE_ENABLE_AUDIO=true
VITE_ENABLE_ANIMATIONS=true
VITE_DEBUG_MODE=false
```

---

## 🗄️ Database Setup

### Automatic Initialization

The database is automatically created and initialized on first run. The schema is defined in `init-database.sql`.

### Manual Initialization

If you need to manually initialize or reset the database:

1. **Delete existing database**
   ```bash
   rm nexus_protocol.db
   ```

2. **Restart backend**
   ```bash
   cd backend
   node simple-server.js
   ```

The database will be recreated with:
- 8 demo teams (Ghost, Phantom, Shadow, etc.)
- Demo users for Ghost team
- Sample hex shards
- System configuration

---

## 🧪 Verify Installation

### Check Backend

1. **Health check**
   ```bash
   curl http://localhost:3000/health
   ```
   
   Expected response:
   ```json
   {
     "status": "OK",
     "timestamp": "2026-02-16T..."
   }
   ```

2. **API test**
   ```bash
   curl http://localhost:3000/api/v1/agents
   ```
   
   Should return list of agents.

### Check Frontend

1. **Open browser**
   Navigate to `http://localhost:5173`

2. **Verify pages**
   - Landing page loads
   - Login page accessible at `/login`
   - Admin page accessible at `/admin`

3. **Test login**
   - Team: `Ghost`
   - Code: `1234`

4. **Test admin**
   - Code: `NEXUS-MASTER-ADMIN-8821`

---

## 🐛 Troubleshooting Installation

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

### Node Modules Issues

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Locked

**Error:** `SQLITE_BUSY: database is locked`

**Solution:**
```bash
# Stop all processes
taskkill /F /IM node.exe /T  # Windows
pkill -9 node  # Linux/macOS

# Delete database and restart
rm nexus_protocol.db
node simple-server.js
```

### Build Errors

**Error:** TypeScript compilation errors

**Solution:**
```bash
cd frontend
npm run build
# Check for specific errors and fix
```

---

## 📱 Network Access

### Local Network Access

To access from other devices on your network:

1. **Find your IP address**
   ```bash
   # Windows
   ipconfig
   
   # Linux/macOS
   ifconfig
   ```

2. **Update CORS settings**
   Edit `backend/simple-server.js`:
   ```javascript
   app.use(cors({
     origin: true,  // Allow all origins
     credentials: true
   }));
   ```

3. **Access from other devices**
   - Frontend: `http://YOUR_IP:5173`
   - Backend: `http://YOUR_IP:3000`

### Firewall Configuration

**Windows:**
```cmd
netsh advfirewall firewall add rule name="Nexus Protocol" dir=in action=allow protocol=TCP localport=3000,5173
```

**Linux:**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5173/tcp
```

---

## 🔄 Updating

### Update Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Update Application

```bash
git pull origin main
npm install  # In both backend and frontend
```

---

## 🗑️ Uninstallation

### Remove Application

```bash
# Delete project directory
rm -rf "Cyber Game"
```

### Clean System

```bash
# Remove global npm packages (if any were installed)
npm list -g --depth=0
npm uninstall -g <package-name>
```

---

## ✅ Post-Installation Checklist

- [ ] Node.js and npm installed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server starts without errors
- [ ] Frontend dev server starts without errors
- [ ] Database initializes successfully
- [ ] Can access landing page
- [ ] Can login with demo credentials
- [ ] Can access admin dashboard
- [ ] Audio plays correctly
- [ ] No console errors in browser

---

## 📞 Support

If you encounter issues not covered in this guide, please refer to:
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
- Project issue tracker

---

**Next Steps:**
- Read [USER_GUIDE.md](USER_GUIDE.md) to learn how to play
- Read [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for admin features
- Read [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for development

---

**Nexus Protocol Team**  
*Making installation seamless*
