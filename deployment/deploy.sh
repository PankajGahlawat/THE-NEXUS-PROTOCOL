#!/bin/bash

# NEXUS PROTOCOL - Production Deployment Script
# Deploys frontend and backend to production server

set -e

echo "🚀 NEXUS PROTOCOL - Production Deployment"
echo "=========================================="

# Configuration
DOMAIN="nexusprotocol.com"
DEPLOY_USER="deploy"
DEPLOY_PATH="/var/www/nexus-protocol"
BACKEND_PORT=3002
NODE_ENV="production"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx nodejs npm git

echo -e "${YELLOW}Step 2: Creating deployment directory...${NC}"
mkdir -p $DEPLOY_PATH
mkdir -p $DEPLOY_PATH/frontend
mkdir -p $DEPLOY_PATH/backend
mkdir -p /var/log/nexus-protocol

echo -e "${YELLOW}Step 3: Building frontend...${NC}"
cd frontend
npm install
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

echo -e "${YELLOW}Step 4: Deploying frontend...${NC}"
cp -r dist/* $DEPLOY_PATH/frontend/
echo -e "${GREEN}✓ Frontend deployed${NC}"

echo -e "${YELLOW}Step 5: Deploying backend...${NC}"
cd ../backend
npm install --production
cp -r . $DEPLOY_PATH/backend/
echo -e "${GREEN}✓ Backend deployed${NC}"

echo -e "${YELLOW}Step 6: Setting up environment...${NC}"
if [ ! -f "$DEPLOY_PATH/backend/.env" ]; then
    echo "Creating .env file..."
    cat > $DEPLOY_PATH/backend/.env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
HOST=0.0.0.0
SSH_PROXY_PORT=$BACKEND_PORT

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)

# Database (configure as needed)
DATABASE_URL=postgresql://localhost:5432/nexusprotocol

# CORS
CORS_ORIGIN=https://$DOMAIN
CORS_CREDENTIALS=true

# Frontend URL
FRONTEND_URL=https://$DOMAIN
EOF
    echo -e "${GREEN}✓ Environment file created${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping${NC}"
fi

echo -e "${YELLOW}Step 7: Setting up Nginx...${NC}"
cp deployment/nginx/nexus-protocol.conf /etc/nginx/sites-available/nexus-protocol
ln -sf /etc/nginx/sites-available/nexus-protocol /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
echo -e "${GREEN}✓ Nginx configured${NC}"

echo -e "${YELLOW}Step 8: Setting up SSL with Let's Encrypt...${NC}"
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    echo -e "${GREEN}✓ SSL certificate obtained${NC}"
else
    echo -e "${YELLOW}⚠ SSL certificate already exists${NC}"
fi

echo -e "${YELLOW}Step 9: Setting up systemd service...${NC}"
cat > /etc/systemd/system/nexus-protocol.service << EOF
[Unit]
Description=NEXUS PROTOCOL Backend Server
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$DEPLOY_PATH/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node start-ssh-proxy.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/nexus-protocol/backend.log
StandardError=append:/var/log/nexus-protocol/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nexus-protocol
echo -e "${GREEN}✓ Systemd service created${NC}"

echo -e "${YELLOW}Step 10: Setting permissions...${NC}"
chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH
chown -R $DEPLOY_USER:$DEPLOY_USER /var/log/nexus-protocol
echo -e "${GREEN}✓ Permissions set${NC}"

echo -e "${YELLOW}Step 11: Starting services...${NC}"
systemctl restart nexus-protocol
systemctl restart nginx
echo -e "${GREEN}✓ Services started${NC}"

echo -e "${YELLOW}Step 12: Setting up auto-renewal for SSL...${NC}"
(crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
echo -e "${GREEN}✓ Auto-renewal configured${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "🌐 Frontend: https://$DOMAIN"
echo "🔌 Backend: https://$DOMAIN/api"
echo "🔍 Health: https://$DOMAIN/health"
echo ""
echo "📊 Service Status:"
systemctl status nexus-protocol --no-pager -l
echo ""
echo "📝 Logs:"
echo "  Backend: journalctl -u nexus-protocol -f"
echo "  Nginx: tail -f /var/log/nginx/nexus-protocol-*.log"
echo ""
echo "🔧 Management Commands:"
echo "  Restart backend: sudo systemctl restart nexus-protocol"
echo "  Restart nginx: sudo systemctl restart nginx"
echo "  View logs: sudo journalctl -u nexus-protocol -f"
echo "  Renew SSL: sudo certbot renew"
echo ""
