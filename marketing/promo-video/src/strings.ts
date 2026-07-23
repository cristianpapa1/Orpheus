// All promo copy, per language. On-screen strings (STRINGS) + spoken narration
// (VO_LINES) + the native ElevenLabs voice per language (VOICE_BY_LOCALE).
// Constant tokens (brand names, @handles, numbers, URLs, dates) are NOT here —
// they stay literal in the scenes.

export const LOCALES = ["en", "fr", "pt", "de", "ja", "zh", "ar", "ru", "it"] as const;
export type Locale = (typeof LOCALES)[number];
export const RTL: Locale[] = ["ar"];

/** Native female narrator voice per language (ElevenLabs library). */
export const VOICE_BY_LOCALE: Record<Locale, string> = {
  en: "EXAVITQu4vr4xnSDxMaL", // Sarah — mature, reassuring
  fr: "FvmvwvObRqIHojkEGh5N", // Adina — welcoming
  pt: "RGymW84CSmfVugnA5tvA", // Roberta — smooth, confident (pt-BR)
  de: "uvysWDLbKpA4XvpD3GI6", // Leonie — clear, engaging
  ja: "ngvNHfiCrXLPAHcTrZK1", // Aki — friendly, clear, natural
  zh: "r6qgCCGI7RWKXCagm158", // Anna Su — trustworthy, clear
  ar: "w4LX7bK479eHGM1k15Em", // Habibah — modern standard Arabic
  ru: "ymDCYd8puC7gYjxIamPt", // Marina — soft, clear, warm
  it: "Dzlw1nIlAqiOOW6J7qo1", // Chiara — soft, inviting
};

export const TTS_MODEL = "eleven_multilingual_v2";

type Tr = Record<Locale, string>;

