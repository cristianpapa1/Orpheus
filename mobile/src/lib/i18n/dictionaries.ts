import type { Locale } from "./config";

/** Mobile UI dictionary. `en` is the source of truth for the shape; every
 *  locale must satisfy `Dictionary`. Covers the native app's read surfaces. */
export interface Dictionary {
  tabs: { feed: string; groups: string; events: string; jobs: string; account: string };
  login: {
    tagline: string;
    signIn: string;
    email: string;
    password: string;
    signInBtn: string;
    createAccount: string;
    confirm: string;
    hint: string;
  };
  feed: { empty: string; text: string; video: string; audio: string };
  groups: { empty: string; private: string };
  events: { title: string; empty: string };
  jobs: { title: string; empty: string };
  account: {
    signedIn: string;
    signInTitle: string;
    signIn: string;
    signOut: string;
    email: string;
    password: string;
    signedInMsg: string;
    language: string;
  };
  profile: {
    follow: string;
    following: string;
    followers: string;
    follower: string;
    posts: string;
    noPosts: string;
    verified: string;
    quality: string;
    curator: string;
    notFound: string;
  };
  group: {
    about: string;
    members: string;
    followers: string;
    private: string;
    follow: string;
    following: string;
    requestJoin: string;
    requested: string;
    member: string;
    feed: string;
    noPosts: string;
    notFound: string;
  };
  compose: {
    title: string;
    newPost: string;
    image: string;
    text: string;
    pickImage: string;
    changeImage: string;
    caption: string;
    category: string;
    altText: string;
    body: string;
    publish: string;
    publishing: string;
    creatorsOnly: string;
    creatorsOnlyBody: string;
    becomeCreator: string;
    needImage: string;
    needCategory: string;
    needBody: string;
    failed: string;
  };
}

const en: Dictionary = {
  tabs: { feed: "Feed", groups: "Groups", events: "Events", jobs: "Jobs", account: "Account" },
  login: { tagline: "A place for makers.", signIn: "Sign in", email: "email", password: "password", signInBtn: "Sign in", createAccount: "Create account", confirm: "Check your inbox to confirm your email, then sign in.", hint: "Magic-link and Google sign-in arrive with the next milestone — email + password works today." },
  feed: { empty: "Nothing published yet.", text: "Text", video: "Video", audio: "Audio" },
  groups: { empty: "No groups yet.", private: "private" },
  events: { title: "Events", empty: "Nothing upcoming." },
  jobs: { title: "Jobs", empty: "No open positions." },
  account: { signedIn: "Signed in", signInTitle: "Sign in", signIn: "Sign in", signOut: "Sign out", email: "email", password: "password", signedInMsg: "Signed in.", language: "Language" },
  profile: { follow: "Follow", following: "Following", followers: "followers", follower: "follower", posts: "Posts", noPosts: "No posts yet.", verified: "Verified", quality: "Quality", curator: "Curator", notFound: "Profile not found." },
  group: { about: "About", members: "members", followers: "followers", private: "Private", follow: "Follow", following: "Following", requestJoin: "Request to join", requested: "Requested", member: "Member", feed: "Group feed", noPosts: "No posts in this group yet.", notFound: "Group not found." },
  compose: { title: "New post", newPost: "New post", image: "Image", text: "Text", pickImage: "Pick image", changeImage: "Change image", caption: "Caption", category: "Category", altText: "Alt text (describe the work)", body: "Your words", publish: "Publish", publishing: "Publishing…", creatorsOnly: "Creators only", creatorsOnlyBody: "Publishing is for approved creators. Become a creator on Atelier, then post here.", becomeCreator: "Become a creator →", needImage: "Pick an image first.", needCategory: "Pick a category.", needBody: "Write something to publish.", failed: "Couldn't publish. Try again." },
};

