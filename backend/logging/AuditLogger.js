/**
 * Audit Logger
 * 
 * Logs security events, authentication attempts, and state-changing operations.
 * Redacts sensitive data from logs.
 * 
 * Requirements: 9.9, 9.12
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, '../logs');
    this.logFile = options.logFile || 'audit.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 10;
    this.console = options.console !== false;
    
    // Sensitive fields to redact
    this.sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'credential',
      'authorization',
      'cookie',
      'session'
    ];
    
    // Ensure log directory exists
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log authentication attempt
   * Requirements: 9.9
   */
  logAuthAttempt(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'AUTH_ATTEMPT',
      success: data.success,
      userId: data.userId,
      username: data.username,
      ip: data.ip,
      userAgent: data.userAgent,
      method: data.method || 'password',
      reason: data.reason
    };
    
    this.write(logEntry);
  }

  /**
   * Log state-changing operation
   * Requirements: 9.9
   */
  logStateChange(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'STATE_CHANGE',
      operation: data.operation,
      entity: data.entity,
      entityId: data.entityId,
      userId: data.userId,
      changes: this.redactSensitiveData(data.changes),
      ip: data.ip
    };
    
    this.write(logEntry);
  }

  /**
   * Log security event
   * Requirements: 9.9
   */
  logSecurityEvent(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SECURITY_EVENT',
      severity: data.severity || 'INFO',
      event: data.event,
      description: data.description,
      userId: data.userId,
      ip: data.ip,
      details: this.redactSensitiveData(data.details)
    };
    
    this.write(logEntry);
  }

  /**
   * Log API request
   */
  logAPIRequest(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'API_REQUEST',
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      userId: data.userId,
      ip: data.ip,
      duration: data.duration,
      userAgent: data.userAgent
    };
    
    this.write(logEntry);
  }

  /**
   * Log WebSocket event
   */
  logWebSocketEvent(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'WEBSOCKET_EVENT',
      event: data.event,
      socketId: data.socketId,
      userId: data.userId,
      roomId: data.roomId,
      messageType: data.messageType
    };
    
    this.write(logEntry);
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'DATABASE_OPERATION',
      operation: data.operation,
      table: data.table,
      userId: data.userId,
      duration: data.duration,
      rowsAffected: data.rowsAffected
    };
    
    this.write(logEntry);
  }

  /**
   * Log error
   */
  logError(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      severity: data.severity || 'ERROR',
      message: data.message,
      stack: data.stack,
      userId: data.userId,
      ip: data.ip,
      context: this.redactSensitiveData(data.context)
    };
    
    this.write(logEntry);
  }

  /**
   * Redact sensitive data
   * Requirements: 9.12
   */
  redactSensitiveData(data) {
    if (!data) {
      return data;
    }
    
    if (typeof data === 'string') {
      return this.redactString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }
    
    if (typeof data === 'object') {
      const redacted = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redactSensitiveData(value);
        }
      }
      return redacted;
    }
    
    return data;
  }

  /**
   * Check if field is sensitive
   */
  isSensitiveField(field) {
    const lowerField = field.toLowerCase();
    return this.sensitiveFields.some(sf => lowerField.includes(sf));
  }

  /**
   * Redact sensitive patterns in strings
   */
  redactString(str) {
    // Redact JWT tokens
    str = str.replace(/eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[REDACTED_TOKEN]');
    
    // Redact API keys
    str = str.replace(/[a-zA-Z0-9]{32,}/g, (match) => {
      return match.length > 32 ? '[REDACTED_KEY]' : match;
    });
    
    return str;
  }

  /**
   * Write log entry
   */
  write(logEntry) {
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Console output
    if (this.console) {
      const color = this.getLogColor(logEntry.type, logEntry.severity);
      console.log(`${color}[AUDIT] ${logEntry.type}: ${logEntry.timestamp}\x1b[0m`);
    }
    
    // File output
    try {
      const logPath = path.join(this.logDir, this.logFile);
      
      // Check file size and rotate if needed
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size >= this.maxFileSize) {
          this.rotateLog();
        }
      }
      
      fs.appendFileSync(logPath, logLine);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Rotate log file
   */
  rotateLog() {
    const logPath = path.join(this.logDir, this.logFile);
    
    // Rotate existing files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldPath = path.join(this.logDir, `${this.logFile}.${i}`);
      const newPath = path.join(this.logDir, `${this.logFile}.${i + 1}`);
      
      if (fs.existsSync(oldPath)) {
        if (i === this.maxFiles - 1) {
          fs.unlinkSync(oldPath); // Delete oldest
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }
    
    // Rotate current log
    if (fs.existsSync(logPath)) {
      fs.renameSync(logPath, path.join(this.logDir, `${this.logFile}.1`));
    }
  }

  /**
   * Get log color for console output
   */
  getLogColor(type, severity) {
    if (severity === 'CRITICAL' || type === 'ERROR') {
      return '\x1b[31m'; // Red
    }
    if (severity === 'WARNING' || type === 'SECURITY_EVENT') {
      return '\x1b[33m'; // Yellow
    }
    if (type === 'AUTH_ATTEMPT') {
      return '\x1b[36m'; // Cyan
    }
    return '\x1b[37m'; // White
  }

  /**
   * Query logs
   */
  queryLogs(options = {}) {
    const {
      type = null,
      startDate = null,
      endDate = null,
      userId = null,
      limit = 100
    } = options;
    
    const logPath = path.join(this.logDir, this.logFile);
    
    if (!fs.existsSync(logPath)) {
      return [];
    }
    
    const logs = [];
    const lines = fs.readFileSync(logPath, 'utf8').split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const entry = JSON.parse(line);
        
        // Apply filters
        if (type && entry.type !== type) continue;
        if (userId && entry.userId !== userId) continue;
        if (startDate && new Date(entry.timestamp) < new Date(startDate)) continue;
        if (endDate && new Date(entry.timestamp) > new Date(endDate)) continue;
        
        logs.push(entry);
        
        if (logs.length >= limit) break;
      } catch (error) {
        // Skip invalid lines
      }
    }
    
    return logs.reverse(); // Most recent first
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const logPath = path.join(this.logDir, this.logFile);
    
    if (!fs.existsSync(logPath)) {
      return { totalEntries: 0, byType: {}, bySeverity: {} };
    }
    
    const stats = {
      totalEntries: 0,
      byType: {},
      bySeverity: {}
    };
    
    const lines = fs.readFileSync(logPath, 'utf8').split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const entry = JSON.parse(line);
        stats.totalEntries++;
        
        stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
        
        if (entry.severity) {
          stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;
        }
      } catch (error) {
        // Skip invalid lines
      }
    }
    
    return stats;
  }
}

module.exports = AuditLogger;
