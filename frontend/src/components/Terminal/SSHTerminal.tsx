import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

const SSHTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const socket = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<SSHConfig>({
    host: '',
    port: 22,
    username: '',
    password: ''
  });

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4'
      }
    });

    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    // Connect to SSH proxy
    socket.current = io(import.meta.env.VITE_SSH_PROXY_URL || 'http://localhost:3002');

    socket.current.on('connect', () => {
      terminal.current?.writeln('Connected to SSH proxy...');
    });

    socket.current.on('ssh-output', (data: string) => {
      terminal.current?.write(data);
    });

    socket.current.on('ssh-status', (status: { status: string }) => {
      if (status.status === 'connected') {
        setConnected(true);
        terminal.current?.writeln('\r\n✓ SSH connection established\r\n');
      } else if (status.status === 'disconnected') {
        setConnected(false);
        terminal.current?.writeln('\r\n✗ SSH connection closed\r\n');
      }
    });

    socket.current.on('ssh-error', (error: { message: string }) => {
      terminal.current?.writeln(`\r\n✗ Error: ${error.message}\r\n`);
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
    if (socket.current && config.host && config.username && config.password) {
      terminal.current?.writeln(`Connecting to ${config.username}@${config.host}:${config.port}...`);
      
      // Include userId for tracking
      const connectionConfig = {
        ...config,
        userId: localStorage.getItem('userId') || `user-${Date.now()}`
      };
      
      socket.current.emit('ssh-connect', connectionConfig);
    } else {
      terminal.current?.writeln('Please fill in all connection details');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      <div style={{ marginBottom: '20px', background: '#2d2d2d', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ color: '#fff', marginBottom: '15px' }}>SSH Terminal - NEXUS PROTOCOL</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Host (e.g., 192.168.1.100)"
            value={config.host}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#1e1e1e', color: '#fff' }}
          />
          <input
            type="number"
            placeholder="Port"
            value={config.port}
            onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#1e1e1e', color: '#fff' }}
          />
          <input
            type="text"
            placeholder="Username"
            value={config.username}
            onChange={(e) => setConfig({ ...config, username: e.target.value })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#1e1e1e', color: '#fff' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={config.password}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#1e1e1e', color: '#fff' }}
          />
        </div>
        <button
          onClick={handleConnect}
          disabled={connected}
          style={{
            padding: '10px 20px',
            background: connected ? '#555' : '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: connected ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {connected ? 'Connected' : 'Connect'}
        </button>
        <span style={{ marginLeft: '15px', color: connected ? '#4caf50' : '#999' }}>
          {connected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          background: '#1e1e1e',
          borderRadius: '8px',
          padding: '10px'
        }}
      />
    </div>
  );
};

export default SSHTerminal;
