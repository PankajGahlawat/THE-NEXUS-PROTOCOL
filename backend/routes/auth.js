const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const router = express.Router();

// PostgreSQL pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'nexusprotocol',
  user: process.env.DB_USER || 'nexus_user',
  password: process.env.DB_PASSWORD || '',
  ssl: false
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.'
});

router.use(authLimiter);

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { teamName, accessCode } = req.body;

    if (!teamName || teamName.length < 2 || teamName.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TEAM_NAME',
        message: 'Team name must be 2-30 characters'
      });
    }

    if (!accessCode || accessCode.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ACCESS_CODE',
        message: 'Access code must be at least 4 characters'
      });
    }

    // Look up team in database only
    const result = await pool.query(
      'SELECT * FROM teams WHERE team_name = $1 AND is_active = TRUE',
      [teamName]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid team name or access code'
      });
    }

    const team = result.rows[0];
    const passwordMatch = await bcrypt.compare(accessCode, team.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid team name or access code'
      });
    }

    // Generate JWT
    const sessionToken = jwt.sign(
      {
        teamName: team.team_name,
        teamType: team.team_type,
        teamId: team.id,
        sessionId: require('crypto').randomUUID()
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h',
        algorithm: 'HS256',
        issuer: 'nexus-protocol',
        audience: 'nexus-client'
      }
    );

    // Store session in DB
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO sessions (team_id, session_token, authenticated, expires_at)
       VALUES ($1, $2, TRUE, $3)`,
      [team.id, sessionToken, expiresAt]
    );

    // Update last_active
    await pool.query(
      'UPDATE teams SET last_active = NOW() WHERE id = $1',
      [team.id]
    );

    res.json({
      success: true,
      sessionToken,
      teamId: team.id,
      teamName: team.team_name,
      teamType: team.team_type,
      expiresIn: 7200
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
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await pool.query('DELETE FROM sessions WHERE session_token = $1', [token]);
    }

    res.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// GET /api/v1/auth/validate
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'nexus-protocol',
      audience: 'nexus-client'
    });

    // Check session still exists in DB
    const result = await pool.query(
      'SELECT * FROM sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ valid: false, error: 'Session expired or not found' });
    }

    res.json({
      valid: true,
      teamName: decoded.teamName,
      teamType: decoded.teamType,
      sessionId: decoded.sessionId,
      expiresIn: Math.floor((decoded.exp * 1000 - Date.now()) / 1000)
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }
    console.error('Token validation error:', error);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const newToken = jwt.sign(
      {
        teamName: decoded.teamName,
        teamType: decoded.teamType,
        teamId: decoded.teamId,
        sessionId: decoded.sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h', algorithm: 'HS256', issuer: 'nexus-protocol', audience: 'nexus-client' }
    );

    // Update session token in DB
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await pool.query(
      'UPDATE sessions SET session_token = $1, expires_at = $2 WHERE session_token = $3',
      [newToken, expiresAt, token]
    );

    res.json({ success: true, sessionToken: newToken, expiresIn: 7200 });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});

module.exports = router;
