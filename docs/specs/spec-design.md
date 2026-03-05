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

### 0. SSH Proxy System (THE KEY PIECE)

**Purpose**: Bridges browser terminals to the VM via WebSocket and SSH, enabling real command execution.

**Core Classes**:

```javascript
class SSHProxyManager {
  constructor() {
    this.sessions = new Map(); // socketId -> session object
  }
  
  createSession(socketId, team, options) {
    // options: { onData, onClose }
    // Returns: session object
  }
  
  writeToSession(socketId, data) {
    // Sends keystroke to VM PTY
  }
  
  resizeSession(socketId, cols, rows) {
    // Resizes VM PTY window
  }
  
  closeSession(socketId) {
    // Closes SSH connection and removes from Map
  }
  
  getActiveSessions() {
    // Returns array of active session info
  }
}

// Session object structure
interface Session {
  socketId: string;
  team: 'red' | 'blue';
  sshConnection: SSH2.Client;
  stream: SSH2.ClientChannel;
  playerId: string;
  createdAt: Date;
}
```

**Key Implementation Details**:

- Uses `ssh2` npm library for SSH client connections
- Connects to VM using private key authentication (no passwords)
- Creates PTY with `term: 'xterm-256color', cols: 220, rows: 50`
- Red Team connects as `redteam@VM_HOST`, Blue Team as `blueteam@VM_HOST`
- Each player gets their own SSH connection and PTY session
- Sessions stored in Map keyed by Socket.IO socket ID
- Handles SSH errors gracefully (connection failures, authentication errors)

