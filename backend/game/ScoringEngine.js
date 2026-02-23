/**
 * Scoring Engine
 * 
 * Calculates points for task completion, speed, stealth, detection, containment, and recovery.
 * Manages scoring for both Red Team and Blue Team actions.
 * 
 * Requirements: 10.1-10.9
 */

class ScoringEngine {
  constructor(database) {
    this.database = database;
    
    // Base points by task difficulty and phase
    this.taskPoints = {
      initial_access: {
        easy: 100,
        medium: 200,
        hard: 300
      },
      escalation: {
        easy: 150,
        medium: 300,
        hard: 450
      },
      impact: {
        easy: 200,
        medium: 400,
        hard: 600
      },
      recovery: {
        easy: 200,
        medium: 400,
        hard: 600
      }
    };

    // Bonus multipliers
    this.speedBonusMultiplier = 10; // points per minute remaining
    this.stealthBonusMultiplier = 20; // points per % stealth maintained

    // Blue Team points
    this.detectionPoints = 150;
    this.containmentPoints = 250;
    this.recoveryPoints = 300;
  }

  /**
   * Calculate task completion score
   * Requirements: 10.1
   */
  calculateTaskScore(task, timeRemaining, traceLevel) {
    const phase = task.phase || 'initial_access';
    const difficulty = task.difficulty || 'medium';
    
    // Base points
    const basePoints = this.taskPoints[phase]?.[difficulty] || 200;
    
    // Speed bonus (time remaining in minutes * 10)
    const speedBonus = this.calculateSpeedBonus(timeRemaining);
    
    // Stealth bonus (only for Red Team)
    const stealthBonus = task.team === 'RED' 
      ? this.calculateStealthBonus(traceLevel)
      : 0;
    
    const totalPoints = basePoints + speedBonus + stealthBonus;
    
    return {
      basePoints,
      speedBonus,
      stealthBonus,
      totalPoints,
      breakdown: {
        base: basePoints,
        speed: speedBonus,
        stealth: stealthBonus
      }
    };
  }

  /**
   * Calculate speed bonus
   * Requirements: 10.2
   */
  calculateSpeedBonus(timeRemainingSeconds) {
    if (!timeRemainingSeconds || timeRemainingSeconds <= 0) {
      return 0;
    }
    
    const minutesRemaining = Math.floor(timeRemainingSeconds / 60);
    return minutesRemaining * this.speedBonusMultiplier;
  }

  /**
   * Calculate stealth bonus
   * Requirements: 10.3
   */
  calculateStealthBonus(traceLevel) {
    if (traceLevel === undefined || traceLevel === null) {
      return 0;
    }
    
    // Stealth bonus = (100 - trace%) * 20
    const stealthPercentage = Math.max(0, 100 - traceLevel);
    return Math.floor(stealthPercentage * this.stealthBonusMultiplier);
  }

  /**
   * Award detection points to Blue Team
   * Requirements: 10.4
   */
  calculateDetectionScore(detectionQuality = 'standard') {
    const qualityMultipliers = {
      low: 0.5,
      standard: 1.0,
      high: 1.5,
      critical: 2.0
    };
    
    const multiplier = qualityMultipliers[detectionQuality] || 1.0;
    const points = Math.floor(this.detectionPoints * multiplier);
    
    return {
      basePoints: this.detectionPoints,
      multiplier,
      totalPoints: points,
      reason: `Detection (${detectionQuality} quality)`
    };
  }

  /**
   * Award containment points to Blue Team
   * Requirements: 10.5
   */
  calculateContainmentScore(systemsTier = 'tier1') {
    const tierMultipliers = {
      tier1: 1.0,
      tier2: 1.5,
      tier3: 2.0
    };
    
    const multiplier = tierMultipliers[systemsTier] || 1.0;
    const points = Math.floor(this.containmentPoints * multiplier);
    
    return {
      basePoints: this.containmentPoints,
      multiplier,
      totalPoints: points,
      reason: `Containment (${systemsTier} system)`
    };
  }

  /**
   * Award recovery points to Blue Team
   * Requirements: 10.6
   */
  calculateRecoveryScore(systemsCount = 1, systemsTier = 'tier1') {
    const tierMultipliers = {
      tier1: 1.0,
      tier2: 1.5,
      tier3: 2.0
    };
    
    const multiplier = tierMultipliers[systemsTier] || 1.0;
    const pointsPerSystem = Math.floor(this.recoveryPoints * multiplier);
    const totalPoints = pointsPerSystem * systemsCount;
    
    return {
      basePoints: this.recoveryPoints,
      multiplier,
      systemsCount,
      pointsPerSystem,
      totalPoints,
      reason: `Recovery (${systemsCount} ${systemsTier} system${systemsCount > 1 ? 's' : ''})`
    };
  }

  /**
   * Award points for task completion
   * Requirements: 10.7
   */
  async awardTaskPoints(roundId, team, agentId, taskId, task, timeRemaining, traceLevel) {
    const score = this.calculateTaskScore(task, timeRemaining, traceLevel);
    
    await this.persistScore(roundId, team, agentId, {
      type: 'task_completion',
      taskId,
      points: score.totalPoints,
      breakdown: score.breakdown,
      timestamp: new Date().toISOString()
    });
    
    return score;
  }

