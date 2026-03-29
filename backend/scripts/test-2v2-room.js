const { io } = require('socket.io-client');
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function simulate() {
  console.log('--- STARTING 2V2 ROOM SIMULATION ---');
  
  try {
    // 1. Login as Red Team
    const redLogin = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      teamName: 'Shadow Syndicate',
      accessCode: 'shadow_123' // from init-database.js
    });
    const redToken = redLogin.data.sessionToken;
    console.log('✅ Red Team logged in');

    // 2. Login as Blue Team
    const blueLogin = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      teamName: 'Cyber Guardians',
      accessCode: 'guardian_123'
    });
    const blueToken = blueLogin.data.sessionToken;
    console.log('✅ Blue Team logged in');

    // 3. Join Room API to validate Team and Seat (Red 1)
    await axios.post(`${API_BASE}/api/v1/rooms/join`, {
      roomId: 'tournament-alpha',
      seat: 'red-1'
    }, { headers: { Authorization: `Bearer ${redToken}` } });
    console.log('✅ Red-1 seat reserved');

    // 4. Connect Sockets
    const redSocket = io(API_BASE, { auth: { token: redToken } });
    const blueSocket = io(API_BASE, { auth: { token: blueToken } });

    blueSocket.on('vulnerability-detected', (data) => {
      console.log('🛡️ [BLUE RECEIVED] Vulnerability detected:', data.vulnerability);
      // Simulate Blue patching
      blueSocket.emit('blue-patch', {
        roomId: 'tournament-alpha',
        patchData: { vuln_id: data.vulnerability, enabled: true, name: data.vulnerability }
      });
    });

    redSocket.on('attack-logged', (data) => {
      console.log('⚔️ [RED RECEIVED] Attack logged successfully:', data.vulnerability);
    });

    redSocket.on('patch-successful', (data) => {
      console.log('⚔️ [RED RECEIVED] Patch successful event:', data.patchData.vuln_id);
    });

    blueSocket.on('patch-successful', (data) => {
      console.log('🛡️ [BLUE RECEIVED] Patch successful event:', data.patchData.vuln_id);
      
      // We got the patch successful event, meaning the simulation completed.
      console.log('--- SIMULATION SUCCESSFUL ---');
      process.exit(0);
    });

    redSocket.on('connect', () => {
      redSocket.emit('join-room', { roomId: 'tournament-alpha', seat: 'red-1' }, (res) => {
        console.log('Red join-room:', res);
        // Once joined, launch attack
        redSocket.emit('red-attack', { roomId: 'tournament-alpha', vulnerability: 'sqli_login' });
      });
    });

    blueSocket.on('connect', () => {
      blueSocket.emit('join-room', { roomId: 'tournament-alpha', seat: 'blue-1' }, (res) => {
        console.log('Blue join-room:', res);
      });
    });

  } catch (err) {
    console.error('Simulation Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

simulate();