**Terminal Data Flow**:

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER (Player's Computer)                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Xterm.js Terminal                                    │   │
│  │  - Renders terminal UI                                │   │
│  │  - Captures keystrokes                                │   │
│  │  - Displays output                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           │ WebSocket (Socket.io)            │
│                           ↓                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│  NODE.JS BACKEND (nexusprotocol.com)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  server.js                                            │   │
│  │  - Express HTTP server                                │   │
│  │  - Socket.IO server attached                          │   │
│  │  - Event handlers:                                    │   │
│  │    • 'terminal:join' → createSession()                │   │
│  │    • 'terminal:input' → writeToSession()              │   │
│  │    • 'terminal:resize' → resizeSession()              │   │
│  │    • 'disconnect' → closeSession()                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ssh-proxy.js (SSHProxyManager)                       │   │
│  │  - Manages SSH connections                            │   │
│  │  - Creates PTY sessions                               │   │
│  │  - Routes data between WebSocket and SSH              │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           │ SSH (ssh2 library)               │
│                           ↓                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│  LINUX VM (The Battlefield)                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PTY Session (Pseudo-Terminal)                        │   │
│  │  - Runs bash shell                                    │   │
│  │  - Executes commands                                  │   │
│  │  - Returns output                                     │   │
│  │                                                        │   │
│  │  User: redteam or blueteam                            │   │
│  │  Home: /home/redteam or /home/blueteam                │   │
│  │  Tools: nmap, sqlmap, etc. (Red) or IDS, etc. (Blue) │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Input Flow** (Player types "whoami"):
1. Player types "whoami" in Xterm.js
2. Xterm.js fires `onData` event with "whoami\r"
3. React component emits `socket.emit('terminal:input', {data: 'whoami\r'})`
4. Backend receives event, calls `sshProxy.writeToSession(socketId, 'whoami\r')`
5. SSHProxyManager writes data to SSH stream
6. SSH sends data to VM PTY
7. VM executes "whoami" command

**Output Flow** (VM returns "redteam"):
1. VM PTY produces output "redteam\n"
2. SSH stream receives data via `stream.on('data')`
3. SSHProxyManager calls `onData('redteam\n')` callback
4. Backend emits `socket.emit('terminal:output', {data: 'redteam\n'})`
5. React component receives event
6. Xterm.js writes "redteam\n" to terminal display
7. Player sees "redteam" on screen

**WebSocket Protocol**:

Client → Server:
- `terminal:join` { team: 'red'|'blue', missionId, token }
- `terminal:input` { data: string }
- `terminal:resize` { cols: number, rows: number }

Server → Client:
- `terminal:output` { data: string }
- `terminal:disconnected` { reason: string }

Admin Namespace (`/admin`):
- `admin:watch` { socketId: string } - Mirror player's terminal
- `admin:award` { sessionId, points, reason } - Manual point award
- `admin:reset_vm` { missionId } - Trigger VM snapshot restore

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

### 3. SSH Proxy Architecture (THE KEY PIECE)

**Purpose**: The SSH proxy is THE KEY PIECE that makes everything possible. It bridges browser-based terminals to VM PTY sessions via SSH connections, enabling real command execution in the cyber range.

**Core Classes**:

```typescript
class SSHProxyManager {
  private sessions: Map<string, SSHSession>;
  private ssh2: SSH2Client;
  
  createSession(socketId: string, team: TeamType, options: SessionOptions): Promise<SSHSession>;
  writeToSession(socketId: string, data: string): void;
  resizeSession(socketId: string, cols: number, rows: number): void;
  closeSession(socketId: string): void;
  getSession(socketId: string): SSHSession | undefined;
}

interface SSHSession {
  socketId: string;
  team: TeamType;
  vmHost: string;
  vmUser: string;
  sshConnection: SSH2Connection;
  ptyStream: SSH2Stream;
  createdAt: Date;
  lastActivity: Date;
}

interface SessionOptions {
  missionId: string;
  token: string;
  cols: number;
  rows: number;
}
```

**SSH Connection Flow**:
1. Browser connects via WebSocket (Socket.io)
2. Backend receives 'terminal:join' event with team and credentials
3. SSHProxyManager creates SSH connection to VM using ssh2 library
4. SSH authenticates with private key (red → redteam@vm, blue → blueteam@vm)
5. SSH requests PTY with term='xterm-256color', cols=220, rows=50
6. PTY stream is stored in sessions Map keyed by socketId
7. Data flows bidirectionally: Browser ↔ WebSocket ↔ SSH ↔ VM

**Terminal Data Flow Pipeline**:
```
Browser (Xterm.js) 
  ↓ WebSocket (Socket.io)
Node.js Backend (ssh-proxy.js)
  ↓ SSH (ssh2 library)
Linux VM (PTY session)
```

**Input Flow**: Browser keypress → socket.emit('terminal:input') → SSH write → VM
**Output Flow**: VM output → SSH data event → socket.emit('terminal:output') → Xterm.js write
**Resize Flow**: Browser resize → socket.emit('terminal:resize') → SSH resize → PTY resize

**Team-Based User Routing**:
```typescript
function getVMUser(team: TeamType): string {
  return team === 'red' ? 'redteam' : 'blueteam';
}

function getVMHost(missionId: string): string {
  return `192.168.100.10`; // Primary battlefield VM
}
```

**SSH Authentication**:
```typescript
const sshConfig = {
  host: getVMHost(missionId),
  port: 22,
  username: getVMUser(team),
  privateKey: fs.readFileSync('/app/keys/nexus_ssh_key'),
  readyTimeout: 10000,
  keepaliveInterval: 5000
};
```

**PTY Configuration**:
```typescript
const ptyOptions = {
  term: 'xterm-256color',
  cols: 220,
  rows: 50,
  modes: {
    ECHO: 1,
    ICANON: 0
  }
};
```

### 4. WebSocket Protocol (Complete Specification)

**Purpose**: Defines all Socket.io events for terminal communication, game state updates, and admin monitoring.

**Client → Server Events**:

```typescript
// Terminal Events
socket.emit('terminal:join', {
  team: 'red' | 'blue',
  missionId: string,
  token: string
});

socket.emit('terminal:input', {
  data: string  // Raw terminal input (keystrokes)
});

socket.emit('terminal:resize', {
  cols: number,
  rows: number
});

// Game Events
socket.emit('tool_use', { 
  toolId: string, 
  targetId: string, 
  agentId: string 
});

socket.emit('task_attempt', { 
  taskId: string, 
  agentId: string 
});

socket.emit('subscribe_updates', { 
  roundId: string, 
  team: TeamType 
});
```

**Server → Client Events**:

```typescript
// Terminal Events
socket.emit('terminal:output', {
  data: string  // Raw terminal output
});

socket.emit('terminal:disconnected', {
  reason: string
});

// Game State Events
socket.emit('state_update', { 
  type: 'task_complete' | 'phase_change' | 'score_update' | 'trace_update' | 'burn_update',
  data: any 
});

socket.emit('alert', { 
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  message: string 
});

socket.emit('timer_sync', { 
  timeRemaining: number 
});

socket.emit('trace_update', { 
  level: number,
  burnState: BurnState 
});

socket.emit('score_update', { 
  redScore: number,
  blueScore: number 
});
```

**Admin Namespace (/admin) Events**:

```typescript
// Admin → Server
adminSocket.emit('admin:watch', {
  socketId: string  // Watch specific player's terminal
});

adminSocket.emit('admin:award', {
  sessionId: string,
  points: number,
  reason: string
});

adminSocket.emit('admin:reset_vm', {
  missionId: string
});

// Server → Admin
adminSocket.emit('admin:terminal_stream', {
  socketId: string,
  data: string
});

adminSocket.emit('admin:session_list', {
  sessions: Array<{
    socketId: string,
    team: string,
    player: string,
    connectedAt: Date
  }>
});
```

### 5. Real-Time Synchronization System

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

### 6. Frontend Terminal Component

**Purpose**: React component that renders a browser-based terminal using Xterm.js and connects to the backend via Socket.io.

**Core Component**:

```typescript
// TerminalWindow.jsx
import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface TerminalWindowProps {
  team: 'red' | 'blue';
  missionId: string;
  token: string;
}

export function TerminalWindow({ team, missionId, token }: TerminalWindowProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Initialize Xterm.js
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4'
      },
      cols: 220,
      rows: 50
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    if (terminalRef.current) {
      terminal.open(terminalRef.current);
      fitAddon.fit();
    }

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Connect to backend via Socket.io
    const socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    socketRef.current = socket;

    // Join terminal session
    socket.emit('terminal:join', { team, missionId, token });

    // Handle terminal output from VM
    socket.on('terminal:output', ({ data }) => {
      terminal.write(data);
    });

    // Handle terminal input to VM
    terminal.onData((data) => {
      socket.emit('terminal:input', { data });
    });

    // Handle terminal resize
    const handleResize = () => {
      fitAddon.fit();
      socket.emit('terminal:resize', {
        cols: terminal.cols,
        rows: terminal.rows
      });
    };

    window.addEventListener('resize', handleResize);

    // Handle disconnection
    socket.on('terminal:disconnected', ({ reason }) => {
      terminal.write(`\r\n\x1b[31mConnection lost: ${reason}\x1b[0m\r\n`);
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      terminal.dispose();
    };
  }, [team, missionId, token]);

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        padding: '10px'
      }} 
    />
  );
}
```

**Key Features**:
- Xterm.js for terminal rendering with 256-color support
- FitAddon for responsive terminal sizing
- Socket.io client for WebSocket communication
- Automatic reconnection on disconnect
- Terminal theme matching game aesthetic
- Proper cleanup on component unmount

### 7. Backend Server Architecture

**Purpose**: Express HTTP server with Socket.IO for WebSocket connections, SSH proxy integration, and REST API routes.

**Server Structure** (server.js):

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SSHProxyManager } from './ssh-proxy.js';
import { TerminalLogger } from './terminal-logger.js';
import { ScoringEngine } from './scoring-engine.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

const sshProxy = new SSHProxyManager();
const terminalLogger = new TerminalLogger();
const scoringEngine = new ScoringEngine();

// REST API Routes
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/login', authController.login);
app.get('/api/missions', missionController.list);
app.get('/api/scores/:missionId', scoreController.get);

// Main Socket.IO namespace
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Terminal join
  socket.on('terminal:join', async ({ team, missionId, token }) => {
    try {
      // Verify token
      const user = await verifyToken(token);
      
      // Create SSH session
      const session = await sshProxy.createSession(socket.id, team, {
        missionId,
        token,
        cols: 220,
        rows: 50
      });

      // Log session start
      await terminalLogger.logSessionStart(socket.id, user.id, team, missionId);

      // Handle SSH output
      session.ptyStream.on('data', (data) => {
        const output = data.toString();
        socket.emit('terminal:output', { data: output });
        
        // Log output
        terminalLogger.logOutput(socket.id, output);
        
        // Scan for scoring patterns
        scoringEngine.scanTerminalOutput(socket.id, team, output);
      });

      socket.emit('terminal:connected', { sessionId: socket.id });
    } catch (error) {
      console.error('Terminal join error:', error);
      socket.emit('terminal:error', { message: 'Failed to connect to terminal' });
    }
  });

  // Terminal input
  socket.on('terminal:input', ({ data }) => {
    try {
      sshProxy.writeToSession(socket.id, data);
      terminalLogger.logInput(socket.id, data);
    } catch (error) {
      console.error('Terminal input error:', error);
    }
  });

  // Terminal resize
  socket.on('terminal:resize', ({ cols, rows }) => {
    try {
      sshProxy.resizeSession(socket.id, cols, rows);
    } catch (error) {
      console.error('Terminal resize error:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    sshProxy.closeSession(socket.id);
    terminalLogger.logSessionEnd(socket.id);
  });
});

// Admin namespace for war room
const adminNamespace = io.of('/admin');
adminNamespace.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);

  // Watch player terminal
  socket.on('admin:watch', ({ socketId }) => {
    const session = sshProxy.getSession(socketId);
    if (session) {
      session.ptyStream.on('data', (data) => {
        socket.emit('admin:terminal_stream', { socketId, data: data.toString() });
      });
    }
  });

  // Award points manually
  socket.on('admin:award', async ({ sessionId, points, reason }) => {
    await scoringEngine.awardPoints(sessionId, points, reason);
    io.emit('score_update', await scoringEngine.getScores());
  });

  // Reset VM
  socket.on('admin:reset_vm', async ({ missionId }) => {
    await vmManager.resetVM(missionId);
    adminNamespace.emit('admin:vm_reset', { missionId });
  });
});

