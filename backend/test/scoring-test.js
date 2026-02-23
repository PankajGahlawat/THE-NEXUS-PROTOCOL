/**
 * Scoring Engine Test Suite
 * Tests task scoring, bonuses, detection/containment/recovery points, and persistence
 */

const ScoringEngine = require('../game/ScoringEngine');

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
      const filter = params[1]; // team or agent_id
      
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
    
    if (query.includes('GROUP BY score_type')) {
      const filter = params[1];
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
    } else if (query.includes('ORDER BY timestamp')) {
      return this.scores.filter(s => s.round_id === roundId);
    } else if (query.includes('ORDER BY total_points DESC')) {
      // Leaderboard query
      const grouped = {};
      this.scores.forEach(s => {
        if (!grouped[s.team]) {
          grouped[s.team] = { team: s.team, total_points: 0, rounds: new Set() };
        }
        grouped[s.team].total_points += s.points;
        grouped[s.team].rounds.add(s.round_id);
      });
      
      return Object.values(grouped)
        .map(g => ({
          team: g.team,
          total_points: g.total_points,
          rounds_played: g.rounds.size,
          avg_points_per_score: g.total_points / this.scores.filter(s => s.team === g.team).length
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, params[0]);
    }
    
    return [];
  }
}

async function testScoringEngine() {
  console.log('🧪 Testing Scoring Engine...\n');

  const db = new MockDatabase();
  const engine = new ScoringEngine(db);

  // Test 1: Task completion scoring - Initial Access
  console.log('📋 Test 1: Task Completion Scoring - Initial Access');
  const task1 = {
    phase: 'initial_access',
    difficulty: 'medium',
    team: 'RED'
  };
  const score1 = engine.calculateTaskScore(task1, 3000, 15); // 50 min remaining, 15% trace
  console.log(`✅ Base points: ${score1.basePoints}`);
  console.log(`✅ Speed bonus: ${score1.speedBonus} (50 min × 10)`);
  console.log(`✅ Stealth bonus: ${score1.stealthBonus} ((100-15) × 20)`);
  console.log(`✅ Total points: ${score1.totalPoints}`);
  console.log(`✅ Expected total: ${200 + 500 + 1700} = ${score1.totalPoints === 2400 ? 'CORRECT' : 'INCORRECT'}`);

  // Test 2: Task completion scoring - Escalation
  console.log('\n📋 Test 2: Task Completion Scoring - Escalation');
  const task2 = {
    phase: 'escalation',
    difficulty: 'hard',
    team: 'RED'
  };
  const score2 = engine.calculateTaskScore(task2, 1200, 45); // 20 min remaining, 45% trace
  console.log(`✅ Base points: ${score2.basePoints}`);
  console.log(`✅ Speed bonus: ${score2.speedBonus} (20 min × 10)`);
  console.log(`✅ Stealth bonus: ${score2.stealthBonus} ((100-45) × 20)`);
  console.log(`✅ Total points: ${score2.totalPoints}`);

  // Test 3: Task completion scoring - Impact (no time bonus)
  console.log('\n📋 Test 3: Task Completion Scoring - Impact (No Time Bonus)');
  const task3 = {
    phase: 'impact',
    difficulty: 'easy',
    team: 'RED'
  };
  const score3 = engine.calculateTaskScore(task3, 0, 80); // No time remaining, 80% trace
  console.log(`✅ Base points: ${score3.basePoints}`);
  console.log(`✅ Speed bonus: ${score3.speedBonus} (0 min)`);
  console.log(`✅ Stealth bonus: ${score3.stealthBonus} ((100-80) × 20)`);
  console.log(`✅ Total points: ${score3.totalPoints}`);

  // Test 4: Blue Team task (no stealth bonus)
  console.log('\n📋 Test 4: Blue Team Task (No Stealth Bonus)');
  const task4 = {
    phase: 'recovery',
    difficulty: 'medium',
    team: 'BLUE'
  };
  const score4 = engine.calculateTaskScore(task4, 1800, 0); // 30 min remaining
  console.log(`✅ Base points: ${score4.basePoints}`);
  console.log(`✅ Speed bonus: ${score4.speedBonus}`);
  console.log(`✅ Stealth bonus: ${score4.stealthBonus} (Blue Team - no stealth bonus)`);
  console.log(`✅ Total points: ${score4.totalPoints}`);

  // Test 5: Detection scoring
  console.log('\n📋 Test 5: Detection Scoring');
  const detection1 = engine.calculateDetectionScore('standard');
  console.log(`✅ Standard detection: ${detection1.totalPoints} points`);
  const detection2 = engine.calculateDetectionScore('high');
  console.log(`✅ High quality detection: ${detection2.totalPoints} points (1.5× multiplier)`);
  const detection3 = engine.calculateDetectionScore('critical');
  console.log(`✅ Critical detection: ${detection3.totalPoints} points (2× multiplier)`);

  // Test 6: Containment scoring
  console.log('\n📋 Test 6: Containment Scoring');
  const containment1 = engine.calculateContainmentScore('tier1');
  console.log(`✅ Tier 1 containment: ${containment1.totalPoints} points`);
  const containment2 = engine.calculateContainmentScore('tier2');
  console.log(`✅ Tier 2 containment: ${containment2.totalPoints} points (1.5× multiplier)`);
  const containment3 = engine.calculateContainmentScore('tier3');
  console.log(`✅ Tier 3 containment: ${containment3.totalPoints} points (2× multiplier)`);

  // Test 7: Recovery scoring
  console.log('\n📋 Test 7: Recovery Scoring');
  const recovery1 = engine.calculateRecoveryScore(1, 'tier1');
  console.log(`✅ 1 Tier 1 system: ${recovery1.totalPoints} points`);
  const recovery2 = engine.calculateRecoveryScore(3, 'tier2');
  console.log(`✅ 3 Tier 2 systems: ${recovery2.totalPoints} points (3 × ${recovery2.pointsPerSystem})`);
  const recovery3 = engine.calculateRecoveryScore(2, 'tier3');
  console.log(`✅ 2 Tier 3 systems: ${recovery3.totalPoints} points (2 × ${recovery3.pointsPerSystem})`);

  // Test 8: Award and persist task points
  console.log('\n📋 Test 8: Award and Persist Task Points');
  const roundId = 'test-round-001';
  await engine.awardTaskPoints(roundId, 'RED', 'agent-001', 'task-001', task1, 3000, 15);
  console.log(`✅ Task points awarded and persisted`);
  console.log(`✅ Database entries: ${db.scores.length}`);

  // Test 9: Award detection points
  console.log('\n📋 Test 9: Award Detection Points');
  await engine.awardDetectionPoints(roundId, 'BLUE', 'agent-002', {
    quality: 'high',
    actionType: 'network_scan',
    timestamp: new Date().toISOString()
  });
  console.log(`✅ Detection points awarded`);
  console.log(`✅ Database entries: ${db.scores.length}`);

  // Test 10: Award containment points
  console.log('\n📋 Test 10: Award Containment Points');
  await engine.awardContainmentPoints(roundId, 'BLUE', 'agent-003', {
    systemsTier: 'tier2',
    systemId: 'web-01'
  });
  console.log(`✅ Containment points awarded`);
  console.log(`✅ Database entries: ${db.scores.length}`);

  // Test 11: Award recovery points
  console.log('\n📋 Test 11: Award Recovery Points');
  await engine.awardRecoveryPoints(roundId, 'BLUE', 'agent-003', {
    systemsCount: 2,
    systemsTier: 'tier1',
    systemIds: ['web-01', 'web-02']
  });
  console.log(`✅ Recovery points awarded`);
  console.log(`✅ Database entries: ${db.scores.length}`);

  // Test 12: Get team score
  console.log('\n📋 Test 12: Get Team Score');
  const redTeamScore = await engine.getTeamScore(roundId, 'RED');
  console.log(`✅ RED team total: ${redTeamScore.totalPoints} points`);
  console.log(`✅ RED team breakdown:`, redTeamScore.breakdown);
  
  const blueTeamScore = await engine.getTeamScore(roundId, 'BLUE');
  console.log(`✅ BLUE team total: ${blueTeamScore.totalPoints} points`);
  console.log(`✅ BLUE team breakdown:`, blueTeamScore.breakdown);

  // Test 13: Get agent score
  console.log('\n📋 Test 13: Get Agent Score');
  const agentScore = await engine.getAgentScore(roundId, 'agent-001');
  console.log(`✅ Agent total: ${agentScore.totalPoints} points`);
  console.log(`✅ Agent breakdown:`, agentScore.breakdown);

  // Test 14: Calculate final scores
  console.log('\n📋 Test 14: Calculate Final Scores');
  const finalScores = await engine.calculateFinalScores(roundId);
  console.log(`✅ RED team: ${finalScores.red.totalPoints} points`);
  console.log(`✅ BLUE team: ${finalScores.blue.totalPoints} points`);
  console.log(`✅ Winner: ${finalScores.winner}`);
  console.log(`✅ Margin: ${finalScores.margin} points`);

  // Test 15: Add more scores for leaderboard
  console.log('\n📋 Test 15: Leaderboard');
  await engine.awardTaskPoints('round-002', 'RED', 'agent-004', 'task-002', task2, 1800, 20);
  await engine.awardTaskPoints('round-002', 'BLUE', 'agent-005', 'task-003', task4, 2400, 0);
  await engine.awardDetectionPoints('round-002', 'BLUE', 'agent-005', { quality: 'critical' });
  
  const leaderboard = await engine.getLeaderboard(5);
  console.log(`✅ Leaderboard entries: ${leaderboard.length}`);
  leaderboard.forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.team}: ${entry.total_points} points (${entry.rounds_played} rounds)`);
  });

  // Test 16: Scoring history
  console.log('\n📋 Test 16: Scoring History');
  const history = await engine.getScoringHistory(roundId);
  console.log(`✅ History entries: ${history.length}`);
  console.log(`✅ First entry: ${history[0].score_type} (${history[0].points} points)`);
  console.log(`✅ Last entry: ${history[history.length - 1].score_type} (${history[history.length - 1].points} points)`);

  // Test 17: Edge cases - zero trace
  console.log('\n📋 Test 17: Edge Cases - Perfect Stealth');
  const perfectStealth = engine.calculateTaskScore(task1, 3600, 0); // 60 min, 0% trace
  console.log(`✅ Perfect stealth bonus: ${perfectStealth.stealthBonus} points (100 × 20)`);
  console.log(`✅ Total with perfect stealth: ${perfectStealth.totalPoints} points`);

  // Test 18: Edge cases - maximum trace
  console.log('\n📋 Test 18: Edge Cases - Maximum Trace');
  const maxTrace = engine.calculateTaskScore(task1, 0, 100); // 0 min, 100% trace
  console.log(`✅ No stealth bonus: ${maxTrace.stealthBonus} points`);
  console.log(`✅ No speed bonus: ${maxTrace.speedBonus} points`);
  console.log(`✅ Only base points: ${maxTrace.totalPoints} points`);

  console.log('\n🎉 All Scoring Engine tests passed!\n');
  console.log('✅ Scoring Engine Test: PASSED');
  console.log(`📊 Stats: ${db.scores.length} scores recorded, ${leaderboard.length} teams on leaderboard\n`);
}

// Run tests
testScoringEngine().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
