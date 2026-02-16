/**
 * NEXUS PROTOCOL - PostgreSQL Database Implementation
 * Production-ready database layer with proper indexing and performance optimization
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
// UUID import removed - using database-generated UUIDs

class PostgreSQLDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/nexusprotocol',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.initializeSchema();
  }

  async initializeSchema() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Teams table
      await client.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_name VARCHAR(20) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          last_active TIMESTAMP DEFAULT NOW(),
          total_missions INTEGER DEFAULT 0,
          completed_missions INTEGER DEFAULT 0,
          total_score BIGINT DEFAULT 0,
          best_score INTEGER DEFAULT 0,
          average_rank VARCHAR(10) DEFAULT 'F-RANK',
          best_rank VARCHAR(10) DEFAULT 'F-RANK',
          favorite_agent VARCHAR(20),
          achievements TEXT[] DEFAULT '{}',
          is_active BOOLEAN DEFAULT TRUE
        )
      `);

      // Sessions table with TTL
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          session_token VARCHAR(512) NOT NULL UNIQUE,
          authenticated BOOLEAN DEFAULT TRUE,
          selected_agent VARCHAR(20),
          current_mission UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL,
          last_activity TIMESTAMP DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT
        )
      `);

      // Mission instances table
      await client.query(`
        CREATE TABLE IF NOT EXISTS mission_instances (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          mission_id VARCHAR(50) NOT NULL,
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          selected_agent VARCHAR(20) NOT NULL,
          start_time TIMESTAMP NOT NULL DEFAULT NOW(),
          end_time TIMESTAMP,
          completed_at TIMESTAMP,
          status VARCHAR(20) DEFAULT 'active',
          current_phase INTEGER DEFAULT 1,
          trace_level DECIMAL(5,2) DEFAULT 0.0,
          time_remaining INTEGER,
          alarms_triggered INTEGER DEFAULT 0,
          mission_progress INTEGER DEFAULT 0,
          final_score INTEGER,
          rank VARCHAR(10),
          failure_reason VARCHAR(100),
          burn_state BOOLEAN DEFAULT FALSE,
          abilities_data JSONB DEFAULT '{}',
          stats_data JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Mission objectives table (normalized)
      await client.query(`
        CREATE TABLE IF NOT EXISTS mission_objectives (
          id SERIAL PRIMARY KEY,
          mission_instance_id UUID REFERENCES mission_instances(id) ON DELETE CASCADE,
          objective_id INTEGER NOT NULL,
          phase_id INTEGER NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          reward INTEGER DEFAULT 0,
          threat_reduction INTEGER DEFAULT 0,
          required BOOLEAN DEFAULT TRUE,
          completed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP,
          available BOOLEAN DEFAULT FALSE
        )
      `);

      // Mission events table (for audit trail)
      await client.query(`
        CREATE TABLE IF NOT EXISTS mission_events (
          id SERIAL PRIMARY KEY,
          mission_instance_id UUID REFERENCES mission_instances(id) ON DELETE CASCADE,
          event_type VARCHAR(50) NOT NULL,
          event_data JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Performance logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS performance_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          mission_instance_id UUID REFERENCES mission_instances(id) ON DELETE CASCADE,
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          final_score INTEGER NOT NULL,
          rank VARCHAR(10) NOT NULL,
          trace_level DECIMAL(5,2),
          time_used INTEGER,
          objectives_completed INTEGER[] DEFAULT '{}',
          alarms_triggered INTEGER DEFAULT 0,
          selected_agent VARCHAR(20),
          mission_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Hex shards table
      await client.query(`
        CREATE TABLE IF NOT EXISTS hex_shards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          shard_type VARCHAR(20) NOT NULL,
          quantity INTEGER DEFAULT 1,
          earned_from UUID REFERENCES mission_instances(id),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Achievements table
      await client.query(`
        CREATE TABLE IF NOT EXISTS team_achievements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          achievement_id VARCHAR(50) NOT NULL,
          unlocked_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(team_id, achievement_id)
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(team_name);
        CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(last_active);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions(team_id);
        CREATE INDEX IF NOT EXISTS idx_missions_team ON mission_instances(team_id);
        CREATE INDEX IF NOT EXISTS idx_missions_status ON mission_instances(status);
        CREATE INDEX IF NOT EXISTS idx_missions_created ON mission_instances(created_at);
        CREATE INDEX IF NOT EXISTS idx_objectives_mission ON mission_objectives(mission_instance_id);
        CREATE INDEX IF NOT EXISTS idx_objectives_completed ON mission_objectives(mission_instance_id, completed);
        CREATE INDEX IF NOT EXISTS idx_events_mission ON mission_events(mission_instance_id);
        CREATE INDEX IF NOT EXISTS idx_performance_team ON performance_logs(team_id);
        CREATE INDEX IF NOT EXISTS idx_performance_created ON performance_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_shards_team ON hex_shards(team_id);
        CREATE INDEX IF NOT EXISTS idx_achievements_team ON team_achievements(team_id);
      `);

      await client.query('COMMIT');
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Database schema initialization failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Team management
  async createTeam(teamData) {
    const client = await this.pool.connect();
    try {
      const { teamName, password } = teamData;
      const passwordHash = await bcrypt.hash(password, 12);

      const result = await client.query(
        `INSERT INTO teams (team_name, password_hash) 
         VALUES ($1, $2) 
         RETURNING id, team_name, created_at`,
        [teamName, passwordHash]
      );

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Team name already exists');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async authenticateTeam(teamName, password) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, team_name, password_hash FROM teams WHERE team_name = $1 AND is_active = TRUE',
        [teamName]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const team = result.rows[0];
      const isValid = await bcrypt.compare(password, team.password_hash);

      if (!isValid) {
        return null;
      }

      // Update last active
      await client.query(
        'UPDATE teams SET last_active = NOW() WHERE id = $1',
        [team.id]
      );

      return {
        id: team.id,
        teamName: team.team_name
      };
    } finally {
      client.release();
    }
  }

  async getTeam(teamId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, team_name, created_at, last_active, total_missions, 
                completed_missions, total_score, best_score, average_rank, 
                best_rank, favorite_agent, achievements
         FROM teams WHERE id = $1 AND is_active = TRUE`,
        [teamId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Session management with proper cleanup
  async createSession(sessionData) {
    const client = await this.pool.connect();
    try {
      const { teamId, sessionToken, ipAddress, userAgent } = sessionData;
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      // Clean up expired sessions first
      await client.query('DELETE FROM sessions WHERE expires_at < NOW()');

      // Limit sessions per team (max 3 concurrent)
      await client.query(
        `DELETE FROM sessions 
         WHERE team_id = $1 
         AND id NOT IN (
           SELECT id FROM sessions 
           WHERE team_id = $1 
           ORDER BY created_at DESC 
           LIMIT 2
         )`,
        [teamId]
      );

      const result = await client.query(
        `INSERT INTO sessions (team_id, session_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at, expires_at`,
        [teamId, sessionToken, expiresAt, ipAddress, userAgent]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async validateSession(sessionToken) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT s.id, s.team_id, s.selected_agent, s.current_mission, 
                s.expires_at, t.team_name
         FROM sessions s
         JOIN teams t ON s.team_id = t.id
         WHERE s.session_token = $1 AND s.expires_at > NOW() AND t.is_active = TRUE`,
        [sessionToken]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Update last activity
      await client.query(
        'UPDATE sessions SET last_activity = NOW() WHERE id = $1',
        [result.rows[0].id]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteSession(sessionToken) {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken]);
      return true;
    } finally {
      client.release();
    }
  }

  // Mission management
  async createMissionInstance(missionData) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { missionId, teamId, selectedAgent, duration, objectives } = missionData;
      const endTime = new Date(Date.now() + duration * 1000);

      // Create mission instance
      const missionResult = await client.query(
        `INSERT INTO mission_instances 
         (mission_id, team_id, selected_agent, end_time, time_remaining)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, start_time, end_time`,
        [missionId, teamId, selectedAgent, endTime, duration]
      );

      const missionInstanceId = missionResult.rows[0].id;

      // Create objectives
      for (const obj of objectives) {
        await client.query(
          `INSERT INTO mission_objectives 
           (mission_instance_id, objective_id, phase_id, name, description, 
            reward, threat_reduction, required, available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            missionInstanceId, obj.id, obj.phaseId, obj.name, obj.description,
            obj.reward, obj.threatReduction || 0, obj.required, obj.available
          ]
        );
      }

      await client.query('COMMIT');
      return {
        id: missionInstanceId,
        ...missionResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMissionInstance(missionInstanceId) {
    const client = await this.pool.connect();
    try {
      const missionResult = await client.query(
        `SELECT * FROM mission_instances WHERE id = $1`,
        [missionInstanceId]
      );

      if (missionResult.rows.length === 0) {
        return null;
      }

      const mission = missionResult.rows[0];

      // Get objectives
      const objectivesResult = await client.query(
        `SELECT * FROM mission_objectives 
         WHERE mission_instance_id = $1 
         ORDER BY phase_id, objective_id`,
        [missionInstanceId]
      );

      mission.objectives = objectivesResult.rows;
      return mission;
    } finally {
      client.release();
    }
  }

  async completeObjective(missionInstanceId, objectiveId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Complete the objective
      const result = await client.query(
        `UPDATE mission_objectives 
         SET completed = TRUE, completed_at = NOW()
         WHERE mission_instance_id = $1 AND objective_id = $2 AND completed = FALSE
         RETURNING *`,
        [missionInstanceId, objectiveId]
      );

      if (result.rows.length === 0) {
        throw new Error('Objective not found or already completed');
      }

      const objective = result.rows[0];

      // Update mission progress
      await client.query(
        `UPDATE mission_instances 
         SET mission_progress = mission_progress + $1,
             trace_level = GREATEST(0, trace_level - $2)
         WHERE id = $3`,
        [objective.reward, objective.threat_reduction || 0, missionInstanceId]
      );

      // Log event
      await client.query(
        `INSERT INTO mission_events (mission_instance_id, event_type, event_data)
         VALUES ($1, 'objective_completed', $2)`,
        [missionInstanceId, JSON.stringify({ objectiveId, reward: objective.reward })]
      );

      await client.query('COMMIT');
      return objective;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Performance and analytics
  async createPerformanceLog(logData) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO performance_logs 
         (mission_instance_id, team_id, final_score, rank, trace_level, 
          time_used, objectives_completed, alarms_triggered, selected_agent, mission_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          logData.missionInstanceId, logData.teamId, logData.finalScore,
          logData.rank, logData.traceLevel, logData.timeUsed,
          logData.objectivesCompleted, logData.alarmsTriggered,
          logData.selectedAgent, logData.missionType
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getActivityFeed(limit = 50) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          me.event_type,
          me.event_data,
          me.created_at,
          t.team_name,
          mi.mission_id,
          mi.selected_agent
        FROM mission_events me
        JOIN mission_instances mi ON me.mission_instance_id = mi.id
        JOIN teams t ON mi.team_id = t.id
        ORDER BY me.created_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => ({
        type: row.event_type,
        team: row.team_name,
        mission: row.mission_id,
        agent: row.selected_agent,
        data: row.event_data,
        timestamp: row.created_at
      }));
    } finally {
      client.release();
    }
  }

  async getLeaderboard(limit = 10, timeframe = 'all') {
    const client = await this.pool.connect();
    try {
      let timeFilter = '';
      if (timeframe === 'weekly') {
        timeFilter = "AND pl.created_at > NOW() - INTERVAL '7 days'";
      } else if (timeframe === 'monthly') {
        timeFilter = "AND pl.created_at > NOW() - INTERVAL '30 days'";
      }

      const result = await client.query(`
        SELECT 
          t.team_name,
          COUNT(pl.id) as missions_completed,
          SUM(pl.final_score) as total_score,
          MAX(pl.final_score) as best_score,
          ROUND(AVG(pl.final_score)) as average_score,
          t.last_active
        FROM teams t
        JOIN performance_logs pl ON t.id = pl.team_id
        WHERE t.is_active = TRUE ${timeFilter}
        GROUP BY t.id, t.team_name, t.last_active
        ORDER BY total_score DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map((row, index) => ({
        rank: index + 1,
        teamName: row.team_name,
        score: parseInt(row.total_score),
        missionsCompleted: parseInt(row.missions_completed),
        bestScore: parseInt(row.best_score),
        averageScore: parseInt(row.average_score),
        lastActive: row.last_active
      }));
    } finally {
      client.release();
    }
  }

  // Cleanup methods
  async cleanupExpiredSessions() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM sessions WHERE expires_at < NOW()');
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  async cleanupOldMissions(daysToKeep = 30) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM mission_instances 
         WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
         AND status IN ('completed', 'failed', 'burned')`
      );
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  // Health check
  async healthCheck() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW() as server_time');
      return {
        status: 'healthy',
        serverTime: result.rows[0].server_time,
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingClients: this.pool.waitingCount
      };
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = PostgreSQLDatabase;