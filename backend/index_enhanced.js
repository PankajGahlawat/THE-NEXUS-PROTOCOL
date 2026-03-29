/**
 * NEXUS PROTOCOL - Enhanced Backend Server
 * Production-ready server with security, performance, and proper database integration
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import enhanced systems
let database;
if (process.env.USE_POSTGRES === 'true') {
  const PostgreSQLDatabase = require('./models/PostgreSQLDatabase');
  database = new PostgreSQLDatabase({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'nexusprotocol',
    user: process.env.DB_USER || 'nexus_user',
    password: process.env.DB_PASSWORD || 'nexus_pass_2024',
  });
} else {
  database = require('./models/database'); // fallback in-memory
}
const EnhancedGameEngine = require('./game/EnhancedGameEngine');
const AuthMiddleware = require('./middleware/auth');
const WebSocketMiddleware = require('./middleware/websocket');
const TerminalService = require('./services/terminalService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // SECURITY: Use explicit allowlist from environment
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];
      
      if (allowedOrigins.length === 0) {
        console.warn('âš ï¸  WARNING: No CORS origins configured. Set CORS_ORIGIN environment variable.');
        return callback(new Error('CORS not configured'));
      }

      // Check if origin is in allowlist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3000;

// Initialize enhanced systems
let gameEngine, authMiddleware, wsMiddleware, terminalService;

// Create lazy middleware wrappers that will work before initialization
const auth = {
  authenticateToken: () => (req, res, next) => authMiddleware.authenticateToken()(req, res, next),
  optionalAuth: () => (req, res, next) => authMiddleware.optionalAuth()(req, res, next),
  getLoginValidation: () => authMiddleware.getLoginValidation(),
  handleValidationErrors: (req, res, next) => authMiddleware.handleValidationErrors(req, res, next),
  getGeneralLimiter: () => authMiddleware.getGeneralLimiter(),
  getAuthLimiter: () => authMiddleware.getAuthLimiter(),
  getMissionActionLimiter: () => authMiddleware.getMissionActionLimiter(),
  securityHeaders: () => authMiddleware.securityHeaders(),
  requestLogger: () => authMiddleware.requestLogger()
};

const ws = {
  authenticateSocket: () => wsMiddleware.authenticateSocket(),
  rateLimitMiddleware: () => wsMiddleware.rateLimitMiddleware(),
  handleConnection: (io) => wsMiddleware.handleConnection(io),
  getStats: () => wsMiddleware.getStats()
};

async function initializeServer() {
  try {
    console.log('ðŸš€ Initializing Nexus Protocol Enhanced Server...');

    // SECURITY: Validate required environment variables
    const requiredEnvVars = ['JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('âŒ SECURITY ERROR: Required environment variables not set:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('');
      console.error('Please set these variables in your .env file before starting the server.');
      console.error('See .env.example for reference.');
      process.exit(1);
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET.length < 32) {
      console.error('âŒ SECURITY ERROR: JWT_SECRET must be at least 32 characters long');
      console.error('Generate a strong secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
      process.exit(1);
    }

    // Initialize database
    if (process.env.USE_POSTGRES === 'true') {
      await database.initialize();
      console.log('âœ… PostgreSQL database connected (nexusprotocol)');
    } else {
      console.log('âœ… Database initialized (in-memory)');
    }

    // Initialize game engine
    gameEngine = new EnhancedGameEngine(database);
    console.log('âœ… Enhanced Game Engine initialized');

    // Initialize middleware
    authMiddleware = new AuthMiddleware(database);
    wsMiddleware = new WebSocketMiddleware(database, authMiddleware);
    console.log('âœ… Security middleware initialized');

    // Initialize terminal service
    terminalService = new TerminalService();
    console.log('âœ… Terminal service initialized');

  } catch (error) {
    console.error('âŒ Server initialization failed:', error);
    process.exit(1);
  }
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // SECURITY: Use explicit allowlist from environment
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];
    
    if (allowedOrigins.length === 0) {
      console.warn('âš ï¸  WARNING: No CORS origins configured. Set CORS_ORIGIN environment variable.');
      return callback(new Error('CORS not configured'));
    }

    // Check if origin is in allowlist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log rejected origins for debugging
    console.warn(`CORS: Rejected origin ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing and compression
app.use(compression({ level: parseInt(process.env.COMPRESSION_LEVEL) || 6 }));
// SECURITY: Reduced from 10mb to 1mb to prevent DoS attacks
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_REQUEST_SIZE || '1mb' }));

// Initialize middleware after systems are ready
app.use((req, res, next) => {
  if (!authMiddleware) {
    return res.status(503).json({
      success: false,
      error: 'SERVER_INITIALIZING',
      message: 'Server is still initializing. Please try again in a moment.'
    });
  }
  next();
});

// Apply rate limiting and security
app.use('/api/', (req, res, next) => auth.getGeneralLimiter()(req, res, next));
app.use('/api/v1/auth/', (req, res, next) => auth.getAuthLimiter()(req, res, next));
app.use('/api/v1/missions/action', (req, res, next) => auth.getMissionActionLimiter()(req, res, next));

// Admin routes
app.use('/api/v1/admin', (req, res, next) => {
  require('./routes/admin')()(req, res, next);
});

// Room routes
app.use('/api/v1/rooms', require('./routes/rooms'));

// Security headers and logging
app.use((req, res, next) => auth.securityHeaders()(req, res, next));
app.use((req, res, next) => auth.requestLogger()(req, res, next));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Simple database health check - try a query
    const dbHealth = await database.query('SELECT 1 as health')
      .then(() => ({ status: 'healthy' }))
      .catch(() => ({ status: 'unhealthy' }));
    const cacheStats = gameEngine.getCacheStats();
    const wsStats = ws.getStats();

    res.json({
      status: 'operational',
      version: '2.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbHealth,
      cache: cacheStats,
      websocket: wsStats,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== AUTHENTICATION ENDPOINTS =====

// Static team credentials (used when USE_POSTGRES=false)
// Shared with admin routes via models/teamsStore.js
const STATIC_TEAMS = require('./models/teamsStore');

// Kicked teams set — admin kick forces logout on next game/state poll
const kickedTeams = new Set();
module.exports.kickedTeams = kickedTeams;

app.post('/api/v1/auth/login',
  (req, res, next) => {
    const validators = auth.getLoginValidation();
    Promise.all(validators.map(v => v.run(req)))
      .then(() => next())
      .catch(next);
  },
  (req, res, next) => auth.handleValidationErrors(req, res, next),
  async (req, res) => {
    try {
      const { teamName, accessCode } = req.body;

      let team = null;

      if (process.env.USE_POSTGRES === 'true') {
        const { Pool: AuthPool } = require('pg');
        const bcrypt = require('bcryptjs');
        const authPool = new AuthPool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || 'nexusprotocol',
          user: process.env.DB_USER || 'nexus_user',
          password: process.env.DB_PASSWORD || '',
          ssl: false
        });
        const result = await authPool.query(
          'SELECT * FROM teams WHERE team_name = $1 AND is_active = TRUE',
          [teamName]
        );
        if (result.rows.length > 0) {
          const row = result.rows[0];
          const match = await bcrypt.compare(accessCode, row.password_hash);
          if (match) team = { id: row.id, team_name: row.team_name, team_type: row.team_type };
        }
        await authPool.end();
      } else {
        // Use static credentials
        const found = STATIC_TEAMS.find(
          t => t.team_name === teamName && t.access_code === accessCode
        );
        if (found) team = found;
      }

      if (!team) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid team name or access code'
        });
      }

      // Generate session token — also clear any kick flag so they can play again
      kickedTeams.delete(team.team_name);
      const sessionToken = authMiddleware.generateToken({
        teamId: team.id,
        teamName: team.team_name,
        teamType: team.team_type
      });

      // Register session in in-memory DB so authenticateToken middleware can validate it
      if (process.env.USE_POSTGRES !== 'true') {
        try {
          // Ensure team exists in in-memory DB
          if (!database.getTeam(team.id)) {
            database.teams.set(team.id, {
              id: team.id,
              teamName: team.team_name,
              teamType: team.team_type,
              totalMissions: 0, completedMissions: 0, totalScore: 0,
              averageRank: 'F-RANK', bestRank: 'F-RANK',
              lastActive: new Date().toISOString()
            });
          }
          database.createSession({ teamId: team.id, sessionToken });
        } catch (e) { /* non-fatal */ }
      }

      res.json({
        success: true,
        sessionToken,
        teamId: team.id,
        teamName: team.team_name,
        teamType: team.team_type,
        expiresIn: 7200
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

app.post('/api/v1/auth/logout', auth.authenticateToken(), async (req, res) => {
  try {
    await database.deleteSession(req.session.token);
    res.json({
      success: true,
      message: 'Session terminated'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

app.get('/api/v1/auth/validate', auth.authenticateToken(), (req, res) => {
  res.json({
    success: true,
    valid: true,
    teamName: req.session.teamName,
    teamId: req.session.teamId,
    expiresIn: 7200 // 2 hour session
  });
});

// ===== GAME STATE ENDPOINTS =====

app.get('/api/v1/game/state', async (req, res) => {
  try {
    // Check kicked teams first (before full auth) by peeking at the JWT
    const rawToken = (req.headers['authorization'] || '').split(' ')[1];
    if (rawToken) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(rawToken); // decode without verify just to get teamName
        if (decoded && decoded.teamName && kickedTeams.has(decoded.teamName)) {
          return res.json({ success: true, data: { forceLogout: true } });
        }
      } catch (e) { /* ignore decode errors, fall through to normal auth */ }
    }
  } catch (e) { /* ignore */ }

  // Normal auth flow
  return auth.authenticateToken()(req, res, async () => {
    try {
    const team = await database.getTeam(req.session.teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'TEAM_NOT_FOUND',
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      data: {
        authenticated: true,
        teamName: req.session.teamName,
        teamId: req.session.teamId,
        selectedAgent: req.session.selectedAgent,
        currentMission: req.session.currentMission,
        broadcasts: (() => {
          try {
            const store = require('./models/broadcastStore');
            return store.filter(b => b.expiresAt > Date.now());
          } catch (e) { return []; }
        })(),
        teamStats: {
          totalMissions: team.total_missions,
          completedMissions: team.completed_missions,
          totalScore: team.total_score,
          bestScore: team.best_score,
          averageRank: team.average_rank,
          bestRank: team.best_rank
        }
      }
    });
  } catch (error) {
    console.error('Game state error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve game state'
    });
  }
  }); // end authenticateToken callback
});

// ===== PUBLIC BROADCASTS ENDPOINT (no auth required) =====

app.get('/api/v1/broadcasts', (req, res) => {
  try {
    const store = require('./models/broadcastStore');
    const active = store.filter(b => b.expiresAt > Date.now());
    return res.json({ success: true, data: active });
  } catch (e) {
    return res.json({ success: true, data: [] });
  }
});

// ===== MISSION ENDPOINTS =====

app.get('/api/v1/missions', auth.optionalAuth(), (req, res) => {
  const missions = Object.values(gameEngine.missionTypes);
  res.json({
    success: true,
    data: { missions }
  });
});

app.post('/api/v1/missions/start', auth.authenticateToken(), async (req, res) => {
  try {
    const { missionId, selectedAgent } = req.body;

    if (!gameEngine.missionTypes[missionId]) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MISSION',
        message: 'Invalid mission type'
      });
    }

    if (!gameEngine.agents[selectedAgent]) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_AGENT',
        message: 'Invalid agent selected'
      });
    }

    const missionInstance = await gameEngine.createMissionInstance(
      missionId,
      req.session.teamId,
      selectedAgent
    );

    res.json({
      success: true,
      data: { missionInstance }
    });

  } catch (error) {
    console.error('Mission start error:', error);
    res.status(500).json({
      success: false,
      error: 'MISSION_START_FAILED',
      message: 'Failed to start mission'
    });
  }
});

