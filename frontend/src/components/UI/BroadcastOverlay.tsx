import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../../context/GameContext';

const BroadcastOverlay: React.FC = () => {
    const { gameState } = useGame();
    const [visibleBroadcasts, setVisibleBroadcasts] = useState<any[]>([]);

    useEffect(() => {
        // Sync with gameState broadcasts
        // Optimally we'd track "seen" broadcasts or just show what's current
        // Since backend filters expiring ones, we can just show what's in state
        setVisibleBroadcasts(gameState.broadcasts);
    }, [gameState.broadcasts]);

    if (visibleBroadcasts.length === 0) return null;

    return createPortal(
        <div style={{ zIndex: 2147483647 }} className="fixed top-24 left-1/2 transform -translate-x-1/2 w-full max-w-3xl pointer-events-none flex flex-col items-center gap-4">
            {visibleBroadcasts.map((broadcast) => (
                <div
                    key={broadcast.id}
                    className={`
                        pointer-events-auto
                        animate-bounce-in
                        bg-black/90 border-2
                        ${broadcast.type === 'danger' ? 'border-red-600 text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)]' :
                            broadcast.type === 'warning' ? 'border-yellow-600 text-yellow-500 shadow-[0_0_30px_rgba(202,138,4,0.5)]' :
                                'border-cyan-600 text-cyan-500 shadow-[0_0_30px_rgba(8,145,178,0.5)]'
                        }
                        px-8 py-6 rounded-lg backdrop-blur-md
                        flex items-center gap-6
                        min-w-[400px] justify-center
                    `}
                >
                    <div className="text-4xl animate-pulse">
                        {broadcast.type === 'danger' ? '⚠️' : broadcast.type === 'warning' ? '⚡' : 'ℹ️'}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xs font-bold tracking-[0.2em] uppercase mb-1 ${broadcast.type === 'danger' ? 'text-red-700' : broadcast.type === 'warning' ? 'text-yellow-700' : 'text-cyan-700'
                            }`}>
                            SYSTEM BROADCAST // {new Date(broadcast.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-2xl font-bold font-mono tracking-widest uppercase">
                            {broadcast.message}
                        </span>
                    </div>
                </div>
            ))}
        </div>,
        document.body
    );
};

export default BroadcastOverlay;
