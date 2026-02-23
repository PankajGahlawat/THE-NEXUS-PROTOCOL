# Implementation Plan: NEXUS PROTOCOL Completion

## Overview

This implementation plan completes the NEXUS PROTOCOL cyber-war simulation game by adding mission logic, tool functionality, real-time synchronization, visual effects, database migration, validation, deployment, and production hardening. The plan follows a phased approach, building incrementally on the existing ~75% complete foundation.

The implementation uses JavaScript (Node.js) for the backend and TypeScript (React) for the frontend, maintaining consistency with the existing codebase.

## Tasks

- [x] 1. Set up Mission Logic Engine foundation
  - Create `backend/game/MissionLogicEngine.js` with round lifecycle management
  - Create `backend/game/TaskDependencyGraph.js` for task dependency tracking
  - Create `backend/game/AgentRouter.js` for agent-specific task routing
  - Implement phase transition logic (Initial Access → Escalation → Impact/Recovery at 20/40 min)
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 1.1 Write property test for round initialization
  - **Property 1: Round initialization sets Initial Access phase**
  - **Validates: Requirements 1.1**

- [ ]* 1.2 Write property test for task dependency unlocking
  - **Property 2: Task unlocking follows dependency graph**
  - **Validates: Requirements 1.4, 11.2, 11.3**

- [ ]* 1.3 Write property test for agent routing
  - **Property 3: Agent routing matches task type**
  - **Validates: Requirements 1.5, 1.6, 14.1-14.6**

- [x] 2. Implement Task Dependency System
  - [x] 2.1 Create task dependency graph data structure
    - Implement graph nodes and edges for task prerequisites
    - Add methods for adding tasks, checking dependencies, unlocking tasks
    - _Requirements: 1.4, 11.1, 11.2_
  
  - [x] 2.2 Implement task unlocking logic
    - Create method to unlock dependent tasks when prerequisites complete
    - Implement prerequisite validation before task attempts
    - _Requirements: 1.10, 11.6_
  
  - [ ]* 2.3 Write property test for prerequisite verification
    - **Property 5: Prerequisite verification blocks invalid attempts**
    - **Validates: Requirements 1.10, 11.6**
  
  - [ ]* 2.4 Write property test for early phase transition
    - **Property 6: Early phase transition on objective completion**
    - **Validates: Requirements 1.8**

- [x] 3. Checkpoint - Verify mission logic foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Tool Execution Engine
  - [x] 4.1 Create Tool Execution Engine base
    - Create `backend/game/ToolExecutionEngine.js` with tool registry
    - Create `backend/game/EffectivenessCalculator.js` for burn state penalties
    - Create `backend/game/SystemInteractor.js` for system command execution
    - _Requirements: 2.16, 2.17, 2.18_
  
  - [x] 4.2 Implement Red Team tools
    - Implement nmap (network scanning)
    - Implement sqlmap (SQL injection)
    - Implement gobuster (directory enumeration)
    - Implement hydra (password attacks)
    - Implement metasploit (exploitation)
    - Implement mimikatz (credential extraction)
    - Implement cron (persistence)
    - Implement nc/netcat (reverse shells)
    - Implement DNS tunneling (data exfiltration)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_
  
  - [x] 4.3 Implement Blue Team tools
    - Implement IDS monitoring (intrusion detection)
    - Implement firewall configuration
    - Implement IP blocking
    - Implement rootkit detection
    - Implement forensics analysis
    - Implement system restore
    - _Requirements: 2.10, 2.11, 2.12, 2.13, 2.14, 2.15_
  
  - [ ]* 4.4 Write property test for burn state effectiveness reduction
    - **Property 7: Burn state reduces tool effectiveness**
    - **Validates: Requirements 2.16**
  
  - [ ]* 4.5 Write property test for tool validation
    - **Property 8: Tool execution validates against system state**
    - **Validates: Requirements 2.17**
  
  - [ ]* 4.6 Write property test for system state updates
    - **Property 9: Tool execution updates system state**
    - **Validates: Requirements 2.18, 13.2, 13.3**
  
  - [ ]* 4.7 Write unit tests for each tool
    - Test nmap against mock vulnerable system
    - Test sqlmap with known SQL injection vulnerability
    - Test Blue Team tools with mock system states
    - _Requirements: 2.1-2.15_

