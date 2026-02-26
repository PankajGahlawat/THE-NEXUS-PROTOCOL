/**
 * Mission Replay System
 * Records and replays mission events for analysis and review
 */

class MissionReplaySystem {
  constructor(io) {
    this.io = io;
    this.recordings = new Map(); // missionId -> recording data
    this.activeReplays = new Map(); // replayId -> replay state
  }

  /**
   * Start recording a mission
   */
  startRecording(missionId, missionData) {
    console.log(`[REPLAY] Starting recording for mission ${missionId}`);

    const recording = {
      missionId,
      missionName: missionData.name,
      startTime: new Date(),
      events: [],
      terminalOutput: [],
      commands: [],
      scoringEvents: [],
      objectives: [],
      metadata: {
        userId: missionData.userId,
        teamId: missionData.teamId,
        vmConfig: missionData.vmConfig
      }
    };

    this.recordings.set(missionId, recording);
    return recording;
  }

  /**
   * Record event
   */
  recordEvent(missionId, event) {
    const recording = this.recordings.get(missionId);
    if (!recording) return;

    const recordedEvent = {
      ...event,
      timestamp: new Date(),
      relativeTime: Date.now() - recording.startTime.getTime()
    };

    recording.events.push(recordedEvent);
  }

  /**
   * Record terminal output
   */
  recordTerminalOutput(missionId, output) {
    const recording = this.recordings.get(missionId);
    if (!recording) return;

    recording.terminalOutput.push({
      output,
      timestamp: new Date(),
      relativeTime: Date.now() - recording.startTime.getTime()
    });
  }

  /**
   * Record command
   */
  recordCommand(missionId, command) {
    const recording = this.recordings.get(missionId);
    if (!recording) return;

    recording.commands.push({
      command,
      timestamp: new Date(),
      relativeTime: Date.now() - recording.startTime.getTime()
    });
  }

  /**
   * Record scoring event
   */
  recordScoringEvent(missionId, scoringEvent) {
    const recording = this.recordings.get(missionId);
    if (!recording) return;

    recording.scoringEvents.push({
      ...scoringEvent,
      timestamp: new Date(),
      relativeTime: Date.now() - recording.startTime.getTime()
    });
  }

  /**
   * Record objective completion
   */
  recordObjectiveCompletion(missionId, objectiveId, objectiveData) {
    const recording = this.recordings.get(missionId);
    if (!recording) return;

    recording.objectives.push({
      objectiveId,
      ...objectiveData,
      completedAt: new Date(),
      relativeTime: Date.now() - recording.startTime.getTime()
    });
  }

  /**
   * Stop recording
   */
  stopRecording(missionId) {
    const recording = this.recordings.get(missionId);
    if (!recording) return null;

    recording.endTime = new Date();
    recording.duration = recording.endTime - recording.startTime;

    console.log(`[REPLAY] Stopped recording for mission ${missionId}`);
    console.log(`[REPLAY] Recorded ${recording.events.length} events, ${recording.commands.length} commands`);

    return recording;
  }

  /**
   * Get recording
   */
  getRecording(missionId) {
    return this.recordings.get(missionId);
  }