const fr: Dictionary = {
  tabs: { feed: "Fil", groups: "Groupes", events: "Événements", jobs: "Emplois", account: "Compte" },
  login: { tagline: "Un lieu pour les créateurs.", signIn: "Connexion", email: "e-mail", password: "mot de passe", signInBtn: "Connexion", createAccount: "Créer un compte", confirm: "Vérifiez votre boîte mail pour confirmer votre e-mail, puis connectez-vous.", hint: "La connexion par lien magique et Google arrive au prochain jalon — l’e-mail + mot de passe fonctionne aujourd’hui." },
  feed: { empty: "Rien de publié pour l’instant.", text: "Texte", video: "Vidéo", audio: "Audio" },
  groups: { empty: "Aucun groupe pour l’instant.", private: "privé" },
  events: { title: "Événements", empty: "Rien à venir." },
  jobs: { title: "Emplois", empty: "Aucun poste ouvert." },
  account: { signedIn: "Connecté", signInTitle: "Connexion", signIn: "Connexion", signOut: "Se déconnecter", email: "e-mail", password: "mot de passe", signedInMsg: "Connecté.", language: "Langue" },
  profile: { follow: "Suivre", following: "Abonné", followers: "abonnés", follower: "abonné", posts: "Publications", noPosts: "Aucune publication.", verified: "Vérifié", quality: "Qualité", curator: "Curateur", notFound: "Profil introuvable." },
  group: { about: "À propos", members: "membres", followers: "abonnés", private: "Privé", follow: "Suivre", following: "Abonné", requestJoin: "Demander à rejoindre", requested: "Demandé", member: "Membre", feed: "Fil du groupe", noPosts: "Aucune publication dans ce groupe.", notFound: "Groupe introuvable." },
  compose: { title: "Nouvelle publication", newPost: "Nouvelle publication", image: "Image", text: "Texte", pickImage: "Choisir une image", changeImage: "Changer l’image", caption: "Légende", category: "Catégorie", altText: "Texte alternatif (décrivez l’œuvre)", body: "Vos mots", publish: "Publier", publishing: "Publication…", creatorsOnly: "Réservé aux créateurs", creatorsOnlyBody: "Publier est réservé aux créateurs approuvés. Devenez créateur sur Atelier, puis publiez ici.", becomeCreator: "Devenir créateur →", needImage: "Choisissez d’abord une image.", needCategory: "Choisissez une catégorie.", needBody: "Écrivez quelque chose à publier.", failed: "Échec de la publication. Réessayez." },
};

const pt: Dictionary = {
  tabs: { feed: "Feed", groups: "Grupos", events: "Eventos", jobs: "Vagas", account: "Conta" },
  login: { tagline: "Um lugar para criadores.", signIn: "Entrar", email: "e-mail", password: "senha", signInBtn: "Entrar", createAccount: "Criar conta", confirm: "Verifique sua caixa de entrada para confirmar seu e-mail e depois entre.", hint: "Login por link mágico e Google chega no próximo marco — e-mail + senha já funciona." },
  feed: { empty: "Nada publicado ainda.", text: "Texto", video: "Vídeo", audio: "Áudio" },
  groups: { empty: "Nenhum grupo ainda.", private: "privado" },
  events: { title: "Eventos", empty: "Nada por vir." },
  jobs: { title: "Vagas", empty: "Nenhuma vaga aberta." },
  account: { signedIn: "Conectado", signInTitle: "Entrar", signIn: "Entrar", signOut: "Sair", email: "e-mail", password: "senha", signedInMsg: "Conectado.", language: "Idioma" },
  profile: { follow: "Seguir", following: "Seguindo", followers: "seguidores", follower: "seguidor", posts: "Publicações", noPosts: "Nenhuma publicação.", verified: "Verificado", quality: "Qualidade", curator: "Curador", notFound: "Perfil não encontrado." },
  group: { about: "Sobre", members: "membros", followers: "seguidores", private: "Privado", follow: "Seguir", following: "Seguindo", requestJoin: "Pedir para entrar", requested: "Solicitado", member: "Membro", feed: "Feed do grupo", noPosts: "Nenhuma publicação neste grupo.", notFound: "Grupo não encontrado." },
  compose: { title: "Nova publicação", newPost: "Nova publicação", image: "Imagem", text: "Texto", pickImage: "Escolher imagem", changeImage: "Trocar imagem", caption: "Legenda", category: "Categoria", altText: "Texto alternativo (descreva o trabalho)", body: "Suas palavras", publish: "Publicar", publishing: "Publicando…", creatorsOnly: "Apenas criadores", creatorsOnlyBody: "Publicar é para criadores aprovados. Torne-se criador no Atelier e publique aqui.", becomeCreator: "Tornar-se criador →", needImage: "Escolha uma imagem primeiro.", needCategory: "Escolha uma categoria.", needBody: "Escreva algo para publicar.", failed: "Não foi possível publicar. Tente de novo." },
};

