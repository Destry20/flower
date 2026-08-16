require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { attachUser } = require('./auth');
const authRoutes = require('./routes/auth');
const cardsRoutes = require('./routes/cards');
const adminRoutes = require('./routes/admin');
const shareRoutes = require('./routes/share');
const groupRoutes = require('./routes/group');
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
// Когда подключите реальный AdSense/Яндекс.Директ (см. adSlotHtml в main.js),
// сюда нужно будет добавить их домены в scriptSrc/frameSrc/connectSrc — иначе
// CSP молча заблокирует показ баннеров.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      // Вся вёрстка строится через onclick="..." в шаблонах (унаследовано от
      // исходного сайта) — без unsafe-inline здесь браузер молча блокирует
      // каждый клик. scriptSrc при этом остаётся строгим: внешний <script>
      // можно подключить только с самого сайта или с cdnjs.
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  }
}));

app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(attachUser);

// Считаем "просмотр страницы" только для настоящих страниц сайта (/, /c/<id>
// и /group/<id>) — раньше засчитывался вообще любой GET без расширения файла,
// из-за чего боты, сканирующие /.env, /.git/config и подобное, засоряли
// статистику и "Recent activity" в админке вперемешку с реальными визитами.
const REAL_PAGE_RE = /^\/((c|group)\/[A-Za-z0-9]+)?$/;
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

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/group', groupRoutes);

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: tServer(req, 'serverError') });
});

app.listen(PORT, () => {
  console.log(`VivoRose запущен: http://localhost:${PORT}`);
});
