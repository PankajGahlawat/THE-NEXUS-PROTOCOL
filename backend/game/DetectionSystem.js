/**
 * Detection System
 * 
 * Manages detection of Red Team actions by Blue Team.
 * Calculates detection probability based on action observability, IDS monitoring,
 * stealth tools, and burn state.
 * 
 * Requirements: 12.1-12.10
 */

class DetectionSystem {
  constructor() {
    // Observable action types and their base detection probabilities
    this.observableActions = {
      network_scan: { baseProbability: 0.6, severity: 'medium' },
      port_scan: { baseProbability: 0.7, severity: 'medium' },
      vulnerability_scan: { baseProbability: 0.5, severity: 'low' },
      authentication_attempt: { baseProbability: 0.4, severity: 'low' },
      brute_force: { baseProbability: 0.8, severity: 'high' },
      exploitation: { baseProbability: 0.7, severity: 'high' },
      privilege_escalation: { baseProbability: 0.6, severity: 'high' },
      data_exfiltration: { baseProbability: 0.5, severity: 'critical' },
      persistence: { baseProbability: 0.4, severity: 'medium' },
      lateral_movement: { baseProbability: 0.5, severity: 'high' }
    };

    // IDS monitoring effectiveness multiplier
    this.idsEffectivenessMultiplier = 1.5;

    // Stealth tool detection reduction
    this.stealthReduction = 0.3; // 30% reduction

    // Burn state detection multipliers
    this.burnStateMultipliers = {
      LOW: 1.0,
      MODERATE: 1.2,
      HIGH: 1.5,
      CRITICAL: 2.0
    };

    this.detectionHistory = new Map(); // roundId -> detections[]
  }

  /**
   * Calculate detection probability for an action
   * Requirements: 12.1-12.8
   */
  calculateDetectionProbability(action, context = {}) {
    const {
      actionType,
      isStealthTool = false,
      burnState = 'LOW',
      idsActive = false
    } = context;

    // Get base probability
    const actionConfig = this.observableActions[actionType];
    if (!actionConfig) {
      return 0; // Non-observable action
    }

    let probability = actionConfig.baseProbability;

    // Apply stealth tool reduction
    if (isStealthTool) {
      probability *= (1 - this.stealthReduction);
    }

    // Apply IDS monitoring effectiveness
    if (idsActive) {
      probability *= this.idsEffectivenessMultiplier;
    }

    // Apply burn state multiplier
    const burnMultiplier = this.burnStateMultipliers[burnState] || 1.0;
    probability *= burnMultiplier;

    // Cap at 95% (never 100% certain)
    probability = Math.min(0.95, probability);

    return probability;
  }

  /**
   * Attempt detection of an action
   * Requirements: 12.1-12.5
   */
  attemptDetection(action, context = {}) {
    const probability = this.calculateDetectionProbability(action, context);
    
    if (probability === 0) {
      return {
        detected: false,
        probability: 0,
        reason: 'Non-observable action'
      };
    }

    // Roll for detection
    const roll = Math.random();
    const detected = roll < probability;

    return {
      detected,
      probability,
      roll,
      actionType: context.actionType,
      severity: this.observableActions[context.actionType]?.severity || 'unknown'
    };
  }

  /**
   * Generate actionable intelligence for detected action
   * Requirements: 12.9, 12.10
   */
  generateIntelligence(action, detectionResult, context = {}) {
    if (!detectionResult.detected) {
      return null;
    }

    const actionConfig = this.observableActions[context.actionType];
    const intelligence = {
      timestamp: new Date().toISOString(),
      actionType: context.actionType,
      severity: actionConfig?.severity || 'unknown',
      targetSystem: context.targetSystem || 'unknown',
      sourceIP: context.sourceIP || 'unknown',
      detectionProbability: detectionResult.probability,
      confidence: this.calculateConfidence(detectionResult.probability),
      recommendations: this.generateRecommendations(context.actionType, context),
      indicators: this.generateIndicators(context.actionType, context)
    };

    return intelligence;
  }

