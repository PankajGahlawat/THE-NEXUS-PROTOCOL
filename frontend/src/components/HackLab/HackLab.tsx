import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import { useGame } from '../../context/GameContext';
import 'xterm/css/xterm.css';
import './HackLab.css';

export default function HackLab() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { gameState } = useGame();

  const targetUrl = searchParams.get('target') || 'http://localhost:7007';
  const roundName = searchParams.get('round') || 'NEXUSCORE';

  // State
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  // Round 1 branches = 45 min, Round 2 NEXUSCORE = 60 min
  const isRound2 = roundName.toUpperCase() === 'NEXUSCORE';
  const totalSeconds = isRound2 ? 60 * 60 : 45 * 60;
  const [remaining, setRemaining] = useState(totalSeconds);

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const inputBuffer = useRef('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const timerUrgent = remaining < 300; // under 5 min

  // Initialize terminal + WebSocket
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create xterm
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'underline',
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
      lineHeight: 1.3,
      theme: {
        background: '#0d0d15',
        foreground: '#c0c0d0',
        cursor: '#8b5cf6',
        cursorAccent: '#0d0d15',
        selectionBackground: 'rgba(139,92,246,0.3)',
        black: '#1a1a2e',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#22d3ee',
        white: '#e0e0f0',
        brightBlack: '#606070',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#a78bfa',
        brightCyan: '#67e8f9',
        brightWhite: '#f0f0ff',
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket using the session token from GameContext
    const token = gameState.sessionToken || '';
    const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const socket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);

      // Spawn terminal session
      socket.emit('terminal:spawn', { targetUrl }, (response: { success: boolean; sessionId?: string; error?: string }) => {
        if (response.success && response.sessionId) {
          setSessionId(response.sessionId);
          sessionIdRef.current = response.sessionId;
        } else {
          term.writeln(`\x1b[31mFailed to spawn terminal: ${response.error}\x1b[0m`);
        }
      });
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connect error:', error.message);
      term.writeln(`\r\n\x1b[31m⚠ Terminal auth failed: ${error.message}\x1b[0m`);
      term.writeln('\x1b[33m  Ensure you are logged in before opening HackLab.\x1b[0m');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      term.writeln('\r\n\x1b[31m⚠ Connection lost. Reconnecting...\x1b[0m');
    });

    socket.on('terminal:output', (data: { sessionId: string; data: string }) => {
      // Replace \n with \r\n for proper xterm rendering
      const output = data.data.replace(/(?<!\r)\n/g, '\r\n');
      term.write(output);
    });

    // Handle keyboard input
    term.onData((data) => {
      const sid = sessionIdRef.current;
      if (!sid || !socket.connected) return;

      // Handle special keys
      if (data === '\r') {
        // Enter — send command
        term.write('\r\n');
        const command = inputBuffer.current;
        inputBuffer.current = '';
        socket.emit('terminal:input', { sessionId: sid, command });
      } else if (data === '\x7f' || data === '\b') {
        // Backspace
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\x03') {
        // Ctrl+C
        inputBuffer.current = '';
        term.write('^C\r\n');
        const prompt = `\x1b[1;32m${roundName.toLowerCase()}@nexus\x1b[0m:\x1b[1;34m~\x1b[0m$ `;
        term.write(prompt);
      } else if (data === '\x0c') {
        // Ctrl+L — clear
        term.clear();
        const prompt = `\x1b[1;32m${roundName.toLowerCase()}@nexus\x1b[0m:\x1b[1;34m~\x1b[0m$ `;
        term.write(prompt);
      } else if (data === '\t') {
        // Tab — autocomplete hint
        term.write('\x07'); // bell
      } else if (data >= ' ' || data === '\x1b') {
        // Printable characters and escape sequences
        if (data >= ' ') {
          inputBuffer.current += data;
          term.write(data);
        }
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        try { fitAddonRef.current.fit(); } catch { /* ignore */ }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sessionIdRef.current) {
        socket.emit('terminal:kill', { sessionId: sessionIdRef.current });
      }
      socket.disconnect();
      term.dispose();
    };
  }, [targetUrl, roundName, gameState.sessionToken]);

  // Re-fit terminal when split changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (fitAddonRef.current) {
        try { fitAddonRef.current.fit(); } catch { /* ignore */ }
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [splitPercent]);

  // Drag resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(percent, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="hacklab">
      {/* Top Toolbar */}
      <div className="hacklab-toolbar">
        <div className="hacklab-toolbar-left">
          <button className="hacklab-back-btn" onClick={() => navigate('/mission-briefing')}>
            ◂ MISSION BRIEFING
          </button>
          <span className="hacklab-round-badge">{roundName}</span>
          <div className="hacklab-target-info">
            <span>TARGET:</span>
            <span className="hacklab-target-url">{targetUrl}</span>
          </div>
        </div>
        <div className="hacklab-toolbar-right">
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: timerUrgent ? '#ef4444' : remaining < 600 ? '#f59e0b' : '#22c55e' }}>
            ⏱ {formatTime(remaining)}
          </span>
          <span className={`hacklab-status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span className="hacklab-status-text">
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Split Container */}
      <div className="hacklab-container" ref={containerRef}>
        {/* Left Pane — Website */}
        <div className="hacklab-website-pane" style={{ width: `${splitPercent}%` }}>
          <div className="hacklab-iframe-wrapper">
            <iframe
              className="hacklab-iframe"
              src={targetUrl}
              title={`${roundName} Target`}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className={`hacklab-resize-handle ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
        />

        {/* Right Pane — Terminal */}
        <div className="hacklab-terminal-pane" style={{ width: `${100 - splitPercent}%` }}>
          <div className="hacklab-terminal-header">
            <div className="hacklab-terminal-title">
              <span style={{ fontSize: '0.75rem' }}>⬤</span>
              NEXUS TERMINAL
            </div>
            <div className="hacklab-terminal-actions">
              <button
                className="hacklab-terminal-action-btn"
                title="Clear terminal"
                onClick={() => terminalInstance.current?.clear()}
              >⌫</button>
              <button
                className="hacklab-terminal-action-btn"
                title="New session"
                onClick={() => {
                  if (socketRef.current?.connected) {
                    if (sessionIdRef.current) {
                      socketRef.current.emit('terminal:kill', { sessionId: sessionIdRef.current });
                    }
                    socketRef.current.emit('terminal:spawn', { targetUrl },
                      (response: { success: boolean; sessionId?: string }) => {
                        if (response.success && response.sessionId) {
                          setSessionId(response.sessionId);
                          sessionIdRef.current = response.sessionId;
                          terminalInstance.current?.clear();
                        }
                      }
                    );
                  }
                }}
              >⟳</button>
            </div>
          </div>
          <div className="hacklab-terminal-wrapper" ref={terminalRef} />
        </div>

        {/* Drag overlay */}
        {isDragging && <div className="hacklab-drag-overlay" />}
      </div>

      {/* Bottom Status Bar */}
      <div className="hacklab-statusbar">
        <div className="hacklab-statusbar-left">
          <div className="hacklab-statusbar-item">
            <span className="hacklab-statusbar-label">SESSION:</span>
            <span className={`hacklab-statusbar-value ${sessionId ? 'active' : ''}`}>
              {sessionId ? sessionId.slice(0, 16) : 'none'}
            </span>
          </div>
          <div className="hacklab-statusbar-item">
            <span className="hacklab-statusbar-label">PROTOCOL:</span>
            <span className="hacklab-statusbar-value active">WebSocket</span>
          </div>
        </div>
        <div className="hacklab-statusbar-right">
          <div className="hacklab-statusbar-item">
            <span className="hacklab-statusbar-label">TARGET:</span>
            <span className="hacklab-statusbar-value active">{roundName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
