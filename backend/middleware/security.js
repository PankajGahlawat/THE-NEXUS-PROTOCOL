/**
 * Security Middleware
 * 
 * Implements security headers, CORS validation, rate limiting, and DDoS protection.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

class SecurityMiddleware {
  constructor(options = {}) {
    this.corsWhitelist = options.corsWhitelist || [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://nexus-protocol.local'
    ];
    
    this.rateLimit = {
      windowMs: options.rateLimitWindow || 60000, // 1 minute
      maxRequests: options.maxRequests || 100,
      clients: new Map() // IP -> { count, resetTime }
    };
    
    this.ddosThreshold = {
      requestsPerSecond: options.ddosThreshold || 50,
      suspiciousIPs: new Map() // IP -> { count, timestamp }
    };
    
    this.logger = options.logger || console;
  }

  /**
   * Apply security headers
   * Requirements: 9.1
   */
  securityHeaders() {
    return (req, res, next) => {
      // Content Security Policy
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' ws: wss:; " +
        "frame-ancestors 'none';"
      );
      
      // HTTP Strict Transport Security
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
      
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // XSS Protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions Policy
      res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
      );
      
      next();
    };
  }

  /**
   * CORS validation against whitelist
   * Requirements: 9.2
   */
  corsValidation() {
    return (req, res, next) => {
      const origin = req.headers.origin;
      
      // Allow requests without origin (same-origin, Postman, etc.)
      if (!origin) {
        return next();
      }
      
      // Check whitelist
      if (this.corsWhitelist.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET, POST, PUT, DELETE, OPTIONS'
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );
        
        // Handle preflight
        if (req.method === 'OPTIONS') {
          return res.status(204).end();
        }
        
        return next();
      }
      
      // Origin not in whitelist
      this.logger.warn(`CORS violation: ${origin} not in whitelist`);
      return res.status(403).json({
        error: {
          type: 'CORS_ERROR',
          message: 'Origin not allowed'
        }
      });
    };
  }

  /**
   * Rate limiting
   * Requirements: 9.3
   */
  rateLimiting() {
    return (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const now = Date.now();
      
      // Get or create client record
      let client = this.rateLimit.clients.get(clientIP);
      
      if (!client || now > client.resetTime) {
        // New window
        client = {
          count: 0,
          resetTime: now + this.rateLimit.windowMs
        };
        this.rateLimit.clients.set(clientIP, client);
      }
      
      client.count++;
      
      // Check if limit exceeded
      if (client.count > this.rateLimit.maxRequests) {
        this.logger.warn(`Rate limit exceeded for ${clientIP}: ${client.count} requests`);
        
        return res.status(429).json({
          error: {
            type: 'RATE_LIMIT_ERROR',
            message: 'Too many requests. Please slow down and try again later.',
            retryAfter: Math.ceil((client.resetTime - now) / 1000)
          }
        });
      }
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.rateLimit.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.rateLimit.maxRequests - client.count);
      res.setHeader('X-RateLimit-Reset', client.resetTime);
      
      next();
    };
  }

  /**
   * DDoS detection and throttling
   * Requirements: 9.4
   */
  ddosProtection() {
    return (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const now = Date.now();
      
      // Get or create suspicious IP record
      let record = this.ddosThreshold.suspiciousIPs.get(clientIP);
      
      if (!record || now - record.timestamp > 1000) {
        // New second
        record = {
          count: 0,
          timestamp: now
        };
        this.ddosThreshold.suspiciousIPs.set(clientIP, record);
      }
      
      record.count++;
      
      // Check for DDoS pattern
      if (record.count > this.ddosThreshold.requestsPerSecond) {
        this.logger.error(`DDoS pattern detected from ${clientIP}: ${record.count} req/s`);
        
        // Aggressive throttling
        return res.status(503).json({
          error: {
            type: 'DDOS_PROTECTION',
            message: 'Service temporarily unavailable. Please try again later.'
          }
        });
      }
      
      next();
    };
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  /**
   * Clean up old rate limit records
   */
  cleanup() {
    const now = Date.now();
    
    // Clean rate limit records
    for (const [ip, client] of this.rateLimit.clients.entries()) {
      if (now > client.resetTime) {
        this.rateLimit.clients.delete(ip);
      }
    }
    
    // Clean DDoS records
    for (const [ip, record] of this.ddosThreshold.suspiciousIPs.entries()) {
      if (now - record.timestamp > 10000) { // 10 seconds old
        this.ddosThreshold.suspiciousIPs.delete(ip);
      }
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      rateLimit: {
        trackedClients: this.rateLimit.clients.size,
        clients: Array.from(this.rateLimit.clients.entries()).map(([ip, data]) => ({
          ip,
          requests: data.count,
          resetIn: Math.max(0, data.resetTime - Date.now())
        }))
      },
      ddos: {
        suspiciousIPs: this.ddosThreshold.suspiciousIPs.size,
        ips: Array.from(this.ddosThreshold.suspiciousIPs.entries()).map(([ip, data]) => ({
          ip,
          requestsPerSecond: data.count
        }))
      }
    };
  }

  /**
   * Start cleanup interval
   */
  startCleanup(intervalMs = 60000) {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = SecurityMiddleware;
