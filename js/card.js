// --- Game state ---
// ✅ نظام الملاحظات المحسن
// - مربع الملاحظات بسيط بدون أزرار مسح أو تسميات
// - المضيف يكتب ويمسح ملاحظات اللاعبين
// - لا يحدث أي تغيير في الملاحظات عند استخدام القدرات أبداً
// - كل لاعب يرى ملاحظاته فقط (لا تنتقل الملاحظات بين اللاعبين)
// - الملاحظات تُحفظ في localStorage وتبقى عبر الجولات
// - عند إعادة تحميل الصفحة تبقى الملاحظات محفوظة

// ✅ نظام دكة البدلاء المحسن
// - يحتفظ بالبطاقات العشوائية عبر تحديثات الصفحة
// - يعيد تعيين النظام فقط عند بدء لعبة جديدة حقيقية
// - يتحقق من حالة اللعبة قبل إعادة التعيين

// Voice system for Legendary cards
let voiceSystem = {
  isEnabled: true,
  volume: 0.7,
  currentAudio: null,
  audioQueue: [],
  isPlaying: false,
  isMuted: false,
  mutedVolume: 0.7,
  
  // Check if card is legendary by name patterns - Updated with all voice files
  isLegendaryByName: function(cardPath) {
    // All legendary cards that have voice files in voice/ directory
    const legendaryPatterns = [
      'aizen', 'Akai', 'AllForOneCard', 'AyanokojiCard', 'Asta', 'ErenCard',
      'fubuki', 'Gogeta', 'GojoCard', 'Goku UI', 'Hawks', 'joker', 'killua',
      'law', 'LuffyGear5Card', 'madara', 'MeruemCard', 'NietroCard', 'obito',
      'SakamotoCard', 'shikamaru', 'ShanksCard', 'SilverCard', 'UmibozoCard',
      'Vegetto', 'whitebeard', 'zoro', 'Zenitsu', 'Hashirama', 'Neiji'
    ];
    
    const cardName = cardPath.split('/').pop().split('.')[0].toLowerCase();
    return legendaryPatterns.some(pattern => cardName.includes(pattern.toLowerCase()));
  },
  
  // Check if card is Legendary
  isLegendaryCard: function(cardPath) {
    if (!cardPath) return false;
    return cardPath.includes('Legendary/') || 
           cardPath.includes('images/') && this.isLegendaryByName(cardPath);
  },
  
  // Enhanced voice file name mapping - Exact match with voice files
  getVoiceFileName: function(cardPath) {
    if (!cardPath) return null;
    
    // Extract card name from path
    let cardName = cardPath.split('/').pop().split('.')[0];
    
    // Skip ranpo as requested
    if (cardName.toLowerCase().includes('ranpo')) {
      return null;
    }
    
    // Exact mapping to voice file names (case-sensitive)
    const voiceFileMappings = {
      // Direct matches
      'aizen': 'aizen',
      'Akai': 'Akai',
      'AllForOneCard': 'AllForOneCard',
      'AyanokojiCard': 'AyanokojiCard',
      'Asta': 'Asta',
      'ErenCard': 'ErenCard',
      'fubuki': 'fubuki',
      'Fubuki': 'fubuki',
      'Gogeta': 'Gogeta',
      'GojoCard': 'GojoCard',
      'Goku UI': 'Goku UI',
      'Hawks': 'Hawks',
      'joker': 'joker',
      'killua': 'killua',
      'law': 'law',
      'LuffyGear5Card': 'LuffyGear5Card',
      'madara': 'madara',
      'MeruemCard': 'MeruemCard',
      'NietroCard': 'NietroCard',
      'obito': 'obito',
      'SakamotoCard': 'SakamotoCard',
      'shikamaru': 'shikamaru',
      'ShanksCard': 'ShanksCard',
      'SilverCard': 'SilverCard',
      'UmibozoCard': 'UmibozoCard',
      'Vegetto': 'Vegetto',
      'whitebeard': 'whitebeard',
      'zoro': 'Zoro',
      'Zoro': 'Zoro',
      'Zenitsu': 'Zenitsu',
      'Hashirama': 'Hashirama',
      'Neiji': 'Neiji'
    };
    
    // Check for exact match first
    if (voiceFileMappings[cardName]) {
      return voiceFileMappings[cardName];
    }
    
    // Check for case-insensitive match
    const lowerCardName = cardName.toLowerCase();
    for (const [key, value] of Object.entries(voiceFileMappings)) {
      if (key.toLowerCase() === lowerCardName) {
        return value;
      }
    }
    
    // Handle common variations
    const cleanedName = cardName.replace('-card', '').replace('Card', '');
    if (voiceFileMappings[cleanedName]) {
      return voiceFileMappings[cleanedName];
    }
    
    // Final fallback - return original name (might work for simple cases)
    return cardName;
  },
  
  // Play voice for a card
  playVoice: function(cardPath, playerName, forcePlay = false) {
    if (!this.isEnabled || !this.isLegendaryCard(cardPath)) {
      console.log(`🎵 Voice disabled or not legendary: ${cardPath}`);
      return;
    }
    
    const voiceFileName = this.getVoiceFileName(cardPath);
    if (!voiceFileName) {
      console.log(`🎵 No voice file found for: ${cardPath}`);
      return;
    }
    
    // Check if this exact voice is already playing or in queue to prevent duplicates
    const isAlreadyPlaying = this.audioQueue.some(audio => 
      audio.cardPath === cardPath && audio.playerName === playerName
    ) || (this.currentAudio && this.currentAudio.dataset.cardPath === cardPath && this.currentAudio.dataset.playerName === playerName);
    
    if (isAlreadyPlaying && !forcePlay) {
      console.log(`🎵 Voice already playing or queued for ${playerName}: ${cardPath}`);
      return;
    }
    
    const audioPath = `voice/${voiceFileName}.mp3`;
    console.log(`🎵 Playing voice for ${playerName}: ${audioPath}`);
    
    // Save last voice for this player
    this.saveLastVoiceForPlayer(playerName, cardPath);
    
    // Add to queue
    this.audioQueue.push({
      path: audioPath,
      playerName: playerName,
      cardPath: cardPath,
      voiceFileName: voiceFileName
    });
    
    // Start playing if not already playing
    if (!this.isPlaying) {
      this.playNextInQueue();
    }
  },
  
  // Play next audio in queue
  playNextInQueue: function() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    const audioData = this.audioQueue.shift();
    this.isPlaying = true;
    
    // Stop current audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    // Create new audio
    this.currentAudio = new Audio(audioData.path);
    this.currentAudio.volume = this.volume;
    
    // Store metadata for duplicate checking
    this.currentAudio.dataset.cardPath = audioData.cardPath;
    this.currentAudio.dataset.playerName = audioData.playerName;
    
    // Handle audio events
    this.currentAudio.onended = () => {
      console.log(`🎵 Finished playing voice for ${audioData.playerName}`);
      this.currentAudio = null;
      this.playNextInQueue();
    };
    
    this.currentAudio.onerror = (error) => {
      console.warn(`🎵 Error playing voice ${audioData.path}:`, error);
      this.currentAudio = null;
      this.playNextInQueue();
    };
    
    // Play the audio
    this.currentAudio.play().catch(error => {
      console.warn(`🎵 Failed to play voice ${audioData.path}:`, error);
      this.currentAudio = null;
      this.playNextInQueue();
    });
  },
  
  // Replay voice for a specific player
  replayVoice: function(playerName) {
    // Find the last played voice for this player
    const lastVoice = this.getLastVoiceForPlayer(playerName);
    if (lastVoice) {
      console.log(`🎵 Replaying voice for ${playerName}`);
      this.playVoice(lastVoice.cardPath, playerName, true); // forcePlay = true
    }
  },
  
  // Get last voice played for a player
  getLastVoiceForPlayer: function(playerName) {
    // Get the last played voice from localStorage
    const lastVoiceKey = `lastVoice_${playerName}`;
    const lastVoice = localStorage.getItem(lastVoiceKey);
    
    if (lastVoice) {
      try {
        return JSON.parse(lastVoice);
      } catch (e) {
        console.warn('Error parsing last voice data:', e);
      }
    }
    
    // Fallback to current round's card
    const currentCard = this.getCurrentCardForPlayer(playerName);
    if (currentCard && this.isLegendaryCard(currentCard)) {
      return {
        cardPath: currentCard,
        playerName: playerName
      };
    }
    return null;
  },
  
  // Save last played voice for a player
  saveLastVoiceForPlayer: function(playerName, cardPath) {
    if (!this.isLegendaryCard(cardPath)) return;
    
    const voiceData = {
      cardPath: cardPath,
      playerName: playerName,
      timestamp: Date.now()
    };
    
    const lastVoiceKey = `lastVoice_${playerName}`;
    localStorage.setItem(lastVoiceKey, JSON.stringify(voiceData));
  },
  
  // Get current card for a player
  getCurrentCardForPlayer: function(playerName) {
    if (playerName === player1) {
      return picks?.[player1]?.[round];
    } else if (playerName === player2) {
      return picks?.[player2]?.[round];
    }
    return null;
  },
  
  // Stop current audio
  stopAudio: function() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  },
  
  // Clear previous voices for new round
  clearPreviousVoices: function() {
    // Stop current audio
    this.stopAudio();
    
    // Clear localStorage for both players
    try {
      localStorage.removeItem(`lastVoice_${player1}`);
      localStorage.removeItem(`lastVoice_${player2}`);
      console.log('🎵 Previous voices cleared for new round');
    } catch (error) {
      console.warn('Error clearing previous voices:', error);
    }
  },
  
  // Set volume
  setVolume: function(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  },
  
  // Toggle mute (temporary mute, not disable system)
  toggleMute: function() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      // Mute: pause current audio and set volume to 0
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      this.mutedVolume = this.volume; // Save current volume
      this.volume = 0;
    } else {
      // Unmute: restore volume and resume if audio was playing
      this.volume = this.mutedVolume || 0.7; // Restore saved volume or default
      if (this.currentAudio) {
        this.currentAudio.volume = this.volume;
        this.currentAudio.play().catch(e => console.log('Could not resume audio:', e));
      }
    }
    
    return !this.isMuted; // Return true if unmuted, false if muted
  },
  
  // Test function to verify all legendary cards have voice files
  testAllLegendaryVoices: function() {
    console.log('🎵 Testing all legendary voice mappings...');
    
    const testCards = [
      // All card data has been removed - ready for new cards
    ];
    
    testCards.forEach(cardPath => {
      const isLegendary = this.isLegendaryCard(cardPath);
      const voiceFileName = this.getVoiceFileName(cardPath);
      const audioPath = voiceFileName ? `voice/${voiceFileName}.mp3` : 'N/A';
      
      console.log(`🎵 ${cardPath}: Legendary=${isLegendary}, Voice=${voiceFileName}, Path=${audioPath}`);
    });
    
    // Test actual audio loading
    this.testAudioLoading();
  },
  
  // Test actual audio file loading
  testAudioLoading: function() {
    console.log('🎵 Testing audio file accessibility...');
    
    const testVoiceFiles = ['aizen', 'Akai', 'law'];
    
    testVoiceFiles.forEach(voiceFile => {
      const audioPath = `voice/${voiceFile}.mp3`;
      const audio = new Audio(audioPath);
      
      audio.oncanplaythrough = () => {
        console.log(`✅ Audio accessible: ${audioPath}`);
      };
      
      audio.onerror = (error) => {
        console.log(`❌ Audio not accessible: ${audioPath}`, error);
      };
      
      // Trigger the check
      audio.load();
    });
  }
};

// Create voice control buttons
function createVoiceControls() {
  // Remove existing voice controls to prevent duplicates
  const existingControls = document.querySelectorAll('.voice-controls');
  existingControls.forEach(control => control.remove());
  
  // Create voice controls container
  const voiceControlsContainer = document.createElement('div');
  voiceControlsContainer.className = 'voice-controls';
  voiceControlsContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  `;
  
  // Mute/Unmute Button (Circular)
  const muteButton = document.createElement('button');
  muteButton.className = 'mute-button';
  muteButton.style.cssText = `
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 4px solid #f3c21a;
    background: #f3c21a;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(243, 194, 26, 0.3);
  `;
  
  // Set initial icon based on mute state
  muteButton.innerHTML = !voiceSystem.isMuted ? 
    '<span style="color: #87CEEB;">🔊</span>' : 
    '<span style="color: #87CEEB;">🔇</span>';
  
  muteButton.onclick = function() {
    const isUnmuted = voiceSystem.toggleMute();
    this.innerHTML = isUnmuted ? 
      '<span style="color: #87CEEB;">🔊</span>' : 
      '<span style="color: #87CEEB;">🔇</span>';
  };
  
  muteButton.onmouseover = function() {
    this.style.transform = 'scale(1.05)';
    this.style.boxShadow = '0 6px 20px rgba(243, 194, 26, 0.4)';
  };
  
  muteButton.onmouseout = function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 4px 15px rgba(243, 194, 26, 0.3)';
  };
  
  // Volume Control Container (Simple and Clean)
  const volumeContainer = document.createElement('div');
  volumeContainer.style.cssText = `
    width: 120px;
    height: 40px;
    border: 2px solid #f3c21a;
    border-radius: 20px;
    background: rgba(26, 10, 15, 0.9);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 15px;
    box-sizing: border-box;
  `;
  
  // Volume Percentage Display
  const volumeDisplay = document.createElement('span');
  volumeDisplay.className = 'volume-display';
  volumeDisplay.textContent = Math.round(voiceSystem.volume * 100) + '%';
  volumeDisplay.style.cssText = `
    color: #f3c21a;
    font-family: "Cairo", sans-serif;
    font-weight: bold;
    font-size: 14px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  `;
  
  // Volume Slider (Native HTML5 range input)
  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = '0';
  volumeSlider.max = '100';
  volumeSlider.value = Math.round(voiceSystem.volume * 100);
  volumeSlider.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    margin: 0;
    z-index: 2;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
  `;
  
  // Custom slider styling for webkit browsers
  volumeSlider.style.webkitAppearance = 'none';
  volumeSlider.style.appearance = 'none';
  
  // Update volume display
  function updateVolumeDisplay(value) {
    const percentage = Math.round(value);
    volumeDisplay.textContent = percentage + '%';
  }
  
  // Set initial position
  updateVolumeDisplay(voiceSystem.volume * 100);
  
  // Volume control events
  volumeSlider.oninput = function() {
    const value = parseInt(this.value);
    voiceSystem.setVolume(value / 100);
    updateVolumeDisplay(value);
  };
  
  // Add elements to volume container
  volumeContainer.appendChild(volumeDisplay);
  volumeContainer.appendChild(volumeSlider);
  
  // Add elements to main container
  voiceControlsContainer.appendChild(muteButton);
  voiceControlsContainer.appendChild(volumeContainer);
  
  // Add to document
  document.body.appendChild(voiceControlsContainer);
  
  console.log('🎵 Voice controls created with new design');
}

