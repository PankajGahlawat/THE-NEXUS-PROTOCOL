import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface LeaderboardEntry {
  position: number;
  userId: string;
  totalPoints: number;
  rank: string;
  achievements: number;
  lastActive: string;
}

interface ScoringEvent {
  event: {
    type: string;
    category: string;
    points: number;
    description: string;
  };
  sessionTotal: number;
  userTotal: number;
  rank: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  timestamp: string;
}

const Leaderboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentEvents, setRecentEvents] = useState<ScoringEvent[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [connected, setConnected] = useState(false);
  const [userScore, setUserScore] = useState<number>(0);
  const [userRank, setUserRank] = useState<string>('F-RANK');

  useEffect(() => {
    // Connect to SSH proxy for scoring updates
    const scoringSocket = io(
      import.meta.env.VITE_SSH_PROXY_URL || 'http://localhost:3002'
    );

    scoringSocket.on('connect', () => {
      console.log('Connected to scoring system');
      setConnected(true);
    });

    scoringSocket.on('leaderboard-update', (data: any) => {
      setLeaderboard(data.leaderboard);
    });

    scoringSocket.on('scoring-event', (data: ScoringEvent) => {
      setRecentEvents(prev => [data, ...prev].slice(0, 10));
      setUserScore(data.userTotal);
      setUserRank(data.rank);
    });

    scoringSocket.on('achievement-unlocked', (data: any) => {
      setRecentAchievements(prev => [data.achievement, ...prev].slice(0, 5));
      
      // Show notification
      if (Notification.permission === 'granted') {
        new Notification('Achievement Unlocked!', {
          body: data.achievement.name,
          icon: data.achievement.icon
        });
      }
    });

    setSocket(scoringSocket);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      scoringSocket.disconnect();
    };
  }, []);

  const getRankColor = (rank: string) => {
    const colors: { [key: string]: string } = {
      'S-RANK': '#ff0000',
      'A-RANK': '#ff6600',
      'B-RANK': '#ffaa00',
      'C-RANK': '#ffff00',
      'D-RANK': '#00ff00',
      'E-RANK': '#00ffff',
      'F-RANK': '#888888'
    };
    return colors[rank] || '#888888';
  };

  const getPointsColor = (points: number) => {
    if (points >= 200) return '#ff0000';
    if (points >= 100) return '#ff6600';
    if (points >= 50) return '#ffaa00';
    return '#00ff00';
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      {/* Main Leaderboard */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.5)', 
          padding: '20px', 
          borderRadius: '10px',
          border: '2px solid #00ff00',
          marginBottom: '20px'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '32px', 
            textAlign: 'center',
            color: '#00ff00',
            textShadow: '0 0 10px #00ff00'
          }}>
            🏆 NEXUS PROTOCOL LEADERBOARD
          </h1>
          <div style={{ 
            textAlign: 'center', 
            marginTop: '10px',
            color: connected ? '#00ff00' : '#ff0000',
            fontSize: '14px'
          }}>
            {connected ? '● LIVE' : '○ DISCONNECTED'}
          </div>
        </div>

        {/* User Score Card */}
        <div style={{
          background: 'rgba(0, 100, 255, 0.2)',
          padding: '20px',
          borderRadius: '10px',
          border: '2px solid #0066ff',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '14px', color: '#aaa' }}>YOUR SCORE</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#00ff00' }}>
              {userScore.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#aaa' }}>YOUR RANK</div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: getRankColor(userRank),
              textShadow: `0 0 10px ${getRankColor(userRank)}`
            }}>
              {userRank}
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '10px',
          border: '2px solid #333',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 255, 0, 0.1)', borderBottom: '2px solid #00ff00' }}>
                <th style={{ padding: '15px', textAlign: 'left', color: '#00ff00' }}>RANK</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#00ff00' }}>USER</th>
                <th style={{ padding: '15px', textAlign: 'right', color: '#00ff00' }}>POINTS</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#00ff00' }}>TIER</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#00ff00' }}>ACHIEVEMENTS</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr 
                  key={entry.userId}
                  style={{ 
                    borderBottom: '1px solid #333',
                    background: idx < 3 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                    transition: 'background 0.3s'
                  }}
                >
                  <td style={{ padding: '15px', fontSize: '20px', fontWeight: 'bold' }}>
                    {entry.position === 1 && '🥇'}
                    {entry.position === 2 && '🥈'}
                    {entry.position === 3 && '🥉'}
                    {entry.position > 3 && `#${entry.position}`}
                  </td>
                  <td style={{ padding: '15px', fontSize: '16px' }}>
                    {entry.userId}
                  </td>
                  <td style={{ 
                    padding: '15px', 
                    textAlign: 'right', 
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#00ff00'
                  }}>
                    {entry.totalPoints.toLocaleString()}
                  </td>
                  <td style={{ 
                    padding: '15px', 
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: getRankColor(entry.rank),
                    textShadow: `0 0 5px ${getRankColor(entry.rank)}`
                  }}>
                    {entry.rank}
                  </td>
                  <td style={{ 
                    padding: '15px', 
                    textAlign: 'center',
                    fontSize: '16px'
                  }}>
                    🏅 {entry.achievements}
                  </td>
                </tr>
              ))}
              
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#666',
                    fontSize: '16px'
                  }}>
                    No players yet. Be the first to score!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sidebar - Recent Activity */}
      <div style={{ 
        width: '400px', 
        background: 'rgba(0, 0, 0, 0.7)', 
        padding: '20px',
        overflowY: 'auto',
        borderLeft: '2px solid #333'
      }}>
        {/* Recent Achievements */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ 
            color: '#ffaa00', 
            marginBottom: '15px',
            fontSize: '18px',
            textShadow: '0 0 5px #ffaa00'
          }}>
            🏆 RECENT ACHIEVEMENTS
          </h3>
          {recentAchievements.map((achievement, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 170, 0, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid #ffaa00',
                animation: 'slideIn 0.5s ease-out'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                {achievement.icon}
              </div>
              <div style={{ fontWeight: 'bold', color: '#ffaa00' }}>
                {achievement.name}
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                {achievement.description}
              </div>
            </div>
          ))}
          
          {recentAchievements.length === 0 && (
            <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No achievements yet
            </div>
          )}
        </div>

        {/* Recent Scoring Events */}
        <div>
          <h3 style={{ 
            color: '#00ff00', 
            marginBottom: '15px',
            fontSize: '18px',
            textShadow: '0 0 5px #00ff00'
          }}>
            ⚡ RECENT ACTIVITY
          </h3>
          {recentEvents.map((event, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(0, 255, 0, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid #00ff00',
                animation: 'slideIn 0.5s ease-out'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: getPointsColor(event.event.points)
                }}>
                  +{event.event.points}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#aaa',
                  textTransform: 'uppercase'
                }}>
                  {event.event.category}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#fff' }}>
                {event.event.description}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#aaa', 
                marginTop: '5px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Total: {event.userTotal}</span>
                <span style={{ color: getRankColor(event.rank) }}>
                  {event.rank}
                </span>
              </div>
            </div>
          ))}
          
          {recentEvents.length === 0 && (
            <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No recent activity
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
