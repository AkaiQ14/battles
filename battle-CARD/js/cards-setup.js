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
  createCardsGrid();
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

// Generate random cards for each player (with persistence)
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
  // Common cards (85% of total) - منظم حسب المجلد المرفق
  const commonCards = [
    // الكروت الشائعة الأصلية
    'images/Stark-card.png',
    'images/Todoroki.png',
    'images/CartTitan-card.png',
    'images/Monspeet-card.png',
    'images/Rika-card.png',
    'images/ace.png',
    'images/Shizuku-card.png',
    'images/zetsu.png',
    'images/Overhaul-card.png',
    'images/Atsuya-card.png',
    'images/Yoo-Jinho-card.png',
    'images/Gin-freecss-card.png',
    'images/Hantengu-card.png',
    'images/Lily-card.png',
    'images/Gordon-card.png',
    'images/Charllotte-card.png',
    'images/Min-Byung-Gyu-card.png',
    'images/KiSui-card.png',
    'images/Iron-card.png',
    'images/Hawk-card.png',
    'images/bartolomeo-card.png',
    'images/WarHammerTitan-card.png',
    'images/Luck.png',
    'images/Elfaria Albis.png',
    'images/Haschwalth-card.png',
    'images/Hisagi-card.png',
    'images/Elizabeth.png',
    'images/MeiMei-card.png',
    'images/Okabe-card.png',
    'images/Renpa-card.png',
    'images/Vengeance.png',
    'images/Pariston-card.png',
    'images/franklin_card.png',
    'images/MouBu-card.png',
    'images/Android18-card.png',
    'images/hinata.png',
    'images/laxus.png',
    'images/Videl-card.webp',
    'images/Momo-hinamori-card.webp',
    'images/cardo20ppsd.webp',
    'images/Krilin-card.webp',
    'images/HakuKi-card.webp',
    'images/ArmorTitan-card.webp',
    'images/Nachttt.webp',
    'images/Tosen-card.webp',
    
    // الكروت الشائعة الجديدة من مجلد Common
    'images/Kalluto-card.png',
    'images/GaiMou-card.png',
    'images/Paragusss.png',
    'images/Haruta jjk.png',
    'images/Akutagawa-card.png',
    'images/Vista-card.png',
    'images/Jozi jjk.png',
    'images/Frierennnnn.png',
    'images/Tank-card.png',
    'images/Oden-card.png',
    'images/Ippo-card.png',
    'images/Kingkaiii.png',
    'images/MouGou-card.png',
    'images/jugo.png',
    'images/ghiaccio.png',
    'images/cavendish-card.png',
    'images/Tenma-card.png',
    'images/Rojuro-card.png',
    'images/Miruku bnha.png',
    'images/Kukoshibo-card.png',
    'images/Ganju-card.png',
    'images/Runge-card.png',
    'images/Rhyaa.png',
    'images/Meleoron-card.png',
    'images/Kirach.png',
    'images/lyon vastia.png',
    'images/julius wistoria.png',
    'images/Asui-card.png',
    'images/Jack-card.png',
    'images/sting eucliffe.png',
    'images/edward elric.png',
    'images/Zeno kingdom.png',
    'images/Uvogin-card.png',
    'images/Shinobu-card.png',
    'images/suzuno.png',
    'images/caesar-card.png',
    'images/Shin-card.png',
    'images/lumiere silvamillion.png',
    'images/kimimaro.png',
    'images/Kyoga-card.png',
    'images/Knov-card.png',
    'images/Kaguraaaa.png',
    'images/Chopper-card.png',
    'images/Franky-card.png',
    'images/Nejire-card.png',
    'images/Kurapika-card.png',
    'images/zaratras.png',
    'images/Zohakuten.png',
    'images/Zeo Thorzeus.png',
    'images/Mina-card.png',
    'images/MetalBat-card.png',
    'images/Makio-card.png',
    'images/Galand-card.png',
    'images/DiamondJozu.webp',
    'images/Matsumoto-card.webp',
    'images/MomoYaorozu-card.webp',
    'images/Ishida-card.webp',
    'images/Yoruichi-card.webp',
    'images/esdeath.webp',
    'images/Jaw-card.webp',
    'images/FemaleTitan-card.webp',
    'images/Aizetsu-card.webp',
    'images/tenten.webp',
    'images/Gadjah.webp',
    'images/naobito-card.webp',
    'images/Gilthunder.png',
    'images/Mai-card.png',
    'images/Maki zenen.png',
    'images/Itadori-card.png',
    'images/Picollooo.png',
    'images/Noelll.png',
    'images/shino.png',
    'images/Kenzo-card.png',
    'images/Masamichi-card.png',
    'images/ShouBunKun-card.png',
    'images/Bardooock.png',
    'images/mahito-card.png',
    'images/poseidon.png',
    'images/geten.webp',
    'images/alex20armstrong.webp',
    'images/Shinpei-card.webp',
    'images/Friezaaa.webp',
    'images/VanAugur-card.webp',
    'images/Zamasuuu.webp',
    'images/Mayuri-card.webp',
    'images/Runge-card.webp',
    'images/takuma-card.webp',
    'images/Shinji-card.webp',
    'images/konohamaru.webp',
    'images/fubuki.webp',
    'images/Jirobo.webp',
    'images/RaiDokingdom.webp',
    'images/silverfullbuster.webp',
    'images/Langriiss.webp',
    'images/Panda-card.webp',
    'images/pizarro.webp',
    'images/Mezo-card.webp',
    'images/Senritsu-card.webp',
    'images/Merlin-card.webp',
    'images/Queen-card.webp',
    'images/Btakuya-card.png',
    'images/sai.png',
    'images/crocus-card.png',
    'images/kurenai.png',
    'images/Mahoraga.png',
    'images/Inosuke-card.png',
    'images/KeiSha-card.png',
    'images/brook.png',
    'images/Ur.png',
    'images/Kurogiri-card.png',
    'images/Alluka-card.png',
    'images/Ban-card.png',
    'images/konan.png',
    'images/dazai-card.png',
    'images/Karaku-card.png',
    'images/Inumaki-card.png',
    'images/Raditzz.png',
    'images/Lucci-card.png',
    'images/Bisky-card.png',
    'images/Orihime-card.png',
    'images/Isaac mcdougal.png',
    'images/ino.png',
    'images/Eso-card.png',
    'images/Genthru-card.png',
    'images/Roy Mustang.png',
    'images/Stain-card.png',
    'images/Zagred-card.png',
    'images/BeastKing-card.png',
    'images/rin.png',
    'images/kota izumi.png',
    'images/Lille-baroo-card.png',
    'images/tenten.webp',
    'images/Feitan-card.webp',
    'images/uraume-card.webp',
    'images/Akaza-card.webp',
    'images/Denki-card.webp',
    'images/monet.webp',
    'images/zabuza.webp'
  ];
  
  // Epic cards (part of 15% with Legendary) - منظم حسب المجلد المرفق
  const epicCards = [
    // الكروت الملحمية من مجلد Epic
    'images/nanami-card.png',
    'images/kenjaku-card.png',
    'images/Geto-card.png',
    'images/Yusaku.png',
    'images/Danteee.png',
    'images/Johan-card.png',
    'images/mansherry.png',
    'images/Teach-card.png',
    'images/tobirama.png',
    'images/BigM.webp',
    'images/Choi-jong-in-.webp',
    'images/judarr.webp',
    'images/Adult-gon-card.webp',
    'images/ColossialTitan-card.png',
    'images/gloxinia.png',
    'images/A4thRaikagee.png',
    'images/Igris-card.webp',
    'images/Queen-card.webp',
    'images/Mahoraga.png',
    'images/Ban-card.png',
    'images/dazai-card.png',
    'images/Orihime-card.png',
    'images/Zagred-card.png',
    'images/Lille-baroo-card.png',
    'images/minato.png',
    'images/ShouHeiKun-card .png',
    'images/KudoShinichi-card.png',
    'images/Ichibe-card.png',
    'images/Endeavor.png',
    'images/Tier Harribel.png',
    'images/Crocodile.png',
    'images/Nana-card.png',
    'images/Vegapunk-crad.webp',
    'images/Go-Gunhee-card.webp',
    'images/Nami.webp',
    'images/Hachigen-card.png',
    'images/Senjumaru-card.png',
    'images/Arthur-card.png',
    'images/Lemillion-card.png',
    'images/Fuegoleonn .png',
    'images/Itchigo-card .png',
    'images/Kaito-card .png',
    'images/DragonBB-67-card.png',
    'images/Kuma-card.png',
    'images/YujiroHanma-card.png',
    'images/Dabi-card.png',
    'images/gounji.png',
    'images/Carasuma.png',
    'images/Conan.png',
    'images/Kidou.png',
    'images/Shisui.png',
    'images/Akaii.png',
    'images/GTO_2.webp',
    'images/sasukee.webp',
    'images/gaara.webp',
    'images/Cathleen-card.webp',
    'images/Akaino-card.webp'
  ];
  
  // Legendary cards (part of 15% with Epic) - منظم حسب المجلد المرفق
  const legendaryCards = [
    // الكروت الأسطورية من مجلد Legendary
    'images/obito.webm',
    'images/whitebeard.webm',
    'images/SakamotoCard.webm',
    'images/GojoCard.webm',
    'images/Gogeta.webm',
    'images/Vegetto.webm',
    'images/Hawks.webm',
    'images/Goku UI.webm',
    'images/shikamaru.webm',
    'images/law.webm',
    'images/madara.webm',
    'images/NietroCard.webm',
    'images/aizen.webm',
    'images/AllForOneCard.webm',
    'images/ErenCard.webm',
    'images/LuffyGear5Card.webm',
    'images/joker.webm',
    'images/AyanokojiCard.webm',
    'images/UmibozoCard.webm',
    'images/MeruemCard.webm',
    'images/SilverCard.webm',
    'images/Akai.webm',
    'images/ShanksCard.webm',
    'images/Ranpo.webm',
    'images/Zenitsu.webm',
    'images/Fubuki.webm',
    'images/zoro.webm',
    'images/killua.webm',
    'images/Asta.webm',
    // Latest legendary cards
    'images/Hashirama.webm',
    'images/Neiji.webm'
  ];
  
  // نظام توزيع عشوائي جداً يعتمد على الحظ - نسبة 98% عادية، 2% قوية
  const totalCardsNeeded = 40; // 20 لكل لاعب
  const commonPercentage = 0.98; // 98% للبطاقات العادية
  const epicLegendaryPercentage = 0.02; // 2% للبطاقات الملحمية والأسطورية
  
  // خلط مكثف لجميع مجموعات البطاقات
  const shuffledCommon = [...commonCards];
  const shuffledEpic = [...epicCards];
  const shuffledLegendary = [...legendaryCards];
  
  // خلط مكثف باستخدام خوارزمية Fisher-Yates
  function intensiveShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // خلط إضافي بعوامل عشوائية متعددة
  function superRandomShuffle(array) {
    return array.sort(() => {
      const random1 = Math.random();
      const random2 = Math.random();
      const random3 = Math.random();
      const random4 = Date.now() % 1000;
      return (random1 + random2 + random3 + random4) / 4 - 0.5;
    });
  }
  
  // تطبيق الخلط المكثف
  intensiveShuffle(shuffledCommon);
  intensiveShuffle(shuffledEpic);
  intensiveShuffle(shuffledLegendary);
  superRandomShuffle(shuffledCommon);
  superRandomShuffle(shuffledEpic);
  superRandomShuffle(shuffledLegendary);
  
  // دمج جميع البطاقات مع تصنيفها
  const allCards = [];
  
  // إضافة البطاقات الشائعة مع تصنيفها
  shuffledCommon.forEach(card => {
    allCards.push({ card, type: 'common', rarity: 1 });
  });
  
  // إضافة البطاقات الملحمية مع تصنيفها
  shuffledEpic.forEach(card => {
    allCards.push({ card, type: 'epic', rarity: 2 });
  });
  
  // إضافة البطاقات الأسطورية مع تصنيفها
  shuffledLegendary.forEach(card => {
    allCards.push({ card, type: 'legendary', rarity: 3 });
  });
  
  // خلط مكثف لجميع البطاقات
  intensiveShuffle(allCards);
  superRandomShuffle(allCards);
  
  // اختيار 40 بطاقة عشوائية مع ضمان نسبة 98% عادية، 2% قوية
  const selectedCards = [];
  const usedIndices = new Set();
  
  // حساب عدد البطاقات المطلوبة (98% عادية، 2% قوية)
  const commonCardsNeeded = Math.floor(totalCardsNeeded * commonPercentage); // 39 بطاقة عادية
  const strongCardsNeeded = totalCardsNeeded - commonCardsNeeded; // 1 بطاقة قوية
  
  let strongCardsSelected = 0;
  let commonCardsSelected = 0;
  
  // اختيار البطاقات مع ضمان النسبة
  while (selectedCards.length < totalCardsNeeded && usedIndices.size < allCards.length) {
    const randomIndex = Math.floor(Math.random() * allCards.length);
    
    if (!usedIndices.has(randomIndex)) {
      const cardData = allCards[randomIndex];
      
      // اختيار البطاقات القوية أولاً
      if (strongCardsSelected < strongCardsNeeded && (cardData.type === 'epic' || cardData.type === 'legendary')) {
        selectedCards.push(cardData);
        strongCardsSelected++;
        usedIndices.add(randomIndex);
      }
      // اختيار البطاقات الشائعة
      else if (commonCardsSelected < commonCardsNeeded && cardData.type === 'common') {
        selectedCards.push(cardData);
        commonCardsSelected++;
        usedIndices.add(randomIndex);
      }
      // إذا لم نجد النوع المطلوب، نأخذ أي بطاقة متاحة
      else if (selectedCards.length < totalCardsNeeded) {
        selectedCards.push(cardData);
        if (cardData.type === 'epic' || cardData.type === 'legendary') {
          strongCardsSelected++;
        } else {
          commonCardsSelected++;
        }
        usedIndices.add(randomIndex);
      }
    }
  }
  
  // توزيع عشوائي جداً على اللاعبين (يعتمد على الحظ) مع ضمان عدم التكرار المطلق
  const player1Cards = [];
  const player2Cards = [];
  
  // خلط البطاقات المختارة مرة أخرى
  intensiveShuffle(selectedCards);
  superRandomShuffle(selectedCards);
  
  // تقسيم البطاقات إلى مجموعتين منفصلتين تماماً (بدون تكرار مطلق)
  const player1CardData = selectedCards.slice(0, 20);
  const player2CardData = selectedCards.slice(20, 40);
  
  // التحقق من عدم وجود تكرار بين المجموعتين
  const player1Set = new Set(player1CardData.map(cardData => cardData.card));
  const player2Set = new Set(player2CardData.map(cardData => cardData.card));
  
  // التحقق من عدم التكرار داخل كل لاعب
  if (player1Set.size !== player1CardData.length) {
    console.error('توجد بطاقات مكررة في اللاعب الأول!');
    return;
  }
  
  if (player2Set.size !== player2CardData.length) {
    console.error('توجد بطاقات مكررة في اللاعب الثاني!');
    return;
  }
  
  // التحقق من عدم التكرار بين اللاعبين
  const intersection = [...player1Set].filter(card => player2Set.has(card));
  if (intersection.length > 0) {
    console.error('توجد بطاقات مكررة بين اللاعبين!', intersection);
    return;
  }
  
  // استخراج البطاقات فقط (بدون البيانات الإضافية)
  player1Cards.push(...player1CardData.map(cardData => cardData.card));
  player2Cards.push(...player2CardData.map(cardData => cardData.card));
  
  // التحقق النهائي من عدم التكرار
  const finalCheck1 = new Set(player1Cards);
  const finalCheck2 = new Set(player2Cards);
  const finalIntersection = [...finalCheck1].filter(card => finalCheck2.has(card));
  
  if (finalIntersection.length > 0) {
    console.error('فشل التحقق النهائي - توجد بطاقات مكررة بين اللاعبين!', finalIntersection);
    return;
  }
  
  // خلط نهائي مكثف لكل لاعب
  intensiveShuffle(player1Cards);
  intensiveShuffle(player2Cards);
  superRandomShuffle(player1Cards);
  superRandomShuffle(player2Cards);
  
  // حفظ البطاقات في حالة اللعبة
  gameState.player1Cards = player1Cards;
  gameState.player2Cards = player2Cards;
  
  console.log(`🎴 التوزيع النهائي العشوائي: اللاعب1=${player1Cards.length}, اللاعب2=${player2Cards.length}`);
  
  // إحصائيات التوزيع النهائي
  const player1Legendary = player1Cards.filter(card => legendaryCards.includes(card)).length;
  const player1Epic = player1Cards.filter(card => epicCards.includes(card)).length;
  const player1Common = player1Cards.filter(card => commonCards.includes(card)).length;
  const player2Legendary = player2Cards.filter(card => legendaryCards.includes(card)).length;
  const player2Epic = player2Cards.filter(card => epicCards.includes(card)).length;
  const player2Common = player2Cards.filter(card => commonCards.includes(card)).length;
  
  console.log(`🎲 التوزيع النهائي العشوائي (يعتمد على الحظ - بدون تكرار مطلق):`);
  console.log(`🎴 اللاعب الأول: ${player1Common} شائعة، ${player1Epic} ملحمية، ${player1Legendary} أسطورية`);
  console.log(`🎴 اللاعب الثاني: ${player2Common} شائعة، ${player2Epic} ملحمية، ${player2Legendary} أسطورية`);
  console.log(`🎯 نسبة البطاقات القوية: ${((player1Epic + player1Legendary + player2Epic + player2Legendary) / 40 * 100).toFixed(1)}%`);
  console.log(`✅ تأكيد: لا توجد بطاقات مكررة بين اللاعبين`);
  
  // التحقق من عدم وجود تكرار - فحص شامل
  const allCardsUsed = [...player1Cards, ...player2Cards];
  const cardSet = new Set(allCardsUsed);
  
  // فحص التكرار الداخلي لكل لاعب
  const player1Duplicates = player1Cards.filter((card, index) => 
    player1Cards.indexOf(card) !== index
  );
  const player2Duplicates = player2Cards.filter((card, index) => 
    player2Cards.indexOf(card) !== index
  );
  
  // فحص التكرار العام
  const totalDuplicates = allCardsUsed.filter((card, index) => 
    allCardsUsed.indexOf(card) !== index
  );
  
  if (player1Duplicates.length > 0 || player2Duplicates.length > 0 || totalDuplicates.length > 0) {
    console.error('❌ تم اكتشاف تكرار في البطاقات!');
    console.error(`تكرار اللاعب الأول: ${player1Duplicates.length}`);
    console.error(`تكرار اللاعب الثاني: ${player2Duplicates.length}`);
    console.error(`تكرار عام: ${totalDuplicates.length}`);
  } else {
    console.log('✅ لا توجد بطاقات مكررة - التوزيع آمن');
  }
  
  // التحقق من العدد الإجمالي
  if (allCardsUsed.length !== 40) {
    console.error(`❌ عدد البطاقات غير صحيح: ${allCardsUsed.length} بدلاً من 40`);
  } else {
    console.log('✅ تم توزيع 40 بطاقة بالضبط');
  }
  
  // التحقق من توزيع اللاعبين
  if (player1Cards.length !== 20 || player2Cards.length !== 20) {
    console.error(`❌ توزيع اللاعبين غير صحيح: اللاعب1=${player1Cards.length}, اللاعب2=${player2Cards.length}`);
  } else {
    console.log('✅ تم توزيع 20 بطاقة لكل لاعب بالضبط');
  }
  
  console.log('🎲 النظام الجديد: توزيع عشوائي جداً يعتمد على الحظ مع نسبة 98% عادية، 2% قوية - بدون تكرار مطلق بين اللاعبين');
  
  // Set available cards for current player
  if (gameState.currentPlayer === 'player1') {
    gameState.availableCards = player1Cards;
  } else {
    gameState.availableCards = player2Cards;
  }
  
  // Save to localStorage (like order.js)
  try { 
    localStorage.setItem('player1StrategicPicks', JSON.stringify(player1Cards)); 
  } catch {}
  try { 
    localStorage.setItem('player2StrategicPicks', JSON.stringify(player2Cards)); 
  } catch {}
  
  // Save generated cards to global variables to prevent regeneration on page refresh
  window.gameCardsData.player1Cards = player1Cards;
  window.gameCardsData.player2Cards = player2Cards;
  window.gameCardsGenerated = true;
  console.log('💾 Saved generated cards to global variables');
  
  // Also save game setup data
  localStorage.setItem('gameSetupProgress', JSON.stringify({
    player1Name: gameState.player1Name,
    player2Name: gameState.player2Name,
    rounds: gameState.rounds
  }));
}

