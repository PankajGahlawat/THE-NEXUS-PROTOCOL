-- NEXUS PROTOCOL - Database Initialization Script
-- Compatible with both SQLite and PostgreSQL
-- Version: 2.0.0
-- Last Updated: December 20, 2025

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  total_shards INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_missions INTEGER DEFAULT 0,
  completed_missions INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  average_rank TEXT DEFAULT 'F-RANK',
  best_rank TEXT DEFAULT 'F-RANK',
  favorite_agent TEXT,
  is_active BOOLEAN DEFAULT 1
);

-- Users/Players Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id),
  username TEXT NOT NULL,
  assigned_role TEXT CHECK (assigned_role IN ('HACKER', 'INFILTRATOR', 'ANALYST')),
  active_now BOOLEAN DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_missions INTEGER DEFAULT 0,
  favorite_mission TEXT,
  skill_level INTEGER DEFAULT 1
);

-- Mission Instances Table
CREATE TABLE IF NOT EXISTS mission_instances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mission_id TEXT NOT NULL,
  team_id TEXT REFERENCES teams(id) NOT NULL,
  selected_agent TEXT NOT NULL,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  completed_at DATETIME,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
  current_phase INTEGER DEFAULT 1,
  trace_level REAL DEFAULT 0.0,
  time_remaining INTEGER,
  alarms_triggered INTEGER DEFAULT 0,
  mission_progress INTEGER DEFAULT 0,
  final_score INTEGER,
  rank TEXT,
  failure_reason TEXT,
  burn_state BOOLEAN DEFAULT 0,
  objectives_completed TEXT DEFAULT '[]', -- JSON array of completed objective IDs
  abilities_used TEXT DEFAULT '[]', -- JSON array of abilities used
  stats_data TEXT DEFAULT '{}' -- JSON object for additional stats
);

-- Progress/Completion Table
CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) NOT NULL,
  mission_id TEXT NOT NULL,
  mission_instance_id TEXT REFERENCES mission_instances(id),
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  role_played TEXT NOT NULL,
  shards_earned INTEGER DEFAULT 0,
  score_earned INTEGER DEFAULT 0,
  rank_achieved TEXT,
  time_taken INTEGER, -- seconds
  objectives_completed INTEGER DEFAULT 0,
  perfect_stealth BOOLEAN DEFAULT 0,
  no_alarms BOOLEAN DEFAULT 0
);

-- Live Activity Feed
CREATE TABLE IF NOT EXISTS live_activity (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) NOT NULL,
  user_id TEXT REFERENCES users(id),
  mission_instance_id TEXT REFERENCES mission_instances(id),
  action_type TEXT NOT NULL, -- 'MISSION_START', 'MISSION_COMPLETE', 'OBJECTIVE_COMPLETE', 'ABILITY_USED', 'ALARM_TRIGGERED', 'AGENT_SELECT'
  details TEXT, -- JSON string with action-specific data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success'))
);

-- Hex Shards Inventory
CREATE TABLE IF NOT EXISTS hex_shards (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) NOT NULL,
  shard_type TEXT NOT NULL, -- 'memory', 'access', 'reality', 'chaos'
  quantity INTEGER DEFAULT 1,
  earned_from TEXT REFERENCES mission_instances(id),
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_in TEXT REFERENCES mission_instances(id),
  used_at DATETIME
);

-- Leaderboard/Rankings
CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) NOT NULL,
  mission_type TEXT NOT NULL,
  best_score INTEGER NOT NULL,
  best_rank TEXT NOT NULL,
  best_time INTEGER, -- seconds
  achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_used TEXT,
  perfect_run BOOLEAN DEFAULT 0,
  UNIQUE(team_id, mission_type)
);

