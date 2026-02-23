// Task Dependency Graph for NEXUS PROTOCOL
// Manages task dependencies, unlocking, and availability

class TaskDependencyGraph {
  constructor() {
    // Map of roundId -> task graph
    this.graphs = new Map();
  }

  /**
   * Initialize task graph for a round
   * @param {string} roundId - Round identifier
   */
  initializeForRound(roundId) {
    const graph = {
      nodes: new Map(),
      edges: new Map(),
      availableTasks: new Set(),
      completedTasks: new Set()
    };
    
    // Store the graph first
    this.graphs.set(roundId, graph);
    
    // Define tasks with dependencies
    const tasks = this.getDefaultTasks();
    
    tasks.forEach(task => {
      this.addTask(roundId, task, task.prerequisites || []);
    });
  }

  /**
   * Get default task definitions
   * @returns {Array} Task definitions
   */
  getDefaultTasks() {
    return [
      // Phase 1: Initial Access (Red Team)
      {
        id: 'red_recon_network',
        name: 'Network Reconnaissance',
        phase: 'initial_access',
        team: 'red',
        agentType: 'ORACLE',
        required: true,
        points: 100,
        prerequisites: []
      },
      {
        id: 'red_scan_services',
        name: 'Service Discovery',
        phase: 'initial_access',
        team: 'red',
        agentType: 'ORACLE',
        required: true,
        points: 100,
        prerequisites: ['red_recon_network']
      },
      {
        id: 'red_exploit_web',
        name: 'Web Application Exploitation',
        phase: 'initial_access',
        team: 'red',
        agentType: 'ARCHITECT',
        required: true,
        points: 150,
        prerequisites: ['red_scan_services']
      },
      
      // Phase 1: Initial Access (Blue Team)
      {
        id: 'blue_enable_ids',
        name: 'Enable IDS Monitoring',
        phase: 'initial_access',
        team: 'blue',
        agentType: 'SENTINEL',
        required: true,
        points: 100,
        prerequisites: []
      },
      {
        id: 'blue_baseline_traffic',
        name: 'Establish Traffic Baseline',
        phase: 'initial_access',
        team: 'blue',
        agentType: 'SENTINEL',
        required: true,
        points: 100,
        prerequisites: ['blue_enable_ids']
      },
      
      // Phase 2: Escalation (Red Team)
      {
        id: 'red_credential_dump',
        name: 'Credential Harvesting',
        phase: 'escalation',
        team: 'red',
        agentType: 'SPECTER',
        required: true,
        points: 200,
        prerequisites: ['red_exploit_web']
      },
      {
        id: 'red_lateral_movement',
        name: 'Lateral Movement',
        phase: 'escalation',
        team: 'red',
        agentType: 'SPECTER',
        required: true,
        points: 200,
        prerequisites: ['red_credential_dump']
      },
      {
        id: 'red_privilege_escalation',
        name: 'Privilege Escalation',
        phase: 'escalation',
        team: 'red',
        agentType: 'ARCHITECT',
        required: true,
        points: 250,
        prerequisites: ['red_lateral_movement']
      },
      
      // Phase 2: Escalation (Blue Team)
      {
        id: 'blue_detect_anomaly',
        name: 'Detect Anomalous Activity',
        phase: 'escalation',
        team: 'blue',
        agentType: 'SENTINEL',
        required: true,
        points: 150,
        prerequisites: ['blue_baseline_traffic']
      },
      {
        id: 'blue_contain_threat',
        name: 'Contain Threat',
        phase: 'escalation',
        team: 'blue',
        agentType: 'WARDEN',
        required: true,
        points: 200,
        prerequisites: ['blue_detect_anomaly']
      },
      {
        id: 'blue_block_ip',
        name: 'Block Malicious IPs',
        phase: 'escalation',
        team: 'blue',
        agentType: 'WARDEN',
        required: true,
        points: 150,
        prerequisites: ['blue_detect_anomaly']
      },
      
      // Phase 3: Impact/Recovery (Red Team)
      {
        id: 'red_establish_persistence',
        name: 'Establish Persistence',
        phase: 'impact_recovery',
        team: 'red',
        agentType: 'ORACLE',
        required: true,
        points: 300,
        prerequisites: ['red_privilege_escalation']
      },
      {
        id: 'red_data_exfiltration',
        name: 'Data Exfiltration',
        phase: 'impact_recovery',
        team: 'red',
        agentType: 'SPECTER',
        required: true,
        points: 350,
        prerequisites: ['red_establish_persistence']
      },
      
      // Phase 3: Impact/Recovery (Blue Team)
      {
        id: 'blue_forensics',
        name: 'Forensic Analysis',
        phase: 'impact_recovery',
        team: 'blue',
        agentType: 'RESTORER',
        required: true,
        points: 200,
        prerequisites: ['blue_contain_threat']
      },
      {
        id: 'blue_remove_persistence',
        name: 'Remove Persistence Mechanisms',
        phase: 'impact_recovery',
        team: 'blue',
        agentType: 'RESTORER',
        required: true,
        points: 250,
        prerequisites: ['blue_forensics']
      },
      {
        id: 'blue_system_restore',
        name: 'System Restoration',
        phase: 'impact_recovery',
        team: 'blue',
        agentType: 'RESTORER',
        required: true,
        points: 300,
        prerequisites: ['blue_remove_persistence']
      }
    ];
  }

