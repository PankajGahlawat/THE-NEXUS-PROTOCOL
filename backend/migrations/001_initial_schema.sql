-- NEXUS PROTOCOL - PostgreSQL Initial Schema
-- Version: 1.0.0
-- Date: February 19, 2026
-- Description: Complete database schema for NEXUS PROTOCOL cyber-war simulation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ROUNDS TABLE
-- ============================================================================
-- Stores game round information with team assignments and scoring
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  current_phase VARCHAR(20) NOT NULL CHECK (current_phase IN ('initial_access', 'escalation', 'impact', 'recovery')),
  phase_start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  red_team_id UUID NOT NULL,
  blue_team_id UUID NOT NULL,
  red_score INTEGER DEFAULT 0 CHECK (red_score >= 0),
  blue_score INTEGER DEFAULT 0 CHECK (blue_score >= 0),
  red_trace_level NUMERIC(5,2) DEFAULT 0 CHECK (red_trace_level >= 0 AND red_trace_level <= 100),
  red_burn_state VARCHAR(20) DEFAULT 'LOW' CHECK (red_burn_state IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'terminated')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
-- Stores mission tasks with dependencies and completion status
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL,
  phase VARCHAR(20) NOT NULL CHECK (phase IN ('initial_access', 'escalation', 'impact', 'recovery')),
  agent_type VARCHAR(20) NOT NULL CHECK (agent_type IN ('ARCHITECT', 'SPECTER', 'ORACLE', 'SENTINEL', 'WARDEN', 'RESTORER')),
  team_type VARCHAR(10) NOT NULL CHECK (team_type IN ('RED', 'BLUE')),
  status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'failed')),
  assigned_to UUID,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  points_awarded INTEGER DEFAULT 0 CHECK (points_awarded >= 0),
  prerequisites JSONB DEFAULT '[]'::jsonb,
  validation_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM_STATES TABLE
-- ============================================================================
-- Tracks the state of target systems in the cyber range
CREATE TABLE IF NOT EXISTS system_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  system_ip VARCHAR(15) NOT NULL,
  system_tier VARCHAR(10) NOT NULL CHECK (system_tier IN ('tier1', 'tier2', 'tier3')),
  system_name VARCHAR(50) NOT NULL,
  compromised BOOLEAN DEFAULT FALSE,
  compromise_level INTEGER DEFAULT 0 CHECK (compromise_level >= 0 AND compromise_level <= 100),
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  firewall_rules JSONB DEFAULT '[]'::jsonb,
  persistence_mechanisms JSONB DEFAULT '[]'::jsonb,
  last_modified TIMESTAMP DEFAULT NOW(),
  modified_by UUID,
  snapshot_id VARCHAR(100),
  UNIQUE(round_id, system_ip)
);

-- ============================================================================
-- EVENTS TABLE (Audit Trail)
-- ============================================================================
-- Comprehensive audit log of all game actions
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  target_system VARCHAR(15),
  action_details JSONB NOT NULL,
  trace_generated NUMERIC(5,2) DEFAULT 0 CHECK (trace_generated >= 0),
  observable BOOLEAN DEFAULT FALSE,
  detected BOOLEAN DEFAULT FALSE,
  detection_time TIMESTAMP,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- AGENTS TABLE
-- ============================================================================
-- Tracks agent performance and statistics
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  agent_type VARCHAR(20) NOT NULL CHECK (agent_type IN ('ARCHITECT', 'SPECTER', 'ORACLE', 'SENTINEL', 'WARDEN', 'RESTORER')),
  team_type VARCHAR(10) NOT NULL CHECK (team_type IN ('RED', 'BLUE')),
  player_id UUID,
  tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
  tools_used INTEGER DEFAULT 0 CHECK (tools_used >= 0),
  effectiveness_rating NUMERIC(3,2) DEFAULT 1.0 CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 1.0),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(round_id, agent_type)
);

-- ============================================================================
-- TOOLS TABLE
-- ============================================================================
-- Tool definitions and usage statistics
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('RED', 'BLUE')),
  category VARCHAR(30) NOT NULL,
  base_cooldown INTEGER NOT NULL CHECK (base_cooldown >= 0),
  base_effectiveness NUMERIC(3,2) NOT NULL CHECK (base_effectiveness >= 0 AND base_effectiveness <= 1.0),
  trace_generation NUMERIC(5,2) NOT NULL CHECK (trace_generation >= 0),
  observable BOOLEAN DEFAULT TRUE,
  stealth_modifier NUMERIC(3,2) DEFAULT 1.0,
  description TEXT,
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TOOL_USAGE TABLE
-- ============================================================================
-- Tracks individual tool usage events
CREATE TABLE IF NOT EXISTS tool_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  target_system VARCHAR(15),
  success BOOLEAN NOT NULL,
  effectiveness NUMERIC(3,2),
  trace_generated NUMERIC(5,2),
  cooldown_applied INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SCORES TABLE
-- ============================================================================
-- Detailed scoring breakdown
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  team_type VARCHAR(10) NOT NULL CHECK (team_type IN ('RED', 'BLUE')),
  score_type VARCHAR(30) NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Rounds indexes
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);
CREATE INDEX IF NOT EXISTS idx_rounds_created ON rounds(created_at DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_round_phase ON tasks(round_id, phase);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_type, team_type);

