/**
 * Error Handler Middleware
 * 
 * Provides centralized error handling with categorization, retry logic,
 * and user-friendly error messages.
 * 
 * Requirements: 15.1-15.5
 */

class ErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.logger = options.logger || console;
    this.errorLog = [];
  }

  /**
   * Database connection retry with exponential backoff
   * Requirements: 15.1
   */
  async retryDatabaseConnection(connectionFn, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.info(`Database connection attempt ${attempt}/${this.maxRetries}`);
        const result = await connectionFn();
        
        if (attempt > 1) {
          this.logger.info(`Database connection successful after ${attempt} attempts`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoff(attempt);
          this.logger.warn(`Database connection failed (attempt ${attempt}), retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    this.logger.error(`Database connection failed after ${this.maxRetries} attempts:`, lastError);
    throw new Error(`Database connection failed: ${lastError.message}`);
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoff(attempt) {
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * delay; // Add 0-30% jitter
    return Math.min(delay + jitter, this.maxDelay);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * WebSocket reconnection logic
   * Requirements: 15.3
   */
  async handleWebSocketReconnection(socket, reconnectFn, context = {}) {
    let attempt = 1;
    const maxAttempts = context.maxAttempts || 5;
    
    while (attempt <= maxAttempts) {
      try {
        this.logger.info(`WebSocket reconnection attempt ${attempt}/${maxAttempts}`);
        await reconnectFn(socket);
        
        this.logger.info(`WebSocket reconnected successfully`);
        return true;
      } catch (error) {
        this.logger.warn(`WebSocket reconnection failed (attempt ${attempt}):`, error.message);
        
        if (attempt < maxAttempts) {
          const delay = this.calculateBackoff(attempt);
          await this.sleep(delay);
          attempt++;
        } else {
          this.logger.error(`WebSocket reconnection failed after ${maxAttempts} attempts`);
          return false;
        }
      }
    }
    
    return false;
  }

  /**
   * Format validation errors
   * Requirements: 15.4
   */
  formatValidationError(error, context = {}) {
    const formattedError = {
      type: 'VALIDATION_ERROR',
      message: this.getUserFriendlyMessage(error),
      field: error.field || context.field,
      value: error.value,
      constraint: error.constraint,
      timestamp: new Date().toISOString()
    };
    
    // Don't expose sensitive data
    if (this.isSensitiveField(formattedError.field)) {
      delete formattedError.value;
    }
    
    return formattedError;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error) {
    const errorMessages = {
      'ECONNREFUSED': 'Unable to connect to the database. Please try again later.',
      'ETIMEDOUT': 'The request timed out. Please check your connection and try again.',
      'ENOTFOUND': 'The requested resource was not found.',
      'VALIDATION_ERROR': 'The provided data is invalid. Please check your input.',
      'AUTHENTICATION_ERROR': 'Authentication failed. Please check your credentials.',
      'AUTHORIZATION_ERROR': 'You do not have permission to perform this action.',
      'RATE_LIMIT_ERROR': 'Too many requests. Please slow down and try again later.',
      'INTERNAL_ERROR': 'An internal error occurred. Our team has been notified.'
    };
    
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }
    
    if (error.type && errorMessages[error.type]) {
      return errorMessages[error.type];
    }
    
    // Generic fallback
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if field contains sensitive data
   */
  isSensitiveField(field) {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'credential'];
    return sensitiveFields.some(sf => field?.toLowerCase().includes(sf));
  }

  /**
   * Log unhandled exception
   * Requirements: 15.5
   */
  logUnhandledException(error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'UNHANDLED_EXCEPTION',
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        // Redact sensitive data
        user: context.user ? { id: context.user.id } : undefined
      }
    };
    
    this.errorLog.push(logEntry);
    this.logger.error('Unhandled exception:', logEntry);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(logEntry);
    }
    
    return logEntry;
  }

  /**
   * Send error to monitoring service (placeholder)
   */
  sendToMonitoring(logEntry) {
    // Placeholder for integration with monitoring services like Sentry, DataDog, etc.
    this.logger.info('Error sent to monitoring service:', logEntry.type);
  }

  /**
   * Express middleware for error handling
   */
  middleware() {
    return (err, req, res, next) => {
      // Log the error
      this.logUnhandledException(err, {
        method: req.method,
        path: req.path,
        user: req.user
      });
      
      // Determine status code
      const statusCode = err.statusCode || err.status || 500;
      
      // Format error response
      const errorResponse = {
        error: {
          type: err.type || 'INTERNAL_ERROR',
          message: this.getUserFriendlyMessage(err),
          ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err.details
          })
        }
      };
      
      res.status(statusCode).json(errorResponse);
    };
  }

  /**
   * Handle async route errors
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Get error log
   */
  getErrorLog(limit = 100) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const byType = {};
    const byHour = {};
    
    this.errorLog.forEach(entry => {
      // Count by type
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      
      // Count by hour
      const hour = new Date(entry.timestamp).getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });
    
    return {
      total: this.errorLog.length,
      byType,
      byHour,
      mostRecent: this.errorLog[this.errorLog.length - 1]
    };
  }
}

module.exports = ErrorHandler;
