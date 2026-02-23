// Room Manager for NEXUS PROTOCOL
// Manages WebSocket rooms for rounds and teams

class RoomManager {
  constructor(io, syncSystem) {
    this.io = io;
    this.syncSystem = syncSystem;
    this.rooms = new Map(); // roundId -> room data
    this.socketRooms = new Map(); // socketId -> Set of rooms
    
    // Set bidirectional reference
    if (syncSystem) {
      syncSystem.setRoomManager(this);
    }
  }

  /**
   * Create a room for a round
   * @param {string} roundId - Round identifier
   * @param {Object} roundData - Round data
   */
  createRoundRoom(roundId, roundData) {
    const room = {
      id: roundId,
      name: `round:${roundId}`,
      redTeamRoom: `round:${roundId}:red`,
      blueTeamRoom: `round:${roundId}:blue`,
      participants: new Map(), // socketId -> participant data
      createdAt: new Date(),
      roundData
    };

    this.rooms.set(roundId, room);
    console.log(`✅ Created round room: ${roundId}`);
    
    return room;
  }

  /**
   * Join a client to a round room
   * @param {Object} socket - Socket instance
   * @param {string} roundId - Round identifier
   * @param {string} team - Team ('red' or 'blue')
   * @param {Object} userData - User data
   * @returns {Object} Join result
   */
  joinRoundRoom(socket, roundId, team, userData = {}) {
    try {
      // Get or create room
      let room = this.rooms.get(roundId);
      if (!room) {
        return {
          success: false,
          error: 'ROUND_NOT_FOUND',
          message: 'Round room does not exist'
        };
      }

      // Validate team
      if (team !== 'red' && team !== 'blue') {
        return {
          success: false,
          error: 'INVALID_TEAM',
          message: 'Team must be "red" or "blue"'
        };
      }

      // Join main round room
      socket.join(room.name);
      
      // Join team-specific room
      const teamRoom = team === 'red' ? room.redTeamRoom : room.blueTeamRoom;
      socket.join(teamRoom);

      // Track participant
      const participant = {
        socketId: socket.id,
        team,
        joinedAt: new Date(),
        ...userData
      };
      
      room.participants.set(socket.id, participant);

      // Track socket rooms
      if (!this.socketRooms.has(socket.id)) {
        this.socketRooms.set(socket.id, new Set());
      }
      this.socketRooms.get(socket.id).add(roundId);

      // Send current game state to the new client
      this.syncSystem.sendCurrentState(socket.id, roundId);

      // Notify other participants
      socket.to(room.name).emit('participant_joined', {
        team,
        participantCount: room.participants.size,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ ${team.toUpperCase()} team member joined round ${roundId} (${socket.id})`);

      return {
        success: true,
        room: {
          id: roundId,
          name: room.name,
          teamRoom,
          participantCount: room.participants.size
        }
      };

    } catch (error) {
      console.error('Join round room error:', error);
      return {
        success: false,
        error: 'JOIN_ERROR',
        message: error.message
      };
    }
  }

  /**
   * Leave a round room
   * @param {Object} socket - Socket instance
   * @param {string} roundId - Round identifier
   */
  leaveRoundRoom(socket, roundId) {
    try {
      const room = this.rooms.get(roundId);
      if (!room) {
        return { success: false, error: 'ROUND_NOT_FOUND' };
      }

      const participant = room.participants.get(socket.id);
      if (!participant) {
        return { success: false, error: 'NOT_IN_ROOM' };
      }

      // Leave rooms
      socket.leave(room.name);
      socket.leave(room.redTeamRoom);
      socket.leave(room.blueTeamRoom);

      // Remove participant
      room.participants.delete(socket.id);

      // Update socket rooms tracking
      const socketRooms = this.socketRooms.get(socket.id);
      if (socketRooms) {
        socketRooms.delete(roundId);
        if (socketRooms.size === 0) {
          this.socketRooms.delete(socket.id);
        }
      }

      // Notify other participants
      socket.to(room.name).emit('participant_left', {
        team: participant.team,
        participantCount: room.participants.size,
        timestamp: new Date().toISOString()
      });

      console.log(`${participant.team.toUpperCase()} team member left round ${roundId} (${socket.id})`);

      return { success: true };

    } catch (error) {
      console.error('Leave round room error:', error);
      return { success: false, error: 'LEAVE_ERROR', message: error.message };
    }
  }

  /**
   * Handle socket disconnection
   * @param {string} socketId - Socket identifier
   */
  handleDisconnection(socketId) {
    const socketRooms = this.socketRooms.get(socketId);
    if (!socketRooms) {
      return;
    }

    // Leave all rooms this socket was in
    for (const roundId of socketRooms) {
      const room = this.rooms.get(roundId);
      if (room) {
        const participant = room.participants.get(socketId);
        if (participant) {
          room.participants.delete(socketId);
          
          // Notify other participants
          this.io.to(room.name).emit('participant_left', {
            team: participant.team,
            participantCount: room.participants.size,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Notify sync system
      this.syncSystem.handleDisconnection(socketId, roundId);
    }

    // Clean up socket tracking
    this.socketRooms.delete(socketId);
  }

  /**
   * Close a round room
   * @param {string} roundId - Round identifier
   */
  closeRoundRoom(roundId) {
    const room = this.rooms.get(roundId);
    if (!room) {
      return { success: false, error: 'ROUND_NOT_FOUND' };
    }

    // Notify all participants
    this.io.to(room.name).emit('round_ended', {
      roundId,
      message: 'Round has ended',
      timestamp: new Date().toISOString()
    });

    // Disconnect all participants from the room
    for (const [socketId, participant] of room.participants) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(room.name);
        socket.leave(room.redTeamRoom);
        socket.leave(room.blueTeamRoom);
      }

      // Update socket rooms tracking
      const socketRooms = this.socketRooms.get(socketId);
      if (socketRooms) {
        socketRooms.delete(roundId);
        if (socketRooms.size === 0) {
          this.socketRooms.delete(socketId);
        }
      }
    }

    // Cleanup sync system
    this.syncSystem.cleanup(roundId);

    // Remove room
    this.rooms.delete(roundId);

    console.log(`✅ Closed round room: ${roundId}`);

    return { success: true };
  }

  /**
   * Get room information
   * @param {string} roundId - Round identifier
   * @returns {Object} Room information
   */
  getRoomInfo(roundId) {
    const room = this.rooms.get(roundId);
    if (!room) {
      return null;
    }

    const participants = Array.from(room.participants.values());
    const redTeamCount = participants.filter(p => p.team === 'red').length;
    const blueTeamCount = participants.filter(p => p.team === 'blue').length;

    return {
      id: room.id,
      name: room.name,
      participantCount: room.participants.size,
      redTeamCount,
      blueTeamCount,
      createdAt: room.createdAt,
      participants: participants.map(p => ({
        team: p.team,
        joinedAt: p.joinedAt
      }))
    };
  }

  /**
   * Get all active rooms
   * @returns {Array} Active rooms
   */
  getActiveRooms() {
    return Array.from(this.rooms.keys()).map(roundId => this.getRoomInfo(roundId));
  }

  /**
   * Get rooms for a socket
   * @param {string} socketId - Socket identifier
   * @returns {Array} Room IDs
   */
  getSocketRooms(socketId) {
    const rooms = this.socketRooms.get(socketId);
    return rooms ? Array.from(rooms) : [];
  }

  /**
   * Check if socket is in room
   * @param {string} socketId - Socket identifier
   * @param {string} roundId - Round identifier
   * @returns {boolean} True if in room
   */
  isSocketInRoom(socketId, roundId) {
    const rooms = this.socketRooms.get(socketId);
    return rooms ? rooms.has(roundId) : false;
  }

  /**
   * Get participant info
   * @param {string} socketId - Socket identifier
   * @param {string} roundId - Round identifier
   * @returns {Object} Participant info
   */
  getParticipant(socketId, roundId) {
    const room = this.rooms.get(roundId);
    if (!room) {
      return null;
    }
    return room.participants.get(socketId);
  }

  /**
   * Broadcast to room
   * @param {string} roundId - Round identifier
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcastToRoom(roundId, event, data) {
    const room = this.rooms.get(roundId);
    if (room) {
      this.io.to(room.name).emit(event, data);
    }
  }

  /**
   * Broadcast to team in room
   * @param {string} roundId - Round identifier
   * @param {string} team - Team ('red' or 'blue')
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcastToTeam(roundId, team, event, data) {
    const room = this.rooms.get(roundId);
    if (room) {
      const teamRoom = team === 'red' ? room.redTeamRoom : room.blueTeamRoom;
      this.io.to(teamRoom).emit(event, data);
    }
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const rooms = Array.from(this.rooms.values());
    const totalParticipants = rooms.reduce((sum, room) => sum + room.participants.size, 0);
    
    return {
      activeRooms: this.rooms.size,
      totalParticipants,
      activeSockets: this.socketRooms.size,
      roomDetails: rooms.map(room => ({
        id: room.id,
        participants: room.participants.size,
        redTeam: Array.from(room.participants.values()).filter(p => p.team === 'red').length,
        blueTeam: Array.from(room.participants.values()).filter(p => p.team === 'blue').length
      }))
    };
  }
}

module.exports = RoomManager;
