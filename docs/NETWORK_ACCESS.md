# Network Access Configuration

## Backend Network Access - ENABLED ✅

The backend is now configured to accept connections from other devices on your network.

## Configuration

### Backend Server
- **Host:** `0.0.0.0` (listens on all network interfaces)
- **Port:** `3000`
- **Status:** Running and accessible on network

### Your Network IPs
- `192.168.56.1`
- `192.168.0.106`

### CORS Configuration
The backend now allows connections from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://192.168.56.1:5173`
- `http://192.168.0.106:5173`
- `http://10.44.159.198:5173`

## Access from Other Devices

### Frontend Access
Other devices on your network can access the game at:
- `http://192.168.56.1:5173`
- `http://192.168.0.106:5173`

### Backend API Access
Other devices can connect to the backend at:
- `http://192.168.56.1:3000`
- `http://192.168.0.106:3000`

### Admin Panel Access
Other devices can access the admin panel at:
- `http://192.168.56.1:5173/admin`
- `http://192.168.0.106:5173/admin`

## Testing Network Access

### From Another Device:

1. **Check if backend is reachable:**
   ```
   Open browser on another device
   Navigate to: http://192.168.0.106:3000/api/v1/health
   Should see: {"status":"healthy","timestamp":"..."}
   ```

2. **Access the game:**
   ```
   Navigate to: http://192.168.0.106:5173
   Should see the landing page
   ```

3. **Access admin panel:**
   ```
   Navigate to: http://192.168.0.106:5173/admin
   Enter password: NEXUS-MASTER-ADMIN-8821
   ```

## Firewall Configuration

If other devices cannot connect, you may need to allow the ports through Windows Firewall:

### Allow Port 3000 (Backend):
```powershell
New-NetFirewallRule -DisplayName "Nexus Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Allow Port 5173 (Frontend):
```powershell
New-NetFirewallRule -DisplayName "Nexus Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## Current Status

✅ Backend listening on: `0.0.0.0:3000`
✅ CORS configured for network IPs
✅ Frontend accessible on LAN
✅ Receiving requests from: `192.168.0.108`

## Security Notes

- Network access is enabled for local network only
- Not exposed to the internet
- All authentication still required
- Admin panel still requires password
- Rate limiting still active

## Troubleshooting

**Cannot connect from other device:**
1. Check if both devices are on the same network
2. Verify firewall rules allow ports 3000 and 5173
3. Ensure backend and frontend are running
4. Try pinging the host IP from the other device

**CORS errors:**
1. Check if the device IP is in CORS_ORIGIN list
2. Add the IP to backend/.env CORS_ORIGIN
3. Restart backend server

**Connection refused:**
1. Verify backend is running: `netstat -an | findstr 3000`
2. Check if HOST=0.0.0.0 in backend/.env
3. Restart backend if needed