  /**
   * Award points for detection
   * Requirements: 10.7
   */
  async awardDetectionPoints(roundId, team, agentId, detectionDetails) {
    const score = this.calculateDetectionScore(detectionDetails.quality);
    
    await this.persistScore(roundId, team, agentId, {
      type: 'detection',
      points: score.totalPoints,
      details: detectionDetails,
      timestamp: new Date().toISOString()
    });
    
    return score;
  }

  /**
   * Award points for containment
   * Requirements: 10.7
   */
  async awardContainmentPoints(roundId, team, agentId, containmentDetails) {
    const score = this.calculateContainmentScore(containmentDetails.systemsTier);
    
    await this.persistScore(roundId, team, agentId, {
      type: 'containment',
      points: score.totalPoints,
      details: containmentDetails,
      timestamp: new Date().toISOString()
    });
    
    return score;
  }

  /**
   * Award points for recovery
   * Requirements: 10.7
   */
  async awardRecoveryPoints(roundId, team, agentId, recoveryDetails) {
    const score = this.calculateRecoveryScore(
      recoveryDetails.systemsCount,
      recoveryDetails.systemsTier
    );
    
    await this.persistScore(roundId, team, agentId, {
      type: 'recovery',
      points: score.totalPoints,
      details: recoveryDetails,
      timestamp: new Date().toISOString()
    });
    
    return score;
  }

  /**
   * Persist score to database
   * Requirements: 10.9
   */
  async persistScore(roundId, team, agentId, scoreData) {
    if (!this.database) {
      return;
    }

    try {
      await this.database.run(
        `INSERT INTO scores (
          round_id, team, agent_id, score_type, points, 
          details, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          roundId,
          team,
          agentId,
          scoreData.type,
          scoreData.points,
          JSON.stringify(scoreData),
          scoreData.timestamp
        ]
      );
    } catch (error) {
      console.error('Failed to persist score:', error);
    }
  }

  /**
   * Get team score for a round
   * Requirements: 10.8
   */
  async getTeamScore(roundId, team) {
    if (!this.database) {
      return { team, totalPoints: 0, breakdown: {} };
    }

    try {
      const result = await this.database.get(
        `SELECT SUM(points) as total FROM scores 
         WHERE round_id = ? AND team = ?`,
        [roundId, team]
      );

      const breakdown = await this.database.all(
        `SELECT score_type, SUM(points) as points, COUNT(*) as count
         FROM scores 
         WHERE round_id = ? AND team = ?
         GROUP BY score_type`,
        [roundId, team]
      );

      return {
        team,
        totalPoints: result?.total || 0,
        breakdown: breakdown.reduce((acc, row) => {
          acc[row.score_type] = {
            points: row.points,
            count: row.count
          };
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Failed to get team score:', error);
      return { team, totalPoints: 0, breakdown: {} };
    }
  }

  /**
   * Get agent score for a round
   */
  async getAgentScore(roundId, agentId) {
    if (!this.database) {
      return { agentId, totalPoints: 0, breakdown: {} };
    }

    try {
      const result = await this.database.get(
        `SELECT SUM(points) as total FROM scores 
         WHERE round_id = ? AND agent_id = ?`,
        [roundId, agentId]
      );

      const breakdown = await this.database.all(
        `SELECT score_type, SUM(points) as points, COUNT(*) as count
         FROM scores 
         WHERE round_id = ? AND agent_id = ?
         GROUP BY score_type`,
        [roundId, agentId]
      );

      return {
        agentId,
        totalPoints: result?.total || 0,
        breakdown: breakdown.reduce((acc, row) => {
          acc[row.score_type] = {
            points: row.points,
            count: row.count
          };
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Failed to get agent score:', error);
      return { agentId, totalPoints: 0, breakdown: {} };
    }
  }

  /**
   * Calculate final scores and determine winner
   * Requirements: 10.8
   */
  async calculateFinalScores(roundId) {
    const redScore = await this.getTeamScore(roundId, 'RED');
    const blueScore = await this.getTeamScore(roundId, 'BLUE');
    
    const winner = redScore.totalPoints > blueScore.totalPoints ? 'RED' :
                   blueScore.totalPoints > redScore.totalPoints ? 'BLUE' :
                   'TIE';
    
    return {
      red: redScore,
      blue: blueScore,
      winner,
      margin: Math.abs(redScore.totalPoints - blueScore.totalPoints)
    };
  }

  /**
   * Get leaderboard across all rounds
   * Requirements: 10.10
   */
  async getLeaderboard(limit = 10) {
    if (!this.database) {
      return [];
    }

    try {
      const leaderboard = await this.database.all(
        `SELECT 
          team,
          SUM(points) as total_points,
          COUNT(DISTINCT round_id) as rounds_played,
          AVG(points) as avg_points_per_score
         FROM scores
         GROUP BY team
         ORDER BY total_points DESC
         LIMIT ?`,
        [limit]
      );

      return leaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  /**
   * Get detailed scoring history for a round
   */
  async getScoringHistory(roundId) {
    if (!this.database) {
      return [];
    }

    try {
      const history = await this.database.all(
        `SELECT * FROM scores 
         WHERE round_id = ?
         ORDER BY timestamp ASC`,
        [roundId]
      );

      return history.map(row => ({
        ...row,
        details: JSON.parse(row.details)
      }));
    } catch (error) {
      console.error('Failed to get scoring history:', error);
      return [];
    }
  }
}

module.exports = ScoringEngine;
