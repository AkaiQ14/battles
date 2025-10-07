// Card Manager for Netlify compatibility
class CardManager {
  constructor() {
    this.cardDatabase = {
      common: [],
      epic: [],
      legendary: [],
      mythical: []
    };
    this.initializeCardDatabase();
  }

  // Initialize card database with all available cards
  initializeCardDatabase() {
    // Epic Cards (from Epic folder) - All cards with images/ path
    this.cardDatabase.epic = [
      'images/Adult-gon-card.png',
      'images/Akaino-card.png',
      'images/Aokiji.png',
      'images/Aramaki-card .png',
      'images/Arthur-card.png',
      'images/Ban-card.png',
      'images/bartolomeo-card.png',
      'images/Beerus-card.png',
      'images/Big mm.png',
      'images/Black_Zetsu.webp',
      'images/Buggy-card.png',
      'images/Cathleen-card .png',
      'images/Chahe_solo.png',
      'images/Choi-jong-in-crda.png',
      'images/Chuya-card.png',
      'images/ColossialTitan-card.png',
      'images/Dabi-card.png',
      'images/Danteee.png',
      'images/dazai-card.png',
      'images/DragonBB-123-card.png',
      'images/DragonBB-45-card.png',
      'images/DragonBB-67-card.png',
      'images/Endeavor-card.png',
      'images/eri.webp',
      'images/Estarossa-card .png',
      'images/Fuegoleonn .png',
      'images/Fujitora-card.png',
      'images/gaara.webp',
      'images/Geto-card.png',
      'images/Go-Gunhee-card.png',
      'images/GTOCard.png',
      'images/Hachigen-card.png',
      'images/Hijikata.png',
      'images/HouKen-card .png',
      'images/Ichibe-card.png',
      'images/Igris-card.png',
      'images/irukaa.webp',
      'images/Itchigo-card .png',
      'images/Johan-card.png',
      'images/Jotaro-card.png',
      'images/kabuto.webp',
      'images/Kaguya.webp',
      'images/Kaito-card .png',
      'images/kenjaku-card.png',
      'images/Kensei-card.png',
      'images/Kizaru-card .png',
      'images/koshiina.webp',
      'images/KudoShinichi-card.png',
      'images/Kuma-card.png',
      'images/kurama.webp',
      'images/Law-card.png',
      'images/Lemillion-card.png',
      'images/Leorio-card.png',
      'images/Lille-baroo-card.png',
      'images/Mereoleona-card.png',
      'images/might_guy.webp',
      'images/Nami-card.png',
      'images/Nana-card.png',
      'images/nanami-card.png',
      'images/Nero-card.png',
      'images/oroshimaro.webp',
      'images/Pitou-card.png',
      'images/Queen-card.png',
      'images/Rayleighhhhh.png',
      'images/sakura.webp',
      'images/Senjumaru-card.png',
      'images/Shenron-card.png',
      'images/Shigaraki.png',
      'images/ShouHeiKun-card .png',
      'images/Teach-card.png',
      'images/Tengen-card.png',
      'images/Tou-card.png',
      'images/tsunadee.webp',
      'images/Unohana-card.png',
      'images/Vegapunk-crad.png',
      'images/Whisss.png',
      'images/yamatoo.webp',
      'images/YoTanWa-card.png',
      'images/YujiroHanma-card.png',
      'images/Yusaku-card.png',
      'images/Yusaku-card.webp',
      'images/yuta-card.png',
      'images/Zagred-card.png'
    ];

    // Legendary Cards (from legendary folder) - All cards with images/ path
    this.cardDatabase.legendary = [
      'images/aizen.webm',
      'images/AizenVoCrowCard.webm',
      'images/akai.webm',
      'images/AllForOneCard.webm',
      'images/AllMightCard.webm',
      'images/AlocardCard.webm',
      'images/AyanokojiCard.webm',
      'images/BakugoCard.webm',
      'images/Beerus-card.webm',
      'images/Beru.webm',
      'images/Broly.webm',
      'images/CellCard.webm',
      'images/ChrolloCard.webm',
      'images/DioCard.webm',
      'images/ErenCard.webm',
      'images/Escanor.webm',
      'images/GarpCard.webm',
      'images/Gilgamesh.webm',
      'images/GinCard.webm',
      'images/GintokiCard.webm',
      'images/Gogeta.webm',
      'images/GohanBeastCard.webm',
      'images/GojoCard.webm',
      'images/Goku UI.webm',
      'images/GokuBlack.webm',
      'images/GokuSs4Card.webm',
      'images/Hawks.webm',
      'images/Hisoka.webm',
      'images/IppoCard.webm',
      'images/Itachi.webm',
      'images/jiraya.webm',
      'images/joker.webm',
      'images/Julius.webm',
      'images/KaidoCard.webm',
      'images/KaitoKidCard.webm',
      'images/kakashi.webm',
      'images/KankiCard.webm',
      'images/kyurakCard.webm',
      'images/law.webm',
      'images/lecht.webm',
      'images/light.webm',
      'images/LuffyGear5Card.webm',
      'images/madara.webm',
      'images/MakimaCard.webm',
      'images/Medoria.webm',
      'images/MeliodasCard.webm',
      'images/MeruemCard.webm',
      'images/MosachiCard.webm',
      'images/MozanCard.webm',
      'images/naruto.webm',
      'images/NietroCard.webm',
      'images/obito.webm',
      'images/OukiCard.webm',
      'images/PrincHataCard.webm',
      'images/queen.webm',
      'images/Ranpo.webm',
      'images/RengokuCard.webm',
      'images/RibokuCard.webm',
      'images/roger.webm',
      'images/rosel.webm',
      'images/SaitamaCard.webm',
      'images/SakamotoCard.webm',
      'images/sanji.webm',
      'images/ShanksCard.webm',
      'images/SilverCard.webm',
      'images/smileyCard.webm',
      'images/SukunaCard.webm',
      'images/Sung Jinwoo.webm',
      'images/TakamuraCard.webm',
      'images/TodoCard.webm',
      'images/TojiCard.webm',
      'images/UlquiorraCard.webm',
      'images/UmibozoCard.webm',
      'images/UtsuroCard.webm',
      'images/Vegeta.webm',
      'images/Vegetto.webm',
      'images/VermothCard.webm',
      'images/WalkerCard.webm',
      'images/whitebeard.webm',
      'images/X.webm',
      'images/yamamoto.webm',
      'images/yamato.webm',
      'images/YamiCard.webm',
      'images/YhwachCard.webm',
      'images/YuruchiCard.webm',
      'images/zaraki.webm',
      'images/ZenoCard.webm',
      'images/ZenonCard.webm',
      'images/Zoro.webm'
    ];

    // Mythical Cards (special rare cards)
    this.cardDatabase.mythical = [
      'images/QG14.webm'
    ];

    // Common Cards (remaining cards from images folder)
    this.cardDatabase.common = [
      'images/A4thRaikagee.png',
      'images/ace.png',
      'images/Aizetsu-card.png',
      'images/Akaii.png',
      'images/Akari-card.png',
      'images/Akaza-card.png',
      'images/Akutagawa-card.png',
      'images/alex20armstrong.webp',
      'images/Alluka-card.png',
      'images/alya.webp',
      'images/Android17-card.png',
      'images/Android18-card.png',
      'images/ArmorTitan-card.png',
      'images/Asta.webm',
      'images/Asui-card.png',
      'images/Atsushi.png',
      'images/Atsuya-card.png',
      'images/Bajio-card.png',
      'images/Baki-card.png',
      'images/Bang-card.png',
      'images/Baraggan-card.png',
      'images/Baran-card.png',
      'images/BazzB-card.png',
      'images/BeastKing-card.png',
      'images/BeastTitan aot.png',
      'images/benn-beckman-card.png',
      'images/Bepo-card.png',
      'images/Bigm.png',
      'images/Bisky-card.png',
      'images/Brook-card.png',
      'images/brook.png',
      'images/Btakuya-card.png',
      'images/Buu-card.png',
      'images/caesar-card.png',
      'images/Carasuma.png',
      'images/cardoppsd.png',
      'images/CartTitan-card.png',
      'images/cavendish-card.png',
      'images/Charllotteeeee.png',
      'images/Charmyy.png',
      'images/Cheetu-card.png',
      'images/Choi-jong-in-.webp',
      'images/Chopper-card.png',
      'images/Choso-card.png',
      'images/cobra-card.png',
      'images/Conan.png',
      'images/CouTou-card.png',
      'images/Crocodile-card.png',
      'images/Crocodile.png',
      'images/crocus-card.png',
      'images/Dadan-card.png',
      'images/Dagon-card.png',
      'images/Denki-card.png',
      'images/Derieri-card.png',
      'images/DiamondJozu OP.png',
      'images/DiamondJozu.webp',
      'images/Diane-card.png',
      'images/Dodoriaa.png',
      'images/Doflamingo-card.png',
      'images/Dorothyyy.png',
      'images/DukeHyou-card.png',
      'images/EdgeShot-card.png',
      'images/edward elric.png',
      'images/Eijiro-card.png',
      'images/EiSei-card.png',
      'images/Elfaria Albis.png',
      'images/Elizabeth.png',
      'images/Endeavor.png',
      'images/Ereser-card.png',
      'images/esdeath.webp',
      'images/Eso-card.png',
      'images/Fanaaa.png',
      'images/Feitan-card.png',
      'images/FemaleTitan-card.png',
      'images/FingerBearer-card.png',
      'images/Fobuki-card.png',
      'images/franklin_card.png',
      'images/Franky-card.png',
      'images/Frierennnnn.png',
      'images/Friezaaa.png',
      'images/Frosttt.png',
      'images/Fubuki.webm',
      'images/Fumikageeeee.png',
      'images/Fyodor-card.png',
      'images/Gadjah.webp',
      'images/Gaichee.png',
      'images/GaiMou-card.png',
      'images/Galand-card.png',
      'images/Ganju-card.png',
      'images/Garou-card.png',
      'images/Genthru-card.png',
      'images/geten.webp',
      'images/ghiaccio.png',
      'images/Gilthunder.png',
      'images/Gin-freecss-card.png',
      'images/Gin-Ichimaru-card.png',
      'images/Ginjo-card.png',
      'images/glacier.webp',
      'images/gloxinia.png',
      'images/GoHouMei-card.png',
      'images/Gon-card.png',
      'images/Gordonn.png',
      'images/Gotenkss.png',
      'images/gounji.png',
      'images/GranTorino-card.png',
      'images/Grimmjow-card.png',
      'images/Gyutaro-card.png',
      'images/HakuKi-card.png',
      'images/Hanami-card.png',
      'images/Hancock-card.png',
      'images/Hanta-card.png',
      'images/Hantengu-card.png',
      'images/Hanzo(HxH)-card.png',
      'images/Haruta jjk.png',
      'images/Haschwalth-card.png',
      'images/Hashirama.webm',
      'images/Hawk-card.png',
      'images/Heiji-card.png',
      'images/Heki-card.png',
      'images/hinata.png',
      'images/Hinatsuri-card.png',
      'images/Hisagi-card.png',
      'images/Hittt.png',
      'images/Hiyori-card.png',
      'images/Hizashi-card.png',
      'images/Hotaru-card.png',
      'images/Hwang-Dongsoo-card.png',
      'images/Iida-card.png',
      'images/Ikkaku-card.png',
      'images/Illumi-card.png',
      'images/ino.png',
      'images/Inosuke-card.png',
      'images/Inumaki-card.png',
      'images/Ippo-card.png',
      'images/Iron-card.png',
      'images/Isaac mcdougal.png',
      'images/Ishida-card.png',
      'images/Isshin-card.png',
      'images/Itadori-card.png',
      'images/Izuru-card.png',
      'images/Jack-card.png',
      'images/Jackkk.png',
      'images/Jaw-card.png',
      'images/Jeanist-card.png',
      'images/Jesus-burgess-card.png',
      'images/Jimbei-card.png',
      'images/Jirobo.webp',
      'images/Jogo-card.png',
      'images/Jozi jjk.png',
      'images/judarr.webp',
      'images/jugo.png',
      'images/julius wistoria.png',
      'images/Kaguraaaa.png',
      'images/Kalee.png',
      'images/Kalluto-card.png',
      'images/Kanae solo.png',
      'images/KanMei-card.png',
      'images/Karaku-card.png',
      'images/KaRin-card.png',
      'images/Katsura.png',
      'images/Kazuho-card.png',
      'images/kechizu-card.png',
      'images/Keflaa.png',
      'images/KeiSha-card.png',
      'images/Kenzo-card.png',
      'images/Kid-card.png',
      'images/killua.webm',
      'images/kimimaro.png',
      'images/Kinemon-card.png',
      'images/KIng-SDS-card.png',
      'images/King(OPun)-card.png',
      'images/KingColdd.png',
      'images/Kingkaiii.png',
      'images/Kirach.png',
      'images/Kirachhh.png',
      'images/Kirio-card.png',
      'images/KiSui-card.png',
      'images/Knov-card.png',
      'images/Knuckle-card.png',
      'images/KnuckledDuster-card.png',
      'images/Koichi-card.png',
      'images/Koji-card.png',
      'images/Komamura-card.png',
      'images/Komugi-card.png',
      'images/konan.png',
      'images/konohamaru.webp',
      'images/kota izumi.png',
      'images/Krilin-card.png',
      'images/Krilin-card.webp',
      'images/Kukoshibo-card.png',
      'images/Kurapika-card.png',
      'images/kurenai.png',
      'images/Kurogiri-card.png',
      'images/Kyoga-card.png',
      'images/Kyogai-card.png',
      'images/Kyoukai-card.png',
      'images/Langriiss.png',
      'images/laxus.png',
      'images/Leo-card.png',
      'images/Levi-card.png',
      'images/Liebeee.png',
      'images/Lillyyyyy.png',
      'images/LordBorossss.png',
      'images/Luck.png',
      'images/lumiere silvamillion.png',
      'images/lyon vastia.png',
      'images/Ma-Dongwook-card.png',
      'images/Machi-card.png',
      'images/Magna.png',
      'images/mahito-card.png',
      'images/Mahoraga.png',
      'images/Mai-card.png',
      'images/Makio-card.png',
      'images/ManGou-card.png',
      'images/mansherry.png',
      'images/Marco-card.png',
      'images/Marsss.png',
      'images/Masamichi-card.png',
      'images/Mashle -card.png',
      'images/MasterRoshi-card.png',
      'images/Matsumoto-card.png',
      'images/Mayuri-card.png',
      'images/Mechamaru-card.png',
      'images/megumi-card.png',
      'images/MeiMei-card.png',
      'images/Melascula-card.png',
      'images/Meleoron-card.png',
      'images/Merlin-card.png',
      'images/MetalBat-card.png',
      'images/Mezo-card.png',
      'images/miguel-card.png',
      'images/mihawk.png',
      'images/Mikasa-card.png',
      'images/Mimozaaa.png',
      'images/Min-Byung-Gyu-card.png',
      'images/Mina-card.png',
      'images/minato.png',
      'images/Miruku bnha.png',
      'images/Mitsuri-card.png',
      'images/Miwa-card.png',
      'images/MobPsycho-card.png',
      'images/Momo-hinamori-card.png',
      'images/Momo(jjk)-card.png',
      'images/Momonosuke OP.png',
      'images/MomoYaorozu-card.png',
      'images/monet.webp',
      'images/Monspeet-card.png',
      'images/Morel-card.png',
      'images/Moria-card.png',
      'images/MouBu-card.png',
      'images/MouGou-card.png',
      'images/MouTen-card.png',
      'images/MrSatan-card.png',
      'images/Nachttt.png',
      'images/Nachttt.webp',
      'images/Nami.webp',
      'images/Nanao-card.png',
      'images/Nanika-card.png',
      'images/naobito-card.png',
      'images/naobito-card.webp',
      'images/Nappaaaa.png',
      'images/Neiji.webm',
      'images/Nejire-card.png',
      'images/Nemu-card.png',
      'images/Nezuko-card.png',
      'images/Nighteye-card.png',
      'images/Nimaiya-card.png',
      'images/Nobara-card.png',
      'images/Nobunaga-card.png',
      'images/Noelll.png',
      'images/Nozelll.png',
      'images/Obanai-card.png',
      'images/Oden-card.png',
      'images/Okabe-card.png',
      'images/Ordo-card.png',
      'images/Orihime-card.png',
      'images/Otama-card.png',
      'images/OuHou-card.png',
      'images/OuSen-card.png',
      'images/Overhaul-card.png',
      'images/PageOne-card.png',
      'images/Pakunda-card.png',
      'images/Palm-card.png',
      'images/Pan-card.png',
      'images/Panda-card.png',
      'images/Paragusss.png',
      'images/Pariston-card.png',
      'images/Pedro-card.png',
      'images/perospero-card.png',
      'images/Phinks-card.png',
      'images/Picollooo.png',
      'images/pizarro.webp',
      'images/poseidon.png',
      'images/qg14-Card-Clash-logo.png',
      'images/qg14-Card-Clash-logo.webp',
      'images/QG14Background.png',
      'images/QG14Background.webp',
      'images/Raditzz.png',
      'images/RaiDo kingdom.png',
      'images/Renji-card.png',
      'images/Renpa-card.png',
      'images/Rhyaa.png',
      'images/Rika-card.png',
      'images/Rikido-card.png',
      'images/Rilll.png',
      'images/rin.png',
      'images/RinBuKun-card.png',
      'images/Robin-card.png',
      'images/Rojuro-card.png',
      'images/Roy Mustang.png',
      'images/Rozor-card.png',
      'images/Rui-card.png',
      'images/Rukia-card.png',
      'images/Runge-card.png',
      'images/RyoFui-card.png',
      'images/Ryuma-zombi-card.png',
      'images/Sabito-card.png',
      'images/Sabo-card.png',
      'images/Sado-card.png',
      'images/sai.png',
      'images/SaikiK-card.png',
      'images/sakura.webp',
      'images/Sanemi-card.png',
      'images/Sanji-card.png',
      'images/sasukee.webp',
      'images/saul-card.png',
      'images/Scopper_gaban_OP.png',
      'images/Sea king opu.png',
      'images/SeiKai-card.png',
      'images/Sekido-card.png',
      'images/Sekkeee.png',
      'images/Senritsu-card.png',
      'images/Sentomaru-card.png',
      'images/shaka-card.png',
      'images/Shalapouf-card.png',
      'images/Shalnark-card.png',
      'images/shikamaru.webm',
      'images/Shin-card.png',
      'images/Shinichi-card.png',
      'images/Shinji-card.png',
      'images/Shinjuro-card.png',
      'images/shino.png',
      'images/Shinobu-card.png',
      'images/Shinpei-card.png',
      'images/Shisui.png',
      'images/Shizuku-card.png',
      'images/shoko-card.png',
      'images/Shoot-card.png',
      'images/ShouBunKun-card.png',
      'images/Shukuro-tsukishima-card.png',
      'images/silverfullbuster.webp',
      'images/Smoker-card.png',
      'images/SoiFon-card.png',
      'images/Sollll.png',
      'images/SpeedSonic-card.png',
      'images/Stain-card.png',
      'images/Stark-card.png',
      'images/sting eucliffe.png',
      'images/Stotz-card.png',
      'images/Subaru-card.png',
      'images/Suma-card.png',
      'images/Sung chi solo.png',
      'images/Susamaru-card.png',
      'images/suzuno.png',
      'images/takuma-card.png',
      'images/Tamaki-card.png',
      'images/Tamayo-card.png',
      'images/Tanjiro-card.png',
      'images/Tank-card.png',
      'images/Tatsunaki-card.png',
      'images/temari.webp',
      'images/Tenma-card.png',
      'images/tenten.webp',
      'images/Tessai-card.png',
      'images/Tier Harribel.png',
      'images/TienShinhan-card.png',
      'images/Todoroki.png',
      'images/tobirama.png',
      'images/Ur.png',
      'images/utahime-card.png',
      'images/Uvogin-card.png',
      'images/Vengeance.png',
      'images/Vista-card.png',
      'images/WarHammerTitan-card.png',
      'images/Yoo-Jinho-card.png',
      'images/Yunoo.png',
      'images/yuki-card.png',
      'images/Zamasuuu.webp',
      'images/Zeo Thorzeus.png',
      'images/Zeno kingdom.png',
      'images/zetsu.png',
      'images/Zohakuten.png',
      'images/zaratras.png',
      'images/Zenitsu.webm',
      'images/zoro.webm'
    ];
  }

