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

// ✅ تهيئة نظام طلب القدرات الجديد
let abilityRequestManager = null;

// دالة مساعدة لتهيئة نظام طلب القدرات
async function initializeAbilityRequestSystem() {
  console.group('🚀 تهيئة نظام طلب القدرات');
  
  try {
    // التحقق من وجود AbilityRequestManager
    if (typeof window.AbilityRequestManager === 'undefined') {
      console.warn('⚠️ AbilityRequestManager غير موجود');
      throw new Error('AbilityRequestManager not loaded');
    }
    
    // إنشاء مثيل جديد
    abilityRequestManager = new window.AbilityRequestManager();
    
    // التحقق من وجود syncService
    if (!syncService) {
      console.warn('⚠️ syncService غير مهيأ');
      throw new Error('syncService not initialized');
    }
    
    // تهيئة المدير
    await abilityRequestManager.init({
      syncService: syncService,
      isHost: false,
      playerParam: playerParam,
      playerName: playerName
    });
    
    console.log('✅ Ability Request System initialized successfully');
    
    // تحميل القدرات بعد التهيئة
    loadPlayerAbilities();
    
    return abilityRequestManager;
  } catch (err) {
    console.error('❌ Failed to initialize Ability Request System:', err);
    
    // عرض رسالة للمستخدم
    if (abilityStatus) {
      abilityStatus.textContent = "خطأ في تحميل نظام القدرات. يرجى إعادة تحميل الصفحة.";
      abilityStatus.style.color = "#ef4444";
    }
    
    throw err; // إعادة رمي الخطأ للمعالجة الخارجية
  } finally {
    console.groupEnd();
  }
}

// استدعاء التهيئة عند تحميل المستند
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded: محاولة تهيئة نظام طلب القدرات');
  
  // محاولة التهيئة مع معالجة الأخطاء
  initializeAbilityRequestSystem()
    .then(() => {
      console.log('✅ تمت تهيئة نظام طلب القدرات بنجاح');
    })
    .catch(err => {
      console.error('❌ فشل في تهيئة نظام طلب القدرات:', err);
    });
});

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

// متغيرات التحكم في التزامن
let lastAbilitiesUpdateTime = localStorage.getItem('abilitiesLastUpdate') || '0';
let syncInProgress = false; // منع التداخل في عمليات التزامن

// متغيرات عامة للاعب
let isArranging = true; // حالة ترتيب البطاقات
let submittedOrder = null; // ترتيب البطاقات المرسل
let picks = []; // البطاقات المختارة
let myAbilities = []; // قدرات اللاعب

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
  try {
    console.group('🔍 تحميل بيانات اللعبة');
    console.log('حالة isArranging:', isArranging);
    console.log('معرف اللعبة:', gameId);
    console.log('معلمة اللاعب:', playerParam);
    
    // جلب البيانات من Firebase
    const gameData = await GameService.getGame(gameId);
    const playerData = gameData[`player${player}`];
    
    console.log('بيانات اللاعب:', playerData);
    
    // تحديث المتغيرات
    picks = playerData.cards || [];
    
    // 🚨 معالجة القدرات مع مراعاة حالة الترتيب
    const originalAbilities = playerData.abilities || [];
    console.log('القدرات الأصلية:', originalAbilities);
    
    // إعادة تفعيل القدرات بشكل كامل أثناء الترتيب
    myAbilities = normalizeAbilityList(originalAbilities).map(ability => ({
      ...ability,
      used: isArranging ? false : ability.used
    }));
    
    console.log('القدرات المحدثة:', myAbilities);
    
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
    console.groupEnd();
    
  } catch (error) {
    console.error('Error loading game data:', error);
    alert('حدث خطأ في تحميل بيانات اللعبة: ' + error.message);
    
    // إعادة تفعيل الزر في حالة الخطأ
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.textContent = 'متابعة';
    }
    
    console.groupEnd();
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