const de: Dictionary = {
  tabs: { feed: "Feed", groups: "Gruppen", events: "Events", jobs: "Jobs", account: "Konto" },
  login: { tagline: "Ein Ort für Kreative.", signIn: "Anmelden", email: "E-Mail", password: "Passwort", signInBtn: "Anmelden", createAccount: "Konto erstellen", confirm: "Prüfen Sie Ihren Posteingang, um Ihre E-Mail zu bestätigen, und melden Sie sich dann an.", hint: "Magic-Link- und Google-Anmeldung kommen im nächsten Meilenstein — E-Mail + Passwort funktioniert schon heute." },
  feed: { empty: "Noch nichts veröffentlicht.", text: "Text", video: "Video", audio: "Audio" },
  groups: { empty: "Noch keine Gruppen.", private: "privat" },
  events: { title: "Events", empty: "Nichts Anstehendes." },
  jobs: { title: "Jobs", empty: "Keine offenen Stellen." },
  account: { signedIn: "Angemeldet", signInTitle: "Anmelden", signIn: "Anmelden", signOut: "Abmelden", email: "E-Mail", password: "Passwort", signedInMsg: "Angemeldet.", language: "Sprache" },
  profile: { follow: "Folgen", following: "Folge ich", followers: "Follower", follower: "Follower", posts: "Beiträge", noPosts: "Noch keine Beiträge.", verified: "Verifiziert", quality: "Qualität", curator: "Kurator:in", notFound: "Profil nicht gefunden." },
  group: { about: "Über", members: "Mitglieder", followers: "Follower", private: "Privat", follow: "Folgen", following: "Folge ich", requestJoin: "Beitritt anfragen", requested: "Angefragt", member: "Mitglied", feed: "Gruppen-Feed", noPosts: "Noch keine Beiträge in dieser Gruppe.", notFound: "Gruppe nicht gefunden." },
  compose: { title: "Neuer Beitrag", newPost: "Neuer Beitrag", image: "Bild", text: "Text", pickImage: "Bild auswählen", changeImage: "Bild ändern", caption: "Bildunterschrift", category: "Kategorie", altText: "Alternativtext (Werk beschreiben)", body: "Ihre Worte", publish: "Veröffentlichen", publishing: "Wird veröffentlicht…", creatorsOnly: "Nur für Kreative", creatorsOnlyBody: "Veröffentlichen ist für freigeschaltete Kreative. Werden Sie auf Atelier Kreative:r und posten Sie dann hier.", becomeCreator: "Kreativer werden →", needImage: "Wählen Sie zuerst ein Bild.", needCategory: "Wählen Sie eine Kategorie.", needBody: "Schreiben Sie etwas zum Veröffentlichen.", failed: "Veröffentlichen fehlgeschlagen. Versuchen Sie es erneut." },
};

