/**
 * Swap Deck Selection System
 * Allows players to choose 3 swap deck cards from 7 random options
 */

// Game state
let gameState = {
  currentPlayer: 'player1',
  player1: { name: '', selectedCards: [], swapDeckCards: [] },
  player2: { name: '', selectedCards: [], swapDeckCards: [] },
  rounds: 11,
  availableSwapCards: [],
  usedCards: new Set() // Track cards used by both players
};

// Load existing data
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎴 Loading swap deck selection page...');
  loadExistingData();
  generateSwapDeckOptions();
  createCardsGrid();
  updateDisplay();
});

function loadExistingData() {
  const savedData = localStorage.getItem('gameSetupProgress');
  console.log('📋 Loading saved data:', savedData);
  
  if (savedData) {
    const data = JSON.parse(savedData);
    gameState = { ...gameState, ...data };
    
    // Load player names
    if (data.player1Name) {
      gameState.player1.name = data.player1Name;
    }
    if (data.player2Name) {
      gameState.player2.name = data.player2Name;
    }
    
    // Get rounds
    gameState.rounds = data.rounds || 11;
    
    // Load selected cards
    const player1Cards = JSON.parse(localStorage.getItem('player1StrategicPicks') || '[]');
    const player2Cards = JSON.parse(localStorage.getItem('player2StrategicPicks') || '[]');
    
    gameState.player1.selectedCards = player1Cards;
    gameState.player2.selectedCards = player2Cards;
    
    // Initialize swapDeckCards if not exists
    if (!gameState.player1.swapDeckCards) {
      gameState.player1.swapDeckCards = [];
    }
    if (!gameState.player2.swapDeckCards) {
      gameState.player2.swapDeckCards = [];
    }
    
    // Determine current player
    if (gameState.player1.swapDeckCards.length === 0) {
      gameState.currentPlayer = 'player1';
    } else if (gameState.player2.swapDeckCards.length === 0) {
      gameState.currentPlayer = 'player2';
    }
    
    console.log('📋 Loaded game state:', gameState);
  }
}

