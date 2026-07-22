import type { Locale } from "./config";

/**
 * Astelier UI dictionary. `en` is the source of truth for the shape; every
 * locale must satisfy `Dictionary`. Mirrors atelier's i18n approach for the
 * commerce sibling — nav, bottom nav, browse/discovery, the seller flow, login.
 */
export interface Dictionary {
  nav: {
    browse: string;
    searchPlaceholder: string;
    backToAtelier: string;
    signIn: string;
    signOut: string;
  };
  bottomNav: {
    home: string;
    browse: string;
    search: string;
    sell: string;
  };
  browse: {
    title: string;
    discipline: string;
    all: string;
    sort: string;
    newest: string;
    priceUp: string;
    priceDown: string;
    stores: string;
    peopleYouFollow: string;
    allStores: string;
    noneFollowed: string;
    seeAllStores: string;
    noStores: string;
    piece: string;
    pieces: string;
  };
  sell: {
    curatorsDontSellTitle: string;
    curatorsDontSellBody: string;
    shopsForMakersTitle: string;
    shopsForMakersBody: string;
    becomeCreator: string;
    yourStore: string;
    openStore: string;
    editIntro: string;
    openIntro: string;
    storeViews: string;
    followersReached: string;
    liveProducts: string;
    catalogValue: string;
    products: string;
    viewStore: string;
    addProduct: string;
    total: string;
    live: string;
    draft: string;
    noProducts: string;
    edit: string;
    delete: string;
  };
  login: {
    heroTitle: string;
    heroLead: string;
    signIn: string;
    checkEmail: string;
    email: string;
    sendMagicLink: string;
    continueGoogle: string;
    previewMode: string;
    errUnconfigured: string;
    errEmail: string;
    errOtp: string;
    errRateLimit: string;
    errOauth: string;
    errAuth: string;
    errGeneric: string;
  };
  common: {
    noImage: string;
    saving: string;
    saved: string;
    saveFailed: string;
    cancel: string;
    uploading: string;
    nothingHere: string;
  };
  store: {
    catalog: string;
    noProducts: string;
  };
  product: {
    onlyYouSee: string;
    buy: string;
    visitStore: string;
    buyNote: string;
    noBuyLink: string;
  };
  search: {
    title: string;
    placeholder: string;
    search: string;
    stores: string;
    products: string;
    noResultsPrefix: string;
    prompt: string;
  };
  storeEditor: {
    storeName: string;
    handle: string;
    description: string;
    accent: string;
    saveStore: string;
    openStore: string;
    viewYourStore: string;
    banner: string;
    bannerHint: string;
    addBanner: string;
    removeBanner: string;
    logo: string;
    logoHint: string;
    changeOnAtelier: string;
  };
  productEditor: {
    newProduct: string;
    editProduct: string;
    shareBanner: string;
    postOnAtelier: string;
    title: string;
    priceUsd: string;
    description: string;
    images: string;
    addImages: string;
    disciplines: string;
    buyLink: string;
    buyLinkNote: string;
    status: string;
    statusNote: string;
    saveProduct: string;
    addProduct: string;
    signInUpload: string;
  };
  home: {
    heroTitle: string;
    heroLead: string;
    enter: string;
    enterBody: string;
    signIn: string;
    howItWorks: string;
    howBody: string;
    welcome: string;
    inBody: string;
    openStore: string;
    browseMakers: string;
    access: string;
    unlocked: string;
    makersFollowed: string;
    almostIn: string;
    almostBody: string;
    toGo: string;
    findMakers: string;
    whyFifteen: string;
    whyBody: string;
    importTitle: string;
    importBody: string;
    footerTagline: string;
    contact: string;
  };
}

const en: Dictionary = {
  nav: { browse: "Browse", searchPlaceholder: "Search", backToAtelier: "← Atelier", signIn: "Sign in", signOut: "Sign out" },
  bottomNav: { home: "Home", browse: "Browse", search: "Search", sell: "Sell" },
  browse: { title: "Browse", discipline: "Discipline", all: "All", sort: "Sort", newest: "Newest", priceUp: "Price ↑", priceDown: "Price ↓", stores: "Stores", peopleYouFollow: "People you follow", allStores: "All stores", noneFollowed: "None of the makers you follow have a store yet.", seeAllStores: "See all stores", noStores: "No stores yet.", piece: "piece", pieces: "pieces" },
  sell: { curatorsDontSellTitle: "Curators don't sell", curatorsDontSellBody: "You're an Atelier curator — a tastemaker. Opening a shop is for makers: become an approved creator on Atelier and you can sell here too, curator badge and all. Until then, keep curating — repost work as \"curated\" from any post's Act menu on Atelier.", shopsForMakersTitle: "Shops are for makers", shopsForMakersBody: "Astelier shops are for approved creators — makers who sell what they make. As a member you can browse and buy, but not open a shop. Become a creator on Atelier, then come back to open yours.", becomeCreator: "Become a creator on Atelier →", yourStore: "Your store", openStore: "Open your store", editIntro: "Edit your storefront, then add the work you make.", openIntro: "Name your storefront and claim its handle. You can add products once it's open.", storeViews: "Store views", followersReached: "Followers reached", liveProducts: "Live products", catalogValue: "Catalog value", products: "Products", viewStore: "View store →", addProduct: "+ Add product", total: "total", live: "live", draft: "draft", noProducts: "No products yet — add your first.", edit: "Edit", delete: "Delete" },
  login: { heroTitle: "Sign in to sell.", heroLead: "Your Atelier account is your Astelier account. Use the same email — one identity across both.", signIn: "Sign in", checkEmail: "Check your email for a sign-in link.", email: "Email", sendMagicLink: "Send magic link", continueGoogle: "Continue with Google", previewMode: "Preview mode — connect Supabase to sign in.", errUnconfigured: "Sign-in is unavailable until Supabase is configured.", errEmail: "Enter your email address to receive a sign-in link.", errOtp: "We couldn't send the link. Check the address and try again.", errRateLimit: "Email limit reached — try again in an hour.", errOauth: "Google sign-in failed. Try again or use email.", errAuth: "That sign-in link expired or was invalid. Request a fresh one.", errGeneric: "Something went wrong. Try again." },
  common: { noImage: "No image", saving: "Saving…", saved: "Saved.", saveFailed: "Save failed.", cancel: "Cancel", uploading: "Uploading…", nothingHere: "Nothing here yet." },
  store: { catalog: "Catalog", noProducts: "No products yet — this maker is setting up." },
  product: { onlyYouSee: "— only you can see this", buy: "Buy →", visitStore: "Visit the store", buyNote: "Buy takes you to the maker's own shop.", noBuyLink: "This maker hasn't added a buy link yet." },
  search: { title: "Search", placeholder: "Stores and products…", search: "Search", stores: "Stores", products: "Products", noResultsPrefix: "No stores or products match", prompt: "Search makers' stores and the work they sell." },
  storeEditor: { storeName: "Store name", handle: "Handle", description: "Description", accent: "Accent", saveStore: "Save store", openStore: "Open store", viewYourStore: "View your store →", banner: "Banner", bannerHint: "Wide image across the top of your store.", addBanner: "Add banner", removeBanner: "Remove", logo: "Store logo", logoHint: "From your Atelier profile picture — no upload needed.", changeOnAtelier: "Change on Atelier →" },
  productEditor: { newProduct: "New product", editProduct: "Edit product", shareBanner: "Share this on Atelier — a post with a Checkout button.", postOnAtelier: "Post on Atelier →", title: "Title", priceUsd: "Price (USD)", description: "Description", images: "Images", addImages: "Add images", disciplines: "Disciplines", buyLink: "Buy link (your shop)", buyLinkNote: "Where \"Buy\" sends the shopper. Astelier is the catalog; the sale happens on your shop (for now).", status: "Status", statusNote: "Only \"Live\" products show in your public catalog.", saveProduct: "Save product", addProduct: "Add product", signInUpload: "Sign in to upload." },
  home: { heroTitle: "Sell what you make.", heroLead: "Astelier is where Atelier makers sell — the same community, the same Bauhaus rooms, a place of its own for commerce. No ads, no boosted listings. The maker owns the sale.", enter: "Enter", enterBody: "Your Atelier account is your Astelier account — one sign-in.", signIn: "Sign in →", howItWorks: "How it works", howBody: "Follow at least {n} makers on Atelier and Astelier opens. You take part in the community before you transact.", welcome: "Welcome", inBody: "You're in. Astelier is opening in stages — stores and a maker catalog are next.", openStore: "Open your store →", browseMakers: "Browse makers →", access: "Access", unlocked: "Unlocked", makersFollowed: "makers followed on Atelier.", almostIn: "Almost in", almostBody: "Astelier opens once you follow {n} makers on Atelier. You take part in the community before you transact.", toGo: "to go", findMakers: "Find makers on Atelier →", whyFifteen: "Why fifteen?", whyBody: "Commerce that grows out of a community, not a storefront dropped on strangers. Follow the makers whose work you'd want to buy.", importTitle: "Bring your existing shop", importBody: "Already sell somewhere else? Import your whole catalog automatically — paste your shop's link and your products arrive as drafts, ready to publish. No re-uploading, no copying by hand.", footerTagline: "the commerce sibling to Atelier", contact: "contact" },
};

