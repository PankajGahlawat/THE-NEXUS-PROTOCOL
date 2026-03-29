/**
 * File-backed teams store.
 * Persists to data/teams.json so teams survive server restarts.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE = path.join(DATA_DIR, 'teams.json');

const DEFAULT_TEAMS = [
  { id: 'team-red-001',  team_name: 'RedTeam',  access_code: 'RED@Nexus2024!',  team_type: 'red'  },
  { id: 'team-blue-001', team_name: 'BlueTeam', access_code: 'BLUE@Nexus2024!', team_type: 'blue' }
];

function save(teams) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(teams, null, 2), 'utf8');
  } catch (e) { console.error('teamsStore save error:', e.message); }
}

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(FILE)) {
      const saved = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      if (Array.isArray(saved) && saved.length > 0) return saved;
    }
  } catch (e) { /* fall through to defaults */ }
  save(DEFAULT_TEAMS);
  return DEFAULT_TEAMS.slice();
}

const TEAMS = load();

// Override push to auto-save on every new team added
const _push = Array.prototype.push;
TEAMS.push = function(...args) {
  const result = _push.apply(this, args);
  save(this);
  return result;
};

module.exports = TEAMS;
