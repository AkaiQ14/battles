// Import Firebase GameService
import { GameService } from './gameService.js';


// ========== Extract Parameters ==========
const params = new URLSearchParams(window.location.search);
const gameId = params.get("gameId");
const player = params.get("player");
let playerName = "اللاعب";

let currentPlayer = player === "2" ? 2 : 1;
let rounds = 11; // Default rounds

// Define player parameter for abilities
const playerParam = player === "2" ? "player2" : "player1";

// Define storage keys
const PICKS_LOCAL_KEY = `${playerParam}Picks`;
const ORDER_LOCAL_KEY = `${playerParam}Order`;

const instruction = document.getElementById("instruction");
const grid = document.getElementById("cardGrid");
const continueBtn = document.getElementById("continueBtn");

// Abilities (self)
const abilitiesWrap = document.getElementById("playerAbilities");
const abilityStatus = document.getElementById("abilityStatus");

// Opponent abilities (view-only)
const oppPanel = document.getElementById("opponentAbilitiesPanel");
const oppWrap = document.getElementById("opponentAbilities");

// Update instruction with real player name
if (instruction) {
  instruction.innerText = `اللاعب ${playerName || 'اللاعب'} رتب بطاقاتك`;
}

// Check if required elements exist
if (!abilitiesWrap) {
  console.error('playerAbilities element not found');
}
if (!abilityStatus) {
  console.error('abilityStatus element not found');
}

let picks = [];
let submittedOrder = null;
let opponentName = "الخصم";

// Initialize card manager
let cardManager = null;

// Socket.IO initialization
const socket = io();
const gameID = gameId || 'default-game';
const playerRole = playerParam;

// Check if socket is initialized
if (!socket) {
  console.error('Socket not initialized');
}

socket.emit("joinGame", { gameID, role: playerRole, playerName: playerName });

// ===== Ability state =====
let myAbilities = [];                 // authoritative list for this player (objects: {text, used})
const tempUsed = new Set();           // optimistic, per-request (text)
const pendingRequests = new Map();    // requestId -> abilityText

/* ================== Helpers ================== */

// Normalize to [{text, used}]
function normalizeAbilityList(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return list.map(a => {
    if (typeof a === "string") return { text: a.trim(), used: false };
    if (a && typeof a === "object") return { text: String(a.text || "").trim(), used: !!a.used };
    return null;
  }).filter(Boolean).filter(a => a.text);
}

function renderBadges(container, abilities, { clickable = false, onClick } = {}) {
  if (!container) {
    console.error('Container not found for renderBadges');
    return;
  }
  
  container.innerHTML = "";
  const list = Array.isArray(abilities) ? abilities : [];
  console.log('Rendering badges:', { list, clickable });
  
  list.forEach(ab => {
    const isUsed = !!ab.used;
    const el = document.createElement(clickable ? "button" : "span");
    el.textContent = ab.text;
    el.className =
      "px-3 py-1 rounded-lg font-bold border " +
      (clickable
        ? (isUsed
            ? "bg-gray-500/60 text-black/60 border-gray-600 cursor-not-allowed"
            : "bg-yellow-400 hover:bg-yellow-300 text-black border-yellow-500")
        : "bg-gray-400/70 text-black border-gray-500");
    if (clickable) {
      if (isUsed) { 
        el.disabled = true; 
        el.setAttribute("aria-disabled", "true"); 
      } else if (onClick) { 
        el.onclick = () => {
          console.log('Ability clicked:', ab.text);
          onClick(ab.text);
        }; 
      }
    }
    container.appendChild(el);
  });
  
  console.log('Badges rendered successfully');
}

function hideOpponentPanel() {
  if (oppPanel) {
    oppPanel.classList.add("hidden");
    if (oppWrap) oppWrap.innerHTML = "";
  }
}

function createMedia(url, className, onClick) {
  // Use card manager if available, otherwise fallback to original method
  if (cardManager) {
    return cardManager.createMediaElement(url, className, onClick);
  }
  
  const isWebm = /\.webm(\?|#|$)/i.test(url);
  if (isWebm) {
    const vid = document.createElement("video");
    vid.src = url;
    vid.autoplay = true;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.className = className;
    vid.style.width = "100%";
    vid.style.height = "100%";
    vid.style.objectFit = "contain";
    vid.style.borderRadius = "12px";
    vid.style.border = "1px solid white";
    vid.style.display = "block";
    if (onClick) vid.onclick = onClick;
    return vid;
  } else {
    const img = document.createElement("img");
    img.src = url;
    img.className = className;
    img.alt = "Card Image";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.borderRadius = "12px";
    img.style.border = "1px solid white";
    img.style.display = "block";
    if (onClick) img.onclick = onClick;
    return img;
  }
}

/* ================== Load Game Data from Firebase ================== */
async function loadGameData() {
  if (!gameId) {
    console.error('No game ID found');
    alert('لم يتم العثور على معرف اللعبة');
    return;
  }
  
  try {
    // إظهار loading
    if (instruction) {
      instruction.textContent = 'جاري تحميل بيانات اللعبة...';
    }
    
    // مسح البيانات القديمة إذا كانت من لعبة مختلفة
    const currentGameId = localStorage.getItem('currentGameId');
    if (currentGameId && currentGameId !== gameId) {
      clearOldGameData();
    }
    
    // جلب البيانات من Firebase
    const gameData = await GameService.getGame(gameId);
    const playerData = gameData[`player${player}`];
    
    // تحديث المتغيرات
    picks = playerData.cards || [];
    myAbilities = normalizeAbilityList(playerData.abilities || []);
    playerName = playerData.name || "اللاعب";
    rounds = gameData.rounds || 11;
    
    // تحديث النص
    if (instruction) {
      instruction.textContent = `اللاعب ${playerName} رتب بطاقاتك`;
    }
    
    console.log('Loaded data:', { playerName, picks: picks.length, myAbilities: myAbilities.length, rounds });
    
    // عرض البيانات
    renderCards(picks);
    renderAbilities(myAbilities);
    
    // الاستماع للتغييرات في الوقت الفعلي
    GameService.listenToGame(gameId, (updatedData) => {
      updateGameData(updatedData);
    });
    
    console.log('Game data loaded successfully:', { playerName, picks: picks.length, myAbilities: myAbilities.length, rounds });
    
  } catch (error) {
    console.error('Error loading game data:', error);
    alert('حدث خطأ في تحميل بيانات اللعبة: ' + error.message);
    
    // إعادة تفعيل الزر في حالة الخطأ
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.textContent = 'متابعة';
    }
  }
}

