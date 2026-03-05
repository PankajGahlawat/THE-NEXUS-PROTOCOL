# Requirements Document: NEXUS PROTOCOL Completion

## Introduction

NEXUS PROTOCOL is a live Red vs Blue cyber-war simulation game set in 2096. The system simulates a 60-minute continuous cyber-warfare scenario where Red Team (HALO-Rè) attempts to infiltrate corporate data vaults using 3 specialized agents (ARCHITECT, SPECTER, ORACLE), while Blue Team (NEXUS VAULTS) defends with 3 counter-agents (SENTINEL, WARDEN, RESTORER). The game features real-time task validation against actual system state, persistent changes to target systems, phase-based progression, and a Trace & Burn identity residue tracking system.

The current implementation (~75% complete) has a functional backend engine, API routes, agent system, task schema, round management, frontend UI, and demo authentication. This requirements document specifies the remaining features needed to complete the system: SSH terminal system (the most critical missing piece), VM user environment setup, terminal logging and replay, server infrastructure, mission logic engine, tool functionality, real-time synchronization, trace/burn visual system, PostgreSQL migration, cyber range validator, Docker deployment, VM automation, and production hardening.

## Glossary

- **Red_Team**: The attacking team (HALO-Rè) attempting to infiltrate systems
- **Blue_Team**: The defending team (NEXUS VAULTS) protecting and restoring systems
- **ARCHITECT**: Red Team agent specializing in system exploitation and privilege escalation
- **SPECTER**: Red Team agent specializing in stealth operations and data exfiltration
- **ORACLE**: Red Team agent specializing in reconnaissance and intelligence gathering
- **SENTINEL**: Blue Team agent specializing in intrusion detection and monitoring
- **WARDEN**: Blue Team agent specializing in containment and access control
- **RESTORER**: Blue Team agent specializing in system recovery and forensics
- **Round**: A 60-minute continuous gameplay session with 3 phases
- **Phase**: A time-bounded segment of a round (Initial Access, Escalation, Impact/Recovery)
- **Task**: A discrete objective that agents must complete to progress
- **Tool**: A cyber capability (offensive or defensive) that agents use to complete tasks
- **Trace**: Identity residue left by Red Team actions that accumulates over time
- **Burn**: The state when Trace reaches critical levels, triggering countermeasures
- **System_State**: The current configuration and status of target systems in the cyber range
- **Cyber_Range**: The isolated network environment (192.168.100.0/24) containing target systems
- **Observable_Action**: A Red Team action that Blue Team can detect through monitoring
- **Tier**: System classification level (Tier I: Web, Tier II: SSH/DB, Tier III: Core)
- **VM**: Virtual machine representing a target system in the cyber range
- **Validator**: Component that verifies task completion against real system state
- **SSH_Proxy**: Backend service that bridges browser terminals to VM via SSH connections
- **PTY**: Pseudo-terminal session on the VM for each player
- **WebSocket**: Bidirectional communication channel between browser and backend
- **Terminal_Session**: An active SSH connection with associated PTY for a player
- **Xterm_js**: Browser-based terminal emulator library
- **ssh2**: Node.js library for creating SSH client connections
- **Socket_io**: WebSocket library for real-time browser-backend communication
- **VPS**: Virtual Private Server hosting the game infrastructure
- **Nginx**: Reverse proxy server for frontend and WebSocket traffic
- **PM2**: Process manager for keeping Node.js backend running continuously
- **DVWA**: Damn Vulnerable Web Application - the target web app that Red Team attacks

## Requirements

### Requirement 1: Mission Logic Engine

**User Story:** As a game operator, I want a mission logic engine that manages phase-based task progression, so that gameplay follows the intended 60-minute structure with proper task dependencies.

#### Acceptance Criteria