- [x] 5. Checkpoint - Verify tool system
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Real-Time Synchronization System
  - [x] 6.1 Create Real-Time Sync System
    - Create `backend/realtime/RealTimeSyncSystem.js` with Socket.IO integration
    - Create `backend/realtime/RoomManager.js` for round-based rooms
    - Create `backend/realtime/MessageQueue.js` for message batching
    - Implement WebSocket event handlers for tool_use, task_attempt, subscribe_updates
    - _Requirements: 3.1, 3.2, 3.10, 3.11_
  
  - [x] 6.2 Implement observable action detection and broadcasting
    - Create detection logic for observable Red Team actions
    - Implement Blue Team alert system
    - Add state update broadcasting (task completion, score, trace, burn, phase)
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
  
  - [ ]* 6.3 Write property test for action broadcasting
    - **Property 11: Actions broadcast to all clients**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ]* 6.4 Write property test for observable action alerts
    - **Property 12: Observable actions trigger Blue Team alerts**
    - **Validates: Requirements 3.3, 12.9**
  
  - [ ]* 6.5 Write property test for state change updates
    - **Property 13: State changes trigger real-time updates**
    - **Validates: Requirements 3.4-3.9**
  
  - [ ]* 6.6 Write property test for client connection state sync
    - **Property 14: New clients receive current state**
    - **Validates: Requirements 3.10**

- [x] 7. Implement Trace & Burn System
  - [x] 7.1 Create Trace & Burn calculation engine
    - Create `backend/game/TraceBurnSystem.js` with trace accumulation
    - Create `backend/game/TraceAccumulator.js` for trace calculation
    - Create `backend/game/BurnCalculator.js` for burn state determination
    - Implement trace generation per action (5-15% base)
    - Implement stealth tool trace reduction (-20% to -50%)
    - Implement burn state thresholds (LOW: 0-25%, MODERATE: 26-50%, HIGH: 51-75%, CRITICAL: 76-100%)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.12_
  
  - [x] 7.2 Integrate trace system with tool execution
    - Add trace generation to tool execution results
    - Apply burn state penalties to tool effectiveness
    - Update trace level after each action
    - _Requirements: 2.16, 12.8_
  
  - [ ]* 7.3 Write property test for trace level visual mapping
    - **Property 16: Trace level determines visual status**
    - **Validates: Requirements 4.1-4.4**
  
  - [ ]* 7.4 Write property test for burn state visual mapping
    - **Property 17: Burn state determines visual indicators**
    - **Validates: Requirements 4.5-4.8**
  
  - [ ]* 7.5 Write property test for stealth tool trace reduction
    - **Property 18: Stealth tools reduce trace**
    - **Validates: Requirements 4.12**
  
  - [ ]* 7.6 Write property test for detection probability
    - **Property 19: Detection probability increases with burn state**
    - **Validates: Requirements 12.8**

- [x] 8. Implement Frontend Trace & Burn Visuals
  - [x] 8.1 Create Trace & Burn visual components
    - Create `frontend/src/components/Game/TraceIndicator.tsx` with GSAP animations
    - Create `frontend/src/components/Game/BurnStateDisplay.tsx` with color-coded indicators
    - Implement visual transitions for trace level changes (Ghost → Shadow → Visible → Burned)
    - Implement pulsing effects for HIGH and CRITICAL burn states
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_
  
  - [x] 8.2 Integrate visuals with WebSocket updates
    - Subscribe to trace_update and burn_update events
    - Animate trace level changes
    - Trigger countermeasure warnings at HIGH burn
    - _Requirements: 3.6, 3.7, 4.10, 4.11_

