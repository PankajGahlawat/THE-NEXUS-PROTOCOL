// Tool Execution Engine for NEXUS PROTOCOL
// Executes offensive and defensive tools against real systems

const { v4: uuidv4 } = require('uuid');

class ToolExecutionEngine {
  constructor(effectivenessCalculator, systemInteractor) {
    this.effectivenessCalculator = effectivenessCalculator;
    this.systemInteractor = systemInteractor;
    this.toolRegistry = new Map();
    this.executionHistory = new Map(); // roundId -> executions[]
    this.cooldowns = new Map(); // agentId -> tool cooldowns
    
    this.initializeTools();
  }

  /**
   * Initialize all available tools
   */
  initializeTools() {
    // Red Team Tools
    this.registerTool({
      id: 'nmap',
      name: 'Network Mapper',
      type: 'offensive',
      category: 'reconnaissance',
      baseCooldown: 30, // seconds
      baseEffectiveness: 0.85,
      traceGeneration: 8,
      observable: true,
      description: 'Network discovery and security auditing',
      requiredParams: ['target'],
      optionalParams: ['ports', 'scan_type'],
      execute: this.executeNmap.bind(this)
    });

    this.registerTool({
      id: 'sqlmap',
      name: 'SQL Injection Tool',
      type: 'offensive',
      category: 'exploitation',
      baseCooldown: 45,
      baseEffectiveness: 0.75,
      traceGeneration: 12,
      observable: true,
      description: 'Automated SQL injection and database takeover',
      requiredParams: ['target_url'],
      optionalParams: ['database', 'technique'],
      execute: this.executeSqlmap.bind(this)
    });

    this.registerTool({
      id: 'gobuster',
      name: 'Directory Buster',
      type: 'offensive',
      category: 'reconnaissance',
      baseCooldown: 25,
      baseEffectiveness: 0.80,
      traceGeneration: 6,
      observable: true,
      description: 'Directory and file enumeration',
      requiredParams: ['target_url'],
      optionalParams: ['wordlist', 'extensions'],
      execute: this.executeGobuster.bind(this)
    });

    this.registerTool({
      id: 'hydra',
      name: 'Password Cracker',
      type: 'offensive',
      category: 'lateral_movement',
      baseCooldown: 60,
      baseEffectiveness: 0.70,
      traceGeneration: 15,
      observable: true,
      description: 'Network logon cracker',
      requiredParams: ['target', 'service'],
      optionalParams: ['username_list', 'password_list'],
      execute: this.executeHydra.bind(this)
    });

    this.registerTool({
      id: 'metasploit',
      name: 'Metasploit Framework',
      type: 'offensive',
      category: 'exploitation',
      baseCooldown: 90,
      baseEffectiveness: 0.90,
      traceGeneration: 20,
      observable: true,
      description: 'Penetration testing framework',
      requiredParams: ['target', 'exploit'],
      optionalParams: ['payload', 'options'],
      execute: this.executeMetasploit.bind(this)
    });

    this.registerTool({
      id: 'mimikatz',
      name: 'Credential Extractor',
      type: 'offensive',
      category: 'lateral_movement',
      baseCooldown: 40,
      baseEffectiveness: 0.85,
      traceGeneration: 18,
      observable: false, // Stealth tool
      description: 'Extract credentials from memory',
      requiredParams: ['target'],
      optionalParams: ['technique'],
      execute: this.executeMimikatz.bind(this)
    });

    this.registerTool({
      id: 'cron_persistence',
      name: 'Cron Persistence',
      type: 'offensive',
      category: 'persistence',
      baseCooldown: 35,
      baseEffectiveness: 0.80,
      traceGeneration: 10,
      observable: false,
      description: 'Establish persistence via cron jobs',
      requiredParams: ['target', 'command'],
      optionalParams: ['schedule'],
      execute: this.executeCronPersistence.bind(this)
    });

    this.registerTool({
      id: 'netcat',
      name: 'Network Swiss Army Knife',
      type: 'offensive',
      category: 'exfiltration',
      baseCooldown: 20,
      baseEffectiveness: 0.75,
      traceGeneration: 12,
      observable: true,
      description: 'Network connections and data transfer',
      requiredParams: ['target', 'port'],
      optionalParams: ['mode', 'data'],
      execute: this.executeNetcat.bind(this)
    });

    this.registerTool({
      id: 'dns_tunnel',
      name: 'DNS Tunneling',
      type: 'offensive',
      category: 'exfiltration',
      baseCooldown: 50,
      baseEffectiveness: 0.65,
      traceGeneration: 5, // Low trace - uses DNS
      observable: false,
      description: 'Covert data exfiltration via DNS',
      requiredParams: ['data', 'dns_server'],
      optionalParams: ['domain', 'encoding'],
      execute: this.executeDnsTunnel.bind(this)
    });

    // Blue Team Tools
    this.registerTool({
      id: 'ids_monitor',
      name: 'Intrusion Detection System',
      type: 'defensive',
      category: 'detection',
      baseCooldown: 15,
      baseEffectiveness: 0.85,
      traceGeneration: 0,
      observable: false,
      description: 'Monitor network traffic for intrusions',
      requiredParams: ['interface'],
      optionalParams: ['rules', 'sensitivity'],
      execute: this.executeIdsMonitor.bind(this)
    });

    this.registerTool({
      id: 'firewall_config',
      name: 'Firewall Configuration',
      type: 'defensive',
      category: 'containment',
      baseCooldown: 25,
      baseEffectiveness: 0.90,
      traceGeneration: 0,
      observable: false,
      description: 'Configure firewall rules',
      requiredParams: ['action', 'target'],
      optionalParams: ['port', 'protocol'],
      execute: this.executeFirewallConfig.bind(this)
    });

    this.registerTool({
      id: 'ip_block',
      name: 'IP Address Blocking',
      type: 'defensive',
      category: 'containment',
      baseCooldown: 10,
      baseEffectiveness: 0.95,
      traceGeneration: 0,
      observable: false,
      description: 'Block malicious IP addresses',
      requiredParams: ['ip_address'],
      optionalParams: ['duration', 'reason'],
      execute: this.executeIpBlock.bind(this)
    });

    this.registerTool({
      id: 'rootkit_detect',
      name: 'Rootkit Detection',
      type: 'defensive',
      category: 'forensics',
      baseCooldown: 60,
      baseEffectiveness: 0.80,
      traceGeneration: 0,
      observable: false,
      description: 'Scan for rootkits and persistence mechanisms',
      requiredParams: ['target'],
      optionalParams: ['deep_scan'],
      execute: this.executeRootkitDetect.bind(this)
    });

    this.registerTool({
      id: 'forensics',
      name: 'Digital Forensics',
      type: 'defensive',
      category: 'forensics',
      baseCooldown: 45,
      baseEffectiveness: 0.85,
      traceGeneration: 0,
      observable: false,
      description: 'Analyze system artifacts and logs',
      requiredParams: ['target'],
      optionalParams: ['timeline', 'artifacts'],
      execute: this.executeForensics.bind(this)
    });

    this.registerTool({
      id: 'system_restore',
      name: 'System Restoration',
      type: 'defensive',
      category: 'recovery',
      baseCooldown: 120,
      baseEffectiveness: 0.95,
      traceGeneration: 0,
      observable: false,
      description: 'Restore system to clean state',
      requiredParams: ['target'],
      optionalParams: ['snapshot_id', 'verify'],
      execute: this.executeSystemRestore.bind(this)
    });
  }

