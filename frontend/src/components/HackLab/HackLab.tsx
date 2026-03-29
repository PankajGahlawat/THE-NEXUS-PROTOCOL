import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './HackLab.css';

export default function HackLab() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetUrl = searchParams.get('target') || 'http://localhost:5000';
  const roundName = searchParams.get('round') || 'VIDYATECH';

  const TOTAL_SECONDS = 2 * 60 * 60;
  const STORAGE_KEY = 'nexus_hacklab_start';

  // Get or create a persistent start time in localStorage
  const getStartTime = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    return now;
  };

  const calcRemaining = () => {
    const elapsed = Math.floor((Date.now() - getStartTime()) / 1000);
    return Math.max(0, TOTAL_SECONDS - elapsed);
  };

  const [remaining, setRemaining] = useState(calcRemaining);

  // Countdown timer — auto-logout when time expires
  useEffect(() => {
    const timer = setInterval(() => {
      const left = calcRemaining();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
        localStorage.removeItem(STORAGE_KEY);
        navigate('/login');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  const timerUrgent = remaining < 300;

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
        </div>
      </div>

      {/* Full-screen iframe */}
      <div className="hacklab-fullscreen-pane">
        <iframe
          className="hacklab-iframe"
          src={targetUrl}
          title={`${roundName} Target`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