const ja: Dictionary = {
  tabs: { feed: "フィード", groups: "グループ", events: "イベント", jobs: "求人", account: "アカウント" },
  login: { tagline: "作り手のための場所。", signIn: "ログイン", email: "メール", password: "パスワード", signInBtn: "ログイン", createAccount: "アカウント作成", confirm: "受信トレイでメールを確認してからログインしてください。", hint: "マジックリンクと Google ログインは次のマイルストーンで — メール＋パスワードは今すぐ使えます。" },
  feed: { empty: "まだ投稿がありません。", text: "テキスト", video: "動画", audio: "音声" },
  groups: { empty: "まだグループがありません。", private: "非公開" },
  events: { title: "イベント", empty: "予定はありません。" },
  jobs: { title: "求人", empty: "募集中の求人はありません。" },
  account: { signedIn: "ログイン中", signInTitle: "ログイン", signIn: "ログイン", signOut: "ログアウト", email: "メール", password: "パスワード", signedInMsg: "ログインしました。", language: "言語" },
  profile: { follow: "フォロー", following: "フォロー中", followers: "フォロワー", follower: "フォロワー", posts: "投稿", noPosts: "まだ投稿がありません。", verified: "認証済み", quality: "品質", curator: "キュレーター", notFound: "プロフィールが見つかりません。" },
  group: { about: "概要", members: "メンバー", followers: "フォロワー", private: "非公開", follow: "フォロー", following: "フォロー中", requestJoin: "参加をリクエスト", requested: "リクエスト済み", member: "メンバー", feed: "グループフィード", noPosts: "このグループにはまだ投稿がありません。", notFound: "グループが見つかりません。" },
  compose: { title: "新規投稿", newPost: "新規投稿", image: "画像", text: "テキスト", pickImage: "画像を選択", changeImage: "画像を変更", caption: "キャプション", category: "カテゴリー", altText: "代替テキスト（作品の説明）", body: "あなたの言葉", publish: "公開", publishing: "公開中…", creatorsOnly: "クリエイター限定", creatorsOnlyBody: "投稿は承認済みクリエイター向けです。Atelier でクリエイターになってから、ここで投稿できます。", becomeCreator: "クリエイターになる →", needImage: "先に画像を選んでください。", needCategory: "カテゴリーを選んでください。", needBody: "公開する内容を書いてください。", failed: "公開できませんでした。もう一度お試しください。" },
};

const zh: Dictionary = {
  tabs: { feed: "动态", groups: "群组", events: "活动", jobs: "招聘", account: "账户" },
  login: { tagline: "为创作者而生的地方。", signIn: "登录", email: "邮箱", password: "密码", signInBtn: "登录", createAccount: "创建账户", confirm: "请查收邮箱确认你的邮件，然后登录。", hint: "魔法链接和 Google 登录将在下一里程碑到来——邮箱＋密码现已可用。" },
  feed: { empty: "还没有发布内容。", text: "文字", video: "视频", audio: "音频" },
  groups: { empty: "还没有群组。", private: "私密" },
  events: { title: "活动", empty: "暂无即将活动。" },
  jobs: { title: "招聘", empty: "暂无开放职位。" },
  account: { signedIn: "已登录", signInTitle: "登录", signIn: "登录", signOut: "退出登录", email: "邮箱", password: "密码", signedInMsg: "已登录。", language: "语言" },
  profile: { follow: "关注", following: "关注中", followers: "关注者", follower: "关注者", posts: "帖子", noPosts: "还没有帖子。", verified: "已验证", quality: "优质", curator: "策展人", notFound: "未找到主页。" },
  group: { about: "关于", members: "成员", followers: "关注者", private: "私密", follow: "关注", following: "关注中", requestJoin: "申请加入", requested: "已申请", member: "成员", feed: "群组动态", noPosts: "该群组还没有帖子。", notFound: "未找到群组。" },
  compose: { title: "新帖子", newPost: "新帖子", image: "图片", text: "文字", pickImage: "选择图片", changeImage: "更换图片", caption: "说明", category: "分类", altText: "替代文本（描述作品）", body: "你的文字", publish: "发布", publishing: "发布中…", creatorsOnly: "仅限创作者", creatorsOnlyBody: "发布面向获批创作者。先在 Atelier 成为创作者，再在这里发布。", becomeCreator: "成为创作者 →", needImage: "请先选择图片。", needCategory: "请选择分类。", needBody: "请写点内容再发布。", failed: "无法发布。请重试。" },
};

