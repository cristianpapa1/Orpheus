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
}

const en: Dictionary = {
  tabs: { feed: "Feed", groups: "Groups", events: "Events", jobs: "Jobs", account: "Account" },
  login: { tagline: "A place for makers.", signIn: "Sign in", email: "email", password: "password", signInBtn: "Sign in", createAccount: "Create account", confirm: "Check your inbox to confirm your email, then sign in.", hint: "Magic-link and Google sign-in arrive with the next milestone — email + password works today." },
  feed: { empty: "Nothing published yet.", text: "Text", video: "Video", audio: "Audio" },
  groups: { empty: "No groups yet.", private: "private" },
  events: { title: "Events", empty: "Nothing upcoming." },
  jobs: { title: "Jobs", empty: "No open positions." },
  account: { signedIn: "Signed in", signInTitle: "Sign in", signIn: "Sign in", signOut: "Sign out", email: "email", password: "password", signedInMsg: "Signed in.", language: "Language" },
};

const fr: Dictionary = {
  tabs: { feed: "Fil", groups: "Groupes", events: "Événements", jobs: "Emplois", account: "Compte" },
  login: { tagline: "Un lieu pour les créateurs.", signIn: "Connexion", email: "e-mail", password: "mot de passe", signInBtn: "Connexion", createAccount: "Créer un compte", confirm: "Vérifiez votre boîte mail pour confirmer votre e-mail, puis connectez-vous.", hint: "La connexion par lien magique et Google arrive au prochain jalon — l’e-mail + mot de passe fonctionne aujourd’hui." },
  feed: { empty: "Rien de publié pour l’instant.", text: "Texte", video: "Vidéo", audio: "Audio" },
  groups: { empty: "Aucun groupe pour l’instant.", private: "privé" },
  events: { title: "Événements", empty: "Rien à venir." },
  jobs: { title: "Emplois", empty: "Aucun poste ouvert." },
  account: { signedIn: "Connecté", signInTitle: "Connexion", signIn: "Connexion", signOut: "Se déconnecter", email: "e-mail", password: "mot de passe", signedInMsg: "Connecté.", language: "Langue" },
};

const pt: Dictionary = {
  tabs: { feed: "Feed", groups: "Grupos", events: "Eventos", jobs: "Vagas", account: "Conta" },
  login: { tagline: "Um lugar para criadores.", signIn: "Entrar", email: "e-mail", password: "senha", signInBtn: "Entrar", createAccount: "Criar conta", confirm: "Verifique sua caixa de entrada para confirmar seu e-mail e depois entre.", hint: "Login por link mágico e Google chega no próximo marco — e-mail + senha já funciona." },
  feed: { empty: "Nada publicado ainda.", text: "Texto", video: "Vídeo", audio: "Áudio" },
  groups: { empty: "Nenhum grupo ainda.", private: "privado" },
  events: { title: "Eventos", empty: "Nada por vir." },
  jobs: { title: "Vagas", empty: "Nenhuma vaga aberta." },
  account: { signedIn: "Conectado", signInTitle: "Entrar", signIn: "Entrar", signOut: "Sair", email: "e-mail", password: "senha", signedInMsg: "Conectado.", language: "Idioma" },
};

const de: Dictionary = {
  tabs: { feed: "Feed", groups: "Gruppen", events: "Events", jobs: "Jobs", account: "Konto" },
  login: { tagline: "Ein Ort für Kreative.", signIn: "Anmelden", email: "E-Mail", password: "Passwort", signInBtn: "Anmelden", createAccount: "Konto erstellen", confirm: "Prüfen Sie Ihren Posteingang, um Ihre E-Mail zu bestätigen, und melden Sie sich dann an.", hint: "Magic-Link- und Google-Anmeldung kommen im nächsten Meilenstein — E-Mail + Passwort funktioniert schon heute." },
  feed: { empty: "Noch nichts veröffentlicht.", text: "Text", video: "Video", audio: "Audio" },
  groups: { empty: "Noch keine Gruppen.", private: "privat" },
  events: { title: "Events", empty: "Nichts Anstehendes." },
  jobs: { title: "Jobs", empty: "Keine offenen Stellen." },
  account: { signedIn: "Angemeldet", signInTitle: "Anmelden", signIn: "Anmelden", signOut: "Abmelden", email: "E-Mail", password: "Passwort", signedInMsg: "Angemeldet.", language: "Sprache" },
};