// Update game data from Firebase
function updateGameData(gameData) {
  const playerData = gameData[`player${player}`];
  
  // تحديث rounds
  if (gameData.rounds) {
    rounds = gameData.rounds;
  }
  
  // تحديث اسم اللاعب
  if (playerData.name) {
    playerName = playerData.name;
    if (instruction) {
      instruction.textContent = `اللاعب ${playerName} رتب بطاقاتك`;
    }
  }
  
  // تحديث القدرات
  if (playerData.abilities) {
    myAbilities = normalizeAbilityList(playerData.abilities);
    renderAbilities(myAbilities);
  }
  
  // تحديث البطاقات
  if (playerData.cards) {
    picks = playerData.cards;
    
    // التحقق من وجود ترتيب مرسل للعبة الحالية
    const savedOrder = JSON.parse(localStorage.getItem(ORDER_LOCAL_KEY) || "[]");
    const currentGameId = localStorage.getItem('currentGameId');
    
    if (currentGameId && gameId && currentGameId === gameId && 
        savedOrder && savedOrder.length === picks.length) {
      submittedOrder = savedOrder.slice();
      hideOpponentPanel();
      renderCards(submittedOrder, submittedOrder);
    } else {
      submittedOrder = null;
      renderCards(picks, null);
      loadOpponentAbilities();
    }
  }
  
  console.log('Game data updated:', { playerData, rounds, playerName });
}

// Render abilities
function renderAbilities(abilities) {
  if (!abilitiesWrap) return;
  
  // Normalize abilities to the correct format
  const normalizedAbilities = normalizeAbilityList(abilities);
  
  // Use renderBadges for consistent UI
  renderBadges(abilitiesWrap, normalizedAbilities, { 
    clickable: true, 
    onClick: requestUseAbility 
  });
  
  // Update myAbilities to match the normalized format
  myAbilities = normalizedAbilities;
}

/* ================== Initialize Card Manager ================== */
function initializeCardManager() {
  // Wait for card manager to be available
  if (typeof window.cardManager !== 'undefined') {
    cardManager = window.cardManager;
    loadGameData(); // Use Firebase instead of loadPlayerCards
  } else {
    // Wait a bit and try again
    setTimeout(initializeCardManager, 100);
  }
}

function loadPlayerCards() {
  if (!cardManager) {
    console.error('Card manager not available');
    return;
  }

  // Try to load from localStorage first (like order.js)
  const localPicks = JSON.parse(localStorage.getItem(PICKS_LOCAL_KEY) || "[]");
  picks = Array.isArray(localPicks) ? localPicks : [];

  // Get rounds from game setup and limit cards accordingly
  const gameSetup = localStorage.getItem('gameSetupProgress');
  if (gameSetup) {
    try {
      const setupData = JSON.parse(gameSetup);
      const rounds = setupData.rounds || 11;
      
      // Take only the number of cards needed for the rounds
      if (picks.length > rounds) {
        picks = picks.slice(0, rounds);
        console.log(`Limited to ${rounds} cards for game rounds`);
      }
    } catch (e) {
      console.error('Error parsing game setup:', e);
    }
  }

  // Check if we have a submitted order for the CURRENT game
  const savedOrder = JSON.parse(localStorage.getItem(ORDER_LOCAL_KEY) || "[]");
  const currentGameId = localStorage.getItem('currentGameId');
  
  // Also check for StrategicOrdered format (for compatibility with card.js)
  const strategicOrder = JSON.parse(localStorage.getItem(`${playerParam}StrategicOrdered`) || "[]");
  
  // Use the most recent order available
  let orderToUse = null;
  if (currentGameId && gameId && currentGameId === gameId && 
      Array.isArray(savedOrder) && savedOrder.length === picks.length) {
    orderToUse = savedOrder;
  } else if (Array.isArray(strategicOrder) && strategicOrder.length === picks.length) {
    orderToUse = strategicOrder;
  }
  
  if (orderToUse) {
    submittedOrder = orderToUse.slice();
    picks = orderToUse.slice(); // Update picks to match the ordered arrangement
    console.log('Loaded existing order:', submittedOrder);
  } else {
    submittedOrder = null;
    // Clear old order if it's from a different game
    if (currentGameId !== gameId) {
      localStorage.removeItem(ORDER_LOCAL_KEY);
    }
  }

  if (!picks.length) {
    grid.innerHTML = `<p class="text-red-500 text-lg">لم يتم العثور على بطاقات لهذا اللاعب.</p>`;
    return;
  }

  if (submittedOrder && submittedOrder.length === picks.length) {
    hideOpponentPanel();
    console.log('Rendering submitted order on load:', submittedOrder);
    console.log('Picks on load:', picks);
    console.log('Submitted order length:', submittedOrder.length);
    console.log('Picks length:', picks.length);
    renderCards(submittedOrder, submittedOrder);
    // تحديث حالة الزر عند وجود ترتيب مرسل
    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.textContent = '✅ تم إرسال الترتيب';
    }
  } else {
    // Ensure picks is valid before rendering
    if (Array.isArray(picks) && picks.length > 0) {
      renderCards(picks, null);
    } else {
      console.warn('No valid picks found, showing empty state');
      if (grid) {
        grid.innerHTML = '<p class="text-red-500 text-lg">لم يتم العثور على بطاقات صالحة.</p>';
      }
    }
    // Show opponent abilities if not submitted
    loadOpponentAbilities();
    // إعادة تعيين الزر عند عدم وجود ترتيب مرسل
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.textContent = 'متابعة';
    }
  }
  
  // Load player abilities
  loadPlayerAbilities();
}

/* ================== Abilities (self) ================== */

// Initialize abilities - request from server immediately
if (abilityStatus) {
  abilityStatus.textContent = "بانتظار مزامنة القدرات من المستضيف…";
}

// Add default abilities as fallback
const defaultAbilities = [
  'قدرة الهجوم السريع',
  'قدرة الدفاع القوي',
  'قدرة الشفاء',
  'قدرة التخفي',
  'قدرة القوة الخارقة'
];

// Set default abilities immediately
myAbilities = defaultAbilities.map(text => ({ text, used: false }));
console.log('Setting default abilities:', myAbilities);
if (abilitiesWrap) {
  renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
  console.log('Rendered abilities in UI');
} else {
  console.error('abilitiesWrap not found');
}
if (abilityStatus) {
  abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها. سيتم إشعار المستضيف.";
}

// Request abilities from server
if (socket) {
  socket.emit("requestAbilities", { gameID, playerName });
  console.log('Requested abilities from server');
} else {
  console.error('Socket not available for ability request');
}

/* ================== Opponent abilities (view-only) ================== */
if (socket) {
  socket.emit("getPlayers", { gameID });
  socket.on("players", (names = []) => {
    const two = Array.isArray(names) ? names : [];
    const opponent = two.find(n => n && n !== playerName) || null;
    if (opponent) socket.emit("requestAbilities", { gameID, playerName: opponent });
  });
}

