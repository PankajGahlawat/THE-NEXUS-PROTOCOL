/**
 * Simple Mock Backend for Nexus Protocol
 * Provides basic API endpoints for frontend development
 * NOW WITH SQLITE PERSISTENCE
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./models/SQLiteDatabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
db.connect().catch(err => console.error('Failed to init DB:', err));

// Debug Logger
const logFile = path.join(__dirname, 'debug.log');
const log = (msg) => {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, entry);
  console.log(msg);
};

// Middleware
app.use(cors({
  origin: true, // Allow any origin for local development
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Mock data (Static)
const mockAgents = [
  {
    id: 'agent-1',
    name: 'CIPHER',
    description: 'Elite hacker specializing in data extraction and system infiltration',
    color: '#36FFB0',
    stats: { hacking: 95, stealth: 80, combat: 60, analysis: 85 },
    abilities: {
      passive: { name: 'Ghost Protocol', description: 'Reduced trace generation' },
      ability1: { name: 'Data Siphon', description: 'Extract valuable data' },
      ability2: { name: 'System Override', description: 'Bypass security systems' },
      ultimate: { name: 'Zero Day', description: 'Massive system compromise' }
    }
  },
  {
    id: 'agent-2',
    name: 'PHANTOM',
    description: 'Master of stealth and infiltration operations',
    color: '#4AE2FF',
    stats: { hacking: 70, stealth: 95, combat: 75, analysis: 70 },
    abilities: {
      passive: { name: 'Shadow Walk', description: 'Enhanced stealth capabilities' },
      ability1: { name: 'Cloak', description: 'Temporary invisibility' },
      ability2: { name: 'Distraction', description: 'Misdirect security' },
      ultimate: { name: 'Phase Shift', description: 'Complete stealth mode' }
    }
  }
];

const mockMissions = [
  {
    id: 'false-flag',
    name: 'FALSE FLAG OPERATION',
    codeName: 'Brand the Breach',
    type: 'deception',
    duration: 1800,
    difficulty: 'MEDIUM',
    description: 'Plant decoy telemetry to mislead corporate watch services',
    tagline: 'Plant the lie. Steal the truth.',
    traceThreshold: 25,
    objectives: [
      { id: 1, description: 'Establish Secure Connection', reward: 150, required: true, progress: 15 },
      { id: 2, description: 'Create False Identity', reward: 200, required: true, progress: 20 },
      { id: 3, description: 'Map Security Systems', reward: 150, required: true, progress: 15 },
      { id: 4, description: 'Plant Decoy Data', reward: 300, required: true, progress: 25 },
      { id: 5, description: 'Exfiltrate Safely', reward: 200, required: true, progress: 25 }
    ],
    tools: ['network-scanner', 'identity-forge', 'trace-cleaner', 'data-injector'],
    phases: 3
  },
  {
    id: 'biometric-bluff',
    name: 'BIOMETRIC BLUFF',
    codeName: 'Ghost in the Machine',
    type: 'infiltration',
    duration: 1680,
    difficulty: 'HIGH',
    description: 'Bypass biometric security through advanced social engineering',
    tagline: 'Become someone else entirely.',
    traceThreshold: 20,
    objectives: [
      { id: 1, description: 'Bypass Biometric Gateway', reward: 250, required: true, progress: 25 },
      { id: 2, description: 'Escalate Privileges', reward: 200, required: true, progress: 20 },
      { id: 3, description: 'Access Vault Systems', reward: 300, required: true, progress: 30 },
      { id: 4, description: 'Disable Alarm Systems', reward: 150, required: false, progress: 15 },
      { id: 5, description: 'Extract Target Data', reward: 100, required: true, progress: 10 }
    ],
    tools: ['biometric-spoof', 'privilege-escalator', 'social-engineer', 'alarm-disruptor'],
    phases: 3
  },
  {
    id: 'core-extraction',
    name: 'CORE EXTRACTION',
    codeName: 'Heart of Darkness',
    type: 'extraction',
    duration: 1800,
    difficulty: 'MAXIMUM',
    description: 'Insert, sever, and retrieve the "soul key" from Project Chimera',
    tagline: 'No safe exit guaranteed.',
    traceThreshold: 15,
    objectives: [
      { id: 1, description: 'Locate Project Chimera', reward: 200, required: true, progress: 20 },
      { id: 2, description: 'Breach Core Security', reward: 300, required: true, progress: 30 },
      { id: 3, description: 'Extract Data Fragments', reward: 300, required: true, progress: 30 },
      { id: 4, description: 'Neutralize Countermeasures', reward: 100, required: false, progress: 10 },
      { id: 5, description: 'Exfiltrate Safely', reward: 100, required: true, progress: 10 }
    ],
    tools: ['quantum-drill', 'core-extractor', 'countermeasure-jammer', 'emergency-exit'],
    phases: 3
  },
  {
    id: 'shadow-network',
    name: 'SHADOW NETWORK',
    codeName: 'Web of Lies',
    type: 'reconnaissance',
    duration: 2100,
    difficulty: 'MEDIUM',
    description: 'Map and infiltrate a hidden communication network',
    tagline: 'Follow the digital breadcrumbs.',
    traceThreshold: 30,
    objectives: [
      { id: 1, description: 'Discover Network Nodes', reward: 150, required: true, progress: 20 },
      { id: 2, description: 'Intercept Communications', reward: 200, required: true, progress: 25 },
      { id: 3, description: 'Identify Key Players', reward: 150, required: true, progress: 20 },
      { id: 4, description: 'Plant Surveillance', reward: 200, required: true, progress: 25 },
      { id: 5, description: 'Maintain Cover', reward: 100, required: false, progress: 10 }
    ],
    tools: ['network-mapper', 'packet-sniffer', 'pattern-analyzer', 'stealth-implant'],
    phases: 4
  },
  {
    id: 'data-fortress',
    name: 'DATA FORTRESS',
    codeName: 'Siege Protocol',
    type: 'assault',
    duration: 2400,
    difficulty: 'HIGH',
    description: 'Assault a heavily fortified data center and steal classified archives',
    tagline: 'Sometimes subtlety is overrated.',
    traceThreshold: 40,
    objectives: [
      { id: 1, description: 'Breach Outer Defenses', reward: 200, required: true, progress: 25 },
      { id: 2, description: 'Disable Security Grid', reward: 150, required: true, progress: 20 },
      { id: 3, description: 'Access Archive Vault', reward: 250, required: true, progress: 30 },
      { id: 4, description: 'Download Archives', reward: 150, required: true, progress: 15 },
      { id: 5, description: 'Create Diversion', reward: 100, required: false, progress: 10 }
    ],
    tools: ['breach-hammer', 'grid-disruptor', 'vault-cracker', 'chaos-generator'],
    phases: 3
  },
  {
    id: 'phantom-protocol',
    name: 'PHANTOM PROTOCOL',
    codeName: 'Digital Ghost',
    type: 'stealth',
    duration: 1500,
    difficulty: 'MAXIMUM',
    description: 'Infiltrate without leaving any trace of your presence',
    tagline: 'You were never here.',
    traceThreshold: 5,
    objectives: [
      { id: 1, description: 'Ghost Entry', reward: 300, required: true, progress: 30 },
      { id: 2, description: 'Silent Navigation', reward: 200, required: true, progress: 25 },
      { id: 3, description: 'Invisible Extraction', reward: 250, required: true, progress: 25 },
      { id: 4, description: 'Perfect Exit', reward: 200, required: true, progress: 20 }
    ],
    tools: ['ghost-protocol', 'silence-field', 'invisible-hand', 'phantom-exit'],
    phases: 2
  }
];

// Comprehensive tools database
// (Content kept for brevity - assume gameTools same as original)
const gameTools = {
  // Network Tools
  'network-scanner': {
    id: 'network-scanner',
    name: 'Network Scanner',
    category: 'reconnaissance',
    description: 'Maps network topology and identifies active nodes',
    usage: 'Reveals network structure and potential entry points',
    traceRisk: 'Low',
    cooldown: 30,
    requirements: ['basic-access']
  },
  'packet-sniffer': {
    id: 'packet-sniffer',
    name: 'Packet Sniffer',
    category: 'reconnaissance',
    description: 'Intercepts and analyzes network traffic',
    usage: 'Captures data packets for analysis and intelligence gathering',
    traceRisk: 'Medium',
    cooldown: 45,
    requirements: ['network-access']
  },
  'network-mapper': {
    id: 'network-mapper',
    name: 'Network Mapper',
    category: 'reconnaissance',
    description: 'Creates detailed maps of network infrastructure',
    usage: 'Visualizes network connections and identifies critical nodes',
    traceRisk: 'Low',
    cooldown: 60,
    requirements: ['network-scanner']
  },

  // Infiltration Tools
  'identity-forge': {
    id: 'identity-forge',
    name: 'Identity Forge',
    category: 'infiltration',
    description: 'Creates convincing false digital identities',
    usage: 'Generates fake credentials and access tokens',
    traceRisk: 'Medium',
    cooldown: 90,
    requirements: ['social-data']
  },
  'biometric-spoof': {
    id: 'biometric-spoof',
    name: 'Biometric Spoofer',
    category: 'infiltration',
    description: 'Bypasses biometric security systems',
    usage: 'Mimics fingerprints, retinal patterns, and voice signatures',
    traceRisk: 'High',
    cooldown: 120,
    requirements: ['biometric-data', 'advanced-access']
  },
  'privilege-escalator': {
    id: 'privilege-escalator',
    name: 'Privilege Escalator',
    category: 'infiltration',
    description: 'Elevates user permissions within systems',
    usage: 'Gains administrative access from standard user accounts',
    traceRisk: 'High',
    cooldown: 180,
    requirements: ['system-access', 'exploit-database']
  },

  // Extraction Tools
  'data-injector': {
    id: 'data-injector',
    name: 'Data Injector',
    category: 'extraction',
    description: 'Plants false data to mislead investigators',
    usage: 'Injects decoy information into target systems',
    traceRisk: 'Medium',
    cooldown: 75,
    requirements: ['write-access']
  },
  'quantum-drill': {
    id: 'quantum-drill',
    name: 'Quantum Drill',
    category: 'extraction',
    description: 'Penetrates quantum-encrypted data stores',
    usage: 'Breaks through advanced encryption barriers',
    traceRisk: 'Very High',
    cooldown: 300,
    requirements: ['quantum-key', 'advanced-encryption']
  },
  'core-extractor': {
    id: 'core-extractor',
    name: 'Core Extractor',
    category: 'extraction',
    description: 'Extracts data from heavily protected core systems',
    usage: 'Retrieves critical data from secure vaults',
    traceRisk: 'Very High',
    cooldown: 240,
    requirements: ['core-access', 'extraction-protocols']
  },

  // Stealth Tools
  'trace-cleaner': {
    id: 'trace-cleaner',
    name: 'Trace Cleaner',
    category: 'stealth',
    description: 'Removes digital footprints and evidence',
    usage: 'Cleans logs and eliminates traces of intrusion',
    traceRisk: 'Negative',
    cooldown: 60,
    requirements: ['log-access']
  },
  'ghost-protocol': {
    id: 'ghost-protocol',
    name: 'Ghost Protocol',
    category: 'stealth',
    description: 'Renders activities nearly invisible to monitoring systems',
    usage: 'Provides advanced stealth capabilities',
    traceRisk: 'Very Low',
    cooldown: 180,
    requirements: ['stealth-algorithms', 'advanced-access']
  },
  'silence-field': {
    id: 'silence-field',
    name: 'Silence Field',
    category: 'stealth',
    description: 'Creates a zone of digital silence around operations',
    usage: 'Masks activities from detection systems',
    traceRisk: 'Low',
    cooldown: 120,
    requirements: ['field-generator', 'stealth-protocols']
  },

  // Disruption Tools
  'alarm-disruptor': {
    id: 'alarm-disruptor',
    name: 'Alarm Disruptor',
    category: 'disruption',
    description: 'Disables security alarm systems',
    usage: 'Prevents alerts from reaching security personnel',
    traceRisk: 'Medium',
    cooldown: 90,
    requirements: ['alarm-access', 'disruption-codes']
  },
  'grid-disruptor': {
    id: 'grid-disruptor',
    name: 'Grid Disruptor',
    category: 'disruption',
    description: 'Disrupts power and communication grids',
    usage: 'Causes temporary system outages and confusion',
    traceRisk: 'High',
    cooldown: 200,
    requirements: ['grid-access', 'power-systems']
  },
  'chaos-generator': {
    id: 'chaos-generator',
    name: 'Chaos Generator',
    category: 'disruption',
    description: 'Creates system-wide chaos and confusion',
    usage: 'Generates multiple false alarms and diversions',
    traceRisk: 'Very High',
    cooldown: 300,
    requirements: ['system-admin', 'chaos-algorithms']
  },

  // Analysis Tools
  'pattern-analyzer': {
    id: 'pattern-analyzer',
    name: 'Pattern Analyzer',
    category: 'analysis',
    description: 'Identifies patterns in data and behavior',
    usage: 'Analyzes communication patterns and predicts responses',
    traceRisk: 'Low',
    cooldown: 45,
    requirements: ['data-samples', 'analysis-engine']
  },
  'social-engineer': {
    id: 'social-engineer',
    name: 'Social Engineer',
    category: 'analysis',
    description: 'Manipulates human psychology for access',
    usage: 'Exploits human weaknesses to gain information',
    traceRisk: 'Medium',
    cooldown: 120,
    requirements: ['psychological-profiles', 'communication-access']
  },

  // Specialized Tools
  'breach-hammer': {
    id: 'breach-hammer',
    name: 'Breach Hammer',
    category: 'assault',
    description: 'Brute force tool for breaking through defenses',
    usage: 'Overwhelms security systems with raw computational power',
    traceRisk: 'Very High',
    cooldown: 180,
    requirements: ['computational-power', 'breach-algorithms']
  },
  'vault-cracker': {
    id: 'vault-cracker',
    name: 'Vault Cracker',
    category: 'assault',
    description: 'Specialized tool for breaking into secure vaults',
    usage: 'Cracks vault security using advanced algorithms',
    traceRisk: 'High',
    cooldown: 150,
    requirements: ['vault-schematics', 'cracking-tools']
  },
  'stealth-implant': {
    id: 'stealth-implant',
    name: 'Stealth Implant',
    category: 'surveillance',
    description: 'Plants hidden surveillance devices in target systems',
    usage: 'Provides ongoing monitoring capabilities',
    traceRisk: 'Low',
    cooldown: 200,
    requirements: ['implant-technology', 'system-access']
  },
  'countermeasure-jammer': {
    id: 'countermeasure-jammer',
    name: 'Countermeasure Jammer',
    category: 'defense',
    description: 'Neutralizes automated security countermeasures',
    usage: 'Disables defensive systems and automated responses',
    traceRisk: 'High',
    cooldown: 160,
    requirements: ['countermeasure-analysis', 'jamming-technology']
  },
  'emergency-exit': {
    id: 'emergency-exit',
    name: 'Emergency Exit',
    category: 'escape',
    description: 'Provides rapid extraction from compromised systems',
    usage: 'Creates emergency escape routes when missions go wrong',
    traceRisk: 'Medium',
    cooldown: 300,
    requirements: ['exit-protocols', 'emergency-access']
  },
  'invisible-hand': {
    id: 'invisible-hand',
    name: 'Invisible Hand',
    category: 'stealth',
    description: 'Performs actions without leaving digital fingerprints',
    usage: 'Executes commands while maintaining perfect stealth',
    traceRisk: 'Very Low',
    cooldown: 90,
    requirements: ['stealth-mastery', 'fingerprint-masking']
  },
  'phantom-exit': {
    id: 'phantom-exit',
    name: 'Phantom Exit',
    category: 'escape',
    description: 'Leaves systems as if you were never there',
    usage: 'Erases all evidence of presence during extraction',
    traceRisk: 'Negative',
    cooldown: 180,
    requirements: ['phantom-protocols', 'evidence-erasure']
  }
};

let globalState = {
  threatLevel: 'LOW',
  broadcasts: []
};

// Helper to get session from request
const getSession = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  return await db.getSession(token);
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { teamName, accessCode } = req.body;

  try {
    if (!teamName || !accessCode) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    let team = await db.authenticateTeam(teamName, accessCode);

    if (!team) {
      // Attempt to create team if not exists (for demo purposes, usually specific registration endpoint)
      // Simplified checking: try creation, if fails with unique assumption, then invalid creds
      try {
        team = await db.createTeam({ teamName, accessCode });
      } catch (e) {
        if (e.message.includes('Team name')) {
          return res.status(409).json({ success: false, message: 'Team name already taken. Please choose another.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid credentials or Team Name taken' });
      }
    }

    const sessionToken = uuidv4();
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    await db.createSession({
      teamId: team.id,
      sessionToken,
      ipAddress,
      userAgent
    });

    // Log login activity to database
    try {
      await new Promise((resolve, reject) => {
        db.db.run(`
          INSERT INTO activity_logs (team_id, type, details, timestamp)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [team.id, 'team_login', JSON.stringify({ teamName: team.teamName })], (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.json({
      success: true,
      sessionToken,
      teamId: team.id,
      teamName: team.teamName
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mock Broadcasts and Activity Logs (still in memory for now, but task focuses on persistence of teams/progress)
const mockBroadcasts = [];
const mockActivityLogs = [
  {
    type: 'mission_start',
    team: 'Ghost (Demo)',
    mission: 'false-flag',
    agent: 'CIPHER',
    data: { missionId: 'false-flag' },
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    type: 'objective_completed',
    team: 'Ghost (Demo)',
    mission: 'false-flag',
    agent: 'CIPHER',
    data: { objectiveId: 1, reward: 150 },
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

// Admin API 
// Note: admin routes in simple-server were minimal. Keeping them basic for now.
app.post('/api/v1/admin/broadcast', (req, res) => {
  const { message, type = 'danger' } = req.body;
  const broadcast = {
    id: uuidv4(),
    message,
    type,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 30).toISOString()
  };
  mockBroadcasts.push(broadcast);
  res.json({ success: true, broadcast });
});

app.post('/api/v1/admin/threat', (req, res) => {
  const { level } = req.body;
  if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(level)) {
    globalState.threatLevel = level;
    res.json({ success: true, threatLevel: level });
  } else {
    res.status(400).json({ success: false, message: 'Invalid threat level' });
  }
});

// Admin Team management is complex with DB, keeping strict for now
app.get('/api/v1/admin/teams', async (req, res) => {
  // Mock admin auth check
  const authHeader = req.headers['authorization'];
  if (authHeader !== 'Bearer NEXUS-MASTER-ADMIN-8821') {
    return res.status(403).json({ success: false });
  }

  try {
    // Fetch all teams with their current status
    const teams = await new Promise((resolve, reject) => {
      db.db.all(`
        SELECT 
          t.name as teamName,
          t.total_score as score,
          t.completed_missions as missionsCompleted,
          t.last_active as lastActive,
          s.token as sessionToken
        FROM teams t
        LEFT JOIN sessions s ON t.id = s.team_id
        ORDER BY t.last_active DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Format team data
    const formattedTeams = teams.map(team => ({
      teamName: team.teamName,
      score: team.score || 0,
      missionsCompleted: team.missionsCompleted || 0,
      mission: 'N/A', // Would need to track current mission
      status: team.sessionToken ? 'ACTIVE' : 'OFFLINE',
      lastActive: team.lastActive || new Date().toISOString()
    }));

    res.json({ success: true, data: formattedTeams });
  } catch (e) {
    console.error('Failed to fetch teams:', e);
    res.json({ success: true, data: [] });
  }
});

app.get('/api/v1/admin/activity', async (req, res) => {
  // Check admin authentication
  const authHeader = req.headers['authorization'];
  console.log('Admin activity request - Auth header:', authHeader);
  console.log('Expected:', 'Bearer NEXUS-MASTER-ADMIN-8821');
  
  if (authHeader !== 'Bearer NEXUS-MASTER-ADMIN-8821') {
    console.log('❌ Admin auth failed');
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  console.log('✅ Admin auth successful');

  try {
    const limit = parseInt(req.query.limit) || 50;

    // Fetch logs from DB
    // Use a Promise wrapper for the db.all call since we're not using the class helper here for raw query
    const logs = await new Promise((resolve, reject) => {
      db.db.all(`
            SELECT 
                al.id, 
                al.type, 
                t.name as team, 
                al.details, 
                al.timestamp 
            FROM activity_logs al
            LEFT JOIN teams t ON al.team_id = t.id
            ORDER BY al.timestamp DESC
            LIMIT ?
        `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Format logs to match frontend expectation
    const formattedLogs = logs.map(log => {
      let details = {};
      try { details = JSON.parse(log.details); } catch (e) { }

      return {
        id: log.id,
        type: log.type,
        team: log.team || 'Unknown',
        details,
        timestamp: log.timestamp
      };
    });

    res.json({ success: true, data: formattedLogs });
  } catch (e) {
    console.error('Failed to fetch activity logs:', e);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Game State
app.get('/api/v1/game/state', async (req, res) => {
  const session = await getSession(req);

  const now = new Date();
  const activeBroadcasts = mockBroadcasts.filter(b => new Date(b.expiresAt) > now);

  const responseData = {
    ...globalState,
    broadcasts: activeBroadcasts,
    authenticated: false,
    missionProgress: 0,
    traceResidue: 0,
    score: 0
  };

  if (session) {
    // Get team info from DB or simply rely on session details
    // For full persistence we'd fetch Team object too
    const team = await db.getTeam(session.teamId);

    // Check if there is an active mission instance?
    // Simplified for now: just return basic persistence

    Object.assign(responseData, {
      teamName: session.teamName,
      authenticated: true,
      lastActive: new Date().toISOString(),
      threatLevel: globalState.threatLevel,
      // Default / Todo: persist these in DB too
      missionProgress: 0,
      score: team ? (team.total_score || 0) : 0
    });
  } else {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.split(' ')[1] && authHeader.split(' ')[1] !== 'null') {
      responseData.forceLogout = true;
    }
  }

  res.json({
    success: true,
    data: responseData
  });
});

app.get('/api/v1/agents', (req, res) => {
  res.json({ success: true, data: { agents: mockAgents } });
});

app.post('/api/v1/agents/select', async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { agentId } = req.body;
  const agent = mockAgents.find(a => a.id === agentId);

  if (agent) {
    // Log agent selection activity
    try {
      await new Promise((resolve, reject) => {
        db.db.run(`
          INSERT INTO activity_logs (team_id, type, details, timestamp)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [session.teamId, 'agent_selected', JSON.stringify({ 
          agentId, 
          agentName: agent.name,
          teamName: session.teamName 
        })], (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.json({ success: true, agent });
  } else {
    res.status(404).json({ success: false, message: 'Agent not found' });
  }
});

app.get('/api/v1/missions', (req, res) => {
  res.json({ success: true, data: { missions: mockMissions } });
});

app.get('/api/v1/tools', (req, res) => {
  res.json({ success: true, data: { tools: gameTools } });
});

// Tool Usage & Objectives
app.post('/api/v1/tools/use', (req, res) => {
  // Simplified: No DB persistence for ephemeral tool usage yet
  res.json({
    success: true,
    effects: {
      message: 'Tool used successfully (Simulated)',
      progressGain: 10,
      traceIncrease: 2
    }
  });
});

app.post('/api/v1/missions/objective/complete', async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { missionId, objectiveId } = req.body;

  // Log objective completion to database
  try {
    await new Promise((resolve, reject) => {
      db.db.run(`
        INSERT INTO activity_logs (team_id, type, details, timestamp)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [session.teamId, 'objective_completed', JSON.stringify({ 
        missionId, 
        objectiveId, 
        reward: 100,
        teamName: session.teamName 
      })], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  } catch (logError) {
    console.error('Failed to log activity:', logError);
  }

  res.json({ success: true });
});

// Admin Leaderboard
app.get('/api/v1/admin/leaderboard', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader !== 'Bearer NEXUS-MASTER-ADMIN-8821') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const limit = parseInt(req.query.limit) || 100;
    
    // Fetch teams with scores from database
    const teams = await new Promise((resolve, reject) => {
      db.db.all(`
        SELECT 
          name as teamName,
          total_score as score,
          completed_missions as missionsCompleted,
          last_active as lastActive
        FROM teams
        WHERE total_score > 0
        ORDER BY total_score DESC
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Format leaderboard data
    const leaderboard = teams.map((team, index) => ({
      rank: index + 1,
      teamName: team.teamName,
      score: team.score || 0,
      missionsCompleted: team.missionsCompleted || 0,
      averageScore: team.missionsCompleted > 0 ? Math.round(team.score / team.missionsCompleted) : 0,
      lastActive: team.lastActive || new Date().toISOString()
    }));

    res.json({ success: true, data: leaderboard });
  } catch (e) {
    console.error('Failed to fetch leaderboard:', e);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Admin Team Kick
app.post('/api/v1/admin/team/kick', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader !== 'Bearer NEXUS-MASTER-ADMIN-8821') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { teamName } = req.body;
  
  try {
    // Invalidate all sessions for this team
    await new Promise((resolve, reject) => {
      db.db.run(`
        DELETE FROM sessions WHERE team_id = (SELECT id FROM teams WHERE name = ?)
      `, [teamName], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    res.json({ success: true, message: `Team ${teamName} has been kicked` });
  } catch (e) {
    console.error('Failed to kick team:', e);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Admin Team Reset
app.post('/api/v1/admin/team/reset', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader !== 'Bearer NEXUS-MASTER-ADMIN-8821') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { teamName } = req.body;
  
  try {
    // Reset team score and missions
    await new Promise((resolve, reject) => {
      db.db.run(`
        UPDATE teams 
        SET total_score = 0, total_missions_completed = 0
        WHERE name = ?
      `, [teamName], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    res.json({ success: true, message: `Team ${teamName} progress has been reset` });
  } catch (e) {
    console.error('Failed to reset team:', e);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Admin System Reset
app.post('/api/v1/admin/reset', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader !== 'Bearer NEXUS-MASTER-ADMIN-8821') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Clear all sessions
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM sessions', (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    // Clear activity logs
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM activity_logs', (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    // Reset all team scores
    await new Promise((resolve, reject) => {
      db.db.run('UPDATE teams SET total_score = 0, total_missions_completed = 0', (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    // Clear in-memory state
    mockActivityLogs.length = 0;
    mockBroadcasts.length = 0;
    globalState.threatLevel = 'LOW';

    res.json({ success: true, message: 'System has been reset' });
  } catch (e) {
    console.error('Failed to reset system:', e);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});


// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Keep server running if possible, or exit gracefully
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║              NEXUS PROTOCOL BACKEND SERVER                   ║
  ║                   (SQLite Persistent)                        ║
  ╚═══════════════════════════════════════════════════════════════╝
  
  📡 Server running on port ${PORT}
  🗄️  Database: SQLite (nexus_protocol.db)
  `);
});