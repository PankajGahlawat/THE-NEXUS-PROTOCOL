/**
 * NexusBank — Branch C (Colaba)
 * Vulnerabilities:
 * 1. Cookie Manipulation — Tamper role/balance in cookie
 * 2. IDOR — Loan Details
 * 3. Broken Auth — Default Credentials
 * 4. API Enumeration — Predictable IDs
 * 5. SQL Injection — Profile Update
 * 6. DOM-Based XSS — via URL hash
 * 7. Path Traversal — Document Access
 * 8. CSRF — Profile Update
 */

const express = require('express');
const SimpleDB = require('./simple-db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3003;

app.use(cors({ origin: 'http://localhost:5175', credentials: true }));
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
    nominee TEXT,
    dob TEXT
  );
  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_no TEXT,
    full_name TEXT,
    amount REAL,
    emi REAL,
    status TEXT,
    purpose TEXT,
    guarantor TEXT,
    approved_by TEXT
  );
  CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_no TEXT,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'open',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// VULN 3: Default/hardcoded credentials
const users = [
  ['CAC001', 'admin',     'admin',        crypto.createHash('md5').update('admin').digest('hex'),      'Admin Colaba',       'admin@nexusbank.com',   999999, '9876530001', 'admin',    'N/A',              '1980-01-01'],
  ['CAC002', 'kavya',     'kavya123',     crypto.createHash('md5').update('kavya123').digest('hex'),   'Kavya Reddy',        'kavya@email.com',        78000, '9876530002', 'customer', 'Ram Reddy',        '1995-05-15'],
  ['CAC003', 'suresh',    'suresh456',    crypto.createHash('md5').update('suresh456').digest('hex'),  'Suresh Iyer',        'suresh@email.com',       92000, '9876530003', 'customer', 'Leela Iyer',       '1988-11-20'],
  ['CAC004', 'pooja',     'pooja789',     crypto.createHash('md5').update('pooja789').digest('hex'),   'Pooja Verma',        'pooja@email.com',        69000, '9876530004', 'customer', 'Raj Verma',        '1997-03-08'],
  ['CAC005', 'manager',   'manager123',   crypto.createHash('md5').update('manager123').digest('hex'), 'Branch Manager',     'manager@nexusbank.com',  150000,'9876530005', 'manager',  'N/A',              '1975-07-22'],
  ['CAC006', 'ravi',      'ravi111',      crypto.createHash('md5').update('ravi111').digest('hex'),    'Ravi Shankar',       'ravi@email.com',         85000, '9876530006', 'customer', 'Lakshmi Shankar',  '1992-08-14'],
  ['CAC007', 'neha',      'neha222',      crypto.createHash('md5').update('neha222').digest('hex'),    'Neha Gupta',         'neha@email.com',         61000, '9876530007', 'customer', 'Amit Gupta',       '1994-12-25'],
  ['CAC008', 'amit',      'amit333',      crypto.createHash('md5').update('amit333').digest('hex'),    'Amit Malhotra',      'amit@email.com',         74000, '9876530008', 'customer', 'Priya Malhotra',   '1990-03-18'],
  ['CAC009', 'sanjay',    'sanjay444',    crypto.createHash('md5').update('sanjay444').digest('hex'),  'Sanjay Kumar',       'sanjay@email.com',       56000, '9876530009', 'customer', 'Sunita Kumar',     '1987-06-30'],
  ['CAC010', 'priyanka',  'priyanka555',  crypto.createHash('md5').update('priyanka555').digest('hex'),'Priyanka Chopra',    'priyanka@email.com',     98000, '9876530010', 'customer', 'Madhu Chopra',     '1993-07-18'],
  ['CAC011', 'deepak',    'deepak666',    crypto.createHash('md5').update('deepak666').digest('hex'),  'Deepak Sharma',      'deepak@email.com',       83000, '9876530011', 'customer', 'Rekha Sharma',     '1991-04-22'],
  ['CAC012', 'anjali',    'anjali777',    crypto.createHash('md5').update('anjali777').digest('hex'),  'Anjali Desai',       'anjali@email.com',       57000, '9876530012', 'customer', 'Ramesh Desai',     '1996-09-10'],
  ['CAC013', 'vishal',    'vishal888',    crypto.createHash('md5').update('vishal888').digest('hex'),  'Vishal Patel',       'vishal@email.com',       94000, '9876530013', 'customer', 'Nita Patel',       '1989-11-05'],
  ['CAC014', 'shruti',    'shruti999',    crypto.createHash('md5').update('shruti999').digest('hex'),  'Shruti Joshi',       'shruti@email.com',       66000, '9876530014', 'customer', 'Vijay Joshi',      '1998-02-14'],
  ['CAC015', 'manish',    'manish101',    crypto.createHash('md5').update('manish101').digest('hex'),  'Manish Agarwal',     'manish@email.com',       79000, '9876530015', 'customer', 'Sunita Agarwal',   '1986-07-28'],
  ['CAC016', 'swati',     'swati202',     crypto.createHash('md5').update('swati202').digest('hex'),   'Swati Kulkarni',     'swati@email.com',        51000, '9876530016', 'customer', 'Prakash Kulkarni', '1999-12-03'],
  ['CAC017', 'rajesh',    'rajesh303',    crypto.createHash('md5').update('rajesh303').digest('hex'),  'Rajesh Nair',        'rajesh@email.com',       88000, '9876530017', 'customer', 'Meena Nair',       '1985-05-19'],
  ['CAC018', 'megha',     'megha404',     crypto.createHash('md5').update('megha404').digest('hex'),   'Megha Singh',        'megha@email.com',        45000, '9876530018', 'customer', 'Arun Singh',       '2000-08-25'],
  ['CAC019', 'nikhil',    'nikhil505',    crypto.createHash('md5').update('nikhil505').digest('hex'),  'Nikhil Rao',         'nikhil@email.com',       72000, '9876530019', 'customer', 'Kavita Rao',       '1990-01-12'],
  ['CAC020', 'preeti',    'preeti606',    crypto.createHash('md5').update('preeti606').digest('hex'),  'Preeti Malhotra',    'preeti@email.com',       96000, '9876530020', 'customer', 'Sunil Malhotra',   '1994-06-08'],
];

