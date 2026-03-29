# Vidyatech CTF — Round 1 Complete Guide

## What is Vidyatech?

Vidyatech is a **fake university website** running at `http://localhost:5000`.
It looks like a real university portal — login, notices, results, file uploads — but it has **15 hidden security holes (vulnerabilities)** built into it on purpose.

- **Red Team** tries to exploit the vulnerabilities
- **Blue Team** tries to detect and patch them in real time

---

## How to Start

| Service | URL | What it is |
|---|---|---|
| Vidyatech Site | http://localhost:5000 | The vulnerable university website |
| Monitor Panel | http://localhost:8080 | Blue Team live attack monitor |

Run `start-all.bat` from the project root to start everything.

---

## The 15 Vulnerabilities

### EASY — 10 Vulnerabilities

---

**1. SQL Injection**
- **Endpoint:** `POST /login`
- **What it is:** The login form does not clean user input. You can type SQL code instead of a password and trick the database.
- **Red Team attack:** In the Roll No field, type `' OR '1'='1'--`
  This bypasses the password check and logs you in without a real password.
- **Blue Team patch regex:** `'\s*OR\s*'|--|UNION|SELECT`

---

**2. Stored XSS**
- **Endpoint:** `POST /notices/post`
- **What it is:** The notice board saves whatever you type without removing dangerous HTML. When others view the notice, the script runs in their browser.
- **Red Team attack:** Post a notice with content `<script>alert(document.cookie)</script>`
  This steals the session cookie of anyone who reads the notice.
- **Blue Team patch regex:** `<script|javascript:|onerror=|onload=|<img`

---

**3. Default Credentials**
- **Endpoint:** `POST /staff/login`
- **What it is:** Staff accounts still use factory-default passwords that were never changed.
- **Red Team attack:** Login with Employee ID `FAC001` and password `admin123`
  Gets full admin access to the staff panel.
- **Blue Team patch regex:** `admin123|faculty2024|anjali@123|kiran2024`

---

**4. Directory Traversal**
- **Endpoint:** `GET /resources/download?file=`
- **What it is:** The file download does not check if you are trying to escape the allowed folder using `../` sequences.
- **Red Team attack:** Visit `?file=../../etc/passwd` or `?file=../data/db_backup_jan2024.sql`
  Reads any file on the server.
- **Blue Team patch regex:** `\.\.\/|%2e%2e|%2f|\.\.`

---

**5. Sensitive Data Exposure**
- **Endpoint:** `/robots.txt` and `/.env`
- **What it is:** The site accidentally exposes secret files containing passwords and API keys.
- **Red Team attack:** Visit `/robots.txt` to see hidden paths and credentials.
  Visit `/.env` to see the database password and Flask secret key.
- **Blue Team patch regex:** `/\.env|/robots\.txt|/backup|\.sql`

---

**6. Hardcoded Admin Login**
- **Endpoint:** `POST /admin/login`
- **What it is:** There is a separate admin login with a password hardcoded directly in the database that was never changed.
- **Red Team attack:** Login with username `admin` and password `admin@123`
- **Blue Team patch regex:** `admin@123|password=admin@123`

---

**7. Unrestricted File Upload**
- **Endpoint:** `POST /dashboard/upload-doc`
- **What it is:** The upload form says PDF only but does not actually check the file type on the server side.
- **Red Team attack:** Upload a file named `shell.php` or `malware.exe` — the server accepts it.
- **Blue Team patch regex:** `\.(php|exe|sh|js|html|phtml|py)$`

---

**8. Clickjacking**
- **Endpoint:** Any page (missing `X-Frame-Options` header)
- **What it is:** Pages can be embedded inside invisible iframes on attacker websites to trick users into clicking things they did not intend to.
- **Red Team attack:** Embed the login page in an iframe on a fake site. Users think they are clicking something safe but are actually clicking on Vidyatech.
- **Blue Team patch regex:** `/login|/dashboard|/admin`

---

**9. Weak Password Policy**
- **Endpoint:** `POST /account/change-password`
- **What it is:** The site allows passwords as short as 1 character, making accounts easy to brute-force.
- **Red Team attack:** Change password to `1` or `abc` — the server accepts it.
- **Blue Team patch regex:** `new_password=.{1,7}(&|$)`

---

**10. CSRF — Email Hijack**
- **Endpoint:** `POST /account/update-email`
- **What it is:** The email update form does not verify the request actually came from the real logged-in user.
- **Red Team attack:** Trick a logged-in user into visiting a malicious page that silently sends a POST request to change their email to the attacker's email.
- **Blue Team patch regex:** `POST /account/update-email`

---

### INTERMEDIATE — 3 Vulnerabilities

---

**11. JWT alg:none**
- **Endpoint:** `GET /api/me`
- **What it is:** The API accepts login tokens (JWTs) where the signature verification is disabled by setting the algorithm to "none".
- **Red Team attack:** Forge a JWT token with `"alg":"none"` in the header. The server accepts it without checking the signature, giving access to any account.
- **Blue Team patch regex:** `alg.*none|eyJ.*none`

---

**12. IDOR (Insecure Direct Object Reference)**
- **Endpoint:** `GET /api/result/<id>`
- **What it is:** The results API does not check if the result record belongs to the logged-in student. Any student can read any other student's results.
- **Red Team attack:** Login as student VTU2021001, then visit `/api/result/3`, `/api/result/4`, `/api/result/5` — reads every other student's grades.
- **Blue Team patch regex:** `/api/result/[2-9]|/api/result/[0-9]{2,}`

