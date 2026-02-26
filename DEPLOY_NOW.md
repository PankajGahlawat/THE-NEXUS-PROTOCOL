# 🚀 NEXUS PROTOCOL - Deploy Now!

## ✅ System Status

Your system is **READY FOR DEPLOYMENT**:

- ✓ Frontend dependencies installed
- ✓ Backend dependencies installed
- ✓ Frontend built (dist/ exists)
- ✓ Environment file configured (.env)
- ✓ Docker installed

## 🎯 Choose Your Deployment Method

### Method 1: Local Docker Deployment (Recommended for Testing)

**Perfect for**: Testing, development, local demos

```powershell
# 1. Start Docker Desktop
# (Open Docker Desktop application)

# 2. Deploy
docker-compose up -d

# 3. Wait for services (2-3 minutes)
docker-compose ps

# 4. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/health
# SSH Proxy: http://localhost:3002/health
```

**Access URLs**:
- 🌐 Main App: http://localhost:3000
- 🔌 API: http://localhost:3001
- 🖥️ SSH Terminal: http://localhost:3000/terminal
- 📊 Leaderboard: http://localhost:3000/leaderboard
- 👨‍💼 Admin Dashboard: http://localhost:3000/admin/dashboard

---

### Method 2: Production Server Deployment

**Perfect for**: Live production, public access

**Requirements**:
- Ubuntu/Debian server
- Domain name (e.g., nexusprotocol.com)
- SSH access to server

**Steps**:

1. **Upload code to server**:
```bash
# On your local machine
git push origin main

# On server
git clone https://github.com/yourusername/nexus-protocol.git
cd nexus-protocol
```

2. **Run deployment script**:
```bash
sudo bash scripts/production-deploy.sh
```

3. **Follow prompts**:
- Domain: nexusprotocol.com
- Email: admin@nexusprotocol.com
- Path: /var/www/nexus-protocol

4. **Access**:
- https://nexusprotocol.com

---

### Method 3: Cloud Platform Deployment

#### Deploy to AWS

```bash
# 1. Install AWS CLI
# 2. Configure credentials
aws configure

# 3. Deploy with Docker Compose
# (Use deployment/docker-deploy.yml)
```

#### Deploy to DigitalOcean

```bash
# 1. Create Droplet (Ubuntu 22.04)
# 2. SSH into droplet
# 3. Run production deploy script
sudo bash scripts/production-deploy.sh
```

#### Deploy to Heroku

```bash
# 1. Install Heroku CLI
# 2. Create app
heroku create nexus-protocol

# 3. Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# 4. Deploy
git push heroku main
```

---

## 🔥 Quick Start (Docker - 2 Minutes)

```powershell
# Start Docker Desktop first!

# Deploy everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access app
start http://localhost:3000
```

---

## 📊 Verify Deployment

### Health Checks

```powershell
# Backend
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000

# SSH Proxy
curl http://localhost:3002/health
```

Expected responses:
- Backend: `{"status":"ok","timestamp":"...","activeSessions":0,"scoringActive":true}`
- Frontend: HTML content
- SSH Proxy: `{"status":"ok",...}`

### Test Features

1. **Frontend Flow**:
   - Open http://localhost:3000
   - Watch trailer
   - Select team
   - Select agent
   - View mission briefing

2. **SSH Terminal**:
   - Go to http://localhost:3000/terminal
   - Enter VM credentials
   - Connect and test commands

3. **Scoring**:
   - Execute commands in terminal
   - Check http://localhost:3000/leaderboard
   - Verify points awarded

4. **Admin Dashboard**:
   - Go to http://localhost:3000/admin/dashboard
   - View active players
   - Test admin controls

---

## 🛠️ Troubleshooting

### Docker not starting?

```powershell
# Check Docker Desktop is running
docker ps

# If not, start Docker Desktop application
# Wait 30 seconds, then try again
```

### Port already in use?

```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Stop the process or change ports in .env
```

### Services not responding?

```powershell
# Check container status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart
```

### Database connection failed?

```powershell
# Check PostgreSQL container
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Wait 30 seconds for initialization
```

---

## 📝 Environment Configuration

Your `.env` file should have:

```env
# Required
JWT_SECRET=<64+ character random string>
POSTGRES_PASSWORD=<strong password>

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
SSH_PROXY_PORT=3002

# URLs
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_SSH_PROXY_URL=http://localhost:3002
```

---

## 🎮 Post-Deployment

### 1. Configure VMs

Follow [VM_CONFIGURATION_GUIDE.md](VM_CONFIGURATION_GUIDE.md) to:
- Setup VirtualBox VMs
- Configure SSH access
- Create snapshots
- Connect to NEXUS PROTOCOL

### 2. Test Complete Flow

1. Start VM
2. Open NEXUS PROTOCOL
3. Go through trailer → team → agent → briefing
4. Connect terminal to VM
5. Execute commands
6. Check scoring
7. View leaderboard
8. Test admin dashboard

### 3. Monitor System

```powershell
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# Check resource usage
docker stats
```

---

## 🚀 Ready to Deploy?

### For Local Testing (Docker):

```powershell
# 1. Start Docker Desktop
# 2. Run this command:
docker-compose up -d

# 3. Wait 2 minutes
# 4. Open: http://localhost:3000
```

### For Production Server:

```bash
# On your server:
sudo bash scripts/production-deploy.sh
```

---

## 📞 Need Help?

- **Full Documentation**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Detailed Checklist**: [PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- **Quick Guide**: [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- **VM Setup**: [VM_CONFIGURATION_GUIDE.md](VM_CONFIGURATION_GUIDE.md)

---

## 🎉 What's Next?

After deployment:

1. ✅ Verify all services running
2. ✅ Test SSH terminal connection
3. ✅ Configure VMs
4. ✅ Test scoring system
5. ✅ Setup admin access
6. ✅ Configure monitoring
7. ✅ Setup backups (production)
8. ✅ Configure SSL (production)

---

**Your NEXUS PROTOCOL is ready to deploy!** 🚀

Choose your method above and follow the steps. The system will be live in minutes!
