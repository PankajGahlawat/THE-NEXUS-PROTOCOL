# NEXUS PROTOCOL - Production Deployment Checklist

## 🎯 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] `.env` file created with secure credentials
- [ ] `JWT_SECRET` set (minimum 64 characters)
- [ ] `POSTGRES_PASSWORD` set (strong password)
- [ ] `SESSION_SECRET` set (minimum 32 characters)
- [ ] No default passwords (password123, changeme, etc.)
- [ ] `.env` is in `.gitignore`

### 2. Dependencies
- [ ] Node.js 18+ installed
- [ ] npm 8+ installed
- [ ] Docker installed (for Docker deployment)
- [ ] Docker Compose installed (for Docker deployment)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)

### 3. Build Status
- [ ] Frontend built successfully (`cd frontend && npm run build`)
- [ ] `frontend/dist` directory exists
- [ ] `frontend/dist/index.html` exists
- [ ] No build errors

### 4. Security Configuration
- [ ] Strong JWT secret (64+ characters)
- [ ] Strong database password (20+ characters)
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] Helmet security headers configured
- [ ] SSL/TLS certificates ready (for manual deployment)

### 5. Database
- [ ] PostgreSQL installed (for manual deployment)
- [ ] Database created
- [ ] Database user created with strong password
- [ ] Migrations ready in `backend/migrations/`
- [ ] Database connection tested

### 6. Docker Configuration (if using Docker)
- [ ] `docker-compose.yml` exists
- [ ] `backend/Dockerfile` exists
- [ ] `frontend/Dockerfile` exists
- [ ] Docker daemon running
- [ ] Docker Compose version 3.8+

### 7. Deployment Scripts
- [ ] `scripts/pre-deployment-check.sh` executable
- [ ] `scripts/production-deploy.sh` executable
- [ ] `scripts/docker-production-deploy.sh` executable
- [ ] `deployment/deploy.sh` executable
- [ ] `deployment/setup-ssl.sh` executable

### 8. Documentation
- [ ] `README.md` updated
- [ ] `DEPLOYMENT_GUIDE.md` reviewed
- [ ] `VM_CONFIGURATION_GUIDE.md` available
- [ ] API documentation up to date

### 9. Testing
- [ ] Backend health check works (`/health`)
- [ ] Frontend loads correctly
- [ ] SSH terminal connects to VM
- [ ] Scoring system functional
- [ ] Admin dashboard accessible
- [ ] WebSocket connections work

### 10. Monitoring & Logging
- [ ] Log directories created
- [ ] Log rotation configured
- [ ] Error tracking setup
- [ ] Health check endpoints configured

---

## 🚀 Deployment Methods

### Method 1: Automated Docker Deployment (Recommended)

**Best for**: Quick deployment, development, testing

```bash
# Run pre-deployment check
bash scripts/pre-deployment-check.sh

# Deploy with Docker
bash scripts/docker-production-deploy.sh

# Check status
docker-compose ps
docker-compose logs -f
```

**Checklist**:
- [ ] Pre-deployment check passed
- [ ] Docker containers running
- [ ] PostgreSQL healthy
- [ ] Backend responding
- [ ] Frontend accessible
- [ ] Migrations applied

---

### Method 2: Manual Production Deployment

**Best for**: Production servers, custom configurations

```bash
# Run pre-deployment check
bash scripts/pre-deployment-check.sh

# Deploy to production server
sudo bash scripts/production-deploy.sh

# Follow prompts:
# - Enter domain name
# - Enter admin email
# - Enter deployment path
```

**Checklist**:
- [ ] Pre-deployment check passed
- [ ] Domain DNS configured
- [ ] Server accessible via SSH
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] PM2 running backend
- [ ] Services auto-start on reboot

---

### Method 3: Docker Compose Production

**Best for**: Production with Docker, scalability