const ar: Dictionary = {
  tabs: { feed: "الموجز", groups: "المجموعات", events: "الفعاليات", jobs: "الوظائف", account: "الحساب" },
  login: { tagline: "مكان للمبدعين.", signIn: "تسجيل الدخول", email: "البريد الإلكتروني", password: "كلمة المرور", signInBtn: "تسجيل الدخول", createAccount: "إنشاء حساب", confirm: "تحقق من بريدك لتأكيد عنوانك ثم سجّل الدخول.", hint: "تسجيل الدخول بالرابط السحري وعبر Google يصل في المرحلة القادمة — البريد وكلمة المرور يعملان الآن." },
  feed: { empty: "لا منشورات بعد.", text: "نص", video: "فيديو", audio: "صوت" },
  groups: { empty: "لا مجموعات بعد.", private: "خاص" },
  events: { title: "الفعاليات", empty: "لا شيء قادم." },
  jobs: { title: "الوظائف", empty: "لا وظائف مفتوحة." },
  account: { signedIn: "مُسجَّل الدخول", signInTitle: "تسجيل الدخول", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج", email: "البريد الإلكتروني", password: "كلمة المرور", signedInMsg: "تم تسجيل الدخول.", language: "اللغة" },
  profile: { follow: "متابعة", following: "متابَع", followers: "متابعون", follower: "متابِع", posts: "المنشورات", noPosts: "لا منشورات بعد.", verified: "موثّق", quality: "جودة", curator: "منسّق", notFound: "الملف غير موجود." },
  group: { about: "نبذة", members: "أعضاء", followers: "متابعون", private: "خاص", follow: "متابعة", following: "متابَع", requestJoin: "طلب الانضمام", requested: "تم الطلب", member: "عضو", feed: "موجز المجموعة", noPosts: "لا منشورات في هذه المجموعة بعد.", notFound: "المجموعة غير موجودة." },
  compose: { title: "منشور جديد", newPost: "منشور جديد", image: "صورة", text: "نص", pickImage: "اختر صورة", changeImage: "تغيير الصورة", caption: "التعليق", category: "الفئة", altText: "نص بديل (صِف العمل)", body: "كلماتك", publish: "نشر", publishing: "جارٍ النشر…", creatorsOnly: "للمبدعين فقط", creatorsOnlyBody: "النشر للمبدعين المعتمدين. كن مبدعًا على Atelier ثم انشر هنا.", becomeCreator: "كن مبدعًا ←", needImage: "اختر صورة أولًا.", needCategory: "اختر فئة.", needBody: "اكتب شيئًا لنشره.", failed: "تعذّر النشر. حاول مرة أخرى." },
};

const ru: Dictionary = {
  tabs: { feed: "Лента", groups: "Группы", events: "События", jobs: "Вакансии", account: "Аккаунт" },
  login: { tagline: "Место для авторов.", signIn: "Войти", email: "e-mail", password: "пароль", signInBtn: "Войти", createAccount: "Создать аккаунт", confirm: "Проверьте почту, подтвердите e-mail и войдите.", hint: "Вход по волшебной ссылке и через Google появится на следующем этапе — e-mail и пароль работают уже сейчас." },
  feed: { empty: "Пока ничего не опубликовано.", text: "Текст", video: "Видео", audio: "Аудио" },
  groups: { empty: "Пока нет групп.", private: "приватная" },
  events: { title: "События", empty: "Ничего предстоящего." },
  jobs: { title: "Вакансии", empty: "Нет открытых вакансий." },
  account: { signedIn: "Вы вошли", signInTitle: "Войти", signIn: "Войти", signOut: "Выйти", email: "e-mail", password: "пароль", signedInMsg: "Вы вошли.", language: "Язык" },
  profile: { follow: "Подписаться", following: "Вы подписаны", followers: "подписчиков", follower: "подписчик", posts: "Публикации", noPosts: "Пока нет публикаций.", verified: "Подтверждён", quality: "Качество", curator: "Куратор", notFound: "Профиль не найден." },
  group: { about: "Об этом", members: "участников", followers: "подписчиков", private: "Приватная", follow: "Подписаться", following: "Вы подписаны", requestJoin: "Подать заявку", requested: "Заявка отправлена", member: "Участник", feed: "Лента группы", noPosts: "В этой группе пока нет публикаций.", notFound: "Группа не найдена." },
  compose: { title: "Новый пост", newPost: "Новый пост", image: "Изображение", text: "Текст", pickImage: "Выбрать изображение", changeImage: "Заменить изображение", caption: "Подпись", category: "Категория", altText: "Альтернативный текст (опишите работу)", body: "Ваши слова", publish: "Опубликовать", publishing: "Публикация…", creatorsOnly: "Только для авторов", creatorsOnlyBody: "Публикация — для одобренных авторов. Станьте автором на Atelier, затем публикуйте здесь.", becomeCreator: "Стать автором →", needImage: "Сначала выберите изображение.", needCategory: "Выберите категорию.", needBody: "Напишите что-нибудь для публикации.", failed: "Не удалось опубликовать. Попробуйте снова." },
};

const it: Dictionary = {
  tabs: { feed: "Feed", groups: "Gruppi", events: "Eventi", jobs: "Lavoro", account: "Account" },
  login: { tagline: "Un luogo per i creatori.", signIn: "Accedi", email: "email", password: "password", signInBtn: "Accedi", createAccount: "Crea account", confirm: "Controlla la tua casella per confermare l’email, poi accedi.", hint: "L’accesso con link magico e Google arriva al prossimo traguardo — email + password funziona già oggi." },
  feed: { empty: "Ancora niente pubblicato.", text: "Testo", video: "Video", audio: "Audio" },
  groups: { empty: "Ancora nessun gruppo.", private: "privato" },
  events: { title: "Eventi", empty: "Niente in arrivo." },
  jobs: { title: "Lavoro", empty: "Nessuna posizione aperta." },
  account: { signedIn: "Connesso", signInTitle: "Accedi", signIn: "Accedi", signOut: "Esci", email: "email", password: "password", signedInMsg: "Connesso.", language: "Lingua" },
  profile: { follow: "Segui", following: "Seguito", followers: "follower", follower: "follower", posts: "Post", noPosts: "Ancora nessun post.", verified: "Verificato", quality: "Qualità", curator: "Curatore", notFound: "Profilo non trovato." },
  group: { about: "Info", members: "membri", followers: "follower", private: "Privato", follow: "Segui", following: "Seguito", requestJoin: "Richiedi di unirti", requested: "Richiesto", member: "Membro", feed: "Feed del gruppo", noPosts: "Ancora nessun post in questo gruppo.", notFound: "Gruppo non trovato." },
  compose: { title: "Nuovo post", newPost: "Nuovo post", image: "Immagine", text: "Testo", pickImage: "Scegli immagine", changeImage: "Cambia immagine", caption: "Didascalia", category: "Categoria", altText: "Testo alternativo (descrivi l’opera)", body: "Le tue parole", publish: "Pubblica", publishing: "Pubblicazione…", creatorsOnly: "Solo creatori", creatorsOnlyBody: "Pubblicare è per i creatori approvati. Diventa creatore su Atelier, poi pubblica qui.", becomeCreator: "Diventa creatore →", needImage: "Scegli prima un’immagine.", needCategory: "Scegli una categoria.", needBody: "Scrivi qualcosa da pubblicare.", failed: "Impossibile pubblicare. Riprova." },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr, pt, de, ja, zh, ar, ru, it };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en;
}
