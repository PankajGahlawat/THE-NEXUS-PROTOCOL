/**
 * NEXUS PROTOCOL - SQLite Database Implementation
 * Persistent database layer for local deployment
 * Version: 1.0.0
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLiteDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, '../../nexus_protocol.db');
        this.db = null;
        this.initialized = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Could not connect to database', err);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database');
                    this.initializeSchema().then(() => {
                        this.initialized = true;
                        resolve();
                    }).catch(reject);
                }
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async initializeSchema() {
        try {
            // Read init-database.sql
            const sqlPath = path.join(__dirname, '../../init-database.sql');
            const sqlContent = fs.readFileSync(sqlPath, 'utf8');

            // Split by semicolon to execute individually (SQLite limitation on exec)
            // Removing comments and empty lines for cleaner execution
            const statements = sqlContent
                .replace(/--.*$/gm, '')
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            // Function to run execution serially
            const executeSequentially = async () => {
                for (const statement of statements) {
                    // Skip transactions as we handle them locally or not at all for schema init
                    if (statement.toUpperCase() === 'BEGIN' || statement.toUpperCase() === 'COMMIT') continue;

                    // Basic transformation for Postgres to SQLite compatibility if needed
                    // The sql file says "Compatible with both", but let's be safe
                    let sqliteSql = statement
                        .replace(/gen_random_uuid\(\)/g, "lower(hex(randomblob(16)))")
                        .replace(/NOW\(\)/g, "CURRENT_TIMESTAMP")
                        .replace(/JSONB/g, "TEXT"); // SQLite stores JSON as TEXT

                    try {
                        await this.run(sqliteSql);
                    } catch (err) {
                        // Ignore "table already exists" errors
                        if (!err.message.includes('already exists')) {
                            console.warn(`Warning executing SQL: ${err.message}`);
                        }
                    }
                }
            };

            await executeSequentially();
            console.log('✅ SQLite schema initialized');
        } catch (error) {
            console.error('❌ Schema initialization failed:', error);
            throw error;
        }
    }

    // --- Team Management ---

    async createTeam(teamData) {
        const { teamName, accessCode } = teamData;
        try {
            const id = this.generateId();
            await this.run(
                `INSERT INTO teams (id, name, code, is_active) VALUES (?, ?, ?, 1)`,
                [id, teamName, accessCode]
            );
            return { id, teamName, created_at: new Date().toISOString() };
        } catch (error) {
            if (error.message.includes('UNIQUE')) {
                throw new Error('Team name or code already exists');
            }
            throw error;
        }
    }

    async authenticateTeam(teamName, accessCode) {
        const row = await this.get(
            `SELECT * FROM teams WHERE name = ? AND code = ? AND is_active = 1`,
            [teamName, accessCode]
        );

        if (row) {
            await this.run(`UPDATE teams SET last_active = CURRENT_TIMESTAMP WHERE id = ?`, [row.id]);
            return { id: row.id, teamName: row.name };
        }
        return null;
    }

    async getTeam(teamId) {
        const row = await this.get(`SELECT * FROM teams WHERE id = ?`, [teamId]);
        if (!row) return null;
        return {
            id: row.id,
            teamName: row.name,
            ...row
        };
    }

    // --- Session Management ---

    async createSession(sessionData) {
        const { teamId, sessionToken, ipAddress, userAgent } = sessionData;
        const id = this.generateId();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        await this.run(
            `INSERT INTO sessions (id, team_id, token, expires_at)
           VALUES (?, ?, ?, ?)`,
            [id, teamId, sessionToken, expiresAt]
        );

        return { id, sessionToken, expiresAt };
    }

    async getSession(sessionToken) {
        const row = await this.get(
            `SELECT s.*, t.name as team_name 
           FROM sessions s 
           JOIN teams t ON s.team_id = t.id 
           WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP`,
            [sessionToken]
        );

        if (row) {
            // Update activity
            await this.run(`UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?`, [row.id]);
            return {
                id: row.id,
                teamId: row.team_id,
                teamName: row.team_name,
                sessionToken: row.token
            };
        }
        return null;
    }

    async deleteSession(sessionToken) {
        await this.run(`DELETE FROM sessions WHERE token = ?`, [sessionToken]);
    }

    // --- Mission Management ---

    async createMissionInstance(missionData) {
        const { missionId, teamId, selectedAgent, duration } = missionData;
        const id = this.generateId();
        // SQLite doesn't have DATE_ADD easily, assuming duration is seconds

        // Calculate end time in JS to be safe
        const endTime = new Date(Date.now() + duration * 1000).toISOString();

        await this.run(
            `INSERT INTO mission_instances (id, mission_id, team_id, selected_agent, end_time, status, time_remaining)
           VALUES (?, ?, ?, ?, ?, 'active', ?)`,
            [id, missionId, teamId, selectedAgent, endTime, duration]
        );

        return { id, missionId, teamId, selectedAgent, endTime };
    }

    async getMissionInstance(instanceId) {
        return await this.get(`SELECT * FROM mission_instances WHERE id = ?`, [instanceId]);
    }

    async completeMissionObjective(missionInstanceId, objectiveId, reward) {
        // Update local tracking (this is a simplified logic, real app would have objective table)
        // We'll update the JSON blob for objectives_completed

        const instance = await this.get(`SELECT objectives_completed, mission_progress, final_score FROM mission_instances WHERE id = ?`, [missionInstanceId]);
        if (!instance) throw new Error('Mission not found');

        let completed = [];
        try { completed = JSON.parse(instance.objectives_completed || '[]'); } catch (e) { }

        if (!completed.includes(objectiveId)) {
            completed.push(objectiveId);
            const newScore = (instance.final_score || 0) + reward;

            await this.run(
                `UPDATE mission_instances SET 
               objectives_completed = ?, 
               mission_progress = ?, 
               final_score = ? 
               WHERE id = ?`,
                [JSON.stringify(completed), (instance.mission_progress || 0) + 1, newScore, missionInstanceId]
            );
        }
        return { success: true };
    }

    // --- Helpers ---

    generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async cleanup() {
        // Remove expired sessions
        await this.run(`DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`);
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = new SQLiteDatabase();
