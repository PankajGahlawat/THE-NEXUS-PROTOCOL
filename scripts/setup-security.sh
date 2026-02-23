#!/bin/bash
# NEXUS PROTOCOL - Security Setup Script
# Generates secure credentials and creates .env file

echo "🔒 NEXUS PROTOCOL - Security Setup"
echo "===================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  WARNING: .env file already exists!"
    read -p "Do you want to overwrite it? (yes/no): " overwrite
    if [ "$overwrite" != "yes" ]; then
        echo "Setup cancelled."
        exit 0
    fi
    echo ""
fi

# Generate JWT secret
echo "🔑 Generating JWT secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Generate database password
echo "🔑 Generating database password..."
DB_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Get CORS origin
echo ""
echo "🌐 CORS Configuration"
read -p "Enter allowed CORS origins (comma-separated, e.g., http://localhost:3000): " CORS_ORIGIN
if [ -z "$CORS_ORIGIN" ]; then
    CORS_ORIGIN="http://localhost:3000"
fi

# Create .env file
echo ""
echo "📝 Creating .env file..."
cat > .env << EOF
# NEXUS PROTOCOL Environment Configuration
# Generated: $(date)
# SECURITY: Keep this file secure and never commit to version control

# ============================================
# Application Settings
# ============================================
NODE_ENV=production
LOG_LEVEL=info

# ============================================
# Server Ports
# ============================================
FRONTEND_PORT=3000
BACKEND_PORT=3001
POSTGRES_PORT=5432

# ============================================
# Database Configuration
# ============================================
DATABASE_TYPE=postgresql
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=nexus_protocol
POSTGRES_USER=nexus
POSTGRES_PASSWORD=${DB_PASSWORD}

# Connection Pool
POSTGRES_POOL_MIN=10
POSTGRES_POOL_MAX=50

# ============================================
# Security Settings
# ============================================
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ORIGIN=${CORS_ORIGIN}

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
DDOS_THRESHOLD=50

# ============================================
# Frontend Configuration
# ============================================
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# ============================================
# Cyber Range Configuration
# ============================================
CYBER_RANGE_NETWORK=192.168.100.0/24
CYBER_RANGE_GATEWAY=192.168.100.1

# VM Tiers
TIER1_IP_RANGE=192.168.100.10-19
TIER2_IP_RANGE=192.168.100.20-29
TIER3_IP_RANGE=192.168.100.30-39

# VM Manager
VM_MANAGER_PORT=9000
HEALTH_CHECK_INTERVAL=30000
MAX_RESTART_ATTEMPTS=3

# ============================================
# Game Configuration
# ============================================
ROUND_DURATION=3600
PHASE_DURATIONS=1200,1200,1200

# Scoring
SPEED_BONUS_MULTIPLIER=10
STEALTH_BONUS_MULTIPLIER=20

# Trace & Burn
TRACE_DECAY_RATE=0.01
BURN_THRESHOLDS=25,50,75

# ============================================
# Logging Configuration
# ============================================
AUDIT_LOG_DIR=./logs
AUDIT_LOG_MAX_SIZE=10485760
AUDIT_LOG_MAX_FILES=10

# ============================================
# WebSocket Configuration
# ============================================
WS_MESSAGE_RATE_LIMIT=10
WS_MESSAGE_SIZE_LIMIT=100000

# ============================================
# Emergency Settings
# ============================================
EMERGENCY_CONTACT_EMAIL=admin@nexus-protocol.local
EMERGENCY_NOTIFICATION_WEBHOOK=

# ============================================
# Development Settings (disable in production)
# ============================================
DEBUG=false
ENABLE_SWAGGER=false
MOCK_VM_VALIDATION=false
EOF

# Set secure permissions
chmod 600 .env

echo ""
echo "✅ Security setup complete!"
echo ""
echo "📋 Generated credentials:"
echo "   - JWT Secret: ${JWT_SECRET:0:20}... (64 bytes)"
echo "   - DB Password: ${DB_PASSWORD:0:20}... (32 bytes)"
echo ""
echo "🔒 IMPORTANT SECURITY NOTES:"
echo "   1. .env file has been created with secure permissions (600)"
echo "   2. NEVER commit .env to version control"
echo "   3. Keep these credentials secure"
echo "   4. Rotate credentials regularly"
echo "   5. Use different credentials for each environment"
echo ""
echo "🚀 Next steps:"
echo "   1. Review .env file: cat .env"
echo "   2. Start services: docker-compose up -d"
echo "   3. Check logs: docker-compose logs -f"
echo ""