- [x] 9. Checkpoint - Verify real-time and visual systems
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement PostgreSQL Migration
  - [x] 10.1 Create PostgreSQL schema
    - Create `backend/migrations/001_initial_schema.sql` with rounds, tasks, system_states, events, agents, tools tables
    - Add indexes for performance (rounds.status, tasks.round_phase, events.round_timestamp)
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [x] 10.2 Implement PostgreSQL database adapter
    - Create `backend/models/PostgreSQLDatabase.js` implementing Database interface
    - Implement connection pooling (min: 10, max: 50)
    - Implement prepared statement usage for all queries
    - Add round data isolation by round_id
    - _Requirements: 5.1, 5.6, 5.7_
  
  - [x] 10.3 Create migration script
    - Create `backend/scripts/migrate-to-postgres.js` to migrate data from SQLite
    - Export SQLite data, transform, import to PostgreSQL
    - Verify data integrity after migration
    - _Requirements: 5.10_
  
  - [ ]* 10.4 Write property test for database round trip
    - **Property 20: Entity persistence round trip**
    - **Validates: Requirements 5.2-5.5**
  
  - [ ]* 10.5 Write property test for prepared statements
    - **Property 21: Prepared statements prevent injection**
    - **Validates: Requirements 5.6, 9.6**
  
  - [ ]* 10.6 Write property test for round isolation
    - **Property 22: Round isolation maintains data separation**
    - **Validates: Requirements 5.7**
  
  - [ ]* 10.7 Write unit tests for migration script
    - Test SQLite export
    - Test data transformation
    - Test PostgreSQL import
    - _Requirements: 5.10_

- [x] 11. Implement Cyber Range Validator
  - [x] 11.1 Create validation engine
    - Create `backend/validation/CyberRangeValidator.js` with system state verification
    - Create `backend/validation/SystemStateVerifier.js` for checking system changes
    - Create `backend/validation/NetworkTopologyChecker.js` for IP/service verification
    - Implement validation for network topology (192.168.100.0/24)
    - Implement validation for service states (Web, SSH, DB, Core)
    - Implement validation for file modifications
    - Implement validation for privilege escalation
    - Implement validation for data exfiltration
    - Implement validation for firewall rules
    - Implement validation for system restore
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  
  - [x] 11.2 Integrate validator with task completion
    - Call validator when task completion is claimed
    - Return validation result with descriptive errors
    - Update task status based on validation result
    - _Requirements: 1.7, 6.10_
  
  - [ ]* 11.3 Write property test for validation verification
    - **Property 24: Validation verifies claimed actions**
    - **Validates: Requirements 6.1-6.8**
  
  - [ ]* 11.4 Write property test for validation error messages
    - **Property 25: Validation failures provide descriptive errors**
    - **Validates: Requirements 6.10**
  
  - [ ]* 11.5 Write property test for VM health checks
    - **Property 26: VM health affects validation**
    - **Validates: Requirements 6.9**

- [x] 12. Implement System State Management
  - [x] 12.1 Create System State Manager
    - Create `backend/game/SystemStateManager.js` for state tracking
    - Implement state initialization at round start
    - Implement state updates on actions
    - Implement state queries
    - Implement compromise tracking
    - Implement state restoration
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 12.2 Add concurrency control
    - Implement state update serialization to prevent race conditions
    - Add optimistic locking for concurrent updates
    - _Requirements: 13.7_
  
  - [ ]* 12.3 Write property test for state initialization
    - **Property 36: State initialization at round start**
    - **Validates: Requirements 13.1**
  
  - [ ]* 12.4 Write property test for state updates
    - **Property 37: State updates reflect actions**
    - **Validates: Requirements 13.2, 13.3**
  
  - [ ]* 12.5 Write property test for state queries
    - **Property 38: State queries return current state**
    - **Validates: Requirements 13.4**
  
  - [ ]* 12.6 Write property test for compromise tracking
    - **Property 39: Compromise tracking**
    - **Validates: Requirements 13.5**

