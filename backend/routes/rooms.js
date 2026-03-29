/**
 * NEXUS PROTOCOL - Room Routes
 * Supports in-memory store (default) and PostgreSQL
 */
const express = require('express');
const router = express.Router();

const ROOMS = require('../models/roomsStore');
const STATIC_TEAMS = require('../models/teamsStore');

function verifyToken(req) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return null;
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { issuer: 'nexus-protocol', audience: 'nexus-client' });
  } catch { return null; }
}

// GET /api/v1/rooms/my — returns the room this team is assigned to
router.get('/my', (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const teamName = decoded.teamName;
  const room = ROOMS.find(r =>
    r.status === 'active' &&
    (r.red_team_name === teamName || r.blue_team_name === teamName)
  );

  return res.json({ success: true, room: room || null });
});

// GET /api/v1/rooms — list all rooms (admin use)
router.get('/', (req, res) => {
  return res.json({ success: true, data: ROOMS });
});

// POST /api/v1/rooms/join
router.post('/join', (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ success: false, message: 'Not authenticated' });
  const { roomId, seat } = req.body;
  if (!roomId || !seat) return res.status(400).json({ success: false, message: 'roomId and seat are required' });
  return res.json({ success: true, data: { roomId, seat, teamId: decoded.teamId, message: 'Successfully joined seat' } });
});

module.exports = router;
