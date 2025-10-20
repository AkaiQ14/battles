// Import Firebase GameService
import { GameService } from './gameService.js';

// Global variables to persist across page refreshes
if (!window.gameCardsGenerated) {
  window.gameCardsGenerated = false;
  window.gameCardsData = {
    player1Cards: [],
    player2Cards: []
  };
}

// Game state
let gameState = {
  currentPlayer: 'player1',
  player1: { name: '', selectedCards: [] },
  player2: { name: '', selectedCards: [] },
  rounds: 11,
  availableCards: [],
  player1Cards: [],
  player2Cards: []
};

// Load existing data
document.addEventListener('DOMContentLoaded', function() {
  loadExistingData();
  
  // Check if this is a tournament match first
  checkTournamentMode();
  
  // If not tournament mode, create cards grid normally
  if (!localStorage.getItem('currentMatchId')) {
    createCardsGrid();
  }
  
  updateDisplay();
});

function loadExistingData() {
  const savedData = localStorage.getItem('gameSetupProgress');
  if (savedData) {
    const data = JSON.parse(savedData);
    gameState = { ...gameState, ...data };
    
    // Load player names from the correct format
    if (data.player1Name) {
      gameState.player1.name = data.player1Name;
    }
    if (data.player2Name) {
      gameState.player2.name = data.player2Name;
    }
    
    // Get rounds from setup data
    gameState.rounds = data.rounds || 11;
    
    // Initialize card selection based on rounds
    const cardsNeeded = gameState.rounds;
    
    if (gameState.player1.selectedCards.length < cardsNeeded) {
      gameState.currentPlayer = 'player1';
    } else if (gameState.player2.selectedCards.length < cardsNeeded) {
      gameState.currentPlayer = 'player2';
    }
    
    // Load saved card selection if available
    const savedCardSelection = localStorage.getItem('gameCardSelection');
    if (savedCardSelection) {
      const cardData = JSON.parse(savedCardSelection);
      gameState.player1Cards = cardData.player1Cards || [];
      gameState.player2Cards = cardData.player2Cards || [];
      
      // Set available cards for current player
      if (gameState.currentPlayer === 'player1') {
        gameState.availableCards = gameState.player1Cards;
      } else {
        gameState.availableCards = gameState.player2Cards;
      }
    } else {
      // Generate random cards if not already generated
      generateRandomCards();
    }
  } else {
    // Load rounds from setup data
    const setupData = localStorage.getItem('gameSetupProgress');
    if (setupData) {
      const setup = JSON.parse(setupData);
      gameState.rounds = setup.rounds || 11;
      
      // Load player names from setup data
      if (setup.player1Name) {
        gameState.player1.name = setup.player1Name;
        gameState.player1Name = setup.player1Name;
      }
      if (setup.player2Name) {
        gameState.player2.name = setup.player2Name;
        gameState.player2Name = setup.player2Name;
      }
    }
    generateRandomCards();
  }
}

// Dynamic card distribution with precise percentage allocation
function generateDynamicDistribution() {
  const totalCardsPerPlayer = 20;
  const baseDistribution = {
    common: 0.45,      // 45%
    rare: 0.25,        // 25%
    epic: 0.15,        // 15%
    legendary: 0.08,   // 8%
    ultimate: 0.05,    // 5%
    cursed: 0.02       // 2%
  };
  
  // Precise card count calculation
  const cardDistribution = {};
  let remainingCards = totalCardsPerPlayer;
  
  // First pass: calculate base card counts
  for (const [category, percentage] of Object.entries(baseDistribution)) {
    const cardCount = Math.floor(totalCardsPerPlayer * percentage);
    cardDistribution[category] = cardCount;
    remainingCards -= cardCount;
  }
  
  // Distribute any remaining cards to the most frequent categories
  const prioritizedCategories = [
    'common', 'rare', 'epic', 'legendary', 'ultimate', 'cursed'
  ];
  
  for (const category of prioritizedCategories) {
    while (remainingCards > 0) {
      cardDistribution[category]++;
      remainingCards--;
    }
    
    if (remainingCards === 0) break;
  }
  
  // Verify total card count
  const totalDistributed = Object.values(cardDistribution).reduce((a, b) => a + b, 0);
  console.assert(totalDistributed === totalCardsPerPlayer, 
    `Card distribution error: total ${totalDistributed} !== ${totalCardsPerPlayer}`);
  
  console.log('🎲 Precise Card Distribution:', cardDistribution);
  
  return cardDistribution;
}

