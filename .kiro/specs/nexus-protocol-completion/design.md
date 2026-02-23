# Design Document: NEXUS PROTOCOL Completion

## Overview

This design document specifies the architecture and implementation approach for completing the NEXUS PROTOCOL cyber-war simulation game. The system builds upon the existing foundation (~75% complete) to add mission logic, tool functionality, real-time synchronization, visual effects, database migration, validation, deployment, and production hardening.

The design follows a layered architecture with clear separation between game logic, system interaction, data persistence, and presentation. The implementation prioritizes real system validation, ensuring that task completion requires actual cyber operations rather than simulated button clicks.

### Design Principles

1. **Real System Validation**: All task completions must be verified against actual system state
2. **Phase-Based Progression**: Gameplay follows a structured 60-minute timeline with three distinct phases
3. **Observable Actions**: Red Team actions create detectable events that Blue Team can respond to
4. **Persistent State**: All system changes persist and affect subsequent actions
5. **Agent Specialization**: Each agent has unique capabilities and task assignments
6. **Scalable Architecture**: System supports multiple concurrent rounds with isolated state
7. **Security by Design**: Game infrastructure is hardened even while simulating attacks

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Red Team    │  │  Blue Team   │  │   Operator   │          │
│  │  Browser     │  │  Browser     │  │   Console    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │ WebSocket + HTTP │                  │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────────┐
│         ▼                  ▼                  ▼                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Application Server (Node.js)                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │  Express   │  │ Socket.IO  │  │   Game     │         │   │
│  │  │   API      │  │  Server    │  │  Engine    │         │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘         │   │
│  └────────┼───────────────┼───────────────┼────────────────┘   │
│           │               │               │                     │
│  ┌────────┼───────────────┼───────────────┼────────────────┐   │
│  │        ▼               ▼               ▼                 │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │           Mission Logic Engine                    │   │   │
│  │  │  - Phase Manager                                  │   │   │
│  │  │  - Task Dependency Graph                          │   │   │
│  │  │  - Agent Router                                   │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │           Tool Execution Engine                   │   │   │
│  │  │  - Red Team Tools (nmap, sqlmap, metasploit...)  │   │   │
│  │  │  - Blue Team Tools (IDS, firewall, forensics...) │   │   │
│  │  │  - Effectiveness Calculator                       │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │           Cyber Range Validator                   │   │   │
│  │  │  - System State Verifier                          │   │   │
│  │  │  - Network Topology Checker                       │   │   │
│  │  │  - Service State Monitor                          │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │           Trace & Burn System                     │   │   │
│  │  │  - Trace Accumulator                              │   │   │
│  │  │  - Burn State Calculator                          │   │   │
│  │  │  - Detection Probability Engine                   │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Data Layer (PostgreSQL)                      │   │
│  │  - rounds                                                 │   │
│  │  - tasks                                                  │   │
│  │  - system_states                                          │   │
│  │  - events                                                 │   │
│  │  - agents                                                 │   │
│  │  - tools                                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cyber Range Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Tier I VMs  │  │  Tier II VMs │  │ Tier III VMs │           │
│  │  (Web)       │  │  (SSH/DB)    │  │  (Core)      │           │
│  │ 192.168.100.x│  │ 192.168.100.x│  │ 192.168.100.x│           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Task Initiation**: Player selects task → Game Engine validates prerequisites → Task marked as in-progress
2. **Tool Execution**: Player uses tool → Tool Engine executes against real system → Validator verifies result
3. **State Update**: Validator confirms → State Manager updates system state → Database persists change
4. **Real-Time Broadcast**: State change → Socket.IO broadcasts to all clients → UI updates
5. **Trace Accumulation**: Red action → Trace System calculates residue → Burn state updated → Visual effects triggered
6. **Detection**: Observable action → Detection System evaluates → Blue Team alerted → Response options presented

## Components and Interfaces

### 1. Mission Logic Engine

**Purpose**: Manages round lifecycle, phase transitions, task dependencies, and agent routing.

**Core Classes**:

```typescript
class MissionLogicEngine {
  private roundId: string;
  private currentPhase: Phase;
  private phaseStartTime: Date;
  private taskGraph: TaskDependencyGraph;
  private agentRouter: AgentRouter;
  
  startRound(config: RoundConfig): Round;
  updatePhase(): void;
  unlockTasks(completedTaskId: string): Task[];
  routeTask(task: Task): Agent;
  validateTaskCompletion(taskId: string): Promise<ValidationResult>;
  endRound(): RoundResult;
}

class TaskDependencyGraph {
  private nodes: Map<string, TaskNode>;
  private edges: Map<string, string[]>;
  
  addTask(task: Task, prerequisites: string[]): void;
  getAvailableTasks(completedTasks: Set<string>): Task[];
  unlockDependents(taskId: string): Task[];
  validateDependencies(taskId: string, completed: Set<string>): boolean;
}

class AgentRouter {
  routeToAgent(task: Task): AgentType;
  getAgentCapabilities(agent: AgentType): Capability[];
  calculateAgentEffectiveness(agent: AgentType, tool: Tool): number;
}

enum Phase {
  INITIAL_ACCESS = 'initial_access',
  ESCALATION = 'escalation',
  IMPACT_RECOVERY = 'impact_recovery'
}

interface Round {
  id: string;
  startTime: Date;
  phase: Phase;
  redTeam: Team;
  blueTeam: Team;
  score: Score;
  systemStates: Map<string, SystemState>;
}
```

