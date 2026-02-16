#!/bin/bash

# NEXUS PROTOCOL - Service Stop Script
# Gracefully stops all Nexus Protocol services
# Version: 1.0.0
# Last Updated: December 20, 2025

echo "🛑 Stopping Nexus Protocol Services..."
echo "====================================="

# Stop PM2 processes if available
if command -v pm2 &> /dev/null; then
    echo "📡 Stopping PM2 processes..."
    pm2 stop nexus-backend || true
    pm2 delete nexus-backend || true
    echo "✅ PM2 processes stopped"
fi

# Stop processes by PID files
if [ -f "nexus-backend.pid" ]; then
    echo "📡 Stopping backend service..."
    kill $(cat nexus-backend.pid) || true
    rm -f nexus-backend.pid
    echo "✅ Backend service stopped"
fi

if [ -f "nexus-frontend.pid" ]; then
    echo "🎮 Stopping frontend service..."
    kill $(cat nexus-frontend.pid) || true
    rm -f nexus-frontend.pid
    echo "✅ Frontend service stopped"
fi

# Kill any remaining processes
echo "🧹 Cleaning up remaining processes..."
pkill -f "nexus" || true
pkill -f "node.*index" || true
pkill -f "serve.*dist" || true

# Stop systemd service if exists
if systemctl is-active --quiet nexus-protocol 2>/dev/null; then
    echo "🔧 Stopping systemd service..."
    sudo systemctl stop nexus-protocol
    echo "✅ Systemd service stopped"
fi

echo ""
echo "✅ All Nexus Protocol services have been stopped"
echo "🔍 To verify, check: ps aux | grep nexus"