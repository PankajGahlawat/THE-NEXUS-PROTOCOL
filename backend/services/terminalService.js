/**
 * NEXUS PROTOCOL - Terminal Service
 * Provides isolated simulated security terminal sessions per team
 * Supports real curl/wget commands against target servers
 * Version: 1.0.0
 */

const { exec } = require('child_process');

class TerminalService {
  constructor() {
    // Map<string, TerminalSession> keyed by `${teamId}:${sessionId}`
    this.sessions = new Map();
    this.MAX_SESSIONS_PER_TEAM = 5;
    this.IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    this.COMMAND_TIMEOUT = 15000; // 15 seconds

    // Allowed commands for security
    this.ALLOWED_COMMANDS = [
      'curl', 'wget', 'nmap', 'sqlmap', 'nikto', 'dirb', 'gobuster',
      'hydra', 'john', 'hashcat', 'base64', 'echo', 'cat', 'ls', 'dir',
      'ping', 'traceroute', 'tracert', 'nslookup', 'dig', 'whois',
      'netstat', 'ipconfig', 'ifconfig', 'whoami', 'hostname',
      'python', 'python3', 'node', 'php',
      'help', 'clear', 'history', 'pwd', 'cd', 'env', 'set'
    ];

    // Cleanup idle sessions periodically
    this._cleanupInterval = setInterval(() => this._cleanupIdleSessions(), 60000);
  }

