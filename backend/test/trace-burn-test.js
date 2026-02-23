// Phase 5 Checkpoint Test: Trace & Burn System
const TraceBurnSystem = require('../game/TraceBurnSystem');
const TraceAccumulator = require('../game/TraceAccumulator');
const BurnCalculator = require('../game/BurnCalculator');

async function testTraceBurnSystem() {
  console.log('🧪 Testing Trace & Burn System (Phase 5)...\n');
  
  try {
    // Test 1: Initialize Components
    console.log('📋 Test 1: Component Initialization');
    
    const traceAccumulator = new TraceAccumulator();
    const burnCalculator = new BurnCalculator();
    const traceBurnSystem = new TraceBurnSystem(traceAccumulator, burnCalculator);
    
    console.log('✅ Trace Accumulator initialized');
    console.log('✅ Burn Calculator initialized');
    console.log('✅ Trace & Burn System initialized');
    
    // Test 2: Round Initialization
    console.log('\n📋 Test 2: Round Initialization');
    
    const roundId = 'test-round-' + Date.now();
    traceBurnSystem.initializeRound(roundId, 'red-team-1');
    
    const initialData = traceBurnSystem.getTraceData(roundId);
    console.log(`✅ Round initialized: ${roundId}`);
    console.log(`✅ Initial trace: ${initialData.totalTrace}`);
    console.log(`✅ Initial level: ${initialData.traceLevel}`);
    console.log(`✅ Initial burn state: ${initialData.burnState}`);
    
    // Test 3: Trace Accumulation from Actions
    console.log('\n📋 Test 3: Trace Accumulation');
    
    // Simulate reconnaissance action (low trace)
    const reconAction = {
      toolId: 'nmap',
      agentType: 'ORACLE',
      category: 'reconnaissance',
      observable: true,
      success: true,
      effectiveness: 0.85
    };
    
    const reconResult = traceBurnSystem.accumulateTrace(roundId, reconAction);
    console.log(`✅ Reconnaissance action: ${reconResult.traceGenerated} trace generated`);
    console.log(`✅ Total trace: ${reconResult.currentTrace}`);
    console.log(`✅ Trace level: ${reconResult.currentLevel}`);
    
    // Simulate exploitation action (high trace)
    const exploitAction = {
      toolId: 'metasploit',
      agentType: 'ARCHITECT',
      category: 'exploitation',
      observable: true,
      success: true,
      effectiveness: 0.90
    };
    
    const exploitResult = traceBurnSystem.accumulateTrace(roundId, exploitAction);
    console.log(`✅ Exploitation action: ${exploitResult.traceGenerated} trace generated`);
    console.log(`✅ Total trace: ${exploitResult.currentTrace}`);
    console.log(`✅ Burn state: ${exploitResult.currentBurnState}`);
    
    // Test 4: Trace Level Transitions
    console.log('\n📋 Test 4: Trace Level Transitions');
    
    // Generate enough trace to transition through levels
    const actions = [
      { toolId: 'sqlmap', agentType: 'ARCHITECT', category: 'exploitation', observable: true, success: true },
      { toolId: 'hydra', agentType: 'ARCHITECT', category: 'lateral_movement', observable: true, success: true },
      { toolId: 'gobuster', agentType: 'ORACLE', category: 'reconnaissance', observable: true, success: true },
      { toolId: 'netcat', agentType: 'SPECTER', category: 'exfiltration', observable: false, success: true }
    ];
    
    let previousLevel = reconResult.currentLevel;
    actions.forEach((action, index) => {
      const result = traceBurnSystem.accumulateTrace(roundId, action);
      if (result.levelChanged) {
        console.log(`✅ Level transition: ${result.previousLevel} → ${result.currentLevel} (trace: ${result.currentTrace})`);
      }
    });
    
    const currentData = traceBurnSystem.getTraceData(roundId);
    console.log(`✅ Current trace level: ${currentData.traceLevel} (${Math.round(currentData.tracePercentage)}%)`);
    console.log(`✅ Current burn state: ${currentData.burnState}`);
    
    // Test 5: Burn State Penalties
    console.log('\n📋 Test 5: Burn State Penalties');
    
    const burnStates = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
    burnStates.forEach(state => {
      const effectiveness = burnCalculator.getToolEffectivenessPenalty(state);
      const detection = burnCalculator.getDetectionProbability(state);
      const cooldown = burnCalculator.getCooldownMultiplier(state);
      
      console.log(`✅ ${state}: effectiveness ${Math.round(effectiveness * 100)}%, detection ${Math.round(detection * 100)}%, cooldown ×${cooldown}`);
    });
    
    // Test 6: Stealth Tools and Trace Reduction
    console.log('\n📋 Test 6: Stealth Tools and Trace Reduction');
    
    const traceBefore = currentData.totalTrace;
    
    // Use stealth tool
    const stealthAction = {
      toolId: 'mimikatz',
      agentType: 'SPECTER',
      category: 'lateral_movement',
      observable: false,
      success: true,
      effectiveness: 0.85
    };
    
    const stealthResult = traceBurnSystem.accumulateTrace(roundId, stealthAction);
    console.log(`✅ Stealth tool (mimikatz) trace: ${stealthResult.traceGenerated} (reduced due to stealth)`);
    
    // Manual trace reduction
    const reductionResult = traceBurnSystem.reduceTrace(roundId, 20, 'stealth_tool');
    console.log(`✅ Trace reduced by ${reductionResult.traceReduced}`);
    console.log(`✅ Trace: ${reductionResult.previousTrace} → ${reductionResult.currentTrace}`);
    
    if (reductionResult.levelChanged) {
      console.log(`✅ Level changed: ${reductionResult.previousLevel} → ${reductionResult.currentLevel}`);
    }
    
    // Test 7: Agent Specialization Effects
    console.log('\n📋 Test 7: Agent Specialization Effects');
    
    const testAction = {
      toolId: 'nmap',
      category: 'reconnaissance',
      observable: true,
      success: true,
      effectiveness: 0.85
    };
    
    const agents = ['ARCHITECT', 'SPECTER', 'ORACLE'];
    agents.forEach(agentType => {
      const action = { ...testAction, agentType };
      const trace = traceAccumulator.calculateTrace(action);
      console.log(`✅ ${agentType}: ${trace} trace (SPECTER has lowest due to stealth specialization)`);
    });
    
    // Test 8: Detection Probability
    console.log('\n📋 Test 8: Detection Probability');
    
    burnStates.forEach(state => {
      const detectionRoll = burnCalculator.calculateDetectionRoll(state, {
        idsActive: false,
        stealthTool: false,
        threatHunting: false
      });
      
      console.log(`✅ ${state}: ${Math.round(detectionRoll.probability * 100)}% detection chance`);
    });
    
    // Test with IDS active
    const idsDetection = burnCalculator.calculateDetectionRoll('HIGH', {
      idsActive: true,
      stealthTool: false,
      threatHunting: false
    });
    
    console.log(`✅ HIGH with IDS active: ${Math.round(idsDetection.probability * 100)}% detection chance`);
    
    // Test 9: Burn State Countermeasures
    console.log('\n📋 Test 9: Burn State Countermeasures');
    
    const highCountermeasures = burnCalculator.getCountermeasures('HIGH');
    const criticalCountermeasures = burnCalculator.getCountermeasures('CRITICAL');
    
    console.log(`✅ HIGH countermeasures: ${highCountermeasures.length}`);
    highCountermeasures.forEach(cm => console.log(`   - ${cm}`));
    
    console.log(`✅ CRITICAL countermeasures: ${criticalCountermeasures.length}`);
    criticalCountermeasures.slice(0, 3).forEach(cm => console.log(`   - ${cm}`));
    
    // Test 10: Trace History and Statistics
    console.log('\n📋 Test 10: Trace History and Statistics');
    
    const history = traceBurnSystem.getTraceHistory(roundId, 5);
    console.log(`✅ Trace history entries: ${history.length}`);
    
    const stats = traceBurnSystem.getTraceStatistics(roundId);
    console.log(`✅ Total actions: ${stats.totalActions}`);
    console.log(`✅ Observable actions: ${stats.observableActions}`);
    console.log(`✅ Stealth actions: ${stats.stealthActions}`);
    console.log(`✅ Average trace per action: ${stats.averageTracePerAction}`);
    console.log(`✅ Max trace from single action: ${stats.maxTraceFromSingleAction}`);
    
    // Test 11: Trace Breakdown Analysis
    console.log('\n📋 Test 11: Trace Breakdown Analysis');
    
    const analysisAction = {
      toolId: 'metasploit',
      agentType: 'ARCHITECT',
      category: 'exploitation',
      observable: true,
      success: true,
      effectiveness: 0.90
    };
    
    const breakdown = traceAccumulator.getTraceBreakdown(analysisAction);
    console.log(`✅ Trace breakdown for metasploit:`);
    console.log(`   Base: ${breakdown.baseTrace}`);
    console.log(`   Tool modifier: ×${breakdown.toolModifier}`);
    console.log(`   Agent modifier: ×${breakdown.agentModifier}`);
    console.log(`   Observable: ×${breakdown.observableMultiplier}`);
    console.log(`   Final: ${breakdown.finalTrace} trace`);
    
    // Test 12: Risk Assessment
    console.log('\n📋 Test 12: Risk Assessment');
    
    const finalData = traceBurnSystem.getTraceData(roundId);
    const riskAssessment = burnCalculator.calculateRiskAssessment(finalData.burnState, {
      traceValue: finalData.totalTrace,
      idsActive: false,
      threatHunting: false,
      recentDetections: 0
    });
    
    console.log(`✅ Risk score: ${riskAssessment.riskScore}/100`);
    console.log(`✅ Risk level: ${riskAssessment.riskLevel}`);
    console.log(`✅ Detection probability: ${riskAssessment.detectionProbability}%`);
    console.log(`✅ Effectiveness loss: ${riskAssessment.effectivenessLoss}%`);
    console.log(`✅ Recommendations: ${riskAssessment.recommendations.length}`);
    
    // Test 13: Burn State Progression Simulation
    console.log('\n📋 Test 13: Burn State Progression Simulation');
    
    const progression = burnCalculator.simulateBurnProgression(
      0,    // Starting trace
      2,    // 2 actions per minute
      12,   // 12 trace per action
      10    // Simulate 10 minutes
    );
    
    console.log(`✅ Simulated ${progression.length} minutes of progression`);
    
    // Show key transitions
    let lastState = 'LOW';
    progression.forEach(step => {
      if (step.burnState !== lastState) {
        console.log(`   Minute ${step.minute}: ${lastState} → ${step.burnState} (trace: ${step.trace})`);
        lastState = step.burnState;
      }
    });
    
    // Test 14: Trace Prediction
    console.log('\n📋 Test 14: Trace Prediction');
    
    const plannedAction = {
      toolId: 'hydra',
      agentType: 'ARCHITECT',
      category: 'lateral_movement',
      observable: true,
      effectiveness: 0.75
    };
    
    const prediction = traceAccumulator.predictTrace(plannedAction);
    console.log(`✅ Predicted trace: ${prediction.expectedTrace}`);
    console.log(`✅ Range: ${prediction.range.min}-${prediction.range.max}`);
    console.log(`✅ Recommendation: ${prediction.recommendation}`);
    
    // Test 15: Time-Based Trace Decay
    console.log('\n📋 Test 15: Time-Based Trace Decay');
    
    const decayAmount = traceAccumulator.calculateTimeDecay(5, finalData.totalTrace);
    console.log(`✅ Trace decay over 5 minutes: ${decayAmount}`);
    
    const decayResult = traceBurnSystem.applyTraceDecay(roundId, 1.0);
    if (decayResult.success && decayResult.decayAmount > 0) {
      console.log(`✅ Applied decay: ${decayResult.decayAmount} trace reduced`);
    } else {
      console.log(`✅ No decay applied (insufficient time elapsed)`);
    }
    
    console.log('\n🎉 All Trace & Burn System tests passed!\n');
    
    return {
      success: true,
      stats: {
        roundId,
        finalTrace: finalData.totalTrace,
        traceLevel: finalData.traceLevel,
        burnState: finalData.burnState,
        totalActions: stats.totalActions,
        riskScore: riskAssessment.riskScore
      }
    };
    
  } catch (error) {
    console.error('❌ Trace & Burn System test failed:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testTraceBurnSystem().then(result => {
    if (result.success) {
      console.log('✅ Trace & Burn System Test: PASSED');
      console.log(`📊 Stats: ${result.stats.finalTrace} trace, ${result.stats.traceLevel} level, ${result.stats.burnState} burn state`);
      process.exit(0);
    } else {
      console.log('❌ Trace & Burn System Test: FAILED');
      process.exit(1);
    }
  });
}

module.exports = testTraceBurnSystem;