1. WHEN a round starts, THE Mission_Logic_Engine SHALL initialize the round with Initial Access phase
2. WHEN 20 minutes elapse, THE Mission_Logic_Engine SHALL transition from Initial Access to Escalation phase
3. WHEN 40 minutes elapse, THE Mission_Logic_Engine SHALL transition from Escalation to Impact/Recovery phase
4. WHEN a task is completed, THE Mission_Logic_Engine SHALL unlock dependent tasks based on task dependency graph
5. WHEN a Red_Team task is completed, THE Mission_Logic_Engine SHALL route the task to the appropriate agent (ARCHITECT, SPECTER, or ORACLE)
6. WHEN a Blue_Team task is completed, THE Mission_Logic_Engine SHALL route the task to the appropriate agent (SENTINEL, WARDEN, or RESTORER)
7. WHEN a task validation is requested, THE Mission_Logic_Engine SHALL query the System_State to verify completion
8. WHEN all phase objectives are completed, THE Mission_Logic_Engine SHALL allow early phase transition
9. WHEN the round timer reaches 60 minutes, THE Mission_Logic_Engine SHALL end the round and calculate final scores
10. WHEN a task is attempted, THE Mission_Logic_Engine SHALL verify that prerequisite tasks are completed

### Requirement 2: Tool Functionality System

**User Story:** As a player, I want functional tools that interact with real systems and provide visual feedback, so that I can complete tasks and see the impact of my actions.


#### Acceptance Criteria

1. WHEN a Red_Team player uses nmap, THE Tool_System SHALL scan target systems and return discovered services
2. WHEN a Red_Team player uses sqlmap, THE Tool_System SHALL attempt SQL injection against target databases
3. WHEN a Red_Team player uses gobuster, THE Tool_System SHALL enumerate web directories on target systems
4. WHEN a Red_Team player uses hydra, THE Tool_System SHALL perform password attacks against authentication services
5. WHEN a Red_Team player uses metasploit, THE Tool_System SHALL exploit vulnerabilities in target systems
6. WHEN a Red_Team player uses mimikatz, THE Tool_System SHALL extract credentials from compromised systems
7. WHEN a Red_Team player uses cron, THE Tool_System SHALL establish persistence on compromised systems
8. WHEN a Red_Team player uses nc (netcat), THE Tool_System SHALL create reverse shells or data exfiltration channels
9. WHEN a Red_Team player uses DNS tunneling, THE Tool_System SHALL exfiltrate data through DNS queries
10. WHEN a Blue_Team player uses IDS monitoring, THE Tool_System SHALL detect and alert on suspicious network activity
11. WHEN a Blue_Team player configures firewall rules, THE Tool_System SHALL block specified IP addresses or ports
12. WHEN a Blue_Team player blocks an IP, THE Tool_System SHALL prevent connections from that address
13. WHEN a Blue_Team player runs rootkit detection, THE Tool_System SHALL scan for persistence mechanisms
14. WHEN a Blue_Team player performs forensics, THE Tool_System SHALL analyze system logs and artifacts
15. WHEN a Blue_Team player initiates system restore, THE Tool_System SHALL revert systems to clean snapshots
16. WHEN a tool is used while Burn state is HIGH or CRITICAL, THE Tool_System SHALL reduce tool effectiveness
17. WHEN a tool is used, THE Tool_System SHALL validate the action against real system state
18. WHEN a tool completes execution, THE Tool_System SHALL update the System_State to reflect changes

### Requirement 3: SSH Terminal System

**User Story:** As a player, I want a browser-based terminal that connects to the VM, so that I can execute real commands and interact with the cyber range environment.

#### Acceptance Criteria

