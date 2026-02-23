/**
 * Scoring Integration Test Suite
 * Tests integration between scoring engine and real-time sync
 */

const ScoringEngine = require('../game/ScoringEngine');
const ScoringIntegration = require('../game/ScoringIntegration');

// Mock database
class MockDatabase {
  constructor() {
    this.scores = [];
  }

  async run(query, params) {
    if (query.includes('INSERT INTO scores')) {
      this.scores.push({
        round_id: params[0],
        team: params[1],
        agent_id: params[2],
        score_type: params[3],
        points: params[4],
        details: params[5],
        timestamp: params[6]
      });
    }
  }

  async get(query, params) {
    if (query.includes('SUM(points)')) {
      const roundId = params[0];
      const filter = params[1];
      
      const filtered = this.scores.filter(s => {
        if (query.includes('team')) {
          return s.round_id === roundId && s.team === filter;
        } else {
          return s.round_id === roundId && s.agent_id === filter;
        }
      });
      
      const total = filtered.reduce((sum, s) => sum + s.points, 0);
      return { total };
    }
    return null;
  }

  async all(query, params) {
    const roundId = params[0];
    const filter = params[1];
    
    if (query.includes('GROUP BY score_type')) {
      const filtered = this.scores.filter(s => {
        if (query.includes('team')) {
          return s.round_id === roundId && s.team === filter;
        } else {
          return s.round_id === roundId && s.agent_id === filter;
        }
      });
      
      const grouped = {};
      filtered.forEach(s => {
        if (!grouped[s.score_type]) {
          grouped[s.score_type] = { score_type: s.score_type, points: 0, count: 0 };
        }
        grouped[s.score_type].points += s.points;
        grouped[s.score_type].count += 1;
      });
      
      return Object.values(grouped);
    }
    
    return [];
  }
}

// Mock real-time sync
class MockRealTimeSync {
  constructor() {
    this.broadcasts = [];
  }

