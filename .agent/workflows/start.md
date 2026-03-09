---
description: Start all Nexus Protocol servers (main game, NexusBank branches, NexusCore)
---

# Start Nexus Protocol - All Servers

This workflow starts all 10 servers needed for the full Nexus Protocol experience.

// turbo-all

## Steps

1. Stop any existing servers on the required ports
```powershell
$ports = @(3000, 3001, 3002, 3003, 5173, 5175, 5176, 5177, 7007); foreach ($port in $ports) { $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($connections) { foreach ($conn in $connections) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue } } }
```

2. Start Main Backend (Port 3000)
```powershell
node index_enhanced.js
```
Run from: `d:\THE-NEXUS-PROTOCOL\backend`

3. Start Main Frontend (Port 5173)
```powershell
npm run dev
```
Run from: `d:\THE-NEXUS-PROTOCOL\frontend`

4. Start Branch A Backend (Port 3001)
```powershell
node server.js
```
Run from: `d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-a\backend`

5. Start Branch B Backend (Port 3002)
```powershell
node server.js
```
Run from: `d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-b\backend`

6. Start Branch C Backend (Port 3003)
```powershell
node server.js
```
Run from: `d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-c\backend`

7. Start Branch A Frontend (Port 5175)
```powershell
npx vite --port 5175
```
Run from: `d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-a\frontend`

8. Start Branch B Frontend (Port 5176)
```powershell
npx vite --port 5176
```
Run from: `d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-b\frontend`

9. Start Branch C Frontend (Port 5177)
```powershell
npx vite --port 5177
```
Run from: `d:\THE-NEXUS-PROTOCOL\rounds\round1\NEXXUS\nexusbank-branches\branch-c\frontend`

10. Start NexusCore Round 2 (Port 7007)
```powershell
python app.py
```
Run from: `d:\THE-NEXUS-PROTOCOL\rounds\round2\nexuscore`

## URLs

| Service | URL |
|---------|-----|
| Main Game | http://localhost:5173 |
| Branch A (Andheri) | http://localhost:5175 |
| Branch B (Bandra) | http://localhost:5176 |
| Branch C (Colaba) | http://localhost:5177 |
| NexusCore | http://localhost:7007 |

## Login Credentials

**Main Game:** RedTeam / redteam123 or BlueTeam / blueteam123

**Branch A:** alice / password  
**Branch B:** priya / priya123  
**Branch C:** kavya / kavya123  
**NexusCore:** demo / demo123