  /**
   * Register a tool in the registry
   * @param {Object} toolDefinition - Tool definition
   */
  registerTool(toolDefinition) {
    this.toolRegistry.set(toolDefinition.id, toolDefinition);
  }

  /**
   * Execute a tool
   * @param {string} toolId - Tool identifier
   * @param {Object} target - Target information
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(toolId, target, context) {
    const tool = this.toolRegistry.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Validate parameters
    const paramValidation = this.validateParameters(tool, context.params || {});
    if (!paramValidation.valid) {
      return {
        success: false,
        error: 'invalid_parameters',
        message: paramValidation.message,
        missingParams: paramValidation.missing
      };
    }

    // Check cooldown
    const cooldownCheck = this.checkCooldown(context.agentId, toolId);
    if (!cooldownCheck.ready) {
      return {
        success: false,
        error: 'cooldown_active',
        message: `Tool on cooldown for ${cooldownCheck.remaining}s`,
        cooldownRemaining: cooldownCheck.remaining
      };
    }

    // Calculate effectiveness
    const effectiveness = this.effectivenessCalculator.calculateEffectiveness(
      tool,
      context.burnState || 'LOW',
      context.agentType
    );

    try {
      // Execute the tool
      const executionResult = await tool.execute(target, {
        ...context,
        effectiveness,
        tool
      });

      // Calculate trace generation
      const traceGenerated = this.calculateTraceGeneration(tool, context, effectiveness);

      // Set cooldown
      this.setCooldown(context.agentId, toolId, tool.baseCooldown);

      // Log execution
      this.logExecution(context.roundId, {
        toolId,
        agentId: context.agentId,
        target,
        success: executionResult.success,
        traceGenerated,
        effectiveness,
        timestamp: new Date()
      });

      return {
        success: executionResult.success,
        output: executionResult.output,
        traceGenerated,
        systemStateChanges: executionResult.systemStateChanges || [],
        observable: tool.observable,
        effectiveness,
        cooldownSet: tool.baseCooldown,
        metadata: executionResult.metadata || {}
      };

    } catch (error) {
      console.error(`Tool execution error for ${toolId}:`, error);
      return {
        success: false,
        error: 'execution_failed',
        message: error.message,
        traceGenerated: tool.traceGeneration * 0.5 // Partial trace on failure
      };
    }
  }

  /**
   * Validate tool parameters
   * @param {Object} tool - Tool definition
   * @param {Object} params - Provided parameters
   * @returns {Object} Validation result
   */
  validateParameters(tool, params) {
    const missing = [];
    
    // Check required parameters
    for (const required of tool.requiredParams) {
      if (!params[required]) {
        missing.push(required);
      }
    }

    if (missing.length > 0) {
      return {
        valid: false,
        message: `Missing required parameters: ${missing.join(', ')}`,
        missing
      };
    }

    return { valid: true };
  }