  // Generate random cards for a player
  generateRandomCards(totalCards = 20) {
    const commonCount = Math.floor(totalCards * 0.90); // 90% common
    const epicLegendaryCount = Math.floor(totalCards * 0.10); // 10% epic+legendary
    const mythicalCount = totalCards - commonCount - epicLegendaryCount; // Ultra rare mythical (0.1% chance)

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

    // Select epic and legendary cards (combined 10%)
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

    // Select mythical cards (ULTRA RARE - almost never appears!)
    // Only appears in very rare cases when totalCards is large enough
    const shuffledMythical = [...this.cardDatabase.mythical].sort(() => Math.random() - 0.5);
    let mythicalSelected = 0;
    
    // Ultra rare chance: only if we have enough cards AND random chance
    const ultraRareChance = Math.random() < 0.001; // 0.1% chance
    if (mythicalCount > 0 && ultraRareChance) {
      for (let card of shuffledMythical) {
        if (mythicalSelected >= mythicalCount) break;
        if (!usedCards.has(card)) {
          selectedCards.push(card);
          usedCards.add(card);
          mythicalSelected++;
        }
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
      ...this.cardDatabase.legendary,
      ...this.cardDatabase.mythical
    ];
  }
}

// Create global instance
window.cardManager = new CardManager();