users.forEach(([acc, user, plainPass, hashedPass, name, email, bal, phone, role, nominee, dob]) => {
  try {
    db.prepare('INSERT INTO users (account_no,username,password,full_name,email,balance,phone,role,nominee,dob) VALUES (?,?,?,?,?,?,?,?,?,?)').run(acc, user, hashedPass, name, email, bal, phone, role, nominee, dob);
  } catch(e) {}
});

// Loan data — VULN 2: Sequential IDs for IDOR
try {
  db.prepare('INSERT INTO loans (account_no,full_name,amount,emi,status,purpose,guarantor,approved_by) VALUES (?,?,?,?,?,?,?,?)').run('CAC002','Kavya Reddy',250000,6500,'approved','Home Loan','Ram Reddy','Branch Manager');
  db.prepare('INSERT INTO loans (account_no,full_name,amount,emi,status,purpose,guarantor,approved_by) VALUES (?,?,?,?,?,?,?,?)').run('CAC003','Suresh Iyer',180000,4800,'approved','Car Loan','Leela Iyer','Branch Manager');
  db.prepare('INSERT INTO loans (account_no,full_name,amount,emi,status,purpose,guarantor,approved_by) VALUES (?,?,?,?,?,?,?,?)').run('CAC004','Pooja Verma',95000,3200,'pending','Education','Raj Verma','Pending Review');
  db.prepare('INSERT INTO loans (account_no,full_name,amount,emi,status,purpose,guarantor,approved_by) VALUES (?,?,?,?,?,?,?,?)').run('CAC001','Admin Account',999999,0,'approved','Internal','N/A','System');
  db.prepare('INSERT INTO loans (account_no,full_name,amount,emi,status,purpose,guarantor,approved_by) VALUES (?,?,?,?,?,?,?,?)').run('CAC006','Ravi Shankar',150000,4200,'approved','Business Loan','Lakshmi Shankar','Branch Manager');
  db.prepare('INSERT INTO loans (account_no,full_name,amount,emi,status,purpose,guarantor,approved_by) VALUES (?,?,?,?,?,?,?,?)').run('CAC007','Neha Gupta',75000,2500,'pending','Personal Loan','Amit Gupta','Under Review');
  db.prepare('INSERT INTO loans (account_no,full_name,amount,emi,status,purpose,guarantor,approved_by) VALUES (?,?,?,?,?,?,?,?)').run('CAC008','Amit Malhotra',120000,3800,'approved','Home Renovation','Priya Malhotra','Branch Manager');
} catch(e) {}

// Support tickets
try {
  db.prepare('INSERT INTO support_tickets (account_no,subject,message) VALUES (?,?,?)').run('CAC002','ATM Issue','My ATM card is not working at Branch C ATM');
  db.prepare('INSERT INTO support_tickets (account_no,subject,message) VALUES (?,?,?)').run('CAC003','Balance Discrepancy','My balance seems incorrect after last transaction');
  db.prepare('INSERT INTO support_tickets (account_no,subject,message) VALUES (?,?,?)').run('CAC004','Loan Status','When will my education loan be approved?');
  db.prepare('INSERT INTO support_tickets (account_no,subject,message) VALUES (?,?,?)').run('CAC006','Cheque Book Request','Need new cheque book for my account');
  db.prepare('INSERT INTO support_tickets (account_no,subject,message) VALUES (?,?,?)').run('CAC007','Online Banking','Unable to login to online banking portal');
  db.prepare('INSERT INTO support_tickets (account_no,subject,message) VALUES (?,?,?)').run('CAC008','Credit Card','Want to apply for credit card');
} catch(e) {}

