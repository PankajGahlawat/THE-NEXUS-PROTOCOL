#!/bin/bash

# NEXUS PROTOCOL - Parrot OS Complete Setup Script
# Comprehensive development environment setup for Parrot OS
# Version: 2.0.0
# Last Updated: December 20, 2025

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# ASCII Art Header
print_header() {
    echo -e "${CYAN}"
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
║              PARROT OS SETUP SCRIPT                          ║
║           Complete Development Environment                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons."
        log_info "Please run as a regular user. The script will use sudo when needed."
        exit 1
    fi
}

# Check if we're on Parrot OS
check_parrot_os() {
    if [[ ! -f /etc/parrot-version ]]; then
        log_warning "This script is optimized for Parrot OS but will attempt to run on this system."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Parrot OS detected"
        cat /etc/parrot-version
    fi
}

# Update system packages
update_system() {
    log_step "Updating system packages..."
    
    sudo apt update
    if [ $? -ne 0 ]; then
        log_error "Failed to update package lists"
        exit 1
    fi
    
    sudo apt upgrade -y
    if [ $? -ne 0 ]; then
        log_warning "Some packages failed to upgrade, continuing..."
    fi
    
    log_success "System packages updated"
}

# Install system dependencies
install_system_dependencies() {
    log_step "Installing system dependencies..."
    
    local packages=(
        "curl"
        "wget"
        "git"
        "build-essential"
        "python3"
        "python3-pip"
        "python3-venv"
        "sqlite3"
        "postgresql"
        "postgresql-contrib"
        "redis-server"
        "nginx"
        "ufw"
        "htop"
        "net-tools"
        "lsof"
        "jq"
        "unzip"
        "ca-certificates"
        "gnupg"
        "lsb-release"
    )
    
    for package in "${packages[@]}"; do
        log_info "Installing $package..."
        sudo apt install -y "$package"
        if [ $? -ne 0 ]; then
            log_error "Failed to install $package"
            exit 1
        fi
    done
    
    log_success "System dependencies installed"
}

# Install Node.js via NodeSource
install_nodejs() {
    log_step "Installing Node.js 20.x LTS..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        local node_version=$(node -v)
        log_info "Node.js is already installed: $node_version"
        
        # Check if version is acceptable (18+)
        local major_version=$(echo $node_version | cut -d'.' -f1 | sed 's/v//')
        if [ "$major_version" -ge 18 ]; then
            log_success "Node.js version is acceptable"
            return 0
        else
            log_warning "Node.js version is too old, updating..."
        fi
    fi
    
    # Install Node.js 20.x LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    if [ $? -ne 0 ]; then
        log_error "Failed to add NodeSource repository"
        exit 1
    fi
    
    sudo apt install -y nodejs
    if [ $? -ne 0 ]; then
        log_error "Failed to install Node.js"
        exit 1
    fi
    
    # Verify installation
    local node_version=$(node -v)
    local npm_version=$(npm -v)
    log_success "Node.js installed: $node_version"
    log_success "npm installed: $npm_version"
    
    # Install global npm packages
    log_info "Installing global npm packages..."
    sudo npm install -g nodemon pm2 typescript @types/node
    if [ $? -ne 0 ]; then
        log_warning "Some global packages failed to install, continuing..."
    fi
}

# Setup PostgreSQL
setup_postgresql() {
    log_step "Setting up PostgreSQL..."
    
    # Start PostgreSQL service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database user and database
    log_info "Creating PostgreSQL database and user..."
    
    sudo -u postgres psql << EOF
CREATE USER nexus_user WITH PASSWORD 'nexus_secure_password_2025';
CREATE DATABASE nexusprotocol OWNER nexus_user;
GRANT ALL PRIVILEGES ON DATABASE nexusprotocol TO nexus_user;
ALTER USER nexus_user CREATEDB;
\q
EOF
    
    if [ $? -eq 0 ]; then
        log_success "PostgreSQL database setup completed"
    else
        log_warning "PostgreSQL setup had issues, continuing with SQLite fallback"
    fi
}

# Setup Redis
setup_redis() {
    log_step "Setting up Redis..."
    
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    # Test Redis connection
    if redis-cli ping | grep -q "PONG"; then
        log_success "Redis is running and accessible"
    else
        log_warning "Redis setup had issues, continuing..."
    fi
}

