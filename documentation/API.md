# NEXUS PROTOCOL API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket Protocol](#websocket-protocol)
5. [Error Responses](#error-responses)
6. [Rate Limiting](#rate-limiting)

---

## Overview

The NEXUS PROTOCOL API provides REST endpoints for game management and WebSocket connections for real-time updates.

### Base URLs

- **REST API:** `http://localhost:3001/api`
- **WebSocket:** `ws://localhost:3001`
- **Health Check:** `http://localhost:3001/health`

### API Versioning

Current version: `v1` (implicit in all endpoints)

### Content Type

All requests and responses use `application/json` unless otherwise specified.

---

## Authentication

### JWT Token Authentication

Most endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

### Obtaining a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": "user-123",
    "username": "player1",
    "team": "red"
  }
}
```

### Token Expiration

Tokens expire after 24 hours by default. Refresh before expiration:

```http
POST /api/auth/refresh
Authorization: Bearer <jwt-token>
```

---

## REST API Endpoints

### Health Checks

#### GET /health

Basic health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-19T10:00:00Z"
}
```

#### GET /health/detailed

Detailed health check including dependencies.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-19T10:00:00Z",
  "services": {
    "database": "healthy",
    "vmManager": "healthy",
    "websocket": "healthy"
  },
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### GET /ready

Readiness check for load balancers.

#### GET /live

Liveness check for container orchestration.

---

### Rounds

#### POST /api/rounds

Create a new round.

**Request:**
```json
{
  "duration": 3600,
  "redTeam": "team-red-1",
  "blueTeam": "team-blue-1",
  "config": {
    "phaseDurations": [1200, 1200, 1200],
    "enableVMs": true
  }
}
```

**Response:**
```json
{
  "roundId": "round-abc123",
  "status": "active",
  "startTime": "2026-02-19T10:00:00Z",
  "endTime": "2026-02-19T11:00:00Z",
  "phase": "initial_access",
  "redTeam": "team-red-1",
  "blueTeam": "team-blue-1"
}
```

#### GET /api/rounds

List all rounds.

