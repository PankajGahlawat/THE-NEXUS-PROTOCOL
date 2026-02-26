#!/bin/bash

# NEXUS PROTOCOL - Pre-Deployment Checklist
# Validates system is ready for production deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NEXUS PROTOCOL - Pre-Deployment Check       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check status
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# ============================================
# 1. Environment Files
# ============================================
echo -e "${BLUE}[1/10] Checking Environment Files...${NC}"

if [ -f ".env" ]; then
    check_pass ".env file exists"
    
    # Check critical variables
    if grep -q "JWT_SECRET=" .env && [ -n "$(grep JWT_SECRET= .env | cut -d'=' -f2)" ]; then
        JWT_LEN=$(grep JWT_SECRET= .env | cut -d'=' -f2 | wc -c)
        if [ $JWT_LEN -ge 32 ]; then
            check_pass "JWT_SECRET is set (${JWT_LEN} chars)"
        else
            check_fail "JWT_SECRET too short (${JWT_LEN} chars, need 32+)"
        fi
    else
        check_fail "JWT_SECRET not set"
    fi
    
    if grep -q "POSTGRES_PASSWORD=" .env && [ -n "$(grep POSTGRES_PASSWORD= .env | cut -d'=' -f2)" ]; then
        check_pass "POSTGRES_PASSWORD is set"
    else
        check_fail "POSTGRES_PASSWORD not set"
    fi
else
    check_fail ".env file missing"
fi

if [ -f "backend/.env" ]; then
    check_pass "backend/.env exists"
else
    check_warn "backend/.env missing (will use root .env)"
fi

if [ -f "frontend/.env.local" ]; then
    check_pass "frontend/.env.local exists"
else
    check_warn "frontend/.env.local missing"
fi

echo ""

# ============================================
# 2. Dependencies
# ============================================
echo -e "${BLUE}[2/10] Checking Dependencies...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed ($NODE_VERSION)"
else
    check_fail "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm installed ($NPM_VERSION)"
else
    check_fail "npm not installed"
fi

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    check_pass "Docker installed ($DOCKER_VERSION)"
else
    check_warn "Docker not installed (optional)"
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | tr -d ',')
    check_pass "Docker Compose installed ($COMPOSE_VERSION)"
else
    check_warn "Docker Compose not installed (optional)"
fi

echo ""

# ============================================
# 3. Backend Dependencies
# ============================================
echo -e "${BLUE}[3/10] Checking Backend Dependencies...${NC}"

if [ -d "backend/node_modules" ]; then
    check_pass "Backend node_modules exists"
    
    # Check critical packages
    if [ -d "backend/node_modules/express" ]; then
        check_pass "express installed"
    else
        check_fail "express not installed"
    fi
    
    if [ -d "backend/node_modules/socket.io" ]; then
        check_pass "socket.io installed"
    else
        check_fail "socket.io not installed"
    fi
    
    if [ -d "backend/node_modules/ssh2" ]; then
        check_pass "ssh2 installed"
    else
        check_fail "ssh2 not installed"
    fi
    
    if [ -d "backend/node_modules/pg" ]; then
        check_pass "pg (PostgreSQL) installed"
    else
        check_fail "pg not installed"
    fi
else
    check_fail "Backend node_modules missing - run: cd backend && npm install"
fi

echo ""

# ============================================
# 4. Frontend Dependencies
# ============================================
echo -e "${BLUE}[4/10] Checking Frontend Dependencies...${NC}"

if [ -d "frontend/node_modules" ]; then
    check_pass "Frontend node_modules exists"
    
    if [ -d "frontend/node_modules/react" ]; then
        check_pass "react installed"
    else
        check_fail "react not installed"
    fi
    
    if [ -d "frontend/node_modules/socket.io-client" ]; then
        check_pass "socket.io-client installed"
    else
        check_fail "socket.io-client not installed"
    fi
    
    if [ -d "frontend/node_modules/xterm" ]; then
        check_pass "xterm installed"
    else
        check_fail "xterm not installed"
    fi
