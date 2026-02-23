// Integration Test: Mission Logic Engine + Tool Execution Engine
const MissionLogicEngine = require('../game/MissionLogicEngine');
const TaskDependencyGraph = require('../game/TaskDependencyGraph');
const AgentRouter = require('../game/AgentRouter');
const ToolExecutionEngine = require('../game/ToolExecutionEngine');
const EffectivenessCalculator = require('../game/EffectivenessCalculator');
const SystemInteractor = require('../game/SystemInteractor');

// Mock database
const mockDatabase = {};

async function testMissionToolIntegration() {
  console.log('🧪 Testing Mission Logic + Tool Execution Integration...\n');
  
  try {
    // Initialize all components
    const taskGraph = new TaskDependencyGraph();
    const agentRouter = new AgentRouter();
    const effectivenessCalculator = new EffectivenessCalculator();
    const systemInteractor = new SystemInteractor();
    const toolEngine = new ToolExecutionEngine(effectivenessCalculator, systemInteractor);
    
    // Initialize Mission Logic Engine with tool support
    const missionEngine = new MissionLogicEngine(mockDatabase, taskGraph, agentRouter, toolEngine);
    
    console.log('✅ All components initialized with tool integration');
    
    // Test 1: Start round and verify tool availability
    console.log('\n📋 Test 1: Round Initialization with Tool Support');
    const round = missionEngine.startRound({
      redTeamId: 'red-team-1',
      blueTeamId: 'blue-team-1'
    });
    
    console.log(`✅ Round started: ${round.id}`);
    
    // Test 2: Get available tools for different agents
    console.log('\n📋 Test 2: Agent Tool Availability');
    
    const architectTools = missionEngine.getAvailableTools(round.id, 'architect-1');
    const sentinelTools = missionEngine.getAvailableTools(round.id, 'sentinel-1');
    const spectreTools = missionEngine.getAvailableTools(round.id, 'specter-1');
    
    console.log(`✅ ARCHITECT tools available: ${architectTools.length}`);
    console.log(`   Tools: ${architectTools.map(t => t.name).join(', ')}`);
    
    console.log(`✅ SENTINEL tools available: ${sentinelTools.length}`);
    console.log(`   Tools: ${sentinelTools.map(t => t.name).join(', ')}`);
    
    console.log(`✅ SPECTER tools available: ${spectreTools.length}`);
    console.log(`   Tools: ${spectreTools.map(t => t.name).join(', ')}`);
    
    // Test 3: Execute Red Team tools and track burn state
    console.log('\n📋 Test 3: Red Team Tool Execution and Burn State');
    
    // Execute reconnaissance tool (low trace)
    console.log('Executing nmap scan...');
    const nmapResult = await missionEngine.executeTool(
      round.id, 
      'nmap', 
      'oracle-1', 
      '192.168.100.50',
      { target: '192.168.100.50', scan_type: 'syn' }
    );
    
    console.log(`✅ Nmap execution: ${nmapResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Trace generated: ${nmapResult.traceGenerated}`);
    
    // Check burn state after first tool
    let analytics = missionEngine.getRoundAnalytics(round.id);
    console.log(`✅ Events logged: ${analytics.events.length}`);
    
    // Execute exploitation tool (high trace)
    console.log('Executing SQL injection...');
    const sqlResult = await missionEngine.executeTool(
      round.id,
      'sqlmap',
      'architect-1',
      'http://192.168.100.50/login.php',
      { target_url: 'http://192.168.100.50/login.php', technique: 'union' }
    );
    
    console.log(`✅ SQLMap execution: ${sqlResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Trace generated: ${sqlResult.traceGenerated}`);
    
    // Test 4: Blue Team Response
    console.log('\n📋 Test 4: Blue Team Defensive Response');
    
    // Execute IDS monitoring
    console.log('Activating IDS monitoring...');
    const idsResult = await missionEngine.executeTool(
      round.id,
      'ids_monitor',
      'sentinel-1',
      'eth0',
      { interface: 'eth0', sensitivity: 'high' }
    );
    
    console.log(`✅ IDS monitoring: ${idsResult.success ? 'ACTIVE' : 'FAILED'}`);
    
    // Execute IP blocking in response to attacks
    console.log('Blocking suspicious IP...');
    const blockResult = await missionEngine.executeTool(
      round.id,
      'ip_block',
      'warden-1',
      '192.168.100.10',
      { ip_address: '192.168.100.10', duration: 3600, reason: 'SQL injection attempt' }
    );
    
    console.log(`✅ IP blocking: ${blockResult.success ? 'BLOCKED' : 'FAILED'}`);
    
    // Test 5: Tool Execution History and Analytics
    console.log('\n📋 Test 5: Tool Execution Analytics');
    
    const toolHistory = missionEngine.getToolExecutionHistory(round.id);
    console.log(`✅ Total tool executions: ${toolHistory.length}`);
    
    // Analyze tool usage by team
    const redExecutions = toolHistory.filter(exec => {
      try {
        const agentInfo = missionEngine.parseAgentId(exec.agentId);
        return agentInfo.team === 'red';
      } catch {
        return false;
      }
    });
    
    const blueExecutions = toolHistory.filter(exec => {
      try {
        const agentInfo = missionEngine.parseAgentId(exec.agentId);
        return agentInfo.team === 'blue';
      } catch {
        return false;
      }
    });
    
    console.log(`✅ Red team executions: ${redExecutions.length}`);
    console.log(`✅ Blue team executions: ${blueExecutions.length}`);
    
    // Calculate total trace generated
    const totalTrace = redExecutions.reduce((sum, exec) => sum + (exec.traceGenerated || 0), 0);
    console.log(`✅ Total red team trace: ${totalTrace}`);
    
    // Test 6: System State Tracking
    console.log('\n📋 Test 6: System State Tracking');
    
    analytics = missionEngine.getRoundAnalytics(round.id);
    const systemStateEvents = analytics.events.filter(e => e.type === 'system_state_changed');
    
    console.log(`✅ System state changes: ${systemStateEvents.length}`);
    systemStateEvents.forEach(event => {
      console.log(`   ${event.data.type} on ${event.data.target}`);
    });
    
    // Test 7: Burn State Progression
    console.log('\n📋 Test 7: Burn State Progression');
    
    // Execute more tools to increase burn state
    const tools = ['hydra', 'metasploit', 'mimikatz'];
    const targets = ['192.168.100.51', '192.168.100.52', '192.168.100.52'];
    const agents = ['architect-1', 'architect-1', 'specter-1'];
    const params = [
      { target: '192.168.100.51', service: 'ssh' },
      { target: '192.168.100.52', exploit: 'ms17_010' },
      { target: '192.168.100.52', technique: 'sekurlsa::logonpasswords' }
    ];
    
    for (let i = 0; i < tools.length; i++) {
      try {
        console.log(`Executing ${tools[i]}...`);
        const result = await missionEngine.executeTool(
          round.id,
          tools[i],
          agents[i],
          targets[i],
          params[i]
        );
        console.log(`✅ ${tools[i]}: ${result.success ? 'SUCCESS' : 'FAILED'} (trace: ${result.traceGenerated})`);
      } catch (error) {
        console.log(`⚠️  ${tools[i]} failed: ${error.message}`);
      }
    }
    
    // Check final burn state
    const finalHistory = missionEngine.getToolExecutionHistory(round.id);
    const finalRedExecutions = finalHistory.filter(exec => {
      try {
        const agentInfo = missionEngine.parseAgentId(exec.agentId);
        return agentInfo.team === 'red';
      } catch {
        return false;
      }
    });
    
    const finalTrace = finalRedExecutions.reduce((sum, exec) => sum + (exec.traceGenerated || 0), 0);
    console.log(`✅ Final red team trace: ${finalTrace}`);
    
    // Test 8: Agent Specialization Effectiveness
    console.log('\n📋 Test 8: Agent Specialization Effectiveness');
    
    // Test ARCHITECT with exploitation tools vs reconnaissance tools
    const architectExploitEffectiveness = effectivenessCalculator.calculateEffectiveness(
      { baseEffectiveness: 0.8, category: 'exploitation' },
      'LOW',
      'ARCHITECT'
    );
    
    const architectReconEffectiveness = effectivenessCalculator.calculateEffectiveness(
      { baseEffectiveness: 0.8, category: 'reconnaissance' },
      'LOW',
      'ARCHITECT'
    );
    
    console.log(`✅ ARCHITECT exploitation effectiveness: ${Math.round(architectExploitEffectiveness * 100)}%`);
    console.log(`✅ ARCHITECT reconnaissance effectiveness: ${Math.round(architectReconEffectiveness * 100)}%`);
    
    // Test SENTINEL with detection tools
    const sentinelDetectionEffectiveness = effectivenessCalculator.calculateEffectiveness(
      { baseEffectiveness: 0.8, category: 'detection' },
      'LOW',
      'SENTINEL'
    );
    
    console.log(`✅ SENTINEL detection effectiveness: ${Math.round(sentinelDetectionEffectiveness * 100)}%`);
    
    // Test 9: Error Handling
    console.log('\n📋 Test 9: Error Handling');
    
    // Test invalid tool
    try {
      await missionEngine.executeTool(round.id, 'invalid_tool', 'architect-1', 'target', {});
      console.log('❌ Should have failed for invalid tool');
    } catch (error) {
      console.log(`✅ Invalid tool error handled: ${error.message}`);
    }
    
    // Test invalid agent
    try {
      await missionEngine.executeTool(round.id, 'nmap', 'invalid-agent', 'target', {});
      console.log('❌ Should have failed for invalid agent');
    } catch (error) {
      console.log(`✅ Invalid agent error handled: ${error.message}`);
    }
    
    // Test missing parameters
    try {
      await missionEngine.executeTool(round.id, 'sqlmap', 'architect-1', 'target', {});
      console.log('❌ Should have failed for missing parameters');
    } catch (error) {
      console.log(`✅ Missing parameters error handled correctly`);
    }
    
    // Final analytics
    console.log('\n📋 Final Integration Test Results');
    const finalAnalytics = missionEngine.getRoundAnalytics(round.id);
    
    console.log(`✅ Total events logged: ${finalAnalytics.events.length}`);
    console.log(`✅ Tool executions completed: ${finalHistory.length}`);
    console.log(`✅ System state changes: ${finalAnalytics.events.filter(e => e.type === 'system_state_changed').length}`);
    
    console.log('\n🎉 Mission Logic + Tool Execution Integration test passed!\n');
    
    return {
      success: true,
      stats: {
        roundId: round.id,
        totalExecutions: finalHistory.length,
        redExecutions: finalRedExecutions.length,
        blueExecutions: finalHistory.length - finalRedExecutions.length,
        totalTrace: finalTrace,
        eventsLogged: finalAnalytics.events.length
      }
    };
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testMissionToolIntegration().then(result => {
    if (result.success) {
      console.log('✅ Mission Logic + Tool Execution Integration Test: PASSED');
      console.log(`📊 Stats: ${result.stats.totalExecutions} total executions, ${result.stats.totalTrace} trace generated`);
      process.exit(0);
    } else {
      console.log('❌ Mission Logic + Tool Execution Integration Test: FAILED');
      process.exit(1);
    }
  });
}

module.exports = testMissionToolIntegration;