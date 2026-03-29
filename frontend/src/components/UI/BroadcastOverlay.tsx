import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

const BroadcastOverlay: React.FC = () => {
    const [broadcasts, setBroadcasts] = useState<any[]>([]);

    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/v1/broadcasts`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) setBroadcasts(data.data || []);
                }
            } catch (e) { /* backend not reachable, keep showing last */ }
        };

        poll();
        const interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, []);

    if (broadcasts.length === 0) return null;

    return createPortal(
        <div style={{ zIndex: 2147483647 }} className="fixed top-24 left-1/2 transform -translate-x-1/2 w-full max-w-3xl pointer-events-none flex flex-col items-center gap-4">
            {broadcasts.map((broadcast) => (
                <div
                    key={broadcast.id}
                    className={`
                        pointer-events-auto
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
                        <span className={`text-xs font-bold tracking-[0.2em] uppercase mb-1 ${
                            broadcast.type === 'danger' ? 'text-red-700' :
                            broadcast.type === 'warning' ? 'text-yellow-700' : 'text-cyan-700'
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
