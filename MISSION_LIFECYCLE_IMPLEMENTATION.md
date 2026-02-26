# Mission Lifecycle - Complete Implementation

## ✅ IMPLEMENTATION COMPLETE

### What Was Built

1. **Mission Lifecycle Manager** (`MissionLifecycleManager.js`)
   - Mission start with VM snapshot restore
   - Service initialization
   - Timer countdown system
   - Mission end with terminal locking
   - Report generation
   - Event logging

2. **Mission Replay System** (`MissionReplaySystem.js`)
   - Full mission recording
   - Playback with speed control
   - Pause/resume/seek functionality
   - Event synchronization
   - Export/import recordings

3. **Integration**
   - SSH proxy integration
   - Scoring engine integration
   - Admin controller integration
   - VM controller integration

4. **API Endpoints**
   - Mission start/end
   - Objective completion
   - Mission reports
   - Replay control
   - Recording export

## 🏗️ Architecture

```
Mission Start
    ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Initialize Mission Data                                  │
│     - Generate mission ID                                    │
│     - Set duration, objectives                               │
│     - Create event log                                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Restore VM Snapshot                                      │
│     - VBoxManage snapshot restore                            │
│     - Wait for VM ready (60s timeout)                        │
│     - Verify services running                                │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Initialize Services                                      │
│     - Start scoring engine                                   │
│     - Initialize replay recording                            │
│     - Register with admin controller                         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Start Mission Timer                                      │
│     - Countdown from duration                                │
│     - Broadcast updates every 10s                            │
│     - Warnings at 5min, 1min                                 │
│     - Auto-end on timeout                                    │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Mission Active                                           │
│     - Players execute objectives                             │
│     - Commands recorded                                      │
│     - Terminal output recorded                               │
│     - Scoring events recorded                                │
│     - Objectives tracked                                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Mission End (timeout/manual/completion)                  │
│     - Stop timer                                             │
│     - Lock terminals                                         │
│     - Stop recording                                         │
│     - Generate report                                        │
│     - Broadcast results                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Mission Lifecycle Flow

### Phase 1: Initialization

```javascript
// Start mission
const result = await missionLifecycle.startMission({
  name: 'Network Infiltration',
  description: 'Penetrate the corporate network',
  teamId: 'team-alpha',
  userId: 'user-123',
  vmConfig: {
    vmName: 'Ubuntu-CTF-1',
    snapshotName: 'clean',
    host: '192.168.1.100',
    port: 22,
    username: 'root',
    password: 'password'
  },
  duration: 3600, // 1 hour
  objectives: [
    { id: 1, description: 'Scan network', reward: 100 },
    { id: 2, description: 'Find vulnerabilities', reward: 200 },
    { id: 3, description: 'Gain root access', reward: 300 }
  ]
});

// Returns: { success: true, missionId, mission }
```

### Phase 2: VM Restoration

```
[MISSION] Restoring VM snapshot for mission mission-123
[MISSION] VM Ubuntu-CTF-1 restored to snapshot clean
[MISSION] Waiting for VM to be ready...
[MISSION] VM ready after 15 seconds
```

### Phase 3: Active Mission

```javascript
// Timer countdown
mission.timeRemaining: 3600 → 3590 → 3580 → ...

// Warnings
timeRemaining === 300 → "⚠️ 5 minutes remaining!"
timeRemaining === 60  → "⚠️ 1 minute remaining!"
timeRemaining === 0   → Auto-end mission

// Objective completion
missionLifecycle.completeObjective(missionId, 1);
// Logs event, updates progress, broadcasts update
```

### Phase 4: Mission End

```javascript
// End mission
const result = await missionLifecycle.endMission(missionId, 'completed');

// Actions:
// 1. Stop timer
// 2. Lock terminals (no more input)
// 3. Generate report
// 4. Broadcast results
// 5. Save replay

