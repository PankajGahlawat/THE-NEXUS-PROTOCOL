/**
 * NEXUS PROTOCOL - SQLite to PostgreSQL Migration Script
 * Migrates existing game data from SQLite to PostgreSQL
 * Version: 1.0.0
 * Date: February 19, 2026
 */

const SQLiteDatabase = require('../models/SQLiteDatabase');
const PostgreSQLDatabase = require('../models/PostgreSQLDatabase');
const path = require('path');

class DatabaseMigrator {
  constructor() {
    this.sqliteDb = null;
    this.postgresDb = null;
    this.stats = {
      rounds: 0,
      tasks: 0,
      systemStates: 0,
      events: 0,
      agents: 0,
      errors: []
    };
  }

  /**
   * Initialize both databases
   */
  async initialize() {
    console.log('🔄 Initializing databases...\n');

    // Initialize SQLite (source)
    this.sqliteDb = new SQLiteDatabase({
      filename: path.join(__dirname, '../nexus_protocol.db')
    });
    await this.sqliteDb.initialize();

    // Initialize PostgreSQL (destination)
    this.postgresDb = new PostgreSQLDatabase();
    await this.postgresDb.initialize();
    await this.postgresDb.runMigrations();

    console.log('✅ Both databases initialized\n');
  }

  /**
   * Export data from SQLite
   */
  async exportFromSQLite() {
    console.log('📤 Exporting data from SQLite...\n');

    try {
      // Export rounds
      const roundsQuery = 'SELECT * FROM rounds ORDER BY created_at';
      const rounds = await this.sqliteDb.query(roundsQuery);
      console.log(`   Found ${rounds.length} rounds`);

      // Export tasks
      const tasksQuery = 'SELECT * FROM tasks ORDER BY created_at';
      const tasks = await this.sqliteDb.query(tasksQuery);
      console.log(`   Found ${tasks.length} tasks`);

      // Export system states
      const statesQuery = 'SELECT * FROM system_states ORDER BY last_modified';
      const systemStates = await this.sqliteDb.query(statesQuery);
      console.log(`   Found ${systemStates.length} system states`);

      // Export events
      const eventsQuery = 'SELECT * FROM events ORDER BY timestamp';
      const events = await this.sqliteDb.query(eventsQuery);
      console.log(`   Found ${events.length} events`);

      // Export agents
      const agentsQuery = 'SELECT * FROM agents ORDER BY created_at';
      const agents = await this.sqliteDb.query(agentsQuery);
      console.log(`   Found ${agents.length} agents\n`);

      return {
        rounds,
        tasks,
        systemStates,
        events,
        agents
      };
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      throw error;
    }
  }

