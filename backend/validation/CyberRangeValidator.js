/**
 * NEXUS PROTOCOL - Cyber Range Validator
 * Validates task completion against real system state
 * Version: 1.0.0
 * Date: February 19, 2026
 */

const SystemStateVerifier = require('./SystemStateVerifier');
const NetworkTopologyChecker = require('./NetworkTopologyChecker');

class CyberRangeValidator {
  constructor(config = {}) {
    this.config = {
      cyberRangeNetwork: config.cyberRangeNetwork || '192.168.100.0/24',
      validationTimeout: config.validationTimeout || 30000, // 30 seconds
      strictMode: config.strictMode !== undefined ? config.strictMode : true,
      ...config
    };

    this.systemStateVerifier = new SystemStateVerifier(this.config);
    this.networkTopologyChecker = new NetworkTopologyChecker(this.config);
    
    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0
    };
  }

  /**
   * Validate task completion against system state
   */
  async validateTaskCompletion(taskData, systemState) {
    const startTime = Date.now();
    this.validationStats.totalValidations++;

    try {
      console.log(`🔍 Validating task: ${taskData.taskType}`);

      // Check VM health first
      const healthCheck = await this.checkVMHealth(taskData.targetSystem);
      if (!healthCheck.healthy) {
        return this.createValidationResult(false, 
          `VM health check failed: ${healthCheck.reason}`,
          { healthCheck }
        );
      }

      // Route to appropriate validation method based on task type
      let result;
      switch (taskData.taskType) {
        case 'network_scan':
        case 'port_scan':
          result = await this.validateNetworkScan(taskData, systemState);
          break;

        case 'service_enumeration':
          result = await this.validateServiceState(taskData, systemState);
          break;

        case 'file_modification':
        case 'file_creation':
        case 'file_deletion':
          result = await this.validateFileModification(taskData, systemState);
          break;

        case 'privilege_escalation':
          result = await this.validatePrivilegeEscalation(taskData, systemState);
          break;

        case 'data_exfiltration':
          result = await this.validateDataExfiltration(taskData, systemState);
          break;

        case 'firewall_configuration':
        case 'ip_blocking':
          result = await this.validateFirewallRules(taskData, systemState);
          break;

        case 'system_restore':
          result = await this.validateSystemRestore(taskData, systemState);
          break;

        case 'persistence_establishment':
          result = await this.validatePersistence(taskData, systemState);
          break;

        case 'credential_extraction':
          result = await this.validateCredentialExtraction(taskData, systemState);
          break;

        default:
          result = this.createValidationResult(false, 
            `Unknown task type: ${taskData.taskType}`,
            { taskType: taskData.taskType }
          );
      }

      // Update statistics
      const validationTime = Date.now() - startTime;
      this.updateStatistics(result.valid, validationTime);

      result.validationTime = validationTime;
      return result;

    } catch (error) {
      console.error('❌ Validation error:', error.message);
      this.validationStats.failedValidations++;
      
      return this.createValidationResult(false,
        `Validation error: ${error.message}`,
        { error: error.message, stack: error.stack }
      );
    }
  }

  /**
   * Validate network scan results
   */
  async validateNetworkScan(taskData, systemState) {
    const { targetSystem, expectedPorts, expectedServices } = taskData.validationCriteria || {};

    // Verify network topology
    const topologyValid = await this.networkTopologyChecker.verifySystemExists(targetSystem);
    if (!topologyValid) {
      return this.createValidationResult(false,
        `Target system ${targetSystem} not found in cyber range`,
        { targetSystem }
      );
    }

    // Verify discovered ports match expected
    if (expectedPorts) {
      const portsValid = await this.systemStateVerifier.verifyOpenPorts(
        targetSystem, 
        expectedPorts
      );
      
      if (!portsValid.valid) {
        return this.createValidationResult(false,
          `Port scan validation failed: ${portsValid.reason}`,
          { expectedPorts, foundPorts: portsValid.foundPorts }
        );
      }
    }

    // Verify discovered services
    if (expectedServices) {
      const servicesValid = await this.systemStateVerifier.verifyServices(
        targetSystem,
        expectedServices
      );

      if (!servicesValid.valid) {
        return this.createValidationResult(false,
          `Service enumeration validation failed: ${servicesValid.reason}`,
          { expectedServices, foundServices: servicesValid.foundServices }
        );
      }
    }

    return this.createValidationResult(true,
      'Network scan validated successfully',
      { targetSystem, portsVerified: expectedPorts?.length || 0 }
    );
  }

  /**
   * Validate service state
   */
  async validateServiceState(taskData, systemState) {
    const { targetSystem, expectedState } = taskData.validationCriteria || {};

    const serviceCheck = await this.systemStateVerifier.verifyServiceState(
      targetSystem,
      expectedState
    );

    if (!serviceCheck.valid) {
      return this.createValidationResult(false,
        `Service state validation failed: ${serviceCheck.reason}`,
        { expectedState, actualState: serviceCheck.actualState }
      );
    }

    return this.createValidationResult(true,
      'Service state validated successfully',
      { targetSystem, services: serviceCheck.services }
    );
  }

  /**
   * Validate file modifications
   */
  async validateFileModification(taskData, systemState) {
    const { targetSystem, filePath, operation, expectedContent } = taskData.validationCriteria || {};

    const fileCheck = await this.systemStateVerifier.verifyFileModification(
      targetSystem,
      filePath,
      operation,
      expectedContent
    );

    if (!fileCheck.valid) {
      return this.createValidationResult(false,
        `File modification validation failed: ${fileCheck.reason}`,
        { filePath, operation, details: fileCheck.details }
      );
    }

    return this.createValidationResult(true,
      'File modification validated successfully',
      { filePath, operation }
    );
  }

  /**
   * Validate privilege escalation
   */
  async validatePrivilegeEscalation(taskData, systemState) {
    const { targetSystem, expectedPrivileges, username } = taskData.validationCriteria || {};

    const privilegeCheck = await this.systemStateVerifier.verifyPrivilegeEscalation(
      targetSystem,
      username,
      expectedPrivileges
    );

    if (!privilegeCheck.valid) {
      return this.createValidationResult(false,
        `Privilege escalation validation failed: ${privilegeCheck.reason}`,
        { 
          username, 
          expectedPrivileges, 
          actualPrivileges: privilegeCheck.actualPrivileges 
        }
      );
    }

    return this.createValidationResult(true,
      'Privilege escalation validated successfully',
      { username, privileges: privilegeCheck.privileges }
    );
  }

  /**
   * Validate data exfiltration
   */
  async validateDataExfiltration(taskData, systemState) {
    const { targetSystem, dataIdentifier, minimumBytes, exfiltrationMethod } = taskData.validationCriteria || {};

    const exfiltrationCheck = await this.systemStateVerifier.verifyDataExfiltration(
      targetSystem,
      dataIdentifier,
      minimumBytes,
      exfiltrationMethod
    );

    if (!exfiltrationCheck.valid) {
      return this.createValidationResult(false,
        `Data exfiltration validation failed: ${exfiltrationCheck.reason}`,
        { 
          dataIdentifier, 
          minimumBytes, 
          actualBytes: exfiltrationCheck.actualBytes 
        }
      );
    }

    return this.createValidationResult(true,
      'Data exfiltration validated successfully',
      { 
        dataIdentifier, 
        bytesExfiltrated: exfiltrationCheck.bytesExfiltrated,
        method: exfiltrationMethod
      }
    );
  }

  /**
   * Validate firewall rules
   */
  async validateFirewallRules(taskData, systemState) {
    const { targetSystem, expectedRules } = taskData.validationCriteria || {};

    const firewallCheck = await this.systemStateVerifier.verifyFirewallRules(
      targetSystem,
      expectedRules
    );

    if (!firewallCheck.valid) {
      return this.createValidationResult(false,
        `Firewall rules validation failed: ${firewallCheck.reason}`,
        { 
          expectedRules, 
          actualRules: firewallCheck.actualRules,
          missingRules: firewallCheck.missingRules
        }
      );
    }

    return this.createValidationResult(true,
      'Firewall rules validated successfully',
      { rulesVerified: firewallCheck.rulesVerified }
    );
  }

  /**
   * Validate system restore
   */
  async validateSystemRestore(taskData, systemState) {
    const { targetSystem, baselineSnapshotId } = taskData.validationCriteria || {};

    const restoreCheck = await this.systemStateVerifier.verifySystemRestore(
      targetSystem,
      baselineSnapshotId
    );

    if (!restoreCheck.valid) {
      return this.createValidationResult(false,
        `System restore validation failed: ${restoreCheck.reason}`,
        { 
          targetSystem, 
          baselineSnapshotId,
          currentState: restoreCheck.currentState
        }
      );
    }

    return this.createValidationResult(true,
      'System restore validated successfully',
      { targetSystem, snapshotId: baselineSnapshotId }
    );
  }

  /**
   * Validate persistence mechanisms
   */
  async validatePersistence(taskData, systemState) {
    const { targetSystem, persistenceType, expectedMechanism } = taskData.validationCriteria || {};

    const persistenceCheck = await this.systemStateVerifier.verifyPersistence(
      targetSystem,
      persistenceType,
      expectedMechanism
    );

    if (!persistenceCheck.valid) {
      return this.createValidationResult(false,
        `Persistence validation failed: ${persistenceCheck.reason}`,
        { 
          persistenceType, 
          expectedMechanism,
          foundMechanisms: persistenceCheck.foundMechanisms
        }
      );
    }

    return this.createValidationResult(true,
      'Persistence mechanism validated successfully',
      { persistenceType, mechanism: persistenceCheck.mechanism }
    );
  }

  /**
   * Validate credential extraction
   */
  async validateCredentialExtraction(taskData, systemState) {
    const { targetSystem, minimumCredentials, credentialTypes } = taskData.validationCriteria || {};

    const credentialCheck = await this.systemStateVerifier.verifyCredentialExtraction(
      targetSystem,
      minimumCredentials,
      credentialTypes
    );

    if (!credentialCheck.valid) {
      return this.createValidationResult(false,
        `Credential extraction validation failed: ${credentialCheck.reason}`,
        { 
          minimumCredentials, 
          extractedCount: credentialCheck.extractedCount 
        }
      );
    }

    return this.createValidationResult(true,
      'Credential extraction validated successfully',
      { credentialsExtracted: credentialCheck.credentialsExtracted }
    );
  }

  /**
   * Check VM health
   */
  async checkVMHealth(targetSystem) {
    try {
      // Check if system is reachable
      const reachable = await this.networkTopologyChecker.pingSystem(targetSystem);
      if (!reachable) {
        return { healthy: false, reason: 'System not reachable' };
      }

      // Check if critical services are running
      const servicesHealthy = await this.systemStateVerifier.checkCriticalServices(targetSystem);
      if (!servicesHealthy) {
        return { healthy: false, reason: 'Critical services not running' };
      }

      return { healthy: true };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }

  /**
   * Create standardized validation result
   */
  createValidationResult(valid, message, details = {}) {
    return {
      valid,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update validation statistics
   */
  updateStatistics(valid, validationTime) {
    if (valid) {
      this.validationStats.successfulValidations++;
    } else {
      this.validationStats.failedValidations++;
    }

    // Update average validation time
    const totalTime = this.validationStats.averageValidationTime * (this.validationStats.totalValidations - 1);
    this.validationStats.averageValidationTime = (totalTime + validationTime) / this.validationStats.totalValidations;
  }

  /**
   * Get validation statistics
   */
  getStatistics() {
    return {
      ...this.validationStats,
      successRate: this.validationStats.totalValidations > 0
        ? (this.validationStats.successfulValidations / this.validationStats.totalValidations * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0
    };
  }
}

module.exports = CyberRangeValidator;