  /**
   * Start replay
   */
  startReplay(missionId, options = {}) {
    const recording = this.recordings.get(missionId);
    if (!recording) {
      return { success: false, error: 'Recording not found' };
    }

    const replayId = `replay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const replay = {
      replayId,
      missionId,
      recording,
      currentTime: 0,
      speed: options.speed || 1, // 1x, 2x, 4x, etc.
      paused: false,
      startedAt: new Date(),
      subscribers: new Set()
    };

    this.activeReplays.set(replayId, replay);

    console.log(`[REPLAY] Started replay ${replayId} for mission ${missionId} at ${replay.speed}x speed`);

    // Start replay loop
    this.runReplay(replayId);

    return {
      success: true,
      replayId,
      duration: recording.duration,
      eventCount: recording.events.length
    };
  }

  /**
   * Run replay loop
   */
  runReplay(replayId) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return;

    const interval = setInterval(() => {
      const replay = this.activeReplays.get(replayId);
      if (!replay || replay.paused) return;

      // Increment time based on speed
      replay.currentTime += 100 * replay.speed;

      // Get events at current time
      const currentEvents = this.getEventsAtTime(replay.recording, replay.currentTime);

      // Broadcast events to subscribers
      for (const event of currentEvents) {
        this.broadcastReplayEvent(replayId, event);
      }

      // Check if replay finished
      if (replay.currentTime >= replay.recording.duration) {
        clearInterval(interval);
        this.endReplay(replayId);
      }
    }, 100); // Update every 100ms

    replay.interval = interval;
  }

  /**
   * Get events at specific time
   */
  getEventsAtTime(recording, time) {
    const events = [];
    const tolerance = 100; // 100ms tolerance

    // Check all event types
    for (const event of recording.events) {
      if (Math.abs(event.relativeTime - time) < tolerance) {
        events.push({ type: 'event', data: event });
      }
    }

    for (const output of recording.terminalOutput) {
      if (Math.abs(output.relativeTime - time) < tolerance) {
        events.push({ type: 'terminal', data: output });
      }
    }

    for (const command of recording.commands) {
      if (Math.abs(command.relativeTime - time) < tolerance) {
        events.push({ type: 'command', data: command });
      }
    }

    for (const scoringEvent of recording.scoringEvents) {
      if (Math.abs(scoringEvent.relativeTime - time) < tolerance) {
        events.push({ type: 'scoring', data: scoringEvent });
      }
    }

    for (const objective of recording.objectives) {
      if (Math.abs(objective.relativeTime - time) < tolerance) {
        events.push({ type: 'objective', data: objective });
      }
    }

    return events;
  }

  /**
   * Broadcast replay event
   */
  broadcastReplayEvent(replayId, event) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return;

    this.io.to(`replay-${replayId}`).emit('replay-event', {
      replayId,
      currentTime: replay.currentTime,
      event
    });
  }

  /**
   * Pause replay
   */
  pauseReplay(replayId) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return false;

    replay.paused = true;
    console.log(`[REPLAY] Paused replay ${replayId}`);
    return true;
  }

  /**
   * Resume replay
   */
  resumeReplay(replayId) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return false;

    replay.paused = false;
    console.log(`[REPLAY] Resumed replay ${replayId}`);
    return true;
  }

  /**
   * Seek replay to time
   */
  seekReplay(replayId, time) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return false;

    replay.currentTime = Math.max(0, Math.min(time, replay.recording.duration));
    console.log(`[REPLAY] Seeked replay ${replayId} to ${replay.currentTime}ms`);
    return true;
  }

  /**
   * Change replay speed
   */
  setReplaySpeed(replayId, speed) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return false;

    replay.speed = speed;
    console.log(`[REPLAY] Changed replay ${replayId} speed to ${speed}x`);
    return true;
  }

  /**
   * End replay
   */
  endReplay(replayId) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return;

    if (replay.interval) {
      clearInterval(replay.interval);
    }

    this.io.to(`replay-${replayId}`).emit('replay-ended', {
      replayId
    });

    this.activeReplays.delete(replayId);
    console.log(`[REPLAY] Ended replay ${replayId}`);
  }

  /**
   * Subscribe to replay
   */
  subscribeToReplay(socketId, replayId) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return false;

    replay.subscribers.add(socketId);
    return true;
  }

  /**
   * Unsubscribe from replay
   */
  unsubscribeFromReplay(socketId, replayId) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return false;

    replay.subscribers.delete(socketId);
    return true;
  }

  /**
   * Get replay status
   */
  getReplayStatus(replayId) {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return null;

    return {
      replayId: replay.replayId,
      missionId: replay.missionId,
      currentTime: replay.currentTime,
      duration: replay.recording.duration,
      speed: replay.speed,
      paused: replay.paused,
      progress: (replay.currentTime / replay.recording.duration * 100).toFixed(1)
    };
  }

  /**
   * Get all active replays
   */
  getActiveReplays() {
    return Array.from(this.activeReplays.values()).map(replay => ({
      replayId: replay.replayId,
      missionId: replay.missionId,
      missionName: replay.recording.missionName,
      currentTime: replay.currentTime,
      duration: replay.recording.duration,
      speed: replay.speed,
      paused: replay.paused,
      subscribers: replay.subscribers.size
    }));
  }

  /**
   * Export recording to JSON
   */
  exportRecording(missionId) {
    const recording = this.recordings.get(missionId);
    if (!recording) return null;

    return JSON.stringify(recording, null, 2);
  }

  /**
   * Import recording from JSON
   */
  importRecording(jsonData) {
    try {
      const recording = JSON.parse(jsonData);
      this.recordings.set(recording.missionId, recording);
      console.log(`[REPLAY] Imported recording for mission ${recording.missionId}`);
      return true;
    } catch (error) {
      console.error('[REPLAY] Failed to import recording:', error);
      return false;
    }
  }
}

module.exports = MissionReplaySystem;
