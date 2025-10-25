// Import Firebase GameService
import { GameService } from './gameService.js';
import { auth } from './firebase-init.js';
import syncService from './sync-service.js';

// ========== حماية من التداخل بين اللاعبين ==========
// تم إضافة حماية لمنع إعادة تعيين ترتيب اللاعب الآخر عند تأكيد ترتيب أحد اللاعبين
// كل لاعب يستخدم مفاتيح localStorage منفصلة: player1Order, player2Order
// ويستمع فقط للتغييرات الخاصة به في storage events


// ========== Extract Parameters ==========
const params = new URLSearchParams(window.location.search);
const gameId = params.get("gameId"); // يعمل للبطولة والتحدي
const player = params.get("player");
const isTournament = params.get("tournament") === "true"; // for backward compatibility
const matchId = params.get("matchId"); // for backward compatibility

// Define player parameter for abilities first
const playerParam = player === "2" ? "player2" : "player1";

// Initialize player name from multiple sources
let playerName = "اللاعب";
let currentPlayer = player === "2" ? 2 : 1;
let rounds = 11; // Default rounds

// ✅ أولوية عليا: قراءة من الرابط (URL parameters) أولاً - يحل مشكلة البيانات المختلفة
const nameFromUrl = params.get("name");
const roundsFromUrl = params.get("rounds");

if (nameFromUrl) {
  playerName = decodeURIComponent(nameFromUrl);
  console.log(`✅ Player name from URL: ${playerName}`);
}

if (roundsFromUrl) {
  rounds = parseInt(roundsFromUrl);
  console.log(`✅ Rounds from URL: ${rounds}`);
}

// Tournament mode setup - استخدم matchId لتحديد البيانات الصحيحة
if (isTournament) {
  console.log('🏆 Tournament mode detected');
  
  // إذا لم يكن الاسم من الرابط، حاول من localStorage
  if (!nameFromUrl) {
    const currentMatchPlayers = localStorage.getItem('currentMatchPlayers');
    if (currentMatchPlayers) {
      try {
        const players = JSON.parse(currentMatchPlayers);
        playerName = players[currentPlayer - 1];
        console.log(`Tournament player ${currentPlayer} from localStorage: ${playerName}`);
      } catch (e) {
        console.error('Error parsing currentMatchPlayers:', e);
      }
    }
  }
  
  // إذا لم تكن الجولات من الرابط، حاول من localStorage
  if (!roundsFromUrl) {
    const tournamentRounds = localStorage.getItem('tournamentRounds');
    if (tournamentRounds) {
      rounds = parseInt(tournamentRounds);
      console.log(`Tournament rounds from localStorage: ${rounds}`);
    }
  }
  
  // حفظ matchId للتعرف على المباراة
  if (matchId) {
    localStorage.setItem('currentMatchId', matchId);
    console.log(`✅ Match ID saved: ${matchId}`);
  }
}

// ⚠️ فقط كخيار احتياطي نهائي: محاولة القراءة من localStorage إذا لم يتم تعيين الاسم بعد
if (playerName === "اللاعب" && !isTournament) {
  try {
    // Try player1/player2 keys
    const storedName = localStorage.getItem(playerParam) || 
                       localStorage.getItem(player === "2" ? "player2" : "player1");
    if (storedName && storedName !== "اللاعب") {
      playerName = storedName;
      console.log(`Player name from localStorage fallback: ${playerName}`);
    }
    
    // Try gameSetupProgress
    if (!storedName || storedName === "اللاعب") {
      const gameSetup = localStorage.getItem('gameSetupProgress');
      if (gameSetup) {
        const setupData = JSON.parse(gameSetup);
        if (setupData[playerParam]?.name) {
          playerName = setupData[playerParam].name;
          console.log(`Player name from gameSetupProgress: ${playerName}`);
        }
      }
    }
  } catch (e) {
    console.error('Error loading player name:', e);
  }
}

console.log(`✅ Final player name: ${playerName} (${playerParam})`);

// ✅ تهيئة المزامنة مع Firebase (نظام موحد)
if (gameId) {
  syncService.initSync(gameId).then(success => {
    if (success) {
      console.log(`✅ Firebase sync initialized for gameId:`, gameId);
    } else {
      console.warn('⚠️ Firebase sync failed to initialize, using localStorage only');
    }
  });
} else {
  console.warn('⚠️ No gameId found, Firebase sync not initialized');
}

// Define storage keys - مفاتيح تخزين مستقلة لكل لاعب
const PICKS_LOCAL_KEY = `${playerParam}Picks`;
const ORDER_LOCAL_KEY = `${playerParam}Order`;
const GAME_SETUP_KEY = `${playerParam}_gameSetupProgress`;
const GAME_STATE_KEY = `${playerParam}_gameState`;
const CURRENT_GAME_ID_KEY = `${playerParam}_currentGameId`;
const STRATEGIC_GAME_ID_KEY = `${playerParam}_StrategicGameId`;
const LAST_LOAD_TIME_KEY = `${playerParam}_LastLoadTime`;
const LAST_SUBMIT_TIME_KEY = `${playerParam}_LastSubmitTime`;

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
let order = [];
let submittedOrder = null;
let opponentName = "الخصم";

