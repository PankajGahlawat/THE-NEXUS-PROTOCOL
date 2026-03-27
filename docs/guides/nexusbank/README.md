# ⚡ NexusBank — 3 Branches Setup Guide

## 🚀 Quick Start (Run everything)

```bash
# Step 1: Install dependencies (only first time)
cd branch-a/backend && npm install
cd ../../branch-b/backend && npm install
cd ../../branch-c/backend && npm install

cd ../branch-a/frontend && npm install
cd ../../branch-b/frontend && npm install
cd ../../branch-c/frontend && npm install
cd ../..

# Step 2: Run all 6 servers (open 6 terminals OR use the script below)
```

### Windows — Open 6 CMD windows:
```
Terminal 1: cd branch-a\backend   && node server.js
Terminal 2: cd branch-b\backend   && node server.js
Terminal 3: cd branch-c\backend   && node server.js
Terminal 4: cd branch-a\frontend  && npm run dev
Terminal 5: cd branch-b\frontend  && npm run dev
Terminal 6: cd branch-c\frontend  && npm run dev
```

### Linux/Mac — One command:
```bash
chmod +x start.sh && ./start.sh
```

---

## 🌐 URLs After Starting

| Branch | Frontend | Backend API |
|--------|----------|-------------|
| 🏦 Branch A — Andheri | http://localhost:5173 | http://localhost:3001 |
| 🏦 Branch B — Bandra  | http://localhost:5174 | http://localhost:3002 |
| 🏦 Branch C — Colaba  | http://localhost:5175 | http://localhost:3003 |

---

## 🔑 Login Credentials

### Branch A — Andheri
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| alice | password | Customer |
| bob | bob123 | Customer |
| charlie | charlie | Customer |

### Branch B — Bandra
| Username | Password | Role |
|----------|----------|------|
| admin | admin@bandra | Admin |
| priya | priya123 | Customer |
| rohan | rohan456 | Customer |
| meera | meera789 | Customer |

### Branch C — Colaba
| Username | Password | Role |
|----------|----------|------|
| admin | admin | Admin (default!) |
| manager | manager123 | Manager |
| kavya | kavya123 | Customer |
| suresh | suresh456 | Customer |

---

## 🔴 Vulnerability Summary

### Branch A — Andheri (8 Vulns)
| # | Vulnerability | Level |
|---|--------------|-------|
| 1 | Sensitive Data in HTML Source (admin creds in comment) | Beginner |
| 2 | IDOR — View any account (ACC001–ACC005) | Beginner |
| 3 | Broken Auth — Weak/hardcoded credentials | Beginner |
| 4 | Sensitive Data API — /api/all-accounts (no auth) | Beginner |
| 5 | SQL Injection — Login bypass | Intermediate |
| 6 | Stored XSS — Feedback form | Intermediate |
| 7 | Directory Traversal — Statement download | Intermediate |
| 8 | CSRF — Fund transfer (no token) | Intermediate |

### Branch B — Bandra (8 Vulns)
| # | Vulnerability | Level |
|---|--------------|-------|
| 1 | JWT Weak Secret ('secret') — Forge admin token | Beginner |
| 2 | IDOR — Transaction history of any account | Beginner |
| 3 | Broken Auth — No account lockout (brute force) | Beginner |
| 4 | Mass Assignment — Change role/balance via API | Intermediate |
| 5 | SQL Injection — Search accounts | Intermediate |
| 6 | Reflected XSS — Search results | Intermediate |
| 7 | Insecure File Access — internal_audit.txt | Intermediate |
| 8 | Broken Access Control — Admin panel via JWT forge | Intermediate |

### Branch C — Colaba (8 Vulns)
| # | Vulnerability | Level |
|---|--------------|-------|
| 1 | Cookie Manipulation — Tamper base64 session | Beginner |
| 2 | IDOR — Loan details (ID 1–4) | Beginner |
| 3 | Broken Auth — Default credentials (admin/admin) | Beginner |
| 4 | API Enumeration — Support ticket IDs | Beginner |
| 5 | SQL Injection — Profile update | Intermediate |
| 6 | DOM-based XSS — (via React rendering) | Intermediate |
| 7 | Path Traversal — ../server_config.txt | Intermediate |
| 8 | CSRF — Nominee update | Intermediate |

---

## ⏱️ 45-Minute Challenge Flow

```
0:00–0:10  →  Beginner tasks (HTML source, IDOR, default creds, API)
0:10–0:30  →  Intermediate tasks (SQLi, XSS, traversal, JWT/cookie)
0:30–0:45  →  Complete remaining + bonus challenges
```

---

## 🆘 Troubleshooting

**Port already in use:**
```bash
# Kill process on port
npx kill-port 3001 3002 3003 5173 5174 5175
```

**npm install fails:**
```bash
npm install --legacy-peer-deps
```

**SQLite error on Windows:**
```bash
npm install --build-from-source
```
