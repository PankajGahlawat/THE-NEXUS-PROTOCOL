// Effectiveness Calculator for NEXUS PROTOCOL
// Calculates tool effectiveness based on burn state and agent specialization

class EffectivenessCalculator {
  constructor() {
    // Burn state effectiveness penalties
    this.burnStatePenalties = {
      'LOW': 1.0,        // 0-25% trace - no penalty
      'MODERATE': 0.85,  // 26-50% trace - 15% penalty
      'HIGH': 0.65,      // 51-75% trace - 35% penalty
      'CRITICAL': 0.40   // 76-100% trace - 60% penalty
    };

    // Agent effectiveness multipliers by category
    this.agentMultipliers = {
      // Red Team Agents
      'ARCHITECT': {
        'exploitation': 1.5,
        'web_attacks': 1.3,
        'privilege_escalation': 1.5,
        'reconnaissance': 0.8,
        'lateral_movement': 0.7,
        'persistence': 0.7,
        'exfiltration': 0.7,
        'stealth': 0.6
      },
      'SPECTER': {
        'stealth': 1.5,
        'lateral_movement': 1.5,
        'exfiltration': 1.5,
        'persistence': 1.2,
        'exploitation': 0.8,
        'reconnaissance': 0.9,
        'web_attacks': 0.7,
        'privilege_escalation': 0.8
      },
      'ORACLE': {
        'reconnaissance': 1.5,
        'intelligence': 1.5,
        'persistence': 1.5,
        'stealth': 1.1,
        'exploitation': 0.7,
        'lateral_movement': 0.8,
        'exfiltration': 0.9,
        'web_attacks': 0.6
      },
      
      // Blue Team Agents
      'SENTINEL': {
        'detection': 1.5,
        'monitoring': 1.5,
        'threat_hunting': 1.5,
        'forensics': 1.1,
        'containment': 0.8,
        'recovery': 0.7,
        'firewall': 0.8
      },
      'WARDEN': {
        'containment': 1.5,
        'access_control': 1.5,
        'firewall': 1.5,
        'detection': 0.8,
        'monitoring': 0.9,
        'recovery': 0.7,
        'forensics': 0.7
      },
      'RESTORER': {
        'recovery': 1.5,
        'forensics': 1.5,
        'restoration': 1.5,
        'detection': 0.7,
        'containment': 0.8,
        'monitoring': 0.8,
        'firewall': 0.7
      }
    };

    // Environmental factors
    this.environmentalFactors = {
      'network_congestion': 0.9,
      'system_load': 0.95,
      'time_of_day': 1.0, // Could vary based on actual time
      'detection_active': 0.8 // When Blue Team IDS is active
    };
  }

  /**
   * Calculate overall tool effectiveness
   * @param {Object} tool - Tool definition
   * @param {string} burnState - Current burn state (LOW, MODERATE, HIGH, CRITICAL)
   * @param {string} agentType - Agent type using the tool
   * @param {Object} environmentalContext - Environmental factors
   * @returns {number} Effectiveness multiplier (0.0 - 2.0)
   */
  calculateEffectiveness(tool, burnState = 'LOW', agentType, environmentalContext = {}) {
    // Start with base effectiveness
    let effectiveness = tool.baseEffectiveness || 1.0;

    // Apply burn state penalty
    const burnPenalty = this.applyBurnPenalty(effectiveness, burnState);
    effectiveness = burnPenalty;

    // Apply agent specialization bonus
    const agentBonus = this.applyAgentBonus(effectiveness, agentType, tool);
    effectiveness = agentBonus;

    // Apply environmental factors
    const environmentalEffectiveness = this.applyEnvironmentalFactors(
      effectiveness, 
      environmentalContext
    );
    effectiveness = environmentalEffectiveness;

    // Apply random variation (±5%)
    const randomVariation = 0.95 + (Math.random() * 0.1);
    effectiveness *= randomVariation;

    // Ensure effectiveness stays within reasonable bounds
    return Math.max(0.1, Math.min(2.0, effectiveness));
  }

  /**
   * Apply burn state penalty to effectiveness
   * @param {number} baseEffectiveness - Base effectiveness
   * @param {string} burnState - Burn state
   * @returns {number} Modified effectiveness
   */
  applyBurnPenalty(baseEffectiveness, burnState) {
    const penalty = this.burnStatePenalties[burnState] || 1.0;
    return baseEffectiveness * penalty;
  }

  /**
   * Apply agent specialization bonus
   * @param {number} effectiveness - Current effectiveness
   * @param {string} agentType - Agent type
   * @param {Object} tool - Tool definition
   * @returns {number} Modified effectiveness
   */
  applyAgentBonus(effectiveness, agentType, tool) {
    if (!agentType || !this.agentMultipliers[agentType]) {
      return effectiveness;
    }

    const agentMultipliers = this.agentMultipliers[agentType];
    const toolCategory = tool.category || 'general';
    
    // Get multiplier for this tool category
    const multiplier = agentMultipliers[toolCategory] || 1.0;
    
    return effectiveness * multiplier;
  }