const ja: Dictionary = {
  tabs: { feed: "フィード", groups: "グループ", events: "イベント", jobs: "求人", account: "アカウント" },
  login: { tagline: "作り手のための場所。", signIn: "ログイン", email: "メール", password: "パスワード", signInBtn: "ログイン", createAccount: "アカウント作成", confirm: "受信トレイでメールを確認してからログインしてください。", hint: "マジックリンクと Google ログインは次のマイルストーンで — メール＋パスワードは今すぐ使えます。" },
  feed: { empty: "まだ投稿がありません。", text: "テキスト", video: "動画", audio: "音声" },
  groups: { empty: "まだグループがありません。", private: "非公開" },
  events: { title: "イベント", empty: "予定はありません。" },
  jobs: { title: "求人", empty: "募集中の求人はありません。" },
  account: { signedIn: "ログイン中", signInTitle: "ログイン", signIn: "ログイン", signOut: "ログアウト", email: "メール", password: "パスワード", signedInMsg: "ログインしました。", language: "言語" },
};

const zh: Dictionary = {
  tabs: { feed: "动态", groups: "群组", events: "活动", jobs: "招聘", account: "账户" },
  login: { tagline: "为创作者而生的地方。", signIn: "登录", email: "邮箱", password: "密码", signInBtn: "登录", createAccount: "创建账户", confirm: "请查收邮箱确认你的邮件，然后登录。", hint: "魔法链接和 Google 登录将在下一里程碑到来——邮箱＋密码现已可用。" },
  feed: { empty: "还没有发布内容。", text: "文字", video: "视频", audio: "音频" },
  groups: { empty: "还没有群组。", private: "私密" },
  events: { title: "活动", empty: "暂无即将活动。" },
  jobs: { title: "招聘", empty: "暂无开放职位。" },
  account: { signedIn: "已登录", signInTitle: "登录", signIn: "登录", signOut: "退出登录", email: "邮箱", password: "密码", signedInMsg: "已登录。", language: "语言" },
};

const ar: Dictionary = {
  tabs: { feed: "الموجز", groups: "المجموعات", events: "الفعاليات", jobs: "الوظائف", account: "الحساب" },
  login: { tagline: "مكان للمبدعين.", signIn: "تسجيل الدخول", email: "البريد الإلكتروني", password: "كلمة المرور", signInBtn: "تسجيل الدخول", createAccount: "إنشاء حساب", confirm: "تحقق من بريدك لتأكيد عنوانك ثم سجّل الدخول.", hint: "تسجيل الدخول بالرابط السحري وعبر Google يصل في المرحلة القادمة — البريد وكلمة المرور يعملان الآن." },
  feed: { empty: "لا منشورات بعد.", text: "نص", video: "فيديو", audio: "صوت" },
  groups: { empty: "لا مجموعات بعد.", private: "خاص" },
  events: { title: "الفعاليات", empty: "لا شيء قادم." },
  jobs: { title: "الوظائف", empty: "لا وظائف مفتوحة." },
  account: { signedIn: "مُسجَّل الدخول", signInTitle: "تسجيل الدخول", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج", email: "البريد الإلكتروني", password: "كلمة المرور", signedInMsg: "تم تسجيل الدخول.", language: "اللغة" },
};

const ru: Dictionary = {
  tabs: { feed: "Лента", groups: "Группы", events: "События", jobs: "Вакансии", account: "Аккаунт" },
  login: { tagline: "Место для авторов.", signIn: "Войти", email: "e-mail", password: "пароль", signInBtn: "Войти", createAccount: "Создать аккаунт", confirm: "Проверьте почту, подтвердите e-mail и войдите.", hint: "Вход по волшебной ссылке и через Google появится на следующем этапе — e-mail и пароль работают уже сейчас." },
  feed: { empty: "Пока ничего не опубликовано.", text: "Текст", video: "Видео", audio: "Аудио" },
  groups: { empty: "Пока нет групп.", private: "приватная" },
  events: { title: "События", empty: "Ничего предстоящего." },
  jobs: { title: "Вакансии", empty: "Нет открытых вакансий." },
  account: { signedIn: "Вы вошли", signInTitle: "Войти", signIn: "Войти", signOut: "Выйти", email: "e-mail", password: "пароль", signedInMsg: "Вы вошли.", language: "Язык" },
};

const it: Dictionary = {
  tabs: { feed: "Feed", groups: "Gruppi", events: "Eventi", jobs: "Lavoro", account: "Account" },
  login: { tagline: "Un luogo per i creatori.", signIn: "Accedi", email: "email", password: "password", signInBtn: "Accedi", createAccount: "Crea account", confirm: "Controlla la tua casella per confermare l’email, poi accedi.", hint: "L’accesso con link magico e Google arriva al prossimo traguardo — email + password funziona già oggi." },
  feed: { empty: "Ancora niente pubblicato.", text: "Testo", video: "Video", audio: "Audio" },
  groups: { empty: "Ancora nessun gruppo.", private: "privato" },
  events: { title: "Eventi", empty: "Niente in arrivo." },
  jobs: { title: "Lavoro", empty: "Nessuna posizione aperta." },
  account: { signedIn: "Connesso", signInTitle: "Accedi", signIn: "Accedi", signOut: "Esci", email: "email", password: "password", signedInMsg: "Connesso.", language: "Lingua" },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr, pt, de, ja, zh, ar, ru, it };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en;
}