  /**
   * Check tool cooldown
   * @param {string} agentId - Agent identifier
   * @param {string} toolId - Tool identifier
   * @returns {Object} Cooldown status
   */
  checkCooldown(agentId, toolId) {
    const agentCooldowns = this.cooldowns.get(agentId) || {};
    const lastUsed = agentCooldowns[toolId];
    
    if (!lastUsed) {
      return { ready: true };
    }

    const now = Date.now();
    const tool = this.toolRegistry.get(toolId);
    const cooldownDuration = tool.baseCooldown * 1000; // Convert to milliseconds
    const elapsed = now - lastUsed;
    
    if (elapsed >= cooldownDuration) {
      return { ready: true };
    }

    return {
      ready: false,
      remaining: Math.ceil((cooldownDuration - elapsed) / 1000)
    };
  }

  /**
   * Set tool cooldown
   * @param {string} agentId - Agent identifier
   * @param {string} toolId - Tool identifier
   * @param {number} duration - Cooldown duration in seconds
   */
  setCooldown(agentId, toolId, duration) {
    if (!this.cooldowns.has(agentId)) {
      this.cooldowns.set(agentId, {});
    }
    
    const agentCooldowns = this.cooldowns.get(agentId);
    agentCooldowns[toolId] = Date.now();
  }