  /**
   * Calculate confidence level based on detection probability
   */
  calculateConfidence(probability) {
    if (probability >= 0.8) return 'HIGH';
    if (probability >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommendations for Blue Team response
   */
  generateRecommendations(actionType, context) {
    const recommendations = [];

    switch (actionType) {
      case 'network_scan':
      case 'port_scan':
        recommendations.push('Block source IP at firewall');
        recommendations.push('Increase IDS sensitivity');
        recommendations.push('Monitor for follow-up exploitation attempts');
        break;

      case 'brute_force':
      case 'authentication_attempt':
        recommendations.push('Lock affected user accounts');
        recommendations.push('Enable rate limiting on authentication');
        recommendations.push('Review authentication logs');
        break;

      case 'exploitation':
        recommendations.push('Isolate affected system immediately');
        recommendations.push('Patch vulnerable service');
        recommendations.push('Perform forensics analysis');
        break;

      case 'privilege_escalation':
        recommendations.push('Revoke elevated privileges');
        recommendations.push('Audit privilege escalation vectors');
        recommendations.push('Check for persistence mechanisms');
        break;

      case 'data_exfiltration':
        recommendations.push('Block outbound connections from affected system');
        recommendations.push('Identify exfiltrated data');
        recommendations.push('Initiate incident response protocol');
        break;

      case 'persistence':
        recommendations.push('Scan for rootkits and backdoors');
        recommendations.push('Review scheduled tasks and startup items');
        recommendations.push('Consider system restore to clean state');
        break;

      case 'lateral_movement':
        recommendations.push('Segment network to contain spread');
        recommendations.push('Disable compromised credentials');
        recommendations.push('Monitor for additional compromised systems');
        break;

      default:
        recommendations.push('Investigate suspicious activity');
        recommendations.push('Increase monitoring on affected systems');
    }

    return recommendations;
  }

  /**
   * Generate indicators of compromise
   */
  generateIndicators(actionType, context) {
    const indicators = {
      network: [],
      host: [],
      behavioral: []
    };

    switch (actionType) {
      case 'network_scan':
      case 'port_scan':
        indicators.network.push(`Multiple connection attempts from ${context.sourceIP}`);
        indicators.network.push('Sequential port scanning pattern detected');
        break;

      case 'brute_force':
        indicators.network.push('High volume of authentication failures');
        indicators.host.push('Multiple failed login attempts');
        break;

      case 'exploitation':
        indicators.network.push('Malformed packets or exploit payloads');
        indicators.host.push('Unexpected service crashes or restarts');
        indicators.behavioral.push('Abnormal process execution');
        break;

      case 'privilege_escalation':
        indicators.host.push('Privilege escalation exploit artifacts');
        indicators.behavioral.push('Unexpected elevation of privileges');
        break;

      case 'data_exfiltration':
        indicators.network.push('Large outbound data transfer');
        indicators.network.push('Unusual DNS queries or tunneling');
        indicators.behavioral.push('Data compression or encryption activity');
        break;

      case 'persistence':
        indicators.host.push('New scheduled tasks or cron jobs');
        indicators.host.push('Modified startup scripts');
        indicators.behavioral.push('Suspicious registry modifications');
        break;

      case 'lateral_movement':
        indicators.network.push('Unusual internal network connections');
        indicators.behavioral.push('Credential reuse across systems');
        break;
    }

    return indicators;
  }

  /**
   * Record detection event
   */
  recordDetection(roundId, detection) {
    if (!this.detectionHistory.has(roundId)) {
      this.detectionHistory.set(roundId, []);
    }

    this.detectionHistory.get(roundId).push({
      ...detection,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get detection history for a round
   */
  getDetectionHistory(roundId) {
    return this.detectionHistory.get(roundId) || [];
  }

  /**
   * Get detection statistics for a round
   */
  getDetectionStatistics(roundId) {
    const detections = this.getDetectionHistory(roundId);
    
    if (detections.length === 0) {
      return {
        totalAttempts: 0,
        totalDetections: 0,
        detectionRate: 0,
        bySeverity: {},
        byActionType: {}
      };
    }

    const detected = detections.filter(d => d.detected);
    
    const bySeverity = {};
    const byActionType = {};
    
    detections.forEach(d => {
      const severity = d.severity || 'unknown';
      const actionType = d.actionType || 'unknown';
      
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
      byActionType[actionType] = (byActionType[actionType] || 0) + 1;
    });

    return {
      totalAttempts: detections.length,
      totalDetections: detected.length,
      detectionRate: detected.length / detections.length,
      bySeverity,
      byActionType,
      averageProbability: detections.reduce((sum, d) => sum + (d.probability || 0), 0) / detections.length
    };
  }

  /**
   * Clear detection history for a round
   */
  clearRoundHistory(roundId) {
    this.detectionHistory.delete(roundId);
  }

  /**
   * Get all observable action types
   */
  getObservableActions() {
    return Object.keys(this.observableActions);
  }
}

module.exports = DetectionSystem;