// Helper function to get player name from all possible sources
function getPlayerName(playerNumber) {
  try {
    // Try to get from gameSetupProgress first
    if (gameSetupProgress && gameSetupProgress[`player${playerNumber}`]?.name) {
      console.log(`🎵 Found player ${playerNumber} name in gameSetupProgress.player${playerNumber}.name: ${gameSetupProgress[`player${playerNumber}`].name}`);
      return gameSetupProgress[`player${playerNumber}`].name;
    }
    
    // Try alternative naming convention
    if (gameSetupProgress && gameSetupProgress[`player${playerNumber}Name`]) {
      console.log(`🎵 Found player ${playerNumber} name in gameSetupProgress.player${playerNumber}Name: ${gameSetupProgress[`player${playerNumber}Name`]}`);
      return gameSetupProgress[`player${playerNumber}Name`];
    }
    
    // Try localStorage
    const fromStorage = localStorage.getItem(`player${playerNumber}`);
    if (fromStorage) {
      console.log(`🎵 Found player ${playerNumber} name in localStorage: ${fromStorage}`);
      return fromStorage;
    }
    
    // Fallback to default
    console.log(`🎵 Using fallback name for player ${playerNumber}: لاعب ${playerNumber}`);
    return `لاعب ${playerNumber}`;
  } catch (error) {
    console.error(`Error getting player ${playerNumber} name:`, error);
    return `لاعب ${playerNumber}`;
  }
}

// Create replay buttons under abilities
function createReplayButtons() {
  // Remove existing replay buttons
  const existingReplayButtons = document.querySelectorAll('.replay-buttons');
  existingReplayButtons.forEach(button => button.remove());
  
  // Debug: Print all player name sources
  console.log('🎵 === PLAYER NAME DEBUG ===');
  console.log('🎵 gameSetupProgress:', gameSetupProgress);
  console.log('🎵 localStorage player1:', localStorage.getItem("player1"));
  console.log('🎵 localStorage player2:', localStorage.getItem("player2"));
  console.log('🎵 Current player1 variable:', player1);
  console.log('🎵 Current player2 variable:', player2);
  
  // Check DOM elements
  const rightPlayerNameElement = document.querySelector('.right-panel .name');
  const leftPlayerNameElement = document.querySelector('.player-column .name');
  console.log('🎵 Right panel player name (DOM):', rightPlayerNameElement ? rightPlayerNameElement.textContent.trim() : 'NOT FOUND');
  console.log('🎵 Left panel player name (DOM):', leftPlayerNameElement ? leftPlayerNameElement.textContent.trim() : 'NOT FOUND');
  
  const debugPlayer1 = getPlayerName(1);
  const debugPlayer2 = getPlayerName(2);
  console.log('🎵 getPlayerName(1) result:', debugPlayer1);
  console.log('🎵 getPlayerName(2) result:', debugPlayer2);
  console.log('🎵 === END DEBUG ===');
  
  // Create replay button for player 1 (right side) - اللاعب الأول
  const replayPlayer1 = document.createElement('button');
  replayPlayer1.className = 'replay-buttons';
  replayPlayer1.textContent = '🔄 إعادة التشغيل';
  replayPlayer1.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    background: linear-gradient(145deg, #3b82f6, #2563eb);
    color: white;
    border: 2px solid #fff;
    border-radius: 10px;
    font-family: "Cairo", sans-serif;
    font-weight: bold;
    font-size: 12px;
    cursor: pointer;
    z-index: 1500;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    transition: all 0.3s ease;
  `;
  replayPlayer1.onclick = function() {
    // الزر الأيمن للاعب الأيسر - قراءة الاسم من العنصر الموجود على الشاشة
    const leftPlayerNameElement = document.querySelector('.player-column .name');
    const currentPlayer = leftPlayerNameElement ? leftPlayerNameElement.textContent.trim() : getPlayerName(2);
    console.log(`🎵 Replay button clicked for Left Player (Right Button): ${currentPlayer}`);
    voiceSystem.replayVoice(currentPlayer);
  };
  replayPlayer1.onmouseover = function() {
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
  };
  replayPlayer1.onmouseout = function() {
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
  };
  
  // Create replay button for player 2 (left side) - اللاعب الثاني
  const replayPlayer2 = document.createElement('button');
  replayPlayer2.className = 'replay-buttons';
  replayPlayer2.textContent = '🔄 إعادة التشغيل';
  replayPlayer2.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 10px 15px;
    background: linear-gradient(145deg, #3b82f6, #2563eb);
    color: white;
    border: 2px solid #fff;
    border-radius: 10px;
    font-family: "Cairo", sans-serif;
    font-weight: bold;
    font-size: 12px;
    cursor: pointer;
    z-index: 1500;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    transition: all 0.3s ease;
  `;
  replayPlayer2.onclick = function() {
    // الزر الأيسر للاعب الأيمن - قراءة الاسم من العنصر الموجود على الشاشة
    const rightPlayerNameElement = document.querySelector('.right-panel .name');
    const currentPlayer = rightPlayerNameElement ? rightPlayerNameElement.textContent.trim() : getPlayerName(1);
    console.log(`🎵 Replay button clicked for Right Player (Left Button): ${currentPlayer}`);
    voiceSystem.replayVoice(currentPlayer);
  };
  replayPlayer2.onmouseover = function() {
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
  };
  replayPlayer2.onmouseout = function() {
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
  };
  
  // Add to document
  document.body.appendChild(replayPlayer1);
  document.body.appendChild(replayPlayer2);
  
  console.log('🎵 Replay buttons created');
}

/**
 * Reset swap deck system for new games only
 */
function resetSwapDeckSystem() {
  try {
    // Check if this is a real new game
    const gameSetupProgress = localStorage.getItem('gameSetupProgress');
    
    if (gameSetupProgress === 'completed') {
      // Game is in progress, don't reset
      console.log('🎴 Game in progress, keeping swap deck data');
      return;
    }
    
    // This is a new game, reset swap deck system
    console.log('🎴 New game detected, resetting swap deck system');
    
    // Reset swap deck system if available
    if (window.swapDeckSystem && typeof window.swapDeckSystem.resetSwapDeckSystem === 'function') {
      window.swapDeckSystem.resetSwapDeckSystem();
    }
    
    // Clear generated cards to force regeneration for new game
    localStorage.removeItem('generatedCards');
    
    // Reset global card generation variables
    if (window.gameCardsGenerated) {
      window.gameCardsGenerated = false;
      window.gameCardsData = {
        player1Cards: [],
        player2Cards: []
      };
      console.log('🔄 Reset global card generation variables');
    }
    
    console.log('✅ Swap deck system reset for new game');
    
  } catch (error) {
    console.error('❌ Error resetting swap deck system:', error);
  }
}

// Call reset function when page loads
document.addEventListener('DOMContentLoaded', function() {
  resetSwapDeckSystem();
});

// Load game data from gameSetupProgress with error handling
let gameSetupProgress = {};
try {
  gameSetupProgress = JSON.parse(localStorage.getItem("gameSetupProgress") || "{}");
} catch (error) {
  console.warn("Error parsing gameSetupProgress:", error);
  gameSetupProgress = {};
}

// Load round count from gameSetupProgress
let roundCount = 5;
let startingHP = 5;

try {
  if (gameSetupProgress.rounds) {
    roundCount = gameSetupProgress.rounds;
    startingHP = gameSetupProgress.rounds;
  } else if (localStorage.getItem("totalRounds")) {
    roundCount = parseInt(localStorage.getItem("totalRounds"));
    startingHP = parseInt(localStorage.getItem("totalRounds"));
  }
} catch (e) {
  console.error('Error loading round count:', e);
}

// Load player names from gameSetupProgress
let player1 = "لاعب 1";
let player2 = "لاعب 2";

try {
  if (gameSetupProgress.player1?.name) {
    player1 = gameSetupProgress.player1.name;
  } else if (gameSetupProgress.player1Name) {
    player1 = gameSetupProgress.player1Name;
  } else if (localStorage.getItem("player1")) {
    player1 = localStorage.getItem("player1");
  }
  
  if (gameSetupProgress.player2?.name) {
    player2 = gameSetupProgress.player2.name;
  } else if (gameSetupProgress.player2Name) {
    player2 = gameSetupProgress.player2Name;
  } else if (localStorage.getItem("player2")) {
    player2 = localStorage.getItem("player2");
  }
  
  console.log('Loaded player names:', { player1, player2 });
} catch (e) {
  console.error('Error loading player names:', e);
}

// Dynamic picks loading function
function loadPlayerPicks() {
  let picks = {};
  
  try {
    // First priority: Load from StrategicOrdered (final arrangement from player-cards.html)
    const player1Order = localStorage.getItem('player1StrategicOrdered');
    const player2Order = localStorage.getItem('player2StrategicOrdered');
    
    if (player1Order && player2Order) {
      try {
        const player1Ordered = JSON.parse(player1Order);
        const player2Ordered = JSON.parse(player2Order);
        
        if (Array.isArray(player1Ordered) && Array.isArray(player2Ordered) && 
            player1Ordered.length > 0 && player2Ordered.length > 0) {
          picks[player1] = [...player1Ordered];
          picks[player2] = [...player2Ordered];
          console.log('Loaded picks from StrategicOrdered:', { player1: picks[player1], player2: picks[player2] });
          return picks;
        }
      } catch (e) {
        console.warn('Error parsing StrategicOrdered:', e);
      }
    }
    
    // Second priority: Load from StrategicPicks (selected cards from cards-setup.js)
    const player1Picks = localStorage.getItem('player1StrategicPicks');
    const player2Picks = localStorage.getItem('player2StrategicPicks');
    
    if (player1Picks && player2Picks) {
      try {
        const player1Cards = JSON.parse(player1Picks);
        const player2Cards = JSON.parse(player2Picks);
        
        if (Array.isArray(player1Cards) && Array.isArray(player2Cards) && 
            player1Cards.length > 0 && player2Cards.length > 0) {
          picks[player1] = [...player1Cards];
          picks[player2] = [...player2Cards];
          console.log('Loaded picks from StrategicPicks:', { player1: picks[player1], player2: picks[player2] });
          return picks;
        }
      } catch (e) {
        console.warn('Error parsing StrategicPicks:', e);
      }
    }
    
    // Third priority: Load from gameCardSelection
    const cardSelection = localStorage.getItem('gameCardSelection');
    if (cardSelection) {
      try {
        const cardData = JSON.parse(cardSelection);
        if (cardData.player1Cards && cardData.player2Cards) {
          picks[player1] = [...cardData.player1Cards];
          picks[player2] = [...cardData.player2Cards];
          console.log('Loaded picks from gameCardSelection:', { player1: picks[player1], player2: picks[player2] });
          return picks;
        }
      } catch (e) {
        console.warn('Error parsing gameCardSelection:', e);
      }
    }
    
  } catch (error) {
    console.warn("Error loading picks:", error);
  }
  
  // Ensure picks has valid data for both players
  if (!picks[player1] || !Array.isArray(picks[player1]) || picks[player1].length === 0) {
    picks[player1] = []; // All card data has been removed - ready for new cards
    console.log('Using empty cards for player1:', picks[player1]);
  }
  if (!picks[player2] || !Array.isArray(picks[player2]) || picks[player2].length === 0) {
    picks[player2] = []; // All card data has been removed - ready for new cards
    console.log('Using empty cards for player2:', picks[player2]);
  }
  
  return picks;
}

// Load picks dynamically
let picks = loadPlayerPicks();

let round = parseInt(localStorage.getItem("currentRound") || "0");

// Scores init/persist with error handling
let scores = {};
try {
  scores = JSON.parse(localStorage.getItem("scores") || "{}");
} catch (error) {
  console.warn("Error parsing scores:", error);
  scores = {};
}

if (Object.keys(scores).length === 0 || round === 0) {
  scores[player1] = startingHP;
  scores[player2] = startingHP;
}

// Storage keys
const P1_ABILITIES_KEY = "player1Abilities";
const P2_ABILITIES_KEY = "player2Abilities";
// ✅ مفتاح حفظ الملاحظات - تبقى محفوظة للجولات التالية
const NOTES_KEY = (name, roundNumber = null) => {
  const currentRound = roundNumber !== null ? roundNumber : round;
  return `notes:${name}:round${currentRound}`;
};
const USED_ABILITIES_KEY = "usedAbilities";
const ABILITY_REQUESTS_KEY = "abilityRequests";

// ---- UI roots ----
const roundTitle = document.querySelector(".topbar h1");
const leftName   = document.querySelector(".player-column .name");
const rightName  = document.querySelector(".right-panel .name");
const leftCard   = document.querySelector(".player-column .big-card");
const rightCard  = document.querySelector(".right-panel .big-card");
const leftNotes  = document.querySelector(".player-column .notes textarea");
const rightNotes = document.querySelector(".right-panel .notes textarea");

// Track shown notifications to avoid duplicates
let shownNotifications = new Set();

/* ---------------------- Toast ---------------------- */
function showToast(message, actions = []) {
  const wrap = document.createElement("div");
  wrap.style.cssText = `
    position:fixed; left:50%; transform:translateX(-50%);
    bottom:18px; z-index:3000; background:#222; color:#fff;
    border:2px solid #ffffff; border-radius:12px; padding:10px 14px;
    box-shadow:0 8px 18px rgba(0,0,0,.35); font-weight:700;
    font-family:"Cairo",sans-serif;
  `;
  const msg = document.createElement("div");
  
  // Check if message starts with "!" and style it red
  if (message.startsWith("! ")) {
    const icon = document.createElement("span");
    icon.textContent = "!";
    icon.style.color = "#dc2626"; // Red color
    icon.style.fontWeight = "bold";
    icon.style.fontSize = "18px";
    
    const text = document.createElement("span");
    text.textContent = message.substring(2); // Remove "! " from the beginning
    
    msg.appendChild(icon);
    msg.appendChild(text);
  } else {
    msg.textContent = message;
  }
  
  msg.style.marginBottom = actions.length ? "8px" : "0";
  wrap.appendChild(msg);

  if (actions.length) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.justifyContent = "flex-end";
    actions.forEach(a => {
      const b = document.createElement("button");
      b.textContent = a.label;
      
      // Set different colors based on button label
      let backgroundColor = "#16a34a"; // Default green for "قبول"
      if (a.label === "رفض") {
        backgroundColor = "#dc2626"; // Red for "رفض"
      }
      
      b.style.cssText = `
        padding:6px 10px; border-radius:10px; border:none;
        background:${backgroundColor}; color:#fff; font-weight:800; cursor:pointer;
        font-family:"Cairo",sans-serif;
      `;
      b.onclick = () => { a.onClick?.(); document.body.removeChild(wrap); };
      row.appendChild(b);
    });
    wrap.appendChild(row);
  }

  document.body.appendChild(wrap);
  if (!actions.length) setTimeout(() => wrap.remove(), 1800);
}

