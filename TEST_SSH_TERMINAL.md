# SSH Terminal Proof of Concept - Test Guide

## What We Built
- SSH proxy server (backend/ssh-proxy.js) using ssh2 + Socket.io
- Browser terminal component (frontend/src/components/Terminal/SSHTerminal.tsx) using Xterm.js
- Real-time bidirectional communication between browser and VM

## Architecture
```
Browser (Xterm.js) <--Socket.io--> SSH Proxy (Node.js) <--SSH2--> VM
```

## Testing Steps

### 1. Start SSH Proxy Server
```bash
cd backend
npm run ssh-proxy
```
Expected output: `SSH Proxy Server running on port 3002`

### 2. Start Frontend (in separate terminal)
```bash
cd frontend
npm run dev
```

### 3. Access Terminal
Navigate to: `http://localhost:5173/terminal`

### 4. Connect to VM
Fill in the connection form:
- Host: Your VM IP (e.g., 192.168.1.100)
- Port: 22
- Username: root (or your VM username)
- Password: Your VM password

Click "Connect"

### 5. Proof of Concept Test
Once connected, type:
```bash
whoami
```

Expected response: `root` (or your username)

This proves:
✓ Browser terminal is working (Xterm.js)
✓ WebSocket connection is established (Socket.io)
✓ SSH connection to VM is successful (ssh2)
✓ Bidirectional communication works (input/output)
✓ Core concept is validated

### 6. Additional Tests
```bash
# Test command execution
ls -la

# Test directory navigation
cd /tmp
pwd

# Test interactive commands
top
# Press 'q' to quit

# Test output streaming
ping -c 5 8.8.8.8
```

## What This Validates
1. ✓ SSH2 library can connect to VMs
2. ✓ Xterm.js renders terminal in browser
3. ✓ Socket.io handles real-time communication
4. ✓ Terminal input/output works bidirectionally
5. ✓ Core architecture is sound

## Next Steps (After Proof Works)
- Add authentication/authorization
- Implement session management
- Add connection pooling
- Integrate with game missions
- Add terminal recording/replay
- Implement multi-VM support
- Add security hardening

## Troubleshooting

### Connection Refused
- Check VM SSH service: `systemctl status sshd`
- Verify firewall allows port 22
- Test SSH manually: `ssh username@vm-ip`

### Authentication Failed
- Verify username/password
- Check SSH key authentication if enabled
- Review VM SSH logs: `/var/log/auth.log`

### Terminal Not Rendering
- Check browser console for errors
- Verify Xterm.js CSS is loaded
- Check Socket.io connection status

### No Output in Terminal
- Verify SSH proxy is running on port 3002
- Check backend logs for errors
- Verify VITE_SSH_PROXY_URL in frontend .env.local
