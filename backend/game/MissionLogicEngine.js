// Mission Logic Engine for NEXUS PROTOCOL
// Manages round lifecycle, phase transitions, task dependencies, and agent routing

const { v4: uuidv4 } = require('uuid');

class MissionLogicEngine {
  constructor(database, taskGraph, agentRouter, toolExecutionEngine = null, traceBurnSystem = null) {
    this.database = database;
    this.taskGraph = taskGraph;
    this.agentRouter = agentRouter;
    this.toolExecutionEngine = toolExecutionEngine;
    this.traceBurnSystem = traceBurnSystem;
    this.activeRounds = new Map();
    
    // Phase configuration
    this.phases = {
      INITIAL_ACCESS: { id: 'initial_access', duration: 20 * 60 * 1000, order: 1 },
      ESCALATION: { id: 'escalation', duration: 20 * 60 * 1000, order: 2 },
      IMPACT_RECOVERY: { id: 'impact_recovery', duration: 20 * 60 * 1000, order: 3 }
    };
    
    this.ROUND_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds
  }

  /**
   * Start a new round with Initial Access phase
   * @param {Object} config - Round configuration
   * @returns {Object} Round instance
   */
  startRound(config) {
    const roundId = uuidv4();
    const now = new Date();
    
    const round = {
      id: roundId,
      startTime: now,
      endTime: new Date(now.getTime() + this.ROUND_DURATION),
      currentPhase: 'initial_access',
      phaseStartTime: now,
      redTeamId: config.redTeamId,
      blueTeamId: config.blueTeamId,
      redScore: 0,
      blueScore: 0,
      status: 'active',
      systemStates: new Map(),
      completedTasks: new Set(),
      events: []
    };
    
    // Initialize task dependency graph for this round
    this.taskGraph.initializeForRound(roundId);
    
    // Initialize trace & burn system for this round
    if (this.traceBurnSystem) {
      this.traceBurnSystem.initializeRound(roundId, config.redTeamId);
    }
    
    // Store round
    this.activeRounds.set(roundId, round);
    
    // Log round start event
    this.logEvent(round, 'round_started', {
      roundId,
      redTeamId: config.redTeamId,
      blueTeamId: config.blueTeamId,
      phase: 'initial_access'
    });
    
    return round;
  }

  /**
   * Update phase based on elapsed time or early completion
   * @param {string} roundId - Round identifier
   * @returns {Object} Phase transition result
   */
  updatePhase(roundId) {
    const round = this.activeRounds.get(roundId);
    if (!round || round.status !== 'active') {
      throw new Error('Round not found or not active');
    }

    const now = new Date();
    const elapsedTime = now - round.phaseStartTime;
    const currentPhaseConfig = this.phases[round.currentPhase.toUpperCase()];
    
    // Check if phase objectives are complete (early transition)
    const phaseComplete = this.checkPhaseObjectivesComplete(round);
    
    // Check if time-based transition is needed
    const timeExpired = elapsedTime >= currentPhaseConfig.duration;
    
    if (phaseComplete || timeExpired) {
      return this.transitionPhase(round, phaseComplete ? 'objectives_complete' : 'time_expired');
    }
    
    return {
      transitioned: false,
      currentPhase: round.currentPhase,
      timeRemaining: currentPhaseConfig.duration - elapsedTime
    };
  }

  /**
   * Transition to next phase
   * @param {Object} round - Round instance
   * @param {string} reason - Transition reason
   * @returns {Object} Transition result
   */
  transitionPhase(round, reason) {
    const currentPhaseConfig = this.phases[round.currentPhase.toUpperCase()];
    const nextPhaseOrder = currentPhaseConfig.order + 1;
    
    // Find next phase
    const nextPhase = Object.values(this.phases).find(p => p.order === nextPhaseOrder);
    
    if (!nextPhase) {
      // No more phases, end round
      return this.endRound(round.id);
    }
    
    // Update phase
    const previousPhase = round.currentPhase;
    round.currentPhase = nextPhase.id;
    round.phaseStartTime = new Date();
    
    // Unlock tasks for new phase
    const unlockedTasks = this.taskGraph.unlockPhaseObjectives(round.id, nextPhase.id);
    
    // Log phase transition
    this.logEvent(round, 'phase_transition', {
      previousPhase,
      newPhase: nextPhase.id,
      reason,
      unlockedTasks: unlockedTasks.length
    });
    
    return {
      transitioned: true,
      previousPhase,
      currentPhase: nextPhase.id,
      reason,
      unlockedTasks
    };
  }