// Returns: { success: true, report }
```

## 📊 Mission Report Structure

```javascript
{
  missionId: 'mission-123',
  missionName: 'Network Infiltration',
  teamId: 'team-alpha',
  userId: 'user-123',
  
  // Timing
  startTime: '2026-02-23T10:00:00Z',
  endTime: '2026-02-23T10:45:30Z',
  duration: {
    total: 2730000,
    minutes: 45,
    seconds: 30,
    formatted: '45m 30s'
  },
  endReason: 'completed',
  
  // Objectives
  totalObjectives: 3,
  completedObjectives: 3,
  objectiveCompletionRate: '100.0',
  objectives: [
    { id: 1, description: '...', completed: true, reward: 100 },
    { id: 2, description: '...', completed: true, reward: 200 },
    { id: 3, description: '...', completed: true, reward: 300 }
  ],
  
  // Scoring
  totalPoints: 1250,
  rank: 'B-RANK',
  achievements: [
    { id: 'first_blood', name: 'First Blood', ... },
    { id: 'milestone_1000', name: '1000 Points', ... }
  ],
  scoringEvents: [
    { type: 'command_match', points: 100, description: '...', ... }
  ],
  
  // Events
  totalEvents: 45,
  events: [
    { type: 'mission_started', message: '...', timestamp: '...' },
    { type: 'vm_restored', message: '...', timestamp: '...' },
    { type: 'objective_completed', objectiveId: 1, ... }
  ],
  
  // Performance
  averagePointsPerMinute: 27,
  
  // Summary
  success: true,
  grade: 'A',
  
  generatedAt: '2026-02-23T10:45:31Z'
}
```

## 🎬 Mission Replay System

### Recording

```javascript
// Automatically starts when mission starts
missionReplay.startRecording(missionId, missionData);

// Records:
// - All terminal output
// - All commands
// - All scoring events
// - All objective completions
// - All mission events

// Each with timestamp and relative time
```

### Playback

```javascript
// Start replay
const result = missionReplay.startReplay(missionId, { speed: 1 });
// Returns: { success: true, replayId, duration, eventCount }

// Control playback
missionReplay.pauseReplay(replayId);
missionReplay.resumeReplay(replayId);
missionReplay.seekReplay(replayId, 30000); // Seek to 30 seconds
missionReplay.setReplaySpeed(replayId, 2); // 2x speed

// Get status
const status = missionReplay.getReplayStatus(replayId);
// Returns: { replayId, currentTime, duration, speed, paused, progress }
```

### Export/Import

```javascript
// Export recording to JSON
const json = missionReplay.exportRecording(missionId);
// Save to file or send to client

// Import recording
missionReplay.importRecording(jsonData);
```

## 🔒 Terminal Locking

### When Mission Ends

```javascript
// Mission ends → terminals locked
mission.terminalLocked = true;

// Broadcast to all clients
io.emit('terminal-locked', {
  missionId,
  message: 'Mission ended. Terminal locked.',
  timestamp: new Date()
});

// Client receives event and disables terminal input
```

### Client-Side Handling

```javascript
socket.on('terminal-locked', (data) => {
  // Disable terminal input
  terminal.setOption('disableStdin', true);
  
  // Show message
  terminal.writeln('\r\n');
  terminal.writeln('═══════════════════════════════════════');
  terminal.writeln('  MISSION ENDED - TERMINAL LOCKED');
  terminal.writeln('═══════════════════════════════════════');
  terminal.writeln('\r\n');
  
  // Show report
  displayMissionReport();
});
```

## 📡 Real-Time Events

### Mission Updates

```javascript
// Broadcast every 10 seconds during mission
io.emit('mission-update', {
  missionId,
  mission: {
    status: 'active',
    timeRemaining: 3450,
    completedObjectives: 2,
    totalObjectives: 3,
    terminalLocked: false
  }
});
```

### Mission Warnings

```javascript
// 5 minutes remaining
io.emit('mission-warning', {
  missionId,
  message: '⚠️ 5 minutes remaining!',
  timeRemaining: 300
});

// 1 minute remaining
io.emit('mission-warning', {
  missionId,
  message: '⚠️ 1 minute remaining!',
  timeRemaining: 60
});
```

### Mission Events

```javascript
// Any mission event
io.emit('mission-event', {
  missionId,
  event: {
    type: 'objective_completed',
    objectiveId: 1,
    message: 'Objective 1 completed',
    timestamp: new Date()
  }
});
```

### Mission End

```javascript
io.emit('mission-ended', {
  missionId,
  reason: 'completed', // or 'timeout', 'manual'
  report: { /* full report */ }
});
```

## 🚀 API Endpoints

### Mission Management

```bash
# Start mission
POST /api/mission/start
Body: { name, description, teamId, userId, vmConfig, duration, objectives }

# End mission
POST /api/mission/:missionId/end
Body: { reason }

# Complete objective
POST /api/mission/:missionId/objective/:objectiveId/complete