// دالة متقدمة لإدارة حالة القدرات
function manageAbilityState(abilities) {
  console.group('🔍 إدارة حالة القدرات');
  console.log('القدرات الأصلية:', abilities);
  console.log('حالة isArranging:', isArranging);

  // مفاتيح التخزين
  const usedAbilitiesKey = `${playerParam}UsedAbilities`;
  const abilitiesKey = `${playerParam}Abilities`;
  
  // جلب القدرات المستخدمة والمخزنة
  const storedUsedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
  const storedAbilities = JSON.parse(localStorage.getItem(abilitiesKey) || '[]');
  
  console.log('القدرات المخزنة:', storedAbilities);
  console.log('القدرات المستخدمة المخزنة:', storedUsedAbilities);

  // معالجة القدرات مع مراعاة جميع الحالات
  const processedAbilities = abilities.map(ability => {
    const abilityText = typeof ability === 'string' ? ability : (ability.text || ability);
    
    // التحقق من حالات مختلفة
    const isUsedInStorage = storedUsedAbilities.includes(abilityText);
    const storedAbilityState = storedAbilities.find(
      a => (typeof a === 'string' ? a : a.text) === abilityText
    );

    // تحديد الحالة النهائية للقدرة
    let finalUsedState = false;

    // إذا كنا في وضع الترتيب، لا تعطل أبدًا
    if (isArranging) {
      finalUsedState = false;
    } 
    // إذا كانت مستخدمة في التخزين، تعتبر غير مستخدمة
    else if (isUsedInStorage) {
      finalUsedState = false;
    } 
    // إذا كانت محددة في القدرات المخزنة، استخدم حالتها
    else if (storedAbilityState && typeof storedAbilityState === 'object') {
      finalUsedState = storedAbilityState.used || false;
    } 
    // وإلا استخدم الحالة الأصلية
    else {
      finalUsedState = typeof ability === 'object' ? ability.used || false : false;
    }

    console.log(`معالجة القدرة: ${abilityText}`, {
      originalAbility: ability,
      isUsedInStorage,
      storedAbilityState,
      finalUsedState
    });

    // إرجاع القدرة مع الحالة النهائية
    return {
      ...(typeof ability === 'object' ? ability : { text: ability }),
      text: abilityText,
      used: finalUsedState
    };
  });

  console.log('القدرات المعالجة:', processedAbilities);
  console.groupEnd();

  return processedAbilities;
}

