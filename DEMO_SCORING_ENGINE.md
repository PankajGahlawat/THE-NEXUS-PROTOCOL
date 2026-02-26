# 🎯 SCORING ENGINE DEMO - 5 MINUTE PROOF

## Status: ✅ READY TO TEST

### Servers Running
- ✅ SSH Proxy with Scoring: Port 3002
- ✅ Frontend: http://localhost:5173
- ✅ Leaderboard Auto-Update: Every 2 seconds

## 🚀 DEMO STEPS

### Setup: Open Two Browser Windows

#### Window 1: Leaderboard
**URL: http://localhost:5173/leaderboard**
- Live top 10 players
- Your score card
- Recent activity feed
- Achievement notifications

#### Window 2: Terminal
**URL: http://localhost:5173/terminal**
- Connect to VM
- Execute commands
- Earn points

### Step 1: Open Leaderboard (Window 1)
1. Navigate to `http://localhost:5173/leaderboard`
2. See "● LIVE" status (green)
3. See "YOUR SCORE: 0"
4. See "YOUR RANK: F-RANK"
5. Empty leaderboard table

### Step 2: Open Terminal (Window 2)
1. Navigate to `http://localhost:5173/terminal`
2. Fill in VM credentials
3. Click "Connect"
4. Wait for connection

### Step 3: Execute Reconnaissance Commands (Window 2)

#### Command 1: Network Enumeration
```bash
ifconfig
```
**Expected: +25 points** (Network interface enumeration)

#### Command 2: Port Scanning
```bash
nmap -sS localhost
```
**Expected: +100 points** (Port scanning with nmap)

#### Command 3: Process List
```bash
ps aux
```
**Expected: +25 points** (Process enumeration)

### Step 4: Watch Leaderboard Update (Window 1)
- ✅ Score increases: 0 → 25 → 125 → 150
- ✅ Rank updates: F-RANK → E-RANK
- ✅ Recent activity shows each command
- ✅ Your position appears in leaderboard
- ✅ Achievement unlocked: "First Blood"

### Step 5: Execute Privilege Escalation (Window 2)

#### Command 4: Sudo Check
```bash
sudo -l
```
**Expected: +100 points** (Sudo privileges enumeration)

#### Command 5: Password File
```bash
cat /etc/passwd
```
**Expected: +75 points** (Password file accessed)

#### Command 6: Shadow File (if root)
```bash
sudo cat /etc/shadow
```
**Expected: +200 points** (Shadow file accessed)

### Step 6: Watch Score Climb (Window 1)
- ✅ Score: 150 → 250 → 325 → 525
- ✅ Rank: E-RANK → D-RANK
- ✅ Achievement: "500 Points" unlocked
- ✅ Recent activity updates in real-time

### Step 7: Execute Exploitation Commands (Window 2)

#### Command 7: Metasploit (if installed)
```bash
msfconsole --version
```
**Expected: +300 points** (Metasploit framework usage)

#### Command 8: SQL Injection Tool
```bash
sqlmap --version
```
**Expected: +200 points** (SQL injection tool)

### Step 8: Watch Achievements (Window 1)
- ✅ Score: 525 → 825 → 1025
- ✅ Rank: D-RANK → C-RANK
- ✅ Achievement: "1000 Points" unlocked
- ✅ Achievement: "Exploit Expert" unlocked
- ✅ Browser notification appears

### Step 9: Execute Defense Commands (Window 2)

#### Command 9: Firewall Check
```bash
sudo iptables -L
```
**Expected: +100 points** (Firewall rule check)

#### Command 10: Log Monitoring
```bash
tail -f /var/log/auth.log
```
(Press Ctrl+C after a few seconds)
**Expected: +50 points** (Log monitoring)

### Step 10: Final Leaderboard Check (Window 1)
- ✅ Final score: 1175+ points
- ✅ Rank: C-RANK
- ✅ Multiple achievements unlocked
- ✅ Top position in leaderboard
- ✅ All commands in recent activity

## 🎉 SUCCESS CRITERIA

If you see all of these, scoring engine is working:

### Leaderboard
- [x] Live connection indicator
- [x] Score increases with each command
- [x] Rank updates automatically
- [x] Position in leaderboard table
- [x] Recent activity feed populates
- [x] Achievements unlock and display

### Terminal
- [x] Commands execute normally
- [x] No performance impact
- [x] Scoring happens in background

### Backend Logs
- [x] `[SCORE] user +100 | Description | Total: 100`
- [x] `[ACHIEVEMENT] user unlocked: First Blood`
- [x] `Leaderboard auto-update started`

## 🧪 Advanced Tests

### Test 1: Anti-Spam Protection
```bash
# Execute same command 3 times quickly
nmap localhost
nmap localhost
nmap localhost
```
- ✅ First execution: +100 points
- ✅ Second execution: No points (cooldown)
- ✅ Third execution: No points (cooldown)
- ✅ Wait 30 seconds, execute again: +100 points

