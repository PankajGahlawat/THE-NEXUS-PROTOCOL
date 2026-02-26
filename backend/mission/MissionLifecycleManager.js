/**
 * Mission Lifecycle Manager
 * Manages complete mission lifecycle from start to end
 * Handles VM initialization, timers, terminal locking, and reports
 */

const EventEmitter = require('events');

class MissionLifecycleManager extends EventEmitter {
  constructor(io, vmController, scoringEngine, adminController) {
    super();
    this.io = io;
    this.vmController = vmController;
    this.scoringEngine = scoringEngine;
    this.adminController = adminController;
    
    this.activeMissions = new Map(); // missionId -> mission data
    this.missionTimers = new Map(); // missionId -> timer interval
    this.missionReports = new Map(); // missionId -> report data
    this.missionReplays = new Map(); // missionId -> replay events
  }

  /**
   * Start a new mission
   */
  async startMission(missionConfig) {
    const missionId = `mission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[MISSION] Starting mission: ${missionId}`);
    
    try {
      // Initialize mission data
      const mission = {
        missionId,
        name: missionConfig.name,
        description: missionConfig.description,
        teamId: missionConfig.teamId,
        userId: missionConfig.userId,
        vmConfig: missionConfig.vmConfig,
        duration: missionConfig.duration || 3600, // Default 1 hour
        startTime: new Date(),
        endTime: null,
        status: 'initializing',
        timeRemaining: missionConfig.duration || 3600,
        objectives: missionConfig.objectives || [],
        completedObjectives: [],
        events: [],
        terminalLocked: false
      };

      this.activeMissions.set(missionId, mission);
      this.missionReplays.set(missionId, []);

      // Log mission start event
      this.logMissionEvent(missionId, {
        type: 'mission_started',
        message: `Mission "${mission.name}" started`,
        timestamp: new Date()
      });

      // Step 1: Restore VM snapshot
      if (mission.vmConfig && mission.vmConfig.vmName) {
        mission.status = 'restoring_vm';
        this.broadcastMissionUpdate(missionId, mission);

        await this.restoreVMSnapshot(missionId, mission.vmConfig);

        this.logMissionEvent(missionId, {
          type: 'vm_restored',
          message: `VM ${mission.vmConfig.vmName} restored to snapshot`,
          timestamp: new Date()
        });
      }

      // Step 2: Initialize services
      mission.status = 'initializing_services';
      this.broadcastMissionUpdate(missionId, mission);

      await this.initializeServices(missionId, mission);

      this.logMissionEvent(missionId, {
        type: 'services_initialized',
        message: 'Mission services initialized',
        timestamp: new Date()
      });

      // Step 3: Start mission timer
      mission.status = 'active';
      this.broadcastMissionUpdate(missionId, mission);

      this.startMissionTimer(missionId);

      this.logMissionEvent(missionId, {
        type: 'mission_active',
        message: 'Mission is now active',
        timestamp: new Date()
      });

      // Notify admin
      this.adminController.addToWarFeed({
        type: 'mission_started',
        missionId,
        userId: mission.userId,
        message: `Mission "${mission.name}" started by ${mission.userId}`,
        timestamp: new Date()
      });

      console.log(`[MISSION] Mission ${missionId} started successfully`);

      return {
        success: true,
        missionId,
        mission
      };

    } catch (error) {
      console.error(`[MISSION] Failed to start mission:`, error);
      
      const mission = this.activeMissions.get(missionId);
      if (mission) {
        mission.status = 'failed';
        mission.error = error.message;
        this.broadcastMissionUpdate(missionId, mission);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore VM snapshot
   */
  async restoreVMSnapshot(missionId, vmConfig) {
    console.log(`[MISSION] Restoring VM snapshot for mission ${missionId}`);
    
    try {
      const result = await this.vmController.restoreSnapshot(
        vmConfig.vmName,
        vmConfig.snapshotName || 'clean'
      );

      // Wait for VM to be ready
      await this.waitForVMReady(vmConfig.vmName, 60000); // 60 second timeout

      return result;
    } catch (error) {
      console.error(`[MISSION] VM restore failed:`, error);
      throw error;
    }
  }

  /**
   * Wait for VM to be ready
   */
  async waitForVMReady(vmName, timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const state = await this.vmController.getVMState(vmName);
        if (state === 'running') {
          // Additional wait for services to start
          await this.sleep(10000);
          return true;
        }
      } catch (error) {
        // VM not ready yet
      }
      
      await this.sleep(2000);
    }
    
    throw new Error('VM failed to become ready within timeout');
  }