// Abilities router
if (socket) {
  socket.on("receiveAbilities", ({ abilities, player }) => {
    console.log('Received abilities:', { abilities, player, playerName });
    const list = normalizeAbilityList(abilities);
    if (player === playerName || !player) {
      myAbilities = list.map(a => ({ ...a, used: a.used || tempUsed.has(a.text) }));
      console.log('Setting myAbilities:', myAbilities);
      if (abilitiesWrap) {
        renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
      }
      if (abilityStatus) {
        abilityStatus.textContent = myAbilities.length
          ? "اضغط على القدرة لطلب استخدامها. سيتم إشعار المستضيف."
          : "لا توجد قدرات متاحة حالياً.";
      }
      return;
    }
    if (submittedOrder && submittedOrder.length === picks.length) { 
      hideOpponentPanel(); 
      return; 
    }
    if (oppWrap) {
      renderBadges(oppWrap, list, { clickable: false });
    }
  });
}

function requestUseAbility(abilityText) {
  console.log('Requesting ability:', abilityText);
  if (abilityStatus) {
    abilityStatus.textContent = "تم إرسال طلب استخدام القدرة…";
  }
  const requestId = `${playerName}:${Date.now()}`;
  tempUsed.add(abilityText);
  pendingRequests.set(requestId, abilityText);
  myAbilities = (myAbilities || []).map(a => a.text === abilityText ? { ...a, used: true } : a);
  if (abilitiesWrap) {
    renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
  }
  
  // Create ability request for host
  const request = {
    id: requestId,
    playerName: playerName,
    playerParam: playerParam,
    abilityText: abilityText,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  // Save request to localStorage for host to see
  try {
    const requests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    requests.push(request);
    localStorage.setItem('abilityRequests', JSON.stringify(requests));
    
    // Trigger storage event for host page
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'abilityRequests',
      newValue: localStorage.getItem('abilityRequests'),
      oldValue: localStorage.getItem('abilityRequests'),
      storageArea: localStorage
    }));
    
    console.log('Ability request sent to host via localStorage:', request);
  } catch (e) {
    console.error('Error saving ability request:', e);
  }
  
  // Also try socket if available
  if (socket) {
    socket.emit("requestUseAbility", { gameID, playerName, abilityText, requestId });
    console.log('Ability request sent via socket:', { gameID, playerName, abilityText, requestId });
  }
}

if (socket) {
  socket.on("abilityRequestResult", ({ requestId, ok, reason }) => {
    const abilityText = pendingRequests.get(requestId);
    if (abilityText) pendingRequests.delete(requestId);

    if (!ok) {
      if (abilityText) {
        tempUsed.delete(abilityText);
        myAbilities = (myAbilities || []).map(a => a.text === abilityText ? { ...a, used: false } : a);
      }
      if (abilitiesWrap) {
        renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
      }
      if (socket) {
        socket.emit("requestAbilities", { gameID, playerName });
      }

      if (abilityStatus) {
        if (reason === "already_used") abilityStatus.textContent = "❌ القدرة تم استخدامها بالفعل. اطلب قدرة أخرى.";
        else if (reason === "ability_not_found") abilityStatus.textContent = "❌ القدرة غير معروفة لدى المستضيف.";
        else abilityStatus.textContent = "❌ تعذر تنفيذ الطلب.";
      }
    } else {
      if (abilityStatus) {
        abilityStatus.textContent = "✅ تم قبول الطلب من المستضيف.";
      }
    }
  });
}

// Load abilities from localStorage
function loadPlayerAbilities() {
  const abilitiesKey = `${playerParam}Abilities`;
  const savedAbilities = localStorage.getItem(abilitiesKey);
  
  console.log('Loading abilities from localStorage:', { abilitiesKey, savedAbilities });
  
  if (savedAbilities) {
    try {
      const abilities = JSON.parse(savedAbilities);
      console.log('Parsed abilities:', abilities);
      
      // Always reset abilities to unused state for new game
      // Only check for used abilities if we're in the middle of a game
      const currentRound = parseInt(localStorage.getItem('currentRound') || '0');
      let usedSet = new Set();
      
      // Always load used abilities (both from game and from host control)
      const usedAbilitiesKey = `${playerParam}UsedAbilities`;
      const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
      usedSet = new Set(usedAbilities);
      
      if (currentRound > 0) {
        console.log(`Loading used abilities for round ${currentRound}:`, Array.from(usedSet));
      } else {
        console.log('Loading used abilities (including host-controlled):', Array.from(usedSet));
      }
      
      myAbilities = abilities.map(ability => {
        const text = typeof ability === 'string' ? ability : (ability.text || ability);
        // Check if it's used in game OR temporarily used (pending request) OR used by host
        const isUsedInGame = currentRound > 0 && usedSet.has(text);
        const isTemporarilyUsed = tempUsed.has(text);
        const isUsedByHost = usedSet.has(text); // Always check if used by host regardless of round
        const isUsed = isUsedInGame || isTemporarilyUsed || isUsedByHost;
        return { 
          text, 
          used: isUsed
        };
      });
      
      console.log(`Loaded ${myAbilities.length} abilities, ${myAbilities.filter(a => a.used).length} used`);
      
      // Force immediate UI update
      if (abilitiesWrap) {
        abilitiesWrap.innerHTML = ''; // Clear first
        renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
      }
      if (abilityStatus) {
        abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها.";
      }
      console.log('Loaded abilities:', myAbilities);
      
      // Force a small delay to ensure DOM is updated
      setTimeout(() => {
        if (abilitiesWrap && abilitiesWrap.children.length === 0) {
          console.log('Re-rendering abilities after delay...');
          renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
        }
      }, 100);
      
      // Check for any pending requests immediately after loading
      setTimeout(checkAbilityRequests, 100);
      
      // Also check for pending requests in localStorage to maintain disabled state
      setTimeout(() => {
        const requests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
        const myPendingRequests = requests.filter(req => 
          req.playerParam === playerParam && req.status === 'pending'
        );
        
        if (myPendingRequests.length > 0) {
          myPendingRequests.forEach(request => {
            tempUsed.add(request.abilityText);
            myAbilities = myAbilities.map(a =>
              a.text === request.abilityText ? { ...a, used: true } : a
            );
          });
          
          if (abilitiesWrap) {
            renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
          }
          
          if (abilityStatus) {
            abilityStatus.textContent = "⏳ في انتظار موافقة المستضيف...";
          }
          
          console.log(`Restored ${myPendingRequests.length} pending ability requests`);
        }
      }, 200);
    } catch (e) {
      console.error('Error loading abilities:', e);
      if (abilityStatus) {
        abilityStatus.textContent = "خطأ في تحميل القدرات.";
      }
    }
  } else {
    // Try to load abilities from gameSetupProgress as fallback
    console.log('No abilities found in localStorage, trying gameSetupProgress...');
    const gameSetup = localStorage.getItem('gameSetupProgress');
    if (gameSetup) {
      try {
        const setupData = JSON.parse(gameSetup);
        const playerKey = playerParam === 'player1' ? 'player1' : 'player2';
        const playerData = setupData[playerKey];
        
        if (playerData && playerData.abilities) {
          console.log('Found abilities in gameSetupProgress:', playerData.abilities);
          myAbilities = normalizeAbilityList(playerData.abilities);
          
          if (abilitiesWrap) {
            abilitiesWrap.innerHTML = '';
            renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
          }
          if (abilityStatus) {
            abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها.";
          }
          
          // Force a small delay to ensure DOM is updated
          setTimeout(() => {
            if (abilitiesWrap && abilitiesWrap.children.length === 0) {
              console.log('Re-rendering abilities from gameSetupProgress after delay...');
              renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
            }
          }, 100);
          
          return;
        }
      } catch (e) {
        console.error('Error parsing gameSetupProgress:', e);
      }
    }
    
    if (abilityStatus) {
      abilityStatus.textContent = "لا توجد قدرات متاحة حالياً.";
    }
  }
}

