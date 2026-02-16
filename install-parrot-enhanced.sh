#!/bin/bash

# NEXUS PROTOCOL - Enhanced Parrot OS Installation Script
# Lightweight version focused on core functionality
# Version: 1.0.0
# Last Updated: December 20, 2025

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Header
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║              NEXUS PROTOCOL - ENHANCED INSTALLER             ║
║                     Parrot OS Optimized                      ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Quick setup function
quick_setup() {
    log_step "Starting enhanced Parrot OS setup..."
    
    # Update system
    log_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Install essential packages
    log_info "Installing essential packages..."
    sudo apt install -y curl wget git build-essential python3 python3-pip sqlite3 nodejs npm
    
    # Verify Node.js version
    node_version=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$node_version" -lt 18 ]; then
        log_warning "Node.js version is too old, installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    log_success "System setup completed"
}

# Install project dependencies
install_dependencies() {
    log_step "Installing project dependencies..."
    
    # Backend
    if [ -d "backend" ]; then
        cd backend
        npm install
        
        # Create .env if needed
        if [ ! -f ".env" ] && [ -f ".env.example" ]; then
            cp .env.example .env
            sed -i 's/HOST=localhost/HOST=0.0.0.0/' .env
        fi
        cd ..
    fi
    
    # Frontend
    if [ -d "frontend" ]; then
        cd frontend
        npm install
        
        # Create .env.local
        cat > .env.local << EOF
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_ENV=development
EOF
        cd ..
    fi
    
    # Python environment
    if [ -f "requirements.txt" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        deactivate
    fi
    
    log_success "Dependencies installed"
}

# Create startup scripts
create_scripts() {
    log_step "Creating startup scripts..."
    
    # Quick start script
    cat > quick-start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nexus Protocol..."

# Start backend
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment
sleep 3

# Start frontend
cd ../frontend && npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo "✅ Nexus Protocol started!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"
echo "Demo: Team 'Ghost', Code '1234'"
echo
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF
    chmod +x quick-start.sh
    
    # Stop script
    cat > stop-all.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Nexus Protocol..."
pkill -f "npm.*dev"
pkill -f "node.*nexus"
echo "✅ All services stopped"
EOF
    chmod +x stop-all.sh
    
    log_success "Scripts created: quick-start.sh, stop-all.sh"
}

# Setup database
setup_database() {
    log_step "Setting up database..."
    
    if [ ! -f "nexus_protocol.db" ]; then
        sqlite3 nexus_protocol.db << 'EOF'
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  total_shards INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO teams (id, name, code) VALUES 
  ('ghost', 'Ghost', '1234'),
  ('phantom', 'Phantom', '5678');
EOF
        log_success "Database created with demo data"
    else
        log_info "Database already exists"
    fi
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        log_error "Please run this script from the Nexus Protocol project root"
        exit 1
    fi
    
    quick_setup
    install_dependencies
    setup_database
    create_scripts
    
    echo
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 INSTALLATION COMPLETE!                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}🚀 Quick Start:${NC}"
    echo -e "  ${YELLOW}./quick-start.sh${NC}  - Start everything"
    echo -e "  ${YELLOW}./stop-all.sh${NC}     - Stop all services"
    echo
    echo -e "${CYAN}🌐 URLs:${NC}"
    echo -e "  Frontend: ${YELLOW}http://localhost:5173${NC}"
    echo -e "  Backend:  ${YELLOW}http://localhost:3000${NC}"
    echo
    echo -e "${CYAN}🎮 Demo Login:${NC}"
    echo -e "  Team: ${YELLOW}Ghost${NC}, Code: ${YELLOW}1234${NC}"
    echo
    echo -e "${GREEN}Ready to hack the Nexus! 🎯${NC}"
}

# Run main function
main "$@"