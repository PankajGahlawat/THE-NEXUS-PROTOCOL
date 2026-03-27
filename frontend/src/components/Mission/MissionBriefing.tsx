import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext.js';

/* ── Round data ── */
interface Vulnerability {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  points: number;
}
interface Round {
  number: number;
  title: string;
  subtitle: string;
  difficulty: string;
  difficultyClass: 'beginner' | 'advanced';
  format: string;
  duration: string;
  totalVulns: number;
  port?: string;
  targetUrl?: string;
  monitorUrl?: string;
  vulns?: Vulnerability[];
}

const ROUNDS: Round[] = [
  {
    number: 1, title: 'VIDYATECH', subtitle: 'University Portal — 15 Vulnerabilities',
    difficulty: 'EASY → INTERMEDIATE → ADVANCED', difficultyClass: 'beginner',
    format: 'Red Team vs Blue Team', duration: '60 Minutes', totalVulns: 15,
    port: 'Port 5000',
    targetUrl: `http://${window.location.hostname}:5000`,
    monitorUrl: `http://${window.location.hostname}:8080`,
    vulns: [
      { id:'V1',  name:'SQL Injection — Student Login',           level:'beginner',     points: 40  },
      { id:'V2',  name:'Stored XSS — Notice Board',               level:'beginner',     points: 40  },
      { id:'V3',  name:'Default Credentials — Staff Portal',      level:'beginner',     points: 40  },
      { id:'V4',  name:'Directory Traversal — Resources',         level:'beginner',     points: 40  },
      { id:'V5',  name:'Sensitive Data Exposure',                 level:'beginner',     points: 40  },
      { id:'V6',  name:'Hardcoded Admin Login',                   level:'beginner',     points: 40  },
      { id:'V7',  name:'Unrestricted File Upload',                level:'beginner',     points: 40  },
      { id:'V8',  name:'Clickjacking — Missing X-Frame-Options',  level:'beginner',     points: 40  },
      { id:'V9',  name:'Weak Password Policy',                    level:'beginner',     points: 40  },
      { id:'V10', name:'CSRF — Email Hijack',                     level:'beginner',     points: 40  },
      { id:'V11', name:'JWT alg:none — API Auth Bypass',          level:'intermediate', points: 100 },
      { id:'V12', name:'IDOR — Student Results',                  level:'intermediate', points: 100 },
      { id:'V13', name:'Command Injection — NSLookup Tool',       level:'intermediate', points: 100 },
      { id:'V14', name:'PyYAML Unsafe Load — RCE',                level:'advanced',     points: 150 },
      { id:'V15', name:'Debug Endpoint — Secret Key Leak + SSRF', level:'advanced',     points: 150 },
    ]
  }
];

