// Real-Time Synchronization System for NEXUS PROTOCOL
// Manages WebSocket broadcasting for game state updates

const { v4: uuidv4 } = require('uuid');

class RealTimeSyncSystem {
  constructor(io, missionEngine) {
    this.io = io;
    this.missionEngine = missionEngine;
    this.roomManager = null; // Will be set by RoomManager
    this.messageQueue = new Map(); // roundId -> queued messages
    this.updateTimers = new Map(); // roundId -> timer
    
    // Configuration
    this.BATCH_DELAY = 50; // 50ms batching for performance
    this.MAX_QUEUE_SIZE = 100;
    this.LATENCY_THRESHOLD = 500; // 500ms latency threshold
    
    // Statistics
    this.stats = {
      messagesSent: 0,
      messagesQueued: 0,
      batchesSent: 0,
      errors: 0
    };
  }

  /**
   * Set room manager reference
   * @param {Object} roomManager - Room manager instance
   */
  setRoomManager(roomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Broadcast action to all clients in a round
   * @param {string} roundId - Round identifier
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @param {Object} options - Broadcasting options
   */
  broadcastAction(roundId, eventType, data, options = {}) {
    try {
      const message = {
        id: uuidv4(),
        type: eventType,
        roundId,
        data,
        timestamp: new Date().toISOString(),
        ...options
      };

      // Check if we should batch this message
      if (options.batch !== false) {
        this.queueMessage(roundId, message);
      } else {
        this.sendMessage(roundId, message);
      }

      this.stats.messagesSent++;
    } catch (error) {
      console.error('Broadcast action error:', error);
      this.stats.errors++;
    }
  }

  /**
   * Queue message for batched sending
   * @param {string} roundId - Round identifier
   * @param {Object} message - Message to queue
   */
  queueMessage(roundId, message) {
    if (!this.messageQueue.has(roundId)) {
      this.messageQueue.set(roundId, []);
    }

    const queue = this.messageQueue.get(roundId);
    queue.push(message);
    this.stats.messagesQueued++;

    // Limit queue size
    if (queue.length > this.MAX_QUEUE_SIZE) {
      queue.shift(); // Remove oldest message
    }

    // Schedule batch send if not already scheduled
    if (!this.updateTimers.has(roundId)) {
      const timer = setTimeout(() => {
        this.flushMessageQueue(roundId);
      }, this.BATCH_DELAY);
      
      this.updateTimers.set(roundId, timer);
    }
  }

  /**
   * Flush message queue for a round
   * @param {string} roundId - Round identifier
   */
  flushMessageQueue(roundId) {
    const queue = this.messageQueue.get(roundId);
    if (!queue || queue.length === 0) {
      return;
    }

    // Send batched messages
    const batchMessage = {
      type: 'batch_update',
      roundId,
      messages: queue,
      count: queue.length,
      timestamp: new Date().toISOString()
    };

    this.sendMessage(roundId, batchMessage);
    
    // Clear queue and timer
    this.messageQueue.set(roundId, []);
    this.updateTimers.delete(roundId);
    this.stats.batchesSent++;
  }

  /**
   * Send message immediately to round room
   * @param {string} roundId - Round identifier
   * @param {Object} message - Message to send
   */
  sendMessage(roundId, message) {
    const roomName = `round:${roundId}`;
    this.io.to(roomName).emit('game_update', message);
  }

  /**
   * Broadcast tool execution to appropriate clients
   * @param {string} roundId - Round identifier
   * @param {Object} toolExecution - Tool execution data
   */
  broadcastToolExecution(roundId, toolExecution) {
    const { toolId, agentId, success, observable, traceGenerated, team } = toolExecution;

    // Always broadcast to the executing team
    this.broadcastToTeam(roundId, team, 'tool_executed', {
      toolId,
      agentId,
      success,
      traceGenerated,
      observable
    });

    // If observable, alert the opposing team
    if (observable && success) {
      const opposingTeam = team === 'red' ? 'blue' : 'red';
      this.broadcastObservableAction(roundId, opposingTeam, {
        type: 'tool_detection',
        toolId,
        agentId,
        team,
        severity: this.calculateAlertSeverity(toolId, traceGenerated)
      });
    }
  }

  /**
   * Broadcast observable action alert to Blue Team
   * @param {string} roundId - Round identifier
   * @param {string} team - Target team
   * @param {Object} alertData - Alert data
   */
  broadcastObservableAction(roundId, team, alertData) {
    this.broadcastToTeam(roundId, team, 'observable_action_alert', {
      ...alertData,
      timestamp: new Date().toISOString(),
      actionable: true
    });
  }

  /**
   * Broadcast task completion
   * @param {string} roundId - Round identifier
   * @param {Object} taskCompletion - Task completion data
   */
  broadcastTaskCompletion(roundId, taskCompletion) {
    this.broadcastAction(roundId, 'task_completed', {
      taskId: taskCompletion.taskId,
      team: taskCompletion.team,
      agentId: taskCompletion.agentId,
      points: taskCompletion.points,
      bonuses: taskCompletion.bonuses,
      unlockedTasks: taskCompletion.unlockedTasks
    });

    // Update scoreboard
    this.broadcastScoreUpdate(roundId);
  }

  /**
   * Broadcast score update
   * @param {string} roundId - Round identifier
   */
  broadcastScoreUpdate(roundId) {
    try {
      const analytics = this.missionEngine.getRoundAnalytics(roundId);
      
      this.broadcastAction(roundId, 'score_update', {
        scores: analytics.scores,
        progress: analytics.progress
      }, { batch: false }); // Don't batch score updates
    } catch (error) {
      console.error('Score update broadcast error:', error);
    }
  }

  /**
   * Broadcast trace level update
   * @param {string} roundId - Round identifier
   * @param {Object} traceData - Trace data
   */
  broadcastTraceUpdate(roundId, traceData) {
    this.broadcastToTeam(roundId, 'red', 'trace_update', {
      currentTrace: traceData.currentTrace,
      traceLevel: traceData.traceLevel,
      previousLevel: traceData.previousLevel,
      increase: traceData.increase
    });
  }

  /**
   * Broadcast burn state update
   * @param {string} roundId - Round identifier
   * @param {Object} burnData - Burn state data
   */
  broadcastBurnStateUpdate(roundId, burnData) {
    this.broadcastToTeam(roundId, 'red', 'burn_update', {
      burnState: burnData.burnState,
      previousState: burnData.previousState,
      burnValue: burnData.burnValue,
      effectivenessModifier: burnData.effectivenessModifier
    });

    // Send warnings at HIGH and CRITICAL states
    if (burnData.burnState === 'HIGH' || burnData.burnState === 'CRITICAL') {
      this.broadcastToTeam(roundId, 'red', 'burn_warning', {
        severity: burnData.burnState,
        message: this.getBurnWarningMessage(burnData.burnState),
        recommendations: this.getBurnRecommendations(burnData.burnState)
      });
    }
  }

  /**
   * Broadcast phase transition
   * @param {string} roundId - Round identifier
   * @param {Object} phaseData - Phase transition data
   */
  broadcastPhaseTransition(roundId, phaseData) {
    this.broadcastAction(roundId, 'phase_transition', {
      newPhase: phaseData.newPhase,
      previousPhase: phaseData.previousPhase,
      phaseStartTime: phaseData.phaseStartTime,
      phaseDuration: phaseData.phaseDuration
    }, { batch: false }); // Don't batch phase transitions
  }

  /**
   * Broadcast timer update
   * @param {string} roundId - Round identifier
   * @param {Object} timerData - Timer data
   */
  broadcastTimerUpdate(roundId, timerData) {
    this.broadcastAction(roundId, 'timer_update', {
      timeRemaining: timerData.timeRemaining,
      totalDuration: timerData.totalDuration,
      currentPhase: timerData.currentPhase,
      phaseTimeRemaining: timerData.phaseTimeRemaining
    });
  }

  /**
   * Broadcast detection event to Blue Team
   * @param {string} roundId - Round identifier
   * @param {Object} detectionData - Detection data
   */
  broadcastDetection(roundId, detectionData) {
    this.broadcastToTeam(roundId, 'blue', 'detection_alert', {
      detectionType: detectionData.type,
      severity: detectionData.severity,
      source: detectionData.source,
      target: detectionData.target,
      intelligence: detectionData.intelligence,
      recommendedActions: detectionData.recommendedActions
    }, { batch: false }); // Don't batch critical alerts
  }

  /**
   * Broadcast system state change
   * @param {string} roundId - Round identifier
   * @param {Object} stateChange - State change data
   */
  broadcastSystemStateChange(roundId, stateChange) {
    this.broadcastAction(roundId, 'system_state_changed', {
      changeType: stateChange.type,
      target: stateChange.target,
      data: stateChange.data,
      affectedSystems: stateChange.affectedSystems
    });
  }

  /**
   * Send current game state to newly connected client
   * @param {string} socketId - Socket identifier
   * @param {string} roundId - Round identifier
   */
  sendCurrentState(socketId, roundId) {
    try {
      const analytics = this.missionEngine.getRoundAnalytics(roundId);
      const roundStatus = this.missionEngine.getRoundStatus(roundId);
      const toolHistory = this.missionEngine.getToolExecutionHistory(roundId);

      const currentState = {
        type: 'initial_state',
        roundId,
        round: {
          id: roundId,
          status: roundStatus.status,
          phase: roundStatus.phase,
          startTime: roundStatus.startTime,
          endTime: roundStatus.endTime
        },
        scores: analytics.scores,
        progress: analytics.progress,
        availableTasks: roundStatus.availableTasks,
        recentEvents: analytics.events,
        toolExecutions: toolHistory.slice(-10), // Last 10 tool executions
        timestamp: new Date().toISOString()
      };

      this.io.to(socketId).emit('game_update', currentState);
    } catch (error) {
      console.error('Send current state error:', error);
      this.io.to(socketId).emit('error', {
        type: 'STATE_SYNC_ERROR',
        message: 'Failed to synchronize game state'
      });
    }
  }

  /**
   * Broadcast to specific team
   * @param {string} roundId - Round identifier
   * @param {string} team - Team ('red' or 'blue')
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @param {Object} options - Broadcasting options
   */
  broadcastToTeam(roundId, team, eventType, data, options = {}) {
    const roomName = `round:${roundId}:${team}`;
    const message = {
      id: uuidv4(),
      type: eventType,
      roundId,
      team,
      data,
      timestamp: new Date().toISOString(),
      ...options
    };

    this.io.to(roomName).emit('game_update', message);
    this.stats.messagesSent++;
  }

  /**
   * Calculate alert severity based on tool and trace
   * @param {string} toolId - Tool identifier
   * @param {number} traceGenerated - Trace amount
   * @returns {string} Severity level
   */
  calculateAlertSeverity(toolId, traceGenerated) {
    const highTracTools = ['metasploit', 'sqlmap', 'hydra'];
    const criticalTools = ['mimikatz', 'cron_persistence'];

    if (criticalTools.includes(toolId)) {
      return 'critical';
    } else if (highTracTools.includes(toolId) || traceGenerated > 15) {
      return 'high';
    } else if (traceGenerated > 10) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get burn warning message
   * @param {string} burnState - Burn state
   * @returns {string} Warning message
   */
  getBurnWarningMessage(burnState) {
    const messages = {
      'HIGH': 'WARNING: High burn state detected. Tool effectiveness reduced. Consider using stealth tools.',
      'CRITICAL': 'CRITICAL: Maximum burn state reached. Severe effectiveness penalties. Immediate countermeasures recommended.'
    };
    return messages[burnState] || 'Burn state elevated';
  }

  /**
   * Get burn recommendations
   * @param {string} burnState - Burn state
   * @returns {Array} Recommendations
   */
  getBurnRecommendations(burnState) {
    if (burnState === 'CRITICAL') {
      return [
        'Switch to stealth tools (mimikatz, dns_tunnel)',
        'Reduce action frequency',
        'Wait for Blue Team detection to expire',
        'Consider defensive posture'
      ];
    } else if (burnState === 'HIGH') {
      return [
        'Use stealth tools to reduce trace',
        'Avoid observable actions',
        'Monitor Blue Team activity'
      ];
    }
    return [];
  }

  /**
   * Handle client disconnection
   * @param {string} socketId - Socket identifier
   * @param {string} roundId - Round identifier
   */
  handleDisconnection(socketId, roundId) {
    // Flush any pending messages for this round
    if (this.messageQueue.has(roundId)) {
      this.flushMessageQueue(roundId);
    }

    console.log(`Client disconnected from round ${roundId}: ${socketId}`);
  }

  /**
   * Handle network latency issues
   * @param {string} roundId - Round identifier
   * @param {number} latency - Current latency in ms
   */
  handleLatency(roundId, latency) {
    if (latency > this.LATENCY_THRESHOLD) {
      console.warn(`High latency detected for round ${roundId}: ${latency}ms`);
      
      // Increase batch delay to reduce message frequency
      this.BATCH_DELAY = Math.min(200, this.BATCH_DELAY * 1.5);
      
      // Notify clients of degraded performance
      this.broadcastAction(roundId, 'latency_warning', {
        latency,
        message: 'Network latency detected. Updates may be delayed.'
      }, { batch: false });
    } else {
      // Reset batch delay to normal
      this.BATCH_DELAY = 50;
    }
  }

  /**
   * Get synchronization statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeQueues: this.messageQueue.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce(
        (sum, queue) => sum + queue.length, 0
      ),
      activeTimers: this.updateTimers.size
    };
  }

  /**
   * Cleanup resources for a round
   * @param {string} roundId - Round identifier
   */
  cleanup(roundId) {
    // Flush any pending messages
    this.flushMessageQueue(roundId);
    
    // Clear timers
    const timer = this.updateTimers.get(roundId);
    if (timer) {
      clearTimeout(timer);
      this.updateTimers.delete(roundId);
    }
    
    // Clear queue
    this.messageQueue.delete(roundId);
    
    console.log(`Cleaned up real-time sync for round ${roundId}`);
  }
}

module.exports = RealTimeSyncSystem;
