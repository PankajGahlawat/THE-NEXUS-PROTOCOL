#!/bin/bash

# NEXUS PROTOCOL - Production Startup Script
# Starts the production server with proper configuration
# Version: 1.0.0
# Last Updated: December 20, 2025

echo "🚀 Starting Nexus Protocol Production Server..."

# Check if systemd service exists
if systemctl list-unit-files | grep -q nexus-protocol.service; then
    echo "📡 Starting systemd service..."
    sudo systemctl start nexus-protocol
    
    # Wait for service to start
    sleep 3
    
    # Check status
    if sudo systemctl is-active --quiet nexus-protocol; then
        echo "✅ Nexus Protocol is running"
        echo ""
        echo "🌐 Access Points:"
        echo "   Frontend: http://localhost:5173"
        echo "   Backend:  http://localhost:3000"
        echo "   Health:   http://localhost:3000/health"
        echo ""
        echo "📊 Monitor: ./monitor-production.sh"
        echo "🛑 Stop:    sudo systemctl stop nexus-protocol"
    else
        echo "❌ Failed to start Nexus Protocol"
        sudo systemctl status nexus-protocol
        exit 1
    fi
else
    echo "⚠️  Systemd service not found. Starting manually..."
    echo ""
    
    # Start backend
    cd backend
    NODE_ENV=production node index_enhanced.js &
    BACKEND_PID=$!
    echo "📡 Backend started (PID: $BACKEND_PID)"
    
    # Start frontend (serve dist folder)
    cd ../frontend
    if command -v serve &> /dev/null; then
        serve -s dist -l 5173 &
        FRONTEND_PID=$!
        echo "🎮 Frontend started (PID: $FRONTEND_PID)"
    else
        echo "⚠️  'serve' not installed. Install with: npm install -g serve"
        echo "   Or build and deploy dist folder to nginx/apache"
    fi
    
    cd ..
    
    echo ""
    echo "✅ Nexus Protocol started manually"
    echo ""
    echo "🌐 Access Points:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:3000"
    echo "   Health:   http://localhost:3000/health"
    echo ""
    echo "🛑 Stop: ./stop-services.sh"
fi