- [x] 13. Checkpoint - Verify validation and state management
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement Scoring System
  - [x] 14.1 Create Scoring Engine
    - Create `backend/game/ScoringEngine.js` with point calculation
    - Implement task completion scoring (base points by difficulty and phase)
    - Implement speed bonus (time remaining * 10)
    - Implement stealth bonus ((100 - trace) * 20)
    - Implement detection points for Blue Team
    - Implement containment points for Blue Team
    - Implement recovery points for Blue Team
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 14.2 Integrate scoring with game events
    - Award points on task completion
    - Award points on detection
    - Award points on containment
    - Award points on recovery
    - Persist scores to database
    - Broadcast score updates via WebSocket
    - _Requirements: 10.7, 10.8, 10.9_
  
  - [ ]* 14.3 Write property test for task completion scoring
    - **Property 27: Task completion awards points**
    - **Validates: Requirements 10.1**
  
  - [ ]* 14.4 Write property test for speed bonus
    - **Property 28: Speed bonus applies to fast completions**
    - **Validates: Requirements 10.2**
  
  - [ ]* 14.5 Write property test for stealth bonus
    - **Property 29: Stealth bonus applies to low trace**
    - **Validates: Requirements 10.3**
  
  - [ ]* 14.6 Write property test for detection scoring
    - **Property 30: Detection awards Blue Team points**
    - **Validates: Requirements 10.4**
  
  - [ ]* 14.7 Write property test for score persistence
    - **Property 31: Score persistence**
    - **Validates: Requirements 10.9**

- [x] 15. Implement Detection System
  - [x] 15.1 Create Detection Engine
    - Create `backend/game/DetectionSystem.js` with detection probability calculation
    - Implement observable action detection
    - Implement IDS monitoring effectiveness
    - Implement stealth tool detection reduction
    - Implement burn state detection increase
    - Generate actionable intelligence for Blue Team
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_
  
  - [ ]* 15.2 Write property test for observable action detection
    - **Property 32: Observable actions generate detection opportunities**
    - **Validates: Requirements 12.1-12.5**
  
  - [ ]* 15.3 Write property test for IDS effectiveness
    - **Property 33: IDS monitoring increases detection probability**
    - **Validates: Requirements 12.6**
  
  - [ ]* 15.4 Write property test for stealth tool effectiveness
    - **Property 34: Stealth tools reduce detection probability**
    - **Validates: Requirements 12.7**
  
  - [ ]* 15.5 Write property test for actionable intelligence
    - **Property 35: Detected actions provide actionable intelligence**
    - **Validates: Requirements 12.9, 12.10**

- [x] 16. Implement Error Handling System
  - [x] 16.1 Create Error Handler
    - Create `backend/middleware/errorHandler.js` with error categorization
    - Implement database connection retry with exponential backoff
    - Implement WebSocket reconnection logic
    - Implement validation error formatting
    - Implement unhandled exception logging
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 16.2 Implement Emergency Kill Switch
    - Create `backend/emergency/KillSwitch.js` with emergency shutdown
    - Implement round termination
    - Implement client disconnection
    - Implement state persistence before shutdown
    - Implement operator notification
    - _Requirements: 15.6, 15.7, 15.8, 9.10_
  
  - [ ]* 16.3 Write property test for database retry
    - **Property 41: Database connection retry with backoff**
    - **Validates: Requirements 15.1**
  
  - [ ]* 16.4 Write property test for WebSocket reconnection
    - **Property 42: WebSocket reconnection on disconnect**
    - **Validates: Requirements 15.3**
  
  - [ ]* 16.5 Write property test for validation error messages
    - **Property 43: Validation errors return user-friendly messages**
    - **Validates: Requirements 15.4**
  
  - [ ]* 16.6 Write property test for exception logging
    - **Property 44: Unhandled exceptions are logged**
    - **Validates: Requirements 15.5**
  
  - [ ]* 16.7 Write unit test for emergency kill switch
    - Test round termination
    - Test client disconnection
    - Test state persistence
    - **Property 45: Emergency kill switch stops all rounds**
    - **Validates: Requirements 15.6, 15.7, 15.8, 9.10**