// Document directory
const docsDir = path.join(__dirname, 'documents');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
fs.writeFileSync(path.join(docsDir, 'loan_guide.txt'), 'NexusBank Loan Application Guide\nStep 1: Fill application\nStep 2: Submit documents\nStep 3: Wait for approval\n');
fs.writeFileSync(path.join(docsDir, 'interest_chart.txt'), 'Interest Rate Chart\nPersonal Loan: 12.5%\nHome Loan: 8.75%\nCar Loan: 9.25%\n');
fs.writeFileSync(path.join(__dirname, 'server_config.txt'), 'SERVER CONFIG - RESTRICTED\nDB: nexusbank_c.db\nAdmin: admin/admin\nManager: manager/manager123\nInternal Network: 192.168.1.52\nBackup: /home/nexus/backup/\n');

// VULN 1: Cookie manipulation — session stored in readable/writable cookie
function createSession(user) {
  // VULN: Role and balance stored in cookie — easily tampered
  const data = { id: user.id, username: user.username, account_no: user.account_no, role: user.role, balance: user.balance };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function getSession(req) {
  const token = req.cookies['session_c'];
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch { return null; }
}

// VULN 3: Default creds — admin/admin works!
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const hashed = crypto.createHash('md5').update(password || '').digest('hex');
  const user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username, hashed);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createSession(user);
  res.cookie('session_c', token, { httpOnly: false }); // VULN: JS readable
  res.json({ success: true, user: { username: user.username, full_name: user.full_name, account_no: user.account_no } });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('session_c');
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  // VULN: Trusts cookie data directly — no DB verification of role/balance
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(session.id);
  res.json({ ...user, cookie_role: session.role, cookie_balance: session.balance });
});

// VULN 2: IDOR — Loan Details (Sequential IDs)
app.get('/api/loan/:id', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  // VULN: No ownership check — try /loan/1, /loan/2, /loan/3, /loan/4
  const loan = db.prepare('SELECT * FROM loans WHERE id=?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  res.json(loan);
});

// VULN 4: API Enumeration — Predictable ticket IDs
app.get('/api/ticket/:id', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  // VULN: No ownership check — sequential IDs easily enumerable
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id=?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

app.get('/api/my-loans', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  const loans = db.prepare('SELECT * FROM loans WHERE account_no=?').all(session.account_no);
  res.json(loans);
});

// VULN 5: SQL Injection — Profile Update
app.post('/api/profile/update', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  const { email, phone, nominee } = req.body;
  // VULN: String interpolation in UPDATE query
  const query = `UPDATE users SET email='${email}', phone='${phone}', nominee='${nominee}' WHERE id=${session.id}`;
  try {
    db.prepare(query).run();
    res.json({ success: true });
  } catch(e) {
    res.status(400).json({ error: e.message }); // VULN: Exposes SQL error
  }
});

// VULN 7: Path Traversal — Document Download
app.get('/api/document', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  const { name } = req.query;
  // VULN: No path sanitization
  const filePath = path.join(docsDir, name);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ name, content });
  } catch(e) {
    res.status(404).json({ error: 'Document not found: ' + e.message });
  }
});

// VULN 8: CSRF — Profile Update (no token)
app.post('/api/profile/nominee', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  // VULN: No CSRF token — cross-origin POST can change nominee
  const { nominee, email } = req.body;
  db.prepare('UPDATE users SET nominee=?, email=? WHERE id=?').run(nominee || '', email || '', session.id);
  res.json({ success: true, message: 'Nominee updated successfully' });
});

app.get('/api/announcements', (req, res) => {
  res.json([
    { id: 1, title: 'New Branch Hours', content: 'Branch C is now open 9AM-6PM on weekdays.' },
    { id: 2, title: 'Loan Mela', content: 'Special interest rates this month! Apply now.' },
    { id: 3, title: 'Security Alert', content: 'Never share your PIN or OTP with anyone.' },
  ]);
});

app.listen(PORT, () => {
  console.log(`🏦 NexusBank Branch C (Colaba) running on http://localhost:${PORT}`);
  console.log(`   Vulnerabilities: Cookie Manipulation, IDOR, Default Creds, API Enum, SQLi, DOM XSS, Path Traversal, CSRF`);
});
