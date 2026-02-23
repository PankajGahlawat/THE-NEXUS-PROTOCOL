/**
 * Emergency Kill Switch
 * 
 * Provides emergency shutdown capabilities for the system.
 * Terminates all rounds, disconnects clients, and persists state.
 * 
 * Requirements: 15.6, 15.7, 15.8, 9.10
 */

class KillSwitch {
  constructor(options = {}) {
    this.database = options.database;
    this.realTimeSync = options.realTimeSync;
    this.logger = options.logger || console;
    this.notificationService = options.notificationService;
    
    this.isActivated = false;
    this.activationTime = null;
    this.activationReason = null;
    this.activatedBy = null;
  }

  /**
   * Activate emergency kill switch
   * Requirements: 15.6, 15.7, 15.8
   */
  async activate(reason, activatedBy = 'system') {
    if (this.isActivated) {
      this.logger.warn('Kill switch already activated');
      return {
        success: false,
        message: 'Kill switch already activated',
        activationTime: this.activationTime
      };
    }

    this.logger.error(`🚨 EMERGENCY KILL SWITCH ACTIVATED 🚨`);
    this.logger.error(`Reason: ${reason}`);
    this.logger.error(`Activated by: ${activatedBy}`);

    this.isActivated = true;
    this.activationTime = new Date().toISOString();
    this.activationReason = reason;
    this.activatedBy = activatedBy;

    const results = {
      roundsTerminated: 0,
      clientsDisconnected: 0,
      statesPersisted: 0,
      errors: []
    };

    try {
      // Step 1: Get all active rounds
      this.logger.info('Step 1: Identifying active rounds...');
      const activeRounds = await this.getActiveRounds();
      this.logger.info(`Found ${activeRounds.length} active rounds`);

      // Step 2: Persist current state for all rounds
      this.logger.info('Step 2: Persisting round states...');
      for (const round of activeRounds) {
        try {
          await this.persistRoundState(round);
          results.statesPersisted++;
        } catch (error) {
          this.logger.error(`Failed to persist state for round ${round.id}:`, error);
          results.errors.push({
            type: 'STATE_PERSISTENCE',
            roundId: round.id,
            error: error.message
          });
        }
      }

      // Step 3: Disconnect all WebSocket clients
      this.logger.info('Step 3: Disconnecting all clients...');
      if (this.realTimeSync) {
        try {
          const disconnected = await this.disconnectAllClients();
          results.clientsDisconnected = disconnected;
        } catch (error) {
          this.logger.error('Failed to disconnect clients:', error);
          results.errors.push({
            type: 'CLIENT_DISCONNECTION',
            error: error.message
          });
        }
      }

      // Step 4: Terminate all rounds
      this.logger.info('Step 4: Terminating all rounds...');
      for (const round of activeRounds) {
        try {
          await this.terminateRound(round);
          results.roundsTerminated++;
        } catch (error) {
          this.logger.error(`Failed to terminate round ${round.id}:`, error);
          results.errors.push({
            type: 'ROUND_TERMINATION',
            roundId: round.id,
            error: error.message
          });
        }
      }

      // Step 5: Notify operators
      this.logger.info('Step 5: Notifying operators...');
      await this.notifyOperators(reason, results);

      this.logger.info('🚨 Emergency shutdown complete 🚨');
      this.logger.info(`Results: ${results.roundsTerminated} rounds terminated, ${results.clientsDisconnected} clients disconnected, ${results.statesPersisted} states persisted`);

      return {
        success: true,
        message: 'Emergency shutdown completed',
        activationTime: this.activationTime,
        reason: this.activationReason,
        activatedBy: this.activatedBy,
        results
      };

    } catch (error) {
      this.logger.error('Critical error during emergency shutdown:', error);
      results.errors.push({
        type: 'CRITICAL',
        error: error.message
      });

      return {
        success: false,
        message: 'Emergency shutdown encountered critical errors',
        activationTime: this.activationTime,
        reason: this.activationReason,
        activatedBy: this.activatedBy,
        results
      };
    }
  }