// Modify card generation to use precise distribution
function generateRandomCards() {
  // Check if cards are already generated using global variables
  if (window.gameCardsGenerated && window.gameCardsData.player1Cards.length > 0) {
    console.log('🎴 Using existing generated cards from global variables');
    
    gameState.player1Cards = window.gameCardsData.player1Cards;
    gameState.player2Cards = window.gameCardsData.player2Cards;
    
    // Set available cards for current player
    if (gameState.currentPlayer === 'player1') {
      gameState.availableCards = gameState.player1Cards;
    } else {
      gameState.availableCards = gameState.player2Cards;
    }
    
    return; // Use existing cards, don't generate new ones
  }
  
  console.log('🎴 Generating new random cards');
  
  // Use CardManager to get all available cards
  const commonCards = window.cardManager.getAllCardsByCategory('common');
  const rareCards = window.cardManager.getAllCardsByCategory('rare');
  const epicCards = window.cardManager.getAllCardsByCategory('epic');
  const legendaryCards = window.cardManager.getAllCardsByCategory('legendary');
  const ultimateCards = window.cardManager.getAllCardsByCategory('ultimate');
  const cursedCards = window.cardManager.getAllCardsByCategory('cursed');
  
  // Total cards per player
  const totalCardsPerPlayer = 20;
  
  // Generate precise card distribution
  const cardDistribution = generateDynamicDistribution();
  
  // Function to get random cards from a specific category with more randomness
  function getRandomCards(cards, count) {
    if (!cards || cards.length === 0) return [];
    
    // Multiple shuffling techniques
    const shuffleMethods = [
      (arr) => arr.sort(() => Math.random() - 0.5),
      (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      },
      (arr) => arr.slice().sort((a, b) => Math.random() - 0.5)
    ];
    
    // Randomly choose a shuffle method
    const shuffleMethod = shuffleMethods[Math.floor(Math.random() * shuffleMethods.length)];
    
    const shuffled = shuffleMethod([...cards]);
    return shuffled.slice(0, Math.min(count, cards.length));
  }
  
  // Generate cards for player 1
  let player1Cards = [
    ...getRandomCards(commonCards, cardDistribution.common),
    ...getRandomCards(rareCards, cardDistribution.rare),
    ...getRandomCards(epicCards, cardDistribution.epic),
    ...getRandomCards(legendaryCards, cardDistribution.legendary),
    ...getRandomCards(ultimateCards, cardDistribution.ultimate),
    ...getRandomCards(cursedCards, cardDistribution.cursed)
  ];
  
  // Ensure exactly 20 cards for player 1
  while (player1Cards.length < totalCardsPerPlayer) {
    const allAvailableCards = [
      ...commonCards, 
      ...rareCards, 
      ...epicCards, 
      ...legendaryCards, 
      ...ultimateCards, 
      ...cursedCards
    ];
    
    const extraCards = getRandomCards(
      allAvailableCards.filter(card => !player1Cards.includes(card)), 
      totalCardsPerPlayer - player1Cards.length
    );
    
    player1Cards.push(...extraCards);
  }
  
  // Final shuffle and trim for player 1
  const finalPlayer1Cards = player1Cards.slice(0, totalCardsPerPlayer)
    .sort(() => Math.random() - 0.5);
  
  // Generate cards for player 2 with similar dynamic randomness
  let player2Cards = [
    ...getRandomCards(
      commonCards.filter(c => !finalPlayer1Cards.includes(c)), 
      cardDistribution.common
    ),
    ...getRandomCards(
      rareCards.filter(c => !finalPlayer1Cards.includes(c)), 
      cardDistribution.rare
    ),
    ...getRandomCards(
      epicCards.filter(c => !finalPlayer1Cards.includes(c)), 
      cardDistribution.epic
    ),
    ...getRandomCards(
      legendaryCards.filter(c => !finalPlayer1Cards.includes(c)), 
      cardDistribution.legendary
    ),
    ...getRandomCards(
      ultimateCards.filter(c => !finalPlayer1Cards.includes(c)), 
      cardDistribution.ultimate
    ),
    ...getRandomCards(
      cursedCards.filter(c => !finalPlayer1Cards.includes(c)), 
      cardDistribution.cursed
    )
  ];
  
  // Ensure exactly 20 cards for player 2
  while (player2Cards.length < totalCardsPerPlayer) {
    const allAvailableCards = [
      ...commonCards, 
      ...rareCards, 
      ...epicCards, 
      ...legendaryCards, 
      ...ultimateCards, 
      ...cursedCards
    ];
    
    const extraCards = getRandomCards(
      allAvailableCards.filter(c => 
        !finalPlayer1Cards.includes(c) && 
        !player2Cards.includes(c)
      ), 
      totalCardsPerPlayer - player2Cards.length
    );
    
    player2Cards.push(...extraCards);
  }
  
  // Final shuffle and trim for player 2
  const finalPlayer2Cards = player2Cards.slice(0, totalCardsPerPlayer)
    .sort(() => Math.random() - 0.5);
  
  // Verify card types for both players
  const verifyCardTypes = (cards) => {
    const allAvailableCards = {
      common: window.cardManager.getAllCardsByCategory('common'),
      rare: window.cardManager.getAllCardsByCategory('rare'),
      epic: window.cardManager.getAllCardsByCategory('epic'),
      legendary: window.cardManager.getAllCardsByCategory('legendary'),
      ultimate: window.cardManager.getAllCardsByCategory('ultimate'),
      cursed: window.cardManager.getAllCardsByCategory('cursed')
    };
    
    const typeCount = {};
    for (const category in allAvailableCards) {
      typeCount[category] = cards.filter(card => 
        allAvailableCards[category].includes(card)
      ).length;
    }
    
    console.log('🎲 Card Distribution:', typeCount);
    return typeCount;
  };
  
  console.log('🎴 Player 1 Card Distribution:');
  verifyCardTypes(finalPlayer1Cards);
  
  console.log('🎴 Player 2 Card Distribution:');
  verifyCardTypes(finalPlayer2Cards);
  
  // Save to game state
  gameState.player1Cards = finalPlayer1Cards;
  gameState.player2Cards = finalPlayer2Cards;
  
  // Set available cards for current player
  if (gameState.currentPlayer === 'player1') {
    gameState.availableCards = finalPlayer1Cards;
  } else {
    gameState.availableCards = finalPlayer2Cards;
  }
  
  // Save to global variables to prevent regeneration
  window.gameCardsData.player1Cards = finalPlayer1Cards;
  window.gameCardsData.player2Cards = finalPlayer2Cards;
  window.gameCardsGenerated = true;
  
  // Save to localStorage
  try { 
    localStorage.setItem('player1StrategicPicks', JSON.stringify(finalPlayer1Cards)); 
  } catch {}
  try { 
    localStorage.setItem('player2StrategicPicks', JSON.stringify(finalPlayer2Cards)); 
  } catch {}
  
  console.log('💾 Saved generated cards to global variables and localStorage');
}