```bash
# Copy production environment
cp deployment/.env.production.example .env

# Edit environment variables
nano .env

# Build and start
docker-compose -f deployment/docker-deploy.yml up -d

# Setup SSL
sudo bash deployment/setup-ssl.sh yourdomain.com admin@yourdomain.com

# Check status
docker-compose -f deployment/docker-deploy.yml ps
```

**Checklist**:
- [ ] Environment variables configured
- [ ] Docker images built
- [ ] All containers running
- [ ] Nginx reverse proxy working
- [ ] SSL certificate obtained
- [ ] Auto-renewal configured

---

## 🔍 Post-Deployment Verification

### 1. Service Health Checks

```bash
# Backend health
curl https://yourdomain.com/health
# Expected: {"status":"ok","timestamp":"..."}

# Frontend
curl https://yourdomain.com
# Expected: HTML content

# WebSocket
wscat -c wss://yourdomain.com/socket.io/
# Expected: Connection established
```

**Checklist**:
- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] WebSocket connection successful
- [ ] API endpoints responding
- [ ] Database connection working

### 2. Functional Testing

**Frontend Flow**:
- [ ] Trailer plays correctly
- [ ] Team selection works
- [ ] Agent selection works
- [ ] Mission briefing displays
- [ ] Terminal connection form appears

**Terminal & SSH**:
- [ ] Can connect to VM via SSH
- [ ] Terminal displays output
- [ ] Commands execute correctly
- [ ] Terminal resize works
- [ ] Session persists

**Scoring System**:
- [ ] Commands are scored
- [ ] Points awarded correctly
- [ ] Leaderboard updates in real-time
- [ ] Achievements trigger
- [ ] Rank system works

**Admin Dashboard**:
- [ ] Can view active players
- [ ] Can monitor terminals
- [ ] Can award points
- [ ] Can send hints
- [ ] Can reset VMs
- [ ] War feed updates

### 3. Security Verification

```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check security headers
curl -I https://yourdomain.com

# Check CORS
curl -H "Origin: https://malicious.com" https://yourdomain.com/api/health
```

**Checklist**:
- [ ] SSL certificate valid
- [ ] HTTPS redirect working
- [ ] HSTS header present
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] CORS restricted to allowed origins
- [ ] Rate limiting active

### 4. Performance Testing

```bash
# Load test (using Apache Bench)
ab -n 1000 -c 10 https://yourdomain.com/

# WebSocket stress test
# (use custom script or tool)
```

**Checklist**:
- [ ] Response time < 200ms
- [ ] Can handle 100+ concurrent users
- [ ] WebSocket connections stable
- [ ] Database queries optimized
- [ ] Static assets cached

---

## 📊 Monitoring Setup

### 1. Service Monitoring

**PM2 (Manual Deployment)**:
```bash
# View status
pm2 status

# View logs
pm2 logs nexus-backend

# Monitor resources
pm2 monit
```

**Docker**:
```bash
# View container status
docker-compose ps

# View logs
docker-compose logs -f backend

# View resource usage
docker stats
```

**Checklist**:
- [ ] Backend process running
- [ ] CPU usage normal (< 50%)
- [ ] Memory usage normal (< 1GB)
- [ ] No error logs
- [ ] Uptime tracking configured

### 2. Log Management

**Log Locations**:
- Backend: `/var/log/nexus-protocol/backend.log`
- Nginx: `/var/log/nginx/nexus-protocol-*.log`
- PostgreSQL: `/var/log/postgresql/`
- PM2: `~/.pm2/logs/`

**Checklist**:
- [ ] Logs rotating properly
- [ ] Log retention configured (30 days)
- [ ] Error logs monitored
- [ ] Access logs analyzed
- [ ] Disk space sufficient

### 3. Database Monitoring