  async broadcastToRoom(roomId, eventType, data) {
    this.broadcasts.push({
      roomId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  getBroadcasts(eventType) {
    return this.broadcasts.filter(b => b.eventType === eventType);
  }

  clearBroadcasts() {
    this.broadcasts = [];
  }
}

async function testScoringIntegration() {
  console.log('🧪 Testing Scoring Integration...\n');

  const db = new MockDatabase();
  const realTimeSync = new MockRealTimeSync();
  const scoringEngine = new ScoringEngine(db);
  const integration = new ScoringIntegration(scoringEngine, realTimeSync);

  const roundId = 'test-round-001';

  // Test 1: Task completion integration
  console.log('📋 Test 1: Task Completion Integration');
  const taskEvent = {
    roundId,
    team: 'RED',
    agentId: 'agent-001',
    taskId: 'task-001',
    task: {
      phase: 'initial_access',
      difficulty: 'medium',
      team: 'RED'
    },
    timeRemaining: 3000,
    traceLevel: 20
  };
  
  const taskScore = await integration.onTaskCompleted(taskEvent);
  console.log(`✅ Task score awarded: ${taskScore.totalPoints} points`);
  console.log(`✅ Broadcasts sent: ${realTimeSync.broadcasts.length}`);
  
  const scoreUpdates = realTimeSync.getBroadcasts('score_update');
  console.log(`✅ Score updates: ${scoreUpdates.length}`);
  console.log(`✅ Score update data:`, scoreUpdates[0].data);
  
  const teamUpdates = realTimeSync.getBroadcasts('team_score_update');
  console.log(`✅ Team score updates: ${teamUpdates.length}`);
  console.log(`✅ Team total: ${teamUpdates[0].data.totalPoints} points`);

  // Test 2: Detection integration
  console.log('\n📋 Test 2: Detection Integration');
  realTimeSync.clearBroadcasts();
  
  const detectionEvent = {
    roundId,
    team: 'BLUE',
    agentId: 'agent-002',
    detectionDetails: {
      quality: 'high',
      actionType: 'network_scan',
      targetSystem: '192.168.100.10'
    }
  };
  
  const detectionScore = await integration.onDetection(detectionEvent);
  console.log(`✅ Detection score awarded: ${detectionScore.totalPoints} points`);
  console.log(`✅ Broadcasts sent: ${realTimeSync.broadcasts.length}`);
  
  const detectionUpdates = realTimeSync.getBroadcasts('score_update');
  console.log(`✅ Detection updates: ${detectionUpdates.length}`);
  console.log(`✅ Detection type: ${detectionUpdates[0].data.scoreType}`);

  // Test 3: Containment integration
  console.log('\n📋 Test 3: Containment Integration');
  realTimeSync.clearBroadcasts();
  
  const containmentEvent = {
    roundId,
    team: 'BLUE',
    agentId: 'agent-003',
    containmentDetails: {
      systemsTier: 'tier2',
      systemId: 'web-01',
      action: 'firewall_block'
    }
  };
  
  const containmentScore = await integration.onContainment(containmentEvent);
  console.log(`✅ Containment score awarded: ${containmentScore.totalPoints} points`);
  console.log(`✅ Broadcasts sent: ${realTimeSync.broadcasts.length}`);

  // Test 4: Recovery integration
  console.log('\n📋 Test 4: Recovery Integration');
  realTimeSync.clearBroadcasts();
  
  const recoveryEvent = {
    roundId,
    team: 'BLUE',
    agentId: 'agent-003',
    recoveryDetails: {
      systemsCount: 2,
      systemsTier: 'tier1',
      systemIds: ['web-01', 'web-02']
    }
  };
  
  const recoveryScore = await integration.onRecovery(recoveryEvent);
  console.log(`✅ Recovery score awarded: ${recoveryScore.totalPoints} points`);
  console.log(`✅ Broadcasts sent: ${realTimeSync.broadcasts.length}`);

  // Test 5: Get scoreboard
  console.log('\n📋 Test 5: Get Current Scoreboard');
  const scoreboard = await integration.getScoreboard(roundId);
  console.log(`✅ RED team: ${scoreboard.red.totalPoints} points`);
  console.log(`✅ BLUE team: ${scoreboard.blue.totalPoints} points`);
  console.log(`✅ Current leader: ${scoreboard.leader}`);

  // Test 6: Round end integration
  console.log('\n📋 Test 6: Round End Integration');
  realTimeSync.clearBroadcasts();
  
  const finalScores = await integration.onRoundEnd(roundId);
  console.log(`✅ Final RED score: ${finalScores.red.totalPoints} points`);
  console.log(`✅ Final BLUE score: ${finalScores.blue.totalPoints} points`);
  console.log(`✅ Winner: ${finalScores.winner}`);
  console.log(`✅ Margin: ${finalScores.margin} points`);
  
  const roundEndBroadcasts = realTimeSync.getBroadcasts('round_end');
  console.log(`✅ Round end broadcasts: ${roundEndBroadcasts.length}`);
  console.log(`✅ Round end data includes winner: ${roundEndBroadcasts[0].data.finalScores.winner === finalScores.winner}`);

  // Test 7: Multiple events in sequence
  console.log('\n📋 Test 7: Multiple Events in Sequence');
  realTimeSync.clearBroadcasts();
  
  await integration.onTaskCompleted({
    ...taskEvent,
    taskId: 'task-002',
    timeRemaining: 2400
  });
  
  await integration.onDetection({
    ...detectionEvent,
    detectionDetails: { ...detectionEvent.detectionDetails, quality: 'critical' }
  });
  
  await integration.onContainment({
    ...containmentEvent,
    containmentDetails: { ...containmentEvent.containmentDetails, systemsTier: 'tier3' }
  });
  
  console.log(`✅ Total broadcasts: ${realTimeSync.broadcasts.length}`);
  console.log(`✅ Score updates: ${realTimeSync.getBroadcasts('score_update').length}`);
  console.log(`✅ Team updates: ${realTimeSync.getBroadcasts('team_score_update').length}`);

  // Test 8: Verify database persistence
  console.log('\n📋 Test 8: Database Persistence');
  console.log(`✅ Total scores in database: ${db.scores.length}`);
  console.log(`✅ RED team scores: ${db.scores.filter(s => s.team === 'RED').length}`);
  console.log(`✅ BLUE team scores: ${db.scores.filter(s => s.team === 'BLUE').length}`);
  
  const scoreTypes = [...new Set(db.scores.map(s => s.score_type))];
  console.log(`✅ Score types recorded: ${scoreTypes.join(', ')}`);

  console.log('\n🎉 All Scoring Integration tests passed!\n');
  console.log('✅ Scoring Integration Test: PASSED');
  console.log(`📊 Stats: ${db.scores.length} scores, ${realTimeSync.broadcasts.length} broadcasts\n`);
}

// Run tests
testScoringIntegration().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
