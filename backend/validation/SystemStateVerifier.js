/**
 * NEXUS PROTOCOL - System State Verifier
 * Verifies system state changes for task validation
 * Version: 1.0.0
 * Date: February 19, 2026
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemStateVerifier {
  constructor(config = {}) {
    this.config = {
      sshUser: config.sshUser || 'nexus',
      sshKeyPath: config.sshKeyPath || '~/.ssh/nexus_key',
      commandTimeout: config.commandTimeout || 10000,
      ...config
    };
  }

  /**
   * Verify open ports on target system
   */
  async verifyOpenPorts(targetSystem, expectedPorts) {
    try {
      // Simulate port scan verification (in production, use actual nmap or similar)
      const command = `nmap -p ${expectedPorts.join(',')} ${targetSystem} --open -oG -`;
      const { stdout } = await this.executeCommand(command);

      const foundPorts = this.parseNmapOutput(stdout);
      const allPortsOpen = expectedPorts.every(port => foundPorts.includes(port));

      if (!allPortsOpen) {
        const missingPorts = expectedPorts.filter(port => !foundPorts.includes(port));
        return {
          valid: false,
          reason: `Missing open ports: ${missingPorts.join(', ')}`,
          foundPorts,
          missingPorts
        };
      }

      return {
        valid: true,
        foundPorts
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Port verification failed: ${error.message}`,
        foundPorts: []
      };
    }
  }

  /**
   * Verify services on target system
   */
  async verifyServices(targetSystem, expectedServices) {
    try {
      const command = `ssh ${this.config.sshUser}@${targetSystem} "systemctl list-units --type=service --state=running"`;
      const { stdout } = await this.executeCommand(command);

      const runningServices = this.parseSystemctlOutput(stdout);
      const foundServices = expectedServices.filter(service => 
        runningServices.some(running => running.includes(service))
      );

      if (foundServices.length !== expectedServices.length) {
        const missingServices = expectedServices.filter(service => !foundServices.includes(service));
        return {
          valid: false,
          reason: `Missing services: ${missingServices.join(', ')}`,
          foundServices,
          missingServices
        };
      }

      return {
        valid: true,
        foundServices
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Service verification failed: ${error.message}`,
        foundServices: []
      };
    }
  }

  /**
   * Verify service state (running, stopped, etc.)
   */
  async verifyServiceState(targetSystem, expectedState) {
    try {
      const { serviceName, state } = expectedState;
      const command = `ssh ${this.config.sshUser}@${targetSystem} "systemctl is-active ${serviceName}"`;
      const { stdout } = await this.executeCommand(command);

      const actualState = stdout.trim();
      const stateMatches = actualState === state;

      if (!stateMatches) {
        return {
          valid: false,
          reason: `Service ${serviceName} is ${actualState}, expected ${state}`,
          actualState
        };
      }

      return {
        valid: true,
        services: [{ name: serviceName, state: actualState }]
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Service state verification failed: ${error.message}`,
        actualState: 'unknown'
      };
    }
  }

  /**
   * Verify file modifications
   */
  async verifyFileModification(targetSystem, filePath, operation, expectedContent = null) {
    try {
      let command;
      
      switch (operation) {
        case 'created':
        case 'modified':
          command = `ssh ${this.config.sshUser}@${targetSystem} "test -f ${filePath} && echo 'exists' || echo 'not_found'"`;
          break;
        case 'deleted':
          command = `ssh ${this.config.sshUser}@${targetSystem} "test -f ${filePath} && echo 'exists' || echo 'deleted'"`;
          break;
        default:
          return {
            valid: false,
            reason: `Unknown operation: ${operation}`
          };
      }

      const { stdout } = await this.executeCommand(command);
      const result = stdout.trim();

      // Verify operation
      if (operation === 'deleted' && result === 'exists') {
        return {
          valid: false,
          reason: `File ${filePath} still exists, expected deleted`,
          details: { operation, result }
        };
      }

      if ((operation === 'created' || operation === 'modified') && result === 'not_found') {
        return {
          valid: false,
          reason: `File ${filePath} not found, expected ${operation}`,
          details: { operation, result }
        };
      }

      // Verify content if specified
      if (expectedContent && (operation === 'created' || operation === 'modified')) {
        const contentCommand = `ssh ${this.config.sshUser}@${targetSystem} "cat ${filePath}"`;
        const { stdout: content } = await this.executeCommand(contentCommand);
        
        if (!content.includes(expectedContent)) {
          return {
            valid: false,
            reason: `File content does not match expected content`,
            details: { expectedContent, actualContent: content.substring(0, 100) }
          };
        }
      }

      return {
        valid: true,
        details: { filePath, operation, verified: true }
      };
    } catch (error) {
      return {
        valid: false,
        reason: `File modification verification failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Verify privilege escalation
   */
  async verifyPrivilegeEscalation(targetSystem, username, expectedPrivileges) {
    try {
      // Check if user has sudo privileges
      const command = `ssh ${this.config.sshUser}@${targetSystem} "sudo -l -U ${username}"`;
      const { stdout } = await this.executeCommand(command);

      const hasSudo = stdout.includes('ALL') || stdout.includes('NOPASSWD');
      
      // Check user groups
      const groupCommand = `ssh ${this.config.sshUser}@${targetSystem} "groups ${username}"`;
      const { stdout: groupOutput } = await this.executeCommand(groupCommand);
      
      const groups = groupOutput.split(':')[1]?.trim().split(' ') || [];
      const hasAdminGroup = groups.some(g => ['sudo', 'wheel', 'admin', 'root'].includes(g));

      const hasPrivileges = hasSudo || hasAdminGroup;

      if (expectedPrivileges === 'root' && !hasPrivileges) {
        return {
          valid: false,
          reason: `User ${username} does not have elevated privileges`,
          actualPrivileges: groups
        };
      }

      return {
        valid: true,
        privileges: { sudo: hasSudo, groups, elevated: hasPrivileges }
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Privilege escalation verification failed: ${error.message}`,
        actualPrivileges: []
      };
    }
  }

  /**
   * Verify data exfiltration
   */
  async verifyDataExfiltration(targetSystem, dataIdentifier, minimumBytes, method) {
    try {
      // Check for data transfer logs or evidence
      let command;
      
      switch (method) {
        case 'dns':
          command = `ssh ${this.config.sshUser}@${targetSystem} "grep -c '${dataIdentifier}' /var/log/dns.log"`;
          break;
        case 'http':
          command = `ssh ${this.config.sshUser}@${targetSystem} "grep -c '${dataIdentifier}' /var/log/apache2/access.log"`;
          break;
        case 'netcat':
          command = `ssh ${this.config.sshUser}@${targetSystem} "netstat -an | grep -c ESTABLISHED"`;
          break;
        default:
          // Check for any outbound connections
          command = `ssh ${this.config.sshUser}@${targetSystem} "ss -tunap | grep -c ESTAB"`;
      }

      const { stdout } = await this.executeCommand(command);
      const transferCount = parseInt(stdout.trim()) || 0;

      // Estimate bytes transferred (simplified)
      const estimatedBytes = transferCount * 1024; // Rough estimate

      if (estimatedBytes < minimumBytes) {
        return {
          valid: false,
          reason: `Insufficient data exfiltrated: ${estimatedBytes} bytes, expected ${minimumBytes} bytes`,
          actualBytes: estimatedBytes
        };
      }

      return {
        valid: true,
        bytesExfiltrated: estimatedBytes
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Data exfiltration verification failed: ${error.message}`,
        actualBytes: 0
      };
    }
  }

  /**
   * Verify firewall rules
   */
  async verifyFirewallRules(targetSystem, expectedRules) {
    try {
      const command = `ssh ${this.config.sshUser}@${targetSystem} "iptables -L -n"`;
      const { stdout } = await this.executeCommand(command);

      const actualRules = this.parseIptablesOutput(stdout);
      const missingRules = [];
      let rulesVerified = 0;

      for (const expectedRule of expectedRules) {
        const ruleExists = actualRules.some(rule => 
          this.matchFirewallRule(rule, expectedRule)
        );

        if (ruleExists) {
          rulesVerified++;
        } else {
          missingRules.push(expectedRule);
        }
      }

      if (missingRules.length > 0) {
        return {
          valid: false,
          reason: `Missing firewall rules: ${missingRules.length}`,
          actualRules,
          missingRules
        };
      }

      return {
        valid: true,
        rulesVerified
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Firewall rules verification failed: ${error.message}`,
        actualRules: []
      };
    }
  }

  /**
   * Verify system restore
   */
  async verifySystemRestore(targetSystem, baselineSnapshotId) {
    try {
      // Check if system matches baseline snapshot
      const command = `ssh ${this.config.sshUser}@${targetSystem} "cat /etc/nexus/snapshot_id"`;
      const { stdout } = await this.executeCommand(command);

      const currentSnapshotId = stdout.trim();

      if (currentSnapshotId !== baselineSnapshotId) {
        return {
          valid: false,
          reason: `System not restored to baseline. Current: ${currentSnapshotId}, Expected: ${baselineSnapshotId}`,
          currentState: { snapshotId: currentSnapshotId }
        };
      }

      // Verify no persistence mechanisms remain
      const persistenceCommand = `ssh ${this.config.sshUser}@${targetSystem} "crontab -l | wc -l"`;
      const { stdout: cronCount } = await this.executeCommand(persistenceCommand);

      if (parseInt(cronCount.trim()) > 0) {
        return {
          valid: false,
          reason: 'Persistence mechanisms still present after restore',
          currentState: { cronJobs: parseInt(cronCount.trim()) }
        };
      }

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        reason: `System restore verification failed: ${error.message}`,
        currentState: {}
      };
    }
  }

  /**
   * Verify persistence mechanisms
   */
  async verifyPersistence(targetSystem, persistenceType, expectedMechanism) {
    try {
      let command;
      
      switch (persistenceType) {
        case 'cron':
          command = `ssh ${this.config.sshUser}@${targetSystem} "crontab -l"`;
          break;
        case 'systemd':
          command = `ssh ${this.config.sshUser}@${targetSystem} "systemctl list-unit-files | grep ${expectedMechanism}"`;
          break;
        case 'bashrc':
          command = `ssh ${this.config.sshUser}@${targetSystem} "cat ~/.bashrc | grep ${expectedMechanism}"`;
          break;
        default:
          return {
            valid: false,
            reason: `Unknown persistence type: ${persistenceType}`
          };
      }

      const { stdout } = await this.executeCommand(command);

      if (!stdout.includes(expectedMechanism)) {
        return {
          valid: false,
          reason: `Persistence mechanism not found: ${expectedMechanism}`,
          foundMechanisms: []
        };
      }

      return {
        valid: true,
        mechanism: { type: persistenceType, details: expectedMechanism }
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Persistence verification failed: ${error.message}`,
        foundMechanisms: []
      };
    }
  }

  /**
   * Verify credential extraction
   */
  async verifyCredentialExtraction(targetSystem, minimumCredentials, credentialTypes) {
    try {
      // Check for credential dump files or evidence
      const command = `ssh ${this.config.sshUser}@${targetSystem} "find /tmp -name '*creds*' -o -name '*passwords*' | wc -l"`;
      const { stdout } = await this.executeCommand(command);

      const credentialFiles = parseInt(stdout.trim()) || 0;

      if (credentialFiles < minimumCredentials) {
        return {
          valid: false,
          reason: `Insufficient credentials extracted: ${credentialFiles}, expected ${minimumCredentials}`,
          extractedCount: credentialFiles
        };
      }

      return {
        valid: true,
        credentialsExtracted: credentialFiles
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Credential extraction verification failed: ${error.message}`,
        extractedCount: 0
      };
    }
  }

  /**
   * Check critical services
   */
  async checkCriticalServices(targetSystem) {
    try {
      const command = `ssh ${this.config.sshUser}@${targetSystem} "systemctl is-system-running"`;
      const { stdout } = await this.executeCommand(command);
      
      const systemState = stdout.trim();
      return systemState === 'running' || systemState === 'degraded';
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute command with timeout
   */
  async executeCommand(command) {
    try {
      return await execAsync(command, {
        timeout: this.config.commandTimeout,
        maxBuffer: 1024 * 1024 // 1MB
      });
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  /**
   * Parse nmap output
   */
  parseNmapOutput(output) {
    const ports = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(\d+)\/open/g);
      if (match) {
        match.forEach(m => {
          const port = parseInt(m.split('/')[0]);
          ports.push(port);
        });
      }
    }
    
    return ports;
  }

  /**
   * Parse systemctl output
   */
  parseSystemctlOutput(output) {
    const services = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('.service') && line.includes('running')) {
        const serviceName = line.trim().split(/\s+/)[0];
        services.push(serviceName);
      }
    }
    
    return services;
  }

  /**
   * Parse iptables output
   */
  parseIptablesOutput(output) {
    const rules = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('DROP') || line.includes('ACCEPT') || line.includes('REJECT')) {
        rules.push(line.trim());
      }
    }
    
    return rules;
  }

  /**
   * Match firewall rule
   */
  matchFirewallRule(actualRule, expectedRule) {
    return actualRule.includes(expectedRule.action) &&
           actualRule.includes(expectedRule.source || '') &&
           actualRule.includes(expectedRule.destination || '');
  }
}

module.exports = SystemStateVerifier;