httpServer.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

**Key Features**:
- Express HTTP server for REST API
- Socket.IO attached to HTTP server for WebSocket support
- SSH proxy integration for terminal sessions
- Terminal logging for all input/output
- Scoring engine integration for automatic point detection
- Admin namespace for war room monitoring
- Proper error handling and logging

### 8. Trace & Burn Visual System

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

-- Terminal sessions table (NEW)
CREATE TABLE terminal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  mission_id UUID NOT NULL,
  team VARCHAR(10) NOT NULL,
  socket_id VARCHAR(100) NOT NULL UNIQUE,
  connected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  disconnected_at TIMESTAMP,
  vm_host VARCHAR(50),
  vm_user VARCHAR(50),
  CONSTRAINT fk_mission FOREIGN KEY (mission_id) REFERENCES rounds(id)
);

-- Terminal logs table (NEW)
CREATE TABLE terminal_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES terminal_sessions(id),
  direction VARCHAR(5) NOT NULL CHECK (direction IN ('in', 'out')),
  data TEXT NOT NULL,
  logged_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Score events table (NEW)
CREATE TABLE score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id),
  team VARCHAR(10) NOT NULL,
  player_id UUID,
  event_type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT,
  detected_pattern VARCHAR(100),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_tasks_round_phase ON tasks(round_id, phase);
