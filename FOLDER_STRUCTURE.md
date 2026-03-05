# 📁 NEXUS PROTOCOL - Folder Structure

## Current Organization (Clean & Professional)

```
nexus-protocol/
│
├── 📁 backend/                          # Backend Application
│   ├── 📁 emergency/                    # Emergency systems
│   │   └── KillSwitch.js               # Emergency shutdown
│   ├── 📁 game/                         # Game engine
│   │   ├── 📁 tools/                   # Game tools
│   │   │   ├── BlueTeamTools.js        # Defensive tools
│   │   │   └── RedTeamTools.js         # Offensive tools
│   │   ├── AgentRouter.js              # Agent routing
│   │   ├── BurnCalculator.js           # Burn state calculation
│   │   ├── DetectionSystem.js          # Detection logic
│   │   ├── EffectivenessCalculator.js  # Tool effectiveness
│   │   ├── EnhancedGameEngine.js       # Main game engine
│   │   ├── GameEngine.js               # Legacy engine
│   │   ├── MissionLogicEngine.js       # Mission logic
│   │   ├── ScoringEngine.js            # Scoring system
│   │   ├── ScoringIntegration.js       # Score integration
│   │   ├── SystemInteractor.js         # System interaction
│   │   ├── SystemStateManager.js       # State management
│   │   ├── TaskDependencyGraph.js      # Task dependencies
│   │   ├── ToolExecutionEngine.js      # Tool execution
│   │   ├── TraceAccumulator.js         # Trace tracking
│   │   └── TraceBurnSystem.js          # Trace/burn system
│   ├── 📁 logging/                      # Logging systems
│   │   └── AuditLogger.js              # Security audit logs
│   ├── 📁 middleware/                   # Express middleware
│   │   ├── auth.js                     # Authentication
│   │   ├── errorHandler.js             # Error handling
│   │   ├── inputValidation.js          # Input validation
│   │   ├── security.js                 # Security middleware
│   │   ├── websocket.js                # WebSocket security
│   │   └── websocketSecurity.js        # WS security (legacy)
│   ├── 📁 migrations/                   # Database migrations
│   │   ├── 001_initial_schema.sql      # Initial schema
│   │   ├── IMPLEMENTATION_SUMMARY.md   # Migration docs
│   │   └── README.md                   # Migration guide
│   ├── 📁 models/                       # Database models
│   │   ├── database.js                 # Database interface
│   │   ├── PostgreSQLDatabase.js       # PostgreSQL adapter
│   │   └── SQLiteDatabase.js           # SQLite adapter
│   ├── 📁 realtime/                     # Real-time systems
│   │   ├── MessageQueue.js             # Message queuing
│   │   ├── RealTimeSyncSystem.js       # Sync system
│   │   └── RoomManager.js              # Room management
│   ├── 📁 routes/                       # API routes
│   │   ├── admin.js                    # Admin routes
│   │   └── health.js                   # Health check
│   ├── 📁 scripts/                      # Utility scripts
│   │   ├── init-database.js            # DB initialization
│   │   └── migrate-to-postgres.js      # Migration script
│   ├── 📁 test/                         # Test suites
│   │   ├── detection-test.js           # Detection tests
│   │   ├── error-handler-test.js       # Error handler tests
│   │   ├── kill-switch-test.js         # Kill switch tests
│   │   ├── mission-logic-test.js       # Mission logic tests
│   │   ├── mission-tool-integration-test.js
│   │   ├── postgres-test.js            # Database tests
│   │   ├── realtime-sync-test.js       # Real-time tests
│   │   ├── scoring-integration-test.js # Scoring tests
│   │   ├── scoring-test.js             # Score calculation tests
│   │   ├── system-state-test.js        # State management tests
│   │   ├── tool-execution-test.js      # Tool execution tests
│   │   ├── trace-burn-test.js          # Trace/burn tests
│   │   └── validator-test.js           # Validation tests
│   ├── 📁 validation/                   # Validation systems
│   │   ├── CyberRangeValidator.js      # Range validation
│   │   ├── NetworkTopologyChecker.js   # Network validation
│   │   ├── SystemStateVerifier.js      # State verification
│   │   └── README.md                   # Validation docs
│   ├── .env                            # Environment config (gitignored)
│   ├── .env.example                    # Example config
│   ├── .env.production                 # Production config
│   ├── Dockerfile                      # Docker build
│   ├── index_enhanced.js               # Main server
│   ├── package.json                    # Dependencies
│   ├── package-lock.json               # Dependency lock
│   ├── README.md                       # Backend docs
│   ├── seed-data.js                    # Database seeding
│   └── server.js                       # Simple server
│
├── 📁 frontend/                         # Frontend Application
│   ├── 📁 dist/                        # Build output (gitignored)
│   ├── 📁 node_modules/                # Dependencies (gitignored)
│   ├── 📁 public/                      # Static assets
│   │   ├── 📁 assets/                  # Game assets
│   │   │   ├── 📁 agents/             # Agent images
│   │   │   ├── 📁 features/           # Feature images
│   │   │   └── 📁 story/              # Story images
│   │   ├── 📁 audio/                   # Audio files
│   │   │   └── gamevoice.mp3          # Game audio
│   │   └── vite.svg                    # Vite logo
│   ├── 📁 src/                         # Source code
│   │   ├── 📁 components/              # React components
│   │   │   ├── 📁 Admin/              # Admin components
│   │   │   ├── 📁 Agent/              # Agent selection
│   │   │   ├── 📁 Auth/               # Authentication
│   │   │   ├── 📁 Game/               # Game components
│   │   │   ├── 📁 Landing/            # Landing page
│   │   │   └── 📁 Mission/            # Mission components
│   │   ├── 📁 hooks/                   # Custom React hooks
│   │   │   └── useTraceBurn.ts        # Trace/burn hook
│   │   ├── 📁 types/                   # TypeScript types
│   │   ├── App.tsx                     # Main app component
│   │   └── main.tsx                    # Entry point
│   ├── .env.example                    # Example config
│   ├── .env.local                      # Local config (gitignored)
│   ├── .gitignore                      # Git ignore
│   ├── Dockerfile                      # Docker build
│   ├── eslint.config.js                # ESLint config
│   ├── index.html                      # HTML template
│   ├── nginx.conf                      # Nginx config
│   ├── package.json                    # Dependencies
│   ├── package-lock.json               # Dependency lock
│   ├── postcss.config.js               # PostCSS config
│   ├── README.md                       # Frontend docs
│   ├── tsconfig.json                   # TypeScript config
│   └── vite.config.ts                  # Vite config
│
├── 📁 vm-automation/                    # VM Management (Optional)
│   ├── 📁 test/                        # VM tests
│   │   └── vm-manager-test.js         # VM manager tests
│   ├── Dockerfile                      # Docker build
│   ├── package.json                    # Dependencies
│   ├── README.md                       # VM automation docs
│   ├── server.js                       # VM API server
│   └── VMManager.js                    # VM management
│
├── 📁 documentation/                    # Project Documentation
│   └── 📁 archive/                     # Historical documentation
│       ├── CHECKPOINT_21_SUMMARY.md
│       ├── FINAL_CHECKPOINT_SUMMARY.md
│       ├── GAMEPLAY_IMPLEMENTATION_PROGRESS.md
│       ├── IMPLEMENTATION_PROGRESS.md
│       ├── NEXUS_PROTOCOL_CURRENT_STATE.md
│       ├── NEXUS_PROTOCOL_INTEGRATION_GUIDE.md
│       ├── NEXUS_PROTOCOL_MASTER_DOCUMENTATION.md
│       ├── NEXUS_PROTOCOL_MERGED_README.md
│       ├── NEXUS_PROTOCOL_PROJECT_STATUS.md
│       └── NEXUS_TOOLS_AND_CONNECTIONS_GUIDE.md
│
├── 📁 scripts/                          # Deployment Scripts
│   ├── deploy.ps1                      # PowerShell deployment
│   ├── setup-security.bat              # Windows security setup
│   └── setup-security.sh               # Linux/Mac security setup
│
├── 📁 security/                         # Security Documentation
│   ├── SECURE_DEPLOYMENT_GUIDE.md      # Secure deployment
│   ├── SECURITY_AUDIT_REPORT.md        # Security audit
│   ├── SECURITY_FIXES_APPLIED.md       # Security changelog
│   └── SECURITY_SETUP_COMPLETE.md      # Setup completion
│
├── 📁 .git/                            # Git repository (hidden)
├── 📁 .kiro/                           # Kiro IDE config (hidden)
│   ├── 📁 specs/                       # Project specs
│   │   └── 📁 nexus-protocol-completion/
│   │       ├── design.md              # Design document
│   │       ├── requirements.md        # Requirements
│   │       └── tasks.md               # Task list
│   └── 📁 steering/                    # Kiro steering files
├── 📁 .vscode/                         # VS Code config (hidden)
│
├── .env                                # Environment variables (gitignored)
├── .env.example                        # Example environment file
├── .gitignore                          # Git ignore rules
├── docker-compose.yml                  # Docker orchestration
├── DOCUMENTATION_CONSOLIDATION_COMPLETE.md # Consolidation summary
├── FOLDER_STRUCTURE.md                 # This file
├── MASTER_DEPLOYMENT.md                # Complete deployment guide
├── MASTER_FEATURES.md                  # All feature implementations
├── MASTER_GUIDE.md                     # User guide + installation
├── MASTER_TECHNICAL.md                 # Technical architecture + API
├── NEXUS_PROTOCOL_Technical_Design.pdf # Technical design document
└── README.md                           # Main project readme
```

