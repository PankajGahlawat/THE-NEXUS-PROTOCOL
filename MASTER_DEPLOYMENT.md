# 🚀 NEXUS PROTOCOL - Complete Deployment & Security Guide

**Version:** 2.0.0  
**Last Updated:** February 23, 2026  
**All Deployment & Security Documentation**

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Security Setup](#security-setup)
5. [VM Configuration](#vm-configuration)
6. [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- Docker Desktop installed
- Node.js 18+
- 4GB RAM minimum
- Ports 3000, 3001, 5432 available

### Three Steps

#### 1. Generate Credentials
```bash
# Linux/Mac
chmod +x scripts/setup-security.sh
./scripts/setup-security.sh

# Windows
scripts\setup-security.bat
```

#### 2. Deploy
```bash
docker-compose up -d
```

#### 3. Access
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health: http://localhost:3001/health

**Done! Your secure NEXUS PROTOCOL is running.**

---

## 🐳 Docker Deployment

### Local Development

```bash
# 1. Generate credentials
./scripts/setup-security.sh

# 2. Start services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f
```

### Production Docker

```bash
# 1. Copy environment
cp deployment/.env.production.example .env

# 2. Edit variables
nano .env

# 3. Generate secrets
openssl rand -base64 64  # JWT_SECRET
openssl rand -base64 32  # POSTGRES_PASSWORD

# 4. Deploy
docker-compose -f deployment/docker-deploy.yml up -d

# 5. Setup SSL
sudo ./deployment/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f [service]

# Status
docker-compose ps

# Remove all
docker-compose down -v
```

---

## 🖥️ Production Deployment

### Automated

```bash
# 1. Clone
git clone <repo-url>
cd nexus-protocol

# 2. Deploy
sudo bash scripts/production-deploy.sh

# 3. Follow prompts
# Domain: nexusprotocol.com
# Email: admin@nexusprotocol.com
```

### Manual Steps

#### 1. Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql certbot python3-certbot-nginx
sudo npm install -g pm2
```

#### 2. Setup Database
```bash
sudo -u postgres psql << EOF
CREATE DATABASE nexusprotocol;
CREATE USER nexus_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE nexusprotocol TO nexus_user;
EOF

cd backend
npm install
npm run migrate
```

#### 3. Build Frontend
```bash
cd frontend
npm install

cat > .env.production << EOF
VITE_API_URL=https://yourdomain.com/api
VITE_WS_URL=wss://yourdomain.com
VITE_ENV=production
EOF

npm run build
sudo cp -r dist/* /var/www/nexus-protocol/frontend/
```

#### 4. Deploy Backend
```bash
cd backend
npm install --production

cat > .env << EOF
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://nexus_user:password@localhost:5432/nexusprotocol
JWT_SECRET=$(openssl rand -base64 64)
CORS_ORIGIN=https://yourdomain.com
EOF

pm2 start start-ssh-proxy.js --name nexus-backend
pm2 save
pm2 startup
```

#### 5. Configure Nginx
```bash
sudo cp deployment/nginx/nexus-protocol.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/nexus-protocol /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Setup SSL
```bash
sudo certbot --nginx -d yourdomain.com
sudo certbot renew --dry-run
```

---

## 🔐 Security Setup

### Generate Credentials

**Automated:**
```bash
./scripts/setup-security.sh
```

**Manual:**
```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# DB Password (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Security Checklist

- [ ] JWT_SECRET is 64+ characters
- [ ] POSTGRES_PASSWORD is strong
- [ ] CORS_ORIGIN only trusted domains
- [ ] No default passwords
- [ ] .env has 600 permissions
- [ ] HTTPS/TLS enabled
- [ ] Firewall configured
- [ ] Rate limiting enabled

### Security Features

**Authentication:**
- JWT with 24h expiration
- bcrypt password hashing
- Session validation

**Network:**
- Explicit CORS allowlist
- Rate limiting (100 req/15min)
- Request size limits (1MB)
- Security headers (HSTS, CSP)

**Container:**
- No privileged mode
- Specific capabilities only
- Network isolation

**Database:**
- Prepared statements
- Connection pooling
- Strong passwords

### Environment Variables

**Required:**
```env
JWT_SECRET=<64-byte-hex>
POSTGRES_PASSWORD=<32-byte-hex>
CORS_ORIGIN=http://localhost:3000
```

**Optional:**
```env
NODE_ENV=production
PORT=3001
RATE_LIMIT_MAX=100
MAX_REQUEST_SIZE=1mb
```

---

## 🖥️ VM Configuration

### VirtualBox Setup

#### 1. Network Configuration

**Bridged Adapter (Recommended):**
```
VirtualBox → VM Settings → Network
- Adapter 1: Bridged Adapter
- Name: Your physical adapter
- Promiscuous Mode: Allow All
```

**NAT with Port Forwarding:**
```
VirtualBox → VM Settings → Network
- Adapter 1: NAT
- Port Forwarding:
  - Name: SSH
  - Host Port: 2222
  - Guest Port: 22
```

#### 2. SSH Server Setup

**Inside VM:**
```bash
# Install SSH
sudo apt update
sudo apt install openssh-server -y

# Configure
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin yes
# Set: PasswordAuthentication yes

# Restart
sudo systemctl restart sshd
sudo systemctl enable sshd

# Get IP
ip addr show
```

#### 3. Test Connection

```bash
# From host
ssh root@192.168.1.100

# Or with NAT
ssh -p 2222 root@localhost
```

#### 4. Create Snapshot

```bash
# Power off VM
VBoxManage controlvm "VM-Name" poweroff

# Create snapshot
VBoxManage snapshot "VM-Name" take "clean" \
  --description "Clean state for missions"

# List snapshots
VBoxManage snapshot "VM-Name" list

# Start VM
VBoxManage startvm "VM-Name" --type headless
```

### VM Tools Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install tools
sudo apt install -y \
  nmap netcat curl wget git vim \
  net-tools iputils-ping traceroute \
  tcpdump wireshark john hydra \
  sqlmap nikto dirb gobuster \
  metasploit-framework

# Install Python tools
sudo apt install -y python3 python3-pip
pip3 install requests beautifulsoup4
```

### Register VM with NEXUS

```javascript
// In backend
vmController.registerVM('vm1', {
  name: 'Ubuntu-CTF-1',
  snapshotName: 'clean',
  host: '192.168.1.100',
  port: 22,
  username: 'root',
  password: 'password'
});
```

---

## ✅ Verification

### Health Checks

```bash
# Backend
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000

# WebSocket
wscat -c ws://localhost:3001

# Database
docker-compose exec postgres pg_isready -U nexus
```

### Functional Tests

**Frontend:**
- [ ] Landing page loads
- [ ] Trailer plays
- [ ] Team selection works
- [ ] Agent selection works
- [ ] Mission briefing displays

**SSH Terminal:**
- [ ] Connection form appears
- [ ] Can connect to VM
- [ ] Commands execute
- [ ] Output displays

**Scoring:**
- [ ] Commands scored
- [ ] Points awarded
- [ ] Leaderboard updates
- [ ] Achievements trigger

**Admin:**
- [ ] View active players
- [ ] Monitor terminals
- [ ] Award points
- [ ] Send hints

### Security Tests

```bash
# Test CORS
curl -H "Origin: http://evil.com" http://localhost:3001/health
# Expected: CORS error

# Test rate limiting
for i in {1..101}; do curl http://localhost:3001/health; done
# Expected: 429 on last request

# Test auth
curl http://localhost:3001/api/v1/game/state
# Expected: 401 Unauthorized
```

---

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check logs
docker-compose logs backend

# Verify database
docker-compose ps postgres

# Check .env
cat .env | grep JWT_SECRET

# Check ports
netstat -ano | grep 3001
```

### Frontend Connection Failed

```bash
# Check backend
curl http://localhost:3001/health

# Check CORS
curl -H "Origin: http://localhost:3000" -I http://localhost:3001/health

# Restart frontend
docker-compose restart frontend
```

### Database Connection Failed

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready

# Test connection
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "SELECT 1;"

# Restart
docker-compose restart postgres
```

### WebSocket Not Connecting

```bash
# Check backend logs
docker-compose logs backend | grep -i websocket

# Test WebSocket
wscat -c ws://localhost:3001

# Verify config
cat frontend/.env.local | grep VITE_WS_URL
```

### VM Connection Failed

```bash
# Test SSH manually
ssh root@192.168.1.100

# Check VM SSH
# Inside VM:
sudo systemctl status sshd

# Check firewall
# Inside VM:
sudo ufw status
sudo ufw allow 22/tcp
```

---

## 🔄 Maintenance

### Regular Tasks

**Daily:**
- Check system health
- Review error logs
- Monitor disk space

**Weekly:**
- Backup database
- Review audit logs
- Check security updates

**Monthly:**
- Update dependencies
- Optimize database
- Test disaster recovery

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U nexus nexus_protocol > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260223.sql | docker-compose exec -T postgres psql -U nexus nexus_protocol

# Vacuum
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "VACUUM ANALYZE;"
```

### SSL Renewal

```bash
# Check expiry
sudo certbot certificates

# Renew
sudo certbot renew

# Auto-renewal (cron)
0 0 * * * certbot renew --quiet && systemctl reload nginx
```

### Updates

```bash
# Update application
git pull origin main
cd frontend && npm install && npm run build
cd backend && npm install
pm2 restart nexus-backend

# Update Docker
docker-compose pull
docker-compose up -d
```

---

## 📋 Production Checklist

### Pre-Deployment
- [ ] Node.js 18+ installed
- [ ] Docker installed
- [ ] Domain DNS configured
- [ ] Server accessible
- [ ] Firewall rules planned

### Security
- [ ] Run security setup
- [ ] Strong JWT secret
- [ ] Strong DB password
- [ ] CORS configured
- [ ] No default passwords
- [ ] .env restricted (600)

### Deployment
- [ ] Services deployed
- [ ] Database initialized
- [ ] Migrations applied
- [ ] Nginx configured
- [ ] SSL obtained
- [ ] Services started

### Verification
- [ ] Frontend loads
- [ ] Backend responds
- [ ] WebSocket works
- [ ] Database queries
- [ ] SSL valid
- [ ] All routes accessible

### Testing
- [ ] Trailer plays
- [ ] Team/Agent selection
- [ ] Mission briefing
- [ ] SSH terminal connects
- [ ] Scoring works
- [ ] Leaderboard updates
- [ ] Admin accessible

---

## 📞 Support

**Documentation:**
- User Guide: MASTER_GUIDE.md
- Technical: MASTER_TECHNICAL.md
- Features: MASTER_FEATURES.md

**Commands:**
```bash
# Health
curl http://localhost:3001/health

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down
```

---

**Complete deployment and security guide!** 🚀

**Version:** 2.0.0  
**Last Updated:** February 23, 2026
