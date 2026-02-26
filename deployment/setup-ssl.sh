#!/bin/bash

# NEXUS PROTOCOL - SSL Certificate Setup
# Obtains and configures Let's Encrypt SSL certificates

set -e

echo "🔒 NEXUS PROTOCOL - SSL Setup"
echo "=============================="

# Configuration
DOMAIN="${1:-nexusprotocol.com}"
EMAIL="${2:-admin@$DOMAIN}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: Domain not specified${NC}"
    echo "Usage: ./setup-ssl.sh <domain> <email>"
    exit 1
fi

echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}Email: $EMAIL${NC}"
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing certbot...${NC}"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing nginx...${NC}"
    apt-get install -y nginx
fi

# Create temporary Nginx config for certificate challenge
echo -e "${YELLOW}Creating temporary Nginx configuration...${NC}"
cat > /etc/nginx/sites-available/temp-ssl << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/temp-ssl /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Create certbot directory
mkdir -p /var/www/certbot

# Obtain certificate
echo -e "${YELLOW}Obtaining SSL certificate...${NC}"
certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL certificate obtained successfully${NC}"
else
    echo -e "${RED}✗ Failed to obtain SSL certificate${NC}"
    exit 1
fi

# Test certificate
echo -e "${YELLOW}Testing certificate...${NC}"
certbot certificates

# Setup auto-renewal
echo -e "${YELLOW}Setting up auto-renewal...${NC}"
cat > /etc/cron.d/certbot-renew << EOF
# Renew Let's Encrypt certificates twice daily
0 0,12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

echo -e "${GREEN}✓ Auto-renewal configured${NC}"

# Remove temporary config
rm -f /etc/nginx/sites-enabled/temp-ssl

echo ""
echo -e "${GREEN}=============================="
echo "✅ SSL Setup Complete!"
echo "==============================${NC}"
echo ""
echo "📜 Certificate location:"
echo "  /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo "🔄 Auto-renewal:"
echo "  Certificates will auto-renew twice daily"
echo "  Test renewal: sudo certbot renew --dry-run"
echo ""
echo "📝 Next steps:"
echo "  1. Deploy the full Nginx configuration"
echo "  2. Run: sudo systemctl reload nginx"
echo ""