const fr: Dictionary = {
  nav: { browse: "Parcourir", searchPlaceholder: "Rechercher", backToAtelier: "← Atelier", signIn: "Connexion", signOut: "Se déconnecter" },
  bottomNav: { home: "Accueil", browse: "Parcourir", search: "Rechercher", sell: "Vendre" },
  browse: { title: "Parcourir", discipline: "Discipline", all: "Tous", sort: "Trier", newest: "Récents", priceUp: "Prix ↑", priceDown: "Prix ↓", stores: "Boutiques", peopleYouFollow: "Personnes que vous suivez", allStores: "Toutes les boutiques", noneFollowed: "Aucun des créateurs que vous suivez n’a encore de boutique.", seeAllStores: "Voir toutes les boutiques", noStores: "Aucune boutique pour l’instant.", piece: "pièce", pieces: "pièces" },
  sell: { curatorsDontSellTitle: "Les curateurs ne vendent pas", curatorsDontSellBody: "Vous êtes curateur sur Atelier — un prescripteur. Ouvrir une boutique est réservé aux créateurs : devenez créateur approuvé sur Atelier et vous pourrez vendre ici aussi, badge de curateur compris. En attendant, continuez à curer — republiez des œuvres « sélectionnées » depuis le menu Agir de n’importe quelle publication sur Atelier.", shopsForMakersTitle: "Les boutiques sont pour les créateurs", shopsForMakersBody: "Les boutiques Astelier sont réservées aux créateurs approuvés — ceux qui vendent ce qu’ils font. En tant que membre, vous pouvez explorer et acheter, mais pas ouvrir de boutique. Devenez créateur sur Atelier, puis revenez ouvrir la vôtre.", becomeCreator: "Devenir créateur sur Atelier →", yourStore: "Votre boutique", openStore: "Ouvrir votre boutique", editIntro: "Modifiez votre vitrine, puis ajoutez vos créations.", openIntro: "Nommez votre vitrine et réservez son identifiant. Vous pourrez ajouter des produits une fois ouverte.", storeViews: "Vues de la boutique", followersReached: "Abonnés touchés", liveProducts: "Produits en ligne", catalogValue: "Valeur du catalogue", products: "Produits", viewStore: "Voir la boutique →", addProduct: "+ Ajouter un produit", total: "au total", live: "en ligne", draft: "brouillon", noProducts: "Aucun produit pour l’instant — ajoutez le premier.", edit: "Modifier", delete: "Supprimer" },
  login: { heroTitle: "Connectez-vous pour vendre.", heroLead: "Votre compte Atelier est votre compte Astelier. Utilisez le même e-mail — une seule identité pour les deux.", signIn: "Connexion", checkEmail: "Vérifiez votre e-mail pour un lien de connexion.", email: "E-mail", sendMagicLink: "Envoyer le lien magique", continueGoogle: "Continuer avec Google", previewMode: "Mode aperçu — connectez Supabase pour vous connecter.", errUnconfigured: "La connexion est indisponible tant que Supabase n’est pas configuré.", errEmail: "Saisissez votre adresse e-mail pour recevoir un lien de connexion.", errOtp: "Impossible d’envoyer le lien. Vérifiez l’adresse et réessayez.", errRateLimit: "Limite d’e-mails atteinte — réessayez dans une heure.", errOauth: "La connexion Google a échoué. Réessayez ou utilisez l’e-mail.", errAuth: "Ce lien de connexion a expiré ou était invalide. Demandez-en un nouveau.", errGeneric: "Une erreur s’est produite. Réessayez." },
  common: { noImage: "Aucune image", saving: "Enregistrement…", saved: "Enregistré.", saveFailed: "Échec de l’enregistrement.", cancel: "Annuler", uploading: "Envoi…", nothingHere: "Rien pour l’instant." },
  store: { catalog: "Catalogue", noProducts: "Aucun produit pour l’instant — ce créateur s’installe." },
  product: { onlyYouSee: "— vous seul pouvez le voir", buy: "Acheter →", visitStore: "Visiter la boutique", buyNote: "« Acheter » vous mène à la boutique du créateur.", noBuyLink: "Ce créateur n’a pas encore ajouté de lien d’achat." },
  search: { title: "Rechercher", placeholder: "Boutiques et produits…", search: "Rechercher", stores: "Boutiques", products: "Produits", noResultsPrefix: "Aucune boutique ni produit ne correspond à", prompt: "Cherchez les boutiques des créateurs et ce qu’ils vendent." },
  storeEditor: { storeName: "Nom de la boutique", handle: "Identifiant", description: "Description", accent: "Accent", saveStore: "Enregistrer la boutique", openStore: "Ouvrir la boutique", viewYourStore: "Voir votre boutique →", banner: "Bannière", bannerHint: "Image large en haut de votre boutique.", addBanner: "Ajouter une bannière", removeBanner: "Retirer", logo: "Logo de la boutique", logoHint: "Depuis votre photo de profil Atelier — aucun envoi nécessaire.", changeOnAtelier: "Modifier sur Atelier →" },
  productEditor: { newProduct: "Nouveau produit", editProduct: "Modifier le produit", shareBanner: "Partagez ceci sur Atelier — une publication avec un bouton Acheter.", postOnAtelier: "Publier sur Atelier →", title: "Titre", priceUsd: "Prix (USD)", description: "Description", images: "Images", addImages: "Ajouter des images", disciplines: "Disciplines", buyLink: "Lien d’achat (votre boutique)", buyLinkNote: "Où « Acheter » envoie l’acheteur. Astelier est le catalogue ; la vente se fait sur votre boutique (pour l’instant).", status: "Statut", statusNote: "Seuls les produits « En ligne » apparaissent dans votre catalogue public.", saveProduct: "Enregistrer le produit", addProduct: "Ajouter le produit", signInUpload: "Connectez-vous pour téléverser." },
  home: { heroTitle: "Vendez ce que vous créez.", heroLead: "Astelier est là où les créateurs d’Atelier vendent — la même communauté, les mêmes salles Bauhaus, un lieu à part pour le commerce. Pas de pub, pas d’annonces boostées. Le créateur possède la vente.", enter: "Entrer", enterBody: "Votre compte Atelier est votre compte Astelier — une seule connexion.", signIn: "Connexion →", howItWorks: "Comment ça marche", howBody: "Suivez au moins {n} créateurs sur Atelier et Astelier s’ouvre. Vous participez à la communauté avant de transiger.", welcome: "Bienvenue", inBody: "Vous y êtes. Astelier ouvre par étapes — les boutiques et un catalogue de créateurs arrivent.", openStore: "Ouvrir votre boutique →", browseMakers: "Parcourir les créateurs →", access: "Accès", unlocked: "Débloqué", makersFollowed: "créateurs suivis sur Atelier.", almostIn: "Presque là", almostBody: "Astelier s’ouvre dès que vous suivez {n} créateurs sur Atelier. Vous participez à la communauté avant de transiger.", toGo: "restants", findMakers: "Trouver des créateurs sur Atelier →", whyFifteen: "Pourquoi quinze ?", whyBody: "Un commerce qui naît d’une communauté, pas une vitrine posée devant des inconnus. Suivez les créateurs dont vous voudriez acheter le travail.", importTitle: "Amenez votre boutique existante", importBody: "Vous vendez déjà ailleurs ? Importez tout votre catalogue automatiquement — collez le lien de votre boutique et vos produits arrivent en brouillons, prêts à publier. Sans réimport ni recopie manuelle.", footerTagline: "le pendant commercial d’Atelier", contact: "contact" },
};

