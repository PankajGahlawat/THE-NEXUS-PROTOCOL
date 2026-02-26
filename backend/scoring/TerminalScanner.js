/**
 * Terminal Output Scanner
 * Scans terminal output for scoring patterns using regex
 * Detects commands, tools, and techniques
 */

class TerminalScanner {
  constructor() {
    this.patterns = this.initializePatterns();
    this.commandHistory = new Map(); // Track commands per session
  }

  /**
   * Initialize scoring patterns
   */
  initializePatterns() {
    return {
      // Reconnaissance
      reconnaissance: [
        { regex: /nmap\s+.*-s[STAU]/i, points: 100, description: 'Port scanning with nmap' },
        { regex: /nmap\s+.*-O/i, points: 150, description: 'OS detection with nmap' },
        { regex: /nmap\s+.*-A/i, points: 200, description: 'Aggressive scan with nmap' },
        { regex: /netstat\s+-[a-z]*[tulpn]/i, points: 50, description: 'Network connections enumeration' },
        { regex: /ss\s+-[a-z]*[tulpn]/i, points: 50, description: 'Socket statistics' },
        { regex: /ifconfig|ip\s+addr/i, points: 25, description: 'Network interface enumeration' },
        { regex: /arp\s+-[a-z]/i, points: 75, description: 'ARP table enumeration' },
        { regex: /route\s+-n|ip\s+route/i, points: 50, description: 'Routing table enumeration' },
        { regex: /dig|nslookup|host/i, points: 50, description: 'DNS enumeration' },
        { regex: /whois/i, points: 50, description: 'WHOIS lookup' }
      ],

      // Exploitation
      exploitation: [
        { regex: /metasploit|msfconsole|msfvenom/i, points: 300, description: 'Metasploit framework usage' },
        { regex: /exploit|payload/i, points: 250, description: 'Exploit execution' },
        { regex: /sqlmap/i, points: 200, description: 'SQL injection tool' },
        { regex: /hydra|medusa/i, points: 200, description: 'Password cracking tool' },
        { regex: /john|hashcat/i, points: 200, description: 'Hash cracking tool' },
        { regex: /burpsuite|burp/i, points: 150, description: 'Web application testing' },
        { regex: /nikto|dirb|gobuster/i, points: 150, description: 'Web directory enumeration' }
      ],

      // Privilege Escalation
      privilege_escalation: [
        { regex: /sudo\s+-l/i, points: 100, description: 'Sudo privileges enumeration' },
        { regex: /sudo\s+su|sudo\s+bash|sudo\s+sh/i, points: 300, description: 'Root shell obtained' },
        { regex: /find.*-perm.*4000/i, points: 150, description: 'SUID binary search' },
        { regex: /find.*-perm.*2000/i, points: 150, description: 'SGID binary search' },
        { regex: /cat\s+\/etc\/passwd/i, points: 75, description: 'Password file accessed' },
        { regex: /cat\s+\/etc\/shadow/i, points: 200, description: 'Shadow file accessed' },
        { regex: /\/etc\/sudoers/i, points: 150, description: 'Sudoers file accessed' },
        { regex: /crontab\s+-l/i, points: 75, description: 'Cron jobs enumeration' }
      ],

      // Persistence
      persistence: [
        { regex: /crontab\s+-e/i, points: 200, description: 'Cron job created' },
        { regex: /systemctl\s+enable/i, points: 200, description: 'Service persistence' },
        { regex: /\.bashrc|\.bash_profile|\.profile/i, points: 150, description: 'Shell profile modification' },
        { regex: /ssh-keygen/i, points: 100, description: 'SSH key generation' },
        { regex: /authorized_keys/i, points: 200, description: 'SSH key persistence' },
        { regex: /\/etc\/rc\.local/i, points: 150, description: 'Boot script modification' }
      ],

      // Defense Evasion
      defense_evasion: [
        { regex: /rm\s+.*\.log/i, points: 150, description: 'Log file deletion' },
        { regex: /history\s+-c/i, points: 100, description: 'Command history cleared' },
        { regex: /unset\s+HISTFILE/i, points: 150, description: 'History disabled' },
        { regex: /iptables.*DROP/i, points: 200, description: 'Firewall rule to drop packets' },
        { regex: /systemctl\s+stop.*log/i, points: 200, description: 'Logging service stopped' },
        { regex: /chmod\s+000/i, points: 100, description: 'File permissions removed' }
      ],

      // Lateral Movement
      lateral_movement: [
        { regex: /ssh\s+.*@/i, points: 150, description: 'SSH connection to another host' },
        { regex: /scp\s+/i, points: 100, description: 'Secure copy to another host' },
        { regex: /rsync\s+/i, points: 100, description: 'Remote sync' },
        { regex: /nc\s+.*-e|netcat.*-e/i, points: 200, description: 'Reverse shell with netcat' },
        { regex: /bash\s+-i.*\/dev\/tcp/i, points: 250, description: 'Bash reverse shell' }
      ],

      // Data Exfiltration
      exfiltration: [
        { regex: /curl.*-d|wget.*--post/i, points: 200, description: 'Data exfiltration via HTTP' },
        { regex: /tar.*\|.*ssh/i, points: 250, description: 'Archive exfiltration via SSH' },
        { regex: /base64.*\|.*curl/i, points: 200, description: 'Encoded data exfiltration' },
        { regex: /scp.*\.tar|scp.*\.zip/i, points: 200, description: 'Archive transfer' }
      ],

      // Blue Team - Defense
      defense: [
        { regex: /iptables\s+-A.*ACCEPT/i, points: 100, description: 'Firewall rule added' },
        { regex: /ufw\s+enable|ufw\s+allow|ufw\s+deny/i, points: 100, description: 'UFW firewall configured' },
        { regex: /fail2ban/i, points: 150, description: 'Fail2ban configuration' },
        { regex: /chown\s+root/i, points: 75, description: 'File ownership secured' },
        { regex: /chmod\s+[0-7]00/i, points: 75, description: 'File permissions secured' },
        { regex: /systemctl\s+restart.*ssh/i, points: 100, description: 'SSH service restarted' },
        { regex: /passwd\s+/i, points: 100, description: 'Password changed' }
      ],

      // Blue Team - Monitoring
      monitoring: [
        { regex: /tail\s+-f.*log/i, points: 50, description: 'Log monitoring' },
        { regex: /grep.*\/var\/log/i, points: 50, description: 'Log analysis' },
        { regex: /ps\s+aux|ps\s+-ef/i, points: 25, description: 'Process enumeration' },
        { regex: /top|htop/i, points: 25, description: 'System monitoring' },
        { regex: /lsof/i, points: 75, description: 'Open files enumeration' },
        { regex: /tcpdump|wireshark/i, points: 150, description: 'Network traffic capture' }
      ],

      // Blue Team - Forensics
      forensics: [
        { regex: /find.*-mtime/i, points: 100, description: 'File modification time search' },
        { regex: /find.*-atime/i, points: 100, description: 'File access time search' },
        { regex: /stat\s+/i, points: 50, description: 'File metadata inspection' },
        { regex: /strings\s+/i, points: 75, description: 'Binary string extraction' },
        { regex: /file\s+/i, points: 25, description: 'File type identification' },
        { regex: /md5sum|sha256sum/i, points: 75, description: 'File hash calculation' }
      ]
    };
  }

