const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'nexus_protocol.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    console.log("--- Teams ---");
    db.each("SELECT id, name, code, is_active FROM teams", (err, row) => {
        if (err) {
            console.error(err.message);
        }
        console.log(`${row.id} | ${row.name} | ${row.code} | Active: ${row.is_active}`);
    });
});

setTimeout(() => {
    db.close();
}, 1000);