  /**
   * Apply environmental factors
   * @param {number} effectiveness - Current effectiveness
   * @param {Object} environmentalContext - Environmental factors
   * @returns {number} Modified effectiveness
   */
  applyEnvironmentalFactors(effectiveness, environmentalContext) {
    let modifiedEffectiveness = effectiveness;

    // Apply each environmental factor
    for (const [factor, value] of Object.entries(environmentalContext)) {
      if (this.environmentalFactors[factor] !== undefined) {
        const factorMultiplier = value ? this.environmentalFactors[factor] : 1.0;
        modifiedEffectiveness *= factorMultiplier;
      }
    }

    return modifiedEffectiveness;
  }

  /**
   * Calculate cooldown modifier based on effectiveness
   * @param {Object} tool - Tool definition
   * @param {string} burnState - Burn state
   * @returns {number} Cooldown multiplier
   */
  calculateCooldownModifier(tool, burnState) {
    // Higher burn state = longer cooldowns
    const burnMultipliers = {
      'LOW': 1.0,
      'MODERATE': 1.2,
      'HIGH': 1.5,
      'CRITICAL': 2.0
    };

    return burnMultipliers[burnState] || 1.0;
  }

  /**
   * Get effectiveness breakdown for debugging/display
   * @param {Object} tool - Tool definition
   * @param {string} burnState - Burn state
   * @param {string} agentType - Agent type
   * @param {Object} environmentalContext - Environmental factors
   * @returns {Object} Effectiveness breakdown
   */
  getEffectivenessBreakdown(tool, burnState, agentType, environmentalContext = {}) {
    const baseEffectiveness = tool.baseEffectiveness || 1.0;
    const burnPenalty = this.burnStatePenalties[burnState] || 1.0;
    
    const agentMultipliers = this.agentMultipliers[agentType] || {};
    const agentMultiplier = agentMultipliers[tool.category] || 1.0;
    
    let environmentalMultiplier = 1.0;
    for (const [factor, value] of Object.entries(environmentalContext)) {
      if (this.environmentalFactors[factor] !== undefined && value) {
        environmentalMultiplier *= this.environmentalFactors[factor];
      }
    }

    const finalEffectiveness = baseEffectiveness * burnPenalty * agentMultiplier * environmentalMultiplier;

    return {
      baseEffectiveness,
      burnState,
      burnPenalty,
      agentType,
      agentMultiplier,
      environmentalMultiplier,
      finalEffectiveness: Math.max(0.1, Math.min(2.0, finalEffectiveness)),
      breakdown: {
        base: `${Math.round(baseEffectiveness * 100)}%`,
        burn: `${Math.round(burnPenalty * 100)}%`,
        agent: `${Math.round(agentMultiplier * 100)}%`,
        environmental: `${Math.round(environmentalMultiplier * 100)}%`,
        final: `${Math.round(finalEffectiveness * 100)}%`
      }
    };
  }

  /**
   * Predict effectiveness for tool selection
   * @param {Array} tools - Array of tools to compare
   * @param {string} agentType - Agent type
   * @param {string} burnState - Current burn state
   * @returns {Array} Tools sorted by effectiveness
   */
  predictToolEffectiveness(tools, agentType, burnState = 'LOW') {
    return tools.map(tool => {
      const effectiveness = this.calculateEffectiveness(tool, burnState, agentType);
      const breakdown = this.getEffectivenessBreakdown(tool, burnState, agentType);
      
      return {
        ...tool,
        predictedEffectiveness: effectiveness,
        effectivenessBreakdown: breakdown,
        recommendation: this.getRecommendation(effectiveness, agentType, tool)
      };
    }).sort((a, b) => b.predictedEffectiveness - a.predictedEffectiveness);
  }

  /**
   * Get recommendation text for tool usage
   * @param {number} effectiveness - Calculated effectiveness
   * @param {string} agentType - Agent type
   * @param {Object} tool - Tool definition
   * @returns {string} Recommendation text
   */
  getRecommendation(effectiveness, agentType, tool) {
    if (effectiveness >= 1.3) {
      return `Excellent choice for ${agentType} - high effectiveness expected`;
    } else if (effectiveness >= 1.0) {
      return `Good tool for this situation - standard effectiveness`;
    } else if (effectiveness >= 0.7) {
      return `Suboptimal but usable - consider alternatives`;
    } else {
      return `Not recommended - very low effectiveness expected`;
    }
  }

  /**
   * Calculate success probability based on effectiveness
   * @param {number} effectiveness - Tool effectiveness
   * @param {Object} target - Target information
   * @returns {number} Success probability (0.0 - 1.0)
   */
  calculateSuccessProbability(effectiveness, target = {}) {
    let baseProbability = 0.7; // 70% base success rate
    
    // Effectiveness directly affects success probability
    baseProbability *= effectiveness;
    
    // Target difficulty modifier
    if (target.difficulty) {
      const difficultyModifiers = {
        'easy': 1.2,
        'medium': 1.0,
        'hard': 0.8,
        'expert': 0.6
      };
      baseProbability *= difficultyModifiers[target.difficulty] || 1.0;
    }
    
    // Ensure probability stays within bounds
    return Math.max(0.05, Math.min(0.95, baseProbability));
  }
}

module.exports = EffectivenessCalculator;