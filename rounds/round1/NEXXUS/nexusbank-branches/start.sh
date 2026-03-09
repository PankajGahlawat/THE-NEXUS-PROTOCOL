#!/bin/bash
echo ""
echo "================================================"
echo "  🏦 NexusBank CTF — Starting All 6 Servers"
echo "================================================"

# Backend servers
echo "🔵 Starting backends..."
cd branch-a/backend && node server.js &
cd ../../branch-b/backend && node server.js &
cd ../../branch-c/backend && node server.js &
cd ../..

sleep 2

# Frontend dev servers
echo "🟢 Starting frontends..."
cd branch-a/frontend && npm run dev &
cd ../../branch-b/frontend && npm run dev &
cd ../../branch-c/frontend && npm run dev &
cd ../..

sleep 3

echo ""
echo "================================================"
echo "  ✅ ALL SERVERS RUNNING!"
echo "================================================"
echo ""
echo "  🏦 Branch A (Andheri) → http://localhost:5173"
echo "  🏦 Branch B (Bandra)  → http://localhost:5174"
echo "  🏦 Branch C (Colaba)  → http://localhost:5175"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "================================================"
echo ""

wait