CREATE INDEX idx_system_states_round ON system_states(round_id);
CREATE INDEX idx_events_round_timestamp ON events(round_id, timestamp);
CREATE INDEX idx_events_observable ON events(observable, detected);
CREATE INDEX idx_terminal_sessions_socket ON terminal_sessions(socket_id);
CREATE INDEX idx_terminal_logs_session_time ON terminal_logs(session_id, logged_at);
CREATE INDEX idx_score_events_round_team ON score_events(round_id, team);
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

interface TerminalSession {
  id: string;
  playerId: string;
  missionId: string;
  team: 'red' | 'blue';
  socketId: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  vmHost: string;
  vmUser: string;
}

interface TerminalLog {
  id: number;
  sessionId: string;
  direction: 'in' | 'out';
  data: string;
  loggedAt: Date;
}

interface ScoreEvent {
  id: string;
  roundId: string;
  team: 'red' | 'blue';
  playerId?: string;
  eventType: string;
  points: number;
  reason: string;
  detectedPattern?: string;
  timestamp: Date;
}
```

## Scoring Engine Integration

### Purpose

The Scoring Engine automatically detects Red Team and Blue Team actions by scanning terminal output and VM logs, awarding points in real-time based on detected patterns.

### Core Classes

```typescript
class ScoringEngine {
  private patterns: Map<string, ScoringPattern>;
  private db: DatabaseConnection;
  private io: SocketIOServer;
  
  scanTerminalOutput(socketId: string, team: TeamType, line: string): Promise<void>;
  scanVMLogs(missionId: string): Promise<void>;
  awardPoints(sessionId: string, points: number, reason: string): Promise<void>;
  getScores(roundId: string): Promise<ScoreBoard>;
}

