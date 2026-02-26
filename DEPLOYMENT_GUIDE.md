# NEXUS PROTOCOL - Production Deployment Guide

## 🚀 Complete Deployment to Live Domain with Nginx + SSL

### Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- Domain name pointing to your server IP
- Root or sudo access
- Minimum 2GB RAM, 2 CPU cores
- 20GB disk space

### Architecture

```
Internet
    ↓
Nginx (Port 80/443) - SSL/TLS Termination
    ↓
┌─────────────────────────────────────┐
│  Frontend (React SPA)               │
│  - Trailer → Team Select            │
│  - Agent Select → Mission Briefing  │
│  - Live Terminal (SSH)              │
│  - Leaderboard                      │
│  - Admin Dashboard                  │
└─────────────────────────────────────┘
    ↓
Backend (Port 3002)
    ↓
┌─────────────────────────────────────┐
│  - SSH Proxy (Terminal)             │
│  - Scoring Engine                   │
│  - Admin Controller                 │
│  - VM Controller                    │
│  - WebSocket (Socket.io)            │
└─────────────────────────────────────┘
    ↓
PostgreSQL (Port 5432)
```

## 📋 Deployment Methods

### Method 1: Automated Script (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/nexus-protocol.git
cd nexus-protocol

# Make scripts executable
chmod +x deployment/*.sh

# Run deployment script
sudo ./deployment/deploy.sh
```

### Method 2: Docker Compose

```bash
# Copy environment file
cp deployment/.env.production.example deployment/.env

# Edit environment variables
nano deployment/.env

# Generate secure secrets
openssl rand -base64 64  # JWT_SECRET
openssl rand -base64 32  # SESSION_SECRET

# Start services
docker-compose -f deployment/docker-deploy.yml up -d

# Setup SSL
sudo ./deployment/setup-ssl.sh yourdomain.com admin@yourdomain.com

# Check status
docker-compose -f deployment/docker-deploy.yml ps
```

### Method 3: Manual Deployment

#### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Setup Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE nexusprotocol;
CREATE USER nexus_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nexusprotocol TO nexus_user;
\q
EOF

# Run migrations
cd backend
npm install
npm run migrate
```

#### Step 3: Build Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=https://yourdomain.com/api
VITE_WS_URL=wss://yourdomain.com
VITE_SSH_PROXY_URL=https://yourdomain.com
VITE_ENV=production
EOF

# Build
npm run build

# Deploy to web root
sudo mkdir -p /var/www/nexus-protocol/frontend
sudo cp -r dist/* /var/www/nexus-protocol/frontend/
```

#### Step 4: Deploy Backend

```bash
cd backend

# Install production dependencies
npm install --production

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3002
SSH_PROXY_PORT=3002
DATABASE_URL=postgresql://nexus_user:your_secure_password@localhost:5432/nexusprotocol
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
EOF

# Deploy
sudo mkdir -p /var/www/nexus-protocol/backend
sudo cp -r . /var/www/nexus-protocol/backend/

# Start with PM2
pm2 start start-ssh-proxy.js --name nexus-backend
pm2 save
pm2 startup
```

#### Step 5: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp deployment/nginx/nexus-protocol.conf /etc/nginx/sites-available/nexus-protocol

# Update domain in config
sudo sed -i 's/nexusprotocol.com/yourdomain.com/g' /etc/nginx/sites-available/nexus-protocol

# Enable site
sudo ln -s /etc/nginx/sites-available/nexus-protocol /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 6: Setup SSL

```bash
# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔧 Configuration

### Frontend Environment Variables

```env
VITE_API_URL=https://yourdomain.com/api
VITE_WS_URL=wss://yourdomain.com
VITE_SSH_PROXY_URL=https://yourdomain.com
VITE_ENV=production
VITE_ENABLE_TRAILER=true
VITE_ENABLE_ANALYTICS=true
```

### Backend Environment Variables

```env
NODE_ENV=production
PORT=3002
SSH_PROXY_PORT=3002
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nexusprotocol

# Security
JWT_SECRET=<64-char-random-string>
SESSION_SECRET=<32-char-random-string>

# CORS
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true

# Frontend
FRONTEND_URL=https://yourdomain.com

# VirtualBox (optional)
VBOXMANAGE_PATH=/usr/bin/VBoxManage
```

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Strong SESSION_SECRET (32+ characters)
- [ ] Strong database password
- [ ] SSL/TLS enabled (HTTPS)
- [ ] HSTS header configured
- [ ] Firewall configured (UFW/iptables)
- [ ] SSH key authentication only
- [ ] Fail2ban installed
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Log monitoring setup

### Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 📊 Monitoring

### Check Service Status

```bash
# Backend
pm2 status
pm2 logs nexus-backend

# Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/nexus-protocol-access.log

# Database
sudo systemctl status postgresql
```

### Health Checks

```bash
# Backend health
curl https://yourdomain.com/health

# Frontend
curl https://yourdomain.com

# WebSocket
wscat -c wss://yourdomain.com/socket.io/
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Update frontend
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/www/nexus-protocol/frontend/

# Update backend
cd backend
npm install --production
pm2 restart nexus-backend
```

### Database Backup

```bash
# Backup
pg_dump -U nexus_user nexusprotocol > backup_$(date +%Y%m%d).sql

# Restore
psql -U nexus_user nexusprotocol < backup_20260223.sql
```

### SSL Renewal

```bash
# Manual renewal
sudo certbot renew

# Check expiry
sudo certbot certificates
```

## 🐛 Troubleshooting

### Frontend Not Loading

```bash
# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check files
ls -la /var/www/nexus-protocol/frontend/

# Check logs
sudo tail -f /var/log/nginx/nexus-protocol-error.log
```

### Backend Not Responding

```bash
# Check PM2
pm2 status
pm2 logs nexus-backend

# Check port
sudo netstat -tulpn | grep 3002

# Restart
pm2 restart nexus-backend
```

### WebSocket Connection Failed

```bash
# Check Nginx WebSocket config
sudo nginx -t

# Check backend logs
pm2 logs nexus-backend

# Test WebSocket
wscat -c wss://yourdomain.com/socket.io/
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check Nginx SSL config
sudo nginx -t
```

## 📈 Performance Optimization

### Nginx Caching

```nginx
# Add to server block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
}
```

### PM2 Cluster Mode

```bash
# Start in cluster mode
pm2 start start-ssh-proxy.js -i max --name nexus-backend
```

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_terminal_logs_session ON terminal_logs(session_id);
CREATE INDEX idx_terminal_logs_timestamp ON terminal_logs(timestamp);

-- Vacuum
VACUUM ANALYZE;
```

## 🎯 Post-Deployment Checklist

- [ ] Frontend loads at https://yourdomain.com
- [ ] Trailer plays correctly
- [ ] Team selection works
- [ ] Agent selection works
- [ ] Mission briefing displays
- [ ] SSH terminal connects to VM
- [ ] Scoring system works
- [ ] Leaderboard updates in real-time
- [ ] Admin dashboard accessible
- [ ] SSL certificate valid
- [ ] WebSocket connections work
- [ ] All API endpoints respond
- [ ] Database migrations applied
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Logs rotating properly

## 📞 Support

- Documentation: `/documentation`
- Issues: GitHub Issues
- Email: admin@yourdomain.com

---

**Deployment complete! Your NEXUS PROTOCOL instance is now live!** 🚀
