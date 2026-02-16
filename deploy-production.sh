#!/bin/bash

# NEXUS PROTOCOL - Production Deployment Script
# Deploys the complete full stack application to production
# Version: 1.0.0
# Last Updated: December 20, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                ║
║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                ║
║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                ║
║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                ║
║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                ║
║                                                               ║
║              PRODUCTION DEPLOYMENT                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "Starting Nexus Protocol production deployment..."

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    log_warning "PostgreSQL client not found. Database setup may fail."
fi

log_success "Prerequisites check completed"

# Environment setup
log_info "Setting up production environment..."

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.production" ]; then
        cp backend/.env.production backend/.env
        log_warning "Created .env from .env.production template"
        log_warning "Please update the .env file with your production values before continuing"
        read -p "Press Enter to continue after updating .env file..."
    else
        log_error "No .env file found. Please create backend/.env with production configuration"
        exit 1
    fi
fi

# Install dependencies
log_info "Installing production dependencies..."

# Backend dependencies
cd backend
npm ci --only=production
log_success "Backend dependencies installed"

# Frontend dependencies and build
cd ../frontend
npm ci
log_info "Building frontend for production..."
npm run build
log_success "Frontend built successfully"

cd ..

# Database setup
log_info "Setting up database..."

if [ -f "backend/scripts/init-database.js" ]; then
    cd backend
    node scripts/init-database.js
    log_success "Database initialized"
    cd ..
else
    log_warning "Database initialization script not found"
fi

# Create systemd service files
log_info "Creating systemd service files..."

sudo tee /etc/systemd/system/nexus-protocol.service > /dev/null << EOF
[Unit]
Description=Nexus Protocol Backend Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node index_enhanced.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=nexus-protocol

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable nexus-protocol

log_success "Systemd service created and enabled"

# Setup nginx configuration
log_info "Setting up nginx configuration..."

sudo tee /etc/nginx/sites-available/nexus-protocol > /dev/null << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration (update paths)
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend static files
    location / {
        root $(pwd)/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/nexus-protocol /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

log_success "Nginx configuration created"

# Setup log rotation
log_info "Setting up log rotation..."

sudo tee /etc/logrotate.d/nexus-protocol > /dev/null << EOF
$(pwd)/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload nexus-protocol
    endscript
}
EOF

log_success "Log rotation configured"

# Create startup script
log_info "Creating startup script..."

cat > start-production.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Nexus Protocol Production Server..."

# Start the systemd service
sudo systemctl start nexus-protocol

# Check status
sleep 3
if sudo systemctl is-active --quiet nexus-protocol; then
    echo "✅ Nexus Protocol is running"
    echo "🌐 Frontend: https://your-domain.com"
    echo "📡 Backend: https://your-domain.com/api"
    echo "📊 Health: https://your-domain.com/api/health"
else
    echo "❌ Failed to start Nexus Protocol"
    sudo systemctl status nexus-protocol
fi
EOF

chmod +x start-production.sh

# Create monitoring script
cat > monitor-production.sh << 'EOF'
#!/bin/bash

echo "📊 Nexus Protocol Production Status"
echo "=================================="

# Service status
echo "🔧 Service Status:"
sudo systemctl status nexus-protocol --no-pager -l

echo ""
echo "📈 Resource Usage:"
ps aux | grep "node.*nexus" | grep -v grep

echo ""
echo "🌐 Network Status:"
netstat -tlnp | grep :3000

echo ""
echo "📋 Recent Logs:"
sudo journalctl -u nexus-protocol --no-pager -n 10
EOF

chmod +x monitor-production.sh

log_success "Management scripts created"

# Final instructions
echo ""
log_success "🎉 Production deployment completed!"
echo ""
log_info "📋 Next Steps:"
echo "   1. Update backend/.env with your production values"
echo "   2. Update nginx configuration with your domain and SSL certificates"
echo "   3. Start the service: ./start-production.sh"
echo "   4. Monitor the service: ./monitor-production.sh"
echo ""
log_info "🔧 Management Commands:"
echo "   Start:   sudo systemctl start nexus-protocol"
echo "   Stop:    sudo systemctl stop nexus-protocol"
echo "   Restart: sudo systemctl restart nexus-protocol"
echo "   Status:  sudo systemctl status nexus-protocol"
echo "   Logs:    sudo journalctl -u nexus-protocol -f"
echo ""
log_warning "⚠️  Remember to:"
echo "   - Configure SSL certificates"
echo "   - Update domain names in nginx config"
echo "   - Set secure JWT secrets in .env"
echo "   - Configure PostgreSQL with secure passwords"
echo ""
log_success "The Nexus Protocol is ready for production deployment! 🎯"