-- System Configuration
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active, last_active);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active_now);
CREATE INDEX IF NOT EXISTS idx_missions_team ON mission_instances(team_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON mission_instances(status);
CREATE INDEX IF NOT EXISTS idx_missions_created ON mission_instances(start_time);
CREATE INDEX IF NOT EXISTS idx_progress_team ON progress(team_id);
CREATE INDEX IF NOT EXISTS idx_progress_mission ON progress(mission_id);
CREATE INDEX IF NOT EXISTS idx_activity_team ON live_activity(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON live_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_shards_team ON hex_shards(team_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mission ON leaderboard(mission_type);

-- Insert demo teams
INSERT OR IGNORE INTO teams (id, name, code, total_shards) VALUES 
  ('ghost-team-001', 'Ghost', '1234', 0),
  ('phantom-team-002', 'Phantom', '5678', 0),
  ('shadow-team-003', 'Shadow', '9012', 0),
  ('cipher-team-004', 'Cipher', '3456', 0),
  ('nexus-team-005', 'Nexus', '7890', 0),
  ('void-team-006', 'Void', '2468', 0),
  ('echo-team-007', 'Echo', '1357', 0),
  ('raven-team-008', 'Raven', '9753', 0);

-- Insert demo users for Ghost team
INSERT OR IGNORE INTO users (id, team_id, username, assigned_role) VALUES 
  ('ghost-user-001', 'ghost-team-001', 'CipherMaster', 'HACKER'),
  ('ghost-user-002', 'ghost-team-001', 'ShadowWalker', 'INFILTRATOR'),
  ('ghost-user-003', 'ghost-team-001', 'DataOracle', 'ANALYST');

-- Insert system configuration
INSERT OR IGNORE INTO system_config (key, value, description) VALUES 
  ('version', '2.0.0', 'Nexus Protocol version'),
  ('max_teams', '50', 'Maximum number of concurrent teams'),
  ('session_timeout', '7200', 'Session timeout in seconds (2 hours)'),
  ('trace_threshold_low', '25', 'Low trace threshold percentage'),
  ('trace_threshold_medium', '50', 'Medium trace threshold percentage'),
  ('trace_threshold_high', '75', 'High trace threshold percentage'),
  ('mission_time_limit', '1800', 'Default mission time limit in seconds (30 minutes)'),
  ('max_alarms', '3', 'Maximum alarms before mission failure'),
  ('hex_shard_drop_rate', '0.15', 'Probability of hex shard drop on mission completion'),
  ('leaderboard_size', '100', 'Maximum entries in leaderboard'),
  ('maintenance_mode', 'false', 'System maintenance mode flag'),
  ('registration_open', 'true', 'Allow new team registration'),
  ('debug_mode', 'true', 'Enable debug logging and features');

-- Insert sample hex shards for Ghost team
INSERT OR IGNORE INTO hex_shards (team_id, shard_type, quantity) VALUES 
  ('ghost-team-001', 'memory', 2),
  ('ghost-team-001', 'access', 1),
  ('ghost-team-001', 'reality', 1);

-- Insert sample leaderboard entry
INSERT OR IGNORE INTO leaderboard (team_id, mission_type, best_score, best_rank, agent_used) VALUES 
  ('ghost-team-001', 'FALSE_FLAG', 2500, 'B-RANK', 'HACKER');

-- Create views for common queries
CREATE VIEW IF NOT EXISTS team_stats AS
SELECT 
  t.id,
  t.name,
  t.code,
  t.total_shards,
  t.total_missions,
  t.completed_missions,
  t.best_score,
  t.best_rank,
  COUNT(DISTINCT u.id) as active_members,
  MAX(t.last_active) as last_activity,
  COALESCE(SUM(hs.quantity), 0) as total_hex_shards
FROM teams t
LEFT JOIN users u ON t.id = u.team_id AND u.active_now = 1
LEFT JOIN hex_shards hs ON t.id = hs.team_id AND hs.used_at IS NULL
WHERE t.is_active = 1
GROUP BY t.id, t.name, t.code, t.total_shards, t.total_missions, t.completed_missions, t.best_score, t.best_rank;

CREATE VIEW IF NOT EXISTS mission_summary AS
SELECT 
  mi.id,
  mi.mission_id,
  t.name as team_name,
  mi.selected_agent,
  mi.status,
  mi.current_phase,
  mi.trace_level,
  mi.mission_progress,
  mi.final_score,
  mi.rank,
  mi.start_time,
  mi.end_time,
  (CASE 
    WHEN mi.end_time IS NOT NULL THEN 
      (julianday(mi.end_time) - julianday(mi.start_time)) * 86400
    ELSE 
      (julianday('now') - julianday(mi.start_time)) * 86400
  END) as duration_seconds
FROM mission_instances mi
JOIN teams t ON mi.team_id = t.id;

CREATE VIEW IF NOT EXISTS recent_activity AS
SELECT 
  la.id,
  t.name as team_name,
  u.username,
  la.action_type,
  la.details,
  la.created_at,
  la.severity
FROM live_activity la
JOIN teams t ON la.team_id = t.id
LEFT JOIN users u ON la.user_id = u.id
ORDER BY la.created_at DESC
LIMIT 100;

-- Trigger to update team stats when missions complete
CREATE TRIGGER IF NOT EXISTS update_team_stats_on_mission_complete
AFTER UPDATE OF status ON mission_instances
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
  UPDATE teams SET 
    completed_missions = completed_missions + 1,
    total_score = total_score + COALESCE(NEW.final_score, 0),
    best_score = MAX(best_score, COALESCE(NEW.final_score, 0)),
    last_active = CURRENT_TIMESTAMP
  WHERE id = NEW.team_id;
  
  -- Insert completion activity
  INSERT INTO live_activity (team_id, mission_instance_id, action_type, details, severity)
  VALUES (NEW.team_id, NEW.id, 'MISSION_COMPLETE', 
    json_object('score', NEW.final_score, 'rank', NEW.rank, 'agent', NEW.selected_agent),
    'success');
END;

-- Trigger to update last_active when users join
CREATE TRIGGER IF NOT EXISTS update_team_activity_on_user_join
AFTER UPDATE OF active_now ON users
WHEN NEW.active_now = 1 AND OLD.active_now = 0
BEGIN
  UPDATE teams SET last_active = CURRENT_TIMESTAMP WHERE id = NEW.team_id;
END;


-- Sessions Table (for authentication)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Activity Logs Table (alias for live_activity for backward compatibility)
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  team_id TEXT REFERENCES teams(id) NOT NULL,
  type TEXT NOT NULL,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_team ON activity_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