else
    check_fail "Frontend node_modules missing - run: cd frontend && npm install"
fi

echo ""

# ============================================
# 5. Build Status
# ============================================
echo -e "${BLUE}[5/10] Checking Build Status...${NC}"

if [ -d "frontend/dist" ]; then
    check_pass "Frontend build exists"
    
    if [ -f "frontend/dist/index.html" ]; then
        check_pass "index.html exists"
    else
        check_fail "index.html missing in dist"
    fi
else
    check_warn "Frontend not built - run: cd frontend && npm run build"
fi

echo ""

# ============================================
# 6. Docker Configuration
# ============================================
echo -e "${BLUE}[6/10] Checking Docker Configuration...${NC}"

if [ -f "docker-compose.yml" ]; then
    check_pass "docker-compose.yml exists"
else
    check_fail "docker-compose.yml missing"
fi

if [ -f "backend/Dockerfile" ]; then
    check_pass "backend/Dockerfile exists"
else
    check_fail "backend/Dockerfile missing"
fi

if [ -f "frontend/Dockerfile" ]; then
    check_pass "frontend/Dockerfile exists"
else
    check_fail "frontend/Dockerfile missing"
fi

echo ""

# ============================================
# 7. Database Migrations
# ============================================
echo -e "${BLUE}[7/10] Checking Database Migrations...${NC}"

if [ -d "backend/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 backend/migrations/*.sql 2>/dev/null | wc -l)
    check_pass "Migrations directory exists ($MIGRATION_COUNT migrations)"
else
    check_warn "Migrations directory missing"
fi

echo ""

# ============================================
# 8. Security Files
# ============================================
echo -e "${BLUE}[8/10] Checking Security Configuration...${NC}"

if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        check_pass ".env is gitignored"
    else
        check_fail ".env not in .gitignore"
    fi
else
    check_fail ".gitignore missing"
fi

if [ -f ".env" ]; then
    if grep -q "password123" .env || grep -q "changeme" .env; then
        check_fail "Default passwords detected in .env"
    else
        check_pass "No default passwords detected"
    fi
fi

echo ""

# ============================================
# 9. Deployment Scripts
# ============================================
echo -e "${BLUE}[9/10] Checking Deployment Scripts...${NC}"

if [ -f "deployment/deploy.sh" ]; then
    check_pass "deployment/deploy.sh exists"
    if [ -x "deployment/deploy.sh" ]; then
        check_pass "deploy.sh is executable"
    else
        check_warn "deploy.sh not executable - run: chmod +x deployment/deploy.sh"
    fi
else
    check_fail "deployment/deploy.sh missing"
fi

if [ -f "deployment/docker-deploy.yml" ]; then
    check_pass "deployment/docker-deploy.yml exists"
else
    check_fail "deployment/docker-deploy.yml missing"
fi

if [ -f "deployment/nginx/nexus-protocol.conf" ]; then
    check_pass "Nginx config exists"
else
    check_fail "Nginx config missing"
fi

echo ""

# ============================================
# 10. Documentation
# ============================================
echo -e "${BLUE}[10/10] Checking Documentation...${NC}"

if [ -f "README.md" ]; then
    check_pass "README.md exists"
else
    check_warn "README.md missing"
fi

if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    check_pass "DEPLOYMENT_GUIDE.md exists"
else
    check_warn "DEPLOYMENT_GUIDE.md missing"
fi

if [ -f "VM_CONFIGURATION_GUIDE.md" ]; then
    check_pass "VM_CONFIGURATION_GUIDE.md exists"
else
    check_warn "VM_CONFIGURATION_GUIDE.md missing"
fi

echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Check Summary                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! System ready for deployment.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Review .env configuration"
    echo "  2. Build frontend: cd frontend && npm run build"
    echo "  3. Deploy with Docker: docker-compose up -d"
    echo "  4. Or deploy manually: sudo ./deployment/deploy.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found. Review before deployment.${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} error(s) and ${WARNINGS} warning(s) found.${NC}"
    echo -e "${RED}Fix errors before deployment!${NC}"
    echo ""
    exit 1
fi