// متغير لمنع التحديثات الخارجية أثناء الترتيب
let isArranging = true;

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
const processedRequests = new Set();  // ✅ تتبع الطلبات المعالجة لمنع التداخل

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
  
  // ✅ تحديث سلس بدون وميض
  const wasEmpty = container.children.length === 0;
  if (!wasEmpty) {
    container.style.transition = 'opacity 0.15s ease';
    container.style.opacity = '0.7';
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
    
    // ✅ إضافة transition للتغيير السلس
    el.style.transition = 'all 0.2s ease';
    
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
  
  // ✅ إعادة الشفافية بسرعة
  if (!wasEmpty) {
    setTimeout(() => {
      container.style.opacity = '1';
    }, 50);
  }
  
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
    const currentGameId = localStorage.getItem(CURRENT_GAME_ID_KEY);
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
    
    // ✅ حفظ gameId مع البطاقات والقدرات
    localStorage.setItem(CURRENT_GAME_ID_KEY, gameId);
    localStorage.setItem(PICKS_LOCAL_KEY, JSON.stringify(picks));
    
    // ✅ حفظ القدرات في localStorage للتحميل السريع في المستقبل
    const abilitiesKey = `${playerParam}Abilities`;
    localStorage.setItem(abilitiesKey, JSON.stringify(myAbilities));
    console.log(`✅ تم حفظ البطاقات والقدرات للعبة ${gameId}`, {
      cards: picks.length,
      abilities: myAbilities.length
    });
    
    // تحديث النص
    if (instruction) {
      instruction.textContent = `اللاعب ${playerName} رتب بطاقاتك`;
    }
    
    console.log('Loaded data:', { playerName, picks: picks.length, myAbilities: myAbilities.length, rounds });
    
    // عرض البيانات
    // ✅ التحقق من وجود ترتيب محفوظ مسبقاً
    const savedOrder = JSON.parse(localStorage.getItem(ORDER_LOCAL_KEY) || "[]");
    if (savedOrder && savedOrder.length === picks.length) {
      console.log("✅ تم العثور على ترتيب محفوظ - سيتم عرضه بدلاً من ترتيب Firebase");
      submittedOrder = savedOrder.slice();
      hideOpponentPanel();
      renderCards(submittedOrder, submittedOrder);
      return; // نوقف التحميل من Firebase هنا
    }

    renderCards(picks);
    renderAbilities(myAbilities);
    
    // الاستماع للتغييرات في الوقت الفعلي - فقط للاعب الحالي
    GameService.listenToGame(gameId, (updatedData) => {
      // تحقق من أن التحديث خاص باللاعب الحالي فقط
      const currentPlayerParam = playerParam;
      const updatedPlayerData = updatedData[`player${player}`];
      
      if (updatedPlayerData) {
        console.log(`🔄 تحديث Firebase للاعب ${currentPlayerParam} فقط`);
        updateGameData(updatedData);
      } else {
        console.log(`⚠️ تجاهل تحديث Firebase - ليس للاعب الحالي ${currentPlayerParam}`);
      }
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
  // 🧠 الحل النهائي المضمون: تجاهل التحديثات الخارجية أثناء الترتيب
  if (isArranging) {
    console.log("⏸ تجاهل تحديث Firebase أثناء ترتيب اللاعب - الحل النهائي المضمون");
    return;
  }
  
  // ✅ تحقق إضافي: تأكد من أن التحديث للعبة الحالية فقط
  const currentGameId = localStorage.getItem(CURRENT_GAME_ID_KEY);
  if (currentGameId && gameId && currentGameId !== gameId) {
    console.log(`⚠️ تجاهل تحديث Firebase - لعبة مختلفة (current: ${currentGameId}, update: ${gameId})`);
    return;
  }
  
  // تحقق من أن التحديث خاص باللاعب الحالي فقط
  const currentPlayerParam = playerParam;
  const playerData = gameData[`player${player}`];
  
  if (!playerData) {
    console.log(`⚠️ تجاهل تحديث Firebase - لا توجد بيانات للاعب ${currentPlayerParam}`);
    return;
  }
  
  console.log(`🔄 تحديث بيانات اللاعب ${currentPlayerParam} من Firebase`);
  
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
    
    // ✅ حفظ القدرات في localStorage
    const abilitiesKey = `${playerParam}Abilities`;
    localStorage.setItem(abilitiesKey, JSON.stringify(myAbilities));
    console.log(`✅ تم حفظ القدرات المحدثة في localStorage`, myAbilities.length);
    
    renderAbilities(myAbilities);
  }
  
  // تحديث البطاقات - فقط للاعب الحالي
  if (playerData.cards) {
    picks = playerData.cards;
    
    // التحقق من وجود ترتيب مرسل للعبة الحالية - فقط للاعب الحالي
    const savedOrder = JSON.parse(localStorage.getItem(ORDER_LOCAL_KEY) || "[]");
    const currentGameId = localStorage.getItem(CURRENT_GAME_ID_KEY);
    
    // تحقق إضافي للتأكد من أن التحديث خاص باللاعب الحالي
    if (currentGameId && gameId && currentGameId === gameId && 
        savedOrder && savedOrder.length === picks.length) {
      submittedOrder = savedOrder.slice();
      hideOpponentPanel();
      renderCards(submittedOrder, submittedOrder);
      console.log(`✅ تم الحفاظ على ترتيب اللاعب ${playerParam} عند تحديث البيانات`);
    } else {
      submittedOrder = null;
      renderCards(picks, null);
      loadOpponentAbilities();
      console.log(`🔄 تم تحديث البطاقات للاعب ${playerParam} بدون ترتيب محفوظ`);
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
    
    // ✅ نظام موحد: استخدم loadGameData للبطولة والتحدي
    if (gameId) {
      console.log(`🔄 Loading game data from Firebase for ${playerParam} (gameId: ${gameId})`);
      loadGameData(); // تحميل من Firebase دائماً
    } else {
      console.warn(`⚠️ No gameId found for ${playerParam}`);
      // fallback to localStorage
      loadPlayerCards();
    }
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

  if (isTournament) {
    console.log(`🔄 تحميل بطاقات البطولة للاعب ${playerParam}`);
    loadTournamentCards();
    return;
  }

  console.log(`🔄 تحميل بطاقات اللاعب ${playerParam} للعبة ${gameId}`);

  // حماية إضافية: تحقق من أن هذا اللاعب لم يتم تحميله بالفعل
  const lastLoadTime = localStorage.getItem(LAST_LOAD_TIME_KEY);
  const currentTime = Date.now();
  if (lastLoadTime && (currentTime - parseInt(lastLoadTime)) < 1000) {
    console.log(`⚠️ تجاهل تحميل متكرر للاعب ${playerParam} - تم التحميل مؤخراً`);
    return;
  }
  localStorage.setItem(LAST_LOAD_TIME_KEY, currentTime.toString());

  // ✅ التحقق من gameId قبل تحميل البطاقات من localStorage
  const currentGameId = localStorage.getItem(CURRENT_GAME_ID_KEY);
  
  // إذا كانت اللعبة مختلفة، احذف البيانات القديمة واستخدم Firebase
  if (currentGameId && currentGameId !== gameId) {
    console.log(`🧹 لعبة جديدة - حذف البطاقات القديمة للاعب ${playerParam}`);
    clearOldGameData();
    
    // تحميل من Firebase للعبة الجديدة
    loadGameData();
    return;
  }
  
  // Try to load from localStorage first (only if same game)
  const localPicks = JSON.parse(localStorage.getItem(PICKS_LOCAL_KEY) || "[]");
  picks = Array.isArray(localPicks) ? localPicks : [];

  // Get rounds from game setup and limit cards accordingly
  const gameSetup = localStorage.getItem(GAME_SETUP_KEY);
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

  // Check if we have a submitted order for the CURRENT game - فقط للاعب الحالي
  const savedOrder = JSON.parse(localStorage.getItem(ORDER_LOCAL_KEY) || "[]");
  
  // Also check for StrategicOrdered format (for compatibility with card.js)
  const strategicOrder = JSON.parse(localStorage.getItem(`${playerParam}StrategicOrdered`) || "[]");
  
  // Use the most recent order available - فقط للاعب الحالي مع تحقق إضافي
  let orderToUse = null;
  if (currentGameId && gameId && currentGameId === gameId && 
      Array.isArray(savedOrder) && savedOrder.length === picks.length) {
    orderToUse = savedOrder;
    console.log(`✅ تم العثور على ترتيب محفوظ للاعب ${playerParam}:`, orderToUse.length, 'بطاقة');
  } else if (Array.isArray(strategicOrder) && strategicOrder.length === picks.length) {
    // تحقق إضافي للتأكد من أن الترتيب الاستراتيجي للعبة الحالية
    const strategicGameId = localStorage.getItem(STRATEGIC_GAME_ID_KEY);
    if (!strategicGameId || strategicGameId === gameId) {
      orderToUse = strategicOrder;
      console.log(`✅ تم العثور على ترتيب استراتيجي للاعب ${playerParam}:`, orderToUse.length, 'بطاقة');
    } else {
      console.log(`⚠️ تجاهل الترتيب الاستراتيجي - ليس للعبة الحالية (${strategicGameId} != ${gameId})`);
    }
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
      localStorage.removeItem(`${playerParam}StrategicOrdered`);
      console.log(`🧹 تم مسح الترتيب القديم للاعب ${playerParam} - لعبة مختلفة`);
    }
  }

  if (!picks.length) {
    grid.innerHTML = `<p class="text-red-500 text-lg">لم يتم العثور على بطاقات لهذا اللاعب.</p>`;
    return;
  }
  
  // ✅ حفظ gameId الحالي للتأكد من تطابقه في المستقبل
  if (gameId) {
    localStorage.setItem(CURRENT_GAME_ID_KEY, gameId);
    console.log(`✅ تم تأكيد gameId: ${gameId} للاعب ${playerParam}`);
  }

  if (submittedOrder && submittedOrder.length === picks.length) {
    hideOpponentPanel();
    console.log('Rendering submitted order on load:', submittedOrder);
    console.log('Picks on load:', picks);
    console.log('Submitted order length:', submittedOrder.length);
    console.log('Picks length:', picks.length);
    
    // إضافة تأثير انتقال سلس لتقليل الوميض
    if (grid) {
      grid.style.transition = 'opacity 0.3s ease';
      grid.style.opacity = '0.7';
    }
    
    renderCards(submittedOrder, submittedOrder);
    
    // إعادة تعيين الشفافية بعد الانتهاء
    setTimeout(() => {
      if (grid) {
        grid.style.opacity = '1';
      }
    }, 100);
    
    // تحديث حالة الزر عند وجود ترتيب مرسل
    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.textContent = '✅ تم إرسال الترتيب';
    }
  } else {
    // Ensure picks is valid before rendering
    if (Array.isArray(picks) && picks.length > 0) {
      // إضافة تأثير انتقال سلس لتقليل الوميض
      if (grid) {
        grid.style.transition = 'opacity 0.3s ease';
        grid.style.opacity = '0.7';
      }
      
      renderCards(picks, null);
      
      // إعادة تعيين الشفافية بعد الانتهاء
      setTimeout(() => {
        if (grid) {
          grid.style.opacity = '1';
        }
      }, 100);
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

// ✅ إزالة القدرات الافتراضية - تحميل القدرات الحقيقية فقط من localStorage/Firebase
if (abilityStatus) {
  abilityStatus.textContent = "جاري تحميل القدرات...";
}

// ✅ لا توجد قدرات افتراضية - سيتم التحميل من loadPlayerAbilities() فقط
myAbilities = [];
console.log('✅ No default abilities - Will load real abilities from localStorage/Firebase');

// Request abilities from server (if using socket)
if (socket) {
  socket.emit("requestAbilities", { gameID, playerName });
  console.log('Requested abilities from server');
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

async function requestUseAbility(abilityText) {
  console.log('🎯 Requesting ability:', abilityText);
  
  // ✅ التحقق من وجود طلب pending بالفعل لهذه القدرة
  try {
    const existingRequests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    const hasPendingRequest = existingRequests.some(req => 
      req.playerParam === playerParam && 
      req.abilityText === abilityText && 
      req.status === 'pending'
    );
    
    if (hasPendingRequest) {
      console.log('⚠️ طلب موجود بالفعل لهذه القدرة - تجاهل الطلب المكرر');
      if (abilityStatus) {
        abilityStatus.textContent = "⏳ الطلب قيد المراجعة بالفعل...";
        abilityStatus.style.color = "#f59e0b";
      }
      return;
    }
  } catch (e) {
    console.error('Error checking existing requests:', e);
  }
  
  if (abilityStatus) {
    abilityStatus.textContent = "⏳ تم إرسال طلب استخدام القدرة…";
  }
  const requestId = `${playerParam}_${abilityText}_${Date.now()}`;
  tempUsed.add(abilityText);
  pendingRequests.set(requestId, abilityText);
  myAbilities = (myAbilities || []).map(a => a.text === abilityText ? { ...a, used: true } : a);
  if (abilitiesWrap) {
    renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
  }
  
  // Create request object
  const newRequest = {
    id: requestId,
    requestId: requestId,
    playerParam: playerParam,
    playerName: playerName,
    abilityText: abilityText,
    status: 'pending',
    timestamp: Date.now()
  };
  
  console.log('✅ إنشاء طلب جديد:', requestId);
  
  // ✅ PRIMARY: إضافة إلى Firebase (يعمل عبر جميع الأجهزة)
  try {
    if (syncService.isReady()) {
      const result = await syncService.addAbilityRequest(newRequest);
      if (result) {
        console.log('✅ Ability request added to Firebase (cross-device):', result);
        
        if (abilityStatus) {
          abilityStatus.textContent = "⏳ في انتظار موافقة المستضيف...";
          abilityStatus.style.color = "#f59e0b";
        }
        
        return; // نجح Firebase، لا حاجة للمتابعة
      }
    }
  } catch (error) {
    console.error('⚠️ Firebase error, falling back to localStorage:', error);
  }
  
  // ✅ FALLBACK: localStorage (للتوافق مع الأنظمة القديمة أو إذا فشل Firebase)
  try {
    const abilityRequests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
    
    // Check if request already exists
    const existingIndex = abilityRequests.findIndex(req => 
      req.playerParam === playerParam && req.abilityText === abilityText && req.status === 'pending'
    );
    
    if (existingIndex === -1) {
      // Add new request
      abilityRequests.push(newRequest);
      localStorage.setItem('abilityRequests', JSON.stringify(abilityRequests));
      
      console.log('✅ Ability request added to localStorage (fallback):', newRequest);
      
      // Trigger events
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'abilityRequests',
        newValue: localStorage.getItem('abilityRequests'),
        oldValue: localStorage.getItem('abilityRequests'),
        storageArea: localStorage
      }));
      
      window.dispatchEvent(new CustomEvent('abilityRequestAdded', {
        detail: newRequest
      }));
      
      if (abilityStatus) {
        abilityStatus.textContent = "⏳ في انتظار موافقة المستضيف...";
        abilityStatus.style.color = "#f59e0b";
      }
      
    } else {
      console.log('⚠️ Request already exists for this ability');
      if (abilityStatus) {
        abilityStatus.textContent = "⏳ الطلب قيد المراجعة بالفعل...";
      }
    }
    
  } catch (error) {
    console.error('❌ Error adding ability request:', error);
    
    // Reset the ability state if everything fails
    tempUsed.delete(abilityText);
    pendingRequests.delete(requestId);
    myAbilities = (myAbilities || []).map(a => a.text === abilityText ? { ...a, used: false } : a);
    if (abilitiesWrap) {
      renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
    }
    if (abilityStatus) {
      abilityStatus.textContent = "❌ تعذر إرسال الطلب. حاول مرة أخرى.";
      abilityStatus.style.color = "#dc2626";
    }
  }
  
  // ⚠️ ALSO send via socket if available (TERTIARY METHOD for backward compatibility)
  if (socket) {
    socket.emit("requestUseAbility", { gameID, playerName, abilityText, requestId });
    console.log('📡 Ability request sent via socket (backup):', { gameID, playerName, abilityText, requestId });
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
          console.log('✅ Found abilities in gameSetupProgress:', playerData.abilities);
          myAbilities = normalizeAbilityList(playerData.abilities);
          
          // ✅ حفظ القدرات في localStorage للتحميل السريع في المستقبل
          const abilitiesKey = `${playerParam}Abilities`;
          localStorage.setItem(abilitiesKey, JSON.stringify(myAbilities));
          console.log(`✅ تم حفظ القدرات من gameSetupProgress في localStorage`, myAbilities.length);
          
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
    
    // ✅ لا توجد قدرات محفوظة - رسالة واضحة للمستخدم
    console.warn('⚠️ No abilities found in localStorage or gameSetupProgress');
    if (abilityStatus) {
      abilityStatus.textContent = "⏳ في انتظار تحميل القدرات من المستضيف...";
      abilityStatus.style.color = "#f59e0b";
    }
    
    // ✅ مسح العرض إذا لم توجد قدرات
    if (abilitiesWrap) {
      abilitiesWrap.innerHTML = '<p style="color: #9ca3af; font-size: 0.875rem;">لا توجد قدرات متاحة بعد</p>';
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

// ✅ تنظيف الطلبات القديمة عند بدء الصفحة (مهم للهواتف)
try {
  const requests = JSON.parse(localStorage.getItem('abilityRequests') || '[]');
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  const cleanRequests = requests.filter(req => {
    // حذف الطلبات القديمة جداً أو التي بحالة pending لأكثر من 5 دقائق
    if (!req.timestamp || req.timestamp < fiveMinutesAgo) {
      if (req.status === 'pending' || !req.status) {
        console.log(`🧹 حذف طلب قديم عند بدء الصفحة: ${req.abilityText}`);
        return false;
      }
    }
    return true;
  });
  
  if (cleanRequests.length !== requests.length) {
    localStorage.setItem('abilityRequests', JSON.stringify(cleanRequests));
    console.log(`✅ تم تنظيف ${requests.length - cleanRequests.length} طلب قديم`);
  }
} catch (e) {
  console.error('Error cleaning old requests:', e);
}

// ✅ تحميل فوري للقدرات عند بدء الصفحة (بدون قدرات افتراضية)
console.log('🔄 Initial abilities load...');

// تحميل فوري
loadPlayerAbilities();
loadOpponentAbilities();

// تحميل إضافي بعد تأخير قصير لضمان جاهزية DOM
setTimeout(() => {
  console.log('🔄 Secondary abilities load (after delay)...');
  loadPlayerAbilities();
  loadOpponentAbilities();
}, 200);

// ✅ نظام مراقبة سريع للقدرات (كل 300ms للتزامن الفوري)
let lastAbilitiesUpdateTime = localStorage.getItem('abilitiesLastUpdate') || '0';

// ✅ BroadcastChannel للتواصل الفوري (ممتاز للهواتف)
try {
  if (typeof BroadcastChannel !== 'undefined') {
    const abilityChannel = new BroadcastChannel('ability-updates');
    
    abilityChannel.onmessage = function(event) {
      console.log('📡 BroadcastChannel message received in player-cards:', event.data);
      
      if (event.data.type === 'ABILITY_UPDATED') {
        console.log('⚡ Ability update via BroadcastChannel - Refreshing immediately...');
        
        // ✅ تحميل فوري للقدرات
        loadPlayerAbilities();
        loadOpponentAbilities();
        
        // ✅ تحديث إشارة التحديث المحلية
        lastAbilitiesUpdateTime = event.data.timestamp || Date.now().toString();
      }
    };
    
    console.log('✅ BroadcastChannel initialized for player-cards page');
  }
} catch (e) {
  console.log('⚠️ BroadcastChannel not supported, using polling only');
}

setInterval(() => {
  // ✅ فحص إشارة التحديث أولاً (أسرع طريقة)
  const currentUpdateTime = localStorage.getItem('abilitiesLastUpdate') || '0';
  if (currentUpdateTime !== lastAbilitiesUpdateTime) {
    console.log('✅ Abilities update signal detected - Immediate refresh...');
    loadPlayerAbilities();
    loadOpponentAbilities();
    lastAbilitiesUpdateTime = currentUpdateTime;
  }
  
  // فحص طلبات القدرات
  checkAbilityRequests();
}, 300); // ✅ التحقق كل 300ms للتزامن فائق السرعة

// ✅ تنظيف دوري للطلبات المعالجة من الذاكرة (كل 5 دقائق)
setInterval(() => {
  if (processedRequests.size > 50) {
    console.log(`🧹 تنظيف الطلبات المعالجة من الذاكرة (${processedRequests.size} طلبات)`);
    processedRequests.clear();
  }
}, 5 * 60 * 1000);

// Simple storage change listener like order.js
window.addEventListener('storage', function(e) {
  // ✅ استماع لإشارة التحديث الصريحة (أسرع طريقة)
  if (e.key === 'abilitiesLastUpdate') {
    console.log('⚡ Immediate abilities update signal received!');
    lastAbilitiesUpdateTime = e.newValue || '0';
    loadPlayerAbilities();
    loadOpponentAbilities();
    return; // تم المعالجة، لا حاجة للمتابعة
  }
  
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
    console.log(`🔔 Ability toggled event: ${abilityText} for ${changedPlayerParam}, isUsed: ${isUsed}`);

    if (changedPlayerParam === playerParam) {
      console.log('✅ This is for current player - Applying immediate update...');
      
      // ✅ مزامنة فورية
      forceImmediateAbilitySync(changedPlayerParam, abilityText, isUsed);
      
      // Also update myAbilities directly
      const abilityIndex = myAbilities.findIndex(ab => ab.text === abilityText);
      if (abilityIndex !== -1) {
        myAbilities[abilityIndex].used = isUsed;
        console.log(`✅ Ability "${abilityText}" set to used: ${isUsed}`);
        
        // ✅ تحديث فوري في localStorage
        const abilitiesKey = `${playerParam}Abilities`;
        const savedAbilities = JSON.parse(localStorage.getItem(abilitiesKey) || '[]');
        savedAbilities.forEach(ability => {
          const text = typeof ability === 'string' ? ability : ability.text;
          if (text === abilityText && typeof ability === 'object') {
            ability.used = isUsed;
          }
        });
        localStorage.setItem(abilitiesKey, JSON.stringify(savedAbilities));
        
        // Re-render abilities with visual feedback
        if (abilitiesWrap) {
          abilitiesWrap.style.transition = 'transform 0.2s ease';
          abilitiesWrap.style.transform = 'scale(0.98)';
          
          renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
          
          setTimeout(() => {
            abilitiesWrap.style.transform = 'scale(1)';
          }, 100);
        }
        
        // Update status message with visual feedback
        if (abilityStatus) {
          if (isUsed) {
            abilityStatus.textContent = "❌ القدرة مستخدمة - انتظر إعادة التفعيل";
            abilityStatus.style.color = "#ff6b35";
          } else {
            abilityStatus.textContent = "✅ تم إعادة تفعيل القدرة - يمكنك استخدامها الآن!";
            abilityStatus.style.color = "#32c675";
            
            // إعادة النص الأصلي بعد 3 ثواني
            setTimeout(() => {
              if (abilityStatus) {
                abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها.";
              }
            }, 3000);
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
      console.log(`📬 PostMessage: Ability toggled: ${abilityText} for ${changedPlayerParam}, isUsed: ${isUsed}`);
      
      // Check if this change affects the current player
      if (changedPlayerParam === playerParam) {
        console.log(`✅ Updating abilities for current player: ${playerParam}`);
        
        // Update myAbilities
        if (myAbilities) {
          myAbilities.forEach(ability => {
            if (ability.text === abilityText) {
              ability.used = isUsed;
            }
          });
        }
        
        // ✅ تحديث فوري في localStorage
        const abilitiesKey = `${playerParam}Abilities`;
        const savedAbilities = JSON.parse(localStorage.getItem(abilitiesKey) || '[]');
        savedAbilities.forEach(ability => {
          const text = typeof ability === 'string' ? ability : ability.text;
          if (text === abilityText && typeof ability === 'object') {
            ability.used = isUsed;
          }
        });
        localStorage.setItem(abilitiesKey, JSON.stringify(savedAbilities));
        
        // Update tempUsed
        if (isUsed) {
          tempUsed.add(abilityText);
        } else {
          tempUsed.delete(abilityText);
        }
        
        // ✅ تحديث بصري فوري مع تأثير
        if (abilitiesWrap) {
          abilitiesWrap.style.transition = 'transform 0.2s ease';
          abilitiesWrap.style.transform = 'scale(0.98)';
          
          renderBadges(abilitiesWrap, myAbilities, { clickable: true, onClick: requestUseAbility });
          
          setTimeout(() => {
            abilitiesWrap.style.transform = 'scale(1)';
          }, 100);
        }
        
        console.log(`✅ Abilities updated visually for ${playerParam}`);
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
    
    // ✅ حذف الطلبات القديمة جداً (أكثر من ساعة)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const freshRequests = requests.filter(req => {
      if (req.timestamp && req.timestamp < oneHourAgo) {
        console.log(`🧹 تنظيف طلب قديم: ${req.abilityText} (${new Date(req.timestamp).toLocaleString()})`);
        return false;
      }
      return true;
    });
    
    // حفظ الطلبات النظيفة
    if (freshRequests.length !== requests.length) {
      localStorage.setItem('abilityRequests', JSON.stringify(freshRequests));
    }
    
    // فقط طلبات اللاعب الحالي
    const myRequests = freshRequests.filter(req => req.playerParam === playerParam);
    
    if (myRequests.length === 0) {
      // No pending requests, reset status
      if (abilityStatus && !myAbilities.some(a => a.used)) {
        abilityStatus.textContent = "اضغط على القدرة لطلب استخدامها.";
      }
      return;
    }
    
    myRequests.forEach(request => {
      // ✅ تجاهل الطلبات المعالجة سابقاً
      if (processedRequests.has(request.id)) {
        console.log(`⚠️ تجاهل طلب معالج بالفعل: ${request.id}`);
        
        // حذف من localStorage أيضاً
        const updatedRequests = freshRequests.filter(req => req.id !== request.id);
        localStorage.setItem('abilityRequests', JSON.stringify(updatedRequests));
        return;
      }
      
      if (request.status === 'approved') {
        // ✅ تسجيل الطلب كمعالج
        processedRequests.add(request.id);
        console.log(`✅ معالجة طلب موافق: ${request.id} - ${request.abilityText}`);
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
        
        // ✅ حذف الطلب فوراً من localStorage
        const updatedRequests = freshRequests.filter(req => req.id !== request.id);
        localStorage.setItem('abilityRequests', JSON.stringify(updatedRequests));
        
        console.log(`✅ تم حذف الطلب الموافق من localStorage: ${request.abilityText}`);
        
      } else if (request.status === 'rejected') {
        // ✅ تسجيل الطلب كمعالج
        processedRequests.add(request.id);
        console.log(`❌ معالجة طلب مرفوض: ${request.id} - ${request.abilityText}`);
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
        
        // ✅ حذف الطلب فوراً من localStorage
        const updatedRequests = freshRequests.filter(req => req.id !== request.id);
        localStorage.setItem('abilityRequests', JSON.stringify(updatedRequests));
        
        console.log(`✅ تم حذف الطلب المرفوض من localStorage: ${request.abilityText}`);
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
  // حفظ القيمة الحالية قبل التعديل
  const oldValue = select.value;
  
  // إضافة تأثير انتقال سلس لتقليل الوميض
  select.style.transition = 'opacity 0.1s ease';
  select.style.opacity = '0.8';
  
  // مسح المحتوى الحالي
  select.innerHTML = "";
  
  // إضافة الخيار الافتراضي
  const def = document.createElement("option"); 
  def.value = ""; 
  def.textContent = "-- الترتيب --"; 
  select.appendChild(def);
  
  // إضافة الخيارات المتاحة
  for (let i = 1; i <= N; i++) {
    if (!forbiddenSet.has(String(i)) || String(i) === String(currentValue)) {
      const opt = document.createElement("option");
      opt.value = i; 
      opt.textContent = i; 
      select.appendChild(opt);
    }
  }
  
  // استعادة القيمة إذا كانت متاحة
  if (currentValue && Array.from(select.options).some(o => o.value === String(currentValue))) {
    select.value = String(currentValue);
  } else if (oldValue && Array.from(select.options).some(o => o.value === oldValue)) {
    select.value = oldValue;
  } else {
    select.value = "";
  }
  
  // إعادة تعيين الشفافية بعد الانتهاء
  setTimeout(() => {
    select.style.opacity = '1';
  }, 50);
}

function snapshotChosen(selects) {
  const values = selects.map(s => s.value || "");
  const chosenSet = new Set(values.filter(Boolean));
  return { chosenSet, values };
}

function refreshAllSelects(selects, N) {
  // إضافة تأثير انتقال سلس لتقليل الوميض
  selects.forEach(select => {
    select.style.transition = 'opacity 0.1s ease';
    select.style.opacity = '0.8';
  });
  
  const { chosenSet, values } = snapshotChosen(selects);
  selects.forEach((sel, idx) => buildOptions(sel, N, chosenSet, values[idx]));
  const allChosen = values.filter(Boolean).length === N && chosenSet.size === N;
  
  // إعادة تعيين الشفافية بعد الانتهاء
  setTimeout(() => {
    selects.forEach(select => {
      select.style.opacity = '1';
    });
  }, 50);
  
  if (continueBtn) {
    continueBtn.classList.toggle("hidden", !allChosen);
    continueBtn.disabled = !allChosen;
  }
}

function renderCards(pickList, lockedOrder = null) {
  if (!grid) return;
  
  // إضافة تأثير انتقال سلس لتقليل الوميض
  grid.style.opacity = '0.7';
  grid.style.transition = 'opacity 0.2s ease';
  
  // مسح المحتوى الحالي
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

  // إعادة تعيين الشفافية بعد الانتهاء
  setTimeout(() => {
    grid.style.opacity = '1';
  }, 50);

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
    console.log(`⚠️ اللاعب ${playerParam} حاول إرسال ترتيب مرسل بالفعل`);
    return;
  }

  // Tournament mode - skip authentication
  if (isTournament) {
    console.log('Tournament mode - submitting picks without authentication');
    await submitTournamentPicks();
    return;
  }

  // Regular challenge mode - require authentication
  const user = auth.currentUser;
  if (!user) {
    alert("الرجاء تسجيل الدخول أولاً");
    return;
  }

  // حماية إضافية: تحقق من أن هذا اللاعب لم يرسل الترتيب مؤخراً
  const lastSubmitTime = localStorage.getItem(LAST_SUBMIT_TIME_KEY);
  const currentTime = Date.now();
  if (lastSubmitTime && (currentTime - parseInt(lastSubmitTime)) < 2000) {
    console.log(`⚠️ تجاهل إرسال متكرر للاعب ${playerParam} - تم الإرسال مؤخراً`);
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
    
    // Store submitted order in localStorage (following order.js pattern) - فقط للاعب الحالي
    console.log(`💾 حفظ ترتيب اللاعب ${playerParam} في localStorage`);
    localStorage.setItem(ORDER_LOCAL_KEY, JSON.stringify(ordered));
    
    // Store card arrangement for final-setup.html to detect (following order.js pattern)
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    localStorage.setItem(`${playerKey}CardArrangement`, JSON.stringify(ordered));
    localStorage.setItem(`${playerKey}ArrangementCompleted`, 'true');
    
    // Also store in the format expected by final-setup.html - فقط للاعب الحالي
    const currentGameSetup = JSON.parse(localStorage.getItem(GAME_SETUP_KEY) || '{}');
    const updatedGameSetup = {
      ...currentGameSetup,
      [playerKey]: {
        ...currentGameSetup[playerKey],
        selectedCards: ordered,
        arrangementCompleted: true
      }
    };
    // تحديث فقط بيانات اللاعب الحالي دون التأثير على اللاعب الآخر
    localStorage.setItem(GAME_SETUP_KEY, JSON.stringify(updatedGameSetup));
    
    // Store in gameState format as well
    const currentGameState = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}');
    const updatedGameState = {
      ...currentGameState,
      [playerKey]: {
        ...currentGameState[playerKey],
        selectedCards: ordered,
        arrangementCompleted: true
      }
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(updatedGameState));
    
    // Store in StrategicOrdered format (for compatibility with card.js)
    localStorage.setItem(`${playerParam}StrategicOrdered`, JSON.stringify(ordered));
    localStorage.setItem(STRATEGIC_GAME_ID_KEY, gameId || 'default');
    localStorage.setItem(LAST_SUBMIT_TIME_KEY, Date.now().toString());
    
    // Dispatch custom event for host to listen (following order.js pattern)
    window.dispatchEvent(new CustomEvent('orderSubmitted', { 
      detail: { gameId, playerName, ordered } 
    }));
    
    // Save to Firebase if gameId is available
    if (gameId) {
      try {
        await GameService.saveCardOrder(gameId, player, ordered);
        localStorage.setItem(CURRENT_GAME_ID_KEY, gameId);
      } catch (e) {
        console.warn('Firebase save failed, but localStorage saved:', e);
      }
    }
    
    // Update submittedOrder immediately (like order.js) - فقط للاعب الحالي
    submittedOrder = ordered.slice();
    
    hideOpponentPanel();
    
    // Re-render cards immediately with submitted order (like order.js)
    // Ensure the order is displayed correctly
    console.log(`🎯 عرض ترتيب اللاعب ${playerParam}:`, submittedOrder);
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
    
    // 🧠 الحل النهائي المضمون: إعادة تعيين isArranging بعد إرسال الترتيب
    isArranging = false;
    console.log("✅ تم إرسال الترتيب - السماح بالتحديثات الخارجية مرة أخرى");
    
  } catch (error) {
    console.error('Error saving card order:', error);
    alert('حدث خطأ في حفظ ترتيب البطاقات: ' + error.message);
    
    // 🧠 الحل النهائي المضمون: إعادة تعيين isArranging في حالة الخطأ أيضاً
    isArranging = false;
    console.log("❌ حدث خطأ - السماح بالتحديثات الخارجية مرة أخرى");
    
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

// Function to reset arrangement (for new games) - فقط للاعب الحالي
window.resetArrangement = function() {
  console.log(`🔄 إعادة تعيين ترتيب اللاعب ${playerParam} فقط`);
  
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
  
  // 🧠 الحل النهائي المضمون: إعادة تعيين isArranging عند إعادة تعيين الترتيب
  isArranging = true;
  console.log("🔄 إعادة تعيين isArranging = true للعبة جديدة");
  
  // Clear localStorage - فقط للاعب الحالي
  localStorage.removeItem(ORDER_LOCAL_KEY);
  localStorage.removeItem(`${playerParam}StrategicOrdered`);
  localStorage.removeItem(STRATEGIC_GAME_ID_KEY);
  localStorage.removeItem(`${playerParam}CardArrangement`);
  localStorage.removeItem(`${playerParam}ArrangementCompleted`);
  
  console.log(`✅ تم إعادة تعيين ترتيب اللاعب ${playerParam} فقط`);
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
    // Clear old card orders - فقط للاعب الحالي
    localStorage.removeItem(ORDER_LOCAL_KEY);
    localStorage.removeItem(`${playerParam}StrategicOrdered`);
    localStorage.removeItem(STRATEGIC_GAME_ID_KEY);
    localStorage.removeItem(LAST_LOAD_TIME_KEY);
    localStorage.removeItem(LAST_SUBMIT_TIME_KEY);
    
    // Clear old game ID
    localStorage.removeItem(CURRENT_GAME_ID_KEY);
    
    // Reset submitted order
    submittedOrder = null;
    
    // 🧠 الحل النهائي المضمون: إعادة تعيين isArranging عند مسح البيانات القديمة
    isArranging = true;
    console.log("🔄 إعادة تعيين isArranging = true عند مسح البيانات القديمة");
    
    console.log(`🧹 تم مسح البيانات القديمة للاعب ${playerParam}`);
  } catch (error) {
    console.error('Error clearing old game data:', error);
  }
}

// ✅ معالج visibilitychange لإعادة التحميل عند العودة للصفحة (مهم للهواتف)
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    console.log('📱 الصفحة ظاهرة مرة أخرى - إعادة تحميل القدرات (للهواتف)');
    
    // ✅ تحميل فوري للقدرات
    setTimeout(() => {
      loadPlayerAbilities();
      loadOpponentAbilities();
      checkAbilityRequests();
    }, 100);
    
    // ✅ تحميل إضافي بعد ثانية
    setTimeout(() => {
      loadPlayerAbilities();
      loadOpponentAbilities();
      checkAbilityRequests();
    }, 1000);
  }
});

// Initialize card manager when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Show home button in tournament mode
  const isTournament = localStorage.getItem('currentMatchId') !== null;
  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn && isTournament) {
    homeBtn.style.display = 'flex';
  }
  
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

// ✅ مزامنة فورية لتغييرات ترتيب البطاقات والاختيارات - فقط للاعب الحالي
window.addEventListener('storage', function(e) {
  try {
    // فقط استمع للتغييرات الخاصة باللاعب الحالي
    if (e.key === ORDER_LOCAL_KEY || e.key === PICKS_LOCAL_KEY) {
      console.log(`🔄 فوراً: تغيير في ${e.key} للاعب الحالي ${playerParam}, إعادة تحميل البطاقات`);
      
      // تحقق إضافي للتأكد من أن التغيير خاص باللاعب الحالي
      const currentGameId = localStorage.getItem(CURRENT_GAME_ID_KEY);
      if (currentGameId && gameId && currentGameId === gameId) {
        // تأخير صغير لتجنب التداخل
        setTimeout(() => {
          loadPlayerCards();
        }, 100);
      } else {
        console.log(`⚠️ تجاهل التغيير في ${e.key} - ليس للعبة الحالية`);
      }
    }
    
    // تجاهل أي تغييرات أخرى في localStorage - حماية شاملة
    if (e.key && (e.key.includes('StrategicOrdered') || e.key.includes('CardArrangement') || e.key.includes('ArrangementCompleted'))) {
      // تحقق من أن التغيير ليس للاعب الحالي
      if (!e.key.includes(playerParam)) {
        console.log(`🚫 تجاهل التغيير في ${e.key} - ليس للاعب الحالي ${playerParam}`);
        return;
      }
    }
    
    // تجاهل أي تغييرات في مفاتيح اللاعب الآخر
    const otherPlayerParam = playerParam === 'player1' ? 'player2' : 'player1';
    if (e.key && e.key.includes(otherPlayerParam)) {
      console.log(`🚫 تجاهل التغيير في ${e.key} - للاعب الآخر ${otherPlayerParam}`);
      return;
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

// ✅ Tournament mode card loading - نفس نظام التحدي تماماً
async function loadTournamentCards() {
  console.log('🏆 Loading tournament cards from Firebase (Challenge Mode Style)...');
  
  // ✅ تحميل البيانات من Firebase مثل طور التحدي تماماً
  if (gameId) {
    console.log('📡 Loading tournament data from Firebase:', gameId);
    await loadGameData();
    return;
  }
  
  // إذا لم يكن هناك gameId، حاول من localStorage
  console.warn('⚠️ No gameId found, trying localStorage...');
  const picksKey = `${playerParam}StrategicPicks`;
  const localPicks = JSON.parse(localStorage.getItem(picksKey) || "[]");
  picks = Array.isArray(localPicks) ? localPicks : [];
  
  if (picks.length === 0) {
    console.error('❌ No tournament picks found!');
    if (instruction) {
      instruction.innerText = 'لم يتم العثور على البطاقات. يرجى نسخ الرابط من جديد.';
    }
    if (grid) {
      grid.innerHTML = '<div style="color:#fff;padding:20px;text-align:center;">لم يتم العثور على البطاقات<br><small>يرجى الرجوع والحصول على رابط جديد</small></div>';
    }
    return;
  }
  
  // Limit to tournament rounds
  if (picks.length > rounds) {
    picks = picks.slice(0, rounds);
    console.log(`Limited to ${rounds} cards for tournament rounds`);
  }
  
  // Check if we have a submitted order for the CURRENT tournament - نفس النظام
  const savedOrder = JSON.parse(localStorage.getItem(ORDER_LOCAL_KEY) || "[]");
  const strategicOrder = JSON.parse(localStorage.getItem(`${playerParam}StrategicOrdered`) || "[]");
  
  // Use the most recent order available
  let orderToUse = null;
  if (Array.isArray(savedOrder) && savedOrder.length === picks.length) {
    orderToUse = savedOrder;
    console.log(`✅ Found saved order for tournament ${playerParam}:`, orderToUse.length, 'cards');
  } else if (Array.isArray(strategicOrder) && strategicOrder.length === picks.length) {
    orderToUse = strategicOrder;
    console.log(`✅ Found strategic order for tournament ${playerParam}:`, orderToUse.length, 'cards');
  }
  
  if (orderToUse) {
    submittedOrder = orderToUse.slice();
    picks = orderToUse.slice(); // Update picks to match the ordered arrangement
    console.log('Loaded existing tournament order:', submittedOrder);
    hideOpponentPanel();
    renderCards(submittedOrder, submittedOrder);
    
    // Update button state
    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.textContent = '✅ تم إرسال الترتيب';
    }
  } else {
    submittedOrder = null;
    renderCards(picks, null);
    loadOpponentAbilities();
    
    // Reset button state
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.textContent = 'متابعة';
    }
  }
  
  // Update instruction
  if (instruction) {
    instruction.innerText = `${playerName} رتب بطاقاتك (${rounds} جولة)`;
  }
  
  // Load player abilities
  loadPlayerAbilities();
  
  // Show tournament indicator
  showTournamentIndicator();
}

function showTournamentIndicator() {
  const header = document.querySelector('.game-header');
  if (header && !document.getElementById('tournament-indicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'tournament-indicator';
    indicator.style.cssText = `
      font-size: 48px;
      text-align: center;
      margin-bottom: 10px;
      filter: drop-shadow(0 2px 8px rgba(255, 152, 0, 0.3));
    `;
    indicator.textContent = '🏆';
    header.appendChild(indicator);
  }
}

// Tournament mode submit function - متطابق تماماً مع التحدي العادي
async function submitTournamentPicks() {
  console.log('🏆 Submitting tournament picks - UNIFIED SYSTEM...');
  
  if (!picks.length) return;

  if (Array.isArray(submittedOrder) && submittedOrder.length === picks.length) {
    console.log(`⚠️ اللاعب ${playerParam} حاول إرسال ترتيب مرسل بالفعل`);
    return;
  }

  // حماية إضافية: تحقق من أن هذا اللاعب لم يرسل الترتيب مؤخراً
  const lastSubmitTime = localStorage.getItem(LAST_SUBMIT_TIME_KEY);
  const currentTime = Date.now();
  if (lastSubmitTime && (currentTime - parseInt(lastSubmitTime)) < 2000) {
    console.log(`⚠️ تجاهل إرسال متكرر للاعب ${playerParam} - تم الإرسال مؤخراً`);
    return;
  }

  // Process ordering based on device type - نفس المنطق بالضبط
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
    
    // Store submitted order in localStorage (following same pattern as challenge mode)
    console.log(`💾 حفظ ترتيب البطولة للاعب ${playerParam} في localStorage`);
    localStorage.setItem(ORDER_LOCAL_KEY, JSON.stringify(ordered));
    
    // Store card arrangement for card.html to detect (following same pattern)
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    localStorage.setItem(`${playerKey}CardArrangement`, JSON.stringify(ordered));
    localStorage.setItem(`${playerKey}ArrangementCompleted`, 'true');
    
    // Also store in the format expected by card.html
    const currentGameSetup = JSON.parse(localStorage.getItem(GAME_SETUP_KEY) || '{}');
    const updatedGameSetup = {
      ...currentGameSetup,
      [playerKey]: {
        ...currentGameSetup[playerKey],
        selectedCards: ordered,
        arrangementCompleted: true
      }
    };
    localStorage.setItem(GAME_SETUP_KEY, JSON.stringify(updatedGameSetup));
    
    // Store in gameState format as well
    const currentGameState = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}');
    const updatedGameState = {
      ...currentGameState,
      [playerKey]: {
        ...currentGameState[playerKey],
        selectedCards: ordered,
        arrangementCompleted: true
      }
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(updatedGameState));
    
    // Store in StrategicOrdered format (for compatibility with card.js)
    localStorage.setItem(`${playerParam}StrategicOrdered`, JSON.stringify(ordered));
    localStorage.setItem(LAST_SUBMIT_TIME_KEY, Date.now().toString());
    
    // ✅ حفظ في Firebase (نفس طور التحدي تماماً)
    if (gameId) {
      try {
        console.log(`📡 Saving tournament order to Firebase for player ${playerParam}...`);
        await GameService.saveCardOrder(gameId, player, ordered);
        console.log(`✅ Tournament order saved to Firebase successfully`);
      } catch (e) {
        console.error('❌ Firebase save failed:', e);
        alert('حدث خطأ في حفظ الترتيب. يرجى المحاولة مرة أخرى.');
        // إعادة تفعيل الزر
        if (continueBtn) {
          continueBtn.disabled = false;
          continueBtn.textContent = 'متابعة';
        }
        return;
      }
    } else {
      console.error('❌ No gameId found - cannot save to Firebase');
      alert('خطأ: لم يتم العثور على معرف اللعبة. يرجى نسخ الرابط من جديد.');
      if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.textContent = 'متابعة';
      }
      return;
    }
    
    // Update submittedOrder immediately
    submittedOrder = ordered.slice();
    
    hideOpponentPanel();
    
    // Re-render cards immediately with submitted order
    console.log(`🎯 عرض ترتيب البطولة للاعب ${playerParam}:`, submittedOrder);
    renderCards(submittedOrder, submittedOrder);
    
    // Update button state
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
    console.log('Tournament order submitted successfully:', ordered);
    showToast('تم حفظ ترتيب البطاقات بنجاح!', 'success');
    
    // Reset isArranging flag
    isArranging = false;
    console.log("✅ تم إرسال ترتيب البطولة - السماح بالتحديثات الخارجية مرة أخرى");
    
  } catch (error) {
    console.error('Error saving tournament card order:', error);
    alert('حدث خطأ في حفظ ترتيب البطاقات: ' + error.message);
    
    // Reset isArranging flag on error
    isArranging = false;
    console.log("❌ حدث خطأ في البطولة - السماح بالتحديثات الخارجية مرة أخرى");
    
    // إعادة تفعيل الزر
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.textContent = 'متابعة';
    }
  }
}

// الدالتان updateSubmitButton و checkTournamentReady تم دمجهما في submitTournamentPicks

// Make functions available globally
window.submitPicks = submitPicks;
window.clearOldGameData = clearOldGameData;
window.clearUsedAbilities = clearUsedAbilities;
window.openBattleView = openBattleView;
window.loadTournamentCards = loadTournamentCards;
window.submitTournamentPicks = submitTournamentPicks;



// ✅ إعادة تحميل ترتيب الكروت بعد تحديث الصفحة
document.addEventListener("DOMContentLoaded", () => {
  try {
    // نمنع التحميل المكرر إذا كانت الدالة تعمل بالفعل
    if (typeof loadPlayerCards === "function") {
      console.log("🔁 إعادة تحميل ترتيب الكروت من localStorage بعد التحديث...");
      loadPlayerCards();

      // في حال لم يكن cardManager جاهزاً بعد، نعيد المحاولة بعد قليل
      setTimeout(() => {
        if (typeof window.cardManager === "undefined") {
          console.warn("⚠️ cardManager لم يجهز بعد — إعادة المحاولة...");
          loadPlayerCards();
        }
      }, 1000);
    } else {
      console.warn("⚠️ الدالة loadPlayerCards غير متوفرة حالياً.");
    }
  } catch (e) {
    console.error("❌ خطأ أثناء إعادة تحميل ترتيب الكروت:", e);
  }
});