/* ---------------------- Abilities helpers ---------------------- */
function loadAbilities(key){ 
  try{ 
    const a=JSON.parse(localStorage.getItem(key)||"[]"); 
    return Array.isArray(a)?a:[] 
  }catch(error){ 
    console.warn(`Error loading abilities for ${key}:`, error);
    return [] 
  } 
}

// Load abilities from player-specific keys
function loadPlayerAbilities(playerParam) {
  try {
    const abilitiesKey = `${playerParam}Abilities`;
    const usedAbilitiesKey = `${playerParam}UsedAbilities`;
    
    const abilities = JSON.parse(localStorage.getItem(abilitiesKey) || '[]');
    const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
    const usedSet = new Set(usedAbilities);
    
    return abilities.map(ability => {
      const abilityText = typeof ability === 'string' ? ability : ability.text || ability;
      return {
        text: abilityText,
        used: usedSet.has(abilityText) || (typeof ability === 'object' && ability.used === true)
      };
    });
  } catch (e) {
    console.error(`Error loading player abilities for ${playerParam}:`, e);
    return [];
  }
}
function saveAbilities(key, arr){ 
  try {
    localStorage.setItem(key, JSON.stringify(arr)); 
  } catch(error) {
    console.error(`Error saving abilities for ${key}:`, error);
  }
}

function loadUsedAbilities(){
  try {
    const used = JSON.parse(localStorage.getItem(USED_ABILITIES_KEY) || "{}");
    return used;
  } catch(error) {
    console.warn("Error loading used abilities:", error);
    localStorage.removeItem(USED_ABILITIES_KEY);
    return {};
  }
}

function saveUsedAbilities(usedAbilities){
  try {
    localStorage.setItem(USED_ABILITIES_KEY, JSON.stringify(usedAbilities));
    
    // Also trigger storage event manually for cross-page sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: USED_ABILITIES_KEY,
      newValue: localStorage.getItem(USED_ABILITIES_KEY),
      oldValue: localStorage.getItem(USED_ABILITIES_KEY),
      storageArea: localStorage
    }));
  } catch(error) {
    console.error("Error saving used abilities:", error);
    try {
      localStorage.removeItem(USED_ABILITIES_KEY);
      localStorage.setItem(USED_ABILITIES_KEY, JSON.stringify(usedAbilities));
    } catch(clearError) {
      console.error("Error clearing and saving used abilities:", clearError);
    }
  }
}

function isAbilityUsed(abilityText){
  try {
    const usedAbilities = loadUsedAbilities();
    return usedAbilities[abilityText] === true;
  } catch(error) {
    console.error("Error checking ability usage:", error);
    return false;
  }
}

// Ability request system
function loadAbilityRequests(){
  try {
    const requests = JSON.parse(localStorage.getItem(ABILITY_REQUESTS_KEY) || "[]");
    return requests;
  } catch(error) {
    console.warn("Error loading ability requests:", error);
    localStorage.removeItem(ABILITY_REQUESTS_KEY);
    return [];
  }
}

function saveAbilityRequests(requests){
  try {
    localStorage.setItem(ABILITY_REQUESTS_KEY, JSON.stringify(requests));
  } catch(error) {
    console.error("Error saving ability requests:", error);
  }
}

function updateAbilityRequestStatus(requestId, status){
  try {
    const requests = loadAbilityRequests();
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex !== -1) {
      requests[requestIndex].status = status;
      requests[requestIndex].resolvedAt = Date.now();
      saveAbilityRequests(requests);
      
      // Dispatch event to notify other pages
      window.dispatchEvent(new CustomEvent('abilityRequestUpdated', {
        detail: { requestId, status, request: requests[requestIndex] }
      }));
      
      // Also trigger storage event manually for cross-page sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: ABILITY_REQUESTS_KEY,
        newValue: localStorage.getItem(ABILITY_REQUESTS_KEY),
        oldValue: localStorage.getItem(ABILITY_REQUESTS_KEY),
        storageArea: localStorage
      }));
      
      return true;
    }
    return false;
  } catch(error) {
    console.error("Error updating ability request status:", error);
    return false;
  }
}

function getPendingRequests(){
  try {
    const requests = loadAbilityRequests();
    return requests.filter(req => req.status === 'pending');
  } catch(error) {
    console.error("Error getting pending requests:", error);
    return [];
  }
}

/* ---------------------- Media ---------------------- */
function createMedia(url, className){
  // Fix card paths for Netlify compatibility
  let fixedUrl = url;
  if (fixedUrl && !fixedUrl.startsWith('http') && !fixedUrl.startsWith('images/')) {
    if (fixedUrl.startsWith('CARD/')) {
      fixedUrl = fixedUrl.replace('CARD/', 'images/');
    } else if (!fixedUrl.startsWith('images/')) {
      fixedUrl = 'images/' + fixedUrl;
    }
  }
  
  const isWebm = /\.webm(\?|#|$)/i.test(fixedUrl || "");
  if (isWebm){
    const v=document.createElement("video");
    v.src=fixedUrl; 
    v.autoplay=true; 
    v.loop=true; 
    v.muted=true; 
    v.playsInline=true;
    v.style.width="100%"; 
    v.style.height="100%";
    v.style.objectFit="contain"; 
    v.style.borderRadius="12px";
    v.style.display="block";
    v.onerror = function() {
      console.error('Error loading video:', fixedUrl);
      this.style.display = 'none';
    };
    if (className) v.className=className;
    return v;
  } else {
    const img=document.createElement("img");
    img.src=fixedUrl;
    img.style.width="100%"; 
    img.style.height="100%";
    img.style.objectFit="contain"; 
    img.style.borderRadius="12px";
    img.style.display="block";
    img.onerror = function() {
      console.error('Error loading image:', fixedUrl);
      this.style.display = 'none';
    };
    if (className) img.className=className;
    return img;
  }
}

/* ---------------------- VS section ---------------------- */
function renderVs(){
  // Update player names in HTML
  const leftPlayerName = document.getElementById('leftPlayerName');
  const rightPlayerName = document.getElementById('rightPlayerName');
  
  if (leftPlayerName) {
    leftPlayerName.textContent = player2;
  }
  if (rightPlayerName) {
    rightPlayerName.textContent = player1;
  }
  
  // Update legacy elements for compatibility
  if (leftName) {
    leftName.textContent = player2;
  }
  if (rightName) {
    rightName.textContent = player1;
  }

  // Smooth card loading without clearing first
  if (leftCard) {
    const leftCardSrc = picks?.[player2]?.[round];
    if (leftCardSrc) {
      // Create new media element
      const newMedia = createMedia(leftCardSrc, "");
      // Replace content smoothly
      leftCard.innerHTML = "";
      leftCard.appendChild(newMedia);
      
      // Play voice for legendary card
      if (voiceSystem && voiceSystem.isLegendaryCard(leftCardSrc)) {
        voiceSystem.playVoice(leftCardSrc, player2);
      }
    } else {
      leftCard.innerHTML = '<div class="empty-hint">لا توجد بطاقة لهذه الجولة</div>';
    }
  }
  
  if (rightCard) {
    const rightCardSrc = picks?.[player1]?.[round];
    if (rightCardSrc) {
      // Create new media element
      const newMedia = createMedia(rightCardSrc, "");
      // Replace content smoothly
      rightCard.innerHTML = "";
      rightCard.appendChild(newMedia);
      
      // Play voice for legendary card
      if (voiceSystem && voiceSystem.isLegendaryCard(rightCardSrc)) {
        voiceSystem.playVoice(rightCardSrc, player1);
      }
    } else {
      rightCard.innerHTML = '<div class="empty-hint">لا توجد بطاقة لهذه الجولة</div>';
    }
  }

  // Update notes for current round
  updateNotesForRound();
  
  // Create voice control buttons
  if (voiceSystem && createVoiceControls) {
    createVoiceControls();
  }
  
  // Create replay buttons
  if (voiceSystem && createReplayButtons) {
    createReplayButtons();
  }
}

// Update notes for current round
function updateNotesForRound() {
  const leftNotes = document.getElementById("player1Notes");
  const rightNotes = document.getElementById("player2Notes");
  
  if (!leftNotes || !rightNotes) {
    console.warn('Notes elements not found');
    return;
  }
  
  // Smooth update without replacing elements
  try {
    const player1Notes = localStorage.getItem('notes:player1') || '';
    const player2Notes = localStorage.getItem('notes:player2') || '';
    
    // Update values smoothly
    leftNotes.value = player1Notes;
    rightNotes.value = player2Notes;
    
    console.log(`Notes updated smoothly for round ${round + 1}`);
  } catch (error) {
    console.error('Error updating notes:', error);
    leftNotes.value = "";
    rightNotes.value = "";
  }
}

/* ---------------------- Previous cards ---------------------- */
function renderPrev(){
  const getPrev = (name)=> (Array.isArray(picks?.[name])?picks[name]:[]).filter((_,i)=>i<round);
  const leftRow  = document.getElementById("historyRowLeft");
  const rightRow = document.getElementById("historyRowRight");
  const leftLbl  = document.getElementById("historyLabelLeft");
  const rightLbl = document.getElementById("historyLabelRight");

  if (round <= 0){
    if (leftRow) leftRow.classList.add("history-hidden");
    if (rightRow) rightRow.classList.add("history-hidden");
    if (leftLbl) leftLbl.classList.add("history-hidden");
    if (rightLbl) rightLbl.classList.add("history-hidden");
    return;
  }
  
  // Show history smoothly
  if (leftRow) leftRow.classList.remove("history-hidden");
  if (rightRow) rightRow.classList.remove("history-hidden");
  if (leftLbl) leftLbl.classList.remove("history-hidden");
  if (rightLbl) rightLbl.classList.remove("history-hidden");

  // Clear and rebuild smoothly
  if (leftRow) leftRow.innerHTML=""; 
  if (rightRow) rightRow.innerHTML="";
  
  // Show previous cards for player2 (left side)
  const player2Prev = getPrev(player2);
  if (player2Prev.length > 0 && leftRow) {
    player2Prev.forEach(src=>{
      const mini=document.createElement("div");
      mini.className="mini-card";
      mini.appendChild(createMedia(src,""));
      leftRow.appendChild(mini);
    });
  }
  
  // Show previous cards for player1 (right side)
  const player1Prev = getPrev(player1);
  if (player1Prev.length > 0 && rightRow) {
    player1Prev.forEach(src=>{
      const mini=document.createElement("div");
      mini.className="mini-card";
      mini.appendChild(createMedia(src,""));
      rightRow.appendChild(mini);
    });
  }
}

/* ---------------------- Abilities panels ---------------------- */
function abilityButton(text, onClick, isUsed = false){
  const b=document.createElement("button");
  b.className="btn";
  b.textContent=text;
  b.style.fontFamily = '"Cairo", sans-serif';     // ⬅ force Cairo on dynamic buttons
  b.onclick=onClick;
  
  // Add visual hint for clickable abilities
  b.title = isUsed ? "انقر لإلغاء تفعيل القدرة" : "انقر لتفعيل القدرة";
  b.style.cursor = "pointer";
  
  return b;
}

function renderAbilitiesPanel(key, container, fromName, toName){
  // Determine which player this is
  const playerParam = (fromName === player1) ? 'player1' : 'player2';
  
  // Load abilities from player-specific keys
  const abilities = loadPlayerAbilities(playerParam);
  
  // Clear container completely
  container.innerHTML = "";

  if (!abilities.length){
    const p=document.createElement("p");
    p.style.opacity=".7"; p.style.fontSize="12px"; p.textContent="لا توجد قدرات";
    p.style.fontFamily = '"Cairo", sans-serif';
    container.appendChild(p);
  } else {
    abilities.forEach((ab, idx)=>{
      const isUsed = ab.used;
      const displayText = isUsed ? `${ab.text} (مستخدمة)` : ab.text;
      
      const btn = abilityButton(displayText, ()=>{
        console.log(`Ability clicked: ${ab.text}, current state: ${isUsed}`);
        // Toggle ability usage for host
        const newUsedState = !isUsed;
        
        // Update used abilities for the specific player
        const usedAbilitiesKey = `${playerParam}UsedAbilities`;
        const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
        
        if (newUsedState) {
          // Add to used abilities
          if (!usedAbilities.includes(ab.text)) {
            usedAbilities.push(ab.text);
          }
        } else {
          // Remove from used abilities
          const filteredAbilities = usedAbilities.filter(ability => ability !== ab.text);
          usedAbilities.length = 0;
          usedAbilities.push(...filteredAbilities);
        }
        
        localStorage.setItem(usedAbilitiesKey, JSON.stringify(usedAbilities));
        
        // Update global used abilities
        const globalUsedAbilities = loadUsedAbilities();
        globalUsedAbilities[ab.text] = newUsedState;
        saveUsedAbilities(globalUsedAbilities);
        
        // Update abilities list
        const current = loadAbilities(key);
        if (current[idx]) {
          current[idx].used = newUsedState;
          saveAbilities(key, current);
        }
        
        // Force immediate update in current page
        setTimeout(() => renderPanels(), 100);
        
        // Force update in player pages by triggering a custom event
        window.dispatchEvent(new CustomEvent('abilityToggled', {
          detail: {
            playerParam: playerParam,
            abilityText: ab.text,
            isUsed: newUsedState
          }
        }));
        
        // Also trigger storage event for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
          key: `${playerParam}UsedAbilities`,
          newValue: localStorage.getItem(`${playerParam}UsedAbilities`),
          oldValue: localStorage.getItem(`${playerParam}UsedAbilities`),
          storageArea: localStorage
        }));
        
        // Also try postMessage to all possible windows
        try {
          const message = {
            type: 'ABILITY_TOGGLED',
            playerParam: playerParam,
            abilityText: ab.text,
            isUsed: newUsedState
          };
          
          // Send to parent window
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, '*');
          }
          
          // Send to opener window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, '*');
          }
          
          // Send to all frames
          for (let i = 0; i < window.frames.length; i++) {
            try {
              window.frames[i].postMessage(message, '*');
            } catch (e) {
              // Ignore cross-origin errors
            }
          }
        } catch (e) {
          console.error('Error sending postMessage:', e);
        }
        
        // Show enhanced toast notification
        const action = newUsedState ? "تم تعطيل" : "تم إعادة تفعيل";
        const icon = newUsedState ? "🔴" : "🟢";
        const playerName = fromName;
        
        console.log(`${icon} ${action} القدرة "${ab.text}" للاعب ${playerName}`);
        // showToast disabled - actions removed
        
        // Send notification to player directly
        const notification = {
          type: 'ability_toggle',
          playerParam: playerParam,
          abilityText: ab.text,
          isUsed: newUsedState,
          timestamp: Date.now(),
          fromHost: true
        };
        
        // Store notification with unique key to force change detection
        const notificationKey = `playerNotification_${Date.now()}`;
        localStorage.setItem(notificationKey, JSON.stringify(notification));
        localStorage.setItem('playerNotification', JSON.stringify(notification));
        
        // Also store in a way that player can detect
        const playerNotifications = JSON.parse(localStorage.getItem('allPlayerNotifications') || '[]');
        playerNotifications.push(notification);
        localStorage.setItem('allPlayerNotifications', JSON.stringify(playerNotifications));
        
        // Try BroadcastChannel if available
        try {
          if (window.broadcastChannel) {
            window.broadcastChannel.postMessage(notification);
          }
        } catch (e) {
          console.log('BroadcastChannel not available');
        }
        
        console.log(`📤 تم إرسال إشعار للاعب ${playerName}:`, notification);
      }, isUsed);
      
      // Update button appearance for used abilities
      if (isUsed) {
        btn.style.backgroundColor = "#666";
        btn.style.color = "#999";
      }
      
      // Add unique ID to prevent duplicates
      btn.id = `ability-${playerParam}-${idx}`;
      container.appendChild(btn);
    });
  }

  // Clear existing buttons to prevent duplicates
  const existingTransferBtn = container.querySelector('.transfer-btn');
  const existingAddBtn = container.querySelector('.add-ability-btn');
  if (existingTransferBtn) {
    existingTransferBtn.remove();
  }
  if (existingAddBtn) {
    existingAddBtn.remove();
  }
  
  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.gap = "8px";
  buttonContainer.style.marginTop = "10px";
  
  // Create transfer button
  const transferBtn=document.createElement("button");
  transferBtn.className="btn transfer-btn";
  transferBtn.style.fontFamily = '"Cairo", sans-serif';
  transferBtn.style.flex = "1";
  transferBtn.textContent="نقل";
  transferBtn.onclick=()=>openTransferModal(key, fromName, toName);
  transferBtn.id = `transfer-${playerParam}`;
  
  // Create add ability button
  const addBtn=document.createElement("button");
  addBtn.className="btn add-ability-btn";
  addBtn.style.fontFamily = '"Cairo", sans-serif';
  addBtn.style.flex = "1";
  addBtn.textContent="إضافة";
  addBtn.onclick=()=>openAddAbilityModal(playerParam);
  addBtn.id = `add-${playerParam}`;
  
  buttonContainer.appendChild(transferBtn);
  buttonContainer.appendChild(addBtn);
  container.appendChild(buttonContainer);
}

