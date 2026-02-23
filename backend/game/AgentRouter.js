// Agent Router for NEXUS PROTOCOL
// Routes tasks to appropriate agents based on specialization

class AgentRouter {
  constructor() {
    // Agent capabilities and specializations
    this.agentCapabilities = {
      // Red Team Agents
      ARCHITECT: {
        team: 'red',
        specializations: ['exploitation', 'privilege_escalation', 'web_attacks'],
        effectiveness: {
          exploitation: 1.5,
          privilege_escalation: 1.5,
          web_attacks: 1.3,
          reconnaissance: 0.8,
          persistence: 0.7,
          exfiltration: 0.7
        },
        description: 'System exploitation and privilege escalation specialist'
      },
      SPECTER: {
        team: 'red',
        specializations: ['stealth', 'lateral_movement', 'exfiltration'],
        effectiveness: {
          stealth: 1.5,
          lateral_movement: 1.5,
          exfiltration: 1.5,
          exploitation: 0.8,
          reconnaissance: 0.9,
          persistence: 1.0
        },
        description: 'Stealth operations and data exfiltration specialist'
      },
      ORACLE: {
        team: 'red',
        specializations: ['reconnaissance', 'intelligence', 'persistence'],
        effectiveness: {
          reconnaissance: 1.5,
          intelligence: 1.5,
          persistence: 1.5,
          exploitation: 0.7,
          lateral_movement: 0.8,
          exfiltration: 0.9
        },
        description: 'Reconnaissance and intelligence gathering specialist'
      },
      
      // Blue Team Agents
      SENTINEL: {
        team: 'blue',
        specializations: ['detection', 'monitoring', 'threat_hunting'],
        effectiveness: {
          detection: 1.5,
          monitoring: 1.5,
          threat_hunting: 1.5,
          containment: 0.8,
          recovery: 0.7,
          forensics: 0.9
        },
        description: 'Intrusion detection and monitoring specialist'
      },
      WARDEN: {
        team: 'blue',
        specializations: ['containment', 'access_control', 'firewall'],
        effectiveness: {
          containment: 1.5,
          access_control: 1.5,
          firewall: 1.5,
          detection: 0.8,
          recovery: 0.7,
          forensics: 0.7
        },
        description: 'Containment and access control specialist'
      },
      RESTORER: {
        team: 'blue',
        specializations: ['recovery', 'forensics', 'restoration'],
        effectiveness: {
          recovery: 1.5,
          forensics: 1.5,
          restoration: 1.5,
          detection: 0.7,
          containment: 0.8,
          monitoring: 0.8
        },
        description: 'System recovery and forensics specialist'
      }
    };
    
    // Task type to capability mapping
    this.taskCapabilityMap = {
      // Red Team task types
      'recon': 'reconnaissance',
      'scan': 'reconnaissance',
      'exploit': 'exploitation',
      'web_exploit': 'web_attacks',
      'credential': 'lateral_movement',
      'lateral': 'lateral_movement',
      'privilege': 'privilege_escalation',
      'persistence': 'persistence',
      'exfiltration': 'exfiltration',
      'stealth': 'stealth',
      
      // Blue Team task types
      'detect': 'detection',
      'monitor': 'monitoring',
      'ids': 'monitoring',
      'hunt': 'threat_hunting',
      'contain': 'containment',
      'block': 'containment',
      'firewall': 'firewall',
      'forensics': 'forensics',
      'restore': 'recovery',
      'recovery': 'recovery'
    };
  }

  /**
   * Route task to appropriate agent based on task type and requirements
   * @param {Object} task - Task to route
   * @returns {string} Agent type (ARCHITECT, SPECTER, ORACLE, SENTINEL, WARDEN, RESTORER)
   */
  routeToAgent(task) {
    // If task explicitly specifies agent type, use it
    if (task.agentType) {
      return task.agentType;
    }
    
    // Determine capability required for task
    const capability = this.getTaskCapability(task);
    
    // Find best agent for this capability
    const team = task.team || 'red';
    const agents = Object.entries(this.agentCapabilities)
      .filter(([_, agent]) => agent.team === team);
    
    // Sort agents by effectiveness for this capability
    const sortedAgents = agents.sort((a, b) => {
      const effectivenessA = a[1].effectiveness[capability] || 0.5;
      const effectivenessB = b[1].effectiveness[capability] || 0.5;
      return effectivenessB - effectivenessA;
    });
    
    // Return best agent
    return sortedAgents[0]?.[0] || (team === 'red' ? 'ARCHITECT' : 'SENTINEL');
  }