function createCardsGrid() {
  console.log('createCardsGrid called');
  console.log('Available cards:', gameState.availableCards);
  
  const grid = document.getElementById('cardsGrid');
  if (!grid) {
    console.error('cardsGrid element not found!');
    return;
  }
  
  grid.innerHTML = '';
  
  // Use available cards for current player
  const cardsToShow = gameState.availableCards || [];
  const totalRounds = gameState.rounds || 11; // Default to 11 if not set
  
  console.log('Cards to show:', cardsToShow.length, 'Total rounds:', totalRounds);
  
  if (cardsToShow.length === 0) {
    console.warn('No cards available to show');
    grid.innerHTML = '<div style="color:#fff;padding:20px;text-align:center;">لا توجد بطاقات متاحة</div>';
    return;
  }
  
  // Always create 20 card slots
  for (let index = 0; index < 20; index++) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-number';
    cardDiv.textContent = index + 1; // Natural order: 1-2-3-4...
    cardDiv.dataset.cardNumber = index + 1;
    
    // If we have a card for this slot and it's within the total rounds, set its path
    if (index < totalRounds && index < cardsToShow.length) {
      cardDiv.dataset.cardPath = cardsToShow[index];
    } else {
      // For slots without cards or beyond rounds, make them look disabled
      cardDiv.classList.add('disabled');
    }
    
    cardDiv.dataset.cardIndex = index; // Store actual index for reference
    cardDiv.onclick = () => selectCard(index + 1);
    
    const currentPlayerData = gameState[gameState.currentPlayer];
    if (currentPlayerData.selectedCards.includes(index + 1)) {
      cardDiv.classList.add('selected');
    }
    
    grid.appendChild(cardDiv);
  }
  
  console.log('Cards grid created with 20 slots, ' + cardsToShow.length + ' cards available, ' + totalRounds + ' rounds');
}

