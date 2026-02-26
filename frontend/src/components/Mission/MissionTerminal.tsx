/**
 * Mission Terminal - Integrated SSH Terminal for Mission UI
 * Combines mission objectives with live VM terminal access
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import { useGame } from '../../context/GameContext';
import 'xterm/css/xterm.css';

interface VMConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

const MissionTerminal: React.FC = () => {
  const { gameState } = useGame();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const socket = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [vmConfig, setVmConfig] = useState<VMConfig>({
    host: '',
    port: 22,
    username: '',
    password: ''
  });
  const [showConfig, setShowConfig] = useState(true);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#00ff00',
        cursor: '#00ff00',
        selection: 'rgba(0, 255, 0, 0.3)'
      },
      rows: 30,
      cols: 100
    });

    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    terminal.current.writeln('╔═══════════════════════════════════════════════════════════════╗');
    terminal.current.writeln('║           NEXUS PROTOCOL - MISSION TERMINAL v3.0             ║');
    terminal.current.writeln('╚═══════════════════════════════════════════════════════════════╝');
    terminal.current.writeln('');
    terminal.current.writeln('Configure VM connection to begin mission...');
    terminal.current.writeln('');

    // Connect to SSH proxy
    socket.current = io(import.meta.env.VITE_SSH_PROXY_URL || 'http://localhost:3002');

    socket.current.on('connect', () => {
      console.log('Connected to SSH proxy');
    });

    socket.current.on('ssh-output', (data: string) => {
      terminal.current?.write(data);
    });

    socket.current.on('ssh-status', (status: { status: string; sessionId?: string }) => {
      if (status.status === 'connected') {
        setConnected(true);
        setShowConfig(false);
        terminal.current?.writeln('\r\n✓ SSH connection established\r\n');
        terminal.current?.writeln('Mission terminal ready. Execute objectives to progress.\r\n');
      } else if (status.status === 'disconnected') {
        setConnected(false);
        terminal.current?.writeln('\r\n✗ SSH connection closed\r\n');
      }
    });

    socket.current.on('ssh-error', (error: { message: string }) => {
      terminal.current?.writeln(`\r\n✗ Error: ${error.message}\r\n`);
    });

    socket.current.on('scoring-event', (data: any) => {
      terminal.current?.writeln(`\r\n[SCORE] +${data.event.points} | ${data.event.description} | Total: ${data.userTotal}\r\n`);
    });

    socket.current.on('admin-hint', (data: { hint: string }) => {
      terminal.current?.writeln(`\r\n[HINT] ${data.hint}\r\n`);
    });

    socket.current.on('admin-kick', (data: { reason: string }) => {
      terminal.current?.writeln(`\r\n[ADMIN] You have been kicked: ${data.reason}\r\n`);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    });

    socket.current.on('admin-broadcast', (data: { message: string; type: string }) => {
      terminal.current?.writeln(`\r\n[BROADCAST] ${data.message}\r\n`);
    });

    // Handle terminal input
    terminal.current.onData((data) => {
      if (connected && socket.current) {
        socket.current.emit('ssh-input', data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current && terminal.current && socket.current) {
        fitAddon.current.fit();
        socket.current.emit('ssh-resize', {
          rows: terminal.current.rows,
          cols: terminal.current.cols
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.current?.disconnect();
      terminal.current?.dispose();
    };
  }, []);

  const handleConnect = () => {
    if (socket.current && vmConfig.host && vmConfig.username && vmConfig.password) {
      terminal.current?.writeln(`Connecting to ${vmConfig.username}@${vmConfig.host}:${vmConfig.port}...`);
      
      const connectionConfig = {
        ...vmConfig,
        userId: localStorage.getItem('userId') || `${gameState.currentTeam}-${gameState.selectedAgent}-${Date.now()}`
      };
      
      // Store userId for future use
      localStorage.setItem('userId', connectionConfig.userId);
      
      socket.current.emit('ssh-connect', connectionConfig);
    } else {
      terminal.current?.writeln('Please fill in all connection details');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      {/* Connection Config Panel */}
      {showConfig && !connected && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '20px',
          borderBottom: '2px solid #00ff00',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ color: '#00ff00', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
            🎯 MISSION VM CONNECTION
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="VM Host (e.g., 192.168.1.100)"
              value={vmConfig.host}
              onChange={(e) => setVmConfig({ ...vmConfig, host: e.target.value })}
              style={{
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #00ff00',
                background: '#0a0a0a',
                color: '#00ff00',
                fontFamily: 'monospace'
              }}
            />
            <input
              type="number"
              placeholder="Port (22)"
              value={vmConfig.port}
              onChange={(e) => setVmConfig({ ...vmConfig, port: parseInt(e.target.value) })}
              style={{
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #00ff00',
                background: '#0a0a0a',
                color: '#00ff00',
                fontFamily: 'monospace'
              }}
            />
            <input
              type="text"
              placeholder="Username"
              value={vmConfig.username}
              onChange={(e) => setVmConfig({ ...vmConfig, username: e.target.value })}
              style={{
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #00ff00',
                background: '#0a0a0a',
                color: '#00ff00',
                fontFamily: 'monospace'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={vmConfig.password}
              onChange={(e) => setVmConfig({ ...vmConfig, password: e.target.value })}
              style={{
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #00ff00',
                background: '#0a0a0a',
                color: '#00ff00',
                fontFamily: 'monospace'
              }}
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={connected}
            style={{
              width: '100%',
              padding: '12px',
              background: connected ? '#555' : '#00ff00',
              color: connected ? '#aaa' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: connected ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {connected ? '● Connected' : '○ Connect to Mission VM'}
          </button>
        </div>
      )}

      {/* Terminal Display */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          padding: '10px',
          overflow: 'hidden'
        }}
      />

      {/* Status Bar */}
      <div style={{
        background: '#1a1a1a',
        padding: '8px 15px',
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <div style={{ color: connected ? '#00ff00' : '#ff0000' }}>
          {connected ? '● CONNECTED' : '○ DISCONNECTED'}
        </div>
        <div style={{ color: '#aaa' }}>
          Mission: {gameState.currentMission?.name || 'None'} | 
          Agent: {gameState.selectedAgent?.toUpperCase() || 'None'} | 
          Team: {gameState.currentTeam || 'None'}
        </div>
        <div style={{ color: '#00ff00' }}>
          NEXUS PROTOCOL v3.0
        </div>
      </div>
    </div>
  );
};

export default MissionTerminal;