function createCardsGrid() {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';
  
  // Use available cards for current player
  const cardsToShow = gameState.availableCards || [];
  
  // Create cards based on available cards - start from top with natural numbering (1-2-3-4...)
  cardsToShow.forEach((cardPath, index) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-number';
    cardDiv.textContent = index + 1; // Natural order: 1-2-3-4...
    cardDiv.dataset.cardNumber = index + 1;
    cardDiv.dataset.cardPath = cardPath;
    cardDiv.dataset.cardIndex = index; // Store actual index for reference
    cardDiv.onclick = () => selectCard(index + 1);
    
    const currentPlayerData = gameState[gameState.currentPlayer];
    if (currentPlayerData.selectedCards.includes(index + 1)) {
      cardDiv.classList.add('selected');
    }
    grid.appendChild(cardDiv);
  });
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
    const cardsNeeded = gameState.rounds;
    if (currentPlayerData.selectedCards.length < cardsNeeded) {
      currentPlayerData.selectedCards.push(cardNumber);
      cardDiv.classList.add('selected');
    }
  }
  
  // Update display
  updateDisplay();
  saveProgress();
}

async function continueToNextPlayer() {
  const gameId = sessionStorage.getItem('currentGameId');
  const currentPlayerData = gameState[gameState.currentPlayer];
  const cardsNeeded = gameState.rounds;
  
  if (!gameId) {
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
    
    // حفظ البطاقات المختارة في Firebase
    const selectedCards = getSelectedCards();
    const playerNumber = gameState.currentPlayer === 'player1' ? 1 : 2;
    
    await GameService.savePlayerCards(gameId, playerNumber, selectedCards);
    
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
  
  const cardsNeeded = gameState.rounds;
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

// Make functions available globally
window.continueToNextPlayer = continueToNextPlayer;
window.saveProgress = saveProgress;
window.savePlayerCards = savePlayerCards;