function selectCard(cardNumber) {
  const cardDiv = document.querySelector(`[data-card-number="${cardNumber}"]`);
  const currentPlayerData = gameState[gameState.currentPlayer];
  
  // Check if card is already selected
  if (currentPlayerData.selectedCards.includes(cardNumber)) {
    // Deselect card
    const index = currentPlayerData.selectedCards.indexOf(cardNumber);
    currentPlayerData.selectedCards.splice(index, 1);
    cardDiv.classList.remove('selected');
  } else {
    // Select card if less than required cards selected
    const cardsNeeded = gameState.rounds || 11; // Default to 11 if not set
    if (currentPlayerData.selectedCards.length < cardsNeeded) {
      currentPlayerData.selectedCards.push(cardNumber);
      cardDiv.classList.add('selected');
    }
  }
  
  // Update display
  updateDisplay();
  saveProgress();
}

// Select random cards function
function selectRandomCards() {
  const currentPlayerData = gameState[gameState.currentPlayer];
  const cardsNeeded = gameState.rounds;
  
  // Check if we have available cards
  if (!gameState.availableCards || gameState.availableCards.length === 0) {
    alert('لا توجد كروت متاحة للاختيار');
    return;
  }
  
  // Check if we have enough cards
  if (gameState.availableCards.length < cardsNeeded) {
    alert(`لا توجد كروت كافية. المتاح: ${gameState.availableCards.length}, المطلوب: ${cardsNeeded}`);
    return;
  }
  
  // Clear current selection
  currentPlayerData.selectedCards = [];
  
  // Remove all selected classes
  document.querySelectorAll('.card-number.selected').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Get all available card numbers
  const availableCards = gameState.availableCards;
  const cardNumbers = Array.from({length: availableCards.length}, (_, i) => i + 1);
  
  // Shuffle and select random cards
  const shuffledCards = cardNumbers.sort(() => Math.random() - 0.5);
  const selectedCards = shuffledCards.slice(0, cardsNeeded);
  
  // Add selected cards
  currentPlayerData.selectedCards = selectedCards;
  
  // Update visual selection
  selectedCards.forEach(cardNumber => {
    const cardDiv = document.querySelector(`[data-card-number="${cardNumber}"]`);
    if (cardDiv) {
      cardDiv.classList.add('selected');
    }
  });
  
  // Update display
  updateDisplay();
  saveProgress();
  
  // Show continue button
  const continueSection = document.getElementById('continueSection');
  if (continueSection) {
    continueSection.style.display = 'block';
  }
  
  console.log(`تم اختيار ${selectedCards.length} كرت عشوائياً للاعب ${currentPlayerData.name || gameState.currentPlayer}`);
}