// Load opponent abilities
function loadOpponentAbilities() {
  const opponentParam = playerParam === 'player1' ? 'player2' : 'player1';
  const opponentAbilitiesKey = `${opponentParam}Abilities`;
  const savedAbilities = localStorage.getItem(opponentAbilitiesKey);
  
  if (savedAbilities) {
    try {
      const abilities = JSON.parse(savedAbilities);
      
      // Only check for used abilities if we're in the middle of a game
      const currentRound = parseInt(localStorage.getItem('currentRound') || '0');
      let usedSet = new Set();
      
      // Only load used abilities if we're actually in a game (round > 0)
      if (currentRound > 0) {
        const usedAbilitiesKey = `${opponentParam}UsedAbilities`;
        const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
        usedSet = new Set(usedAbilities);
      }
      
      const opponentAbilities = abilities.map(ability => {
        const text = typeof ability === 'string' ? ability : (ability.text || ability);
        // Only mark as used if we're in a game and it's actually been used
        const isUsed = currentRound > 0 && usedSet.has(text);
        return { 
          text, 
          used: isUsed
        };
      });
      
      if (oppWrap) {
        oppWrap.innerHTML = ''; // Clear first
        renderBadges(oppWrap, opponentAbilities, { clickable: false });
      }
      
      // Show opponent panel if not submitted
      if (oppPanel && !submittedOrder) {
        oppPanel.classList.remove("hidden");
      }
      
      console.log('Loaded opponent abilities:', opponentAbilities);
    } catch (e) {
      console.error('Error loading opponent abilities:', e);
    }
  }
}

// Initialize abilities when page loads
setTimeout(() => {
  loadPlayerAbilities();
  loadOpponentAbilities();
}, 100);

// Check for ability updates every 2 seconds
setInterval(() => {
  loadPlayerAbilities();
  loadOpponentAbilities();
  checkAbilityRequests();
}, 2000);

// Simple storage change listener like order.js
window.addEventListener('storage', function(e) {
  if (e.key && e.key.includes('Abilities')) {
    console.log(`Storage change detected: ${e.key}`);
    loadPlayerAbilities();
    loadOpponentAbilities();
  }
  if (e.key === 'abilityRequests') {
    checkAbilityRequests();
  }
});

// Listen for ability toggle events from host
window.addEventListener('abilityToggled', function(e) {
  try {
    const { playerParam: changedPlayerParam, abilityText, isUsed } = e.detail;
    console.log(`Ability toggled: ${abilityText} for ${changedPlayerParam}, isUsed: ${isUsed}`);

    if (changedPlayerParam === playerParam) {
      // ✅ مزامنة فورية
      forceImmediateAbilitySync(changedPlayerParam, abilityText, isUsed);
      
      // Also update myAbilities directly
      const abilityIndex = myAbilities.findIndex(ab => ab.text === abilityText);
      if (abilityIndex !== -1) {
        myAbilities[abilityIndex].used = isUsed;
        console.log(`Ability "${abilityText}" set to used: ${isUsed}`);
        
        // Re-render abilities
        if (abilitiesWrap) {
          renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
        }
        
        // Update status message
        if (abilityStatus) {
          if (isUsed) {
            abilityStatus.textContent = "القدرة مستخدمة - انتظر إعادة التفعيل من المضيف";
            abilityStatus.style.color = "#ff6b35";
          } else {
            abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها. سيتم إشعار المستضيف.";
            abilityStatus.style.color = "#32c675";
          }
        }
      }
    }

    loadOpponentAbilities();
  } catch (error) {
    console.error('Error handling ability toggle event:', error);
  }
});

// Listen for postMessage from host
window.addEventListener('message', function(e) {
  try {
    if (e.data && e.data.type === 'ABILITY_TOGGLED') {
      const { playerParam: changedPlayerParam, abilityText, isUsed } = e.data;
      console.log(`PostMessage: Ability toggled: ${abilityText} for ${changedPlayerParam}, isUsed: ${isUsed}`);
      
      // Check if this change affects the current player
      if (changedPlayerParam === playerParam) {
        console.log(`Updating abilities for current player: ${playerParam}`);
        
        // Update myAbilities
        if (myAbilities) {
          myAbilities.forEach(ability => {
            if (ability.text === abilityText) {
              ability.used = isUsed;
            }
          });
        }
        
        // Update tempUsed
        if (isUsed) {
          tempUsed.add(abilityText);
        } else {
          tempUsed.delete(abilityText);
        }
        
        // Force immediate re-render
        loadPlayerAbilities();
        console.log(`Abilities updated for ${playerParam}`);
      }
      
      // Always re-render opponent abilities
      loadOpponentAbilities();
    }
  } catch (error) {
    console.error('Error handling postMessage:', error);
  }
});

// ✅ فور وصول أي تحديث من المضيف، أعد تحميل القدرات مباشرة
function forceImmediateAbilitySync(playerParam, abilityText, isUsed) {
  try {
    // حدّث القدرات الخاصة بي
    if (myAbilities) {
      myAbilities.forEach(ability => {
        if (ability.text === abilityText) {
          ability.used = isUsed;
        }
      });
    }

    // حدّث الحالة المؤقتة
    if (isUsed) {
      tempUsed.add(abilityText);
    } else {
      tempUsed.delete(abilityText);
    }

    // أعد رسم القدرات فوراً
    if (abilitiesWrap) {
      renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
    }
    loadOpponentAbilities();
    console.log(`🔄 فوراً: تم تحديث القدرة ${abilityText} (${isUsed ? "مستخدمة" : "متاحة"})`);
  } catch (err) {
    console.error("Error in forceImmediateAbilitySync:", err);
  }
}