# Create Python virtual environment
setup_python_environment() {
    log_step "Setting up Python virtual environment..."
    
    # Create virtual environment for the monitor server
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        if [ $? -ne 0 ]; then
            log_error "Failed to create Python virtual environment"
            exit 1
        fi
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install Python dependencies
    if [ -f "requirements.txt" ]; then
        log_info "Installing Python dependencies from requirements.txt..."
        pip install -r requirements.txt
        if [ $? -ne 0 ]; then
            log_error "Failed to install Python dependencies"
            exit 1
        fi
        log_success "Python dependencies installed"
    else
        log_warning "requirements.txt not found, installing basic dependencies..."
        pip install fastapi uvicorn pydantic aiohttp websockets
    fi
    
    deactivate
}

# Install project dependencies
install_project_dependencies() {
    log_step "Installing project dependencies..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
        log_error "Not in Nexus Protocol project directory"
        log_info "Please run this script from the project root directory"
        exit 1
    fi
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        log_info "Installing backend dependencies..."
        cd backend
        
        if [ ! -f "package.json" ]; then
            log_error "Backend package.json not found"
            exit 1
        fi
        
        npm install
        if [ $? -ne 0 ]; then
            log_error "Failed to install backend dependencies"
            exit 1
        fi
        
        # Create .env file if it doesn't exist
        if [ ! -f ".env" ]; then
            if [ -f ".env.example" ]; then
                log_info "Creating backend .env file from example..."
                cp .env.example .env
                
                # Update .env for Parrot OS setup
                sed -i 's/HOST=localhost/HOST=0.0.0.0/' .env
                sed -i 's/DATABASE_URL=.*/DATABASE_URL=postgresql:\/\/nexus_user:nexus_secure_password_2025@localhost:5432\/nexusprotocol/' .env
                
                log_success "Backend .env file created and configured"
            else
                log_warning "No .env.example found, creating basic .env file..."
                cat > .env << EOF
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
JWT_SECRET=nexus_jwt_secret_parrot_os_2025
SESSION_SECRET=nexus_session_secret_parrot_os_2025
DATABASE_URL=postgresql://nexus_user:nexus_secure_password_2025@localhost:5432/nexusprotocol
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://0.0.0.0:5173
LOG_LEVEL=debug
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
EOF
            fi
        fi
        
        cd ..
        log_success "Backend dependencies installed"
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        log_info "Installing frontend dependencies..."
        cd frontend
        
        if [ ! -f "package.json" ]; then
            log_error "Frontend package.json not found"
            exit 1
        fi
        
        npm install
        if [ $? -ne 0 ]; then
            log_error "Failed to install frontend dependencies"
            exit 1
        fi
        
        # Create .env.local file for development
        if [ ! -f ".env.local" ]; then
            log_info "Creating frontend .env.local file..."
            cat > .env.local << EOF
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_ENV=development
EOF
            log_success "Frontend .env.local file created"
        fi
        
        cd ..
        log_success "Frontend dependencies installed"
    fi
}

# Build frontend
build_frontend() {
    log_step "Building frontend application..."
    
    if [ -d "frontend" ]; then
        cd frontend
        
        # Run TypeScript check
        log_info "Running TypeScript check..."
        npx tsc --noEmit
        if [ $? -ne 0 ]; then
            log_warning "TypeScript check failed, continuing with build..."
        fi
        
        # Build the application
        log_info "Building React application with Vite..."
        npm run build
        if [ $? -ne 0 ]; then
            log_error "Frontend build failed"
            exit 1
        fi
        
        cd ..
        log_success "Frontend built successfully"
    else
        log_warning "Frontend directory not found, skipping build"
    fi
}

# Setup database schema
setup_database_schema() {
    log_step "Setting up database schema..."
    
    # Try PostgreSQL first
    if command -v psql &> /dev/null; then
        log_info "Setting up PostgreSQL schema..."
        
        if [ -f "frontend/supabase/schema.sql" ]; then
            # Modify schema for PostgreSQL (remove Supabase-specific parts)
            log_info "Applying database schema..."
            
            # Create a modified schema file for PostgreSQL
            cat > temp_schema.sql << 'EOF'
-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  total_shards INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Users Table (Players)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  username TEXT NOT NULL,
  assigned_role TEXT CHECK (assigned_role IN ('HACKER', 'INFILTRATOR', 'ANALYST')),
  active_now BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Progress Table
CREATE TABLE IF NOT EXISTS progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) NOT NULL,
  mission_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  role_played TEXT NOT NULL,
  shards_earned INTEGER DEFAULT 0
);