async function continueToNextPlayer() {
  const gameId = sessionStorage.getItem('currentGameId');
  const currentPlayerData = gameState[gameState.currentPlayer];
  const cardsNeeded = gameState.rounds;
  
  // Check if this is a tournament match
  const currentMatchId = localStorage.getItem('currentMatchId');
  
  if (!gameId && !currentMatchId) {
    alert('لم يتم العثور على معرف اللعبة');
    return;
  }
  
  // Validate that current player has selected required cards
  if (currentPlayerData.selectedCards.length !== cardsNeeded) {
    alert(`يجب أن يختار ${currentPlayerData.name || 'اللاعب'} ${cardsNeeded} كرت بالضبط`);
    return;
  }
  
  try {
    // إظهار loading
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = true;
    continueBtn.textContent = 'جاري حفظ البطاقات...';
    
    if (currentMatchId) {
      // Tournament mode - save to localStorage only
      console.log('Saving tournament player cards...');
      savePlayerCards();
      
      // Switch to next player
      if (gameState.currentPlayer === 'player1') {
        gameState.currentPlayer = 'player2';
        // Set available cards for player 2
        gameState.availableCards = gameState.player2Cards;
        
        // Update display and recreate grid for new player
        updateDisplay();
        createCardsGrid();
        saveProgress();
        
        // إعادة تفعيل الزر
        continueBtn.disabled = false;
        continueBtn.textContent = 'تأكيد الاختيارات';
      } else {
        // Both players have selected their cards - redirect to final setup directly
        window.location.href = 'final-setup.html';
      }
    } else {
      // Regular challenge mode - use Firebase
      // حفظ البطاقات المختارة في Firebase
      const selectedCards = getSelectedCards();
      const playerNumber = gameState.currentPlayer === 'player1' ? 1 : 2;
      
      // Validate selectedCards before saving
      if (!selectedCards || selectedCards.length === 0) {
        throw new Error('No cards selected');
      }
      
      // Ensure all card paths are valid strings
      const validatedCards = selectedCards.filter(card => 
        card && typeof card === 'string' && card.trim() !== ''
      );
      
      if (validatedCards.length !== selectedCards.length) {
        console.warn(`Filtered out ${selectedCards.length - validatedCards.length} invalid cards`);
      }
      
      if (validatedCards.length === 0) {
        throw new Error('No valid cards to save');
      }
      
      // Prepare data for Firebase
      const gameData = {
        [`player${playerNumber}Cards`]: validatedCards
      };
      
      await GameService.savePlayerCards(gameId, playerNumber, validatedCards);
      
      // حفظ في localStorage للتوافق
      savePlayerCards();
      
      // Switch to next player
      if (gameState.currentPlayer === 'player1') {
        gameState.currentPlayer = 'player2';
        // Set available cards for player 2
        gameState.availableCards = gameState.player2Cards;
        
        // Update display and recreate grid for new player
        updateDisplay();
        createCardsGrid();
        saveProgress();
        
        // إعادة تفعيل الزر
        continueBtn.disabled = false;
        continueBtn.textContent = 'تأكيد الاختيارات';
      } else {
        // Both players have selected their cards - redirect to final setup directly
        window.location.href = 'final-setup.html';
      }
    }
    
  } catch (error) {
    console.error('Error saving cards:', error);
    alert('حدث خطأ في حفظ البطاقات: ' + error.message);
    
    // إعادة تفعيل الزر
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = false;
    continueBtn.textContent = 'تأكيد الاختيارات';
  }
}

// إضافة دالة مساعدة للحصول على البطاقات المختارة
function getSelectedCards() {
  const currentPlayerData = gameState[gameState.currentPlayer];
  return currentPlayerData.selectedCards.map(cardNumber => {
    // Use direct index mapping (cardNumber - 1 = index)
    const cardIndex = cardNumber - 1;
    return gameState.availableCards[cardIndex];
  });
}

