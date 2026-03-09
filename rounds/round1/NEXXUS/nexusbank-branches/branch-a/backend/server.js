/**
 * NexusBank — Branch A (Andheri)
 * Vulnerabilities:
 * 1. Sensitive Data in HTML/Source
 * 2. IDOR — Account Access
 * 3. Broken Auth — Weak Password
 * 4. Sensitive Data API (no auth)
 * 5. SQL Injection — Login
 * 6. Stored XSS — Feedback
 * 7. Directory Traversal — Statements
 * 8. CSRF — Fund Transfer
 */

const express = require('express');
const SimpleDB = require('./simple-db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// DB Setup
const db = new SimpleDB();
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_no TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    email TEXT,
    balance REAL DEFAULT 50000,
    phone TEXT,
    address TEXT,
    ifsc TEXT,
    pan TEXT
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account TEXT,
    to_account TEXT,
    amount REAL,
    note TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed users — VULN: MD5 passwords
const users = [
  ['ACC001', 'admin',    crypto.createHash('md5').update('admin123').digest('hex'),    'Rajesh Kumar',       'rajesh@nexusbank.com',   999999, '9876543210', 'Mumbai Central',    'NEXUS0001', 'ABCDE1234F'],
  ['ACC002', 'alice',    crypto.createHash('md5').update('password').digest('hex'),    'Alice Sharma',       'alice@email.com',         85000, '9876543211', 'Andheri West',      'NEXUS0001', 'FGHIJ5678K'],
  ['ACC003', 'bob',      crypto.createHash('md5').update('bob123').digest('hex'),      'Bob Patel',          'bob@email.com',           62000, '9876543212', 'Bandra East',       'NEXUS0001', 'LMNOP9012L'],
  ['ACC004', 'charlie',  crypto.createHash('md5').update('charlie').digest('hex'),     'Charlie Singh',      'charlie@email.com',       48000, '9876543213', 'Colaba',            'NEXUS0001', 'QRSTU3456M'],
  ['ACC005', 'diana',    crypto.createHash('md5').update('diana456').digest('hex'),    'Diana Mehta',        'diana@email.com',         95000, '9876543214', 'Dadar West',        'NEXUS0001', 'VWXYZ7890N'],
  ['ACC006', 'emily',    crypto.createHash('md5').update('emily789').digest('hex'),    'Emily D\'Souza',     'emily@email.com',         72000, '9876543215', 'Powai',             'NEXUS0001', 'PQRST1234P'],
  ['ACC007', 'frank',    crypto.createHash('md5').update('frank321').digest('hex'),    'Frank Fernandes',    'frank@email.com',         54000, '9876543216', 'Goregaon',          'NEXUS0001', 'UVWXY5678Q'],
  ['ACC008', 'grace',    crypto.createHash('md5').update('grace654').digest('hex'),    'Grace Rodrigues',    'grace@email.com',         88000, '9876543217', 'Malad',             'NEXUS0001', 'ZABCD9012R'],
  ['ACC009', 'henry',    crypto.createHash('md5').update('henry987').digest('hex'),    'Henry Kapoor',       'henry@email.com',         41000, '9876543218', 'Kandivali',         'NEXUS0001', 'EFGHI3456S'],
  ['ACC010', 'iris',     crypto.createHash('md5').update('iris246').digest('hex'),     'Iris Deshmukh',      'iris@email.com',          67000, '9876543219', 'Borivali',          'NEXUS0001', 'JKLMN7890T'],
  ['ACC011', 'jack',     crypto.createHash('md5').update('jack111').digest('hex'),     'Jack Mathews',       'jack@email.com',          79000, '9876543220', 'Churchgate',        'NEXUS0001', 'OPQRS1234U'],
  ['ACC012', 'kate',     crypto.createHash('md5').update('kate222').digest('hex'),     'Kate Wilson',        'kate@email.com',          53000, '9876543221', 'Marine Lines',      'NEXUS0001', 'TUVWX5678V'],
  ['ACC013', 'leo',      crypto.createHash('md5').update('leo333').digest('hex'),      'Leo Fernandez',      'leo@email.com',           91000, '9876543222', 'Chembur',           'NEXUS0001', 'YZABC9012W'],
  ['ACC014', 'maya',     crypto.createHash('md5').update('maya444').digest('hex'),     'Maya Krishnan',      'maya@email.com',          64000, '9876543223', 'Ghatkopar',         'NEXUS0001', 'DEFGH3456X'],
  ['ACC015', 'neil',     crypto.createHash('md5').update('neil555').digest('hex'),     'Neil D\'Mello',      'neil@email.com',          77000, '9876543224', 'Kurla',             'NEXUS0001', 'IJKLM7890Y'],
  ['ACC016', 'olivia',   crypto.createHash('md5').update('olivia666').digest('hex'),   'Olivia Pereira',     'olivia@email.com',        58000, '9876543225', 'Santacruz',         'NEXUS0001', 'NOPQR1234Z'],
  ['ACC017', 'peter',    crypto.createHash('md5').update('peter777').digest('hex'),    'Peter Dsouza',       'peter@email.com',         82000, '9876543226', 'Vile Parle',        'NEXUS0001', 'STUVW5678A'],
  ['ACC018', 'quinn',    crypto.createHash('md5').update('quinn888').digest('hex'),    'Quinn Rodrigues',    'quinn@email.com',         46000, '9876543227', 'Jogeshwari',        'NEXUS0001', 'XYZAB9012B'],
  ['ACC019', 'rachel',   crypto.createHash('md5').update('rachel999').digest('hex'),   'Rachel Fernandes',   'rachel@email.com',        93000, '9876543228', 'Andheri East',      'NEXUS0001', 'CDEFG3456C'],
  ['ACC020', 'sam',      crypto.createHash('md5').update('sam000').digest('hex'),      'Sam Pinto',          'sam@email.com',           71000, '9876543229', 'Versova',           'NEXUS0001', 'HIJKL7890D'],
];

users.forEach(u => {
  try {
    db.prepare('INSERT INTO users (account_no,username,password,full_name,email,balance,phone,address,ifsc,pan) VALUES (?,?,?,?,?,?,?,?,?,?)').run(...u);
  } catch(e) {}
});

// Seed transactions
try {
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC002','ACC003',2500,'Rent payment');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC003','ACC002',500,'Lunch split');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC002','ACC004',1500,'Birthday gift');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC005','ACC002',3000,'Freelance work payment');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC006','ACC007',1200,'Movie tickets');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC007','ACC008',800,'Grocery shopping');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC008','ACC009',2200,'Laptop repair');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC009','ACC010',950,'Book purchase');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC010','ACC002',1800,'Consulting fee');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC003','ACC005',650,'Dinner bill');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC004','ACC006',4500,'Web design project');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC006','ACC003',320,'Coffee meetup');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC011','ACC012',1750,'Furniture purchase');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC012','ACC013',890,'Mobile recharge');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC013','ACC014',3200,'Car service');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC014','ACC015',1450,'Gym membership');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC015','ACC016',2800,'House rent');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC016','ACC017',670,'Electricity bill');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC017','ACC018',4100,'Laptop purchase');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC018','ACC019',920,'Restaurant bill');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC019','ACC020',1560,'Online shopping');
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run('ACC020','ACC011',2300,'Freelance payment');
} catch(e) {}

