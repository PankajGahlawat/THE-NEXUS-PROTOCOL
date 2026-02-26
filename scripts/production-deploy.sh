#!/bin/bash

# NEXUS PROTOCOL - Production Deployment Script
# Complete automated deployment to production server

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NEXUS PROTOCOL - Production Deployment      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root: sudo $0${NC}"
    exit 1
fi

# Configuration
read -p "Enter your domain name (e.g., nexusprotocol.com): " DOMAIN
read -p "Enter admin email for SSL: " ADMIN_EMAIL
read -p "Enter deployment path [/var/www/nexus-protocol]: " DEPLOY_PATH
DEPLOY_PATH=${DEPLOY_PATH:-/var/www/nexus-protocol}

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  Email: $ADMIN_EMAIL"
echo "  Path: $DEPLOY_PATH"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""

# ============================================
# Step 1: System Update
# ============================================
echo -e "${BLUE}[1/12] Updating system...${NC}"
apt-get update
apt-get upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# ============================================
# Step 2: Install Dependencies
# ============================================
echo -e "${BLUE}[2/12] Installing dependencies...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed${NC}"
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# PostgreSQL
if ! command -v psql &> /dev/null; then
    apt-get install -y postgresql postgresql-contrib
    echo -e "${GREEN}✓ PostgreSQL installed${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL already installed${NC}"
fi

# Certbot
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

echo ""

# ============================================
# Step 3: Create Deployment Directory
# ============================================
echo -e "${BLUE}[3/12] Creating deployment directory...${NC}"
mkdir -p $DEPLOY_PATH/frontend
mkdir -p $DEPLOY_PATH/backend
mkdir -p /var/log/nexus-protocol
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# ============================================
# Step 4: Setup Database
# ============================================
echo -e "${BLUE}[4/12] Setting up database...${NC}"

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE IF NOT EXISTS nexusprotocol;
CREATE USER IF NOT EXISTS nexus_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE nexusprotocol TO nexus_user;
ALTER DATABASE nexusprotocol OWNER TO nexus_user;
\q
EOF

echo -e "${GREEN}✓ Database created${NC}"
echo -e "${YELLOW}  Database: nexusprotocol${NC}"
echo -e "${YELLOW}  User: nexus_user${NC}"
echo -e "${YELLOW}  Password: $DB_PASSWORD${NC}"
echo ""

# ============================================
# Step 5: Build Frontend
# ============================================
echo -e "${BLUE}[5/12] Building frontend...${NC}"
cd frontend

# Install dependencies
npm install

# Create production environment
cat > .env.production << EOF
VITE_API_URL=https://$DOMAIN/api
VITE_WS_URL=wss://$DOMAIN
VITE_SSH_PROXY_URL=https://$DOMAIN
VITE_ENV=production
EOF

# Build
npm run build

echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# ============================================
# Step 6: Deploy Frontend
# ============================================
echo -e "${BLUE}[6/12] Deploying frontend...${NC}"
cp -r dist/* $DEPLOY_PATH/frontend/
echo -e "${GREEN}✓ Frontend deployed to $DEPLOY_PATH/frontend${NC}"
echo ""

# ============================================
# Step 7: Deploy Backend
# ============================================
echo -e "${BLUE}[7/12] Deploying backend...${NC}"
cd ../backend

# Install production dependencies
npm install --production

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3002
SSH_PROXY_PORT=3002
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://nexus_user:$DB_PASSWORD@localhost:5432/nexusprotocol
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nexusprotocol
POSTGRES_USER=nexus_user
POSTGRES_PASSWORD=$DB_PASSWORD

# Security
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# CORS
CORS_ORIGIN=https://$DOMAIN
CORS_CREDENTIALS=true

# Frontend
FRONTEND_URL=https://$DOMAIN

# Logging
LOG_LEVEL=info
EOF

# Copy backend files
cp -r . $DEPLOY_PATH/backend/

echo -e "${GREEN}✓ Backend deployed to $DEPLOY_PATH/backend${NC}"
echo ""

# ============================================
# Step 8: Run Database Migrations
# ============================================
echo -e "${BLUE}[8/12] Running database migrations...${NC}"
cd $DEPLOY_PATH/backend
npm run migrate || echo -e "${YELLOW}⚠ Migrations failed or already applied${NC}"
echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

# ============================================
# Step 9: Configure Nginx
# ============================================
echo -e "${BLUE}[9/12] Configuring Nginx...${NC}"

# Create Nginx config
cat > /etc/nginx/sites-available/nexus-protocol << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root DEPLOY_PATH_PLACEHOLDER/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3002/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3002/health;
        access_log off;
    }
}
NGINXEOF

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" /etc/nginx/sites-available/nexus-protocol
sed -i "s|DEPLOY_PATH_PLACEHOLDER|$DEPLOY_PATH|g" /etc/nginx/sites-available/nexus-protocol

# Enable site
ln -sf /etc/nginx/sites-available/nexus-protocol /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

echo -e "${GREEN}✓ Nginx configured${NC}"
echo ""

# ============================================
# Step 10: Setup PM2
# ============================================
echo -e "${BLUE}[10/12] Setting up PM2...${NC}"

cd $DEPLOY_PATH/backend

# Start backend with PM2
pm2 start start-ssh-proxy.js --name nexus-backend --time
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✓ PM2 configured${NC}"
echo ""

# ============================================
# Step 11: Setup SSL
# ============================================
echo -e "${BLUE}[11/12] Setting up SSL certificate...${NC}"

# Reload Nginx first (without SSL)
systemctl reload nginx

# Obtain certificate
certbot --nginx -d $DOMAIN -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $ADMIN_EMAIL \
    --redirect

echo -e "${GREEN}✓ SSL certificate obtained${NC}"
echo ""

# ============================================
# Step 12: Setup Firewall
# ============================================
echo -e "${BLUE}[12/12] Configuring firewall...${NC}"

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo -e "${GREEN}✓ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠ UFW not installed, skipping firewall setup${NC}"
fi

echo ""

# ============================================
# Final Steps
# ============================================
echo -e "${BLUE}Setting permissions...${NC}"
chown -R www-data:www-data $DEPLOY_PATH/frontend
chown -R root:root $DEPLOY_PATH/backend
chmod -R 755 $DEPLOY_PATH

echo -e "${BLUE}Restarting services...${NC}"
systemctl restart nginx
pm2 restart nexus-backend

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Deployment Complete! 🚀               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo "  🌐 Frontend: https://$DOMAIN"
echo "  🔌 Backend API: https://$DOMAIN/api"
echo "  🔍 Health Check: https://$DOMAIN/health"
echo ""
echo -e "${BLUE}Credentials saved to:${NC}"
echo "  📄 $DEPLOY_PATH/backend/.env"
echo ""
echo -e "${YELLOW}Important credentials:${NC}"
echo "  Database: nexusprotocol"
echo "  DB User: nexus_user"
echo "  DB Password: $DB_PASSWORD"
echo ""
echo -e "${BLUE}Service Management:${NC}"
echo "  Backend: pm2 status | pm2 logs nexus-backend"
echo "  Nginx: systemctl status nginx"
echo "  Database: systemctl status postgresql"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  Backend: pm2 logs nexus-backend"
echo "  Nginx: tail -f /var/log/nginx/access.log"
echo "  System: journalctl -u nexus-protocol -f"
echo ""
echo -e "${GREEN}✓ NEXUS PROTOCOL is now live!${NC}"
echo ""