1. WHEN a player opens a terminal, THE SSH_Proxy SHALL create a WebSocket connection between the browser and Node.js backend using Socket_io
2. WHEN a WebSocket connection is established, THE SSH_Proxy SHALL create an SSH connection to the VM using the ssh2 library
3. WHEN an SSH connection is created, THE SSH_Proxy SHALL request a PTY from the VM for the player's session
4. WHEN a Red_Team player connects, THE SSH_Proxy SHALL authenticate as the 'redteam' Linux user on the VM
5. WHEN a Blue_Team player connects, THE SSH_Proxy SHALL authenticate as the 'blueteam' Linux user on the VM
6. WHEN a player types in the terminal, THE SSH_Proxy SHALL transmit input from Browser → WebSocket → Node.js → SSH → VM
7. WHEN the VM produces output, THE SSH_Proxy SHALL transmit output from VM → SSH → Node.js → WebSocket → Browser
8. WHEN a player resizes their browser terminal, THE SSH_Proxy SHALL send a resize event to the VM PTY
9. WHEN a terminal session is created, THE SSH_Proxy SHALL assign a unique session ID and track it in memory
10. WHEN a player closes their terminal, THE SSH_Proxy SHALL close the SSH connection and clean up the session
11. WHEN multiple players connect, THE SSH_Proxy SHALL maintain separate SSH sessions and PTYs for each player
12. WHEN a player disconnects unexpectedly, THE SSH_Proxy SHALL detect the disconnection and close the associated SSH session
13. WHEN the backend restarts, THE SSH_Proxy SHALL allow players to reconnect and create new sessions
14. WHEN SSH authentication fails, THE SSH_Proxy SHALL log the error and notify the player that terminal connection failed
15. THE SSH_Proxy SHALL use Xterm_js in the browser to render the terminal interface

### Requirement 4: VM User Environment Setup

**User Story:** As a game operator, I want the VM configured with team-specific users and tools, so that players have appropriate access and capabilities for their roles.

#### Acceptance Criteria

1. WHEN the VM is provisioned, THE VM_Setup_System SHALL create a 'redteam' Linux user with home directory /home/redteam
2. WHEN the VM is provisioned, THE VM_Setup_System SHALL create a 'blueteam' Linux user with home directory /home/blueteam
3. WHEN the 'redteam' user is created, THE VM_Setup_System SHALL install Kali offensive tools (nmap, sqlmap, hydra, metasploit, nikto, dirb, john)
4. WHEN the 'blueteam' user is created, THE VM_Setup_System SHALL install defensive tools (tcpdump, fail2ban, iptables, wireshark, aide, rkhunter)
5. WHEN the VM is provisioned, THE VM_Setup_System SHALL configure SSH key authentication for the Node.js backend server
6. WHEN the VM is provisioned, THE VM_Setup_System SHALL add the backend's public SSH key to both /home/redteam/.ssh/authorized_keys and /home/blueteam/.ssh/authorized_keys
7. WHEN the VM is provisioned, THE VM_Setup_System SHALL set file permissions to prevent 'redteam' user from accessing /home/blueteam
8. WHEN the VM is provisioned, THE VM_Setup_System SHALL set file permissions to prevent 'blueteam' user from accessing /home/redteam
9. WHEN the VM is provisioned, THE VM_Setup_System SHALL install and configure DVWA (Damn Vulnerable Web Application) as the target web application
10. WHEN the VM is provisioned, THE VM_Setup_System SHALL configure DVWA to be accessible on port 80 with known vulnerabilities enabled
11. WHEN the VM is provisioned, THE VM_Setup_System SHALL create a MySQL database for DVWA with weak credentials
12. WHEN the VM is provisioned, THE VM_Setup_System SHALL configure sudo rules to allow 'blueteam' user to manage firewall and services
13. WHEN the VM is provisioned, THE VM_Setup_System SHALL disable password authentication for SSH, requiring key-based auth only

### Requirement 5: Terminal Logging and Replay

**User Story:** As a game operator, I want all terminal activity logged to the database, so that I can review player actions and enable post-game analysis.

#### Acceptance Criteria

