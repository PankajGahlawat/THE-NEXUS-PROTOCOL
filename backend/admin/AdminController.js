/**
 * Admin Controller
 * Manages admin operations: player management, point awarding, hints, kicks
 */

class AdminController {
  constructor(io, scoringEngine, vmController) {
    this.io = io;
    this.scoringEngine = scoringEngine;
    this.vmController = vmController;
    this.activePlayers = new Map(); // sessionId -> player data
    this.warFeed = []; // Recent events for war feed
    this.maxWarFeedSize = 100;
  }

  /**
   * Register active player
   */
  registerPlayer(sessionId, playerData) {
    this.activePlayers.set(sessionId, {
      sessionId,
      userId: playerData.userId,
      username: playerData.username,
      vmHost: playerData.vmHost,
      connectedAt: new Date(),
      lastActivity: new Date(),
      status: 'active'
    });

    this.addToWarFeed({
      type: 'player_connected',
      userId: playerData.userId,
      username: playerData.username,
      message: `${playerData.username} connected to ${playerData.vmHost}`,
      timestamp: new Date()
    });

    this.broadcastPlayerList();
  }

  /**
   * Unregister player
   */
  unregisterPlayer(sessionId) {
    const player = this.activePlayers.get(sessionId);
    if (player) {
      this.addToWarFeed({
        type: 'player_disconnected',
        userId: player.userId,
        username: player.username,
        message: `${player.username} disconnected`,
        timestamp: new Date()
      });

      this.activePlayers.delete(sessionId);
      this.broadcastPlayerList();
    }
  }

  /**
   * Get active players
   */
  getActivePlayers() {
    return Array.from(this.activePlayers.values());
  }

  /**
   * Award points to player
   */
  awardPoints(userId, points, reason) {
    const userScore = this.scoringEngine.getUserScore(userId);
    
    if (!userScore) {
      return { success: false, error: 'User not found' };
    }

    // Find active session for user
    let sessionId = null;
    for (const [sid, player] of this.activePlayers) {
      if (player.userId === userId) {
        sessionId = sid;
        break;
      }
    }

    if (!sessionId) {
      return { success: false, error: 'No active session found' };
    }

    // Create scoring event
    const event = {
      type: 'admin_award',
      category: 'admin',
      points: points,
      description: reason || 'Admin awarded points',
      timestamp: new Date()
    };

    // Award points through scoring engine
    this.scoringEngine.handleScoringEvent(sessionId, userId, event);

    // Add to war feed
    this.addToWarFeed({
      type: 'points_awarded',
      userId,
      points,
      reason,
      message: `Admin awarded ${points} points to ${userId}: ${reason}`,
      timestamp: new Date()
    });

    console.log(`[ADMIN] Awarded ${points} points to ${userId}: ${reason}`);

    return {
      success: true,
      newTotal: userScore.totalPoints + points,
      rank: this.scoringEngine.calculateRank(userScore.totalPoints + points)
    };
  }

  /**
   * Send hint to player
   */
  sendHint(userId, hint) {
    // Find active session
    let sessionId = null;
    for (const [sid, player] of this.activePlayers) {
      if (player.userId === userId) {
        sessionId = sid;
        break;
      }
    }

    if (!sessionId) {
      return { success: false, error: 'Player not found' };
    }

    // Send hint via Socket.io
    this.io.to(sessionId).emit('admin-hint', {
      hint,
      timestamp: new Date()
    });

    // Add to war feed
    this.addToWarFeed({
      type: 'hint_sent',
      userId,
      hint,
      message: `Hint sent to ${userId}`,
      timestamp: new Date()
    });

    console.log(`[ADMIN] Sent hint to ${userId}: ${hint}`);

    return { success: true };
  }

  /**
   * Kick player
   */
  kickPlayer(userId, reason) {
    // Find active session
    let sessionId = null;
    let username = null;
    for (const [sid, player] of this.activePlayers) {
      if (player.userId === userId) {
        sessionId = sid;
        username = player.username;
        break;
      }
    }

    if (!sessionId) {
      return { success: false, error: 'Player not found' };
    }

    // Send kick message
    this.io.to(sessionId).emit('admin-kick', {
      reason: reason || 'Kicked by admin',
      timestamp: new Date()
    });

    // Disconnect socket
    const sockets = this.io.sockets.sockets;
    for (const [socketId, socket] of sockets) {
      if (socket.id === sessionId) {
        socket.disconnect(true);
        break;
      }
    }

    // Add to war feed
    this.addToWarFeed({
      type: 'player_kicked',
      userId,
      username,
      reason,
      message: `${username} was kicked: ${reason}`,
      timestamp: new Date()
    });

    console.log(`[ADMIN] Kicked player ${userId}: ${reason}`);

    return { success: true };
  }

  /**
   * Reset VM for player
   */
  async resetPlayerVM(userId) {
    // Find player's VM
    let vmHost = null;
    let username = null;
    for (const [sid, player] of this.activePlayers) {
      if (player.userId === userId) {
        vmHost = player.vmHost;
        username = player.username;
        break;
      }
    }

    if (!vmHost) {
      return { success: false, error: 'Player VM not found' };
    }

    // Find VM config by host
    const registeredVMs = this.vmController.getRegisteredVMs();
    const vmConfig = registeredVMs.find(vm => vm.host === vmHost);

    if (!vmConfig) {
      return { success: false, error: 'VM not registered' };
    }

    try {
      // Restore VM to snapshot
      const result = await this.vmController.restoreSnapshot(
        vmConfig.name,
        vmConfig.snapshotName
      );

      // Add to war feed
      this.addToWarFeed({
        type: 'vm_reset',
        userId,
        username,
        vmName: vmConfig.name,
        message: `VM reset for ${username} (${vmConfig.name})`,
        timestamp: new Date()
      });

      console.log(`[ADMIN] Reset VM for ${userId}: ${vmConfig.name}`);

      return {
        success: true,
        vmName: vmConfig.name,
        snapshot: vmConfig.snapshotName
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Broadcast message to all players
   */
  broadcastMessage(message, type = 'info') {
    this.io.emit('admin-broadcast', {
      message,
      type,
      timestamp: new Date()
    });

    this.addToWarFeed({
      type: 'admin_broadcast',
      message: `Admin broadcast: ${message}`,
      timestamp: new Date()
    });

    console.log(`[ADMIN] Broadcast: ${message}`);
  }

  /**
   * Add event to war feed
   */
  addToWarFeed(event) {
    this.warFeed.unshift(event);
    
    // Limit size
    if (this.warFeed.length > this.maxWarFeedSize) {
      this.warFeed = this.warFeed.slice(0, this.maxWarFeedSize);
    }

    // Broadcast to admin namespace
    this.io.of('/admin').emit('war-feed-update', event);
  }

  /**
   * Get war feed
   */
  getWarFeed(limit = 50) {
    return this.warFeed.slice(0, limit);
  }

  /**
   * Broadcast player list to admins
   */
  broadcastPlayerList() {
    const players = this.getActivePlayers();
    this.io.of('/admin').emit('player-list-update', players);
  }

  /**
   * Get player statistics
   */
  getPlayerStats(userId) {
    const score = this.scoringEngine.getUserScore(userId);
    const player = Array.from(this.activePlayers.values()).find(p => p.userId === userId);

    return {
      userId,
      score: score?.totalPoints || 0,
      rank: score?.rank || 'F-RANK',
      achievements: score?.achievements?.length || 0,
      sessions: score?.sessions?.length || 0,
      active: !!player,
      connectedAt: player?.connectedAt,
      lastActivity: player?.lastActivity
    };
  }
}

module.exports = AdminController;