  /**
   * Scan terminal output for scoring patterns
   */
  scanOutput(sessionId, userId, output) {
    const events = [];
    
    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.regex.test(output)) {
          // Check if this command was already scored recently (prevent spam)
          if (!this.isDuplicate(sessionId, pattern.description)) {
            events.push({
              type: 'terminal_pattern_match',
              category,
              points: pattern.points,
              description: pattern.description,
              pattern: pattern.regex.toString(),
              output: output.substring(0, 200), // First 200 chars
              timestamp: new Date()
            });

            // Track this command
            this.trackCommand(sessionId, pattern.description);
          }
        }
      }
    }

    return events;
  }

  /**
   * Scan a specific command
   */
  scanCommand(sessionId, userId, command) {
    const events = [];
    
    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.regex.test(command)) {
          if (!this.isDuplicate(sessionId, pattern.description)) {
            events.push({
              type: 'command_match',
              category,
              points: pattern.points,
              description: pattern.description,
              command: command.substring(0, 200),
              timestamp: new Date()
            });

            this.trackCommand(sessionId, pattern.description);
          }
        }
      }
    }

    return events;
  }

  /**
   * Check if command was recently scored (prevent spam)
   */
  isDuplicate(sessionId, description) {
    const key = `${sessionId}:${description}`;
    const history = this.commandHistory.get(key);
    
    if (!history) return false;
    
    // Allow same command after 30 seconds
    const timeSince = Date.now() - history.timestamp;
    return timeSince < 30000;
  }

  /**
   * Track command execution
   */
  trackCommand(sessionId, description) {
    const key = `${sessionId}:${description}`;
    this.commandHistory.set(key, {
      timestamp: Date.now(),
      count: (this.commandHistory.get(key)?.count || 0) + 1
    });
  }

  /**
   * Clear session history
   */
  clearSession(sessionId) {
    for (const [key] of this.commandHistory) {
      if (key.startsWith(`${sessionId}:`)) {
        this.commandHistory.delete(key);
      }
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const stats = {
      totalCommands: 0,
      categories: {}
    };

    for (const [key, data] of this.commandHistory) {
      if (key.startsWith(`${sessionId}:`)) {
        stats.totalCommands += data.count;
      }
    }

    return stats;
  }

  /**
   * Add custom pattern
   */
  addPattern(category, regex, points, description) {
    if (!this.patterns[category]) {
      this.patterns[category] = [];
    }

    this.patterns[category].push({
      regex: new RegExp(regex, 'i'),
      points,
      description
    });
  }

  /**
   * Get all patterns
   */
  getPatterns() {
    return this.patterns;
  }
}

module.exports = TerminalScanner;
