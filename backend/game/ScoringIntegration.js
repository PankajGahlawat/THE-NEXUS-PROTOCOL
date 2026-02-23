/**
 * Scoring Integration
 * 
 * Integrates the Scoring Engine with game events and real-time updates.
 * Automatically awards points and broadcasts score updates.
 * 
 * Requirements: 10.7, 10.8
 */

class ScoringIntegration {
  constructor(scoringEngine, realTimeSync) {
    this.scoringEngine = scoringEngine;
    this.realTimeSync = realTimeSync;
  }

  /**
   * Handle task completion event
   * Requirements: 10.7, 10.8
   */
  async onTaskCompleted(event) {
    const { roundId, team, agentId, taskId, task, timeRemaining, traceLevel } = event;
    
    // Award points
    const score = await this.scoringEngine.awardTaskPoints(
      roundId,
      team,
      agentId,
      taskId,
      task,
      timeRemaining,
      traceLevel
    );
    
    // Broadcast score update
    if (this.realTimeSync) {
      await this.realTimeSync.broadcastToRoom(roundId, 'score_update', {
        team,
        agentId,
        scoreType: 'task_completion',
        points: score.totalPoints,
        breakdown: score.breakdown,
        taskId,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast updated team totals
      const teamScore = await this.scoringEngine.getTeamScore(roundId, team);
      await this.realTimeSync.broadcastToRoom(roundId, 'team_score_update', {
        team,
        totalPoints: teamScore.totalPoints,
        breakdown: teamScore.breakdown
      });
    }
    
    return score;
  }

  /**
   * Handle detection event
   * Requirements: 10.7, 10.8
   */
  async onDetection(event) {
    const { roundId, team, agentId, detectionDetails } = event;
    
    // Award detection points
    const score = await this.scoringEngine.awardDetectionPoints(
      roundId,
      team,
      agentId,
      detectionDetails
    );
    
    // Broadcast score update
    if (this.realTimeSync) {
      await this.realTimeSync.broadcastToRoom(roundId, 'score_update', {
        team,
        agentId,
        scoreType: 'detection',
        points: score.totalPoints,
        details: detectionDetails,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast updated team totals
      const teamScore = await this.scoringEngine.getTeamScore(roundId, team);
      await this.realTimeSync.broadcastToRoom(roundId, 'team_score_update', {
        team,
        totalPoints: teamScore.totalPoints,
        breakdown: teamScore.breakdown
      });
    }
    
    return score;
  }

  /**
   * Handle containment event
   * Requirements: 10.7, 10.8
   */
  async onContainment(event) {
    const { roundId, team, agentId, containmentDetails } = event;
    
    // Award containment points
    const score = await this.scoringEngine.awardContainmentPoints(
      roundId,
      team,
      agentId,
      containmentDetails
    );
    
    // Broadcast score update
    if (this.realTimeSync) {
      await this.realTimeSync.broadcastToRoom(roundId, 'score_update', {
        team,
        agentId,
        scoreType: 'containment',
        points: score.totalPoints,
        details: containmentDetails,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast updated team totals
      const teamScore = await this.scoringEngine.getTeamScore(roundId, team);
      await this.realTimeSync.broadcastToRoom(roundId, 'team_score_update', {
        team,
        totalPoints: teamScore.totalPoints,
        breakdown: teamScore.breakdown
      });
    }
    
    return score;
  }

  /**
   * Handle recovery event
   * Requirements: 10.7, 10.8
   */
  async onRecovery(event) {
    const { roundId, team, agentId, recoveryDetails } = event;
    
    // Award recovery points
    const score = await this.scoringEngine.awardRecoveryPoints(
      roundId,
      team,
      agentId,
      recoveryDetails
    );
    
    // Broadcast score update
    if (this.realTimeSync) {
      await this.realTimeSync.broadcastToRoom(roundId, 'score_update', {
        team,
        agentId,
        scoreType: 'recovery',
        points: score.totalPoints,
        details: recoveryDetails,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast updated team totals
      const teamScore = await this.scoringEngine.getTeamScore(roundId, team);
      await this.realTimeSync.broadcastToRoom(roundId, 'team_score_update', {
        team,
        totalPoints: teamScore.totalPoints,
        breakdown: teamScore.breakdown
      });
    }
    
    return score;
  }

  /**
   * Handle round end event
   * Requirements: 10.8
   */
  async onRoundEnd(roundId) {
    // Calculate final scores
    const finalScores = await this.scoringEngine.calculateFinalScores(roundId);
    
    // Broadcast final results
    if (this.realTimeSync) {
      await this.realTimeSync.broadcastToRoom(roundId, 'round_end', {
        finalScores,
        timestamp: new Date().toISOString()
      });
    }
    
    return finalScores;
  }

  /**
   * Get current scoreboard for a round
   */
  async getScoreboard(roundId) {
    const redScore = await this.scoringEngine.getTeamScore(roundId, 'RED');
    const blueScore = await this.scoringEngine.getTeamScore(roundId, 'BLUE');
    
    return {
      red: redScore,
      blue: blueScore,
      leader: redScore.totalPoints > blueScore.totalPoints ? 'RED' :
              blueScore.totalPoints > redScore.totalPoints ? 'BLUE' :
              'TIE'
    };
  }
}

module.exports = ScoringIntegration;