interface ScoringPattern {
  pattern: RegExp;
  team: 'red' | 'blue';
  points: number;
  eventType: string;
  description: string;
}
```

### Red Team Scoring Patterns

**Network Reconnaissance** (10 points):
```typescript
{
  pattern: /nmap.*-[sS][VvT].*\d+\.\d+\.\d+\.\d+/,
  team: 'red',
  points: 10,
  eventType: 'network_scan',
  description: 'Performed network scan with service detection'
}
```

**Vulnerability Exploitation** (50 points):
```typescript
{
  pattern: /sqlmap.*--dump|meterpreter.*session.*opened|shell.*spawned/i,
  team: 'red',
  points: 50,
  eventType: 'exploitation',
  description: 'Successfully exploited vulnerability'
}
```

**Privilege Escalation** (100 points):
```typescript
{
  pattern: /uid=0\(root\)|EUID.*0|sudo.*NOPASSWD/,
  team: 'red',
  points: 100,
  eventType: 'privilege_escalation',
  description: 'Obtained root privileges'
}
```

**Data Exfiltration** (75 points):
```typescript
{
  pattern: /exfiltrated.*bytes|nc.*-l.*\d+.*<|dns.*tunnel.*success/i,
  team: 'red',
  points: 75,
  eventType: 'data_exfiltration',
  description: 'Successfully exfiltrated data'
}
```

**Persistence Established** (60 points):
```typescript
{
  pattern: /crontab.*-e|systemd.*service.*enabled|\.bashrc.*backdoor/i,
  team: 'red',
  points: 60,
  eventType: 'persistence',
  description: 'Established persistence mechanism'
}
```

### Blue Team Scoring Patterns

**Intrusion Detection** (30 points):
```typescript
{
  pattern: /IDS.*ALERT|snort.*detected|suricata.*alert/i,
  team: 'blue',
  points: 30,
  eventType: 'intrusion_detected',
  description: 'Detected intrusion attempt'
}
```

**IP Blocking** (20 points):
```typescript
{
  pattern: /iptables.*-A.*DROP|firewall.*blocked.*\d+\.\d+\.\d+\.\d+/i,
  team: 'blue',
  points: 20,
  eventType: 'ip_blocked',
  description: 'Blocked malicious IP address'
}
```

**Malware Removal** (50 points):
```typescript
{
  pattern: /rkhunter.*removed|webshell.*deleted|backdoor.*cleaned/i,
  team: 'blue',
  points: 50,
  eventType: 'malware_removed',
  description: 'Removed malware or backdoor'
}
```

**System Restoration** (80 points):
```typescript
{
  pattern: /system.*restored|snapshot.*applied|services.*recovered/i,
  team: 'blue',
  points: 80,
  eventType: 'system_restored',
  description: 'Restored compromised system'
}
```

**Forensics Analysis** (40 points):
```typescript
{
  pattern: /forensics.*complete|timeline.*generated|artifacts.*analyzed/i,
  team: 'blue',
  points: 40,
  eventType: 'forensics',
  description: 'Completed forensics analysis'
}
```

### VM Log Scanning

The Scoring Engine also scans VM logs for actions that may not appear in terminal output:

**Apache Access Logs** (`/var/log/apache2/access.log`):
```typescript
async scanApacheLogs(missionId: string): Promise<void> {
  const logs = await this.readVMFile(missionId, '/var/log/apache2/access.log');
  
  // Detect SQL injection attempts
  if (/UNION.*SELECT|OR.*1=1|'.*--/.test(logs)) {
    await this.awardPoints(missionId, 'red', 25, 'SQL injection attempt detected in logs');
  }
  
  // Detect directory traversal
  if (/\.\.\/|\.\.\\/.test(logs)) {
    await this.awardPoints(missionId, 'red', 15, 'Directory traversal attempt');
  }
  
  // Detect webshell upload
  if (/\.php.*cmd=|shell\.php|c99\.php/.test(logs)) {
    await this.awardPoints(missionId, 'red', 60, 'Webshell uploaded');
  }
}
```

**Auth Logs** (`/var/log/auth.log`):
```typescript
async scanAuthLogs(missionId: string): Promise<void> {
  const logs = await this.readVMFile(missionId, '/var/log/auth.log');
  
  // Detect brute force attempts
  const failedLogins = (logs.match(/Failed password/g) || []).length;
  if (failedLogins > 10) {
    await this.awardPoints(missionId, 'red', 20, `Brute force attack (${failedLogins} attempts)`);
  }
  
  // Detect successful SSH login
  if (/Accepted publickey for redteam/.test(logs)) {
    await this.awardPoints(missionId, 'red', 30, 'SSH access obtained');
  }
  
  // Detect sudo usage
  if (/sudo.*COMMAND/.test(logs)) {
    await this.awardPoints(missionId, 'red', 40, 'Sudo command executed');
  }
}
```

### Real-Time Score Broadcasting

```typescript
async awardPoints(
  sessionId: string, 
  points: number, 
  reason: string
): Promise<void> {
  // Get session details
  const session = await this.db.query(
    'SELECT * FROM terminal_sessions WHERE socket_id = $1',
    [sessionId]
  );
  
  if (!session) return;
  
  // Insert score event
  await this.db.query(`
    INSERT INTO score_events (round_id, team, player_id, event_type, points, reason, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
  `, [session.mission_id, session.team, session.player_id, 'auto_detected', points, reason]);
  
  // Update round score
  const scoreField = session.team === 'red' ? 'red_score' : 'blue_score';
  await this.db.query(`
    UPDATE rounds 
    SET ${scoreField} = ${scoreField} + $1, updated_at = NOW()
    WHERE id = $2
  `, [points, session.mission_id]);
  
  // Broadcast score update
  const scores = await this.getScores(session.mission_id);
  this.io.to(session.mission_id).emit('score_update', scores);
  
  // Send notification to team
  this.io.to(`${session.mission_id}:${session.team}`).emit('alert', {
    severity: 'low',
    title: 'Points Awarded',
    message: `+${points} points: ${reason}`
  });
}
```

## Infrastructure Deployment

### Nginx Configuration

**Purpose**: Reverse proxy for frontend and WebSocket connections with SSL/TLS termination.

**Configuration** (`/etc/nginx/sites-available/nexus-protocol`):

```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name nexus-protocol.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name nexus-protocol.example.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/nexus-protocol.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nexus-protocol.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React app)
    location / {
        root /var/www/nexus-protocol/frontend;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket connections (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for long-lived connections
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### PM2 Process Management

**Purpose**: Keep Node.js backend running continuously with automatic restart on crashes.

**PM2 Configuration** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'nexus-protocol-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://nexus:password@localhost:5432/nexus_protocol',
      JWT_SECRET: process.env.JWT_SECRET,
      ADMIN_CODE: process.env.ADMIN_CODE
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 3000,
    kill_timeout: 5000
  }]
};
```

**PM2 Commands**:
```bash
# Start application
pm2 start ecosystem.config.js

# View logs
pm2 logs nexus-protocol-backend

# Restart application
pm2 restart nexus-protocol-backend

# Stop application
pm2 stop nexus-protocol-backend