**Key Methods**:

- `startRound()`: Initializes round with Initial Access phase, creates task graph, provisions VMs
- `updatePhase()`: Checks elapsed time and transitions phases at 20 and 40 minute marks
- `unlockTasks()`: Traverses dependency graph to unlock tasks when prerequisites complete
- `routeTask()`: Assigns tasks to appropriate agent based on task type and agent specialization
- `validateTaskCompletion()`: Calls Cyber Range Validator to verify task against real system state
- `endRound()`: Calculates final scores, persists results, triggers VM snapshots

### 2. Tool Execution Engine

**Purpose**: Executes offensive and defensive tools against real systems, calculates effectiveness based on Burn state.

**Core Classes**:

```typescript
class ToolExecutionEngine {
  private toolRegistry: Map<string, ToolDefinition>;
  private effectivenessCalculator: EffectivenessCalculator;
  private systemInteractor: SystemInteractor;
  
  executeTool(toolId: string, target: Target, context: ExecutionContext): Promise<ToolResult>;
  registerTool(tool: ToolDefinition): void;
  calculateCooldown(tool: Tool, burnState: BurnState): number;
}

class EffectivenessCalculator {
  calculateEffectiveness(tool: Tool, burnState: BurnState, agentType: AgentType): number;
  applyBurnPenalty(baseEffectiveness: number, burnState: BurnState): number;
  applyAgentBonus(effectiveness: number, agent: AgentType, tool: Tool): number;
}

class SystemInteractor {
  executeCommand(target: string, command: string): Promise<CommandResult>;
  scanNetwork(range: string): Promise<NetworkScanResult>;
  exploitVulnerability(target: string, exploit: string): Promise<ExploitResult>;
  configureFirewall(rules: FirewallRule[]): Promise<ConfigResult>;
  restoreSystem(target: string, snapshot: string): Promise<RestoreResult>;
}

interface ToolDefinition {
  id: string;
  name: string;
  type: 'offensive' | 'defensive';
  category: ToolCategory;
  baseCooldown: number;
  effectiveness: number;
  traceGeneration: number;
  observable: boolean;
  execute: (target: Target, context: ExecutionContext) => Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  output: string;
  traceGenerated: number;
  systemStateChanges: SystemStateChange[];
  observable: boolean;
}
```

**Tool Implementations**:

Red Team Tools:
- `nmap`: Executes actual nmap scan against target IPs, returns discovered services
- `sqlmap`: Attempts SQL injection, returns extracted data if successful
- `gobuster`: Enumerates web directories, returns discovered paths
- `hydra`: Performs password attacks, returns cracked credentials
- `metasploit`: Exploits vulnerabilities, returns shell access or failure
- `mimikatz`: Extracts credentials from memory, returns credential dump
- `cron`: Establishes persistence via cron jobs, returns confirmation
- `nc`: Creates reverse shells or exfiltration channels, returns connection status
- `dns_tunnel`: Exfiltrates data via DNS, returns bytes transferred

Blue Team Tools:
- `ids_monitor`: Monitors network traffic, returns detected anomalies
- `firewall_config`: Configures firewall rules, returns rule set
- `ip_block`: Blocks specified IPs, returns blocked addresses
- `rootkit_detect`: Scans for persistence mechanisms, returns findings
- `forensics`: Analyzes logs and artifacts, returns timeline
- `system_restore`: Reverts to clean snapshot, returns restore status

### 3. Real-Time Synchronization System

**Purpose**: Broadcasts game state changes to all connected clients via WebSocket, handles observable actions and alerts.

**Core Classes**:

```typescript
class RealTimeSyncSystem {
  private io: SocketIO.Server;
  private roomManager: RoomManager;
  private messageQueue: MessageQueue;
  
  broadcastStateUpdate(roundId: string, update: StateUpdate): void;
  sendTeamUpdate(team: TeamType, update: TeamUpdate): void;
  sendAlert(team: TeamType, alert: Alert): void;
  handleObservableAction(action: ObservableAction): void;
  syncTimer(roundId: string, timeRemaining: number): void;
}

class RoomManager {
  createRoom(roundId: string): void;
  joinRoom(clientId: string, roundId: string, team: TeamType): void;
  leaveRoom(clientId: string): void;
  getRoomClients(roundId: string): Client[];
  getTeamClients(roundId: string, team: TeamType): Client[];
}

class MessageQueue {
  enqueue(message: Message): void;
  dequeue(): Message | null;
  flush(): void;
  handleBackpressure(): void;
}

interface StateUpdate {
  type: 'task_complete' | 'phase_change' | 'score_update' | 'trace_update' | 'burn_update';
  roundId: string;
  timestamp: Date;
  data: any;
}

interface ObservableAction {
  actionType: string;
  actor: Agent;
  target: string;
  detectionProbability: number;
  timestamp: Date;
}

interface Alert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionable: boolean;
  suggestedResponse?: string;
}
```

**WebSocket Protocol**:

