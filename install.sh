#!/bin/bash

# Nexus Protocol - Installation Script
# This script sets up the complete Nexus Protocol game environment

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                ║"
echo "║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                ║"
echo "║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                ║"
echo "║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                ║"
echo "║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                ║"
echo "║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                ║"
echo "║                                                               ║"
echo "║              NEXUS PROTOCOL INSTALLER                        ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Create environment file for backend
if [ ! -f .env ]; then
    echo "🔧 Creating backend environment configuration..."
    cp .env.example .env
    echo "✅ Backend .env file created"
fi

cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
if npm install; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Create startup scripts
echo ""
echo "🚀 Creating startup scripts..."

# Create start-backend script
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nexus Protocol Backend Server..."
cd backend
npm run dev
EOF

# Create start-frontend script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nexus Protocol Frontend..."
cd frontend
npm run dev
EOF

# Create start-all script
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nexus Protocol Complete System..."

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Nexus Protocol..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "📡 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "🎮 Starting frontend application..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Nexus Protocol is now running!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "📡 Backend:  http://localhost:3000"
echo ""
echo "Demo Credentials:"
echo "  Team Name: Ghost"
echo "  Access Code: 1234"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

# Make scripts executable
chmod +x start-backend.sh start-frontend.sh start-all.sh

echo "✅ Startup scripts created:"
echo "   • start-backend.sh  - Backend server only"
echo "   • start-frontend.sh - Frontend application only"
echo "   • start-all.sh      - Complete system"

echo ""
echo "🎯 Installation Complete!"
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    QUICK START GUIDE                          ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║  1. Start the complete system:                                ║"
echo "║     ./start-all.sh                                            ║"
echo "║                                                               ║"
echo "║  2. Or start services individually:                           ║"
echo "║     ./start-backend.sh   (in one terminal)                   ║"
echo "║     ./start-frontend.sh  (in another terminal)               ║"
echo "║                                                               ║"
echo "║  3. Access the game:                                          ║"
echo "║     Frontend: http://localhost:5173                           ║"
echo "║     Backend:  http://localhost:3000                           ║"
echo "║                                                               ║"
echo "║  4. Demo Credentials:                                         ║"
echo "║     Team Name: Ghost                                          ║"
echo "║     Access Code: 1234                                         ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🎮 Welcome to the Nexus Protocol. The system is ready."
echo ""