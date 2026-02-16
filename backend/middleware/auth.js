/**
 * NEXUS PROTOCOL - Enhanced Authentication Middleware
 * Secure JWT authentication with proper session management
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

class AuthMiddleware {
  constructor(database) {
    this.database = database;
    this.JWT_SECRET = process.env.JWT_SECRET || this.generateSecureSecret();
    this.JWT_ALGORITHM = 'HS256';
    this.TOKEN_EXPIRY = '2h';
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  Using generated JWT secret. Set JWT_SECRET environment variable for production.');
    }
  }

  generateSecureSecret() {
    return require('crypto').randomBytes(64).toString('hex');
  }

  // Rate limiting configurations
  getAuthLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: 15 * 60 // seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit by IP and team name combination
        const teamName = req.body?.teamName || 'unknown';
        return `${req.ip}:${teamName}`;
      },
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
      }
    });
  }

  getGeneralLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  getMissionActionLimiter() {
    return rateLimit({
      windowMs: 1000, // 1 second
      max: 5, // 5 actions per second (reduced from 10)
      message: {
        success: false,
        error: 'ACTION_RATE_LIMIT',
        message: 'Too many mission actions. Please slow down.',
        retryAfter: 1
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Input validation rules
  getLoginValidation() {
    return [
      body('teamName')
        .trim()
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9\s-_]+$/)
        .withMessage('Team name must be 3-20 characters, alphanumeric only'),
      
      body('accessCode')
        .isLength({ min: 6, max: 50 })
        .withMessage('Access code must be 6-50 characters'),
      
      // Sanitize inputs
      body('teamName').escape(),
      body('accessCode').escape()
    ];
  }

  // Validation error handler
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      });
    }
    next();
  }

  // JWT token generation
  generateToken(payload) {
    return jwt.sign(
      {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: require('crypto').randomUUID() // JWT ID for token tracking
      },
      this.JWT_SECRET,
      {
        algorithm: this.JWT_ALGORITHM,
        expiresIn: this.TOKEN_EXPIRY,
        issuer: 'nexus-protocol',
        audience: 'nexus-client'
      }
    );
  }

  // JWT token verification
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        algorithms: [this.JWT_ALGORITHM],
        issuer: 'nexus-protocol',
        audience: 'nexus-client'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_TOKEN');
      } else {
        throw new Error('TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  // Authentication middleware
  authenticateToken() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'NO_TOKEN',
            message: 'Access token required'
          });
        }

        // Verify JWT token
        const decoded = this.verifyToken(token);

        // Validate session in database
        const session = await this.database.validateSession(token);
        if (!session) {
          return res.status(403).json({
            success: false,
            error: 'INVALID_SESSION',
            message: 'Session not found or expired'
          });
        }

        // Attach session data to request
        req.session = {
          id: session.id,
          teamId: session.team_id,
          teamName: session.team_name,
          selectedAgent: session.selected_agent,
          currentMission: session.current_mission,
          token: token
        };

        req.user = {
          teamId: session.team_id,
          teamName: session.team_name
        };

        next();
      } catch (error) {
        console.error('Authentication error:', error);
        
        let errorResponse = {
          success: false,
          error: 'AUTHENTICATION_FAILED',
          message: 'Authentication failed'
        };

        if (error.message === 'TOKEN_EXPIRED') {
          errorResponse.error = 'TOKEN_EXPIRED';
          errorResponse.message = 'Token has expired';
          return res.status(401).json(errorResponse);
        } else if (error.message === 'INVALID_TOKEN') {
          errorResponse.error = 'INVALID_TOKEN';
          errorResponse.message = 'Invalid token format';
          return res.status(401).json(errorResponse);
        }

        return res.status(403).json(errorResponse);
      }
    };
  }

  // Optional authentication (for public endpoints that benefit from user context)
  optionalAuth() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
          const decoded = this.verifyToken(token);
          const session = await this.database.validateSession(token);
          
          if (session) {
            req.session = {
              id: session.id,
              teamId: session.team_id,
              teamName: session.team_name,
              selectedAgent: session.selected_agent,
              currentMission: session.current_mission,
              token: token
            };

            req.user = {
              teamId: session.team_id,
              teamName: session.team_name
            };
          }
        }

        next();
      } catch (error) {
        // For optional auth, continue without authentication
        next();
      }
    };
  }

  // Mission access authorization
  authorizeMissionAccess() {
    return async (req, res, next) => {
      try {
        const { missionInstanceId } = req.params;
        const teamId = req.session.teamId;

        if (!missionInstanceId) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_MISSION_ID',
            message: 'Mission instance ID required'
          });
        }

        // Check if team has access to this mission
        const mission = await this.database.getMissionInstance(missionInstanceId);
        if (!mission) {
          return res.status(404).json({
            success: false,
            error: 'MISSION_NOT_FOUND',
            message: 'Mission instance not found'
          });
        }

        if (mission.team_id !== teamId) {
          return res.status(403).json({
            success: false,
            error: 'MISSION_ACCESS_DENIED',
            message: 'Access denied to this mission'
          });
        }

        req.mission = mission;
        next();
      } catch (error) {
        console.error('Mission authorization error:', error);
        return res.status(500).json({
          success: false,
          error: 'AUTHORIZATION_ERROR',
          message: 'Failed to authorize mission access'
        });
      }
    };
  }

  // Security headers middleware
  securityHeaders() {
    return (req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Content Security Policy
      res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self'; " +
        "font-src 'self'; " +
        "object-src 'none'; " +
        "media-src 'self'; " +
        "frame-src 'none';"
      );

      next();
    };
  }

  // Request logging middleware
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;

      res.send = function(data) {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          statusCode: res.statusCode,
          duration: duration,
          teamId: req.session?.teamId || null,
          timestamp: new Date().toISOString()
        };

        // Log slow requests
        if (duration > 1000) {
          console.warn('🐌 Slow request:', logData);
        }

        // Log errors
        if (res.statusCode >= 400) {
          console.error('❌ Error request:', logData);
        }

        originalSend.call(this, data);
      };

      next();
    };
  }

  // Error handling middleware
  errorHandler() {
    return (err, req, res, next) => {
      console.error('Unhandled error:', err);

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred',
        ...(isDevelopment && { details: err.message, stack: err.stack })
      });
    };
  }
}

module.exports = AuthMiddleware;