require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const os = require('os');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'nexusprotocol',
  user: process.env.DB_USER || 'nexus_user',
  password: process.env.DB_PASSWORD || '',
  ssl: false
});

// Official teams — change codes before each event
const TEAMS = [
  { name: 'RedTeam',  code: 'RED@Nexus2024!',  type: 'red'  },
  { name: 'BlueTeam', code: 'BLUE@Nexus2024!', type: 'blue' }
];

// Detect local LAN IP for CORS hint
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Teams table
    await client.query(`CREATE TABLE IF NOT EXISTS teams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_name VARCHAR(30) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      access_code VARCHAR(100) NOT NULL,
      team_type VARCHAR(10) NOT NULL DEFAULT 'red' CHECK (team_type IN ('red','blue')),
      created_at TIMESTAMP DEFAULT NOW(),
      last_active TIMESTAMP DEFAULT NOW(),
      total_missions INTEGER DEFAULT 0,
      completed_missions INTEGER DEFAULT 0,
      total_score BIGINT DEFAULT 0,
      best_score INTEGER DEFAULT 0,
      average_rank VARCHAR(10) DEFAULT 'F-RANK',
      best_rank VARCHAR(10) DEFAULT 'F-RANK',
      favorite_agent VARCHAR(20),
      achievements TEXT[] DEFAULT '{}',
      is_active BOOLEAN DEFAULT TRUE
    )`);

    // Sessions table
    await client.query(`CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      session_token VARCHAR(512) NOT NULL UNIQUE,
      authenticated BOOLEAN DEFAULT TRUE,
      selected_agent VARCHAR(20),
      current_mission UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL,
      last_activity TIMESTAMP DEFAULT NOW(),
      ip_address INET,
      user_agent TEXT
    )`);

    // Mission instances table
    await client.query(`CREATE TABLE IF NOT EXISTS mission_instances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mission_id VARCHAR(50) NOT NULL,
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      selected_agent VARCHAR(20) NOT NULL,
      start_time TIMESTAMP NOT NULL DEFAULT NOW(),
      end_time TIMESTAMP,
      completed_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'active',
      current_phase INTEGER DEFAULT 1,
      trace_level DECIMAL(5,2) DEFAULT 0.0,
      time_remaining INTEGER,
      alarms_triggered INTEGER DEFAULT 0,
      mission_progress INTEGER DEFAULT 0,
      final_score INTEGER,
      rank VARCHAR(10),
      failure_reason VARCHAR(100),
      burn_state BOOLEAN DEFAULT FALSE,
      abilities_data JSONB DEFAULT '{}',
      stats_data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Mission objectives table
    await client.query(`CREATE TABLE IF NOT EXISTS mission_objectives (
      id SERIAL PRIMARY KEY,
      mission_instance_id UUID REFERENCES mission_instances(id) ON DELETE CASCADE,
      objective_id INTEGER NOT NULL,
      phase_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      reward INTEGER DEFAULT 0,
      threat_reduction INTEGER DEFAULT 0,
      required BOOLEAN DEFAULT TRUE,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP,
      available BOOLEAN DEFAULT FALSE
    )`);

    // Performance logs table
    await client.query(`CREATE TABLE IF NOT EXISTS performance_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mission_instance_id UUID REFERENCES mission_instances(id) ON DELETE CASCADE,
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      final_score INTEGER NOT NULL,
      rank VARCHAR(10) NOT NULL,
      trace_level DECIMAL(5,2),
      time_used INTEGER,
      objectives_completed INTEGER[] DEFAULT '{}',
      alarms_triggered INTEGER DEFAULT 0,
      selected_agent VARCHAR(20),
      mission_type VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Rooms table for 2v2 multiplayer events
    await client.query(`CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_name VARCHAR(50) NOT NULL UNIQUE,
      red_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
      blue_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
      status VARCHAR(20) DEFAULT 'active',
      log_file VARCHAR(255),
      patches_file VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(team_name);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions(team_id);
      CREATE INDEX IF NOT EXISTS idx_missions_team ON mission_instances(team_id);
      CREATE INDEX IF NOT EXISTS idx_missions_status ON mission_instances(status);
      CREATE INDEX IF NOT EXISTS idx_perf_team ON performance_logs(team_id);
    `);

    // Wipe all existing data
    await client.query('TRUNCATE TABLE performance_logs CASCADE');
    await client.query('TRUNCATE TABLE mission_objectives CASCADE');
    await client.query('TRUNCATE TABLE mission_instances CASCADE');
    await client.query('TRUNCATE TABLE sessions CASCADE');
    await client.query('TRUNCATE TABLE rooms CASCADE');
    await client.query('TRUNCATE TABLE teams CASCADE');

    // Register official teams
    for (const team of TEAMS) {
      const hash = await bcrypt.hash(team.code, 12);
      await client.query(
        'INSERT INTO teams (team_name, password_hash, access_code, team_type) VALUES ($1, $2, $3, $4)',
        [team.name, hash, team.code, team.type]
      );
    }

    await client.query('COMMIT');

    const lan = getLanIP();
    console.log('');
    console.log('  ╔══════════════════════════════════════════════╗');
    console.log('  ║       NEXUS PROTOCOL - DATABASE READY        ║');
    console.log('  ╠══════════════════════════════════════════════╣');
    console.log('  ║  Red  Team  :  RedTeam  /  RED@Nexus2024!    ║');
    console.log('  ║  Blue Team  :  BlueTeam /  BLUE@Nexus2024!   ║');
    console.log('  ║  Admin Code :  ADMIN-8821                    ║');
    console.log('  ╠══════════════════════════════════════════════╣');
    console.log('  ║  LAN Access :  http://' + lan + ':5173' + ' '.repeat(Math.max(0, 18 - lan.length)) + '║');
    console.log('  ╚══════════════════════════════════════════════╝');
    console.log('');

  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('DB init failed:', e.message); process.exit(1); });