  /**
   * Spawn a new terminal session for a team
   */
  spawnSession(teamId, teamName, targetUrl) {
    const teamSessionCount = this._getTeamSessionCount(teamId);
    if (teamSessionCount >= this.MAX_SESSIONS_PER_TEAM) {
      throw new Error('MAX_SESSIONS_EXCEEDED');
    }

    const sessionId = `term-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const sessionKey = `${teamId}:${sessionId}`;

    const session = {
      sessionId,
      teamId,
      teamName,
      targetUrl,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      history: [],
      cwd: `/home/${teamName.toLowerCase()}`,
      env: {
        USER: teamName.toLowerCase(),
        HOME: `/home/${teamName.toLowerCase()}`,
        HOSTNAME: 'nexus-terminal',
        TARGET: targetUrl,
        SHELL: '/bin/bash',
        TERM: 'xterm-256color',
        PS1: `\\[\\033[1;32m\\]${teamName.toLowerCase()}@nexus\\[\\033[0m\\]:\\[\\033[1;34m\\]~\\[\\033[0m\\]$ `
      }
    };

    this.sessions.set(sessionKey, session);
    return session;
  }

  /**
   * Execute a command in a terminal session
   */
  async executeCommand(teamId, sessionId, command) {
    const sessionKey = `${teamId}:${sessionId}`;
    const session = this.sessions.get(sessionKey);

    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    session.lastActivity = Date.now();
    session.history.push(command);

    const trimmed = command.trim();

    // Handle built-in commands
    if (!trimmed) return '';
    if (trimmed === 'clear') return '\x1b[2J\x1b[H';
    if (trimmed === 'help') return this._getHelpText();
    if (trimmed === 'history') return session.history.map((c, i) => `  ${i + 1}  ${c}`).join('\r\n');
    if (trimmed === 'pwd') return session.cwd;
    if (trimmed === 'whoami') return session.env.USER;
    if (trimmed === 'hostname') return session.env.HOSTNAME;
    if (trimmed === 'env' || trimmed === 'set') {
      return Object.entries(session.env).map(([k, v]) => `${k}=${v}`).join('\r\n');
    }
    if (trimmed === 'target' || trimmed === 'echo $TARGET') {
      return `\x1b[36m${session.targetUrl}\x1b[0m`;
    }
    if (trimmed.startsWith('cd ')) {
      const dir = trimmed.slice(3).trim();
      if (dir === '~' || dir === '') session.cwd = session.env.HOME;
      else if (dir === '..') session.cwd = session.cwd.split('/').slice(0, -1).join('/') || '/';
      else if (dir.startsWith('/')) session.cwd = dir;
      else session.cwd = `${session.cwd}/${dir}`;
      return '';
    }

    // Check if the base command is allowed
    const baseCmd = trimmed.split(/[\s|;&]/)[0].toLowerCase();

    // Real executable commands (curl, ping, nslookup, etc.)
    const REAL_EXEC_COMMANDS = [
      'curl', 'ping', 'nslookup', 'tracert', 'traceroute',
      'ipconfig', 'ifconfig', 'netstat', 'whoami', 'hostname',
      'base64', 'echo', 'python', 'python3', 'node'
    ];

    if (REAL_EXEC_COMMANDS.includes(baseCmd)) {
      return await this._executeReal(trimmed, session);
    }

    // Simulated security tool responses
    if (baseCmd === 'nmap') return this._simulateNmap(trimmed, session);
    if (baseCmd === 'sqlmap') return this._simulateSqlmap(trimmed, session);
    if (baseCmd === 'dirb' || baseCmd === 'gobuster') return this._simulateDirb(trimmed, session);
    if (baseCmd === 'nikto') return this._simulateNikto(trimmed, session);
    if (baseCmd === 'hydra') return this._simulateHydra(trimmed, session);
    if (baseCmd === 'ls' || baseCmd === 'dir') return this._simulateLs(session);
    if (baseCmd === 'cat') return this._simulateCat(trimmed);
    if (baseCmd === 'wget') return await this._executeReal(trimmed.replace('wget', 'curl -O'), session);

    // Unknown command
    if (this.ALLOWED_COMMANDS.includes(baseCmd)) {
      return `${baseCmd}: command simulation not yet implemented`;
    }

    return `\x1b[31mbash: ${baseCmd}: command not found\x1b[0m\r\nType 'help' for available commands.`;
  }

  /**
   * Execute a real command with security constraints
   */
  async _executeReal(command, session) {
    return new Promise((resolve) => {
      // Security: prevent dangerous patterns
      const dangerous = ['rm ', 'del ', 'format ', 'mkfs', 'dd ', '> /dev', 'shutdown', 'reboot',
        'reg ', 'regedit', 'taskkill', 'net user', 'net localgroup'];
      const lowerCmd = command.toLowerCase();
      for (const d of dangerous) {
        if (lowerCmd.includes(d)) {
          resolve(`\x1b[31m⚠ Security: Command blocked for safety\x1b[0m`);
          return;
        }
      }

      // Add timeout and limits to curl
      let execCmd = command;
      if (command.startsWith('curl') && !command.includes('--max-time')) {
        execCmd = command.replace('curl', 'curl --max-time 10');
      }

      exec(execCmd, {
        timeout: this.COMMAND_TIMEOUT,
        maxBuffer: 1024 * 512, // 512KB
        windowsHide: true,
        env: { ...process.env, ...session.env }
      }, (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            resolve('\x1b[33mCommand timed out (15s limit)\x1b[0m');
          } else {
            resolve(stderr || error.message || 'Command failed');
          }
          return;
        }
        resolve(stdout || stderr || '');
      });
    });
  }

  /**
   * Simulate nmap output
   */
  _simulateNmap(command, session) {
    const target = this._extractTarget(command) || session.targetUrl;
    const host = new URL(target).hostname;
    const port = new URL(target).port || '80';

    return [
      `\x1b[32mStarting Nmap 7.94 ( https://nmap.org )\x1b[0m`,
      `Nmap scan report for ${host}`,
      `Host is up (0.0015s latency).`,
      ``,
      `PORT      STATE    SERVICE       VERSION`,
      `${port}/tcp   open     http          Node.js Express`,
      `3306/tcp  filtered mysql`,
      ``,
      `Service detection performed.`,
      `Nmap done: 1 IP address (1 host up) scanned in 2.34 seconds`
    ].join('\r\n');
  }

  /**
   * Simulate sqlmap output
   */
  _simulateSqlmap(command, session) {
    const target = this._extractTarget(command) || session.targetUrl;
    return [
      `\x1b[32m        ___`,
      `       __H__`,
      ` ___ ___[.]_____ ___ ___  {1.8.4}`,
      `|_ -| . [']     | .'| . |`,
      `|___|_  [)]_|_|_|__,|  _|`,
      `      |_|V...       |_|\x1b[0m`,
      ``,
      `[*] starting @ ${new Date().toTimeString().split(' ')[0]}`,
      ``,
      `[INFO] testing connection to the target URL: ${target}`,
      `[INFO] checking if the target is protected by some kind of WAF/IPS`,
      `[INFO] testing if the target URL content is stable`,
      `[INFO] target URL content is stable`,
      `[INFO] testing parameter injection points...`,
      `[INFO] heuristics detected web page charset 'utf-8'`,
      ``,
      `\x1b[33m[*] Use specific parameters: sqlmap -u "${target}?id=1" --dbs\x1b[0m`
    ].join('\r\n');
  }

  /**
   * Simulate directory brute-force output
   */
  _simulateDirb(command, session) {
    const target = this._extractTarget(command) || session.targetUrl;
    return [
      `\x1b[32m-----------------`,
      `DIRB v2.22`,
      `-----------------\x1b[0m`,
      ``,
      `URL_BASE: ${target}/`,
      `WORDLIST_FILES: /usr/share/dirb/common.txt`,
      ``,
      `---- Scanning URL: ${target}/ ----`,
      `+ ${target}/api                 (CODE:200|SIZE:423)`,
      `+ ${target}/login              (CODE:200|SIZE:1842)`,
      `+ ${target}/admin              (CODE:403|SIZE:187)`,
      `+ ${target}/docs               (CODE:200|SIZE:956)`,
      `+ ${target}/health             (CODE:200|SIZE:312)`,
      `+ ${target}/static             (CODE:301|SIZE:0)`,
      ``,
      `---- Results ----`,
      `6 results found.`
    ].join('\r\n');
  }

  /**
   * Simulate nikto output
   */
  _simulateNikto(command, session) {
    const target = this._extractTarget(command) || session.targetUrl;
    return [
      `\x1b[32m- Nikto v2.5.0\x1b[0m`,
      `---------------------------------------------------------------------------`,
      `+ Target IP:          127.0.0.1`,
      `+ Target Hostname:    ${new URL(target).hostname}`,
      `+ Target Port:        ${new URL(target).port || 80}`,
      `---------------------------------------------------------------------------`,
      `+ Server: Node.js Express`,
      `+ \x1b[33mX-Powered-By header found: Express\x1b[0m`,
      `+ \x1b[33mNo X-Frame-Options header — clickjacking risk\x1b[0m`,
      `+ \x1b[33mNo Content-Security-Policy header found\x1b[0m`,
      `+ \x1b[31mCORS misconfiguration detected\x1b[0m`,
      `+ /api/: API endpoint discovered`,
      `+ /admin/: Admin interface found (403 Forbidden)`,
      `---------------------------------------------------------------------------`,
      `+ 7 findings identified.`
    ].join('\r\n');
  }

  /**
   * Simulate hydra output
   */
  _simulateHydra(command) {
    return [
      `\x1b[32mHydra v9.5 (c) 2023 by van Hauser/THC\x1b[0m`,
      ``,
      `[DATA] max 16 tasks per 1 server, 16 login tries`,
      `[DATA] attacking http-post-form...`,
      `[ATTEMPT] target - login: admin - pass: admin`,
      `[ATTEMPT] target - login: admin - pass: password`,
      `[ATTEMPT] target - login: admin - pass: 123456`,
      `\x1b[32m[3001][http-post] host: localhost   login: admin   password: admin\x1b[0m`,
      ``,
      `1 of 1 target successfully completed, 1 valid password found`
    ].join('\r\n');
  }

  /**
   * Simulate ls/dir output
   */
  _simulateLs(session) {
    return [
      `\x1b[34mtools/\x1b[0m    \x1b[34mscripts/\x1b[0m    \x1b[34mwordlists/\x1b[0m`,
      `notes.txt    recon.sh    exploit.py`
    ].join('\r\n');
  }

  /**
   * Simulate cat output
   */
  _simulateCat(command) {
    const file = command.replace('cat ', '').trim();
    if (file === 'notes.txt') {
      return [
        '# Nexus Protocol - Mission Notes',
        '- Enumerate endpoints with dirb/gobuster',
        '- Test for SQLi on login forms',
        '- Check for IDOR on API endpoints',
        '- Look for exposed credentials in source code',
        '- Test CORS and CSP headers'
      ].join('\r\n');
    }
    if (file === 'recon.sh') {
      return [
        '#!/bin/bash',
        'echo "[*] Starting recon on $TARGET"',
        'curl -s $TARGET/api/ | head -50',
        'nmap -sV $TARGET',
        'dirb $TARGET'
      ].join('\r\n');
    }
    return `cat: ${file}: No such file or directory`;
  }

  /**
   * Extract URL from command arguments
   */
  _extractTarget(command) {
    const urlMatch = command.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
  }

  /**
   * Get help text
   */
  _getHelpText() {
    return [
      '',
      '\x1b[1;36m╔══════════════════════════════════════════════════╗',
      '║        NEXUS TERMINAL — Available Commands       ║',
      '╚══════════════════════════════════════════════════╝\x1b[0m',
      '',
      '\x1b[1;33m  RECONNAISSANCE\x1b[0m',
      '    curl       — Make HTTP requests to targets',
      '    nmap       — Port scan & service detection',
      '    dirb       — Directory brute-forcing',
      '    nikto      — Web vulnerability scanner',
      '    nslookup   — DNS lookup',
      '    ping       — Network connectivity test',
      '',
      '\x1b[1;33m  EXPLOITATION\x1b[0m',
      '    sqlmap     — SQL injection testing',
      '    hydra      — Password brute-forcing',
      '    base64     — Encode/decode base64',
      '    python     — Execute Python commands',
      '',
      '\x1b[1;33m  UTILITIES\x1b[0m',
      '    target     — Show current target URL',
      '    history    — Show command history',
      '    clear      — Clear terminal screen',
      '    help       — Show this help message',
      ''
    ].join('\r\n');
  }

  /**
   * Kill a terminal session
   */
  killSession(teamId, sessionId) {
    const sessionKey = `${teamId}:${sessionId}`;
    this.sessions.delete(sessionKey);
  }

  /**
   * Get all sessions for a team
   */
  getTeamSessions(teamId) {
    const sessions = [];
    for (const [key, session] of this.sessions) {
      if (session.teamId === teamId) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  /**
   * Count sessions for a team
   */
  _getTeamSessionCount(teamId) {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.teamId === teamId) count++;
    }
    return count;
  }

  /**
   * Cleanup idle sessions
   */
  _cleanupIdleSessions() {
    const now = Date.now();
    for (const [key, session] of this.sessions) {
      if (now - session.lastActivity > this.IDLE_TIMEOUT) {
        console.log(`🧹 Cleaning up idle terminal: ${key}`);
        this.sessions.delete(key);
      }
    }
  }

  /**
   * Cleanup all resources
   */
  destroy() {
    clearInterval(this._cleanupInterval);
    this.sessions.clear();
  }
}

module.exports = TerminalService;
