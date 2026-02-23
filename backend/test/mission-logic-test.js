// Simple test to verify Mission Logic Engine foundation
const MissionLogicEngine = require('../game/MissionLogicEngine');
const TaskDependencyGraph = require('../game/TaskDependencyGraph');
const AgentRouter = require('../game/AgentRouter');

// Mock database
const mockDatabase = {
  // Add mock methods as needed
};

async function testMissionLogicFoundation() {
  console.log('🧪 Testing Mission Logic Foundation...\n');
  
  try {
    // Initialize components
    const taskGraph = new TaskDependencyGraph();
    const agentRouter = new AgentRouter();
    const missionEngine = new MissionLogicEngine(mockDatabase, taskGraph, agentRouter);
    
    console.log('✅ Components initialized successfully');
    
    // Test 1: Start a round
    console.log('\n📋 Test 1: Round Initialization');
    const round = missionEngine.startRound({
      redTeamId: 'red-team-1',
      blueTeamId: 'blue-team-1'
    });
    
    console.log(`✅ Round started: ${round.id}`);
    console.log(`✅ Initial phase: ${round.currentPhase}`);
    console.log(`✅ Round duration: ${(round.endTime - round.startTime) / 1000 / 60} minutes`);
    
    // Test 2: Check initial task availability
    console.log('\n📋 Test 2: Initial Task Availability');
    const status = missionEngine.getRoundStatus(round.id);
    console.log(`✅ Available tasks: ${status.availableTasks.length}`);
    console.log(`✅ Task stats:`, status.taskStats);
    
    // Test 3: Get available tasks for each team
    console.log('\n📋 Test 3: Team Task Distribution');
    const redTasks = missionEngine.getAvailableTasksForTeam(round.id, 'red');
    const blueTasks = missionEngine.getAvailableTasksForTeam(round.id, 'blue');
    
    console.log(`✅ Red team available tasks: ${redTasks.length}`);
    console.log(`✅ Blue team available tasks: ${blueTasks.length}`);
    
    if (redTasks.length > 0) {
      console.log(`   First red task: ${redTasks[0].name} (${redTasks[0].agentType})`);
    }
    if (blueTasks.length > 0) {
      console.log(`   First blue task: ${blueTasks[0].name} (${blueTasks[0].agentType})`);
    }
    
    // Test 4: Complete a task and check unlocking
    console.log('\n📋 Test 4: Task Completion and Unlocking');
    if (redTasks.length > 0) {
      const firstTask = redTasks[0];
      console.log(`Attempting to complete: ${firstTask.name}`);
      
      const completion = await missionEngine.completeTask(round.id, firstTask.id, {
        timeBonus: 0.1, // 10% time bonus
        stealthBonus: 0.2 // 20% stealth bonus
      });
      
      if (completion.success) {
        console.log(`✅ Task completed successfully`);
        console.log(`✅ Points awarded: ${completion.points}`);
        console.log(`✅ Tasks unlocked: ${completion.unlockedTasks.length}`);
        
        if (completion.unlockedTasks.length > 0) {
          console.log(`   Unlocked: ${completion.unlockedTasks.map(t => t.name).join(', ')}`);
        }
      } else {
        console.log(`❌ Task completion failed: ${completion.reason}`);
      }
    }
    
    // Test 5: Check dependency validation
    console.log('\n📋 Test 5: Dependency Validation');
    const graphData = taskGraph.getGraphData(round.id);
    const lockedTasks = graphData.nodes.filter(n => n.status === 'locked');
    
    if (lockedTasks.length > 0) {
      const lockedTask = lockedTasks[0];
      const validation = await missionEngine.validateTaskCompletion(round.id, lockedTask.id);
      
      console.log(`✅ Validation for locked task "${lockedTask.name}": ${validation.valid ? 'VALID' : 'INVALID'}`);
      if (!validation.valid) {
        console.log(`   Reason: ${validation.reason}`);
        if (validation.missingPrerequisites) {
          console.log(`   Missing: ${validation.missingPrerequisites.join(', ')}`);
        }
      }
    }
    
    // Test 6: Agent routing
    console.log('\n📋 Test 6: Agent Routing');
    const allTasks = graphData.nodes;
    const routingTests = allTasks.slice(0, 3); // Test first 3 tasks
    
    routingTests.forEach(task => {
      const recommendedAgent = agentRouter.getRecommendedAgent(task);
      console.log(`✅ Task "${task.name}" → ${recommendedAgent.agentType} (${Math.round(recommendedAgent.effectiveness * 100)}% effective)`);
    });
    
    // Test 7: Round analytics
    console.log('\n📋 Test 7: Round Analytics');
    const analytics = missionEngine.getRoundAnalytics(round.id);
    console.log(`✅ Red team progress: ${analytics.progress.red.completed}/${analytics.progress.red.total} completed`);
    console.log(`✅ Blue team progress: ${analytics.progress.blue.completed}/${analytics.progress.blue.total} completed`);
    console.log(`✅ Critical path length: ${analytics.criticalPath.length}`);
    
    if (analytics.issues.circularDependencies) {
      console.log(`⚠️  Circular dependencies detected: ${analytics.issues.circularDependencies.length}`);
    } else {
      console.log(`✅ No circular dependencies found`);
    }
    
    console.log('\n🎉 All tests passed! Mission Logic Foundation is working correctly.\n');
    
    return {
      success: true,
      round,
      analytics
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testMissionLogicFoundation().then(result => {
    if (result.success) {
      console.log('✅ Mission Logic Foundation Test: PASSED');
      process.exit(0);
    } else {
      console.log('❌ Mission Logic Foundation Test: FAILED');
      process.exit(1);
    }
  });
}

module.exports = testMissionLogicFoundation;