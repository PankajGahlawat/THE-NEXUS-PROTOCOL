/**
 * NEXUS PROTOCOL - WebSocket Security Middleware
 * Secure WebSocket handling with rate limiting and authentication
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

const jwt = require('jsonwebtoken');

class WebSocketMiddleware {
  constructor(database, authMiddleware) {
    this.database = database;
    this.authMiddleware = authMiddleware;
    this.connectionLimits = new Map(); // IP-based connection tracking
    this.rateLimits = new Map(); // Socket-based rate limiting
    this.activeMissions = new Map(); // Mission room tracking
    
    // Configuration
    this.MAX_CONNECTIONS_PER_IP = 5;
    this.RATE_LIMIT_WINDOW = 60000; // 1 minute
    this.RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute
    this.HEARTBEAT_INTERVAL = 30000; // 30 seconds
    
    // Cleanup intervals
    this.startCleanupIntervals();
  }

  startCleanupIntervals() {
    // Clean up rate limit data every 5 minutes
    setInterval(() => {
      this.cleanupRateLimits();
    }, 5 * 60 * 1000);

    // Clean up connection tracking every minute
    setInterval(() => {
      this.cleanupConnectionLimits();
    }, 60 * 1000);
  }

  // Authentication middleware for WebSocket connections
  authenticateSocket() {
    return async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const clientIP = socket.handshake.address;

        // Check connection limits per IP
        if (!this.checkConnectionLimit(clientIP)) {
          return next(new Error('CONNECTION_LIMIT_EXCEEDED'));
        }

        if (!token) {
          return next(new Error('NO_TOKEN_PROVIDED'));
        }

        // Verify JWT token
        const decoded = this.authMiddleware.verifyToken(token);

        // Validate session in database
        const session = await this.database.validateSession(token);
        if (!session) {
          return next(new Error('INVALID_SESSION'));
        }

        // Attach session data to socket
        socket.sessionId = session.id;
        socket.teamId = session.team_id;
        socket.teamName = session.team_name;
        socket.token = token;
        socket.clientIP = clientIP;

        // Track connection
        this.trackConnection(clientIP);

        // Initialize rate limiting for this socket
        this.initializeRateLimit(socket.id);

        console.log(`✅ WebSocket authenticated: ${socket.teamName} (${socket.id})`);
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        
        let errorMessage = 'AUTHENTICATION_FAILED';
        if (error.message === 'TOKEN_EXPIRED') {
          errorMessage = 'TOKEN_EXPIRED';
        } else if (error.message === 'INVALID_TOKEN') {
          errorMessage = 'INVALID_TOKEN';
        }
        
        next(new Error(errorMessage));
      }
    };
  }

  // Connection limit checking
  checkConnectionLimit(clientIP) {
    const connections = this.connectionLimits.get(clientIP) || 0;
    return connections < this.MAX_CONNECTIONS_PER_IP;
  }

  trackConnection(clientIP) {
    const current = this.connectionLimits.get(clientIP) || 0;
    this.connectionLimits.set(clientIP, current + 1);
  }

  releaseConnection(clientIP) {
    const current = this.connectionLimits.get(clientIP) || 0;
    if (current > 0) {
      this.connectionLimits.set(clientIP, current - 1);
    }
  }

  // Rate limiting for WebSocket events
  initializeRateLimit(socketId) {
    this.rateLimits.set(socketId, {
      requests: [],
      lastCleanup: Date.now()
    });
  }

  checkRateLimit(socketId) {
    const now = Date.now();
    const socketLimits = this.rateLimits.get(socketId);
    
    if (!socketLimits) {
      this.initializeRateLimit(socketId);
      return true;
    }

    // Clean up old requests
    socketLimits.requests = socketLimits.requests.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
    );

    // Check if under limit
    if (socketLimits.requests.length >= this.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    // Add current request
    socketLimits.requests.push(now);
    return true;
  }

  // Rate limiting middleware for socket events
  rateLimitMiddleware() {
    return (socket, next) => {
      const originalEmit = socket.emit;
      const originalOn = socket.on;

      // Wrap socket.on to add rate limiting
      socket.on = (event, handler) => {
        const wrappedHandler = (...args) => {
          if (!this.checkRateLimit(socket.id)) {
            socket.emit('error', {
              type: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please slow down.',
              retryAfter: Math.ceil(this.RATE_LIMIT_WINDOW / 1000)
            });
            return;
          }

          try {
            handler(...args);
          } catch (error) {
            console.error(`WebSocket event error (${event}):`, error);
            socket.emit('error', {
              type: 'EVENT_HANDLER_ERROR',
              message: 'Failed to process event'
            });
          }
        };

        originalOn.call(socket, event, wrappedHandler);
      };

      next();
    };
  }

  // Mission room authorization
  authorizeMissionRoom() {
    return async (socket, missionId, callback) => {
      try {
        if (!missionId) {
          return callback?.({
            success: false,
            error: 'MISSING_MISSION_ID',
            message: 'Mission ID is required'
          });
        }

        // Validate mission access
        const mission = await this.database.getMissionInstance(missionId);
        if (!mission) {
          return callback?.({
            success: false,
            error: 'MISSION_NOT_FOUND',
            message: 'Mission not found'
          });
        }

        if (mission.team_id !== socket.teamId) {
          return callback?.({
            success: false,
            error: 'ACCESS_DENIED',
            message: 'Access denied to this mission'
          });
        }

        // Join the mission room
        socket.join(`mission:${missionId}`);
        
        // Track active mission
        this.trackMissionParticipant(missionId, socket.id, socket.teamId);

        console.log(`🎮 ${socket.teamName} joined mission: ${missionId}`);
        
        callback?.({
          success: true,
          message: 'Joined mission room successfully'
        });

        // Notify other participants
        socket.to(`mission:${missionId}`).emit('participant-joined', {
          teamName: socket.teamName,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Mission room authorization error:', error);
        callback?.({
          success: false,
          error: 'AUTHORIZATION_ERROR',
          message: 'Failed to join mission room'
        });
      }
    };
  }

  // Track mission participants
  trackMissionParticipant(missionId, socketId, teamId) {
    if (!this.activeMissions.has(missionId)) {
      this.activeMissions.set(missionId, new Set());
    }
    this.activeMissions.get(missionId).add({ socketId, teamId });
  }

  removeMissionParticipant(missionId, socketId) {
    const participants = this.activeMissions.get(missionId);
    if (participants) {
      participants.forEach(participant => {
        if (participant.socketId === socketId) {
          participants.delete(participant);
        }
      });
      
      if (participants.size === 0) {
        this.activeMissions.delete(missionId);
      }
    }
  }

  // Heartbeat mechanism
  setupHeartbeat(socket) {
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      } else {
        clearInterval(heartbeatInterval);
      }
    }, this.HEARTBEAT_INTERVAL);

    socket.on('pong', () => {
      socket.lastPong = Date.now();
    });

    socket.on('disconnect', () => {
      clearInterval(heartbeatInterval);
    });

    return heartbeatInterval;
  }

  // Connection handler with security measures
  handleConnection(io) {
    return (socket) => {
      console.log(`🔌 WebSocket connection: ${socket.teamName} (${socket.id})`);

      // Setup heartbeat
      const heartbeatInterval = this.setupHeartbeat(socket);

      // Handle mission room joining
      socket.on('join-mission', (missionId, callback) => {
        this.authorizeMissionRoom()(socket, missionId, callback);
      });

      // Handle mission room leaving
      socket.on('leave-mission', (missionId) => {
        socket.leave(`mission:${missionId}`);
        this.removeMissionParticipant(missionId, socket.id);
        
        socket.to(`mission:${missionId}`).emit('participant-left', {
          teamName: socket.teamName,
          timestamp: new Date().toISOString()
        });
      });

      // Handle mission actions with validation
      socket.on('mission-action', async (data, callback) => {
        try {
          const { missionId, action, payload } = data;

          if (!missionId || !action) {
            return callback?.({
              success: false,
              error: 'INVALID_ACTION_DATA',
              message: 'Mission ID and action are required'
            });
          }

          // Validate mission access
          const mission = await this.database.getMissionInstance(missionId);
          if (!mission || mission.team_id !== socket.teamId) {
            return callback?.({
              success: false,
              error: 'UNAUTHORIZED_ACTION',
              message: 'Unauthorized mission action'
            });
          }

          // Process the action (this would integrate with your game engine)
          const result = {
            type: 'MISSION_UPDATE',
            missionId,
            action,
            payload,
            teamName: socket.teamName,
            timestamp: new Date().toISOString()
          };

          // Broadcast to mission room
          io.to(`mission:${missionId}`).emit('mission-update', result);

          callback?.({
            success: true,
            message: 'Action processed successfully'
          });

        } catch (error) {
          console.error('Mission action error:', error);
          callback?.({
            success: false,
            error: 'ACTION_PROCESSING_ERROR',
            message: 'Failed to process mission action'
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 WebSocket disconnected: ${socket.teamName} (${reason})`);
        
        // Cleanup
        clearInterval(heartbeatInterval);
        this.releaseConnection(socket.clientIP);
        this.rateLimits.delete(socket.id);
        
        // Remove from all mission rooms
        this.activeMissions.forEach((participants, missionId) => {
          this.removeMissionParticipant(missionId, socket.id);
          socket.to(`mission:${missionId}`).emit('participant-left', {
            teamName: socket.teamName,
            timestamp: new Date().toISOString()
          });
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for ${socket.teamName}:`, error);
      });
    };
  }

  // Cleanup methods
  cleanupRateLimits() {
    const now = Date.now();
    for (const [socketId, limits] of this.rateLimits.entries()) {
      limits.requests = limits.requests.filter(
        timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
      );
      
      if (limits.requests.length === 0 && now - limits.lastCleanup > this.RATE_LIMIT_WINDOW) {
        this.rateLimits.delete(socketId);
      }
    }
  }

  cleanupConnectionLimits() {
    // Remove zero-count entries
    for (const [ip, count] of this.connectionLimits.entries()) {
      if (count <= 0) {
        this.connectionLimits.delete(ip);
      }
    }
  }

  // Enhanced event broadcasting methods for real-time gameplay
  broadcastTraceUpdate(missionId, traceData) {
    this.io.to(`mission:${missionId}`).emit('trace-update', {
      type: 'TRACE_UPDATE',
      data: {
        missionInstanceId: missionId,
        newLevel: traceData.newLevel,
        previousLevel: traceData.previousLevel,
        increase: traceData.increase,
        source: traceData.source,
        timestamp: new Date().toISOString()
      }
    });
  }

  broadcastObjectiveComplete(missionId, objectiveData) {
    this.io.to(`mission:${missionId}`).emit('objective-complete', {
      type: 'OBJECTIVE_COMPLETE',
      data: {
        missionInstanceId: missionId,
        objectiveId: objectiveData.objectiveId,
        completedBy: objectiveData.completedBy,
        reward: objectiveData.reward,
        bonuses: objectiveData.bonuses,
        nextPhaseUnlocked: objectiveData.nextPhaseUnlocked,
        timestamp: new Date().toISOString()
      }
    });
  }

  broadcastSystemAlert(missionId, alertData) {
    this.io.to(`mission:${missionId}`).emit('system-alert', {
      type: 'SYSTEM_ALERT',
      data: {
        missionInstanceId: missionId,
        alertType: alertData.alertType,
        severity: alertData.severity,
        message: alertData.message,
        effects: alertData.effects,
        duration: alertData.duration,
        timestamp: new Date().toISOString()
      }
    });
  }

  broadcastTeamAction(missionId, actionData) {
    this.io.to(`mission:${missionId}`).emit('team-action-broadcast', {
      type: 'TEAM_ACTION',
      data: {
        missionInstanceId: missionId,
        agentId: actionData.agentId,
        action: actionData.action,
        abilityName: actionData.abilityName,
        success: actionData.success,
        effects: actionData.effects,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Get statistics
  getStats() {
    return {
      activeConnections: this.connectionLimits.size,
      activeMissions: this.activeMissions.size,
      rateLimitedSockets: this.rateLimits.size,
      totalConnectionsByIP: Object.fromEntries(this.connectionLimits),
      activeMissionParticipants: Object.fromEntries(
        Array.from(this.activeMissions.entries()).map(([missionId, participants]) => [
          missionId,
          participants.size
        ])
      )
    };
  }
}

module.exports = WebSocketMiddleware;