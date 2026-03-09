/**
 * NEXUS PROTOCOL - Rounds Page Component
 * Displays CTF round information with vulnerability details
 * Version: 1.0.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoundsPage.css';

interface Vulnerability {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  vector: string;
  endpoint?: string;
}

interface Branch {
  name: string;
  port: string;
  vulns: Vulnerability[];
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
  branches?: Branch[];
  vulns?: Vulnerability[];
  downloadFile: string;
  downloadName: string;
}

const roundsData: Round[] = [
  {
    number: 1,
    title: 'NEXUSBANK',
    subtitle: 'Three Branches — 24 Vulnerabilities',
    difficulty: 'BEGINNER → INTERMEDIATE',
    difficultyClass: 'beginner',
    format: 'Red Team vs Blue Team CTF',
    duration: '45 Minutes',
    totalVulns: 24,
    downloadFile: '/rounds/NEXXUS.zip',
    downloadName: 'NEXXUS.zip',
    branches: [
      {
        name: 'Branch A — Andheri',
        port: 'Port 5001',
        vulns: [
          { id: 'VA1', name: 'Sensitive Data in HTML Source', level: 'beginner', vector: 'View page source, find admin creds in comment' },
          { id: 'VA2', name: 'IDOR — Account Access', level: 'beginner', vector: 'Change ACC002 → ACC001 in URL' },
          { id: 'VA3', name: 'Broken Auth — Weak Passwords', level: 'beginner', vector: 'Login with guessable password' },
          { id: 'VA4', name: 'Sensitive Data API', level: 'beginner', vector: 'GET /api/all-accounts — no auth' },
          { id: 'VA5', name: 'SQL Injection — Login', level: 'intermediate', vector: "admin' OR '1'='1' -- in username" },
          { id: 'VA6', name: 'Stored XSS — Feedback', level: 'intermediate', vector: '<script>alert(1)</script> in form' },
          { id: 'VA7', name: 'Directory Traversal', level: 'intermediate', vector: '../../secret.txt in download' },
          { id: 'VA8', name: 'CSRF — Fund Transfer', level: 'intermediate', vector: 'No token; cross-origin POST' },
        ]
      },
      {
        name: 'Branch B — Bandra',
        port: 'Port 5002',
        vulns: [
          { id: 'VB1', name: 'JWT Weak Secret', level: 'beginner', vector: 'Secret="secret"; forge admin JWT' },
          { id: 'VB2', name: 'IDOR — Transactions', level: 'beginner', vector: 'Change BAC001 in URL' },
          { id: 'VB3', name: 'Broken Auth — No Lockout', level: 'beginner', vector: 'Brute force — no rate limiting' },
          { id: 'VB4', name: 'Mass Assignment', level: 'intermediate', vector: 'PUT /api/profile with role=admin' },
          { id: 'VB5', name: 'SQL Injection — Search', level: 'intermediate', vector: "' OR '1'='1 in search" },
          { id: 'VB6', name: 'Reflected XSS — Search', level: 'intermediate', vector: '<img src=x onerror=alert(1)>' },
          { id: 'VB7', name: 'Insecure File Access', level: 'intermediate', vector: 'GET /api/docs/internal_audit.txt' },
          { id: 'VB8', name: 'Broken Access Control', level: 'intermediate', vector: 'Forge JWT role=admin → /api/admin' },
        ]
      },
      {
        name: 'Branch C — Colaba',
        port: 'Port 5003',
        vulns: [
          { id: 'VC1', name: 'Cookie Manipulation', level: 'beginner', vector: 'Decode base64 cookie, change role' },
          { id: 'VC2', name: 'IDOR — Loan Details', level: 'beginner', vector: 'GET /api/loan/4 reveals admin loan' },
          { id: 'VC3', name: 'Default Credentials', level: 'beginner', vector: 'Login with admin / admin' },
          { id: 'VC4', name: 'API Enumeration', level: 'beginner', vector: 'GET /api/ticket/1, /2, /3' },
          { id: 'VC5', name: 'SQL Injection — Profile', level: 'intermediate', vector: "nominee='HACKED' WHERE 1=1 --" },
          { id: 'VC6', name: 'DOM-Based XSS', level: 'intermediate', vector: '<img src=x onerror=alert(1)>' },
          { id: 'VC7', name: 'Path Traversal', level: 'intermediate', vector: '../server_config.txt in download' },
          { id: 'VC8', name: 'CSRF — Profile Update', level: 'intermediate', vector: 'No CSRF token — POST /api/profile' },
        ]
      }
    ]
  },
  {
    number: 2,
    title: 'NEXUSCORE',
    subtitle: '8 Advanced Vulnerabilities — Winner Selection',
    difficulty: 'ADVANCED',
    difficultyClass: 'advanced',
    format: 'Red Team vs Blue Team CTF',
    duration: 'Extended',
    totalVulns: 8,
    port: 'Port 7007',
    downloadFile: '/rounds/NexusCore_Round2_CTF.zip',
    downloadName: 'NexusCore_Round2_CTF.zip',
    vulns: [
      { id: 'V1', name: 'Server-Side Request Forgery (SSRF)', level: 'advanced', vector: 'Fetch internal metadata via localhost', endpoint: '/api/integrations/fetch' },
      { id: 'V2', name: 'XML External Entity (XXE)', level: 'advanced', vector: 'SYSTEM "file:///etc/passwd" in DOCTYPE', endpoint: '/api/reports/upload' },
      { id: 'V3', name: 'Command Injection', level: 'advanced', vector: '127.0.0.1; whoami — unsanitised host', endpoint: '/api/diagnostics/run' },
      { id: 'V4', name: 'JWT Algorithm Confusion', level: 'advanced', vector: 'RS256→HS256, sign with public key', endpoint: '/api/admin/users' },
      { id: 'V5', name: 'Race Condition', level: 'advanced', vector: '10 parallel POSTs → over-consume license', endpoint: '/api/licenses/redeem' },
      { id: 'V6', name: 'Insecure Deserialization', level: 'advanced', vector: 'Malicious pickle payload → RCE', endpoint: '/api/session/import' },
      { id: 'V7', name: 'GraphQL Injection', level: 'advanced', vector: '__schema introspection → secret data', endpoint: '/api/graphql' },
      { id: 'V8', name: 'Server-Side Template Injection', level: 'advanced', vector: '{{7*7}} → {{config}} → RCE via Jinja2', endpoint: '/api/notifications/preview' },
    ]
  }
];

function VulnTable({ vulns, showEndpoint }: { vulns: Vulnerability[]; showEndpoint?: boolean }) {
  return (
    <table className="vuln-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Vulnerability</th>
          <th>Level</th>
          {showEndpoint && <th>Endpoint</th>}
          <th>Attack Vector</th>
        </tr>
      </thead>
      <tbody>
        {vulns.map((vuln) => (
          <tr key={vuln.id}>
            <td><span className="vuln-id">{vuln.id}</span></td>
            <td><span className="vuln-name">{vuln.name}</span></td>
            <td><span className={`vuln-level ${vuln.level}`}>{vuln.level}</span></td>
            {showEndpoint && <td><code style={{ color: '#22d3ee', fontSize: '0.7rem' }}>{vuln.endpoint}</code></td>}
            <td><span className="vuln-vector">{vuln.vector}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function RoundsPage() {
  const navigate = useNavigate();
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));

  const toggleRound = (roundNum: number) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      if (next.has(roundNum)) {
        next.delete(roundNum);
      } else {
        next.add(roundNum);
      }
      return next;
    });
  };

  return (
    <div className="rounds-page">
      {/* Navigation */}
      <nav className="rounds-back-nav">
        <button className="back-btn" onClick={() => navigate('/')}>
          <span className="arrow">←</span> BACK TO NEXUS
        </button>
        <span className="rounds-nav-title">
          CTF <span className="accent">/</span> ROUNDS
        </span>
        <div style={{ width: '140px' }} />
      </nav>

      {/* Header */}
      <div className="rounds-header">
        <span className="section-tag">// CTF_CHALLENGES</span>
        <h1 className="page-title">OPERATION ROUNDS</h1>
        <p className="page-subtitle">
          Two rounds of Capture The Flag challenges. From beginner-level banking vulnerabilities
          to advanced exploitation techniques. Download the challenge files and begin your mission.
        </p>
      </div>

      {/* Round Cards */}
      <div className="rounds-container">
        {roundsData.map((round) => {
          const isExpanded = expandedRounds.has(round.number);
          return (
            <div key={round.number} className={`round-card ${isExpanded ? 'expanded' : ''}`}>
              {/* Header */}
              <div className="round-card-header" onClick={() => toggleRound(round.number)}>
                <div className="round-header-left">
                  <span className="round-number">0{round.number}</span>
                  <div className="round-title-block">
                    <h2 className="round-title">{round.title}</h2>
                    <span className="round-subtitle">{round.subtitle}</span>
                  </div>
                </div>
                <div className="round-header-right">
                  <span className={`round-badge ${round.difficultyClass}`}>{round.difficulty}</span>
                  <span className="expand-icon">▾</span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="round-meta">
                <div className="meta-item">
                  <span className="meta-icon">◈</span>
                  <span className="meta-label">Format:</span>
                  <span className="meta-value">{round.format}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">◉</span>
                  <span className="meta-label">Duration:</span>
                  <span className="meta-value">{round.duration}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">◎</span>
                  <span className="meta-label">Vulnerabilities:</span>
                  <span className="meta-value">{round.totalVulns}</span>
                </div>
                {round.port && (
                  <div className="meta-item">
                    <span className="meta-icon">▸</span>
                    <span className="meta-label">Target:</span>
                    <span className="meta-value">{round.port}</span>
                  </div>
                )}
              </div>

              {/* Expandable Body */}
              <div className="round-card-body">
                <div className="round-card-content">
                  {/* Round 1: Branches */}
                  {round.branches && round.branches.map((branch) => (
                    <div key={branch.name} className="branch-section">
                      <div className="branch-header">
                        <div className="branch-indicator" />
                        <span className="branch-name">{branch.name}</span>
                        <span className="branch-port">{branch.port}</span>
                      </div>
                      <VulnTable vulns={branch.vulns} />
                    </div>
                  ))}

                  {/* Round 2: Direct vulns */}
                  {round.vulns && (
                    <VulnTable vulns={round.vulns} showEndpoint />
                  )}

                  {/* Download */}
                  <div className="round-download">
                    <div className="download-info">
                      <span className="download-label">Challenge Files</span>
                      <span className="download-filename">{round.downloadName}</span>
                    </div>
                    <a
                      href={round.downloadFile}
                      download
                      className="download-btn"
                    >
                      <span className="download-icon">↓</span>
                      DOWNLOAD
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
