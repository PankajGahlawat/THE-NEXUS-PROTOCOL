# 🎮 NEXUS PROTOCOL - Complete Features Documentation

**Version:** 2.0.0  
**Last Updated:** February 23, 2026  
**All Features & Implementations**

---

## 📋 Table of Contents

1. [SSH Terminal System](#ssh-terminal-system)
2. [Scoring Engine](#scoring-engine)
3. [Admin Dashboard](#admin-dashboard)
4. [Admin Monitoring](#admin-monitoring)
5. [Mission Lifecycle](#mission-lifecycle)
6. [Testing Guide](#testing-guide)

---

## 🖥️ SSH Terminal System

### Overview
Browser-based SSH terminal connecting directly to VMs for real-time command execution.

### Architecture
```
Browser (Xterm.js) ←→ WebSocket ←→ SSH Proxy (ssh2) ←→ VM
```

### Features
- ✅ Full terminal emulation (Xterm.js)
- ✅ Real-time bidirectional I/O
- ✅ Session management
- ✅ Auto-reconnection
- ✅ Terminal resize support

### Usage

**Access:** http://localhost:5173/terminal

**Connect to VM:**
1. Enter VM IP (e.g., 192.168.1.100)
2. Port: 22
3. Username: root
4. Password: [your-password]
5. Click "Connect"

**Test:**
```bash
whoami
ls -la /
```

### Implementation

**Backend:** `backend/ssh-proxy.js`
```javascript
const ssh2 = require('ssh2');
const io = require('socket.io');

io.on('connection', (socket) => {
  socket.on('ssh-connect', (config) => {
    const conn = new ssh2.Client();
    conn.on('ready', () => {
      conn.shell((err, stream) => {
        stream.on('data', (data) => {
          socket.emit('terminal-output', data.toString());
        });
        socket.on('terminal-input', (data) => {
          stream.write(data);
        });
      });
    });
    conn.connect(config);
  });
});
```

**Frontend:** `frontend/src/components/Terminal/SSHTerminal.tsx`
```typescript
import { Terminal } from 'xterm';
import { io } from 'socket.io-client';

const terminal = new Terminal();
const socket = io('http://localhost:3002');

socket.on('terminal-output', (data) => {
  terminal.write(data);
});

terminal.onData((data) => {
  socket.emit('terminal-input', data);
});
```

---

## 📊 Scoring Engine

### Overview
Real-time scoring system awarding points for commands and system events.

### Components

**1. Terminal Scanner**
- 60+ regex patterns
- 9 categories
- 30s cooldown (anti-spam)

**2. VM Log Parser**
- Polls logs every 5s
- Monitors: auth.log, syslog
- Incremental reading

**3. Scoring Engine**
- Point calculation
- Rank system (F to S)
- Achievement tracking

### Scoring Categories

| Category | Points | Examples |
|----------|--------|----------|
| Reconnaissance | 25-200 | nmap, netstat, ifconfig |
| Exploitation | 150-300 | metasploit, sqlmap |
| Privilege Escalation | 75-300 | sudo, /etc/shadow |
| Persistence | 100-200 | cron, ssh keys |
| Defense Evasion | 100-200 | log deletion |
| Lateral Movement | 100-250 | ssh, reverse shells |
| Exfiltration | 200-250 | data transfer |
| Blue Team Defense | 75-150 | firewall, fail2ban |
| Blue Team Monitoring | 25-150 | logs, processes |
| Blue Team Forensics | 25-100 | file analysis |

### Rank System

| Rank | Points | Multiplier |
|------|--------|------------|
| S-RANK | 10,000+ | 2.0x |
| A-RANK | 7,500+ | 1.5x |
| B-RANK | 5,000+ | 1.2x |
| C-RANK | 2,500+ | 1.0x |
| D-RANK | 1,000+ | 0.8x |
| E-RANK | 500+ | 0.6x |
| F-RANK | 0+ | 0.5x |

### API

```bash
# Get leaderboard
GET /api/leaderboard?limit=10

# Get user score
GET /api/score/:userId

# Get patterns
GET /api/patterns

# Get statistics
GET /api/statistics
```

### Implementation

**Pattern Matching:**
```javascript
const patterns = [
  { regex: /nmap\s+.*-s[STAU]/i, points: 100, category: 'reconnaissance' },
  { regex: /sudo\s+su|sudo\s+bash/i, points: 300, category: 'privilege_escalation' },
  { regex: /metasploit|msfconsole/i, points: 300, category: 'exploitation' }
];

function scoreCommand(command) {
  for (const pattern of patterns) {
    if (pattern.regex.test(command)) {
      if (!isOnCooldown(pattern)) {
        awardPoints(pattern.points, pattern.category);
        setCooldown(pattern, 30000); // 30s
      }
    }
  }
}
```

---

## 👨‍💼 Admin Dashboard

### Overview
Complete admin control for managing players, VMs, and game state.

### Features

**1. Player Management**
- Active player list
- Real-time updates
- Connection status
- Player statistics

**2. Terminal Mirroring**
- Live output from players
- Read-only view
- Switch between players

**3. Point Awarding**
- Custom amounts
- Reason field
- Instant delivery

**4. Hint System**
- Send messages to players
- Real-time delivery
- Player notifications

**5. VM Control**
- Reset to snapshot
- Automatic restart
- VBoxManage integration

**6. Player Kick**
- Instant disconnect
- Reason field
- Socket termination

**7. Broadcast**
- Message all players
- Message types (info/warning/error)
- Real-time delivery

**8. War Feed**
- Real-time event stream
- Last 100 events
- Event icons & timestamps

### Access
**URL:** http://localhost:5173/admin/dashboard

### API

```bash
# Get players
GET /api/admin/players

# Award points
POST /api/admin/award-points
Body: {"userId":"user-123","points":100,"reason":"Good work"}

# Send hint
POST /api/admin/send-hint
Body: {"userId":"user-123","hint":"Try nmap"}

# Kick player
POST /api/admin/kick-player
Body: {"userId":"user-123","reason":"Violation"}

# Reset VM
POST /api/admin/reset-vm
Body: {"userId":"user-123"}

# Broadcast
POST /api/admin/broadcast
Body: {"message":"Server restart in 5 min","type":"warning"}

# War feed
GET /api/admin/war-feed?limit=50
```

### VM Controller

**VBoxManage Integration:**
```javascript
const { exec } = require('child_process');

class VMController {
  async restoreSnapshot(vmName, snapshotName) {
    await exec(`VBoxManage snapshot "${vmName}" restore "${snapshotName}"`);
    await exec(`VBoxManage startvm "${vmName}" --type headless`);
  }
  
  async listVMs() {
    const result = await exec('VBoxManage list vms');
    return result.stdout;
  }
}
```

---

## 🔍 Admin Monitoring

### Overview
Real-time terminal monitoring allowing admins to watch player sessions live.

### Features

**1. Session Tracking**
- Active sessions list
- Real-time updates
- Connection status

**2. Terminal Mirroring**
- Live output streaming
- Read-only view
- Command indicators

**3. Command Logging**
- Every command logged
- Session correlation
- User tracking

**4. Event Broadcasting**
- All events to admins
- Multiple admin support
- Room-based monitoring

### Access
**URL:** http://localhost:5173/admin/terminal-monitor

### Events

- `session-started` - Player connects
- `session-ended` - Player disconnects
- `terminal-output` - Live output
- `command-executed` - Command detected
- `command-log` - Command logged

### Database Schema

```sql
CREATE TABLE terminal_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_id VARCHAR(255),
  command TEXT,
  output TEXT,
  vm_host VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE terminal_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE,
  user_id VARCHAR(255),
  username VARCHAR(255),
  vm_host VARCHAR(255),
  connected_at TIMESTAMP,
  disconnected_at TIMESTAMP,
  status VARCHAR(50)
);
```

---

## ⏱️ Mission Lifecycle

### Overview
Complete mission management from start to end with VM restoration, timer, terminal locking, and reporting.

### Flow
```
Start → VM Restore → Initialize → Timer → Active → End → Lock → Report → Replay
```

### Features

**1. Mission Start**
- Unique mission ID
- VM snapshot restore
- Wait for VM ready (60s timeout)
- Initialize services
- Start countdown timer
- Begin recording

**2. Active Mission**
- Timer countdown (every second)
- Broadcast updates (every 10s)
- Warnings (5min, 1min)
- Record terminal output
- Record commands
- Record scoring events
- Track objectives

**3. Mission End**
- Stop timer
- Lock terminals
- Stop recording
- Generate report
- Broadcast results
- Save replay

**4. Mission Report**
```json
{
  "missionId": "mission-123",
  "startTime": "2026-02-23T10:00:00Z",
  "endTime": "2026-02-23T10:45:30Z",
  "duration": {"minutes": 45, "seconds": 30},
  "totalObjectives": 3,
  "completedObjectives": 3,
  "totalPoints": 1250,
  "rank": "B-RANK",
  "success": true,
  "grade": "A"
}
```

**5. Replay System**
- Record all events
- Playback with speed control (1x, 2x, 4x)
- Pause/resume/seek
- Export to JSON

### API

```bash
# Start mission
POST /api/mission/start
Body: {"name":"Mission 1","duration":3600,"objectives":[...]}

# End mission
POST /api/mission/:id/end

# Complete objective
POST /api/mission/:id/objective/:objId/complete

# Get report
GET /api/mission/:id/report

# Start replay
POST /api/replay/:missionId/start
Body: {"speed":2}

# Control replay
POST /api/replay/:replayId/pause
POST /api/replay/:replayId/resume
POST /api/replay/:replayId/seek
Body: {"time":30000}
```

### Real-Time Events

- `mission-update` - Status every 10s
- `mission-warning` - Warnings at 5min, 1min
- `mission-ended` - Completion
- `terminal-locked` - Input disabled
- `replay-event` - Playback events

---

## 🧪 Testing Guide

### Quick Tests (5 Minutes Each)

#### SSH Terminal Test

**Setup:**
1. Open http://localhost:5173/terminal
2. Enter VM credentials
3. Click "Connect"

**Test:**
```bash
whoami
ls -la /
uname -a
```

**Success:** See command output in terminal

---

#### Scoring Engine Test

**Setup:**
1. Window 1: http://localhost:5173/leaderboard
2. Window 2: http://localhost:5173/terminal

**Test:**
```bash
# Window 2
ifconfig          # +25 pts
nmap -sS localhost # +100 pts
sudo -l           # +100 pts
```

**Success:** Window 1 shows score increasing, rank updating

---

#### Admin Monitoring Test

**Setup:**
1. Window 1: http://localhost:5173/admin/terminal-monitor
2. Window 2: http://localhost:5173/terminal

**Test:**
1. Connect in Window 2
2. See session in Window 1
3. Click session to monitor
4. Execute commands in Window 2
5. See output in Window 1

**Success:** Admin sees live terminal output

---

#### Admin Dashboard Test

**Setup:**
1. Window 1: http://localhost:5173/admin/dashboard
2. Window 2: http://localhost:5173/terminal

**Test:**
1. Connect in Window 2
2. See player in Window 1
3. Award 100 points
4. Send hint
5. Check war feed

**Success:** Player receives points and hint instantly

---

### Integration Tests

**Full System Test:**
1. Player connects to terminal
2. Executes commands
3. Earns points (scoring)
4. Admin monitors (monitoring)
5. Admin awards bonus (dashboard)
6. Leaderboard updates
7. Mission completes
8. Report generated

---

## 📊 Performance

### Metrics
- Command scoring: <10ms
- Terminal streaming: <50ms
- Log polling: 5s interval
- Leaderboard broadcast: 2s interval
- Admin monitoring: Real-time
- Mission updates: 10s interval

### Optimization
- Connection pooling
- Efficient pattern matching
- Incremental log reading
- WebSocket compression
- Session caching

---

## 🎯 Quick Reference

### Ports
- Frontend: 5173 (dev) / 3000 (prod)
- Backend: 3001
- SSH Proxy: 3002
- PostgreSQL: 5432

### URLs
- Terminal: http://localhost:5173/terminal
- Leaderboard: http://localhost:5173/leaderboard
- Admin Dashboard: http://localhost:5173/admin/dashboard
- Admin Monitor: http://localhost:5173/admin/terminal-monitor

### Commands
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost:3001/health

# Test scoring
curl http://localhost:3002/api/leaderboard

# Test admin
curl http://localhost:3002/api/admin/players
```

---

**All features documented and ready to use!** 🚀

**Version:** 2.0.0  
**Last Updated:** February 23, 2026
