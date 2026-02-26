# NEXUS PROTOCOL - Quick Deployment Guide

## 🚀 Deploy in 3 Steps

### Option A: Docker Deployment (Fastest)

```bash
# 1. Run pre-check
bash scripts/pre-deployment-check.sh

# 2. Deploy with Docker
bash scripts/docker-production-deploy.sh

# 3. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

**Time**: ~5 minutes

---

### Option B: Production Server Deployment

```bash
# 1. Run pre-check
bash scripts/pre-deployment-check.sh

# 2. Deploy to server (requires sudo)
sudo bash scripts/production-deploy.sh

# 3. Follow prompts
# - Enter domain: nexusprotocol.com
# - Enter email: admin@nexusprotocol.com
# - Enter path: /var/www/nexus-protocol
```

**Time**: ~15 minutes

---

## 📋 Prerequisites

### For Docker Deployment
- Docker installed
- Docker Compose installed
- 4GB RAM minimum
- 10GB disk space

### For Production Deployment
- Ubuntu 20.04+ or Debian 11+
- Domain name with DNS configured
- Root/sudo access
- 4GB RAM minimum
- 20GB disk space

---

## ✅ Verify Deployment

```bash
# Check services
docker-compose ps                    # Docker
pm2 status                          # Production

# Test endpoints
curl http://localhost:3001/health   # Backend
curl http://localhost:3000          # Frontend

# View logs
docker-compose logs -f              # Docker
pm2 logs nexus-backend             # Production
```

---

## 🔧 Quick Commands

### Docker
```bash
docker-compose up -d        # Start
docker-compose down         # Stop
docker-compose restart      # Restart
docker-compose logs -f      # Logs
```

### Production
```bash
pm2 restart nexus-backend   # Restart backend
sudo systemctl restart nginx # Restart nginx
pm2 logs nexus-backend      # View logs
```

---

## 📞 Need Help?

- Full Guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Checklist: [PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- VM Setup: [VM_CONFIGURATION_GUIDE.md](VM_CONFIGURATION_GUIDE.md)

---

**That's it! Your NEXUS PROTOCOL is now deployed!** 🎉