- [x] 17. Checkpoint - Verify scoring, detection, and error handling
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Implement Production Security Hardening
  - [x] 18.1 Implement security middleware
    - Create `backend/middleware/security.js` with security headers
    - Implement CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers
    - Implement CORS whitelist validation
    - Implement rate limiting (100 requests/minute per IP)
    - Implement DDoS detection and throttling
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 18.2 Implement input validation and sanitization
    - Add input validation to all API endpoints using express-validator
    - Implement SQL injection prevention (already using prepared statements)
    - Implement XSS prevention (output encoding)
    - Implement CSRF protection
    - _Requirements: 9.5, 9.6_
  
  - [x] 18.3 Implement WebSocket security
    - Add authentication token requirement for WebSocket connections
    - Implement WebSocket message validation
    - Add rate limiting for WebSocket messages
    - _Requirements: 9.7, 9.8_
  
  - [x] 18.4 Implement audit logging
    - Create `backend/logging/AuditLogger.js` with security event logging
    - Log all authentication attempts
    - Log all state-changing operations
    - Redact sensitive data (credentials, tokens) in logs
    - _Requirements: 9.9, 9.12_
  
  - [ ]* 18.5 Write property test for security headers
    - **Property 46: Security headers applied to all responses**
    - **Validates: Requirements 9.1**
  
  - [ ]* 18.6 Write property test for CORS validation
    - **Property 47: CORS validation against whitelist**
    - **Validates: Requirements 9.2**
  
  - [ ]* 18.7 Write property test for rate limiting
    - **Property 48: Rate limiting enforced**
    - **Validates: Requirements 9.3**
  
  - [ ]* 18.8 Write property test for input validation
    - **Property 49: Input validation and sanitization**
    - **Validates: Requirements 9.5**
  
  - [ ]* 18.9 Write property test for WebSocket authentication
    - **Property 50: WebSocket authentication required**
    - **Validates: Requirements 9.7**
  
  - [ ]* 18.10 Write property test for log redaction
    - **Property 51: Sensitive data redaction in logs**
    - **Validates: Requirements 9.12**

- [x] 19. Implement Docker Deployment
  - [x] 19.1 Create Docker configuration
    - Create `backend/Dockerfile` with Node.js 18 Alpine base
    - Create `frontend/Dockerfile` with multi-stage build (Node.js builder + Nginx)
    - Create `docker-compose.yml` with backend, frontend, postgres, vm_manager services
    - Configure networks (nexus_network, cyber_range with 192.168.100.0/24)
    - Configure volumes (postgres_data, vm_snapshots)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 19.2 Configure environment variables
    - Create `.env.example` with all required variables
    - Document environment variable usage
    - Implement environment-based configuration
    - _Requirements: 7.8_
  
  - [x] 19.3 Implement health checks
    - Add health check endpoint to backend (`/health`)
    - Add Docker health check configuration
    - Implement automatic container restart on failure
    - _Requirements: 7.9_
  
  - [ ]* 19.4 Write integration tests for Docker deployment
    - Test container startup sequence
    - Test network isolation
    - Test volume persistence
    - Test environment variable configuration
    - _Requirements: 7.1, 7.2, 7.6, 7.7, 7.8_

