/**
 * VM Controller
 * Manages VirtualBox VMs via VBoxManage
 * Handles snapshots, resets, power operations
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class VMController {
  constructor() {
    this.vboxManagePath = process.env.VBOXMANAGE_PATH || 'VBoxManage';
    this.vmConfigs = new Map(); // vmId -> config
  }

  /**
   * Register a VM for management
   */
  registerVM(vmId, config) {
    this.vmConfigs.set(vmId, {
      vmId,
      name: config.name,
      snapshotName: config.snapshotName || 'clean',
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password
    });
    
    console.log(`VM registered: ${vmId} (${config.name})`);
  }

  /**
   * Get VM info
   */
  async getVMInfo(vmName) {
    try {
      const { stdout } = await execPromise(`${this.vboxManagePath} showvminfo "${vmName}" --machinereadable`);
      
      const info = {};
      stdout.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          info[key.trim()] = value.replace(/"/g, '').trim();
        }
      });
      
      return info;
    } catch (error) {
      console.error(`Failed to get VM info for ${vmName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get VM state
   */
  async getVMState(vmName) {
    try {
      const info = await this.getVMInfo(vmName);
      return info.VMState || 'unknown';
    } catch (error) {
      return 'error';
    }
  }

  /**
   * List all VMs
   */
  async listVMs() {
    try {
      const { stdout } = await execPromise(`${this.vboxManagePath} list vms`);
      
      const vms = [];
      stdout.split('\n').forEach(line => {
        const match = line.match(/"(.+)"\s+\{(.+)\}/);
        if (match) {
          vms.push({
            name: match[1],
            uuid: match[2]
          });
        }
      });
      
      return vms;
    } catch (error) {
      console.error('Failed to list VMs:', error.message);
      return [];
    }
  }

  /**
   * List snapshots for a VM
   */
  async listSnapshots(vmName) {
    try {
      const { stdout } = await execPromise(`${this.vboxManagePath} snapshot "${vmName}" list --machinereadable`);
      
      const snapshots = [];
      let currentSnapshot = {};
      
      stdout.split('\n').forEach(line => {
        if (line.startsWith('SnapshotName')) {
          const name = line.split('=')[1].replace(/"/g, '').trim();
          currentSnapshot.name = name;
        } else if (line.startsWith('SnapshotUUID')) {
          const uuid = line.split('=')[1].replace(/"/g, '').trim();
          currentSnapshot.uuid = uuid;
          snapshots.push({ ...currentSnapshot });
          currentSnapshot = {};
        }
      });
      
      return snapshots;
    } catch (error) {
      console.error(`Failed to list snapshots for ${vmName}:`, error.message);
      return [];
    }
  }

  /**
   * Restore VM to snapshot
   */
  async restoreSnapshot(vmName, snapshotName) {
    try {
      console.log(`Restoring VM ${vmName} to snapshot ${snapshotName}...`);
      
      // Power off VM if running
      const state = await this.getVMState(vmName);
      if (state === 'running') {
        await this.powerOffVM(vmName);
        // Wait for VM to power off
        await this.sleep(3000);
      }
      
      // Restore snapshot
      const { stdout, stderr } = await execPromise(
        `${this.vboxManagePath} snapshot "${vmName}" restore "${snapshotName}"`
      );
      
      console.log(`VM ${vmName} restored to snapshot ${snapshotName}`);
      
      // Start VM
      await this.startVM(vmName);
      
      return {
        success: true,
        message: `VM restored to snapshot: ${snapshotName}`,
        stdout,
        stderr
      };
    } catch (error) {
      console.error(`Failed to restore snapshot for ${vmName}:`, error.message);
      throw error;
    }
  }

  /**
   * Start VM
   */
  async startVM(vmName, headless = true) {
    try {
      const type = headless ? 'headless' : 'gui';
      const { stdout } = await execPromise(`${this.vboxManagePath} startvm "${vmName}" --type ${type}`);
      
      console.log(`VM ${vmName} started (${type})`);
      
      return {
        success: true,
        message: `VM started: ${vmName}`,
        stdout
      };
    } catch (error) {
      console.error(`Failed to start VM ${vmName}:`, error.message);
      throw error;
    }
  }

  /**
   * Power off VM
   */
  async powerOffVM(vmName) {
    try {
      const { stdout } = await execPromise(`${this.vboxManagePath} controlvm "${vmName}" poweroff`);
      
      console.log(`VM ${vmName} powered off`);
      
      return {
        success: true,
        message: `VM powered off: ${vmName}`,
        stdout
      };
    } catch (error) {
      console.error(`Failed to power off VM ${vmName}:`, error.message);
      throw error;
    }
  }

  /**
   * Reset VM (power cycle)
   */
  async resetVM(vmName) {
    try {
      const { stdout } = await execPromise(`${this.vboxManagePath} controlvm "${vmName}" reset`);
      
      console.log(`VM ${vmName} reset`);
      
      return {
        success: true,
        message: `VM reset: ${vmName}`,
        stdout
      };
    } catch (error) {
      console.error(`Failed to reset VM ${vmName}:`, error.message);
      throw error;
    }
  }

  /**
   * Take snapshot
   */
  async takeSnapshot(vmName, snapshotName, description = '') {
    try {
      const { stdout } = await execPromise(
        `${this.vboxManagePath} snapshot "${vmName}" take "${snapshotName}" --description "${description}"`
      );
      
      console.log(`Snapshot created: ${snapshotName} for VM ${vmName}`);
      
      return {
        success: true,
        message: `Snapshot created: ${snapshotName}`,
        stdout
      };
    } catch (error) {
      console.error(`Failed to take snapshot for ${vmName}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(vmName, snapshotName) {
    try {
      const { stdout } = await execPromise(
        `${this.vboxManagePath} snapshot "${vmName}" delete "${snapshotName}"`
      );
      
      console.log(`Snapshot deleted: ${snapshotName} from VM ${vmName}`);
      
      return {
        success: true,
        message: `Snapshot deleted: ${snapshotName}`,
        stdout
      };
    } catch (error) {
      console.error(`Failed to delete snapshot for ${vmName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get VM config
   */
  getVMConfig(vmId) {
    return this.vmConfigs.get(vmId);
  }

  /**
   * Get all registered VMs
   */
  getRegisteredVMs() {
    return Array.from(this.vmConfigs.values());
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = VMController;
