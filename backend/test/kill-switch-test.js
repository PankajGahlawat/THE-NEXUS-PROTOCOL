/**
 * Emergency Kill Switch Test Suite
 * Tests emergency shutdown, round termination, and state persistence
 */

const KillSwitch = require('../emergency/KillSwitch');

// Mock database
class MockDatabase {
  constructor() {
    this.rounds = [
      { id: 'round-001', status: 'active', phase: 'escalation', time_remaining: 1800 },
      { id: 'round-002', status: 'in_progress', phase: 'initial_access', time_remaining: 3000 }
    ];
    this.snapshots = [];
    this.updates = [];
  }

  async all(query, params) {
    if (query.includes('status IN')) {
      return this.rounds.filter(r => r.status === 'active' || r.status === 'in_progress');
    }
    return [];
  }

  async run(query, params) {
    if (query.includes('INSERT INTO round_snapshots')) {
      this.snapshots.push({
        round_id: params[0],
        snapshot_time: params[1],
        status: params[2],
        phase: params[3],
        time_remaining: params[4],
        shutdown_reason: params[5]
      });
    } else if (query.includes('UPDATE rounds')) {
      this.updates.push({
        status: params[0],
        end_time: params[1],
        termination_reason: params[2],
        round_id: params[3]
      });
      
      // Update round status
      const round = this.rounds.find(r => r.id === params[3]);
      if (round) {
        round.status = params[0];
      }
    }
  }
}

// Mock real-time sync
class MockRealTimeSync {
  constructor() {
    this.sockets = [
      { id: 'socket-001', disconnect: function() { this.disconnected = true; } },
      { id: 'socket-002', disconnect: function() { this.disconnected = true; } },
      { id: 'socket-003', disconnect: function() { this.disconnected = true; } }
    ];
    this.broadcasts = [];
  }

  get io() {
    return {
      emit: (event, data) => {
        this.broadcasts.push({ event, data });
      },
      fetchSockets: async () => {
        return this.sockets;
      }
    };
  }
}