- [x] 20. Implement VM Automation
  - [x] 20.1 Create VM Manager service
    - Create `vm-automation/VMManager.js` with libvirt integration
    - Implement VM provisioning for Tier I (Web), Tier II (SSH/DB), Tier III (Core)
    - Implement vulnerability configuration (weak passwords, unpatched services)
    - Implement IP assignment in 192.168.100.0/24 range
    - _Requirements: 8.1, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 20.2 Implement VM snapshot and restore
    - Implement baseline snapshot creation
    - Implement VM reset to baseline
    - Implement snapshot management
    - _Requirements: 8.2, 8.3_
  
  - [x] 20.3 Implement VM health monitoring
    - Implement ping checks every 30 seconds
    - Implement service port checks (HTTP:80, SSH:22, MySQL:3306)
    - Implement automatic VM restart on failure
    - Implement operator alerts on unrecoverable failures
    - _Requirements: 8.8, 8.9, 8.10_
  
  - [ ]* 20.4 Write integration tests for VM automation
    - Test VM provisioning for each tier
    - Test VM reset functionality
    - Test health monitoring
    - _Requirements: 8.1, 8.2, 8.3, 8.8_

- [ ] 21. Checkpoint - Verify security, deployment, and VM automation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Integration and End-to-End Testing
  - [ ] 22.1 Write end-to-end round simulation test
    - Test complete round from start to finish
    - Test Red Team Initial Access → Escalation → Impact
    - Test Blue Team detection and response
    - Test phase transitions
    - Test trace accumulation and burn state
    - Test scoring calculation
    - Test round completion
    - _Requirements: All requirements_
  
  - [ ] 22.2 Write integration tests for real-time system
    - Test WebSocket broadcasting with multiple clients
    - Test message ordering and delivery
    - Test reconnection and state synchronization
    - _Requirements: 3.1-3.12_
  
  - [ ] 22.3 Write integration tests for tool system with real VMs
    - Test Red Team tools against vulnerable VMs
    - Test Blue Team tools for detection and containment
    - Test validation against real system state
    - _Requirements: 2.1-2.18, 6.1-6.10_

- [ ] 23. Performance Optimization
  - [ ] 23.1 Optimize database queries
    - Add indexes for frequently queried columns
    - Implement query result caching for leaderboards
    - Implement prepared statement caching
    - Implement batch inserts for events
    - _Requirements: 5.1, 5.7_
  
  - [ ] 23.2 Optimize WebSocket communication
    - Implement message batching (max 10ms delay)
    - Implement message compression for large payloads
    - Implement connection pooling
    - _Requirements: 3.1, 3.2, 3.12_
  
  - [ ] 23.3 Optimize frontend rendering
    - Implement WebSocket message throttling
    - Add memoization for expensive calculations
    - Implement virtual scrolling for large lists
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

- [ ] 24. Documentation and Deployment Guide
  - [ ] 24.1 Create deployment documentation
    - Document Docker deployment process
    - Document environment variable configuration
    - Document VM setup and configuration
    - Document PostgreSQL setup
    - _Requirements: 7.1-7.10, 8.1-8.10_
  
  - [ ] 24.2 Create operator guide
    - Document round management
    - Document emergency procedures
    - Document monitoring and logging
    - Document troubleshooting
    - _Requirements: 15.6, 15.7, 15.8, 15.10_
  
  - [ ] 24.3 Update API documentation
    - Document all new API endpoints
    - Document WebSocket protocol
    - Document error responses
    - _Requirements: All requirements_

- [ ] 25. Final Checkpoint - Complete system verification
  - Run all property-based tests (minimum 100 iterations each)
  - Run all unit tests
  - Run all integration tests
  - Run end-to-end tests
  - Verify all requirements are met
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical break points
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows a phased approach: core logic → tools → real-time → visuals → database → validation → deployment → hardening
- All code should maintain consistency with existing codebase (JavaScript for backend, TypeScript for frontend)
- Integration tests with real VMs should be run in isolated cyber range environment (192.168.100.0/24)