app.post('/api/v1/missions/complete-objective',
  auth.authenticateToken(),
  async (req, res) => {
    try {
      const { missionInstanceId, objectiveId } = req.body;

      if (!missionInstanceId || !objectiveId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_PARAMETERS',
          message: 'Mission instance ID and objective ID are required'
        });
      }

      const result = await gameEngine.completeObjective(missionInstanceId, objectiveId);

      // Emit real-time update
      io.to(`mission:${missionInstanceId}`).emit('objective-complete', {
        objectiveId,
        reward: result.objective.reward,
        missionProgress: result.missionProgress,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Complete objective error:', error);
      res.status(500).json({
        success: false,
        error: 'OBJECTIVE_COMPLETION_FAILED',
        message: error.message
      });
    }
  }
);

// ===== AGENT ENDPOINTS =====

app.get('/api/v1/agents', auth.optionalAuth(), (req, res) => {
  const agents = Object.values(gameEngine.agents);
  res.json({
    success: true,
    data: { agents }
  });
});

app.post('/api/v1/agents/select', auth.authenticateToken(), async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!gameEngine.agents[agentId]) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_AGENT',
        message: 'Invalid agent selected'
      });
    }

    // Update session with selected agent
    req.session.selectedAgent = agentId;

    res.json({
      success: true,
      data: {
        agent: gameEngine.agents[agentId],
        message: 'Agent selected successfully'
      }
    });

  } catch (error) {
    console.error('Agent selection error:', error);
    res.status(500).json({
      success: false,
      error: 'AGENT_SELECTION_FAILED',
      message: 'Failed to select agent'
    });
  }
});

