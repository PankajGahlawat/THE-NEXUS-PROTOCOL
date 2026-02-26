const { Client } = require('ssh2');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const db = require('./models/database');
const ScoringEngine = require('./scoring/ScoringEngine');
const VMController = require('./admin/VMController');
const AdminController = require('./admin/AdminController');
const MissionLifecycleManager = require('./mission/MissionLifecycleManager');
const MissionReplaySystem = require('./mission/MissionReplaySystem');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.SSH_PROXY_PORT || 3002;

// Initialize scoring engine
const scoringEngine = new ScoringEngine(io);
scoringEngine.startLeaderboardUpdates();

// Initialize VM controller
const vmController = new VMController();

// Initialize admin controller
const adminController = new AdminController(io, scoringEngine, vmController);

// Initialize mission lifecycle manager
const missionLifecycle = new MissionLifecycleManager(io, vmController, scoringEngine, adminController);

// Initialize mission replay system
const missionReplay = new MissionReplaySystem(io);

// Active sessions tracking
const activeSessions = new Map();

// Admin namespace for monitoring
const adminNamespace = io.of('/admin');

// Scoring API Routes
app.get('/api/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const leaderboard = scoringEngine.getLeaderboard(limit);
  res.json({ success: true, leaderboard });
});

app.get('/api/score/:userId', (req, res) => {
  const score = scoringEngine.getUserScore(req.params.userId);
  if (!score) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, score });
});

app.get('/api/session/:sessionId/score', (req, res) => {
  const score = scoringEngine.getSessionScore(req.params.sessionId);
  if (!score) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({ success: true, score });
});

app.get('/api/statistics', (req, res) => {
  const stats = scoringEngine.getStatistics();
  res.json({ success: true, statistics: stats });
});

app.get('/api/patterns', (req, res) => {
  const patterns = scoringEngine.terminalScanner.getPatterns();
  res.json({ success: true, patterns });
});

app.post('/api/score/reset/:userId', (req, res) => {
  scoringEngine.resetUserScore(req.params.userId);
  res.json({ success: true, message: 'Score reset' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    activeSessions: activeSessions.size,
    scoringActive: true
  });
});

// Admin API Routes
app.get('/api/admin/players', (req, res) => {
  const players = adminController.getActivePlayers();
  res.json({ success: true, players });
});

app.post('/api/admin/award-points', (req, res) => {
  const { userId, points, reason } = req.body;
  const result = adminController.awardPoints(userId, points, reason);
  res.json(result);
});

app.post('/api/admin/send-hint', (req, res) => {
  const { userId, hint } = req.body;
  const result = adminController.sendHint(userId, hint);
  res.json(result);
});

app.post('/api/admin/kick-player', (req, res) => {
  const { userId, reason } = req.body;
  const result = adminController.kickPlayer(userId, reason);
  res.json(result);
});

app.post('/api/admin/reset-vm', async (req, res) => {
  const { userId } = req.body;
  const result = await adminController.resetPlayerVM(userId);
  res.json(result);
});

app.post('/api/admin/broadcast', (req, res) => {
  const { message, type } = req.body;
  adminController.broadcastMessage(message, type);
  res.json({ success: true });
});

app.get('/api/admin/war-feed', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const feed = adminController.getWarFeed(limit);
  res.json({ success: true, feed });
});

app.get('/api/admin/player-stats/:userId', (req, res) => {
  const stats = adminController.getPlayerStats(req.params.userId);
  res.json({ success: true, stats });
});

// VM Management Routes
app.get('/api/vm/list', async (req, res) => {
  const vms = await vmController.listVMs();
  res.json({ success: true, vms });
});

