// Card Manager for Netlify compatibility
class CardManager {
  constructor() {
    this.cardDatabase = {
      common: [],
      epic: [],
      legendary: []
    };
    this.initializeCardDatabase();
  }

  // Initialize card database with all available cards
  initializeCardDatabase() {
    // All cards are now in a single 'images' directory
    // Common cards (80% of total)
    this.cardDatabase.common = [
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
      // New common cards
      'images/geten.webp',
      'images/alex20armstrong.webp',
      'images/Shinpei-card.webp',
      'images/Friezaaa.webp',
      'images/MetalBat-card.webp',
      'images/VanAugur-card.webp',
      'images/Zamasuuu.webp',
      'images/Mayuri-card.webp',
      'images/ColossialTitan-card.png',
      'images/Igris-card.webp',
      'images/Runge-card.png',
      'images/Mina-card.webp',
      'images/takuma-card.webp',
      'images/lyonvastia.webp',
      'images/Shinji-card.webp',
      'images/Shigaraki.webp',
      'images/konohamaru.webp',
      'images/Kenzo-card.png',
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
      // Additional new common cards
      'images/Noelll.png',
      'images/shino.png',
      'images/Bardooock.png',
      'images/poseidon.png',
      'images/gloxinia.png',
      'images/Gilthunder.png',
      'images/Maki zenen.png',
      'images/Picollooo.png',
      // Additional new common cards
      'images/Danteee.webp',
      'images/tenten.webp',
      'images/Feitan-card.webp',
      'images/uraume-card.webp',
      'images/Akaza-card.webp',
      'images/Denki-card.webp',
      'images/monet.webp',
      'images/zabuza.webp'
    ];

    // Epic cards (15% of total)
    this.cardDatabase.epic = [
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
      // Additional new epic cards
      'images/A4thRaikagee.png',
      'images/Kenzo-card.png',
      'images/Masamichi-card.png',
      'images/ShouBunKun-card.png',
      'images/mahito-card.png',
      'images/Mai-card.png',
      'images/Itadori-card.png',
      // Additional new epic cards
      'images/DiamondJozu.webp',
      'images/Matsumoto-card.webp',
      'images/MomoYaorozu-card.webp',
      'images/Ishida-card.webp',
      'images/Yoruichi-card.webp',
      'images/esdeath.webp',
      'images/Jaw-card.webp',
      'images/BigM.webp',
      'images/Choi-jong-in-.webp',
      'images/judarr.webp',
      'images/Adult-gon-card.webp',
      'images/FemaleTitan-card.webp',
      'images/Aizetsu-card.webp',
      'images/Asui-card.webp',
      'images/Gadjah.webp',
      'images/naobito-card.webp',
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

    // Legendary cards (5% of total)
    this.cardDatabase.legendary = [
      'images/law.webm',
      'images/Vegetto.webm',
      'images/madara.webm',
      'images/NietroCard.webm',
      'images/aizen.webm',
      'images/Hawks.webm',
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
      // New legendary cards
      'images/shikamaru.webm',
      'images/Goku UI.webm',
      // Additional new legendary cards
      'images/whitebeard.webm',
      'images/SakamotoCard.webm',
      'images/GojoCard.webm',
      'images/Gogeta.webm',
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
  }

  // Generate random cards for a player
  generateRandomCards(totalCards = 20) {
    const commonCount = Math.floor(totalCards * 0.85); // 85% common
    const epicLegendaryCount = totalCards - commonCount; // 15% epic+legendary

    const selectedCards = [];
    const usedCards = new Set(); // Track used cards to prevent duplicates

    // Select common cards
    const shuffledCommon = [...this.cardDatabase.common].sort(() => Math.random() - 0.5);
    let commonSelected = 0;
    for (let card of shuffledCommon) {
      if (commonSelected >= commonCount) break;
      if (!usedCards.has(card)) {
        selectedCards.push(card);
        usedCards.add(card);
        commonSelected++;
      }
    }

    // Select epic and legendary cards (combined 15%)
    const epicLegendaryCards = [...this.cardDatabase.epic, ...this.cardDatabase.legendary];
    const shuffledEpicLegendary = [...epicLegendaryCards].sort(() => Math.random() - 0.5);
    let epicLegendarySelected = 0;
    for (let card of shuffledEpicLegendary) {
      if (epicLegendarySelected >= epicLegendaryCount) break;
      if (!usedCards.has(card)) {
        selectedCards.push(card);
        usedCards.add(card);
        epicLegendarySelected++;
      }
    }

    // Shuffle final selection
    const shuffledCards = selectedCards.sort(() => Math.random() - 0.5);
    
    return shuffledCards;
  }

  // Create media element (image or video)
  createMediaElement(url, className, onClick) {
    // Use the URL as-is since all cards are in the images/ directory
    const isWebm = /\.webm(\?|#|$)/i.test(url);
    
    if (isWebm) {
      const video = document.createElement("video");
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.className = className;
      video.style.border = "none";
      video.style.borderRadius = "0px";
      video.style.objectFit = "contain";
      if (onClick) video.onclick = onClick;
      return video;
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.className = className;
      img.style.border = "none";
      img.style.borderRadius = "0px";
      img.style.objectFit = "contain";
      if (onClick) img.onclick = onClick;
      return img;
    }
  }

  // Validate card path and return corrected path
  validateCardPath(path) {
    if (!path || typeof path !== 'string') {
      return null;
    }

    // Convert old paths to new images/ directory structure
    let correctedPath = path;
    
    // Remove any CARD/ prefix
    correctedPath = correctedPath.replace(/^CARD\//, '');
    
    // Convert old directory structure to new images/ structure
    if (correctedPath.startsWith('Common/')) {
      correctedPath = correctedPath.replace('Common/', 'images/');
    } else if (correctedPath.startsWith('Epic/')) {
      correctedPath = correctedPath.replace('Epic/', 'images/');
    } else if (correctedPath.startsWith('Legendray/')) {
      correctedPath = correctedPath.replace('Legendray/', 'images/');
    } else if (!correctedPath.startsWith('images/') && !correctedPath.startsWith('http')) {
      // If it doesn't start with images/ and isn't a full URL, add images/ prefix
      correctedPath = 'images/' + correctedPath;
    }
    
    // Fix common naming inconsistencies
    correctedPath = correctedPath
      .replace(/-card\.(png|webp|webm)/g, '.$1')
      .replace(/_card\.(png|webp|webm)/g, '.$1')
      .replace(/cardo20ppsd\.webp/g, 'cardo20ppsd.webp')
      .replace(/Vegapunk-crad\.webp/g, 'Vegapunk-crad.webp');

    return correctedPath;
  }

  // Clear old localStorage data
  clearOldData() {
    try {
      // Clear old card data that might have wrong paths
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('StrategicPicks') || key.includes('StrategicOrdered')) {
          localStorage.removeItem(key);
          console.log('Cleared old data:', key);
        }
      });
    } catch (e) {
      console.error('Error clearing old data:', e);
    }
  }

  // Load cards from localStorage with fallback
  loadPlayerCards(playerParam) {
    const PICKS_LOCAL_KEY = `${playerParam}StrategicPicks`;
    
    try {
      // Try to load from localStorage first
      const savedPicks = JSON.parse(localStorage.getItem(PICKS_LOCAL_KEY) || '[]');
      
      if (Array.isArray(savedPicks) && savedPicks.length > 0) {
        const cards = savedPicks.map(card => {
          if (typeof card === 'string') {
            return this.validateCardPath(card);
          }
          if (card && card.src) {
            return this.validateCardPath(card.src);
          }
          return null;
        }).filter(Boolean);
        
        if (cards.length > 0) {
          console.log('Loaded cards from localStorage:', cards);
          return cards;
        }
      }
    } catch (e) {
      console.error('Error loading cards from localStorage:', e);
    }

    // Fallback: generate random cards
    console.log('Generating random cards as fallback');
    return this.generateRandomCards(20);
  }

  // Save cards to localStorage
  savePlayerCards(playerParam, cards) {
    const PICKS_LOCAL_KEY = `${playerParam}StrategicPicks`;
    
    try {
      localStorage.setItem(PICKS_LOCAL_KEY, JSON.stringify(cards));
      console.log('Saved cards to localStorage:', cards);
    } catch (e) {
      console.error('Error saving cards to localStorage:', e);
    }
  }

  // Get all available cards by category
  getAllCardsByCategory(category) {
    return this.cardDatabase[category] || [];
  }

  // Get all available cards
  getAllCards() {
    return [
      ...this.cardDatabase.common,
      ...this.cardDatabase.epic,
      ...this.cardDatabase.legendary
    ];
  }
}

// Create global instance
window.cardManager = new CardManager();