1. WHEN a player types a command, THE Logging_System SHALL insert a record into the terminal_logs table with player_id, session_id, input, and timestamp
2. WHEN the VM returns output, THE Logging_System SHALL insert a record into the terminal_logs table with player_id, session_id, output, and timestamp
3. WHEN a terminal session is created, THE Logging_System SHALL insert a record into the terminal_sessions table with player_id, team, start_time, and session_id
4. WHEN a terminal session ends, THE Logging_System SHALL update the terminal_sessions table with end_time
5. WHEN an admin requests terminal replay, THE Logging_System SHALL retrieve all logs for a session ordered by timestamp
6. WHEN terminal replay is requested, THE Logging_System SHALL reconstruct the terminal session by replaying input and output in sequence
7. WHEN an admin watches a live terminal, THE Logging_System SHALL stream real-time terminal activity for the specified player
8. WHEN sensitive data is logged (passwords, keys), THE Logging_System SHALL store it encrypted in the database
9. WHEN a round ends, THE Logging_System SHALL retain all terminal logs for post-game analysis
10. WHEN terminal logs are queried, THE Logging_System SHALL support filtering by player, team, time range, and command pattern

### Requirement 6: Server Infrastructure

**User Story:** As a system administrator, I want the system deployed on dedicated infrastructure with proper networking and process management, so that the game runs reliably 24/7.

#### Acceptance Criteria

1. THE Infrastructure SHALL be deployed on a dedicated VPS with root access (not serverless platforms like Vercel or Railway)
2. THE Infrastructure SHALL have minimum specifications of 4 CPU cores, 8GB RAM, and 100GB SSD storage
3. WHEN the VPS is provisioned, THE Infrastructure SHALL install VirtualBox or KVM for running the battlefield VM
4. WHEN the VPS is provisioned, THE Infrastructure SHALL configure a domain name with DNS pointing to the server IP
5. WHEN the VPS is provisioned, THE Infrastructure SHALL install and configure SSL certificates using Let's Encrypt via Certbot
6. WHEN the VPS is provisioned, THE Infrastructure SHALL install Nginx as a reverse proxy for the frontend and WebSocket connections
7. WHEN Nginx is configured, THE Infrastructure SHALL proxy HTTP requests to the React frontend
8. WHEN Nginx is configured, THE Infrastructure SHALL proxy WebSocket connections to the Node.js backend with proper upgrade headers
9. WHEN the VPS is provisioned, THE Infrastructure SHALL install PM2 to manage the Node.js backend process
10. WHEN PM2 is configured, THE Infrastructure SHALL automatically restart the Node.js backend if it crashes
11. WHEN PM2 is configured, THE Infrastructure SHALL start the Node.js backend automatically on system boot
12. WHEN the system is deployed, THE Infrastructure SHALL configure firewall rules to allow only ports 80, 443, and SSH
13. WHEN the VM is running, THE Infrastructure SHALL ensure the VM network is isolated from the public internet
14. WHEN SSL certificates expire, THE Infrastructure SHALL automatically renew them via Certbot cron job

### Requirement 7: Real-Time Synchronization

**User Story:** As a player, I want real-time updates on game state changes, so that I can react to opponent actions and coordinate with my team.

#### Acceptance Criteria

1. WHEN a Red_Team action occurs, THE Real_Time_System SHALL broadcast the action to all connected clients via WebSocket
2. WHEN a Blue_Team action occurs, THE Real_Time_System SHALL broadcast the action to all connected clients via WebSocket
3. WHEN an Observable_Action is performed by Red_Team, THE Real_Time_System SHALL send an alert to Blue_Team clients
4. WHEN a task is completed, THE Real_Time_System SHALL update the scoreboard for all clients
5. WHEN the round timer updates, THE Real_Time_System SHALL synchronize the timer across all clients
6. WHEN Trace level changes, THE Real_Time_System SHALL update the Trace display for Red_Team clients
7. WHEN Burn state changes, THE Real_Time_System SHALL update the Burn indicator for Red_Team clients
8. WHEN a Blue_Team detection occurs, THE Real_Time_System SHALL trigger an alert notification for Blue_Team
9. WHEN a phase transition occurs, THE Real_Time_System SHALL notify all clients of the new phase
10. WHEN a client connects, THE Real_Time_System SHALL send the current game state to that client
11. WHEN a client disconnects, THE Real_Time_System SHALL handle the disconnection gracefully without affecting other clients
12. WHEN network latency exceeds 500ms, THE Real_Time_System SHALL buffer updates and synchronize when connection stabilizes

