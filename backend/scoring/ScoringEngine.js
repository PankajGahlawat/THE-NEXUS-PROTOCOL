/**
 * Scoring Engine
 * Manages scoring, leaderboards, and achievements
 * Integrates log parser and terminal scanner
 */

const LogParser = require('./LogParser');
const TerminalScanner = require('./TerminalScanner');

class ScoringEngine {
  constructor(io) {
    this.io = io;
    this.logParser = new LogParser();
    this.terminalScanner = new TerminalScanner();
    
    // Scoring data
    this.scores = new Map(); // userId -> score data
    this.sessionScores = new Map(); // sessionId -> score data
    this.achievements = new Map(); // userId -> achievements[]
    this.scoringEvents = []; // All scoring events
    
    // Leaderboard update interval
    this.leaderboardInterval = null;
    this.updateFrequency = 2000; // 2 seconds
  }

  /**
   * Initialize scoring for a session
   */
  initializeSession(sessionId, userId, vmConfig) {
    // Initialize session score
    this.sessionScores.set(sessionId, {
      sessionId,
      userId,
      totalPoints: 0,
      events: [],
      startTime: new Date(),
      lastUpdate: new Date()
    });

    // Initialize user score if not exists
    if (!this.scores.has(userId)) {
      this.scores.set(userId, {
        userId,
        totalPoints: 0,
        sessions: [],
        achievements: [],
        rank: 'F-RANK',
        lastActive: new Date()
      });
    }

    // Start log monitoring
    this.logParser.startMonitoring(sessionId, vmConfig, (event) => {
      this.handleScoringEvent(sessionId, userId, event);
    });

    console.log(`Scoring initialized for session: ${sessionId}`);
  }

  /**
   * Handle scoring event from any source
   */
  handleScoringEvent(sessionId, userId, event) {
    const sessionScore = this.sessionScores.get(sessionId);
    const userScore = this.scores.get(userId);

    if (!sessionScore || !userScore) return;

    // Add points
    sessionScore.totalPoints += event.points;
    sessionScore.events.push(event);
    sessionScore.lastUpdate = new Date();

    userScore.totalPoints += event.points;
    userScore.lastActive = new Date();

    // Update rank
    userScore.rank = this.calculateRank(userScore.totalPoints);

    // Check for achievements
    this.checkAchievements(userId, event);

    // Store event
    this.scoringEvents.push({
      ...event,
      sessionId,
      userId,
      timestamp: new Date()
    });

    // Broadcast to user
    this.io.to(sessionId).emit('scoring-event', {
      event,
      sessionTotal: sessionScore.totalPoints,
      userTotal: userScore.totalPoints,
      rank: userScore.rank
    });

    // Update leaderboard
    this.broadcastLeaderboard();

    console.log(`[SCORE] ${userId} +${event.points} | ${event.description} | Total: ${userScore.totalPoints}`);
  }

  /**
   * Scan terminal command for scoring
   */
  scanCommand(sessionId, userId, command) {
    const events = this.terminalScanner.scanCommand(sessionId, userId, command);
    
    for (const event of events) {
      this.handleScoringEvent(sessionId, userId, event);
    }
  }

  /**
   * Scan terminal output for scoring
   */
  scanOutput(sessionId, userId, output) {
    const events = this.terminalScanner.scanOutput(sessionId, userId, output);
    
    for (const event of events) {
      this.handleScoringEvent(sessionId, userId, event);
    }
  }

  /**
   * Calculate rank based on points
   */
  calculateRank(points) {
    if (points >= 10000) return 'S-RANK';
    if (points >= 7500) return 'A-RANK';
    if (points >= 5000) return 'B-RANK';
    if (points >= 2500) return 'C-RANK';
    if (points >= 1000) return 'D-RANK';
    if (points >= 500) return 'E-RANK';
    return 'F-RANK';
  }