  /**
   * Transform SQLite data to PostgreSQL format
   */
  transformData(data) {
    console.log('🔄 Transforming data...\n');

    const transformed = {
      rounds: [],
      tasks: [],
      systemStates: [],
      events: [],
      agents: []
    };

    // Transform rounds
    data.rounds.forEach(round => {
      transformed.rounds.push({
        id: round.id,
        currentPhase: round.current_phase || 'initial_access',
        phaseStartTime: round.phase_start_time ? new Date(round.phase_start_time) : new Date(),
        redTeamId: round.red_team_id || 'default-red-team',
        blueTeamId: round.blue_team_id || 'default-blue-team',
        redScore: round.red_score || 0,
        blueScore: round.blue_score || 0,
        status: round.status || 'active'
      });
    });

    // Transform tasks
    data.tasks.forEach(task => {
      transformed.tasks.push({
        id: task.id,
        roundId: task.round_id,
        taskType: task.task_type,
        phase: task.phase || 'initial_access',
        agentType: task.agent_type || 'ARCHITECT',
        teamType: task.team_type || 'RED',
        status: task.status || 'locked',
        prerequisites: task.prerequisites ? JSON.parse(task.prerequisites) : [],
        validationData: task.validation_data ? JSON.parse(task.validation_data) : null
      });
    });

    // Transform system states
    data.systemStates.forEach(state => {
      transformed.systemStates.push({
        roundId: state.round_id,
        systemIp: state.system_ip,
        systemTier: state.system_tier || 'tier1',
        systemName: state.system_name || `System-${state.system_ip}`,
        compromised: state.compromised === 1 || state.compromised === true,
        compromiseLevel: state.compromise_level || 0,
        services: state.services ? JSON.parse(state.services) : [],
        firewallRules: state.firewall_rules ? JSON.parse(state.firewall_rules) : [],
        persistenceMechanisms: state.persistence_mechanisms ? JSON.parse(state.persistence_mechanisms) : [],
        modifiedBy: state.modified_by,
        snapshotId: state.snapshot_id
      });
    });

    // Transform events
    data.events.forEach(event => {
      transformed.events.push({
        roundId: event.round_id,
        eventType: event.event_type,
        actorId: event.actor_id,
        actorType: event.actor_type || 'ARCHITECT',
        targetSystem: event.target_system,
        actionDetails: event.action_details ? JSON.parse(event.action_details) : {},
        traceGenerated: event.trace_generated || 0,
        observable: event.observable === 1 || event.observable === true,
        detected: event.detected === 1 || event.detected === true
      });
    });

    // Transform agents
    data.agents.forEach(agent => {
      transformed.agents.push({
        roundId: agent.round_id,
        agentType: agent.agent_type,
        teamType: agent.team_type || 'RED',
        playerId: agent.player_id,
        tasksCompleted: agent.tasks_completed || 0,
        toolsUsed: agent.tools_used || 0,
        effectivenessRating: agent.effectiveness_rating || 1.0
      });
    });

    console.log('✅ Data transformation complete\n');
    return transformed;
  }