-- Live Activity Feed
CREATE TABLE IF NOT EXISTS live_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert demo data
INSERT INTO teams (name, code, total_shards) VALUES 
  ('Ghost', '1234', 0),
  ('Phantom', '5678', 0),
  ('Shadow', '9012', 0),
  ('Cipher', '3456', 0)
ON CONFLICT (code) DO NOTHING;
EOF
            
            PGPASSWORD=nexus_secure_password_2025 psql -h localhost -U nexus_user -d nexusprotocol -f temp_schema.sql
            if [ $? -eq 0 ]; then
                log_success "PostgreSQL schema applied successfully"
            else
                log_warning "PostgreSQL schema application failed, continuing..."
            fi
            
            rm temp_schema.sql
        fi
    fi
    
    # Setup SQLite as fallback
    log_info "Setting up SQLite database..."
    
    if [ ! -f "nexus_protocol.db" ]; then
        sqlite3 nexus_protocol.db << 'EOF'
-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  total_shards INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id),
  username TEXT NOT NULL,
  assigned_role TEXT CHECK (assigned_role IN ('HACKER', 'INFILTRATOR', 'ANALYST')),
  active_now BOOLEAN DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Progress Table
CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) NOT NULL,
  mission_id TEXT NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  role_played TEXT NOT NULL,
  shards_earned INTEGER DEFAULT 0
);

-- Live Activity Feed
CREATE TABLE IF NOT EXISTS live_activity (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) NOT NULL,
  user_id TEXT REFERENCES users(id),
  action_type TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo data
INSERT OR IGNORE INTO teams (name, code, total_shards) VALUES 
  ('Ghost', '1234', 0),
  ('Phantom', '5678', 0),
  ('Shadow', '9012', 0),
  ('Cipher', '3456', 0);
EOF
        
        if [ $? -eq 0 ]; then
            log_success "SQLite database created and initialized"
        else
            log_error "Failed to create SQLite database"
            exit 1
        fi
    else
        log_info "SQLite database already exists"
    fi
}

# Configure firewall
configure_firewall() {
    log_step "Configuring firewall..."
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow SSH (important for remote access)
    sudo ufw allow ssh
    
    # Allow Nexus Protocol ports
    sudo ufw allow 3000/tcp comment 'Nexus Protocol Backend'
    sudo ufw allow 5173/tcp comment 'Nexus Protocol Frontend'
    sudo ufw allow 8000/tcp comment 'Nexus Protocol Monitor'
    
    # Allow PostgreSQL (local only)
    sudo ufw allow from 127.0.0.1 to any port 5432
    
    # Allow Redis (local only)
    sudo ufw allow from 127.0.0.1 to any port 6379
    
    log_success "Firewall configured"
    sudo ufw status
}

