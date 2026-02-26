-- Terminal Logs Table for Admin Monitoring
-- Stores all terminal commands and outputs for audit trail

CREATE TABLE IF NOT EXISTS terminal_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    command TEXT NOT NULL,
    output TEXT,
    vm_host VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_terminal_logs_session ON terminal_logs(session_id);
CREATE INDEX idx_terminal_logs_user ON terminal_logs(user_id);
CREATE INDEX idx_terminal_logs_timestamp ON terminal_logs(timestamp);
CREATE INDEX idx_terminal_logs_vm_host ON terminal_logs(vm_host);

-- Terminal Sessions Table for tracking active sessions
CREATE TABLE IF NOT EXISTS terminal_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    vm_host VARCHAR(255) NOT NULL,
    vm_port INTEGER DEFAULT 22,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    total_commands INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sessions
CREATE INDEX idx_terminal_sessions_user ON terminal_sessions(user_id);
CREATE INDEX idx_terminal_sessions_status ON terminal_sessions(status);
CREATE INDEX idx_terminal_sessions_vm_host ON terminal_sessions(vm_host);

-- View for admin dashboard
CREATE OR REPLACE VIEW terminal_activity_summary AS
SELECT 
    ts.session_id,
    ts.user_id,
    ts.username,
    ts.vm_host,
    ts.connected_at,
    ts.disconnected_at,
    ts.last_activity,
    ts.status,
    COUNT(tl.id) as command_count,
    MAX(tl.timestamp) as last_command_time
FROM terminal_sessions ts
LEFT JOIN terminal_logs tl ON ts.session_id = tl.session_id
GROUP BY ts.session_id, ts.user_id, ts.username, ts.vm_host, 
         ts.connected_at, ts.disconnected_at, ts.last_activity, ts.status;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE terminal_sessions 
    SET last_activity = NEW.timestamp,
        total_commands = total_commands + 1
    WHERE session_id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session activity
CREATE TRIGGER trigger_update_session_activity
AFTER INSERT ON terminal_logs
FOR EACH ROW
EXECUTE FUNCTION update_session_activity();

-- Comments for documentation
COMMENT ON TABLE terminal_logs IS 'Audit log of all terminal commands executed by users';
COMMENT ON TABLE terminal_sessions IS 'Tracking table for active and historical terminal sessions';
COMMENT ON VIEW terminal_activity_summary IS 'Summary view for admin dashboard showing session activity';