const pt: Dictionary = {
  nav: { browse: "Explorar", searchPlaceholder: "Buscar", backToAtelier: "← Atelier", signIn: "Entrar", signOut: "Sair" },
  bottomNav: { home: "Início", browse: "Explorar", search: "Buscar", sell: "Vender" },
  browse: { title: "Explorar", discipline: "Disciplina", all: "Todos", sort: "Ordenar", newest: "Recentes", priceUp: "Preço ↑", priceDown: "Preço ↓", stores: "Lojas", peopleYouFollow: "Pessoas que você segue", allStores: "Todas as lojas", noneFollowed: "Nenhum dos criadores que você segue tem loja ainda.", seeAllStores: "Ver todas as lojas", noStores: "Nenhuma loja ainda.", piece: "peça", pieces: "peças" },
  sell: { curatorsDontSellTitle: "Curadores não vendem", curatorsDontSellBody: "Você é curador no Atelier — um formador de gosto. Abrir uma loja é para criadores: torne-se um criador aprovado no Atelier e você poderá vender aqui também, com o selo de curador e tudo. Até lá, continue curando — reposte trabalhos como \"curados\" pelo menu Ações de qualquer publicação no Atelier.", shopsForMakersTitle: "Lojas são para criadores", shopsForMakersBody: "As lojas da Astelier são para criadores aprovados — que vendem o que fazem. Como membro você pode navegar e comprar, mas não abrir uma loja. Torne-se criador no Atelier e volte para abrir a sua.", becomeCreator: "Tornar-se criador no Atelier →", yourStore: "Sua loja", openStore: "Abra sua loja", editIntro: "Edite sua vitrine e depois adicione o que você faz.", openIntro: "Dê um nome à sua vitrine e reserve o identificador. Você pode adicionar produtos assim que abrir.", storeViews: "Visualizações da loja", followersReached: "Seguidores alcançados", liveProducts: "Produtos no ar", catalogValue: "Valor do catálogo", products: "Produtos", viewStore: "Ver loja →", addProduct: "+ Adicionar produto", total: "no total", live: "no ar", draft: "rascunho", noProducts: "Nenhum produto ainda — adicione o primeiro.", edit: "Editar", delete: "Excluir" },
  login: { heroTitle: "Entre para vender.", heroLead: "Sua conta do Atelier é sua conta da Astelier. Use o mesmo e-mail — uma identidade para as duas.", signIn: "Entrar", checkEmail: "Verifique seu e-mail para um link de acesso.", email: "E-mail", sendMagicLink: "Enviar link mágico", continueGoogle: "Continuar com o Google", previewMode: "Modo de prévia — conecte o Supabase para entrar.", errUnconfigured: "O acesso fica indisponível até o Supabase ser configurado.", errEmail: "Digite seu e-mail para receber um link de acesso.", errOtp: "Não conseguimos enviar o link. Verifique o endereço e tente de novo.", errRateLimit: "Limite de e-mails atingido — tente novamente em uma hora.", errOauth: "O login com Google falhou. Tente de novo ou use o e-mail.", errAuth: "Esse link de acesso expirou ou era inválido. Solicite um novo.", errGeneric: "Algo deu errado. Tente de novo." },
  common: { noImage: "Sem imagem", saving: "Salvando…", saved: "Salvo.", saveFailed: "Falha ao salvar.", cancel: "Cancelar", uploading: "Enviando…", nothingHere: "Nada por aqui ainda." },
  store: { catalog: "Catálogo", noProducts: "Nenhum produto ainda — este criador está montando a loja." },
  product: { onlyYouSee: "— só você pode ver isto", buy: "Comprar →", visitStore: "Visitar a loja", buyNote: "“Comprar” leva você à loja do próprio criador.", noBuyLink: "Este criador ainda não adicionou um link de compra." },
  search: { title: "Buscar", placeholder: "Lojas e produtos…", search: "Buscar", stores: "Lojas", products: "Produtos", noResultsPrefix: "Nenhuma loja ou produto corresponde a", prompt: "Busque as lojas dos criadores e o que eles vendem." },
  storeEditor: { storeName: "Nome da loja", handle: "Identificador", description: "Descrição", accent: "Destaque", saveStore: "Salvar loja", openStore: "Abrir loja", viewYourStore: "Ver sua loja →", banner: "Banner", bannerHint: "Imagem larga no topo da sua loja.", addBanner: "Adicionar banner", removeBanner: "Remover", logo: "Logo da loja", logoHint: "Da sua foto de perfil no Atelier — sem precisar enviar.", changeOnAtelier: "Alterar no Atelier →" },
  productEditor: { newProduct: "Novo produto", editProduct: "Editar produto", shareBanner: "Compartilhe isto no Atelier — uma publicação com botão de Compra.", postOnAtelier: "Publicar no Atelier →", title: "Título", priceUsd: "Preço (USD)", description: "Descrição", images: "Imagens", addImages: "Adicionar imagens", disciplines: "Disciplinas", buyLink: "Link de compra (sua loja)", buyLinkNote: "Para onde “Comprar” envia o comprador. A Astelier é o catálogo; a venda acontece na sua loja (por enquanto).", status: "Status", statusNote: "Só produtos “No ar” aparecem no seu catálogo público.", saveProduct: "Salvar produto", addProduct: "Adicionar produto", signInUpload: "Entre para enviar." },
  home: { heroTitle: "Venda o que você faz.", heroLead: "A Astelier é onde os criadores do Atelier vendem — a mesma comunidade, as mesmas salas Bauhaus, um lugar próprio para o comércio. Sem anúncios, sem listagens impulsionadas. O criador é dono da venda.", enter: "Entrar", enterBody: "Sua conta do Atelier é sua conta da Astelier — um único login.", signIn: "Entrar →", howItWorks: "Como funciona", howBody: "Siga pelo menos {n} criadores no Atelier e a Astelier abre. Você participa da comunidade antes de transacionar.", welcome: "Bem-vindo", inBody: "Você entrou. A Astelier abre em etapas — lojas e um catálogo de criadores vêm a seguir.", openStore: "Abra sua loja →", browseMakers: "Explorar criadores →", access: "Acesso", unlocked: "Desbloqueado", makersFollowed: "criadores seguidos no Atelier.", almostIn: "Quase lá", almostBody: "A Astelier abre assim que você seguir {n} criadores no Atelier. Você participa da comunidade antes de transacionar.", toGo: "restantes", findMakers: "Encontrar criadores no Atelier →", whyFifteen: "Por que quinze?", whyBody: "Um comércio que nasce de uma comunidade, não uma vitrine jogada diante de estranhos. Siga os criadores de quem você gostaria de comprar.", importTitle: "Traga a loja que você já tem", importBody: "Já vende em outro lugar? Importe todo o seu catálogo automaticamente — cole o link da sua loja e seus produtos chegam como rascunhos, prontos para publicar. Sem reenviar, sem copiar à mão.", footerTagline: "a irmã de comércio do Atelier", contact: "contato" },
};