# Create startup scripts
create_startup_scripts() {
    log_step "Creating startup scripts..."
    
    # Create start-backend.sh
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nexus Protocol Backend Server..."
cd backend
npm run dev
EOF
    chmod +x start-backend.sh
    
    # Create start-frontend.sh
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nexus Protocol Frontend..."
cd frontend
npm run dev -- --host 0.0.0.0
EOF
    chmod +x start-frontend.sh
    
    # Create start-monitor.sh
    cat > start-monitor.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nexus Protocol Monitor Server..."
source venv/bin/activate
python3 nexus_monitor_server.py
EOF
    chmod +x start-monitor.sh
    
    # Create start-all.sh
    cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nexus Protocol Complete System..."
echo

# Start PostgreSQL and Redis
sudo systemctl start postgresql redis-server

echo "📡 Starting backend server..."
gnome-terminal --title="Nexus Backend" -- bash -c "cd backend && npm run dev; exec bash"

sleep 3

echo "🎮 Starting frontend application..."
gnome-terminal --title="Nexus Frontend" -- bash -c "cd frontend && npm run dev -- --host 0.0.0.0; exec bash"

sleep 2

echo "📊 Starting monitor server..."
gnome-terminal --title="Nexus Monitor" -- bash -c "source venv/bin/activate && python3 nexus_monitor_server.py; exec bash"

echo
echo "✅ Nexus Protocol is now running!"
echo
echo "🌐 Frontend: http://localhost:5173"
echo "📡 Backend:  http://localhost:3000"
echo "📊 Monitor:  http://localhost:8000"
echo
echo "Demo Credentials:"
echo "  Team Name: Ghost"
echo "  Access Code: 1234"
echo
EOF
    chmod +x start-all.sh
    
    # Create stop-all.sh
    cat > stop-all.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Nexus Protocol..."

# Kill Node.js processes
pkill -f "node.*nexus"
pkill -f "npm.*dev"

# Kill Python processes
pkill -f "nexus_monitor_server.py"

echo "✅ All Nexus Protocol processes stopped"
EOF
    chmod +x stop-all.sh
    
    # Create development script
    cat > dev-setup.sh << 'EOF'
#!/bin/bash
echo "🔧 Nexus Protocol Development Setup"
echo

# Check system status
echo "System Status:"
echo "- Node.js: $(node -v 2>/dev/null || echo 'Not installed')"
echo "- npm: $(npm -v 2>/dev/null || echo 'Not installed')"
echo "- Python: $(python3 --version 2>/dev/null || echo 'Not installed')"
echo "- PostgreSQL: $(sudo systemctl is-active postgresql 2>/dev/null || echo 'Not running')"
echo "- Redis: $(sudo systemctl is-active redis-server 2>/dev/null || echo 'Not running')"
echo

# Start services
echo "Starting services..."
sudo systemctl start postgresql redis-server

# Check ports
echo "Port Status:"
echo "- 3000 (Backend): $(lsof -ti:3000 >/dev/null && echo 'In use' || echo 'Available')"
echo "- 5173 (Frontend): $(lsof -ti:5173 >/dev/null && echo 'In use' || echo 'Available')"
echo "- 8000 (Monitor): $(lsof -ti:8000 >/dev/null && echo 'In use' || echo 'Available')"
echo

echo "Ready for development!"
EOF
    chmod +x dev-setup.sh
    
    log_success "Startup scripts created:"
    log_info "  • start-backend.sh  - Backend server only"
    log_info "  • start-frontend.sh - Frontend application only"
    log_info "  • start-monitor.sh  - Monitor server only"
    log_info "  • start-all.sh      - Complete system"
    log_info "  • stop-all.sh       - Stop all services"
    log_info "  • dev-setup.sh      - Development environment check"
}

# Create systemd services (optional)
create_systemd_services() {
    log_step "Creating systemd services (optional)..."
    
    read -p "Create systemd services for auto-start? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Skipping systemd services creation"
        return 0
    fi
    
    local project_dir=$(pwd)
    
    # Backend service
    sudo tee /etc/systemd/system/nexus-backend.service > /dev/null << EOF
[Unit]
Description=Nexus Protocol Backend Server
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$project_dir/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Frontend service (for production)
    sudo tee /etc/systemd/system/nexus-frontend.service > /dev/null << EOF
[Unit]
Description=Nexus Protocol Frontend Server
After=network.target nexus-backend.service
Wants=nexus-backend.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$project_dir/frontend
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Monitor service
    sudo tee /etc/systemd/system/nexus-monitor.service > /dev/null << EOF
[Unit]
Description=Nexus Protocol Monitor Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$project_dir
Environment=PATH=$project_dir/venv/bin:/usr/bin:/bin
ExecStart=$project_dir/venv/bin/python nexus_monitor_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    log_success "Systemd services created"
    log_info "To enable auto-start:"
    log_info "  sudo systemctl enable nexus-backend nexus-frontend nexus-monitor"
    log_info "To start services:"
    log_info "  sudo systemctl start nexus-backend nexus-frontend nexus-monitor"
}

# Performance optimization
optimize_system() {
    log_step "Applying system optimizations..."
    
    # Increase file descriptor limits
    echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    
    # Optimize network settings
    sudo tee -a /etc/sysctl.conf > /dev/null << EOF

# Nexus Protocol Network Optimizations
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 1024
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10
EOF
    
    # Apply sysctl settings
    sudo sysctl -p
    
    log_success "System optimizations applied"
}

