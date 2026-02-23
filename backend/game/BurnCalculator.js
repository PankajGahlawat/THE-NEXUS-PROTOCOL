// Burn Calculator for NEXUS PROTOCOL
// Calculates burn state and associated penalties

class BurnCalculator {
  constructor() {
    // Burn state thresholds (based on absolute trace value)
    this.burnThresholds = {
      LOW: { min: 0, max: 49, name: 'LOW' },
      MODERATE: { min: 50, max: 99, name: 'MODERATE' },
      HIGH: { min: 100, max: 199, name: 'HIGH' },
      CRITICAL: { min: 200, max: Infinity, name: 'CRITICAL' }
    };
    
    // Tool effectiveness penalties by burn state
    this.effectivenessPenalties = {
      LOW: 1.0,        // No penalty
      MODERATE: 0.85,  // 15% penalty
      HIGH: 0.65,      // 35% penalty
      CRITICAL: 0.40   // 60% penalty
    };
    
    // Detection probability by burn state
    this.detectionProbabilities = {
      LOW: 0.10,       // 10% base detection chance
      MODERATE: 0.25,  // 25% detection chance
      HIGH: 0.50,      // 50% detection chance
      CRITICAL: 0.80   // 80% detection chance
    };
    
    // Cooldown multipliers by burn state
    this.cooldownMultipliers = {
      LOW: 1.0,
      MODERATE: 1.2,   // 20% longer cooldowns
      HIGH: 1.5,       // 50% longer cooldowns
      CRITICAL: 2.0    // 100% longer cooldowns
    };
    
    // Countermeasure triggers
    this.countermeasures = {
      HIGH: [
        'Increased IDS sensitivity',
        'Enhanced monitoring',
        'Automated threat hunting'
      ],
      CRITICAL: [
        'Automated IP blocking',
        'System lockdown protocols',
        'Emergency response team activation',
        'Full network isolation'
      ]
    };
  }

