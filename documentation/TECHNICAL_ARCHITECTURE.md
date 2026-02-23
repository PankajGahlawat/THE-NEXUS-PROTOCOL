# NEXUS PROTOCOL - Technical Architecture Document

**Version:** 2.0  
**Last Updated:** February 19, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Design](#database-design)
7. [API Specification](#api-specification)
8. [Security Architecture](#security-architecture)
9. [Game Engine Design](#game-engine-design)
10. [Real-Time Communication](#real-time-communication)
11. [Audio System](#audio-system)
12. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

The Nexus Protocol is a multiplayer cyber-heist simulation game built with modern web technologies. The system features a Node.js backend with Express, a React/TypeScript frontend, real-time WebSocket communication, and a comprehensive game engine managing missions, tools, and player progression.

### Key Features
- Team-based multiplayer gameplay (up to 4 players)
- Three unique agent roles with specialized abilities
- Six mission types with dynamic objectives
- 20+ specialized hacking tools
- Real-time scoring and leaderboard system
- Admin dashboard for game monitoring
- Immersive cyberpunk UI with audio integration

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Browser    │  │   Browser    │      │
│  │  (Player 1)  │  │  (Player 2)  │  │   (Admin)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ HTTP/WS          │ HTTP/WS          │ HTTP/WS
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         ▼                  ▼                  ▼              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Application Server Layer                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │   Express  │  │  WebSocket │  │    Game    │     │   │
│  │  │   Router   │  │   Server   │  │   Engine   │     │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘     │   │
│  └────────┼───────────────┼───────────────┼────────────┘   │
│           │               │               │                 │
│           ▼               ▼               ▼                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Business Logic Layer                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │    Auth    │  │   Mission  │  │   Tools    │     │   │
│  │  │ Middleware │  │  Manager   │  │  Manager   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Access Layer                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │   SQLite   │  │PostgreSQL  │  │   Session  │     │   │
│  │  │  Database  │  │  Database  │  │   Store    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend Technologies
- **Runtime:** Node.js v18+
- **Framework:** Express.js v4.18+
- **WebSocket:** ws v8.13+
- **Database:** SQLite3 v5.1+ (Development), PostgreSQL v14+ (Production)
- **Authentication:** JWT (jsonwebtoken v9.0+)
- **Security:** bcryptjs v2.4+, helmet v7.0+, cors v2.8+
- **Logging:** winston v3.8+

### Frontend Technologies
- **Framework:** React v18.2+
- **Language:** TypeScript v5.0+
- **Build Tool:** Vite v4.3+
- **Routing:** React Router DOM v6.11+
- **Styling:** Tailwind CSS v3.3+
- **Animation:** GSAP v3.11+
- **HTTP Client:** Axios v1.4+

### Development Tools
- **Package Manager:** npm v9+
- **Version Control:** Git
- **Code Quality:** ESLint, Prettier
- **Testing:** Jest (Backend), Vitest (Frontend)

---

## Backend Architecture

### Directory Structure

```
backend/
├── game/
│   ├── GameEngine.js          # Core game logic
│   └── EnhancedGameEngine.js  # Extended features
├── middleware/
│   ├── auth.js                # JWT authentication
│   └── websocket.js           # WebSocket handling
├── models/
│   ├── database.js            # Database factory
│   ├── SQLiteDatabase.js      # SQLite implementation
│   └── PostgreSQLDatabase.js  # PostgreSQL implementation
├── routes/
│   ├── auth.js                # Authentication routes
│   └── admin.js               # Admin routes
├── scripts/
│   └── init-database.js       # Database initialization
├── simple-server.js           # Main server file
└── package.json               # Dependencies
```

### Core Components

#### 1. Express Server (`simple-server.js`)
```javascript
// Main server configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/game', gameRoutes);
```

#### 2. Game Engine (`game/GameEngine.js`)
```javascript
class GameEngine {
  constructor() {
    this.teams = new Map();
    this.missions = new Map();
    this.tools = this.initializeTools();
  }

  // Core game methods
  createTeam(teamData) { }
  startMission(teamId, missionId) { }
  useTool(teamId, toolId) { }
  updateScore(teamId, points) { }
  checkObjectives(teamId) { }
}
```

#### 3. Database Layer (`models/`)
```javascript
// Abstract database interface
class Database {
  async createTeam(teamData) { }
  async getTeam(teamId) { }
  async updateTeamScore(teamId, score) { }
  async logActivity(activityData) { }
}

// SQLite implementation
class SQLiteDatabase extends Database {
  constructor() {
    this.db = new sqlite3.Database('./nexus_protocol.db');
  }
}
```

---

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/
│   ├── Admin/
│   │   └── AdminDashboard.tsx
│   ├── Agent/
│   │   ├── AgentSelect.tsx
│   │   └── AgentSelect.css
│   ├── Auth/
│   │   └── LoginScreen.tsx
│   ├── Landing/
│   │   ├── LandingPage.tsx
│   │   └── LandingPage.css
│   ├── Mission/
│   │   ├── MissionBriefing.tsx
│   │   ├── MissionUI.tsx
│   │   ├── ToolsInterface.tsx
│   │   └── ToolsQuickReference.tsx
│   ├── Trailer/
│   │   └── TrailerSequence.tsx
│   └── UI/
│       ├── AudioControls.tsx
│       ├── BroadcastOverlay.tsx
│       ├── ErrorBoundary.tsx
│       ├── NexusButton.tsx
│       └── NexusCard.tsx
├── context/
│   ├── AudioContext.tsx
│   ├── GameContext.tsx
│   └── ThemeContext.tsx
├── hooks/
│   ├── useAccessibility.ts
│   ├── useAudio.ts
│   ├── usePerformance.ts
│   └── useTheme.ts
├── lib/
│   ├── animations.ts
│   ├── audioGenerator.ts
│   └── gsap.ts
├── styles/
│   ├── globals.css
│   ├── nexus-components.css
│   ├── nexus-themes.css
│   └── trailer-cinematic.css
├── App.tsx
└── main.tsx
```

### Component Architecture

#### 1. Application Router (`App.tsx`)
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/trailer" element={<TrailerSequence />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/agent-select" element={<AgentSelect />} />
        <Route path="/mission-briefing" element={<MissionBriefing />} />
        <Route path="/mission" element={<MissionUI />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### 2. Game Context (`context/GameContext.tsx`)
```typescript
interface GameState {
  team: Team | null;
  agent: Agent | null;
  mission: Mission | null;
  score: number;
  objectives: Objective[];
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialState);
  
  return (
    <GameContext.Provider value={gameState}>
      {children}
    </GameContext.Provider>
  );
}
```

#### 3. Audio System (`context/AudioContext.tsx`)
```typescript
interface AudioContextType {
  isPlaying: boolean;
  volume: number;
  toggleMusic: () => void;
  setVolume: (volume: number) => void;
  playSound: (soundType: SoundType) => void;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Audio management logic
  
  return (
    <AudioContext.Provider value={audioContextValue}>
      <audio ref={audioRef} src="/audio/gamevoice.mp3" loop />
      {children}
    </AudioContext.Provider>
  );
}
```

---

## Database Design

### Schema Overview

```sql
-- Teams table
CREATE TABLE teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_name TEXT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME,
  total_score INTEGER DEFAULT 0,
  completed_missions INTEGER DEFAULT 0,
  current_mission_id INTEGER
);

-- Players table
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  agent_role TEXT NOT NULL,
  player_name TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Missions table
CREATE TABLE missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  mission_type TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  score INTEGER DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  objectives_completed INTEGER DEFAULT 0,
  total_objectives INTEGER NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Activity logs table
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Sessions table
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

### Entity Relationships

```
teams (1) ──── (N) players
teams (1) ──── (N) missions
teams (1) ──── (N) activity_logs
teams (1) ──── (N) sessions
```

---

## API Specification

### Authentication Endpoints

#### POST `/api/v1/auth/login`
**Description:** Team login  
**Request Body:**
```json
{
  "teamName": "Ghost",
  "accessCode": "1234"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "team": {
    "id": 1,
    "teamName": "Ghost",
    "totalScore": 0
  }
}
```

#### POST `/api/v1/auth/register`
**Description:** Create new team  
**Request Body:**
```json
{
  "teamName": "Ghost",
  "accessCode": "1234"
}
```

### Game Endpoints

#### POST `/api/v1/game/agent/select`
**Description:** Select agent role  
**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "agentRole": "hacker"
}
```

#### POST `/api/v1/game/mission/start`
**Description:** Start a mission  
**Request Body:**
```json
{
  "missionId": 1
}
```

#### POST `/api/v1/game/tool/use`
**Description:** Use a tool  
**Request Body:**
```json
{
  "toolId": "port_scanner",
  "targetId": "server_01"
}
```

#### GET `/api/v1/game/leaderboard`
**Description:** Get top teams  
**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "teamName": "Ghost",
      "totalScore": 15000,
      "completedMissions": 3
    }
  ]
}
```

### Admin Endpoints

#### GET `/api/v1/admin/activity`
**Description:** Get recent activity  
**Headers:** `X-Admin-Code: NEXUS-MASTER-ADMIN-8821`  
**Response:**
```json
{
  "activities": [
    {
      "id": 1,
      "teamName": "Ghost",
      "actionType": "mission_completed",
      "timestamp": "2026-02-19T10:30:00Z"
    }
  ]
}
```

---

## Security Architecture

### Authentication Flow

```
1. Client sends credentials → Server
2. Server validates → Database
3. Server generates JWT token
4. Token sent to client
5. Client stores token (localStorage)
6. Client includes token in subsequent requests
7. Server validates token on each request
```

### Security Measures

1. **JWT Authentication**
   - Tokens expire after 24 hours
   - Secure token generation with HS256 algorithm
   - Token validation middleware on protected routes

2. **Password Security**
   - Access codes hashed with bcrypt (10 rounds)
   - No plain text storage

3. **HTTP Security Headers**
   - Helmet.js for security headers
   - CORS configuration for allowed origins
   - Content Security Policy

4. **Input Validation**
   - Request body validation
   - SQL injection prevention
   - XSS protection

5. **Rate Limiting**
   - API rate limiting per IP
   - WebSocket connection limits

---

## Game Engine Design

### Core Game Loop

```javascript
class GameEngine {
  update(deltaTime) {
    this.updateMissions(deltaTime);
    this.updateCooldowns(deltaTime);
    this.checkObjectives();
    this.updateScores();
    this.broadcastState();
  }
  
  updateMissions(deltaTime) {
    for (const [teamId, mission] of this.missions) {
      mission.timeElapsed += deltaTime;
      mission.traceLevel += mission.traceRate * deltaTime;
      
      if (mission.traceLevel >= 100) {
        this.failMission(teamId, 'detected');
      }
    }
  }
}
```

### Agent Abilities

```typescript
interface AgentAbility {
  id: string;
  name: string;
  cooldown: number;
  effect: (context: GameContext) => void;
}

const AGENT_ABILITIES = {
  hacker: {
    id: 'breach_protocol',
    name: 'Breach Protocol',
    cooldown: 60,
    effect: (ctx) => ctx.reduceFirewall(50)
  },
  infiltrator: {
    id: 'ghost_mode',
    name: 'Ghost Mode',
    cooldown: 90,
    effect: (ctx) => ctx.reduceTrace(30)
  },
  analyst: {
    id: 'signal_boost',
    name: 'Signal Boost',
    cooldown: 45,
    effect: (ctx) => ctx.revealObjectives()
  }
};
```

### Scoring System

```javascript
const SCORING = {
  objective_completed: 1000,
  mission_completed: 5000,
  speed_bonus: (timeRemaining) => timeRemaining * 10,
  stealth_bonus: (traceLevel) => (100 - traceLevel) * 20,
  rank_multipliers: {
    'S-RANK': 2.0,
    'A-RANK': 1.5,
    'B-RANK': 1.2,
    'C-RANK': 1.0,
    'D-RANK': 0.8,
    'F-RANK': 0.5
  }
};
```

---

## Real-Time Communication

### WebSocket Protocol

```javascript
// Server-side WebSocket handling
wss.on('connection', (ws, req) => {
  const teamId = authenticateWebSocket(req);
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    handleGameAction(teamId, message);
  });
  
  ws.on('close', () => {
    handleDisconnect(teamId);
  });
});

// Client-side WebSocket
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  updateGameState(update);
};
```

### Message Types

```typescript
type GameMessage =
  | { type: 'tool_use'; toolId: string; targetId: string }
  | { type: 'objective_complete'; objectiveId: number }
  | { type: 'ability_activate'; abilityId: string }
  | { type: 'state_update'; gameState: GameState };
```

---

## Audio System

### Audio Architecture

```typescript
class AudioManager {
  private bgMusic: HTMLAudioElement;
  private audioContext: AudioContext;
  
  playBackgroundMusic() {
    this.bgMusic.play();
  }
  
  playSound(type: SoundType) {
    const oscillator = this.audioContext.createOscillator();
    // Generate sound effect
  }
  
  setVolume(volume: number) {
    this.bgMusic.volume = volume;
  }
}
```

### Sound Effects

- **Click:** 800Hz, 50ms
- **Hover:** 600Hz, 30ms
- **Success:** 1000Hz → 1200Hz, 200ms
- **Error:** 400Hz → 200Hz, 300ms
- **Notification:** 900Hz, 100ms

---

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────┐
│          Load Balancer (Nginx)          │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
┌─────▼─────┐ ┌────▼──────┐
│  Node.js  │ │  Node.js  │
│ Instance1 │ │ Instance2 │
└─────┬─────┘ └────┬──────┘
      │            │
      └──────┬─────┘
             │
      ┌──────▼──────┐
      │ PostgreSQL  │
      │  Database   │
      └─────────────┘
```

### Environment Variables

```bash
# Backend (.env)
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/nexus
JWT_SECRET=your-secret-key
ADMIN_CODE=NEXUS-MASTER-ADMIN-8821

# Frontend (.env.local)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Build Commands

```bash
# Backend
cd backend
npm install
npm run start

# Frontend
cd frontend
npm install
npm run build
npm run preview
```

---

## Performance Optimization

### Backend Optimizations
- Connection pooling for database
- Response caching for leaderboard
- WebSocket message batching
- Gzip compression for API responses

### Frontend Optimizations
- Code splitting with React.lazy()
- Image optimization (WebP format)
- CSS minification
- Tree shaking with Vite
- Service Worker for offline support

---

## Monitoring & Logging

### Logging Strategy

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Metrics to Track
- Active players count
- Mission completion rate
- Average mission duration
- API response times
- WebSocket connection stability
- Database query performance

---

## Future Enhancements

1. **Scalability**
   - Redis for session management
   - Message queue for async tasks
   - Microservices architecture

2. **Features**
   - Voice chat integration
   - Replay system
   - Tournament mode
   - Custom mission editor

3. **Performance**
   - CDN for static assets
   - Database read replicas
   - GraphQL API option

---

## Conclusion

The Nexus Protocol represents a modern, scalable architecture for multiplayer web-based gaming. The system is designed for extensibility, maintainability, and performance, with clear separation of concerns and robust security measures.

**Repository:** https://github.com/PankajGahlawat/THE-NEXUS-PROTOCOL.git  
**Documentation:** `/documentation/`  
**License:** MIT