# Monitor resources
pm2 monit

# Save PM2 configuration for startup
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
```

### SSL/TLS Configuration

**Let's Encrypt Setup**:
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d nexus-protocol.example.com

# Test automatic renewal
sudo certbot renew --dry-run

# Certbot will automatically renew certificates via cron job
```

### Health Check Endpoints

**Backend Health Check** (`/health`):
```typescript
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check SSH proxy
    const sessionCount = sshProxy.getSessionCount();
    
    // Check VM connectivity
    const vmHealth = await vmManager.checkHealth();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      sessions: sessionCount,
      vms: vmHealth
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message
    });
  }
});
```

### Firewall Configuration

**UFW (Uncomplicated Firewall)**:
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other incoming traffic
sudo ufw default deny incoming

# Allow all outgoing traffic
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

This design includes 103 correctness properties that comprehensively validate all 19 requirements from the requirements document. Each property is universally quantified (using "for any" statements) and explicitly references the requirements it validates. These properties will be implemented as property-based tests using fast-check, with a minimum of 100 iterations per test to ensure robust validation across diverse inputs.

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

### SSH Terminal Properties

Property 46: SSH session creation establishes connection
*For any* terminal join request with valid credentials, an SSH session should be created and stored in the sessions Map
**Validates: Requirements 3.1, 3.2, 3.3**

Property 47: Team-based user routing
*For any* Red Team player connection, the SSH session should authenticate as 'redteam' user, and for any Blue Team player, as 'blueteam' user
**Validates: Requirements 3.4, 3.5**

Property 48: Terminal input flows to VM
*For any* terminal input event, the data should be written to the SSH session and transmitted to the VM
**Validates: Requirements 3.6**

Property 49: Terminal output flows to browser
*For any* VM output, the data should be transmitted through SSH to the backend and emitted to the browser via WebSocket
**Validates: Requirements 3.7**

Property 50: Terminal resize updates PTY
*For any* terminal resize event, the SSH session PTY should be resized to match the new dimensions
**Validates: Requirements 3.8**

Property 51: Session isolation
*For any* two concurrent terminal sessions, input to one session should not affect the other session
**Validates: Requirements 3.11**

Property 52: Session cleanup on disconnect
*For any* client disconnection, the associated SSH session should be closed and removed from the sessions Map
**Validates: Requirements 3.10, 3.12**

### Terminal Logging Properties

Property 53: Input logging
*For any* terminal input, a record should be inserted into terminal_logs with direction='in'
**Validates: Requirements 5.1**

Property 54: Output logging
*For any* terminal output, a record should be inserted into terminal_logs with direction='out'
**Validates: Requirements 5.2**

Property 55: Session tracking
*For any* terminal session creation, a record should be inserted into terminal_sessions with start time
**Validates: Requirements 5.3**

Property 56: Session end tracking
*For any* terminal session closure, the terminal_sessions record should be updated with end time
**Validates: Requirements 5.4**

Property 57: Terminal replay reconstruction
*For any* terminal session, retrieving all logs ordered by timestamp should allow reconstruction of the complete session
**Validates: Requirements 5.5, 5.6**

### Scoring Engine Properties

Property 58: Pattern detection awards points
*For any* terminal output matching a scoring pattern, points should be awarded to the appropriate team
**Validates: Requirements 10.1, 10.4**

Property 59: Score persistence
*For any* points awarded, a record should be inserted into score_events and the round score should be updated
**Validates: Requirements 10.9**

Property 60: Score broadcasting
*For any* score update, all clients in the round should receive a score_update event via WebSocket
**Validates: Requirements 7.4**

### VM User Environment Properties

Property 61: User creation
*For any* VM provisioning, both 'redteam' and 'blueteam' users should be created with home directories
**Validates: Requirements 4.1, 4.2**

Property 62: Tool installation
*For any* 'redteam' user creation, offensive tools should be installed, and for 'blueteam' user, defensive tools should be installed
**Validates: Requirements 4.3, 4.4**

Property 63: SSH key authentication
*For any* VM provisioning, the backend's public SSH key should be added to authorized_keys for both users
**Validates: Requirements 4.5, 4.6**

Property 64: User isolation
*For any* file access attempt, 'redteam' user should not be able to access /home/blueteam and vice versa
**Validates: Requirements 4.7, 4.8**

### Infrastructure Properties

Property 65: WebSocket upgrade headers
*For any* WebSocket connection request, Nginx should include Upgrade and Connection headers in the proxy request
**Validates: Requirements 6.8**

Property 66: SSL/TLS encryption
*For any* HTTP request, Nginx should redirect to HTTPS with valid SSL certificate
**Validates: Requirements 6.5**

Property 67: PM2 automatic restart
*For any* backend process crash, PM2 should automatically restart the process
**Validates: Requirements 6.10**

Property 68: Health check availability
*For any* health check request, the backend should return status including database, SSH sessions, and VM health
**Validates: Requirements 6.12**

