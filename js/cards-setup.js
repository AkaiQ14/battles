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
  rounds: 11, // Default value, but will be overridden by localStorage
  availableCards: [],
  player1Cards: [],
  player2Cards: []
};

// Load existing data
document.addEventListener('DOMContentLoaded', function() {
  loadExistingData();
  
  // Create cards grid normally
  createCardsGrid();
  
  updateDisplay();
});

function loadExistingData() {
  const savedData = localStorage.getItem('gameSetupProgress');
  
  // Multiple methods to retrieve rounds
  const storedRounds = 
    localStorage.getItem('roundsCount') || 
    sessionStorage.getItem('roundsCount') || 
    window.roundsCount || 
    (savedData ? JSON.parse(savedData).rounds : null) || 
    11;
  
  // Always prioritize rounds from storage
  gameState.rounds = parseInt(storedRounds);
  
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
    
    // Ensure rounds are set from storage
    gameState.rounds = parseInt(storedRounds);
    
    // Initialize card selection based on rounds
    const cardsNeeded = gameState.rounds;
    
    if (gameState.player1.selectedCards.length < cardsNeeded) {
      gameState.currentPlayer = 'player1';
    } else if (gameState.player2.selectedCards.length < cardsNeeded) {
      gameState.currentPlayer = 'player2';
    }
    
    // Rest of the existing logic remains the same
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
    // Load rounds from storage or default
    gameState.rounds = parseInt(storedRounds);
    
    generateRandomCards();
  }
  
  console.log('Rounds loaded:', gameState.rounds, {
    localStorage: localStorage.getItem('roundsCount'),
    sessionStorage: sessionStorage.getItem('roundsCount'),
    windowRounds: window.roundsCount
  });
}

function getRounds() {
  // Multiple methods to retrieve rounds
  const storedRounds = 
    localStorage.getItem('roundsCount') || 
    sessionStorage.getItem('roundsCount') || 
    window.roundsCount || 
    11;
  
  return parseInt(storedRounds);
}

// Dynamic card distribution with precise percentage allocation
function generateDynamicDistribution() {
  // Total cards per player
  const totalCardsPerPlayer = 20;
  
  // Base distribution percentages with added randomness
  const baseDistribution = {
    common: 0.90,     // 90%
    epic: 0.10        // 10%
  };
  
  // Add small random variations to percentages
  const variationFactor = 0.05; // 5% variation
  const dynamicDistribution = {};

  for (const [category, basePercentage] of Object.entries(baseDistribution)) {
    // Generate a random variation between -5% and +5%
    const variation = (Math.random() * 2 - 1) * variationFactor;
    dynamicDistribution[category] = Math.max(0, basePercentage + variation);
  }

  // Normalize to ensure total is 1 and maintain the core distribution
  const total = Object.values(dynamicDistribution).reduce((a, b) => a + b, 0);
  for (const category in dynamicDistribution) {
    dynamicDistribution[category] = (dynamicDistribution[category] / total);
  }
  
  // Calculate card counts based on percentages
  const cardDistribution = {
    common: Math.round(totalCardsPerPlayer * dynamicDistribution.common),
    epic: Math.round(totalCardsPerPlayer * dynamicDistribution.epic)
  };
  
  // Verify total card count
  const totalDistributed = Object.values(cardDistribution).reduce((a, b) => a + b, 0);
  if (totalDistributed !== totalCardsPerPlayer) {
    cardDistribution.common += (totalCardsPerPlayer - totalDistributed);
  }
  
  console.log('🎲 Precise Card Distribution:', cardDistribution);
  console.log('🎲 Dynamic Distribution Percentages:', dynamicDistribution);
  
  return cardDistribution;
}