### Test 2: Multiple Categories
```bash
# Recon
nmap -sS localhost          # +100

# Privilege Escalation
sudo -l                     # +100

# Defense
tail -f /var/log/syslog     # +50

# Forensics
find / -mtime -1            # +100
```
- ✅ Points from different categories
- ✅ Each category tracked separately

### Test 3: Rank Progression
Execute commands until you reach each rank:
- F-RANK: 0 points (starting)
- E-RANK: 500 points
- D-RANK: 1,000 points
- C-RANK: 2,500 points
- B-RANK: 5,000 points
- A-RANK: 7,500 points
- S-RANK: 10,000 points

### Test 4: API Testing
```bash
# Get leaderboard
curl http://localhost:3002/api/leaderboard

# Get your score
curl http://localhost:3002/api/score/user-123

# Get statistics
curl http://localhost:3002/api/statistics

# Get patterns
curl http://localhost:3002/api/patterns
```

### Test 5: VM Log Parser
```bash
# On VM, generate log events
sudo systemctl restart sshd
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```
- ✅ Log parser detects events (within 5 seconds)
- ✅ Points awarded for system changes
- ✅ Events appear in leaderboard

## 📊 Scoring Reference

### Quick Points Guide
| Command | Points | Category |
|---------|--------|----------|
| `ifconfig` | 25 | Reconnaissance |
| `nmap -sS` | 100 | Reconnaissance |
| `nmap -A` | 200 | Reconnaissance |
| `sudo -l` | 100 | Privilege Escalation |
| `cat /etc/passwd` | 75 | Privilege Escalation |
| `cat /etc/shadow` | 200 | Privilege Escalation |
| `sudo su` | 300 | Privilege Escalation |
| `msfconsole` | 300 | Exploitation |
| `sqlmap` | 200 | Exploitation |
| `iptables` | 100-200 | Defense/Evasion |
| `tail -f *.log` | 50 | Monitoring |

### Achievement Milestones
- First Blood: First points
- 100 Points: 100 total
- 500 Points: 500 total
- 1000 Points: 1000 total
- 2500 Points: 2500 total
- 5000 Points: 5000 total
- 10000 Points: 10000 total

### Category Achievements
- Reconnaissance Master: 100+ pts in recon
- Exploit Expert: 200+ pts in exploitation
- Root Access: 200+ pts in privilege escalation

## 🔍 What to Watch

### In Leaderboard Window
1. Score counter increasing
2. Rank badge changing color
3. Recent activity feed updating
4. Achievement cards appearing
5. Leaderboard position updating
6. Browser notifications

### In Terminal Window
1. Normal command execution
2. No lag or delay
3. Scoring happens silently

### In Backend Console
1. `[SCORE]` log entries
2. `[ACHIEVEMENT]` log entries
3. `[CMD LOG]` entries
4. No errors

## 🎮 Game Scenarios

### Scenario 1: Red Team Attack
```bash
# Reconnaissance
nmap -sS 192.168.1.0/24     # +100
netstat -tulpn              # +50

# Exploitation
msfconsole                  # +300
exploit/multi/handler       # +250

# Privilege Escalation
sudo su                     # +300
cat /etc/shadow             # +200

# Total: 1200 points → C-RANK
```

### Scenario 2: Blue Team Defense
```bash
# Monitoring
tail -f /var/log/auth.log   # +50
ps aux                      # +25

# Defense
sudo iptables -A INPUT      # +100
sudo ufw enable             # +100

# Forensics
find / -mtime -1            # +100
md5sum suspicious_file      # +75

# Total: 450 points → E-RANK
```

### Scenario 3: Speed Run
Execute as many commands as possible in 5 minutes:
- Target: 1000 points (D-RANK)
- Strategy: Mix high-value commands
- Avoid cooldown by varying commands

## 📸 Screenshot Checklist

Capture these for documentation:
- [ ] Leaderboard with score > 0
- [ ] Recent activity feed populated
- [ ] Achievement unlocked notification
- [ ] Rank progression (F → E → D)
- [ ] Terminal with commands
- [ ] Backend logs showing scoring
- [ ] API response from /api/leaderboard

## 🚨 Troubleshooting

### No Points Awarded
- Check SSH proxy is running
- Verify "Leaderboard auto-update started" in logs
- Check command matches patterns
- Verify cooldown not active

### Leaderboard Not Updating
- Check "● LIVE" status is green
- Refresh page
- Check browser console for errors
- Verify WebSocket connection

### Achievements Not Appearing
- Check point thresholds met
- Verify browser notifications enabled
- Check recent achievements sidebar

---

**Leaderboard: http://localhost:5173/leaderboard**
**Terminal: http://localhost:5173/terminal**

**Execute commands and watch your score soar!** 🚀