# Get mission
GET /api/mission/:missionId

# Get mission report
GET /api/mission/:missionId/report

# Get active missions
GET /api/missions/active
```

### Replay Control

```bash
# Start replay
POST /api/replay/:missionId/start
Body: { speed }

# Pause replay
POST /api/replay/:replayId/pause

# Resume replay
POST /api/replay/:replayId/resume

# Seek replay
POST /api/replay/:replayId/seek
Body: { time }

# Change speed
POST /api/replay/:replayId/speed
Body: { speed }

# Get replay status
GET /api/replay/:replayId/status

# Get recording
GET /api/replay/:missionId/recording

# Export recording
GET /api/replay/:missionId/export

# Get active replays
GET /api/replays/active
```

## 🎯 Use Cases

### Training Scenario

```javascript
// Instructor starts mission for student
const mission = await missionLifecycle.startMission({
  name: 'Basic Reconnaissance',
  userId: 'student-1',
  duration: 1800, // 30 minutes
  objectives: [
    { id: 1, description: 'Run nmap scan', reward: 100 },
    { id: 2, description: 'Identify services', reward: 150 }
  ]
});

// Student completes mission
// Instructor reviews replay at 2x speed
const replay = await missionReplay.startReplay(mission.missionId, { speed: 2 });
```

### Competition

```javascript
// Start timed competition
const mission = await missionLifecycle.startMission({
  name: 'CTF Challenge',
  duration: 3600, // 1 hour
  objectives: ctfObjectives
});

// Timer counts down
// Warnings at 5min, 1min
// Auto-ends at 0:00

// Generate leaderboard from reports
const reports = await Promise.all(
  missions.map(m => missionLifecycle.getMissionReport(m.missionId))
);
const leaderboard = reports.sort((a, b) => b.totalPoints - a.totalPoints);
```

### Assessment

```javascript
// Start assessment mission
const mission = await missionLifecycle.startMission({
  name: 'Security Assessment',
  duration: 7200, // 2 hours
  objectives: assessmentObjectives
});

// Mission ends
// Generate detailed report
const report = await missionLifecycle.getMissionReport(mission.missionId);

// Review performance
console.log(`Grade: ${report.grade}`);
console.log(`Completion: ${report.objectiveCompletionRate}%`);
console.log(`Points: ${report.totalPoints}`);
console.log(`Avg PPM: ${report.averagePointsPerMinute}`);
```

## 🐛 Troubleshooting

### VM Restore Fails

```bash
# Check VirtualBox
VBoxManage list vms
VBoxManage snapshot "VM-Name" list

# Check VM state
VBoxManage showvminfo "VM-Name"

# Manual restore
VBoxManage snapshot "VM-Name" restore "clean"
VBoxManage startvm "VM-Name" --type headless
```

### Timer Not Counting Down

```bash
# Check mission status
curl http://localhost:3002/api/mission/:missionId

# Check backend logs
pm2 logs nexus-backend

# Verify mission is active
mission.status === 'active'
```

### Terminal Not Locking

```bash
# Check Socket.io connection
# Browser console should show: terminal-locked event

# Verify mission ended
mission.status === 'completed'
mission.terminalLocked === true
```

### Replay Not Working

```bash
# Check recording exists
curl http://localhost:3002/api/replay/:missionId/recording

# Check replay status
curl http://localhost:3002/api/replay/:replayId/status

# Verify events recorded
recording.events.length > 0
```

## 📁 Files Created

- `backend/mission/MissionLifecycleManager.js` - Mission lifecycle management
- `backend/mission/MissionReplaySystem.js` - Replay recording and playback
- `backend/ssh-proxy.js` - Enhanced with mission integration
- `MISSION_LIFECYCLE_IMPLEMENTATION.md` - This file

## ✅ Success Criteria

- [x] Mission start triggers VM snapshot restore
- [x] Services initialize after VM ready
- [x] Timer counts down from duration
- [x] Warnings at 5min and 1min
- [x] Mission auto-ends on timeout
- [x] Terminals lock on mission end
- [x] Report generated with all data
- [x] Full mission recording
- [x] Replay with speed control
- [x] Export/import recordings
- [x] Real-time event broadcasting
- [x] API endpoints functional

---

**The complete mission lifecycle system is operational with VM restoration, timer countdown, terminal locking, report generation, and full replay functionality!**