// Sample statement files
const statementsDir = path.join(__dirname, 'statements');
if (!fs.existsSync(statementsDir)) fs.mkdirSync(statementsDir);
fs.writeFileSync(path.join(statementsDir, 'ACC002_statement.txt'), 'NexusBank Branch A\nAccount: ACC002 - Alice Sharma\nBalance: ₹35,000\nTransactions: 3\n');
fs.writeFileSync(path.join(statementsDir, 'ACC003_statement.txt'), 'NexusBank Branch A\nAccount: ACC003 - Bob Patel\nBalance: ₹22,000\n');
// VULN: Secret file in parent directory accessible via traversal
fs.writeFileSync(path.join(__dirname, 'secret_config.txt'), 'DB_PATH=./nexusbank_a.db\nADMIN_PASS=admin123\nSECRET_KEY=nexusbank_secret_2024\nBACKUP_SERVER=192.168.1.100\n');

// Auth helper
function getSession(req) {
  const token = req.cookies['session_a'];
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    return JSON.parse(decoded);
  } catch { return null; }
}

function createSession(user) {
  // VULN: Session is just base64 encoded JSON — easily tampered!
  return Buffer.from(JSON.stringify({ id: user.id, username: user.username, account_no: user.account_no })).toString('base64');
}

// ─── ROUTES ───

