/**
 * VM Log Parser
 * Reads and parses VM logs every 5 seconds
 * Detects scoring events from system logs
 */

const fs = require('fs').promises;
const { Client } = require('ssh2');

class LogParser {
  constructor() {
    this.parsers = new Map();
    this.pollingInterval = 5000; // 5 seconds
    this.activeConnections = new Map();
  }

  /**
   * Start monitoring VM logs for a session
   */
  startMonitoring(sessionId, vmConfig, onEvent) {
    if (this.parsers.has(sessionId)) {
      console.log(`Already monitoring session: ${sessionId}`);
      return;
    }

    const parser = {
      sessionId,
      vmConfig,
      onEvent,
      lastPosition: {},
      interval: null,
      sshClient: null
    };

    this.parsers.set(sessionId, parser);
    this.connectAndPoll(parser);
    
    console.log(`Started log monitoring for session: ${sessionId}`);
  }

  /**
   * Connect to VM and start polling logs
   */
  connectAndPoll(parser) {
    const client = new Client();
    
    client.on('ready', () => {
      console.log(`SSH connected for log parsing: ${parser.sessionId}`);
      parser.sshClient = client;
      
      // Start polling interval
      parser.interval = setInterval(() => {
        this.pollLogs(parser);
      }, this.pollingInterval);
      
      // Initial poll
      this.pollLogs(parser);
    });

    client.on('error', (err) => {
      console.error(`SSH error for log parser ${parser.sessionId}:`, err.message);
    });

    client.on('close', () => {
      console.log(`SSH closed for log parser: ${parser.sessionId}`);
      if (parser.interval) {
        clearInterval(parser.interval);
      }
    });

    client.connect({
      host: parser.vmConfig.host,
      port: parser.vmConfig.port || 22,
      username: parser.vmConfig.username,
      password: parser.vmConfig.password,
      readyTimeout: 20000
    });
  }

  /**
   * Poll VM logs and parse for events
   */
  async pollLogs(parser) {
    if (!parser.sshClient) return;

    const logFiles = [
      '/var/log/auth.log',
      '/var/log/syslog',
      '/var/log/apache2/access.log',
      '/var/log/nginx/access.log',
      '/var/log/secure'
    ];

    for (const logFile of logFiles) {
      try {
        await this.parseLogFile(parser, logFile);
      } catch (error) {
        // Log file might not exist, skip silently
      }
    }
  }

  /**
   * Parse a specific log file
   */
  parseLogFile(parser, logFile) {
    return new Promise((resolve, reject) => {
      const lastPos = parser.lastPosition[logFile] || 0;
      
      // Read only new lines since last position
      const command = `tail -c +${lastPos + 1} ${logFile} 2>/dev/null || echo ""`;
      
      parser.sshClient.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let output = '';
        
        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.on('close', () => {
          if (output.trim()) {
            // Update position
            parser.lastPosition[logFile] = lastPos + Buffer.byteLength(output);
            
            // Parse output for scoring events
            this.parseLogContent(parser, logFile, output);
          }
          resolve();
        });

        stream.stderr.on('data', () => {
          // Ignore stderr
        });
      });
    });
  }

  /**
   * Parse log content for scoring events
   */
  parseLogContent(parser, logFile, content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Authentication events
      if (line.includes('Accepted password') || line.includes('Accepted publickey')) {
        parser.onEvent({
          type: 'authentication_success',
          category: 'access',
          points: 50,
          description: 'Successful authentication',
          logFile,
          line,
          timestamp: new Date()
        });
      }

      if (line.includes('Failed password')) {
        parser.onEvent({
          type: 'authentication_failure',
          category: 'security',
          points: -10,
          description: 'Failed authentication attempt',
          logFile,
          line,
          timestamp: new Date()
        });
      }

      // Privilege escalation
      if (line.includes('sudo:') && line.includes('COMMAND=')) {
        parser.onEvent({
          type: 'privilege_escalation',
          category: 'access',
          points: 100,
          description: 'Sudo command executed',
          logFile,
          line,
          timestamp: new Date()
        });
      }

      // Service manipulation
      if (line.includes('systemctl start') || line.includes('service') && line.includes('start')) {
        parser.onEvent({
          type: 'service_started',
          category: 'system',
          points: 75,
          description: 'Service started',
          logFile,
          line,
          timestamp: new Date()
        });
      }

      if (line.includes('systemctl stop') || line.includes('service') && line.includes('stop')) {
        parser.onEvent({
          type: 'service_stopped',
          category: 'system',
          points: 75,
          description: 'Service stopped',
          logFile,
          line,
          timestamp: new Date()
        });
      }

      // Firewall changes
      if (line.includes('iptables') || line.includes('ufw')) {
        parser.onEvent({
          type: 'firewall_modified',
          category: 'security',
          points: 150,
          description: 'Firewall rules modified',
          logFile,
          line,
          timestamp: new Date()
        });
      }

      // File access
      if (line.includes('opened') || line.includes('accessed')) {
        if (line.includes('/etc/passwd') || line.includes('/etc/shadow')) {
          parser.onEvent({
            type: 'sensitive_file_access',
            category: 'security',
            points: 200,
            description: 'Sensitive file accessed',
            logFile,
            line,
            timestamp: new Date()
          });
        }
      }

      // Network activity
      if (line.includes('Connection from') || line.includes('connection accepted')) {
        parser.onEvent({
          type: 'network_connection',
          category: 'network',
          points: 25,
          description: 'Network connection established',
          logFile,
          line,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Stop monitoring a session
   */
  stopMonitoring(sessionId) {
    const parser = this.parsers.get(sessionId);
    if (!parser) return;

    if (parser.interval) {
      clearInterval(parser.interval);
    }

    if (parser.sshClient) {
      parser.sshClient.end();
    }

    this.parsers.delete(sessionId);
    console.log(`Stopped log monitoring for session: ${sessionId}`);
  }

  /**
   * Stop all monitoring
   */
  stopAll() {
    for (const [sessionId] of this.parsers) {
      this.stopMonitoring(sessionId);
    }
  }

  /**
   * Get active parsers
   */
  getActiveParsers() {
    return Array.from(this.parsers.keys());
  }
}

module.exports = LogParser;
