// Card Manager for Netlify compatibility
class CardManager {
  constructor() {
    this.cardDatabase = {
      common: [],
      epic: [],
      legendary: [],
      cursed: [],
      rare: [],
      ultimate: []
    };
    this.initializeCardDatabase();
  }

  initializeCardDatabase() {
    // Cursed Cards (from Cursed folder + QG14)
    this.cardDatabase.cursed = [
      'images/QG14.webm',
      'images/Luffy-Nightmare.png',
      'images/Konohamaru.png',
      'images/Kenjaku.png',
      'images/Chopper.png',
      'images/Adult-Gon.png',
      'images/Kokushibo.png'
    ];

    // Epic Cards (from Epic folder)
    this.cardDatabase.epic = [
      'images/A4thRaikagee.png',
      'images/Akainu.png',
      'images/Aokiji.png',
      'images/Aramaki.png',
      'images/Arthur-Pendragon.png',
      'images/Ban.png',
      'images/Bartolomeo.png',
      'images/Big-Mom.png',
      'images/Black-Zetsu.png',
      'images/Buggy.png',
      'images/Cathleen.png',
      'images/Chahe.png',
      'images/Choi-jong-in.png',
      'images/Chuya.png',
      'images/ColossialTitan.png',
      'images/Crocodile.png',
      'images/Dabi.png',
      'images/Dante.png',
      'images/Dazai.png',
      'images/Doflamingo.png',
      'images/Endeavor.png',
      'images/Eri.png',
      'images/Fuegoleon.png',
      'images/Fujitora.png',
      'images/Gaara.png',
      'images/Geto.png',
      'images/Gloxinia.png',
      'images/Go-Gunhee.png',
      'images/GTO.png',
      'images/Hachigen.png',
      'images/Hijikata.png',
      'images/HouKen.png',
      'images/Ichibe.png',
      'images/Ichigo.png',
      'images/Igris.png',
      'images/Iruka.png',
      'images/Johan.png',
      'images/Jotaro.png',
      'images/Judar.png',
      'images/Kabuto.png',
      'images/Kaguya.png',
      'images/Kaito.png',
      'images/Kensei.png',
      'images/Killua.png',
      'images/Koshiina.png',
      'images/Kuma.png',
      'images/Kurama.png',
      'images/Lemillion.png',
      'images/Leorio.png',
      'images/Lille-Baro.png',
      'images/Mansherry.png',
      'images/MaoMao.png',
      'images/Might-Guy.png',
      'images/Min-Byung-Gyu.png',
      'images/Minato.png',
      'images/Nami.png',
      'images/Nana.png',
      'images/Nanami.png',
      'images/Nero.png',
      'images/Orihime.png',
      'images/Oroshimaro.png',
      'images/Pain.png',
      'images/Rayleigh.png',
      'images/Reborn.png',
      'images/Sakura.png',
      'images/Sasuke.png',
      'images/Senjumaru.png',
      'images/Shigaraki.png',
      'images/ShouHeiKun.png',
      'images/Teach.png',
      'images/Tengen.png',
      'images/Tobirama.png',
      'images/Tou.png',
      'images/Tsunade.png',
      'images/Tsunayoshi-Sawada.png',
      'images/Unohana.png',
      'images/Whis.png',
      'images/Yamato.png',
      'images/YoTanWa.png',
      'images/YujiroHanma.png',
      'images/Yumeko-Jabami.png',
      'images/Yusaku.png',
      'images/Yuta.png',
      'images/Zagred.png'
    ];

    // Common Cards (from Common folder) - Batch 1
    this.cardDatabase.common = [
      'images/DragonBB-123.png',
      'images/DragonBB-67.png',
      'images/DragonBB-45.png',
      'images/WatchdogMan.png',
      'images/WarHammer.png',
      'images/Tenma.png',
      'images/Subaru.png',
      'images/SpeedSonic.png',
      'images/Shinichi.png',
      'images/Pakunda.png',
      'images/OuSen.png',
      'images/OuHou.png',
      'images/Ordo.png',
      'images/Kyoukai.png',
      'images/KeiSha.png',
      'images/KaRin.png',
      'images/Jaw.png',
      'images/Benn-Beckman.png',
      'images/ShouBunKun.png',
      'images/Shinpei.png',
      'images/MouTen.png',
      'images/ManGou.png',
      'images/Zohakuten.png',
      'images/Vanesa.png',
      'images/VanAugur.png',
      'images/Urogi.png',
      'images/Tamayo.png',
      'images/Shisui.png',
      'images/Shalapouf.png',
      'images/Sekido.png',
      'images/Panda.png',
      'images/Monet.png',
      'images/Otama.png',
      'images/Marco.png',
      'images/Langris.png',
      'images/Karaku.png',
      'images/Iron.png',
      'images/Kagura.png',
      'images/Ippo.png',
      'images/Hotaru.png',
      'images/Hantengu.png',
      'images/Hancock.png',
      'images/Grimmjow.png',
      'images/Gin-Freecss.png',
      'images/Frieren.png',
      'images/Feitan.png',
      'images/DukeHyou.png',
      'images/Charmyy.png',
      'images/Baraggan.png',
      'images/Aizetsu.png'
    ];

    // Common Cards - Batch 2
    this.cardDatabase.common2 = [
      'images/Zora.png',
      'images/Zeno-kingdom.png',
      'images/Zeff.png',
      'images/Yoshinobu.png',
      'images/Yoruichi.png',
      'images/Yamato.png',
      'images/WitchQueen.png',
      'images/Vista.png',
      'images/Vetto.png',
      'images/Uvogin.png',
      'images/Vanica.png',
      'images/Uub.png',
      'images/Utahime.png',
      'images/Urokodaki.png',
      'images/Ukitake.png',
      'images/Tusk.png',
      'images/Twice.png',
      'images/Trunks.png',
      'images/Toshiro.png',
      'images/Tosen.png',
      'images/Toga.png',
      'images/Tessai.png',
      'images/TienShinhan.png',
      'images/Tamaki.png',
      'images/Takuma.png',
      'images/Susamaru.png',
      'images/Stotz.png',
      'images/Sol.png',
      'images/Smoker.png',
      'images/Silver.png',
      'images/Shukuro-Tsukishima.png',
      'images/Shouyou.png',
      'images/Shizuku.png',
      'images/Shoot.png',
      'images/Shinjuro.png',
      'images/Sentomaru.png',
      'images/Shalnark.png',
      'images/Sea-King.png',
      'images/Sanemi.png',
      'images/Saul.png',
      'images/SaikiK.png',
      'images/Sai.png',
      'images/Sado.png',
      'images/Sabo.png',
      'images/Sabito.png',
      'images/RyoFui.png',
      'images/Rui.png',
      'images/Rojuro.png',
      'images/Robin.png'
    ];

    // Common Cards - Batch 3
    this.cardDatabase.common3 = [
      'images/RinBuKun.png',
      'images/Rill.png',
      'images/RaiDo.png',
      'images/Rikido.png',
      'images/Raditz.png',
      'images/Phinks.png',
      'images/Perospero.png',
      'images/Pedro.png',
      'images/Paragus.png',
      'images/Palm.png',
      'images/PageOne.png',
      'images/Overhaul.png',
      'images/Obanai.png',
      'images/Noell.png',
      'images/Nimaiya.png',
      'images/Nighteye.png',
      'images/Nezuko.png',
      'images/Nejire.png',
      'images/Nemu.png',
      'images/Neji.png',
      'images/Nappa.png',
      'images/Nanao.png',
      'images/Mouri.png',
      'images/MouGou.png',
      'images/Monspeet.png',
      'images/MomoYaorozu.png',
      'images/Momo-JJK.png',
      'images/Mitsuri.png',
      'images/Mina.png',
      'images/Mikasa.png',
      'images/Miguel.png',
      'images/Mezo.png',
      'images/MetalBat.png',
      'images/Merlin.png',
      'images/MeiMei.png',
      'images/Mechamaru.png',
      'images/MasterRoshi.png',
      'images/Masamichi.png',
      'images/Mars.png',
      'images/Makoto.png',
      'images/Maki-Zenen.png',
      'images/Mai.png',
      'images/Ma-Dongwook.png'
    ];

    // Common Cards - Batch 4
    this.cardDatabase.common4 = [
      'images/Komei.png',
      'images/Komamura.png',
      'images/KnuckledDuster.png',
      'images/KIng-SDS.png',
      'images/KingCold.png',
      'images/Kinemon.png',
      'images/Kechizu.png',
      'images/Katsura.png',
      'images/Kansuke.png',
      'images/KanMei.png',
      'images/Kaminari.png',
      'images/Kalluto.png',
      'images/Kale.png',
      'images/Jugo.png',
      'images/Jozu.png',
      'images/Jogo.png',
      'images/Jimbei.png',
      'images/Jack-the-Ripper.png',
      'images/Jack.png',
      'images/Inumaki.png',
      'images/Izuru.png',
      'images/Inosuke.png',
      'images/Ikkaku.png',
      'images/Iida.png',
      'images/Hwang-Dongsoo.png',
      'images/Hizashi.png',
      'images/Hiyori.png',
      'images/Hit.png',
      'images/Heki.png',
      'images/Heiji.png',
      'images/Haschwalth.png',
      'images/Hanzo.png',
      'images/Hanami.png',
      'images/HakuKi.png',
      'images/Gyutaro.png',
      'images/GranTorino.png',
      'images/Gotenks.png',
      'images/Gon.png',
      'images/GoHouMei.png',
      'images/Ginjo.png',
      'images/Gin-Ichimaru.png'
    ];

    // Common Cards - Batch 5 (updated to include all remaining cards)
    this.cardDatabase.common5 = [
      'images/Genthru.png',
      'images/GaiMou.png',
      'images/Fumikage.png',
      'images/Fubuki.png',
      'images/Frost.png',
      'images/Frieza.png',
      'images/Franky-card.png',
      'images/Franklin.png',
      'images/FingerBearer.png',
      'images/FemaleTitan.png',
      'images/Fana.png',
      'images/EiSei.png',
      'images/Eijiro.png',
      'images/Dorothy.png',
      'images/EdgeShot.png',
      'images/Dodoriaa.png',
      'images/Diane-card.png',
      // Additional cards to complete the 286 total
      'images/Kaminari.png',
      'images/Kale.png',
      'images/Jugo.png',
      'images/Jozu.png',
      'images/Jogo.png',
      'images/Jimbei.png',
      'images/Jack-the-Ripper.png',
      'images/Jack.png',
      'images/Inumaki.png',
      'images/Izuru.png',
      'images/Inosuke.png',
      'images/Ikkaku.png',
      'images/Iida.png',
      'images/Hwang-Dongsoo.png',
      'images/Hizashi.png',
      'images/Hiyori.png',
      'images/Hit.png',
      'images/Heki.png',
      'images/Heiji.png',
      'images/Haschwalth.png',
      'images/Hanzo.png',
      'images/Hanami.png',
      'images/HakuKi.png',
      'images/Gyutaro.png',
      'images/GranTorino.png',
      'images/Gotenks.png',
      'images/Gon.png',
      'images/GoHouMei.png',
      'images/Ginjo.png',
      'images/Gin-Ichimaru.png',
      'images/Genthru.png',
      'images/GaiMou.png',
      'images/Fumikage.png',
      'images/Fubuki.png',
      'images/Frost.png',
      'images/Frieza.png',
      'images/Franky-card.png',
      'images/Franklin.png',
      'images/FingerBearer.png',
      'images/FemaleTitan.png',
      'images/Fana.png',
      'images/EiSei.png',
      'images/Eijiro.png',
      'images/Dorothy.png',
      'images/EdgeShot.png',
      'images/Dodoriaa.png',
      'images/Diane-card.png'
    ];

    // Rare Cards (from Rare folder)
    this.cardDatabase.rare = [
      'images/Zeldris.png',
      'images/Zamasu.png',
      'images/Yuno.png',
      'images/Yuki.png',
      'images/Youpi.png',
      'images/Vangeance.png',
      'images/Uraume.png',
      'images/Urahara.png',
      'images/Undine.png',
      'images/Ulquiorra.png',
      'images/Toppo.png',
      'images/Tokito.png',
      'images/Tank.png',
      'images/Stark.png',
      'images/Stain.png',
      'images/Shoko.png',
      'images/Shizune.png',
      'images/Shinobu.png',
      'images/Shinji.png',
      'images/Scopper-Gaban.png',
      'images/Sanji.png',
      'images/Ryuma.png',
      'images/RiShin.png',
      'images/Rhya.png',
      'images/RenPa.png',
      'images/Renji.png',
      'images/Razor.png',
      'images/Piccolo.png',
      'images/Pariston.png',
      'images/Oden.png',
      'images/Nozel.png',
      'images/Nobunaga.png',
      'images/Nobara.png',
      'images/Naobito.png',
      'images/Nacht.png',
      'images/MouBu.png',
      'images/Moria.png',
      'images/Morel.png',
      'images/Momonosuke.png',
      'images/Mob.png',
      'images/Mirko.png',
      'images/Mimosa.png',
      'images/Mihawk.png',
      'images/Meleoron.png',
      'images/Megumi.png',
      'images/Mayuri.png',
      'images/Mahito.png',
      'images/Machi.png',
      'images/Luck.png',
      'images/Lord-Boros.png',
      'images/Liebe.png',
      'images/Kurogiri.png',
      'images/Knuckle.png',
      'images/KiSui.png',
      'images/Kirio.png',
      'images/KingKai.png',
      'images/Kefla.png',
      'images/Karin-Uzumaki.png',
      'images/Jesus-Burgess.png',
      'images/Ishida.png',
      'images/Illumi.png',
      'images/Garo.png',
      'images/Galand.png',
      'images/Gaiche.png',
      'images/Fyodor.png',
      'images/Eraserhead.png',
      'images/Elizabeth-Lione.png',
      'images/Choso.png',
      'images/Best-Jeanist.png',
      'images/Baki.png',
      'images/Asta.png',
      'images/Akiko-Yosano.png'
    ];

    // Ultimate Cards (from Ultimate folder)
    this.cardDatabase.ultimate = [
      'images/LuffyGear5.webm',
      'images/All-For-One.webm',
      'images/Escanor.webm',
      'images/Dio.webm',
      'images/Hashirama.webm',
      'images/Aizen.webm',
      'images/Saitama.webm',
      'images/Queen.webm',
      'images/Madara.webm',
      'images/Yoriichi.webm',
      'images/ZORO.webm'
    ];
  }