function renderPanels(){
  try {
    const player1Container = document.getElementById("player1AbilitiesContainer");
    const player2Container = document.getElementById("player2AbilitiesContainer");
    const player1Title = document.getElementById("player1AbilitiesTitle");
    const player2Title = document.getElementById("player2AbilitiesTitle");
    
    // Update ability titles smoothly
    if (player1Title) {
      player1Title.textContent = `قدرات ${player1}`;
    }
    if (player2Title) {
      player2Title.textContent = `قدرات ${player2}`;
    }
    
    // Clear and rebuild containers smoothly
    if (player1Container) {
      player1Container.innerHTML = '';
      renderAbilitiesPanel(P1_ABILITIES_KEY, player1Container, player1, player2);
    }
    if (player2Container) {
      player2Container.innerHTML = '';
      renderAbilitiesPanel(P2_ABILITIES_KEY, player2Container, player2, player1);
    }
    
    // ✅ لا نعيد تحميل الملاحظات عند تحديث القدرات - تبقى كما هي
    // updateNotesForRound(); // تم إزالة هذا السطر
    
    renderAbilityRequests();
  } catch(error) {
    console.error("Error rendering ability panels:", error);
  }
}

// Function to reload abilities dynamically
function reloadAbilitiesFromGameSetup() {
  try {
    console.log('Reloading abilities from game setup...');
    
    // First try to load from individual player ability keys (new system)
    const player1AbilitiesKey = 'player1Abilities';
    const player2AbilitiesKey = 'player2Abilities';
    
    let player1Abilities = [];
    let player2Abilities = [];
    
    // Load player 1 abilities
    if (localStorage.getItem(player1AbilitiesKey)) {
      try {
        const abilities = JSON.parse(localStorage.getItem(player1AbilitiesKey));
        if (Array.isArray(abilities)) {
          player1Abilities = abilities.map(ability => ({
            text: typeof ability === 'string' ? ability : ability.text || ability,
            used: false
          }));
          console.log('Loaded player1 abilities from new system:', player1Abilities);
        }
      } catch (e) {
        console.error('Error loading player1 abilities from new system:', e);
      }
    }
    
    // Load player 2 abilities
    if (localStorage.getItem(player2AbilitiesKey)) {
      try {
        const abilities = JSON.parse(localStorage.getItem(player2AbilitiesKey));
        if (Array.isArray(abilities)) {
          player2Abilities = abilities.map(ability => ({
            text: typeof ability === 'string' ? ability : ability.text || ability,
            used: false
          }));
          console.log('Loaded player2 abilities from new system:', player2Abilities);
        }
      } catch (e) {
        console.error('Error loading player2 abilities from new system:', e);
      }
    }
    
    // If we have abilities from new system, use them
    if (player1Abilities.length > 0 || player2Abilities.length > 0) {
      localStorage.setItem(P1_ABILITIES_KEY, JSON.stringify(player1Abilities));
      localStorage.setItem(P2_ABILITIES_KEY, JSON.stringify(player2Abilities));
      
      console.log('Abilities loaded from new system:', {
        player1: player1Abilities,
        player2: player2Abilities
      });
      
      // Re-render panels
      renderPanels();
      return true;
    }
    
    // Fallback: try to load from gameSetupProgress
    const gameSetup = localStorage.getItem('gameSetupProgress');
    if (gameSetup) {
      try {
        const gameData = JSON.parse(gameSetup);
        if (gameData.player1?.abilities && gameData.player2?.abilities) {
          const player1Abilities = gameData.player1.abilities.map(ability => ({
            text: ability,
            used: false
          }));
          const player2Abilities = gameData.player2.abilities.map(ability => ({
            text: ability,
            used: false
          }));
          
          localStorage.setItem(P1_ABILITIES_KEY, JSON.stringify(player1Abilities));
          localStorage.setItem(P2_ABILITIES_KEY, JSON.stringify(player2Abilities));
          
          console.log('Abilities reloaded from gameSetupProgress:', {
            player1: gameData.player1.abilities,
            player2: gameData.player2.abilities
          });
          
          // Re-render panels
          renderPanels();
          return true;
        }
      } catch (e) {
        console.error('Error reloading abilities from gameSetupProgress:', e);
      }
    }
    
    return false;
  } catch(error) {
    console.error("Error reloading abilities:", error);
    return false;
  }
}

// Render ability requests notifications
function renderAbilityRequests(){
  try {
    const requests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    const pendingRequests = requests.filter(req => req.status === 'pending');
    
    if (pendingRequests.length === 0) return;
    
    pendingRequests.forEach(request => {
      if (!shownNotifications.has(request.id)) {
        shownNotifications.add(request.id);
        
        console.log(`! ${request.playerName} يطلب استخدام القدرة: «${request.abilityText}»`);
        // showToast disabled - actions removed
      }
    });
    
  } catch(error) {
    console.error("Error rendering ability requests:", error);
  }
}

// Force immediate sync between pages
function forceImmediateSync() {
  window.dispatchEvent(new CustomEvent('forceAbilitySync'));
  window.dispatchEvent(new CustomEvent('abilityUsageChanged'));
  
  setTimeout(() => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: USED_ABILITIES_KEY,
      newValue: localStorage.getItem(USED_ABILITIES_KEY),
      oldValue: localStorage.getItem(USED_ABILITIES_KEY),
      storageArea: localStorage
    }));
  }, 10);
  
  setTimeout(() => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: ABILITY_REQUESTS_KEY,
      newValue: localStorage.getItem(ABILITY_REQUESTS_KEY),
      oldValue: localStorage.getItem(ABILITY_REQUESTS_KEY),
      storageArea: localStorage
    }));
  }, 20);
  
  setTimeout(() => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: P1_ABILITIES_KEY,
      newValue: localStorage.getItem(P1_ABILITIES_KEY),
      oldValue: localStorage.getItem(P1_ABILITIES_KEY),
      storageArea: localStorage
    }));
  }, 30);
  
  setTimeout(() => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: P2_ABILITIES_KEY,
      newValue: localStorage.getItem(P2_ABILITIES_KEY),
      oldValue: localStorage.getItem(P2_ABILITIES_KEY),
      storageArea: localStorage
    }));
  }, 40);
  
  renderPanels();
  setTimeout(() => renderPanels(), 100);
  setTimeout(() => renderPanels(), 200);
}