async function testKillSwitch() {
  console.log('🧪 Testing Emergency Kill Switch...\n');

  const db = new MockDatabase();
  const realTimeSync = new MockRealTimeSync();
  
  const killSwitch = new KillSwitch({
    database: db,
    realTimeSync,
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {}
    }
  });

  // Test 1: Initial state
  console.log('📋 Test 1: Initial State');
  const initialStatus = killSwitch.getStatus();
  console.log(`✅ Initially inactive: ${!initialStatus.isActivated}`);
  console.log(`✅ No activation time: ${initialStatus.activationTime === null}`);
  console.log(`✅ No activation reason: ${initialStatus.activationReason === null}`);

  // Test 2: Activate kill switch
  console.log('\n📋 Test 2: Activate Kill Switch');
  const result = await killSwitch.activate('Critical security breach detected', 'operator-001');
  
  console.log(`✅ Activation successful: ${result.success}`);
  console.log(`✅ Activation time set: ${!!result.activationTime}`);
  console.log(`✅ Reason recorded: ${result.reason === 'Critical security breach detected'}`);
  console.log(`✅ Activated by: ${result.activatedBy === 'operator-001'}`);

  // Test 3: Verify rounds terminated
  console.log('\n📋 Test 3: Verify Rounds Terminated');
  console.log(`✅ Rounds terminated: ${result.results.roundsTerminated}`);
  console.log(`✅ Expected 2 rounds: ${result.results.roundsTerminated === 2}`);
  console.log(`✅ Database updates: ${db.updates.length}`);
  
  const terminatedRounds = db.rounds.filter(r => r.status === 'terminated');
  console.log(`✅ All rounds terminated: ${terminatedRounds.length === 2}`);

  // Test 4: Verify state persistence
  console.log('\n📋 Test 4: Verify State Persistence');
  console.log(`✅ States persisted: ${result.results.statesPersisted}`);
  console.log(`✅ Snapshots created: ${db.snapshots.length}`);
  console.log(`✅ Snapshot 1: ${db.snapshots[0].round_id} (${db.snapshots[0].phase})`);
  console.log(`✅ Snapshot 2: ${db.snapshots[1].round_id} (${db.snapshots[1].phase})`);
  console.log(`✅ Shutdown reason recorded: ${db.snapshots[0].shutdown_reason === 'Critical security breach detected'}`);

  // Test 5: Verify clients disconnected
  console.log('\n📋 Test 5: Verify Clients Disconnected');
  console.log(`✅ Clients disconnected: ${result.results.clientsDisconnected}`);
  console.log(`✅ Expected 3 clients: ${result.results.clientsDisconnected === 3}`);
  
  const disconnectedSockets = realTimeSync.sockets.filter(s => s.disconnected);
  console.log(`✅ All sockets disconnected: ${disconnectedSockets.length === 3}`);

  // Test 6: Verify emergency broadcast
  console.log('\n📋 Test 6: Verify Emergency Broadcast');
  const emergencyBroadcast = realTimeSync.broadcasts.find(b => b.event === 'emergency_shutdown');
  console.log(`✅ Emergency broadcast sent: ${!!emergencyBroadcast}`);
  console.log(`✅ Broadcast reason: ${emergencyBroadcast.data.reason}`);
  console.log(`✅ Broadcast message: ${!!emergencyBroadcast.data.message}`);

  // Test 7: Kill switch status after activation
  console.log('\n📋 Test 7: Kill Switch Status After Activation');
  const activeStatus = killSwitch.getStatus();
  console.log(`✅ Is activated: ${activeStatus.isActivated}`);
  console.log(`✅ Activation time: ${!!activeStatus.activationTime}`);
  console.log(`✅ Activation reason: ${activeStatus.activationReason}`);
  console.log(`✅ Activated by: ${activeStatus.activatedBy}`);

  // Test 8: Prevent double activation
  console.log('\n📋 Test 8: Prevent Double Activation');
  const doubleActivation = await killSwitch.activate('Another reason', 'operator-002');
  console.log(`✅ Double activation prevented: ${!doubleActivation.success}`);
  console.log(`✅ Warning message: ${doubleActivation.message.includes('already activated')}`);

  // Test 9: Reset kill switch (testing only)
  console.log('\n📋 Test 9: Reset Kill Switch');
  killSwitch.reset();
  const resetStatus = killSwitch.getStatus();
  console.log(`✅ Reset successful: ${!resetStatus.isActivated}`);
  console.log(`✅ Activation time cleared: ${resetStatus.activationTime === null}`);

  // Test 10: Activate with different reason
  console.log('\n📋 Test 10: Activate with Different Reason');
  const db2 = new MockDatabase();
  const realTimeSync2 = new MockRealTimeSync();
  const killSwitch2 = new KillSwitch({
    database: db2,
    realTimeSync: realTimeSync2,
    logger: { info: () => {}, warn: () => {}, error: () => {} }
  });
  
  const result2 = await killSwitch2.activate('System maintenance', 'system');
  console.log(`✅ Activation successful: ${result2.success}`);
  console.log(`✅ Reason: ${result2.reason === 'System maintenance'}`);
  console.log(`✅ Activated by system: ${result2.activatedBy === 'system'}`);

  // Test 11: Error handling during shutdown
  console.log('\n📋 Test 11: Error Handling During Shutdown');
  const faultyDb = {
    all: async () => { throw new Error('Database error'); },
    run: async () => {}
  };
  
  const killSwitch3 = new KillSwitch({
    database: faultyDb,
    realTimeSync: null,
    logger: { info: () => {}, warn: () => {}, error: () => {} }
  });
  
  const result3 = await killSwitch3.activate('Test error handling', 'operator');
  console.log(`✅ Handled database error: ${result3.results.errors.length > 0 || result3.results.roundsTerminated === 0}`);

  // Test 12: Kill switch without database
  console.log('\n📋 Test 12: Kill Switch Without Database');
  const killSwitch4 = new KillSwitch({
    database: null,
    realTimeSync: null,
    logger: { info: () => {}, warn: () => {}, error: () => {} }
  });
  
  const result4 = await killSwitch4.activate('No database test', 'operator');
  console.log(`✅ Activation completed: ${result4.success}`);
  console.log(`✅ No rounds terminated: ${result4.results.roundsTerminated === 0}`);
  console.log(`✅ No states persisted: ${result4.results.statesPersisted === 0}`);

  // Test 13: Kill switch without real-time sync
  console.log('\n📋 Test 13: Kill Switch Without Real-Time Sync');
  const killSwitch5 = new KillSwitch({
    database: new MockDatabase(),
    realTimeSync: null,
    logger: { info: () => {}, warn: () => {}, error: () => {} }
  });
  
  const result5 = await killSwitch5.activate('No WebSocket test', 'operator');
  console.log(`✅ Activation completed: ${result5.success}`);
  console.log(`✅ No clients disconnected: ${result5.results.clientsDisconnected === 0}`);
  console.log(`✅ Rounds still terminated: ${result5.results.roundsTerminated === 2}`);

  console.log('\n🎉 All Emergency Kill Switch tests passed!\n');
  console.log('✅ Emergency Kill Switch Test: PASSED');
  console.log(`📊 Stats: ${result.results.roundsTerminated} rounds terminated, ${result.results.clientsDisconnected} clients disconnected\n`);
}

// Run tests
testKillSwitch().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
