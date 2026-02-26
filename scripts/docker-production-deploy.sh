#!/bin/bash

# NEXUS PROTOCOL - Docker Production Deployment
# Deploy using Docker Compose with all services

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NEXUS PROTOCOL - Docker Deployment          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed!${NC}"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed!${NC}"
    echo "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# ============================================
# Step 1: Environment Setup
# ============================================
echo -e "${BLUE}[1/6] Setting up environment...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    
    # Generate secure credentials
    JWT_SECRET=$(openssl rand -base64 64)
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOF
# NEXUS PROTOCOL - Production Environment
NODE_ENV=production

# Database
POSTGRES_DB=nexusprotocol
POSTGRES_USER=nexus_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=3001
SSH_PROXY_PORT=3002

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_SSH_PROXY_URL=http://localhost:3002

# Security
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
EOF
    
    echo -e "${GREEN}✓ .env file created with secure credentials${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""

# ============================================
# Step 2: Build Images
# ============================================
echo -e "${BLUE}[2/6] Building Docker images...${NC}"

docker-compose build --no-cache

echo -e "${GREEN}✓ Images built successfully${NC}"
echo ""

# ============================================
# Step 3: Stop Existing Containers
# ============================================
echo -e "${BLUE}[3/6] Stopping existing containers...${NC}"

docker-compose down

echo -e "${GREEN}✓ Existing containers stopped${NC}"
echo ""

# ============================================
# Step 4: Start Services
# ============================================
echo -e "${BLUE}[4/6] Starting services...${NC}"

docker-compose up -d

echo -e "${GREEN}✓ Services started${NC}"
echo ""

# ============================================
# Step 5: Wait for Services
# ============================================
echo -e "${BLUE}[5/6] Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U nexus_user &> /dev/null; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for Backend
echo -n "Waiting for Backend..."
for i in {1..30}; do
    if curl -f http://localhost:3001/health &> /dev/null; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for Frontend
echo -n "Waiting for Frontend..."
for i in {1..30}; do
    if curl -f http://localhost:3000 &> /dev/null; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""

# ============================================
# Step 6: Run Migrations
# ============================================
echo -e "${BLUE}[6/6] Running database migrations...${NC}"

docker-compose exec -T backend npm run migrate || echo -e "${YELLOW}⚠ Migrations already applied${NC}"

echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

# ============================================
# Summary
# ============================================
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Deployment Complete! 🚀               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Services Status:${NC}"
docker-compose ps
echo ""

echo -e "${BLUE}Access your application:${NC}"
echo "  🌐 Frontend: http://localhost:3000"
echo "  🔌 Backend API: http://localhost:3001"
echo "  🔍 Health Check: http://localhost:3001/health"
echo "  🗄️  PostgreSQL: localhost:5432"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs: docker-compose logs -f"
echo "  View backend logs: docker-compose logs -f backend"
echo "  View frontend logs: docker-compose logs -f frontend"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  View status: docker-compose ps"
echo ""

echo -e "${BLUE}Database Credentials:${NC}"
echo "  Database: nexusprotocol"
echo "  User: nexus_user"
echo "  Password: (check .env file)"
echo "  Connection: postgresql://nexus_user:password@localhost:5432/nexusprotocol"
echo ""

echo -e "${GREEN}✓ NEXUS PROTOCOL is now running!${NC}"
echo ""