// Approve ability request
function approveAbilityRequest(requestId){
  try {
    const requests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    const request = requests.find(req => req.id === requestId);
    
    if (request) {
      // Update request status
      const updatedRequests = requests.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      );
      localStorage.setItem('abilityRequests', JSON.stringify(updatedRequests));
      
      // Mark ability as permanently used for the requesting player
      const usedAbilitiesKey = `${request.playerParam}UsedAbilities`;
      const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
      if (!usedAbilities.includes(request.abilityText)) {
        usedAbilities.push(request.abilityText);
        localStorage.setItem(usedAbilitiesKey, JSON.stringify(usedAbilities));
      }
      
      // Update abilities only for the requesting player
      const requestingPlayerAbilities = loadAbilities(request.playerParam === 'player1' ? P1_ABILITIES_KEY : P2_ABILITIES_KEY);
      
      let abilityUpdated = false;
      requestingPlayerAbilities.forEach(ability => {
        if (ability.text === request.abilityText) {
          ability.used = true;
          abilityUpdated = true;
        }
      });
      
      if (abilityUpdated) {
        const abilitiesKey = request.playerParam === 'player1' ? P1_ABILITIES_KEY : P2_ABILITIES_KEY;
        saveAbilities(abilitiesKey, requestingPlayerAbilities);
      }
      
      // Also update the player-specific abilities list
      const playerAbilitiesKey = `${request.playerParam}Abilities`;
      const playerAbilities = JSON.parse(localStorage.getItem(playerAbilitiesKey) || '[]');
      playerAbilities.forEach(ability => {
        const abilityText = typeof ability === 'string' ? ability : ability.text;
        if (abilityText === request.abilityText) {
          if (typeof ability === 'object') {
            ability.used = true;
          }
        }
      });
      localStorage.setItem(playerAbilitiesKey, JSON.stringify(playerAbilities));
      
      // Update global abilities lists
      const globalAbilitiesKey = request.playerParam === 'player1' ? 'P1_ABILITIES_KEY' : 'P2_ABILITIES_KEY';
      const globalAbilities = JSON.parse(localStorage.getItem(globalAbilitiesKey) || '[]');
      globalAbilities.forEach(ability => {
        if (ability.text === request.abilityText) {
          ability.used = true;
        }
      });
      localStorage.setItem(globalAbilitiesKey, JSON.stringify(globalAbilities));
      
      // Trigger storage event for player pages
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'abilityRequests',
        newValue: localStorage.getItem('abilityRequests'),
        oldValue: localStorage.getItem('abilityRequests'),
        storageArea: localStorage
      }));
      
      // Also trigger storage event for used abilities
      window.dispatchEvent(new StorageEvent('storage', {
        key: usedAbilitiesKey,
        newValue: localStorage.getItem(usedAbilitiesKey),
        oldValue: localStorage.getItem(usedAbilitiesKey),
        storageArea: localStorage
      }));
      
      renderPanels();
      setTimeout(() => renderPanels(), 50);
      setTimeout(() => renderPanels(), 100);
      
        console.log(`تمت الموافقة على استخدام ${request.abilityText} من ${request.playerName}`);
      
      shownNotifications.delete(requestId);
      
      // Navigate to player page after approving ability request
      navigateToPlayerPage(request.playerParam, request.playerName);
      
      console.log(`Approved ability: ${request.abilityText} for ${request.playerName}`);
    }
  } catch(error) {
    console.error("Error approving ability request:", error);
        console.log("حدث خطأ في الموافقة على الطلب");
  }
}

// Reject ability request
function rejectAbilityRequest(requestId){
  try {
    const requests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    const request = requests.find(req => req.id === requestId);
    
    if (request) {
      // Update request status
      const updatedRequests = requests.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' } : req
      );
      localStorage.setItem('abilityRequests', JSON.stringify(updatedRequests));
      
      // Remove ability from used abilities for the requesting player
      const usedAbilitiesKey = `${request.playerParam}UsedAbilities`;
      const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
      const filteredAbilities = usedAbilities.filter(ability => ability !== request.abilityText);
      localStorage.setItem(usedAbilitiesKey, JSON.stringify(filteredAbilities));
      
      // Update abilities only for the requesting player
      const requestingPlayerAbilities = loadAbilities(request.playerParam === 'player1' ? P1_ABILITIES_KEY : P2_ABILITIES_KEY);
      
      let abilityUpdated = false;
      requestingPlayerAbilities.forEach(ability => {
        if (ability.text === request.abilityText) {
          ability.used = false;
          abilityUpdated = true;
        }
      });
      
      if (abilityUpdated) {
        const abilitiesKey = request.playerParam === 'player1' ? P1_ABILITIES_KEY : P2_ABILITIES_KEY;
        saveAbilities(abilitiesKey, requestingPlayerAbilities);
      }
      
      // Trigger storage event for player pages
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'abilityRequests',
        newValue: localStorage.getItem('abilityRequests'),
        oldValue: localStorage.getItem('abilityRequests'),
        storageArea: localStorage
      }));
      
      renderPanels();
      setTimeout(() => renderPanels(), 50);
      setTimeout(() => renderPanels(), 100);
      
        console.log(`تم رفض استخدام ${request.abilityText} من ${request.playerName}`);
      
      shownNotifications.delete(requestId);
      
      console.log(`Rejected ability: ${request.abilityText} for ${request.playerName}`);
    }
  } catch(error) {
    console.error("Error rejecting ability request:", error);
        console.log("حدث خطأ في رفض الطلب");
  }
}

// Restore ability (make it available again for requesting)
function restoreAbility(abilityText, playerName) {
  try {
    console.log(`Restoring ability: ${abilityText} for ${playerName}`);
    
    // Find the player parameter for this player name
    let playerParam = null;
    if (playerName === player1) {
      playerParam = 'player1';
    } else if (playerName === player2) {
      playerParam = 'player2';
    }
    
    if (playerParam) {
      // Remove from used abilities for the specific player
      const usedAbilitiesKey = `${playerParam}UsedAbilities`;
      const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
      const filteredAbilities = usedAbilities.filter(ability => ability !== abilityText);
      localStorage.setItem(usedAbilitiesKey, JSON.stringify(filteredAbilities));
    }
    
    // Update abilities only for the specific player
    if (playerParam) {
      const playerAbilities = loadAbilities(playerParam === 'player1' ? P1_ABILITIES_KEY : P2_ABILITIES_KEY);
      
      let abilityUpdated = false;
      playerAbilities.forEach(ability => {
        if (ability.text === abilityText) {
          ability.used = false;
          abilityUpdated = true;
        }
      });
      
      if (abilityUpdated) {
        const abilitiesKey = playerParam === 'player1' ? P1_ABILITIES_KEY : P2_ABILITIES_KEY;
        saveAbilities(abilitiesKey, playerAbilities);
      }
    }
    
    // Remove any pending requests for this ability
    const requests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    const filteredRequests = requests.filter(req => 
      !(req.abilityText === abilityText && req.playerName === playerName)
    );
    localStorage.setItem('abilityRequests', JSON.stringify(filteredRequests));
    
    // Trigger storage event for player pages
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'abilityRequests',
      newValue: localStorage.getItem('abilityRequests'),
      oldValue: localStorage.getItem('abilityRequests'),
      storageArea: localStorage
    }));

    // ✅ إرسال إشعار مباشر للاعبين مثل toggle
    window.dispatchEvent(new CustomEvent('abilityToggled', {
      detail: {
        playerParam: playerParam,
        abilityText: abilityText,
        isUsed: false   // القدرة أصبحت غير مستخدمة (متاحة)
      }
    }));

    // ✅ إرسال postMessage للاعبين
    try {
      const message = {
        type: 'ABILITY_TOGGLED',
        playerParam: playerParam,
        abilityText: abilityText,
        isUsed: false
      };
      
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(message, '*');
      }
      for (let i = 0; i < window.frames.length; i++) {
        try {
          window.frames[i].postMessage(message, '*');
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error sending postMessage:', e);
    }

    renderPanels();
    setTimeout(() => renderPanels(), 50);
    setTimeout(() => renderPanels(), 100);
    
        console.log(`تم إعادة القدرة ${abilityText} لـ ${playerName}`);
    
    console.log(`Restored ability: ${abilityText} for ${playerName}`);
    return true;
  } catch(error) {
    console.error("Error restoring ability:", error);
        console.log("حدث خطأ في إعادة القدرة");
    return false;
  }
}

/* ---------------------- Add Ability Modal ---------------------- */
function openAddAbilityModal(playerParam) {
  const playerName = playerParam === 'player1' ? player1 : player2;
  
  // Get the modal from HTML
  const modal = document.getElementById("addAbilityModal");
  if (!modal) {
    console.error('Add ability modal not found in HTML');
    return;
  }
  
  // Update title
  const title = document.getElementById("addAbilityTitle");
  title.textContent = `إضافة قدرة جديدة - ${playerName}`;
  
  // Clear inputs
  document.getElementById("newAbilityInput").value = "";
  document.getElementById("bulkAbilitiesInput").value = "";
  
  // Store player parameter
  modal.dataset.playerParam = playerParam;
  
  // Show modal
  modal.classList.add("active");
  
  // Focus on input and setup keyboard shortcuts
  setTimeout(() => {
    const input = document.getElementById("newAbilityInput");
    const textarea = document.getElementById("bulkAbilitiesInput");
    
    input.focus();
    
    // Remove existing event listeners to prevent duplicates
    input.removeEventListener('keypress', handleEnterKey);
    textarea.removeEventListener('keydown', handleCtrlEnter);
    
    // Add new event listeners
    input.addEventListener('keypress', handleEnterKey);
    textarea.addEventListener('keydown', handleCtrlEnter);
    
    function handleEnterKey(e) {
      if (e.key === 'Enter') {
        confirmAddAbility();
      }
    }
    
    function handleCtrlEnter(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        confirmAddAbility();
      }
    }
  }, 100);
}

function closeAddAbilityModal() {
  const modal = document.getElementById("addAbilityModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function confirmAddAbility() {
  const modal = document.getElementById("addAbilityModal");
  const playerParam = modal.dataset.playerParam;
  const playerName = playerParam === 'player1' ? player1 : player2;
  
  const singleInput = document.getElementById("newAbilityInput");
  const bulkInput = document.getElementById("bulkAbilitiesInput");
  
  const singleAbility = singleInput.value.trim();
  const bulkAbilities = bulkInput.value.trim();
  
  // Check if both fields are empty
  if (!singleAbility && !bulkAbilities) {
    showToast("! يرجى إدخال قدرة واحدة أو عدة قدرات", 'error');
    return;
  }
  
  let abilitiesToAdd = [];
  
  // Process single ability
  if (singleAbility) {
    abilitiesToAdd.push(singleAbility);
  }
  
  // Process bulk abilities
  if (bulkAbilities) {
    const bulkList = bulkAbilities
      .split('\n')
      .map(ability => ability.trim())
      .filter(ability => ability.length > 0);
    abilitiesToAdd.push(...bulkList);
  }
  
  if (abilitiesToAdd.length === 0) {
    showToast("! لم يتم العثور على قدرات صحيحة", 'error');
    return;
  }
  
  try {
    // 1. Add to player's abilities
    const playerAbilitiesKey = `${playerParam}Abilities`;
    const currentAbilities = JSON.parse(localStorage.getItem(playerAbilitiesKey) || '[]');
    
    // Check for duplicates within player's abilities
    const newAbilities = [];
    const duplicates = [];
    
    abilitiesToAdd.forEach(ability => {
      const exists = currentAbilities.some(existing => {
        const existingText = typeof existing === 'string' ? existing : existing.text;
        return existingText === ability;
      });
      
      if (exists) {
        duplicates.push(ability);
      } else {
        newAbilities.push(ability);
      }
    });
    
    // Add new abilities to player
    if (newAbilities.length > 0) {
      newAbilities.forEach(ability => {
        currentAbilities.push({ text: ability, used: false });
      });
      localStorage.setItem(playerAbilitiesKey, JSON.stringify(currentAbilities));
    }
    
    // 2. Add to global abilities library (savedAbilities)
    const savedAbilities = JSON.parse(localStorage.getItem('savedAbilities') || '[]');
    const globalNewAbilities = [];
    const globalDuplicates = [];
    
    abilitiesToAdd.forEach(ability => {
      if (savedAbilities.includes(ability)) {
        globalDuplicates.push(ability);
      } else {
        globalNewAbilities.push(ability);
      }
    });
    
    // Add new abilities to global library
    if (globalNewAbilities.length > 0) {
      savedAbilities.push(...globalNewAbilities);
      localStorage.setItem('savedAbilities', JSON.stringify(savedAbilities));
    }
    
    // 3. Update gameSetupProgress if it exists
    const gameSetupProgress = JSON.parse(localStorage.getItem('gameSetupProgress') || '{}');
    if (gameSetupProgress[playerParam] && gameSetupProgress[playerParam].abilities) {
      const gameSetupAbilities = gameSetupProgress[playerParam].abilities;
      abilitiesToAdd.forEach(ability => {
        if (!gameSetupAbilities.includes(ability)) {
          gameSetupAbilities.push(ability);
        }
      });
      localStorage.setItem('gameSetupProgress', JSON.stringify(gameSetupProgress));
    }
    
    // 4. Update global abilities lists (P1_ABILITIES_KEY, P2_ABILITIES_KEY)
    const globalKey = playerParam === 'player1' ? P1_ABILITIES_KEY : P2_ABILITIES_KEY;
    const globalAbilities = JSON.parse(localStorage.getItem(globalKey) || '[]');
    
    abilitiesToAdd.forEach(ability => {
      const exists = globalAbilities.some(existing => {
        const existingText = typeof existing === 'string' ? existing : existing.text;
        return existingText === ability;
      });
      
      if (!exists) {
        globalAbilities.push({ text: ability, used: false });
      }
    });
    
    localStorage.setItem(globalKey, JSON.stringify(globalAbilities));
    
    // 5. Re-render panels
    renderPanels();
    
    // 6. Close modal
    closeAddAbilityModal();
    
    // 7. Show success message
    const successMessage = `تم إضافة ${newAbilities.length} قدرة جديدة للاعب ${playerName}`;
    showToast(successMessage, 'success');
    
    // 8. Show info about duplicates if any
    if (duplicates.length > 0) {
      console.log(`تم تجاهل ${duplicates.length} قدرة مكررة للاعب: ${duplicates.join(', ')}`);
    }
    
    if (globalNewAbilities.length > 0) {
      console.log(`تم إضافة ${globalNewAbilities.length} قدرة جديدة للمكتبة العامة`);
    }
    
    console.log(`✅ تمت إضافة القدرات بنجاح للاعب ${playerName}:`, newAbilities);
    
    // 9. Trigger storage events to notify other pages
    window.dispatchEvent(new StorageEvent('storage', {
      key: playerAbilitiesKey,
      newValue: localStorage.getItem(playerAbilitiesKey),
      oldValue: localStorage.getItem(playerAbilitiesKey),
      storageArea: localStorage
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'savedAbilities',
      newValue: localStorage.getItem('savedAbilities'),
      oldValue: localStorage.getItem('savedAbilities'),
      storageArea: localStorage
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: globalKey,
      newValue: localStorage.getItem(globalKey),
      oldValue: localStorage.getItem(globalKey),
      storageArea: localStorage
    }));
    
    // 10. Notify abilities-setup.html page if it's open
    try {
      // Send message to abilities-setup page
      const message = {
        type: 'ABILITIES_ADDED',
        playerParam: playerParam,
        abilities: newAbilities,
        globalAbilities: globalNewAbilities,
        timestamp: Date.now()
      };
      
      // Try to send to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
      
      // Try to send to opener window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(message, '*');
      }
      
      // Try BroadcastChannel if available
      if (window.broadcastChannel) {
        window.broadcastChannel.postMessage(message);
      }
      
      console.log('📤 تم إرسال إشعار لصفحة abilities-setup:', message);
    } catch (e) {
      console.log('لم يتم إرسال الإشعار لصفحة abilities-setup:', e);
    }
    
    // 11. Notify player-cards.html page if it's open
    try {
      const playerCardsMessage = {
        type: 'PLAYER_ABILITIES_UPDATED',
        playerParam: playerParam,
        playerName: playerName,
        abilities: newAbilities,
        timestamp: Date.now()
      };
      
      // Try to send to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(playerCardsMessage, '*');
      }
      
      // Try to send to opener window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(playerCardsMessage, '*');
      }
      
      // Try BroadcastChannel if available
      if (window.broadcastChannel) {
        window.broadcastChannel.postMessage(playerCardsMessage);
      }
      
      console.log('📤 تم إرسال إشعار لصفحة player-cards:', playerCardsMessage);
    } catch (e) {
      console.log('لم يتم إرسال الإشعار لصفحة player-cards:', e);
    }
    
  } catch (error) {
    console.error('Error adding abilities:', error);
    showToast("! حدث خطأ في إضافة القدرات", 'error');
  }
}

