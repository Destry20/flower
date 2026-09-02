require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { attachUser } = require('./auth');
const authRoutes = require('./routes/auth');
const cardsRoutes = require('./routes/cards');
const guestCardsRoutes = require('./routes/guestCards');
const adminRoutes = require('./routes/admin');
const shareRoutes = require('./routes/share');
const groupRoutes = require('./routes/group');
const statsRoutes = require('./routes/stats');
const db = require('./db');
const { buildShareMeta, escapeHtml } = require('./cardMeta');
const { tServer, pickLang } = require('./i18n');

const app = express();
const PORT = process.env.PORT || 3000;
// Наружу отдаём только public/ — там нет .env, исходников server/ и файла
// базы данных. Раздавать весь корень проекта через express.static было бы
// дырой: любой смог бы скачать /.env (JWT_SECRET) или /server/data/db.json
// (хеши паролей) напрямую по URL.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INDEX_HTML_PATH = path.join(PUBLIC_DIR, 'index.html');

app.disable('x-powered-by');
app.set('trust proxy', 1);

// CSP разрешает ровно то, что реально грузит страница: свой JS/CSS, шрифты
// Google Fonts, CDN qrcode.js для QR-кода и инлайн-стили (сайт строит вёрстку
// через innerHTML со style="..." — это осознанный компромисс, а не дыра).
// Рекламные теги Adsterra сюда НЕ добавляем: такие "CPM"-сети дёргают ещё и
// произвольные (в т.ч. явно рандомно сгенерированные — вида
// kettledroopingcontinuation.com) домены для трекинга и подгрузки самого
// объявления, вписать их все в allowlist нельзя. Ослаблять же connect-src/
// scriptSrc всего сайта до https: ради рекламы — то же самое, что дать
// любому XSS право слать данные куда угодно, а на сайте JWT-кука и данные
// аккаунтов. Поэтому реклама изолирована в отдельных iframe-страницах
// (public/x/*.html — путь специально без слова "ads": иначе блокировщики
// режут такие URL по общему правилу, ещё до всякого CSP) со своей,
// отдельной и более мягкой политикой — см. AD_CSP ниже. Изоляция от
// остального сайта — это sandbox на самих <iframe> в index.html, а не эта
// политика; подробности (включая то, почему там всё же есть allow-same-origin
// и что это значит) — в комментарии прямо над этими <iframe> в index.html.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // accounts.google.com — кнопка "Войти через Google" (Google Identity
      // Services): scriptSrc грузит их клиентскую библиотеку, connectSrc — её
      // сетевые запросы, frameSrc — сам виджет кнопки/One Tap рисуется у них
      // же во вложенном iframe (без этой директивы список сузился бы до
      // defaultSrc, то есть только self, и Google просто не смог бы
      // отрисоваться). Добавлено только когда реально понадобилось — до этого
      // тут стоял один cdnjs (шрифт-иконки QR-кода).
      scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://accounts.google.com'],
      // Вся вёрстка строится через onclick="..." в шаблонах (унаследовано от
      // исходного сайта) — без unsafe-inline здесь браузер молча блокирует
      // каждый клик. scriptSrc при этом остаётся строгим: внешний <script>
      // можно подключить только с самого сайта, cdnjs или accounts.google.com.
      scriptSrcAttr: ["'unsafe-inline'"],
      // accounts.google.com — сама кнопка Google подгружает свой CSS
      // (gsi/style) отдельно от скрипта, тем же запросом, что рисует виджет.
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://accounts.google.com'],
      frameSrc: ["'self'", 'https://accounts.google.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  // helmet по умолчанию ставит Cross-Origin-Opener-Policy: same-origin — это
  // рвёт именно всплывающее окно входа Google (Identity Services открывает
  // popup на accounts.google.com и общается с ним через ссылку window.opener/
  // postMessage; same-origin эту связь обрывает, и popup зависает пустым
  // белым окном на экране выбора аккаунта, так и не передав результат назад).
  // same-origin-allow-popups — тот же общий COOP-барьер против чужих окон,
  // но с явным исключением для окон, открытых нами самими через window.open
  // (в том числе Google-попап).
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// Отдельная, куда более мягкая CSP только для рекламных iframe-страниц —
// см. комментарий выше. Сами объявления мы не пишем и не контролируем,
// поэтому запрещать им конкретные домены бессмысленно; изоляция от
// остального сайта обеспечивается не этой политикой, а sandbox-атрибутом
// на <iframe> в index.html.
const AD_PAGE_PATHS = new Set(['/x/n1.html', '/x/n2.html']);
const AD_CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https:; connect-src https:; img-src https: data:; style-src 'unsafe-inline'; frame-src https:";
app.use((req, res, next) => {
  if(AD_PAGE_PATHS.has(req.path)) res.setHeader('Content-Security-Policy', AD_CSP);
  next();
});

app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(attachUser);

// Считаем "просмотр страницы" только для настоящих страниц сайта (/, /c/<id>
// и /group/<id>) — раньше засчитывался вообще любой GET без расширения файла,
// из-за чего боты, сканирующие /.env, /.git/config и подобное, засоряли
// статистику и "Recent activity" в админке вперемешку с реальными визитами.
const REAL_PAGE_RE = /^\/((c|group)\/[A-Za-z0-9]+|birthday-card|love-card|thank-you-card|virtual-bouquet|congrats-card|support-card|just-because-card|sympathy-card|blog\/(en\/)?(birthday-wishes|thank-you-messages|love-messages|sympathy-messages))?$/;
app.use((req, res, next) => {
  if(req.method === 'GET' && REAL_PAGE_RE.test(req.path)){
    db.recordVisit(req.path, req.get('user-agent'));
  }
  next();
});

// Рубильник сайта из админки (POST /api/admin/site-status). /admin и
// /api/admin всегда пропускаем — иначе включить сайт обратно стало бы неоткуда.
app.use((req, res, next) => {
  if(db.getSiteEnabled()) return next();
  if(req.path.startsWith('/admin') || req.path.startsWith('/api/admin')) return next();
  if(req.path.startsWith('/api')){
    return res.status(503).json({ error: 'Site is temporarily unavailable' });
  }
  const lang = pickLang(req);
  const html = lang === 'ru'
    ? '<!doctype html><html lang="ru"><meta charset="utf-8"><title>VivoRose — техническое обслуживание</title><body style="font-family:sans-serif;text-align:center;padding:80px 20px;color:#4B2E3D"><h1>Сайт временно недоступен</h1><p>Мы скоро вернёмся. Загляните чуть позже.</p></body></html>'
    : '<!doctype html><html lang="en"><meta charset="utf-8"><title>VivoRose — under maintenance</title><body style="font-family:sans-serif;text-align:center;padding:80px 20px;color:#4B2E3D"><h1>Site temporarily unavailable</h1><p>We\'ll be back shortly. Please check back soon.</p></body></html>';
  res.status(503).set('Cache-Control', 'no-store').type('html').send(html);
});

// Публичная, нечувствительная конфигурация для клиента — сейчас только
// googleClientId (id клиента, не секрет — Google Client ID и так виден в
// каждом запросе OAuth-виджета, прятать его незачем). Пусто/null, пока
// владелец сайта не задаст GOOGLE_CLIENT_ID в .env — тогда клиент просто не
// показывает кнопку "Войти через Google", а не рендерит нерабочую.
app.get('/api/config', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/guest-cards', guestCardsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/stats', statsRoutes);

// Ссылка на открытку ("?data=...") сама по себе не грузит JS у ботов
// мессенджеров (WhatsApp/Telegram и т.д. не выполняют JavaScript) — без этого
// обработчика превью ссылки показывало бы только общее описание сайта вместо
// "Вам открытка от Ани". Реальным браузерам это не мешает: страница та же
// самая, просто с уже подставленными meta-тегами, дальше её ведёт main.js.
app.get('/', (req, res, next) => {
  const cardData = typeof req.query.data === 'string' ? req.query.data : null;
  if(!cardData) return next();
  const lang = pickLang(req);
  const meta = buildShareMeta(cardData, lang);
  if(!meta) return next(); // битая ссылка — пусть страницу открывает обычным образом, ошибку покажет main.js

  fs.readFile(INDEX_HTML_PATH, 'utf8', (err, html) => {
    if(err) return next();
    const fullUrl = escapeHtml(req.protocol + '://' + req.get('host') + req.originalUrl);
    const out = html
      .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
      .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${meta.title}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${meta.title}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${meta.description}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${meta.description}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${fullUrl}$2`);
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(out);
  });
});

// Короткая ссылка на сохранённую (за аккаунтом) открытку — вида /c/AbC123.
// Та же логика подстановки og:title/og:description под мессенджеры, что и у
// "?data=" выше, только данные открытки берём из базы по shortId, а не из URL.
app.get('/c/:shortId([A-Za-z0-9]{7})', (req, res, next) => {
  const card = db.findCardByShortId(req.params.shortId);
  const lang = pickLang(req);
  fs.readFile(INDEX_HTML_PATH, 'utf8', (err, html) => {
    if(err) return next();
    let out = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
    const meta = card && buildShareMeta(card.encodedData, lang);
    if(meta){
      const fullUrl = escapeHtml(req.protocol + '://' + req.get('host') + req.originalUrl);
      out = out
        .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${meta.title}$2`)
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${meta.title}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${meta.description}$2`)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${meta.description}$2`)
        .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${fullUrl}$2`);
    }
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(out);
  });
});

// Открытка "всей компанией" — вида /group/AbC123. Без подстановки og:title
// под конкретную открытку (данные не в URL/base64, как у обычных ссылок, а
// накапливаются на сервере) — просто lang + заголовок вкладки с именем
// получателя, если такая открытка вообще существует.
app.get('/group/:shortId([A-Za-z0-9]{7})', (req, res, next) => {
  const group = db.findGroupCardByShortId(req.params.shortId);
  const lang = pickLang(req);
  fs.readFile(INDEX_HTML_PATH, 'utf8', (err, html) => {
    if(err) return next();
    let out = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
    if(group){
      const title = escapeHtml(tServer(req, 'groupInviteTitle')(group.to));
      out = out.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    }
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(out);
  });
});

// SEO-лендинги под конкретные поисковые запросы (не просто "VivoRose") —
// список путей и текст в паре с public/script/main.js (SEO_LANDING_PAGES,
// там же выбор повода и подмена hero-заголовка). В отличие от / и /c/:id,
// у которых canonical нарочно всегда указывает на главную (см. комментарий
// у <link rel="canonical"> в index.html — открытки не должны конкурировать
// с ней в индексации), эти страницы как раз ДОЛЖНЫ индексироваться отдельно
// от главной, поэтому canonical здесь подставляем на себя же.
const SEO_PAGES = {
  '/birthday-card': {
    ru: { title: 'Виртуальная открытка на день рождения с букетом · VivoRose', description: 'Соберите открытку на день рождения с букетом, который распускается на экране, и отправьте одной ссылкой. Бесплатно, без регистрации.' },
    en: { title: 'Free Virtual Birthday Card With a Blooming Bouquet · VivoRose', description: 'Build a birthday card with a bouquet that blooms on screen and send it as one link. Free, no sign-up, ready in minutes.' }
  },
  '/love-card': {
    ru: { title: 'Виртуальная открытка с букетом — признание в любви · VivoRose', description: 'Соберите романтический букет и отправьте признание одной ссылкой. Открывается как настоящая открытка — с конвертом и цветением букета.' },
    en: { title: 'Free Virtual Love Card With a Bouquet · VivoRose', description: 'Build a romantic bouquet and send it as one link. It opens like a real card — with an envelope and a blooming bouquet.' }
  },
  '/thank-you-card': {
    ru: { title: 'Виртуальная открытка «Спасибо» с букетом · VivoRose', description: 'Скажите спасибо живой открыткой с букетом вместо простого текста. Соберите за пару минут, отправьте одной ссылкой — бесплатно.' },
    en: { title: 'Free Virtual Thank-You Card With a Bouquet · VivoRose', description: 'Say thank you with a living card and a bouquet instead of plain text. Build it in minutes and share it as one link, free.' }
  },
  '/virtual-bouquet': {
    ru: { title: 'Отправить виртуальный букет онлайн бесплатно · VivoRose', description: 'Соберите букет из цветов, ленты и вазы на свой вкус и отправьте одной ссылкой. Букет не завянет — это виртуальная открытка.' },
    en: { title: 'Send a Virtual Bouquet Online, Free · VivoRose', description: 'Build a bouquet from flowers, a ribbon, and a vase, then send it as one link. The bouquet never wilts — it\'s a virtual card.' }
  },
  '/congrats-card': {
    ru: { title: 'Виртуальная открытка с поздравлением и букетом · VivoRose', description: 'Соберите открытку с поздравлением и живым на вид букетом, отправьте одной ссылкой. Бесплатно, без регистрации.' },
    en: { title: 'Free Virtual Congratulations Card With a Bouquet · VivoRose', description: 'Build a congratulations card with a real-looking bouquet and send it as one link. Free, no sign-up, ready in minutes.' }
  },
  '/support-card': {
    ru: { title: 'Виртуальная открытка со словами поддержки · VivoRose', description: 'Покажите, что вы рядом — соберите открытку с букетом и тёплыми словами, отправьте одной ссылкой. Бесплатно.' },
    en: { title: 'Free Virtual Support Card With a Bouquet · VivoRose', description: 'Show someone you\'re there for them — build a card with a bouquet and send it as one link. Free, no sign-up.' }
  },
  '/just-because-card': {
    ru: { title: 'Виртуальная открытка просто так, без повода · VivoRose', description: 'Отправьте открытку с букетом просто потому что вспомнили о человеке — без повода, бесплатно, без регистрации.' },
    en: { title: 'Free "Just Because" Virtual Card With a Bouquet · VivoRose', description: 'Send a card with a bouquet just because — no occasion needed, free, no sign-up.' }
  },
  '/sympathy-card': {
    ru: { title: 'Открытка с соболезнованиями и букетом · VivoRose', description: 'Соберите открытку с соболезнованиями и мягким на вид букетом, добавьте несколько тёплых слов — и отправьте одной ссылкой. Бесплатно, без регистрации.' },
    en: { title: 'A Sympathy Card With a Bouquet · VivoRose', description: 'Build a sympathy card with a gentle bouquet and a few kind words, and send it as one link. Free, no sign-up.' }
  }
};
app.get(Object.keys(SEO_PAGES), (req, res, next) => {
  const page = SEO_PAGES[req.path];
  const lang = pickLang(req);
  const meta = page[lang];
  fs.readFile(INDEX_HTML_PATH, 'utf8', (err, html) => {
    if(err) return next();
    const fullUrl = escapeHtml(req.protocol + '://' + req.get('host') + req.path);
    const title = escapeHtml(meta.title);
    const description = escapeHtml(meta.description);
    const out = html
      .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${fullUrl}$2`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${fullUrl}$2`);
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(out);
  });
});

app.use(express.static(PUBLIC_DIR, {
  index: 'index.html',
  extensions: ['html'],
  setHeaders(res){
    // Проект активно меняется (новая правка — почти каждый запуск сервера),
    // поэтому пока держим no-cache на всём, включая JS/CSS: иначе браузер может
    // закэшировать старый script/main.js вместе со свежим style/main.css (или
    // наоборот) и получится вёрстка "из двух версий" — трудноотличимая от
    // настоящего бага. Перед реальным продакшеном стоит вернуть долгий кэш +
    // версионирование имён файлов (например, main.abc123.js).
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.use('/api', (req, res) => res.status(404).json({ error: tServer(req, 'notFound') }));

// Любой другой нераспознанный GET (опечатка в адресе, обрезанная при
// пересылке ссылка на открытку вроде /c/short, старая/битая ссылка) — без
// этого обработчика Express отвечал бы голым "Cannot GET /...", без стилей
// и брендинга. Отдаём тот же index.html (с правильным <html lang>, но
// стандартными title/description сайта) и статус 404, чтобы поисковики не
// индексировали такие адреса как настоящий контент.
app.get('*', (req, res, next) => {
  const lang = pickLang(req);
  fs.readFile(INDEX_HTML_PATH, 'utf8', (err, html) => {
    if(err) return next();
    const out = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
    res.status(404).set('Cache-Control', 'no-cache').type('html').send(out);
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: tServer(req, 'serverError') });
});

app.listen(PORT, () => {
  console.log(`VivoRose запущен: http://localhost:${PORT}`);
});
