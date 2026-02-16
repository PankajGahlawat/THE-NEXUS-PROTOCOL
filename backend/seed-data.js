const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../nexus_protocol.db');
const db = new sqlite3.Database(dbPath);

const TEAMS = [
    { name: 'Alpha Squad', code: '1111' },
    { name: 'Cyber Ninjas', code: '2222' },
    { name: 'NetRunners', code: '3333' }
];

const ACTIONS = ['LOGIN', 'MISSION_START', 'TOOL_USE', 'FLAG_CAPTURE'];

db.serialize(() => {
    console.log("Seeding database...");

    // 1. Create Teams
    const teamIds = [];
    TEAMS.forEach(team => {
        const id = uuidv4();
        teamIds.push(id);
        db.run(`INSERT OR IGNORE INTO teams (id, name, code, is_active, score) VALUES (?, ?, ?, 1, ?)`,
            [id, team.name, team.code, Math.floor(Math.random() * 1000)]);
        console.log(`Added team: ${team.name}`);
    });

    // 2. Create Activity Logs
    const stmt = db.prepare(`INSERT INTO activity_logs (id, type, team_id, details, timestamp) VALUES (?, ?, ?, ?, ?)`);
    for (let i = 0; i < 20; i++) {
        const teamId = teamIds[Math.floor(Math.random() * teamIds.length)];
        const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        stmt.run(uuidv4(), action, teamId, JSON.stringify({ note: 'Simulated activity' }), new Date().toISOString());
    }
    stmt.finalize();
    console.log("Added 20 activity logs.");

});

setTimeout(() => {
    db.close();
    console.log("Seeding complete.");
}, 1000);