### Requirement 8: Trace & Burn Visual System

**User Story:** As a Red Team player, I want visual feedback on my Trace and Burn levels, so that I can manage risk and adjust my tactics accordingly.

#### Acceptance Criteria

1. WHEN Trace level is 0-25%, THE Visual_System SHALL display "Ghost" status with minimal visual indicators
2. WHEN Trace level is 26-50%, THE Visual_System SHALL display "Shadow" status with moderate visual effects
3. WHEN Trace level is 51-75%, THE Visual_System SHALL display "Visible" status with prominent visual warnings
4. WHEN Trace level is 76-100%, THE Visual_System SHALL display "Burned" status with critical visual alerts
5. WHEN Burn state is LOW, THE Visual_System SHALL display green indicators
6. WHEN Burn state is MODERATE, THE Visual_System SHALL display yellow indicators
7. WHEN Burn state is HIGH, THE Visual_System SHALL display orange indicators with pulsing effects
8. WHEN Burn state is CRITICAL, THE Visual_System SHALL display red indicators with intense pulsing and screen effects
9. WHEN Trace accumulates, THE Visual_System SHALL animate the transition between Trace levels
10. WHEN Burn state reaches HIGH, THE Visual_System SHALL trigger countermeasure warnings
11. WHEN Burn state reaches CRITICAL, THE Visual_System SHALL display emergency protocol notifications
12. WHEN a stealth tool is used, THE Visual_System SHALL show Trace reduction animations

### Requirement 9: PostgreSQL Migration

**User Story:** As a system administrator, I want data persisted in PostgreSQL, so that the system can scale and maintain audit trails for multiple concurrent rounds.

#### Acceptance Criteria

1. WHEN the system initializes, THE Database_System SHALL connect to PostgreSQL using connection pooling
2. WHEN a round is created, THE Database_System SHALL insert a record into the rounds table
3. WHEN a task is completed, THE Database_System SHALL insert a record into the tasks table
4. WHEN a system state changes, THE Database_System SHALL update the system_states table
5. WHEN an event occurs, THE Database_System SHALL insert a record into the events table for audit trail
6. WHEN a query is executed, THE Database_System SHALL use prepared statements to prevent SQL injection
7. WHEN multiple concurrent rounds exist, THE Database_System SHALL isolate data by round_id
8. WHEN the connection pool is exhausted, THE Database_System SHALL queue requests and handle them when connections become available
9. WHEN a database error occurs, THE Database_System SHALL log the error and return a meaningful error message
10. WHEN the system starts, THE Database_System SHALL run migration scripts to ensure schema is up to date
11. WHEN terminal logs are stored, THE Database_System SHALL insert records into terminal_logs and terminal_sessions tables
12. WHEN terminal replay is requested, THE Database_System SHALL efficiently query terminal_logs ordered by timestamp

### Requirement 10: Cyber Range Validator

**User Story:** As a game operator, I want task completion validated against real system state, so that players must actually perform the required actions rather than just clicking buttons.

#### Acceptance Criteria

