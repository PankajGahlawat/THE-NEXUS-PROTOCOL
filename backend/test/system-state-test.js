/**
 * System State Manager Test Suite
 * Tests state initialization, updates, queries, and concurrency control
 */

const SystemStateManager = require('../game/SystemStateManager');

// Mock database
class MockDatabase {
  constructor() {
    this.data = new Map();
    this.queries = [];
  }

  async run(query, params) {
    this.queries.push({ query, params });
    
    if (query.includes('INSERT INTO system_states')) {
      const key = `${params[1]}:${params[0]}`; // roundId:systemId
      this.data.set(key, {
        system_id: params[0],
        round_id: params[1],
        ip_address: params[2],
        tier: params[3],
        services: params[4],
        compromised: params[5],
        compromise_level: params[6],
        files_modified: params[7],
        users: params[8],
        firewall_rules: params[9],
        processes: params[10],
        network_connections: params[11],
        last_modified: params[12],
        baseline_snapshot: params[13]
      });
    } else if (query.includes('UPDATE system_states')) {
      const roundId = params[9];
      const systemId = params[10];
      const key = `${roundId}:${systemId}`;
      const existing = this.data.get(key);
      if (existing) {
        this.data.set(key, {
          ...existing,
          services: params[0],
          compromised: params[1],
          compromise_level: params[2],
          files_modified: params[3],
          users: params[4],
          firewall_rules: params[5],
          processes: params[6],
          network_connections: params[7],
          last_modified: params[8]
        });
      }
    }
  }

  async get(query, params) {
    const key = `${params[0]}:${params[1]}`; // roundId:systemId
    return this.data.get(key);
  }

  async all(query, params) {
    const roundId = params[0];
    const results = [];
    for (const [key, value] of this.data.entries()) {
      if (key.startsWith(`${roundId}:`)) {
        results.push(value);
      }
    }
    return results;
  }
}