  /**
   * Initialize mission services
   */
  async initializeServices(missionId, mission) {
    console.log(`[MISSION] Initializing services for mission ${missionId}`);
    
    // Initialize scoring for this mission
    if (mission.userId) {
      // Scoring will be initialized when player connects terminal
    }

    // Initialize any other services
    await this.sleep(2000); // Simulate service initialization
    
    return true;
  }

  /**
   * Start mission timer
   */
  startMissionTimer(missionId) {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    console.log(`[MISSION] Starting timer for mission ${missionId} (${mission.duration}s)`);

    const interval = setInterval(() => {
      const mission = this.activeMissions.get(missionId);
      if (!mission || mission.status !== 'active') {
        clearInterval(interval);
        this.missionTimers.delete(missionId);
        return;
      }

      mission.timeRemaining--;

      // Broadcast time update every 10 seconds
      if (mission.timeRemaining % 10 === 0) {
        this.broadcastMissionUpdate(missionId, mission);
      }

      // Warning at 5 minutes
      if (mission.timeRemaining === 300) {
        this.logMissionEvent(missionId, {
          type: 'time_warning',
          message: '5 minutes remaining!',
          timestamp: new Date()
        });

        this.io.emit('mission-warning', {
          missionId,
          message: '⚠️ 5 minutes remaining!',
          timeRemaining: 300
        });
      }

      // Warning at 1 minute
      if (mission.timeRemaining === 60) {
        this.logMissionEvent(missionId, {
          type: 'time_warning',
          message: '1 minute remaining!',
          timestamp: new Date()
        });

        this.io.emit('mission-warning', {
          missionId,
          message: '⚠️ 1 minute remaining!',
          timeRemaining: 60
        });
      }

      // Time's up
      if (mission.timeRemaining <= 0) {
        clearInterval(interval);
        this.missionTimers.delete(missionId);
        this.endMission(missionId, 'timeout');
      }
    }, 1000);

    this.missionTimers.set(missionId, interval);
  }

