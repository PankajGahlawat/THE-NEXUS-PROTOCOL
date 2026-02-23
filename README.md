# 🎮 NEXUS PROTOCOL - Cyber Warfare Simulation Game

**A real-time multiplayer cyber-warfare simulation game featuring Red Team vs Blue Team gameplay with authentic hacking tools and defensive strategies.**

[![Security](https://img.shields.io/badge/Security-Hardened-green)](security/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](docker-compose.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ (for credential generation)
- 4GB RAM minimum
- Ports 3000, 3001, 5432 available

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nexus-protocol
```

2. **Generate secure credentials**
```bash
# Linux/Mac
chmod +x scripts/setup-security.sh
./scripts/setup-security.sh

# Windows
scripts\setup-security.bat
```

3. **Deploy**
```bash
docker-compose up -d
```

4. **Access the game**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

---

## 📁 Project Structure

```
nexus-protocol/
├── 📁 backend/              # Node.js/Express backend
│   ├── game/               # Game engine & logic
│   ├── middleware/         # Security & auth
│   ├── models/             # Database models
│   ├── routes/             # API endpoints
│   ├── realtime/           # WebSocket handlers
│   ├── validation/         # Input validation
│   ├── migrations/         # Database migrations
│   └── test/               # Test suites
│
├── 📁 frontend/             # React/TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── App.tsx         # Main app
│   ├── public/             # Static assets
│   └── dist/               # Build output
│
├── 📁 vm-automation/        # VM management (optional)
│   ├── VMManager.js        # Libvirt integration
│   └── server.js           # VM API server
│
├── 📁 documentation/        # Project documentation
│   ├── archive/            # Historical docs
│   ├── API.md              # API reference
│   ├── INSTALLATION_GUIDE.md
│   ├── OPERATOR_GUIDE.md
│   ├── PROJECT_OVERVIEW.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   └── USER_GUIDE.md
│
├── 📁 scripts/              # Deployment scripts
│   ├── setup-security.sh   # Security setup (Linux/Mac)
│   ├── setup-security.bat  # Security setup (Windows)
│   └── deploy.ps1          # PowerShell deployment
│
├── 📁 security/             # Security documentation
│   ├── SECURITY_AUDIT_REPORT.md
│   ├── SECURITY_FIXES_APPLIED.md
│   ├── SECURITY_SETUP_COMPLETE.md
│   └── SECURE_DEPLOYMENT_GUIDE.md
│
├── .env                     # Environment variables (gitignored)
├── .env.example             # Example configuration
├── docker-compose.yml       # Docker orchestration
└── README.md                # This file
```

---

## 🎮 Game Features

### Red Team (Offensive)
- **Agents:** Infiltrator, Architect, Saboteur
- **Tools:** nmap, sqlmap, metasploit, mimikatz, hydra
- **Objectives:** Initial Access → Privilege Escalation → Data Exfiltration
- **Mechanics:** Stealth system, trace accumulation, burn states

### Blue Team (Defensive)
- **Detection:** IDS monitoring, anomaly detection
- **Response:** Firewall rules, IP blocking, system restore
- **Tools:** Forensics, rootkit detection, network monitoring
- **Objectives:** Detect, contain, and recover from attacks

### Core Mechanics
- **Real-time multiplayer** via WebSocket
- **Trace & Burn system** - stealth vs detection
- **Dynamic scoring** - speed, stealth, and effectiveness bonuses
- **Mission phases** - Initial Access, Escalation, Impact/Recovery
- **Persistent leaderboards** with PostgreSQL

---

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with 2-hour expiration
- bcrypt password hashing
- Session management with database validation
- Role-based access control

### Network Security
- Explicit CORS allowlist (no wildcards)
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Request size limits (1MB)
- Security headers (HSTS, CSP, X-Frame-Options)

### Container Security
- No privileged containers
- Specific capabilities only (SYS_ADMIN, NET_ADMIN)
- Network isolation
- Volume persistence

### Database Security
- Prepared statements (SQL injection prevention)
- Connection pooling
- Strong password requirements
- Encrypted connections

**See [security/](security/) for detailed security documentation.**

---

## 🛠️ Technology Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- GSAP (animations)
- Socket.IO Client (real-time)
- Nginx (production server)

### Backend
- Node.js 18 + Express.js
- Socket.IO (WebSocket)
- PostgreSQL 15 (database)
- JWT + bcrypt (auth)
- Helmet (security)
- Winston (logging)

### DevOps
- Docker + Docker Compose
- Multi-stage builds
- Health checks
- Auto-restart
- Volume persistence

---

## 📚 Documentation

### Getting Started
- [Installation Guide](documentation/INSTALLATION_GUIDE.md) - Detailed setup instructions
- [User Guide](documentation/USER_GUIDE.md) - How to play the game
- [Secure Deployment Guide](security/SECURE_DEPLOYMENT_GUIDE.md) - Production deployment

### Technical
- [Technical Architecture](documentation/TECHNICAL_ARCHITECTURE.md) - System design
- [API Documentation](documentation/API.md) - REST API reference
- [Project Overview](documentation/PROJECT_OVERVIEW.md) - High-level overview

### Operations
- [Operator Guide](documentation/OPERATOR_GUIDE.md) - Running and maintaining
- [Security Audit Report](security/SECURITY_AUDIT_REPORT.md) - Security analysis
- [Security Fixes Applied](security/SECURITY_FIXES_APPLIED.md) - Security changelog

---

## 🔧 Configuration

### Environment Variables

Required (must be set in `.env`):
```bash
JWT_SECRET=<64-byte-hex-string>      # Generate with setup script
POSTGRES_PASSWORD=<32-byte-hex>      # Generate with setup script
```

Optional (with defaults):
```bash
NODE_ENV=production
FRONTEND_PORT=3000
BACKEND_PORT=3001
POSTGRES_PORT=5432
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=100
MAX_REQUEST_SIZE=1mb
```

**See [.env.example](.env.example) for all available options.**

---

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose exec backend npm test
```

### Security Testing
```bash
# Test CORS protection
curl -H "Origin: http://evil.com" http://localhost:3001/health

# Test rate limiting
for i in {1..101}; do curl http://localhost:3001/health; done

# Test authentication
curl http://localhost:3001/api/v1/game/state
# Should return 401 Unauthorized
```

---

## 🚨 Troubleshooting

### Server won't start
```bash
# Check if .env file exists
ls -la .env

# Verify credentials are set
grep JWT_SECRET .env
grep POSTGRES_PASSWORD .env

# Check Docker logs
docker-compose logs backend
```

### Database connection failed
```bash
# Restart with fresh database
docker-compose down -v
docker-compose up -d
```

### Port already in use
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Change ports in .env
FRONTEND_PORT=8000
BACKEND_PORT=8001
```

**See [documentation/OPERATOR_GUIDE.md](documentation/OPERATOR_GUIDE.md) for more troubleshooting.**

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Backend development
cd backend
npm install
npm run dev

# Frontend development
cd frontend
npm install
npm run dev
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by real-world cyber security tools and techniques
- Built with modern web technologies
- Designed for educational and training purposes

---

## 📞 Support

- **Documentation:** [documentation/](documentation/)
- **Security Issues:** [security/SECURITY_AUDIT_REPORT.md](security/SECURITY_AUDIT_REPORT.md)
- **Bug Reports:** Open an issue on GitHub
- **Questions:** Check [documentation/USER_GUIDE.md](documentation/USER_GUIDE.md)

---

## 🎯 Roadmap

- [x] Core game mechanics
- [x] Real-time multiplayer
- [x] Security hardening
- [x] Docker deployment
- [ ] HTTPS/TLS support
- [ ] Advanced analytics
- [ ] Tournament mode
- [ ] Mobile support

---

**Built with ❤️ for the cybersecurity community**

**Version:** 2.0.0  
**Last Updated:** February 23, 2026  
**Status:** Production Ready ✅
