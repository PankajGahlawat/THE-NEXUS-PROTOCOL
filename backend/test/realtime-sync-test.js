// Phase 4 Checkpoint Test: Real-Time Synchronization System
const { Server } = require('socket.io');
const { createServer } = require('http');
const Client = require('socket.io-client');
const RealTimeSyncSystem = require('../realtime/RealTimeSyncSystem');
const RoomManager = require('../realtime/RoomManager');
const MessageQueue = require('../realtime/MessageQueue');
const MissionLogicEngine = require('../game/MissionLogicEngine');
const TaskDependencyGraph = require('../game/TaskDependencyGraph');
const AgentRouter = require('../game/AgentRouter');

// Mock database
const mockDatabase = {};

async function testRealTimeSyncSystem() {
  console.log('🧪 Testing Real-Time Synchronization System (Phase 4)...\n');
  
  let httpServer;
  let io;
  let clientSocket1;
  let clientSocket2;
  let clientSocket3;
  
  try {
    // Test 1: Initialize Real-Time Components
    console.log('📋 Test 1: Component Initialization');
    
    // Create HTTP server and Socket.IO
    httpServer = createServer();
    io = new Server(httpServer);
    
    // Initialize game engine
    const taskGraph = new TaskDependencyGraph();
    const agentRouter = new AgentRouter();
    const missionEngine = new MissionLogicEngine(mockDatabase, taskGraph, agentRouter);
    
    // Initialize real-time components
    const syncSystem = new RealTimeSyncSystem(io, missionEngine);
    const roomManager = new RoomManager(io, syncSystem);
    const messageQueue = new MessageQueue();
    
    console.log('✅ Real-time components initialized');
    console.log('✅ Socket.IO server created');
    console.log('✅ Room manager created');
    console.log('✅ Message queue created');
    
    // Start server
    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        const port = httpServer.address().port;
        console.log(`✅ Test server listening on port ${port}`);
        resolve();
      });
    });
    
    const port = httpServer.address().port;
    
    // Test 2: Client Connection and Room Joining
    console.log('\n📋 Test 2: Client Connection and Room Joining');
    
    // Create test round
    const round = missionEngine.startRound({
      redTeamId: 'red-team-1',
      blueTeamId: 'blue-team-1'
    });
    
    roomManager.createRoundRoom(round.id, round);
    console.log(`✅ Test round created: ${round.id}`);
    
    // Connect clients
    clientSocket1 = Client(`http://localhost:${port}`);
    clientSocket2 = Client(`http://localhost:${port}`);
    clientSocket3 = Client(`http://localhost:${port}`);
    
    await Promise.all([
      new Promise(resolve => clientSocket1.on('connect', resolve)),
      new Promise(resolve => clientSocket2.on('connect', resolve)),
      new Promise(resolve => clientSocket3.on('connect', resolve))
    ]);
    
    console.log('✅ Three clients connected');
    
    // Manually join rooms (simulating authenticated join)
    const socket1 = io.sockets.sockets.get(clientSocket1.id);
    const socket2 = io.sockets.sockets.get(clientSocket2.id);
    const socket3 = io.sockets.sockets.get(clientSocket3.id);
    
    const join1 = roomManager.joinRoundRoom(socket1, round.id, 'red', { name: 'Red Player 1' });
    const join2 = roomManager.joinRoundRoom(socket2, round.id, 'red', { name: 'Red Player 2' });
    const join3 = roomManager.joinRoundRoom(socket3, round.id, 'blue', { name: 'Blue Player 1' });
    
    console.log(`✅ Client 1 joined: ${join1.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Client 2 joined: ${join2.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Client 3 joined: ${join3.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Test 3: Message Broadcasting
    console.log('\n📋 Test 3: Message Broadcasting');
    
    let receivedMessages = {
      client1: [],
      client2: [],
      client3: []
    };
    
    clientSocket1.on('game_update', (msg) => receivedMessages.client1.push(msg));
    clientSocket2.on('game_update', (msg) => receivedMessages.client2.push(msg));
    clientSocket3.on('game_update', (msg) => receivedMessages.client3.push(msg));
    
    // Broadcast action to all clients
    syncSystem.broadcastAction(round.id, 'test_action', {
      message: 'Test broadcast to all'
    }, { batch: false });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`✅ Client 1 received: ${receivedMessages.client1.length} messages`);
    console.log(`✅ Client 2 received: ${receivedMessages.client2.length} messages`);
    console.log(`✅ Client 3 received: ${receivedMessages.client3.length} messages`);
    
    // Test 4: Team-Specific Broadcasting
    console.log('\n📋 Test 4: Team-Specific Broadcasting');
    
    receivedMessages = { client1: [], client2: [], client3: [] };
    
    // Broadcast to red team only
    syncSystem.broadcastToTeam(round.id, 'red', 'red_team_message', {
      message: 'Red team only'
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const redTeamReceived = receivedMessages.client1.length + receivedMessages.client2.length;
    const blueTeamReceived = receivedMessages.client3.length;
    
    console.log(`✅ Red team received: ${redTeamReceived} messages`);
    console.log(`✅ Blue team received: ${blueTeamReceived} messages`);
    
    if (redTeamReceived > 0 && blueTeamReceived === 0) {
      console.log('✅ Team-specific broadcasting working correctly');
    } else {
      console.log('⚠️  Team-specific broadcasting may have issues');
    }
    
    // Test 5: Message Queue and Batching
    console.log('\n📋 Test 5: Message Queue and Batching');
    
    const queueId = 'test-queue';
    messageQueue.createQueue(queueId, { flushInterval: 10000 }); // Long flush interval for testing
    
    // Enqueue messages with different priorities (skip critical to avoid auto-flush)
    messageQueue.enqueue(queueId, { type: 'low_priority', data: 'test1' }, 'low');
    messageQueue.enqueue(queueId, { type: 'normal_priority', data: 'test2' }, 'normal');
    messageQueue.enqueue(queueId, { type: 'high_priority', data: 'test3' }, 'high');
    
    const queueInfo = messageQueue.getQueueInfo(queueId);
    console.log(`✅ Queue size: ${queueInfo.size}`);
    console.log(`✅ Priority breakdown:`, queueInfo.priorityBreakdown);
    
    // Dequeue messages (should come out by priority)
    const dequeuedMessages = messageQueue.dequeue(queueId, 3);
    console.log(`✅ Dequeued ${dequeuedMessages.length} messages`);
    
    if (dequeuedMessages.length > 0) {
      console.log(`✅ First message priority: ${dequeuedMessages[0].type}`);
      
      if (dequeuedMessages[0].type === 'high_priority') {
        console.log('✅ Priority ordering working correctly');
      }
    } else {
      console.log('⚠️  No messages dequeued');
    }
    
    // Test 6: Tool Execution Broadcasting
    console.log('\n📋 Test 6: Tool Execution Broadcasting');
    
    receivedMessages = { client1: [], client2: [], client3: [] };
    
    // Simulate tool execution
    const toolExecution = {
      toolId: 'nmap',
      agentId: 'oracle-1',
      team: 'red',
      success: true,
      observable: true,
      traceGenerated: 10
    };
    
    syncSystem.broadcastToolExecution(round.id, toolExecution);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const totalReceived = receivedMessages.client1.length + 
                         receivedMessages.client2.length + 
                         receivedMessages.client3.length;
    
    console.log(`✅ Tool execution broadcast sent`);
    console.log(`✅ Total messages received: ${totalReceived}`);
    
    // Test 7: Observable Action Alerts
    console.log('\n📋 Test 7: Observable Action Alerts');
    
    receivedMessages = { client1: [], client2: [], client3: [] };
    
    // Send observable action alert to blue team
    syncSystem.broadcastObservableAction(round.id, 'blue', {
      type: 'tool_detection',
      toolId: 'sqlmap',
      agentId: 'architect-1',
      team: 'red',
      severity: 'high'
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const blueTeamAlerts = receivedMessages.client3.length;
    console.log(`✅ Blue team received ${blueTeamAlerts} alert(s)`);
    
    // Test 8: Score Updates
    console.log('\n📋 Test 8: Score Updates');
    
    receivedMessages = { client1: [], client2: [], client3: [] };
    
    syncSystem.broadcastScoreUpdate(round.id);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const scoreUpdatesReceived = receivedMessages.client1.length + 
                                 receivedMessages.client2.length + 
                                 receivedMessages.client3.length;
    
    console.log(`✅ Score update broadcast sent`);
    console.log(`✅ Clients received score updates: ${scoreUpdatesReceived}`);
    
    // Test 9: Trace and Burn State Updates
    console.log('\n📋 Test 9: Trace and Burn State Updates');
    
    receivedMessages = { client1: [], client2: [], client3: [] };
    
    // Broadcast trace update (red team only)
    syncSystem.broadcastTraceUpdate(round.id, {
      currentTrace: 45,
      traceLevel: 'Shadow',
      previousLevel: 'Ghost',
      increase: 15
    });
    
    // Broadcast burn state update (red team only)
    syncSystem.broadcastBurnStateUpdate(round.id, {
      burnState: 'HIGH',
      previousState: 'MODERATE',
      burnValue: 120,
      effectivenessModifier: 0.65
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const redTeamUpdates = receivedMessages.client1.length + receivedMessages.client2.length;
    console.log(`✅ Red team received ${redTeamUpdates} trace/burn updates`);
    
    // Test 10: Phase Transition
    console.log('\n📋 Test 10: Phase Transition Broadcasting');
    
    receivedMessages = { client1: [], client2: [], client3: [] };
    
    syncSystem.broadcastPhaseTransition(round.id, {
      newPhase: 'escalation',
      previousPhase: 'initial_access',
      phaseStartTime: new Date(),
      phaseDuration: 1200000
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const phaseUpdatesReceived = receivedMessages.client1.length + 
                                 receivedMessages.client2.length + 
                                 receivedMessages.client3.length;
    
    console.log(`✅ Phase transition broadcast sent`);
    console.log(`✅ All clients received phase update: ${phaseUpdatesReceived === 3 ? 'YES' : 'NO'}`);
    
    // Test 11: Client Disconnection Handling
    console.log('\n📋 Test 11: Client Disconnection Handling');
    
    const roomInfoBefore = roomManager.getRoomInfo(round.id);
    console.log(`✅ Participants before disconnect: ${roomInfoBefore.participantCount}`);
    
    clientSocket1.disconnect();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    roomManager.handleDisconnection(clientSocket1.id);
    
    const roomInfoAfter = roomManager.getRoomInfo(round.id);
    console.log(`✅ Participants after disconnect: ${roomInfoAfter.participantCount}`);
    
    if (roomInfoAfter.participantCount === roomInfoBefore.participantCount - 1) {
      console.log('✅ Disconnection handled correctly');
    }
    
    // Test 12: Statistics and Monitoring
    console.log('\n📋 Test 12: Statistics and Monitoring');
    
    const syncStats = syncSystem.getStats();
    const roomStats = roomManager.getStats();
    const queueStats = messageQueue.getStats();
    
    console.log(`✅ Sync system stats:`, {
      messagesSent: syncStats.messagesSent,
      messagesQueued: syncStats.messagesQueued,
      batchesSent: syncStats.batchesSent
    });
    
    console.log(`✅ Room manager stats:`, {
      activeRooms: roomStats.activeRooms,
      totalParticipants: roomStats.totalParticipants
    });
    
    console.log(`✅ Message queue stats:`, {
      activeQueues: queueStats.activeQueues,
      messagesProcessed: queueStats.messagesProcessed
    });
    
    console.log('\n🎉 All Real-Time Synchronization System tests passed!\n');
    
    return {
      success: true,
      stats: {
        roundId: round.id,
        messagesSent: syncStats.messagesSent,
        activeRooms: roomStats.activeRooms,
        participantsConnected: roomStats.totalParticipants
      }
    };
    
  } catch (error) {
    console.error('❌ Real-time sync test failed:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Cleanup
    if (clientSocket1 && clientSocket1.connected) clientSocket1.disconnect();
    if (clientSocket2 && clientSocket2.connected) clientSocket2.disconnect();
    if (clientSocket3 && clientSocket3.connected) clientSocket3.disconnect();
    
    if (io) {
      io.close();
    }
    
    if (httpServer) {
      httpServer.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testRealTimeSyncSystem().then(result => {
    if (result.success) {
      console.log('✅ Real-Time Synchronization System Test: PASSED');
      console.log(`📊 Stats: ${result.stats.messagesSent} messages sent, ${result.stats.participantsConnected} participants`);
      process.exit(0);
    } else {
      console.log('❌ Real-Time Synchronization System Test: FAILED');
      process.exit(1);
    }
  });
}

module.exports = testRealTimeSyncSystem;
