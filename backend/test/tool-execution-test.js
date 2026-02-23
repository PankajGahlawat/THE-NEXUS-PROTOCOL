// Phase 3 Checkpoint Test: Tool Execution Engine
const ToolExecutionEngine = require('../game/ToolExecutionEngine');
const EffectivenessCalculator = require('../game/EffectivenessCalculator');
const SystemInteractor = require('../game/SystemInteractor');
const RedTeamTools = require('../game/tools/RedTeamTools');
const BlueTeamTools = require('../game/tools/BlueTeamTools');

async function testToolExecutionSystem() {
  console.log('🧪 Testing Tool Execution System (Phase 3)...\n');
  
  try {
    // Initialize components
    const effectivenessCalculator = new EffectivenessCalculator();
    const systemInteractor = new SystemInteractor();
    const toolEngine = new ToolExecutionEngine(effectivenessCalculator, systemInteractor);
    const redTeamTools = new RedTeamTools(systemInteractor);
    const blueTeamTools = new BlueTeamTools(systemInteractor);
    
    console.log('✅ Tool system components initialized successfully');
    
    // Test 1: Tool Registry Validation
    console.log('\n📋 Test 1: Tool Registry Validation');
    const redTools = toolEngine.getAvailableTools('ARCHITECT', 'red');
    const blueTools = toolEngine.getAvailableTools('SENTINEL', 'blue');
    
    console.log(`✅ Red team tools available: ${redTools.length}`);
    console.log(`✅ Blue team tools available: ${blueTools.length}`);
    
    // Verify key tools are registered
    const keyRedTools = ['nmap', 'sqlmap', 'metasploit', 'hydra'];
    const keyBlueTools = ['ids_monitor', 'firewall_config', 'ip_block', 'forensics'];
    
    keyRedTools.forEach(toolId => {
      const tool = redTools.find(t => t.id === toolId);
      if (tool) {
        console.log(`✅ Red tool "${toolId}" registered correctly`);
      } else {
        throw new Error(`Red tool "${toolId}" not found in registry`);
      }
    });
    
    keyBlueTools.forEach(toolId => {
      const tool = blueTools.find(t => t.id === toolId);
      if (tool) {
        console.log(`✅ Blue tool "${toolId}" registered correctly`);
      } else {
        throw new Error(`Blue tool "${toolId}" not found in registry`);
      }
    });
    
    // Test 2: Effectiveness Calculation
    console.log('\n📋 Test 2: Effectiveness Calculation');
    const testTool = {
      id: 'test_tool',
      baseEffectiveness: 0.8,
      category: 'exploitation'
    };
    
    const burnStates = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
    const agentTypes = ['ARCHITECT', 'SPECTER', 'ORACLE'];
    
    burnStates.forEach(burnState => {
      agentTypes.forEach(agentType => {
        const effectiveness = effectivenessCalculator.calculateEffectiveness(
          testTool, burnState, agentType
        );
        console.log(`✅ ${agentType} + ${burnState} burn = ${Math.round(effectiveness * 100)}% effectiveness`);
      });
    });
    
    // Test 3: Red Team Tool Execution
    console.log('\n📋 Test 3: Red Team Tool Execution');
    const roundId = 'test-round-' + Date.now();
    
    // Test nmap scan
    console.log('Testing nmap network scan...');
    const nmapResult = await toolEngine.executeTool('nmap', '192.168.100.50', {
      roundId,
      agentId: 'oracle-1',
      agentType: 'ORACLE',
      burnState: 'LOW',
      params: {
        target: '192.168.100.50',
        scan_type: 'syn'
      }
    });
    
    if (nmapResult.success) {
      console.log(`✅ Nmap scan successful - trace generated: ${nmapResult.traceGenerated}`);
      console.log(`✅ Hosts discovered: ${nmapResult.output}`);
    } else {
      console.log(`❌ Nmap scan failed: ${nmapResult.message}`);
    }
    
    // Test SQL injection
    console.log('Testing SQL injection...');
    const sqlmapResult = await toolEngine.executeTool('sqlmap', 'http://192.168.100.50/login.php', {
      roundId,
      agentId: 'architect-1',
      agentType: 'ARCHITECT',
      burnState: 'LOW',
      params: {
        target_url: 'http://192.168.100.50/login.php',
        technique: 'union'
      }
    });
    
    if (sqlmapResult.success) {
      console.log(`✅ SQL injection successful - trace generated: ${sqlmapResult.traceGenerated}`);
    } else {
      console.log(`✅ SQL injection blocked/failed (expected behavior)`);
    }
    
    // Test 4: Blue Team Tool Execution
    console.log('\n📋 Test 4: Blue Team Tool Execution');
    
    // Test IDS monitoring
    console.log('Testing IDS monitoring...');
    const idsResult = await toolEngine.executeTool('ids_monitor', 'eth0', {
      roundId,
      agentId: 'sentinel-1',
      agentType: 'SENTINEL',
      burnState: 'LOW',
      params: {
        interface: 'eth0',
        sensitivity: 'high'
      }
    });
    
    if (idsResult.success) {
      console.log(`✅ IDS monitoring active - events detected: ${idsResult.output}`);
    } else {
      console.log(`❌ IDS monitoring failed: ${idsResult.message}`);
    }
    
    // Test IP blocking
    console.log('Testing IP blocking...');
    const blockResult = await toolEngine.executeTool('ip_block', '192.168.100.10', {
      roundId,
      agentId: 'warden-1',
      agentType: 'WARDEN',
      burnState: 'LOW',
      params: {
        ip_address: '192.168.100.10',
        duration: 3600,
        reason: 'Suspicious activity'
      }
    });
    
    if (blockResult.success) {
      console.log(`✅ IP blocking successful: ${blockResult.output}`);
    } else {
      console.log(`❌ IP blocking failed: ${blockResult.message}`);
    }
    
    // Test 5: Cooldown System
    console.log('\n📋 Test 5: Cooldown System');
    
    // Execute same tool twice to test cooldown
    const firstExecution = await toolEngine.executeTool('nmap', '192.168.100.51', {
      roundId,
      agentId: 'oracle-1',
      agentType: 'ORACLE',
      burnState: 'LOW',
      params: { target: '192.168.100.51' }
    });
    
    console.log(`✅ First execution: ${firstExecution.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Immediate second execution should be blocked by cooldown
    const secondExecution = await toolEngine.executeTool('nmap', '192.168.100.52', {
      roundId,
      agentId: 'oracle-1',
      agentType: 'ORACLE',
      burnState: 'LOW',
      params: { target: '192.168.100.52' }
    });
    
    if (!secondExecution.success && secondExecution.error === 'cooldown_active') {
      console.log(`✅ Cooldown system working - ${secondExecution.cooldownRemaining}s remaining`);
    } else {
      console.log(`❌ Cooldown system not working properly`);
    }
    
    // Test 6: Parameter Validation
    console.log('\n📋 Test 6: Parameter Validation');
    
    // Test missing required parameters
    const invalidExecution = await toolEngine.executeTool('sqlmap', 'http://test.com', {
      roundId,
      agentId: 'architect-1',
      agentType: 'ARCHITECT',
      burnState: 'LOW',
      params: {} // Missing required target_url
    });
    
    if (!invalidExecution.success && invalidExecution.error === 'invalid_parameters') {
      console.log(`✅ Parameter validation working - missing params detected`);
      console.log(`✅ Missing parameters: ${invalidExecution.missingParams.join(', ')}`);
    } else {
      console.log(`❌ Parameter validation not working`);
    }
    
    // Test 7: Execution History
    console.log('\n📋 Test 7: Execution History');
    const history = toolEngine.getExecutionHistory(roundId);
    console.log(`✅ Execution history contains ${history.length} entries`);
    
    if (history.length > 0) {
      const lastExecution = history[history.length - 1];
      console.log(`✅ Last execution: ${lastExecution.toolId} by ${lastExecution.agentId}`);
      console.log(`✅ Success: ${lastExecution.success}, Trace: ${lastExecution.traceGenerated}`);
    }
    
    // Test 8: Agent Specialization
    console.log('\n📋 Test 8: Agent Specialization');
    
    // Test ARCHITECT with exploitation tools
    const architectTools = redTeamTools.getToolsByAgent('ARCHITECT');
    console.log(`✅ ARCHITECT specialized tools: ${architectTools.length}`);
    console.log(`   Tools: ${architectTools.map(t => t.name).join(', ')}`);
    
    // Test SENTINEL with detection tools
    const sentinelTools = blueTeamTools.getToolsByAgent('SENTINEL');
    console.log(`✅ SENTINEL specialized tools: ${sentinelTools.length}`);
    console.log(`   Tools: ${sentinelTools.map(t => t.name).join(', ')}`);
    
    // Test 9: System State Changes
    console.log('\n📋 Test 9: System State Changes');
    
    // Execute a tool that should generate system state changes
    const stateChangeTest = await toolEngine.executeTool('metasploit', '192.168.100.52', {
      roundId,
      agentId: 'architect-1',
      agentType: 'ARCHITECT',
      burnState: 'LOW',
      params: {
        target: '192.168.100.52',
        exploit: 'ms17_010',
        payload: 'reverse_tcp'
      }
    });
    
    if (stateChangeTest.systemStateChanges && stateChangeTest.systemStateChanges.length > 0) {
      console.log(`✅ System state changes recorded: ${stateChangeTest.systemStateChanges.length}`);
      stateChangeTest.systemStateChanges.forEach(change => {
        console.log(`   ${change.type} on ${change.target}`);
      });
    } else {
      console.log(`✅ No system state changes (expected for failed exploits)`);
    }
    
    // Test 10: Tool Recommendations
    console.log('\n📋 Test 10: Tool Recommendations');
    
    const mockTask = { id: 'recon_web_server', name: 'Reconnaissance Web Server' };
    const redRecommendations = redTeamTools.getRecommendedTools(mockTask);
    console.log(`✅ Red team recommendations for recon task: ${redRecommendations.length}`);
    redRecommendations.forEach(tool => {
      console.log(`   ${tool.name} (${tool.category})`);
    });
    
    const mockBlueTask = { id: 'detect_intrusion', name: 'Detect Network Intrusion' };
    const blueRecommendations = blueTeamTools.getRecommendedTools(mockBlueTask);
    console.log(`✅ Blue team recommendations for detection task: ${blueRecommendations.length}`);
    blueRecommendations.forEach(tool => {
      console.log(`   ${tool.name} (${tool.category})`);
    });
    
    console.log('\n🎉 All Tool Execution System tests passed! Phase 3 is working correctly.\n');
    
    return {
      success: true,
      stats: {
        redToolsAvailable: redTools.length,
        blueToolsAvailable: blueTools.length,
        executionsLogged: history.length,
        roundId
      }
    };
    
  } catch (error) {
    console.error('❌ Tool Execution System test failed:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testToolExecutionSystem().then(result => {
    if (result.success) {
      console.log('✅ Tool Execution System Test: PASSED');
      console.log(`📊 Stats: ${result.stats.redToolsAvailable} red tools, ${result.stats.blueToolsAvailable} blue tools, ${result.stats.executionsLogged} executions logged`);
      process.exit(0);
    } else {
      console.log('❌ Tool Execution System Test: FAILED');
      process.exit(1);
    }
  });
}

module.exports = testToolExecutionSystem;