**Query Parameters:**
- `status` - Filter by status (active, completed, terminated)
- `team` - Filter by team ID
- `limit` - Max results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "rounds": [
    {
      "roundId": "round-abc123",
      "status": "active",
      "startTime": "2026-02-19T10:00:00Z",
      "redTeam": "team-red-1",
      "blueTeam": "team-blue-1"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### GET /api/rounds/:roundId

Get round details.

**Response:**
```json
{
  "roundId": "round-abc123",
  "status": "active",
  "startTime": "2026-02-19T10:00:00Z",
  "endTime": "2026-02-19T11:00:00Z",
  "phase": "escalation",
  "phaseStartTime": "2026-02-19T10:20:00Z",
  "redTeam": "team-red-1",
  "blueTeam": "team-blue-1",
  "scores": {
    "red": 1250,
    "blue": 800
  },
  "trace": {
    "level": 45,
    "status": "shadow"
  },
  "burn": {
    "state": "moderate",
    "percentage": 45
  }
}
```

#### POST /api/rounds/:roundId/end

End a round manually.

**Response:**
```json
{
  "roundId": "round-abc123",
  "status": "completed",
  "endTime": "2026-02-19T10:45:00Z",
  "finalScores": {
    "red": 2100,
    "blue": 1500
  },
  "winner": "red"
}
```

#### GET /api/rounds/:roundId/export

Export round data for analysis.

**Response:**
```json
{
  "round": { /* round details */ },
  "events": [ /* all events */ ],
  "tasks": [ /* task completions */ ],
  "tools": [ /* tool usage */ ],
  "scores": { /* scoring breakdown */ }
}
```

---

### Tasks

#### GET /api/rounds/:roundId/tasks

Get all tasks for a round.

**Query Parameters:**
- `phase` - Filter by phase
- `status` - Filter by status (available, locked, completed)
- `team` - Filter by team

**Response:**
```json
{
  "tasks": [
    {
      "taskId": "task-001",
      "name": "Network Reconnaissance",
      "phase": "initial_access",
      "status": "completed",
      "team": "red",
      "points": 100,
      "completedAt": "2026-02-19T10:05:00Z",
      "completedBy": "agent-architect"
    },
    {
      "taskId": "task-002",
      "name": "SQL Injection",
      "phase": "initial_access",
      "status": "available",
      "team": "red",
      "points": 150,
      "prerequisites": ["task-001"]
    }
  ]
}
```

#### POST /api/rounds/:roundId/tasks/:taskId/attempt

Attempt to complete a task.

**Request:**
```json
{
  "agent": "agent-architect",
  "evidence": {
    "toolUsed": "nmap",
    "result": "Scan completed, 3 hosts found"
  }
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "task-001",
  "points": 100,
  "bonuses": {
    "speed": 50,
    "stealth": 30
  },
  "totalPoints": 180,
  "unlockedTasks": ["task-002", "task-003"]
}
```

---

### Tools

#### GET /api/tools

Get available tools.

**Query Parameters:**
- `team` - Filter by team (red, blue)
- `category` - Filter by category

**Response:**
```json
{
  "tools": [
    {
      "toolId": "nmap",
      "name": "Nmap",
      "team": "red",
      "category": "reconnaissance",
      "description": "Network scanning tool",
      "traceGeneration": 10,
      "observable": true
    }
  ]
}
```

#### POST /api/rounds/:roundId/tools/execute

Execute a tool.

**Request:**
```json
{
  "toolId": "nmap",
  "agent": "agent-architect",
  "target": "192.168.100.10",
  "parameters": {
    "ports": "1-1000",
    "scanType": "syn"
  }
}
```

**Response:**
```json
{
  "success": true,
  "toolId": "nmap",
  "result": {
    "hostsFound": 3,
    "openPorts": [22, 80, 443],
    "services": ["ssh", "http", "https"]
  },
  "trace": {
    "generated": 10,
    "total": 55,
    "status": "visible"
  },
  "detected": false,
  "effectiveness": 95
}
```

---

### Scores

#### GET /api/rounds/:roundId/scores

Get current scores.

**Response:**
```json
{
  "roundId": "round-abc123",
  "scores": {
    "red": {
      "total": 2100,
      "breakdown": {
        "tasks": 1500,
        "speedBonus": 300,
        "stealthBonus": 300
      }
    },
    "blue": {
      "total": 1500,
      "breakdown": {
        "detection": 600,
        "containment": 500,
        "recovery": 400
      }
    }
  },
  "leader": "red"
}
```

#### GET /api/leaderboard

Get global leaderboard.

**Query Parameters:**
- `limit` - Max results (default: 10)
- `timeframe` - Filter by timeframe (day, week, month, all)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "team": "team-red-1",
      "totalScore": 15000,
      "roundsPlayed": 10,
      "winRate": 0.8
    }
  ]
}
```

---

### Events

#### GET /api/rounds/:roundId/events

Get round events.

**Query Parameters:**
- `type` - Filter by event type
- `team` - Filter by team
- `limit` - Max results
- `since` - Events since timestamp

**Response:**
```json
{
  "events": [
    {
      "eventId": "event-001",
      "type": "tool_use",
      "timestamp": "2026-02-19T10:05:00Z",
      "team": "red",
      "agent": "agent-architect",
      "data": {
        "tool": "nmap",
        "target": "192.168.100.10"
      }
    },
    {
      "eventId": "event-002",
      "type": "detection",
      "timestamp": "2026-02-19T10:05:30Z",
      "team": "blue",
      "data": {
        "detectedAction": "network_scan",
        "confidence": 0.85
      }
    }
  ]
}
```

---

### System State

#### GET /api/rounds/:roundId/state

Get current system state.

**Response:**
```json
{
  "systems": [
    {
      "systemId": "tier1-web",
      "tier": "tier1",
      "ipAddress": "192.168.100.10",
      "status": "compromised",
      "services": [
        {
          "name": "http",
          "port": 80,
          "status": "running",
          "compromised": true
        }
      ],
      "modifications": [
        {
          "type": "file_created",
          "path": "/var/www/html/shell.php",
          "timestamp": "2026-02-19T10:10:00Z"
        }
      ]
    }
  ]
}
```

---

### Emergency

#### POST /api/emergency/kill-switch

Activate emergency kill switch.

**Request:**
```json
{
  "reason": "Security breach detected",
  "operator": "admin-name"
}
```

**Response:**
```json
{
  "activated": true,
  "timestamp": "2026-02-19T10:30:00Z",
  "roundsTerminated": 3,
  "clientsDisconnected": 12
}
```

---

## WebSocket Protocol

### Connection

Connect to WebSocket endpoint:

```javascript
const ws = new WebSocket('ws://localhost:3001');

