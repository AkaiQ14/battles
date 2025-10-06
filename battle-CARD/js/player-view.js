// Player View JavaScript - للاعبين لمشاهدة المعركة واستخدام القدرات
// هذا الملف يعمل مع player-view.html

// Game state variables
let gameSetupProgress = {};
let player1 = "لاعب 1";
let player2 = "لاعب 2";
let roundCount = 5;
let startingHP = 5;
let round = 0;
let scores = {};
let picks = {};

// Player identification
let currentPlayer = null;
let playerNumber = null;

// DOM elements
let roundTitle, leftPlayerName, rightPlayerName;
let leftCard, rightCard;
let health1, health2;
let player1Notes, player2Notes;
let player1AbilitiesContainer, player2AbilitiesContainer;
let historyLabelLeft, historyLabelRight, historyRowLeft, historyRowRight;

// Initialize the player view
function initializePlayerView() {
  try {
    // Get player info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    playerNumber = urlParams.get('player');
    currentPlayer = playerNumber === '1' ? 'player1' : 'player2';
    
    console.log('Player view initialized:', { playerNumber, currentPlayer });
    
    // Initialize DOM elements first
    initializeDOMElements();
    
    // Load game data
    loadGameData();
    
    // Load player abilities
    loadPlayerAbilities();
    
    // Start listening for game updates
    startGameUpdatesListener();
    
    // Render initial state
    renderGameState();
    
    // Force refresh after a short delay to ensure data is loaded
    setTimeout(() => {
      console.log('Force refreshing game state...');
      loadGameData();
      renderGameState();
    }, 1000);
    
    // Additional refresh after longer delay for slow-loading data
    setTimeout(() => {
      console.log('Secondary refresh for slow-loading data...');
      loadGameData();
      renderGameState();
    }, 3000);
    
  } catch (error) {
    console.error('Error initializing player view:', error);
    showToast('حدث خطأ في تحميل اللعبة', 'error');
  }
}

// Load game data from localStorage
function loadGameData() {
  try {
    // Load game setup progress
    gameSetupProgress = JSON.parse(localStorage.getItem("gameSetupProgress") || "{}");
    
    // Load player names
    if (gameSetupProgress.player1?.name) {
      player1 = gameSetupProgress.player1.name;
    } else if (localStorage.getItem("player1")) {
      player1 = localStorage.getItem("player1");
    }
    
    if (gameSetupProgress.player2?.name) {
      player2 = gameSetupProgress.player2.name;
    } else if (localStorage.getItem("player2")) {
      player2 = localStorage.getItem("player2");
    }
    
    // Load round count
    if (gameSetupProgress.rounds) {
      roundCount = gameSetupProgress.rounds;
      startingHP = gameSetupProgress.rounds;
    } else if (localStorage.getItem("totalRounds")) {
      roundCount = parseInt(localStorage.getItem("totalRounds"));
      startingHP = parseInt(localStorage.getItem("totalRounds"));
    }
    
    // Load current round
    round = parseInt(localStorage.getItem('currentRound') || '0');
    
    // Load scores with fallback
    const savedScores = localStorage.getItem("scores");
    if (savedScores) {
      scores = JSON.parse(savedScores);
    } else {
      scores = {
        [player1]: startingHP,
        [player2]: startingHP
      };
      localStorage.setItem("scores", JSON.stringify(scores));
    }
    
    // Load player picks
    picks = loadPlayerPicks();
    
    console.log('Game data loaded:', {
      player1, player2, roundCount, round, scores, picks
    });
    
  } catch (error) {
    console.error('Error loading game data:', error);
    // Set fallback values
    player1 = "لاعب 1";
    player2 = "لاعب 2";
    roundCount = 5;
    startingHP = 5;
    round = 0;
    scores = { [player1]: startingHP, [player2]: startingHP };
    picks = {};
  }
}