  /**
   * Calculate burn state from trace value
   * @param {number} traceValue - Current trace value
   * @returns {string} Burn state name
   */
  calculateBurnState(traceValue) {
    if (traceValue < 50) return 'LOW';
    if (traceValue < 100) return 'MODERATE';
    if (traceValue < 200) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Get tool effectiveness penalty for burn state
   * @param {string} burnState - Burn state
   * @returns {number} Effectiveness multiplier (0.0 - 1.0)
   */
  getToolEffectivenessPenalty(burnState) {
    return this.effectivenessPenalties[burnState] || 1.0;
  }

  /**
   * Get detection probability for burn state
   * @param {string} burnState - Burn state
   * @returns {number} Detection probability (0.0 - 1.0)
   */
  getDetectionProbability(burnState) {
    return this.detectionProbabilities[burnState] || 0.10;
  }

  /**
   * Get cooldown multiplier for burn state
   * @param {string} burnState - Burn state
   * @returns {number} Cooldown multiplier
   */
  getCooldownMultiplier(burnState) {
    return this.cooldownMultipliers[burnState] || 1.0;
  }

  /**
   * Get countermeasures for burn state
   * @param {string} burnState - Burn state
   * @returns {Array} Active countermeasures
   */
  getCountermeasures(burnState) {
    if (burnState === 'CRITICAL') {
      return [...this.countermeasures.HIGH, ...this.countermeasures.CRITICAL];
    } else if (burnState === 'HIGH') {
      return this.countermeasures.HIGH;
    }
    return [];
  }

  /**
   * Calculate detection roll
   * @param {string} burnState - Current burn state
   * @param {Object} modifiers - Detection modifiers
   * @returns {Object} Detection result
   */
  calculateDetectionRoll(burnState, modifiers = {}) {
    let baseProbability = this.getDetectionProbability(burnState);
    
    // Apply IDS monitoring modifier
    if (modifiers.idsActive) {
      baseProbability *= 1.5; // 50% increase with IDS
    }
    
    // Apply stealth tool modifier
    if (modifiers.stealthTool) {
      baseProbability *= 0.7; // 30% reduction for stealth tools
    }
    
    // Apply Blue Team threat hunting modifier
    if (modifiers.threatHunting) {
      baseProbability *= 1.3; // 30% increase with active hunting
    }
    
    // Cap probability at 95%
    baseProbability = Math.min(0.95, baseProbability);
    
    // Roll for detection
    const roll = Math.random();
    const detected = roll < baseProbability;
    
    return {
      detected,
      probability: baseProbability,
      roll,
      burnState,
      modifiers
    };
  }

  /**
   * Get burn state details
   * @param {string} burnState - Burn state
   * @returns {Object} Burn state details
   */
  getBurnStateDetails(burnState) {
    const threshold = this.burnThresholds[burnState];
    
    return {
      name: burnState,
      threshold,
      effectivenessPenalty: this.effectivenessPenalties[burnState],
      detectionProbability: this.detectionProbabilities[burnState],
      cooldownMultiplier: this.cooldownMultipliers[burnState],
      countermeasures: this.getCountermeasures(burnState),
      severity: this.getBurnSeverity(burnState),
      color: this.getBurnColor(burnState),
      description: this.getBurnDescription(burnState)
    };
  }

  /**
   * Get burn severity level
   * @param {string} burnState - Burn state
   * @returns {number} Severity (1-4)
   */
  getBurnSeverity(burnState) {
    const severities = {
      LOW: 1,
      MODERATE: 2,
      HIGH: 3,
      CRITICAL: 4
    };
    return severities[burnState] || 1;
  }

  /**
   * Get burn state color
   * @param {string} burnState - Burn state
   * @returns {string} Color code
   */
  getBurnColor(burnState) {
    const colors = {
      LOW: '#22c55e',      // Green
      MODERATE: '#eab308', // Yellow
      HIGH: '#f97316',     // Orange
      CRITICAL: '#ef4444'  // Red
    };
    return colors[burnState] || colors.LOW;
  }

  /**
   * Get burn state description
   * @param {string} burnState - Burn state
   * @returns {string} Description
   */
  getBurnDescription(burnState) {
    const descriptions = {
      LOW: 'Minimal identity exposure. Operations proceeding normally.',
      MODERATE: 'Moderate identity exposure. Increased detection risk.',
      HIGH: 'Significant identity exposure. High detection risk. Countermeasures active.',
      CRITICAL: 'Critical identity exposure. Severe penalties. Emergency protocols engaged.'
    };
    return descriptions[burnState] || descriptions.LOW;
  }

  /**
   * Calculate burn state transition time
   * @param {string} currentState - Current burn state
   * @param {string} targetState - Target burn state
   * @param {number} tracePerMinute - Average trace generation per minute
   * @returns {Object} Transition estimate
   */
  calculateTransitionTime(currentState, targetState, tracePerMinute) {
    const currentThreshold = this.burnThresholds[currentState];
    const targetThreshold = this.burnThresholds[targetState];
    
    if (!currentThreshold || !targetThreshold) {
      return { error: 'Invalid burn state' };
    }
    
    // Calculate trace needed to reach target state
    const traceNeeded = targetThreshold.min - currentThreshold.max;
    
    if (traceNeeded <= 0) {
      return {
        alreadyAtOrPast: true,
        message: `Already at or past ${targetState} state`
      };
    }
    
    // Calculate time in minutes
    const minutesNeeded = traceNeeded / tracePerMinute;
    
    return {
      currentState,
      targetState,
      traceNeeded,
      tracePerMinute,
      minutesNeeded: Math.ceil(minutesNeeded),
      actionsNeeded: Math.ceil(traceNeeded / 10), // Assuming ~10 trace per action
      warning: minutesNeeded < 5 ? 'Approaching burn state rapidly!' : null
    };
  }

  /**
   * Get recommendations for burn state
   * @param {string} burnState - Current burn state
   * @param {number} traceValue - Current trace value
   * @returns {Array} Recommendations
   */
  getRecommendations(burnState, traceValue) {
    const recommendations = [];
    
    if (burnState === 'LOW') {
      recommendations.push('Continue operations normally');
      recommendations.push('Monitor trace accumulation');
    } else if (burnState === 'MODERATE') {
      recommendations.push('Consider using stealth tools');
      recommendations.push('Reduce action frequency');
      recommendations.push('Monitor Blue Team activity');
    } else if (burnState === 'HIGH') {
      recommendations.push('URGENT: Switch to stealth operations');
      recommendations.push('Use trace-reducing tools (mimikatz, dns_tunnel)');
      recommendations.push('Avoid observable actions');
      recommendations.push('Prepare for increased detection');
    } else if (burnState === 'CRITICAL') {
      recommendations.push('CRITICAL: Immediate action required');
      recommendations.push('Cease observable operations');
      recommendations.push('Use only stealth tools');
      recommendations.push('Consider defensive posture');
      recommendations.push('Expect automated countermeasures');
    }
    
    return recommendations;
  }

  /**
   * Calculate risk assessment
   * @param {string} burnState - Current burn state
   * @param {Object} context - Additional context
   * @returns {Object} Risk assessment
   */
  calculateRiskAssessment(burnState, context = {}) {
    const severity = this.getBurnSeverity(burnState);
    const detectionProb = this.getDetectionProbability(burnState);
    const effectivenessPenalty = 1 - this.getToolEffectivenessPenalty(burnState);
    
    // Calculate overall risk score (0-100)
    let riskScore = (severity / 4) * 40; // 40% weight on severity
    riskScore += detectionProb * 40;     // 40% weight on detection probability
    riskScore += effectivenessPenalty * 20; // 20% weight on effectiveness loss
    
    // Apply context modifiers
    if (context.idsActive) {
      riskScore += 10;
    }
    if (context.threatHunting) {
      riskScore += 10;
    }
    if (context.recentDetections > 0) {
      riskScore += context.recentDetections * 5;
    }
    
    riskScore = Math.min(100, riskScore);
    
    return {
      riskScore: Math.round(riskScore),
      riskLevel: this.getRiskLevel(riskScore),
      burnState,
      detectionProbability: Math.round(detectionProb * 100),
      effectivenessLoss: Math.round(effectivenessPenalty * 100),
      recommendations: this.getRecommendations(burnState, context.traceValue || 0)
    };
  }

  /**
   * Get risk level from score
   * @param {number} riskScore - Risk score (0-100)
   * @returns {string} Risk level
   */
  getRiskLevel(riskScore) {
    if (riskScore < 25) return 'LOW';
    if (riskScore < 50) return 'MODERATE';
    if (riskScore < 75) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Simulate burn state progression
   * @param {number} currentTrace - Current trace value
   * @param {number} actionsPerMinute - Actions per minute
   * @param {number} tracePerAction - Average trace per action
   * @param {number} minutes - Minutes to simulate
   * @returns {Array} Burn state progression
   */
  simulateBurnProgression(currentTrace, actionsPerMinute, tracePerAction, minutes) {
    const progression = [];
    let trace = currentTrace;
    
    for (let minute = 0; minute <= minutes; minute++) {
      const burnState = this.calculateBurnState(trace);
      
      progression.push({
        minute,
        trace: Math.round(trace),
        burnState,
        detectionProbability: this.getDetectionProbability(burnState),
        effectivenessModifier: this.getToolEffectivenessPenalty(burnState)
      });
      
      // Add trace for next minute
      trace += actionsPerMinute * tracePerAction;
    }
    
    return progression;
  }
}

module.exports = BurnCalculator;