function generateSwapDeckOptions() {
  try {
    console.log('🎴 Generating swap deck options...');
    
    // Get all available cards from the game
    const allCards = [
      // Common cards
      'images/Stark-card.png', 'images/Todoroki.png', 'images/CartTitan-card.png',
      'images/Monspeet-card.png', 'images/Rika-card.png', 'images/ace.png',
      'images/Shizuku-card.png', 'images/zetsu.png', 'images/Overhaul-card.png',
      'images/Atsuya-card.png', 'images/Yoo-Jinho-card.png', 'images/Gin-freecss-card.png',
      'images/Hantengu-card.png', 'images/Lily-card.png', 'images/Gordon-card.png',
      'images/Charllotte-card.png', 'images/Min-Byung-Gyu-card.png', 'images/KiSui-card.png',
      'images/Iron-card.png', 'images/Hawk-card.png', 'images/bartolomeo-card.png',
      'images/WarHammerTitan-card.png', 'images/Luck.png', 'images/Elfaria Albis.png',
      'images/Haschwalth-card.png', 'images/Hisagi-card.png', 'images/Elizabeth.png',
      'images/MeiMei-card.png', 'images/Okabe-card.png', 'images/Renpa-card.png',
      'images/Vengeance.png', 'images/Pariston-card.png', 'images/franklin_card.png',
      'images/MouBu-card.png', 'images/Android18-card.png', 'images/hinata.png',
      'images/laxus.png', 'images/Videl-card.webp', 'images/Momo-hinamori-card.webp',
      'images/cardo20ppsd.webp', 'images/Krilin-card.webp', 'images/HakuKi-card.webp',
      'images/ArmorTitan-card.webp', 'images/Nachttt.webp', 'images/Tosen-card.webp',
      'images/Feitan-card.webp', 'images/uraume-card.webp', 'images/Akaza-card.webp', 'images/Denki-card.webp', 'images/monet.webp', 'images/zabuza.webp',
      
      // Epic cards
      'images/minato.png', 'images/ShouHeiKun-card .png', 'images/KudoShinichi-card.png',
      'images/Ichibe-card.png', 'images/Endeavor.png', 'images/Tier Harribel.png',
      'images/Crocodile.png', 'images/Nana-card.png', 'images/Vegapunk-crad.webp',
      'images/Go-Gunhee-card.webp', 'images/Nami.webp', 'images/Hachigen-card.png',
      'images/Senjumaru-card.png', 'images/Arthur-card.png', 'images/Lemillion-card.png',
      'images/Fuegoleonn .png', 'images/Itchigo-card .png', 'images/Kaito-card .png',
      'images/DragonBB-67-card.png', 'images/Kuma-card.png', 'images/YujiroHanma-card.png',
      'images/Dabi-card.png', 'images/gounji.png', 'images/Carasuma.png', 'images/Conan.png', 'images/Kidou.png', 'images/Shisui.png', 'images/Akaii.png', 'images/GTO_2.webp', 'images/sasukee.webp', 'images/gaara.webp', 'images/Cathleen-card.webp', 'images/Akaino-card.webp',
      
      // Legendary cards
      'images/law.webm', 'images/Vegetto.webm', 'images/madara.webm',
      'images/NietroCard.webm', 'images/aizen.webm', 'images/Hawks.webm',
      'images/AllForOneCard.webm', 'images/ErenCard.webm', 'images/LuffyGear5Card.webm',
      'images/joker.webm', 'images/AyanokojiCard.webm', 'images/UmibozoCard.webm',
      'images/MeruemCard.webm', 'images/SilverCard.webm', 'images/Akai.webm',
      'images/ShanksCard.webm', 'images/shikamaru.webm', 'images/Goku UI.webm', 'images/Ranpo.webm', 'images/Zenitsu.webm', 'images/Fubuki.webm', 'images/zoro.webm', 'images/killua.webm', 'images/Asta.webm'
    ];
    
    // Get current player's selected cards
    const currentPlayerCards = gameState[gameState.currentPlayer].selectedCards;
    console.log(`📋 Current player ${gameState.currentPlayer} has ${currentPlayerCards.length} selected cards`);
    
    // Filter out cards that the current player already has
    const availableForCurrentPlayer = allCards.filter(card => 
      !currentPlayerCards.includes(card)
    );
    
    // Filter out cards that the other player already has
    const otherPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';
    const otherPlayerCards = gameState[otherPlayer].selectedCards;
    const availableForBoth = availableForCurrentPlayer.filter(card => 
      !otherPlayerCards.includes(card)
    );
    
    // Filter out cards already used in swap deck by other player
    const otherPlayerSwapCards = gameState[otherPlayer].swapDeckCards;
    const trulyAvailable = availableForBoth.filter(card => 
      !otherPlayerSwapCards.includes(card)
    );
    
    console.log(`📋 Available cards: ${trulyAvailable.length}`);
    
    // Shuffle and pick 7 random cards
    const shuffled = [...trulyAvailable].sort(() => 0.5 - Math.random());
    gameState.availableSwapCards = shuffled.slice(0, 7);
    
    console.log('✅ Generated swap deck options:', gameState.availableSwapCards);
    
  } catch (error) {
    console.error('❌ Error generating swap deck options:', error);
  }
}

function createCardsGrid() {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';
  
  gameState.availableSwapCards.forEach((cardPath, index) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-number';
    cardDiv.textContent = index + 1;
    cardDiv.dataset.cardIndex = index;
    cardDiv.onclick = () => selectSwapCard(index);
    
    const currentPlayerData = gameState[gameState.currentPlayer];
    if (currentPlayerData.swapDeckCards.includes(cardPath)) {
      cardDiv.classList.add('selected');
    }
    grid.appendChild(cardDiv);
  });
}