  /**
   * Calculate trace generation for tool usage
   * @param {Object} tool - Tool definition
   * @param {Object} context - Execution context
   * @param {number} effectiveness - Tool effectiveness
   * @returns {number} Trace amount generated
   */
  calculateTraceGeneration(tool, context, effectiveness) {
    let baseTrace = tool.traceGeneration;
    
    // Reduce trace for stealth tools
    if (!tool.observable) {
      baseTrace *= 0.5;
    }
    
    // Effectiveness affects trace (more effective = more trace)
    baseTrace *= effectiveness;
    
    // Agent specialization can reduce trace
    if (context.agentType === 'SPECTER') {
      baseTrace *= 0.8; // SPECTER is stealth specialist
    }
    
    // Random variation (±20%)
    const variation = 0.8 + (Math.random() * 0.4);
    baseTrace *= variation;
    
    return Math.max(0, Math.round(baseTrace));
  }

  /**
   * Log tool execution
   * @param {string} roundId - Round identifier
   * @param {Object} execution - Execution data
   */
  logExecution(roundId, execution) {
    if (!this.executionHistory.has(roundId)) {
      this.executionHistory.set(roundId, []);
    }
    
    this.executionHistory.get(roundId).push({
      id: uuidv4(),
      ...execution
    });
  }

  /**
   * Get tool execution history for a round
   * @param {string} roundId - Round identifier
   * @returns {Array} Execution history
   */
  getExecutionHistory(roundId) {
    return this.executionHistory.get(roundId) || [];
  }

  /**
   * Get available tools for an agent
   * @param {string} agentType - Agent type
   * @param {string} team - Team ('red' or 'blue')
   * @returns {Array} Available tools
   */
  getAvailableTools(agentType, team) {
    const tools = Array.from(this.toolRegistry.values());
    const teamType = team === 'red' ? 'offensive' : 'defensive';
    
    return tools
      .filter(tool => tool.type === teamType)
      .map(tool => ({
        id: tool.id,
        name: tool.name,
        category: tool.category,
        description: tool.description,
        cooldown: tool.baseCooldown,
        traceGeneration: tool.traceGeneration,
        observable: tool.observable,
        requiredParams: tool.requiredParams,
        optionalParams: tool.optionalParams
      }));
  }

  // Tool execution methods will be implemented in the next part...
  // These are placeholder methods that will be filled with actual implementations

  async executeNmap(target, context) {
    return this.systemInteractor.scanNetwork(target.ip || target, context);
  }

  async executeSqlmap(target, context) {
    return this.systemInteractor.exploitSql(target.url || target, context);
  }

  async executeGobuster(target, context) {
    return this.systemInteractor.enumerateDirectories(target.url || target, context);
  }

  async executeHydra(target, context) {
    return this.systemInteractor.bruteForceCredentials(target, context);
  }

  async executeMetasploit(target, context) {
    return this.systemInteractor.exploitVulnerability(target, context);
  }

  async executeMimikatz(target, context) {
    return this.systemInteractor.extractCredentials(target, context);
  }

  async executeCronPersistence(target, context) {
    return this.systemInteractor.establishPersistence(target, context);
  }

  async executeNetcat(target, context) {
    return this.systemInteractor.createConnection(target, context);
  }

  async executeDnsTunnel(target, context) {
    return this.systemInteractor.exfiltrateViaDns(target, context);
  }

  async executeIdsMonitor(target, context) {
    return this.systemInteractor.monitorTraffic(target, context);
  }

  async executeFirewallConfig(target, context) {
    return this.systemInteractor.configureFirewall(target, context);
  }

  async executeIpBlock(target, context) {
    return this.systemInteractor.blockIpAddress(target, context);
  }

  async executeRootkitDetect(target, context) {
    return this.systemInteractor.scanForRootkits(target, context);
  }

  async executeForensics(target, context) {
    return this.systemInteractor.analyzeArtifacts(target, context);
  }

  async executeSystemRestore(target, context) {
    return this.systemInteractor.restoreSystem(target, context);
  }
}

module.exports = ToolExecutionEngine;