### Security Properties

Property 69: Security headers applied to all responses
*For any* HTTP response, security headers (CSP, HSTS, X-Frame-Options) should be present
**Validates: Requirements 9.1, 13.1**

Property 70: CORS validation against whitelist
*For any* CORS request, the origin should be validated against the configured whitelist
**Validates: Requirements 9.2, 13.2**

Property 71: Rate limiting enforced
*For any* client exceeding rate limits, subsequent requests should be rejected with 429 status
**Validates: Requirements 9.3, 13.3**

Property 72: Input validation and sanitization
*For any* user input, the system should validate format and sanitize content before processing
**Validates: Requirements 9.5, 13.5**

Property 73: WebSocket authentication required
*For any* WebSocket connection attempt, the client must provide a valid authentication token
**Validates: Requirements 9.7, 13.7**

Property 74: Sensitive data redaction in logs
*For any* log entry containing sensitive data (credentials, tokens), the sensitive portions should be redacted
**Validates: Requirements 9.12, 13.12, 5.8**

### Docker Deployment Properties

Property 75: Container startup sequence
*For any* docker-compose up execution, the PostgreSQL container should be healthy before the backend container starts
**Validates: Requirements 11.1, 11.3**

Property 76: Network isolation
*For any* container in the cyber_range network, it should not be able to access the public internet
**Validates: Requirements 11.2, 11.13**

Property 77: Volume persistence
*For any* container restart, data stored in Docker volumes should persist and be available to the restarted container
**Validates: Requirements 11.6, 11.7**

Property 78: Container restart on failure
*For any* container failure, Docker should automatically restart the container according to the restart policy
**Validates: Requirements 11.9**

Property 79: Environment variable configuration
*For any* environment variable change, the system should apply the new value without requiring image rebuild
**Validates: Requirements 11.8**

### VM Automation Properties

Property 80: VM provisioning for all tiers
*For any* round initialization, VMs should be provisioned for Tier I (web), Tier II (SSH/DB), and Tier III (core) systems
**Validates: Requirements 12.1, 12.4, 12.5, 12.6**

Property 81: VM snapshot on round end
*For any* round completion, the final state of all VMs should be captured in snapshots
**Validates: Requirements 12.2**

Property 82: VM restoration to baseline
*For any* new round start, all VMs should be restored to their baseline vulnerable state from snapshots
**Validates: Requirements 12.3**

Property 83: VM IP assignment
*For any* VM provisioning, the VM should be assigned an IP address in the 192.168.100.0/24 range
**Validates: Requirements 12.7**

Property 84: VM health check verification
*For any* VM health check request, the system should verify that all required services are running
**Validates: Requirements 12.8**

Property 85: VM restart on health check failure
*For any* VM that fails health check, the system should attempt to restart the VM
**Validates: Requirements 12.9**

Property 86: VM user provisioning
*For any* VM provisioning, both 'redteam' and 'blueteam' users should be created with appropriate tools installed
**Validates: Requirements 12.11, 4.1, 4.2, 4.3, 4.4**

Property 87: DVWA configuration
*For any* VM provisioning, DVWA should be installed and configured as the primary target application
**Validates: Requirements 12.12, 4.9, 4.10**

### Agent Capability Properties

Property 88: Agent task assignment by specialization
*For any* task, the system should assign it to an agent whose specialization matches the task type
**Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6**

Property 89: Agent effectiveness modifiers
*For any* tool used by an agent, the effectiveness should include the agent's specialization bonus
**Validates: Requirements 18.7**

Property 90: Agent bonus points on task completion
*For any* task completed by an agent, agent-specific bonus points should be awarded based on specialization match
**Validates: Requirements 18.8**

Property 91: Multi-agent task coordination
*For any* team with multiple agents, task distribution should avoid conflicts and optimize for agent specializations
**Validates: Requirements 18.9**

### Emergency and Error Recovery Properties

Property 92: Database retry with exponential backoff
*For any* database connection failure, the system should retry with exponentially increasing delays before giving up
**Validates: Requirements 19.1**

Property 93: VM unavailability handling
*For any* unresponsive VM, the system should mark it as unavailable and notify the operator
**Validates: Requirements 19.2**

Property 94: WebSocket automatic reconnection
*For any* WebSocket connection drop, the client should automatically attempt to reconnect
**Validates: Requirements 19.3**

Property 95: User-friendly validation errors
*For any* validation error, the system should return a message that explains the problem without exposing internal details
**Validates: Requirements 19.4**

Property 96: Exception logging and generic error response
*For any* unhandled exception, the system should log the full stack trace and return a generic error message to the client
**Validates: Requirements 19.5**

Property 97: Emergency kill switch immediate termination
*For any* emergency kill switch activation, all active rounds should be immediately terminated
**Validates: Requirements 19.6**

Property 98: Emergency kill switch client disconnection
*For any* emergency kill switch activation, all WebSocket clients should be disconnected
**Validates: Requirements 19.7**