  /**
   * Get capability required for a task
   * @param {Object} task - Task object
   * @returns {string} Capability name
   */
  getTaskCapability(task) {
    // Check task ID for capability hints
    const taskIdLower = task.id.toLowerCase();
    
    for (const [keyword, capability] of Object.entries(this.taskCapabilityMap)) {
      if (taskIdLower.includes(keyword)) {
        return capability;
      }
    }
    
    // Check task name
    const taskNameLower = (task.name || '').toLowerCase();
    
    for (const [keyword, capability] of Object.entries(this.taskCapabilityMap)) {
      if (taskNameLower.includes(keyword)) {
        return capability;
      }
    }
    
    // Default capabilities by team
    return task.team === 'blue' ? 'detection' : 'reconnaissance';
  }

  /**
   * Get agent capabilities
   * @param {string} agentType - Agent type
   * @returns {Object} Agent capabilities
   */
  getAgentCapabilities(agentType) {
    return this.agentCapabilities[agentType] || null;
  }

  /**
   * Calculate agent effectiveness for a specific tool
   * @param {string} agentType - Agent type
   * @param {Object} tool - Tool object
   * @returns {number} Effectiveness multiplier (0.5 - 1.5)
   */
  calculateAgentEffectiveness(agentType, tool) {
    const agent = this.agentCapabilities[agentType];
    if (!agent) {
      return 1.0; // Default effectiveness
    }
    
    // Get tool category
    const toolCategory = tool.category || this.getToolCategory(tool);
    
    // Get effectiveness for this category
    const effectiveness = agent.effectiveness[toolCategory];
    
    return effectiveness !== undefined ? effectiveness : 1.0;
  }

  /**
   * Get tool category from tool properties
   * @param {Object} tool - Tool object
   * @returns {string} Tool category
   */
  getToolCategory(tool) {
    const toolName = (tool.name || '').toLowerCase();
    const toolId = (tool.id || '').toLowerCase();
    
    // Map tool names to categories
    const categoryMap = {
      'nmap': 'reconnaissance',
      'sqlmap': 'exploitation',
      'gobuster': 'reconnaissance',
      'hydra': 'lateral_movement',
      'metasploit': 'exploitation',
      'mimikatz': 'lateral_movement',
      'cron': 'persistence',
      'nc': 'exfiltration',
      'netcat': 'exfiltration',
      'dns': 'exfiltration',
      'ids': 'detection',
      'firewall': 'firewall',
      'block': 'containment',
      'rootkit': 'forensics',
      'forensics': 'forensics',
      'restore': 'recovery'
    };
    
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (toolName.includes(keyword) || toolId.includes(keyword)) {
        return category;
      }
    }
    
    return 'general';
  }

  /**
   * Get recommended agent for a task
   * @param {Object} task - Task object
   * @returns {Object} Recommendation with agent and reasoning
   */
  getRecommendedAgent(task) {
    const agentType = this.routeToAgent(task);
    const agent = this.agentCapabilities[agentType];
    const capability = this.getTaskCapability(task);
    const effectiveness = agent.effectiveness[capability] || 1.0;
    
    return {
      agentType,
      agent,
      capability,
      effectiveness,
      reasoning: `${agentType} is specialized in ${capability} with ${Math.round(effectiveness * 100)}% effectiveness`
    };
  }

  /**
   * Get all agents for a team
   * @param {string} team - Team name ('red' or 'blue')
   * @returns {Array} Array of agent types
   */
  getTeamAgents(team) {
    return Object.entries(this.agentCapabilities)
      .filter(([_, agent]) => agent.team === team)
      .map(([agentType, _]) => agentType);
  }

  /**
   * Validate agent assignment for task
   * @param {Object} task - Task object
   * @param {string} agentType - Proposed agent type
   * @returns {Object} Validation result
   */
  validateAgentAssignment(task, agentType) {
    const agent = this.agentCapabilities[agentType];
    
    if (!agent) {
      return {
        valid: false,
        reason: 'Invalid agent type'
      };
    }
    
    // Check team match
    if (task.team && agent.team !== task.team) {
      return {
        valid: false,
        reason: `Agent ${agentType} is on ${agent.team} team, but task requires ${task.team} team`
      };
    }
    
    // Check effectiveness
    const capability = this.getTaskCapability(task);
    const effectiveness = agent.effectiveness[capability] || 1.0;
    
    if (effectiveness < 0.7) {
      return {
        valid: true,
        warning: `Agent ${agentType} has low effectiveness (${Math.round(effectiveness * 100)}%) for this task type`,
        effectiveness
      };
    }
    
    return {
      valid: true,
      effectiveness
    };
  }
}

module.exports = AgentRouter;