// تحديث دالة renderAbilities
function renderAbilities(abilities) {
  if (!abilitiesWrap) return;

  // معالجة القدرات
  const processedAbilities = manageAbilityState(abilities);

  // عرض الشارات مع القدرات المعالجة
  renderBadges(abilitiesWrap, processedAbilities, { 
    clickable: true, 
    onClick: async (abilityText) => {
      if (abilityRequestManager) {
        const result = await abilityRequestManager.requestAbility(abilityText);
        
        if (result.success) {
          console.log('✅ تم إرسال طلب القدرة:', result.requestId);
        
        if (abilityStatus) {
          abilityStatus.textContent = "⏳ في انتظار موافقة المستضيف...";
          abilityStatus.style.color = "#f59e0b";
        }
        
          // تحديث حالة القدرة مؤقتًا
          const abilityIndex = processedAbilities.findIndex(ab => ab.text === abilityText);
          if (abilityIndex !== -1) {
            processedAbilities[abilityIndex].used = true;
            
            // تحديث localStorage
  const abilitiesKey = `${playerParam}Abilities`;
            const currentAbilities = JSON.parse(localStorage.getItem(abilitiesKey) || '[]');
            const updatedAbilities = currentAbilities.map(ability => {
              const text = typeof ability === 'string' ? ability : ability.text;
              if (text === abilityText) {
                return typeof ability === 'string' 
                  ? { text: ability, used: true }
                  : { ...ability, used: true };
              }
              return ability;
            });
            localStorage.setItem(abilitiesKey, JSON.stringify(updatedAbilities));
            
            // إعادة العرض
            renderBadges(abilitiesWrap, processedAbilities, { 
              clickable: true, 
              onClick: arguments.callee 
            });
          }
        } else {
          console.error('❌ فشل طلب القدرة:', result.error);
          
          if (abilityStatus) {
            abilityStatus.textContent = result.error === 'Request already pending' 
              ? "⏳ الطلب قيد المراجعة بالفعل..."
              : "❌ فشل إرسال الطلب - حاول مرة أخرى";
            abilityStatus.style.color = "#ef4444";
      }
    }
  } else {
        console.warn('⚠️ نظام طلبات القدرات غير مهيأ');
        
          if (abilityStatus) {
          abilityStatus.textContent = "❌ نظام الطلبات غير جاهز - حاول مرة أخرى";
          abilityStatus.style.color = "#ef4444";
        }
      }
    }
  });

  // تحديث القدرات العامة
  myAbilities = processedAbilities;
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

async function loadPlayerCards() {
  // إظهار loading
  if (instruction) {
    instruction.textContent = 'جاري تحميل بيانات اللعبة...';
  }

  // 🔄 محاكاة منطق order.js لتحميل وحفظ الترتيب
  try {
    // محاولة جلب الترتيب من Firebase أو localStorage
    const serverPicks = await GameService.getPlayerPicks(gameId, playerParam);
    
    // التحقق من وجود بطاقات
    if (Array.isArray(serverPicks) && serverPicks.length) {
      picks = serverPicks.slice();
      try { 
        localStorage.setItem(PICKS_LOCAL_KEY, JSON.stringify(picks)); 
      } catch {}
          } else {
  const localPicks = JSON.parse(localStorage.getItem(PICKS_LOCAL_KEY) || "[]");
  picks = Array.isArray(localPicks) ? localPicks : [];
    }

    // محاولة جلب الترتيب المحفوظ
    const serverOrdered = await GameService.getPlayerOrder(gameId, playerParam);
    submittedOrder = Array.isArray(serverOrdered) && serverOrdered.length ? serverOrdered.slice() : null;

    // محاولة جلب الترتيب من localStorage
    const savedOrder = JSON.parse(localStorage.getItem(ORDER_LOCAL_KEY) || "[]");
  const strategicOrder = JSON.parse(localStorage.getItem(`${playerParam}StrategicOrdered`) || "[]");
  
    // التحقق من صحة الترتيب المحفوظ محليًا
    if (Array.isArray(savedOrder) && savedOrder.length === picks.length) {
      submittedOrder = savedOrder.slice();
      console.log(`✅ تم العثور على ترتيب محفوظ محليًا للاعب ${playerParam}:`, submittedOrder.length, 'بطاقة');
  } else if (Array.isArray(strategicOrder) && strategicOrder.length === picks.length) {
      submittedOrder = strategicOrder.slice();
      console.log(`✅ تم العثور على ترتيب استراتيجي للاعب ${playerParam}:`, submittedOrder.length, 'بطاقة');
    }

    try {
      if (submittedOrder) {
        localStorage.setItem(ORDER_LOCAL_KEY, JSON.stringify(submittedOrder));
        localStorage.setItem(`${playerParam}StrategicOrdered`, JSON.stringify(submittedOrder));
        } else {
      localStorage.removeItem(ORDER_LOCAL_KEY);
      localStorage.removeItem(`${playerParam}StrategicOrdered`);
      }
    } catch {}

    // التحقق من صحة الترتيب
  if (submittedOrder && submittedOrder.length === picks.length) {
      // ترتيب محفوظ وصالح
      console.log(`✅ تم العثور على ترتيب محفوظ للاعب ${playerParam}:`, submittedOrder.length, 'بطاقة');
      picks = submittedOrder.slice();
    hideOpponentPanel();
      renderCards(picks, submittedOrder);
        } else {
      // لا يوجد ترتيب محفوظ
      submittedOrder = null;
      console.log(`ℹ️ لا يوجد ترتيب محفوظ للاعب ${playerParam}`);
      renderCards(picks, null);
      loadOpponentAbilities();
    }
  } catch (error) {
    console.error('خطأ في تحميل الترتيب:', error);
    // الوضع الافتراضي في حالة الخطأ
    submittedOrder = null;
    renderCards(picks, null);
    loadOpponentAbilities();
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

  // حماية إضافية: تحقق من أن هذا اللاعب لم يرسل الترتيب مؤخراً
  const lastSubmitTime = localStorage.getItem(LAST_SUBMIT_TIME_KEY);
  const currentTime = Date.now();
  if (lastSubmitTime && (currentTime - parseInt(lastSubmitTime)) < 2000) {
    console.log(`⚠️ تجاهل إرسال متكرر للاعب ${playerParam} - تم الإرسال مؤخراً`);
    return;
  }

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
  let ordered = new Array(picks.length);
    for (let i = 0; i < values.length; i++) {
      const orderIndex = values[i] - 1;
      ordered[orderIndex] = picks[i];
      console.log(`Card ${i + 1} (${picks[i]}) placed at position ${orderIndex + 1}`);
    }
    console.log('Final ordered array:', ordered);

  try {
    // إظهار loading
    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.textContent = 'جاري إرسال الترتيب...';
    }
    
    // Store submitted order in localStorage
    console.log(`💾 حفظ ترتيب اللاعب ${playerParam} في localStorage`);
    localStorage.setItem(ORDER_LOCAL_KEY, JSON.stringify(ordered));
    
    // Store card arrangement for final-setup.html to detect
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    localStorage.setItem(`${playerKey}CardArrangement`, JSON.stringify(ordered));
    localStorage.setItem(`${playerKey}ArrangementCompleted`, 'true');
    
    // Store in game setup and game state
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
    
    // Store in StrategicOrdered format
    localStorage.setItem(`${playerParam}StrategicOrdered`, JSON.stringify(ordered));
    localStorage.setItem(STRATEGIC_GAME_ID_KEY, gameId || 'default');
    localStorage.setItem(LAST_SUBMIT_TIME_KEY, Date.now().toString());
    
    // Dispatch custom event for host to listen
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
    
    // Update submittedOrder immediately
    submittedOrder = ordered.slice();
    
    hideOpponentPanel();
    
    // Re-render cards immediately with submitted order
    console.log(`🎯 عرض ترتيب اللاعب ${playerParam}:`, submittedOrder);
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
    console.log('Order submitted successfully:', ordered);
    showToast('تم حفظ ترتيب البطاقات بنجاح!', 'success');
    
    // Reset isArranging flag
    isArranging = false;
    console.log("✅ تم إرسال الترتيب - السماح بالتحديثات الخارجية مرة أخرى");
    
  } catch (error) {
    console.error('Error saving card order:', error);
    alert('حدث خطأ في حفظ ترتيب البطاقات: ' + error.message);
    
    // Reset isArranging flag on error
    isArranging = false;
    console.log("❌ حدث خطأ - السماح بالتحديثات الخارجية مرة أخرى");
    
    // Re-enable the button
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
  
  // استدعاء دالة resetArrangement من card.js
  if (window.resetArrangement) {
    window.resetArrangement(playerParam);
  }
  
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
  
  // إعادة تعيين حالة الترتيب
  isArranging = true;
  console.log("🔄 إعادة تعيين isArranging = true للعبة جديدة");
}

// إضافة استدعاء في بداية تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 محاولة إعادة تعيين الترتيب عند تحميل الصفحة');
  window.resetArrangement();
});

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
    console.log(`🧹 مسح البيانات القديمة للاعب ${playerParam} - لعبة جديدة فقط`);
    
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
    
    console.log(`✅ تم مسح البيانات القديمة للاعب ${playerParam}`);
  } catch (error) {
    console.error('Error clearing old game data:', error);
  }
}