1. WHEN a task completion is claimed, THE Validator SHALL query the target system to verify the claimed action
2. WHEN validating network topology, THE Validator SHALL verify that systems exist at specified IP addresses in 192.168.100.0/24
3. WHEN validating service state, THE Validator SHALL check that Web, SSH, DB, and Core services are in the expected state
4. WHEN validating file modifications, THE Validator SHALL verify that specified files have been created, modified, or deleted
5. WHEN validating privilege escalation, THE Validator SHALL verify that the user has gained elevated privileges
6. WHEN validating data exfiltration, THE Validator SHALL verify that data has been transferred from the target system
7. WHEN validating firewall rules, THE Validator SHALL verify that specified rules exist in the firewall configuration
8. WHEN validating system restore, THE Validator SHALL verify that the system has been reverted to a clean state
9. WHEN a VM is unhealthy, THE Validator SHALL report the health issue and prevent task validation
10. WHEN validation fails, THE Validator SHALL return a descriptive error message indicating what was not found

### Requirement 11: Docker Deployment

**User Story:** As a system administrator, I want the entire system containerized, so that I can deploy it consistently across different environments.

#### Acceptance Criteria

1. WHEN docker-compose up is executed, THE Deployment_System SHALL start backend, frontend, and PostgreSQL containers
2. WHEN containers start, THE Deployment_System SHALL configure network isolation for the cyber range
3. WHEN the backend container starts, THE Deployment_System SHALL wait for PostgreSQL to be ready before connecting
4. WHEN the frontend container starts, THE Deployment_System SHALL serve the built React application
5. WHEN the PostgreSQL container starts, THE Deployment_System SHALL initialize the database schema
6. WHEN containers are stopped, THE Deployment_System SHALL persist data in Docker volumes
7. WHEN the system is restarted, THE Deployment_System SHALL restore data from volumes
8. WHEN environment variables are changed, THE Deployment_System SHALL apply them without rebuilding images
9. WHEN a container fails, THE Deployment_System SHALL restart it automatically
10. WHEN logs are requested, THE Deployment_System SHALL provide aggregated logs from all containers

### Requirement 12: VM Automation

**User Story:** As a game operator, I want automated VM provisioning and reset, so that each round starts with a consistent and vulnerable environment.

#### Acceptance Criteria

1. WHEN a round is initialized, THE VM_Automation_System SHALL provision vulnerable VMs for Tier I, Tier II, and Tier III systems
2. WHEN a round ends, THE VM_Automation_System SHALL snapshot the final state of all VMs
3. WHEN a new round starts, THE VM_Automation_System SHALL restore VMs to the baseline vulnerable state
4. WHEN Tier I VMs are provisioned, THE VM_Automation_System SHALL configure web services with known vulnerabilities
5. WHEN Tier II VMs are provisioned, THE VM_Automation_System SHALL configure SSH and database services with weak credentials
6. WHEN Tier III VMs are provisioned, THE VM_Automation_System SHALL configure core systems with exploitable services
7. WHEN a VM is provisioned, THE VM_Automation_System SHALL assign it an IP address in the 192.168.100.0/24 range
8. WHEN a VM health check is requested, THE VM_Automation_System SHALL verify that all services are running
9. WHEN a VM fails health check, THE VM_Automation_System SHALL attempt to restart the VM
10. WHEN a VM cannot be recovered, THE VM_Automation_System SHALL alert the operator and mark the VM as unavailable
11. WHEN VMs are provisioned, THE VM_Automation_System SHALL create 'redteam' and 'blueteam' users with appropriate tools installed
12. WHEN VMs are provisioned, THE VM_Automation_System SHALL configure DVWA as the primary target application

### Requirement 13: Production Hardening

**User Story:** As a security engineer, I want the production system hardened against attacks, so that the game infrastructure itself is secure while simulating cyber warfare.

#### Acceptance Criteria