  /**
   * Check if all phase objectives are complete
   * @param {Object} round - Round instance
   * @returns {boolean} True if phase objectives complete
   */
  checkPhaseObjectivesComplete(round) {
    const phaseObjectives = this.taskGraph.getPhaseObjectives(round.id, round.currentPhase);
    const requiredObjectives = phaseObjectives.filter(obj => obj.required);
    
    return requiredObjectives.every(obj => round.completedTasks.has(obj.id));
  }

  /**
   * Unlock dependent tasks when a task is completed
   * @param {string} roundId - Round identifier
   * @param {string} taskId - Completed task identifier
   * @returns {Array} Unlocked tasks
   */
  unlockTasks(roundId, taskId) {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }
    
    // Mark task as completed
    round.completedTasks.add(taskId);
    
    // Get dependent tasks
    const unlockedTasks = this.taskGraph.unlockDependents(roundId, taskId);
    
    // Log unlock event
    this.logEvent(round, 'tasks_unlocked', {
      completedTask: taskId,
      unlockedTasks: unlockedTasks.map(t => t.id)
    });
    
    return unlockedTasks;
  }

  /**
   * Route task to appropriate agent
   * @param {Object} task - Task to route
   * @returns {string} Agent type
   */
  routeTask(task) {
    return this.agentRouter.routeToAgent(task);
  }

  /**
   * Validate task completion against system state
   * @param {string} roundId - Round identifier
   * @param {string} taskId - Task identifier
   * @returns {Promise<Object>} Validation result
   */
  async validateTaskCompletion(roundId, taskId) {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }
    
    // Get task details
    const task = this.taskGraph.getTask(roundId, taskId);
    if (!task) {
      return {
        valid: false,
        reason: 'task_not_found',
        message: `Task ${taskId} not found`
      };
    }
    
    // Validate dependencies using enhanced validation
    const dependencyValidation = this.taskGraph.validateDependencies(
      roundId,
      taskId,
      round.completedTasks
    );
    
    if (!dependencyValidation.valid) {
      return dependencyValidation;
    }
    
    // TODO: Integrate with Cyber Range Validator for real system state validation
    // For now, return basic validation with enhanced details
    return {
      valid: true,
      task,
      prerequisites: dependencyValidation.prerequisites,
      timestamp: new Date(),
      validationType: 'basic' // Will be 'system_state' when validator is integrated
    };
  }

  /**
   * Complete a task and unlock dependents
   * @param {string} roundId - Round identifier
   * @param {string} taskId - Task identifier
   * @param {Object} completionData - Task completion data
   * @returns {Object} Completion result
   */
  async completeTask(roundId, taskId, completionData = {}) {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }

    // Validate task can be completed
    const validation = await this.validateTaskCompletion(roundId, taskId);
    if (!validation.valid) {
      return {
        success: false,
        ...validation
      };
    }

    const task = validation.task;
    
    // Mark task as completed and unlock dependents
    const unlockedTasks = this.unlockTasks(roundId, taskId);
    
    // Award points
    const points = this.calculateTaskPoints(task, completionData);
    if (task.team === 'red') {
      round.redScore += points;
    } else if (task.team === 'blue') {
      round.blueScore += points;
    }
    
    // Log completion event
    this.logEvent(round, 'task_completed', {
      taskId,
      taskName: task.name,
      team: task.team,
      agentType: task.agentType,
      points,
      unlockedTasks: unlockedTasks.map(t => t.id),
      completionData
    });
    
    // Check if phase objectives are complete for early transition
    const phaseComplete = this.checkPhaseObjectivesComplete(round);
    if (phaseComplete) {
      const transitionResult = this.transitionPhase(round, 'objectives_complete');
      return {
        success: true,
        task,
        points,
        unlockedTasks,
        phaseTransition: transitionResult
      };
    }
    
    return {
      success: true,
      task,
      points,
      unlockedTasks,
      newScore: task.team === 'red' ? round.redScore : round.blueScore
    };
  }

  /**
   * Calculate points for task completion
   * @param {Object} task - Task object
   * @param {Object} completionData - Completion data
   * @returns {number} Points awarded
   */
  calculateTaskPoints(task, completionData) {
    let basePoints = task.points || 100;
    
    // Phase multiplier
    const phaseMultipliers = {
      'initial_access': 1.0,
      'escalation': 1.2,
      'impact_recovery': 1.5
    };
    
    const phaseMultiplier = phaseMultipliers[task.phase] || 1.0;
    
    // Speed bonus (if completed quickly)
    let speedBonus = 1.0;
    if (completionData.timeBonus) {
      speedBonus = 1.0 + (completionData.timeBonus * 0.1);
    }
    
    // Stealth bonus (for red team)
    let stealthBonus = 1.0;
    if (task.team === 'red' && completionData.stealthBonus) {
      stealthBonus = 1.0 + (completionData.stealthBonus * 0.05);
    }
    
    return Math.floor(basePoints * phaseMultiplier * speedBonus * stealthBonus);
  }

  /**
   * End round and calculate final scores
   * @param {string} roundId - Round identifier
   * @returns {Object} Round result
   */
  endRound(roundId) {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }
    
    const now = new Date();
    const duration = now - round.startTime;
    
    round.status = 'completed';
    round.completedAt = now;
    round.duration = duration;
    
    // Calculate final scores (basic implementation)
    const result = {
      roundId,
      status: 'completed',
      duration,
      redTeamScore: round.redScore,
      blueTeamScore: round.blueScore,
      winner: round.redScore > round.blueScore ? 'red' : 'blue',
      completedTasks: Array.from(round.completedTasks),
      finalPhase: round.currentPhase
    };
    
    // Log round end
    this.logEvent(round, 'round_ended', result);
    
    // Remove from active rounds
    this.activeRounds.delete(roundId);
    
    return result;
  }

  /**
   * Get round status
   * @param {string} roundId - Round identifier
   * @returns {Object} Round status
   */
  getRoundStatus(roundId) {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }
    
    const now = new Date();
    const elapsed = now - round.startTime;
    const remaining = this.ROUND_DURATION - elapsed;
    
    // Get task statistics
    const availableTasks = this.taskGraph.getAvailableTasks(roundId, round.completedTasks);
    const graphData = this.taskGraph.getGraphData(roundId);
    
    return {
      roundId: round.id,
      status: round.status,
      currentPhase: round.currentPhase,
      phaseStartTime: round.phaseStartTime,
      timeElapsed: elapsed,
      timeRemaining: Math.max(0, remaining),
      redScore: round.redScore,
      blueScore: round.blueScore,
      completedTasks: Array.from(round.completedTasks),
      availableTasks: availableTasks.map(t => ({
        id: t.id,
        name: t.name,
        team: t.team,
        agentType: t.agentType,
        points: t.points,
        required: t.required
      })),
      taskStats: graphData.stats
    };
  }

  /**
   * Get available tasks for a team
   * @param {string} roundId - Round identifier
   * @param {string} team - Team ('red' or 'blue')
   * @returns {Array} Available tasks for the team
   */
  getAvailableTasksForTeam(roundId, team) {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }
    
    const availableTasks = this.taskGraph.getAvailableTasks(roundId, round.completedTasks);
    return availableTasks.filter(task => task.team === team);
  }

  /**
   * Get task details with dependency information
   * @param {string} roundId - Round identifier
   * @param {string} taskId - Task identifier
   * @returns {Object} Task details with dependencies
   */
  getTaskDetails(roundId, taskId) {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }
    
    const task = this.taskGraph.getTask(roundId, taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    
    const dependencyChain = this.taskGraph.getDependencyChain(roundId, taskId);
    const validation = this.taskGraph.validateDependencies(roundId, taskId, round.completedTasks);
    
    return {
      ...task,
      dependencyChain,
      validation,
      canAttempt: validation.valid,
      estimatedPoints: this.calculateTaskPoints(task, {})
    };
  }

  /**
   * Get round analytics and statistics
   * @param {string} roundId - Round identifier
   * @returns {Object} Round analytics
   */
  getRoundAnalytics(roundId) {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }
    
    const graphData = this.taskGraph.getGraphData(roundId);
    const criticalPath = this.taskGraph.getCriticalPath(roundId);
    const circularDeps = this.taskGraph.checkCircularDependencies(roundId);
    
    // Calculate team progress
    const redTasks = graphData.nodes.filter(n => n.team === 'red');
    const blueTasks = graphData.nodes.filter(n => n.team === 'blue');
    
    const redProgress = {
      total: redTasks.length,
      completed: redTasks.filter(t => t.status === 'completed').length,
      available: redTasks.filter(t => t.available && t.status !== 'completed').length,
      locked: redTasks.filter(t => t.status === 'locked').length
    };
    
    const blueProgress = {
      total: blueTasks.length,
      completed: blueTasks.filter(t => t.status === 'completed').length,
      available: blueTasks.filter(t => t.available && t.status !== 'completed').length,
      locked: blueTasks.filter(t => t.status === 'locked').length
    };
    
    return {
      roundId,
      phase: round.currentPhase,
      scores: {
        red: round.redScore,
        blue: round.blueScore
      },
      progress: {
        red: redProgress,
        blue: blueProgress
      },
      taskStats: graphData.stats,
      criticalPath,
      issues: {
        circularDependencies: circularDeps.length > 0 ? circularDeps : null
      },
      events: round.events.slice(-10) // Last 10 events
    };
  }

  /**
   * Log event to round history
   * @param {Object} round - Round instance
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  logEvent(round, eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date(),
      data
    };
    
    round.events.push(event);
  }

  /**
   * Execute a tool during a round
   * @param {string} roundId - Round identifier
   * @param {string} toolId - Tool identifier
   * @param {string} agentId - Agent identifier
   * @param {Object} target - Target information
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(roundId, toolId, agentId, target, params = {}) {
    if (!this.toolExecutionEngine) {
      throw new Error('Tool execution engine not available');
    }

    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }

    if (round.status !== 'active') {
      throw new Error('Round is not active');
    }

    // Determine agent type and team from agentId
    const agentInfo = this.parseAgentId(agentId);
    
    // Calculate current burn state (simplified - could be more sophisticated)
    const burnState = this.calculateBurnState(round, agentInfo.team);

    // Execute the tool
    const context = {
      roundId,
      agentId,
      agentType: agentInfo.type,
      team: agentInfo.team,
      burnState,
      params
    };

    try {
      const result = await this.toolExecutionEngine.executeTool(toolId, target, context);
      
      // Accumulate trace if Trace & Burn system is available and team is red
      if (this.traceBurnSystem && agentInfo.team === 'red' && result.traceGenerated > 0) {
        const traceResult = this.traceBurnSystem.accumulateTrace(roundId, {
          toolId,
          agentType: agentInfo.type,
          category: result.category,
          observable: result.observable,
          success: result.success,
          effectiveness: result.effectiveness,
          traceGeneration: result.traceGenerated
        });
        
        // Add trace data to result
        result.traceData = {
          traceGenerated: traceResult.traceGenerated,
          totalTrace: traceResult.currentTrace,
          traceLevel: traceResult.currentLevel,
          burnState: traceResult.currentBurnState,
          levelChanged: traceResult.levelChanged,
          burnStateChanged: traceResult.burnStateChanged
        };
      }
      
      // Log the tool execution
      this.logEvent(round, 'tool_executed', {
        toolId,
        agentId,
        target,
        success: result.success,
        traceGenerated: result.traceGenerated || 0
      });

      // Update system states if there were changes
      if (result.systemStateChanges) {
        result.systemStateChanges.forEach(change => {
          this.updateSystemState(round, change);
        });
      }

      return result;

    } catch (error) {
      this.logEvent(round, 'tool_execution_error', {
        toolId,
        agentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get available tools for an agent
   * @param {string} roundId - Round identifier
   * @param {string} agentId - Agent identifier
   * @returns {Array} Available tools
   */
  getAvailableTools(roundId, agentId) {
    if (!this.toolExecutionEngine) {
      return [];
    }

    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error('Round not found');
    }

    const agentInfo = this.parseAgentId(agentId);
    return this.toolExecutionEngine.getAvailableTools(agentInfo.type, agentInfo.team);
  }

  /**
   * Get tool execution history for a round
   * @param {string} roundId - Round identifier
   * @returns {Array} Tool execution history
   */
  getToolExecutionHistory(roundId) {
    if (!this.toolExecutionEngine) {
      return [];
    }

    return this.toolExecutionEngine.getExecutionHistory(roundId);
  }

  /**
   * Parse agent ID to extract type and team information
   * @param {string} agentId - Agent identifier (e.g., 'architect-1', 'sentinel-2')
   * @returns {Object} Agent information
   */
  parseAgentId(agentId) {
    const parts = agentId.toLowerCase().split('-');
    const agentType = parts[0].toUpperCase();
    
    // Determine team based on agent type
    const redAgents = ['ARCHITECT', 'SPECTER', 'ORACLE'];
    const blueAgents = ['SENTINEL', 'WARDEN', 'RESTORER'];
    
    let team;
    if (redAgents.includes(agentType)) {
      team = 'red';
    } else if (blueAgents.includes(agentType)) {
      team = 'blue';
    } else {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    return {
      type: agentType,
      team,
      id: agentId
    };
  }

  /**
   * Get trace & burn data for a round
   * @param {string} roundId - Round identifier
   * @returns {Object} Trace & burn data
   */
  getTraceData(roundId) {
    if (!this.traceBurnSystem) {
      return null;
    }
    
    return this.traceBurnSystem.getTraceData(roundId);
  }

  /**
   * Get trace history for a round
   * @param {string} roundId - Round identifier
   * @param {number} limit - Maximum entries
   * @returns {Array} Trace history
   */
  getTraceHistory(roundId, limit = 20) {
    if (!this.traceBurnSystem) {
      return [];
    }
    
    return this.traceBurnSystem.getTraceHistory(roundId, limit);
  }

  /**
   * Calculate current burn state for a team
   * @param {Object} round - Round instance
   * @param {string} team - Team ('red' or 'blue')
   * @returns {string} Burn state ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')
   */
  calculateBurnState(round, team) {
    if (team !== 'red') {
      return 'LOW'; // Blue team doesn't have burn state
    }

    // Use Trace & Burn system if available
    if (this.traceBurnSystem) {
      const traceData = this.traceBurnSystem.getTraceData(round.id);
      return traceData ? traceData.burnState : 'LOW';
    }

    // Fallback to old calculation
    const redEvents = round.events.filter(e => 
      e.type === 'tool_executed' && 
      e.data.agentId && 
      this.parseAgentId(e.data.agentId).team === 'red'
    );

    const totalTrace = redEvents.reduce((sum, event) => 
      sum + (event.data.traceGenerated || 0), 0
    );

    // Convert trace to burn state (simplified calculation)
    if (totalTrace < 50) return 'LOW';
    if (totalTrace < 100) return 'MODERATE';
    if (totalTrace < 200) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Update system state based on tool execution
   * @param {Object} round - Round instance
   * @param {Object} stateChange - State change information
   */
  updateSystemState(round, stateChange) {
    const key = `${stateChange.target}_${stateChange.type}`;
    round.systemStates.set(key, {
      ...stateChange,
      timestamp: new Date()
    });

    this.logEvent(round, 'system_state_changed', stateChange);
  }

  /**
   * Update burn state for a team
   * @param {Object} round - Round instance
   * @param {string} team - Team identifier
   * @param {number} traceAmount - Amount of trace to add
   */
  updateBurnState(round, team, traceAmount) {
    if (team !== 'red') return; // Only red team has burn state

    const currentBurn = round.burnState || 0;
    const newBurn = currentBurn + traceAmount;
    round.burnState = newBurn;

    // Log burn state changes at thresholds
    const oldState = this.getBurnStateFromValue(currentBurn);
    const newState = this.getBurnStateFromValue(newBurn);
    
    if (oldState !== newState) {
      this.logEvent(round, 'burn_state_changed', {
        team,
        oldState,
        newState,
        burnValue: newBurn
      });
    }
  }

  /**
   * Convert burn value to burn state
   * @param {number} burnValue - Numeric burn value
   * @returns {string} Burn state
   */
  getBurnStateFromValue(burnValue) {
    if (burnValue < 50) return 'LOW';
    if (burnValue < 100) return 'MODERATE';
    if (burnValue < 200) return 'HIGH';
    return 'CRITICAL';
  }
}

module.exports = MissionLogicEngine;