function savePlayerCards() {
  const currentPlayerData = gameState[gameState.currentPlayer];
  const playerKey = gameState.currentPlayer === 'player1' ? 'player1' : 'player2';
  const picksKey = `${playerKey}StrategicPicks`;
  
  // Convert selected card numbers to card paths (strings only)
  const selectedCardPaths = currentPlayerData.selectedCards.map(cardNumber => {
    // Use direct index mapping (cardNumber - 1 = index)
    const cardIndex = cardNumber - 1;
    return gameState.availableCards[cardIndex];
  });
  
  localStorage.setItem(picksKey, JSON.stringify(selectedCardPaths));
}

function updateDisplay() {
  const currentPlayerData = gameState[gameState.currentPlayer];
  const currentPlayerName = document.getElementById('currentPlayerName');
  const instructionText = document.getElementById('instructionText');
  const continueSection = document.getElementById('continueSection');
  const continueBtn = document.getElementById('continueBtn');
  
  // Update player name - try multiple sources for the name
  let playerName = currentPlayerData.name;
  
  // If no name in current player data, try the global player names
  if (!playerName) {
    if (gameState.currentPlayer === 'player1') {
      playerName = gameState.player1Name || 'اللاعب الأول';
    } else {
      playerName = gameState.player2Name || 'اللاعب الثاني';
    }
  }
  
  const cardsNeeded = gameState.rounds || 11; // Default to 11 if not set
  const selectedCount = currentPlayerData.selectedCards.length;
  
  // Update the player name
  currentPlayerName.textContent = playerName;
  
  // Update the instruction text
  instructionText.textContent = `اختر ${cardsNeeded} كرت`;
  
  // Show continue button when current player has required cards
  if (selectedCount === cardsNeeded) {
    continueSection.style.display = 'block';
    continueBtn.textContent = 'تأكيد الاختيارات';
  } else {
    continueSection.style.display = 'none';
  }
}

function saveProgress() {
  localStorage.setItem('gameSetupProgress', JSON.stringify(gameState));
  
  // Also save selected cards in the format expected by player-cards.js
  const currentPlayerData = gameState[gameState.currentPlayer];
  if (currentPlayerData.selectedCards.length > 0) {
    const playerKey = gameState.currentPlayer === 'player1' ? 'player1' : 'player2';
    const picksKey = `${playerKey}StrategicPicks`;
    
    // Convert selected card numbers to card paths (strings only)
    const selectedCardPaths = currentPlayerData.selectedCards.map(cardNumber => {
      // Use direct index mapping (cardNumber - 1 = index)
      const cardIndex = cardNumber - 1;
      return gameState.availableCards[cardIndex];
    });
    
    localStorage.setItem(picksKey, JSON.stringify(selectedCardPaths));
  }
}

// Tournament mode functions
function checkTournamentMode() {
  const currentMatchPlayers = localStorage.getItem('currentMatchPlayers');
  const currentMatchId = localStorage.getItem('currentMatchId');
  const tournamentRounds = localStorage.getItem('tournamentRounds');
  
  if (currentMatchPlayers && currentMatchId) {
    // This is a tournament match
    const players = JSON.parse(currentMatchPlayers);
    gameState.player1.name = players[0];
    gameState.player2.name = players[1];
    
    // Show home button in tournament mode
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.style.display = 'flex';
    }
    
    // استخدام عدد الجولات المحدد في البطولة
    if(tournamentRounds) {
      gameState.rounds = parseInt(tournamentRounds);
      console.log('Tournament rounds set to:', gameState.rounds);
    }
    
    // تهيئة البطاقات للبطولة
    initializeTournamentCards();
    
    // Update display to show tournament mode
    updateTournamentDisplay();
  }
}

