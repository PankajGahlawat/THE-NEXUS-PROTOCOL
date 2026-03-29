/**
 * NEXUS PROTOCOL - Admin Routes
 * Works with both in-memory DB (USE_POSTGRES=false) and PostgreSQL
 */
const express = require('express');

// Shared teams store — same array used by login in index_enhanced.js
const STATIC_TEAMS = require('../models/teamsStore');

// In-memory broadcast store — shared with game/state endpoint
const broadcastStore = require('../models/broadcastStore');

// File-backed rooms store — persists across restarts
const ROOMS = require('../models/roomsStore');
let roomCounter = Date.now(); // unique IDs even after restart

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

module.exports = () => {
  const router = express.Router();

  const isAdmin = (req, res, next) => {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (token === (process.env.ADMIN_CODE || 'ADMIN-8821')) return next();
    return res.status(403).json({ success: false, error: 'ACCESS_DENIED', message: 'Admin privileges required' });
  };

  router.use(isAdmin);

  const usePostgres = () => process.env.USE_POSTGRES === 'true';

  // ── GET /api/v1/admin/activity ──────────────────────────────────────────
  router.get('/activity', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        const result = await pool.query(`
          SELECT s.created_at AS timestamp, 'team_login' AS type,
            t.team_name AS team, 'N/A' AS mission,
            COALESCE(s.selected_agent, 'Not Selected') AS agent,
            json_build_object('status', 'active') AS data
          FROM sessions s JOIN teams t ON t.id = s.team_id
          WHERE s.expires_at > NOW() ORDER BY s.created_at DESC LIMIT $1
        `, [limit]);
        return res.json({ success: true, data: result.rows });
      } catch (e) { return res.json({ success: true, data: [] }); }
      finally { await pool.end(); }
    }
    try {
      const database = require('../models/database');
      return res.json({ success: true, data: database.getActivityFeed(limit) });
    } catch (e) { return res.json({ success: true, data: [] }); }
  });

  // ── GET /api/v1/admin/leaderboard ───────────────────────────────────────
  router.get('/leaderboard', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        const result = await pool.query(`
          SELECT team_name AS "teamName", total_score AS score,
            completed_missions AS "missionsCompleted",
            CASE WHEN completed_missions > 0 THEN ROUND(total_score::numeric / completed_missions) ELSE 0 END AS "averageScore",
            last_active AS "lastActive"
          FROM teams WHERE is_active = TRUE ORDER BY total_score DESC LIMIT $1
        `, [limit]);
        return res.json({ success: true, data: result.rows.map((r, i) => ({ rank: i + 1, ...r })) });
      } catch (e) { return res.json({ success: true, data: [] }); }
      finally { await pool.end(); }
    }
    try {
      const database = require('../models/database');
      const result = database.getLeaderboard(limit);
      return res.json({ success: true, data: result.leaderboard || [] });
    } catch (e) { return res.json({ success: true, data: [] }); }
  });

  // ── GET /api/v1/admin/teams ─────────────────────────────────────────────
  router.get('/teams', async (req, res) => {
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        const result = await pool.query(`
          SELECT team_name AS "teamName", team_type AS "teamType", access_code AS "accessCode",
            total_score AS score, total_missions AS mission, last_active AS "lastActive", is_active AS status
          FROM teams ORDER BY created_at ASC
        `);
        return res.json({ success: true, data: result.rows.map(t => ({ ...t, status: t.status ? 'active' : 'inactive' })) });
      } catch (e) { return res.json({ success: true, data: [] }); }
      finally { await pool.end(); }
    }
    try {
      const database = require('../models/database');
      const liveTeams = database.getTeams();
      const merged = STATIC_TEAMS.map(st => {
        const live = liveTeams.find(t => t.teamName === st.team_name) || {};
        return { teamName: st.team_name, teamType: st.team_type, accessCode: st.access_code, score: live.score || 0, mission: live.mission || 0, lastActive: live.lastActive || new Date().toISOString(), status: 'active' };
      });
      const extra = liveTeams.filter(t => !STATIC_TEAMS.find(s => s.team_name === t.teamName));
      return res.json({ success: true, data: [...merged, ...extra] });
    } catch (e) {
      return res.json({ success: true, data: STATIC_TEAMS.map(t => ({ teamName: t.team_name, teamType: t.team_type, accessCode: t.access_code, score: 0, mission: 0, status: 'active' })) });
    }
  });

  // ── POST /api/v1/admin/team/create ──────────────────────────────────────
  router.post('/team/create', async (req, res) => {
    const { teamName, accessCode, teamType } = req.body;
    if (!teamName || teamName.length < 2 || !accessCode || accessCode.length < 4 || !teamType) {
      return res.status(400).json({ success: false, message: 'teamName (min 2), accessCode (min 4) and teamType required' });
    }
    if (!['red', 'blue'].includes(teamType)) {
      return res.status(400).json({ success: false, message: 'teamType must be red or blue' });
    }
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(accessCode, 12);
        await pool.query('INSERT INTO teams (team_name, password_hash, access_code, team_type) VALUES ($1, $2, $3, $4)', [teamName, hash, accessCode, teamType]);
        return res.json({ success: true, message: `Team ${teamName} created` });
      } catch (e) {
        if (e.code === '23505') return res.status(409).json({ success: false, message: 'Team name already exists' });
        return res.status(500).json({ success: false, message: e.message });
      } finally { await pool.end(); }
    }
    if (STATIC_TEAMS.find(t => t.team_name === teamName)) {
      return res.status(409).json({ success: false, message: 'Team name already exists' });
    }
    const newId = `team-${teamType}-${Date.now()}`;
    STATIC_TEAMS.push({ id: newId, team_name: teamName, access_code: accessCode, team_type: teamType });
    return res.json({ success: true, message: `Team ${teamName} created` });
  });

  // ── POST /api/v1/admin/broadcast ────────────────────────────────────────
  router.post('/broadcast', (req, res) => {
    const { message, type = 'info' } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    const broadcast = {
      id: `bc-${Date.now()}`,
      message: message.trim(),
      type,
      timestamp: new Date().toISOString(),
      expiresAt: Date.now() + 30000
    };
    broadcastStore.push(broadcast);
    if (broadcastStore.length > 10) broadcastStore.splice(0, broadcastStore.length - 10);
    return res.json({ success: true, message: 'Broadcast sent', broadcast });
  });

  // ── POST /api/v1/admin/threat ───────────────────────────────────────────
  router.post('/threat', (req, res) => res.json({ success: true, level: req.body.level }));

  // ── POST /api/v1/admin/reset ────────────────────────────────────────────
  router.post('/reset', async (req, res) => {
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        await pool.query('TRUNCATE TABLE sessions CASCADE');
        await pool.query('UPDATE teams SET total_score=0, total_missions=0, completed_missions=0');
        return res.json({ success: true, message: 'System reset' });
      } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
      finally { await pool.end(); }
    }
    const database = require('../models/database');
    database.sessions.clear();
    database.missionInstances.clear();
    database.performanceLogs.clear();
    database.teams.forEach((t, id) => { t.totalScore = 0; t.totalMissions = 0; t.completedMissions = 0; database.teams.set(id, t); });
    STATIC_TEAMS.forEach(t => { t.totalScore = 0; t.totalMissions = 0; t.completedMissions = 0; });
    return res.json({ success: true, message: 'System reset' });
  });

  // ── POST /api/v1/admin/team/kick ────────────────────────────────────────
  router.post('/team/kick', async (req, res) => {
    const { teamName } = req.body;
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        await pool.query('DELETE FROM sessions WHERE team_id = (SELECT id FROM teams WHERE team_name = $1)', [teamName]);
        await pool.query('UPDATE teams SET total_score=0, total_missions=0, completed_missions=0 WHERE team_name=$1', [teamName]);
        return res.json({ success: true, message: `Team ${teamName} kicked` });
      } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
      finally { await pool.end(); }
    }
    // In-memory: mark as kicked (game/state will return forceLogout), clear sessions, reset score
    try {
      const { kickedTeams } = require('../index_enhanced');
      kickedTeams.add(teamName);
    } catch (e) { /* kickedTeams may not be exported yet on first load */ }
    const database = require('../models/database');
    for (const [id, session] of database.sessions.entries()) {
      const team = database.teams.get(session.teamId);
      if (team && team.teamName === teamName) database.sessions.delete(id);
    }
    for (const [id, team] of database.teams.entries()) {
      if (team.teamName === teamName) { team.totalScore = 0; team.totalMissions = 0; team.completedMissions = 0; database.teams.set(id, team); }
    }
    const st = STATIC_TEAMS.find(t => t.team_name === teamName);
    if (st) { st.totalScore = 0; st.totalMissions = 0; st.completedMissions = 0; }
    return res.json({ success: true, message: `Team ${teamName} kicked and score reset` });
  });

  // ── POST /api/v1/admin/team/reset ───────────────────────────────────────
  router.post('/team/reset', async (req, res) => {
    const { teamName } = req.body;
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        await pool.query('UPDATE teams SET total_score=0, total_missions=0, completed_missions=0 WHERE team_name=$1', [teamName]);
        await pool.query('DELETE FROM sessions WHERE team_id = (SELECT id FROM teams WHERE team_name = $1)', [teamName]);
        return res.json({ success: true, message: `Team ${teamName} reset` });
      } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
      finally { await pool.end(); }
    }
    const database = require('../models/database');
    for (const [id, team] of database.teams.entries()) {
      if (team.teamName === teamName) { team.totalScore = 0; team.totalMissions = 0; team.completedMissions = 0; database.teams.set(id, team); }
    }
    for (const [id, session] of database.sessions.entries()) {
      const team = database.teams.get(session.teamId);
      if (team && team.teamName === teamName) database.sessions.delete(id);
    }
    const st2 = STATIC_TEAMS.find(t => t.team_name === teamName);
    if (st2) { st2.totalScore = 0; st2.totalMissions = 0; st2.completedMissions = 0; }
    return res.json({ success: true, message: `Team ${teamName} reset` });
  });


  // ── DELETE /api/v1/admin/team ───────────────────────────────────────────
  router.delete('/team', async (req, res) => {
    const { teamName } = req.body;
    if (!teamName) return res.status(400).json({ success: false, message: 'teamName required' });
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        await pool.query('DELETE FROM teams WHERE team_name=$1', [teamName]);
        return res.json({ success: true, message: `Team ${teamName} deleted` });
      } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
      finally { await pool.end(); }
    }
    const idx = STATIC_TEAMS.findIndex(t => t.team_name === teamName);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Team not found' });
    STATIC_TEAMS.splice(idx, 1);
    try {
      const fs = require('fs'), path = require('path');
      const FILE = path.join(__dirname, '../data/teams.json');
      fs.writeFileSync(FILE, JSON.stringify(STATIC_TEAMS, null, 2), 'utf8');
    } catch (e) { console.error('team delete save error:', e.message); }
    const database = require('../models/database');
    for (const [id, session] of database.sessions.entries()) {
      const team = database.teams.get(session.teamId);
      if (team && team.teamName === teamName) database.sessions.delete(id);
    }
    return res.json({ success: true, message: `Team ${teamName} deleted` });
  });

  // ── GET /api/v1/admin/rooms ─────────────────────────────────────────────
  router.get('/rooms', async (req, res) => {
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        const result = await pool.query(`
          SELECT r.id, r.room_name, r.status, r.created_at,
            rt.team_name AS red_team_name, rt.access_code AS red_team_code,
            bt.team_name AS blue_team_name, bt.access_code AS blue_team_code
          FROM rooms r
          LEFT JOIN teams rt ON rt.id = r.red_team_id
          LEFT JOIN teams bt ON bt.id = r.blue_team_id
          ORDER BY r.created_at DESC
        `);
        return res.json({ success: true, data: result.rows });
      } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
      finally { await pool.end(); }
    }
    return res.json({ success: true, data: ROOMS.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) });
  });

  // ── POST /api/v1/admin/rooms ────────────────────────────────────────────
  router.post('/rooms', async (req, res) => {
    const { roomName, redTeamName, blueTeamName } = req.body;
    if (!roomName || !redTeamName || !blueTeamName) {
      return res.status(400).json({ success: false, message: 'roomName, redTeamName, blueTeamName required' });
    }
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        const redResult = await pool.query('SELECT id, access_code FROM teams WHERE team_name=$1', [redTeamName]);
        const blueResult = await pool.query('SELECT id, access_code FROM teams WHERE team_name=$1', [blueTeamName]);
        if (!redResult.rows.length) return res.status(404).json({ success: false, message: `Red team "${redTeamName}" not found` });
        if (!blueResult.rows.length) return res.status(404).json({ success: false, message: `Blue team "${blueTeamName}" not found` });
        const os = require('os'), path = require('path');
        const safeRoom = roomName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const result = await pool.query(
          `INSERT INTO rooms (room_name, red_team_id, blue_team_id, status, log_file, patches_file) VALUES ($1, $2, $3, 'active', $4, $5) RETURNING *`,
          [roomName, redResult.rows[0].id, blueResult.rows[0].id, path.join(os.tmpdir(), `nexus_room_${safeRoom}.log`), path.join(os.tmpdir(), `nexus_room_${safeRoom}_patches.json`)]
        );
        return res.json({ success: true, room: result.rows[0] });
      } catch (e) {
        if (e.code === '23505') return res.status(409).json({ success: false, message: 'Room name already exists' });
        return res.status(500).json({ success: false, message: e.message });
      } finally { await pool.end(); }
    }
    const redTeam = STATIC_TEAMS.find(t => t.team_name === redTeamName);
    const blueTeam = STATIC_TEAMS.find(t => t.team_name === blueTeamName);
    if (!redTeam) return res.status(404).json({ success: false, message: `Red team "${redTeamName}" not found` });
    if (!blueTeam) return res.status(404).json({ success: false, message: `Blue team "${blueTeamName}" not found` });
    if (ROOMS.find(r => r.room_name === roomName)) {
      return res.status(409).json({ success: false, message: 'Room name already exists' });
    }
    const safeRoom = roomName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const _p = require('path');
    const dataDir = _p.join(__dirname, '../data');
    const logFile = _p.join(dataDir, 'vidyatech_' + safeRoom + '.log');
    const patchesFile = _p.join(dataDir, 'vidyatech_' + safeRoom + '_patches.json');
    // Assign the first available port slot (0=5000, 1=5001, 2=5002)
    const usedPorts = new Set(ROOMS.map(r => r.vidyatech_port));
    let slotIndex = 0;
    while (usedPorts.has(5000 + slotIndex)) slotIndex++;
    const vidyatechPort = 5000 + slotIndex;
    const monitorPort = 8080 + slotIndex;
    const id = `room-${roomCounter++}`;
    const room = { id, room_name: roomName, status: 'active', red_team_name: redTeamName, red_team_code: redTeam.access_code, blue_team_name: blueTeamName, blue_team_code: blueTeam.access_code, created_at: new Date().toISOString(), log_file: logFile, patches_file: patchesFile, vidyatech_port: vidyatechPort, monitor_port: monitorPort };
    ROOMS.push(room);
    return res.json({ success: true, room });
  });

  // ── DELETE /api/v1/admin/rooms/:id ──────────────────────────────────────
  router.delete('/rooms/:id', async (req, res) => {
    if (usePostgres()) {
      const pool = getPgPool();
      try {
        await pool.query('DELETE FROM rooms WHERE id=$1', [req.params.id]);
        return res.json({ success: true });
      } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
      finally { await pool.end(); }
    }
    ROOMS.removeById(req.params.id);
    return res.json({ success: true });
  });

  return router;
};