Client → Server:
- `tool_use`: { toolId, targetId, agentId }
- `task_attempt`: { taskId, agentId }
- `subscribe_updates`: { roundId, team }

Server → Client:
- `state_update`: { type, data }
- `alert`: { severity, title, message }
- `timer_sync`: { timeRemaining }
- `trace_update`: { level, burnState }
- `score_update`: { redScore, blueScore }

### 4. Trace & Burn Visual System

**Purpose**: Calculates and displays identity residue levels, triggers visual effects based on Burn state.

**Core Classes**:

```typescript
class TraceBurnSystem {
  private traceAccumulator: TraceAccumulator;
  private burnCalculator: BurnCalculator;
  private visualEffects: VisualEffectsEngine;
  
  accumulateTrace(action: Action): number;
  calculateBurnState(traceLevel: number): BurnState;
  triggerVisualEffects(burnState: BurnState): void;
  reduceTrace(amount: number): number;
}

class TraceAccumulator {
  private baseTraceRates: Map<string, number>;
  
  calculateTraceGeneration(action: Action, stealthModifiers: number[]): number;
  applyStealthReduction(trace: number, tools: Tool[]): number;
  getTraceLevel(roundId: string, team: TeamType): number;
}

class BurnCalculator {
  calculateBurnState(traceLevel: number): BurnState;
  getDetectionProbability(burnState: BurnState): number;
  getToolEffectivenessPenalty(burnState: BurnState): number;
  shouldTriggerCountermeasures(burnState: BurnState): boolean;
}

class VisualEffectsEngine {
  applyTraceVisuals(level: number): void;
  applyBurnEffects(state: BurnState): void;
  animateTraceTransition(from: number, to: number): void;
  triggerCountermeasureWarning(): void;
}

enum BurnState {
  LOW = 'low',           // 0-25% trace
  MODERATE = 'moderate', // 26-50% trace
  HIGH = 'high',         // 51-75% trace
  CRITICAL = 'critical'  // 76-100% trace
}

interface TraceLevel {
  percentage: number;
  status: 'Ghost' | 'Shadow' | 'Visible' | 'Burned';
  visualIntensity: number;
}
```

**Trace Calculation**:
- Base trace per action: 5-15% depending on action type
- Stealth tool reduction: -20% to -50%
- Time-based accumulation: +1% per minute
- Detection events: +10% per detection
- Burn state affects tool effectiveness: LOW (100%), MODERATE (80%), HIGH (60%), CRITICAL (40%)

## Data Models

### PostgreSQL Schema

```sql
-- Rounds table
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  current_phase VARCHAR(20) NOT NULL,
  phase_start_time TIMESTAMP NOT NULL,
  red_team_id UUID NOT NULL,
  blue_team_id UUID NOT NULL,
  red_score INTEGER DEFAULT 0,
  blue_score INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id),
  task_type VARCHAR(50) NOT NULL,
  phase VARCHAR(20) NOT NULL,
  agent_type VARCHAR(20) NOT NULL,
  team_type VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'locked',
  assigned_to UUID,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  points_awarded INTEGER DEFAULT 0,
  prerequisites JSONB DEFAULT '[]',
  validation_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- System states table
CREATE TABLE system_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id),
  system_ip VARCHAR(15) NOT NULL,
  system_tier VARCHAR(10) NOT NULL,
  compromised BOOLEAN DEFAULT FALSE,
  compromise_level INTEGER DEFAULT 0,
  services JSONB NOT NULL,
  firewall_rules JSONB DEFAULT '[]',
  persistence_mechanisms JSONB DEFAULT '[]',
  last_modified TIMESTAMP DEFAULT NOW(),
  modified_by UUID,
  snapshot_id VARCHAR(100)
);

-- Events table (audit trail)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id),
  event_type VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  target_system VARCHAR(15),
  action_details JSONB NOT NULL,
  trace_generated NUMERIC(5,2),
  observable BOOLEAN DEFAULT FALSE,
  detected BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id),
  agent_type VARCHAR(20) NOT NULL,
  team_type VARCHAR(10) NOT NULL,
  player_id UUID,
  tasks_completed INTEGER DEFAULT 0,
  tools_used INTEGER DEFAULT 0,
  effectiveness_rating NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tools table
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(30) NOT NULL,
  base_cooldown INTEGER NOT NULL,
  base_effectiveness NUMERIC(3,2) NOT NULL,
  trace_generation NUMERIC(5,2) NOT NULL,
  observable BOOLEAN DEFAULT TRUE,
  description TEXT,
  usage_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_tasks_round_phase ON tasks(round_id, phase);
CREATE INDEX idx_system_states_round ON system_states(round_id);
CREATE INDEX idx_events_round_timestamp ON events(round_id, timestamp);
CREATE INDEX idx_events_observable ON events(observable, detected);
```

### Key Data Structures

