import React, { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';
import { useAudio } from '../../context/AudioContext';

interface ActivityLog { type: string; team: string; mission: string; agent: string; data: any; timestamp: string; }
interface LeaderboardEntry { rank: number; teamName: string; score: number; missionsCompleted: number; averageScore: number; lastActive: string; }

const AdminDashboard: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminCode, setAdminCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'leaderboard' | 'teams' | 'controls' | 'rooms'>('activity');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [teams, setTeams] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', code: '', type: 'red' });
    const [newRoom, setNewRoom] = useState({ name: '', redTeam: '', blueTeam: '' });
    const [createError, setCreateError] = useState('');
    const [createRoomError, setCreateRoomError] = useState('');
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const adminCodeRef = useRef(adminCode);
    useEffect(() => { adminCodeRef.current = adminCode; }, [adminCode]);
    const { setVolume } = useAudio();
    useEffect(() => { setVolume(0); return () => { setVolume(0.6); }; }, []);

    const checkAdminAuth = async (retryCount = 0) => {
        if (retryCount === 0) { setLoading(true); setError(null); }
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/activity?limit=1`, {
                headers: { 'Authorization': `Bearer ${adminCode}` }
            });
            if (response.ok) { setIsAuthenticated(true); fetchData(); setLoading(false); }
            else { setError('Invalid Admin Code'); setLoading(false); }
        } catch (err) {
            if (retryCount < 10) { setTimeout(() => checkAdminAuth(retryCount + 1), 3000); }
            else { setError('Failed to connect to server.'); setLoading(false); }
        }
    };

    const sendBroadcast = async () => {
        if (!broadcastMessage) return;
        try {
            await fetch(`${API_BASE}/api/v1/admin/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCodeRef.current}` },
                body: JSON.stringify({ message: broadcastMessage })
            });
            setBroadcastMessage(''); alert('Broadcast Sent');
        } catch (e) { console.error(e); }
    };

    const resetSystem = async () => {
        if (!confirm('WARNING: THIS WILL RESET ALL GAME DATA. CONTINUE?')) return;
        try {
            await fetch(`${API_BASE}/api/v1/admin/reset`, { method: 'POST', headers: { 'Authorization': `Bearer ${adminCodeRef.current}` } });
            window.location.reload();
        } catch (e) { console.error(e); }
    };

    const kickTeam = async (teamName: string) => {
        if (!confirm(`KICK team ${teamName}?`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/v1/admin/team/kick`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCodeRef.current}` },
                body: JSON.stringify({ teamName })
            });
            const data = await res.json();
            if (data.success) { alert(`Team ${teamName} kicked.`); fetchData(); } else alert(`Failed: ${data.message}`);
        } catch (e) { alert('Connection error.'); }
    };

    const resetTeam = async (teamName: string) => {
        if (!confirm(`RESET score for team ${teamName}?`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/v1/admin/team/reset`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCodeRef.current}` },
                body: JSON.stringify({ teamName })
            });
            const data = await res.json();
            if (data.success) { alert(`Team ${teamName} reset.`); fetchData(); } else alert(`Failed: ${data.message}`);
        } catch (e) { alert('Connection error.'); }
    };

    const deleteTeam = async (teamName: string) => {
        if (!confirm(`DELETE team ${teamName}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/v1/admin/team`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCodeRef.current}` },
                body: JSON.stringify({ teamName })
            });
            const data = await res.json();
            if (data.success) { alert(`Team ${teamName} deleted.`); fetchData(); }
            else alert(`Failed: ${data.message}`);
        } catch (e) { alert('Connection error.'); }
    };

    const createTeam = async () => {
        setCreateError('');
        if (!newTeam.name.trim() || !newTeam.code.trim()) { setCreateError('Name and code required.'); return; }
        try {
            const res = await fetch(`${API_BASE}/api/v1/admin/team/create`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCodeRef.current}` },
                body: JSON.stringify({ teamName: newTeam.name.trim(), accessCode: newTeam.code.trim(), teamType: newTeam.type })
            });
            const data = await res.json();
            if (data.success) { setNewTeam({ name: '', code: '', type: 'red' }); setShowCreateTeam(false); fetchData(); }
            else setCreateError(data.message || 'Failed.');
        } catch (e) { setCreateError('Connection error.'); }
    };

    const createRoom = async () => {
        setCreateRoomError('');
        if (!newRoom.name.trim() || !newRoom.redTeam || !newRoom.blueTeam) { setCreateRoomError('All fields required.'); return; }
        if (newRoom.redTeam === newRoom.blueTeam) { setCreateRoomError('Red and blue must be different.'); return; }
        try {
            const res = await fetch(`${API_BASE}/api/v1/admin/rooms`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCodeRef.current}` },
                body: JSON.stringify({ roomName: newRoom.name.trim(), redTeamName: newRoom.redTeam, blueTeamName: newRoom.blueTeam })
            });
            const data = await res.json();
            if (data.success) { setNewRoom({ name: '', redTeam: '', blueTeam: '' }); setShowCreateRoom(false); fetchData(); }
            else setCreateRoomError(data.message || 'Failed.');
        } catch (e) { setCreateRoomError('Connection error.'); }
    };

    const deleteRoom = async (id: string) => {
        if (!confirm('Delete this room?')) return;
        try {
            await fetch(`${API_BASE}/api/v1/admin/rooms/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminCodeRef.current}` } });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const fetchData = async () => {
        const code = adminCodeRef.current;
        if (!code) return;
        try {
            const [actRes, lbRes, teamsRes, roomsRes] = await Promise.all([
                fetch(`${API_BASE}/api/v1/admin/activity?limit=50`, { headers: { 'Authorization': `Bearer ${code}` } }),
                fetch(`${API_BASE}/api/v1/admin/leaderboard?limit=100`, { headers: { 'Authorization': `Bearer ${code}` } }),
                fetch(`${API_BASE}/api/v1/admin/teams`, { headers: { 'Authorization': `Bearer ${code}` } }),
                fetch(`${API_BASE}/api/v1/admin/rooms`, { headers: { 'Authorization': `Bearer ${code}` } }),
            ]);
            const [actData, lbData, teamsData, roomsData] = await Promise.all([actRes.json(), lbRes.json(), teamsRes.json(), roomsRes.json()]);
            if (actData.success) setActivityLogs(actData.data);
            if (lbData.success) setLeaderboard(lbData.data);
            if (teamsData.success) setTeams(teamsData.data);
            if (roomsData.success) setRooms(roomsData.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isAuthenticated) { fetchData(); interval = setInterval(fetchData, 5000); }
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-cyan-500 font-mono flex items-center justify-center">
                <div className="border border-cyan-500/30 p-8 rounded-lg max-w-md w-full bg-black/90">
                    <h1 className="text-2xl font-bold mb-6 text-center tracking-wider">SYSTEM ADMIN ACCESS</h1>
                    {error && <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 mb-4 text-sm">{error}</div>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest mb-2 text-cyan-400/70">Access Code</label>
                            <input type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && checkAdminAuth(0)}
                                className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-cyan-100 focus:outline-none focus:border-cyan-400"
                                placeholder="ENTER CODE" />
                        </div>
                        <button onClick={() => checkAdminAuth(0)} disabled={loading}
                            className="w-full bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/50 py-3 px-4 rounded transition-all disabled:opacity-50">
                            {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-cyan-500 font-mono p-6">
            <header className="flex justify-between items-center mb-8 border-b border-cyan-900/50 pb-4">
                <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                    NEXUS // ADMIN_DASHBOARD
                </h1>
                <div className="flex gap-2 flex-wrap">
                    {(['activity', 'leaderboard', 'teams', 'rooms', 'controls'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 border text-xs font-bold tracking-widest ${activeTab === tab ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100' : 'border-transparent text-cyan-600 hover:text-cyan-400'}`}>
                            {tab.toUpperCase()}
                        </button>
                    ))}
                    <button onClick={() => setIsAuthenticated(false)}
                        className="px-4 py-2 text-red-500 hover:text-red-400 border border-red-900/30 hover:border-red-500/30 ml-2 text-xs font-bold tracking-widest">
                        LOGOUT
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">

                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl text-cyan-100">LIVE ACTIVITY</h2>
                            <span className="text-xs text-cyan-600 animate-pulse">LIVE</span>
                        </div>
                        <div className="bg-cyan-950/10 border border-cyan-900/50 rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-cyan-950/20 text-cyan-400 text-xs uppercase tracking-wider">
                                    <tr><th className="p-4">Time</th><th className="p-4">Team</th><th className="p-4">Event</th><th className="p-4">Details</th></tr>
                                </thead>
                                <tbody className="divide-y divide-cyan-900/30">
                                    {activityLogs.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-cyan-700 italic">No recent activity</td></tr>
                                    ) : activityLogs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-cyan-500/5">
                                            <td className="p-4 text-cyan-600 font-mono text-sm">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                            <td className="p-4 font-bold text-cyan-300">{log.team}</td>
                                            <td className="p-4"><span className="px-2 py-1 rounded text-xs font-bold bg-gray-800 text-gray-400">{log.type.replace(/_/g, ' ').toUpperCase()}</span></td>
                                            <td className="p-4 text-cyan-400/80 text-sm">{JSON.stringify(log.data)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-4">
                        <h2 className="text-xl text-cyan-100 mb-4">LEADERBOARD</h2>
                        <div className="bg-cyan-950/10 border border-cyan-900/50 rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-cyan-950/20 text-cyan-400 text-xs uppercase tracking-wider">
                                    <tr><th className="p-4 text-center w-16">Rank</th><th className="p-4">Team</th><th className="p-4 text-right">Missions</th><th className="p-4 text-right">Avg</th><th className="p-4 text-right">Score</th></tr>
                                </thead>
                                <tbody className="divide-y divide-cyan-900/30">
                                    {leaderboard.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-cyan-700 italic">No teams ranked yet</td></tr>
                                    ) : leaderboard.map((entry) => (
                                        <tr key={entry.teamName} className="hover:bg-cyan-500/5">
                                            <td className="p-4 text-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold ${entry.rank === 1 ? 'bg-yellow-500 text-black' : entry.rank === 2 ? 'bg-gray-400 text-black' : entry.rank === 3 ? 'bg-orange-700 text-white' : 'bg-cyan-900/50 text-cyan-500'}`}>{entry.rank}</div>
                                            </td>
                                            <td className="p-4 font-bold text-cyan-100">{entry.teamName}</td>
                                            <td className="p-4 text-right text-cyan-400">{entry.missionsCompleted}</td>
                                            <td className="p-4 text-right text-cyan-400 font-mono">{entry.averageScore}</td>
                                            <td className="p-4 text-right text-xl font-bold font-mono text-cyan-300">{entry.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'teams' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl text-cyan-100">TEAMS</h2>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-cyan-600">TOTAL: {teams.length}</span>
                                <button onClick={() => setShowCreateTeam(v => !v)} className="px-4 py-2 text-xs font-bold border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 rounded">+ CREATE TEAM</button>
                            </div>
                        </div>
                        {showCreateTeam && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                                <div className="bg-black border border-cyan-500/40 rounded-lg p-8 w-full max-w-md">
                                    <h3 className="text-lg font-bold text-cyan-100 mb-6 uppercase">Register New Team</h3>
                                    <div className="space-y-4">
                                        <div><label className="block text-xs uppercase tracking-widest mb-2 text-cyan-400/70">Team Name</label>
                                            <input type="text" value={newTeam.name} onChange={e => setNewTeam(v => ({ ...v, name: e.target.value }))} className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-cyan-100 focus:outline-none focus:border-cyan-400" placeholder="e.g. RedAlpha" /></div>
                                        <div><label className="block text-xs uppercase tracking-widest mb-2 text-cyan-400/70">Access Code</label>
                                            <input type="text" value={newTeam.code} onChange={e => setNewTeam(v => ({ ...v, code: e.target.value }))} className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-cyan-100 focus:outline-none focus:border-cyan-400" placeholder="e.g. Alpha@2024!" /></div>
                                        <div><label className="block text-xs uppercase tracking-widest mb-2 text-cyan-400/70">Role</label>
                                            <select value={newTeam.type} onChange={e => setNewTeam(v => ({ ...v, type: e.target.value }))} className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-cyan-100 focus:outline-none focus:border-cyan-400">
                                                <option value="red">Red Team</option><option value="blue">Blue Team</option>
                                            </select></div>
                                    </div>
                                    {createError && <p className="text-red-400 text-xs mt-4">{createError}</p>}
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={createTeam} className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/50 py-3 rounded font-bold text-xs">REGISTER</button>
                                        <button onClick={() => { setShowCreateTeam(false); setCreateError(''); setNewTeam({ name: '', code: '', type: 'red' }); }} className="flex-1 border border-cyan-900/50 text-cyan-700 hover:text-cyan-500 py-3 rounded font-bold text-xs">CANCEL</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <div key={team.teamName} className="bg-cyan-950/10 border border-cyan-900/50 p-6 rounded-lg hover:border-cyan-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-bold text-cyan-100">{team.teamName}</h3>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${team.teamType === 'red' ? 'text-red-400 border border-red-900' : 'text-blue-400 border border-blue-900'}`}>{team.teamType?.toUpperCase()}</span>
                                    </div>
                                    <div className="space-y-1 mb-4 text-sm">
                                        <div className="flex justify-between"><span className="text-cyan-600">Access Code</span><span className="text-cyan-300 font-mono text-xs">{team.accessCode}</span></div>
                                        <div className="flex justify-between"><span className="text-cyan-600">Score</span><span className="text-cyan-300 font-mono">{team.score}</span></div>
                                        <div className="flex justify-between"><span className="text-cyan-600">Last Active</span><span className="text-cyan-300 font-mono text-xs">{new Date(team.lastActive).toLocaleTimeString()}</span></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => resetTeam(team.teamName)} className="flex-1 py-2 text-xs font-bold border border-yellow-900/50 text-yellow-600 hover:bg-yellow-900/20 hover:text-yellow-400 rounded">RESET SCORE</button>
                                        <button onClick={() => kickTeam(team.teamName)} className="flex-1 py-2 text-xs font-bold border border-red-900/50 text-red-600 hover:bg-red-900/20 hover:text-red-400 rounded">KICK TEAM</button>
                                        <button onClick={() => deleteTeam(team.teamName)} className="flex-1 py-2 text-xs font-bold border border-gray-700 text-gray-500 hover:bg-gray-900/40 hover:text-gray-300 rounded">DELETE</button>
                                    </div>
                                </div>
                            ))}
                            {teams.length === 0 && <div className="col-span-full text-center py-12 text-cyan-800 italic">No teams found</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'rooms' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl text-cyan-100">ROOMS</h2>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-cyan-600">TOTAL: {rooms.length}</span>
                                <button onClick={() => setShowCreateRoom(v => !v)} className="px-4 py-2 text-xs font-bold border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 rounded">+ CREATE ROOM</button>
                            </div>
                        </div>
                        {showCreateRoom && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                                <div className="bg-black border border-cyan-500/40 rounded-lg p-8 w-full max-w-md">
                                    <h3 className="text-lg font-bold text-cyan-100 mb-6 uppercase">Create Room</h3>
                                    <div className="space-y-4">
                                        <div><label className="block text-xs uppercase tracking-widest mb-2 text-cyan-400/70">Room Name</label>
                                            <input type="text" value={newRoom.name} onChange={e => setNewRoom(v => ({ ...v, name: e.target.value }))} className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-cyan-100 focus:outline-none focus:border-cyan-400" placeholder="e.g. Room-A" /></div>
                                        <div><label className="block text-xs uppercase tracking-widest mb-2 text-red-400/70">Red Team</label>
                                            <select value={newRoom.redTeam} onChange={e => setNewRoom(v => ({ ...v, redTeam: e.target.value }))} className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-cyan-100 focus:outline-none focus:border-cyan-400">
                                                <option value="">-- Select Red Team --</option>
                                                {teams.filter(t => t.teamType === 'red').map(t => <option key={t.teamName} value={t.teamName}>{t.teamName}</option>)}
                                            </select></div>
                                        <div><label className="block text-xs uppercase tracking-widest mb-2 text-blue-400/70">Blue Team</label>
                                            <select value={newRoom.blueTeam} onChange={e => setNewRoom(v => ({ ...v, blueTeam: e.target.value }))} className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-cyan-100 focus:outline-none focus:border-cyan-400">
                                                <option value="">-- Select Blue Team --</option>
                                                {teams.filter(t => t.teamType === 'blue').map(t => <option key={t.teamName} value={t.teamName}>{t.teamName}</option>)}
                                            </select></div>
                                    </div>
                                    {createRoomError && <p className="text-red-400 text-xs mt-4">{createRoomError}</p>}
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={createRoom} className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/50 py-3 rounded font-bold text-xs">LAUNCH ROOM</button>
                                        <button onClick={() => { setShowCreateRoom(false); setCreateRoomError(''); setNewRoom({ name: '', redTeam: '', blueTeam: '' }); }} className="flex-1 border border-cyan-900/50 text-cyan-700 hover:text-cyan-500 py-3 rounded font-bold text-xs">CANCEL</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3">
                            {rooms.length === 0 && <div className="text-center py-12 text-cyan-800 italic border border-cyan-900/20 rounded-lg">No rooms created yet</div>}
                            {rooms.map(room => (
                                <div key={room.id} className="bg-cyan-950/10 border border-cyan-900/50 rounded-lg p-5 hover:border-cyan-500/30 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-cyan-100 text-lg">{room.room_name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded border font-bold border-green-700 text-green-400">{room.status?.toUpperCase()}</span>
                                        </div>
                                        <button onClick={() => deleteRoom(room.id)} className="text-xs border border-red-900/50 text-red-600 hover:bg-red-900/20 hover:text-red-400 px-3 py-1 rounded">DELETE</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-red-950/20 border border-red-900/30 rounded p-3">
                                            <div className="text-xs text-red-400/70 uppercase mb-1">Red Team</div>
                                            <div className="font-bold text-red-300">{room.red_team_name || '—'}</div>
                                            <div className="text-xs text-red-400/50 font-mono mt-1">{room.red_team_code || ''}</div>
                                        </div>
                                        <div className="bg-blue-950/20 border border-blue-900/30 rounded p-3">
                                            <div className="text-xs text-blue-400/70 uppercase mb-1">Blue Team</div>
                                            <div className="font-bold text-blue-300">{room.blue_team_name || '—'}</div>
                                            <div className="text-xs text-blue-400/50 font-mono mt-1">{room.blue_team_code || ''}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-cyan-700 font-mono">
                                        Vidyatech: http://{window.location.hostname}:{room.vidyatech_port || 5000} &nbsp;|&nbsp; Monitor: http://{window.location.hostname}:{room.monitor_port || 8080}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'controls' && (
                    <div className="grid grid-cols-1 gap-6 max-w-2xl">
                        <div className="bg-cyan-950/10 border border-cyan-900/50 p-6 rounded-lg">
                            <h2 className="text-xl text-cyan-100 mb-4">BROADCAST SYSTEM</h2>
                            <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)}
                                className="w-full bg-black/50 border border-cyan-700 rounded p-3 text-cyan-100 mb-4 focus:border-cyan-400 focus:outline-none"
                                placeholder="ENTER MESSAGE..." rows={3} />
                            <button onClick={sendBroadcast} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded transition-colors">TRANSMIT MESSAGE</button>
                        </div>
                        <div className="bg-red-950/10 border border-red-900/50 p-6 rounded-lg">
                            <h2 className="text-xl text-red-100 mb-2">DANGER ZONE</h2>
                            <p className="text-red-400 mb-4 text-sm">Resets all active sessions and scores. Cannot be undone.</p>
                            <button onClick={resetSystem} className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-800 font-bold py-4 px-8 rounded w-full transition-colors">RESET SYSTEM</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
