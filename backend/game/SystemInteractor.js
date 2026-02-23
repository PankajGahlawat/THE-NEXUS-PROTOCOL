// System Interactor for NEXUS PROTOCOL
// Handles actual system interactions and command execution

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemInteractor {
  constructor() {
    // Simulated system states for cyber range
    this.systemStates = new Map();
    this.networkTopology = this.initializeNetworkTopology();
    this.vulnerabilities = this.initializeVulnerabilities();
    this.services = this.initializeServices();
  }

  /**
   * Initialize network topology for cyber range
   */
  initializeNetworkTopology() {
    return {
      '192.168.100.50': {
        tier: 'tier1',
        type: 'web',
        services: ['http', 'https'],
        os: 'ubuntu',
        vulnerabilities: ['sql_injection', 'xss', 'directory_traversal']
      },
      '192.168.100.51': {
        tier: 'tier2',
        type: 'database',
        services: ['ssh', 'mysql'],
        os: 'centos',
        vulnerabilities: ['weak_credentials', 'privilege_escalation']
      },
      '192.168.100.52': {
        tier: 'tier3',
        type: 'core',
        services: ['ssh', 'ftp', 'smb'],
        os: 'windows',
        vulnerabilities: ['ms17_010', 'weak_smb']
      }
    };
  }

  /**
   * Initialize known vulnerabilities
   */
  initializeVulnerabilities() {
    return {
      'sql_injection': {
        severity: 'high',
        exploitable: true,
        description: 'SQL injection in login form'
      },
      'xss': {
        severity: 'medium',
        exploitable: true,
        description: 'Cross-site scripting vulnerability'
      },
      'weak_credentials': {
        severity: 'high',
        exploitable: true,
        description: 'Default or weak passwords'
      },
      'ms17_010': {
        severity: 'critical',
        exploitable: true,
        description: 'EternalBlue SMB vulnerability'
      }
    };
  }

  /**
   * Initialize services
   */
  initializeServices() {
    return {
      'http': { port: 80, status: 'running' },
      'https': { port: 443, status: 'running' },
      'ssh': { port: 22, status: 'running' },
      'mysql': { port: 3306, status: 'running' },
      'ftp': { port: 21, status: 'running' },
      'smb': { port: 445, status: 'running' }
    };
  }

  /**
   * Scan network for hosts and services
   * @param {string} target - Target IP or range
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Scan results
   */
  async scanNetwork(target, context) {
    try {
      // Simulate nmap scan
      const hosts = [];
      const targetIp = target.includes('/') ? target : target;
      
      // Check if target is in our cyber range
      for (const [ip, hostInfo] of Object.entries(this.networkTopology)) {
        if (target === ip || target.includes('192.168.100')) {
          const openPorts = [];
          
          // Simulate port scanning based on services
          for (const service of hostInfo.services) {
            const serviceInfo = this.services[service];
            if (serviceInfo && serviceInfo.status === 'running') {
              openPorts.push({
                port: serviceInfo.port,
                service: service,
                state: 'open'
              });
            }
          }
          
          hosts.push({
            ip: ip,
            hostname: `${hostInfo.type}-${hostInfo.tier}`,
            os: hostInfo.os,
            ports: openPorts,
            tier: hostInfo.tier
          });
        }
      }
      
      // Apply effectiveness to results
      const effectiveness = context.effectiveness || 1.0;
      const detectedHosts = hosts.slice(0, Math.ceil(hosts.length * effectiveness));
      
      return {
        success: true,
        output: `Nmap scan completed. Found ${detectedHosts.length} hosts.`,
        hosts: detectedHosts,
        systemStateChanges: [{
          type: 'reconnaissance',
          target: target,
          data: { hosts_discovered: detectedHosts.length }
        }],
        metadata: {
          scanType: context.params?.scan_type || 'syn',
          duration: Math.round(30 * (1 / effectiveness)) // Slower scans with low effectiveness
        }
      };
      
    } catch (error) {
      return {
        success: false,
        output: `Nmap scan failed: ${error.message}`,
        systemStateChanges: []
      };
    }
  }

  /**
   * Exploit SQL injection vulnerability
   * @param {string} targetUrl - Target URL
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Exploitation results
   */
  async exploitSql(targetUrl, context) {
    try {
      const url = new URL(targetUrl);
      const targetIp = url.hostname;
      const hostInfo = this.networkTopology[targetIp];
      
      if (!hostInfo) {
        return {
          success: false,
          output: 'Target not found in network range',
          systemStateChanges: []
        };
      }
      
      // Check if SQL injection vulnerability exists
      if (!hostInfo.vulnerabilities.includes('sql_injection')) {
        return {
          success: false,
          output: 'No SQL injection vulnerability found',
          systemStateChanges: []
        };
      }
      
      const effectiveness = context.effectiveness || 1.0;
      const successProbability = 0.7 * effectiveness;
      
      if (Math.random() < successProbability) {
        // Successful SQL injection
        const extractedData = [
          { table: 'users', records: 150 },
          { table: 'admin', records: 3 },
          { table: 'sessions', records: 45 }
        ];
        
        return {
          success: true,
          output: `SQL injection successful! Extracted data from ${extractedData.length} tables.`,
          extractedData,
          systemStateChanges: [{
            type: 'data_extraction',
            target: targetIp,
            data: { tables_accessed: extractedData.length, vulnerability: 'sql_injection' }
          }],
          metadata: {
            technique: context.params?.technique || 'union',
            database: 'mysql'
          }
        };
      } else {
        return {
          success: false,
          output: 'SQL injection attempt blocked by WAF or failed',
          systemStateChanges: [{
            type: 'failed_attack',
            target: targetIp,
            data: { attack_type: 'sql_injection' }
          }]
        };
      }
      
    } catch (error) {
      return {
        success: false,
        output: `SQLMap execution failed: ${error.message}`,
        systemStateChanges: []
      };
    }
  }

  /**
   * Enumerate web directories
   * @param {string} targetUrl - Target URL
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Directory enumeration results
   */
  async enumerateDirectories(targetUrl, context) {
    try {
      const url = new URL(targetUrl);
      const targetIp = url.hostname;
      const hostInfo = this.networkTopology[targetIp];
      
      if (!hostInfo || !hostInfo.services.includes('http')) {
        return {
          success: false,
          output: 'No web service found on target',
          systemStateChanges: []
        };
      }
      
      // Simulate directory enumeration
      const commonDirectories = [
        '/admin', '/login', '/dashboard', '/api', '/uploads',
        '/backup', '/config', '/logs', '/temp', '/dev'
      ];
      
      const effectiveness = context.effectiveness || 1.0;
      const foundDirectories = [];
      
      for (const dir of commonDirectories) {
        if (Math.random() < (0.3 * effectiveness)) {
          foundDirectories.push({
            path: dir,
            status: Math.random() < 0.7 ? 200 : 403,
            size: Math.floor(Math.random() * 10000)
          });
        }
      }
      
      return {
        success: true,
        output: `Directory enumeration completed. Found ${foundDirectories.length} directories.`,
        directories: foundDirectories,
        systemStateChanges: [{
          type: 'reconnaissance',
          target: targetIp,
          data: { directories_found: foundDirectories.length }
        }],
        metadata: {
          wordlist: context.params?.wordlist || 'common.txt',
          extensions: context.params?.extensions || 'php,html,txt'
        }
      };
      
    } catch (error) {
      return {
        success: false,
        output: `Gobuster execution failed: ${error.message}`,
        systemStateChanges: []
      };
    }
  }

  /**
   * Brute force credentials
   * @param {Object} target - Target information
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Brute force results
   */
  async bruteForceCredentials(target, context) {
    try {
      const targetIp = target.ip || target;
      const service = context.params?.service || 'ssh';
      const hostInfo = this.networkTopology[targetIp];
      
      if (!hostInfo || !hostInfo.services.includes(service)) {
        return {
          success: false,
          output: `Service ${service} not found on target`,
          systemStateChanges: []
        };
      }
      
      // Check for weak credentials vulnerability
      if (!hostInfo.vulnerabilities.includes('weak_credentials')) {
        return {
          success: false,
          output: 'No weak credentials found',
          systemStateChanges: []
        };
      }
      
      const effectiveness = context.effectiveness || 1.0;
      const successProbability = 0.6 * effectiveness;
      
      if (Math.random() < successProbability) {
        const crackedCredentials = [
          { username: 'admin', password: 'admin123' },
          { username: 'user', password: 'password' },
          { username: 'guest', password: 'guest' }
        ];
        
        return {
          success: true,
          output: `Credentials cracked! Found ${crackedCredentials.length} valid accounts.`,
          credentials: crackedCredentials,
          systemStateChanges: [{
            type: 'credential_compromise',
            target: targetIp,
            data: { service, accounts_compromised: crackedCredentials.length }
          }],
          metadata: {
            service,
            attempts: Math.floor(1000 * (1 / effectiveness))
          }
        };
      } else {
        return {
          success: false,
          output: 'Brute force attack failed - no valid credentials found',
          systemStateChanges: [{
            type: 'failed_attack',
            target: targetIp,
            data: { attack_type: 'brute_force', service }
          }]
        };
      }
      
    } catch (error) {
      return {
        success: false,
        output: `Hydra execution failed: ${error.message}`,
        systemStateChanges: []
      };
    }
  }

  /**
   * Exploit vulnerability using Metasploit
   * @param {Object} target - Target information
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Exploitation results
   */
  async exploitVulnerability(target, context) {
    try {
      const targetIp = target.ip || target;
      const exploit = context.params?.exploit;
      const hostInfo = this.networkTopology[targetIp];
      
      if (!hostInfo) {
        return {
          success: false,
          output: 'Target not found in network range',
          systemStateChanges: []
        };
      }
      
      // Map exploits to vulnerabilities
      const exploitMap = {
        'ms17_010': 'ms17_010',
        'eternalblue': 'ms17_010',
        'sql_injection': 'sql_injection'
      };
      
      const vulnerability = exploitMap[exploit] || exploit;
      
      if (!hostInfo.vulnerabilities.includes(vulnerability)) {
        return {
          success: false,
          output: `Vulnerability ${vulnerability} not present on target`,
          systemStateChanges: []
        };
      }
      
      const effectiveness = context.effectiveness || 1.0;
      const successProbability = 0.8 * effectiveness;
      
      if (Math.random() < successProbability) {
        return {
          success: true,
          output: `Exploitation successful! Gained ${hostInfo.os === 'windows' ? 'SYSTEM' : 'root'} access.`,
          access: {
            level: hostInfo.os === 'windows' ? 'SYSTEM' : 'root',
            shell: true,
            persistence: false
          },
          systemStateChanges: [{
            type: 'system_compromise',
            target: targetIp,
            data: { 
              exploit: vulnerability,
              access_level: hostInfo.os === 'windows' ? 'SYSTEM' : 'root',
              tier: hostInfo.tier
            }
          }],
          metadata: {
            exploit,
            payload: context.params?.payload || 'reverse_tcp',
            vulnerability
          }
        };
      } else {
        return {
          success: false,
          output: 'Exploitation failed - target may be patched or protected',
          systemStateChanges: [{
            type: 'failed_attack',
            target: targetIp,
            data: { attack_type: 'exploit', exploit: vulnerability }
          }]
        };
      }
      
    } catch (error) {
      return {
        success: false,
        output: `Metasploit execution failed: ${error.message}`,
        systemStateChanges: []
      };
    }
  }

  // Blue Team tool implementations

  /**
   * Monitor network traffic for intrusions
   * @param {Object} target - Target interface/network
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Monitoring results
   */
  async monitorTraffic(target, context) {
    try {
      const networkInterface = context.params?.interface || 'eth0';
      const effectiveness = context.effectiveness || 1.0;
      
      // Simulate IDS detection
      const detectedEvents = [];
      const suspiciousActivities = [
        'Port scan detected from 192.168.100.10',
        'SQL injection attempt on web server',
        'Brute force attack on SSH service',
        'Suspicious DNS queries detected',
        'Potential data exfiltration via HTTP'
      ];
      
      // Higher effectiveness = better detection
      const detectionCount = Math.floor(suspiciousActivities.length * effectiveness * Math.random());
      
      for (let i = 0; i < detectionCount; i++) {
        detectedEvents.push({
          timestamp: new Date(),
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          description: suspiciousActivities[i],
          source_ip: '192.168.100.' + (10 + Math.floor(Math.random() * 3))
        });
      }
      
      return {
        success: true,
        output: `IDS monitoring active. Detected ${detectedEvents.length} suspicious events.`,
        events: detectedEvents,
        systemStateChanges: [{
          type: 'monitoring_enabled',
          target: networkInterface,
          data: { events_detected: detectedEvents.length }
        }],
        metadata: {
          interface: networkInterface,
          rules: context.params?.rules || 'default',
          sensitivity: context.params?.sensitivity || 'medium'
        }
      };
      
    } catch (error) {
      return {
        success: false,
        output: `IDS monitoring failed: ${error.message}`,
        systemStateChanges: []
      };
    }
  }

  /**
   * Configure firewall rules
   * @param {Object} target - Target system
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Configuration results
   */
  async configureFirewall(target, context) {
    try {
      const action = context.params?.action; // 'block', 'allow', 'deny'
      const targetSpec = context.params?.target; // IP, port, etc.
      const effectiveness = context.effectiveness || 1.0;
      
      if (!action || !targetSpec) {
        return {
          success: false,
          output: 'Missing required parameters: action and target',
          systemStateChanges: []
        };
      }
      
      const rule = {
        id: Date.now(),
        action,
        target: targetSpec,
        port: context.params?.port,
        protocol: context.params?.protocol || 'tcp',
        created: new Date()
      };
      
      return {
        success: true,
        output: `Firewall rule created: ${action.toUpperCase()} ${targetSpec}`,
        rule,
        systemStateChanges: [{
          type: 'firewall_rule_added',
          target: 'firewall',
          data: rule
        }],
        metadata: {
          effectiveness: Math.round(effectiveness * 100) + '%'
        }
      };
      
    } catch (error) {
      return {
        success: false,
        output: `Firewall configuration failed: ${error.message}`,
        systemStateChanges: []
      };
    }
  }

  /**
   * Block IP address
   * @param {Object} target - Target IP information
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Blocking results
   */
  async blockIpAddress(target, context) {
    try {
      const ipAddress = context.params?.ip_address || target.ip || target;
      const duration = context.params?.duration || 3600; // 1 hour default
      const reason = context.params?.reason || 'Suspicious activity';
      
      return {
        success: true,
        output: `IP address ${ipAddress} blocked for ${duration} seconds`,
        blockedIp: {
          ip: ipAddress,
          duration,
          reason,
          blocked_at: new Date(),
          expires_at: new Date(Date.now() + duration * 1000)
        },
        systemStateChanges: [{
          type: 'ip_blocked',
          target: ipAddress,
          data: { duration, reason }
        }],
        metadata: {
          method: 'iptables',
          automatic_unblock: true
        }
      };
      
    } catch (error) {
      return {
        success: false,
        output: `IP blocking failed: ${error.message}`,
        systemStateChanges: []
      };
    }
  }

  // Additional Blue Team tools (simplified implementations)
  async scanForRootkits(target, context) {
    const findings = Math.random() < 0.3 ? ['Suspicious process detected', 'Modified system file found'] : [];
    return {
      success: true,
      output: `Rootkit scan completed. Found ${findings.length} issues.`,
      findings,
      systemStateChanges: [{ type: 'rootkit_scan', target: target.ip || target, data: { issues: findings.length } }]
    };
  }

  async analyzeArtifacts(target, context) {
    const artifacts = ['Login events', 'File modifications', 'Network connections', 'Process executions'];
    return {
      success: true,
      output: `Forensic analysis completed. Analyzed ${artifacts.length} artifact types.`,
      artifacts,
      systemStateChanges: [{ type: 'forensic_analysis', target: target.ip || target, data: { artifacts: artifacts.length } }]
    };
  }

  async restoreSystem(target, context) {
    const targetIp = target.ip || target;
    return {
      success: true,
      output: `System ${targetIp} restored to clean state`,
      systemStateChanges: [{ type: 'system_restored', target: targetIp, data: { snapshot_id: context.params?.snapshot_id || 'baseline' } }]
    };
  }

  // Placeholder implementations for remaining tools
  async extractCredentials(target, context) {
    const credentials = Math.random() < 0.7 ? [{ user: 'admin', hash: 'NTLM:...' }] : [];
    return {
      success: credentials.length > 0,
      output: `Credential extraction ${credentials.length > 0 ? 'successful' : 'failed'}`,
      credentials,
      systemStateChanges: [{ type: 'credential_extraction', target: target.ip || target, data: { count: credentials.length } }]
    };
  }

  async establishPersistence(target, context) {
    return {
      success: true,
      output: 'Persistence established via cron job',
      systemStateChanges: [{ type: 'persistence_established', target: target.ip || target, data: { method: 'cron' } }]
    };
  }

  async createConnection(target, context) {
    return {
      success: true,
      output: `Connection established to ${target.ip || target}:${context.params?.port || 4444}`,
      systemStateChanges: [{ type: 'connection_established', target: target.ip || target, data: { port: context.params?.port || 4444 } }]
    };
  }

  async exfiltrateViaDns(target, context) {
    const dataSize = Math.floor(Math.random() * 1000) + 100;
    return {
      success: true,
      output: `Data exfiltrated via DNS: ${dataSize} bytes`,
      systemStateChanges: [{ type: 'data_exfiltration', target: 'dns', data: { bytes: dataSize, method: 'dns_tunnel' } }]
    };
  }
}

module.exports = SystemInteractor;