// Check for ability request responses
function checkAbilityRequests() {
  try {
    const requests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    const myRequests = requests.filter(req => req.playerParam === playerParam);
    
    if (myRequests.length === 0) {
      // No pending requests, reset status
      if (abilityStatus && !myAbilities.some(a => a.used)) {
        abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها.";
      }
      return;
    }
    
    myRequests.forEach(request => {
      if (request.status === 'approved') {
        // Ability was approved by host - keep it disabled permanently
        if (abilityStatus) {
          abilityStatus.textContent = "✅ تم قبول الطلب من المستضيف.";
        }
        
        // Mark as permanently used
        const usedAbilitiesKey = `${playerParam}UsedAbilities`;
        const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
        if (!usedAbilities.includes(request.abilityText)) {
          usedAbilities.push(request.abilityText);
          localStorage.setItem(usedAbilitiesKey, JSON.stringify(usedAbilities));
        }
        
        // Keep ability disabled (already disabled from request)
        // Update abilities display to show permanent disabled state
        myAbilities = (myAbilities || []).map(a =>
          a.text === request.abilityText ? { ...a, used: true } : a
        );
        
        // Also update the player-specific abilities list
        const playerAbilitiesKey = `${playerParam}Abilities`;
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
        const globalAbilitiesKey = playerParam === 'player1' ? 'P1_ABILITIES_KEY' : 'P2_ABILITIES_KEY';
        const globalAbilities = JSON.parse(localStorage.getItem(globalAbilitiesKey) || '[]');
        globalAbilities.forEach(ability => {
          if (ability.text === request.abilityText) {
            ability.used = true;
          }
        });
        localStorage.setItem(globalAbilitiesKey, JSON.stringify(globalAbilities));
        
        if (abilitiesWrap) {
          renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
        }
        
        // Remove the request
        const updatedRequests = requests.filter(req => req.id !== request.id);
        localStorage.setItem('abilityRequests', JSON.stringify(updatedRequests));
        
        console.log(`Ability ${request.abilityText} approved and permanently disabled for ${playerParam}`);
        
      } else if (request.status === 'rejected') {
        // Ability was rejected by host - re-enable it
        if (abilityStatus) {
          abilityStatus.textContent = "❌ تم رفض الطلب من المستضيف.";
        }
        
        // Remove from temp used and re-enable
        tempUsed.delete(request.abilityText);
        
        // Update abilities display to show enabled state
        myAbilities = (myAbilities || []).map(a =>
          a.text === request.abilityText ? { ...a, used: false } : a
        );
        
        if (abilitiesWrap) {
          renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
        }
        
        // Remove the request
        const updatedRequests = requests.filter(req => req.id !== request.id);
        localStorage.setItem('abilityRequests', JSON.stringify(updatedRequests));
        
        console.log(`Ability ${request.abilityText} rejected and re-enabled for ${playerParam}`);
      }
    });
  } catch (e) {
    console.error('Error checking ability requests:', e);
  }
}

/* ================== Mobile Detection ================== */
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/* ================== Cards UI ================== */
/* ============ Unique-number dropdown logic (from order.js) ============ */
function buildOptions(select, N, forbiddenSet, currentValue) {
  select.innerHTML = "";
  const def = document.createElement("option"); 
  def.value = ""; 
  def.textContent = "-- الترتيب --"; 
  select.appendChild(def);
  
  for (let i = 1; i <= N; i++) {
    if (!forbiddenSet.has(String(i)) || String(i) === String(currentValue)) {
      const opt = document.createElement("option");
      opt.value = i; 
      opt.textContent = i; 
      select.appendChild(opt);
    }
  }
  
  if (currentValue && Array.from(select.options).some(o => o.value === String(currentValue))) {
    select.value = String(currentValue);
  } else {
    select.value = "";
  }
}

function snapshotChosen(selects) {
  const values = selects.map(s => s.value || "");
  const chosenSet = new Set(values.filter(Boolean));
  return { chosenSet, values };
}

function refreshAllSelects(selects, N) {
  const { chosenSet, values } = snapshotChosen(selects);
  selects.forEach((sel, idx) => buildOptions(sel, N, chosenSet, values[idx]));
  const allChosen = values.filter(Boolean).length === N && chosenSet.size === N;
  if (continueBtn) {
    continueBtn.classList.toggle("hidden", !allChosen);
    continueBtn.disabled = !allChosen;
  }
}

function renderCards(pickList, lockedOrder = null) {
  if (!grid) return;
  
  grid.innerHTML = "";
  const display = (Array.isArray(lockedOrder) && lockedOrder.length === pickList.length) ? lockedOrder : pickList;
  const selects = [];
  
  display.forEach((url) => {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col items-center space-y-2";

    // Media + shield wrapper (prevents right-click/drag and hides URL affordances)
    const mediaWrap = document.createElement("div");
    mediaWrap.className = "nosave";
    const media = createMedia(url, "w-36 h-48 object-contain rounded shadow");
    const shield = document.createElement("div");
    shield.className = "shield";
    mediaWrap.appendChild(media);
    mediaWrap.appendChild(shield);

    const select = document.createElement("select");
    select.className = "w-24 p-1 rounded bg-gray-800 text-white text-center text-lg orderSelect";
    const def = document.createElement("option"); 
    def.value = ""; 
    def.textContent = "-- الترتيب --"; 
    select.appendChild(def);

    if (Array.isArray(lockedOrder) && lockedOrder.length === pickList.length) {
      const orderIndex = lockedOrder.findIndex(u => u === url);
      if (orderIndex >= 0) {
        const opt = document.createElement("option");
        opt.value = String(orderIndex + 1);
        opt.textContent = String(orderIndex + 1);
        select.appendChild(opt);
        select.value = String(orderIndex + 1);
        select.disabled = true;
      }
    }

    wrapper.appendChild(mediaWrap);
    wrapper.appendChild(select);
    grid.appendChild(wrapper);
    selects.push(select);
  });

  if (Array.isArray(lockedOrder) && lockedOrder.length === pickList.length) {
    if (continueBtn) {
      continueBtn.classList.add("hidden");
    }
  } else {
    refreshAllSelects(selects, pickList.length);
    selects.forEach(sel => sel.addEventListener("change", () => refreshAllSelects(selects, pickList.length)));
    if (continueBtn) {
      continueBtn.classList.add("hidden");
      continueBtn.disabled = false;
      continueBtn.textContent = "متابعة";
    }
  }
}

/* ================== Mobile Number Selection ================== */
function checkArrangementComplete() {
  if (continueBtn) {
    continueBtn.classList.remove("hidden");
    continueBtn.disabled = false;
    continueBtn.textContent = "متابعة";
  }
}