app.post('/api/v1/agents/use-ability',
  auth.authenticateToken(),
  async (req, res) => {
    try {
      const { missionInstanceId, abilityType, targetData } = req.body;

      const result = await gameEngine.useAbility(missionInstanceId, abilityType, targetData);

      // Emit real-time update
      io.to(`mission:${missionInstanceId}`).emit('ability-used', {
        teamName: req.session.teamName,
        abilityName: result.ability.name,
        effects: result.effects,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Use ability error:', error);
      res.status(500).json({
        success: false,
        error: 'ABILITY_USE_FAILED',
        message: error.message
      });
    }
  }
);

// ===== ANALYTICS ENDPOINTS =====

app.get('/api/v1/analytics/leaderboard', auth.optionalAuth(), async (req, res) => {
  try {
    const { limit = 10, timeframe = 'all' } = req.query;
    const leaderboard = await database.getLeaderboard(parseInt(limit), timeframe);

    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'LEADERBOARD_FAILED',
      message: 'Failed to retrieve leaderboard'
    });
  }
});

// ===== WEBSOCKET HANDLING =====
// WebSocket setup is done in initializeServer() after middleware is ready

// ===== ERROR HANDLING =====

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler - will be set up after initialization
let errorHandlerSet = false;

// ===== SERVER STARTUP =====