# Verify installation
verify_installation() {
    log_step "Verifying installation..."
    
    local errors=0
    
    # Check Node.js
    if command -v node &> /dev/null; then
        log_success "Node.js: $(node -v)"
    else
        log_error "Node.js not found"
        ((errors++))
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        log_success "npm: $(npm -v)"
    else
        log_error "npm not found"
        ((errors++))
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        log_success "Python: $(python3 --version)"
    else
        log_error "Python3 not found"
        ((errors++))
    fi
    
    # Check PostgreSQL
    if sudo systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL: Running"
    else
        log_warning "PostgreSQL: Not running"
    fi
    
    # Check Redis
    if sudo systemctl is-active --quiet redis-server; then
        log_success "Redis: Running"
    else
        log_warning "Redis: Not running"
    fi
    
    # Check project files
    if [ -d "backend" ] && [ -d "frontend" ]; then
        log_success "Project structure: Valid"
    else
        log_error "Project structure: Invalid"
        ((errors++))
    fi
    
    # Check dependencies
    if [ -d "backend/node_modules" ]; then
        log_success "Backend dependencies: Installed"
    else
        log_error "Backend dependencies: Missing"
        ((errors++))
    fi
    
    if [ -d "frontend/node_modules" ]; then
        log_success "Frontend dependencies: Installed"
    else
        log_error "Frontend dependencies: Missing"
        ((errors++))
    fi
    
    # Check Python virtual environment
    if [ -d "venv" ]; then
        log_success "Python virtual environment: Created"
    else
        log_warning "Python virtual environment: Missing"
    fi
    
    # Check database
    if [ -f "nexus_protocol.db" ]; then
        log_success "SQLite database: Created"
    else
        log_warning "SQLite database: Missing"
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "Installation verification completed successfully!"
        return 0
    else
        log_error "Installation verification found $errors errors"
        return 1
    fi
}

# Print final instructions
print_final_instructions() {
    echo
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    INSTALLATION COMPLETE!                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}🚀 Quick Start Commands:${NC}"
    echo -e "  ${YELLOW}./start-all.sh${NC}        - Start complete system"
    echo -e "  ${YELLOW}./start-backend.sh${NC}    - Start backend only"
    echo -e "  ${YELLOW}./start-frontend.sh${NC}   - Start frontend only"
    echo -e "  ${YELLOW}./start-monitor.sh${NC}    - Start monitor only"
    echo -e "  ${YELLOW}./stop-all.sh${NC}         - Stop all services"
    echo -e "  ${YELLOW}./dev-setup.sh${NC}        - Check development environment"
    echo
    echo -e "${CYAN}🌐 Access URLs:${NC}"
    echo -e "  Frontend:  ${YELLOW}http://localhost:5173${NC}"
    echo -e "  Backend:   ${YELLOW}http://localhost:3000${NC}"
    echo -e "  Monitor:   ${YELLOW}http://localhost:8000${NC}"
    echo -e "  Health:    ${YELLOW}http://localhost:3000/health${NC}"
    echo
    echo -e "${CYAN}🎮 Demo Credentials:${NC}"
    echo -e "  Team Name:   ${YELLOW}Ghost${NC}"
    echo -e "  Access Code: ${YELLOW}1234${NC}"
    echo
    echo -e "${CYAN}📁 Important Files:${NC}"
    echo -e "  Backend config:  ${YELLOW}backend/.env${NC}"
    echo -e "  Frontend config: ${YELLOW}frontend/.env.local${NC}"
    echo -e "  Database:        ${YELLOW}nexus_protocol.db${NC}"
    echo
    echo -e "${CYAN}🔧 System Services:${NC}"
    echo -e "  PostgreSQL: ${YELLOW}sudo systemctl start postgresql${NC}"
    echo -e "  Redis:      ${YELLOW}sudo systemctl start redis-server${NC}"
    echo
    echo -e "${GREEN}The Nexus Protocol is ready for deployment! 🎯${NC}"
    echo
}

# Main execution
main() {
    print_header
    
    log_info "Starting Nexus Protocol setup for Parrot OS..."
    log_info "This script will install and configure the complete development environment."
    echo
    
    # Confirmation
    read -p "Continue with installation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Installation cancelled by user"
        exit 0
    fi
    
    # Pre-flight checks
    check_root
    check_parrot_os
    
    # Main installation steps
    update_system
    install_system_dependencies
    install_nodejs
    setup_postgresql
    setup_redis
    setup_python_environment
    install_project_dependencies
    build_frontend
    setup_database_schema
    configure_firewall
    create_startup_scripts
    create_systemd_services
    optimize_system
    
    # Verification and completion
    if verify_installation; then
        print_final_instructions
        log_success "Setup completed successfully! 🎉"
        exit 0
    else
        log_error "Setup completed with errors. Please check the output above."
        exit 1
    fi
}

# Error handling
trap 'log_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"