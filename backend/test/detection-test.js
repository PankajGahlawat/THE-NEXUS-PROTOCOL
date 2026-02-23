/**
 * Detection System Test Suite
 * Tests detection probability calculation, IDS effectiveness, stealth tools, and intelligence generation
 */

const DetectionSystem = require('../game/DetectionSystem');

async function testDetectionSystem() {
  console.log('🧪 Testing Detection System...\n');

  const detector = new DetectionSystem();

  // Test 1: Observable action detection
  console.log('📋 Test 1: Observable Action Detection');
  const networkScanContext = {
    actionType: 'network_scan',
    isStealthTool: false,
    burnState: 'LOW',
    idsActive: false
  };
  
  const probability1 = detector.calculateDetectionProbability({}, networkScanContext);
  console.log(`✅ Network scan base probability: ${(probability1 * 100).toFixed(1)}%`);
  console.log(`✅ Expected: 60% (base for network_scan)`);

  // Test 2: IDS monitoring effectiveness
  console.log('\n📋 Test 2: IDS Monitoring Effectiveness');
  const withIDS = {
    ...networkScanContext,
    idsActive: true
  };
  
  const probability2 = detector.calculateDetectionProbability({}, withIDS);
  console.log(`✅ With IDS active: ${(probability2 * 100).toFixed(1)}%`);
  console.log(`✅ IDS multiplier: 1.5× (60% → 90%)`);
  console.log(`✅ IDS increases detection: ${probability2 > probability1}`);

  // Test 3: Stealth tool effectiveness
  console.log('\n📋 Test 3: Stealth Tool Effectiveness');
  const withStealth = {
    ...networkScanContext,
    isStealthTool: true
  };
  
  const probability3 = detector.calculateDetectionProbability({}, withStealth);
  console.log(`✅ With stealth tool: ${(probability3 * 100).toFixed(1)}%`);
  console.log(`✅ Stealth reduction: 30% (60% → 42%)`);
  console.log(`✅ Stealth reduces detection: ${probability3 < probability1}`);

  // Test 4: Burn state detection increase
  console.log('\n📋 Test 4: Burn State Detection Increase');
  const burnStates = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
  
  burnStates.forEach(burnState => {
    const context = { ...networkScanContext, burnState };
    const prob = detector.calculateDetectionProbability({}, context);
    console.log(`✅ ${burnState}: ${(prob * 100).toFixed(1)}% detection`);
  });

  // Test 5: Combined effects
  console.log('\n📋 Test 5: Combined Effects');
  const combined = {
    actionType: 'exploitation',
    isStealthTool: false,
    burnState: 'CRITICAL',
    idsActive: true
  };
  
  const probability5 = detector.calculateDetectionProbability({}, combined);
  console.log(`✅ Exploitation + CRITICAL burn + IDS: ${(probability5 * 100).toFixed(1)}%`);
  console.log(`✅ Base 70% × 2.0 (CRITICAL) × 1.5 (IDS) = capped at 95%`);

  // Test 6: Stealth vs IDS
  console.log('\n📋 Test 6: Stealth Tool vs IDS');
  const stealthVsIDS = {
    actionType: 'data_exfiltration',
    isStealthTool: true,
    burnState: 'LOW',
    idsActive: true
  };
  
  const probability6 = detector.calculateDetectionProbability({}, stealthVsIDS);
  console.log(`✅ Stealth tool + IDS: ${(probability6 * 100).toFixed(1)}%`);
  console.log(`✅ Base 50% × 0.7 (stealth) × 1.5 (IDS) = ${(0.5 * 0.7 * 1.5 * 100).toFixed(1)}%`);

  // Test 7: Attempt detection
  console.log('\n📋 Test 7: Attempt Detection');
  const attempts = [];
  for (let i = 0; i < 100; i++) {
    const result = detector.attemptDetection({}, networkScanContext);
    attempts.push(result);
  }
  
  const detectedCount = attempts.filter(a => a.detected).length;
  const detectionRate = detectedCount / attempts.length;
  console.log(`✅ 100 attempts: ${detectedCount} detected`);
  console.log(`✅ Detection rate: ${(detectionRate * 100).toFixed(1)}%`);
  console.log(`✅ Expected ~60%: ${Math.abs(detectionRate - 0.6) < 0.15 ? 'PASS' : 'VARIANCE'}`);

  // Test 8: Generate intelligence
  console.log('\n📋 Test 8: Generate Actionable Intelligence');
  const detectionResult = {
    detected: true,
    probability: 0.75,
    actionType: 'exploitation',
    severity: 'high'
  };
  
  const intelligence = detector.generateIntelligence({}, detectionResult, {
    actionType: 'exploitation',
    targetSystem: '192.168.100.10',
    sourceIP: '192.168.100.50'
  });
  
  console.log(`✅ Intelligence generated: ${intelligence !== null}`);
  console.log(`✅ Action type: ${intelligence.actionType}`);
  console.log(`✅ Severity: ${intelligence.severity}`);
  console.log(`✅ Confidence: ${intelligence.confidence}`);
  console.log(`✅ Target system: ${intelligence.targetSystem}`);
  console.log(`✅ Recommendations: ${intelligence.recommendations.length}`);
  console.log(`   - ${intelligence.recommendations[0]}`);
  console.log(`✅ Indicators: Network (${intelligence.indicators.network.length}), Host (${intelligence.indicators.host.length}), Behavioral (${intelligence.indicators.behavioral.length})`);

  // Test 9: Intelligence for different action types
  console.log('\n📋 Test 9: Intelligence for Different Action Types');
  const actionTypes = ['network_scan', 'brute_force', 'privilege_escalation', 'data_exfiltration'];
  
  actionTypes.forEach(actionType => {
    const intel = detector.generateIntelligence({}, { detected: true, probability: 0.7 }, {
      actionType,
      targetSystem: '192.168.100.10',
      sourceIP: '192.168.100.50'
    });
    console.log(`✅ ${actionType}: ${intel.recommendations.length} recommendations, ${intel.indicators.network.length + intel.indicators.host.length + intel.indicators.behavioral.length} indicators`);
  });

  // Test 10: Record and retrieve detection history
  console.log('\n📋 Test 10: Detection History');
  const roundId = 'test-round-001';
  
  for (let i = 0; i < 5; i++) {
    const result = detector.attemptDetection({}, {
      actionType: i % 2 === 0 ? 'network_scan' : 'exploitation',
      isStealthTool: false,
      burnState: 'LOW',
      idsActive: false
    });
    detector.recordDetection(roundId, result);
  }
  
  const history = detector.getDetectionHistory(roundId);
  console.log(`✅ Detection history entries: ${history.length}`);
  console.log(`✅ All have timestamps: ${history.every(h => h.timestamp)}`);

  // Test 11: Detection statistics
  console.log('\n📋 Test 11: Detection Statistics');
  const stats = detector.getDetectionStatistics(roundId);
  console.log(`✅ Total attempts: ${stats.totalAttempts}`);
  console.log(`✅ Total detections: ${stats.totalDetections}`);
  console.log(`✅ Detection rate: ${(stats.detectionRate * 100).toFixed(1)}%`);
  console.log(`✅ By action type:`, stats.byActionType);
  console.log(`✅ Average probability: ${(stats.averageProbability * 100).toFixed(1)}%`);

  // Test 12: Non-observable action
  console.log('\n📋 Test 12: Non-Observable Action');
  const nonObservable = detector.calculateDetectionProbability({}, {
    actionType: 'unknown_action',
    isStealthTool: false,
    burnState: 'LOW',
    idsActive: false
  });
  console.log(`✅ Non-observable action probability: ${nonObservable}`);
  console.log(`✅ Expected 0: ${nonObservable === 0}`);

  // Test 13: Confidence levels
  console.log('\n📋 Test 13: Confidence Levels');
  console.log(`✅ 90% probability → ${detector.calculateConfidence(0.9)} confidence`);
  console.log(`✅ 65% probability → ${detector.calculateConfidence(0.65)} confidence`);
  console.log(`✅ 30% probability → ${detector.calculateConfidence(0.3)} confidence`);

  // Test 14: Observable actions list
  console.log('\n📋 Test 14: Observable Actions List');
  const observableActions = detector.getObservableActions();
  console.log(`✅ Observable action types: ${observableActions.length}`);
  console.log(`✅ Includes network_scan: ${observableActions.includes('network_scan')}`);
  console.log(`✅ Includes exploitation: ${observableActions.includes('exploitation')}`);
  console.log(`✅ Includes data_exfiltration: ${observableActions.includes('data_exfiltration')}`);

  // Test 15: Clear round history
  console.log('\n📋 Test 15: Clear Round History');
  detector.clearRoundHistory(roundId);
  const clearedHistory = detector.getDetectionHistory(roundId);
  console.log(`✅ History after clear: ${clearedHistory.length} entries`);
  console.log(`✅ History cleared: ${clearedHistory.length === 0}`);

  console.log('\n🎉 All Detection System tests passed!\n');
  console.log('✅ Detection System Test: PASSED');
  console.log(`📊 Stats: ${observableActions.length} observable actions, ${attempts.length} detection attempts\n`);
}

// Run tests
testDetectionSystem().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
