// js/gameService.js
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc, 
  onSnapshot,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';

// Wait for Firebase to be initialized
let auth, db;
try {
  const app = getApp(); // Get the initialized app
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase not initialized yet, will retry...');
  // Fallback: get from window if available
  setTimeout(() => {
    if (window.auth && window.db) {
      auth = window.auth;
      db = window.db;
    }
  }, 100);
}

export class GameService {
  // إنشاء لعبة جديدة
  static async createGame(player1Name, player2Name, rounds, advancedMode = false) {
    // Ensure auth and db are initialized
    if (!auth || !db) {
      const app = getApp();
      auth = getAuth(app);
      db = getFirestore(app);
    }
    
    const user = auth.currentUser;
    if (!user) {
      alert("الرجاء تسجيل الدخول أولاً");
      return;
    }

    const gameData = {
      player1: {
        name: player1Name,
        cards: [],
        abilities: [],
        cardOrder: [],
        isReady: false
      },
      player2: {
        name: player2Name,
        cards: [],
        abilities: [],
        cardOrder: [],
        isReady: false
      },
      rounds: rounds,
      advancedMode: advancedMode,
      status: 'waiting',
      creatorId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const gameId = crypto.randomUUID();
    await setDoc(doc(db, "games", gameId), gameData);
    return gameId;
  }
  
  // ✅ إنشاء لعبة بطولة (مع matchId محدد)
  static async createTournamentGame(matchId, gameData) {
    // Ensure db is initialized
    if (!db) {
      const app = getApp();
      db = getFirestore(app);
    }
    
    // إنشاء سجل اللعبة في Firebase بـ matchId محدد
    await setDoc(doc(db, "games", matchId), gameData);
    console.log(`✅ Tournament game created with ID: ${matchId}`);
    return matchId;
  }
  
  // حفظ البطاقات
  static async savePlayerCards(gameId, player, cards) {
    // Ensure db is initialized
    if (!db) {
      const app = getApp();
      db = getFirestore(app);
    }
    
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      [`player${player}.cards`]: cards,
      updatedAt: new Date()
    });
  }
  
  // حفظ القدرات
  static async savePlayerAbilities(gameId, player, abilities) {
    // Ensure db is initialized
    if (!db) {
      const app = getApp();
      db = getFirestore(app);
    }
    
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      [`player${player}.abilities`]: abilities,
      updatedAt: new Date()
    });
  }
  
  // حفظ ترتيب البطاقات
  static async saveCardOrder(gameId, player, cardOrder) {
    // Ensure db is initialized
    if (!db) {
      const app = getApp();
      db = getFirestore(app);
    }
    
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      [`player${player}.cardOrder`]: cardOrder,
      [`player${player}.isReady`]: true,
      updatedAt: new Date()
    });
  }
  
  // جلب بيانات اللعبة
  static async getGame(gameId) {
    // Ensure db is initialized
    if (!db) {
      const app = getApp();
      db = getFirestore(app);
    }
    
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (gameSnap.exists()) {
      return gameSnap.data();
    } else {
      throw new Error('Game not found');
    }
  }
  
  // الاستماع للتغييرات في الوقت الفعلي
  static listenToGame(gameId, callback) {
    // Ensure db is initialized
    if (!db) {
      const app = getApp();
      db = getFirestore(app);
    }
    
    const gameRef = doc(db, 'games', gameId);
    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  }

  // جلب بطاقات اللاعب
  static async getPlayerPicks(gameId, playerParam) {
    // Ensure db is initialized
    if (!db) {
      const app = getApp();
      db = getFirestore(app);
    }
    
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (gameSnap.exists()) {
      const gameData = gameSnap.data();
      const playerNumber = playerParam === 'player2' ? 2 : 1;
      return gameData[`player${playerNumber}`]?.cards || [];
    } else {
      throw new Error('Game not found');
    }
  }
  
  // جلب ترتيب بطاقات اللاعب
  static async getPlayerOrder(gameId, playerParam) {
    // Ensure db is initialized
    if (!db) {
      const app = getApp();
      db = getFirestore(app);
    }
    
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (gameSnap.exists()) {
      const gameData = gameSnap.data();
      const playerNumber = playerParam === 'player2' ? 2 : 1;
      return gameData[`player${playerNumber}`]?.cardOrder || [];
    } else {
      throw new Error('Game not found');
    }
  }
}