```typescript
interface Round {
  id: string;
  startTime: Date;
  endTime?: Date;
  currentPhase: Phase;
  phaseStartTime: Date;
  redTeamId: string;
  blueTeamId: string;
  redScore: number;
  blueScore: number;
  status: 'active' | 'paused' | 'completed';
}

interface Task {
  id: string;
  roundId: string;
  taskType: string;
  phase: Phase;
  agentType: AgentType;
  teamType: TeamType;
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  pointsAwarded: number;
  prerequisites: string[];
  validationData?: any;
}

interface SystemState {
  id: string;
  roundId: string;
  systemIp: string;
  systemTier: 'tier1' | 'tier2' | 'tier3';
  compromised: boolean;
  compromiseLevel: number; // 0-100
  services: ServiceState[];
  firewallRules: FirewallRule[];
  persistenceMechanisms: PersistenceMechanism[];
  lastModified: Date;
  modifiedBy: string;
  snapshotId: string;
}

interface Event {
  id: string;
  roundId: string;
  eventType: string;
  actorId: string;
  actorType: AgentType;
  targetSystem?: string;
  actionDetails: any;
  traceGenerated: number;
  observable: boolean;
  detected: boolean;
  timestamp: Date;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Mission Logic Properties

Property 1: Round initialization sets Initial Access phase
*For any* round configuration, when a round is started, the initial phase should be Initial Access
**Validates: Requirements 1.1**

Property 2: Task unlocking follows dependency graph
*For any* task with prerequisites, completing all prerequisite tasks should unlock the dependent task
**Validates: Requirements 1.4, 11.2, 11.3**

Property 3: Agent routing matches task type
*For any* task, the assigned agent should match the task's required agent type (ARCHITECT/SPECTER/ORACLE for Red, SENTINEL/WARDEN/RESTORER for Blue)
**Validates: Requirements 1.5, 1.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**

Property 4: Task validation queries system state
*For any* task validation request, the validator should query the current system state before returning a result
**Validates: Requirements 1.7, 6.1**

Property 5: Prerequisite verification blocks invalid attempts
*For any* task attempt, if prerequisites are not completed, the attempt should be rejected
**Validates: Requirements 1.10, 11.6**

Property 6: Early phase transition on objective completion
*For any* phase, if all objectives are completed before the time limit, the phase should transition immediately
**Validates: Requirements 1.8**

### Tool System Properties

Property 7: Burn state reduces tool effectiveness
*For any* tool used when burn state is HIGH or CRITICAL, the tool's effectiveness should be reduced compared to LOW or MODERATE burn states
**Validates: Requirements 2.16**

Property 8: Tool execution validates against system state
*For any* tool execution, the system should validate the action against the current system state
**Validates: Requirements 2.17**

Property 9: Tool execution updates system state
*For any* successfully completed tool execution, the system state should reflect the changes made by the tool
**Validates: Requirements 2.18, 13.2, 13.3**

Property 10: Agent effectiveness modifiers apply correctly
*For any* tool used by an agent, the effectiveness should include agent-specific modifiers based on the agent's specialization
**Validates: Requirements 14.7**

### Real-Time Synchronization Properties

Property 11: Actions broadcast to all clients
*For any* game action (Red or Blue team), a WebSocket broadcast should be sent to all connected clients in the round
**Validates: Requirements 3.1, 3.2**

Property 12: Observable actions trigger Blue Team alerts
*For any* observable Red Team action, Blue Team clients should receive an alert notification
**Validates: Requirements 3.3, 12.9**

Property 13: State changes trigger real-time updates
*For any* state change (task completion, score update, trace update, burn update, phase transition), connected clients should receive a real-time update
**Validates: Requirements 3.4, 3.5, 3.6, 3.7, 3.9**

Property 14: New clients receive current state
*For any* client that connects to a round, the client should receive the complete current game state
**Validates: Requirements 3.10**

Property 15: Disconnections handled gracefully
*For any* client disconnection, the system should continue functioning normally for other connected clients
**Validates: Requirements 3.11**

### Trace & Burn Properties

Property 16: Trace level determines visual status
*For any* trace level, the visual status should correctly map to Ghost (0-25%), Shadow (26-50%), Visible (51-75%), or Burned (76-100%)
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

Property 17: Burn state determines visual indicators
*For any* burn state, the visual indicators should correctly display LOW (green), MODERATE (yellow), HIGH (orange), or CRITICAL (red)
**Validates: Requirements 4.5, 4.6, 4.7, 4.8**

Property 18: Stealth tools reduce trace
*For any* stealth tool usage, the trace level should decrease by the tool's trace reduction amount
**Validates: Requirements 4.12**

Property 19: Detection probability increases with burn state
*For any* observable action, the detection probability should increase as burn state increases from LOW to CRITICAL
**Validates: Requirements 12.8**

### Database Properties

Property 20: Entity persistence round trip
*For any* entity (round, task, system state, event), inserting it into the database and then querying by ID should return an equivalent entity
**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

Property 21: Prepared statements prevent injection
*For any* database query, the query should use prepared statements with parameterized values
**Validates: Requirements 5.6, 9.6**

Property 22: Round isolation maintains data separation
*For any* query with a round_id filter, the results should only include data belonging to that specific round
**Validates: Requirements 5.7**

Property 23: Database errors return meaningful messages
*For any* database error, the system should log the error and return a user-friendly error message
**Validates: Requirements 5.9, 15.4**

### Validation Properties

Property 24: Validation verifies claimed actions
*For any* task completion claim, the validator should verify the claim by checking the actual system state
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8**

Property 25: Validation failures provide descriptive errors
*For any* failed validation, the error message should describe what was expected and what was actually found
**Validates: Requirements 6.10**

Property 26: VM health affects validation
*For any* validation attempt on an unhealthy VM, the validation should fail with a health check error
**Validates: Requirements 6.9**

### Scoring Properties

Property 27: Task completion awards points
*For any* completed task, points should be awarded based on the task's difficulty and the current phase
**Validates: Requirements 10.1**

Property 28: Speed bonus applies to fast completions
*For any* Red Team objective completed before the phase time limit, a speed bonus should be applied proportional to time remaining
**Validates: Requirements 10.2**

Property 29: Stealth bonus applies to low trace
*For any* Red Team round completion, if the final trace level is below 50%, a stealth bonus should be applied
**Validates: Requirements 10.3**

Property 30: Detection awards Blue Team points
*For any* Red Team action that Blue Team detects, Blue Team should receive detection points
**Validates: Requirements 10.4**

Property 31: Score persistence
*For any* score update, the new score should be persisted to the database immediately
**Validates: Requirements 10.9**

### Detection Properties

Property 32: Observable actions generate detection opportunities
*For any* observable Red Team action, the detection system should evaluate detection probability and potentially alert Blue Team
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

Property 33: IDS monitoring increases detection probability
*For any* observable action when Blue Team has IDS monitoring active, the detection probability should be higher than without IDS
**Validates: Requirements 12.6**

Property 34: Stealth tools reduce detection probability
*For any* Red Team action performed with stealth tools active, the detection probability should be lower than without stealth tools
**Validates: Requirements 12.7**

Property 35: Detected actions provide actionable intelligence
*For any* detected observable action, Blue Team should receive information about the action type, timestamp, and affected system
**Validates: Requirements 12.9, 12.10**

### State Management Properties

Property 36: State initialization at round start
*For any* new round, all VMs in the cyber range should have their system state initialized to the baseline configuration
**Validates: Requirements 13.1**

Property 37: State updates reflect actions
*For any* action that modifies a system (Red or Blue team), the system state should be updated to reflect the modification
**Validates: Requirements 13.2, 13.3**

Property 38: State queries return current state
*For any* system state query, the returned state should match the most recent persisted state for that system
**Validates: Requirements 13.4**

Property 39: Compromise tracking
*For any* system that is compromised, the system state should mark it as compromised and track the compromise level
**Validates: Requirements 13.5**

Property 40: State restoration reverts to baseline
*For any* system restore action, the system state should revert to the baseline configuration
**Validates: Requirements 13.6**

### Error Handling Properties

Property 41: Database connection retry with backoff
*For any* database connection failure, the system should retry with exponential backoff before giving up
**Validates: Requirements 15.1**

Property 42: WebSocket reconnection on disconnect
*For any* WebSocket connection drop, the client should attempt to reconnect automatically
**Validates: Requirements 15.3**

Property 43: Validation errors return user-friendly messages
*For any* validation error, the system should return a message that explains the error without exposing internal details
**Validates: Requirements 15.4**

Property 44: Unhandled exceptions are logged
*For any* unhandled exception, the system should log the full stack trace and return a generic error message to the client
**Validates: Requirements 15.5**

Property 45: Emergency kill switch stops all rounds
*For any* emergency kill switch activation, all active rounds should be immediately terminated and all clients disconnected
**Validates: Requirements 15.6, 15.7, 15.8, 9.10**

### Security Properties

Property 46: Security headers applied to all responses
*For any* HTTP response, security headers (CSP, HSTS, X-Frame-Options) should be present
**Validates: Requirements 9.1**

Property 47: CORS validation against whitelist
*For any* CORS request, the origin should be validated against the configured whitelist
**Validates: Requirements 9.2**

Property 48: Rate limiting enforced
*For any* client exceeding rate limits, subsequent requests should be rejected with 429 status
**Validates: Requirements 9.3**

Property 49: Input validation and sanitization
*For any* user input, the system should validate format and sanitize content before processing
**Validates: Requirements 9.5**

Property 50: WebSocket authentication required
*For any* WebSocket connection attempt, the client must provide a valid authentication token
**Validates: Requirements 9.7**

Property 51: Sensitive data redaction in logs
*For any* log entry containing sensitive data (credentials, tokens), the sensitive portions should be redacted
**Validates: Requirements 9.12**

## Error Handling

### Error Categories

1. **Validation Errors**: Task validation failures, prerequisite violations, invalid state transitions
2. **System Errors**: VM unavailability, network failures, service outages
3. **Database Errors**: Connection failures, query errors, constraint violations
4. **Authentication Errors**: Invalid tokens, expired sessions, unauthorized access
5. **Rate Limiting Errors**: Too many requests, DDoS detection
6. **Tool Execution Errors**: Command failures, timeout errors, permission denied

### Error Handling Strategy

**Validation Errors**:
- Return 400 Bad Request with descriptive error message
- Log validation failure with context
- Do not update system state
- Example: "Task 'escalate_privileges' cannot be attempted: prerequisite task 'initial_access' not completed"

**System Errors**:
- Return 503 Service Unavailable
- Log error with full context
- Attempt automatic recovery (VM restart, reconnection)
- Alert operator if recovery fails
- Example: "Target system 192.168.100.10 is unavailable. VM health check failed."

**Database Errors**:
- Retry with exponential backoff (max 3 attempts)
- Return 500 Internal Server Error if all retries fail
- Log error with query context (sanitized)
- Example: "Database connection lost. Retrying... (attempt 2/3)"

**Authentication Errors**:
- Return 401 Unauthorized
- Log authentication attempt
- Do not expose details about why authentication failed
- Example: "Authentication failed. Please check your credentials."

**Rate Limiting Errors**:
- Return 429 Too Many Requests
- Include Retry-After header
- Log rate limit violation with client IP
- Activate DDoS protection if pattern detected
- Example: "Rate limit exceeded. Please try again in 60 seconds."

**Tool Execution Errors**:
- Return 422 Unprocessable Entity
- Log tool execution failure with context
- Do not update system state
- Provide actionable feedback to user
- Example: "Tool 'nmap' failed: target system 192.168.100.10 is not responding to scans"

### Error Recovery Mechanisms

1. **Database Connection Pool**: Maintain pool of connections, automatically replace failed connections
2. **WebSocket Reconnection**: Client automatically reconnects with exponential backoff
3. **VM Health Monitoring**: Periodic health checks, automatic restart on failure
4. **State Reconciliation**: Detect and resolve state inconsistencies
5. **Circuit Breaker**: Temporarily disable failing components to prevent cascade failures
6. **Graceful Degradation**: Continue operation with reduced functionality when components fail

### Emergency Procedures

**Emergency Kill Switch**:
```typescript
async function activateEmergencyKillSwitch(reason: string): Promise<void> {
  // 1. Log emergency activation
  logger.critical('EMERGENCY KILL SWITCH ACTIVATED', { reason });
  
  // 2. Stop all active rounds
  await roundManager.stopAllRounds();
  
  // 3. Disconnect all WebSocket clients
  await socketServer.disconnectAll('Emergency shutdown');
  
  // 4. Persist current state
  await database.snapshotAllState();
  
  // 5. Notify operators
  await notificationService.alertOperators('EMERGENCY_SHUTDOWN', { reason });
  
  // 6. Enter maintenance mode
  await systemController.enterMaintenanceMode();
}
```

## Testing Strategy

### Dual Testing Approach

The NEXUS PROTOCOL system requires both unit testing and property-based testing to ensure correctness:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific tool behaviors (e.g., nmap scanning a known vulnerable system)
- Phase transitions at exact time boundaries (20 min, 40 min, 60 min)
- Database schema migrations
- Docker container startup sequences
- VM provisioning for each tier
- Emergency kill switch activation
- Specific error handling scenarios

**Property-Based Tests**: Verify universal properties across all inputs
- Task dependency unlocking for any task graph
- Agent routing for any task type
- Tool effectiveness calculation for any burn state
- Real-time broadcasting for any action
- Trace level calculation for any action sequence
- Database round trip for any entity
- Validation for any task completion claim
- Score calculation for any completed objective
- Detection probability for any observable action
- State updates for any system modification

### Property-Based Testing Configuration

**Library Selection**: 
- Backend (Node.js/TypeScript): fast-check
- Frontend (React/TypeScript): fast-check with React Testing Library

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: nexus-protocol-completion, Property {number}: {property_text}`
- Generators for: rounds, tasks, agents, tools, system states, actions, burn states
- Shrinking enabled to find minimal failing cases

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: nexus-protocol-completion, Property 2: Task unlocking follows dependency graph
describe('Task Dependency Unlocking', () => {
  it('should unlock dependent tasks when all prerequisites are completed', () => {
    fc.assert(
      fc.property(
        fc.array(taskGenerator(), { minLength: 3, maxLength: 10 }),
        (tasks) => {
          const graph = new TaskDependencyGraph();
          tasks.forEach(task => graph.addTask(task, task.prerequisites));
          
          // Complete all prerequisites for a task
          const taskWithPrereqs = tasks.find(t => t.prerequisites.length > 0);
          if (!taskWithPrereqs) return true; // Skip if no tasks have prerequisites
          
          const completed = new Set(taskWithPrereqs.prerequisites);
          const unlocked = graph.getAvailableTasks(completed);
          
          // The task should be in the unlocked list
          return unlocked.some(t => t.id === taskWithPrereqs.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Cyber Range Integration**:
- Test tool execution against real VMs
- Verify validation against actual system state
- Test VM provisioning and reset
- Verify network isolation (192.168.100.0/24)

**Database Integration**:
- Test PostgreSQL connection pooling under load
- Verify data isolation between concurrent rounds
- Test migration scripts
- Verify audit trail completeness

**Real-Time Integration**:
- Test WebSocket broadcasting with multiple clients
- Verify message ordering and delivery
- Test reconnection and state synchronization
- Verify latency handling

**Docker Integration**:
- Test container orchestration with docker-compose
- Verify network isolation between containers
- Test volume persistence across restarts
- Verify environment variable configuration

### End-to-End Testing

**Complete Round Simulation**:
1. Start round with Red and Blue teams
2. Red Team completes Initial Access tasks
3. Verify phase transition to Escalation
4. Blue Team detects Red Team actions
5. Red Team accumulates trace, reaches HIGH burn
6. Blue Team blocks Red Team IP
7. Red Team uses stealth tools to reduce trace
8. Complete Escalation, transition to Impact/Recovery
9. Red Team completes final objectives
10. Blue Team restores compromised systems
11. Round ends, scores calculated
12. Verify all state persisted correctly

### Performance Testing

**Load Testing**:
- 10 concurrent rounds with 6 agents each
- 1000 tool executions per minute
- 100 WebSocket clients per round
- Database query performance under load

**Stress Testing**:
- Maximum concurrent rounds (50+)
- Rapid task completion (100+ tasks/second)
- WebSocket message flooding
- Database connection pool exhaustion

**Latency Testing**:
- Real-time update latency (<100ms)
- Tool execution latency (<500ms)
- Validation latency (<1000ms)
- Database query latency (<50ms)

### Security Testing

**Penetration Testing**:
- SQL injection attempts on all endpoints
- XSS attempts in user inputs
- CSRF attacks on state-changing operations
- WebSocket message tampering
- Rate limit bypass attempts
- Authentication bypass attempts

**Security Scanning**:
- Dependency vulnerability scanning (npm audit)
- Container image scanning (Trivy)
- Static code analysis (ESLint security rules)
- Secret detection (git-secrets)

## Deployment Architecture

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: nexus_protocol
      POSTGRES_USER: nexus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-database.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - nexus_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nexus"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://nexus:${DB_PASSWORD}@postgres:5432/nexus_protocol
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_CODE: ${ADMIN_CODE}
      CYBER_RANGE_NETWORK: 192.168.100.0/24
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - nexus_network
      - cyber_range
    volumes:
      - ./backend/logs:/app/logs
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: http://backend:3000
      VITE_WS_URL: ws://backend:3000
    ports:
      - "5173:80"
    depends_on:
      - backend
    networks:
      - nexus_network
    restart: unless-stopped

  vm_manager:
    build:
      context: ./vm-automation
      dockerfile: Dockerfile
    environment:
      LIBVIRT_URI: qemu:///system
      VM_NETWORK: 192.168.100.0/24
    volumes:
      - /var/run/libvirt:/var/run/libvirt
      - vm_snapshots:/snapshots
    networks:
      - cyber_range
    privileged: true
    restart: unless-stopped

networks:
  nexus_network:
    driver: bridge
  cyber_range:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.100.0/24

volumes:
  postgres_data:
  vm_snapshots:
```

### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "simple-server.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### VM Automation Architecture

**VM Manager Service**:
- Manages libvirt/KVM virtual machines
- Provisions vulnerable VMs for each tier
- Creates and restores snapshots
- Monitors VM health
- Handles network configuration

**VM Provisioning Process**:
1. Clone base image for tier (Tier I: Ubuntu + Apache, Tier II: Ubuntu + SSH/MySQL, Tier III: Ubuntu + Custom Services)
2. Apply vulnerability configuration (weak passwords, unpatched services, misconfigurations)
3. Assign IP address in 192.168.100.0/24 range
4. Start VM and verify services
5. Create baseline snapshot
6. Register VM with game engine

**VM Reset Process**:
1. Stop VM gracefully
2. Restore from baseline snapshot
3. Start VM
4. Verify services are running
5. Update system state in database

**VM Health Monitoring**:
- Ping check every 30 seconds
- Service port checks (HTTP:80, SSH:22, MySQL:3306)
- Resource usage monitoring (CPU, memory, disk)
- Automatic restart on failure
- Alert operator if restart fails

### Production Hardening Checklist

**Network Security**:
- [x] Firewall rules configured (only expose 3000, 5173)
- [x] Network isolation between game network and cyber range
- [x] Rate limiting on all API endpoints
- [x] DDoS protection enabled
- [x] TLS/SSL certificates configured
- [x] CORS whitelist configured

**Application Security**:
- [x] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [x] Input validation on all endpoints
- [x] SQL injection prevention (prepared statements)
- [x] XSS prevention (output encoding)
- [x] CSRF protection
- [x] Authentication token expiration
- [x] Password hashing (bcrypt)
- [x] Sensitive data redaction in logs

**Database Security**:
- [x] Database user with minimal privileges
- [x] Connection encryption (SSL)
- [x] Prepared statements only
- [x] Regular backups
- [x] Audit logging enabled

**Container Security**:
- [x] Non-root user in containers
- [x] Minimal base images (Alpine)
- [x] No secrets in images
- [x] Regular image updates
- [x] Vulnerability scanning

**Monitoring & Logging**:
- [x] Centralized logging
- [x] Error tracking
- [x] Performance monitoring
- [x] Security event logging
- [x] Audit trail for all actions
- [x] Alert system for critical events

**Operational Security**:
- [x] Emergency kill switch
- [x] Backup and restore procedures
- [x] Incident response plan
- [x] Regular security audits
- [x] Dependency vulnerability scanning
- [x] Secrets management (environment variables, not hardcoded)

## Implementation Notes

### Technology Choices

**Backend**:
- Node.js 18+ for async I/O and WebSocket support
- Express for HTTP API
- Socket.IO for WebSocket with fallback support
- PostgreSQL for scalable data persistence
- fast-check for property-based testing

**Frontend**:
- React 19 (already in use)
- TypeScript for type safety
- GSAP for trace/burn visual effects
- Socket.IO client for real-time updates

**Infrastructure**:
- Docker for containerization
- docker-compose for orchestration
- libvirt/KVM for VM management
- PostgreSQL for production database

**Cyber Range**:
- Ubuntu VMs for target systems
- Vulnerable web applications (DVWA, WebGoat)
- Weak SSH configurations
- Unpatched services

### Development Phases

**Phase 1: Core Game Logic (Weeks 1-2)**
- Implement Mission Logic Engine
- Implement Task Dependency Graph
- Implement Agent Router
- Add phase transition logic
- Unit tests for game logic

**Phase 2: Tool System (Weeks 2-3)**
- Implement Tool Execution Engine
- Implement Red Team tools (nmap, sqlmap, etc.)
- Implement Blue Team tools (IDS, firewall, etc.)
- Implement effectiveness calculator
- Integration tests with mock systems

**Phase 3: Cyber Range Integration (Weeks 3-4)**
- Implement Cyber Range Validator
- Implement System State Manager
- Integrate with real VMs
- Implement VM automation
- Integration tests with real systems

**Phase 4: Real-Time System (Week 4)**
- Implement WebSocket broadcasting
- Implement observable action detection
- Implement alert system
- Implement state synchronization
- Real-time integration tests

**Phase 5: Trace & Burn (Week 5)**
- Implement Trace Accumulator
- Implement Burn Calculator
- Implement visual effects
- Integrate with tool system
- Property tests for trace calculation

**Phase 6: Database Migration (Week 5)**
- Implement PostgreSQL schema
- Migrate from SQLite
- Implement connection pooling
- Implement audit logging
- Database integration tests

**Phase 7: Deployment (Week 6)**
- Create Docker containers
- Configure docker-compose
- Implement VM automation scripts
- Configure production environment
- Deployment tests

**Phase 8: Production Hardening (Week 6)**
- Implement security headers
- Implement rate limiting
- Implement input validation
- Implement emergency kill switch
- Security testing

**Phase 9: Testing & Polish (Week 7)**
- Property-based tests for all properties
- End-to-end testing
- Performance testing
- Security testing
- Bug fixes and polish

### Migration Strategy

**SQLite to PostgreSQL Migration**:
1. Create PostgreSQL schema
2. Export data from SQLite
3. Transform data to PostgreSQL format
4. Import data to PostgreSQL
5. Verify data integrity
6. Update connection strings
7. Test all database operations
8. Deploy with PostgreSQL

**Backward Compatibility**:
- Maintain SQLite support for development
- Use database abstraction layer
- Environment variable to select database type
- Gradual migration of production instances

### Performance Considerations

**Database Optimization**:
- Connection pooling (min: 10, max: 50)
- Indexes on frequently queried columns
- Prepared statement caching
- Query result caching for leaderboards
- Batch inserts for events

**WebSocket Optimization**:
- Message batching (max 10ms delay)
- Binary protocol for large messages
- Compression for text messages
- Connection pooling
- Heartbeat to detect dead connections

**VM Management Optimization**:
- VM snapshot caching
- Parallel VM provisioning
- Lazy VM startup (provision on demand)
- VM pooling (pre-provisioned VMs)
- Resource limits per VM

**Frontend Optimization**:
- WebSocket message throttling
- Virtual scrolling for large lists
- Memoization of expensive calculations
- Lazy loading of components
- Service worker for offline support

### Security Considerations

**Authentication & Authorization**:
- JWT tokens with 1-hour expiration
- Refresh tokens for extended sessions
- Role-based access control (player, operator, admin)
- Token revocation on logout
- Rate limiting on authentication endpoints

**Data Protection**:
- Encrypt sensitive data at rest
- Encrypt all network traffic (TLS)
- Redact sensitive data in logs
- Secure credential storage (bcrypt)
- Regular security audits

**Cyber Range Isolation**:
- Separate network for cyber range (192.168.100.0/24)
- No internet access from cyber range
- Firewall rules between game network and cyber range
- VM resource limits to prevent DoS
- Regular VM resets to prevent persistence

**Audit Trail**:
- Log all actions with timestamp and actor
- Immutable event log
- Regular log backups
- Log retention policy (90 days)
- Compliance with data protection regulations

## Conclusion

This design provides a comprehensive architecture for completing the NEXUS PROTOCOL cyber-war simulation game. The implementation follows best practices for game development, security, and scalability. The system is designed to be testable, maintainable, and extensible.

Key design decisions:
1. Real system validation ensures authentic gameplay
2. Phase-based progression provides structured experience
3. Observable actions create dynamic Red vs Blue interaction
4. Trace & Burn system adds risk/reward mechanics
5. PostgreSQL enables scalability and audit trails
6. Docker deployment ensures consistent environments
7. Property-based testing verifies correctness across all inputs
8. Production hardening protects game infrastructure

The implementation can proceed in phases, with each phase building on the previous one. The system is designed to be deployed incrementally, allowing for testing and validation at each stage.
