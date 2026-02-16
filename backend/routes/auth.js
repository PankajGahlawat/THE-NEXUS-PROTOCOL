const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const database = require('../models/database');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Apply rate limiting to all auth routes
router.use(authLimiter);

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { teamName, accessCode } = req.body;

    // Validate input
    if (!teamName || teamName.length < 3 || teamName.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TEAM_NAME',
        message: 'Team name must be 3-20 characters'
      });
    }

    if (!accessCode || accessCode.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ACCESS_CODE',
        message: 'Access code must be at least 4 characters'
      });
    }

    // For demo purposes, we'll accept any valid format
    // In production, you'd validate against a database
    const isValidCredentials = teamName.length >= 3 && accessCode.length >= 4;

    if (!isValidCredentials) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid team name or access code'
      });
    }

    // Generate session token
    const sessionToken = jwt.sign(
      { 
        teamName,
        timestamp: Date.now(),
        sessionId: database.generateId()
      },
      process.env.JWT_SECRET || 'nexus-protocol-secret-key',
      { expiresIn: '2h' }
    );

    // Create team record
    const teamData = {
      teamName,
      accessCodeHash: await bcrypt.hash(accessCode, 10)
    };
    const team = database.createTeam(teamData);

    // Create session
    const sessionData = {
      teamId: team.id,
      sessionToken,
      authenticated: true,
      selectedAgent: null,
      missionProgress: 0,
      threatLevel: 'LOW',
      traceResidue: 0,
      currentPhase: 1,
      currentMission: null
    };
    const session = database.createSession(sessionData);

    res.json({
      success: true,
      sessionToken,
      teamId: team.id,
      teamName,
      expiresIn: 7200 // 2 hours
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // In a real implementation, you'd invalidate the token
      // For now, we'll just acknowledge the logout
    }

    res.json({
      success: true,
      message: 'Session terminated'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/auth/validate
router.get('/validate', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        valid: false,
        error: 'No token provided'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexus-protocol-secret-key');
    
    res.json({
      valid: true,
      teamName: decoded.teamName,
      sessionId: decoded.sessionId,
      expiresIn: Math.floor((decoded.exp * 1000 - Date.now()) / 1000)
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        valid: false,
        error: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token'
      });
    }

    console.error('Token validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexus-protocol-secret-key');
    
    // Generate new token with extended expiry
    const newToken = jwt.sign(
      { 
        teamName: decoded.teamName,
        timestamp: Date.now(),
        sessionId: decoded.sessionId
      },
      process.env.JWT_SECRET || 'nexus-protocol-secret-key',
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      sessionToken: newToken,
      expiresIn: 7200
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

module.exports = router;