// دالة متقدمة لاختيار بطاقات عشوائية بشكل أكثر دقة
function getRandomCards(cardPool, count, seed = null) {
  // التأكد من وجود بطاقات كافية
  if (cardPool.length < count) {
    console.warn(`Not enough cards in pool. Requested: ${count}, Available: ${cardPool.length}`);
    return cardPool.slice(); // إرجاع كل البطاقات المتاحة
  }

  // نسخ مصفوفة البطاقات للحفاظ على الأصل
  const availableCards = [...cardPool];
  const selectedCards = [];

  // استخدام توليد أرقام عشوائية أكثر أمانًا
  const getSecureRandom = (max) => {
    // استخدام crypto.getRandomValues للحصول على رقم عشوائي
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] % max;
  };

  // اختيار البطاقات بشكل عشوائي دون تكرار
  while (selectedCards.length < count && availableCards.length > 0) {
    const randomIndex = getSecureRandom(availableCards.length);
    const selectedCard = availableCards.splice(randomIndex, 1)[0];
    selectedCards.push(selectedCard);
  }

  return selectedCards;
}

// دالة متقدمة للخلط العشوائي مع تحسين الأمان
function advancedShuffle(array, seed = null) {
  const shuffledArray = [...array];
  
  // استخدام خوارزمية فيشر-ييتس للخلط
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const getSecureRandom = (max) => {
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      return randomBuffer[0] % max;
    };
    
    const j = getSecureRandom(i + 1);
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  
  return shuffledArray;
}

// دالة شاملة للتحقق من توزيع الكروت
function validateCardDistribution(player1Cards, player2Cards) {
  console.group('🔍 التحقق الشامل من توزيع الكروت');
  
  // فئات الكروت
  const cardCategories = [
    'common', 'epic'
  ];
  
  // دالة لحساب توزيع الكروت
  const calculateDistribution = (cards) => {
    const allAvailableCards = {
      common: window.cardManager.getAllCardsByCategory('common'),
      epic: window.cardManager.getAllCardsByCategory('epic')
    };
    
    const typeCount = {};
    const typePercentage = {};
    
    for (const category of cardCategories) {
      typeCount[category] = cards.filter(card => 
        allAvailableCards[category].includes(card)
      ).length;
      
      typePercentage[category] = (typeCount[category] / cards.length) * 100;
    }
    
    return { typeCount, typePercentage };
  };
  
  // حساب التوزيع للاعب الأول
  const player1Distribution = calculateDistribution(player1Cards);
  console.log('توزيع كروت اللاعب الأول:', player1Distribution);
  
  // حساب التوزيع للاعب الثاني
  const player2Distribution = calculateDistribution(player2Cards);
  console.log('توزيع كروت اللاعب الثاني:', player2Distribution);
  
  // التوزيع المتوقع من generateDynamicDistribution()
  const expectedDistribution = {
    common: 90,
    epic: 10
  };
  
  // التحقق من التوزيع
  const validatePercentages = (distribution, expectedDist) => {
    const results = {};
    
    for (const category of cardCategories) {
      const actualPercentage = distribution.typePercentage[category];
      const expectedPercentage = expectedDist[category];
      const difference = Math.abs(actualPercentage - expectedPercentage);
      
      results[category] = {
        actual: actualPercentage.toFixed(2) + '%',
        expected: expectedPercentage + '%',
        difference: difference.toFixed(2) + '%',
        isWithinTolerance: difference <= 2 // تسمح بتفاوت 2%
      };
    }
    
    return results;
  };
  
  // التحقق من توزيع اللاعب الأول
  const player1Validation = validatePercentages(player1Distribution, expectedDistribution);
  console.log('التحقق من توزيع كروت اللاعب الأول:', player1Validation);
  
  // التحقق من توزيع اللاعب الثاني
  const player2Validation = validatePercentages(player2Distribution, expectedDistribution);
  console.log('التحقق من توزيع كروت اللاعب الثاني:', player2Validation);
  
  // التحقق من عدم تكرار الكروت بين اللاعبين
  const duplicateCards = player1Cards.filter(card => player2Cards.includes(card));
  console.log('الكروت المكررة بين اللاعبين:', duplicateCards);
  
  // التحقق من العدد الإجمالي للكروت
  console.log('عدد كروت اللاعب الأول:', player1Cards.length);
  console.log('عدد كروت اللاعب الثاني:', player2Cards.length);
  
  // التحقق من صحة التوزيع
  const isPlayer1Valid = Object.values(player1Validation).every(result => result.isWithinTolerance);
  const isPlayer2Valid = Object.values(player2Validation).every(result => result.isWithinTolerance);
  
  console.log('حالة التوزيع:', {
    player1: isPlayer1Valid ? '✅ صحيح' : '❌ غير صحيح',
    player2: isPlayer2Valid ? '✅ صحيح' : '❌ غير صحيح'
  });
  
  console.groupEnd();
  
  return {
    player1: isPlayer1Valid,
    player2: isPlayer2Valid,
    duplicateCards: duplicateCards.length
  };
}

