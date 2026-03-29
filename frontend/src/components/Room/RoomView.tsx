import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LogEntry {
  time: string;
  method: string;
  path: string;
  body: string;
  ip: string;
  status: string;
  raw: string;
}

interface PatchState {
  [key: string]: boolean;
}

const VULNS = [
  { id: 'sqli_login',        label: 'V1 — SQL Injection',           level: 'beginner'     },
  { id: 'stored_xss',        label: 'V2 — Stored XSS',              level: 'beginner'     },
  { id: 'default_creds',     label: 'V3 — Default Credentials',     level: 'beginner'     },
  { id: 'dir_traversal',     label: 'V4 — Directory Traversal',     level: 'beginner'     },
  { id: 'data_exposure',     label: 'V5 — Sensitive Data Exposure', level: 'beginner'     },
  { id: 'hardcoded_admin',   label: 'V6 — Hardcoded Admin Login',   level: 'beginner'     },
  { id: 'doc_upload_bypass', label: 'V7 — Unrestricted File Upload',level: 'beginner'     },
  { id: 'jwt_alg_none',      label: 'V11 — JWT alg:none',           level: 'intermediate' },
  { id: 'idor',              label: 'V12 — IDOR',                   level: 'intermediate' },
  { id: 'cmd_injection',     label: 'V13 — Command Injection',      level: 'intermediate' },
];