// ✅ معالج visibilitychange - مبسط بدون تكرار
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    console.log('📱 الصفحة ظاهرة مرة أخرى - إعادة مزامنة القدرات');
    setTimeout(() => {
      syncAbilities();
      // ❌ REMOVED: checkAbilityRequests
    }, 200);
  }
});

// ✅ Initialize card manager when page loads - نظام مبسط بدون تكرار
document.addEventListener('DOMContentLoaded', function() {
  // Show home button in tournament mode
  const isTournament = localStorage.getItem('currentMatchId') !== null;
  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn && isTournament) {
    homeBtn.style.display = 'flex';
  }
  
  // Initialize card manager
  initializeCardManager();
  
  // ❌ REMOVED: checkAbilityRequests - النظام القديم تم حذفه
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

// ❌ تم إزالة زر عرض التحدي بالكامل
function checkBattleStatus() {
  // ❌ الدالة أصبحت غير فعالة
      return;
    }
    
function startBattleStatusMonitoring() {
  // ❌ المراقبة أصبحت غير فعالة
      return;
    }
    
function openBattleView() {
  // ❌ تم إزالة فتح صفحة عرض التحدي
  return;
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
window.loadTournamentCards = loadTournamentCards;
window.submitTournamentPicks = submitTournamentPicks;

// 🔄 محاكاة منطق order.js لتحميل وحفظ الترتيب
try {
  // محاولة جلب الترتيب من Firebase أو localStorage
  const serverPicks = await GameService.getPlayerPicks(gameId, playerParam);
  
  // التحقق من وجود بطاقات
  if (Array.isArray(serverPicks) && serverPicks.length) {
    picks = serverPicks.slice();
    try { 
      localStorage.setItem(PICKS_LOCAL_KEY, JSON.stringify(picks)); 
    } catch {}
  } else {
    const localPicks = JSON.parse(localStorage.getItem(PICKS_LOCAL_KEY) || "[]");
    picks = Array.isArray(localPicks) ? localPicks : [];
  }

  // محاولة جلب الترتيب المحفوظ
  const serverOrdered = await GameService.getPlayerOrder(gameId, playerParam);
  submittedOrder = Array.isArray(serverOrdered) && serverOrdered.length ? serverOrdered.slice() : null;

  // محاولة جلب الترتيب من localStorage
  const savedOrder = JSON.parse(localStorage.getItem(ORDER_LOCAL_KEY) || "[]");
  const strategicOrder = JSON.parse(localStorage.getItem(`${playerParam}StrategicOrdered`) || "[]");

  // التحقق من صحة الترتيب المحفوظ محليًا
  if (Array.isArray(savedOrder) && savedOrder.length === picks.length) {
    submittedOrder = savedOrder.slice();
    console.log(`✅ تم العثور على ترتيب محفوظ محليًا للاعب ${playerParam}:`, submittedOrder.length, 'بطاقة');
  } else if (Array.isArray(strategicOrder) && strategicOrder.length === picks.length) {
    submittedOrder = strategicOrder.slice();
    console.log(`✅ تم العثور على ترتيب استراتيجي للاعب ${playerParam}:`, submittedOrder.length, 'بطاقة');
  }

  try {
    if (submittedOrder) {
      localStorage.setItem(ORDER_LOCAL_KEY, JSON.stringify(submittedOrder));
      localStorage.setItem(`${playerParam}StrategicOrdered`, JSON.stringify(submittedOrder));
    } else {
      localStorage.removeItem(ORDER_LOCAL_KEY);
      localStorage.removeItem(`${playerParam}StrategicOrdered`);
    }
  } catch {}

  // التحقق من صحة الترتيب
  if (submittedOrder && submittedOrder.length === picks.length) {
    // ترتيب محفوظ وصالح
    console.log(`✅ تم العثور على ترتيب محفوظ للاعب ${playerParam}:`, submittedOrder.length, 'بطاقة');
    picks = submittedOrder.slice();
    hideOpponentPanel();
    renderCards(picks, submittedOrder);
  } else {
    // لا يوجد ترتيب محفوظ
    submittedOrder = null;
    console.log(`ℹ️ لا يوجد ترتيب محفوظ للاعب ${playerParam}`);
    renderCards(picks, null);
    loadOpponentAbilities();
  }
} catch (error) {
  console.error('خطأ في تحميل الترتيب:', error);
  // الوضع الافتراضي في حالة الخطأ
  submittedOrder = null;
  renderCards(picks, null);
  loadOpponentAbilities();
}

// ============ Unique-number dropdown logic ============
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

// ✅ دالة موحدة لتحميل القدرات (تمنع التكرار)
function syncAbilities() {
  if (syncInProgress) {
    console.log('⏸ Sync already in progress, skipping...');
    return;
  }
  
  syncInProgress = true;
  try {
    loadPlayerAbilities();
    loadOpponentAbilities();
    console.log('✅ Abilities synced');
  } finally {
    syncInProgress = false;
  }
}

function snapshotChosen(selects) {
  const values = selects.map(s => s.value || "");
  const chosenSet = new Set(values.filter(Boolean));
  return { chosenSet, values };
}

/* ============ Unique-number dropdown logic ============ */
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

// Load opponent abilities
function loadOpponentAbilities() {
  console.group('🔍 تحميل قدرات الخصم - تشخيص مفصل');
  
  // تحديد معلمات اللاعب الخصم
  const opponentParam = playerParam === 'player1' ? 'player2' : 'player1';
  const opponentAbilitiesKey = `${opponentParam}Abilities`;
  
  console.log('معلمات اللاعب الخصم:', {
    currentPlayer: playerParam,
    opponentParam,
    opponentAbilitiesKey
  });
  
  // فحص محتويات localStorage للخصم
  const savedAbilities = localStorage.getItem(opponentAbilitiesKey);
  console.log('القدرات المحفوظة للخصم:', savedAbilities);
  
  // فحص gameSetupProgress
  const gameSetup = localStorage.getItem('gameSetupProgress');
  console.log('gameSetupProgress:', gameSetup);
  
  if (savedAbilities) {
    try {
      const abilities = JSON.parse(savedAbilities);
      console.log('القدرات المحللة:', abilities);
      
      // التحقق من الجولة الحالية
      const currentRound = parseInt(localStorage.getItem('currentRound') || '0');
      console.log('الجولة الحالية:', currentRound);
      
      let usedSet = new Set();
      
      // جلب القدرات المستخدمة إذا كنا في لعبة
      if (currentRound > 0) {
        const usedAbilitiesKey = `${opponentParam}UsedAbilities`;
        const usedAbilities = JSON.parse(localStorage.getItem(usedAbilitiesKey) || '[]');
        usedSet = new Set(usedAbilities);
        console.log('القدرات المستخدمة للخصم:', usedAbilities);
      }
      
      // معالجة القدرات
      const opponentAbilities = abilities.map(ability => {
        const text = typeof ability === 'string' ? ability : (ability.text || ability);
        const isUsed = currentRound > 0 && usedSet.has(text);
        return { 
          text, 
          used: isUsed
        };
      });
      
      console.log('القدرات النهائية للخصم:', opponentAbilities);
      
      // التأكد من وجود العناصر DOM
      console.log('عناصر DOM:', {
        oppWrap: !!oppWrap,
        oppPanel: !!oppPanel,
        submittedOrder: submittedOrder
      });
      
      if (oppWrap) {
        oppWrap.innerHTML = ''; // مسح المحتوى الحالي
        renderBadges(oppWrap, opponentAbilities, { clickable: false });
        console.log('تم عرض قدرات الخصم');
      } else {
        console.error('oppWrap غير موجود');
      }
      
      // إظهار لوحة الخصم إذا لم يتم إرسال الترتيب
      if (oppPanel && !submittedOrder) {
        oppPanel.classList.remove("hidden");
        console.log('تم إظهار لوحة الخصم');
      }
      
    } catch (e) {
      console.error('خطأ في تحميل قدرات الخصم:', e);
    }
  } else {
    console.warn('⚠️ لم يتم العثور على قدرات للخصم');
    
    // محاولة جلب القدرات من gameSetupProgress
    if (gameSetup) {
      try {
        const setupData = JSON.parse(gameSetup);
        const opponentKey = opponentParam === 'player1' ? 'player1' : 'player2';
        const opponentData = setupData[opponentKey];
        
        if (opponentData && opponentData.abilities) {
          console.log('محاولة جلب القدرات من gameSetupProgress');
          const opponentAbilities = normalizeAbilityList(opponentData.abilities);
          
          if (oppWrap) {
            oppWrap.innerHTML = '';
            renderBadges(oppWrap, opponentAbilities, { clickable: false });
          }
          
          if (oppPanel) {
            oppPanel.classList.remove("hidden");
          }
        }
      } catch (e) {
        console.error('خطأ في تحليل gameSetupProgress:', e);
      }
    }
  }
  
  console.groupEnd();
}

// إضافة دالة مساعدة للتأكد من تحميل قدرات الخصم
function ensureOpponentAbilities() {
  console.log('🔄 محاولة التأكد من تحميل قدرات الخصم');
  
  // محاولة تحميل القدرات مرة أخرى بعد تأخير قصير
  setTimeout(() => {
    loadOpponentAbilities();
  }, 500);
}

// إضافة استدعاء عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 محاولة تحميل قدرات الخصم عند تحميل الصفحة');
  loadOpponentAbilities();
  
  // إضافة استدعاء احتياطي
  setTimeout(ensureOpponentAbilities, 1000);
});