function initializeTournamentCards() {
  console.log('Initializing tournament cards...');
  
  // استخدام CardManager لإنشاء البطاقات
  if (window.cardManager) {
    // جمع جميع البطاقات من جميع الفئات
    const commonCards = window.cardManager.cardDatabase.common || [];
    const rareCards = window.cardManager.cardDatabase.rare || [];
    const epicCards = window.cardManager.cardDatabase.epic || [];
    const legendaryCards = window.cardManager.cardDatabase.legendary || [];
    const ultimateCards = window.cardManager.cardDatabase.ultimate || [];
    const cursedCards = window.cardManager.cardDatabase.cursed || [];
    
    console.log('Card counts:', {
      common: commonCards.length,
      rare: rareCards.length,
      epic: epicCards.length,
      legendary: legendaryCards.length,
      ultimate: ultimateCards.length,
      cursed: cursedCards.length
    });
    
    // إنشاء مجموعة البطاقات مع نسب متنوعة
    const cardsPerPlayer = 20;
    
    // حساب عدد البطاقات من كل فئة
    const cardDistribution = {
      common: Math.floor(cardsPerPlayer * 0.45),     // 45%
      rare: Math.floor(cardsPerPlayer * 0.25),       // 25%
      epic: Math.floor(cardsPerPlayer * 0.15),       // 15%
      legendary: Math.floor(cardsPerPlayer * 0.08),  // 8%
      ultimate: Math.floor(cardsPerPlayer * 0.05),   // 5%
      cursed: Math.floor(cardsPerPlayer * 0.02)      // 2%
    };
    
    // تعديل التوزيع للتأكد من وصول العدد الكلي إلى 20
    const totalDistributed = Object.values(cardDistribution).reduce((a, b) => a + b, 0);
    if (totalDistributed < cardsPerPlayer) {
      cardDistribution.common += (cardsPerPlayer - totalDistributed);
    }
    
    // بناء بطاقات اللاعب الأول
    let player1Cards = [
      ...getRandomCards(commonCards, cardDistribution.common),
      ...getRandomCards(rareCards, cardDistribution.rare),
      ...getRandomCards(epicCards, cardDistribution.epic),
      ...getRandomCards(legendaryCards, cardDistribution.legendary),
      ...getRandomCards(ultimateCards, cardDistribution.ultimate),
      ...getRandomCards(cursedCards, cardDistribution.cursed)
    ];
    
    // إذا لم نصل للعدد المطلوب، نكمل من البطاقات المتاحة
    while (player1Cards.length < cardsPerPlayer) {
      const allCards = [
        ...commonCards, 
        ...rareCards, 
        ...epicCards, 
        ...legendaryCards, 
        ...ultimateCards, 
        ...cursedCards
      ];
      const extra = getRandomCards(
        allCards.filter(c => !player1Cards.includes(c)), 
        cardsPerPlayer - player1Cards.length
      );
      player1Cards = [...player1Cards, ...extra];
      if (player1Cards.length >= cardsPerPlayer) break;
    }
    player1Cards = player1Cards.slice(0, cardsPerPlayer).sort(() => Math.random() - 0.5);
    
    // بناء بطاقات اللاعب الثاني (بطاقات مختلفة)
    let player2Cards = [
      ...getRandomCards(
        commonCards.filter(c => !player1Cards.includes(c)), 
        cardDistribution.common
      ),
      ...getRandomCards(
        rareCards.filter(c => !player1Cards.includes(c)), 
        cardDistribution.rare
      ),
      ...getRandomCards(
        epicCards.filter(c => !player1Cards.includes(c)), 
        cardDistribution.epic
      ),
      ...getRandomCards(
        legendaryCards.filter(c => !player1Cards.includes(c)), 
        cardDistribution.legendary
      ),
      ...getRandomCards(
        ultimateCards.filter(c => !player1Cards.includes(c)), 
        cardDistribution.ultimate
      ),
      ...getRandomCards(
        cursedCards.filter(c => !player1Cards.includes(c)), 
        cardDistribution.cursed
      )
    ];
    
    // إذا لم نصل للعدد المطلوب، نكمل من البطاقات المتاحة
    while (player2Cards.length < cardsPerPlayer) {
      const allCards = [
        ...commonCards, 
        ...rareCards, 
        ...epicCards, 
        ...legendaryCards, 
        ...ultimateCards, 
        ...cursedCards
      ];
      const extra = getRandomCards(
        allCards.filter(c => 
          !player1Cards.includes(c) && 
          !player2Cards.includes(c)
        ), 
        cardsPerPlayer - player2Cards.length
      );
      player2Cards = [...player2Cards, ...extra];
      if (player2Cards.length >= cardsPerPlayer) break;
    }
    player2Cards = player2Cards.slice(0, cardsPerPlayer).sort(() => Math.random() - 0.5);
    
    gameState.player1Cards = player1Cards;
    gameState.player2Cards = player2Cards;
    
    // تعيين البطاقات المتاحة للاعب الحالي
    if (gameState.currentPlayer === 'player1') {
      gameState.availableCards = gameState.player1Cards;
    } else {
      gameState.availableCards = gameState.player2Cards;
    }
    
    console.log('Tournament cards initialized with diverse rarity:', {
      player1Cards: gameState.player1Cards.length,
      player2Cards: gameState.player2Cards.length,
      player1Sample: gameState.player1Cards.slice(0, 3),
      player2Sample: gameState.player2Cards.slice(0, 3)
    });
    
    // إعادة إنشاء شبكة البطاقات
    createCardsGrid();
  } else {
    console.error('CardManager not found!');
    // استخدام بطاقات افتراضية في حالة عدم وجود CardManager
    gameState.availableCards = Array.from({length: 20}, (_, i) => `images/card-${i + 1}.png`);
    gameState.player1Cards = gameState.availableCards.slice(0, 20);
    gameState.player2Cards = Array.from({length: 20}, (_, i) => `images/card-${i + 21}.png`);
    createCardsGrid();
  }
}

