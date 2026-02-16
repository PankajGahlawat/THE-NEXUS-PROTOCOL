// Database schema and models for Nexus Protocol
// This is a simplified in-memory implementation
// In production, replace with PostgreSQL/MongoDB

class Database {
  constructor() {
    this.teams = new Map();
    this.sessions = new Map();
    this.missions = new Map();
    this.missionInstances = new Map();
    this.performanceLogs = new Map();
    this.hexShards = new Map();
    this.achievements = new Map();
  }

  // Team management
  createTeam(teamData) {
    const teamId = this.generateId();
    const team = {
      id: teamId,
      teamName: teamData.teamName,
      accessCodeHash: teamData.accessCodeHash,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      totalMissions: 0,
      completedMissions: 0,
      totalScore: 0,
      averageRank: 'F-RANK',
      bestRank: 'F-RANK',
      favoriteAgent: null,
      achievements: []
    };
    
    this.teams.set(teamId, team);
    return team;
  }

  getTeam(teamId) {
    return this.teams.get(teamId);
  }

  updateTeam(teamId, updates) {
    const team = this.teams.get(teamId);
    if (team) {
      Object.assign(team, updates, { lastActive: new Date().toISOString() });
      this.teams.set(teamId, team);
    }
    return team;
  }

  // Session management
  createSession(sessionData) {
    const sessionId = this.generateId();
    const session = {
      id: sessionId,
      teamId: sessionData.teamId,
      sessionToken: sessionData.sessionToken,
      authenticated: true,
      selectedAgent: null,
      missionProgress: 0,
      threatLevel: 'LOW',
      traceResidue: 0,
      currentPhase: 1,
      currentMission: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && new Date(session.expiresAt) > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(sessionId);
    }
    return null;
  }

  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  // Mission instance management
  createMissionInstance(missionData) {
    const instanceId = this.generateId();
    const instance = {
      id: instanceId,
      missionId: missionData.missionId,
      teamId: missionData.teamId,
      selectedAgent: missionData.selectedAgent,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + missionData.duration * 1000).toISOString(),
      status: 'active',
      phase: 1,
      traceLevel: 0,
      objectives: missionData.objectives.map(obj => ({
        ...obj,
        completed: false,
        completedAt: null
      })),
      timeRemaining: missionData.duration,
      alarmsTriggered: 0,
      missionProgress: 0,
      abilities: {
        cooldowns: {},
        charges: {
          ultimate: 0
        }
      },
      events: []
    };
    