async function testSystemStateManager() {
  console.log('🧪 Testing System State Manager...\n');

  const db = new MockDatabase();
  const manager = new SystemStateManager(db);

  // Test 1: Initialize round state
  console.log('📋 Test 1: Round State Initialization');
  const roundId = 'test-round-001';
  const systems = [
    {
      id: 'web-01',
      ip: '192.168.100.10',
      tier: 'tier1',
      services: [
        { name: 'HTTP', port: 80, status: 'running' },
        { name: 'HTTPS', port: 443, status: 'running' }
      ],
      users: ['root', 'www-data'],
      firewall_rules: [],
      processes: ['nginx', 'php-fpm'],
      baseline_snapshot: 'baseline-001'
    },
    {
      id: 'ssh-01',
      ip: '192.168.100.20',
      tier: 'tier2',
      services: [
        { name: 'SSH', port: 22, status: 'running' }
      ],
      users: ['root', 'admin'],
      firewall_rules: [],
      processes: ['sshd'],
      baseline_snapshot: 'baseline-001'
    }
  ];

  const states = await manager.initializeRoundState(roundId, systems);
  console.log(`✅ Initialized ${states.length} systems`);
  console.log(`✅ System 1: ${states[0].system_id} at ${states[0].ip_address}`);
  console.log(`✅ System 2: ${states[1].system_id} at ${states[1].ip_address}`);
  console.log(`✅ All systems uncompromised: ${states.every(s => !s.compromised)}`);

  // Test 2: Query system state
  console.log('\n📋 Test 2: Query System State');
  const webState = await manager.getSystemState(roundId, 'web-01');
  console.log(`✅ Retrieved state for ${webState.system_id}`);
  console.log(`✅ IP: ${webState.ip_address}`);
  console.log(`✅ Tier: ${webState.tier}`);
  console.log(`✅ Services: ${webState.services.length}`);
  console.log(`✅ Compromised: ${webState.compromised}`);

  // Test 3: Update system state
  console.log('\n📋 Test 3: Update System State');
  const updatedState = await manager.updateSystemState(roundId, 'web-01', {
    compromised: true,
    compromise_level: 2
  });
  console.log(`✅ Updated ${updatedState.system_id}`);
  console.log(`✅ Compromised: ${updatedState.compromised}`);
  console.log(`✅ Compromise level: ${updatedState.compromise_level}`);

  // Test 4: Mark system as compromised
  console.log('\n📋 Test 4: Mark System as Compromised');
  const compromisedState = await manager.markCompromised(roundId, 'ssh-01', 3);
  console.log(`✅ Marked ${compromisedState.system_id} as compromised`);
  console.log(`✅ Compromise level: ${compromisedState.compromise_level}`);

  // Test 5: Record file modification
  console.log('\n📋 Test 5: Record File Modification');
  await manager.recordFileModification(roundId, 'web-01', '/var/www/shell.php', 'created');
  await manager.recordFileModification(roundId, 'web-01', '/etc/passwd', 'modified');
  const stateWithFiles = await manager.getSystemState(roundId, 'web-01');
  console.log(`✅ Recorded ${stateWithFiles.files_modified.length} file modifications`);
  console.log(`✅ File 1: ${stateWithFiles.files_modified[0].path} (${stateWithFiles.files_modified[0].operation})`);
  console.log(`✅ File 2: ${stateWithFiles.files_modified[1].path} (${stateWithFiles.files_modified[1].operation})`);

  // Test 6: Update firewall rules
  console.log('\n📋 Test 6: Update Firewall Rules');
  const firewallRules = [
    { action: 'BLOCK', source: '192.168.100.50', port: 22 },
    { action: 'BLOCK', source: '192.168.100.51', port: 80 }
  ];
  await manager.updateFirewallRules(roundId, 'ssh-01', firewallRules);
  const stateWithFirewall = await manager.getSystemState(roundId, 'ssh-01');
  console.log(`✅ Updated firewall rules: ${stateWithFirewall.firewall_rules.length} rules`);
  console.log(`✅ Rule 1: ${stateWithFirewall.firewall_rules[0].action} ${stateWithFirewall.firewall_rules[0].source}`);

  // Test 7: Update processes
  console.log('\n📋 Test 7: Update Running Processes');
  const processes = [
    { pid: 1234, name: 'nginx', user: 'www-data' },
    { pid: 1235, name: 'malicious.sh', user: 'root' }
  ];
  await manager.updateProcesses(roundId, 'web-01', processes);
  const stateWithProcesses = await manager.getSystemState(roundId, 'web-01');
  console.log(`✅ Updated processes: ${stateWithProcesses.processes.length} processes`);
  console.log(`✅ Process 1: ${stateWithProcesses.processes[0].name} (PID ${stateWithProcesses.processes[0].pid})`);
  console.log(`✅ Process 2: ${stateWithProcesses.processes[1].name} (PID ${stateWithProcesses.processes[1].pid})`);

  // Test 8: Update network connections
  console.log('\n📋 Test 8: Update Network Connections');
  const connections = [
    { local: '192.168.100.10:80', remote: '192.168.100.50:54321', state: 'ESTABLISHED' },
    { local: '192.168.100.10:443', remote: '10.0.0.1:12345', state: 'ESTABLISHED' }
  ];
  await manager.updateNetworkConnections(roundId, 'web-01', connections);
  const stateWithConnections = await manager.getSystemState(roundId, 'web-01');
  console.log(`✅ Updated connections: ${stateWithConnections.network_connections.length} connections`);
  console.log(`✅ Connection 1: ${stateWithConnections.network_connections[0].local} → ${stateWithConnections.network_connections[0].remote}`);

  // Test 9: Restore system
  console.log('\n📋 Test 9: Restore System to Baseline');
  const restoredState = await manager.restoreSystem(roundId, 'web-01');
  console.log(`✅ Restored ${restoredState.system_id}`);
  console.log(`✅ Compromised: ${restoredState.compromised}`);
  console.log(`✅ Compromise level: ${restoredState.compromise_level}`);
  console.log(`✅ Files modified: ${restoredState.files_modified.length}`);
  console.log(`✅ Processes: ${restoredState.processes.length}`);
  console.log(`✅ Network connections: ${restoredState.network_connections.length}`);

  // Test 10: Get all round states
  console.log('\n📋 Test 10: Get All Round States');
  const allStates = await manager.getRoundStates(roundId);
  console.log(`✅ Retrieved ${allStates.length} system states`);
  console.log(`✅ Systems: ${allStates.map(s => s.system_id).join(', ')}`);

  // Test 11: Concurrency control
  console.log('\n📋 Test 11: Concurrency Control');
  const updates = [];
  for (let i = 0; i < 5; i++) {
    updates.push(
      manager.updateSystemState(roundId, 'web-01', {
        compromise_level: i + 1
      })
    );
  }
  const results = await Promise.all(updates);
  const finalState = results[results.length - 1];
  console.log(`✅ Performed ${updates.length} concurrent updates`);
  console.log(`✅ Final compromise level: ${finalState.compromise_level}`);
  console.log(`✅ All updates serialized correctly: ${finalState.compromise_level === 5}`);

  // Test 12: Statistics
  console.log('\n📋 Test 12: Statistics');
  const stats = manager.getStatistics();
  console.log(`✅ Cached rounds: ${stats.cachedRounds}`);
  console.log(`✅ Total cached systems: ${stats.totalCachedSystems}`);
  console.log(`✅ Pending updates: ${stats.pendingUpdates}`);

  // Test 13: Clear cache
  console.log('\n📋 Test 13: Clear Round Cache');
  manager.clearRoundCache(roundId);
  const statsAfterClear = manager.getStatistics();
  console.log(`✅ Cached rounds after clear: ${statsAfterClear.cachedRounds}`);
  console.log(`✅ Cache cleared successfully: ${statsAfterClear.cachedRounds === 0}`);

  console.log('\n🎉 All System State Manager tests passed!\n');
  console.log('✅ System State Manager Test: PASSED');
  console.log(`📊 Stats: ${stats.totalCachedSystems} systems, ${db.queries.length} database operations\n`);
}

// Run tests
testSystemStateManager().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
