/**
 * VM Manager Service
 * 
 * Manages libvirt/KVM virtual machines for the NEXUS PROTOCOL cyber range.
 * Handles VM provisioning, snapshot management, and health monitoring.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class VMManager {
  constructor(config = {}) {
    this.config = {
      networkRange: config.networkRange || '192.168.100.0/24',
      baseIpStart: config.baseIpStart || 10,
      snapshotDir: config.snapshotDir || '/var/lib/libvirt/snapshots',
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      maxRestartAttempts: config.maxRestartAttempts || 3,
      ...config
    };

    this.vms = new Map(); // vmId -> VM state
    this.healthCheckTimers = new Map();
    this.ipAllocations = new Map(); // tier -> next available IP
    
    // Initialize IP allocations for each tier
    this.ipAllocations.set('tier1', this.config.baseIpStart); // 192.168.100.10+
    this.ipAllocations.set('tier2', this.config.baseIpStart + 10); // 192.168.100.20+
    this.ipAllocations.set('tier3', this.config.baseIpStart + 20); // 192.168.100.30+
  }

  /**
   * Provision a vulnerable VM for a specific tier
   * Requirements: 8.1, 8.4, 8.5, 8.6, 8.7
   */
  async provisionVM(tier, roundId) {
    const vmId = `nexus-${tier}-${roundId}-${Date.now()}`;
    const ipAddress = this._allocateIP(tier);
    
    try {
      // Clone base image for tier
      const baseImage = this._getBaseImage(tier);
      await this._cloneVM(baseImage, vmId);
      
      // Apply vulnerability configuration
      await this._configureVulnerabilities(vmId, tier);
      
      // Assign IP address
      await this._assignIPAddress(vmId, ipAddress);
      
      // Start VM
      await this._startVM(vmId);
      
      // Verify services
      const servicesRunning = await this._verifyServices(vmId, tier);
      if (!servicesRunning) {
        throw new Error(`Services failed to start on ${vmId}`);
      }
      
      // Create baseline snapshot
      await this.createSnapshot(vmId, 'baseline');
      
      // Register VM
      const vmState = {
        vmId,
        tier,
        roundId,
        ipAddress,
        status: 'running',
        services: this._getTierServices(tier),
        createdAt: new Date(),
        restartAttempts: 0
      };
      
      this.vms.set(vmId, vmState);
      
      // Start health monitoring
      this._startHealthMonitoring(vmId);
      
      return vmState;
    } catch (error) {
      console.error(`Failed to provision VM ${vmId}:`, error);
      // Cleanup on failure
      await this._cleanupVM(vmId).catch(err => 
        console.error(`Cleanup failed for ${vmId}:`, err)
      );
      throw error;
    }
  }

  /**
   * Create a snapshot of a VM
   * Requirements: 8.2
   */
  async createSnapshot(vmId, snapshotName) {
    try {
      const command = `virsh snapshot-create-as ${vmId} ${snapshotName} --disk-only --atomic`;
      await execAsync(command);
      
      console.log(`Snapshot ${snapshotName} created for ${vmId}`);
      return { vmId, snapshotName, createdAt: new Date() };
    } catch (error) {
      console.error(`Failed to create snapshot ${snapshotName} for ${vmId}:`, error);
      throw error;
    }
  }

  /**
   * Restore a VM to a snapshot
   * Requirements: 8.3
   */
  async restoreSnapshot(vmId, snapshotName = 'baseline') {
    try {
      // Stop VM gracefully
      await this._stopVM(vmId);
      
      // Restore from snapshot
      const command = `virsh snapshot-revert ${vmId} ${snapshotName}`;
      await execAsync(command);
      
      // Start VM
      await this._startVM(vmId);
      
      // Verify services
      const vm = this.vms.get(vmId);
      if (vm) {
        const servicesRunning = await this._verifyServices(vmId, vm.tier);
        if (!servicesRunning) {
          throw new Error(`Services failed to start after restore on ${vmId}`);
        }
        
        vm.status = 'running';
        vm.restartAttempts = 0;
      }
      
      console.log(`VM ${vmId} restored to snapshot ${snapshotName}`);
      return { vmId, snapshotName, restoredAt: new Date() };
    } catch (error) {
      console.error(`Failed to restore ${vmId} to snapshot ${snapshotName}:`, error);
      throw error;
    }
  }

  /**
   * Perform health check on a VM
   * Requirements: 8.8
   */
  async healthCheck(vmId) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      return { vmId, healthy: false, error: 'VM not found' };
    }

    try {
      // Ping check
      const pingResult = await this._pingVM(vm.ipAddress);
      if (!pingResult) {
        return { vmId, healthy: false, error: 'Ping failed' };
      }

      // Service port checks
      const serviceChecks = await Promise.all(
        vm.services.map(service => this._checkServicePort(vm.ipAddress, service.port))
      );

      const allServicesUp = serviceChecks.every(check => check);
      
      if (!allServicesUp) {
        const failedServices = vm.services
          .filter((_, idx) => !serviceChecks[idx])
          .map(s => s.name);
        
        return {
          vmId,
          healthy: false,
          error: `Services down: ${failedServices.join(', ')}`
        };
      }

      return { vmId, healthy: true, services: vm.services };
    } catch (error) {
      return { vmId, healthy: false, error: error.message };
    }
  }

  /**
   * Handle VM failure with automatic restart
   * Requirements: 8.9, 8.10
   */
  async handleVMFailure(vmId) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      console.error(`Cannot handle failure for unknown VM: ${vmId}`);
      return;
    }

    vm.restartAttempts++;
    
    if (vm.restartAttempts > this.config.maxRestartAttempts) {
      // Cannot recover - alert operator
      vm.status = 'unavailable';
      await this._alertOperator(vmId, 'VM cannot be recovered after multiple restart attempts');
      console.error(`VM ${vmId} marked as unavailable after ${vm.restartAttempts} restart attempts`);
      return;
    }

    try {
      console.log(`Attempting to restart VM ${vmId} (attempt ${vm.restartAttempts}/${this.config.maxRestartAttempts})`);
      
      // Try to restore to baseline
      await this.restoreSnapshot(vmId, 'baseline');
      
      vm.status = 'running';
      console.log(`VM ${vmId} successfully restarted`);
    } catch (error) {
      console.error(`Failed to restart VM ${vmId}:`, error);
      
      if (vm.restartAttempts >= this.config.maxRestartAttempts) {
        vm.status = 'unavailable';
        await this._alertOperator(vmId, `VM restart failed: ${error.message}`);
      }
    }
  }

  /**
   * Get VM state
   */
  getVMState(vmId) {
    return this.vms.get(vmId);
  }

  /**
   * List all VMs for a round
   */
  listVMsByRound(roundId) {
    return Array.from(this.vms.values()).filter(vm => vm.roundId === roundId);
  }

  /**
   * Cleanup VM and stop monitoring
   */
  async cleanupVM(vmId) {
    this._stopHealthMonitoring(vmId);
    await this._cleanupVM(vmId);
    this.vms.delete(vmId);
  }

  /**
   * Cleanup all VMs for a round
   */
  async cleanupRound(roundId) {
    const roundVMs = this.listVMsByRound(roundId);
    await Promise.all(roundVMs.map(vm => this.cleanupVM(vm.vmId)));
  }

  // Private helper methods

  _getBaseImage(tier) {
    const images = {
      tier1: 'nexus-tier1-base', // Ubuntu + Apache
      tier2: 'nexus-tier2-base', // Ubuntu + SSH/MySQL
      tier3: 'nexus-tier3-base'  // Ubuntu + Custom Services
    };
    return images[tier] || images.tier1;
  }

  _getTierServices(tier) {
    const services = {
      tier1: [
        { name: 'http', port: 80 },
        { name: 'ssh', port: 22 }
      ],
      tier2: [
        { name: 'ssh', port: 22 },
        { name: 'mysql', port: 3306 }
      ],
      tier3: [
        { name: 'ssh', port: 22 },
        { name: 'custom', port: 8080 }
      ]
    };
    return services[tier] || services.tier1;
  }

  _allocateIP(tier) {
    const nextIP = this.ipAllocations.get(tier);
    this.ipAllocations.set(tier, nextIP + 1);
    return `192.168.100.${nextIP}`;
  }

  async _cloneVM(baseImage, vmId) {
    const command = `virt-clone --original ${baseImage} --name ${vmId} --auto-clone`;
    await execAsync(command);
  }

  async _configureVulnerabilities(vmId, tier) {
    // Configuration scripts for each tier
    const configs = {
      tier1: [
        // Weak Apache configuration
        'echo "ServerTokens Full" >> /etc/apache2/apache2.conf',
        'echo "ServerSignature On" >> /etc/apache2/apache2.conf',
        // Add vulnerable PHP page
        'echo "<?php system($_GET[\'cmd\']); ?>" > /var/www/html/shell.php'
      ],
      tier2: [
        // Weak SSH configuration
        'echo "PermitRootLogin yes" >> /etc/ssh/sshd_config',
        'echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config',
        // Weak MySQL root password
        'mysql -e "SET PASSWORD FOR \'root\'@\'localhost\' = PASSWORD(\'password123\');"'
      ],
      tier3: [
        // Custom vulnerable service configuration
        'echo "admin:password" > /etc/service/credentials.txt',
        'chmod 644 /etc/service/credentials.txt'
      ]
    };

    const commands = configs[tier] || [];
    for (const cmd of commands) {
      try {
        await execAsync(`virsh domifaddr ${vmId} | grep -oP '\\d+\\.\\d+\\.\\d+\\.\\d+' | xargs -I {} ssh root@{} "${cmd}"`);
      } catch (error) {
        console.warn(`Failed to apply vulnerability config to ${vmId}: ${error.message}`);
      }
    }
  }

  async _assignIPAddress(vmId, ipAddress) {
    // Use virsh to set static IP via DHCP reservation
    const command = `virsh net-update default add ip-dhcp-host "<host mac='$(virsh domiflist ${vmId} | grep -oP '([0-9a-f]{2}:){5}[0-9a-f]{2}')' ip='${ipAddress}'/>" --live --config`;
    try {
      await execAsync(command);
    } catch (error) {
      console.warn(`Failed to assign static IP to ${vmId}: ${error.message}`);
    }
  }

  async _startVM(vmId) {
    await execAsync(`virsh start ${vmId}`);
    // Wait for VM to boot
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  async _stopVM(vmId) {
    try {
      await execAsync(`virsh shutdown ${vmId}`);
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      // Force stop if graceful shutdown fails
      await execAsync(`virsh destroy ${vmId}`);
    }
  }

  async _verifyServices(vmId, tier) {
    const vm = this.vms.get(vmId) || { services: this._getTierServices(tier) };
    const ipAddress = await this._getVMIP(vmId);
    
    if (!ipAddress) return false;

    const checks = await Promise.all(
      vm.services.map(service => this._checkServicePort(ipAddress, service.port))
    );

    return checks.every(check => check);
  }

  async _getVMIP(vmId) {
    try {
      const { stdout } = await execAsync(`virsh domifaddr ${vmId}`);
      const match = stdout.match(/(\d+\.\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  async _pingVM(ipAddress) {
    try {
      await execAsync(`ping -c 1 -W 2 ${ipAddress}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async _checkServicePort(ipAddress, port) {
    try {
      await execAsync(`nc -z -w 2 ${ipAddress} ${port}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  _startHealthMonitoring(vmId) {
    const timer = setInterval(async () => {
      const health = await this.healthCheck(vmId);
      
      if (!health.healthy) {
        console.warn(`Health check failed for ${vmId}: ${health.error}`);
        await this.handleVMFailure(vmId);
      }
    }, this.config.healthCheckInterval);

    this.healthCheckTimers.set(vmId, timer);
  }

  _stopHealthMonitoring(vmId) {
    const timer = this.healthCheckTimers.get(vmId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(vmId);
    }
  }

  async _cleanupVM(vmId) {
    try {
      await this._stopVM(vmId);
      await execAsync(`virsh undefine ${vmId} --remove-all-storage`);
    } catch (error) {
      console.error(`Failed to cleanup VM ${vmId}:`, error);
    }
  }

  async _alertOperator(vmId, message) {
    // In production, this would send alerts via email, Slack, PagerDuty, etc.
    console.error(`[OPERATOR ALERT] VM ${vmId}: ${message}`);
    
    // Could integrate with external alerting systems
    // await sendSlackAlert({ vmId, message });
    // await sendEmail({ to: 'ops@nexus.com', subject: `VM Alert: ${vmId}`, body: message });
  }
}

module.exports = VMManager;
