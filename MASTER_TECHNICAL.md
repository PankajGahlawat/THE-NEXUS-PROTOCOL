# 🔧 NEXUS PROTOCOL - Complete Technical Documentation

**Version:** 2.0.0  
**Last Updated:** February 23, 2026  
**All-in-One Technical Reference**

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [API Reference](#api-reference)
4. [Database Design](#database-design)
5. [Security Architecture](#security-architecture)
6. [Operator Guide](#operator-guide)
7. [Performance](#performance)
8. [Monitoring](#monitoring)

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────┐
│  React Frontend │ ← User Interface (Port 3000)
│  (Vite + TS)    │
└────────┬────────┘
         │ HTTP/REST + WebSocket
         ▼
┌─────────────────┐
│  Node.js Backend│ ← Game Logic & API (Port 3001)
│  (Express)      │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│ PostgreSQL DB   │ ← Data Persistence (Port 5432)
└─────────────────┘
```

### Component Architecture

**Frontend Layer:**
- React 19 + TypeScript
- Vite build tool
- Tailwind CSS styling
- GSAP animations
- Socket.IO client
- Xterm.js terminal

**Backend Layer:**
- Express.js REST API
- Socket.IO WebSocket server
- SSH2 proxy for VM connections
- JWT authentication
- bcrypt password hashing
- Winston logging

**Data Layer:**
- PostgreSQL 15 database
- Connection pooling
- Prepared statements
- Migration system

**Infrastructure:**
- Docker containers
- Nginx reverse proxy
- SSL/TLS termination
- Health checks

---

## 💻 Technology Stack

### Frontend
```json
{
  "react": "19.2.0",
  "typescript": "5.9.3",
  "vite": "5.4.0",
  "tailwindcss": "3.4.17",
  "gsap": "3.14.1",
  "socket.io-client": "4.7.2",
  "xterm": "5.3.0"
}
```

### Backend
```json
{
  "node": ">=18.0.0",
  "express": "4.18.2",
  "socket.io": "4.7.2",
  "pg": "8.11.3",
  "jsonwebtoken": "9.0.2",
  "bcryptjs": "2.4.3",
  "ssh2": "1.15.0",
  "helmet": "7.1.0",
  "winston": "3.11.0"
}
```

### DevOps
- Docker 24+
- Docker Compose 2.20+
- Nginx 1.24+
- PostgreSQL 15+

---

## 📡 API Reference

### Base URLs
- REST API: `http://localhost:3001/api`
- WebSocket: `ws://localhost:3001`
- Health: `http://localhost:3001/health`

### Authentication

#### POST /api/auth/login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"password123"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": "user-123",
    "username": "player1",
    "team": "red"
  }
}
```

### Game Endpoints

#### GET /api/leaderboard
```bash
curl http://localhost:3001/api/leaderboard?limit=10
```

#### GET /api/score/:userId
```bash
curl http://localhost:3001/api/score/user-123
```

#### POST /api/mission/start
```bash
curl -X POST http://localhost:3001/api/mission/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"missionId":"mission-1","duration":3600}'
```

### Admin Endpoints

#### GET /api/admin/players
```bash
curl http://localhost:3001/api/admin/players \
  -H "Authorization: Bearer <admin-token>"
```

#### POST /api/admin/award-points
```bash
curl -X POST http://localhost:3001/api/admin/award-points \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","points":100,"reason":"Good work"}'
```

### WebSocket Protocol

**Connect:**
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'jwt-token' }
});
```

**Events:**
- `scoring-event` - Points awarded
- `leaderboard-update` - Leaderboard changed
- `mission-update` - Mission status changed
- `terminal-output` - Terminal data
- `achievement-unlocked` - Achievement earned

---

## 🗄️ Database Design

### Schema

```sql
-- Teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(255) UNIQUE NOT NULL,
  access_code VARCHAR(255) NOT NULL,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  agent_role VARCHAR(50),
  username VARCHAR(255),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Missions
CREATE TABLE missions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  mission_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  score INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Terminal Logs
CREATE TABLE terminal_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_id VARCHAR(255),
  command TEXT,
  output TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scoring Events
CREATE TABLE scoring_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  event_type VARCHAR(100),
  points INTEGER,
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_teams_name ON teams(team_name);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_missions_team ON missions(team_id);
CREATE INDEX idx_terminal_session ON terminal_logs(session_id);
CREATE INDEX idx_scoring_user ON scoring_events(user_id);
CREATE INDEX idx_scoring_timestamp ON scoring_events(timestamp);
```

---

## 🔒 Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Server validates against database
3. Server generates JWT token (24h expiry)
4. Client stores token (localStorage)
5. Client includes token in requests
6. Server validates token on each request
```

### Security Measures

**Authentication:**
- JWT with HS256 algorithm
- 24-hour token expiration
- bcrypt password hashing (10 rounds)
- Session validation on each request

**Network Security:**
- Explicit CORS allowlist
- Rate limiting (100 req/15min)
- Request size limits (1MB)
- Security headers (HSTS, CSP, X-Frame-Options)

**Container Security:**
- No privileged containers
- Specific capabilities only
- Network isolation
- Volume persistence

**Database Security:**
- Prepared statements
- Connection pooling
- Strong passwords
- Encrypted connections

### Security Headers

```javascript
{
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'self'",
  "X-XSS-Protection": "1; mode=block"
}
```

---

## 👨‍💼 Operator Guide

### Starting Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Health Monitoring

```bash
# Backend health
curl http://localhost:3001/health

# Database health
docker-compose exec postgres pg_isready -U nexus

# Check all services
docker-compose ps
```

### Managing Rounds

**Start Round:**
```bash
curl -X POST http://localhost:3001/api/rounds \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"duration":3600,"redTeam":"team-1","blueTeam":"team-2"}'
```

**End Round:**
```bash
curl -X POST http://localhost:3001/api/rounds/<roundId>/end \
  -H "Authorization: Bearer <admin-token>"
```

### Emergency Procedures

**Kill Switch:**
```bash
curl -X POST http://localhost:3001/api/emergency/kill-switch \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Emergency maintenance","operator":"admin"}'
```

**Restart Services:**
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Database Maintenance

**Backup:**
```bash
docker-compose exec postgres pg_dump -U nexus nexus_protocol > backup_$(date +%Y%m%d).sql
```

**Restore:**
```bash
cat backup_20260223.sql | docker-compose exec -T postgres psql -U nexus nexus_protocol
```

**Vacuum:**
```bash
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "VACUUM ANALYZE;"
```

---

## ⚡ Performance

### Metrics

**Response Times:**
- API endpoints: <100ms
- WebSocket latency: <50ms
- Terminal streaming: Real-time
- Database queries: <10ms

**Throughput:**
- Concurrent users: 100+
- Requests per second: 1000+
- WebSocket connections: 500+

### Optimization

**Backend:**
- Connection pooling (max 20)
- Response caching
- WebSocket message batching
- Gzip compression

**Frontend:**
- Code splitting
- Lazy loading
- Image optimization
- Service worker caching

**Database:**
- Indexed queries
- Connection pooling
- Query optimization
- Regular vacuuming

---

## 📊 Monitoring

### Logging

**Locations:**
- Backend: `backend/logs/combined.log`
- Error: `backend/logs/error.log`
- Audit: `backend/logs/audit.log`
- Container: `docker-compose logs`

**Log Levels:**
- ERROR: Critical issues
- WARN: Warnings
- INFO: General information
- DEBUG: Detailed debugging

**View Logs:**
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since="2026-02-23T10:00:00" backend
```

### Metrics

**System Metrics:**
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Resource usage
docker-compose top
```

**Application Metrics:**
```bash
# Active connections
curl http://localhost:3001/api/stats/connections

# Scoring statistics
curl http://localhost:3001/api/statistics

# Leaderboard
curl http://localhost:3001/api/leaderboard
```

### Alerts

**Critical Events:**
- Database connection failures
- VM failures
- Emergency kill switch activation
- High error rates
- Memory/CPU spikes

**Monitoring Commands:**
```bash
# Check for errors
docker-compose logs backend | grep -i error

# Monitor connections
watch -n 5 'curl -s http://localhost:3001/api/stats/connections'

# Check health
watch -n 10 'curl -s http://localhost:3001/health'
```

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
# Required
JWT_SECRET=<64-byte-hex>
POSTGRES_PASSWORD=<32-byte-hex>

# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://nexus:password@postgres:5432/nexus_protocol

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=100
MAX_REQUEST_SIZE=1mb

# Features
ENABLE_ADMIN=true
ENABLE_REPLAY=true
```

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_SSH_PROXY_URL=http://localhost:3002
VITE_ENV=production
```

---

## 🐛 Troubleshooting

### Common Issues

**Backend Won't Start:**
```bash
# Check logs
docker-compose logs backend

# Verify database
docker-compose ps postgres

# Check environment
cat .env | grep JWT_SECRET
```

**Database Connection Failed:**
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready

# Test connection
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "SELECT 1;"

# Restart database
docker-compose restart postgres
```

**WebSocket Not Connecting:**
```bash
# Check backend logs
docker-compose logs backend | grep -i websocket

# Test WebSocket
wscat -c ws://localhost:3001

# Verify CORS
curl -H "Origin: http://localhost:3000" -I http://localhost:3001/health
```

---

## 📞 Support

**Documentation:**
- User Guide: MASTER_GUIDE.md
- Features: MASTER_FEATURES.md
- Deployment: MASTER_DEPLOYMENT.md

**Commands:**
```bash
# Health check
curl http://localhost:3001/health

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Emergency stop
docker-compose down
```

---

**Complete technical reference for NEXUS PROTOCOL!** 🔧

**Version:** 2.0.0  
**Last Updated:** February 23, 2026