// Load player picks from localStorage
function loadPlayerPicks() {
  let picks = {};
  
  try {
    console.log('=== DEBUG: Loading player picks ===');
    
    // Debug: Show all localStorage keys
    const allKeys = Object.keys(localStorage);
    console.log('All localStorage keys:', allKeys);
    
    // Load from StrategicOrdered (final arrangement) - this is the primary source
    const player1Order = localStorage.getItem('player1StrategicOrdered');
    const player2Order = localStorage.getItem('player2StrategicOrdered');
    
    console.log('StrategicOrdered data:', { player1Order, player2Order });
    
    if (player1Order && player2Order) {
      try {
        const player1Ordered = JSON.parse(player1Order);
        const player2Ordered = JSON.parse(player2Order);
        
        if (Array.isArray(player1Ordered) && Array.isArray(player2Ordered) && 
            player1Ordered.length > 0 && player2Ordered.length > 0) {
          picks[player1] = [...player1Ordered];
          picks[player2] = [...player2Ordered];
          console.log('✅ Loaded picks from StrategicOrdered:', { player1: picks[player1], player2: picks[player2] });
          return picks;
        }
      } catch (e) {
        console.warn('Error parsing StrategicOrdered:', e);
      }
    }
    
    // Fallback: Load from CardArrangement (from player-cards-simple.js)
    const player1Arrangement = localStorage.getItem('player1CardArrangement');
    const player2Arrangement = localStorage.getItem('player2CardArrangement');
    
    console.log('CardArrangement data:', { player1Arrangement, player2Arrangement });
    
    if (player1Arrangement && player2Arrangement) {
      try {
        const player1Cards = JSON.parse(player1Arrangement);
        const player2Cards = JSON.parse(player2Arrangement);
        
        if (Array.isArray(player1Cards) && Array.isArray(player2Cards) && 
            player1Cards.length > 0 && player2Cards.length > 0) {
          picks[player1] = [...player1Cards];
          picks[player2] = [...player2Cards];
          console.log('✅ Loaded picks from CardArrangement:', { player1: picks[player1], player2: picks[player2] });
          return picks;
        }
      } catch (e) {
        console.warn('Error parsing CardArrangement:', e);
      }
    }
    
    // Fallback: Load from StrategicPicks
    const player1Picks = localStorage.getItem('player1StrategicPicks');
    const player2Picks = localStorage.getItem('player2StrategicPicks');
    
    console.log('StrategicPicks data:', { player1Picks, player2Picks });
    
    if (player1Picks && player2Picks) {
      try {
        const player1Cards = JSON.parse(player1Picks);
        const player2Cards = JSON.parse(player2Picks);
        
        if (Array.isArray(player1Cards) && Array.isArray(player2Cards) && 
            player1Cards.length > 0 && player2Cards.length > 0) {
          picks[player1] = [...player1Cards];
          picks[player2] = [...player2Cards];
          console.log('✅ Loaded picks from StrategicPicks:', { player1: picks[player1], player2: picks[player2] });
          return picks;
        }
      } catch (e) {
        console.warn('Error parsing StrategicPicks:', e);
      }
    }
    
    // Fallback: Load from gameSetupProgress
    console.log('gameSetupProgress:', gameSetupProgress);
    
    if (gameSetupProgress.player1?.selectedCards && gameSetupProgress.player2?.selectedCards) {
      const player1Cards = gameSetupProgress.player1.selectedCards;
      const player2Cards = gameSetupProgress.player2.selectedCards;
      
      if (Array.isArray(player1Cards) && Array.isArray(player2Cards) && 
          player1Cards.length > 0 && player2Cards.length > 0) {
        picks[player1] = [...player1Cards];
        picks[player2] = [...player2Cards];
        console.log('✅ Loaded picks from gameSetupProgress:', { player1: picks[player1], player2: picks[player2] });
        return picks;
      }
    }
    
    // Fallback: Load from gameState
    const gameStateData = localStorage.getItem('gameState');
    if (gameStateData) {
      try {
        const gameState = JSON.parse(gameStateData);
        console.log('gameState data:', gameState);
        
        if (gameState.player1?.selectedCards && gameState.player2?.selectedCards) {
          const player1Cards = gameState.player1.selectedCards;
          const player2Cards = gameState.player2.selectedCards;
          
          if (Array.isArray(player1Cards) && Array.isArray(player2Cards) && 
              player1Cards.length > 0 && player2Cards.length > 0) {
            picks[player1] = [...player1Cards];
            picks[player2] = [...player2Cards];
            console.log('✅ Loaded picks from gameState:', { player1: picks[player1], player2: picks[player2] });
            return picks;
          }
        }
      } catch (e) {
        console.warn('Error parsing gameState:', e);
      }
    }
    
    // Additional fallback: Try to load from any available card data
    const cardKeys = allKeys.filter(key => 
      key.includes('Card') || key.includes('card') || 
      key.includes('Order') || key.includes('Picks') || 
      key.includes('Arrangement')
    );
    console.log('Available card-related keys:', cardKeys);
    
    // Try to find any card data
    for (const key of cardKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Found card data in ${key}:`, data.slice(0, 3), '... (showing first 3)');
          
          // Try to determine which player this belongs to
          if (key.toLowerCase().includes('player1')) {
            if (!picks[player1] || picks[player1].length === 0) {
              picks[player1] = data;
              console.log(`✅ Assigned to player1 from ${key}`);
            }
          } else if (key.toLowerCase().includes('player2')) {
            if (!picks[player2] || picks[player2].length === 0) {
              picks[player2] = data;
              console.log(`✅ Assigned to player2 from ${key}`);
            }
          }
        }
      } catch (e) {
        console.warn(`Error parsing ${key}:`, e);
      }
    }
    
  } catch (e) {
    console.warn('Error loading player picks:', e);
  }
  
  console.log('=== Final picks result ===', picks);
  
  if (!picks[player1] || !picks[player2] || picks[player1].length === 0 || picks[player2].length === 0) {
    console.warn('⚠️ No complete card data found for both players');
    return {};
  }
  
  return picks;
}

// Initialize DOM elements
function initializeDOMElements() {
  roundTitle = document.getElementById('roundTitle');
  leftPlayerName = document.getElementById('leftPlayerName');
  rightPlayerName = document.getElementById('rightPlayerName');
  leftCard = document.getElementById('leftCard');
  rightCard = document.getElementById('rightCard');
  health1 = document.getElementById('health1');
  health2 = document.getElementById('health2');
  player1Notes = document.getElementById('player1Notes');
  player2Notes = document.getElementById('player2Notes');
  player1AbilitiesContainer = document.getElementById('player1AbilitiesContainer');
  player2AbilitiesContainer = document.getElementById('player2AbilitiesContainer');
  historyLabelLeft = document.getElementById('historyLabelLeft');
  historyLabelRight = document.getElementById('historyLabelRight');
  historyRowLeft = document.getElementById('historyRowLeft');
  historyRowRight = document.getElementById('historyRowRight');
  
  // Verify notes elements are textareas
  if (player1Notes && player1Notes.tagName !== 'TEXTAREA') {
    console.error('player1Notes is not a textarea:', player1Notes);
    player1Notes = null;
  }
  if (player2Notes && player2Notes.tagName !== 'TEXTAREA') {
    console.error('player2Notes is not a textarea:', player2Notes);
    player2Notes = null;
  }
  
  console.log('DOM elements initialized:', {
    player1Notes: player1Notes ? player1Notes.tagName : 'null',
    player2Notes: player2Notes ? player2Notes.tagName : 'null'
  });
  
  // Update player info
  const playerName = document.getElementById('playerName');
  const playerStatus = document.getElementById('playerStatus');
  
  if (currentPlayer === 'player1') {
    if (playerName) playerName.textContent = player1;
    if (playerStatus) playerStatus.textContent = `عرض فقط`;
  } else {
    if (playerName) playerName.textContent = player2;
    if (playerStatus) playerStatus.textContent = `عرض فقط`;
  }
}

// Load player abilities
function loadPlayerAbilities() {
  try {
    // Load current player's abilities
    const currentPlayerAbilities = JSON.parse(localStorage.getItem(`${currentPlayer}Abilities`) || '[]');
    const currentPlayerUsedAbilities = JSON.parse(localStorage.getItem(`${currentPlayer}UsedAbilities`) || '[]');
    const usedSet = new Set(currentPlayerUsedAbilities);
    
    // Load opponent's abilities (for display only)
    const opponentParam = currentPlayer === 'player1' ? 'player2' : 'player1';
    const opponentAbilities = JSON.parse(localStorage.getItem(`${opponentParam}Abilities`) || '[]');
    const opponentUsedAbilities = JSON.parse(localStorage.getItem(`${opponentParam}UsedAbilities`) || '[]');
    const opponentUsedSet = new Set(opponentUsedAbilities);
    
    // Render abilities based on current player perspective
    if (currentPlayer === 'player1') {
      // Player 1 sees: Right panel = Player 1 (themselves), Left panel = Player 2 (opponent)
      renderAbilities(currentPlayerAbilities, usedSet, player1AbilitiesContainer, currentPlayer, true);
      renderAbilities(opponentAbilities, opponentUsedSet, player2AbilitiesContainer, opponentParam, true);
    } else {
      // Player 2 sees: Right panel = Player 1 (opponent), Left panel = Player 2 (themselves)
      renderAbilities(opponentAbilities, opponentUsedSet, player1AbilitiesContainer, opponentParam, true);
      renderAbilities(currentPlayerAbilities, usedSet, player2AbilitiesContainer, currentPlayer, true);
    }
    
    // Update ability panel titles
    updateAbilityPanelTitles();
    
    console.log('Abilities loaded (display only):', {
      currentPlayer: currentPlayerAbilities.length,
      opponent: opponentAbilities.length
    });
    
  } catch (error) {
    console.error('Error loading abilities:', error);
  }
}

// Render abilities for a player
function renderAbilities(abilities, usedSet, container, playerParam, displayOnly = false) {
  if (!container) return;
  
  container.innerHTML = '';
  
  abilities.forEach(ability => {
    const abilityText = typeof ability === 'string' ? ability : (ability.text || ability);
    const isUsed = usedSet.has(abilityText);
    
    const abilityBtn = document.createElement('button');
    abilityBtn.className = `btn ability-btn ${isUsed ? 'used' : ''}`;
    abilityBtn.textContent = abilityText;
    abilityBtn.disabled = true; // Always disabled for display only
    
    container.appendChild(abilityBtn);
  });
}

// Update ability panel titles
function updateAbilityPanelTitles() {
  try {
    const player1AbilitiesTitle = document.getElementById('player1AbilitiesTitle'); // Right panel
    const player2AbilitiesTitle = document.getElementById('player2AbilitiesTitle'); // Left panel
    
    if (currentPlayer === 'player1') {
      // Player 1 sees: Right panel = Player 1 (themselves), Left panel = Player 2 (opponent)
      if (player1AbilitiesTitle) {
        player1AbilitiesTitle.innerHTML = `قدرات <span style="color: var(--gold);">${player1}</span>`;
      }
      if (player2AbilitiesTitle) {
        player2AbilitiesTitle.innerHTML = `قدرات <span style="color: #ff6b6b;">${player2}</span>`;
      }
    } else {
      // Player 2 sees: Right panel = Player 1 (opponent), Left panel = Player 2 (themselves)
      if (player1AbilitiesTitle) {
        player1AbilitiesTitle.innerHTML = `قدرات <span style="color: #ff6b6b;">${player1}</span>`;
      }
      if (player2AbilitiesTitle) {
        player2AbilitiesTitle.innerHTML = `قدرات <span style="color: var(--gold);">${player2}</span>`;
      }
    }
  } catch (error) {
    console.error('Error updating ability panel titles:', error);
  }
}

// Note: Abilities are display-only in player view

// Start listening for game updates
function startGameUpdatesListener() {
  // Listen for localStorage changes
  window.addEventListener('storage', function(e) {
    console.log('Storage event received:', e.key, e.newValue);
    
    if (e.key === 'scores') {
      try {
        scores = JSON.parse(e.newValue || '{}');
        updateHealthDisplay();
        console.log('Scores updated:', scores);
      } catch (error) {
        console.error('Error updating scores:', error);
      }
    }
    
    if (e.key === 'currentRound') {
      try {
        const newRound = parseInt(e.newValue || '0');
        console.log('Round update detected:', { oldRound: round, newRound });
        if (newRound !== round && newRound > 0) {
          showToast(`انتقال إلى الجولة ${newRound + 1}`, 'info');
        }
        round = newRound;
        updateRoundDisplay();
        updateCards(); // Update cards when round changes
        
        // Check if game has ended
        checkGameEnd();
      } catch (error) {
        console.error('Error updating round:', error);
      }
    }
    
    if (e.key === 'roundUpdate' || e.key === 'gameUpdate') {
      try {
        console.log('Game/Round update signal received, refreshing all data...');
        loadGameData();
        renderGameState();
      } catch (error) {
        console.error('Error handling game update:', error);
      }
    }
    
    if (e.key && e.key.includes('Abilities')) {
      try {
        loadPlayerAbilities();
      } catch (error) {
        console.error('Error updating abilities:', error);
      }
    }
    
    
    if (e.key === 'gameSetupProgress') {
      try {
        gameSetupProgress = JSON.parse(e.newValue || '{}');
        loadGameData();
        renderGameState();
      } catch (error) {
        console.error('Error updating game setup:', error);
      }
    }
    
    if (e.key === 'gameStatus') {
      try {
        const status = e.newValue;
        console.log('Game status changed:', status);
        if (status === 'finished') {
          showToast('انتهت المعركة!', 'info');
          // Show challenge end page after a short delay
          setTimeout(() => {
            showChallengeEndPage();
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling game status:', error);
      }
    }
  });
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      try {
        console.log('Page visible, refreshing data...');
        loadGameData();
        renderGameState();
      } catch (error) {
        console.error('Error refreshing on visibility change:', error);
      }
    }
  });
  
  // Listen for round updates (for same-tab communication)
  window.addEventListener('roundUpdated', function(e) {
    try {
      console.log('Round updated event received:', e.detail);
      const { round: newRound, scores: newScores } = e.detail;
      round = newRound;
      scores = newScores;
      updateRoundDisplay();
      updateHealthDisplay();
      updateCards();
    } catch (error) {
      console.error('Error handling round update event:', error);
    }
  });
  
  // Periodic check for updates (fallback)
  setInterval(() => {
    try {
      const currentStoredRound = parseInt(localStorage.getItem('currentRound') || '0');
      if (currentStoredRound !== round) {
        console.log('Periodic check detected round change:', { stored: currentStoredRound, current: round });
        round = currentStoredRound;
        loadGameData();
        renderGameState();
      }
    } catch (error) {
      console.error('Error in periodic update check:', error);
    }
  }, 2000); // Check every 2 seconds
}

// Render current game state
function renderGameState() {
  try {
    console.log('Rendering game state:', { player1, player2, round, scores, picks, currentPlayer });
    
    // Update round display
    updateRoundDisplay();
    
    // Update player names based on current player
    if (currentPlayer === 'player1') {
      // Player 1 sees: Left = Player 2, Right = Player 1 (themselves)
      if (leftPlayerName) leftPlayerName.textContent = player2;
      if (rightPlayerName) rightPlayerName.textContent = player1;
      // Update top banner real name
      const topNameEl = document.getElementById('playerName');
      const topStatusEl = document.getElementById('playerStatus');
      if (topNameEl) topNameEl.textContent = player1;
      if (topStatusEl) topStatusEl.textContent = `عرض فقط`;
    } else {
      // Player 2 sees: Left = Player 2 (themselves), Right = Player 1
      if (leftPlayerName) leftPlayerName.textContent = player2;
      if (rightPlayerName) rightPlayerName.textContent = player1;
      // Update top banner real name
      const topNameEl = document.getElementById('playerName');
      const topStatusEl = document.getElementById('playerStatus');
      if (topNameEl) topNameEl.textContent = player2;
      if (topStatusEl) topStatusEl.textContent = `عرض فقط`;
    }
    
    // Update cards
    updateCards();
    
    // Update health
    updateHealthDisplay();
    
    // Clear any error messages from notes areas first
    clearNotesErrorMessages();
    
    // Update notes
    updateNotes();
    
    // Update abilities (only show current player's abilities)
    loadPlayerAbilities();
    
    // Update history cards
    updateHistoryCards();
    
    // Check if game has ended
    checkGameEnd();
    
    console.log('Game state rendered successfully');
    
  } catch (error) {
    console.error('Error rendering game state:', error);
  }
}

// Update round display
function updateRoundDisplay() {
  if (roundTitle) {
    roundTitle.textContent = `الجولة ${round + 1}`;
  }
}

// Update cards display
function updateCards() {
  try {
    console.log('=== DEBUG: Updating cards ===');
    console.log('Picks:', picks);
    console.log('Round:', round);
    console.log('Players:', { player1, player2 });
    
    // Update left card (player 2)
    if (leftCard) {
      console.log('Updating left card for player2:', player2);
      if (picks[player2] && Array.isArray(picks[player2]) && picks[player2].length > round) {
        const cardData = picks[player2][round];
        console.log('Left card data (raw):', cardData);
        
        if (cardData) {
          let imageSrc = '';
          let altText = 'Card';
          
          if (typeof cardData === 'string') {
            // If cardData is just a string (filename)
            // Handle different possible formats
            if (cardData.startsWith('images/')) {
              imageSrc = cardData; // Already has images/ prefix
            } else {
              imageSrc = `images/${cardData}`;
            }
            altText = cardData.replace('images/', '');
            console.log('Left card: String format ->', imageSrc);
          } else if (typeof cardData === 'object') {
            // Handle object formats
            if (cardData.image) {
              imageSrc = cardData.image.startsWith('images/') ? cardData.image : `images/${cardData.image}`;
              altText = cardData.name || cardData.image;
            } else if (cardData.src) {
              imageSrc = cardData.src.startsWith('images/') ? cardData.src : `images/${cardData.src}`;
              altText = cardData.name || cardData.src;
            } else if (cardData.filename) {
              imageSrc = cardData.filename.startsWith('images/') ? cardData.filename : `images/${cardData.filename}`;
              altText = cardData.name || cardData.filename;
            } else if (cardData.path) {
              imageSrc = cardData.path.startsWith('images/') ? cardData.path : `images/${cardData.path}`;
              altText = cardData.name || cardData.path;
            }
            console.log('Left card: Object format ->', { imageSrc, altText, cardData });
          }
          
          if (imageSrc) {
            // Check if it's a video file
            const isVideo = imageSrc.toLowerCase().endsWith('.webm') || 
                           imageSrc.toLowerCase().endsWith('.mp4') || 
                           imageSrc.toLowerCase().endsWith('.mov');
            
            let mediaElement;
            if (isVideo) {
              mediaElement = `<video src="${imageSrc}" class="card-media" autoplay muted loop playsinline onerror="console.error('Failed to load video:', this.src); this.style.display='none'; this.parentNode.innerHTML=''"></video>`;
            } else {
              mediaElement = `<img src="${imageSrc}" alt="${altText}" class="card-media" onerror="console.error('Failed to load image:', this.src); this.style.display='none'; this.parentNode.innerHTML=''">`;
            }
            
            leftCard.innerHTML = mediaElement;
            console.log('✅ Left card updated with:', imageSrc, isVideo ? '(video)' : '(image)');
          } else {
            leftCard.innerHTML = '';
            console.warn('⚠️ Left card: No valid image source found');
          }
        } else {
          leftCard.innerHTML = '';
          console.warn('⚠️ Left card: Card data is null/undefined');
        }
      } else {
        leftCard.innerHTML = '';
        console.warn('⚠️ Left card: No picks data or round out of bounds', {
          hasPicksForPlayer: !!picks[player2],
          isArray: Array.isArray(picks[player2]),
          length: picks[player2]?.length,
          round
        });
      }
    }
    
    // Update right card (player 1)
    if (rightCard) {
      console.log('Updating right card for player1:', player1);
      if (picks[player1] && Array.isArray(picks[player1]) && picks[player1].length > round) {
        const cardData = picks[player1][round];
        console.log('Right card data (raw):', cardData);
        
        if (cardData) {
          let imageSrc = '';
          let altText = 'Card';
          
          if (typeof cardData === 'string') {
            // If cardData is just a string (filename)
            // Handle different possible formats
            if (cardData.startsWith('images/')) {
              imageSrc = cardData; // Already has images/ prefix
            } else {
              imageSrc = `images/${cardData}`;
            }
            altText = cardData.replace('images/', '');
            console.log('Right card: String format ->', imageSrc);
          } else if (typeof cardData === 'object') {
            // Handle object formats
            if (cardData.image) {
              imageSrc = cardData.image.startsWith('images/') ? cardData.image : `images/${cardData.image}`;
              altText = cardData.name || cardData.image;
            } else if (cardData.src) {
              imageSrc = cardData.src.startsWith('images/') ? cardData.src : `images/${cardData.src}`;
              altText = cardData.name || cardData.src;
            } else if (cardData.filename) {
              imageSrc = cardData.filename.startsWith('images/') ? cardData.filename : `images/${cardData.filename}`;
              altText = cardData.name || cardData.filename;
            } else if (cardData.path) {
              imageSrc = cardData.path.startsWith('images/') ? cardData.path : `images/${cardData.path}`;
              altText = cardData.name || cardData.path;
            }
            console.log('Right card: Object format ->', { imageSrc, altText, cardData });
          }
          
          if (imageSrc) {
            // Check if it's a video file
            const isVideo = imageSrc.toLowerCase().endsWith('.webm') || 
                           imageSrc.toLowerCase().endsWith('.mp4') || 
                           imageSrc.toLowerCase().endsWith('.mov');
            
            let mediaElement;
            if (isVideo) {
              mediaElement = `<video src="${imageSrc}" class="card-media" autoplay muted loop playsinline onerror="console.error('Failed to load video:', this.src); this.style.display='none'; this.parentNode.innerHTML=''"></video>`;
            } else {
              mediaElement = `<img src="${imageSrc}" alt="${altText}" class="card-media" onerror="console.error('Failed to load image:', this.src); this.style.display='none'; this.parentNode.innerHTML=''">`;
            }
            
            rightCard.innerHTML = mediaElement;
            console.log('✅ Right card updated with:', imageSrc, isVideo ? '(video)' : '(image)');
          } else {
            rightCard.innerHTML = '';
            console.warn('⚠️ Right card: No valid image source found');
          }
        } else {
          rightCard.innerHTML = '';
          console.warn('⚠️ Right card: Card data is null/undefined');
        }
      } else {
        rightCard.innerHTML = '';
        console.warn('⚠️ Right card: No picks data or round out of bounds', {
          hasPicksForPlayer: !!picks[player1],
          isArray: Array.isArray(picks[player1]),
          length: picks[player1]?.length,
          round
        });
      }
    }
    
    console.log('=== Cards update completed ===');
    
  } catch (error) {
    console.error('Error updating cards:', error);
  }
}

// Update health display
function updateHealthDisplay() {
  try {
    if (health1) {
      health1.textContent = scores[player2] || startingHP;
      health1.classList.toggle("red", (scores[player2] || startingHP) <= Math.ceil(startingHP/2));
    }
    
    if (health2) {
      health2.textContent = scores[player1] || startingHP;
      health2.classList.toggle("red", (scores[player1] || startingHP) <= Math.ceil(startingHP/2));
    }
    
  } catch (error) {
    console.error('Error updating health:', error);
  }
}

// Clear any error messages that might have appeared in notes areas
function clearNotesErrorMessages() {
  try {
    if (player1Notes && player1Notes.tagName === 'TEXTAREA') {
      // Check if the textarea contains error-like text
      const currentValue = player1Notes.value || '';
      if (currentValue.includes('خطأ في تحميل') || currentValue.includes('error') || currentValue.includes('Error')) {
        console.log('Clearing error message from player1 notes:', currentValue);
        player1Notes.value = '';
      }
    }
    
    if (player2Notes && player2Notes.tagName === 'TEXTAREA') {
      // Check if the textarea contains error-like text
      const currentValue = player2Notes.value || '';
      if (currentValue.includes('خطأ في تحميل') || currentValue.includes('error') || currentValue.includes('Error')) {
        console.log('Clearing error message from player2 notes:', currentValue);
        player2Notes.value = '';
      }
    }
  } catch (error) {
    console.error('Error clearing notes error messages:', error);
  }
}

// Update notes display
function updateNotes() {
  try {
    // Load notes from localStorage
    const player1NotesText = localStorage.getItem('notes:player1') || '';
    const player2NotesText = localStorage.getItem('notes:player2') || '';
    
    console.log('Loading notes:', { player1NotesText, player2NotesText });
    
    if (player1Notes && player1Notes.tagName === 'TEXTAREA') {
      // Only update if it's actually a textarea and the content is different
      if (player1Notes.value !== player1NotesText) {
        player1Notes.value = player1NotesText;
        console.log('Updated player1 notes:', player1NotesText);
      }
    }
    
    if (player2Notes && player2Notes.tagName === 'TEXTAREA') {
      // Only update if it's actually a textarea and the content is different
      if (player2Notes.value !== player2NotesText) {
        player2Notes.value = player2NotesText;
        console.log('Updated player2 notes:', player2NotesText);
      }
    }
    
  } catch (error) {
    console.error('Error updating notes:', error);
  }
}

// Check if game has ended
function checkGameEnd() {
  try {
    // Check if we've reached the final round or if someone has 0 health
    const currentScores = JSON.parse(localStorage.getItem('scores') || '{}');
    const player1Score = currentScores[player1] || startingHP;
    const player2Score = currentScores[player2] || startingHP;
    
    const gameEnded = round >= roundCount || player1Score === 0 || player2Score === 0;
    
    if (gameEnded) {
      console.log('Game has ended, showing challenge end page');
      setTimeout(() => {
        showChallengeEndPage();
      }, 2000);
    }
  } catch (error) {
    console.error('Error checking game end:', error);
  }
}

// Show challenge end page
function showChallengeEndPage() {
  try {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Cairo", sans-serif;
    `;
    
    // Create end page content
    const endPage = document.createElement('div');
    endPage.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 3px solid #ffd700;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      color: white;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      animation: fadeInScale 0.8s ease-out;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInScale {
        0% {
          opacity: 0;
          transform: scale(0.8);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
    
    // Get final scores
    const finalScores = JSON.parse(localStorage.getItem('scores') || '{}');
    const player1Score = finalScores[player1] || 0;
    const player2Score = finalScores[player2] || 0;
    
    // Determine winner
    let winnerText = '';
    if (player1Score > player2Score) {
      winnerText = `🏆 الفائز: ${player1}`;
    } else if (player2Score > player1Score) {
      winnerText = `🏆 الفائز: ${player2}`;
    } else {
      winnerText = '🤝 تعادل';
    }
    
    endPage.innerHTML = `
      <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: #ffd700; font-weight: bold;">
        انتهى التحدي
      </h1>
      <div style="font-size: 1.5rem; margin-bottom: 30px; color: #ffd700;">
        ${winnerText}
      </div>
      <div style="background: rgba(255, 215, 0, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <div style="font-size: 1.2rem; margin-bottom: 10px;">النتيجة النهائية:</div>
        <div style="font-size: 1.1rem;">
          <div style="margin-bottom: 5px;">${player1}: ${player1Score}</div>
          <div>${player2}: ${player2Score}</div>
        </div>
      </div>
      <div style="font-size: 1rem; color: #ccc;">
        شكراً لك على المشاركة في الفعالية!
      </div>
    `;
    
    overlay.appendChild(endPage);
    document.body.appendChild(overlay);
    
    console.log('Challenge end page displayed');
    
  } catch (error) {
    console.error('Error showing challenge end page:', error);
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  try {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Add type-specific styling
    if (type === 'success') {
      toast.style.borderColor = 'var(--success)';
    } else if (type === 'error') {
      toast.style.borderColor = 'var(--danger)';
    } else if (type === 'warning') {
      toast.style.borderColor = 'var(--warning)';
    }
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
    
  } catch (error) {
    console.error('Error showing toast:', error);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  initializePlayerView();
});

// Update history cards display
function updateHistoryCards() {
  try {
    console.log('=== DEBUG: Updating history cards ===');
    console.log('Round:', round, 'Picks:', picks);
    
    // Hide history in first round
    if (round === 0) {
      if (historyLabelLeft) historyLabelLeft.classList.add('history-hidden');
      if (historyLabelRight) historyLabelRight.classList.add('history-hidden');
      if (historyRowLeft) historyRowLeft.classList.add('history-hidden');
      if (historyRowRight) historyRowRight.classList.add('history-hidden');
      return;
    }
    
    // Show history elements
    if (historyLabelLeft) historyLabelLeft.classList.remove('history-hidden');
    if (historyLabelRight) historyLabelRight.classList.remove('history-hidden');
    if (historyRowLeft) historyRowLeft.classList.remove('history-hidden');
    if (historyRowRight) historyRowRight.classList.remove('history-hidden');
    
    // Update left history (player 2)
    if (historyRowLeft && picks[player2]) {
      historyRowLeft.innerHTML = '';
      
      for (let i = 0; i < round; i++) {
        const cardData = picks[player2][i];
        if (cardData) {
          const miniCard = createMiniCard(cardData, i);
          historyRowLeft.appendChild(miniCard);
        }
      }
    }
    
    // Update right history (player 1)
    if (historyRowRight && picks[player1]) {
      historyRowRight.innerHTML = '';
      
      for (let i = 0; i < round; i++) {
        const cardData = picks[player1][i];
        if (cardData) {
          const miniCard = createMiniCard(cardData, i);
          historyRowRight.appendChild(miniCard);
        }
      }
    }
    
    console.log('=== History cards update completed ===');
    
  } catch (error) {
    console.error('Error updating history cards:', error);
  }
}

// Create mini card element for history
function createMiniCard(cardData, roundIndex) {
  try {
    const miniCard = document.createElement('div');
    miniCard.className = 'mini-card';
    
    let imageSrc = '';
    let altText = 'Card';
    
    if (typeof cardData === 'string') {
      // If cardData is just a string (filename)
      if (cardData.startsWith('images/')) {
        imageSrc = cardData;
      } else {
        imageSrc = `images/${cardData}`;
      }
      altText = cardData.replace('images/', '');
    } else if (typeof cardData === 'object') {
      // Handle object formats
      if (cardData.image) {
        imageSrc = cardData.image.startsWith('images/') ? cardData.image : `images/${cardData.image}`;
        altText = cardData.name || cardData.image;
      } else if (cardData.src) {
        imageSrc = cardData.src.startsWith('images/') ? cardData.src : `images/${cardData.src}`;
        altText = cardData.name || cardData.src;
      } else if (cardData.filename) {
        imageSrc = cardData.filename.startsWith('images/') ? cardData.filename : `images/${cardData.filename}`;
        altText = cardData.name || cardData.filename;
      } else if (cardData.path) {
        imageSrc = cardData.path.startsWith('images/') ? cardData.path : `images/${cardData.path}`;
        altText = cardData.name || cardData.path;
      }
    }
    
    if (imageSrc) {
      // Check if it's a video file
      const isVideo = imageSrc.toLowerCase().endsWith('.webm') || 
                     imageSrc.toLowerCase().endsWith('.mp4') || 
                     imageSrc.toLowerCase().endsWith('.mov');
      
      if (isVideo) {
        miniCard.innerHTML = `<video src="${imageSrc}" class="card-media" muted loop playsinline onerror="console.error('Failed to load history video:', this.src); this.style.display='none';"></video>`;
      } else {
        miniCard.innerHTML = `<img src="${imageSrc}" alt="${altText}" class="card-media" onerror="console.error('Failed to load history image:', this.src); this.style.display='none';"></img>`;
      }
    } else {
      miniCard.innerHTML = '';
    }
    
    return miniCard;
    
  } catch (error) {
    console.error('Error creating mini card:', error);
    const miniCard = document.createElement('div');
    miniCard.className = 'mini-card';
    miniCard.innerHTML = '';
    return miniCard;
  }
}

// Make functions available globally
window.showToast = showToast;