app.get('/api/vm/:vmName/info', async (req, res) => {
  try {
    const info = await vmController.getVMInfo(req.params.vmName);
    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/vm/:vmName/snapshots', async (req, res) => {
  const snapshots = await vmController.listSnapshots(req.params.vmName);
  res.json({ success: true, snapshots });
});

app.post('/api/vm/:vmName/restore', async (req, res) => {
  const { snapshotName } = req.body;
  try {
    const result = await vmController.restoreSnapshot(req.params.vmName, snapshotName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/vm/:vmName/start', async (req, res) => {
  try {
    const result = await vmController.startVM(req.params.vmName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/vm/:vmName/poweroff', async (req, res) => {
  try {
    const result = await vmController.powerOffVM(req.params.vmName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/vm/:vmName/reset', async (req, res) => {
  try {
    const result = await vmController.resetVM(req.params.vmName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mission Lifecycle API
app.post('/api/mission/start', async (req, res) => {
  const result = await missionLifecycle.startMission(req.body);
  res.json(result);
});

app.post('/api/mission/:missionId/end', async (req, res) => {
  const { reason } = req.body;
  const result = await missionLifecycle.endMission(req.params.missionId, reason);
  res.json(result);
});

app.post('/api/mission/:missionId/objective/:objectiveId/complete', (req, res) => {
  const success = missionLifecycle.completeObjective(
    req.params.missionId,
    parseInt(req.params.objectiveId)
  );
  res.json({ success });
});

app.get('/api/mission/:missionId', (req, res) => {
  const mission = missionLifecycle.getActiveMission(req.params.missionId);
  if (!mission) {
    return res.status(404).json({ success: false, error: 'Mission not found' });
  }
  res.json({ success: true, mission });
});

app.get('/api/mission/:missionId/report', (req, res) => {
  const report = missionLifecycle.getMissionReport(req.params.missionId);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  res.json({ success: true, report });
});

app.get('/api/missions/active', (req, res) => {
  const missions = missionLifecycle.getAllActiveMissions();
  res.json({ success: true, missions });
});

// Mission Replay API
app.post('/api/replay/:missionId/start', (req, res) => {
  const { speed } = req.body;
  const result = missionReplay.startReplay(req.params.missionId, { speed });
  res.json(result);
});

app.post('/api/replay/:replayId/pause', (req, res) => {
  const success = missionReplay.pauseReplay(req.params.replayId);
  res.json({ success });
});

app.post('/api/replay/:replayId/resume', (req, res) => {
  const success = missionReplay.resumeReplay(req.params.replayId);
  res.json({ success });
});

app.post('/api/replay/:replayId/seek', (req, res) => {
  const { time } = req.body;
  const success = missionReplay.seekReplay(req.params.replayId, time);
  res.json({ success });
});

app.post('/api/replay/:replayId/speed', (req, res) => {
  const { speed } = req.body;
  const success = missionReplay.setReplaySpeed(req.params.replayId, speed);
  res.json({ success });
});

app.get('/api/replay/:replayId/status', (req, res) => {
  const status = missionReplay.getReplayStatus(req.params.replayId);
  if (!status) {
    return res.status(404).json({ success: false, error: 'Replay not found' });
  }
  res.json({ success: true, status });
});

app.get('/api/replay/:missionId/recording', (req, res) => {
  const recording = missionReplay.getRecording(req.params.missionId);
  if (!recording) {
    return res.status(404).json({ success: false, error: 'Recording not found' });
  }
  res.json({ success: true, recording });
});

app.get('/api/replay/:missionId/export', (req, res) => {
  const json = missionReplay.exportRecording(req.params.missionId);
  if (!json) {
    return res.status(404).json({ success: false, error: 'Recording not found' });
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="mission-${req.params.missionId}-replay.json"`);
  res.send(json);
});

app.get('/api/replays/active', (req, res) => {
  const replays = missionReplay.getActiveReplays();
  res.json({ success: true, replays });
});

// Log command to database
async function logCommand(sessionId, userId, command, output, vmHost) {
  try {
    // For now, log to console (can be replaced with actual DB later)
    console.log(`[CMD LOG] ${new Date().toISOString()} | ${userId}@${vmHost} | ${command}`);
    
    // TODO: Implement actual database logging when PostgreSQL is configured
    // await db.query(
    //   `INSERT INTO terminal_logs (session_id, user_id, command, output, vm_host, timestamp)
    //    VALUES ($1, $2, $3, $4, $5, NOW())`,
    //   [sessionId, userId, command, output, vmHost]
    // );
  } catch (error) {
    console.error('Failed to log command:', error);
  }
}

// Broadcast to admin monitors
function broadcastToAdmins(event, data) {
  adminNamespace.emit(event, data);
}

// Admin connection handler
adminNamespace.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);
  
  // Send current active sessions
  const sessions = Array.from(activeSessions.values()).map(session => ({
    sessionId: session.sessionId,
    userId: session.userId,
    username: session.username,
    vmHost: session.vmHost,
    connectedAt: session.connectedAt,
    lastActivity: session.lastActivity
  }));
  
  socket.emit('active-sessions', sessions);
  
  // Subscribe to specific session
  socket.on('monitor-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`Admin ${socket.id} monitoring session ${sessionId}`);
  });
  
  // Unsubscribe from session
  socket.on('unmonitor-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    console.log(`Admin ${socket.id} stopped monitoring session ${sessionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.id);
  });
});

// SSH connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  let sshClient = null;
  let sshStream = null;
  let sessionId = null;
  let userId = null;
  let vmHost = null;
  let commandBuffer = '';

  socket.on('ssh-connect', (config) => {
    console.log('SSH connection request:', { host: config.host, username: config.username });
    
    // Generate session ID
    sessionId = `${socket.id}-${Date.now()}`;
    userId = config.userId || socket.id;
    vmHost = config.host;
    
    // Get mission ID if provided
    const missionId = config.missionId;
    
    // Track session
    activeSessions.set(sessionId, {
      sessionId,
      userId,
      username: config.username,
      vmHost,
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
      missionId
    });
    
    // Start recording if mission ID provided
    if (missionId) {
      const mission = missionLifecycle.getActiveMission(missionId);
      if (mission) {
        missionReplay.startRecording(missionId, mission);
      }
    }
    
    // Register player with admin controller
    adminController.registerPlayer(sessionId, {
      userId,
      username: config.username,
      vmHost
    });
    
    // Notify admins of new session
    broadcastToAdmins('session-started', {
      sessionId,
      userId,
      username: config.username,
      vmHost,
      timestamp: new Date()
    });
    
    // Initialize scoring for this session
    scoringEngine.initializeSession(sessionId, userId, {
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password
    });
    
    sshClient = new Client();
    
    sshClient.on('ready', () => {
      console.log('SSH connection established');
      socket.emit('ssh-status', { status: 'connected', sessionId });
      
      sshClient.shell({ term: 'xterm-256color' }, (err, stream) => {
        if (err) {
          console.error('Shell error:', err);
          socket.emit('ssh-error', { message: err.message });
          return;
        }
        
        sshStream = stream;
        
        stream.on('data', (data) => {
          const output = data.toString('utf-8');
          
          // Send to client
          socket.emit('ssh-output', output);
          
          // Record terminal output for replay
          const session = activeSessions.get(sessionId);
          if (session && session.missionId) {
            missionReplay.recordTerminalOutput(session.missionId, output);
          }
          
          // Scan output for scoring patterns
          scoringEngine.scanOutput(sessionId, userId, output);
          
          // Mirror to admin monitors
          adminNamespace.to(`session-${sessionId}`).emit('terminal-output', {
            sessionId,
            userId,
            vmHost,
            output,
            timestamp: new Date()
          });
          
          // Update last activity
          if (session) {
            session.lastActivity = new Date();
          }
        });
        
        stream.on('close', () => {
          console.log('SSH stream closed');
          socket.emit('ssh-status', { status: 'disconnected' });
          
          // End scoring for this session
          scoringEngine.endSession(sessionId);
          
          // Notify admins
          broadcastToAdmins('session-ended', {
            sessionId,
            userId,
            vmHost,
            timestamp: new Date()
          });
          
          // Remove from active sessions
          activeSessions.delete(sessionId);
          
          sshClient.end();
        });
        
        stream.stderr.on('data', (data) => {
          const output = data.toString('utf-8');
          socket.emit('ssh-output', output);
          
          // Mirror to admin
          adminNamespace.to(`session-${sessionId}`).emit('terminal-output', {
            sessionId,
            userId,
            vmHost,
            output,
            timestamp: new Date()
          });
        });
      });
    });
    
    sshClient.on('error', (err) => {
      console.error('SSH error:', err);
      socket.emit('ssh-error', { message: err.message });
      
      // Notify admins
      broadcastToAdmins('session-error', {
        sessionId,
        userId,
        vmHost,
        error: err.message,
        timestamp: new Date()
      });
    });
    
    sshClient.on('close', () => {
      console.log('SSH connection closed');
      socket.emit('ssh-status', { status: 'disconnected' });
    });
    
    // Connect to SSH server
    sshClient.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      readyTimeout: 20000
    });
  });
  
  socket.on('ssh-input', async (data) => {
    if (sshStream && sshStream.writable) {
      sshStream.write(data);
      
      // Buffer commands (detect Enter key)
      commandBuffer += data;
      
      if (data === '\r' || data === '\n') {
        const command = commandBuffer.trim();
        
        if (command) {
          // Log command to database
          await logCommand(sessionId, userId, command, '', vmHost);
          
          // Record command for replay
          const session = activeSessions.get(sessionId);
          if (session && session.missionId) {
            missionReplay.recordCommand(session.missionId, command);
          }
          
          // Scan command for scoring
          scoringEngine.scanCommand(sessionId, userId, command);
          
          // Notify admins of command execution
          adminNamespace.to(`session-${sessionId}`).emit('command-executed', {
            sessionId,
            userId,
            vmHost,
            command,
            timestamp: new Date()
          });
          
          // Broadcast to all admins
          broadcastToAdmins('command-log', {
            sessionId,
            userId,
            vmHost,
            command,
            timestamp: new Date()
          });
        }
        
        commandBuffer = '';
      }
      
      // Update last activity
      const session = activeSessions.get(sessionId);
      if (session) {
        session.lastActivity = new Date();
      }
    }
  });
  
  socket.on('ssh-resize', (dimensions) => {
    if (sshStream) {
      sshStream.setWindow(dimensions.rows, dimensions.cols);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Unregister player from admin controller
    if (sessionId) {
      adminController.unregisterPlayer(sessionId);
    }
    
    // Notify admins
    if (sessionId) {
      broadcastToAdmins('session-disconnected', {
        sessionId,
        userId,
        vmHost,
        timestamp: new Date()
      });
      
      activeSessions.delete(sessionId);
    }
    
    if (sshStream) {
      sshStream.end();
    }
    if (sshClient) {
      sshClient.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`SSH Proxy Server running on port ${PORT}`);
});