```bash
# Check database size
psql -U nexus_user -d nexusprotocol -c "SELECT pg_size_pretty(pg_database_size('nexusprotocol'));"

# Check active connections
psql -U nexus_user -d nexusprotocol -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql -U nexus_user -d nexusprotocol -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

**Checklist**:
- [ ] Database size monitored
- [ ] Connection pool healthy
- [ ] Query performance acceptable
- [ ] Indexes optimized
- [ ] Backups running

---

## 🔄 Maintenance Procedures

### 1. Regular Updates

```bash
# Update application
git pull origin main
cd frontend && npm install && npm run build
cd ../backend && npm install
pm2 restart nexus-backend

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

**Schedule**:
- [ ] Weekly: Check for security updates
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Review and optimize

### 2. Database Backups

```bash
# Manual backup
pg_dump -U nexus_user nexusprotocol > backup_$(date +%Y%m%d).sql

# Automated backup (cron)
0 2 * * * pg_dump -U nexus_user nexusprotocol > /backups/nexus_$(date +\%Y\%m\%d).sql
```

**Checklist**:
- [ ] Daily backups configured
- [ ] Backup retention: 30 days
- [ ] Backup restoration tested
- [ ] Off-site backup configured

### 3. SSL Certificate Renewal

```bash
# Check expiry
sudo certbot certificates

# Manual renewal
sudo certbot renew

# Auto-renewal (cron)
0 0 * * * certbot renew --quiet && systemctl reload nginx
```

**Checklist**:
- [ ] Auto-renewal configured
- [ ] Renewal tested
- [ ] Expiry alerts setup
- [ ] Certificate valid for 90 days

---

## 🚨 Troubleshooting

### Common Issues

**Issue 1: Frontend not loading**
```bash
# Check Nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Check files
ls -la /var/www/nexus-protocol/frontend/
```

**Issue 2: Backend not responding**
```bash
# Check PM2
pm2 status
pm2 logs nexus-backend

# Check port
sudo netstat -tulpn | grep 3002

# Restart
pm2 restart nexus-backend
```

**Issue 3: Database connection failed**
```bash
# Check PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"

# Check credentials
cat backend/.env | grep POSTGRES

# Test connection
psql -U nexus_user -d nexusprotocol -h localhost
```

**Issue 4: WebSocket not connecting**
```bash
# Check Nginx WebSocket config
sudo nginx -t

# Check backend logs
pm2 logs nexus-backend | grep socket

# Test WebSocket
wscat -c wss://yourdomain.com/socket.io/
```

---

## 📞 Support & Resources

### Documentation
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [VM Configuration Guide](VM_CONFIGURATION_GUIDE.md)
- [Technical Architecture](documentation/TECHNICAL_ARCHITECTURE.md)
- [API Documentation](documentation/API.md)

### Commands Reference

**Service Management**:
```bash
# PM2
pm2 start|stop|restart|status nexus-backend
pm2 logs nexus-backend
pm2 monit

# Nginx
sudo systemctl start|stop|restart|status nginx
sudo nginx -t

# PostgreSQL
sudo systemctl start|stop|restart|status postgresql

# Docker
docker-compose up -d
docker-compose down
docker-compose ps
docker-compose logs -f
```

**Monitoring**:
```bash
# System resources
htop
df -h
free -m

# Network
sudo netstat -tulpn
sudo ss -tulpn

# Logs
tail -f /var/log/nginx/access.log
journalctl -u nexus-protocol -f
```

---

## ✅ Final Checklist

### Pre-Launch
- [ ] All pre-deployment checks passed
- [ ] Environment variables configured
- [ ] Security hardened
- [ ] SSL certificate obtained
- [ ] Backups configured
- [ ] Monitoring setup

### Launch
- [ ] Services deployed
- [ ] Health checks passing
- [ ] Functional tests passed
- [ ] Performance acceptable
- [ ] Security verified

### Post-Launch
- [ ] Monitoring active
- [ ] Logs reviewed
- [ ] Backups verified
- [ ] Documentation updated
- [ ] Team notified

---

**🎉 Congratulations! NEXUS PROTOCOL is now in production!**

For issues or questions, refer to the documentation or contact the development team.