---

**13. Command Injection**
- **Endpoint:** `POST /tools/nslookup`
- **What it is:** The DNS lookup tool passes your input directly to the operating system shell without sanitizing it.
- **Red Team attack:** In the domain field type `vidyatech.edu; whoami` or `google.com && cat /etc/passwd`
  This runs any command on the server.
- **Blue Team patch regex:** `;|\||&&|` `` ` `` `|\$\(|whoami|cat |ls `

---

### ADVANCED — 2 Vulnerabilities

---

**14. YAML RCE (Remote Code Execution)**
- **Endpoint:** `POST /tools/yaml-import`
- **What it is:** The YAML import tool uses Python's unsafe `yaml.load()` function which can execute code hidden inside YAML data.
- **Red Team attack:** Submit YAML containing:
  ```
  !!python/object/apply:os.system ["whoami"]
  ```
  This runs arbitrary code on the server.
- **Blue Team patch regex:** `!!python/object|python/object|unsafe_load`

---

**15. Debug Endpoint + SSRF**
- **Endpoint:** `GET /debug` and `POST /tools/fetch-url`
- **What it is:** Two vulnerabilities combined. `/debug` leaks the Flask secret key. The URL fetcher can be pointed at internal servers (SSRF).
- **Red Team attack:**
  - Visit `/debug` to get the Flask secret key, then forge session cookies for any user
  - Submit `url=http://127.0.0.1:5000/api/internal` to access internal APIs not meant to be public
- **Blue Team patch regex:** `/debug|127\.0\.0\.1|169\.254`

---

## How the Game Works — Step by Step

### Red Team (Attackers)

1. Open `http://localhost:5000` — the Vidyatech university site
2. Explore the site and find the vulnerable pages listed above
3. Try the attacks
4. Every **successful** exploit = points for Red Team
5. If Blue Team has already patched a vulnerability, your attack gets **BLOCKED** and you score nothing for it

### Blue Team (Defenders)

1. Open `http://localhost:8080` — the Monitor Panel
2. Watch the **Live Attack Feed** — every request hitting the site appears in real time
   - RED = Critical severity
   - ORANGE = High severity
   - YELLOW = Medium severity
   - GREY = Low severity
3. When you see an attack pattern, go to the **Patch Submission** panel
4. Find the vulnerability being attacked (e.g. SQL Injection)
5. Write a **regex pattern** that matches the attack string but NOT normal safe traffic
6. The monitor automatically tests your regex against sample attacks and safe requests before activating
7. If your regex passes all tests, the patch is **activated instantly** on the live site
8. Future attacks on that vulnerability now show as green **BLOCKED** in the feed
9. You can **revert** a patch at any time if it is accidentally blocking legitimate traffic

---

## Scoring

| Level | Count | Points Each | Total |
|---|---|---|---|
| Easy | 10 | 10 pts | 100 pts |
| Intermediate | 3 | 20 pts | 60 pts |
| Advanced | 2 | 30 pts | 60 pts |
| **Total** | **15** | | **220 pts** |

- Red Team earns points for each **successful unpatched** exploit
- Blue Team earns points for each **correctly patched** vulnerability
- The team with the most points at the end of the round wins

---

## Quick Reference Table

| # | Name | Endpoint | Level | Attack Example | Patch Regex |
|---|---|---|---|---|---|
| 1 | SQL Injection | POST /login | Easy | `' OR '1'='1'--` | `'\s*OR\s*'\|--\|UNION` |
| 2 | Stored XSS | POST /notices/post | Easy | `<script>alert(1)</script>` | `<script\|onerror=` |
| 3 | Default Credentials | POST /staff/login | Easy | FAC001 / admin123 | `admin123\|faculty2024` |
| 4 | Directory Traversal | GET /resources/download | Easy | `?file=../../etc/passwd` | `\.\./\|%2e%2e` |
| 5 | Sensitive Data Exposure | /robots.txt /.env | Easy | Visit /.env | `/\.env\|/robots\.txt` |
| 6 | Hardcoded Admin | POST /admin/login | Easy | admin / admin@123 | `admin@123` |
| 7 | File Upload Bypass | POST /dashboard/upload-doc | Easy | Upload shell.php | `\.(php\|exe\|sh)$` |
| 8 | Clickjacking | Any page | Easy | Iframe embed | `/login\|/dashboard` |
| 9 | Weak Password | POST /account/change-password | Easy | password=1 | `new_password=.{1,7}` |
| 10 | CSRF | POST /account/update-email | Easy | Forged POST | `POST /account/update-email` |
| 11 | JWT alg:none | GET /api/me | Intermediate | Forged JWT alg:none | `alg.*none` |
| 12 | IDOR | GET /api/result/id | Intermediate | /api/result/3 | `/api/result/[2-9]` |
| 13 | Command Injection | POST /tools/nslookup | Intermediate | `; whoami` | `;\|\|&&` |
| 14 | YAML RCE | POST /tools/yaml-import | Advanced | `!!python/object/apply:os.system` | `!!python/object` |
| 15 | Debug + SSRF | GET /debug POST /tools/fetch-url | Advanced | Visit /debug | `/debug\|127\.0\.0\.1` |