1. WHEN HTTP requests are received, THE Security_System SHALL apply security headers (CSP, HSTS, X-Frame-Options)
2. WHEN CORS requests are received, THE Security_System SHALL validate origin against whitelist
3. WHEN API requests exceed rate limits, THE Security_System SHALL return 429 Too Many Requests
4. WHEN DDoS patterns are detected, THE Security_System SHALL activate rate limiting and connection throttling
5. WHEN user input is received, THE Security_System SHALL validate and sanitize all inputs
6. WHEN SQL queries are constructed, THE Security_System SHALL use parameterized queries to prevent injection
7. WHEN WebSocket connections are established, THE Security_System SHALL require authentication tokens
8. WHEN WebSocket messages are received, THE Security_System SHALL validate message format and content
9. WHEN security events occur, THE Security_System SHALL log them to the audit trail
10. WHEN the emergency kill switch is activated, THE Security_System SHALL immediately terminate all rounds and disconnect all clients
11. WHEN authentication tokens are issued, THE Security_System SHALL set appropriate expiration times
12. WHEN sensitive data is logged, THE Security_System SHALL redact credentials and personal information

### Requirement 14: Round Scoring and Progression

**User Story:** As a player, I want my performance scored based on objectives completed, time taken, and stealth maintained, so that I can compete and improve my skills.

#### Acceptance Criteria

1. WHEN a task is completed, THE Scoring_System SHALL award points based on task difficulty and phase
2. WHEN a Red_Team completes objectives quickly, THE Scoring_System SHALL apply a speed bonus
3. WHEN a Red_Team maintains low Trace levels, THE Scoring_System SHALL apply a stealth bonus
4. WHEN a Blue_Team detects Red_Team actions, THE Scoring_System SHALL award detection points
5. WHEN a Blue_Team successfully contains an intrusion, THE Scoring_System SHALL award containment points
6. WHEN a Blue_Team restores compromised systems, THE Scoring_System SHALL award recovery points
7. WHEN a round ends, THE Scoring_System SHALL calculate final scores for both teams
8. WHEN final scores are calculated, THE Scoring_System SHALL determine winner based on total points
9. WHEN scores are updated, THE Scoring_System SHALL persist them to the database
10. WHEN a leaderboard is requested, THE Scoring_System SHALL return top-scoring teams across all rounds

### Requirement 15: Task Dependency and Unlocking

**User Story:** As a game designer, I want tasks to unlock based on completion of prerequisite tasks, so that gameplay follows a logical progression and prevents sequence breaking.

#### Acceptance Criteria

1. WHEN a round starts, THE Task_System SHALL mark only Initial Access tasks as available
2. WHEN an Initial Access task is completed, THE Task_System SHALL unlock dependent Escalation tasks
3. WHEN an Escalation task is completed, THE Task_System SHALL unlock dependent Impact/Recovery tasks
4. WHEN a task has multiple prerequisites, THE Task_System SHALL require all prerequisites to be completed before unlocking
5. WHEN a task is unlocked, THE Task_System SHALL notify the appropriate team via real-time update
6. WHEN a player attempts an unavailable task, THE Task_System SHALL return an error indicating missing prerequisites
7. WHEN a task dependency graph is requested, THE Task_System SHALL return the current state of all tasks and their dependencies
8. WHEN a task is completed out of order due to system error, THE Task_System SHALL validate the dependency chain and reject invalid completions

### Requirement 16: Observable Actions and Detection

**User Story:** As a Blue Team player, I want to detect Red Team actions through monitoring tools, so that I can respond to intrusions in real-time.

#### Acceptance Criteria

1. WHEN Red_Team performs a network scan, THE Detection_System SHALL generate an IDS alert for Blue_Team
2. WHEN Red_Team attempts authentication, THE Detection_System SHALL log the attempt for Blue_Team forensics
3. WHEN Red_Team exploits a vulnerability, THE Detection_System SHALL generate a high-priority alert if detected
4. WHEN Red_Team exfiltrates data, THE Detection_System SHALL detect anomalous network traffic patterns
5. WHEN Red_Team establishes persistence, THE Detection_System SHALL detect file system modifications
6. WHEN Blue_Team has IDS monitoring active, THE Detection_System SHALL increase detection probability for Observable_Actions
7. WHEN Red_Team uses stealth tools, THE Detection_System SHALL reduce detection probability
8. WHEN Red_Team Burn state is CRITICAL, THE Detection_System SHALL maximize detection probability
9. WHEN an Observable_Action is detected, THE Detection_System SHALL provide actionable intelligence to Blue_Team
10. WHEN Blue_Team reviews alerts, THE Detection_System SHALL display timestamp, action type, and affected system