---

## 📊 File Count Summary

### By Category:
- **Backend Code:** ~50 files
- **Frontend Code:** ~100+ files
- **Documentation:** 4 MASTER files + 10 archived
- **Configuration:** 15 files
- **Tests:** 13 test files
- **Scripts:** 3 deployment scripts
- **Security Docs:** 4 files

### Total: ~190 organized files

---

## 🎯 Priority Levels

### 🔴 CRITICAL (Must Have):
- `docker-compose.yml` - Container orchestration
- `.env` - Environment configuration
- `backend/index_enhanced.js` - Main server
- `frontend/src/App.tsx` - Main frontend
- `README.md` - Project entry point
- `MASTER_GUIDE.md` - User documentation
- `MASTER_TECHNICAL.md` - Technical documentation
- `MASTER_FEATURES.md` - Feature documentation
- `MASTER_DEPLOYMENT.md` - Deployment documentation

### 🟠 IMPORTANT (Core Functionality):
- `backend/game/` - Game engine
- `backend/middleware/` - Security & auth
- `backend/models/` - Database layer
- `frontend/src/components/` - UI components
- `scripts/setup-security.*` - Security setup

### 🟡 USEFUL (Supporting):
- `backend/test/` - Test suites
- `documentation/` - Documentation
- `security/` - Security docs
- `vm-automation/` - VM management