  /**
   * End mission
   */
  async endMission(missionId, reason = 'completed') {
    const mission = this.activeMissions.get(missionId);
    if (!mission) {
      return { success: false, error: 'Mission not found' };
    }

    console.log(`[MISSION] Ending mission ${missionId} (reason: ${reason})`);

    try {
      // Stop timer
      const timer = this.missionTimers.get(missionId);
      if (timer) {
        clearInterval(timer);
        this.missionTimers.delete(missionId);
      }

      // Update mission status
      mission.status = 'ending';
      mission.endTime = new Date();
      mission.endReason = reason;
      this.broadcastMissionUpdate(missionId, mission);

      // Lock terminals
      await this.lockTerminals(missionId);

      this.logMissionEvent(missionId, {
        type: 'terminals_locked',
        message: 'All terminals locked',
        timestamp: new Date()
      });

      // Generate report
      const report = await this.generateMissionReport(missionId);
      this.missionReports.set(missionId, report);

      this.logMissionEvent(missionId, {
        type: 'report_generated',
        message: 'Mission report generated',
        timestamp: new Date()
      });

      // Update final status
      mission.status = 'completed';
      mission.report = report;
      this.broadcastMissionUpdate(missionId, mission);

      // Broadcast mission end
      this.io.emit('mission-ended', {
        missionId,
        reason,
        report
      });

      // Notify admin
      this.adminController.addToWarFeed({
        type: 'mission_ended',
        missionId,
        userId: mission.userId,
        reason,
        message: `Mission "${mission.name}" ended: ${reason}`,
        timestamp: new Date()
      });

      console.log(`[MISSION] Mission ${missionId} ended successfully`);

      return {
        success: true,
        report
      };

    } catch (error) {
      console.error(`[MISSION] Failed to end mission:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lock all terminals for mission
   */
  async lockTerminals(missionId) {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    mission.terminalLocked = true;

    // Broadcast terminal lock to all connected clients
    this.io.emit('terminal-locked', {
      missionId,
      message: 'Mission ended. Terminal locked.',
      timestamp: new Date()
    });

    console.log(`[MISSION] Terminals locked for mission ${missionId}`);
  }

  /**
   * Generate mission report
   */
  async generateMissionReport(missionId) {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return null;

    console.log(`[MISSION] Generating report for mission ${missionId}`);

    // Get scoring data
    const userScore = this.scoringEngine.getUserScore(mission.userId);
    const sessionScore = this.scoringEngine.getSessionScore(mission.userId);

    // Calculate statistics
    const duration = mission.endTime - mission.startTime;
    const durationMinutes = Math.floor(duration / 60000);
    const durationSeconds = Math.floor((duration % 60000) / 1000);

    const report = {
      missionId,
      missionName: mission.name,
      teamId: mission.teamId,
      userId: mission.userId,
      
      // Timing
      startTime: mission.startTime,
      endTime: mission.endTime,
      duration: {
        total: duration,
        minutes: durationMinutes,
        seconds: durationSeconds,
        formatted: `${durationMinutes}m ${durationSeconds}s`
      },
      endReason: mission.endReason,
      
      // Objectives
      totalObjectives: mission.objectives.length,
      completedObjectives: mission.completedObjectives.length,
      objectiveCompletionRate: mission.objectives.length > 0 
        ? (mission.completedObjectives.length / mission.objectives.length * 100).toFixed(1)
        : 0,
      objectives: mission.objectives.map(obj => ({
        ...obj,
        completed: mission.completedObjectives.includes(obj.id)
      })),
      
      // Scoring
      totalPoints: userScore?.totalPoints || 0,
      rank: userScore?.rank || 'F-RANK',
      achievements: userScore?.achievements || [],
      scoringEvents: sessionScore?.events || [],
      
      // Events
      totalEvents: mission.events.length,
      events: mission.events,
      
      // Performance
      averagePointsPerMinute: durationMinutes > 0 
        ? Math.round((userScore?.totalPoints || 0) / durationMinutes)
        : 0,
      
      // Summary
      success: mission.completedObjectives.length === mission.objectives.length,
      grade: this.calculateGrade(mission, userScore),
      
      // Metadata
      generatedAt: new Date()
    };

    return report;
  }

  /**
   * Calculate mission grade
   */
  calculateGrade(mission, userScore) {
    const completionRate = mission.objectives.length > 0
      ? (mission.completedObjectives.length / mission.objectives.length)
      : 0;
    
    const points = userScore?.totalPoints || 0;

    if (completionRate === 1 && points >= 5000) return 'S';
    if (completionRate >= 0.9 && points >= 3000) return 'A';
    if (completionRate >= 0.7 && points >= 2000) return 'B';
    if (completionRate >= 0.5 && points >= 1000) return 'C';
    if (completionRate >= 0.3) return 'D';
    return 'F';
  }

  /**
   * Log mission event
   */
  logMissionEvent(missionId, event) {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    mission.events.push(event);

    // Add to replay
    const replay = this.missionReplays.get(missionId);
    if (replay) {
      replay.push({
        ...event,
        relativeTime: Date.now() - mission.startTime.getTime()
      });
    }

    // Broadcast event
    this.io.emit('mission-event', {
      missionId,
      event
    });
  }

  /**
   * Complete objective
   */
  completeObjective(missionId, objectiveId) {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return false;

    if (!mission.completedObjectives.includes(objectiveId)) {
      mission.completedObjectives.push(objectiveId);

      this.logMissionEvent(missionId, {
        type: 'objective_completed',
        objectiveId,
        message: `Objective ${objectiveId} completed`,
        timestamp: new Date()
      });

      this.broadcastMissionUpdate(missionId, mission);

      // Check if all objectives completed
      if (mission.completedObjectives.length === mission.objectives.length) {
        this.logMissionEvent(missionId, {
          type: 'all_objectives_completed',
          message: 'All objectives completed!',
          timestamp: new Date()
        });
      }

      return true;
    }

    return false;
  }

  /**
   * Get mission replay data
   */
  getMissionReplay(missionId) {
    return this.missionReplays.get(missionId) || [];
  }

  /**
   * Get mission report
   */
  getMissionReport(missionId) {
    return this.missionReports.get(missionId);
  }

  /**
   * Get active mission
   */
  getActiveMission(missionId) {
    return this.activeMissions.get(missionId);
  }

  /**
   * Get all active missions
   */
  getAllActiveMissions() {
    return Array.from(this.activeMissions.values());
  }

  /**
   * Broadcast mission update
   */
  broadcastMissionUpdate(missionId, mission) {
    this.io.emit('mission-update', {
      missionId,
      mission: {
        missionId: mission.missionId,
        name: mission.name,
        status: mission.status,
        timeRemaining: mission.timeRemaining,
        completedObjectives: mission.completedObjectives.length,
        totalObjectives: mission.objectives.length,
        terminalLocked: mission.terminalLocked
      }
    });
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup mission
   */
  cleanupMission(missionId) {
    const timer = this.missionTimers.get(missionId);
    if (timer) {
      clearInterval(timer);
      this.missionTimers.delete(missionId);
    }

    // Keep mission data for history
    // this.activeMissions.delete(missionId);
    
    console.log(`[MISSION] Cleaned up mission ${missionId}`);
  }
}

module.exports = MissionLifecycleManager;