const de: Dictionary = {
  nav: { browse: "Entdecken", searchPlaceholder: "Suchen", backToAtelier: "← Atelier", signIn: "Anmelden", signOut: "Abmelden" },
  bottomNav: { home: "Start", browse: "Entdecken", search: "Suchen", sell: "Verkaufen" },
  browse: { title: "Entdecken", discipline: "Disziplin", all: "Alle", sort: "Sortieren", newest: "Neueste", priceUp: "Preis ↑", priceDown: "Preis ↓", stores: "Shops", peopleYouFollow: "Personen, denen Sie folgen", allStores: "Alle Shops", noneFollowed: "Keiner der Kreativen, denen Sie folgen, hat bisher einen Shop.", seeAllStores: "Alle Shops ansehen", noStores: "Noch keine Shops.", piece: "Stück", pieces: "Stück" },
  sell: { curatorsDontSellTitle: "Kuratoren verkaufen nicht", curatorsDontSellBody: "Sie sind Kurator:in auf Atelier — ein:e Geschmacksgeber:in. Einen Shop zu eröffnen ist für Kreative: Werden Sie auf Atelier freigeschaltete:r Kreative:r, dann können Sie auch hier verkaufen, Kurator-Badge inklusive. Bis dahin: kuratieren Sie weiter — teilen Sie Werke „kuratiert“ über das Aktion-Menü jedes Beitrags auf Atelier.", shopsForMakersTitle: "Shops sind für Kreative", shopsForMakersBody: "Astelier-Shops sind für freigeschaltete Kreative — die verkaufen, was sie machen. Als Mitglied können Sie stöbern und kaufen, aber keinen Shop eröffnen. Werden Sie auf Atelier Kreative:r und kommen Sie zurück, um Ihren zu eröffnen.", becomeCreator: "Auf Atelier Kreative:r werden →", yourStore: "Ihr Shop", openStore: "Shop eröffnen", editIntro: "Bearbeiten Sie Ihre Storefront und fügen Sie dann Ihre Werke hinzu.", openIntro: "Benennen Sie Ihre Storefront und sichern Sie sich ihren Handle. Produkte können Sie hinzufügen, sobald sie offen ist.", storeViews: "Shop-Aufrufe", followersReached: "Erreichte Follower", liveProducts: "Aktive Produkte", catalogValue: "Katalogwert", products: "Produkte", viewStore: "Shop ansehen →", addProduct: "+ Produkt hinzufügen", total: "gesamt", live: "aktiv", draft: "Entwurf", noProducts: "Noch keine Produkte — fügen Sie Ihr erstes hinzu.", edit: "Bearbeiten", delete: "Löschen" },
  login: { heroTitle: "Anmelden zum Verkaufen.", heroLead: "Ihr Atelier-Konto ist Ihr Astelier-Konto. Nutzen Sie dieselbe E-Mail — eine Identität für beide.", signIn: "Anmelden", checkEmail: "Prüfen Sie Ihre E-Mail auf einen Anmeldelink.", email: "E-Mail", sendMagicLink: "Magischen Link senden", continueGoogle: "Mit Google fortfahren", previewMode: "Vorschaumodus — verbinden Sie Supabase, um sich anzumelden.", errUnconfigured: "Die Anmeldung ist nicht verfügbar, bis Supabase konfiguriert ist.", errEmail: "Geben Sie Ihre E-Mail-Adresse ein, um einen Anmeldelink zu erhalten.", errOtp: "Wir konnten den Link nicht senden. Prüfen Sie die Adresse und versuchen Sie es erneut.", errRateLimit: "E-Mail-Limit erreicht — versuchen Sie es in einer Stunde erneut.", errOauth: "Google-Anmeldung fehlgeschlagen. Versuchen Sie es erneut oder nutzen Sie E-Mail.", errAuth: "Dieser Anmeldelink ist abgelaufen oder ungültig. Fordern Sie einen neuen an.", errGeneric: "Etwas ist schiefgelaufen. Versuchen Sie es erneut." },
  common: { noImage: "Kein Bild", saving: "Wird gespeichert…", saved: "Gespeichert.", saveFailed: "Speichern fehlgeschlagen.", cancel: "Abbrechen", uploading: "Wird hochgeladen…", nothingHere: "Noch nichts hier." },
  store: { catalog: "Katalog", noProducts: "Noch keine Produkte — dieser Kreative richtet gerade ein." },
  product: { onlyYouSee: "— nur Sie sehen dies", buy: "Kaufen →", visitStore: "Shop besuchen", buyNote: "„Kaufen“ führt Sie zum eigenen Shop des Kreativen.", noBuyLink: "Dieser Kreative hat noch keinen Kauflink hinzugefügt." },
  search: { title: "Suche", placeholder: "Shops und Produkte…", search: "Suchen", stores: "Shops", products: "Produkte", noResultsPrefix: "Keine Shops oder Produkte passen zu", prompt: "Durchsuchen Sie die Shops der Kreativen und ihre Werke." },
  storeEditor: { storeName: "Shop-Name", handle: "Handle", description: "Beschreibung", accent: "Akzent", saveStore: "Shop speichern", openStore: "Shop eröffnen", viewYourStore: "Ihren Shop ansehen →", banner: "Banner", bannerHint: "Breites Bild oben in Ihrem Shop.", addBanner: "Banner hinzufügen", removeBanner: "Entfernen", logo: "Shop-Logo", logoHint: "Aus Ihrem Atelier-Profilbild — kein Hochladen nötig.", changeOnAtelier: "Auf Atelier ändern →" },
  productEditor: { newProduct: "Neues Produkt", editProduct: "Produkt bearbeiten", shareBanner: "Teilen Sie das auf Atelier — ein Beitrag mit Kaufen-Button.", postOnAtelier: "Auf Atelier posten →", title: "Titel", priceUsd: "Preis (USD)", description: "Beschreibung", images: "Bilder", addImages: "Bilder hinzufügen", disciplines: "Disziplinen", buyLink: "Kauflink (Ihr Shop)", buyLinkNote: "Wohin „Kaufen“ die Käufer führt. Astelier ist der Katalog; der Verkauf läuft über Ihren Shop (vorerst).", status: "Status", statusNote: "Nur „Aktive“ Produkte erscheinen in Ihrem öffentlichen Katalog.", saveProduct: "Produkt speichern", addProduct: "Produkt hinzufügen", signInUpload: "Zum Hochladen anmelden." },
  home: { heroTitle: "Verkaufen Sie, was Sie machen.", heroLead: "Astelier ist der Ort, an dem Atelier-Kreative verkaufen — dieselbe Community, dieselben Bauhaus-Räume, ein eigener Ort für den Handel. Keine Werbung, keine beworbenen Anzeigen. Der Verkauf gehört dem Kreativen.", enter: "Eintreten", enterBody: "Ihr Atelier-Konto ist Ihr Astelier-Konto — eine Anmeldung.", signIn: "Anmelden →", howItWorks: "So funktioniert es", howBody: "Folgen Sie mindestens {n} Kreativen auf Atelier, und Astelier öffnet sich. Sie sind Teil der Community, bevor Sie handeln.", welcome: "Willkommen", inBody: "Sie sind dabei. Astelier öffnet in Etappen — Shops und ein Kreativen-Katalog folgen.", openStore: "Shop eröffnen →", browseMakers: "Kreative entdecken →", access: "Zugang", unlocked: "Freigeschaltet", makersFollowed: "Kreativen auf Atelier gefolgt.", almostIn: "Fast drin", almostBody: "Astelier öffnet, sobald Sie {n} Kreativen auf Atelier folgen. Sie sind Teil der Community, bevor Sie handeln.", toGo: "übrig", findMakers: "Kreative auf Atelier finden →", whyFifteen: "Warum fünfzehn?", whyBody: "Handel, der aus einer Community wächst, nicht ein Schaufenster, das Fremden vorgesetzt wird. Folgen Sie den Kreativen, deren Werke Sie kaufen würden.", importTitle: "Bringen Sie Ihren bestehenden Shop mit", importBody: "Verkaufen Sie schon woanders? Importieren Sie Ihren gesamten Katalog automatisch — fügen Sie den Link Ihres Shops ein, und Ihre Produkte kommen als Entwürfe an, bereit zum Veröffentlichen. Kein erneutes Hochladen, kein Abtippen von Hand.", footerTagline: "das Handels-Geschwister von Atelier", contact: "Kontakt" },
};