  /**
   * Import data to PostgreSQL
   */
  async importToPostgreSQL(data) {
    console.log('📥 Importing data to PostgreSQL...\n');

    const client = await this.postgresDb.beginTransaction();

    try {
      // Import rounds
      console.log('   Importing rounds...');
      for (const round of data.rounds) {
        try {
          await this.postgresDb.createRound(round);
          this.stats.rounds++;
        } catch (error) {
          this.stats.errors.push(`Round ${round.id}: ${error.message}`);
        }
      }
      console.log(`   ✅ Imported ${this.stats.rounds} rounds`);

      // Import tasks
      console.log('   Importing tasks...');
      for (const task of data.tasks) {
        try {
          await this.postgresDb.createTask(task);
          this.stats.tasks++;
        } catch (error) {
          this.stats.errors.push(`Task ${task.id}: ${error.message}`);
        }
      }
      console.log(`   ✅ Imported ${this.stats.tasks} tasks`);

      // Import system states
      console.log('   Importing system states...');
      for (const state of data.systemStates) {
        try {
          await this.postgresDb.upsertSystemState(state);
          this.stats.systemStates++;
        } catch (error) {
          this.stats.errors.push(`System state ${state.systemIp}: ${error.message}`);
        }
      }
      console.log(`   ✅ Imported ${this.stats.systemStates} system states`);

      // Import events
      console.log('   Importing events...');
      for (const event of data.events) {
        try {
          await this.postgresDb.logEvent(event);
          this.stats.events++;
        } catch (error) {
          this.stats.errors.push(`Event: ${error.message}`);
        }
      }
      console.log(`   ✅ Imported ${this.stats.events} events`);

      // Import agents
      console.log('   Importing agents...');
      for (const agent of data.agents) {
        try {
          await this.postgresDb.upsertAgent(agent);
          this.stats.agents++;
        } catch (error) {
          this.stats.errors.push(`Agent ${agent.agentType}: ${error.message}`);
        }
      }
      console.log(`   ✅ Imported ${this.stats.agents} agents\n`);

      await this.postgresDb.commitTransaction(client);
      console.log('✅ Import complete\n');
    } catch (error) {
      await this.postgresDb.rollbackTransaction(client);
      console.error('❌ Import failed, rolling back:', error.message);
      throw error;
    }
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity() {
    console.log('🔍 Verifying data integrity...\n');

    try {
      // Verify rounds
      const pgRounds = await this.postgresDb.query('SELECT COUNT(*) as count FROM rounds');
      console.log(`   PostgreSQL rounds: ${pgRounds.rows[0].count}`);
      console.log(`   Migrated rounds: ${this.stats.rounds}`);

      // Verify tasks
      const pgTasks = await this.postgresDb.query('SELECT COUNT(*) as count FROM tasks');
      console.log(`   PostgreSQL tasks: ${pgTasks.rows[0].count}`);
      console.log(`   Migrated tasks: ${this.stats.tasks}`);

      // Verify system states
      const pgStates = await this.postgresDb.query('SELECT COUNT(*) as count FROM system_states');
      console.log(`   PostgreSQL system states: ${pgStates.rows[0].count}`);
      console.log(`   Migrated system states: ${this.stats.systemStates}`);

      // Verify events
      const pgEvents = await this.postgresDb.query('SELECT COUNT(*) as count FROM events');
      console.log(`   PostgreSQL events: ${pgEvents.rows[0].count}`);
      console.log(`   Migrated events: ${this.stats.events}`);

      // Verify agents
      const pgAgents = await this.postgresDb.query('SELECT COUNT(*) as count FROM agents');
      console.log(`   PostgreSQL agents: ${pgAgents.rows[0].count}`);
      console.log(`   Migrated agents: ${this.stats.agents}\n`);

      const allMatch = 
        parseInt(pgRounds.rows[0].count) === this.stats.rounds &&
        parseInt(pgTasks.rows[0].count) === this.stats.tasks &&
        parseInt(pgStates.rows[0].count) === this.stats.systemStates &&
        parseInt(pgEvents.rows[0].count) === this.stats.events &&
        parseInt(pgAgents.rows[0].count) === this.stats.agents;

      if (allMatch) {
        console.log('✅ Data integrity verified - all counts match!\n');
      } else {
        console.log('⚠️  Warning: Some counts do not match\n');
      }

      return allMatch;
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      return false;
    }
  }

  /**
   * Print migration summary
   */
  printSummary() {
    console.log('=' .repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Rounds migrated:        ${this.stats.rounds}`);
    console.log(`Tasks migrated:         ${this.stats.tasks}`);
    console.log(`System states migrated: ${this.stats.systemStates}`);
    console.log(`Events migrated:        ${this.stats.events}`);
    console.log(`Agents migrated:        ${this.stats.agents}`);
    console.log(`Errors encountered:     ${this.stats.errors.length}`);
    console.log('=' .repeat(60));

    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      this.stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
  }

  /**
   * Run complete migration
   */
  async migrate() {
    const startTime = Date.now();

    try {
      console.log('\n' + '='.repeat(60));
      console.log('NEXUS PROTOCOL - DATABASE MIGRATION');
      console.log('SQLite → PostgreSQL');
      console.log('='.repeat(60) + '\n');

      // Step 1: Initialize
      await this.initialize();

      // Step 2: Export from SQLite
      const exportedData = await this.exportFromSQLite();

      // Step 3: Transform data
      const transformedData = this.transformData(exportedData);

      // Step 4: Import to PostgreSQL
      await this.importToPostgreSQL(transformedData);

      // Step 5: Verify integrity
      await this.verifyIntegrity();

      // Step 6: Print summary
      this.printSummary();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Migration completed in ${duration}s\n`);

      return true;
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      console.error(error.stack);
      return false;
    } finally {
      // Close connections
      if (this.sqliteDb) {
        await this.sqliteDb.close();
      }
      if (this.postgresDb) {
        await this.postgresDb.close();
      }
    }
  }
}

// Run migration if executed directly
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  
  migrator.migrate()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = DatabaseMigrator;