    this.missionInstances.set(instanceId, instance);
    return instance;
  }

  getMissionInstance(instanceId) {
    return this.missionInstances.get(instanceId);
  }

  updateMissionInstance(instanceId, updates) {
    const instance = this.missionInstances.get(instanceId);
    if (instance) {
      Object.assign(instance, updates);
      this.missionInstances.set(instanceId, instance);
    }
    return instance;
  }

  completeMissionInstance(instanceId, finalData) {
    const instance = this.missionInstances.get(instanceId);
    if (instance) {
      instance.status = 'completed';
      instance.completedAt = new Date().toISOString();
      instance.finalScore = finalData.finalScore;
      instance.rank = finalData.rank;
      instance.finalTraceLevel = finalData.traceLevel;
      instance.timeUsed = finalData.timeUsed;
      
      this.missionInstances.set(instanceId, instance);
      
      // Create performance log
      this.createPerformanceLog({
        missionInstanceId: instanceId,
        teamId: instance.teamId,
        ...finalData
      });
    }
    return instance;
  }

  // Performance logging
  createPerformanceLog(logData) {
    const logId = this.generateId();
    const log = {
      id: logId,
      missionInstanceId: logData.missionInstanceId,
      teamId: logData.teamId,
      finalScore: logData.finalScore,
      rank: logData.rank,
      traceLevel: logData.traceLevel,
      timeUsed: logData.timeUsed,
      objectivesCompleted: logData.objectivesCompleted || [],
      alarmsTriggered: logData.alarmsTriggered || 0,
      selectedAgent: logData.selectedAgent,
      createdAt: new Date().toISOString()
    };
    
    this.performanceLogs.set(logId, log);
    return log;
  }

  getPerformanceLogs(teamId) {
    return Array.from(this.performanceLogs.values())
      .filter(log => log.teamId === teamId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Hex-shard management
  awardHexShards(teamId, shardData) {
    const shardId = this.generateId();
    const shard = {
      id: shardId,
      teamId,
      shardType: shardData.type,
      quantity: shardData.quantity,
      earnedFrom: shardData.missionInstanceId,
      createdAt: new Date().toISOString()
    };
    
    this.hexShards.set(shardId, shard);
    return shard;
  }

  getTeamHexShards(teamId) {
    return Array.from(this.hexShards.values())
      .filter(shard => shard.teamId === teamId);
  }

  getTotalHexShards(teamId) {
    const shards = this.getTeamHexShards(teamId);
    return shards.reduce((total, shard) => {
      return {
        common: total.common + (shard.shardType === 'common' ? shard.quantity : 0),
        uncommon: total.uncommon + (shard.shardType === 'uncommon' ? shard.quantity : 0),
        rare: total.rare + (shard.shardType === 'rare' ? shard.quantity : 0),
        legendary: total.legendary + (shard.shardType === 'legendary' ? shard.quantity : 0),
        mythic: total.mythic + (shard.shardType === 'mythic' ? shard.quantity : 0)
      };
    }, { common: 0, uncommon: 0, rare: 0, legendary: 0, mythic: 0 });
  }

  // Achievement management
  awardAchievement(teamId, achievementId) {
    const achievementKey = `${teamId}_${achievementId}`;
    if (!this.achievements.has(achievementKey)) {
      const achievement = {
        teamId,
        achievementId,
        unlockedAt: new Date().toISOString()
      };
      this.achievements.set(achievementKey, achievement);
      return achievement;
    }
    return null;
  }

  getTeamAchievements(teamId) {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.teamId === teamId);
  }

  // Analytics
  getGlobalStats() {
    const totalMissions = this.missionInstances.size;
    const completedMissions = Array.from(this.missionInstances.values())
      .filter(m => m.status === 'completed').length;
    
    const totalTeams = this.teams.size;
    const activeSessions = Array.from(this.sessions.values())
      .filter(s => new Date(s.expiresAt) > new Date()).length;

    // Agent popularity
    const agentCounts = Array.from(this.missionInstances.values())
      .reduce((counts, mission) => {
        if (mission.selectedAgent) {
          counts[mission.selectedAgent] = (counts[mission.selectedAgent] || 0) + 1;
        }
        return counts;
      }, {});
    
    const mostPopularAgent = Object.entries(agentCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'analyst';

    return {
      totalMissions,
      totalTeams,
      activeSessions,
      completedMissions,
      averageCompletionRate: totalMissions > 0 ? (completedMissions / totalMissions * 100) : 0,
      mostPopularAgent,
      averageSessionDuration: 2847 // Simplified
    };
  }

  getMissionStats() {
    const missions = Array.from(this.missionInstances.values());
    const stats = {};

    ['FALSE_FLAG', 'BIOMETRIC_BLUFF', 'CORE_EXTRACTION'].forEach(missionType => {
      const missionData = missions.filter(m => m.missionId === missionType);
      const completed = missionData.filter(m => m.status === 'completed');
      
      stats[missionType] = {
        attempts: missionData.length,
        completions: completed.length,
        completionRate: missionData.length > 0 ? (completed.length / missionData.length * 100) : 0,
        averageScore: completed.length > 0 ? 
          completed.reduce((sum, m) => sum + (m.finalScore || 0), 0) / completed.length : 0,
        averageDuration: completed.length > 0 ?
          completed.reduce((sum, m) => sum + (m.timeUsed || 0), 0) / completed.length : 0
      };
    });

    return stats;
  }

  getLeaderboard(limit = 10, timeframe = 'all') {
    const logs = Array.from(this.performanceLogs.values());
    
    // Filter by timeframe
    let filteredLogs = logs;
    if (timeframe === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = logs.filter(log => new Date(log.createdAt) > weekAgo);
    } else if (timeframe === 'monthly') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filteredLogs = logs.filter(log => new Date(log.createdAt) > monthAgo);
    }

    // Group by team and calculate totals
    const teamStats = filteredLogs.reduce((stats, log) => {
      if (!stats[log.teamId]) {
        const team = this.getTeam(log.teamId);
        stats[log.teamId] = {
          teamId: log.teamId,
          teamName: team?.teamName || 'Unknown',
          totalScore: 0,
          missionsCompleted: 0,
          bestScore: 0,
          ranks: [],
          lastActive: team?.lastActive
        };
      }
      
      stats[log.teamId].totalScore += log.finalScore;
      stats[log.teamId].missionsCompleted += 1;
      stats[log.teamId].bestScore = Math.max(stats[log.teamId].bestScore, log.finalScore);
      stats[log.teamId].ranks.push(log.rank);
      
      return stats;
    }, {});

    // Calculate average rank and sort
    const leaderboard = Object.values(teamStats)
      .map(team => ({
        ...team,
        averageRank: this.calculateAverageRank(team.ranks),
        averageScore: team.missionsCompleted > 0 ? Math.round(team.totalScore / team.missionsCompleted) : 0
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((team, index) => ({
        rank: index + 1,
        teamName: team.teamName,
        score: team.totalScore,
        missionsCompleted: team.missionsCompleted,
        averageRank: team.averageRank,
        lastActive: team.lastActive
      }));

    return {
      leaderboard,
      metadata: {
        totalTeams: Object.keys(teamStats).length,
        timeframe,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  calculateAverageRank(ranks) {
    if (ranks.length === 0) return 'F-RANK';
    
    const rankValues = {
      'S-RANK': 6,
      'A-RANK': 5,
      'B-RANK': 4,
      'C-RANK': 3,
      'D-RANK': 2,
      'F-RANK': 1
    };
    
    const average = ranks.reduce((sum, rank) => sum + (rankValues[rank] || 1), 0) / ranks.length;
    
    if (average >= 5.5) return 'S-RANK';
    if (average >= 4.5) return 'A-RANK';
    if (average >= 3.5) return 'B-RANK';
    if (average >= 2.5) return 'C-RANK';
    if (average >= 1.5) return 'D-RANK';
    return 'F-RANK';
  }

  // Utility methods
  generateId() {
    return 'id_' + Math.random().toString(36).substring(2, 16) + Date.now().toString(36);
  }

  cleanup() {
    // Clean up expired sessions
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt) <= now) {
        this.sessions.delete(sessionId);
      }
    }

    // Clean up old mission instances (keep last 1000)
    const instances = Array.from(this.missionInstances.entries())
      .sort(([,a], [,b]) => new Date(b.startTime) - new Date(a.startTime));
    
    if (instances.length > 1000) {
      const toDelete = instances.slice(1000);
      toDelete.forEach(([id]) => this.missionInstances.delete(id));
    }
  }
}

// Export singleton instance
const database = new Database();

// Cleanup every hour
setInterval(() => {
  database.cleanup();
}, 60 * 60 * 1000);

module.exports = database;