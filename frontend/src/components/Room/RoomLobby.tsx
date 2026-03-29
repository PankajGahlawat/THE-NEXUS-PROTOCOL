import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function RoomLobby() {
  const { gameState } = useGame();
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState('');
  const [seat, setSeat] = useState('red-1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return setError('Room ID required');

    setLoading(true);
    setError('');

    try {
      const r = await fetch(`${API_BASE}/api/v1/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${gameState.sessionToken}`
        },
        body: JSON.stringify({ roomId, seat })
      });

      const data = await r.json();
      if (data.success) {
        // Navigate to the RoomView, passing the room and seat
        navigate('/room', { state: { roomId, seat } });
      } else {
        setError(data.message || 'Failed to join room');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!gameState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-red-500">
        You must be logged in as a Team to join a 2v2 Room.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-cyan-500 font-mono flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black">
      <div className="w-full max-w-md bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <h2 className="text-2xl font-bold tracking-widest text-cyan-100 mb-2 text-center">2v2 ATTACK/DEFENSE</h2>
        <p className="text-sm text-cyan-600 mb-6 text-center">Join an active 2v2 combat room.</p>

        <form onSubmit={handleJoin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-cyan-400 tracking-widest mb-1">ROOM ID / NAME</label>
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              className="w-full bg-black border border-cyan-800 rounded px-3 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
              placeholder="e.g. tournament-room-alpha"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-400 tracking-widest mb-1">SELECT SEAT</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center py-2 border rounded cursor-pointer transition-colors ${seat === 'red-1' ? 'border-red-500 bg-red-900/30 text-red-100' : 'border-red-900/30 text-red-600 hover:border-red-700/50'}`}>
                <input type="radio" name="seat" value="red-1" checked={seat === 'red-1'} onChange={() => setSeat('red-1')} className="hidden" />
                RED 1 (Attacker)
              </label>
              <label className={`flex items-center justify-center py-2 border rounded cursor-pointer transition-colors ${seat === 'red-2' ? 'border-red-500 bg-red-900/30 text-red-100' : 'border-red-900/30 text-red-600 hover:border-red-700/50'}`}>
                <input type="radio" name="seat" value="red-2" checked={seat === 'red-2'} onChange={() => setSeat('red-2')} className="hidden" />
                RED 2 (Attacker)
              </label>
              <label className={`flex items-center justify-center py-2 border rounded cursor-pointer transition-colors ${seat === 'blue-1' ? 'border-blue-500 bg-blue-900/30 text-blue-100' : 'border-blue-900/30 text-blue-600 hover:border-blue-700/50'}`}>
                <input type="radio" name="seat" value="blue-1" checked={seat === 'blue-1'} onChange={() => setSeat('blue-1')} className="hidden" />
                BLUE 1 (Defender)
              </label>
              <label className={`flex items-center justify-center py-2 border rounded cursor-pointer transition-colors ${seat === 'blue-2' ? 'border-blue-500 bg-blue-900/30 text-blue-100' : 'border-blue-900/30 text-blue-600 hover:border-blue-700/50'}`}>
                <input type="radio" name="seat" value="blue-2" checked={seat === 'blue-2'} onChange={() => setSeat('blue-2')} className="hidden" />
                BLUE 2 (Defender)
              </label>
            </div>
            <p className="text-xs text-cyan-700 mt-2">
              Note: You must be authenticated as the corresponding team (Red/Blue) to join these seats.
            </p>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500 text-cyan-100 font-bold tracking-widest rounded transition-all disabled:opacity-50"
          >
            {loading ? 'INITIALIZING CONNECTION...' : 'JOIN ROOM'}
          </button>
        </form>
      </div>
    </div>
  );
}