/* ================== Submit Ordered Picks ================== */
async function submitPicks() {
  if (!picks.length) return;

  if (Array.isArray(submittedOrder) && submittedOrder.length === picks.length) {
    return;
  }

  // Process ordering based on device type
  let ordered = [];
  
  if (isMobile) {
    // For mobile, use dropdown selection (same as desktop for consistency)
    const dropdowns = document.querySelectorAll(".orderSelect");
    const values = dropdowns.length
      ? Array.from(dropdowns).map((s) => parseInt(s.value, 10))
      : [];

    const inRange = values.every(v => Number.isInteger(v) && v >= 1 && v <= picks.length);
    if (!inRange || new Set(values).size !== picks.length) {
      alert("يرجى ترتيب كل البطاقات بدون تكرار وضمن النطاق الصحيح.");
      return;
    }

    // Create ordered array based on dropdown selections
    ordered = new Array(picks.length);
    for (let i = 0; i < values.length; i++) {
      const orderIndex = values[i] - 1;
      ordered[orderIndex] = picks[i];
      console.log(`Card ${i + 1} (${picks[i]}) placed at position ${orderIndex + 1}`);
    }
    console.log('Final ordered array:', ordered);
  } else {
    // For desktop dropdown selection, validate and process dropdowns
    const dropdowns = document.querySelectorAll(".orderSelect");
    const values = dropdowns.length
      ? Array.from(dropdowns).map((s) => parseInt(s.value, 10))
      : [];

    const inRange = values.every(v => Number.isInteger(v) && v >= 1 && v <= picks.length);
    if (!inRange || new Set(values).size !== picks.length) {
      alert("يرجى ترتيب كل البطاقات بدون تكرار وضمن النطاق الصحيح.");
      return;
    }

    ordered = new Array(picks.length);
    for (let i = 0; i < values.length; i++) {
      const orderIndex = values[i] - 1;
      ordered[orderIndex] = picks[i];
      console.log(`Card ${i + 1} (${picks[i]}) placed at position ${orderIndex + 1}`);
    }
    console.log('Final ordered array (desktop):', ordered);
  }

  try {
    // إظهار loading
    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.textContent = 'جاري إرسال الترتيب...';
    }
    
    // Store submitted order in localStorage (following order.js pattern)
    localStorage.setItem(ORDER_LOCAL_KEY, JSON.stringify(ordered));
    
    // Store card arrangement for final-setup.html to detect (following order.js pattern)
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    localStorage.setItem(`${playerKey}CardArrangement`, JSON.stringify(ordered));
    localStorage.setItem(`${playerKey}ArrangementCompleted`, 'true');
    
    // Also store in the format expected by final-setup.html
    const currentGameSetup = JSON.parse(localStorage.getItem('gameSetupProgress') || '{}');
    const updatedGameSetup = {
      ...currentGameSetup,
      [playerKey]: {
        ...currentGameSetup[playerKey],
        selectedCards: ordered,
        arrangementCompleted: true
      }
    };
    localStorage.setItem('gameSetupProgress', JSON.stringify(updatedGameSetup));
    
    // Store in gameState format as well
    const currentGameState = JSON.parse(localStorage.getItem('gameState') || '{}');
    const updatedGameState = {
      ...currentGameState,
      [playerKey]: {
        ...currentGameState[playerKey],
        selectedCards: ordered,
        arrangementCompleted: true
      }
    };
    localStorage.setItem('gameState', JSON.stringify(updatedGameState));
    
    // Store in StrategicOrdered format (for compatibility with card.js)
    localStorage.setItem(`${playerParam}StrategicOrdered`, JSON.stringify(ordered));
    
    // Dispatch custom event for host to listen (following order.js pattern)
    window.dispatchEvent(new CustomEvent('orderSubmitted', { 
      detail: { gameId, playerName, ordered } 
    }));
    
    // Save to Firebase if gameId is available
    if (gameId) {
      try {
        await GameService.saveCardOrder(gameId, player, ordered);
        localStorage.setItem('currentGameId', gameId);
      } catch (e) {
        console.warn('Firebase save failed, but localStorage saved:', e);
      }
    }
    
    // Update submittedOrder immediately (like order.js)
    submittedOrder = ordered.slice();
    
    hideOpponentPanel();
    
    // Re-render cards immediately with submitted order (like order.js)
    // Ensure the order is displayed correctly
    console.log('Rendering submitted order:', submittedOrder);
    console.log('Submitted order length:', submittedOrder.length);
    console.log('Picks length:', picks.length);
    renderCards(submittedOrder, submittedOrder);
    
    // Update button state (like order.js)
    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.textContent = '✅ تم إرسال الترتيب';
      continueBtn.classList.remove('hidden');
    }
    
    // Hide mobile instructions after submission
    const mobileInstructions = document.querySelector('.mobile-instructions');
    if (mobileInstructions) {
      mobileInstructions.remove();
    }
    
    // Show success message
    console.log('Order submitted successfully:', ordered);
    console.log('Submitted order length:', submittedOrder.length);
    console.log('Picks length:', picks.length);
    
    // Force a small delay to ensure UI updates
    setTimeout(() => {
      console.log('Final verification - submitted order:', submittedOrder);
      console.log('Final verification - picks:', picks);
    }, 100);
    
    // Success - no alert message needed
    
  } catch (error) {
    console.error('Error saving card order:', error);
    alert('حدث خطأ في حفظ ترتيب البطاقات: ' + error.message);
    
    // إعادة تفعيل الزر
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.textContent = 'متابعة';
    }
  }
}

window.submitPicks = submitPicks;

/* ================== Order.js Command Integration ================== */
// Function to be called from host page (card.html) following order.js pattern
window.arrangeCards = function(playerParam, gameId, playerName) {
  console.log(`Arranging cards for ${playerParam} in game ${gameId}`);
  
  // Update current player info
  if (playerParam === 'player1' || playerParam === 'player2') {
    currentPlayer = playerParam === 'player2' ? 2 : 1;
    window.playerParam = playerParam;
    window.gameId = gameId;
    window.playerName = playerName;
    
    // Update instruction
    if (instruction) {
      instruction.textContent = `اللاعب ${playerName} رتب بطاقاتك`;
    }
    
    // Reload cards with new parameters
    loadPlayerCards();
  }
};

// Function to check arrangement status (for host monitoring)
window.getArrangementStatus = function() {
  return {
    isArranged: Array.isArray(submittedOrder) && submittedOrder.length === picks.length,
    order: submittedOrder,
    playerParam: playerParam,
    gameId: gameId,
    playerName: playerName
  };
};

// Function to reset arrangement (for new games)
window.resetArrangement = function() {
  submittedOrder = null;
  picks = [];
  if (grid) {
    grid.innerHTML = '';
  }
  if (continueBtn) {
    continueBtn.classList.add('hidden');
    continueBtn.disabled = true;
    continueBtn.textContent = 'متابعة';
  }
  
  // Clear localStorage
  localStorage.removeItem(ORDER_LOCAL_KEY);
  localStorage.removeItem(`${playerParam}StrategicOrdered`);
  localStorage.removeItem(`${playerParam}CardArrangement`);
  localStorage.removeItem(`${playerParam}ArrangementCompleted`);
  
  console.log('Arrangement reset for', playerParam);
};

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
    
    // Reload abilities
    loadPlayerAbilities();
    loadOpponentAbilities();
  } catch (error) {
    console.error('Error clearing used abilities:', error);
  }
}

// Clear old game data when starting a new game
function clearOldGameData() {
  try {
    // Clear old card orders
    localStorage.removeItem('player1Order');
    localStorage.removeItem('player2Order');
    
    // Clear old game ID
    localStorage.removeItem('currentGameId');
    
    // Reset submitted order
    submittedOrder = null;
    
    console.log('Cleared old game data');
  } catch (error) {
    console.error('Error clearing old game data:', error);
  }
}

