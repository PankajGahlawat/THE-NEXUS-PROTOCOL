/**
 * NEXUS PROTOCOL - Network Topology Checker
 * Verifies network topology and system reachability
 * Version: 1.0.0
 * Date: February 19, 2026
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class NetworkTopologyChecker {
  constructor(config = {}) {
    this.config = {
      cyberRangeNetwork: config.cyberRangeNetwork || '192.168.100.0/24',
      pingTimeout: config.pingTimeout || 5000,
      maxRetries: config.maxRetries || 3,
      ...config
    };

    // Define expected cyber range topology
    this.expectedTopology = {
      tier1: {
        range: '192.168.100.10-19',
        systems: [
          { ip: '192.168.100.10', name: 'Web-01', services: ['HTTP', 'HTTPS'] },
          { ip: '192.168.100.11', name: 'Web-02', services: ['HTTP', 'HTTPS'] }
        ]
      },
      tier2: {
        range: '192.168.100.20-29',
        systems: [
          { ip: '192.168.100.20', name: 'SSH-01', services: ['SSH'] },
          { ip: '192.168.100.21', name: 'DB-01', services: ['MySQL', 'PostgreSQL'] }
        ]
      },
      tier3: {
        range: '192.168.100.30-39',
        systems: [
          { ip: '192.168.100.30', name: 'Core-01', services: ['Core'] }
        ]
      }
    };
  }

  /**
   * Verify system exists in cyber range
   */
  async verifySystemExists(ipAddress) {
    try {
      // Check if IP is in cyber range network
      if (!this.isInCyberRange(ipAddress)) {
        console.log(`❌ IP ${ipAddress} not in cyber range network`);
        return false;
      }

      // Check if system is reachable
      const reachable = await this.pingSystem(ipAddress);
      if (!reachable) {
        console.log(`❌ System ${ipAddress} not reachable`);
        return false;
      }

      console.log(`✅ System ${ipAddress} verified in cyber range`);
      return true;
    } catch (error) {
      console.error(`❌ System verification failed for ${ipAddress}:`, error.message);
      return false;
    }
  }

  /**
   * Ping system to check reachability
   */
  async pingSystem(ipAddress, retries = 0) {
    try {
      // Use platform-specific ping command
      const isWindows = process.platform === 'win32';
      const pingCommand = isWindows
        ? `ping -n 1 -w ${this.config.pingTimeout} ${ipAddress}`
        : `ping -c 1 -W ${Math.floor(this.config.pingTimeout / 1000)} ${ipAddress}`;

      const { stdout } = await execAsync(pingCommand, {
        timeout: this.config.pingTimeout + 1000
      });

      // Check for successful ping
      const success = isWindows
        ? stdout.includes('Reply from') || stdout.includes('TTL=')
        : stdout.includes('1 received') || stdout.includes('1 packets received');

      if (success) {
        return true;
      }

      // Retry if configured
      if (retries < this.config.maxRetries) {
        console.log(`⚠️  Ping failed for ${ipAddress}, retrying... (${retries + 1}/${this.config.maxRetries})`);
        await this.sleep(1000);
        return await this.pingSystem(ipAddress, retries + 1);
      }

      return false;
    } catch (error) {
      if (retries < this.config.maxRetries) {
        await this.sleep(1000);
        return await this.pingSystem(ipAddress, retries + 1);
      }
      return false;
    }
  }

  /**
   * Check if IP is in cyber range network
   */
  isInCyberRange(ipAddress) {
    // Parse network CIDR
    const [network, cidr] = this.config.cyberRangeNetwork.split('/');
    const networkParts = network.split('.').map(Number);
    const ipParts = ipAddress.split('.').map(Number);

    // Check if first 3 octets match (for /24 network)
    if (parseInt(cidr) === 24) {
      return networkParts[0] === ipParts[0] &&
             networkParts[1] === ipParts[1] &&
             networkParts[2] === ipParts[2];
    }

    // For other CIDR ranges, implement proper subnet matching
    return this.isInSubnet(ipAddress, this.config.cyberRangeNetwork);
  }

  /**
   * Check if IP is in subnet
   */
  isInSubnet(ipAddress, cidr) {
    const [network, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);

    const ipInt = this.ipToInt(ipAddress);
    const networkInt = this.ipToInt(network);

    return (ipInt & mask) === (networkInt & mask);
  }

  /**
   * Convert IP address to integer
   */
  ipToInt(ip) {
    return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Get system tier from IP address
   */
  getSystemTier(ipAddress) {
    const lastOctet = parseInt(ipAddress.split('.')[3]);

    if (lastOctet >= 10 && lastOctet <= 19) return 'tier1';
    if (lastOctet >= 20 && lastOctet <= 29) return 'tier2';
    if (lastOctet >= 30 && lastOctet <= 39) return 'tier3';

    return 'unknown';
  }

  /**
   * Get expected services for system
   */
  getExpectedServices(ipAddress) {
    const tier = this.getSystemTier(ipAddress);
    
    if (tier === 'unknown') {
      return [];
    }

    const system = this.expectedTopology[tier].systems.find(s => s.ip === ipAddress);
    return system ? system.services : [];
  }

  /**
   * Verify network topology
   */
  async verifyTopology() {
    console.log('🔍 Verifying cyber range network topology...\n');

    const results = {
      tier1: { expected: 0, reachable: 0, systems: [] },
      tier2: { expected: 0, reachable: 0, systems: [] },
      tier3: { expected: 0, reachable: 0, systems: [] }
    };

    // Check each tier
    for (const [tier, config] of Object.entries(this.expectedTopology)) {
      results[tier].expected = config.systems.length;

      for (const system of config.systems) {
        const reachable = await this.pingSystem(system.ip);
        
        if (reachable) {
          results[tier].reachable++;
          results[tier].systems.push({
            ...system,
            status: 'reachable'
          });
          console.log(`✅ ${tier.toUpperCase()} - ${system.name} (${system.ip}): Reachable`);
        } else {
          results[tier].systems.push({
            ...system,
            status: 'unreachable'
          });
          console.log(`❌ ${tier.toUpperCase()} - ${system.name} (${system.ip}): Unreachable`);
        }
      }
    }

    console.log('\n📊 Topology Verification Summary:');
    console.log(`   Tier I:   ${results.tier1.reachable}/${results.tier1.expected} systems reachable`);
    console.log(`   Tier II:  ${results.tier2.reachable}/${results.tier2.expected} systems reachable`);
    console.log(`   Tier III: ${results.tier3.reachable}/${results.tier3.expected} systems reachable`);

    const totalExpected = results.tier1.expected + results.tier2.expected + results.tier3.expected;
    const totalReachable = results.tier1.reachable + results.tier2.reachable + results.tier3.reachable;
    
    console.log(`   Total:    ${totalReachable}/${totalExpected} systems reachable\n`);

    return {
      success: totalReachable === totalExpected,
      results
    };
  }

  /**
   * Scan network range
   */
  async scanNetworkRange(startIp, endIp) {
    const results = [];
    const start = this.ipToInt(startIp);
    const end = this.ipToInt(endIp);

    console.log(`🔍 Scanning network range: ${startIp} - ${endIp}`);

    for (let ipInt = start; ipInt <= end; ipInt++) {
      const ip = this.intToIp(ipInt);
      const reachable = await this.pingSystem(ip);

      if (reachable) {
        results.push({
          ip,
          reachable: true,
          tier: this.getSystemTier(ip)
        });
        console.log(`   ✅ ${ip} - Reachable`);
      }
    }

    console.log(`\n   Found ${results.length} reachable systems\n`);
    return results;
  }

  /**
   * Convert integer to IP address
   */
  intToIp(int) {
    return [
      (int >>> 24) & 0xFF,
      (int >>> 16) & 0xFF,
      (int >>> 8) & 0xFF,
      int & 0xFF
    ].join('.');
  }

  /**
   * Check port connectivity
   */
  async checkPort(ipAddress, port) {
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows
        ? `powershell -Command "Test-NetConnection -ComputerName ${ipAddress} -Port ${port} -InformationLevel Quiet"`
        : `nc -zv -w 2 ${ipAddress} ${port}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 5000
      });

      // Check for successful connection
      if (isWindows) {
        return stdout.trim() === 'True';
      } else {
        return stderr.includes('succeeded') || stdout.includes('succeeded');
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify service ports
   */
  async verifyServicePorts(ipAddress, expectedPorts) {
    const results = [];

    for (const port of expectedPorts) {
      const open = await this.checkPort(ipAddress, port);
      results.push({
        port,
        open,
        status: open ? 'open' : 'closed'
      });
    }

    return results;
  }

  /**
   * Get network statistics
   */
  async getNetworkStats() {
    const stats = {
      totalSystems: 0,
      reachableSystems: 0,
      unreachableSystems: 0,
      byTier: {
        tier1: { total: 0, reachable: 0 },
        tier2: { total: 0, reachable: 0 },
        tier3: { total: 0, reachable: 0 }
      }
    };

    for (const [tier, config] of Object.entries(this.expectedTopology)) {
      stats.totalSystems += config.systems.length;
      stats.byTier[tier].total = config.systems.length;

      for (const system of config.systems) {
        const reachable = await this.pingSystem(system.ip);
        if (reachable) {
          stats.reachableSystems++;
          stats.byTier[tier].reachable++;
        } else {
          stats.unreachableSystems++;
        }
      }
    }

    return stats;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NetworkTopologyChecker;