function selectSwapCard(cardIndex) {
  const currentPlayerData = gameState[gameState.currentPlayer];
  const cardPath = gameState.availableSwapCards[cardIndex];
  const cardDiv = document.querySelector(`[data-card-index="${cardIndex}"]`);
  
  console.log(`🎴 Selecting swap card ${cardIndex + 1} for ${gameState.currentPlayer}`);
  
  // Check if card is already selected
  if (currentPlayerData.swapDeckCards.includes(cardPath)) {
    // Deselect card
    const index = currentPlayerData.swapDeckCards.indexOf(cardPath);
    currentPlayerData.swapDeckCards.splice(index, 1);
    cardDiv.classList.remove('selected');
    console.log('🎴 Card deselected');
  } else {
    // Select card if less than 3 selected
    if (currentPlayerData.swapDeckCards.length < 3) {
      currentPlayerData.swapDeckCards.push(cardPath);
      cardDiv.classList.add('selected');
      console.log('🎴 Card selected');
    } else {
      console.log('⚠️ Cannot select more than 3 cards');
    }
  }
  
  // Update display
  updateDisplay();
  saveProgress();
}

function updateDisplay() {
  const currentPlayerData = gameState[gameState.currentPlayer];
  const currentPlayerName = document.getElementById('currentPlayerName');
  const continueBtn = document.getElementById('continueBtn');
  
  // Update player name
  const playerName = currentPlayerData.name || 
    (gameState.currentPlayer === 'player1' ? 'اللاعب الأول' : 'اللاعب الثاني');
  currentPlayerName.textContent = playerName;
  
  // Enable/disable continue button
  const selectedCount = currentPlayerData.swapDeckCards.length;
  if (selectedCount === 3) {
    continueBtn.disabled = false;
    continueBtn.textContent = 'متابعة';
  } else {
    continueBtn.disabled = true;
    continueBtn.textContent = 'متابعة';
  }
}

function continueToNextPlayer() {
  const currentPlayerData = gameState[gameState.currentPlayer];
  
  // Validate selection
  if (currentPlayerData.swapDeckCards.length !== 3) {
    alert(`يجب أن تختار 3 بطاقات بالضبط`);
    return;
  }
  
  console.log(`✅ ${gameState.currentPlayer} selected swap deck cards:`, currentPlayerData.swapDeckCards);
  
  // Save progress
  saveProgress();
  
  // Switch to next player
  if (gameState.currentPlayer === 'player1') {
    gameState.currentPlayer = 'player2';
    
    // Generate new options for player 2
    generateSwapDeckOptions();
    createCardsGrid();
    updateDisplay();
  } else {
    // Both players have selected their swap deck cards
    console.log('🎴 Both players finished swap deck selection');
    
    // Save final swap deck data
    saveSwapDeckData();
    
    // Redirect to final setup
    window.location.href = 'final-setup.html';
  }
}

function saveProgress() {
  // Save game state
  localStorage.setItem('gameSetupProgress', JSON.stringify(gameState));
  
  // Save swap deck cards separately
  localStorage.setItem('player1SwapDeckCards', JSON.stringify(gameState.player1.swapDeckCards));
  localStorage.setItem('player2SwapDeckCards', JSON.stringify(gameState.player2.swapDeckCards));
  
  console.log('💾 Progress saved');
}

function saveSwapDeckData() {
  // Save swap deck data for use in card.js
  const swapDeckData = {
    player1: {
      cards: gameState.player1.swapDeckCards,
      used: false
    },
    player2: {
      cards: gameState.player2.swapDeckCards,
      used: false
    }
  };
  
  localStorage.setItem('swapDeckData', JSON.stringify(swapDeckData));
  
  // Also save to global variables for immediate use
  window.swapDeckCardsData = swapDeckData;
  window.swapDeckCardsGenerated = true;
  window.swapDeckUsageData = { player1: false, player2: false };
  
  console.log('✅ Swap deck data saved:', swapDeckData);
}

function goBack() {
  if (confirm('هل تريد العودة إلى صفحة اختيار البطاقات؟')) {
    window.location.href = 'cards-setup.html';
  }
}

// Make functions available globally
window.continueToNextPlayer = continueToNextPlayer;
window.goBack = goBack;