const ja: Dictionary = {
  nav: { browse: "見つける", searchPlaceholder: "検索", backToAtelier: "← Atelier", signIn: "ログイン", signOut: "ログアウト" },
  bottomNav: { home: "ホーム", browse: "見つける", search: "検索", sell: "売る" },
  browse: { title: "見つける", discipline: "分野", all: "すべて", sort: "並び替え", newest: "新着", priceUp: "価格 ↑", priceDown: "価格 ↓", stores: "ストア", peopleYouFollow: "フォロー中の人", allStores: "すべてのストア", noneFollowed: "フォロー中の作り手にはまだストアがありません。", seeAllStores: "すべてのストアを見る", noStores: "まだストアがありません。", piece: "点", pieces: "点" },
  sell: { curatorsDontSellTitle: "キュレーターは販売しません", curatorsDontSellBody: "あなたは Atelier のキュレーター — 目利きです。ショップの開設は作り手向けです。Atelier で承認済みクリエイターになれば、キュレーターのバッジを持ったままここでも販売できます。それまではキュレーションを続けましょう — Atelier の任意の投稿の「操作」メニューから作品を「キュレーション」として再投稿できます。", shopsForMakersTitle: "ショップは作り手のためのものです", shopsForMakersBody: "Astelier のショップは承認済みクリエイター — 自分で作ったものを売る作り手 — のためのものです。メンバーは閲覧・購入はできますが、ショップは開けません。Atelier でクリエイターになってから、戻ってショップを開きましょう。", becomeCreator: "Atelier でクリエイターになる →", yourStore: "あなたのストア", openStore: "ストアを開く", editIntro: "ストアフロントを編集して、作ったものを追加しましょう。", openIntro: "ストアフロントに名前を付け、ハンドルを確保しましょう。開設後に商品を追加できます。", storeViews: "ストアの表示数", followersReached: "届いたフォロワー", liveProducts: "公開中の商品", catalogValue: "カタログ総額", products: "商品", viewStore: "ストアを見る →", addProduct: "+ 商品を追加", total: "合計", live: "公開", draft: "下書き", noProducts: "まだ商品がありません — 最初の1点を追加しましょう。", edit: "編集", delete: "削除" },
  login: { heroTitle: "ログインして販売。", heroLead: "あなたの Atelier アカウントがそのまま Astelier アカウントです。同じメールをご利用ください — 両方で一つのアカウント。", signIn: "ログイン", checkEmail: "サインイン用リンクをメールでご確認ください。", email: "メール", sendMagicLink: "マジックリンクを送信", continueGoogle: "Googleで続ける", previewMode: "プレビューモード — ログインには Supabase の接続が必要です。", errUnconfigured: "Supabaseが設定されるまでサインインは利用できません。", errEmail: "サインイン用リンクを受け取るにはメールアドレスを入力してください。", errOtp: "リンクを送信できませんでした。アドレスを確認して再度お試しください。", errRateLimit: "メール送信の上限に達しました — 1時間後に再度お試しください。", errOauth: "Googleサインインに失敗しました。再度お試しいただくかメールをご利用ください。", errAuth: "そのサインインリンクは期限切れか無効です。新しいものをリクエストしてください。", errGeneric: "問題が発生しました。もう一度お試しください。" },
  common: { noImage: "画像なし", saving: "保存中…", saved: "保存しました。", saveFailed: "保存に失敗しました。", cancel: "キャンセル", uploading: "アップロード中…", nothingHere: "まだ何もありません。" },
  store: { catalog: "カタログ", noProducts: "まだ商品がありません — この作り手は準備中です。" },
  product: { onlyYouSee: "— これはあなたにだけ表示されます", buy: "購入 →", visitStore: "ストアを見る", buyNote: "「購入」は作り手自身のショップに移動します。", noBuyLink: "この作り手はまだ購入リンクを追加していません。" },
  search: { title: "検索", placeholder: "ストアと商品…", search: "検索", stores: "ストア", products: "商品", noResultsPrefix: "一致するストアや商品はありません：", prompt: "作り手のストアと販売作品を検索しましょう。" },
  storeEditor: { storeName: "ストア名", handle: "ハンドル", description: "説明", accent: "アクセント", saveStore: "ストアを保存", openStore: "ストアを開く", viewYourStore: "あなたのストアを見る →", banner: "バナー", bannerHint: "ストア上部に表示される横長の画像。", addBanner: "バナーを追加", removeBanner: "削除", logo: "ストアのロゴ", logoHint: "Atelier のプロフィール画像を使用 — アップロード不要。", changeOnAtelier: "Atelier で変更 →" },
  productEditor: { newProduct: "新規商品", editProduct: "商品を編集", shareBanner: "これを Atelier で共有 — 購入ボタン付きの投稿。", postOnAtelier: "Atelier に投稿 →", title: "タイトル", priceUsd: "価格（USD）", description: "説明", images: "画像", addImages: "画像を追加", disciplines: "分野", buyLink: "購入リンク（あなたのショップ）", buyLinkNote: "「購入」が買い手を送る先。Astelier はカタログで、販売は（当面）あなたのショップで行われます。", status: "ステータス", statusNote: "「公開」の商品だけが公開カタログに表示されます。", saveProduct: "商品を保存", addProduct: "商品を追加", signInUpload: "アップロードするにはログインしてください。" },
  home: { heroTitle: "作ったものを売ろう。", heroLead: "Astelier は Atelier の作り手が販売する場所 — 同じコミュニティ、同じバウハウスの部屋、商取引のための独立した場所。広告なし、宣伝枠なし。売上は作り手のもの。", enter: "入る", enterBody: "あなたの Atelier アカウントが Astelier アカウントです — ログインは一つ。", signIn: "ログイン →", howItWorks: "仕組み", howBody: "Atelier で作り手を{n}人以上フォローすると Astelier が開きます。取引の前に、まずコミュニティに参加します。", welcome: "ようこそ", inBody: "参加できました。Astelier は段階的に公開中です — ストアと作り手カタログが次に来ます。", openStore: "ストアを開く →", browseMakers: "作り手を見る →", access: "アクセス", unlocked: "解除済み", makersFollowed: "人の作り手を Atelier でフォロー中。", almostIn: "あと少し", almostBody: "Atelier で作り手を{n}人フォローすると Astelier が開きます。取引の前に、まずコミュニティに参加します。", toGo: "残り", findMakers: "Atelier で作り手を探す →", whyFifteen: "なぜ15人？", whyBody: "見知らぬ人に突然出す店ではなく、コミュニティから育つ商取引。作品を買いたいと思える作り手をフォローしましょう。", importTitle: "いまのショップをそのまま", importBody: "すでに別の場所で販売していますか？ カタログをまるごと自動でインポート — ショップのリンクを貼るだけで、商品が下書きとして届き、公開の準備が整います。再アップロードも手作業のコピーも不要です。", footerTagline: "Atelier の商取引の姉妹版", contact: "お問い合わせ" },
};

const zh: Dictionary = {
  nav: { browse: "浏览", searchPlaceholder: "搜索", backToAtelier: "← Atelier", signIn: "登录", signOut: "退出登录" },
  bottomNav: { home: "首页", browse: "浏览", search: "搜索", sell: "出售" },
  browse: { title: "浏览", discipline: "学科", all: "全部", sort: "排序", newest: "最新", priceUp: "价格 ↑", priceDown: "价格 ↓", stores: "店铺", peopleYouFollow: "你关注的人", allStores: "所有店铺", noneFollowed: "你关注的创作者还没有店铺。", seeAllStores: "查看所有店铺", noStores: "暂无店铺。", piece: "件", pieces: "件" },
  sell: { curatorsDontSellTitle: "策展人不出售", curatorsDontSellBody: "你是 Atelier 策展人——品味引领者。开店面向创作者：在 Atelier 成为获批创作者，你就可以在这里出售，策展人徽章照旧保留。在此之前，继续策展——从 Atelier 任意帖子的“操作”菜单将作品转发为“精选”。", shopsForMakersTitle: "店铺面向创作者", shopsForMakersBody: "Astelier 店铺面向获批创作者——出售自己所作之物的人。作为成员，你可以浏览和购买，但不能开店。先在 Atelier 成为创作者，再回来开设你的店铺。", becomeCreator: "在 Atelier 成为创作者 →", yourStore: "你的店铺", openStore: "开设你的店铺", editIntro: "编辑你的店面，然后添加你的作品。", openIntro: "为你的店面命名并占用其标识。开店后即可添加商品。", storeViews: "店铺浏览量", followersReached: "触达的关注者", liveProducts: "上架商品", catalogValue: "目录价值", products: "商品", viewStore: "查看店铺 →", addProduct: "+ 添加商品", total: "总计", live: "上架", draft: "草稿", noProducts: "暂无商品——添加你的第一个。", edit: "编辑", delete: "删除" },
  login: { heroTitle: "登录以出售。", heroLead: "你的 Atelier 账户就是你的 Astelier 账户。使用同一邮箱——两者共用一个身份。", signIn: "登录", checkEmail: "请查收你的邮箱以获取登录链接。", email: "邮箱", sendMagicLink: "发送魔法链接", continueGoogle: "使用 Google 继续", previewMode: "预览模式——连接 Supabase 后可登录。", errUnconfigured: "在配置 Supabase 之前无法登录。", errEmail: "请输入你的邮箱以接收登录链接。", errOtp: "我们无法发送链接。请检查地址后重试。", errRateLimit: "已达邮件上限——请一小时后再试。", errOauth: "Google 登录失败。请重试或改用邮箱。", errAuth: "该登录链接已过期或无效。请重新获取一个。", errGeneric: "出了点问题。请重试。" },
  common: { noImage: "暂无图片", saving: "保存中…", saved: "已保存。", saveFailed: "保存失败。", cancel: "取消", uploading: "上传中…", nothingHere: "这里还什么都没有。" },
  store: { catalog: "目录", noProducts: "暂无商品——这位创作者正在筹备中。" },
  product: { onlyYouSee: "— 只有你能看到", buy: "购买 →", visitStore: "访问店铺", buyNote: "“购买”会带你前往创作者自己的店铺。", noBuyLink: "这位创作者还没有添加购买链接。" },
  search: { title: "搜索", placeholder: "店铺和商品…", search: "搜索", stores: "店铺", products: "商品", noResultsPrefix: "没有匹配的店铺或商品：", prompt: "搜索创作者的店铺及其出售的作品。" },
  storeEditor: { storeName: "店铺名称", handle: "标识", description: "描述", accent: "强调色", saveStore: "保存店铺", openStore: "开设店铺", viewYourStore: "查看你的店铺 →", banner: "横幅", bannerHint: "店铺顶部的宽幅图片。", addBanner: "添加横幅", removeBanner: "移除", logo: "店铺标志", logoHint: "取自你的 Atelier 头像——无需上传。", changeOnAtelier: "在 Atelier 修改 →" },
  productEditor: { newProduct: "新商品", editProduct: "编辑商品", shareBanner: "在 Atelier 分享——带购买按钮的帖子。", postOnAtelier: "发布到 Atelier →", title: "标题", priceUsd: "价格（USD）", description: "描述", images: "图片", addImages: "添加图片", disciplines: "学科", buyLink: "购买链接（你的店铺）", buyLinkNote: "“购买”将买家带往何处。Astelier 是目录；交易（目前）在你的店铺完成。", status: "状态", statusNote: "只有“上架”的商品会显示在你的公开目录中。", saveProduct: "保存商品", addProduct: "添加商品", signInUpload: "登录后上传。" },
  home: { heroTitle: "出售你的创作。", heroLead: "Astelier 是 Atelier 创作者出售作品的地方——同一个社区、同样的包豪斯空间，一个专属于交易的场所。没有广告，没有推广位。交易归创作者所有。", enter: "进入", enterBody: "你的 Atelier 账户就是你的 Astelier 账户——一次登录。", signIn: "登录 →", howItWorks: "运作方式", howBody: "在 Atelier 关注至少 {n} 位创作者，Astelier 即开启。你先融入社区，再进行交易。", welcome: "欢迎", inBody: "你已进入。Astelier 正在分阶段开放——店铺和创作者目录即将到来。", openStore: "开设你的店铺 →", browseMakers: "浏览创作者 →", access: "访问", unlocked: "已解锁", makersFollowed: "位创作者已在 Atelier 关注。", almostIn: "就快好了", almostBody: "在 Atelier 关注 {n} 位创作者后，Astelier 即开启。你先融入社区，再进行交易。", toGo: "位待关注", findMakers: "在 Atelier 寻找创作者 →", whyFifteen: "为什么是十五？", whyBody: "从社区中生长出来的商业，而非摆在陌生人面前的橱窗。关注你想购买其作品的创作者。", importTitle: "把你现有的店铺带过来", importBody: "已经在别处出售？自动导入你的整个目录——粘贴店铺链接，商品便以草稿形式到达，随时可发布。无需重新上传，无需手动复制。", footerTagline: "Atelier 的商务姊妹产品", contact: "联系" },
};

