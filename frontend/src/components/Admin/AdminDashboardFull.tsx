import React, { useEffect, useState, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface Player {
  sessionId: string;
  userId: string;
  username: string;
  vmHost: string;
  connectedAt: string;
  lastActivity: string;
  status: string;
}

interface WarFeedEvent {
  type: string;
  userId?: string;
  username?: string;
  message: string;
  timestamp: string;
  points?: number;
  reason?: string;
}

const AdminDashboardFull: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [warFeed, setWarFeed] = useState<WarFeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  
  // Forms
  const [pointsAmount, setPointsAmount] = useState<number>(100);
  const [pointsReason, setPointsReason] = useState<string>('');
  const [hintText, setHintText] = useState<string>('');
  const [kickReason, setKickReason] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Connect to admin namespace
    const adminSocket = io(
      `${import.meta.env.VITE_SSH_PROXY_URL || 'http://localhost:3002'}/admin`
    );

    adminSocket.on('connect', () => {
      console.log('Admin dashboard connected');
      setConnected(true);
      fetchInitialData();
    });

    adminSocket.on('player-list-update', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    adminSocket.on('war-feed-update', (event: WarFeedEvent) => {
      setWarFeed(prev => [event, ...prev].slice(0, 100));
    });

    adminSocket.on('terminal-output', (data: any) => {
      if (terminal.current && selectedPlayer && data.sessionId === selectedPlayer.sessionId) {
        terminal.current.write(data.output);
      }
    });

    setSocket(adminSocket);

    return () => {
      adminSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    terminal.current = new Terminal({
      cursorBlink: false,
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#00ff00'
      },
      disableStdin: true
    });

    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    terminal.current.writeln('=== ADMIN TERMINAL MONITOR ===');
    terminal.current.writeln('Select a player to monitor their terminal\r\n');

    return () => {
      terminal.current?.dispose();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const playersRes = await fetch('http://localhost:3002/api/admin/players');
      const playersData = await playersRes.json();
      if (playersData.success) {
        setPlayers(playersData.players);
      }

      const feedRes = await fetch('http://localhost:3002/api/admin/war-feed');
      const feedData = await feedRes.json();
      if (feedData.success) {
        setWarFeed(feedData.feed);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const monitorPlayer = (player: Player) => {
    if (socket) {
      if (selectedPlayer) {
        socket.emit('unmonitor-session', selectedPlayer.sessionId);
      }

      socket.emit('monitor-session', player.sessionId);
      setSelectedPlayer(player);

      terminal.current?.clear();
      terminal.current?.writeln(`=== Monitoring: ${player.username}@${player.vmHost} ===\r\n`);
    }
  };

  const awardPoints = async () => {
    if (!selectedPlayer) return;

    try {
      const res = await fetch('http://localhost:3002/api/admin/award-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedPlayer.userId,
          points: pointsAmount,
          reason: pointsReason || 'Admin awarded points'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Awarded ${pointsAmount} points! New total: ${data.newTotal} (${data.rank})`);
        setPointsReason('');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to award points');
    }
  };

  const sendHint = async () => {
    if (!selectedPlayer || !hintText) return;

    try {
      const res = await fetch('http://localhost:3002/api/admin/send-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedPlayer.userId,
          hint: hintText
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Hint sent!');
        setHintText('');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to send hint');
    }
  };

  const kickPlayer = async () => {
    if (!selectedPlayer) return;
    if (!confirm(`Kick ${selectedPlayer.username}?`)) return;

    try {
      const res = await fetch('http://localhost:3002/api/admin/kick-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedPlayer.userId,
          reason: kickReason || 'Kicked by admin'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Player kicked!');
        setSelectedPlayer(null);
        setKickReason('');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to kick player');
    }
  };

  const resetVM = async () => {
    if (!selectedPlayer) return;
    if (!confirm(`Reset VM for ${selectedPlayer.username}? This will restore to snapshot.`)) return;

    try {
      const res = await fetch('http://localhost:3002/api/admin/reset-vm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedPlayer.userId
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`VM reset! (${data.vmName} → ${data.snapshot})`);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to reset VM');
    }
  };

  const broadcast = async () => {
    if (!broadcastMessage) return;

    try {
      const res = await fetch('http://localhost:3002/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage,
          type: 'info'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Message broadcast!');
        setBroadcastMessage('');
      }
    } catch (error) {
      alert('Failed to broadcast');
    }
  };

  const getEventIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      player_connected: '🟢',
      player_disconnected: '🔴',
      points_awarded: '⭐',
      hint_sent: '💡',
      player_kicked: '🚫',
      vm_reset: '🔄',
      admin_broadcast: '📢'
    };
    return icons[type] || '📝';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', color: '#fff' }}>
      {/* Sidebar - Players */}
      <div style={{ width: '300px', background: '#1a1a1a', padding: '20px', overflowY: 'auto', borderRight: '2px solid #333' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '10px', fontSize: '18px' }}>
          👥 ACTIVE PLAYERS
        </h2>
        <div style={{ 
          padding: '8px', 
          background: connected ? '#1b5e20' : '#b71c1c', 
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '12px'
        }}>
          {connected ? '● CONNECTED' : '○ DISCONNECTED'}
        </div>

        <div style={{ marginBottom: '20px' }}>
          {players.map(player => (
            <div
              key={player.sessionId}
              onClick={() => monitorPlayer(player)}
              style={{
                padding: '12px',
                background: selectedPlayer?.sessionId === player.sessionId ? '#0066cc' : '#2d2d2d',
                marginBottom: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid #444'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#00ff00' }}>
                {player.username}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                {player.vmHost}
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                {new Date(player.connectedAt).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {players.length === 0 && (
            <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
              No active players
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ 
          background: '#1a1a1a', 
          padding: '20px', 
          borderBottom: '2px solid #00ff00'
        }}>
          <h1 style={{ margin: 0, color: '#00ff00', fontSize: '24px' }}>
            🎮 NEXUS PROTOCOL - ADMIN DASHBOARD
          </h1>
          {selectedPlayer && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#aaa' }}>
              Monitoring: <span style={{ color: '#00ff00' }}>{selectedPlayer.username}@{selectedPlayer.vmHost}</span>
            </div>
          )}
        </div>

        {/* Control Panel */}
        {selectedPlayer && (
          <div style={{ 
            background: '#1a1a1a', 
            padding: '15px', 
            borderBottom: '1px solid #333',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {/* Award Points */}
            <div style={{ background: '#2d2d2d', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#00ff00', marginBottom: '8px', fontWeight: 'bold' }}>
                ⭐ AWARD POINTS
              </div>
              <input
                type="number"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(parseInt(e.target.value))}
                style={{ width: '100%', padding: '6px', marginBottom: '6px', background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              />
              <input
                type="text"
                placeholder="Reason"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                style={{ width: '100%', padding: '6px', marginBottom: '6px', background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              />
              <button onClick={awardPoints} style={{ width: '100%', padding: '8px', background: '#00ff00', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Award
              </button>
            </div>

            {/* Send Hint */}
            <div style={{ background: '#2d2d2d', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#ffaa00', marginBottom: '8px', fontWeight: 'bold' }}>
                💡 SEND HINT
              </div>
              <textarea
                placeholder="Hint message"
                value={hintText}
                onChange={(e) => setHintText(e.target.value)}
                style={{ width: '100%', padding: '6px', marginBottom: '6px', background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '4px', minHeight: '60px', resize: 'vertical' }}
              />
              <button onClick={sendHint} style={{ width: '100%', padding: '8px', background: '#ffaa00', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Send Hint
              </button>
            </div>

            {/* VM Reset */}
            <div style={{ background: '#2d2d2d', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#0066cc', marginBottom: '8px', fontWeight: 'bold' }}>
                🔄 VM CONTROL
              </div>
              <button onClick={resetVM} style={{ width: '100%', padding: '8px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '6px' }}>
                Reset VM (Snapshot)
              </button>
              <button onClick={kickPlayer} style={{ width: '100%', padding: '8px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Kick Player
              </button>
            </div>

            {/* Broadcast */}
            <div style={{ background: '#2d2d2d', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#ff00ff', marginBottom: '8px', fontWeight: 'bold' }}>
                📢 BROADCAST
              </div>
              <input
                type="text"
                placeholder="Message to all players"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                style={{ width: '100%', padding: '6px', marginBottom: '6px', background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              />
              <button onClick={broadcast} style={{ width: '100%', padding: '8px', background: '#ff00ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Broadcast
              </button>
            </div>
          </div>
        )}

        {/* Terminal and War Feed */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* Terminal */}
          <div style={{ flex: 1, padding: '20px' }}>
            <div
              ref={terminalRef}
              style={{
                height: '100%',
                background: '#0a0a0a',
                borderRadius: '8px',
                padding: '10px',
                border: '2px solid #00ff00'
              }}
            />
          </div>

          {/* War Feed */}
          <div style={{ width: '350px', background: '#1a1a1a', padding: '20px', overflowY: 'auto', borderLeft: '2px solid #333' }}>
            <h3 style={{ color: '#ff0000', marginBottom: '15px', fontSize: '16px' }}>
              ⚔️ WAR FEED
            </h3>
            {warFeed.map((event, idx) => (
              <div
                key={idx}
                style={{
                  background: '#2d2d2d',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  border: '1px solid #444',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', marginRight: '8px' }}>
                    {getEventIcon(event.type)}
                  </span>
                  <span style={{ color: '#aaa', fontSize: '10px' }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ color: '#fff' }}>
                  {event.message}
                </div>
              </div>
            ))}

            {warFeed.length === 0 && (
              <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                No events yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardFull;