// Make functions globally available
window.approveAbilityRequest = approveAbilityRequest;
window.rejectAbilityRequest = rejectAbilityRequest;
window.restoreAbility = restoreAbility;
window.confirmResult = confirmResult;
window.confirmWinner = confirmWinner;
window.changeHealth = changeHealth;
window.saveNotes = saveNotes;
window.clearNotes = clearNotes;
window.showPreviousNotes = showPreviousNotes;
window.confirmTransfer = confirmTransfer;
window.closeTransferModal = closeTransferModal;
window.openTransferModal = openTransferModal;
window.openRestoreModal = openRestoreModal;
window.openAddAbilityModal = openAddAbilityModal;
window.closeAddAbilityModal = closeAddAbilityModal;
window.confirmAddAbility = confirmAddAbility;

// Swap deck functions will be defined later in the file

/* ---------------------- Swap Deck System REMOVED ---------------------- */

/* ---------------------- Transfer modal ---------------------- */
function openTransferModal(fromKey, fromName, toName){
  const list = loadAbilities(fromKey);
  const modal = document.getElementById("transferModal");
  const grid  = document.getElementById("abilityGrid");
  const title = document.getElementById("transferTitle");
  title.textContent = `اختر القدرة المراد نقلها إلى ${toName} (ستُزال منك)`;
  title.style.fontFamily = '"Cairo", sans-serif';

  grid.innerHTML="";
  if (!list.length){
    const p=document.createElement("p");
    p.style.color="#ffed7a"; p.textContent="لا توجد قدرات لنقلها.";
    p.style.fontFamily = '"Cairo", sans-serif';
    grid.appendChild(p);
  } else {
    list.forEach((ab, idx)=>{
      const opt=document.createElement("div");
      opt.className="ability-option";
      opt.style.fontFamily = '"Cairo", sans-serif';
      opt.textContent = ab.text;
      opt.onclick = ()=>{
        const sender = loadAbilities(fromKey);
        const moved  = sender.splice(idx,1)[0];
        saveAbilities(fromKey, sender);

        const toKey = (toName === player1) ? P1_ABILITIES_KEY : P2_ABILITIES_KEY;
        const receiver = loadAbilities(toKey);
        receiver.push({ text:moved.text, used:moved.used });
        saveAbilities(toKey, receiver);

        closeTransferModal();
        renderPanels();
        console.log(`تم نقل «${moved.text}» إلى ${toName}`);
      };
      grid.appendChild(opt);
    });
  }
  modal.classList.add("active");
}
function closeTransferModal(){ document.getElementById("transferModal").classList.remove("active"); }

function confirmTransfer(){
  // This function is called when the transfer modal is confirmed
  // The actual transfer logic is handled in openTransferModal
  closeTransferModal();
}

// Open restore ability modal
function openRestoreModal(key, fromName, usedAbilities){
  const modal = document.getElementById("transferModal");
  const grid  = document.getElementById("abilityGrid");
  const title = document.getElementById("transferTitle");
  title.textContent = `اختر القدرة المراد استعادتها لـ ${fromName}`;
  title.style.fontFamily = '"Cairo", sans-serif';

  grid.innerHTML="";
  if (!usedAbilities.length){
    const p=document.createElement("p");
    p.style.color="#ffed7a"; p.textContent="لا توجد قدرات مستخدمة لاستعادتها.";
    p.style.fontFamily = '"Cairo", sans-serif';
    grid.appendChild(p);
  } else {
    usedAbilities.forEach((ab, idx)=>{
      const opt=document.createElement("div");
      opt.className="ability-option";
      opt.style.fontFamily = '"Cairo", sans-serif';
      opt.textContent = ab.text;
      opt.onclick = ()=>{
        restoreAbility(ab.text, fromName);
        closeTransferModal();
        renderPanels();
        console.log(`تم استعادة «${ab.text}» لـ ${fromName}`);
      };
      grid.appendChild(opt);
    });
  }
  modal.classList.add("active");
}

/* ---------------------- Health controls ---------------------- */
function wireHealth(name, decEl, incEl, valueEl){
  if (!decEl || !incEl || !valueEl) {
    console.warn(`Missing elements for ${name} health controls`);
    return;
  }
  
  const clamp = (n)=>Math.max(0, Math.min(startingHP,n));
  const refresh = ()=>{ 
    valueEl.textContent=String(scores[name]); 
    valueEl.classList.toggle("red", scores[name] <= Math.ceil(startingHP/2)); 
  };

  // Store parent reference before replacing elements
  const parentEl = decEl.parentNode;
  
  // Clear existing listeners
  decEl.replaceWith(decEl.cloneNode(true));
  incEl.replaceWith(incEl.cloneNode(true));
  
  // Get fresh references using the stored parent
  const newDecEl = parentEl ? parentEl.querySelector(".round-btn:last-child") : null;
  const newIncEl = parentEl ? parentEl.querySelector(".round-btn:first-child") : null;
  
  // Add unique IDs to prevent conflicts
  if (newDecEl) newDecEl.id = `dec-${name}`;
  if (newIncEl) newIncEl.id = `inc-${name}`;
  
  if (newDecEl && newIncEl) {
    newDecEl.onclick = ()=>{ 
      console.log(`Decreasing health for ${name}`);
      scores[name]=clamp(scores[name]-1); 
      refresh(); 
      localStorage.setItem("scores", JSON.stringify(scores)); 
    };
    newIncEl.onclick = ()=>{ 
      console.log(`Increasing health for ${name}`);
      scores[name]=clamp(scores[name]+1); 
      refresh(); 
      localStorage.setItem("scores", JSON.stringify(scores)); 
    };
    console.log(`Health buttons wired for ${name}`);
  } else {
    console.warn(`Could not find health buttons for ${name}`);
  }
  
  refresh();
}

/* ---------------------- Round render ---------------------- */
function renderRound(){
  // Reload picks dynamically before rendering
  picks = loadPlayerPicks();
  
  // Update round title smoothly
  roundTitle.textContent = `الجولة ${round + 1}`;
  
  // Render all components smoothly
  renderVs();
  renderPrev();
  
  // ✅ تحميل الملاحظات مرة واحدة فقط عند بداية الجولة
  updateNotesForRound();
  
  renderPanels();

  // Wire health controls with proper event handling
  const player2DecBtn = document.querySelector(".player-column .round-btn:last-child");
  const player2IncBtn = document.querySelector(".player-column .round-btn:first-child");
  const player1DecBtn = document.querySelector(".right-panel .round-btn:last-child");
  const player1IncBtn = document.querySelector(".right-panel .round-btn:first-child");
  
  if (player2DecBtn && player2IncBtn) {
    wireHealth(player2, player2DecBtn, player2IncBtn, document.getElementById("health1"));
  }
  if (player1DecBtn && player1IncBtn) {
    wireHealth(player1, player1DecBtn, player1IncBtn, document.getElementById("health2"));
  }
  
  // Ensure confirm button is properly wired
  const confirmBtn = document.querySelector(".confirm");
  if (confirmBtn) {
    // Remove existing listeners to prevent duplicates
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    const newConfirmBtn = document.querySelector(".confirm");
    newConfirmBtn.onclick = confirmResult;
    newConfirmBtn.id = "confirm-result-btn";
    console.log('Confirm button wired successfully');

    // Nudge the confirm button down slightly for better spacing
    try {
      const confirmWrap = document.querySelector('.confirm-wrap');
      if (confirmWrap) {
        if (!confirmWrap.style.marginTop || parseInt(confirmWrap.style.marginTop) < 20) {
          confirmWrap.style.marginTop = '24px';
        }
      } else if (newConfirmBtn && (!newConfirmBtn.style.marginTop || parseInt(newConfirmBtn.style.marginTop) < 16)) {
        newConfirmBtn.style.marginTop = '16px';
      }
    } catch (e) {
      console.warn('Could not adjust confirm button spacing:', e);
    }
  } else {
    console.warn('Confirm button not found');
  }
  
  
}

function confirmWinner(){
  localStorage.setItem("scores", JSON.stringify(scores));
  round++;
  localStorage.setItem("currentRound", round);

  const over = round >= roundCount || scores[player1] === 0 || scores[player2] === 0;
  if (over){
    localStorage.setItem("scores", JSON.stringify(scores));
    // ✅ لا نمسح ملاحظات الجولات السابقة - تبقى محفوظة لكل لاعب منفصل
    // ✅ لا نمسح الملاحظات نهائياً - تبقى محفوظة للجولات التالية
    localStorage.removeItem(USED_ABILITIES_KEY);
    localStorage.removeItem(ABILITY_REQUESTS_KEY);
    shownNotifications.clear();
    
    // Notify player views that game is over
    localStorage.setItem('gameStatus', 'finished');
    localStorage.setItem('gameUpdate', Date.now().toString());
    
    // Show winner
    const winner = scores[player1] > scores[player2] ? player1 : scores[player2] > scores[player1] ? player2 : "تعادل";
    console.log(`انتهت المعركة! الفائز: ${winner}`);
    
    // Reset for new battle
    localStorage.setItem('currentRound', '0');
    location.href="final-result.html";
  } else {
    // ✅ لا نمسح الملاحظات عند الانتقال للجولة التالية
    localStorage.removeItem(USED_ABILITIES_KEY);
    localStorage.removeItem(ABILITY_REQUESTS_KEY);
    shownNotifications.clear();
    
    // Clear previous voices for new round
    if (voiceSystem && voiceSystem.clearPreviousVoices) {
      voiceSystem.clearPreviousVoices();
    }
    
    // ✅ الحفاظ على حالة استخدام دكة البدلاء عبر الجولات
    console.log('🎴 Preserving swap deck usage state across rounds');
    
    // Notify player views of round update BEFORE reload
    console.log('Notifying player views of round update...');
    localStorage.setItem('gameStatus', 'active');
    localStorage.setItem('gameUpdate', Date.now().toString());
    localStorage.setItem('roundUpdate', Date.now().toString());
    
    // Dispatch custom event for same-tab communication
    window.dispatchEvent(new CustomEvent('roundUpdated', {
      detail: { round, scores, player1, player2 }
    }));
    
    // Update the page content without reloading to avoid flash
    updatePageContent();
  }
}

// Update page content without reloading
function updatePageContent() {
  try {
    // Update round title smoothly
    const roundTitle = document.querySelector('.topbar h1');
    if (roundTitle) {
      roundTitle.textContent = `الجولة ${round}`;
    }
    
    // Update health values smoothly
    const health1Element = document.getElementById('health1');
    const health2Element = document.getElementById('health2');
    if (health1Element) health1Element.textContent = scores[player1];
    if (health2Element) health2Element.textContent = scores[player2];
    
    // Update health colors smoothly
    if (health1Element) {
      health1Element.classList.toggle("red", scores[player1] <= Math.ceil(startingHP/2));
    }
    if (health2Element) {
      health2Element.classList.toggle("red", scores[player2] <= Math.ceil(startingHP/2));
    }
    
    // Reset confirm button smoothly
    const confirmBtn = document.querySelector('.confirm');
    if (confirmBtn) {
      confirmBtn.textContent = 'تأكيد النتيجة';
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
    }
    
    // Update cards and other elements smoothly
    renderRound();
    
    console.log('Page content updated smoothly for round', round);
  } catch (error) {
    console.error('Error updating page content:', error);
    // Fallback to reload if update fails
    setTimeout(() => {
      location.reload();
    }, 100);
  }
}

