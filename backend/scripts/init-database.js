/**
 * NEXUS PROTOCOL - Database Initialization Script
 * Sets up PostgreSQL database with proper schemas and demo data
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nexusprotocol',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Initializing Nexus Protocol Database...');
    
    await client.query('BEGIN');

    // Create tables
    console.log('📋 Creating database schema...');
    
    // Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_name VARCHAR(20) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
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
      )
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
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
      )
    `);

    // Mission instances table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_instances (
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
      )
    `);

    // Mission objectives table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_objectives (
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
      )
    `);

    // Performance logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_logs (
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
      )
    `);

    // Create indexes
    console.log('🔍 Creating database indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(team_name);
      CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(last_active);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions(team_id);
      CREATE INDEX IF NOT EXISTS idx_missions_team ON mission_instances(team_id);
      CREATE INDEX IF NOT EXISTS idx_missions_status ON mission_instances(status);
      CREATE INDEX IF NOT EXISTS idx_missions_created ON mission_instances(created_at);
      CREATE INDEX IF NOT EXISTS idx_objectives_mission ON mission_objectives(mission_instance_id);
      CREATE INDEX IF NOT EXISTS idx_performance_team ON performance_logs(team_id);
    `);

    // Insert demo data
    console.log('🎮 Creating demo teams...');
    
    const demoTeams = [
      { name: 'Ghost', code: '1234' },
      { name: 'Phantom', code: '5678' },
      { name: 'Shadow', code: '9012' },
      { name: 'Cipher', code: '3456' }
    ];

    for (const team of demoTeams) {
      const passwordHash = await bcrypt.hash(team.code, 12);
      
      await client.query(`
        INSERT INTO teams (team_name, password_hash) 
        VALUES ($1, $2) 
        ON CONFLICT (team_name) DO NOTHING
      `, [team.name, passwordHash]);
    }

    await client.query('COMMIT');
    
    console.log('✅ Database initialization completed successfully!');
    console.log('');
    console.log('📊 Demo Teams Created:');
    demoTeams.forEach(team => {
      console.log(`   • Team: ${team.name}, Code: ${team.code}`);
    });
    console.log('');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function checkConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as server_time');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log(`   Server time: ${result.rows[0].server_time}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Nexus Protocol Database Setup');
  console.log('================================');
  
  // Check connection first
  const connected = await checkConnection();
  if (!connected) {
    console.log('');
    console.log('💡 Make sure PostgreSQL is running and the connection string is correct.');
    console.log('   Current DATABASE_URL:', process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nexusprotocol');
    process.exit(1);
  }
  
  // Initialize database
  await initializeDatabase();
  
  console.log('🎯 Database is ready for Nexus Protocol!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start the backend server: npm run dev');
  console.log('2. Start the frontend: cd ../frontend && npm run dev');
  console.log('3. Access the game at: http://localhost:5173');
  
  await pool.end();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase, checkConnection };