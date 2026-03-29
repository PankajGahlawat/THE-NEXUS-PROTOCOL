/**
 * File-backed rooms store.
 * Persists to data/rooms.json so rooms survive server restarts.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE = path.join(DATA_DIR, 'rooms.json');

function save(rooms) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(rooms, null, 2), 'utf8');
  } catch (e) { console.error('roomsStore save error:', e.message); }
}

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(FILE)) {
      const saved = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      if (Array.isArray(saved)) return saved;
    }
  } catch (e) { /* fall through */ }
  return [];
}

const ROOMS = load();

const _push = Array.prototype.push;
ROOMS.push = function(...args) {
  const result = _push.apply(this, args);
  save(this);
  return result;
};

ROOMS.removeById = function(id) {
  const idx = this.findIndex(r => r.id === id);
  if (idx !== -1) {
    this.splice(idx, 1);
    save(this);
    return true;
  }
  return false;
};

module.exports = ROOMS;