// Initialize card manager when page loads
document.addEventListener('DOMContentLoaded', function() {
  initializeCardManager();
  
  // Check for ability requests every 1 second for faster response
  setInterval(checkAbilityRequests, 1000);
  
  // Listen for storage changes
  window.addEventListener('storage', function(e) {
    if (e.key === 'abilityRequests') {
      checkAbilityRequests();
    } else if (e.key && e.key.endsWith('UsedAbilities')) {
      // Handle ability usage changes from host
      const playerParamFromKey = e.key.replace('UsedAbilities', '');
      if (playerParamFromKey === playerParam) {
        console.log(`Received ability usage change via storage: ${e.key}`);
        
        // Reload abilities to sync with host changes
        setTimeout(() => {
          console.log('Reloading abilities due to host changes...');
          loadPlayerAbilities();
        }, 100);
      }
    }
  });
  
  // Listen for custom events
  window.addEventListener('forceAbilitySync', function() {
    checkAbilityRequests();
  });
  
  // Listen for ability toggle events from host
  window.addEventListener('abilityToggled', function(event) {
    const { playerParam: eventPlayerParam, abilityText, isUsed } = event.detail;
    
    // Only process if it's for this player
    if (eventPlayerParam === playerParam) {
      console.log(`Received ability toggle from host: ${abilityText} = ${isUsed}`);
      
      // Update local abilities
      if (myAbilities) {
        myAbilities.forEach(ability => {
          if (ability.text === abilityText) {
            ability.used = isUsed;
          }
        });
      }
      
      // Update temp used set
      if (isUsed) {
        tempUsed.add(abilityText);
      } else {
        tempUsed.delete(abilityText);
      }
      
      // Also update the used abilities in localStorage to match host
      const usedAbilitiesKey = `${playerParam}UsedAbilities`;
      const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
      
      if (isUsed) {
        if (!usedAbilities.includes(abilityText)) {
          usedAbilities.push(abilityText);
        }
      } else {
        const filteredAbilities = usedAbilities.filter(ability => ability !== abilityText);
        usedAbilities.length = 0;
        usedAbilities.push(...filteredAbilities);
      }
      
      localStorage.setItem(usedAbilitiesKey, JSON.stringify(usedAbilities));
      
      // Update UI immediately
      if (abilitiesWrap) {
        renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
      }
      
      // Update status message
      if (abilityStatus) {
        if (isUsed) {
          abilityStatus.textContent = `✅ تم تفعيل ${abilityText} من قبل المضيف`;
        } else {
          abilityStatus.textContent = `🔄 تم إلغاء تفعيل ${abilityText} من قبل المضيف`;
        }
        
        // Reset status after 3 seconds
        setTimeout(() => {
          if (abilityStatus) {
            abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها.";
          }
        }, 3000);
      }
    }
  });
  
  // Listen for postMessage from host
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'ABILITY_TOGGLED') {
      const { playerParam: eventPlayerParam, abilityText, isUsed } = event.data;
      
      // Only process if it's for this player
      if (eventPlayerParam === playerParam) {
        console.log(`Received ability toggle via postMessage: ${abilityText} = ${isUsed}`);
        
        // Update local abilities
        if (myAbilities) {
          myAbilities.forEach(ability => {
            if (ability.text === abilityText) {
              ability.used = isUsed;
            }
          });
        }
        
        // Update temp used set
        if (isUsed) {
          tempUsed.add(abilityText);
        } else {
          tempUsed.delete(abilityText);
        }
        
        // Also update the used abilities in localStorage to match host
        const usedAbilitiesKey = `${playerParam}UsedAbilities`;
        const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
        
        if (isUsed) {
          if (!usedAbilities.includes(abilityText)) {
            usedAbilities.push(abilityText);
          }
        } else {
          const filteredAbilities = usedAbilities.filter(ability => ability !== abilityText);
          usedAbilities.length = 0;
          usedAbilities.push(...filteredAbilities);
        }
        
        localStorage.setItem(usedAbilitiesKey, JSON.stringify(usedAbilities));
        
        // Update UI immediately
        if (abilitiesWrap) {
          renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
        }
        
        // Update status message
        if (abilityStatus) {
          if (isUsed) {
            abilityStatus.textContent = `✅ تم تفعيل ${abilityText} من قبل المضيف`;
          } else {
            abilityStatus.textContent = `🔄 تم إلغاء تفعيل ${abilityText} من قبل المضيف`;
          }
          
          // Reset status after 3 seconds
          setTimeout(() => {
            if (abilityStatus) {
              abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها.";
            }
          }, 3000);
        }
      }
    }
  });
  
  // Also check immediately on load
  setTimeout(checkAbilityRequests, 500);
  
  // Force immediate ability sync on page load
  setTimeout(() => {
    if (myAbilities && abilitiesWrap) {
      renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
      console.log('Forced ability UI refresh on page load');
    }
  }, 1000);
});

// ✅ مزامنة فورية لتغييرات ترتيب البطاقات والاختيارات
window.addEventListener('storage', function(e) {
  try {
    if (e.key === ORDER_LOCAL_KEY || e.key === PICKS_LOCAL_KEY) {
      console.log(`🔄 فوراً: تغيير في ${e.key}, إعادة تحميل البطاقات`);
      loadPlayerCards();
    }
  } catch (err) {
    console.error("Error in immediate picks/order sync:", err);
  }
});

// ✅ استقبال رسائل مباشرة للترتيب (لو المضيف أرسلها)
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'ORDER_UPDATED') {
    console.log("🔄 استلام ترتيب جديد عبر postMessage:", e.data);
    loadPlayerCards();
  }
  if (e.data && e.data.type === 'PICKS_UPDATED') {
    console.log("🔄 استلام اختيارات جديدة عبر postMessage:", e.data);
    loadPlayerCards();
  }
});

// Open battle view for player
function openBattleView() {
  try {
    // Check if button is disabled
    const viewBattleBtn = document.getElementById('viewBattleBtn');
    if (viewBattleBtn && viewBattleBtn.disabled) {
      alert('المعركة لم تبدأ بعد. يرجى انتظار المضيف لبدء المعركة.');
      return;
    }
    
    // Get current game ID and player number
    const currentGameId = gameId || 'default';
    const playerNumber = player || '1';
    
    // Generate the player view URL
    const baseUrl = window.location.origin + window.location.pathname.replace('player-cards.html', '');
    const playerViewUrl = `${baseUrl}player-view.html?player=${playerNumber}&gameId=${currentGameId}`;
    
    console.log(`Opening battle view for player ${playerNumber}: ${playerViewUrl}`);
    
    // Open in new tab (not a separate window)
    const newWindow = window.open(playerViewUrl, '_blank');
    
    if (!newWindow) {
      alert('تم منع النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.');
      return;
    }
    
    // Focus the new window
    newWindow.focus();
    
    // Show success message
    showToast('تم فتح صفحة عرض التحدي بنجاح!', 'success');
    
  } catch (error) {
    console.error('Error opening battle view:', error);
    alert('حدث خطأ في فتح صفحة عرض التحدي: ' + error.message);
  }
}