// On-screen copy, authored per key (all languages together for consistency).
const T = {
  // ── opening messages ──
  m1a: { en: "Tired of generic platforms like", fr: "Fatigué des plateformes génériques comme", pt: "Cansado de plataformas genéricas como", de: "Genug von generischen Plattformen wie", ja: "作品を発表・販売するのに、", zh: "厌倦了用", ar: "سئمت من منصات عامة مثل", ru: "Устали от типовых платформ вроде", it: "Stanco di piattaforme generiche come" },
  m1b: { en: "to publish and sell your art?", fr: "pour publier et vendre votre art ?", pt: "para publicar e vender sua arte?", de: "um deine Kunst zu veröffentlichen und zu verkaufen?", ja: "のような汎用プラットフォームに疲れていませんか？", zh: "这类通用平台来发布和售卖你的作品？", ar: "لنشر فنك وبيعه؟", ru: "для публикации и продажи своего искусства?", it: "per pubblicare e vendere la tua arte?" },
  m2a: { en: "Here we're building a", fr: "Ici, nous bâtissons une", pt: "Aqui estamos construindo uma", de: "Hier bauen wir eine", ja: "ここで私たちは、創作に注がれた才能と努力にふさわしい", zh: "我们正在打造一个", ar: "نحن هنا نبني", ru: "Здесь мы строим", it: "Qui stiamo costruendo una" },
  m2mid: { en: "social community", fr: "communauté sociale", pt: "comunidade social", de: "soziale Gemeinschaft", ja: "ソーシャルコミュニティ", zh: "社交社区", ar: "مجتمعًا اجتماعيًا", ru: "социальное сообщество", it: "comunità sociale" },
  m2b: { en: "worthy of the talent and effort behind your creations.", fr: "à la hauteur du talent et des efforts derrière vos créations.", pt: "à altura do talento e do esforço por trás das suas criações.", de: "die dem Talent und der Mühe hinter deinen Werken gerecht wird.", ja: "をつくっています。", zh: "配得上你作品背后的才华与付出。", ar: "يليق بالموهبة والجهد وراء إبداعاتك.", ru: "достойное таланта и труда за вашими работами.", it: "all'altezza del talento e dell'impegno dietro le tue creazioni." },

  // ── generic UI ──
  act: { en: "Act", fr: "Agir", pt: "Ações", de: "Aktion", ja: "操作", zh: "操作", ar: "إجراء", ru: "Действия", it: "Azioni" },
  newPost: { en: "New Post", fr: "Nouveau", pt: "Nova publicação", de: "Neuer Beitrag", ja: "新規投稿", zh: "新帖", ar: "منشور جديد", ru: "Новый пост", it: "Nuovo post" },
  profile: { en: "Profile", fr: "Profil", pt: "Perfil", de: "Profil", ja: "プロフィール", zh: "个人主页", ar: "الملف", ru: "Профиль", it: "Profilo" },

  // ── nav tabs (Atelier) ──
  navFeed: { en: "Feed", fr: "Fil", pt: "Feed", de: "Feed", ja: "フィード", zh: "动态", ar: "الرئيسية", ru: "Лента", it: "Feed" },
  navHeroes: { en: "Heroes", fr: "Heroes", pt: "Heroes", de: "Heroes", ja: "Heroes", zh: "Heroes", ar: "Heroes", ru: "Heroes", it: "Heroes" },
  navGroups: { en: "Groups", fr: "Groupes", pt: "Grupos", de: "Gruppen", ja: "グループ", zh: "群组", ar: "المجموعات", ru: "Группы", it: "Gruppi" },
  navChat: { en: "Chat", fr: "Messages", pt: "Chat", de: "Chat", ja: "チャット", zh: "私信", ar: "المحادثة", ru: "Чат", it: "Chat" },
  navHome: { en: "Home", fr: "Accueil", pt: "Início", de: "Start", ja: "ホーム", zh: "首页", ar: "الرئيسية", ru: "Главная", it: "Home" },
  navBrowse: { en: "Browse", fr: "Explorer", pt: "Explorar", de: "Entdecken", ja: "見つける", zh: "浏览", ar: "تصفّح", ru: "Обзор", it: "Esplora" },
  navSearch: { en: "Search", fr: "Rechercher", pt: "Buscar", de: "Suchen", ja: "検索", zh: "搜索", ar: "بحث", ru: "Поиск", it: "Cerca" },
  navSell: { en: "Sell", fr: "Vendre", pt: "Vender", de: "Verkaufen", ja: "売る", zh: "出售", ar: "بيع", ru: "Продать", it: "Vendi" },

  // ── categories ──
  catWriting: { en: "Writing & Poetry", fr: "Écriture & Poésie", pt: "Escrita & Poesia", de: "Text & Poesie", ja: "文章・詩", zh: "写作与诗歌", ar: "الكتابة والشِّعر", ru: "Тексты и поэзия", it: "Scrittura & Poesia" },
  catVisual: { en: "Visual Art", fr: "Art visuel", pt: "Arte visual", de: "Bildende Kunst", ja: "ビジュアルアート", zh: "视觉艺术", ar: "الفنون البصرية", ru: "Изобразительное искусство", it: "Arte visiva" },
  catMusic: { en: "Music", fr: "Musique", pt: "Música", de: "Musik", ja: "音楽", zh: "音乐", ar: "الموسيقى", ru: "Музыка", it: "Musica" },
  catFilm: { en: "Film", fr: "Cinéma", pt: "Cinema", de: "Film", ja: "映像", zh: "影像", ar: "السينما", ru: "Кино", it: "Cinema" },
  catPhoto: { en: "Photography", fr: "Photographie", pt: "Fotografia", de: "Fotografie", ja: "写真", zh: "摄影", ar: "التصوير", ru: "Фотография", it: "Fotografia" },
  catHandmade: { en: "Handmade", fr: "Fait main", pt: "Feito à mão", de: "Handgemacht", ja: "手仕事", zh: "手作", ar: "صناعة يدوية", ru: "Ручная работа", it: "Fatto a mano" },

  // ── feed sample content ──
  poemTitle: { en: "O Captain! My Captain!", fr: "Ô Capitaine ! Mon Capitaine !", pt: "Ó Capitão! Meu Capitão!", de: "O Kapitän! Mein Kapitän!", ja: "おお船長、わが船長よ", zh: "啊，船长！我的船长！", ar: "أيها القبطان! يا قبطاني!", ru: "О Капитан! Мой Капитан!", it: "O Capitano! Mio Capitano!" },
  poemBody: { en: "The ship has weathered every rack, the prize we sought is won…", fr: "Le navire a bravé chaque écueil, le prix tant convoité est gagné…", pt: "O navio venceu cada tormenta, o prêmio que buscávamos é nosso…", de: "Das Schiff hat jeden Sturm bestanden, der ersehnte Preis ist unser…", ja: "船はあらゆる嵐を越え、求めた勝利をつかんだ…", zh: "航船已渡尽惊涛骇浪，我们追寻的荣光已到手…", ar: "لقد اجتازت السفينة كل الأهوال، ونلنا الجائزة التي سعينا إليها…", ru: "Корабль прошёл сквозь все бури, желанный приз завоёван…", it: "La nave ha superato ogni tempesta, il premio cercato è vinto…" },
  capStarry: { en: "Starry night, in motion.", fr: "Nuit étoilée, en mouvement.", pt: "Noite estrelada, em movimento.", de: "Sternennacht, in Bewegung.", ja: "星月夜、動き出す。", zh: "星夜，在流动。", ar: "ليلة مرصّعة بالنجوم، في حركة.", ru: "Звёздная ночь в движении.", it: "Notte stellata, in movimento." },
  musicTitle: { en: "Nocturne Sessions — new EP", fr: "Nocturne Sessions — nouvel EP", pt: "Nocturne Sessions — novo EP", de: "Nocturne Sessions — neue EP", ja: "Nocturne Sessions — 新EP", zh: "Nocturne Sessions — 新EP", ar: "Nocturne Sessions — إصدار جديد", ru: "Nocturne Sessions — новый EP", it: "Nocturne Sessions — nuovo EP" },
  musicBody: { en: "Six tracks recorded live. Listen through, then find it on Astelier.", fr: "Six titres enregistrés en live. Écoutez, puis trouvez-le sur Astelier.", pt: "Seis faixas gravadas ao vivo. Ouça e depois encontre na Astelier.", de: "Sechs live aufgenommene Tracks. Reinhören, dann auf Astelier finden.", ja: "ライブ録音の6曲。聴いてみて、Astelierで手に入れよう。", zh: "六首现场录制。听完，就去 Astelier 找它。", ar: "ست مقطوعات مسجّلة حيًّا. استمع إليها ثم جدها على Astelier.", ru: "Шесть треков, записанных вживую. Послушайте — и найдите на Astelier.", it: "Sei brani registrati dal vivo. Ascolta, poi trovalo su Astelier." },
  filmBody: { en: "Teaser — one long take.", fr: "Teaser — un seul plan-séquence.", pt: "Teaser — um único plano-sequência.", de: "Teaser — eine einzige Plansequenz.", ja: "予告編 — ワンカットの長回し。", zh: "预告 — 一镜到底。", ar: "مقطع تشويقي — لقطة واحدة طويلة.", ru: "Тизер — один длинный дубль.", it: "Teaser — un unico piano sequenza." },
  photoBody: { en: "Salt & light.", fr: "Sel & lumière.", pt: "Sal & luz.", de: "Salz & Licht.", ja: "塩と光。", zh: "盐与光。", ar: "ملح وضوء.", ru: "Соль и свет.", it: "Sale & luce." },
  handTitle: { en: "Risograph set — 12 prints", fr: "Série risographie — 12 tirages", pt: "Série risografia — 12 impressões", de: "Risographie-Set — 12 Drucke", ja: "リソグラフ集 — 12枚", zh: "孔版印刷套装 — 12 张", ar: "مجموعة ريزوغراف — 12 نسخة", ru: "Ризограф-набор — 12 оттисков", it: "Serie risografia — 12 stampe" },
  handBody: { en: "Hand-pulled, numbered. New drop in the shop this week.", fr: "Tirés à la main, numérotés. Nouvelle sortie en boutique cette semaine.", pt: "Feitas à mão, numeradas. Novidade na loja esta semana.", de: "Von Hand gedruckt, nummeriert. Diese Woche neu im Shop.", ja: "手刷り、ナンバリング入り。今週ショップに新入荷。", zh: "手工印制，编号限量。本周店内上新。", ar: "مطبوعة يدويًا ومرقّمة. إصدار جديد في المتجر هذا الأسبوع.", ru: "Ручная печать, нумерованные. Новинка в магазине на этой неделе.", it: "Stampate a mano, numerate. Nuova uscita in negozio questa settimana." },
  feedStrip: { en: "In order. Everyone who follows you — no ads.", fr: "Dans l'ordre. Tous ceux qui vous suivent — sans pub.", pt: "Em ordem. Todos que seguem você — sem anúncios.", de: "Der Reihe nach. Alle, die dir folgen — ohne Werbung.", ja: "順番どおりに。あなたのフォロワー全員へ — 広告なし。", zh: "按顺序，触达每位关注者 — 没有广告。", ar: "بالترتيب. كل من يتابعك — دون إعلانات.", ru: "По порядку. Все ваши подписчики — без рекламы.", it: "In ordine. Tutti quelli che ti seguono — senza pubblicità." },

  // ── composer ──
  publishWork: { en: "Publish work", fr: "Publier une œuvre", pt: "Publicar trabalho", de: "Werk veröffentlichen", ja: "作品を公開", zh: "发布作品", ar: "نشر عمل", ru: "Опубликовать работу", it: "Pubblica un'opera" },
  whatSharing: { en: "What are you sharing?", fr: "Que partagez-vous ?", pt: "O que você vai compartilhar?", de: "Was teilst du?", ja: "何を共有しますか？", zh: "你要分享什么？", ar: "ماذا تشارك؟", ru: "Чем поделитесь?", it: "Cosa condividi?" },
  segImage: { en: "Image", fr: "Image", pt: "Imagem", de: "Bild", ja: "画像", zh: "图片", ar: "صورة", ru: "Изображение", it: "Immagine" },
  segVideo: { en: "Short video", fr: "Vidéo courte", pt: "Vídeo curto", de: "Kurzvideo", ja: "短い動画", zh: "短视频", ar: "فيديو قصير", ru: "Короткое видео", it: "Video breve" },
  segAudio: { en: "Short audio", fr: "Audio court", pt: "Áudio curto", de: "Kurzaudio", ja: "短い音声", zh: "短音频", ar: "صوت قصير", ru: "Короткое аудио", it: "Audio breve" },
  segText: { en: "Text", fr: "Texte", pt: "Texto", de: "Text", ja: "テキスト", zh: "文字", ar: "نص", ru: "Текст", it: "Testo" },
  workImages: { en: "Work — up to 10 images", fr: "Œuvre — jusqu'à 10 images", pt: "Trabalho — até 10 imagens", de: "Werk — bis zu 10 Bilder", ja: "作品 — 最大10枚", zh: "作品 — 最多 10 张图", ar: "العمل — حتى 10 صور", ru: "Работа — до 10 изображений", it: "Opera — fino a 10 immagini" },
  chooseFiles: { en: "Choose files", fr: "Choisir des fichiers", pt: "Escolher arquivos", de: "Dateien wählen", ja: "ファイルを選択", zh: "选择文件", ar: "اختر الملفات", ru: "Выбрать файлы", it: "Scegli i file" },
  noFile: { en: "No file chosen", fr: "Aucun fichier choisi", pt: "Nenhum arquivo escolhido", de: "Keine Datei gewählt", ja: "ファイル未選択", zh: "未选择文件", ar: "لم يُختَر ملف", ru: "Файл не выбран", it: "Nessun file scelto" },
  originalNote: { en: "Your original is stored untouched, full resolution. Optimized display copies are generated for fast viewing.", fr: "Votre original est conservé intact, en pleine résolution. Des copies d'affichage optimisées sont générées pour une lecture rapide.", pt: "Seu original é guardado intacto, em resolução total. Cópias otimizadas são geradas para exibição rápida.", de: "Dein Original bleibt unangetastet, in voller Auflösung. Optimierte Anzeigekopien sorgen für schnelles Laden.", ja: "オリジナルはフル解像度のまま保存。表示用に最適化されたコピーを自動生成します。", zh: "原图以全分辨率原样保存。系统会生成优化副本以便快速浏览。", ar: "يُحفظ ملفك الأصلي كما هو بدقة كاملة. وتُنشأ نسخ عرض مُحسَّنة للتصفح السريع.", ru: "Оригинал хранится без изменений, в полном разрешении. Для быстрого просмотра создаются оптимизированные копии.", it: "Il tuo originale è conservato intatto, a piena risoluzione. Vengono generate copie ottimizzate per una visualizzazione veloce." },
  altLabel: { en: "Alt text (describe the work for screen readers)", fr: "Texte alternatif (décrivez l'œuvre pour les lecteurs d'écran)", pt: "Texto alternativo (descreva a obra para leitores de tela)", de: "Alt-Text (beschreibe das Werk für Screenreader)", ja: "代替テキスト（スクリーンリーダー用に作品を説明）", zh: "替代文字（为屏幕阅读器描述作品）", ar: "نص بديل (صف العمل لقارئات الشاشة)", ru: "Альт-текст (опишите работу для скринридеров)", it: "Testo alternativo (descrivi l'opera per gli screen reader)" },
  altPh: { en: "e.g. Wood-fired tea bowl with iron glaze, kiln scars", fr: "ex. Bol à thé cuit au bois, glaçure de fer, marques de four", pt: "ex. Tigela de chá queimada a lenha, esmalte de ferro, marcas do forno", de: "z. B. holzgebrannte Teeschale mit Eisenglasur, Brennspuren", ja: "例：薪窯焼成の鉄釉茶碗、窯変あり", zh: "例：柴烧铁釉茶碗，带窑变痕迹", ar: "مثال: وعاء شاي محروق بالحطب بطلاء حديدي وآثار الفرن", ru: "напр. чаша для чая, обжиг на дровах, железная глазурь, следы печи", it: "es. Ciotola da tè cotta a legna, smalto ferroso, segni del forno" },
  captionLabel: { en: "Caption", fr: "Légende", pt: "Legenda", de: "Bildunterschrift", ja: "キャプション", zh: "文字说明", ar: "التعليق", ru: "Подпись", it: "Didascalia" },
  captionPh: { en: "Say something about the work…", fr: "Dites quelque chose sur l'œuvre…", pt: "Diga algo sobre o trabalho…", de: "Sag etwas über das Werk…", ja: "作品について一言…", zh: "说说这件作品…", ar: "قل شيئًا عن العمل…", ru: "Расскажите о работе…", it: "Racconta qualcosa dell'opera…" },
  categoryLabel: { en: "Category", fr: "Catégorie", pt: "Categoria", de: "Kategorie", ja: "カテゴリー", zh: "分类", ar: "الفئة", ru: "Категория", it: "Categoria" },
  autoDetect: { en: "Auto-detect (or choose)", fr: "Détection auto (ou choisir)", pt: "Detectar automaticamente (ou escolher)", de: "Automatisch erkennen (oder wählen)", ja: "自動判定（または選択）", zh: "自动识别（或手动选择）", ar: "كشف تلقائي (أو اختر)", ru: "Автоопределение (или выбрать)", it: "Rilevamento automatico (o scegli)" },
  tagsLabel: { en: "Tags (optional)", fr: "Étiquettes (facultatif)", pt: "Tags (opcional)", de: "Tags (optional)", ja: "タグ（任意）", zh: "标签（可选）", ar: "الوسوم (اختياري)", ru: "Теги (необязательно)", it: "Tag (facoltativo)" },
  tagsPh: { en: "woodfired, ceramics, studio", fr: "cuisson au bois, céramique, atelier", pt: "queima a lenha, cerâmica, ateliê", de: "holzbrand, keramik, atelier", ja: "薪窯, 陶芸, スタジオ", zh: "柴烧, 陶艺, 工作室", ar: "حرق بالحطب، خزف، استوديو", ru: "дровяной обжиг, керамика, студия", it: "cottura a legna, ceramica, studio" },

  // ── heroes ──
  heroEvent: { en: "event", fr: "événement", pt: "evento", de: "Event", ja: "イベント", zh: "活动", ar: "فعالية", ru: "событие", it: "evento" },
  hTitle1: { en: "Heroes —", fr: "Heroes —", pt: "Heroes —", de: "Heroes —", ja: "Heroes —", zh: "Heroes —", ar: "Heroes —", ru: "Heroes —", it: "Heroes —" },
  hTitle2: { en: "just for one day.", fr: "juste pour un jour.", pt: "só por um dia.", de: "nur für einen Tag.", ja: "たった一日だけ。", zh: "只存在一天。", ar: "ليوم واحد فقط.", ru: "всего на один день.", it: "solo per un giorno." },
  hSub: { en: "Tied to the events you attend.", fr: "Liés aux événements auxquels vous assistez.", pt: "Ligados aos eventos de que você participa.", de: "Verknüpft mit den Events, die du besuchst.", ja: "参加したイベントに結びつく。", zh: "与你参加的活动绑定。", ar: "مرتبطة بالفعاليات التي تحضرها.", ru: "Привязаны к событиям, на которых вы были.", it: "Legati agli eventi a cui partecipi." },

  // ── events ──
  online: { en: "Online", fr: "En ligne", pt: "Online", de: "Online", ja: "オンライン", zh: "线上", ar: "عبر الإنترنت", ru: "Онлайн", it: "Online" },
  evtNight: { en: "Opening Night", fr: "Soirée d'ouverture", pt: "Noite de estreia", de: "Eröffnungsabend", ja: "オープニングナイト", zh: "开幕之夜", ar: "ليلة الافتتاح", ru: "Вечер открытия", it: "Serata inaugurale" },
  imGoing: { en: "I'm going", fr: "J'y vais", pt: "Eu vou", de: "Ich komme", ja: "参加する", zh: "我要去", ar: "سأحضر", ru: "Я иду", it: "Ci sarò" },
  going: { en: "going", fr: "participants", pt: "vão", de: "dabei", ja: "参加", zh: "人参加", ar: "ذاهب", ru: "идут", it: "partecipano" },
  views: { en: "views", fr: "vues", pt: "visitas", de: "Aufrufe", ja: "回表示", zh: "次浏览", ar: "مشاهدة", ru: "просмотра", it: "visite" },
  hFromEvent: { en: "Heroes from this event", fr: "Heroes de cet événement", pt: "Heroes deste evento", de: "Heroes von diesem Event", ja: "このイベントのHeroes", zh: "来自本活动的 Heroes", ar: "Heroes من هذه الفعالية", ru: "Heroes с этого события", it: "Heroes di questo evento" },
  hFromEventBody: { en: "Short videos posted from this event — live for 24 hours.", fr: "Courtes vidéos publiées depuis cet événement — en ligne 24 heures.", pt: "Vídeos curtos publicados neste evento — no ar por 24 horas.", de: "Kurze Videos von diesem Event — 24 Stunden live.", ja: "このイベントから投稿された短い動画 — 24時間だけ公開。", zh: "从本活动发布的短视频 — 保留 24 小时。", ar: "مقاطع قصيرة نُشرت من هذه الفعالية — تبقى 24 ساعة.", ru: "Короткие видео с этого события — живут 24 часа.", it: "Brevi video pubblicati da questo evento — online per 24 ore." },
  postHero: { en: "Post a Hero", fr: "Publier un Hero", pt: "Postar um Hero", de: "Einen Hero posten", ja: "Heroを投稿", zh: "发布 Hero", ar: "انشر Hero", ru: "Опубликовать Hero", it: "Pubblica un Hero" },
  attendees: { en: "Attendees", fr: "Participants", pt: "Participantes", de: "Teilnehmende", ja: "参加者", zh: "参加者", ar: "الحاضرون", ru: "Участники", it: "Partecipanti" },
  attendeesBody: { en: "Confirm who attended — only confirmed guests can post a Hero. Block anyone abusing the event's name.", fr: "Confirmez qui était présent — seuls les invités confirmés peuvent publier un Hero. Bloquez quiconque abuse du nom de l'événement.", pt: "Confirme quem participou — só convidados confirmados podem postar um Hero. Bloqueie quem abusar do nome do evento.", de: "Bestätige, wer da war — nur bestätigte Gäste können einen Hero posten. Sperre, wer den Event-Namen missbraucht.", ja: "参加者を承認 — 承認されたゲストだけがHeroを投稿できます。イベント名を悪用する人はブロックを。", zh: "确认谁到场 — 只有经确认的来宾才能发布 Hero。可封禁滥用活动名义者。", ar: "أكِّد من حضر — الضيوف المؤكَّدون وحدهم يمكنهم نشر Hero. احظر من يسيء استخدام اسم الفعالية.", ru: "Подтвердите, кто пришёл — только подтверждённые гости могут опубликовать Hero. Блокируйте тех, кто злоупотребляет именем события.", it: "Conferma chi ha partecipato — solo gli ospiti confermati possono pubblicare un Hero. Blocca chi abusa del nome dell'evento." },
  memberRole: { en: "Member", fr: "Membre", pt: "Membro", de: "Mitglied", ja: "メンバー", zh: "成员", ar: "عضو", ru: "Участник", it: "Membro" },
  confirmed: { en: "Confirmed", fr: "Confirmé", pt: "Confirmado", de: "Bestätigt", ja: "承認済み", zh: "已确认", ar: "مؤكَّد", ru: "Подтверждён", it: "Confermato" },

  // ── roles ──
  rolesTitle: { en: "Three ways to belong", fr: "Trois façons d'en faire partie", pt: "Três formas de pertencer", de: "Drei Wege dazuzugehören", ja: "参加する三つのかたち", zh: "三种归属方式", ar: "ثلاث طرق للانتماء", ru: "Три способа быть здесь", it: "Tre modi per farne parte" },
  rMember: { en: "Member", fr: "Membre", pt: "Membro", de: "Mitglied", ja: "メンバー", zh: "成员", ar: "عضو", ru: "Участник", it: "Membro" },
  rMemberD: { en: "Browse, follow, join groups. Free.", fr: "Explorez, suivez, rejoignez des groupes. Gratuit.", pt: "Navegue, siga, entre em grupos. Grátis.", de: "Stöbern, folgen, Gruppen beitreten. Kostenlos.", ja: "閲覧、フォロー、グループ参加。無料。", zh: "浏览、关注、加入群组。免费。", ar: "تصفّح وتابع وانضم للمجموعات. مجانًا.", ru: "Смотрите, подписывайтесь, вступайте в группы. Бесплатно.", it: "Esplora, segui, entra nei gruppi. Gratis." },
  rCreator: { en: "Creator", fr: "Créateur", pt: "Criador", de: "Creator", ja: "クリエイター", zh: "创作者", ar: "مبدع", ru: "Автор", it: "Creatore" },
  rCreatorD: { en: "Approved to publish work + open groups.", fr: "Approuvé pour publier des œuvres et créer des groupes.", pt: "Aprovado para publicar trabalhos e abrir grupos.", de: "Freigeschaltet, um Werke zu posten und Gruppen zu gründen.", ja: "承認を受けて作品公開＋グループ開設。", zh: "经批准可发布作品并创建群组。", ar: "مُعتمَد لنشر الأعمال وإنشاء المجموعات.", ru: "Одобрен публиковать работы и создавать группы.", it: "Approvato per pubblicare opere e aprire gruppi." },
  rCurator: { en: "Curator", fr: "Curateur", pt: "Curador", de: "Kurator", ja: "キュレーター", zh: "策展人", ar: "منسّق", ru: "Куратор", it: "Curatore" },
  rCuratorD: { en: "Earned. Reposts & surfaces quality. ♺ ✦", fr: "Mérité. Repartage et met en avant la qualité. ♺ ✦", pt: "Conquistado. Reposta e destaca qualidade. ♺ ✦", de: "Verdient. Teilt und hebt Qualität hervor. ♺ ✦", ja: "実績で獲得。良作を再共有し押し上げる。♺ ✦", zh: "凭实力获得。转发并推举佳作。♺ ✦", ar: "يُكتسَب. يعيد نشر الجودة ويبرزها. ♺ ✦", ru: "Заслуживается. Репостит и поднимает качество. ♺ ✦", it: "Conquistato. Ricondivide e valorizza la qualità. ♺ ✦" },
  moderation: { en: "+ real moderation — quality, not spam.", fr: "+ une vraie modération — la qualité, pas le spam.", pt: "+ moderação de verdade — qualidade, não spam.", de: "+ echte Moderation — Qualität, kein Spam.", ja: "＋本物のモデレーション — スパムでなく質を。", zh: "＋真正的审核 — 只要质量，拒绝垃圾。", ar: "+ إشراف حقيقي — الجودة لا السخام.", ru: "+ настоящая модерация — качество, а не спам.", it: "+ moderazione vera — qualità, non spam." },

  // ── groups ──
  groupTag: { en: "Group", fr: "Groupe", pt: "Grupo", de: "Gruppe", ja: "グループ", zh: "群组", ar: "مجموعة", ru: "Группа", it: "Gruppo" },
  community: { en: "community", fr: "communauté", pt: "comunidade", de: "Community", ja: "コミュニティ", zh: "社区", ar: "مجتمع", ru: "сообщество", it: "community" },
  openFor: { en: "Open group for people who follow", fr: "Groupe ouvert pour ceux qui suivent", pt: "Grupo aberto para quem segue", de: "Offene Gruppe für alle, die folgen:", ja: "フォロワー向けの公開グループ：", zh: "面向关注者的公开群组：", ar: "مجموعة مفتوحة لمن يتابع", ru: "Открытая группа для тех, кто следит за", it: "Gruppo aperto per chi segue" },
  members: { en: "members", fr: "membres", pt: "membros", de: "Mitglieder", ja: "メンバー", zh: "成员", ar: "أعضاء", ru: "участников", it: "membri" },
  followers: { en: "followers", fr: "abonnés", pt: "seguidores", de: "Follower", ja: "フォロワー", zh: "关注者", ar: "متابعون", ru: "подписчиков", it: "follower" },
  following: { en: "Following", fr: "Abonné", pt: "Seguindo", de: "Folgt", ja: "フォロー中", zh: "已关注", ar: "متابَع", ru: "Вы подписаны", it: "Segui già" },
  follow: { en: "Follow", fr: "Suivre", pt: "Seguir", de: "Folgen", ja: "フォロー", zh: "关注", ar: "متابعة", ru: "Подписаться", it: "Segui" },
  openGroup: { en: "Open group →", fr: "Ouvrir le groupe →", pt: "Abrir grupo →", de: "Gruppe öffnen →", ja: "グループを開く →", zh: "打开群组 →", ar: "افتح المجموعة →", ru: "Открыть группу →", it: "Apri il gruppo →" },
  groupsStrip: { en: "Gather around what you love.", fr: "Rassemblez-vous autour de ce que vous aimez.", pt: "Reúna-se em torno do que você ama.", de: "Versammelt euch um das, was ihr liebt.", ja: "好きなものを囲んで集おう。", zh: "围绕你所热爱的相聚。", ar: "التقوا حول ما تحبّون.", ru: "Собирайтесь вокруг того, что любите.", it: "Ritrovatevi attorno a ciò che amate." },

  // ── astelier ──
  fee: { en: "0% FEE", fr: "0% DE FRAIS", pt: "0% DE TAXA", de: "0% GEBÜHR", ja: "手数料0%", zh: "0% 手续费", ar: "0% رسوم", ru: "0% КОМИССИИ", it: "0% COMMISSIONI" },
  shopDesc: { en: "Merch, posters & books from the studio.", fr: "Produits, affiches & livres de l'atelier.", pt: "Produtos, pôsteres & livros do estúdio.", de: "Merch, Poster & Bücher aus dem Studio.", ja: "スタジオのグッズ・ポスター・書籍。", zh: "工作室的周边、海报与书籍。", ar: "منتجات وملصقات وكتب من الاستوديو.", ru: "Мерч, постеры и книги из студии.", it: "Merch, poster & libri dallo studio." },
  catalog: { en: "Catalog", fr: "Catalogue", pt: "Catálogo", de: "Katalog", ja: "カタログ", zh: "目录", ar: "الكتالوج", ru: "Каталог", it: "Catalogo" },
  prodRiso: { en: "Risograph Poster", fr: "Affiche risographie", pt: "Pôster risografia", de: "Risographie-Poster", ja: "リソグラフポスター", zh: "孔版海报", ar: "ملصق ريزوغراف", ru: "Ризограф-постер", it: "Poster risografia" },
  prodCeramic: { en: "Ceramic Study", fr: "Étude céramique", pt: "Estudo em cerâmica", de: "Keramik-Studie", ja: "陶芸習作", zh: "陶艺习作", ar: "دراسة خزفية", ru: "Керамический этюд", it: "Studio in ceramica" },
  prodGold: { en: "Gold Leaf Print", fr: "Tirage à la feuille d'or", pt: "Gravura em folha de ouro", de: "Blattgold-Druck", ja: "金箔プリント", zh: "金箔版画", ar: "طبعة بورق الذهب", ru: "Печать с сусальным золотом", it: "Stampa in foglia d'oro" },
  prodNight: { en: "Night Study", fr: "Étude nocturne", pt: "Estudo noturno", de: "Nachtstudie", ja: "夜の習作", zh: "夜之习作", ar: "دراسة ليلية", ru: "Ночной этюд", it: "Studio notturno" },
  buy: { en: "Buy", fr: "Acheter", pt: "Comprar", de: "Kaufen", ja: "購入", zh: "购买", ar: "شراء", ru: "Купить", it: "Acquista" },
  astelierStrip: { en: "Your own shop — Buy → sends buyers to you.", fr: "Votre propre boutique — Acheter → renvoie les acheteurs vers vous.", pt: "Sua própria loja — Comprar → leva os compradores até você.", de: "Dein eigener Shop — Kaufen → schickt Käufer direkt zu dir.", ja: "自分のショップで — 「購入」は買い手をあなたへ。", zh: "你自己的店铺 — “购买”把买家带到你这里。", ar: "متجرك الخاص — «شراء» يوجّه المشترين إليك.", ru: "Ваш собственный магазин — «Купить» ведёт покупателей к вам.", it: "Il tuo negozio — «Acquista» porta i clienti da te." },

  // ── web + mobile ──
  webT1: { en: "Phone or web —", fr: "Mobile ou web —", pt: "Celular ou web —", de: "Handy oder Web —", ja: "スマホでもウェブでも —", zh: "手机或网页 —", ar: "الهاتف أو الويب —", ru: "Телефон или веб —", it: "Telefono o web —" },
  webT2: { en: "the same room.", fr: "le même lieu.", pt: "o mesmo lugar.", de: "derselbe Raum.", ja: "同じ場所。", zh: "同一个空间。", ar: "المكان نفسه.", ru: "то же пространство.", it: "lo stesso spazio." },

  // ── values ──
  valDonations: { en: "Funded by donations.", fr: "Financé par les dons.", pt: "Financiada por doações.", de: "Finanziert durch Spenden.", ja: "寄付で運営。", zh: "由捐赠支持。", ar: "يُموَّل بالتبرعات.", ru: "Живёт на пожертвования.", it: "Finanziata dalle donazioni." },
  valArts: { en: "Led by people from the arts.", fr: "Dirigé par des gens issus des arts.", pt: "Conduzida por gente das artes.", de: "Geführt von Menschen aus der Kunst.", ja: "芸術の世界の人々が運営。", zh: "由艺术领域的人主理。", ar: "يقودها أهل الفنون.", ru: "Ведут люди из мира искусства.", it: "Guidata da gente dell'arte." },
  valAds: { en: "Never by ads.", fr: "Jamais par la pub.", pt: "Nunca por anúncios.", de: "Niemals durch Werbung.", ja: "広告では決してない。", zh: "绝不靠广告。", ar: "لا بالإعلانات أبدًا.", ru: "Никогда — на рекламе.", it: "Mai dalla pubblicità." },
} satisfies Record<string, Tr>;

