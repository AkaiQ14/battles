const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Game state management
class GameManager {
  constructor() {
    this.games = new Map();
    this.players = new Map();
    this.abilityRequests = new Map();
  }

  // Create or get game
  getGame(gameId) {
    if (!this.games.has(gameId)) {
      this.games.set(gameId, {
        id: gameId,
        players: new Map(),
        abilities: {
          player1: [],
          player2: []
        },
        requests: new Map(),
        status: 'waiting',
        createdAt: moment().toISOString()
      });
    }
    return this.games.get(gameId);
  }

  // Add player to game
  addPlayer(gameId, playerId, playerData) {
    const game = this.getGame(gameId);
    const player = {
      id: playerId,
      name: playerData.name || `Player ${playerData.playerParam}`,
      param: playerData.playerParam,
      socketId: playerData.socketId,
      abilities: playerData.abilities || [],
      joinedAt: moment().toISOString(),
      isHost: playerData.isHost || false
    };

    game.players.set(playerId, player);
    this.players.set(playerId, { gameId, ...player });

    console.log(`Player ${player.name} joined game ${gameId}`);
    return player;
  }

  // Remove player from game
  removePlayer(playerId) {
    const playerData = this.players.get(playerId);
    if (!playerData) return;

    const game = this.games.get(playerData.gameId);
    if (game) {
      game.players.delete(playerId);
      
      // If no players left, remove game
      if (game.players.size === 0) {
        this.games.delete(playerData.gameId);
      }
    }

    this.players.delete(playerId);
    console.log(`Player ${playerId} left game`);
  }

  // Set player abilities
  setPlayerAbilities(gameId, playerParam, abilities) {
    const game = this.getGame(gameId);
    game.abilities[playerParam] = abilities;
    console.log(`Set abilities for ${playerParam} in game ${gameId}:`, abilities);
  }

  // Get player abilities
  getPlayerAbilities(gameId, playerParam) {
    const game = this.getGame(gameId);
    return game.abilities[playerParam] || [];
  }

  // Create ability request
  createAbilityRequest(gameId, playerId, abilityText) {
    const game = this.getGame(gameId);
    const player = game.players.get(playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }

    const requestId = uuidv4();
    const request = {
      id: requestId,
      gameId,
      playerId,
      playerName: player.name,
      playerParam: player.param,
      abilityText,
      status: 'pending',
      createdAt: moment().toISOString(),
      timestamp: Date.now()
    };

    game.requests.set(requestId, request);
    this.abilityRequests.set(requestId, request);

    console.log(`Created ability request: ${requestId} for ${player.name}`);
    return request;
  }

  // Approve ability request
  approveAbilityRequest(requestId) {
    const request = this.abilityRequests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'approved';
    request.approvedAt = moment().toISOString();

    const game = this.getGame(request.gameId);
    if (game) {
      game.requests.set(requestId, request);
    }

    console.log(`Approved ability request: ${requestId}`);
    return request;
  }

  // Reject ability request
  rejectAbilityRequest(requestId) {
    const request = this.abilityRequests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'rejected';
    request.rejectedAt = moment().toISOString();

    const game = this.getGame(request.gameId);
    if (game) {
      game.requests.set(requestId, request);
    }

    console.log(`Rejected ability request: ${requestId}`);
    return request;
  }

  // Get pending requests for a game
  getPendingRequests(gameId) {
    const game = this.getGame(gameId);
    const pendingRequests = [];
    
    for (const [requestId, request] of game.requests) {
      if (request.status === 'pending') {
        pendingRequests.push(request);
      }
    }

    return pendingRequests;
  }

  // Get game info
  getGameInfo(gameId) {
    const game = this.getGame(gameId);
    return {
      id: game.id,
      players: Array.from(game.players.values()),
      abilities: game.abilities,
      pendingRequests: this.getPendingRequests(gameId),
      status: game.status,
      createdAt: game.createdAt
    };
  }
}

