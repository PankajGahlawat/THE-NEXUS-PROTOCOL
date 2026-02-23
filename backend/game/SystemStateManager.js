/**
 * System State Manager
 * 
 * Manages the state of all target systems in the cyber range.
 * Tracks system configurations, compromises, and modifications.
 * Provides concurrency control for state updates.
 * 
 * Requirements: 13.1-13.7
 */

class SystemStateManager {
  constructor(database) {
    this.database = database;
    this.stateCache = new Map(); // roundId -> Map<systemId, state>
    this.updateQueue = new Map(); // roundId -> Promise (for serialization)
  }

  /**
   * Initialize system state for a round
   * Requirements: 13.1
   */
  async initializeRoundState(roundId, systems) {
    const roundCache = new Map();
    const states = [];

    for (const system of systems) {
      const state = {
        system_id: system.id,
        round_id: roundId,
        ip_address: system.ip,
        tier: system.tier,
        services: system.services || [],
        compromised: false,
        compromise_level: 0,
        files_modified: [],
        users: system.users || ['root', 'admin'],
        firewall_rules: system.firewall_rules || [],
        processes: system.processes || [],
        network_connections: [],
        last_modified: new Date().toISOString(),
        baseline_snapshot: system.baseline_snapshot || 'baseline-001'
      };

      states.push(state);
      roundCache.set(system.id, state);
    }

    this.stateCache.set(roundId, roundCache);

    // Persist to database
    if (this.database) {
      for (const state of states) {
        await this.database.run(
          `INSERT INTO system_states (
            system_id, round_id, ip_address, tier, services, compromised,
            compromise_level, files_modified, users, firewall_rules,
            processes, network_connections, last_modified, baseline_snapshot
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            state.system_id,
            state.round_id,
            state.ip_address,
            state.tier,
            JSON.stringify(state.services),
            state.compromised ? 1 : 0,
            state.compromise_level,
            JSON.stringify(state.files_modified),
            JSON.stringify(state.users),
            JSON.stringify(state.firewall_rules),
            JSON.stringify(state.processes),
            JSON.stringify(state.network_connections),
            state.last_modified,
            state.baseline_snapshot
          ]
        );
      }
    }

    return states;
  }

  /**
   * Update system state with concurrency control
   * Requirements: 13.2, 13.3, 13.7
   */
  async updateSystemState(roundId, systemId, updates) {
    // Serialize updates for this round to prevent race conditions
    const queueKey = `${roundId}:${systemId}`;
    
    // Wait for any pending updates to complete
    if (this.updateQueue.has(queueKey)) {
      await this.updateQueue.get(queueKey);
    }

    // Create new update promise
    const updatePromise = this._performUpdate(roundId, systemId, updates);
    this.updateQueue.set(queueKey, updatePromise);

    try {
      const result = await updatePromise;
      return result;
    } finally {
      this.updateQueue.delete(queueKey);
    }
  }

  /**
   * Internal method to perform the actual update
   */
  async _performUpdate(roundId, systemId, updates) {
    const roundCache = this.stateCache.get(roundId);
    if (!roundCache) {
      throw new Error(`Round ${roundId} not initialized`);
    }

    const currentState = roundCache.get(systemId);
    if (!currentState) {
      throw new Error(`System ${systemId} not found in round ${roundId}`);
    }

    // Apply updates
    const newState = {
      ...currentState,
      ...updates,
      last_modified: new Date().toISOString()
    };

    // Handle array merges
    if (updates.files_modified) {
      newState.files_modified = [
        ...currentState.files_modified,
        ...updates.files_modified
      ];
    }

    if (updates.processes) {
      newState.processes = updates.processes;
    }

    if (updates.network_connections) {
      newState.network_connections = updates.network_connections;
    }

    if (updates.firewall_rules) {
      newState.firewall_rules = updates.firewall_rules;
    }

    // Update cache
    roundCache.set(systemId, newState);

    // Persist to database
    if (this.database) {
      await this.database.run(
        `UPDATE system_states SET
          services = ?,
          compromised = ?,
          compromise_level = ?,
          files_modified = ?,
          users = ?,
          firewall_rules = ?,
          processes = ?,
          network_connections = ?,
          last_modified = ?
        WHERE round_id = ? AND system_id = ?`,
        [
          JSON.stringify(newState.services),
          newState.compromised ? 1 : 0,
          newState.compromise_level,
          JSON.stringify(newState.files_modified),
          JSON.stringify(newState.users),
          JSON.stringify(newState.firewall_rules),
          JSON.stringify(newState.processes),
          JSON.stringify(newState.network_connections),
          newState.last_modified,
          roundId,
          systemId
        ]
      );
    }

    return newState;
  }

  /**
   * Query system state
   * Requirements: 13.4
   */
  async getSystemState(roundId, systemId) {
    const roundCache = this.stateCache.get(roundId);
    if (roundCache && roundCache.has(systemId)) {
      return roundCache.get(systemId);
    }

    // Load from database if not in cache
    if (this.database) {
      const row = await this.database.get(
        `SELECT * FROM system_states WHERE round_id = ? AND system_id = ?`,
        [roundId, systemId]
      );

      if (row) {
        const state = {
          system_id: row.system_id,
          round_id: row.round_id,
          ip_address: row.ip_address,
          tier: row.tier,
          services: JSON.parse(row.services),
          compromised: row.compromised === 1,
          compromise_level: row.compromise_level,
          files_modified: JSON.parse(row.files_modified),
          users: JSON.parse(row.users),
          firewall_rules: JSON.parse(row.firewall_rules),
          processes: JSON.parse(row.processes),
          network_connections: JSON.parse(row.network_connections),
          last_modified: row.last_modified,
          baseline_snapshot: row.baseline_snapshot
        };

        // Update cache
        if (!roundCache) {
          this.stateCache.set(roundId, new Map());
        }
        this.stateCache.get(roundId).set(systemId, state);

        return state;
      }
    }

    return null;
  }

  /**
   * Get all system states for a round
   */
  async getRoundStates(roundId) {
    const roundCache = this.stateCache.get(roundId);
    if (roundCache) {
      return Array.from(roundCache.values());
    }

    // Load from database
    if (this.database) {
      const rows = await this.database.all(
        `SELECT * FROM system_states WHERE round_id = ?`,
        [roundId]
      );

      const states = rows.map(row => ({
        system_id: row.system_id,
        round_id: row.round_id,
        ip_address: row.ip_address,
        tier: row.tier,
        services: JSON.parse(row.services),
        compromised: row.compromised === 1,
        compromise_level: row.compromise_level,
        files_modified: JSON.parse(row.files_modified),
        users: JSON.parse(row.users),
        firewall_rules: JSON.parse(row.firewall_rules),
        processes: JSON.parse(row.processes),
        network_connections: JSON.parse(row.network_connections),
        last_modified: row.last_modified,
        baseline_snapshot: row.baseline_snapshot
      }));

      // Update cache
      const newCache = new Map();
      states.forEach(state => newCache.set(state.system_id, state));
      this.stateCache.set(roundId, newCache);

      return states;
    }

    return [];
  }

  /**
   * Mark system as compromised
   * Requirements: 13.5
   */
  async markCompromised(roundId, systemId, compromiseLevel = 1) {
    return await this.updateSystemState(roundId, systemId, {
      compromised: true,
      compromise_level: compromiseLevel
    });
  }

  /**
   * Restore system to baseline
   * Requirements: 13.6
   */
  async restoreSystem(roundId, systemId) {
    const currentState = await this.getSystemState(roundId, systemId);
    if (!currentState) {
      throw new Error(`System ${systemId} not found`);
    }

    // Reset to baseline configuration
    return await this.updateSystemState(roundId, systemId, {
      compromised: false,
      compromise_level: 0,
      files_modified: [],
      processes: [],
      network_connections: [],
      services: currentState.services.map(s => ({ ...s, status: 'running' }))
    });
  }

  /**
   * Add file modification record
   */
  async recordFileModification(roundId, systemId, filePath, operation) {
    const currentState = await this.getSystemState(roundId, systemId);
    if (!currentState) {
      throw new Error(`System ${systemId} not found`);
    }

    const modification = {
      path: filePath,
      operation,
      timestamp: new Date().toISOString()
    };

    return await this.updateSystemState(roundId, systemId, {
      files_modified: [modification]
    });
  }

  /**
   * Update firewall rules
   */
  async updateFirewallRules(roundId, systemId, rules) {
    return await this.updateSystemState(roundId, systemId, {
      firewall_rules: rules
    });
  }

  /**
   * Update running processes
   */
  async updateProcesses(roundId, systemId, processes) {
    return await this.updateSystemState(roundId, systemId, {
      processes
    });
  }

  /**
   * Update network connections
   */
  async updateNetworkConnections(roundId, systemId, connections) {
    return await this.updateSystemState(roundId, systemId, {
      network_connections: connections
    });
  }

  /**
   * Clear round cache
   */
  clearRoundCache(roundId) {
    this.stateCache.delete(roundId);
    
    // Clear any pending updates for this round
    const keysToDelete = [];
    for (const key of this.updateQueue.keys()) {
      if (key.startsWith(`${roundId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.updateQueue.delete(key));
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      cachedRounds: this.stateCache.size,
      pendingUpdates: this.updateQueue.size,
      totalCachedSystems: Array.from(this.stateCache.values())
        .reduce((sum, cache) => sum + cache.size, 0)
    };
  }
}

module.exports = SystemStateManager;
