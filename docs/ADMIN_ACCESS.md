# NEXUS PROTOCOL - Admin Access Guide

## Admin Dashboard Access

### Password/Access Code
```
NEXUS-MASTER-ADMIN-8821
```

### How to Access

1. **From Landing Page:**
   - Click "SYSTEM ACCESS" button in the top navigation
   - OR navigate to: `http://localhost:5173/admin`

2. **Enter Access Code:**
   - Enter the admin code: `NEXUS-MASTER-ADMIN-8821`
   - Click "ACCESS SYSTEM"

3. **Important:** Make sure the backend server is running on port 3000

### Available Admin Dashboards

#### 1. Main Admin Dashboard (`/admin`)
- Live activity monitoring
- Global leaderboard
- Team management (kick/reset teams)
- System controls (broadcast, threat level, system reset)

#### 2. Full Admin Dashboard (`/admin/dashboard`)
- Real-time player monitoring
- Terminal output monitoring
- Award points to players
- Send hints to players
- VM reset controls
- War feed (event log)

#### 3. Terminal Monitor (`/admin/terminal-monitor`)
- Dedicated terminal monitoring interface

### Admin Features

- **Activity Monitoring:** View all game events in real-time
- **Leaderboard Management:** Track team rankings and scores
- **Team Controls:** Kick or reset team progress
- **Broadcast System:** Send messages to all players
- **Threat Level:** Adjust global threat level (LOW/MEDIUM/HIGH/CRITICAL)
- **System Reset:** Clear all sessions and data (use with caution)
- **Player Monitoring:** Watch player terminal sessions live
- **Points Management:** Award or deduct points
- **Hint System:** Send hints to struggling players

### Security Note

The admin code is hardcoded in `backend/routes/admin.js`. For production deployment, implement proper JWT-based authentication.

### Backend Configuration

Admin authentication is handled in:
- File: `backend/routes/admin.js`
- Line: 11
- Token: `NEXUS-MASTER-ADMIN-8821`

To change the admin password, edit the token value in the `isAdmin` middleware function.
