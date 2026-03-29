# BLUE TEAM CHEAT SHEET — Vidyatech Round 1
# Monitor Panel: http://localhost:8080

═══════════════════════════════════════════════════════════════
 HOW TO PATCH
═══════════════════════════════════════════════════════════════

1. Open http://localhost:8080
2. Watch the Live Attack Feed for incoming attacks
3. Click on the vulnerability you want to patch
4. Type your regex in the input box
5. Click VALIDATE — it tests against real attack samples
6. If all tests pass, click ACTIVATE PATCH
7. The patch goes live instantly on http://localhost:5000
8. Attacks on that vuln now show as BLOCKED (green) in the feed

═══════════════════════════════════════════════════════════════
 ALL 15 PATCHES — READY TO USE
═══════════════════════════════════════════════════════════════

EASY (10 pts each)

1.  SQL Injection          sqli_login
    Regex: '\s*OR\s*'|--|UNION|SELECT
    Blocks: ' OR '1'='1'--  UNION SELECT  admin'--

2.  Stored XSS             stored_xss
    Regex: <script|javascript:|onerror=|onload=|<img
    Blocks: <script>alert(1)</script>  <img src=x onerror=alert(1)>

3.  Default Credentials    default_creds
    Regex: admin123|faculty2024|anjali@123|kiran2024
    Blocks: FAC001/admin123  FAC002/faculty2024

4.  Directory Traversal    dir_traversal
    Regex: \.\.\/|%2e%2e|%2f|\.\.
    Blocks: ../../etc/passwd  %2e%2e%2fetc%2fpasswd

5.  Sensitive Data Exposure  data_exposure
    Regex: /\.env|/robots\.txt|/backup|\.sql
    Blocks: GET /.env  GET /robots.txt  /backup/db.sql

6.  Hardcoded Admin Login  hardcoded_admin
    Regex: admin@123|password=admin@123
    Blocks: username=admin&password=admin@123

7.  File Upload Bypass     doc_upload_bypass
    Regex: \.(php|exe|sh|js|html|phtml|py)$
    Blocks: shell.php  malware.exe  backdoor.py

8.  Clickjacking           clickjacking_fix
    Regex: /login|/dashboard|/admin
    Blocks: GET /login  GET /dashboard  GET /admin/login

9.  Weak Password          weak_password
    Regex: new_password=.{1,7}(&|$)
    Blocks: new_password=1  new_password=abc  new_password=1234567

10. CSRF Email Hijack      csrf_email
    Regex: POST /account/update-email
    Blocks: POST /account/update-email with any body

INTERMEDIATE (20 pts each)

11. JWT alg:none           jwt_alg_none
    Regex: alg.*none|eyJ.*none
    Blocks: eyJhbGciOiJub25lIn0...  "alg":"none"

12. IDOR                   idor
    Regex: /api/result/[2-9]|/api/result/[0-9]{2,}
    Blocks: /api/result/3  /api/result/99
    Allows: /api/result/1  /api/result/2

13. Command Injection      cmd_injection
    Regex: ;|\||&&|`|\$\(|whoami|cat |ls
    Blocks: vidyatech.edu; whoami  google.com && cat /etc/passwd

ADVANCED (30 pts each)

14. YAML RCE               yaml_rce
    Regex: !!python/object|python/object|unsafe_load
    Blocks: !!python/object/apply:os.system ["whoami"]

15. Debug + SSRF           block_debug
    Regex: /debug|127\.0\.0\.1|169\.254
    Blocks: GET /debug  url=http://127.0.0.1:5000  url=http://169.254.169.254

═══════════════════════════════════════════════════════════════
 ATTACK SEVERITY COLORS IN MONITOR
═══════════════════════════════════════════════════════════════

  RED    = CRITICAL  (Command Injection, YAML RCE, SSRF, File Upload)
  ORANGE = HIGH      (SQL Injection, XSS, JWT, Debug, Hardcoded Admin)
  YELLOW = MEDIUM    (IDOR, CSRF, Default Creds, Clickjacking)
  GREY   = LOW       (Data Exposure, Patch events)

  GREEN  = BLOCKED   (your patch stopped the attack)
  RED    = HIT       (attack succeeded — patch it fast!)

═══════════════════════════════════════════════════════════════
 REGEX TIPS
═══════════════════════════════════════════════════════════════

  |     means OR           e.g.  admin123|faculty2024
  \.    means literal dot  e.g.  \.env  matches .env
  .*    means anything     e.g.  alg.*none  matches "alg":"none"
  $     means end of line  e.g.  \.php$  matches only at end
  {1,7} means 1 to 7 chars

  The monitor tests your regex BEFORE activating it.
  If it blocks safe traffic it will warn you.
  No penalty for wrong attempts — keep trying!

═══════════════════════════════════════════════════════════════
 PRIORITY ORDER — PATCH THESE FIRST
═══════════════════════════════════════════════════════════════

  1st  YAML RCE (#14)           30 pts  easiest to exploit
  2nd  Command Injection (#13)  20 pts  very dangerous
  3rd  Debug + SSRF (#15)       30 pts  leaks secret key
  4th  SQL Injection (#1)       10 pts  most common attack
  5th  Default Credentials (#3) 10 pts  instant admin access
  6th  Hardcoded Admin (#6)     10 pts  instant admin access
  7th  JWT alg:none (#11)       20 pts  account takeover
  8th  IDOR (#12)               20 pts  data leak
  9th  Stored XSS (#2)          10 pts  affects all users
  10th Directory Traversal (#4) 10 pts  file read
  Then patch remaining Easy vulns in any order

═══════════════════════════════════════════════════════════════
 SCORING
═══════════════════════════════════════════════════════════════

  Easy (1-10)          10 pts each   max 100 pts
  Intermediate (11-13) 20 pts each   max  60 pts
  Advanced (14-15)     30 pts each   max  60 pts
  TOTAL MAX                          220 pts

  Each patch you activate = points for Blue Team
  Each attack that hits (not blocked) = points for Red Team
  Patch fast, patch correctly!
