# NEXUS PROTOCOL — Quick Start

## Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL 17 (already installed)

## Start Everything

Double-click `start-all.bat` — it installs dependencies, initialises the DB, and launches all servers.

## URLs

| Service | URL |
|---------|-----|
| Main Game | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Round 1 — Vidyatech | http://localhost:5000 |
| Round 1 Monitor | http://localhost:8080 |

## Credentials

| Role | Team Name | Access Code |
|------|-----------|-------------|
| Red Team | `RedTeam` | `RED@Nexus2024!` |
| Blue Team | `BlueTeam` | `BLUE@Nexus2024!` |
| Admin Panel | — | `ADMIN-8821` |

Admin panel: http://localhost:5173/admin

## Round 1 — Vidyatech (15 Vulnerabilities, 60 min)

| # | Vulnerability | Level | Points |
|---|--------------|-------|--------|
| V1 | SQL Injection — Student Login | Beginner | 40 |
| V2 | Stored XSS — Notice Board | Beginner | 40 |
| V3 | Default Credentials — Staff Portal | Beginner | 40 |
| V4 | Directory Traversal — Resources | Beginner | 40 |
| V5 | Sensitive Data Exposure | Beginner | 40 |
| V6 | Hardcoded Admin Login | Beginner | 40 |
| V7 | Unrestricted File Upload | Beginner | 40 |
| V8 | Clickjacking — Missing X-Frame-Options | Beginner | 40 |
| V9 | Weak Password Policy | Beginner | 40 |
| V10 | CSRF — Email Hijack | Beginner | 40 |
| V11 | JWT alg:none — API Auth Bypass | Intermediate | 100 |
| V12 | IDOR — Student Results | Intermediate | 100 |
| V13 | Command Injection — NSLookup Tool | Intermediate | 100 |
| V14 | PyYAML Unsafe Load — RCE | Advanced | 150 |
| V15 | Debug Endpoint — Secret Key Leak + SSRF | Advanced | 150 |

**Total: 1100 pts**

## Stop Everything

Double-click `stop-all.bat`.

## LAN Access

Players on the same network can access the game at `http://<YOUR_IP>:5173`.  
Update `CORS_ORIGIN` in `backend/.env` with your machine's IP if needed.
