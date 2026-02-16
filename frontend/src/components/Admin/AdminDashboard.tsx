import React, { useState, useEffect } from 'react';
import { useAudio } from '../../context/AudioContext';

interface ActivityLog {
    type: string;
    team: string;
    mission: string;
    agent: string;
    data: any;
    timestamp: string;
}

interface LeaderboardEntry {
    rank: number;
    teamName: string;
    score: number;
    missionsCompleted: number;
    averageScore: number;
    lastActive: string;
}

const AdminDashboard: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminCode, setAdminCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'leaderboard' | 'controls' | 'teams'>('activity');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [teams, setTeams] = useState<any[]>([]);

    const { setVolume } = useAudio();

    // Mute audio on mount
    useEffect(() => {
        setVolume(0);
        return () => {
            setVolume(0.6); // Restore to default on exit
        };
    }, []);

    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    const checkAdminAuth = async (retryCount = 0) => {
        if (retryCount === 0) {
            setLoading(true);
            setError(null);
        }

        try {
            // Test auth by fetching activity
            const response = await fetch(`http://${window.location.hostname}:3000/api/v1/admin/activity?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${adminCode}`
                }
            });

            if (response.ok) {
                setIsAuthenticated(true);
                fetchData();
                setLoading(false);
            } else {
                setError('Invalid Admin Code');
                setLoading(false);
            }
        } catch (err) {
            console.log(`Connection attempt ${retryCount + 1} failed...`);
            if (retryCount < 10) {
                // Retry up to 10 times (30 seconds) to allow backend to start
                setTimeout(() => checkAdminAuth(retryCount + 1), 3000);
            } else {
                setError('Failed to connect to server. Is the backend running?');
                setLoading(false);
            }
        }
    };

    const sendBroadcast = async () => {
        if (!broadcastMessage) return;
        try {
            await fetch(`http://${window.location.hostname}:3000/api/v1/admin/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCode}` },
                body: JSON.stringify({ message: broadcastMessage })
            });
            setBroadcastMessage('');
            alert('Broadcast Sent');
        } catch (e) {
            console.error(e);
        }
    };

    const setThreatLevel = async (level: string) => {
        try {
            await fetch(`http://${window.location.hostname}:3000/api/v1/admin/threat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCode}` },
                body: JSON.stringify({ level })
            });
            alert(`Threat Level set to ${level}`);
        } catch (e) { console.error(e); }
    };

    const resetSystem = async () => {
        if (!confirm('WARNING: THIS WILL RESET ALL GAME DATA. CONTINUE?')) return;
        try {
            await fetch(`http://${window.location.hostname}:3000/api/v1/admin/reset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminCode}` }
            });
            window.location.reload();
        } catch (e) { console.error(e); }
    };

    const kickTeam = async (teamName: string) => {
        if (!confirm(`Are you sure you want to KICK team ${teamName}? This will force them to logout.`)) return;
        try {
            await fetch(`http://${window.location.hostname}:3000/api/v1/admin/team/kick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCode}` },
                body: JSON.stringify({ teamName })
            });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const resetTeam = async (teamName: string) => {
        if (!confirm(`Are you sure you want to RESET progress for team ${teamName}?`)) return;
        try {
            await fetch(`http://${window.location.hostname}:3000/api/v1/admin/team/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminCode}` },
                body: JSON.stringify({ teamName })
            });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const fetchData = async () => {
        if (!adminCode) return;

        try {
            // Fetch Activity
            const activityRes = await fetch(`http://${window.location.hostname}:3000/api/v1/admin/activity?limit=50`, {
                headers: { 'Authorization': `Bearer ${adminCode}` }
            });
            const activityData = await activityRes.json();
            if (activityData.success) {
                setActivityLogs(activityData.data);
            }

            // Fetch Leaderboard
            const leaderboardRes = await fetch(`http://${window.location.hostname}:3000/api/v1/admin/leaderboard?limit=100`, {
                headers: { 'Authorization': `Bearer ${adminCode}` }
            });
            const leaderboardData = await leaderboardRes.json();
            if (leaderboardData.success) {
                setLeaderboard(leaderboardData.data);
            }

            // Fetch Teams
            const teamsRes = await fetch(`http://${window.location.hostname}:3000/api/v1/admin/teams`, {
                headers: { 'Authorization': `Bearer ${adminCode}` }
            });
            const teamsData = await teamsRes.json();
            if (teamsData.success) {
                setTeams(teamsData.data);
            }

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isAuthenticated) {
            fetchData(); // Initial fetch
            interval = setInterval(fetchData, 5000); // Poll every 5 seconds
        }
        return () => clearInterval(interval);
    }, [isAuthenticated, adminCode]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-cyan-500 font-mono flex items-center justify-center">
                <div className="border border-cyan-500/30 p-8 rounded-lg max-w-md w-full bg-black/90 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    <h1 className="text-2xl font-bold mb-6 text-center tracking-wider">SYSTEM ADMIN ACCESS</h1>
                    {error && <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 mb-4 text-sm">{error}</div>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest mb-2 text-cyan-400/70">Access Code</label>
                            <input
                                type="password"
                                value={adminCode}
                                onChange={(e) => setAdminCode(e.target.value)}
                                className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-cyan-100 focus:outline-none focus:border-cyan-400 transition-colors"
                                placeholder="ENTER CODE"
                            />
                        </div>
                        <button
                            onClick={() => checkAdminAuth(0)}
                            disabled={loading}
                            className="w-full bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/50 py-3 px-4 rounded transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                        >
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
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-4 py-2 border ${activeTab === 'activity' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100' : 'border-transparent text-cyan-600 hover:text-cyan-400'}`}
                    >
                        LIVE ACTIVITY
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-4 py-2 border ${activeTab === 'leaderboard' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100' : 'border-transparent text-cyan-600 hover:text-cyan-400'}`}
                    >
                        LEADERBOARD
                    </button>
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`px-4 py-2 border ${activeTab === 'teams' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100' : 'border-transparent text-cyan-600 hover:text-cyan-400'}`}
                    >
                        TEAMS
                    </button>
                    <button
                        onClick={() => setActiveTab('controls')}
                        className={`px-4 py-2 border ${activeTab === 'controls' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100' : 'border-transparent text-cyan-600 hover:text-cyan-400'}`}
                    >
                        CONTROLS
                    </button>
                    <button
                        onClick={() => setIsAuthenticated(false)}
                        className="px-4 py-2 text-red-500 hover:text-red-400 border border-red-900/30 hover:border-red-500/30 ml-4"
                    >
                        LOGOUT
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl text-cyan-100">SYSTEM LOGS</h2>
                            <span className="text-xs text-cyan-600 animate-pulse">● LIVE CONNECTION ACTIVE</span>
                        </div>
                        <div className="bg-cyan-950/10 border border-cyan-900/50 rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-cyan-950/20 text-cyan-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Time</th>
                                        <th className="p-4">Team</th>
                                        <th className="p-4">Event</th>
                                        <th className="p-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cyan-900/30">
                                    {activityLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-cyan-700 italic">No recent activity detected</td>
                                        </tr>
                                    ) : (
                                        activityLogs.map((log, idx) => (
                                            <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                                                <td className="p-4 text-cyan-600 font-mono text-sm whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="p-4 font-bold text-cyan-300">
                                                    {log.team}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${log.type === 'objective_completed' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                                                        log.type === 'mission_start' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
                                                            'bg-gray-800 text-gray-400'
                                                        }`}>
                                                        {log.type.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-cyan-400/80 text-sm">
                                                    {/* Render details based on type */}
                                                    {log.type === 'objective_completed' && (
                                                        <span>
                                                            Agent <span className="text-white">{log.agent}</span> completed objective <span className="text-white">#{log.data.objectiveId}</span>
                                                            {log.data.reward > 0 && <span className="text-yellow-500 ml-2">+{log.data.reward} PTS</span>}
                                                        </span>
                                                    )}
                                                    {log.type !== 'objective_completed' && JSON.stringify(log.data)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl text-cyan-100">GLOBAL RANKINGS</h2>
                            <span className="text-xs text-cyan-600">UPDATED: {new Date().toLocaleTimeString()}</span>
                        </div>
                        <div className="bg-cyan-950/10 border border-cyan-900/50 rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-cyan-950/20 text-cyan-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 text-center w-24">Rank</th>
                                        <th className="p-4">Team</th>
                                        <th className="p-4 text-right">Missions</th>
                                        <th className="p-4 text-right">Avg Score</th>
                                        <th className="p-4 text-right">Total Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cyan-900/30">
                                    {leaderboard.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-cyan-700 italic">No teams ranked yet</td>
                                        </tr>
                                    ) : (
                                        leaderboard.map((entry) => (
                                            <tr key={entry.teamName} className={`hover:bg-cyan-500/5 transition-colors ${entry.rank === 1 ? 'bg-yellow-900/10' : ''}`}>
                                                <td className="p-4 text-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold ${entry.rank === 1 ? 'bg-yellow-500 text-black' :
                                                        entry.rank === 2 ? 'bg-gray-400 text-black' :
                                                            entry.rank === 3 ? 'bg-orange-700 text-white' :
                                                                'bg-cyan-900/50 text-cyan-500'
                                                        }`}>
                                                        {entry.rank}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold text-lg text-cyan-100">
                                                    {entry.teamName}
                                                    {entry.rank === 1 && <span className="ml-2 text-yellow-500">👑</span>}
                                                </td>
                                                <td className="p-4 text-right text-cyan-400">
                                                    {entry.missionsCompleted}
                                                </td>
                                                <td className="p-4 text-right text-cyan-400 font-mono">
                                                    {entry.averageScore}
                                                </td>
                                                <td className="p-4 text-right text-2xl font-bold font-mono text-cyan-300">
                                                    {entry.score}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'teams' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl text-cyan-100">TEAM MANAGEMENT</h2>
                            <span className="text-xs text-cyan-600">ACTIVE SESSIONS: {teams.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <div key={team.teamName} className="bg-cyan-950/10 border border-cyan-900/50 p-6 rounded-lg relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                                    <div className="absolute top-0 right-0 p-2 opacity-50 font-mono text-xs text-cyan-700">{team.status}</div>
                                    <h3 className="text-xl font-bold text-cyan-100 mb-2">{team.teamName}</h3>
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-cyan-600">Score</span>
                                            <span className="text-cyan-300 font-mono">{team.score}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-cyan-600">Current Mission</span>
                                            <span className="text-cyan-300 font-mono">{team.mission}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-cyan-600">Last Active</span>
                                            <span className="text-cyan-300 font-mono text-xs">{new Date(team.lastActive).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => resetTeam(team.teamName)}
                                            className="flex-1 py-2 text-xs font-bold border border-yellow-900/50 text-yellow-600 hover:bg-yellow-900/20 hover:text-yellow-400 rounded transition-colors"
                                        >
                                            RESET SCORE
                                        </button>
                                        <button
                                            onClick={() => kickTeam(team.teamName)}
                                            className="flex-1 py-2 text-xs font-bold border border-red-900/50 text-red-600 hover:bg-red-900/20 hover:text-red-400 rounded transition-colors"
                                        >
                                            KICK TEAM
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {teams.length === 0 && (
                                <div className="col-span-full text-center py-12 text-cyan-800 italic border border-cyan-900/20 rounded-lg dashed">
                                    No active teams found
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'controls' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Broadcast System */}
                        <div className="bg-cyan-950/10 border border-cyan-900/50 p-6 rounded-lg">
                            <h2 className="text-xl text-cyan-100 mb-4 flex items-center gap-2">
                                <span className="text-2xl">📢</span> BROADCAST SYSTEM
                            </h2>
                            <textarea
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                className="w-full bg-black/50 border border-cyan-700 rounded p-3 text-cyan-100 mb-4 focus:border-cyan-400 focus:outline-none"
                                placeholder="ENTER SYSTEM WIDE MESSAGE..."
                                rows={3}
                            />
                            <button
                                onClick={sendBroadcast}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded transition-colors"
                            >
                                TRANSMIT MESSAGE
                            </button>
                        </div>

                        {/* Global Threat Level */}
                        <div className="bg-cyan-950/10 border border-cyan-900/50 p-6 rounded-lg">
                            <h2 className="text-xl text-cyan-100 mb-4 flex items-center gap-2">
                                <span className="text-2xl">⚠️</span> THREAT LEVEL
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setThreatLevel(level)}
                                        className={`py-4 font-bold rounded border transition-all ${level === 'CRITICAL' ? 'border-red-900 hover:bg-red-900/40 text-red-500' :
                                            level === 'HIGH' ? 'border-orange-900 hover:bg-orange-900/40 text-orange-500' :
                                                level === 'MEDIUM' ? 'border-yellow-900 hover:bg-yellow-900/40 text-yellow-500' :
                                                    'border-green-900 hover:bg-green-900/40 text-green-500'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* System Reset */}
                        <div className="bg-red-950/10 border border-red-900/50 p-6 rounded-lg md:col-span-2 mt-4">
                            <h2 className="text-xl text-red-100 mb-2">⛔ DANGER ZONE</h2>
                            <p className="text-red-400 mb-4 text-sm">Resetting the system will clear all active sessions, activity logs, and leaderboards. This cannot be undone.</p>
                            <button
                                onClick={resetSystem}
                                className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-800 font-bold py-4 px-8 rounded w-full transition-colors"
                            >
                                RESET SYSTEM PROTOCOLS
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
