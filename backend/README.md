# Nexus Protocol - Backend Server

**Status**: ✅ Production Ready | **Version**: 1.0.0

A complete backend implementation for the Nexus Protocol cyber-heist simulation game with real-time WebSocket communication, JWT authentication, and comprehensive game mechanics.

## ✅ FEATURES IMPLEMENTED

- ✅ **Complete Game Engine** - Mission management, scoring, and game mechanics
- ✅ **Real-time Communication** - WebSocket support for live mission updates
- ✅ **Authentication System** - JWT-based session management with 2-hour expiry
- ✅ **Agent System** - Three specialized roles (Hacker, Infiltrator, Analyst)
- ✅ **Mission Types** - False Flag, Biometric Bluff, and Core Extraction missions
- ✅ **Performance Tracking** - Scoring, rankings, and achievement system
- ✅ **Security Features** - Rate limiting, CORS, Helmet, input validation
- ✅ **Error Handling** - Comprehensive error management and logging
- ✅ **Environment Configuration** - Flexible .env-based configuration

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Team authentication
- `POST /api/v1/auth/logout` - Session termination
- `GET /api/v1/auth/validate` - Token validation

### Game State
- `GET /api/v1/game/state` - Current game state
- `PUT /api/v1/game/state` - Update game state

### Missions
- `GET /api/v1/missions` - Available missions
- `GET /api/v1/missions/:id` - Mission details
- `POST /api/v1/missions/start` - Start new mission
- `POST /api/v1/missions/complete-objective` - Complete objective
- `GET /api/v1/missions/status` - Current mission status

### Agents
- `GET /api/v1/agents` - Available agents
- `POST /api/v1/agents/select` - Select agent
- `POST /api/v1/agents/use-ability` - Use agent ability

### Analytics
- `GET /api/v1/analytics/stats` - Global statistics

## WebSocket Events

Connect to `/socket.io/` with authentication token:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

// Join mission room
socket.emit('join-mission', missionId);

// Listen for mission updates
socket.on('mission-update', (data) => {
  console.log('Mission update:', data);
});
```

## Game Mechanics

### Mission Types

1. **False Flag Operation** (30 min)
   - Create false corporate identity
   - Plant decoy telemetry
   - Difficulty: Medium

2. **Biometric Bluff** (28 min)
   - Bypass biometric security
   - Social engineering focus
   - Difficulty: High

3. **Core Extraction** (30 min)
   - Extract "soul key" data
   - Maximum security
   - Difficulty: Extreme

### Agent Roles

- **Hacker (Breach Architect)**: System exploitation specialist
- **Infiltrator (Shadow Linguist)**: Social engineering expert
- **Analyst (Signal Oracle)**: Intelligence gathering specialist

### Scoring System

- Base Score: 1000 points
- Multipliers: Stealth, Time, Objectives, No Alarms, Perfect Run
- Ranks: S-RANK (5000+) to F-RANK (<1000)

## Development

### Project Structure
```
backend/
├── index.js              # Main server file
├── game/
│   └── GameEngine.js     # Core game mechanics
├── models/
│   └── database.js       # Data management
├── package.json          # Dependencies
└── README.md            # This file
```

### Adding New Features

1. **New Mission Type**: Add to `GameEngine.initializeMissionTypes()`
2. **New Agent**: Add to `GameEngine.initializeAgents()`
3. **New Achievement**: Add to `GameEngine.initializeAchievements()`

## Security

- JWT authentication with configurable secret
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Security headers via Helmet.js
- Input validation and sanitization

## Performance

- In-memory data storage (replace with database in production)
- Compression middleware
- Efficient WebSocket handling
- Automatic cleanup of expired sessions

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure secure JWT_SECRET
3. Set up proper CORS origins
4. Configure reverse proxy (Nginx)
5. Set up database (PostgreSQL/MongoDB)
6. Configure logging and monitoring

## License

MIT License - See LICENSE file for details