// Check battle status and enable/disable battle view button
function checkBattleStatus() {
  try {
    const viewBattleBtn = document.getElementById('viewBattleBtn');
    if (!viewBattleBtn) return;
    
    // Check if battle has started by looking for battle started flag
    const battleStarted = localStorage.getItem('battleStarted') === 'true';
    
    if (battleStarted) {
      // Enable button
      viewBattleBtn.disabled = false;
      viewBattleBtn.className = "bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95";
      viewBattleBtn.textContent = "عرض التحدي";
      console.log('Battle view button enabled');
    } else {
      // Keep disabled
      viewBattleBtn.disabled = true;
      viewBattleBtn.className = "bg-gray-500 text-gray-300 px-8 py-3 rounded-lg text-xl font-bold shadow-lg cursor-not-allowed opacity-50";
      viewBattleBtn.textContent = "عرض التحدي";
      console.log('Battle view button disabled');
    }
  } catch (error) {
    console.error('Error checking battle status:', error);
  }
}

// Start monitoring battle status
function startBattleStatusMonitoring() {
  // Check initially
  checkBattleStatus();
  
  // Listen for localStorage changes
  window.addEventListener('storage', function(e) {
    if (e.key === 'battleStarted') {
      checkBattleStatus();
    }
    
    // Listen for host notifications
    if (e.key === 'playerNotification') {
      try {
        const notification = JSON.parse(e.newValue || '{}');
        if (notification.type === 'ability_toggle' && notification.playerParam === playerParam) {
          console.log('Host toggled ability:', notification);
          
          // Update ability state immediately
          const abilityIndex = myAbilities.findIndex(ab => ab.text === notification.abilityText);
          if (abilityIndex !== -1) {
            myAbilities[abilityIndex].used = notification.isUsed;
            console.log(`Ability "${notification.abilityText}" set to used: ${notification.isUsed}`);
            
            // Re-render abilities
            if (abilitiesWrap) {
              renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
            }
            
            // Update status message
            if (abilityStatus) {
              if (notification.isUsed) {
                abilityStatus.textContent = "القدرة مستخدمة - انتظر إعادة التفعيل من المضيف";
                abilityStatus.style.color = "#ff6b35";
              } else {
                abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها. سيتم إشعار المستضيف.";
                abilityStatus.style.color = "#32c675";
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling player notification:', error);
      }
    }
  });
  
  // Check periodically
  setInterval(checkBattleStatus, 2000);
  
  // Initialize BroadcastChannel if available
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      window.broadcastChannel = new BroadcastChannel('ability-updates');
      window.broadcastChannel.onmessage = function(event) {
        const notification = event.data;
        if (notification.type === 'ability_toggle' && notification.playerParam === playerParam) {
          console.log('BroadcastChannel notification received:', notification);
          
          // Update ability state immediately
          const abilityIndex = myAbilities.findIndex(ab => ab.text === notification.abilityText);
          if (abilityIndex !== -1) {
            myAbilities[abilityIndex].used = notification.isUsed;
            console.log(`Ability "${notification.abilityText}" set to used: ${notification.isUsed}`);
            
            // Re-render abilities
            if (abilitiesWrap) {
              renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
            }
            
            // Update status message
            if (abilityStatus) {
              if (notification.isUsed) {
                abilityStatus.textContent = "القدرة مستخدمة - انتظر إعادة التفعيل من المضيف";
                abilityStatus.style.color = "#ff6b35";
              } else {
                abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها. سيتم إشعار المستضيف.";
                abilityStatus.style.color = "#32c675";
              }
            }
          }
        }
      };
    }
  } catch (e) {
    console.log('BroadcastChannel not supported');
  }
  
  // Check for host notifications every 500ms
  setInterval(() => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('allPlayerNotifications') || '[]');
      const latestNotification = allNotifications[allNotifications.length - 1];
      
      if (latestNotification && 
          latestNotification.type === 'ability_toggle' && 
          latestNotification.playerParam === playerParam &&
          latestNotification.timestamp > (window.lastProcessedNotification || 0)) {
        
        console.log('Found new host notification:', latestNotification);
        window.lastProcessedNotification = latestNotification.timestamp;
        
        // Update ability state immediately
        const abilityIndex = myAbilities.findIndex(ab => ab.text === latestNotification.abilityText);
        if (abilityIndex !== -1) {
          myAbilities[abilityIndex].used = latestNotification.isUsed;
          console.log(`Ability "${latestNotification.abilityText}" set to used: ${latestNotification.isUsed}`);
          
          // Re-render abilities
          if (abilitiesWrap) {
            renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
          }
          
          // Update status message
          if (abilityStatus) {
            if (latestNotification.isUsed) {
              abilityStatus.textContent = "القدرة مستخدمة - انتظر إعادة التفعيل من المضيف";
              abilityStatus.style.color = "#ff6b35";
            } else {
              abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها. سيتم إشعار المستضيف.";
              abilityStatus.style.color = "#32c675";
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking host notifications:', error);
    }
  }, 500);
}

// Initialize battle status monitoring when page loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(startBattleStatusMonitoring, 1000);
  
  // Check for pending host notifications
  setTimeout(() => {
    try {
      const notification = JSON.parse(localStorage.getItem('playerNotification') || '{}');
      if (notification.type === 'ability_toggle' && notification.playerParam === playerParam) {
        console.log('Found pending host notification:', notification);
        
        // Update ability state immediately
        const abilityIndex = myAbilities.findIndex(ab => ab.text === notification.abilityText);
        if (abilityIndex !== -1) {
          myAbilities[abilityIndex].used = notification.isUsed;
          console.log(`Ability "${notification.abilityText}" set to used: ${notification.isUsed}`);
          
          // Re-render abilities
          if (abilitiesWrap) {
            renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
          }
          
          // Update status message
          if (abilityStatus) {
            if (notification.isUsed) {
              abilityStatus.textContent = "القدرة مستخدمة - انتظر إعادة التفعيل من المضيف";
              abilityStatus.style.color = "#ff6b35";
            } else {
              abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها. سيتم إشعار المستضيف.";
              abilityStatus.style.color = "#32c675";
            }
          }
        }
        
        // Clear the notification
        localStorage.removeItem('playerNotification');
      }
    } catch (error) {
      console.error('Error checking pending notifications:', error);
    }
  }, 500);
});

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
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      border: 2px solid #10B981;
      font-family: "Cairo", sans-serif;
      font-weight: 600;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Add type-specific styling
    if (type === 'success') {
      toast.style.borderColor = '#10B981';
    } else if (type === 'error') {
      toast.style.borderColor = '#EF4444';
    } else if (type === 'warning') {
      toast.style.borderColor = '#F59E0B';
    }
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
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

// Make functions available globally
window.submitPicks = submitPicks;
window.clearOldGameData = clearOldGameData;
window.clearUsedAbilities = clearUsedAbilities;
window.openBattleView = openBattleView;


