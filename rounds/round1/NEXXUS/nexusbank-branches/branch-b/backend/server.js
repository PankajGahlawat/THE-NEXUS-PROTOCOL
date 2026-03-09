/**
 * NexusBank — Branch B (Bandra)
 * Vulnerabilities:
 * 1. JWT Weak Secret
 * 2. IDOR — Transaction History
 * 3. Broken Auth — No Account Lockout
 * 4. Mass Assignment — Role Escalation
 * 5. SQL Injection — Search
 * 6. Reflected XSS — Search Results
 * 7. Insecure Direct File Access
 * 8. Broken Access Control — Admin Routes
 */

const express = require('express');
const SimpleDB = require('./simple-db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002;

app.use(cors({ origin: 'http://localhost:5174', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
    role TEXT DEFAULT 'customer',
    credit_score INTEGER DEFAULT 700
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    txn_id TEXT UNIQUE,
    from_account TEXT,
    to_account TEXT,
    amount REAL,
    note TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_no TEXT,
    amount REAL,
    status TEXT DEFAULT 'pending',
    purpose TEXT
  );
`);

const users = [
  ['BAC001', 'admin',    crypto.createHash('sha1').update('admin@bandra').digest('hex'), 'Admin User',         'admin@nexusbank.com',   999999, '9876540001', 'admin'],
  ['BAC002', 'priya',    crypto.createHash('sha1').update('priya123').digest('hex'),    'Priya Nair',         'priya@email.com',        82000, '9876540002', 'customer'],
  ['BAC003', 'rohan',    crypto.createHash('sha1').update('rohan456').digest('hex'),    'Rohan Desai',        'rohan@email.com',        68000, '9876540003', 'customer'],
  ['BAC004', 'meera',    crypto.createHash('sha1').update('meera789').digest('hex'),    'Meera Joshi',        'meera@email.com',        95000, '9876540004', 'customer'],
  ['BAC005', 'arjun',    crypto.createHash('sha1').update('arjun000').digest('hex'),    'Arjun Kapoor',       'arjun@email.com',        71000, '9876540005', 'customer'],
  ['BAC006', 'sneha',    crypto.createHash('sha1').update('sneha111').digest('hex'),    'Sneha Kulkarni',     'sneha@email.com',        54000, '9876540006', 'customer'],
  ['BAC007', 'vikram',   crypto.createHash('sha1').update('vikram222').digest('hex'),   'Vikram Rao',         'vikram@email.com',       89000, '9876540007', 'customer'],
  ['BAC008', 'ananya',   crypto.createHash('sha1').update('ananya333').digest('hex'),   'Ananya Iyer',        'ananya@email.com',       76000, '9876540008', 'customer'],
  ['BAC009', 'karan',    crypto.createHash('sha1').update('karan444').digest('hex'),    'Karan Malhotra',     'karan@email.com',        43000, '9876540009', 'customer'],
  ['BAC010', 'divya',    crypto.createHash('sha1').update('divya555').digest('hex'),    'Divya Chatterjee',   'divya@email.com',        91000, '9876540010', 'customer'],
  ['BAC011', 'rahul',    crypto.createHash('sha1').update('rahul666').digest('hex'),    'Rahul Sharma',       'rahul@email.com',        63000, '9876540011', 'customer'],
  ['BAC012', 'pooja',    crypto.createHash('sha1').update('pooja777').digest('hex'),    'Pooja Reddy',        'pooja@email.com',        87000, '9876540012', 'customer'],
  ['BAC013', 'aditya',   crypto.createHash('sha1').update('aditya888').digest('hex'),   'Aditya Verma',       'aditya@email.com',       59000, '9876540013', 'customer'],
  ['BAC014', 'ishita',   crypto.createHash('sha1').update('ishita999').digest('hex'),   'Ishita Gupta',       'ishita@email.com',       74000, '9876540014', 'customer'],
  ['BAC015', 'varun',    crypto.createHash('sha1').update('varun101').digest('hex'),    'Varun Singh',        'varun@email.com',        52000, '9876540015', 'customer'],
  ['BAC016', 'nisha',    crypto.createHash('sha1').update('nisha202').digest('hex'),    'Nisha Patel',        'nisha@email.com',        96000, '9876540016', 'customer'],
  ['BAC017', 'siddharth',crypto.createHash('sha1').update('siddharth303').digest('hex'),'Siddharth Mehta',    'siddharth@email.com',    81000, '9876540017', 'customer'],
  ['BAC018', 'tanvi',    crypto.createHash('sha1').update('tanvi404').digest('hex'),    'Tanvi Jain',         'tanvi@email.com',        47000, '9876540018', 'customer'],
  ['BAC019', 'harsh',    crypto.createHash('sha1').update('harsh505').digest('hex'),    'Harsh Kumar',        'harsh@email.com',        69000, '9876540019', 'customer'],
  ['BAC020', 'riya',     crypto.createHash('sha1').update('riya606').digest('hex'),     'Riya Agarwal',       'riya@email.com',         93000, '9876540020', 'customer'],
];

users.forEach(u => {
  try {
    db.prepare('INSERT INTO users (account_no,username,password,full_name,email,balance,phone,role) VALUES (?,?,?,?,?,?,?,?)').run(...u);
  } catch(e) {}
});

try {
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN001','BAC002','BAC003',3500,'Rent payment');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN002','BAC003','BAC004',1800,'Grocery shopping');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN003','BAC001','BAC002',5000,'Bonus credit');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN004','BAC004','BAC005',2200,'Freelance payment');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN005','BAC005','BAC006',950,'Book purchase');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN006','BAC006','BAC007',4100,'Web development');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN007','BAC007','BAC008',1650,'Dinner party');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN008','BAC008','BAC009',2800,'Laptop purchase');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN009','BAC009','BAC010',720,'Movie tickets');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN010','BAC010','BAC002',3300,'Consulting fee');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN011','BAC011','BAC012',1450,'Furniture');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN012','BAC012','BAC013',2700,'Car repair');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN013','BAC013','BAC014',890,'Mobile phone');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN014','BAC014','BAC015',3400,'House rent');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN015','BAC015','BAC016',1200,'Gym membership');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN016','BAC016','BAC017',2100,'Online course');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN017','BAC017','BAC018',760,'Restaurant');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN018','BAC018','BAC019',4200,'Freelance work');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN019','BAC019','BAC020',1580,'Shopping');
  db.prepare('INSERT INTO transactions (txn_id,from_account,to_account,amount,note) VALUES (?,?,?,?,?)').run('TXN020','BAC020','BAC011',2950,'Consulting');
  db.prepare('INSERT INTO loans (account_no,amount,status,purpose) VALUES (?,?,?,?)').run('BAC002',150000,'approved','Home renovation');
  db.prepare('INSERT INTO loans (account_no,amount,status,purpose) VALUES (?,?,?,?)').run('BAC003',80000,'approved','Car loan');
  db.prepare('INSERT INTO loans (account_no,amount,status,purpose) VALUES (?,?,?,?)').run('BAC004',50000,'pending','Education');
  db.prepare('INSERT INTO loans (account_no,amount,status,purpose) VALUES (?,?,?,?)').run('BAC006',120000,'approved','Business expansion');
  db.prepare('INSERT INTO loans (account_no,amount,status,purpose) VALUES (?,?,?,?)').run('BAC008',65000,'pending','Medical emergency');
  db.prepare('INSERT INTO loans (account_no,amount,status,purpose) VALUES (?,?,?,?)').run('BAC011',95000,'approved','Home loan');
  db.prepare('INSERT INTO loans (account_no,amount,status,purpose) VALUES (?,?,?,?)').run('BAC014',45000,'pending','Personal loan');
  db.prepare('INSERT INTO loans (account_no,amount,status,purpose) VALUES (?,?,?,?)').run('BAC017',110000,'approved','Business loan');
} catch(e) {}

// Downloadable files dir
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
fs.writeFileSync(path.join(docsDir, 'terms.pdf'), 'NexusBank Branch B Terms & Conditions\nAll transactions are final.\n');
fs.writeFileSync(path.join(docsDir, 'interest_rates.pdf'), 'Interest Rates 2024\nSavings: 4.5%\nFixed: 7.2%\n');
// VULN: Sensitive file accessible
fs.writeFileSync(path.join(__dirname, 'docs', 'internal_audit.txt'), 'INTERNAL AUDIT REPORT - CONFIDENTIAL\nAdmin password: admin@bandra\nDatabase: nexusbank_b.db\nServer IP: 192.168.1.51\nVulnerabilities found: 8\n');

// VULN 1: JWT with weak secret — easily brute-forceable
const JWT_SECRET = 'secret'; // VULN: Extremely weak secret

function createJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig    = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyJWT(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch { return null; }
}

function getSession(req) {
  const token = req.cookies['token_b'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return null;
  return verifyJWT(token);
}

// VULN 3: No rate limiting — brute force possible
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const hashed = crypto.createHash('sha1').update(password || '').digest('hex');
  // VULN: No account lockout, no rate limiting
  const user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username, hashed);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createJWT({ id: user.id, username: user.username, account_no: user.account_no, role: user.role });
  res.cookie('token_b', token, { httpOnly: false }); // VULN: readable by JS
  res.json({ success: true, token, user: { username: user.username, full_name: user.full_name, account_no: user.account_no } });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token_b');
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.prepare('SELECT id,username,full_name,account_no,balance,email,phone,role FROM users WHERE id=?').get(session.id);
  res.json(user);
});

// VULN 2: IDOR — Transaction History
app.get('/api/transactions/:account_no', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  // VULN: No check that account_no matches session user
  const txns = db.prepare('SELECT * FROM transactions WHERE from_account=? OR to_account=? ORDER BY timestamp DESC').all(req.params.account_no, req.params.account_no);
  res.json(txns);
});

// VULN 4: Mass Assignment — Update Profile
app.put('/api/profile', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  const { email, phone, role, balance, credit_score } = req.body;
  // VULN: Accepts role, balance, credit_score from request body
  const updates = {};
  if (email) updates.email = email;
  if (phone) updates.phone = phone;
  if (role) updates.role = role;               // VULN: role escalation
  if (balance) updates.balance = balance;       // VULN: balance manipulation
  if (credit_score) updates.credit_score = credit_score;
  const keys = Object.keys(updates);
  if (keys.length === 0) return res.json({ success: true });
  const setClause = keys.map(k => `${k}=?`).join(',');
  db.prepare(`UPDATE users SET ${setClause} WHERE id=?`).run(...Object.values(updates), session.id);
  res.json({ success: true, updated: updates });
});

// VULN 5: SQL Injection — Search
app.get('/api/search', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  const { q } = req.query;
  if (!q) return res.json([]);
  // VULN: SQL Injection in search
  try {
    const results = db.prepare(`SELECT id,username,full_name,account_no,email FROM users WHERE full_name LIKE '%${q}%' OR account_no LIKE '%${q}%'`).all();
    res.json({ results, query: q }); // VULN: reflects query back
  } catch(e) {
    res.status(400).json({ error: e.message, query: q });
  }
});

// VULN 6: Reflected XSS via search query in JSON response (rendered in React)
// The query is reflected back and React dangerouslySetInnerHTML renders it

// VULN 7: Insecure Direct File Access
app.get('/api/docs/:filename', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  // VULN: Any filename including internal_audit.txt accessible
  const filePath = path.join(docsDir, req.params.filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ filename: req.params.filename, content });
  } catch(e) {
    res.status(404).json({ error: 'File not found' });
  }
});

// VULN 8: Broken Access Control — Admin route only checks role in JWT (tamperable)
app.get('/api/admin/users', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  // VULN: Only checks JWT claim — JWT can be forged with weak secret
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.get('/api/admin/loans', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const loans = db.prepare('SELECT l.*,u.full_name FROM loans l JOIN users u ON l.account_no=u.account_no').all();
  res.json(loans);
});

app.listen(PORT, () => {
  console.log(`🏦 NexusBank Branch B (Bandra) running on http://localhost:${PORT}`);
  console.log(`   Vulnerabilities: JWT Weak Secret, IDOR, No Lockout, Mass Assignment, SQLi, XSS, File Access, BAC`);
});