// Initialize game manager
const gameManager = new GameManager();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join game
  socket.on('joinGame', (data) => {
    try {
      const { gameId, playerParam, playerName, abilities, isHost } = data;
      const playerId = `${playerParam}_${socket.id}`;
      
      const player = gameManager.addPlayer(gameId, playerId, {
        socketId: socket.id,
        playerParam,
        name: playerName,
        abilities,
        isHost
      });

      // Join socket room
      socket.join(gameId);
      
      // Set player abilities if provided
      if (abilities && abilities.length > 0) {
        gameManager.setPlayerAbilities(gameId, playerParam, abilities);
      }

      // Send confirmation
      socket.emit('gameJoined', {
        success: true,
        playerId,
        gameId,
        player
      });

      // Notify other players
      socket.to(gameId).emit('playerJoined', {
        playerId,
        player
      });

      // Send current game state
      const gameInfo = gameManager.getGameInfo(gameId);
      socket.emit('gameState', gameInfo);

    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Request ability usage
  socket.on('requestAbility', (data) => {
    try {
      const { gameId, playerId, abilityText } = data;
      
      const request = gameManager.createAbilityRequest(gameId, playerId, abilityText);
      
      // Notify all players in the game
      io.to(gameId).emit('abilityRequested', request);
      
      // Send confirmation to requester
      socket.emit('abilityRequestSent', {
        success: true,
        requestId: request.id,
        abilityText
      });

    } catch (error) {
      console.error('Error requesting ability:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Approve ability request (host only)
  socket.on('approveAbilityRequest', (data) => {
    try {
      const { requestId } = data;
      
      const request = gameManager.approveAbilityRequest(requestId);
      
      // Notify all players in the game
      io.to(request.gameId).emit('abilityRequestApproved', request);
      
      // Send confirmation to host
      socket.emit('abilityRequestApproved', {
        success: true,
        requestId: request.id
      });

    } catch (error) {
      console.error('Error approving ability request:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Reject ability request (host only)
  socket.on('rejectAbilityRequest', (data) => {
    try {
      const { requestId } = data;
      
      const request = gameManager.rejectAbilityRequest(requestId);
      
      // Notify all players in the game
      io.to(request.gameId).emit('abilityRequestRejected', request);
      
      // Send confirmation to host
      socket.emit('abilityRequestRejected', {
        success: true,
        requestId: request.id
      });

    } catch (error) {
      console.error('Error rejecting ability request:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Get game state
  socket.on('getGameState', (data) => {
    try {
      const { gameId } = data;
      const gameInfo = gameManager.getGameInfo(gameId);
      socket.emit('gameState', gameInfo);
    } catch (error) {
      console.error('Error getting game state:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Set player abilities
  socket.on('setPlayerAbilities', (data) => {
    try {
      const { gameId, playerParam, abilities } = data;
      gameManager.setPlayerAbilities(gameId, playerParam, abilities);
      
      // Notify all players in the game
      io.to(gameId).emit('playerAbilitiesUpdated', {
        playerParam,
        abilities
      });
      
      socket.emit('playerAbilitiesSet', {
        success: true,
        playerParam,
        abilities
      });

    } catch (error) {
      console.error('Error setting player abilities:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Find and remove player
    for (const [playerId, playerData] of gameManager.players) {
      if (playerData.socketId === socket.id) {
        gameManager.removePlayer(playerId);
        
        // Notify other players
        socket.to(playerData.gameId).emit('playerLeft', {
          playerId,
          playerName: playerData.name
        });
        break;
      }
    }
  });
});

// REST API endpoints
app.get('/api/games/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const gameInfo = gameManager.getGameInfo(gameId);
    res.json(gameInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/games/:gameId/requests', (req, res) => {
  try {
    const { gameId } = req.params;
    const pendingRequests = gameManager.getPendingRequests(gameId);
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games/:gameId/requests/:requestId/approve', (req, res) => {
  try {
    const { requestId } = req.params;
    const request = gameManager.approveAbilityRequest(requestId);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games/:gameId/requests/:requestId/reject', (req, res) => {
  try {
    const { requestId } = req.params;
    const request = gameManager.rejectAbilityRequest(requestId);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: moment().toISOString(),
    games: gameManager.games.size,
    players: gameManager.players.size,
    requests: gameManager.abilityRequests.size
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Card Battle Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});