  /**
   * Check and award achievements
   */
  checkAchievements(userId, event) {
    const userScore = this.scores.get(userId);
    if (!userScore) return;

    const achievements = [];

    // First Blood
    if (userScore.totalPoints === event.points && event.points > 0) {
      achievements.push({
        id: 'first_blood',
        name: 'First Blood',
        description: 'Scored your first points',
        icon: '🎯',
        timestamp: new Date()
      });
    }

    // Point milestones
    const milestones = [100, 500, 1000, 2500, 5000, 10000];
    for (const milestone of milestones) {
      if (userScore.totalPoints >= milestone && 
          userScore.totalPoints - event.points < milestone) {
        achievements.push({
          id: `milestone_${milestone}`,
          name: `${milestone} Points`,
          description: `Reached ${milestone} total points`,
          icon: '⭐',
          timestamp: new Date()
        });
      }
    }

    // Category-specific achievements
    if (event.category === 'reconnaissance' && event.points >= 100) {
      achievements.push({
        id: 'recon_master',
        name: 'Reconnaissance Master',
        description: 'Performed advanced reconnaissance',
        icon: '🔍',
        timestamp: new Date()
      });
    }

    if (event.category === 'exploitation' && event.points >= 200) {
      achievements.push({
        id: 'exploit_expert',
        name: 'Exploit Expert',
        description: 'Successfully exploited a vulnerability',
        icon: '💥',
        timestamp: new Date()
      });
    }

    if (event.category === 'privilege_escalation' && event.points >= 200) {
      achievements.push({
        id: 'root_access',
        name: 'Root Access',
        description: 'Gained root privileges',
        icon: '👑',
        timestamp: new Date()
      });
    }

    // Award achievements
    for (const achievement of achievements) {
      if (!userScore.achievements.find(a => a.id === achievement.id)) {
        userScore.achievements.push(achievement);
        
        // Broadcast achievement
        this.io.emit('achievement-unlocked', {
          userId,
          achievement
        });

        console.log(`[ACHIEVEMENT] ${userId} unlocked: ${achievement.name}`);
      }
    }
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit = 10) {
    const leaderboard = Array.from(this.scores.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((score, index) => ({
        position: index + 1,
        userId: score.userId,
        totalPoints: score.totalPoints,
        rank: score.rank,
        achievements: score.achievements.length,
        lastActive: score.lastActive
      }));

    return leaderboard;
  }

  /**
   * Broadcast leaderboard to all clients
   */
  broadcastLeaderboard() {
    const leaderboard = this.getLeaderboard(10);
    this.io.emit('leaderboard-update', {
      leaderboard,
      timestamp: new Date()
    });
  }

  /**
   * Start automatic leaderboard updates
   */
  startLeaderboardUpdates() {
    if (this.leaderboardInterval) return;

    this.leaderboardInterval = setInterval(() => {
      this.broadcastLeaderboard();
    }, this.updateFrequency);

    console.log('Leaderboard auto-update started');
  }

  /**
   * Stop automatic leaderboard updates
   */
  stopLeaderboardUpdates() {
    if (this.leaderboardInterval) {
      clearInterval(this.leaderboardInterval);
      this.leaderboardInterval = null;
      console.log('Leaderboard auto-update stopped');
    }
  }

  /**
   * Get user score
   */
  getUserScore(userId) {
    return this.scores.get(userId);
  }

  /**
   * Get session score
   */
  getSessionScore(sessionId) {
    return this.sessionScores.get(sessionId);
  }

  /**
   * End session scoring
   */
  endSession(sessionId) {
    const sessionScore = this.sessionScores.get(sessionId);
    if (!sessionScore) return;

    // Stop log monitoring
    this.logParser.stopMonitoring(sessionId);

    // Clear terminal scanner history
    this.terminalScanner.clearSession(sessionId);

    // Mark session as ended
    sessionScore.endTime = new Date();
    sessionScore.duration = sessionScore.endTime - sessionScore.startTime;

    // Add to user's session history
    const userScore = this.scores.get(sessionScore.userId);
    if (userScore) {
      userScore.sessions.push({
        sessionId,
        points: sessionScore.totalPoints,
        events: sessionScore.events.length,
        duration: sessionScore.duration,
        endTime: sessionScore.endTime
      });
    }

    console.log(`Scoring ended for session: ${sessionId}`);
  }

  /**
   * Get scoring statistics
   */
  getStatistics() {
    return {
      totalUsers: this.scores.size,
      totalSessions: this.sessionScores.size,
      totalEvents: this.scoringEvents.length,
      activeParsers: this.logParser.getActiveParsers().length,
      leaderboard: this.getLeaderboard(10)
    };
  }

  /**
   * Reset user score (for testing)
   */
  resetUserScore(userId) {
    this.scores.delete(userId);
    console.log(`Reset score for user: ${userId}`);
  }

  /**
   * Clear all scores (for testing)
   */
  clearAllScores() {
    this.scores.clear();
    this.sessionScores.clear();
    this.scoringEvents = [];
    console.log('All scores cleared');
  }
}

module.exports = ScoringEngine;