/* ── Styles (inline to keep it self-contained) ── */
const s = {
  roundSection: { marginTop: '3rem', borderTop: '1px solid rgba(139,92,246,0.2)', paddingTop: '2rem' } as React.CSSProperties,
  sectionTag: { fontSize: '0.75rem', letterSpacing: '0.2em', color: '#8b5cf6', fontWeight: 600, marginBottom: '0.5rem', display: 'block', textShadow: '0 0 10px rgba(139,92,246,0.4)' } as React.CSSProperties,
  sectionTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem' } as React.CSSProperties,
  roundCard: { background: '#12121a', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '4px', marginBottom: '1.5rem', overflow: 'hidden', transition: 'border-color 0.3s' } as React.CSSProperties,
  roundHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, transparent 50%)' } as React.CSSProperties,
  roundNum: { fontFamily: "'Orbitron', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#8b5cf6', marginRight: '1rem', textShadow: '0 0 15px rgba(139,92,246,0.4)' } as React.CSSProperties,
  roundTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#fff' } as React.CSSProperties,
  roundSub: { fontSize: '0.75rem', color: '#808090' } as React.CSSProperties,
  badge: (cls: string) => ({ padding: '0.25rem 0.6rem', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', borderRadius: '2px', textTransform: 'uppercase' as const,
    ...(cls === 'beginner' ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' } : { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' })
  }) as React.CSSProperties,
  meta: { display: 'flex', gap: '1.5rem', padding: '0 1.5rem 1rem', flexWrap: 'wrap' as const, fontSize: '0.75rem' } as React.CSSProperties,
  metaLabel: { color: '#606070' } as React.CSSProperties,
  metaVal: { color: '#c0c0d0', fontWeight: 500 } as React.CSSProperties,
  metaIcon: { color: '#22d3ee' } as React.CSSProperties,
  body: (open: boolean) => ({ maxHeight: open ? '3000px' : '0', overflow: 'hidden', transition: 'max-height 0.5s ease', opacity: open ? 1 : 0 }) as React.CSSProperties,
  branchHdr: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(139,92,246,0.12)' } as React.CSSProperties,
  dot: { width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 6px rgba(139,92,246,0.5)' } as React.CSSProperties,
  branchName: { fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: '#c0c0d0', letterSpacing: '0.08em' } as React.CSSProperties,
  branchPort: { fontSize: '0.65rem', color: '#22d3ee', marginLeft: 'auto' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '1rem' } as React.CSSProperties,
  th: { textAlign: 'left' as const, fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', color: '#606070', padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(139,92,246,0.12)', textTransform: 'uppercase' as const } as React.CSSProperties,
  td: { padding: '0.45rem 0.75rem', fontSize: '0.75rem', color: '#c0c0d0', borderBottom: '1px solid rgba(255,255,255,0.02)' } as React.CSSProperties,
  vulnId: { fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', fontWeight: 600, color: '#8b5cf6' } as React.CSSProperties,
  vulnName: { fontWeight: 500, color: '#e0e0f0' } as React.CSSProperties,
  vulnLevel: (lv: string) => ({ display: 'inline-block', padding: '0.1rem 0.4rem', fontSize: '0.55rem', fontWeight: 600, borderRadius: '2px', textTransform: 'uppercase' as const,
    ...(lv === 'beginner' ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e' } : lv === 'intermediate' ? { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' } : { background: 'rgba(239,68,68,0.1)', color: '#ef4444' })
  }) as React.CSSProperties,
  vulnVec: { fontSize: '0.7rem', color: '#909090' } as React.CSSProperties,
  endpoint: { color: '#22d3ee', fontSize: '0.65rem', fontFamily: 'monospace' } as React.CSSProperties,
  launchBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', padding: '1rem', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '4px' } as React.CSSProperties,
  launchLabel: { fontSize: '0.65rem', letterSpacing: '0.08em', color: '#606070', textTransform: 'uppercase' as const } as React.CSSProperties,
  launchUrl: { fontSize: '0.8rem', color: '#22d3ee', fontWeight: 500, fontFamily: 'monospace' } as React.CSSProperties,
  launchBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#8b5cf6 0%,#a855f7 50%,#ec4899 100%)', padding: '0.6rem 1.25rem', fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', textDecoration: 'none' } as React.CSSProperties,
  branchLaunch: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg,#8b5cf6,#a855f7)', padding: '0.35rem 0.8rem', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.06em', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', textDecoration: 'none', marginLeft: 'auto' } as React.CSSProperties,
  expand: (open: boolean) => ({ fontSize: '1.1rem', color: open ? '#8b5cf6' : '#606070', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }) as React.CSSProperties,
};

function VulnTable({ vulns }: { vulns: Vulnerability[] }) {
  return (
    <table style={s.table}>
      <thead><tr>
        <th style={s.th}>#</th>
        <th style={s.th}>Vulnerability</th>
        <th style={s.th}>Level</th>
        <th style={s.th}>Points</th>
      </tr></thead>
      <tbody>
        {vulns.map(v => (
          <tr key={v.id}>
            <td style={s.td}><span style={s.vulnId}>{v.id}</span></td>
            <td style={s.td}><span style={s.vulnName}>{v.name}</span></td>
            <td style={s.td}><span style={s.vulnLevel(v.level)}>{v.level}</span></td>
            <td style={s.td}><span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b' }}>{v.points} pts</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function MissionBriefing() {
  const { gameState } = useGame();
  const navigate = useNavigate();
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));

  const toggleRound = (n: number) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  const currentRole = gameState.teamType === 'red' ? 'Red Team' : 'Blue Team';

  return (
    <div className="min-h-screen bg-arcane-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold font-display text-arcane-teal mb-4">
            MISSION BRIEFING
          </h1>
          <p className="text-xl text-arcane-muted">
            Agent: {gameState.selectedAgent?.toUpperCase()} | Role: <span className="text-theme-primary">{currentRole.toUpperCase()}</span>
          </p>
        </div>

        {/* ─── OPERATION ROUNDS ─── */}
        <div style={s.roundSection}>
          <span style={s.sectionTag}>// OPERATION_ROUNDS</span>
          <h2 style={s.sectionTitle}>MISSION ROUNDS</h2>

          {ROUNDS.map(round => {
            const open = expandedRounds.has(round.number);
            return (
              <div key={round.number} style={s.roundCard}>
                {/* Header */}
                <div style={s.roundHeader} onClick={() => toggleRound(round.number)}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={s.roundNum}>0{round.number}</span>
                    <div>
                      <div style={s.roundTitle}>{round.title}</div>
                      <div style={s.roundSub}>{round.subtitle}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={s.badge(round.difficultyClass)}>{round.difficulty}</span>
                    <span style={s.expand(open)}>▾</span>
                  </div>
                </div>

                {/* Meta */}
                <div style={s.meta}>
                  <span><span style={s.metaIcon}>◈ </span><span style={s.metaLabel}>Format: </span><span style={s.metaVal}>{round.format}</span></span>
                  <span><span style={s.metaIcon}>◉ </span><span style={s.metaLabel}>Duration: </span><span style={s.metaVal}>{round.duration}</span></span>
                  <span><span style={s.metaIcon}>◎ </span><span style={s.metaLabel}>Vulnerabilities: </span><span style={s.metaVal}>{round.totalVulns}</span></span>
                  {round.port && <span><span style={s.metaIcon}>▸ </span><span style={s.metaLabel}>Target: </span><span style={s.metaVal}>{round.port}</span></span>}
                </div>

                {/* Body */}
                <div style={s.body(open)}>
                  <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    {round.vulns && <VulnTable vulns={round.vulns} />}
                    {round.targetUrl && (
                      <div style={s.launchBar}>
                        <div>
                          <span style={s.launchLabel}>Target System</span><br/>
                          <span style={s.launchUrl}>{round.targetUrl}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button onClick={() => navigate(`/hacklab?target=${encodeURIComponent(round.targetUrl!)}&round=${encodeURIComponent(round.title)}`)} style={s.launchBtn}>▸ LAUNCH TARGET</button>
                          {round.monitorUrl && gameState.teamType === 'blue' && (
                            <button onClick={() => window.open(round.monitorUrl, '_blank')} style={{ ...s.launchBtn, background: 'linear-gradient(135deg,#0e7490 0%,#0891b2 50%,#22d3ee 100%)' }}>▸ LAUNCH MONITOR</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}