export default function RoomView() {
  const { gameState } = useGame();
  const location = useLocation();
  const state = location.state as { roomId?: string; seat?: string } | null;

  const roomId = state?.roomId || '';
  const seat = state?.seat || '';

  const isRed = seat.startsWith('red');
  const isBlue = seat.startsWith('blue');

  const [socket, setSocket] = useState<Socket | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [patches, setPatches] = useState<PatchState>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize Socket.io connection for the room
  useEffect(() => {
    if (!roomId || !seat || !gameState.sessionToken) {
      setError('Missing room context. Please join from the Lobby.');
      return;
    }

    const newSocket = io(API_BASE, {
      auth: { token: gameState.sessionToken }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join-room', { roomId, seat }, (res: any) => {
        if (!res.success) {
          setError(res.message);
        }
      });
    });

    newSocket.on('connect_error', (err) => {
      setError(`Socket connection error: ${err.message}`);
    });

    // Real-time events
    newSocket.on('room-user-joined', (data) => {
      console.log('Player joined:', data);
    });

    newSocket.on('vulnerability-detected', (data) => {
      // Received by Blue
      setLogs(prev => [...prev, {
        time: data.timestamp,
        team: data.teamName,
        vulnerability: data.vulnerability,
        type: 'ATTACK_VULNERABILITY'
      }].slice(-100));
    });

    newSocket.on('attack-logged', (data) => {
      // Received by Red
      setLogs(prev => [...prev, {
        time: data.timestamp,
        team: data.teamName,
        vulnerability: data.vulnerability,
        type: 'ATTACK_SENT'
      }].slice(-100));
    });

    newSocket.on('patch-successful', (data) => {
      // Received by everyone
      setPatches(prev => ({ ...prev, [data.patchData.vuln_id]: data.patchData.enabled }));
      setLogs(prev => [...prev, {
        time: data.timestamp,
        team: data.teamName,
        vulnerability: data.patchData.vuln_id,
        status: data.patchData.enabled ? 'PATCHED' : 'UNPATCHED',
        type: 'SYSTEM_PATCH'
      }].slice(-100));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, seat, gameState.sessionToken]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Red Team action
  const launchAttack = (vulnerability: string) => {
    if (socket && connected) {
      socket.emit('red-attack', { roomId, vulnerability });
    }
  };

  // Blue Team action
  const togglePatch = (vulnId: string, current: boolean) => {
    if (socket && connected) {
      socket.emit('blue-patch', { 
        roomId, 
        patchData: { vuln_id: vulnId, enabled: !current, name: vulnId } 
      });
    }
  };

  if (error || !roomId) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono text-red-500 p-4 text-center">
      {error || 'Invalid Room State.'}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-cyan-500 font-mono p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-cyan-900/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-cyan-100 uppercase">
            ROOM: {roomId}
          </h1>
          <p className="text-xs text-cyan-600 mt-1">
            <span className={`px-2 py-0.5 rounded border text-xs font-bold uppercase ${
              isRed ? 'border-red-700 text-red-400 bg-red-900/20' : 'border-blue-700 text-blue-400 bg-blue-900/20'
            }`}>
              SEAT: {seat}
            </span>
          </p>
        </div>
        <div className="text-xs flex items-center gap-2">
          {connected ? (
             <span className="text-green-500 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> ONLINE</span>
          ) : (
             <span className="text-red-500 flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> OFFLINE</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT — Attack Log / Event Feed */}
        <div className="bg-cyan-950/10 border border-cyan-900/50 rounded-lg flex flex-col" style={{ height: '75vh' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/50">
            <span className="text-sm font-bold text-cyan-100 tracking-widest">
              {isRed ? 'YOUR ATTACK LOG' : 'SYSTEM VULNERABILITY LOG'}
            </span>
            <span className="text-xs text-cyan-600 animate-pulse">◉ LIVE FEED</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs font-mono">
            {logs.length === 0 && (
              <div className="text-cyan-800 italic text-center mt-8">Awaiting events...</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`p-2 rounded border ${
                log.type === 'ATTACK_VULNERABILITY' ? 'bg-red-950/20 border-red-900/30 text-red-400' :
                log.type === 'ATTACK_SENT' ? 'bg-red-900/10 border-red-900/50 text-red-300' :
                log.type === 'SYSTEM_PATCH' && log.status === 'PATCHED' ? 'bg-green-950/20 border-green-900/30 text-green-400' :
                'bg-cyan-950/20 border-cyan-900/30 text-cyan-400'
              }`}>
                <div className="flex justify-between text-[10px] opacity-70 mb-1">
                  <span>{new Date(log.time).toLocaleTimeString()}</span>
                  <span>[{log.team}]</span>
                </div>
                <div className="font-bold">
                  {log.type === 'SYSTEM_PATCH' ? `Configuration Updated: ${log.vulnerability} is now ${log.status}` : 
                   isRed ? `Attack Executed: ${log.vulnerability}` : `Vulnerability Detected: ${log.vulnerability}`}
                </div>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* RIGHT — Red: Launch Attacks | Blue: Patch Controls */}
        <div className="space-y-4">
          {/* RED TEAM DASHBOARD */}
          {isRed && (
            <div className="bg-red-950/10 border border-red-900/50 rounded-lg p-5 flex flex-col h-full">
              <h2 className="text-sm font-bold text-red-400 tracking-widest mb-4">ATTACK VECTORS</h2>
              <p className="text-xs text-red-500/70 mb-4">
                Deploy exploits to the target. Blue Team will receive telemetry and attempt to patch.
              </p>
              <div className="space-y-2 overflow-y-auto pr-2">
                {VULNS.map(v => {
                  const isPatched = !!patches[v.id];
                  return (
                    <div key={v.id} className={`flex items-center justify-between py-2 border-b transition-colors ${isPatched ? 'border-green-900/30 opacity-50' : 'border-red-900/20 hover:bg-red-900/10'}`}>
                      <div>
                        <span className={`text-xs ${isPatched ? 'text-green-500 line-through' : 'text-red-200'}`}>{v.label}</span>
                      </div>
                      <button
                        disabled={isPatched}
                        onClick={() => launchAttack(v.id)}
                        className={`px-3 py-1 text-[10px] font-bold rounded border transition-colors ${
                          isPatched
                            ? 'border-green-900 text-green-700 cursor-not-allowed'
                            : 'border-red-700 text-red-400 hover:bg-red-900/40 hover:text-red-100'
                        }`}
                      >
                        {isPatched ? 'SYSTEM SECURED' : 'INITIATE EXPLOIT'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BLUE TEAM DASHBOARD */}
          {isBlue && (
            <div className="bg-blue-950/10 border border-blue-900/50 rounded-lg p-5 flex flex-col h-full">
              <h2 className="text-sm font-bold text-blue-400 tracking-widest mb-4">PATCH MANAGEMENT</h2>
              <p className="text-xs text-blue-500/70 mb-4">
                Toggle patches to defend against incoming Red Team exploits. Active patches will block the vulnerability.
              </p>
              <div className="space-y-2 overflow-y-auto pr-2">
                {VULNS.map(v => {
                  const patched = !!patches[v.id];
                  return (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors">
                      <div>
                        <span className="text-xs text-blue-200">{v.label}</span>
                      </div>
                      <button
                        onClick={() => togglePatch(v.id, patched)}
                        className={`px-3 py-1 text-[10px] font-bold rounded border transition-colors ${
                          patched
                            ? 'border-green-500 text-green-400 bg-green-900/20 hover:bg-green-900/40 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                            : 'border-red-900 text-red-500 hover:bg-red-900/20'
                        }`}
                      >
                        {patched ? 'ACTIVE PATCH' : 'VULNERABLE'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