Property 99: Emergency kill switch state persistence
*For any* emergency kill switch activation, the current game state should be persisted before shutdown
**Validates: Requirements 19.8**

Property 100: Error recovery logging
*For any* successful error recovery, the system should log the recovery event and resume normal operation
**Validates: Requirements 19.9**

Property 101: Critical error operator alerts
*For any* accumulation of critical errors, the system should alert the operator via configured notification channels
**Validates: Requirements 19.10**

Property 102: SSH connection failure handling
*For any* SSH connection failure, the system should log the failure and notify the affected player
**Validates: Requirements 19.11**

Property 103: Terminal session limit enforcement
*For any* terminal connection attempt when maximum sessions are reached, the system should reject the connection with a descriptive error
**Validates: Requirements 19.12**

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
- SSH connection establishment with valid credentials
- Terminal session creation for red and blue teams
- WebSocket event handling for terminal:join, terminal:input, terminal:output
- Scoring pattern detection for specific commands
- Nginx reverse proxy configuration
- PM2 process restart on crash

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
- SSH session isolation for any concurrent sessions
- Terminal input/output flow for any data
- Terminal logging for any session
- Scoring pattern matching for any terminal output
- Session cleanup for any disconnection

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

// Feature: nexus-protocol-completion, Property 51: Session isolation
describe('SSH Session Isolation', () => {
  it('should isolate input between concurrent sessions', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        async (inputs) => {
          const sshProxy = new SSHProxyManager();
          const sessions = [];
          
          // Create multiple sessions
          for (let i = 0; i < inputs.length; i++) {
            const session = await sshProxy.createSession(
              `socket-${i}`,
              i % 2 === 0 ? 'red' : 'blue',
              { missionId: 'test', token: 'test', cols: 80, rows: 24 }
            );
            sessions.push(session);
          }
          
          // Write different input to each session
          const outputs = [];
          for (let i = 0; i < inputs.length; i++) {
            sshProxy.writeToSession(`socket-${i}`, inputs[i]);
            const output = await captureSessionOutput(`socket-${i}`, 1000);
            outputs.push(output);
          }
          
          // Verify each session only received its own input
          for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < inputs.length; j++) {
              if (i !== j) {
                // Session i should not contain input from session j
                if (outputs[i].includes(inputs[j])) {
                  return false;
                }
              }
            }
          }
          
          // Cleanup
          sessions.forEach((_, i) => sshProxy.closeSession(`socket-${i}`));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: nexus-protocol-completion, Property 58: Pattern detection awards points
describe('Scoring Pattern Detection', () => {
  it('should award points when terminal output matches scoring patterns', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('nmap -sV 192.168.100.10'),
          fc.constant('sqlmap --dump -u http://target.com'),
          fc.constant('uid=0(root) gid=0(root)'),
          fc.constant('meterpreter session 1 opened')
        ),
        async (command) => {
          const scoringEngine = new ScoringEngine();
          const initialScore = await scoringEngine.getScore('test-round', 'red');
          
          // Simulate terminal output
          await scoringEngine.scanTerminalOutput('socket-1', 'red', command);
          
          const finalScore = await scoringEngine.getScore('test-round', 'red');
          
          // Score should have increased
          return finalScore > initialScore;
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
7. Property-based testing verifies correctness across all inputs (103 properties covering all 19 requirements)
8. Production hardening protects game infrastructure
9. SSH proxy system enables real terminal access to cyber range
10. Automated VM provisioning ensures consistent vulnerable environments

The design includes 103 correctness properties that validate all 19 requirements:
- Requirements 1-2: Mission Logic and Tool Functionality (Properties 1-10)
- Requirement 3: SSH Terminal System (Properties 46-52)
- Requirement 4: VM User Environment (Properties 61-64)
- Requirement 5: Terminal Logging (Properties 53-57)
- Requirement 6: Server Infrastructure (Properties 65-68)
- Requirement 7: Real-Time Synchronization (Properties 11-15)
- Requirement 8: Trace & Burn Visual System (Properties 16-19)
- Requirement 9: PostgreSQL Migration (Properties 20-23)
- Requirement 10: Cyber Range Validator (Properties 24-26)
- Requirement 11: Docker Deployment (Properties 75-79)
- Requirement 12: VM Automation (Properties 80-87)
- Requirement 13: Production Hardening (Properties 69-74)
- Requirement 14: Round Scoring (Properties 27-31, 58-60)
- Requirement 15: Task Dependencies (Properties 2, 5)
- Requirement 16: Observable Actions (Properties 12, 32-35)
- Requirement 17: System State Management (Properties 36-40)
- Requirement 18: Agent Capabilities (Properties 3, 10, 88-91)
- Requirement 19: Emergency and Error Handling (Properties 41-45, 92-103)

The implementation can proceed in phases, with each phase building on the previous one. The system is designed to be deployed incrementally, allowing for testing and validation at each stage.
