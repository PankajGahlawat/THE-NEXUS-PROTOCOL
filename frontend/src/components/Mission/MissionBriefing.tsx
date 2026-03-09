import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext.js';

/* ── Round data (game terminology, no "CTF") ── */
interface Vulnerability {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  vector: string;
  endpoint?: string;
}
interface Branch { name: string; port: string; targetUrl: string; vulns: Vulnerability[]; }
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
  branches?: Branch[];
  vulns?: Vulnerability[];
}

const ROUNDS: Round[] = [
  {
    number: 1, title: 'NEXUSBANK', subtitle: 'Three Branches — 24 Vulnerabilities',
    difficulty: 'BEGINNER → INTERMEDIATE', difficultyClass: 'beginner',
    format: 'Red Team vs Blue Team', duration: '45 Minutes', totalVulns: 24,
    branches: [
      { name: 'Branch A — Andheri', port: 'Port 5175', targetUrl: 'http://localhost:5175', vulns: [
        { id:'VA1', name:'Sensitive Data in HTML Source', level:'beginner', vector:'View page source, find admin creds in comment' },
        { id:'VA2', name:'IDOR — Account Access', level:'beginner', vector:'Change ACC002 → ACC001 in URL' },
        { id:'VA3', name:'Broken Auth — Weak Passwords', level:'beginner', vector:'Login with guessable password' },
        { id:'VA4', name:'Sensitive Data API', level:'beginner', vector:'GET /api/all-accounts — no auth' },
        { id:'VA5', name:'SQL Injection — Login', level:'intermediate', vector:"admin' OR '1'='1' -- in username" },
        { id:'VA6', name:'Stored XSS — Feedback', level:'intermediate', vector:'<script>alert(1)</script> in form' },
        { id:'VA7', name:'Directory Traversal', level:'intermediate', vector:'../../secret.txt in download' },
        { id:'VA8', name:'CSRF — Fund Transfer', level:'intermediate', vector:'No token; cross-origin POST' },
      ]},
      { name: 'Branch B — Bandra', port: 'Port 5176', targetUrl: 'http://localhost:5176', vulns: [
        { id:'VB1', name:'JWT Weak Secret', level:'beginner', vector:'Secret="secret"; forge admin JWT' },
        { id:'VB2', name:'IDOR — Transactions', level:'beginner', vector:'Change BAC001 in URL' },
        { id:'VB3', name:'Broken Auth — No Lockout', level:'beginner', vector:'Brute force — no rate limiting' },
        { id:'VB4', name:'Mass Assignment', level:'intermediate', vector:'PUT /api/profile with role=admin' },
        { id:'VB5', name:'SQL Injection — Search', level:'intermediate', vector:"' OR '1'='1 in search" },
        { id:'VB6', name:'Reflected XSS — Search', level:'intermediate', vector:'<img src=x onerror=alert(1)>' },
        { id:'VB7', name:'Insecure File Access', level:'intermediate', vector:'GET /api/docs/internal_audit.txt' },
        { id:'VB8', name:'Broken Access Control', level:'intermediate', vector:'Forge JWT role=admin → /api/admin' },
      ]},
      { name: 'Branch C — Colaba', port: 'Port 5177', targetUrl: 'http://localhost:5177', vulns: [
        { id:'VC1', name:'Cookie Manipulation', level:'beginner', vector:'Decode base64 cookie, change role' },
        { id:'VC2', name:'IDOR — Loan Details', level:'beginner', vector:'GET /api/loan/4 reveals admin loan' },
        { id:'VC3', name:'Default Credentials', level:'beginner', vector:'Login with admin / admin' },
        { id:'VC4', name:'API Enumeration', level:'beginner', vector:'GET /api/ticket/1, /2, /3' },
        { id:'VC5', name:'SQL Injection — Profile', level:'intermediate', vector:"nominee='HACKED' WHERE 1=1 --" },
        { id:'VC6', name:'DOM-Based XSS', level:'intermediate', vector:'<img src=x onerror=alert(1)>' },
        { id:'VC7', name:'Path Traversal', level:'intermediate', vector:'../server_config.txt in download' },
        { id:'VC8', name:'CSRF — Profile Update', level:'intermediate', vector:'No CSRF token — POST /api/profile' },
      ]},
    ]
  },
  {
    number: 2, title: 'NEXUSCORE', subtitle: '8 Advanced Vulnerabilities — Final Round',
    difficulty: 'ADVANCED', difficultyClass: 'advanced',
    format: 'Red Team vs Blue Team', duration: 'Extended', totalVulns: 8, port: 'Port 7007',
    targetUrl: 'http://localhost:7007',
    vulns: [
      { id:'V1', name:'Server-Side Request Forgery (SSRF)', level:'advanced', vector:'Fetch internal metadata via localhost', endpoint:'/api/integrations/fetch' },
      { id:'V2', name:'XML External Entity (XXE)', level:'advanced', vector:'SYSTEM "file:///etc/passwd" in DOCTYPE', endpoint:'/api/reports/upload' },
      { id:'V3', name:'Command Injection', level:'advanced', vector:'127.0.0.1; whoami — unsanitised host', endpoint:'/api/diagnostics/run' },
      { id:'V4', name:'JWT Algorithm Confusion', level:'advanced', vector:'RS256→HS256, sign with public key', endpoint:'/api/admin/users' },
      { id:'V5', name:'Race Condition', level:'advanced', vector:'10 parallel POSTs → over-consume license', endpoint:'/api/licenses/redeem' },
      { id:'V6', name:'Insecure Deserialization', level:'advanced', vector:'Malicious pickle payload → RCE', endpoint:'/api/session/import' },
      { id:'V7', name:'GraphQL Injection', level:'advanced', vector:'__schema introspection → secret data', endpoint:'/api/graphql' },
      { id:'V8', name:'Server-Side Template Injection', level:'advanced', vector:'{{7*7}} → {{config}} → RCE via Jinja2', endpoint:'/api/notifications/preview' },
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

function VulnTable({ vulns, showEndpoint }: { vulns: Vulnerability[]; showEndpoint?: boolean }) {
  return (
    <table style={s.table}>
      <thead><tr>
        <th style={s.th}>#</th><th style={s.th}>Vulnerability</th><th style={s.th}>Level</th>
        {showEndpoint && <th style={s.th}>Endpoint</th>}
        <th style={s.th}>Attack Vector</th>
      </tr></thead>
      <tbody>
        {vulns.map(v => (
          <tr key={v.id}>
            <td style={s.td}><span style={s.vulnId}>{v.id}</span></td>
            <td style={s.td}><span style={s.vulnName}>{v.name}</span></td>
            <td style={s.td}><span style={s.vulnLevel(v.level)}>{v.level}</span></td>
            {showEndpoint && <td style={s.td}><code style={s.endpoint}>{v.endpoint}</code></td>}
            <td style={s.td}><span style={s.vulnVec}>{v.vector}</span></td>
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
                    {round.branches?.map(branch => (
                      <div key={branch.name} style={{ marginBottom: '1.25rem' }}>
                        <div style={s.branchHdr}>
                          <div style={s.dot} />
                          <span style={s.branchName}>{branch.name}</span>
                          <button onClick={() => navigate(`/hacklab?target=${encodeURIComponent(branch.targetUrl)}&round=${encodeURIComponent(branch.name)}`)} style={s.branchLaunch}>▸ LAUNCH</button>
                        </div>
                        <VulnTable vulns={branch.vulns} />
                      </div>
                    ))}
                    {round.vulns && <VulnTable vulns={round.vulns} showEndpoint />}
                    {round.targetUrl && (
                      <div style={s.launchBar}>
                        <div>
                          <span style={s.launchLabel}>Target System</span><br/>
                          <span style={s.launchUrl}>{round.targetUrl}</span>
                        </div>
                        <button onClick={() => navigate(`/hacklab?target=${encodeURIComponent(round.targetUrl!)}&round=${encodeURIComponent(round.title)}`)} style={s.launchBtn}>▸ LAUNCH TARGET</button>
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