  /**
   * Get all active rounds
   */
  async getActiveRounds() {
    if (!this.database) {
      return [];
    }

    try {
      const rounds = await this.database.all(
        `SELECT * FROM rounds WHERE status IN ('active', 'in_progress')`,
        []
      );
      return rounds || [];
    } catch (error) {
      this.logger.error('Failed to get active rounds:', error);
      return [];
    }
  }

  /**
   * Persist round state before shutdown
   * Requirements: 15.8
   */
  async persistRoundState(round) {
    if (!this.database) {
      return;
    }

    const snapshot = {
      round_id: round.id,
      snapshot_time: new Date().toISOString(),
      status: round.status,
      phase: round.phase,
      time_remaining: round.time_remaining,
      shutdown_reason: this.activationReason
    };

    await this.database.run(
      `INSERT INTO round_snapshots (
        round_id, snapshot_time, status, phase, 
        time_remaining, shutdown_reason
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        snapshot.round_id,
        snapshot.snapshot_time,
        snapshot.status,
        snapshot.phase,
        snapshot.time_remaining,
        snapshot.shutdown_reason
      ]
    );

    this.logger.info(`State persisted for round ${round.id}`);
  }

  /**
   * Disconnect all WebSocket clients
   * Requirements: 15.7
   */
  async disconnectAllClients() {
    if (!this.realTimeSync || !this.realTimeSync.io) {
      return 0;
    }

    // Broadcast shutdown message to all clients
    this.realTimeSync.io.emit('emergency_shutdown', {
      reason: this.activationReason,
      message: 'The system is undergoing emergency maintenance. Please reconnect later.',
      timestamp: this.activationTime
    });

    // Wait for message to be sent
    await this.sleep(1000);

    // Disconnect all sockets
    const sockets = await this.realTimeSync.io.fetchSockets();
    let disconnected = 0;

    for (const socket of sockets) {
      try {
        socket.disconnect(true);
        disconnected++;
      } catch (error) {
        this.logger.error(`Failed to disconnect socket ${socket.id}:`, error);
      }
    }

    this.logger.info(`Disconnected ${disconnected} clients`);
    return disconnected;
  }

  /**
   * Terminate a round
   * Requirements: 15.6
   */
  async terminateRound(round) {
    if (!this.database) {
      return;
    }

    await this.database.run(
      `UPDATE rounds SET 
        status = 'terminated',
        end_time = ?,
        termination_reason = ?
       WHERE id = ?`,
      [
        new Date().toISOString(),
        this.activationReason,
        round.id
      ]
    );

    this.logger.info(`Round ${round.id} terminated`);
  }

  /**
   * Notify operators of emergency shutdown
   */
  async notifyOperators(reason, results) {
    const notification = {
      type: 'EMERGENCY_SHUTDOWN',
      severity: 'CRITICAL',
      timestamp: this.activationTime,
      reason,
      activatedBy: this.activatedBy,
      results: {
        roundsTerminated: results.roundsTerminated,
        clientsDisconnected: results.clientsDisconnected,
        statesPersisted: results.statesPersisted,
        errors: results.errors.length
      }
    };

    // Log notification
    this.logger.error('OPERATOR NOTIFICATION:', JSON.stringify(notification, null, 2));

    // Send via notification service if available
    if (this.notificationService) {
      try {
        await this.notificationService.send(notification);
      } catch (error) {
        this.logger.error('Failed to send operator notification:', error);
      }
    }
  }

  /**
   * Check if kill switch is activated
   */
  isActive() {
    return this.isActivated;
  }

  /**
   * Get activation status
   */
  getStatus() {
    return {
      isActivated: this.isActivated,
      activationTime: this.activationTime,
      activationReason: this.activationReason,
      activatedBy: this.activatedBy
    };
  }

  /**
   * Reset kill switch (for testing only)
   */
  reset() {
    this.isActivated = false;
    this.activationTime = null;
    this.activationReason = null;
    this.activatedBy = null;
    this.logger.info('Kill switch reset');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = KillSwitch;