// تعديل generateRandomCards للتحقق من التوزيع
function generateRandomCards() {
  // التحقق من وجود بطاقات مولدة مسبقًا
  if (window.gameCardsGenerated && window.gameCardsData.player1Cards.length > 0) {
    console.log('🎴 Using existing generated cards from global variables');
    
    gameState.player1Cards = window.gameCardsData.player1Cards;
    gameState.player2Cards = window.gameCardsData.player2Cards;
    
    // تحديد البطاقات المتاحة للاعب الحالي
    if (gameState.currentPlayer === 'player1') {
      gameState.availableCards = gameState.player1Cards;
    } else {
      gameState.availableCards = gameState.player2Cards;
    }
    
    return; // استخدام البطاقات الموجودة
  }
  
  console.log('🎴 Generating new random cards');
  
  // جلب جميع الكروت من الفئات المختلفة
  const commonCards = window.cardManager.getAllCardsByCategory('common');
  const epicCards = window.cardManager.getAllCardsByCategory('epic');
  
  // العدد الإجمالي للبطاقات لكل لاعب
  const totalCardsPerPlayer = 20;
  
  // توليد توزيع البطاقات
  const cardDistribution = generateDynamicDistribution();
  
  // بذرة عشوائية فريدة لكل لعبة
  const gameSeed = Date.now();
  
  // التحقق من توزيع البطاقات
  const verifyCardTypes = (cards) => {
    const allAvailableCards = {
      common: window.cardManager.getAllCardsByCategory('common'),
      epic: window.cardManager.getAllCardsByCategory('epic')
    };
    
    const typeCount = {};
    const typePercentage = {};
    
    for (const category in allAvailableCards) {
      typeCount[category] = cards.filter(card => 
        allAvailableCards[category].includes(card)
      ).length;
      
      typePercentage[category] = (typeCount[category] / cards.length) * 100;
    }
    
    console.log('🎲 Card Distribution:', {
      counts: typeCount,
      percentages: typePercentage
    });
    
    return typeCount;
  };
  
  // توليد بطاقات اللاعب الأول
  let player1Cards = [
    ...getRandomCards(commonCards, cardDistribution.common),
    ...getRandomCards(epicCards, cardDistribution.epic)
  ];
  
  // التأكد من وجود 20 بطاقة بالضبط
  while (player1Cards.length < totalCardsPerPlayer) {
    const allAvailableCards = [
      ...commonCards, 
      ...epicCards
    ];
    
    const extraCards = getRandomCards(
      allAvailableCards.filter(card => !player1Cards.includes(card)), 
      totalCardsPerPlayer - player1Cards.length
    );
    
    player1Cards.push(...extraCards);
  }
  
  // الخلط النهائي للبطاقات للاعب الأول
  const finalPlayer1Cards = advancedShuffle(player1Cards.slice(0, totalCardsPerPlayer));
  
  // توليد بطاقات اللاعب الثاني مع استبعاد بطاقات اللاعب الأول
  let player2Cards = [
    ...getRandomCards(
      commonCards.filter(c => !finalPlayer1Cards.includes(c)), 
      cardDistribution.common,
      gameSeed + 9
    ),
    ...getRandomCards(
      epicCards.filter(c => !finalPlayer1Cards.includes(c)), 
      cardDistribution.epic,
      gameSeed + 10
    )
  ];
  
  // التأكد من وجود 20 بطاقة للاعب الثاني
  while (player2Cards.length < totalCardsPerPlayer) {
    const allAvailableCards = [
      ...commonCards, 
      ...epicCards
    ];
    
    const extraCards = getRandomCards(
      allAvailableCards.filter(c => 
        !finalPlayer1Cards.includes(c) && 
        !player2Cards.includes(c)
      ), 
      totalCardsPerPlayer - player2Cards.length,
      gameSeed + 15
    );
    
    player2Cards.push(...extraCards);
  }
  
  // الخلط النهائي للبطاقات للاعب الثاني
  const finalPlayer2Cards = advancedShuffle(player2Cards.slice(0, totalCardsPerPlayer), gameSeed + 16);
  
  // التحقق من توزيع البطاقات بعد إنشائها
  console.log('🎴 Player 1 Card Distribution:');
  verifyCardTypes(finalPlayer1Cards);
  
  console.log('🎴 Player 2 Card Distribution:');
  verifyCardTypes(finalPlayer2Cards);
  
  // حفظ البطاقات في حالة اللعبة
  gameState.player1Cards = finalPlayer1Cards;
  gameState.player2Cards = finalPlayer2Cards;
  
  // تحديد البطاقات المتاحة للاعب الحالي
  if (gameState.currentPlayer === 'player1') {
    gameState.availableCards = finalPlayer1Cards;
  } else {
    gameState.availableCards = finalPlayer2Cards;
  }
  
  // حفظ في المتغيرات العامة لمنع إعادة التوليد
  window.gameCardsData.player1Cards = finalPlayer1Cards;
  window.gameCardsData.player2Cards = finalPlayer2Cards;
  window.gameCardsGenerated = true;
  
  // بعد توليد البطاقات، أضف التحقق
  const validationResult = validateCardDistribution(finalPlayer1Cards, finalPlayer2Cards);
  
  // إذا كان هناك مشكلة في التوزيع، أعد التوليد
  if (!validationResult.player1 || !validationResult.player2 || validationResult.duplicateCards > 0) {
    console.warn('❌ مشكلة في توزيع الكروت، إعادة التوليد...');
    return generateRandomCards(); // إعادة التوليد
  }
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
  const totalRounds = getRounds();
  
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
    const cardsNeeded = getRounds();
    
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
  const cardsNeeded = getRounds();
  
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
  const cardsNeeded = getRounds();
  
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
  
  const cardsNeeded = getRounds();
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
    const epicCards = window.cardManager.cardDatabase.epic || [];
    
    console.log('Card counts:', {
      common: commonCards.length,
      epic: epicCards.length
    });
    
    // إنشاء مجموعة البطاقات مع نسب متنوعة
    const cardsPerPlayer = 20;
    
    // حساب عدد البطاقات من كل فئة
    const cardDistribution = {
      common: Math.floor(cardsPerPlayer * 0.90),     // 90%
      epic: Math.floor(cardsPerPlayer * 0.10)        // 10%
    };
    
    // تعديل التوزيع للتأكد من وصول العدد الكلي إلى 20
    const totalDistributed = Object.values(cardDistribution).reduce((a, b) => a + b, 0);
    if (totalDistributed < cardsPerPlayer) {
      cardDistribution.common += (cardsPerPlayer - totalDistributed);
    }
    
    // بناء بطاقات اللاعب الأول
    let player1Cards = [
      ...getRandomCards(commonCards, cardDistribution.common),
      ...getRandomCards(epicCards, cardDistribution.epic)
    ];
    
    // إذا لم نصل للعدد المطلوب، نكمل من البطاقات المتاحة
    while (player1Cards.length < cardsPerPlayer) {
      const allCards = [
        ...commonCards, 
        ...epicCards
      ];
      const extra = getRandomCards(
        allCards.filter(c => !player1Cards.includes(c)), 
        cardsPerPlayer - player1Cards.length
      );
      player1Cards = [...player1Cards, ...extra];
      if (player1Cards.length >= cardsPerPlayer) break;
    }
    player1Cards = advancedShuffle(player1Cards.slice(0, cardsPerPlayer));
    
    // بناء بطاقات اللاعب الثاني (بطاقات مختلفة)
    let player2Cards = [
      ...getRandomCards(
        commonCards.filter(c => !player1Cards.includes(c)), 
        cardDistribution.common
      ),
      ...getRandomCards(
        epicCards.filter(c => !player1Cards.includes(c)), 
        cardDistribution.epic
      )
    ];
    
    // إذا لم نصل للعدد المطلوب، نكمل من البطاقات المتاحة
    while (player2Cards.length < cardsPerPlayer) {
      const allCards = [
        ...commonCards, 
        ...epicCards
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
    player2Cards = advancedShuffle(player2Cards.slice(0, cardsPerPlayer));
    
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