### Requirement 17: System State Management

**User Story:** As a game operator, I want the system to track and persist the state of all target systems, so that actions have lasting consequences and can be validated.

#### Acceptance Criteria

1. WHEN a round starts, THE State_Manager SHALL initialize system state for all VMs in the cyber range
2. WHEN a Red_Team action modifies a system, THE State_Manager SHALL update the system state record
3. WHEN a Blue_Team action modifies a system, THE State_Manager SHALL update the system state record
4. WHEN a system state query is received, THE State_Manager SHALL return the current state of the specified system
5. WHEN a system is compromised, THE State_Manager SHALL mark it as compromised and track the compromise level
6. WHEN a system is restored, THE State_Manager SHALL revert the state to the baseline configuration
7. WHEN multiple actions affect the same system concurrently, THE State_Manager SHALL serialize updates to prevent race conditions
8. WHEN a round ends, THE State_Manager SHALL persist the final system states for post-game analysis
9. WHEN a state inconsistency is detected, THE State_Manager SHALL log the inconsistency and attempt reconciliation

### Requirement 18: Agent-Specific Capabilities

**User Story:** As a player, I want my chosen agent to have unique capabilities and task assignments, so that team composition and role specialization matter.

#### Acceptance Criteria

1. WHEN ARCHITECT is selected, THE Agent_System SHALL assign system exploitation and privilege escalation tasks
2. WHEN SPECTER is selected, THE Agent_System SHALL assign stealth operations and data exfiltration tasks
3. WHEN ORACLE is selected, THE Agent_System SHALL assign reconnaissance and intelligence gathering tasks
4. WHEN SENTINEL is selected, THE Agent_System SHALL assign intrusion detection and monitoring tasks
5. WHEN WARDEN is selected, THE Agent_System SHALL assign containment and access control tasks
6. WHEN RESTORER is selected, THE Agent_System SHALL assign system recovery and forensics tasks
7. WHEN an agent uses a tool, THE Agent_System SHALL apply agent-specific effectiveness modifiers
8. WHEN an agent completes a task, THE Agent_System SHALL award agent-specific bonus points
9. WHEN multiple agents are on the same team, THE Agent_System SHALL coordinate task distribution to avoid conflicts

### Requirement 19: Emergency and Error Handling

**User Story:** As a system administrator, I want robust error handling and emergency controls, so that the system can recover from failures and be shut down safely if needed.

#### Acceptance Criteria

1. WHEN a database connection fails, THE Error_Handler SHALL retry with exponential backoff
2. WHEN a VM becomes unresponsive, THE Error_Handler SHALL mark it as unavailable and notify the operator
3. WHEN a WebSocket connection drops, THE Error_Handler SHALL attempt to reconnect automatically
4. WHEN a validation error occurs, THE Error_Handler SHALL log the error and return a user-friendly message
5. WHEN an unhandled exception occurs, THE Error_Handler SHALL log the stack trace and return a generic error message
6. WHEN the emergency kill switch is activated, THE Emergency_System SHALL immediately stop all rounds
7. WHEN the emergency kill switch is activated, THE Emergency_System SHALL disconnect all WebSocket clients
8. WHEN the emergency kill switch is activated, THE Emergency_System SHALL persist current game state before shutdown
9. WHEN the system recovers from an error, THE Error_Handler SHALL log the recovery and resume normal operation
10. WHEN critical errors accumulate, THE Error_Handler SHALL alert the operator via configured notification channels
11. WHEN an SSH connection fails, THE Error_Handler SHALL log the failure and notify the affected player
12. WHEN terminal sessions exceed maximum limits, THE Error_Handler SHALL reject new connections with a descriptive error
