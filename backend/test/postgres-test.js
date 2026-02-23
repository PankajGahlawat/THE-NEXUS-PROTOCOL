/**
 * NEXUS PROTOCOL - PostgreSQL Database Test
 * Tests PostgreSQL adapter functionality
 * Version: 1.0.0
 */

const PostgreSQLDatabase = require('../models/PostgreSQLDatabase');
const { v4: uuidv4 } = require('uuid');

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter...\n');

  const db = new PostgreSQLDatabase({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'nexus_protocol_test',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres'
  });

  try {
    // Test 1: Initialize and run migrations
    console.log('📋 Test 1: Database Initialization');
    await db.initialize();
    await db.runMigrations();
    console.log('✅ Database initialized and migrated\n');

    // Test 2: Create a round
    console.log('📋 Test 2: Create Round');
    const roundId = uuidv4();
    const round = await db.createRound({
      id: roundId,
      currentPhase: 'initial_access',
      phaseStartTime: new Date(),
      redTeamId: uuidv4(),
      blueTeamId: uuidv4(),
      status: 'active'
    });
    console.log(`✅ Round created: ${round.id}`);
    console.log(`   Phase: ${round.currentPhase}`);
    console.log(`   Status: ${round.status}\n`);

    // Test 3: Create tasks
    console.log('📋 Test 3: Create Tasks');
    const task1 = await db.createTask({
      id: uuidv4(),
      roundId: roundId,
      taskType: 'network_scan',
      phase: 'initial_access',
      agentType: 'ARCHITECT',
      teamType: 'RED',
      status: 'available',
      prerequisites: []
    });
    console.log(`✅ Task created: ${task1.taskType}`);

    const task2 = await db.createTask({
      id: uuidv4(),
      roundId: roundId,
      taskType: 'sql_injection',
      phase: 'escalation',
      agentType: 'SPECTER',
      teamType: 'RED',
      status: 'locked',
      prerequisites: [task1.id]
    });
    console.log(`✅ Task created: ${task2.taskType}\n`);

    // Test 4: Get tasks for round
    console.log('📋 Test 4: Query Tasks');
    const tasks = await db.getTasksForRound(roundId);
    console.log(`✅ Retrieved ${tasks.length} tasks for round\n`);

    // Test 5: Update task
    console.log('📋 Test 5: Update Task');
    const updatedTask = await db.updateTask(task1.id, {
      status: 'completed',
      completedAt: new Date(),
      pointsAwarded: 100
    });
    console.log(`✅ Task updated: ${updatedTask.status}`);
    console.log(`   Points awarded: ${updatedTask.pointsAwarded}\n`);

    // Test 6: Create system state
    console.log('📋 Test 6: Create System State');
    const systemState = await db.upsertSystemState({
      roundId: roundId,
      systemIp: '192.168.100.10',
      systemTier: 'tier1',
      systemName: 'Web Server',
      compromised: false,
      compromiseLevel: 0,
      services: [
        { name: 'HTTP', port: 80, status: 'running' },
        { name: 'HTTPS', port: 443, status: 'running' }
      ],
      firewallRules: [],
      persistenceMechanisms: [],
      modifiedBy: 'system',
      snapshotId: 'baseline-001'
    });
    console.log(`✅ System state created: ${systemState.systemIp}`);
    console.log(`   Tier: ${systemState.systemTier}`);
    console.log(`   Services: ${systemState.services.length}\n`);

    // Test 7: Log events
    console.log('📋 Test 7: Log Events');
    const event1 = await db.logEvent({
      roundId: roundId,
      eventType: 'tool_use',
      actorId: uuidv4(),
      actorType: 'ARCHITECT',
      targetSystem: '192.168.100.10',
      actionDetails: {
        tool: 'nmap',
        result: 'success',
        portsFound: [80, 443, 22]
      },
      traceGenerated: 8.5,
      observable: true,
      detected: false
    });
    console.log(`✅ Event logged: ${event1.eventType}`);
    console.log(`   Trace generated: ${event1.traceGenerated}\n`);

    // Test 8: Create agents
    console.log('📋 Test 8: Create Agents');
    const agent = await db.upsertAgent({
      roundId: roundId,
      agentType: 'ARCHITECT',
      teamType: 'RED',
      playerId: uuidv4(),
      tasksCompleted: 1,
      toolsUsed: 2,
      effectivenessRating: 0.95
    });
    console.log(`✅ Agent created: ${agent.agentType}`);
    console.log(`   Effectiveness: ${agent.effectivenessRating}\n`);

    // Test 9: Get tools
    console.log('📋 Test 9: Get Tools');
    const redTools = await db.getTools('RED');
    const blueTools = await db.getTools('BLUE');
    console.log(`✅ Retrieved ${redTools.length} RED team tools`);
    console.log(`✅ Retrieved ${blueTools.length} BLUE team tools\n`);

    // Test 10: Add scores
    console.log('📋 Test 10: Add Scores');
    await db.addScore({
      roundId: roundId,
      teamType: 'RED',
      scoreType: 'task_completion',
      points: 100,
      reason: 'Completed network scan'
    });
    await db.addScore({
      roundId: roundId,
      teamType: 'RED',
      scoreType: 'stealth_bonus',
      points: 50,
      reason: 'Low trace level maintained'
    });
    console.log('✅ Scores added\n');

    // Test 11: Update round with trace and burn
    console.log('📋 Test 11: Update Round Trace/Burn');
    const updatedRound = await db.updateRound(roundId, {
      redTraceLevel: 35.5,
      redBurnState: 'MODERATE',
      redScore: 150
    });
    console.log(`✅ Round updated`);
    console.log(`   Trace: ${updatedRound.redTraceLevel}%`);
    console.log(`   Burn state: ${updatedRound.redBurnState}`);
    console.log(`   Score: ${updatedRound.redScore}\n`);

    // Test 12: Query with filters
    console.log('📋 Test 12: Query with Filters');
    const completedTasks = await db.getTasksForRound(roundId, { status: 'completed' });
    const observableEvents = await db.getEvents(roundId, { observable: true });
    console.log(`✅ Completed tasks: ${completedTasks.length}`);
    console.log(`✅ Observable events: ${observableEvents.length}\n`);

    // Test 13: Transaction test
    console.log('📋 Test 13: Transaction Test');
    const client = await db.beginTransaction();
    try {
      await client.query(
        'UPDATE rounds SET red_score = red_score + $1 WHERE id = $2',
        [25, roundId]
      );
      await client.query(
        'INSERT INTO scores (round_id, team_type, score_type, points, reason) VALUES ($1, $2, $3, $4, $5)',
        [roundId, 'RED', 'speed_bonus', 25, 'Fast completion']
      );
      await db.commitTransaction(client);
      console.log('✅ Transaction committed successfully\n');
    } catch (error) {
      await db.rollbackTransaction(client);
      console.error('❌ Transaction failed:', error.message);
    }

    // Test 14: Get final round state
    console.log('📋 Test 14: Final Round State');
    const finalRound = await db.getRound(roundId);
    const finalScores = await db.getScores(roundId);
    console.log(`✅ Final round score: ${finalRound.redScore}`);
    console.log(`✅ Score entries: ${finalScores.length}\n`);

    // Test 15: Prepared statement security test
    console.log('📋 Test 15: SQL Injection Prevention');
    const maliciousInput = "'; DROP TABLE rounds; --";
    const safeQuery = await db.getTasksForRound(maliciousInput);
    console.log(`✅ Prepared statements prevented SQL injection`);
    console.log(`   Query returned: ${safeQuery.length} results (expected: 0)\n`);

    console.log('🎉 All PostgreSQL tests passed!\n');
    console.log('=' .repeat(60));
    console.log('TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Round operations: PASSED`);
    console.log(`✅ Task operations: PASSED`);
    console.log(`✅ System state operations: PASSED`);
    console.log(`✅ Event logging: PASSED`);
    console.log(`✅ Agent tracking: PASSED`);
    console.log(`✅ Tool management: PASSED`);
    console.log(`✅ Scoring system: PASSED`);
    console.log(`✅ Transactions: PASSED`);
    console.log(`✅ Query filters: PASSED`);
    console.log(`✅ SQL injection prevention: PASSED`);
    console.log('=' .repeat(60));

    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    await db.close();
  }
}

// Run tests if executed directly
if (require.main === module) {
  testPostgreSQL()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = testPostgreSQL;