export type SKey = keyof typeof T;
export type PromoStrings = Record<SKey, string>;

export const STRINGS = Object.fromEntries(
  LOCALES.map((l) => [l, Object.fromEntries((Object.keys(T) as SKey[]).map((k) => [k, T[k][l]]))]),
) as Record<Locale, PromoStrings>;

// Spoken narration, filename 01..12 → text (mirrors the scenes, fuller).
const VO = {
  "01": { en: "Tired of generic platforms like Instagram and Amazon to publish and sell your art?", fr: "Fatigué des plateformes génériques comme Instagram et Amazon pour publier et vendre votre art ?", pt: "Cansado de plataformas genéricas como Instagram e Amazon para publicar e vender sua arte?", de: "Genug von generischen Plattformen wie Instagram und Amazon, um deine Kunst zu veröffentlichen und zu verkaufen?", ja: "作品を発表して販売するのに、インスタグラムやアマゾンのような汎用プラットフォームに疲れていませんか？", zh: "厌倦了用 Instagram、Amazon 这类通用平台来发布和售卖你的作品了吗？", ar: "هل سئمت من منصات عامة مثل إنستغرام وأمازون لنشر فنك وبيعه؟", ru: "Устали от типовых платформ вроде Instagram и Amazon, чтобы публиковать и продавать своё искусство?", it: "Stanco di piattaforme generiche come Instagram e Amazon per pubblicare e vendere la tua arte?" },
  "02": { en: "Here, we're building a social community worthy of the talent and effort behind your creations.", fr: "Ici, nous bâtissons une communauté sociale à la hauteur du talent et des efforts derrière vos créations.", pt: "Aqui, estamos construindo uma comunidade social à altura do talento e do esforço por trás das suas criações.", de: "Hier bauen wir eine soziale Gemeinschaft, die dem Talent und der Mühe hinter deinen Werken gerecht wird.", ja: "ここで私たちは、あなたの創作に注がれた才能と努力にふさわしいソーシャルコミュニティをつくっています。", zh: "在这里，我们正在打造一个配得上你作品背后才华与付出的社交社区。", ar: "نحن هنا نبني مجتمعًا اجتماعيًا يليق بالموهبة والجهد وراء إبداعاتك.", ru: "Здесь мы строим социальное сообщество, достойное таланта и труда, стоящих за вашими работами.", it: "Qui stiamo costruendo una comunità sociale all'altezza del talento e dell'impegno dietro le tue creazioni." },
  "03": { en: "Atelier is a feed in order. Everyone who follows you sees your work. No ranking, no ads.", fr: "Atelier, c'est un fil dans l'ordre. Tous ceux qui vous suivent voient votre travail. Sans classement, sans pub.", pt: "A Atelier é um feed em ordem. Todos que seguem você veem seu trabalho. Sem ranking, sem anúncios.", de: "Atelier ist ein Feed der Reihe nach. Alle, die dir folgen, sehen deine Arbeit. Kein Ranking, keine Werbung.", ja: "Atelierは順番どおりのフィードです。あなたのフォロワー全員が作品を目にします。ランキングも広告もありません。", zh: "Atelier 是按顺序排列的动态。每一位关注你的人都会看到你的作品。没有排名，没有广告。", ar: "أتيلييه فيدٌ بالترتيب. كل من يتابعك يرى عملك. لا ترتيب خوارزمي ولا إعلانات.", ru: "Atelier — это лента по порядку. Все ваши подписчики видят ваши работы. Без ранжирования и без рекламы.", it: "Atelier è un feed in ordine. Tutti quelli che ti seguono vedono il tuo lavoro. Nessuna classifica, nessuna pubblicità." },
  "04": { en: "Post art, writing, music, or film in seconds.", fr: "Publiez de l'art, de l'écriture, de la musique ou du cinéma en quelques secondes.", pt: "Publique arte, escrita, música ou cinema em segundos.", de: "Poste Kunst, Texte, Musik oder Film in Sekunden.", ja: "アート、文章、音楽、映像を数秒で投稿できます。", zh: "几秒钟就能发布美术、写作、音乐或影像。", ar: "انشر الفن أو الكتابة أو الموسيقى أو السينما في ثوانٍ.", ru: "Публикуйте искусство, тексты, музыку или кино за секунды.", it: "Pubblica arte, scrittura, musica o cinema in pochi secondi." },
  "05": { en: "Heroes live for just one day, tied to the events you attend.", fr: "Les Heroes ne vivent qu'un seul jour, liés aux événements auxquels vous assistez.", pt: "Os Heroes vivem só por um dia, ligados aos eventos de que você participa.", de: "Heroes leben nur einen Tag, verknüpft mit den Events, die du besuchst.", ja: "Heroesはたった一日だけ。参加したイベントに結びついています。", zh: "Heroes 只存在一天，与你参加的活动绑定。", ar: "تعيش الـHeroes ليومٍ واحد فقط، مرتبطةً بالفعاليات التي تحضرها.", ru: "Heroes живут всего один день и привязаны к событиям, на которых вы были.", it: "Gli Heroes vivono solo un giorno, legati agli eventi a cui partecipi." },
  "06": { en: "Three ways to belong. Member, creator, curator, with real moderation for quality.", fr: "Trois façons d'en faire partie. Membre, créateur, curateur, avec une vraie modération pour la qualité.", pt: "Três formas de pertencer. Membro, criador, curador, com moderação de verdade pela qualidade.", de: "Drei Wege dazuzugehören. Mitglied, Creator, Kurator, mit echter Moderation für Qualität.", ja: "参加のかたちは三つ。メンバー、クリエイター、キュレーター。質を守る本物のモデレーションとともに。", zh: "三种归属方式：成员、创作者、策展人，配以真正把关质量的审核。", ar: "ثلاث طرق للانتماء: عضو، ومبدع، ومنسّق، مع إشرافٍ حقيقيٍّ يحفظ الجودة.", ru: "Три способа быть здесь: участник, автор, куратор — с настоящей модерацией ради качества.", it: "Tre modi per farne parte. Membro, creatore, curatore, con una moderazione vera per la qualità." },
  "07": { en: "Gather in groups around what you love.", fr: "Rassemblez-vous en groupes autour de ce que vous aimez.", pt: "Reúna-se em grupos em torno do que você ama.", de: "Versammelt euch in Gruppen um das, was ihr liebt.", ja: "好きなものを囲んで、グループで集いましょう。", zh: "在群组里，围绕你所热爱的相聚。", ar: "التقوا في مجموعات حول ما تحبّون.", ru: "Собирайтесь в группах вокруг того, что любите.", it: "Ritrovatevi in gruppi attorno a ciò che amate." },
  "08": { en: "Sell on your own storefront. The buy button sends collectors straight to you. Zero fees.", fr: "Vendez sur votre propre boutique. Le bouton d'achat envoie les collectionneurs directement vers vous. Zéro frais.", pt: "Venda na sua própria loja. O botão de compra leva os colecionadores direto até você. Zero taxas.", de: "Verkaufe in deinem eigenen Shop. Der Kaufen-Button schickt Sammler direkt zu dir. Null Gebühren.", ja: "自分のショップで販売しましょう。購入ボタンはコレクターをあなたへ直接つなぎます。手数料はゼロです。", zh: "在你自己的店铺出售。购买按钮把藏家直接带到你这里。零手续费。", ar: "بِع في متجرك الخاص. زر الشراء يوجّه المقتنين إليك مباشرة. بلا أي رسوم.", ru: "Продавайте в собственном магазине. Кнопка покупки ведёт коллекционеров прямо к вам. Никаких комиссий.", it: "Vendi nel tuo negozio. Il pulsante d'acquisto porta i collezionisti dritti da te. Zero commissioni." },
  "09": { en: "Funded by donations, led by people from the arts. Never by ads.", fr: "Financé par les dons, dirigé par des gens issus des arts. Jamais par la pub.", pt: "Financiada por doações, conduzida por gente das artes. Nunca por anúncios.", de: "Finanziert durch Spenden, geführt von Menschen aus der Kunst. Niemals durch Werbung.", ja: "運営は寄付によって。芸術の世界の人々が導きます。広告では決してありません。", zh: "由捐赠支持，由艺术领域的人主理。绝不靠广告。", ar: "يُموَّل بالتبرعات، ويقوده أهل الفنون. لا بالإعلانات أبدًا.", ru: "Живёт на пожертвования, им руководят люди из мира искусства. Никогда — на рекламе.", it: "Finanziata dalle donazioni, guidata da gente dell'arte. Mai dalla pubblicità." },
  "10": { en: "À un flâneur. Join us at atelier dot aunflaneur dot com.", fr: "À un flâneur. Rejoignez-nous sur atelier point aunflaneur point com.", pt: "À un flâneur. Junte-se a nós em atelier ponto aunflaneur ponto com.", de: "À un flâneur. Mach mit auf atelier punkt aunflaneur punkt com.", ja: "アン・フラヌール。atelier.aunflaneur.com でお待ちしています。", zh: "À un flâneur。欢迎访问 atelier.aunflaneur.com 加入我们。", ar: "أون فلانور. انضم إلينا على atelier.aunflaneur.com.", ru: "А ун фланёр. Присоединяйтесь на atelier точка aunflaneur точка com.", it: "À un flâneur. Unisciti a noi su atelier punto aunflaneur punto com." },
  "11": { en: "Events live here too. The organizer confirms who attended, and only they can post a Hero, tied to that event.", fr: "Les événements aussi vivent ici. L'organisateur confirme qui était présent, et eux seuls peuvent publier un Hero, lié à cet événement.", pt: "Os eventos também vivem aqui. O organizador confirma quem participou, e só eles podem postar um Hero, ligado àquele evento.", de: "Auch Events leben hier. Die Veranstalter bestätigen, wer da war, und nur sie können einen Hero posten, verknüpft mit dem Event.", ja: "イベントもここにあります。主催者が参加者を承認し、その人だけがそのイベントに結びついたHeroを投稿できます。", zh: "活动也在这里。主办方确认谁到场，只有他们才能发布与那场活动绑定的 Hero。", ar: "الفعاليات تعيش هنا أيضًا. يؤكّد المنظّم من حضر، وهم وحدهم من يمكنهم نشر Hero مرتبط بتلك الفعالية.", ru: "События тоже живут здесь. Организатор подтверждает, кто пришёл, и только они могут опубликовать Hero, привязанный к этому событию.", it: "Anche gli eventi vivono qui. L'organizzatore conferma chi ha partecipato, e solo loro possono pubblicare un Hero, legato a quell'evento." },
  "12": { en: "On your phone, or full-width on the web. The same room, everywhere.", fr: "Sur votre mobile, ou en plein écran sur le web. Le même lieu, partout.", pt: "No seu celular, ou em tela cheia na web. O mesmo lugar, em qualquer lugar.", de: "Auf dem Handy oder in voller Breite im Web. Derselbe Raum, überall.", ja: "スマホでも、ウェブの全画面でも。同じ場所が、どこにでも。", zh: "在手机上，或在网页全屏。同一个空间，无处不在。", ar: "على هاتفك، أو بعرضٍ كامل على الويب. المكان نفسه، في كل مكان.", ru: "На телефоне или во всю ширину в вебе. То же пространство — везде.", it: "Sul telefono o a tutta larghezza sul web. Lo stesso spazio, ovunque." },
} satisfies Record<string, Tr>;

export const VO_FILES = Object.keys(VO);
export const VO_LINES = Object.fromEntries(
  LOCALES.map((l) => [l, VO_FILES.map((f) => ({ f, text: (VO as Record<string, Tr>)[f][l] }))]),
) as Record<Locale, { f: string; text: string }[]>;
