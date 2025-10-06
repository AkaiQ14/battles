/**
 * Socket.IO Client Manager for Card Battle Game
 * Handles real-time communication with the server
 */
class SocketManager {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.playerId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // Event callbacks
    this.callbacks = {
      onConnect: [],
      onDisconnect: [],
      onGameJoined: [],
      onPlayerJoined: [],
      onPlayerLeft: [],
      onAbilityRequested: [],
      onAbilityRequestApproved: [],
      onAbilityRequestRejected: [],
      onGameState: [],
      onPlayerAbilitiesUpdated: [],
      onError: []
    };
  }

  /**
   * Initialize socket connection
   * @param {string} serverUrl - Server URL (default: current host)
   */
  async connect(serverUrl = null) {
    try {
      // Determine server URL
      if (!serverUrl) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port || (protocol === 'wss:' ? '443' : '3000');
        serverUrl = `${protocol}//${host}:${port}`;
      }

      console.log(`🔌 Connecting to server: ${serverUrl}`);

      // Load Socket.IO client library if not already loaded
      if (typeof io === 'undefined') {
        await this.loadSocketIOLibrary();
      }

      // Create socket connection
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          console.log('✅ Connected to server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.triggerCallbacks('onConnect');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          this.isConnected = false;
          this.handleReconnect();
          reject(error);
        });
      });

    } catch (error) {
      console.error('Failed to connect to server:', error);
      throw error;
    }
  }

  /**
   * Load Socket.IO client library dynamically
   */
  async loadSocketIOLibrary() {
    return new Promise((resolve, reject) => {
      if (typeof io !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      script.onload = () => {
        console.log('📦 Socket.IO library loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Socket.IO library');
        reject(new Error('Failed to load Socket.IO library'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.isConnected = false;
      this.triggerCallbacks('onDisconnect', reason);
      this.handleReconnect();
    });

    // Game events
    this.socket.on('gameJoined', (data) => {
      console.log('🎮 Game joined:', data);
      this.gameId = data.gameId;
      this.playerId = data.playerId;
      this.triggerCallbacks('onGameJoined', data);
    });

    this.socket.on('playerJoined', (data) => {
      console.log('👤 Player joined:', data);
      this.triggerCallbacks('onPlayerJoined', data);
    });

    this.socket.on('playerLeft', (data) => {
      console.log('👋 Player left:', data);
      this.triggerCallbacks('onPlayerLeft', data);
    });

    // Ability request events
    this.socket.on('abilityRequested', (data) => {
      console.log('⚡ Ability requested:', data);
      this.triggerCallbacks('onAbilityRequested', data);
    });

    this.socket.on('abilityRequestApproved', (data) => {
      console.log('✅ Ability request approved:', data);
      this.triggerCallbacks('onAbilityRequestApproved', data);
    });

    this.socket.on('abilityRequestRejected', (data) => {
      console.log('❌ Ability request rejected:', data);
      this.triggerCallbacks('onAbilityRequestRejected', data);
    });

    // Game state events
    this.socket.on('gameState', (data) => {
      console.log('🎯 Game state updated:', data);
      this.triggerCallbacks('onGameState', data);
    });

    this.socket.on('playerAbilitiesUpdated', (data) => {
      console.log('🔮 Player abilities updated:', data);
      this.triggerCallbacks('onPlayerAbilitiesUpdated', data);
    });

    // Error events
    this.socket.on('error', (data) => {
      console.error('🚨 Server error:', data);
      this.triggerCallbacks('onError', data);
    });
  }

  /**
   * Handle reconnection logic
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Join a game
   * @param {Object} gameData - Game data
   */
  joinGame(gameData) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    console.log('🎮 Joining game:', gameData);
    this.socket.emit('joinGame', gameData);
  }

  /**
   * Request ability usage
   * @param {string} abilityText - Ability text
   */
  requestAbility(abilityText) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    if (!this.gameId || !this.playerId) {
      throw new Error('Not joined to any game');
    }

    console.log('⚡ Requesting ability:', abilityText);
    this.socket.emit('requestAbility', {
      gameId: this.gameId,
      playerId: this.playerId,
      abilityText: abilityText
    });
  }

  /**
   * Approve ability request (host only)
   * @param {string} requestId - Request ID
   */
  approveAbilityRequest(requestId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    console.log('✅ Approving ability request:', requestId);
    this.socket.emit('approveAbilityRequest', { requestId });
  }

  /**
   * Reject ability request (host only)
   * @param {string} requestId - Request ID
   */
  rejectAbilityRequest(requestId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    console.log('❌ Rejecting ability request:', requestId);
    this.socket.emit('rejectAbilityRequest', { requestId });
  }

  /**
   * Get current game state
   */
  getGameState() {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    if (!this.gameId) {
      throw new Error('Not joined to any game');
    }

    console.log('🎯 Getting game state');
    this.socket.emit('getGameState', { gameId: this.gameId });
  }

  /**
   * Set player abilities
   * @param {string} playerParam - Player parameter (player1/player2)
   * @param {Array} abilities - Array of abilities
   */
  setPlayerAbilities(playerParam, abilities) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    if (!this.gameId) {
      throw new Error('Not joined to any game');
    }

    console.log('🔮 Setting player abilities:', playerParam, abilities);
    this.socket.emit('setPlayerAbilities', {
      gameId: this.gameId,
      playerParam: playerParam,
      abilities: abilities
    });
  }

  /**
   * Add event callback
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    } else {
      console.warn(`Unknown event: ${event}`);
    }
  }

  /**
   * Remove event callback
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  /**
   * Trigger callbacks for an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  triggerCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from server');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.gameId = null;
      this.playerId = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      gameId: this.gameId,
      playerId: this.playerId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create global instance
window.socketManager = new SocketManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketManager;
}