async function startServer() {
  try {
    await initializeServer();
    
    // Set up WebSocket handling after initialization
    io.use(wsMiddleware.authenticateSocket());
    io.use(wsMiddleware.rateLimitMiddleware());
    io.on('connection', (socket) => {
      // Delegate to existing WebSocket middleware
      wsMiddleware.handleConnection(io)(socket);

      // â”€â”€ Terminal WebSocket Events â”€â”€
      socket.on('terminal:spawn', (data, callback) => {
        try {
          const { targetUrl } = data;
          const session = terminalService.spawnSession(
            socket.teamId,
            socket.teamName,
            targetUrl
          );
          console.log(`ðŸ–¥ï¸  Terminal spawned: ${socket.teamName} â†’ ${targetUrl}`);

          // Send welcome message
          const welcome = [
            '',
            '\x1b[1;36mâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—',
            'â•‘          NEXUS PROTOCOL â€” SECURE TERMINAL         â•‘',
            'â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m',
            '',
            `\x1b[32m  Agent:\x1b[0m    ${socket.teamName}`,
            `\x1b[32m  Target:\x1b[0m   \x1b[36m${targetUrl}\x1b[0m`,
            `\x1b[32m  Session:\x1b[0m  ${session.sessionId}`,
            '',
            '  Type \x1b[1;33mhelp\x1b[0m for available commands.',
            '',
          ].join('\r\n');

          socket.emit('terminal:output', {
            sessionId: session.sessionId,
            data: welcome
          });

          callback?.({ success: true, sessionId: session.sessionId });
        } catch (error) {
          callback?.({
            success: false,
            error: error.message
          });
        }
      });

      socket.on('terminal:input', async (data) => {
        try {
          const { sessionId, command } = data;

          // Execute the command
          const output = await terminalService.executeCommand(
            socket.teamId,
            sessionId,
            command
          );

          // Get the session for prompt
          const sessionKey = `${socket.teamId}:${sessionId}`;
          const session = terminalService.sessions.get(sessionKey);
          const prompt = session
            ? `\x1b[1;32m${session.env.USER}@nexus\x1b[0m:\x1b[1;34m~\x1b[0m$ `
            : '$ ';

          // Send output back
          let response = '';
          if (output) {
            response = output + '\r\n';
          }
          response += prompt;

          socket.emit('terminal:output', {
            sessionId,
            data: response
          });
        } catch (error) {
          socket.emit('terminal:output', {
            sessionId: data.sessionId,
            data: `\x1b[31mError: ${error.message}\x1b[0m\r\n$ `
          });
        }
      });

      socket.on('terminal:kill', (data) => {
        const { sessionId } = data;
        terminalService.killSession(socket.teamId, sessionId);
        console.log(`ðŸ–¥ï¸  Terminal killed: ${socket.teamName}/${sessionId}`);
      });

      // Clean up terminal sessions on disconnect
      socket.on('disconnect', () => {
        const sessions = terminalService.getTeamSessions(socket.teamId);
        sessions.forEach(s => {
          terminalService.killSession(socket.teamId, s.sessionId);
        });
      });
    });
    
    // Set up error handler after initialization
    if (!errorHandlerSet) {
      app.use(authMiddleware.errorHandler());
      errorHandlerSet = true;
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘                                                               â•‘
â•‘   â–ˆâ–ˆâ–ˆâ•—   â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•—  â–ˆâ–ˆâ•—â–ˆâ–ˆâ•—   â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—                â•‘
â•‘   â–ˆâ–ˆâ–ˆâ–ˆâ•—  â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â•â•â•â•â•â•šâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•”â•â–ˆâ–ˆâ•‘   â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â•â•â•â•â•                â•‘
â•‘   â–ˆâ–ˆâ•”â–ˆâ–ˆâ•— â–ˆâ–ˆâ•‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—   â•šâ–ˆâ–ˆâ–ˆâ•”â• â–ˆâ–ˆâ•‘   â–ˆâ–ˆâ•‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—                â•‘
â•‘   â–ˆâ–ˆâ•‘â•šâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â•â•â•   â–ˆâ–ˆâ•”â–ˆâ–ˆâ•— â–ˆâ–ˆâ•‘   â–ˆâ–ˆâ•‘â•šâ•â•â•â•â–ˆâ–ˆâ•‘                â•‘
â•‘   â–ˆâ–ˆâ•‘ â•šâ–ˆâ–ˆâ–ˆâ–ˆâ•‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•”â• â–ˆâ–ˆâ•—â•šâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•‘                â•‘
â•‘   â•šâ•â•  â•šâ•â•â•â•â•šâ•â•â•â•â•â•â•â•šâ•â•  â•šâ•â• â•šâ•â•â•â•â•â• â•šâ•â•â•â•â•â•â•                â•‘
â•‘                                                               â•‘
â•‘              ENHANCED PROTOCOL SERVER ONLINE                  â•‘
â•‘                                                               â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

ðŸš€ Nexus Protocol Enhanced Server v2.0.0
ðŸŒ Server: http://localhost:${PORT}
ðŸ“¡ WebSocket: Ready for real-time communication
ðŸ”’ Security: Enhanced authentication & rate limiting
âš¡ Performance: LRU caching & optimized queries
ðŸ—„ï¸  Database: PostgreSQL with proper indexing

ðŸ“‹ Enhanced Features:
   âœ… Persistent PostgreSQL database
   âœ… Memory leak prevention with LRU caches
   âœ… Proper authentication system
   âœ… WebSocket security & rate limiting
   âœ… Balanced agent abilities
   âœ… Standardized API responses
   âœ… Comprehensive error handling
   âœ… Performance monitoring

ðŸŽ® Game Balance Updates:
   â€¢ System Lattice duration: 12s â†’ 6s (balanced)
   â€¢ Infiltrator color: #A66BFF â†’ #00D4FF (fixed)
   â€¢ Enhanced scoring with exponential curves
   â€¢ Improved ability cooldowns and effects

ðŸ”§ Production Ready:
   â€¢ Rate limiting: 100 req/15min (general), 5 req/15min (auth)
   â€¢ WebSocket limits: 5 connections/IP, 30 events/min
   â€¢ Database connection pooling (max 20)
   â€¢ Automatic session cleanup
   â€¢ Comprehensive logging

âœ… Server operational with enhanced security and performance
      `);
    });

    // Cleanup intervals
    setInterval(async () => {
      try {
        const cleaned = await database.cleanupExpiredSessions();
        if (cleaned > 0) {
          console.log(`ðŸ§¹ Cleaned up ${cleaned} expired sessions`);
        }
      } catch (error) {
        console.error('Session cleanup error:', error);
      }
    }, parseInt(process.env.SESSION_CLEANUP_INTERVAL) || 3600000); // 1 hour

    setInterval(async () => {
      try {
        const cleaned = await database.cleanupOldMissions(
          parseInt(process.env.MISSION_CLEANUP_DAYS) || 30
        );
        if (cleaned > 0) {
          console.log(`ðŸ§¹ Cleaned up ${cleaned} old missions`);
        }
      } catch (error) {
        console.error('Mission cleanup error:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily

  } catch (error) {
    console.error('âŒ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nðŸ›‘ Shutting down Nexus Protocol Enhanced Server...');

  try {
    if (database) {
      await database.close();
      console.log('âœ… Database connections closed');
    }

    server.close(() => {
      console.log('âœ… Server closed gracefully');
      process.exit(0);
    });
  } catch (error) {
    console.error('âŒ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\nðŸ›‘ SIGTERM received, shutting down...');

  try {
    if (database) {
      await database.close();
    }

    server.close(() => {
      console.log('âœ… Server closed gracefully');
      process.exit(0);
    });
  } catch (error) {
    console.error('âŒ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();