// Initialize game data if missing
function initializeGameData() {
  // First try to load from individual player ability keys (new system)
  const player1AbilitiesKey = 'player1Abilities';
  const player2AbilitiesKey = 'player2Abilities';
  
  let player1Abilities = [];
  let player2Abilities = [];
  
  // Load player 1 abilities
  if (localStorage.getItem(player1AbilitiesKey)) {
    try {
      const abilities = JSON.parse(localStorage.getItem(player1AbilitiesKey));
      if (Array.isArray(abilities)) {
        // Load used abilities for player 1
        const usedAbilities = JSON.parse(localStorage.getItem('player1UsedAbilities') || '[]');
        const usedSet = new Set(usedAbilities);
        
        player1Abilities = abilities.map(ability => {
          const abilityText = typeof ability === 'string' ? ability : ability.text || ability;
          return {
            text: abilityText,
            used: usedSet.has(abilityText) || (typeof ability === 'object' && ability.used === true)
          };
        });
        console.log('Loaded player1 abilities from new system:', player1Abilities);
      }
    } catch (e) {
      console.error('Error loading player1 abilities from new system:', e);
    }
  }
  
  // Load player 2 abilities
  if (localStorage.getItem(player2AbilitiesKey)) {
    try {
      const abilities = JSON.parse(localStorage.getItem(player2AbilitiesKey));
      if (Array.isArray(abilities)) {
        // Load used abilities for player 2
        const usedAbilities = JSON.parse(localStorage.getItem('player2UsedAbilities') || '[]');
        const usedSet = new Set(usedAbilities);
        
        player2Abilities = abilities.map(ability => {
          const abilityText = typeof ability === 'string' ? ability : ability.text || ability;
          return {
            text: abilityText,
            used: usedSet.has(abilityText) || (typeof ability === 'object' && ability.used === true)
          };
        });
        console.log('Loaded player2 abilities from new system:', player2Abilities);
      }
    } catch (e) {
      console.error('Error loading player2 abilities from new system:', e);
    }
  }
  
  // If we have abilities from new system, use them
  if (player1Abilities.length > 0 || player2Abilities.length > 0) {
    localStorage.setItem(P1_ABILITIES_KEY, JSON.stringify(player1Abilities));
    localStorage.setItem(P2_ABILITIES_KEY, JSON.stringify(player2Abilities));
    
    console.log('Abilities loaded from new system:', {
      player1: player1Abilities,
      player2: player2Abilities
    });
  } else {
    // Fallback: try to load from gameSetupProgress
    if (gameSetupProgress.player1?.abilities && gameSetupProgress.player2?.abilities) {
      const player1Abilities = gameSetupProgress.player1.abilities.map(ability => ({
        text: ability,
        used: false
      }));
      const player2Abilities = gameSetupProgress.player2.abilities.map(ability => ({
        text: ability,
        used: false
      }));
      
      localStorage.setItem(P1_ABILITIES_KEY, JSON.stringify(player1Abilities));
      localStorage.setItem(P2_ABILITIES_KEY, JSON.stringify(player2Abilities));
      
      console.log('Loaded abilities from gameSetupProgress:', {
        player1: gameSetupProgress.player1.abilities,
        player2: gameSetupProgress.player2.abilities
      });
    } else {
      // Set empty arrays if still no abilities found
      if (!localStorage.getItem(P1_ABILITIES_KEY)) {
        localStorage.setItem(P1_ABILITIES_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(P2_ABILITIES_KEY)) {
        localStorage.setItem(P2_ABILITIES_KEY, JSON.stringify([]));
      }
    }
  }
  
  if (!gameSetupProgress.player1 || !gameSetupProgress.player2) {
    if (!localStorage.getItem("player1") || !localStorage.getItem("player2")) {
      localStorage.setItem("player1", "اكاي");
      localStorage.setItem("player2", "شانكس");
    }
    if (!localStorage.getItem("totalRounds")) {
      localStorage.setItem("totalRounds", "5");
    }
  }
  
  if (!scores[player1]) {
    scores[player1] = startingHP;
  }
  if (!scores[player2]) {
    scores[player2] = startingHP;
  }
  localStorage.setItem("scores", JSON.stringify(scores));
  
  if (!localStorage.getItem(USED_ABILITIES_KEY)) {
    localStorage.setItem(USED_ABILITIES_KEY, JSON.stringify({}));
  }
  
  if (!localStorage.getItem(ABILITY_REQUESTS_KEY)) {
    localStorage.setItem(ABILITY_REQUESTS_KEY, JSON.stringify([]));
  }
}

// Function to refresh card data dynamically
function refreshCardData() {
  console.log('Refreshing card data...');
  picks = loadPlayerPicks();
  console.log('Updated picks:', picks);
  renderRound();
}

// Initialize and render with error handling
try {
  console.log('Initializing game...');
  initializeGameData();
  
  // Clear used abilities for new game if current round is 0
  const currentRound = parseInt(localStorage.getItem('currentRound') || '0');
  if (currentRound === 0) {
    clearUsedAbilities();
  }
  
  renderRound();
  
  // Listen for changes in used abilities from other pages
  window.addEventListener('storage', function(e) {
    if (e.key === USED_ABILITIES_KEY) {
      try {
        renderPanels();
      } catch(error) {
        console.error("Error re-rendering panels after storage change:", error);
      }
    }
    
    if (e.key === 'abilityRequests') {
      try {
        renderAbilityRequests();
        renderPanels();
      } catch(error) {
        console.error("Error re-rendering panels after ability requests change:", error);
      }
    }
    
    // Listen for gameSetupProgress changes to reload abilities and picks
    if (e.key === 'gameSetupProgress') {
      try {
        console.log('Game setup progress changed, reloading abilities and picks...');
        reloadAbilitiesFromGameSetup();
        
        // Reload gameSetupProgress and update picks
        gameSetupProgress = JSON.parse(localStorage.getItem("gameSetupProgress") || "{}");
        refreshCardData();
      } catch(error) {
        console.error("Error reloading abilities and picks after game setup change:", error);
      }
    }
    
    // Listen for player abilities changes
    if (e.key && (e.key.includes('Abilities') || e.key.includes('abilities'))) {
      try {
        console.log('Player abilities changed, reloading...');
        reloadAbilitiesFromGameSetup();
      } catch(error) {
        console.error("Error reloading abilities after player abilities change:", error);
      }
    }
    
    // Listen for ability usage changes
    if (e.key && e.key.includes('UsedAbilities')) {
      try {
        console.log('Ability usage changed, re-rendering panels...');
        renderPanels();
      } catch(error) {
        console.error("Error re-rendering panels after ability usage change:", error);
      }
    }
    
    // Listen for player abilities changes
    if (e.key && e.key.includes('Abilities')) {
      try {
        console.log('Player abilities changed, re-rendering panels...');
        renderPanels();
      } catch(error) {
        console.error("Error re-rendering panels after player abilities change:", error);
      }
    }
    
    // Listen for card arrangement changes
    if (e.key && (e.key.includes('CardArrangement') || e.key.includes('ArrangementCompleted'))) {
      try {
        console.log('Card arrangement changed, refreshing card data...');
        refreshCardData();
      } catch(error) {
        console.error("Error reloading picks after card arrangement change:", error);
      }
    }
    
    // Listen for Strategic order changes
    if (e.key && e.key.includes('StrategicOrdered')) {
      try {
        console.log('Strategic order changed, refreshing card data...');
        refreshCardData();
      } catch(error) {
        console.error("Error reloading picks after strategic order change:", error);
      }
    }
  });
  
  
  // Simple storage listener like result.js
  window.addEventListener('storage', function(e) {
    if (e.key && e.key.includes('Abilities')) {
      console.log(`Storage change detected: ${e.key}`);
      renderPanels();
    }
  });
  
  window.addEventListener('focus', function() {
    try {
      // Reload everything on focus
      console.log('Window focused, refreshing all data...');
      reloadAbilitiesFromGameSetup();
      refreshCardData();
      renderPanels();
    } catch(error) {
      console.error("Error re-rendering on focus:", error);
    }
  });
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      try {
        console.log('Tab visible, refreshing all data...');
        reloadAbilitiesFromGameSetup();
        refreshCardData();
        renderPanels();
      } catch(error) {
        console.error("Error re-rendering on visibility change:", error);
      }
    }
  });
  
  // Event listeners for ability system
  
  // Start ability request monitoring
  startAbilityRequestMonitoring();
  
  window.addEventListener('beforeunload', function() {
    shownNotifications.clear();
  });
  
} catch (error) {
  console.error("Error initializing game:", error);
    console.log("حدث خطأ في تحميل اللعبة. يرجى إعادة تحميل الصفحة.");
}

/* ---------------------- Confirm Result ---------------------- */
function confirmResult(){
  confirmWinner();
}

/* ---------------------- Health Controls ---------------------- */
function changeHealth(player, delta){
  try {
    const healthElement = document.getElementById(player === 'player1' ? 'health1' : 'health2');
    if (!healthElement) {
      console.error(`Health element not found for ${player}`);
      return;
    }
    
    const currentHealth = parseInt(healthElement.textContent) || 0;
    const newHealth = Math.max(0, Math.min(startingHP, currentHealth + delta));
    healthElement.textContent = newHealth;
    healthElement.classList.toggle("red", newHealth <= Math.ceil(startingHP/2));
    
    scores[player === 'player1' ? player1 : player2] = newHealth;
    localStorage.setItem("scores", JSON.stringify(scores));
  } catch(error) {
    console.error(`Error changing health for ${player}:`, error);
  }
}

/* ---------------------- Notes ---------------------- */
function saveNotes(player, value){
  // ✅ حفظ الملاحظات في localStorage لتكون دائمة
  try {
    const notesKey = `notes:${player}`;
    localStorage.setItem(notesKey, value);
    console.log(`Notes for ${player} saved: ${value}`);
  } catch (error) {
    console.error(`Error saving notes for ${player}:`, error);
  }
}

// مسح ملاحظات اللاعب
function clearNotes(player) {
  try {
    const notesElement = document.getElementById(player === 'player1' ? 'player1Notes' : 'player2Notes');
    
    if (notesElement) {
      notesElement.value = '';
      // مسح من localStorage أيضاً
      const notesKey = `notes:${player}`;
      localStorage.removeItem(notesKey);
      console.log(`تم مسح ملاحظات ${player} من المربع و localStorage`);
    }
  } catch(error) {
    console.error(`Error clearing notes for ${player}:`, error);
  }
}


// عرض ملاحظات الجولات السابقة
function showPreviousNotes(player) {
  try {
    const notesKey = `notes:${player}`;
    const notes = localStorage.getItem(notesKey) || '';
    
    if (notes.trim()) {
      console.log(`ملاحظات ${player}: ${notes}`);
    } else {
      console.log(`لا توجد ملاحظات محفوظة لـ ${player}`);
    }
  } catch(error) {
    console.error(`Error showing previous notes for ${player}:`, error);
  }
}

// Clear used abilities for new game
function clearUsedAbilities() {
  try {
    // Clear used abilities for both players
    localStorage.removeItem('player1UsedAbilities');
    localStorage.removeItem('player2UsedAbilities');
    localStorage.removeItem('usedAbilities');
    localStorage.removeItem('abilityRequests');
    
    // Reset ability usage in abilities lists
    const player1Abilities = JSON.parse(localStorage.getItem('player1Abilities') || '[]');
    const player2Abilities = JSON.parse(localStorage.getItem('player2Abilities') || '[]');
    
    // Reset used state for all abilities
    player1Abilities.forEach(ability => {
      if (typeof ability === 'object' && ability.used !== undefined) {
        ability.used = false;
      }
    });
    player2Abilities.forEach(ability => {
      if (typeof ability === 'object' && ability.used !== undefined) {
        ability.used = false;
      }
    });
    
    // Save updated abilities
    localStorage.setItem('player1Abilities', JSON.stringify(player1Abilities));
    localStorage.setItem('player2Abilities', JSON.stringify(player2Abilities));
    
    // Re-render panels
    renderPanels();
  } catch (error) {
    console.error('Error clearing used abilities:', error);
  }
}

/* ================== Card Arrangement Commands ================== */
// Command to open player cards page for arrangement (following order.js pattern)
function openPlayerCardsForArrangement(playerParam, playerName) {
  try {
    // Get current game ID
    const gameId = localStorage.getItem('currentGameId') || 'default';
    
    // Generate the player cards URL
    const playerNumber = playerParam === 'player1' ? '1' : '2';
    const baseUrl = window.location.origin + window.location.pathname.replace('card.html', '');
    const playerCardsUrl = `${baseUrl}player-cards.html?gameId=${gameId}&player=${playerNumber}`;
    
    console.log(`Opening player cards for ${playerParam}: ${playerCardsUrl}`);
    
    // Open in new window/tab
    const newWindow = window.open(playerCardsUrl, `player-cards-${playerParam}`, 
      'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!newWindow) {
      alert('تم منع النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.');
      return;
    }
    
    // Focus the new window
    newWindow.focus();
    
    // Store the window reference for monitoring
    window.playerCardsWindow = newWindow;
    
    // Start monitoring for arrangement completion
    startMonitoringArrangement(playerParam, playerName);
    
  } catch (error) {
    console.error('Error opening player cards:', error);
    alert('حدث خطأ في فتح صفحة ترتيب البطاقات: ' + error.message);
  }
}

// Monitor arrangement completion
function startMonitoringArrangement(playerParam, playerName) {
  const checkInterval = setInterval(() => {
    try {
      // Check if window is closed
      if (window.playerCardsWindow && window.playerCardsWindow.closed) {
        clearInterval(checkInterval);
        window.playerCardsWindow = null;
        return;
      }
      
      // Check for arrangement completion in localStorage
      const arrangementKey = `${playerParam}ArrangementCompleted`;
      const isCompleted = localStorage.getItem(arrangementKey) === 'true';
      
      if (isCompleted) {
        clearInterval(checkInterval);
        window.playerCardsWindow = null;
        
        // Refresh card data to show the new arrangement
        refreshCardData();
        
        // Show success message
        alert(`تم إكمال ترتيب البطاقات للاعب ${playerName} بنجاح!`);
        
        console.log(`Arrangement completed for ${playerParam}`);
      }
    } catch (error) {
      console.error('Error monitoring arrangement:', error);
    }
  }, 1000); // Check every second
}

