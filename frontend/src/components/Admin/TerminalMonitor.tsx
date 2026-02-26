import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface Session {
  sessionId: string;
  userId: string;
  username: string;
  vmHost: string;
  connectedAt: string;
  lastActivity: string;
}

interface CommandLog {
  sessionId: string;
  userId: string;
  vmHost: string;
  command: string;
  timestamp: string;
}

const TerminalMonitor: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const [connected, setConnected] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Connect to admin namespace
    const adminSocket = io(
      `${import.meta.env.VITE_SSH_PROXY_URL || 'http://localhost:3002'}/admin`
    );

    adminSocket.on('connect', () => {
      console.log('Admin connected to monitoring');
      setConnected(true);
    });

    adminSocket.on('active-sessions', (sessions: Session[]) => {
      setActiveSessions(sessions);
    });

    adminSocket.on('session-started', (data: any) => {
      setActiveSessions(prev => [...prev, {
        sessionId: data.sessionId,
        userId: data.userId,
        username: data.username,
        vmHost: data.vmHost,
        connectedAt: data.timestamp,
        lastActivity: data.timestamp
      }]);
    });

    adminSocket.on('session-ended', (data: any) => {
      setActiveSessions(prev => 
        prev.filter(s => s.sessionId !== data.sessionId)
      );
    });

    adminSocket.on('session-disconnected', (data: any) => {
      setActiveSessions(prev => 
        prev.filter(s => s.sessionId !== data.sessionId)
      );
    });

    adminSocket.on('command-log', (data: CommandLog) => {
      setCommandLogs(prev => [data, ...prev].slice(0, 100));
    });

    adminSocket.on('terminal-output', (data: any) => {
      if (terminal.current && data.sessionId === selectedSession) {
        terminal.current.write(data.output);
      }
    });

    adminSocket.on('command-executed', (data: any) => {
      if (terminal.current && data.sessionId === selectedSession) {
        // Visual indicator for command execution
        terminal.current.write(`\r\n[CMD: ${data.command}]\r\n`);
      }
    });

    setSocket(adminSocket);

    return () => {
      adminSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal for monitoring
    terminal.current = new Terminal({
      cursorBlink: false,
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#00ff00'
      },
      disableStdin: true // Read-only for admin
    });

    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    terminal.current.writeln('=== NEXUS PROTOCOL - Admin Terminal Monitor ===');
    terminal.current.writeln('Select a session to monitor live terminal output\r\n');

    const handleResize = () => {
      fitAddon.current?.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.current?.dispose();
    };
  }, []);

  const monitorSession = (sessionId: string) => {
    if (socket) {
      // Unmonitor previous session
      if (selectedSession) {
        socket.emit('unmonitor-session', selectedSession);
      }

      // Monitor new session
      socket.emit('monitor-session', sessionId);
      setSelectedSession(sessionId);

      // Clear terminal and show monitoring message
      terminal.current?.clear();
      const session = activeSessions.find(s => s.sessionId === sessionId);
      if (session) {
        terminal.current?.writeln(`=== Monitoring: ${session.username}@${session.vmHost} ===\r\n`);
      }
    }
  };

  const stopMonitoring = () => {
    if (socket && selectedSession) {
      socket.emit('unmonitor-session', selectedSession);
      setSelectedSession(null);
      terminal.current?.clear();
      terminal.current?.writeln('=== NEXUS PROTOCOL - Admin Terminal Monitor ===');
      terminal.current?.writeln('Select a session to monitor live terminal output\r\n');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a1a' }}>
      {/* Sidebar */}
      <div style={{ width: '350px', background: '#2d2d2d', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ color: '#fff', marginBottom: '10px' }}>Terminal Monitor</h2>
        <div style={{ 
          padding: '8px', 
          background: connected ? '#1b5e20' : '#b71c1c', 
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#fff',
          fontSize: '12px'
        }}>
          {connected ? '● Connected' : '○ Disconnected'}
        </div>

        <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>
          Active Sessions ({activeSessions.length})
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          {activeSessions.map(session => (
            <div
              key={session.sessionId}
              onClick={() => monitorSession(session.sessionId)}
              style={{
                padding: '12px',
                background: selectedSession === session.sessionId ? '#0066cc' : '#3d3d3d',
                marginBottom: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
                {session.username}@{session.vmHost}
              </div>
              <div style={{ color: '#aaa', fontSize: '11px', marginTop: '4px' }}>
                User: {session.userId}
              </div>
              <div style={{ color: '#aaa', fontSize: '11px' }}>
                Connected: {new Date(session.connectedAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {activeSessions.length === 0 && (
            <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
              No active sessions
            </div>
          )}
        </div>

        {selectedSession && (
          <button
            onClick={stopMonitoring}
            style={{
              width: '100%',
              padding: '10px',
              background: '#d32f2f',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}
          >
            Stop Monitoring
          </button>
        )}

        <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>
          Recent Commands
        </h3>
        
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {commandLogs.map((log, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px',
                background: '#3d3d3d',
                marginBottom: '6px',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            >
              <div style={{ color: '#4caf50', fontFamily: 'monospace' }}>
                $ {log.command}
              </div>
              <div style={{ color: '#999', marginTop: '4px' }}>
                {log.username}@{log.vmHost} • {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {commandLogs.length === 0 && (
            <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
              No commands logged yet
            </div>
          )}
        </div>
      </div>

      {/* Terminal Display */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <div style={{ 
          background: '#2d2d2d', 
          padding: '15px', 
          borderRadius: '8px 8px 0 0',
          borderBottom: '2px solid #0066cc'
        }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>
            {selectedSession 
              ? `Live Terminal - ${activeSessions.find(s => s.sessionId === selectedSession)?.username}@${activeSessions.find(s => s.sessionId === selectedSession)?.vmHost}`
              : 'Live Terminal Monitor'
            }
          </h2>
        </div>
        
        <div
          ref={terminalRef}
          style={{
            flex: 1,
            background: '#0a0a0a',
            borderRadius: '0 0 8px 8px',
            padding: '10px'
          }}
        />
      </div>
    </div>
  );
};

export default TerminalMonitor;
