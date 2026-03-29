/**
 * NEXUS PROTOCOL - Room Routes
 * Works with both in-memory DB (USE_POSTGRES=false) and PostgreSQL
 */
const express = require('express');
const router = express.Router();

function getPgPool() {
  const { Pool } = require('pg');
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'nexusprotocol',
    user: process.env.DB_USER || 'nexus_user',
    password: process.env.DB_PASSWORD || '',
    ssl: false
  });
}

const usePostgres = () => process.env.USE_POSTGRES === 'true';

function verifyToken(req) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return null;
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { issuer: 'nexus-protocol', audience: 'nexus-client' });
  } catch { return null; }
}

// GET /api/v1/rooms/my
router.get('/my', async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ success: false, message: 'Not authenticated' });
  const teamId = decoded.teamId;

  if (usePostgres()) {
    const pool = getPgPool();
    try {
      const result = await pool.query(`
        SELECT r.*, rt.team_name AS red_team_name, rt.access_code AS red_team_code,
          bt.team_name AS blue_team_name, bt.access_code AS blue_team_code
        FROM rooms r
        LEFT JOIN teams rt ON rt.id = r.red_team_id
        LEFT JOIN teams bt ON bt.id = r.blue_team_id
        WHERE (r.red_team_id = $1 OR r.blue_team_id = $1) AND r.status = 'active'
        ORDER BY r.created_at DESC LIMIT 1
      `, [teamId]);
      return res.json({ success: true, room: result.rows[0] || null });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
    finally { await pool.end(); }
  }

  return res.json({ success: true, room: null });
});

// GET /api/v1/rooms
router.get('/', async (req, res) => {
  if (usePostgres()) {
    const pool = getPgPool();
    try {
      const result = await pool.query(`
        SELECT r.*, rt.team_name AS red_team_name, bt.team_name AS blue_team_name
        FROM rooms r
        LEFT JOIN teams rt ON rt.id = r.red_team_id
        LEFT JOIN teams bt ON bt.id = r.blue_team_id
        ORDER BY r.created_at DESC
      `);
      return res.json({ success: true, data: result.rows });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
    finally { await pool.end(); }
  }
  return res.json({ success: true, data: [] });
});

// POST /api/v1/rooms/join
router.post('/join', async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ success: false, message: 'Not authenticated' });
  const { roomId, seat } = req.body;
  if (!roomId || !seat) return res.status(400).json({ success: false, message: 'roomId and seat are required' });
  return res.json({ success: true, data: { roomId, seat, teamId: decoded.teamId, message: 'Successfully joined seat' } });
});

module.exports = router;