-- System states indexes
CREATE INDEX IF NOT EXISTS idx_system_states_round ON system_states(round_id);
CREATE INDEX IF NOT EXISTS idx_system_states_compromised ON system_states(compromised);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_round_timestamp ON events(round_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_observable ON events(observable, detected);
CREATE INDEX IF NOT EXISTS idx_events_actor ON events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_round ON agents(round_id);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(agent_type, team_type);

-- Tool usage indexes
CREATE INDEX IF NOT EXISTS idx_tool_usage_round ON tool_usage(round_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_agent ON tool_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_timestamp ON tool_usage(timestamp DESC);

-- Scores indexes
CREATE INDEX IF NOT EXISTS idx_scores_round ON scores(round_id);
CREATE INDEX IF NOT EXISTS idx_scores_team ON scores(team_type);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to rounds table
CREATE TRIGGER update_rounds_updated_at
  BEFORE UPDATE ON rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA - TOOL DEFINITIONS
-- ============================================================================

-- Red Team Tools
INSERT INTO tools (name, type, category, base_cooldown, base_effectiveness, trace_generation, observable, stealth_modifier, description) VALUES
  ('nmap', 'RED', 'reconnaissance', 30, 0.90, 8.0, true, 1.0, 'Network scanning and port enumeration'),
  ('sqlmap', 'RED', 'exploitation', 60, 0.85, 12.0, true, 1.0, 'Automated SQL injection exploitation'),
  ('gobuster', 'RED', 'reconnaissance', 45, 0.88, 10.0, true, 1.0, 'Directory and file enumeration'),
  ('hydra', 'RED', 'exploitation', 90, 0.80, 15.0, true, 1.0, 'Password brute-forcing tool'),
  ('metasploit', 'RED', 'exploitation', 120, 0.95, 18.0, true, 1.0, 'Exploitation framework'),
  ('mimikatz', 'RED', 'post_exploitation', 60, 0.92, 10.0, false, 0.6, 'Credential extraction tool'),
  ('cron', 'RED', 'persistence', 90, 0.88, 8.0, false, 0.7, 'Persistence via scheduled tasks'),
  ('netcat', 'RED', 'post_exploitation', 30, 0.85, 12.0, true, 1.0, 'Network communication and reverse shells'),
  ('dns_tunnel', 'RED', 'exfiltration', 120, 0.80, 6.0, false, 0.5, 'Data exfiltration via DNS tunneling')
ON CONFLICT (name) DO NOTHING;

-- Blue Team Tools
INSERT INTO tools (name, type, category, base_cooldown, base_effectiveness, trace_generation, observable, stealth_modifier, description) VALUES
  ('ids_monitor', 'BLUE', 'detection', 30, 0.85, 0, false, 1.0, 'Intrusion detection system monitoring'),
  ('firewall_config', 'BLUE', 'defense', 60, 0.90, 0, false, 1.0, 'Firewall rule configuration'),
  ('ip_block', 'BLUE', 'defense', 15, 0.95, 0, false, 1.0, 'IP address blocking'),
  ('rootkit_scan', 'BLUE', 'detection', 90, 0.80, 0, false, 1.0, 'Rootkit and persistence detection'),
  ('forensics', 'BLUE', 'analysis', 120, 0.88, 0, false, 1.0, 'System forensics and log analysis'),
  ('system_restore', 'BLUE', 'recovery', 180, 0.92, 0, false, 1.0, 'System restoration from clean snapshot')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active rounds with current scores
CREATE OR REPLACE VIEW active_rounds_summary AS
SELECT 
  r.id,
  r.current_phase,
  r.red_score,
  r.blue_score,
  r.red_trace_level,
  r.red_burn_state,
  r.start_time,
  EXTRACT(EPOCH FROM (NOW() - r.start_time)) / 60 AS elapsed_minutes,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
  COUNT(DISTINCT e.id) AS total_events
FROM rounds r
LEFT JOIN tasks t ON t.round_id = r.id
LEFT JOIN events e ON e.round_id = r.id
WHERE r.status = 'active'
GROUP BY r.id;

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  r.id AS round_id,
  r.red_team_id,
  r.blue_team_id,
  r.red_score,
  r.blue_score,
  CASE 
    WHEN r.red_score > r.blue_score THEN 'RED'
    WHEN r.blue_score > r.red_score THEN 'BLUE'
    ELSE 'TIE'
  END AS winner,
  r.end_time,
  EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 60 AS duration_minutes
FROM rounds r
WHERE r.status = 'completed'
ORDER BY GREATEST(r.red_score, r.blue_score) DESC, r.end_time DESC;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE rounds IS 'Game rounds with team assignments and scoring';
COMMENT ON TABLE tasks IS 'Mission tasks with dependencies and completion tracking';
COMMENT ON TABLE system_states IS 'Current state of target systems in cyber range';
COMMENT ON TABLE events IS 'Comprehensive audit trail of all game actions';
COMMENT ON TABLE agents IS 'Agent performance tracking and statistics';
COMMENT ON TABLE tools IS 'Tool definitions and usage statistics';
COMMENT ON TABLE tool_usage IS 'Individual tool usage event tracking';
COMMENT ON TABLE scores IS 'Detailed scoring breakdown by event';

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed for your deployment)
-- ============================================================================

-- Example: Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_app;

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_version (version, description) VALUES 
  (1, 'Initial schema with rounds, tasks, system_states, events, agents, tools, tool_usage, and scores tables')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
