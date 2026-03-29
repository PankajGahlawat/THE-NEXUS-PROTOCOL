#!/bin/bash

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

banner() {
  echo -e "${BLUE}"
  echo "  ╦  ╦╦╔╦╗╦ ╦╔═╗╔╦╗╔═╗╔═╗╦ ╦  ╦ ╦╔╗╔╦╦  ╦╔═╗╦═╗╔═╗╦╔╦╗╦ ╦"
  echo "  ╚╗╔╝║ ║║╚╦╝╠═╣ ║ ║╣ ║  ╠═╣  ║ ║║║║║╚╗╔╝║╣ ╠╦╝╚═╗║ ║ ╚╦╝"
  echo "   ╚╝ ╩═╩╝ ╩ ╩ ╩ ╩ ╚═╝╚═╝╩ ╩  ╚═╝╝╚╝╩ ╚╝ ╚═╝╩╚═╚═╝╩ ╩  ╩ "
  echo -e "${NC}"
  echo -e "  ${YELLOW}Red Team vs Blue Team — University Portal${NC}"
  echo "  ─────────────────────────────────────────────"
  echo ""
}

case "$1" in
  start)
    banner
    echo -e "${GREEN}[+] Starting Vidyatech Platform...${NC}"
    docker-compose up -d
    echo ""
    echo -e "${GREEN}[✓] Live!${NC}"
    echo -e "  ${YELLOW}Target Site:${NC}       http://localhost:5000"
    echo -e "  ${BLUE}Blue Team Monitor:${NC} http://localhost:8080"
    echo -e "  ${RED}Instructor Hints:${NC}  http://localhost:5000/instructor/hints"
    echo -e "  ${RED}Hints PIN:${NC}         VT@2024"
    ;;
  reset)
    echo -e "${YELLOW}[!] Resetting all data...${NC}"
    docker-compose down -v && docker-compose up -d
    echo -e "${GREEN}[✓] Fresh instance running.${NC}"
    ;;
  stop)
    docker-compose down
    echo -e "${GREEN}[✓] Stopped.${NC}"
    ;;
  run)
    banner
    echo -e "${GREEN}[+] Running without Docker...${NC}"
    pip install -q flask werkzeug
    python app.py &
    python monitor/server.py &
    echo -e "${GREEN}[✓] Running! Target: http://localhost:5000${NC}"
    ;;
  logs)
    docker logs -f vidyatech-target
    ;;
  *)
    banner
    echo "Usage: ./start.sh <command>"
    echo ""
    echo "  start   — Start via Docker Compose"
    echo "  reset   — Wipe DB + uploads, restart fresh"
    echo "  stop    — Stop all containers"
    echo "  run     — Run directly with Python (no Docker)"
    echo "  logs    — Tail application logs"
    ;;
esac