### 🟢 OPTIONAL (Nice to Have):
- `documentation/archive/` - Historical docs
- `.kiro/` - IDE configuration
- `.vscode/` - Editor settings

---

## 🧹 Cleanup Results

### Phase 1 - Initial Cleanup:
- ❌ 38 obsolete files removed
- ❌ 3 obsolete folders removed (prototypes, docs, assets)
- ❌ Duplicate and temporary files cleaned

### Phase 2 - Documentation Consolidation:
- ✅ All documentation merged into 4 MASTER files
- ✅ 20+ documentation files consolidated
- ✅ Security docs moved to `security/`
- ✅ Scripts moved to `scripts/`
- ✅ Old docs archived to `documentation/archive/`
- ✅ Clean root directory (only essentials)

### Final Result:
- **Before:** 29 MD files in root directory
- **After:** 7 essential MD files in root (README + 4 MASTER + FOLDER_STRUCTURE + CONSOLIDATION_COMPLETE)
- **Improvement:** 76% reduction, 100% information retained in 4 comprehensive files

---

## 📝 Maintenance Guidelines

### Keep Root Clean:
- Only essential files in root
- Move scripts to `scripts/`
- Move docs to `documentation/`
- Archive old files to `documentation/archive/`

### Naming Conventions:
- Use kebab-case for files: `my-file.md`
- Use PascalCase for components: `MyComponent.tsx`
- Use camelCase for functions: `myFunction.js`
- Use UPPERCASE for constants: `README.md`, `LICENSE`

### Git Ignore:
- `.env` (contains secrets)
- `node_modules/` (dependencies)
- `dist/` (build output)
- `*.log` (log files)
- `.DS_Store` (Mac files)

---

**Last Updated:** March 3, 2026  
**Status:** Fully Consolidated - 4 MASTER Files ✅
