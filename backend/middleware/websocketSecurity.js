/**
 * WebSocket Security
 * 
 * Implements authentication, message validation, and rate limiting for WebSocket connections.
 * 
 * Requirements: 9.7, 9.8
 */

class WebSocketSecurity {
  constructor(options = {}) {
    this.tokenValidator = options.tokenValidator;
    this.messageRateLimit = {
      windowMs: options.messageRateLimitWindow || 1000, // 1 second
      maxMessages: options.maxMessagesPerSecond || 10,
      clients: new Map() // socketId -> { count, resetTime }
    };
    this.logger = options.logger || console;
  }

  /**
   * Authenticate WebSocket connection
   * Requirements: 9.7
   */
  authenticateConnection(socket, next) {
    const token = socket.handshake.auth.token || 
                  socket.handshake.query.token ||
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      this.logger.warn(`WebSocket connection rejected: No token provided`);
      return next(new Error('Authentication required'));
    }
    
    // Validate token
    if (this.tokenValidator) {
      try {
        const user = this.tokenValidator(token);
        socket.user = user;
        this.logger.info(`WebSocket authenticated: ${user.id}`);
        return next();
      } catch (error) {
        this.logger.warn(`WebSocket authentication failed: ${error.message}`);
        return next(new Error('Invalid authentication token'));
      }
    }
    
    // If no validator provided, accept connection (development mode)
    this.logger.warn('WebSocket authentication bypassed (no validator)');
    socket.user = { id: 'anonymous' };
    next();
  }

  /**
   * Validate WebSocket message
   * Requirements: 9.8
   */
  validateMessage(socket, message, callback) {
    // Check message structure
    if (!message || typeof message !== 'object') {
      this.logger.warn(`Invalid message structure from ${socket.id}`);
      return callback(new Error('Invalid message format'));
    }
    
    // Check required fields
    if (!message.type) {
      return callback(new Error('Message type is required'));
    }
    
    // Validate message type
    const validTypes = [
      'tool_use',
      'task_attempt',
      'subscribe_updates',
      'unsubscribe_updates',
      'ping'
    ];
    
    if (!validTypes.includes(message.type)) {
      this.logger.warn(`Invalid message type from ${socket.id}: ${message.type}`);
      return callback(new Error('Invalid message type'));
    }
    
    // Validate payload size
    const messageSize = JSON.stringify(message).length;
    if (messageSize > 100000) { // 100KB limit
      this.logger.warn(`Message too large from ${socket.id}: ${messageSize} bytes`);
      return callback(new Error('Message too large'));
    }
    
    // Sanitize message data
    message.data = this.sanitizeMessageData(message.data);
    
    callback(null, message);
  }

  /**
   * Rate limit WebSocket messages
   * Requirements: 9.8
   */
  rateLimitMessage(socket, callback) {
    const now = Date.now();
    let client = this.messageRateLimit.clients.get(socket.id);
    
    if (!client || now > client.resetTime) {
      // New window
      client = {
        count: 0,
        resetTime: now + this.messageRateLimit.windowMs
      };
      this.messageRateLimit.clients.set(socket.id, client);
    }
    
    client.count++;
    
    // Check if limit exceeded
    if (client.count > this.messageRateLimit.maxMessages) {
      this.logger.warn(`WebSocket rate limit exceeded for ${socket.id}: ${client.count} messages/s`);
      return callback(new Error('Too many messages. Please slow down.'));
    }
    
    callback(null);
  }

  /**
   * Sanitize message data
   */
  sanitizeMessageData(data) {
    if (!data) {
      return data;
    }
    
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeMessageData(item));
    }
    
    if (typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeMessageData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Sanitize string
   */
  sanitizeString(value) {
    if (!value || typeof value !== 'string') {
      return value;
    }
    
    // Remove potentially dangerous characters
    return value
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  /**
   * Setup WebSocket middleware
   */
  setupMiddleware(io) {
    // Authentication middleware
    io.use((socket, next) => {
      this.authenticateConnection(socket, next);
    });
    
    // Connection handler
    io.on('connection', (socket) => {
      this.logger.info(`WebSocket connected: ${socket.id} (user: ${socket.user?.id})`);
      
      // Message validation and rate limiting
      socket.use((packet, next) => {
        const [event, message] = packet;
        
        // Rate limit check
        this.rateLimitMessage(socket, (rateLimitError) => {
          if (rateLimitError) {
            socket.emit('error', { message: rateLimitError.message });
            return next(rateLimitError);
          }
          
          // Message validation
          if (message && typeof message === 'object') {
            this.validateMessage(socket, message, (validationError, validatedMessage) => {
              if (validationError) {
                socket.emit('error', { message: validationError.message });
                return next(validationError);
              }
              
              // Replace message with validated version
              packet[1] = validatedMessage;
              next();
            });
          } else {
            next();
          }
        });
      });
      
      // Disconnection handler
      socket.on('disconnect', (reason) => {
        this.logger.info(`WebSocket disconnected: ${socket.id} (reason: ${reason})`);
        this.messageRateLimit.clients.delete(socket.id);
      });
    });
  }

  /**
   * Clean up old rate limit records
   */
  cleanup() {
    const now = Date.now();
    for (const [socketId, client] of this.messageRateLimit.clients.entries()) {
      if (now > client.resetTime + 60000) { // 1 minute old
        this.messageRateLimit.clients.delete(socketId);
      }
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      activeConnections: this.messageRateLimit.clients.size,
      connections: Array.from(this.messageRateLimit.clients.entries()).map(([socketId, data]) => ({
        socketId,
        messagesPerSecond: data.count,
        resetIn: Math.max(0, data.resetTime - Date.now())
      }))
    };
  }
}

module.exports = WebSocketSecurity;