// Command to check arrangement status
function checkArrangementStatus(playerParam) {
  const arrangementKey = `${playerParam}ArrangementCompleted`;
  const isCompleted = localStorage.getItem(arrangementKey) === 'true';
  const orderKey = `${playerParam}StrategicOrdered`;
  const order = JSON.parse(localStorage.getItem(orderKey) || '[]');
  
  return {
    isCompleted,
    order,
    playerParam
  };
}

// Command to reset arrangement (for new games)
function resetArrangement(playerParam) {
  try {
    localStorage.removeItem(`${playerParam}ArrangementCompleted`);
    localStorage.removeItem(`${playerParam}StrategicOrdered`);
    localStorage.removeItem(`${playerParam}CardArrangement`);
    
    console.log(`Arrangement reset for ${playerParam}`);
  } catch (error) {
    console.error('Error resetting arrangement:', error);
  }
}

// ================== Ability Request System ================== //
// Handle ability requests from players
function handleAbilityRequests() {
  try {
    const abilityRequests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    const pendingRequests = abilityRequests.filter(req => req.status === 'pending');
    
    console.log('Checking ability requests:', { abilityRequests, pendingRequests });
    
    if (pendingRequests.length > 0) {
      console.log('Processing ability requests:', pendingRequests);
      
      // Check existing notifications to avoid duplicates
      const existingNotifications = document.querySelectorAll('[style*="position: fixed"][style*="bottom: 18px"]');
      const existingRequestIds = Array.from(existingNotifications).map(notif => 
        notif.getAttribute('data-request-id')
      ).filter(id => id);
      
      // Show notification for each pending request that doesn't have a notification yet
      pendingRequests.forEach(request => {
        if (!existingRequestIds.includes(request.id) && !lastProcessedRequests.has(request.id)) {
          console.log('Showing notification for request:', request);
          showAbilityRequestNotification(request);
          lastProcessedRequests.add(request.id);
        } else {
          console.log('Notification already exists or was processed for request:', request.id);
        }
      });
    }
  } catch (error) {
    console.error('Error handling ability requests:', error);
  }
}

// Show ability request notification (like result.js)
function showAbilityRequestNotification(request) {
  try {
    const playerName = request.playerName || request.player || 'اللاعب';
    const abilityText = request.abilityText || request.ability || 'القدرة';
    const message = `❗ ${playerName} يطلب استخدام القدرة: «${abilityText}»`;
    
    console.log('Creating notification:', { playerName, abilityText, message });
    
    // Create notification element (same style as result.js)
    const wrap = document.createElement("div");
    wrap.setAttribute('data-request-id', request.id || '');
    wrap.style.cssText = `
      position: fixed; left: 50%; transform: translateX(-50%);
      bottom: 18px; z-index: 3000; background: #222; color: #fff;
      border: 2px solid #f3c21a; border-radius: 12px; padding: 10px 14px;
      box-shadow: 0 8px 18px rgba(0,0,0,.35); font-weight: 700;
      font-family: "Cairo", sans-serif;
    `;
    
    const msg = document.createElement("div");
    msg.textContent = message;
    msg.style.marginBottom = "8px";
    wrap.appendChild(msg);
    
    // Create buttons row
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.justifyContent = "flex-end";
    
    // Use Now button (green)
    const useBtn = document.createElement("button");
    useBtn.textContent = "استخدام الآن";
    useBtn.style.cssText = `
      padding: 6px 10px; border-radius: 10px; border: none;
      background: #16a34a; color: #fff; font-weight: 800; cursor: pointer;
      font-family: "Cairo", sans-serif;
    `;
    useBtn.onclick = () => {
      approveAbilityRequest(request.playerParam || 'player1', abilityText, request.id || '');
      if (wrap.parentNode) {
        wrap.parentNode.removeChild(wrap);
      }
    };
    row.appendChild(useBtn);
    
    // Close button (red)
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "إغلاق";
    closeBtn.style.cssText = `
      padding: 6px 10px; border-radius: 10px; border: none;
      background: #dc2626; color: #fff; font-weight: 800; cursor: pointer;
      font-family: "Cairo", sans-serif;
    `;
    closeBtn.onclick = () => {
      rejectAbilityRequest(request.playerParam || 'player1', abilityText, request.id || '');
      if (wrap.parentNode) {
        wrap.parentNode.removeChild(wrap);
      }
    };
    row.appendChild(closeBtn);
    
    wrap.appendChild(row);
    document.body.appendChild(wrap);
    console.log('Notification added to DOM');
    
    // Store reference for manual removal
    wrap._abilityNotification = true;
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (wrap.parentNode) {
        wrap.parentNode.removeChild(wrap);
        console.log('Notification auto-removed');
      }
    }, 15000);
    
  } catch (error) {
    console.error('Error showing ability request notification:', error);
  }
}

// Approve ability request
function approveAbilityRequest(player, ability, requestId = null) {
  try {
    // Add to used abilities
    const usedAbilitiesKey = `${player}UsedAbilities`;
    const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
    usedAbilities.push(ability);
    localStorage.setItem(usedAbilitiesKey, JSON.stringify(usedAbilities));
    
    // Mark request as approved (by requestId if available, otherwise by player+ability)
    const abilityRequests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    let requestIndex = -1;
    
    if (requestId) {
      requestIndex = abilityRequests.findIndex(req => req.id === requestId);
    } else {
      requestIndex = abilityRequests.findIndex(req => 
        req.player === player && req.ability === ability && req.status === 'pending'
      );
    }
    
    if (requestIndex !== -1) {
      abilityRequests[requestIndex].status = 'approved';
      localStorage.setItem('abilityRequests', JSON.stringify(abilityRequests));
      console.log('Request marked as approved:', abilityRequests[requestIndex]);
    }
    
    // Send approval to server - Socket.IO removed
    if (requestId) {
      // socket.emit("approveAbilityRequest", { gameID, requestId });
    }
    
    // Re-render panels
    renderPanels();
    
    // Remove all ability notifications
    removeAllAbilityNotifications();
    
    // Show success message (disabled)
    const playerName = player === 'player1' ? player1 : player2;
    console.log(`تم الموافقة على استخدام "${ability}" من ${playerName}`);
    
    // Navigate to player page after approving ability request
    navigateToPlayerPage(player, playerName);
    
    console.log(`Ability request approved: ${player} - ${ability}`);
    
  } catch (error) {
    console.error('Error approving ability request:', error);
  }
}

// Reject ability request
function rejectAbilityRequest(player, ability, requestId = null) {
  try {
    // Mark request as rejected (by requestId if available, otherwise by player+ability)
    const abilityRequests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    let requestIndex = -1;
    
    if (requestId) {
      requestIndex = abilityRequests.findIndex(req => req.id === requestId);
    } else {
      requestIndex = abilityRequests.findIndex(req => 
        req.player === player && req.ability === ability && req.status === 'pending'
      );
    }
    
    if (requestIndex !== -1) {
      abilityRequests[requestIndex].status = 'rejected';
      localStorage.setItem('abilityRequests', JSON.stringify(abilityRequests));
      console.log('Request marked as rejected:', abilityRequests[requestIndex]);
    }
    
    // Send rejection to server - Socket.IO removed
    if (requestId) {
      // socket.emit("rejectAbilityRequest", { gameID, requestId });
    }
    
    // Remove all ability notifications
    removeAllAbilityNotifications();
    
    // Show rejection message (disabled)
    const playerName = player === 'player1' ? player1 : player2;
    console.log(`تم رفض استخدام "${ability}" من ${playerName}`);
    
    console.log(`Ability request rejected: ${player} - ${ability}`);
    
  } catch (error) {
    console.error('Error rejecting ability request:', error);
  }
}

// Remove all ability request notifications
function removeAllAbilityNotifications() {
  try {
    // Find all notifications by their unique styling and custom property
    const notifications = document.querySelectorAll('[style*="position: fixed"][style*="bottom: 18px"]');
    notifications.forEach(notification => {
      if (notification._abilityNotification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
        console.log('Removed ability notification');
      }
    });
  } catch (error) {
    console.error('Error removing notifications:', error);
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const wrap = document.createElement("div");
  wrap.style.cssText = `
    position:fixed; left:50%; transform:translateX(-50%);
    bottom:18px; z-index:3000; background:#222; color:#fff;
    border:2px solid #ffffff; border-radius:12px; padding:10px 14px;
    box-shadow:0 8px 18px rgba(0,0,0,.35); font-weight:700;
    font-family:"Cairo",sans-serif;
  `;
  
  const msg = document.createElement("div");
  
  // Check if message starts with "!" and style it red
  if (message.startsWith("! ")) {
    const icon = document.createElement("span");
    icon.textContent = "!";
    icon.style.color = "#dc2626"; // Red color
    icon.style.fontWeight = "bold";
    icon.style.fontSize = "18px";
    
    const text = document.createElement("span");
    text.textContent = message.substring(2); // Remove "! " from the beginning
    
    msg.appendChild(icon);
    msg.appendChild(text);
  } else {
    msg.textContent = message;
  }
  
  wrap.appendChild(msg);
  document.body.appendChild(wrap);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (wrap.parentNode) {
      wrap.parentNode.removeChild(wrap);
    }
  }, 3000);
}

// Initialize BroadcastChannel if available
try {
  if (typeof BroadcastChannel !== 'undefined') {
    window.broadcastChannel = new BroadcastChannel('ability-updates');
  }
} catch (e) {
  console.log('BroadcastChannel not supported');
}

// Socket.IO removed - using localStorage + Custom Events instead

// Start ability request monitoring
let lastProcessedRequests = new Set();
function startAbilityRequestMonitoring() {
  // Check for ability requests every 2 seconds
  setInterval(() => {
    handleAbilityRequests();
  }, 2000);
  
  // Also listen for storage events
  window.addEventListener('storage', function(e) {
    if (e.key === 'abilityRequests') {
      console.log('Storage event received for abilityRequests');
      handleAbilityRequests();
    }
  });
}

// Make commands available globally
window.openPlayerCardsForArrangement = openPlayerCardsForArrangement;
window.checkArrangementStatus = checkArrangementStatus;
window.resetArrangement = resetArrangement;
window.approveAbilityRequest = approveAbilityRequest;
window.rejectAbilityRequest = rejectAbilityRequest;
window.showToast = showToast;

// ==================== SWAP DECK RESET SYSTEM ====================

/**
 * Reset swap deck system for new game
 */
function resetSwapDeckSystem() {
  try {
    console.log('🔄 Resetting swap deck system for new game...');
    
    // Clear swap deck usage
    localStorage.removeItem('swapDeckUsage');
    
    // Clear swap deck data
    localStorage.removeItem('swapDeckData');
    
    // Reset swap deck system if available
    if (window.swapDeckSystem && typeof window.swapDeckSystem.resetSwapDeckUsage === 'function') {
      window.swapDeckSystem.resetSwapDeckUsage();
    }
    
    console.log('✅ Swap deck system reset successfully');
    
  } catch (error) {
    console.error('❌ Error resetting swap deck system:', error);
  }
}

/**
 * Complete game reset (for new games)
 */
function resetGameForNewMatch() {
  try {
    console.log('🔄 Resetting game for new match...');
    
    // Reset swap deck system
    resetSwapDeckSystem();
    
    // Clear game-specific data
    localStorage.removeItem('currentRound');
    localStorage.removeItem('player1Notes');
    localStorage.removeItem('player2Notes');
    localStorage.removeItem('health1');
    localStorage.removeItem('health2');
    
    // Reset ability system
    localStorage.removeItem('abilityRequests');
    localStorage.removeItem('lastProcessedRequests');
    
    console.log('✅ Game reset for new match completed');
    
  } catch (error) {
    console.error('❌ Error resetting game for new match:', error);
  }
}

// Make reset functions available globally
window.resetSwapDeckSystem = resetSwapDeckSystem;
window.resetGameForNewMatch = resetGameForNewMatch;

// Make voice system globally available
window.voiceSystem = voiceSystem;
window.createVoiceControls = createVoiceControls;
window.createReplayButtons = createReplayButtons;

// Auto-test voice system on load
setTimeout(() => {
  console.log('🎵 Voice system initialized - testing legendary cards...');
  voiceSystem.testAllLegendaryVoices();
  
  // Add manual test function to window for debugging
  window.testVoice = function(cardName) {
    console.log(`🎵 Testing voice for: ${cardName}`);
    const testPath = `images/${cardName}.webm`;
    voiceSystem.playVoice(testPath, 'Test Player', true);
  };
  
  console.log('🎵 Use window.testVoice("aizen") to test voice playback');
}, 1000);

// Navigate to player page after approving ability request
function navigateToPlayerPage(playerParam, playerName) {
  try {
    // Get current game ID
    const gameId = localStorage.getItem('currentGameId') || 'default';
    
    // Determine player number
    const playerNumber = playerParam === 'player1' ? '1' : '2';
    
    // Generate the player view URL
    const baseUrl = window.location.origin + window.location.pathname.replace('card.html', '');
    const playerViewUrl = `${baseUrl}player-view.html?player=${playerNumber}&gameId=${gameId}`;
    
    console.log(`Navigating to player page for ${playerName}: ${playerViewUrl}`);
    
    // Open player view page in new tab
    const newWindow = window.open(playerViewUrl, `player-view-${playerParam}`, 
      'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (!newWindow) {
      console.warn('تم منع النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.');
      // Fallback: try to redirect current window
      if (confirm(`تم قبول طلب القدرة من ${playerName}. هل تريد الانتقال إلى صفحة اللاعب؟`)) {
        window.location.href = playerViewUrl;
      }
      return;
    }
    
    // Focus the new window
    newWindow.focus();
    
    // Show success message
    showToast(`تم فتح صفحة اللاعب ${playerName} بنجاح!`, 'success');
    
  } catch (error) {
    console.error('Error navigating to player page:', error);
    showToast('حدث خطأ في الانتقال إلى صفحة اللاعب', 'error');
  }
}