  /**
   * Add task to graph
   * @param {string} roundId - Round identifier
   * @param {Object} task - Task definition
   * @param {Array} prerequisites - Task prerequisites
   */
  addTask(roundId, task, prerequisites = []) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }
    
    // Validate prerequisites exist
    for (const prereq of prerequisites) {
      if (!graph.nodes.has(prereq) && prereq !== task.id) {
        // Allow forward references - will be validated later
        console.warn(`Forward reference to prerequisite ${prereq} for task ${task.id}`);
      }
    }
    
    // Add node
    graph.nodes.set(task.id, {
      ...task,
      prerequisites,
      status: 'locked',
      available: prerequisites.length === 0 && task.phase === 'initial_access',
      dependents: [], // Tasks that depend on this one
      unlockTime: null,
      completionTime: null
    });
    
    // Add edges (prerequisites -> task)
    graph.edges.set(task.id, prerequisites);
    
    // Update dependents for prerequisite tasks
    for (const prereq of prerequisites) {
      if (graph.nodes.has(prereq)) {
        graph.nodes.get(prereq).dependents.push(task.id);
      }
    }
    
    // Mark as available if no prerequisites and in initial phase
    if (prerequisites.length === 0 && task.phase === 'initial_access') {
      graph.availableTasks.add(task.id);
      graph.nodes.get(task.id).status = 'available';
      graph.nodes.get(task.id).unlockTime = new Date();
    }
  }

  /**
   * Get available tasks for a round
   * @param {string} roundId - Round identifier
   * @param {Set} completedTasks - Set of completed task IDs
   * @returns {Array} Available tasks
   */
  getAvailableTasks(roundId, completedTasks) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }
    
    const available = [];
    
    for (const [taskId, task] of graph.nodes.entries()) {
      if (completedTasks.has(taskId)) {
        continue;
      }
      
      // Check if all prerequisites are met
      const prerequisites = graph.edges.get(taskId) || [];
      const prerequisitesMet = prerequisites.every(prereq => completedTasks.has(prereq));
      
      if (prerequisitesMet && task.available) {
        available.push(task);
      }
    }
    
    return available;
  }

  /**
   * Unlock dependent tasks when a task is completed
   * @param {string} roundId - Round identifier
   * @param {string} taskId - Completed task ID
   * @returns {Array} Unlocked tasks
   */
  unlockDependents(roundId, taskId) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }
    
    const unlocked = [];
    const completedTask = graph.nodes.get(taskId);
    
    if (!completedTask) {
      throw new Error(`Task ${taskId} not found in graph`);
    }
    
    // Mark task as completed
    graph.completedTasks.add(taskId);
    graph.availableTasks.delete(taskId);
    completedTask.status = 'completed';
    completedTask.completionTime = new Date();
    
    // Check all tasks that might be unlocked
    for (const [dependentId, prerequisites] of graph.edges.entries()) {
      if (prerequisites.includes(taskId)) {
        const dependentTask = graph.nodes.get(dependentId);
        
        if (!dependentTask || dependentTask.available || graph.completedTasks.has(dependentId)) {
          continue; // Skip if already available or completed
        }
        
        // Check if all prerequisites are now met
        const allPrerequisitesMet = prerequisites.every(prereq => 
          graph.completedTasks.has(prereq)
        );
        
        if (allPrerequisitesMet) {
          dependentTask.available = true;
          dependentTask.status = 'available';
          dependentTask.unlockTime = new Date();
          graph.availableTasks.add(dependentId);
          unlocked.push(dependentTask);
          
          // Log the unlock chain
          console.log(`Task ${dependentId} unlocked by completion of ${taskId}`);
        }
      }
    }
    
    return unlocked;
  }

  /**
   * Validate task dependencies
   * @param {string} roundId - Round identifier
   * @param {string} taskId - Task ID to validate
   * @param {Set} completedTasks - Set of completed task IDs
   * @returns {Object} Validation result with details
   */
  validateDependencies(roundId, taskId, completedTasks) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }
    
    const task = graph.nodes.get(taskId);
    if (!task) {
      return {
        valid: false,
        reason: 'task_not_found',
        message: `Task ${taskId} not found`
      };
    }
    
    // Check if task is already completed
    if (completedTasks.has(taskId)) {
      return {
        valid: false,
        reason: 'already_completed',
        message: `Task ${taskId} is already completed`
      };
    }
    
    // Check if task is available
    if (!task.available) {
      return {
        valid: false,
        reason: 'not_available',
        message: `Task ${taskId} is not yet available`
      };
    }
    
    const prerequisites = graph.edges.get(taskId) || [];
    const missingPrerequisites = prerequisites.filter(prereq => !completedTasks.has(prereq));
    
    if (missingPrerequisites.length > 0) {
      return {
        valid: false,
        reason: 'missing_prerequisites',
        message: `Missing prerequisites: ${missingPrerequisites.join(', ')}`,
        missingPrerequisites
      };
    }
    
    return {
      valid: true,
      task,
      prerequisites
    };
  }

  /**
   * Get task by ID
   * @param {string} roundId - Round identifier
   * @param {string} taskId - Task ID
   * @returns {Object} Task object
   */
  getTask(roundId, taskId) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }
    
    return graph.nodes.get(taskId);
  }

  /**
   * Get all tasks for a phase
   * @param {string} roundId - Round identifier
   * @param {string} phase - Phase name
   * @returns {Array} Phase tasks
   */
  getPhaseObjectives(roundId, phase) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }
    
    const phaseTasks = [];
    
    for (const task of graph.nodes.values()) {
      if (task.phase === phase) {
        phaseTasks.push(task);
      }
    }
    
    return phaseTasks;
  }

  /**
   * Unlock all objectives for a phase
   * @param {string} roundId - Round identifier
   * @param {string} phase - Phase name
   * @returns {Array} Unlocked tasks
   */
  unlockPhaseObjectives(roundId, phase) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }
    
    const unlocked = [];
    
    for (const task of graph.nodes.values()) {
      if (task.phase === phase && !task.available) {
        // Check if prerequisites are met
        const prerequisites = graph.edges.get(task.id) || [];
        const prerequisitesMet = prerequisites.every(prereq => 
          graph.completedTasks.has(prereq)
        );
        
        if (prerequisitesMet) {
          task.available = true;
          task.status = 'available';
          graph.availableTasks.add(task.id);
          unlocked.push(task);
        }
      }
    }
    
    return unlocked;
  }

  /**
   * Get task dependency graph visualization data
   * @param {string} roundId - Round identifier
   * @returns {Object} Graph data for visualization
   */
  getGraphData(roundId) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }
    
    const nodes = Array.from(graph.nodes.values()).map(task => ({
      id: task.id,
      name: task.name,
      phase: task.phase,
      team: task.team,
      status: task.status,
      available: task.available,
      required: task.required,
      points: task.points,
      unlockTime: task.unlockTime,
      completionTime: task.completionTime,
      dependents: task.dependents || []
    }));
    
    const edges = [];
    for (const [taskId, prerequisites] of graph.edges.entries()) {
      prerequisites.forEach(prereq => {
        edges.push({
          from: prereq,
          to: taskId,
          type: 'prerequisite'
        });
      });
    }
    
    return { 
      nodes, 
      edges,
      stats: {
        total: nodes.length,
        available: nodes.filter(n => n.available).length,
        completed: nodes.filter(n => n.status === 'completed').length,
        locked: nodes.filter(n => n.status === 'locked').length
      }
    };
  }

  /**
   * Get dependency chain for a task
   * @param {string} roundId - Round identifier
   * @param {string} taskId - Task ID
   * @returns {Object} Dependency chain information
   */
  getDependencyChain(roundId, taskId) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }

    const visited = new Set();
    const chain = [];

    const buildChain = (currentTaskId, depth = 0) => {
      if (visited.has(currentTaskId) || depth > 10) {
        return; // Prevent infinite loops
      }

      visited.add(currentTaskId);
      const task = graph.nodes.get(currentTaskId);
      const prerequisites = graph.edges.get(currentTaskId) || [];

      chain.push({
        taskId: currentTaskId,
        task: task ? {
          name: task.name,
          status: task.status,
          available: task.available
        } : null,
        depth,
        prerequisites: prerequisites.length
      });

      // Recursively build chain for prerequisites
      prerequisites.forEach(prereq => {
        buildChain(prereq, depth + 1);
      });
    };

    buildChain(taskId);
    return {
      taskId,
      chain: chain.sort((a, b) => b.depth - a.depth), // Root dependencies first
      totalDependencies: chain.length - 1
    };
  }

  /**
   * Check for circular dependencies
   * @param {string} roundId - Round identifier
   * @returns {Array} Array of circular dependency chains found
   */
  checkCircularDependencies(roundId) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }

    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const hasCycle = (taskId, path = []) => {
      if (recursionStack.has(taskId)) {
        // Found a cycle
        const cycleStart = path.indexOf(taskId);
        cycles.push(path.slice(cycleStart).concat([taskId]));
        return true;
      }

      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recursionStack.add(taskId);
      path.push(taskId);

      const prerequisites = graph.edges.get(taskId) || [];
      for (const prereq of prerequisites) {
        if (hasCycle(prereq, [...path])) {
          return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    // Check all tasks
    for (const taskId of graph.nodes.keys()) {
      if (!visited.has(taskId)) {
        hasCycle(taskId);
      }
    }

    return cycles;
  }

  /**
   * Get critical path (longest dependency chain)
   * @param {string} roundId - Round identifier
   * @returns {Object} Critical path information
   */
  getCriticalPath(roundId) {
    const graph = this.graphs.get(roundId);
    if (!graph) {
      throw new Error('Graph not initialized for round');
    }

    let longestPath = [];
    let maxDepth = 0;

    const findLongestPath = (taskId, currentPath = [], visited = new Set()) => {
      if (visited.has(taskId)) {
        return currentPath;
      }

      visited.add(taskId);
      const newPath = [...currentPath, taskId];
      const prerequisites = graph.edges.get(taskId) || [];

      if (prerequisites.length === 0) {
        // Leaf node
        if (newPath.length > maxDepth) {
          maxDepth = newPath.length;
          longestPath = [...newPath];
        }
        return newPath;
      }

      // Explore all prerequisite paths
      for (const prereq of prerequisites) {
        findLongestPath(prereq, newPath, new Set(visited));
      }

      return newPath;
    };

    // Find longest path from all tasks
    for (const taskId of graph.nodes.keys()) {
      findLongestPath(taskId);
    }

    return {
      path: longestPath.reverse(), // Reverse to show dependency order
      length: maxDepth,
      tasks: longestPath.map(taskId => graph.nodes.get(taskId))
    };
  }
}

module.exports = TaskDependencyGraph;
