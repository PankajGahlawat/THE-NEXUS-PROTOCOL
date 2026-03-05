# 📘 NEXUS PROTOCOL - Complete User Guide

**Version:** 2.0.0  
**Last Updated:** February 23, 2026  
**All-in-One User Documentation**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Game Features](#game-features)
5. [Agent Roles](#agent-roles)
6. [Missions](#missions)
7. [Tools System](#tools-system)
8. [Scoring & Ranks](#scoring--ranks)
9. [Gameplay Guide](#gameplay-guide)
10. [LAN Setup](#lan-setup)

---

## 🎮 Project Overview

### What is NEXUS PROTOCOL?

NEXUS PROTOCOL is an immersive, multiplayer cyber-heist simulation game where teams take on roles of elite hackers and infiltrators to complete high-stakes digital missions.

### Key Features

**Gameplay:**
- 2 unique agent roles (Hacker, Infiltrator)
- 6 mission types with dynamic objectives
- 20+ specialized hacking tools
- Real-time trace detection system
- Scoring system (F-RANK to S-RANK)
- Time-limited missions

**Technical:**
- Browser-based SSH terminal to real VMs
- Real-time multiplayer via WebSocket
- Live scoring and leaderboard
- Admin dashboard for monitoring
- Mission replay system
- Persistent PostgreSQL database

**Security:**
- JWT authentication
- bcrypt password hashing
- CORS protection
- Rate limiting
- Security headers
- SSL/TLS support

### Technology Stack

**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + GSAP  
**Backend:** Node.js 18 + Express + Socket.IO + PostgreSQL  
**DevOps:** Docker + Docker Compose + Nginx

---

## 💻 Installation

### Prerequisites

**Required:**
- Node.js 18+ 
- Docker Desktop (for Docker deployment)
- 4GB RAM minimum
- Ports 3000, 3001, 5432 available

**For VM Integration:**
- VirtualBox 6.1+
- Linux VMs (Ubuntu/Debian/Kali)
- Network connectivity

### Quick Install (5 Minutes)

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd nexus-protocol
```

#### Step 2: Generate Credentials
```bash
# Linux/Mac
chmod +x scripts/setup-security.sh
./scripts/setup-security.sh

# Windows
scripts\setup-security.bat
```

#### Step 3: Deploy
```bash
docker-compose up -d
```

#### Step 4: Access
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health: http://localhost:3001/health

### Manual Installation

#### Backend Setup
```bash
cd backend
npm install
npm run migrate  # Initialize database
node simple-server.js
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Verification

```bash
# Check backend
curl http://localhost:3001/health

# Check frontend
curl http://localhost:3000

# Check services
docker-compose ps
```

---

## 🚀 Getting Started

### First Time Setup

1. **Access the Game**
   - Open browser: http://localhost:3000
   - See NEXUS PROTOCOL landing page

2. **Create/Join Team**
   - Click "ENTER NEXUS"
   - Enter team name and access code
   - Demo: Team `Ghost`, Code `1234`

3. **Select Agent**
   - Choose from 3 agent roles
   - Each has unique abilities

4. **Start Mission**
   - Review available missions
   - Select one to begin
   - Complete objectives for points

### Game Flow

```
Landing Page → Trailer (optional) → Login → Agent Select → 
Mission Briefing → Active Mission → Mission Complete → Leaderboard
```

---

## 🎮 Game Features

### Core Mechanics

**Trace System:**
- Actions generate trace
- High trace = detection risk
- Use stealth tools to reduce
- Burn state at 100% trace

**Tool Cooldowns:**
- Each tool has cooldown period
- Plan tool usage strategically
- High-power tools = longer cooldown

**Objectives:**
- Required objectives (must complete)
- Optional objectives (bonus points)
- Time-limited completion

**Scoring:**
- Base points per objective
- Time bonus (faster = more)
- Stealth bonus (low trace = more)
- Rank multipliers (S-RANK = 2x)

### Multiplayer Features

- Real-time team coordination
- Shared mission progress
- Live leaderboard updates
- Team chat (coming soon)
- Spectator mode (coming soon)

---

## 👥 Agent Roles

### 🔴 Hacker (Breach Architect)

**Specialization:** System infiltration and data extraction

**Stats:**
- Hacking: 95/100
- Stealth: 80/100
- Combat: 60/100
- Analysis: 85/100

**Abilities:**
- **Passive:** Ghost Protocol - Reduced trace generation
- **Ability 1:** Data Siphon - Extract data quickly
- **Ability 2:** System Override - Bypass security
- **Ultimate:** Zero Day - Massive system compromise

**Best For:**
- Direct system attacks
- Quick data extraction
- Breaking firewalls
- High-risk missions

**Recommended Tools:**
- Network Scanner
- Quantum Drill
- Privilege Escalator
- Breach Hammer

---

### 🟢 Infiltrator (Shadow Linguist)

**Specialization:** Stealth and social engineering

**Stats:**
- Hacking: 70/100
- Stealth: 95/100
- Combat: 75/100
- Analysis: 70/100

**Abilities:**
- **Passive:** Shadow Walk - Enhanced stealth
- **Ability 1:** Cloak - Temporary invisibility
- **Ability 2:** Distraction - Misdirect security
- **Ultimate:** Phase Shift - Complete stealth mode

**Best For:**
- Stealth missions
- Avoiding detection
- Social engineering
- Perfect run attempts

**Recommended Tools:**
- Ghost Protocol
- Silence Field
- Identity Forge
- Biometric Spoofer

---

## 🎯 Missions

### Mission Types

#### 1. FALSE FLAG OPERATION
**Difficulty:** MEDIUM | **Duration:** 30 min | **Trace:** 25%

Plant decoy telemetry to mislead corporate watch services.

**Strategy:** Use stealth, plant false data, clean traces, exit before threshold.

---

#### 2. BIOMETRIC BLUFF
**Difficulty:** HIGH | **Duration:** 28 min | **Trace:** 20%

Bypass biometric security through advanced social engineering.

**Strategy:** Gather biometric data, use Identity Forge, escalate privileges carefully.

---

#### 3. CORE EXTRACTION
**Difficulty:** MAXIMUM | **Duration:** 30 min | **Trace:** 15%

Extract the "soul key" from Project Chimera.

**Strategy:** High-risk approach, use Quantum Drill, neutralize countermeasures, have exit ready.

---

#### 4. SHADOW NETWORK
**Difficulty:** MEDIUM | **Duration:** 35 min | **Trace:** 30%

Map and infiltrate a hidden communication network.

**Strategy:** Reconnaissance first, map all nodes, intercept communications carefully.

---

#### 5. DATA FORTRESS
**Difficulty:** HIGH | **Duration:** 40 min | **Trace:** 40%

Assault a heavily fortified data center.

**Strategy:** Direct assault, use Breach Hammer, create diversions, speed over stealth.

---

#### 6. PHANTOM PROTOCOL
**Difficulty:** MAXIMUM | **Duration:** 25 min | **Trace:** 5%

Infiltrate without leaving any trace.

**Strategy:** Perfect stealth required, use Ghost Protocol, no mistakes allowed.

---

## 🛠️ Tools System

### Tool Categories

1. **Reconnaissance** - Information gathering (25-200 pts)
2. **Infiltration** - Gaining access (100-300 pts)
3. **Extraction** - Data retrieval (150-250 pts)
4. **Stealth** - Avoiding detection (50-200 pts)
5. **Disruption** - Creating chaos (100-300 pts)
6. **Analysis** - Understanding systems (50-150 pts)
7. **Assault** - Direct attacks (200-400 pts)
8. **Surveillance** - Monitoring (25-100 pts)
9. **Defense** - Protection (75-150 pts)
10. **Escape** - Emergency exit (100-200 pts)

### Key Tools

**Network Scanner** (Recon, 25 pts)
- Scan network for active hosts
- Low trace generation
- 30s cooldown

**Nmap** (Recon, 100 pts)
- Advanced port scanning
- Medium trace generation
- 60s cooldown

**Identity Forge** (Infiltration, 150 pts)
- Create fake credentials
- Medium trace
- 90s cooldown

**Quantum Drill** (Extraction, 300 pts)
- Extract encrypted data
- High trace
- 120s cooldown

**Ghost Protocol** (Stealth, 200 pts)
- Reduce trace by 50%
- No trace generation
- 180s cooldown

**Breach Hammer** (Assault, 400 pts)
- Massive system attack
- Very high trace
- 300s cooldown

### Using Tools

1. Select tool from inventory
2. Review cooldown and trace risk
3. Click "Use Tool"
4. Tool effect applies immediately
5. Wait for cooldown before reuse

### Tool Combinations

**Stealth Combo:**
Ghost Protocol → Silence Field → Invisible Hand

**Assault Combo:**
Breach Hammer → Grid Disruptor → Chaos Generator

**Infiltration Combo:**
Network Scanner → Identity Forge → Privilege Escalator

---

## 📊 Scoring & Ranks

### Scoring System

**Base Score:**
- Objective completion: 1000 pts each
- Mission completion: 5000 pts
- Tool efficiency bonus: Variable

**Bonuses:**
- Speed bonus: Time remaining × 10
- Stealth bonus: (100 - trace) × 20
- Perfect run: 2000 pts

**Penalties:**
- High trace: -10 pts per %
- Alarms triggered: -500 pts
- Failed objectives: -1000 pts

### Rank System

| Rank | Points | Multiplier | Color |
|------|--------|------------|-------|
| S-RANK | 10,000+ | 2.0x | Red |
| A-RANK | 7,500+ | 1.5x | Orange |
| B-RANK | 5,000+ | 1.2x | Yellow |
| C-RANK | 2,500+ | 1.0x | Green |
| D-RANK | 1,000+ | 0.8x | Cyan |
| E-RANK | 500+ | 0.6x | Blue |
| F-RANK | 0+ | 0.5x | Gray |

### Achievements

**Milestones:**
- First Blood (first points)
- 100, 500, 1000, 2500, 5000, 10000 Points

**Categories:**
- Reconnaissance Master (100+ recon pts)
- Exploit Expert (200+ exploit pts)
- Root Access (200+ privilege pts)
- Ghost Operative (perfect stealth)
- Speed Demon (under time)

---

## 🎮 Gameplay Guide

### Tips for Success

**General:**
1. Read mission briefings carefully
2. Start with easy missions
3. Manage trace constantly
4. Use right agent for mission
5. Plan tool loadout before starting

**Advanced:**
1. Tool sequencing matters
2. Balance speed vs stealth
3. Prioritize required objectives
4. Save time for extraction
5. Have backup plans

### Common Mistakes

❌ Ignoring trace level  
❌ Using wrong tools  
❌ Rushing without planning  
❌ Not using agent abilities  
❌ Forgetting cooldowns  

### Best Practices

✅ Monitor trace constantly  
✅ Use stealth tools regularly  
✅ Plan before executing  
✅ Leverage agent strengths  
✅ Manage cooldowns strategically  

---

## 🌐 LAN Setup

### Network Configuration

**For Local Network Play:**

1. **Find Host IP**
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

2. **Update CORS**
Edit `backend/.env`:
```env
CORS_ORIGIN=http://192.168.1.100:3000,http://192.168.1.101:3000
```

3. **Configure Firewall**
```bash
# Windows
netsh advfirewall firewall add rule name="Nexus" dir=in action=allow protocol=TCP localport=3000,3001

# Linux
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

4. **Access from Other Devices**
- Frontend: http://HOST_IP:3000
- Backend: http://HOST_IP:3001

### Multiplayer Setup

**Requirements:**
- All players on same network
- Host machine runs server
- Players connect to host IP

**Steps:**
1. Host starts server
2. Host shares IP address
3. Players navigate to http://HOST_IP:3000
4. Players create/join teams
5. Start playing together

---

## 🎯 Quick Reference

### Keyboard Shortcuts
- **ESC** - Pause/Menu
- **M** - Mute/Unmute
- **1-9** - Quick tool selection
- **SPACE** - Use selected tool
- **TAB** - Cycle tools

### URLs
- Landing: http://localhost:3000
- Terminal: http://localhost:3000/terminal
- Leaderboard: http://localhost:3000/leaderboard
- Admin: http://localhost:3000/admin

### Commands
```bash
# Start game
docker-compose up -d

# Stop game
docker-compose down

# View logs
docker-compose logs -f

# Check health
curl http://localhost:3001/health
```

---

## 🆘 Troubleshooting

### Can't Login
- Check team name spelling
- Verify access code
- Try demo: Ghost / 1234

### Mission Won't Start
- Refresh page
- Check backend connection
- Verify agent selected

### Tools Not Working
- Check cooldown status
- Verify tool requirements
- Ensure mission active

### Audio Not Playing
- Click anywhere to start
- Check mute status
- Verify browser permissions

---

## 📞 Support

**Documentation:**
- Technical: MASTER_TECHNICAL.md
- Features: MASTER_FEATURES.md
- Deployment: MASTER_DEPLOYMENT.md

**Quick Help:**
- Check logs: `docker-compose logs -f`
- Restart: `docker-compose restart`
- Health: `curl http://localhost:3001/health`

---

**Ready to play? Start your cyber-heist now!** 🚀

**Version:** 2.0.0  
**Last Updated:** February 23, 2026