function updateTournamentDisplay() {
  const currentPlayerSection = document.getElementById('currentPlayerSection');
  if (currentPlayerSection) {
    // Add tournament indicator
    const tournamentIndicator = document.createElement('div');
    tournamentIndicator.style.cssText = `
      font-size: 48px;
      text-align: center;
      margin-bottom: 10px;
      filter: drop-shadow(0 2px 8px rgba(255, 152, 0, 0.3));
    `;
    tournamentIndicator.textContent = '🏆';
    currentPlayerSection.insertBefore(tournamentIndicator, currentPlayerSection.firstChild);
  }
}

function handleTournamentGameEnd(winner) {
  // Save the winner for the tournament
  localStorage.setItem('matchWinner', winner);
  
  // Update leaderboard
  updateTournamentLeaderboard(winner);
  
  // تنظيف البيانات المؤقتة
  localStorage.removeItem('tournamentRounds');
  
  // Return to tournament bracket
  window.location.href = 'tournament-bracket.html';
}

function updateTournamentLeaderboard(winner) {
  const currentMatchPlayers = JSON.parse(localStorage.getItem('currentMatchPlayers'));
  const loser = currentMatchPlayers.find(player => player !== winner);
  
  let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
  
  if (!leaderboard[winner]) leaderboard[winner] = {wins: 0, losses: 0};
  if (!leaderboard[loser]) leaderboard[loser] = {wins: 0, losses: 0};
  
  leaderboard[winner].wins++;
  leaderboard[loser].losses++;
  
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Override the original continueToNextPlayer to handle tournament mode
const originalContinueToNextPlayer = window.continueToNextPlayer;
window.continueToNextPlayer = function() {
  const currentMatchId = localStorage.getItem('currentMatchId');
  
  if (currentMatchId) {
    // This is a tournament match, proceed to game
    originalContinueToNextPlayer();
  } else {
    // Regular challenge mode
    originalContinueToNextPlayer();
  }
};

// Make functions available globally
window.continueToNextPlayer = continueToNextPlayer;
window.selectRandomCards = selectRandomCards;
window.saveProgress = saveProgress;
window.savePlayerCards = savePlayerCards;
window.handleTournamentGameEnd = handleTournamentGameEnd;