// With authentication
const ws = new WebSocket('ws://localhost:3001?token=<jwt-token>');
```

### Message Format

All WebSocket messages use JSON format:

```json
{
  "type": "event_type",
  "data": { /* event data */ },
  "timestamp": "2026-02-19T10:00:00Z"
}
```

### Client → Server Messages

#### Subscribe to Round Updates

```json
{
  "type": "subscribe_updates",
  "roundId": "round-abc123"
}
```

#### Tool Use

```json
{
  "type": "tool_use",
  "roundId": "round-abc123",
  "toolId": "nmap",
  "agent": "agent-architect",
  "target": "192.168.100.10",
  "parameters": { /* tool parameters */ }
}
```

#### Task Attempt

```json
{
  "type": "task_attempt",
  "roundId": "round-abc123",
  "taskId": "task-001",
  "agent": "agent-architect",
  "evidence": { /* evidence data */ }
}
```

### Server → Client Messages

#### Task Completion

```json
{
  "type": "task_completion",
  "roundId": "round-abc123",
  "taskId": "task-001",
  "team": "red",
  "agent": "agent-architect",
  "points": 180,
  "timestamp": "2026-02-19T10:05:00Z"
}
```

#### Score Update

```json
{
  "type": "score_update",
  "roundId": "round-abc123",
  "team": "red",
  "score": 1250,
  "delta": 180,
  "timestamp": "2026-02-19T10:05:00Z"
}
```

#### Trace Update

```json
{
  "type": "trace_update",
  "roundId": "round-abc123",
  "trace": {
    "level": 55,
    "status": "visible",
    "delta": 10
  },
  "timestamp": "2026-02-19T10:05:00Z"
}
```

#### Burn Update

```json
{
  "type": "burn_update",
  "roundId": "round-abc123",
  "burn": {
    "state": "moderate",
    "percentage": 45
  },
  "timestamp": "2026-02-19T10:05:00Z"
}
```

#### Phase Transition

```json
{
  "type": "phase_transition",
  "roundId": "round-abc123",
  "oldPhase": "initial_access",
  "newPhase": "escalation",
  "timestamp": "2026-02-19T10:20:00Z"
}
```

#### Detection Alert

```json
{
  "type": "detection",
  "roundId": "round-abc123",
  "detection": {
    "action": "network_scan",
    "target": "192.168.100.10",
    "confidence": 0.85,
    "recommendations": [
      "Block source IP",
      "Enable IDS monitoring"
    ]
  },
  "timestamp": "2026-02-19T10:05:30Z"
}
```

#### Observable Action

```json
{
  "type": "observable_action",
  "roundId": "round-abc123",
  "action": {
    "type": "network_scan",
    "source": "192.168.100.50",
    "target": "192.168.100.10",
    "details": "Port scan detected on 1000 ports"
  },
  "timestamp": "2026-02-19T10:05:00Z"
}
```

#### Round End

```json
{
  "type": "round_end",
  "roundId": "round-abc123",
  "winner": "red",
  "finalScores": {
    "red": 2100,
    "blue": 1500
  },
  "timestamp": "2026-02-19T11:00:00Z"
}
```

---

## Error Responses

### Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional error details */ }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes

#### Authentication Errors

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Authentication token is invalid or expired"
  }
}
```

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Validation Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "duration",
      "issue": "Must be between 60 and 7200 seconds"
    }
  }
}
```

#### Resource Errors

```json
{
  "error": {
    "code": "ROUND_NOT_FOUND",
    "message": "Round with ID 'round-abc123' not found"
  }
}
```

```json
{
  "error": {
    "code": "TASK_LOCKED",
    "message": "Task prerequisites not met",
    "details": {
      "taskId": "task-002",
      "missingPrerequisites": ["task-001"]
    }
  }
}
```

#### Rate Limiting

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "window": "60s",
      "retryAfter": 45
    }
  }
}
```

---

## Rate Limiting

### Limits

- **API Endpoints:** 100 requests per minute per IP
- **WebSocket Messages:** 10 messages per second per connection
- **Tool Execution:** 5 executions per minute per agent

### Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645272000
```

### Handling Rate Limits

When rate limited, wait for the `Retry-After` header value (in seconds) before retrying:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
```

---

## Examples

### Complete Round Flow

```javascript
// 1. Authenticate
const authResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'player1', password: 'password123' })
});
const { token } = await authResponse.json();

// 2. Create round
const roundResponse = await fetch('http://localhost:3001/api/rounds', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    duration: 3600,
    redTeam: 'team-red-1',
    blueTeam: 'team-blue-1'
  })
});
const { roundId } = await roundResponse.json();

// 3. Connect WebSocket
const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

ws.onopen = () => {
  // Subscribe to updates
  ws.send(JSON.stringify({
    type: 'subscribe_updates',
    roundId
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message.type, message.data);
};

// 4. Execute tool
ws.send(JSON.stringify({
  type: 'tool_use',
  roundId,
  toolId: 'nmap',
  agent: 'agent-architect',
  target: '192.168.100.10',
  parameters: { ports: '1-1000' }
}));

// 5. Attempt task
ws.send(JSON.stringify({
  type: 'task_attempt',
  roundId,
  taskId: 'task-001',
  agent: 'agent-architect',
  evidence: { toolUsed: 'nmap', result: 'Scan completed' }
}));
```

---

**API Version:** 1.0  
**Last Updated:** February 19, 2026  
**Maintained By:** NEXUS PROTOCOL Team