const ar: Dictionary = {
  nav: { browse: "تصفّح", searchPlaceholder: "بحث", backToAtelier: "← Atelier", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج" },
  bottomNav: { home: "الرئيسية", browse: "تصفّح", search: "بحث", sell: "بيع" },
  browse: { title: "تصفّح", discipline: "التخصص", all: "الكل", sort: "ترتيب", newest: "الأحدث", priceUp: "السعر ↑", priceDown: "السعر ↓", stores: "المتاجر", peopleYouFollow: "من تتابعهم", allStores: "كل المتاجر", noneFollowed: "لا يملك أيٌّ ممن تتابعهم متجرًا بعد.", seeAllStores: "عرض كل المتاجر", noStores: "لا متاجر بعد.", piece: "قطعة", pieces: "قطع" },
  sell: { curatorsDontSellTitle: "المنسّقون لا يبيعون", curatorsDontSellBody: "أنت منسّق على Atelier — صاحب ذوق. فتح متجر مخصص للمبدعين: كن مبدعًا مُعتمدًا على Atelier وستتمكن من البيع هنا أيضًا، مع شارة المنسّق. حتى ذلك الحين، واصل التنسيق — أعد نشر الأعمال كـ«مختارات» من قائمة الإجراءات في أي منشور على Atelier.", shopsForMakersTitle: "المتاجر للمبدعين", shopsForMakersBody: "متاجر Astelier مخصصة للمبدعين المعتمدين — الذين يبيعون ما يصنعونه. كعضو يمكنك التصفح والشراء، لكن لا يمكنك فتح متجر. كن مبدعًا على Atelier ثم عُد لفتح متجرك.", becomeCreator: "كن مبدعًا على Atelier →", yourStore: "متجرك", openStore: "افتح متجرك", editIntro: "عدّل واجهة متجرك ثم أضِف ما تصنعه.", openIntro: "سمِّ واجهة متجرك واحجز معرّفها. يمكنك إضافة المنتجات بمجرد فتحه.", storeViews: "مشاهدات المتجر", followersReached: "المتابعون الذين وصلتهم", liveProducts: "المنتجات المنشورة", catalogValue: "قيمة الكتالوج", products: "المنتجات", viewStore: "عرض المتجر →", addProduct: "+ إضافة منتج", total: "الإجمالي", live: "منشور", draft: "مسودة", noProducts: "لا منتجات بعد — أضِف أول منتج.", edit: "تعديل", delete: "حذف" },
  login: { heroTitle: "سجّل الدخول للبيع.", heroLead: "حساب Atelier هو حساب Astelier. استخدم البريد نفسه — هوية واحدة للاثنين.", signIn: "تسجيل الدخول", checkEmail: "تحقق من بريدك للحصول على رابط تسجيل الدخول.", email: "البريد الإلكتروني", sendMagicLink: "إرسال الرابط السحري", continueGoogle: "المتابعة عبر Google", previewMode: "وضع المعاينة — اربط Supabase لتسجيل الدخول.", errUnconfigured: "تسجيل الدخول غير متاح حتى يتم إعداد Supabase.", errEmail: "أدخل بريدك الإلكتروني لتلقّي رابط تسجيل الدخول.", errOtp: "تعذّر إرسال الرابط. تحقق من العنوان وحاول مرة أخرى.", errRateLimit: "تم بلوغ حد البريد — حاول بعد ساعة.", errOauth: "فشل تسجيل الدخول عبر Google. حاول مرة أخرى أو استخدم البريد.", errAuth: "انتهت صلاحية رابط تسجيل الدخول أو كان غير صالح. اطلب رابطًا جديدًا.", errGeneric: "حدث خطأ ما. حاول مرة أخرى." },
  common: { noImage: "لا صورة", saving: "جارٍ الحفظ…", saved: "تم الحفظ.", saveFailed: "فشل الحفظ.", cancel: "إلغاء", uploading: "جارٍ الرفع…", nothingHere: "لا شيء هنا بعد." },
  store: { catalog: "الكتالوج", noProducts: "لا منتجات بعد — هذا المبدع يُجهّز متجره." },
  product: { onlyYouSee: "— أنت وحدك ترى هذا", buy: "شراء →", visitStore: "زيارة المتجر", buyNote: "«شراء» ينقلك إلى متجر المبدع نفسه.", noBuyLink: "لم يُضِف هذا المبدع رابط شراء بعد." },
  search: { title: "بحث", placeholder: "المتاجر والمنتجات…", search: "بحث", stores: "المتاجر", products: "المنتجات", noResultsPrefix: "لا متاجر أو منتجات تطابق", prompt: "ابحث في متاجر المبدعين وما يبيعونه." },
  storeEditor: { storeName: "اسم المتجر", handle: "المعرّف", description: "الوصف", accent: "لون التمييز", saveStore: "حفظ المتجر", openStore: "فتح المتجر", viewYourStore: "عرض متجرك →", banner: "لافتة", bannerHint: "صورة عريضة أعلى متجرك.", addBanner: "إضافة لافتة", removeBanner: "إزالة", logo: "شعار المتجر", logoHint: "من صورة ملفك الشخصي على Atelier — دون الحاجة إلى رفع.", changeOnAtelier: "التغيير على Atelier ←" },
  productEditor: { newProduct: "منتج جديد", editProduct: "تعديل المنتج", shareBanner: "شارِك هذا على Atelier — منشور بزر شراء.", postOnAtelier: "النشر على Atelier →", title: "العنوان", priceUsd: "السعر (USD)", description: "الوصف", images: "الصور", addImages: "إضافة صور", disciplines: "التخصصات", buyLink: "رابط الشراء (متجرك)", buyLinkNote: "إلى أين يرسل «شراء» المشتري. Astelier هو الكتالوج؛ ويتم البيع في متجرك (حاليًا).", status: "الحالة", statusNote: "المنتجات «المنشورة» فقط تظهر في كتالوجك العام.", saveProduct: "حفظ المنتج", addProduct: "إضافة المنتج", signInUpload: "سجّل الدخول للرفع." },
  home: { heroTitle: "بِع ما تصنعه.", heroLead: "Astelier هو المكان الذي يبيع فيه مبدعو Atelier — المجتمع نفسه، غرف باوهاوس نفسها، ومكان خاص للتجارة. لا إعلانات، لا قوائم مُروَّجة. البيع مِلك المبدع.", enter: "ادخل", enterBody: "حساب Atelier هو حساب Astelier — تسجيل دخول واحد.", signIn: "تسجيل الدخول ←", howItWorks: "كيف يعمل", howBody: "تابِع {n} مبدعين على الأقل على Atelier ويُفتح Astelier. تشارك في المجتمع قبل أن تتعامل تجاريًا.", welcome: "أهلًا", inBody: "أنت الآن بالداخل. يُفتح Astelier على مراحل — المتاجر وكتالوج المبدعين قادمان.", openStore: "افتح متجرك ←", browseMakers: "تصفّح المبدعين ←", access: "الوصول", unlocked: "مفتوح", makersFollowed: "مبدعين تتابعهم على Atelier.", almostIn: "اقتربت", almostBody: "يُفتح Astelier بمجرد متابعتك {n} مبدعين على Atelier. تشارك في المجتمع قبل أن تتعامل تجاريًا.", toGo: "متبقّون", findMakers: "ابحث عن مبدعين على Atelier ←", whyFifteen: "لماذا خمسة عشر؟", whyBody: "تجارة تنمو من مجتمع، لا واجهة تُوضع أمام الغرباء. تابِع المبدعين الذين تودّ شراء أعمالهم.", importTitle: "أحضر متجرك الحالي", importBody: "تبيع بالفعل في مكان آخر؟ استورد كامل كتالوجك تلقائيًا — الصق رابط متجرك فتصل منتجاتك كمسودات جاهزة للنشر. دون إعادة رفع، ودون نسخ يدوي.", footerTagline: "الشقيق التجاري لـ Atelier", contact: "اتصل بنا" },
};

const ru: Dictionary = {
  nav: { browse: "Обзор", searchPlaceholder: "Поиск", backToAtelier: "← Atelier", signIn: "Войти", signOut: "Выйти" },
  bottomNav: { home: "Главная", browse: "Обзор", search: "Поиск", sell: "Продавать" },
  browse: { title: "Обзор", discipline: "Дисциплина", all: "Все", sort: "Сортировка", newest: "Новые", priceUp: "Цена ↑", priceDown: "Цена ↓", stores: "Магазины", peopleYouFollow: "Кого вы читаете", allStores: "Все магазины", noneFollowed: "Ни у кого из тех, на кого вы подписаны, пока нет магазина.", seeAllStores: "Показать все магазины", noStores: "Пока нет магазинов.", piece: "работа", pieces: "работ" },
  sell: { curatorsDontSellTitle: "Кураторы не продают", curatorsDontSellBody: "Вы куратор на Atelier — законодатель вкуса. Открытие магазина — для авторов: станьте одобренным автором на Atelier, и вы сможете продавать и здесь, вместе со значком куратора. А пока продолжайте курировать — репостите работы как «кураторские» из меню действий любой публикации на Atelier.", shopsForMakersTitle: "Магазины — для авторов", shopsForMakersBody: "Магазины Astelier — для одобренных авторов, которые продают то, что делают. Как участник вы можете смотреть и покупать, но не открывать магазин. Станьте автором на Atelier и возвращайтесь открывать свой.", becomeCreator: "Стать автором на Atelier →", yourStore: "Ваш магазин", openStore: "Открыть магазин", editIntro: "Отредактируйте витрину, затем добавьте свои работы.", openIntro: "Назовите витрину и закрепите её адрес. Товары можно добавить после открытия.", storeViews: "Просмотры магазина", followersReached: "Охват подписчиков", liveProducts: "Активные товары", catalogValue: "Стоимость каталога", products: "Товары", viewStore: "Открыть магазин →", addProduct: "+ Добавить товар", total: "всего", live: "активно", draft: "черновик", noProducts: "Пока нет товаров — добавьте первый.", edit: "Изменить", delete: "Удалить" },
  login: { heroTitle: "Войдите, чтобы продавать.", heroLead: "Ваш аккаунт Atelier — это ваш аккаунт Astelier. Используйте тот же e-mail — одна личность для обоих.", signIn: "Войти", checkEmail: "Проверьте почту — там ссылка для входа.", email: "E-mail", sendMagicLink: "Отправить волшебную ссылку", continueGoogle: "Продолжить с Google", previewMode: "Режим предпросмотра — подключите Supabase, чтобы войти.", errUnconfigured: "Вход недоступен, пока не настроен Supabase.", errEmail: "Введите e-mail, чтобы получить ссылку для входа.", errOtp: "Не удалось отправить ссылку. Проверьте адрес и попробуйте снова.", errRateLimit: "Достигнут лимит писем — попробуйте через час.", errOauth: "Вход через Google не удался. Попробуйте снова или используйте e-mail.", errAuth: "Ссылка для входа истекла или недействительна. Запросите новую.", errGeneric: "Что-то пошло не так. Попробуйте снова." },
  common: { noImage: "Нет изображения", saving: "Сохранение…", saved: "Сохранено.", saveFailed: "Не удалось сохранить.", cancel: "Отмена", uploading: "Загрузка…", nothingHere: "Здесь пока пусто." },
  store: { catalog: "Каталог", noProducts: "Пока нет товаров — этот автор ещё настраивает магазин." },
  product: { onlyYouSee: "— это видите только вы", buy: "Купить →", visitStore: "Перейти в магазин", buyNote: "«Купить» ведёт в собственный магазин автора.", noBuyLink: "Автор ещё не добавил ссылку для покупки." },
  search: { title: "Поиск", placeholder: "Магазины и товары…", search: "Искать", stores: "Магазины", products: "Товары", noResultsPrefix: "Нет магазинов или товаров по запросу", prompt: "Ищите магазины авторов и то, что они продают." },
  storeEditor: { storeName: "Название магазина", handle: "Адрес", description: "Описание", accent: "Акцент", saveStore: "Сохранить магазин", openStore: "Открыть магазин", viewYourStore: "Открыть ваш магазин →", banner: "Баннер", bannerHint: "Широкое изображение вверху вашего магазина.", addBanner: "Добавить баннер", removeBanner: "Убрать", logo: "Логотип магазина", logoHint: "Из вашего аватара в Atelier — загрузка не нужна.", changeOnAtelier: "Изменить в Atelier →" },
  productEditor: { newProduct: "Новый товар", editProduct: "Изменить товар", shareBanner: "Поделитесь этим на Atelier — публикация с кнопкой «Купить».", postOnAtelier: "Опубликовать на Atelier →", title: "Название", priceUsd: "Цена (USD)", description: "Описание", images: "Изображения", addImages: "Добавить изображения", disciplines: "Дисциплины", buyLink: "Ссылка для покупки (ваш магазин)", buyLinkNote: "Куда «Купить» отправляет покупателя. Astelier — это каталог; продажа (пока что) происходит в вашем магазине.", status: "Статус", statusNote: "В публичном каталоге показываются только «активные» товары.", saveProduct: "Сохранить товар", addProduct: "Добавить товар", signInUpload: "Войдите, чтобы загрузить." },
  home: { heroTitle: "Продавайте то, что делаете.", heroLead: "Astelier — это место, где продают авторы Atelier: то же сообщество, те же баухаус-залы, отдельное место для торговли. Без рекламы, без продвигаемых объявлений. Продажа принадлежит автору.", enter: "Войти", enterBody: "Ваш аккаунт Atelier — это ваш аккаунт Astelier — один вход.", signIn: "Войти →", howItWorks: "Как это работает", howBody: "Подпишитесь минимум на {n} авторов в Atelier — и Astelier откроется. Сначала вы часть сообщества, потом сделки.", welcome: "Добро пожаловать", inBody: "Вы внутри. Astelier открывается поэтапно — магазины и каталог авторов уже на подходе.", openStore: "Открыть магазин →", browseMakers: "Смотреть авторов →", access: "Доступ", unlocked: "Открыт", makersFollowed: "авторов, на которых вы подписаны в Atelier.", almostIn: "Почти готово", almostBody: "Astelier откроется, как только вы подпишетесь на {n} авторов в Atelier. Сначала вы часть сообщества, потом сделки.", toGo: "осталось", findMakers: "Найти авторов в Atelier →", whyFifteen: "Почему пятнадцать?", whyBody: "Торговля, которая вырастает из сообщества, а не витрина перед незнакомцами. Подписывайтесь на авторов, чьи работы хотели бы купить.", importTitle: "Перенесите свой магазин", importBody: "Уже продаёте где-то ещё? Импортируйте весь каталог автоматически — вставьте ссылку на свой магазин, и товары придут черновиками, готовыми к публикации. Без повторной загрузки и ручного переноса.", footerTagline: "коммерческий спутник Atelier", contact: "контакты" },
};

const it: Dictionary = {
  nav: { browse: "Esplora", searchPlaceholder: "Cerca", backToAtelier: "← Atelier", signIn: "Accedi", signOut: "Esci" },
  bottomNav: { home: "Home", browse: "Esplora", search: "Cerca", sell: "Vendi" },
  browse: { title: "Esplora", discipline: "Disciplina", all: "Tutti", sort: "Ordina", newest: "Recenti", priceUp: "Prezzo ↑", priceDown: "Prezzo ↓", stores: "Negozi", peopleYouFollow: "Persone che segui", allStores: "Tutti i negozi", noneFollowed: "Nessuno dei creatori che segui ha ancora un negozio.", seeAllStores: "Vedi tutti i negozi", noStores: "Ancora nessun negozio.", piece: "pezzo", pieces: "pezzi" },
  sell: { curatorsDontSellTitle: "I curatori non vendono", curatorsDontSellBody: "Sei un curatore su Atelier — un creatore di tendenze. Aprire un negozio è per i creatori: diventa un creatore approvato su Atelier e potrai vendere anche qui, badge di curatore compreso. Nel frattempo, continua a curare — ripubblica opere come «curate» dal menu Azioni di qualsiasi post su Atelier.", shopsForMakersTitle: "I negozi sono per i creatori", shopsForMakersBody: "I negozi Astelier sono per creatori approvati — chi vende ciò che crea. Come membro puoi sfogliare e comprare, ma non aprire un negozio. Diventa creatore su Atelier, poi torna ad aprire il tuo.", becomeCreator: "Diventa creatore su Atelier →", yourStore: "Il tuo negozio", openStore: "Apri il tuo negozio", editIntro: "Modifica la tua vetrina, poi aggiungi ciò che crei.", openIntro: "Dai un nome alla tua vetrina e assicurati il suo handle. Puoi aggiungere prodotti una volta aperta.", storeViews: "Visualizzazioni negozio", followersReached: "Follower raggiunti", liveProducts: "Prodotti attivi", catalogValue: "Valore del catalogo", products: "Prodotti", viewStore: "Vedi negozio →", addProduct: "+ Aggiungi prodotto", total: "totali", live: "attivi", draft: "bozza", noProducts: "Ancora nessun prodotto — aggiungi il primo.", edit: "Modifica", delete: "Elimina" },
  login: { heroTitle: "Accedi per vendere.", heroLead: "Il tuo account Atelier è il tuo account Astelier. Usa la stessa email — un’unica identità per entrambi.", signIn: "Accedi", checkEmail: "Controlla la tua email per un link di accesso.", email: "Email", sendMagicLink: "Invia link magico", continueGoogle: "Continua con Google", previewMode: "Modalità anteprima — collega Supabase per accedere.", errUnconfigured: "L’accesso non è disponibile finché Supabase non è configurato.", errEmail: "Inserisci la tua email per ricevere un link di accesso.", errOtp: "Non siamo riusciti a inviare il link. Controlla l’indirizzo e riprova.", errRateLimit: "Limite email raggiunto — riprova tra un’ora.", errOauth: "Accesso con Google non riuscito. Riprova o usa l’email.", errAuth: "Quel link di accesso è scaduto o non era valido. Richiedine uno nuovo.", errGeneric: "Qualcosa è andato storto. Riprova." },
  common: { noImage: "Nessuna immagine", saving: "Salvataggio…", saved: "Salvato.", saveFailed: "Salvataggio non riuscito.", cancel: "Annulla", uploading: "Caricamento…", nothingHere: "Ancora niente qui." },
  store: { catalog: "Catalogo", noProducts: "Ancora nessun prodotto — questo creatore sta allestendo." },
  product: { onlyYouSee: "— solo tu puoi vederlo", buy: "Acquista →", visitStore: "Visita il negozio", buyNote: "«Acquista» ti porta al negozio del creatore.", noBuyLink: "Questo creatore non ha ancora aggiunto un link d’acquisto." },
  search: { title: "Cerca", placeholder: "Negozi e prodotti…", search: "Cerca", stores: "Negozi", products: "Prodotti", noResultsPrefix: "Nessun negozio o prodotto corrisponde a", prompt: "Cerca i negozi dei creatori e ciò che vendono." },
  storeEditor: { storeName: "Nome del negozio", handle: "Handle", description: "Descrizione", accent: "Accento", saveStore: "Salva negozio", openStore: "Apri negozio", viewYourStore: "Vedi il tuo negozio →", banner: "Banner", bannerHint: "Immagine larga in cima al tuo negozio.", addBanner: "Aggiungi banner", removeBanner: "Rimuovi", logo: "Logo del negozio", logoHint: "Dalla tua foto profilo Atelier — nessun caricamento necessario.", changeOnAtelier: "Modifica su Atelier →" },
  productEditor: { newProduct: "Nuovo prodotto", editProduct: "Modifica prodotto", shareBanner: "Condividi questo su Atelier — un post con pulsante Acquista.", postOnAtelier: "Pubblica su Atelier →", title: "Titolo", priceUsd: "Prezzo (USD)", description: "Descrizione", images: "Immagini", addImages: "Aggiungi immagini", disciplines: "Discipline", buyLink: "Link d’acquisto (il tuo negozio)", buyLinkNote: "Dove «Acquista» porta l’acquirente. Astelier è il catalogo; la vendita avviene sul tuo negozio (per ora).", status: "Stato", statusNote: "Solo i prodotti «Attivi» compaiono nel tuo catalogo pubblico.", saveProduct: "Salva prodotto", addProduct: "Aggiungi prodotto", signInUpload: "Accedi per caricare." },
  home: { heroTitle: "Vendi ciò che crei.", heroLead: "Astelier è dove i creatori di Atelier vendono — la stessa comunità, le stesse stanze Bauhaus, un luogo tutto suo per il commercio. Niente pubblicità, niente inserzioni sponsorizzate. La vendita è del creatore.", enter: "Entra", enterBody: "Il tuo account Atelier è il tuo account Astelier — un unico accesso.", signIn: "Accedi →", howItWorks: "Come funziona", howBody: "Segui almeno {n} creatori su Atelier e Astelier si apre. Fai parte della comunità prima di fare acquisti.", welcome: "Benvenuto", inBody: "Ci sei. Astelier apre a tappe — negozi e un catalogo di creatori sono i prossimi.", openStore: "Apri il tuo negozio →", browseMakers: "Esplora i creatori →", access: "Accesso", unlocked: "Sbloccato", makersFollowed: "creatori seguiti su Atelier.", almostIn: "Ci sei quasi", almostBody: "Astelier si apre non appena segui {n} creatori su Atelier. Fai parte della comunità prima di fare acquisti.", toGo: "rimanenti", findMakers: "Trova creatori su Atelier →", whyFifteen: "Perché quindici?", whyBody: "Un commercio che nasce da una comunità, non una vetrina messa davanti a estranei. Segui i creatori di cui vorresti comprare il lavoro.", importTitle: "Porta il negozio che hai già", importBody: "Vendi già altrove? Importa tutto il catalogo automaticamente — incolla il link del tuo negozio e i prodotti arrivano come bozze, pronti da pubblicare. Senza ricaricare, senza copiare a mano.", footerTagline: "il fratello commerciale di Atelier", contact: "contatti" },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr, pt, de, ja, zh, ar, ru, it };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en;
}
