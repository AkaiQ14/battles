// js/gameService.js
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc, 
  onSnapshot,
  setDoc

} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-config.js';

export class GameService {
  // إنشاء لعبة جديدة
  static async createGame(player1Name, player2Name, rounds) {
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
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'games'), gameData);
    return docRef.id;
  }
  
  // حفظ البطاقات
  static async savePlayerCards(gameId, player, cards) {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      [`player${player}.cards`]: cards,
      updatedAt: new Date()
    });
  }
  
  // حفظ القدرات
  static async savePlayerAbilities(gameId, player, abilities) {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      [`player${player}.abilities`]: abilities,
      updatedAt: new Date()
    });
  }
  
  // حفظ ترتيب البطاقات
  static async saveCardOrder(gameId, player, cardOrder) {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      [`player${player}.cardOrder`]: cardOrder,
      [`player${player}.isReady`]: true,
      updatedAt: new Date()
    });
  }
  
  // جلب بيانات اللعبة
  static async getGame(gameId) {
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
    const gameRef = doc(db, 'games', gameId);
    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  }
}