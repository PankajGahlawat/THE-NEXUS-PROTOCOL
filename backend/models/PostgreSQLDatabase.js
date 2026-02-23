/**
 * NEXUS PROTOCOL - PostgreSQL Database Adapter
 * Implements the Database interface with connection pooling and prepared statements
 * Version: 1.0.0
 * Date: February 19, 2026
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class PostgreSQLDatabase {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.POSTGRES_HOST || 'localhost',
      port: config.port || process.env.POSTGRES_PORT || 5432,
      database: config.database || process.env.POSTGRES_DB || 'nexus_protocol',
      user: config.user || process.env.POSTGRES_USER || 'nexus',
      password: config.password || process.env.POSTGRES_PASSWORD || '',
      min: config.min || 10,
      max: config.max || 50,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
    };

    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.pool = new Pool(this.config);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log('✅ PostgreSQL connection pool initialized');
      console.log(`   Database: ${this.config.database}`);
      console.log(`   Pool size: ${this.config.min}-${this.config.max} connections`);

      // Set up error handler
      this.pool.on('error', (err) => {
        console.error('❌ Unexpected PostgreSQL pool error:', err);
        this.isConnected = false;
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize PostgreSQL:', error.message);
      throw error;
    }
  }

  /**
   * Run migration scripts
   */
  async runMigrations() {
    try {
      const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
      const sql = await fs.readFile(migrationPath, 'utf8');
      
      await this.pool.query(sql);
      console.log('✅ Database migrations completed');
      
      return true;
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Close database connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('✅ PostgreSQL connection pool closed');
    }
  }

  // ============================================================================
  // ROUND OPERATIONS
  // ============================================================================

  /**
   * Create a new round
   */
  async createRound(roundData) {
    const query = `
      INSERT INTO rounds (
        id, current_phase, phase_start_time, red_team_id, blue_team_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      roundData.id,
      roundData.currentPhase || 'initial_access',
      roundData.phaseStartTime || new Date(),
      roundData.redTeamId,
      roundData.blueTeamId,
      roundData.status || 'active'
    ];

    const result = await this.pool.query(query, values);
    return this.mapRoundFromDb(result.rows[0]);
  }

  /**
   * Get round by ID
   */
  async getRound(roundId) {
    const query = 'SELECT * FROM rounds WHERE id = $1';
    const result = await this.pool.query(query, [roundId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRoundFromDb(result.rows[0]);
  }

  /**
   * Update round
   */
  async updateRound(roundId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    Object.entries(updates).forEach(([key, value]) => {
      const dbKey = this.camelToSnake(key);
      fields.push(`${dbKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    if (fields.length === 0) {
      return this.getRound(roundId);
    }

    values.push(roundId);
    const query = `
      UPDATE rounds 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.mapRoundFromDb(result.rows[0]);
  }

  /**
   * Get active rounds
   */
  async getActiveRounds() {
    const query = 'SELECT * FROM rounds WHERE status = $1 ORDER BY start_time DESC';
    const result = await this.pool.query(query, ['active']);
    return result.rows.map(row => this.mapRoundFromDb(row));
  }

  // ============================================================================
  // TASK OPERATIONS
  // ============================================================================

  /**
   * Create a task
   */
  async createTask(taskData) {
    const query = `
      INSERT INTO tasks (
        id, round_id, task_type, phase, agent_type, team_type, 
        status, prerequisites, validation_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      taskData.id,
      taskData.roundId,
      taskData.taskType,
      taskData.phase,
      taskData.agentType,
      taskData.teamType,
      taskData.status || 'locked',
      JSON.stringify(taskData.prerequisites || []),
      taskData.validationData ? JSON.stringify(taskData.validationData) : null
    ];

    const result = await this.pool.query(query, values);
    return this.mapTaskFromDb(result.rows[0]);
  }

  /**
   * Get tasks for a round
   */
  async getTasksForRound(roundId, filters = {}) {
    let query = 'SELECT * FROM tasks WHERE round_id = $1';
    const values = [roundId];
    let paramIndex = 2;

    if (filters.phase) {
      query += ` AND phase = $${paramIndex}`;
      values.push(filters.phase);
      paramIndex++;
    }

    if (filters.agentType) {
      query += ` AND agent_type = $${paramIndex}`;
      values.push(filters.agentType);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    query += ' ORDER BY created_at ASC';

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapTaskFromDb(row));
  }

  /**
   * Update task
   */
  async updateTask(taskId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      const dbKey = this.camelToSnake(key);
      if (key === 'prerequisites' || key === 'validationData') {
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(taskId);
    const query = `
      UPDATE tasks 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapTaskFromDb(result.rows[0]) : null;
  }

  // ============================================================================
  // SYSTEM STATE OPERATIONS
  // ============================================================================

  /**
   * Create or update system state
   */
  async upsertSystemState(stateData) {
    const query = `
      INSERT INTO system_states (
        round_id, system_ip, system_tier, system_name, compromised, 
        compromise_level, services, firewall_rules, persistence_mechanisms,
        modified_by, snapshot_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (round_id, system_ip) 
      DO UPDATE SET
        compromised = EXCLUDED.compromised,
        compromise_level = EXCLUDED.compromise_level,
        services = EXCLUDED.services,
        firewall_rules = EXCLUDED.firewall_rules,
        persistence_mechanisms = EXCLUDED.persistence_mechanisms,
        last_modified = NOW(),
        modified_by = EXCLUDED.modified_by
      RETURNING *
    `;

    const values = [
      stateData.roundId,
      stateData.systemIp,
      stateData.systemTier,
      stateData.systemName,
      stateData.compromised || false,
      stateData.compromiseLevel || 0,
      JSON.stringify(stateData.services || []),
      JSON.stringify(stateData.firewallRules || []),
      JSON.stringify(stateData.persistenceMechanisms || []),
      stateData.modifiedBy,
      stateData.snapshotId
    ];

    const result = await this.pool.query(query, values);
    return this.mapSystemStateFromDb(result.rows[0]);
  }

  /**
   * Get system states for a round
   */
  async getSystemStates(roundId) {
    const query = 'SELECT * FROM system_states WHERE round_id = $1 ORDER BY system_tier, system_ip';
    const result = await this.pool.query(query, [roundId]);
    return result.rows.map(row => this.mapSystemStateFromDb(row));
  }

  /**
   * Get specific system state
   */
  async getSystemState(roundId, systemIp) {
    const query = 'SELECT * FROM system_states WHERE round_id = $1 AND system_ip = $2';
    const result = await this.pool.query(query, [roundId, systemIp]);
    return result.rows.length > 0 ? this.mapSystemStateFromDb(result.rows[0]) : null;
  }

  // ============================================================================
  // EVENT OPERATIONS (Audit Trail)
  // ============================================================================

  /**
   * Log an event
   */
  async logEvent(eventData) {
    const query = `
      INSERT INTO events (
        round_id, event_type, actor_id, actor_type, target_system,
        action_details, trace_generated, observable, detected
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      eventData.roundId,
      eventData.eventType,
      eventData.actorId,
      eventData.actorType,
      eventData.targetSystem,
      JSON.stringify(eventData.actionDetails),
      eventData.traceGenerated || 0,
      eventData.observable || false,
      eventData.detected || false
    ];

    const result = await this.pool.query(query, values);
    return this.mapEventFromDb(result.rows[0]);
  }

  /**
   * Get events for a round
   */
  async getEvents(roundId, filters = {}) {
    let query = 'SELECT * FROM events WHERE round_id = $1';
    const values = [roundId];
    let paramIndex = 2;

    if (filters.eventType) {
      query += ` AND event_type = $${paramIndex}`;
      values.push(filters.eventType);
      paramIndex++;
    }

    if (filters.observable !== undefined) {
      query += ` AND observable = $${paramIndex}`;
      values.push(filters.observable);
      paramIndex++;
    }

    if (filters.detected !== undefined) {
      query += ` AND detected = $${paramIndex}`;
      values.push(filters.detected);
      paramIndex++;
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ` LIMIT ${parseInt(filters.limit)}`;
    }

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapEventFromDb(row));
  }

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  /**
   * Create or update agent
   */
  async upsertAgent(agentData) {
    const query = `
      INSERT INTO agents (
        round_id, agent_type, team_type, player_id, tasks_completed, 
        tools_used, effectiveness_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (round_id, agent_type)
      DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        tools_used = EXCLUDED.tools_used,
        effectiveness_rating = EXCLUDED.effectiveness_rating
      RETURNING *
    `;

    const values = [
      agentData.roundId,
      agentData.agentType,
      agentData.teamType,
      agentData.playerId,
      agentData.tasksCompleted || 0,
      agentData.toolsUsed || 0,
      agentData.effectivenessRating || 1.0
    ];

    const result = await this.pool.query(query, values);
    return this.mapAgentFromDb(result.rows[0]);
  }

  /**
   * Get agents for a round
   */
  async getAgents(roundId) {
    const query = 'SELECT * FROM agents WHERE round_id = $1 ORDER BY team_type, agent_type';
    const result = await this.pool.query(query, [roundId]);
    return result.rows.map(row => this.mapAgentFromDb(row));
  }

  // ============================================================================
  // TOOL OPERATIONS
  // ============================================================================

  /**
   * Get all tools
   */
  async getTools(type = null) {
    let query = 'SELECT * FROM tools';
    const values = [];

    if (type) {
      query += ' WHERE type = $1';
      values.push(type);
    }

    query += ' ORDER BY category, name';

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapToolFromDb(row));
  }

  /**
   * Log tool usage
   */
  async logToolUsage(usageData) {
    const query = `
      INSERT INTO tool_usage (
        round_id, tool_id, agent_id, target_system, success,
        effectiveness, trace_generated, cooldown_applied
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      usageData.roundId,
      usageData.toolId,
      usageData.agentId,
      usageData.targetSystem,
      usageData.success,
      usageData.effectiveness,
      usageData.traceGenerated,
      usageData.cooldownApplied
    ];

    const result = await this.pool.query(query, values);

    // Increment tool usage count
    await this.pool.query(
      'UPDATE tools SET usage_count = usage_count + 1 WHERE id = $1',
      [usageData.toolId]
    );

    return result.rows[0];
  }

  // ============================================================================
  // SCORING OPERATIONS
  // ============================================================================

  /**
   * Add score entry
   */
  async addScore(scoreData) {
    const query = `
      INSERT INTO scores (round_id, team_type, score_type, points, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      scoreData.roundId,
      scoreData.teamType,
      scoreData.scoreType,
      scoreData.points,
      scoreData.reason
    ];

    const result = await this.pool.query(query, values);

    // Update round score
    const scoreField = scoreData.teamType === 'RED' ? 'red_score' : 'blue_score';
    await this.pool.query(
      `UPDATE rounds SET ${scoreField} = ${scoreField} + $1 WHERE id = $2`,
      [scoreData.points, scoreData.roundId]
    );

    return result.rows[0];
  }

  /**
   * Get scores for a round
   */
  async getScores(roundId, teamType = null) {
    let query = 'SELECT * FROM scores WHERE round_id = $1';
    const values = [roundId];

    if (teamType) {
      query += ' AND team_type = $2';
      values.push(teamType);
    }

    query += ' ORDER BY timestamp DESC';

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Execute raw query (use with caution)
   */
  async query(sql, params = []) {
    return await this.pool.query(sql, params);
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  // ============================================================================
  // MAPPING METHODS (DB to Application Objects)
  // ============================================================================

  mapRoundFromDb(row) {
    if (!row) return null;
    return {
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      currentPhase: row.current_phase,
      phaseStartTime: row.phase_start_time,
      redTeamId: row.red_team_id,
      blueTeamId: row.blue_team_id,
      redScore: row.red_score,
      blueScore: row.blue_score,
      redTraceLevel: parseFloat(row.red_trace_level),
      redBurnState: row.red_burn_state,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  mapTaskFromDb(row) {
    if (!row) return null;
    return {
      id: row.id,
      roundId: row.round_id,
      taskType: row.task_type,
      phase: row.phase,
      agentType: row.agent_type,
      teamType: row.team_type,
      status: row.status,
      assignedTo: row.assigned_to,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      pointsAwarded: row.points_awarded,
      prerequisites: row.prerequisites,
      validationData: row.validation_data,
      createdAt: row.created_at
    };
  }

  mapSystemStateFromDb(row) {
    if (!row) return null;
    return {
      id: row.id,
      roundId: row.round_id,
      systemIp: row.system_ip,
      systemTier: row.system_tier,
      systemName: row.system_name,
      compromised: row.compromised,
      compromiseLevel: row.compromise_level,
      services: row.services,
      firewallRules: row.firewall_rules,
      persistenceMechanisms: row.persistence_mechanisms,
      lastModified: row.last_modified,
      modifiedBy: row.modified_by,
      snapshotId: row.snapshot_id
    };
  }

  mapEventFromDb(row) {
    if (!row) return null;
    return {
      id: row.id,
      roundId: row.round_id,
      eventType: row.event_type,
      actorId: row.actor_id,
      actorType: row.actor_type,
      targetSystem: row.target_system,
      actionDetails: row.action_details,
      traceGenerated: parseFloat(row.trace_generated),
      observable: row.observable,
      detected: row.detected,
      detectionTime: row.detection_time,
      timestamp: row.timestamp
    };
  }

  mapAgentFromDb(row) {
    if (!row) return null;
    return {
      id: row.id,
      roundId: row.round_id,
      agentType: row.agent_type,
      teamType: row.team_type,
      playerId: row.player_id,
      tasksCompleted: row.tasks_completed,
      toolsUsed: row.tools_used,
      effectivenessRating: parseFloat(row.effectiveness_rating),
      createdAt: row.created_at
    };
  }

  mapToolFromDb(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      baseCooldown: row.base_cooldown,
      baseEffectiveness: parseFloat(row.base_effectiveness),
      traceGeneration: parseFloat(row.trace_generation),
      observable: row.observable,
      stealthModifier: parseFloat(row.stealth_modifier),
      description: row.description,
      usageCount: row.usage_count,
      createdAt: row.created_at
    };
  }
}

module.exports = PostgreSQLDatabase;