  // Generate random cards for a player
  generateRandomCards(totalCards = 20) {
    // If no cards are available, return an empty array
    if (this.getAllCards().length === 0) {
      console.warn('No cards available to generate random selection.');
      return [];
    }

    const selectedCards = [];
    const usedCards = new Set();

    // Dynamic card distribution with updated percentages
    const baseDistribution = {
      common: 0.45,      // 45%
      rare: 0.25,        // 25%
      epic: 0.15,        // 15%
      legendary: 0.08,   // 8%
      ultimate: 0.05,    // 5%
      cursed: 0.02       // 2%
    };

    // Add small random variations to percentages
    const variationFactor = 0.05; // 5% variation
    const dynamicDistribution = {};

    for (const [category, basePercentage] of Object.entries(baseDistribution)) {
      // Generate a random variation between -5% and +5%
      const variation = (Math.random() * 2 - 1) * variationFactor;
      dynamicDistribution[category] = Math.max(0, basePercentage + variation);
    }

    // Normalize to ensure total is 1
    const total = Object.values(dynamicDistribution).reduce((a, b) => a + b, 0);
    for (const category in dynamicDistribution) {
      dynamicDistribution[category] /= total;
    }

    // Convert to card counts
    const cardDistribution = {};
    for (const [category, percentage] of Object.entries(dynamicDistribution)) {
      cardDistribution[category] = Math.floor(totalCards * percentage);
    }

    // Adjust for rounding errors
    const totalDistributed = Object.values(cardDistribution).reduce((a, b) => a + b, 0);
    if (totalDistributed < totalCards) {
      cardDistribution.common += (totalCards - totalDistributed);
    }

    console.log('🎲 Dynamic Card Distribution:', cardDistribution);

    // Distribute card selection across available card types
    const cardTypes = [
      { type: this.cardDatabase.common, name: 'common', count: cardDistribution.common },
      { type: this.cardDatabase.rare, name: 'rare', count: cardDistribution.rare },
      { type: this.cardDatabase.epic, name: 'epic', count: cardDistribution.epic },
      { type: this.cardDatabase.legendary, name: 'legendary', count: cardDistribution.legendary },
      { type: this.cardDatabase.ultimate, name: 'ultimate', count: cardDistribution.ultimate },
      { type: this.cardDatabase.cursed, name: 'cursed', count: cardDistribution.cursed }
    ];

    // Shuffle card types to add more randomness
    const shuffledTypes = cardTypes
      .filter(typeObj => typeObj.type.length > 0 && typeObj.count > 0)
      .sort(() => Math.random() - 0.5);

    // If no card types have cards, return an empty array
    if (shuffledTypes.length === 0) {
      console.warn('No card types have any cards.');
      return [];
    }

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

    // Distribute cards across types
    for (const typeObj of shuffledTypes) {
      // Randomly choose a shuffle method
      const shuffleMethod = shuffleMethods[Math.floor(Math.random() * shuffleMethods.length)];
      
      // Shuffle the current card type
      const shuffledCards = shuffleMethod([...typeObj.type]);
      
      // Select cards from this type
      for (const card of shuffledCards) {
        if (selectedCards.length >= totalCards) break;
        
        if (!usedCards.has(card)) {
          selectedCards.push(card);
          usedCards.add(card);
        }
      }
    }

    // If we still haven't reached the total number of cards, fill with random cards
    while (selectedCards.length < totalCards) {
      const allCards = this.getAllCards();
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      
      if (!usedCards.has(randomCard)) {
        selectedCards.push(randomCard);
        usedCards.add(randomCard);
      }
    }

    // Final shuffle
    return selectedCards.sort(() => Math.random() - 0.5);
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
      ...this.cardDatabase.legendary,
      ...this.cardDatabase.cursed,
      ...this.cardDatabase.rare,
      ...this.cardDatabase.ultimate
    ];
  }
}

// Create global instance
window.cardManager = new CardManager();