// VULN 1: Sensitive data in response headers + HTML comment hint
app.get('/api/branch-info', (req, res) => {
  res.setHeader('X-Admin-Contact', 'admin@nexusbank.com');
  res.setHeader('X-Debug-Mode', 'true');
  res.setHeader('X-Default-Creds', 'admin:admin123'); // VULN: creds in header
  res.json({
    branch: 'NexusBank Branch A — Andheri',
    established: 2010,
    ifsc: 'NEXUS0001',
    address: 'Andheri West, Mumbai',
    // VULN: sensitive info in API response
    internal_ip: '192.168.1.50',
    db_version: 'SQLite 3.x',
    server: 'Express/Node.js',
    hint: 'Check response headers for more info!'
  });
});

// VULN 5: SQL Injection — Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const hashedPass = crypto.createHash('md5').update(password || '').digest('hex');
  
  // VULN: String concatenation = SQL Injection
  const query = `SELECT * FROM users WHERE username='${username}' AND password='${hashedPass}'`;
  let user;
  try {
    user = db.prepare(query).get();
  } catch(e) {
    return res.status(400).json({ error: e.message }); // VULN: Error exposes query
  }
  
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = createSession(user);
  res.cookie('session_a', token, { httpOnly: false }); // VULN: httpOnly false
  res.json({ success: true, user: { username: user.username, account_no: user.account_no, full_name: user.full_name } });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('session_a');
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(session.id);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  res.json({ username: user.username, account_no: user.account_no, full_name: user.full_name, balance: user.balance, email: user.email, phone: user.phone });
});

// VULN 2: IDOR — Account Access
app.get('/api/account/:account_no', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  // VULN: No check that account_no belongs to session user
  const user = db.prepare('SELECT * FROM users WHERE account_no=?').get(req.params.account_no);
  if (!user) return res.status(404).json({ error: 'Account not found' });
  res.json(user); // VULN: Returns ALL fields including PAN, password hash
});

// VULN 4: Sensitive Data API — No auth required
app.get('/api/all-accounts', (req, res) => {
  // VULN: No authentication check at all
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users); // Returns passwords, PAN, everything
});

// VULN 3: Broken Auth — Transactions (only checks if logged in, not ownership)
app.get('/api/transactions', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  const txns = db.prepare('SELECT * FROM transactions WHERE from_account=? OR to_account=? ORDER BY timestamp DESC').all(session.account_no, session.account_no);
  res.json(txns);
});

// VULN 8: CSRF — Fund Transfer (no CSRF token)
app.post('/api/transfer', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  // VULN: No CSRF token validation — cross-origin form can trigger this
  const { to_account, amount, note } = req.body;
  const sender = db.prepare('SELECT * FROM users WHERE account_no=?').get(session.account_no);
  const receiver = db.prepare('SELECT * FROM users WHERE account_no=?').get(to_account);
  if (!receiver) return res.status(404).json({ error: 'Recipient account not found' });
  if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
  db.prepare('UPDATE users SET balance=balance-? WHERE account_no=?').run(amount, session.account_no);
  db.prepare('UPDATE users SET balance=balance+? WHERE account_no=?').run(amount, to_account);
  db.prepare('INSERT INTO transactions (from_account,to_account,amount,note) VALUES (?,?,?,?)').run(session.account_no, to_account, amount, note || '');
  res.json({ success: true, message: `₹${amount} transferred to ${receiver.full_name}` });
});

// VULN 6: Stored XSS — Feedback
app.post('/api/feedback', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  const { message } = req.body;
  // VULN: No sanitization — stored as-is
  db.prepare('INSERT INTO feedback (username,message) VALUES (?,?)').run(session.username, message);
  res.json({ success: true });
});

app.get('/api/feedback', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  const feedbacks = db.prepare('SELECT * FROM feedback ORDER BY timestamp DESC').all();
  res.json(feedbacks); // VULN: Returns raw HTML/script content
});

// VULN 7: Directory Traversal — Statement Download
app.get('/api/statement', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  const { file } = req.query;
  // VULN: No path sanitization
  const filePath = path.join(__dirname, 'statements', file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  } catch(e) {
    res.status(404).json({ error: 'File not found: ' + e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🏦 NexusBank Branch A (Andheri) running on http://localhost:${PORT}`);
  console.log(`   Vulnerabilities: SQLi, IDOR, Broken Auth, Sensitive Data, XSS, CSRF, Traversal`);
});
