// Простое файловое хранилище (JSON) — без внешней БД и нативных зависимостей.
// Подходит для небольшого/среднего трафика. Если проект вырастет, этот модуль
// можно заменить на настоящую БД (Postgres/SQLite), не трогая роуты — они
// работают только через функции, экспортированные ниже.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const MAX_RECENT_VISITS = 200;
const MAX_CLIENT_ERRORS = 200;
const TRAFFIC_RETENTION_DAYS = 90;

function defaultData(){
  return {
    users: [], cards: [], groupCards: [],
    meta: { siteEnabled: true },
    traffic: { byDay: {}, byDayBot: {}, recent: [] },
    errors: []
  };
}

function load(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if(!fs.existsSync(DB_FILE)){
    const initial = defaultData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try{
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultData(), ...parsed };
  }catch(e){
    // Повреждённый файл — не роняем сервер, начинаем с пустой базы,
    // но сохраняем битый файл рядом для разбора.
    try{ fs.copyFileSync(DB_FILE, DB_FILE + '.corrupt-' + Date.now()); }catch(_){}
    return defaultData();
  }
}

let data = load();
// Подстраховка для db.json, сохранённого до появления byDayBot ({...defaultData(), ...parsed}
// выше — не глубокое слияние, поле traffic целиком берётся из старого файла и byDayBot
// в нём просто нет) — без этого recordVisit упал бы на "Cannot set properties of undefined".
if(!data.traffic.byDayBot) data.traffic.byDayBot = {};
if(!data.groupCards) data.groupCards = [];
// Публичный счётчик "открыток создано" для главной — считает и гостевые
// открытки тоже (см. incrementCardsCreated ниже), в отличие от data.cards
// (там только сохранённые за аккаунтом). Гостевые никогда не хранились, так
// что честно посчитать прошлые нечем — счётчик стартует с числа уже
// сохранённых открыток и дальше растёт по факту новых, а не выдумывает
// прошлое.
if(data.meta.cardsCreatedTotal == null) data.meta.cardsCreatedTotal = data.cards.length;

// Запись сериализуется через очередь промисов, чтобы параллельные запросы
// не затирали файл друг другом (нет настоящих транзакций у JSON-файла).
let writeQueue = Promise.resolve();
function persist(){
  writeQueue = writeQueue.then(() => new Promise((resolve, reject) => {
    const tmpFile = DB_FILE + '.tmp';
    fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if(err) return reject(err);
      fs.rename(tmpFile, DB_FILE, (err2) => err2 ? reject(err2) : resolve());
    });
  })).catch(err => { console.error('db persist failed:', err); });
  return writeQueue;
}

function uid(){ return crypto.randomUUID(); }

/* ---------------- users ---------------- */

function findUserByEmail(email){
  const e = String(email || '').trim().toLowerCase();
  return data.users.find(u => u.email === e) || null;
}
function findUserById(id){
  return data.users.find(u => u.id === id) || null;
}
function createUser({ email, passwordHash, name }){
  const user = {
    id: uid(),
    email: String(email).trim().toLowerCase(),
    passwordHash,
    name: (name || '').slice(0, 60),
    createdAt: Date.now(),
    resetTokenHash: null,
    resetTokenExpiresAt: null
  };
  data.users.push(user);
  persist();
  return user;
}

// Токен сброса пароля храним хешированным (как и сам пароль) — так утечка
// db.json не даёт прямой возможности сбросить чей-то пароль по ссылке.
function setResetToken(userId, tokenHash, expiresAt){
  const user = findUserById(userId);
  if(!user) return;
  user.resetTokenHash = tokenHash;
  user.resetTokenExpiresAt = expiresAt;
  persist();
}
function findUserByResetTokenHash(tokenHash){
  const user = data.users.find(u => u.resetTokenHash === tokenHash);
  if(!user) return null;
  if(!user.resetTokenExpiresAt || user.resetTokenExpiresAt < Date.now()) return null;
  return user;
}
function updateUserPassword(userId, passwordHash){
  const user = findUserById(userId);
  if(!user) return;
  user.passwordHash = passwordHash;
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  persist();
}

/* ---------------- cards ---------------- */

// Короткий публичный id для ссылки-шаринга (только у открыток, сохранённых
// за аккаунтом — у гостевых открыток сервер по-прежнему не хранит данные,
// см. saveAndShare в public/script/main.js). 7 знаков base62 — как случайный
// токен, а не последовательный счётчик, чтобы id нельзя было угадать перебором.
const SHORT_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function genShortId(len = 7){
  let id;
  do{
    const bytes = crypto.randomBytes(len);
    id = Array.from(bytes, b => SHORT_ID_CHARS[b % SHORT_ID_CHARS.length]).join('');
  }while(data.cards.some(c => c.shortId === id));
  return id;
}

function listCardsByUser(userId){
  return data.cards
    .filter(c => c.userId === userId)
    .sort((a,b) => b.createdAt - a.createdAt);
}
function findCardByShortId(shortId){
  return data.cards.find(c => c.shortId === shortId) || null;
}
function createCard({ userId, encodedData, occasion, to, from }){
  const card = {
    id: uid(),
    shortId: genShortId(),
    userId,
    encodedData,
    occasion: occasion || '',
    to: (to || '').slice(0, 30),
    from: (from || '').slice(0, 30),
    createdAt: Date.now()
  };
  data.cards.unshift(card);
  persist();
  return card;
}
function deleteCard(id, userId){
  const before = data.cards.length;
  data.cards = data.cards.filter(c => !(c.id === id && c.userId === userId));
  const removed = data.cards.length !== before;
  if(removed) persist();
  return removed;
}

/* ---------------- group cards ---------------- */
// Открытка "всей компанией": организатор задаёт базовый дизайн (повод, ваза),
// дальше любой по ссылке-приглашению добавляет своё имя, сообщение и один
// цветок — букет растёт по мере того как люди подписываются. Подписать может
// кто угодно без аккаунта (это и есть смысл — друзей не заставляют
// регистрироваться), а вот создать и закрыть открытку может только вошедший
// в аккаунт организатор: привязка к userId (не к токену в localStorage,
// как было в первой версии) означает, что закрыть открытку можно с любого
// устройства, просто войдя в свой аккаунт — не только из того браузера,
// где её создали.
//
// Закрывает приём подписей организатор сам, вручную, когда сочтёт нужным —
// не по заранее выбранной дате (первая версия так и делала: жёсткий срок на
// старте оказался неудобным, организатор не всегда знает заранее, сколько
// нужно времени). closesAt в базе остаётся, но теперь это только страховка
// от забытых черновиков (авто-закрытие через 30 дней), а не основной способ
// закрыть.

function genGroupShortId(len = 7){
  let id;
  do{
    const bytes = crypto.randomBytes(len);
    id = Array.from(bytes, b => SHORT_ID_CHARS[b % SHORT_ID_CHARS.length]).join('');
  }while(data.groupCards.some(g => g.shortId === id));
  return id;
}

// Мягкий потолок числа подписей на одну открытку — не UX-ограничение (никто
// не увидит "лимит достигнут" в обычном сценарии), а страховка от того, что
// кто-то один зальёт открытку тысячами записей: без модерации/аккаунтов это
// единственная защита от накрутки одной ссылки.
const MAX_CONTRIBUTIONS = 30;

function createGroupCard({ to, occasion, vase, closesAt, userId }){
  const group = {
    id: uid(),
    shortId: genGroupShortId(),
    to: (to || '').slice(0, 30),
    occasion: occasion || 'birthday',
    vase: vase || 'A',
    closesAt,
    userId,
    contributions: [],
    createdAt: Date.now()
  };
  data.groupCards.unshift(group);
  persist();
  return group;
}
function findGroupCardByShortId(shortId){
  return data.groupCards.find(g => g.shortId === shortId) || null;
}
function listGroupCardsByUser(userId){
  return data.groupCards
    .filter(g => g.userId === userId)
    .sort((a,b) => b.createdAt - a.createdAt);
}
function isGroupCardClosed(group){
  return !!group.closesAt && group.closesAt <= Date.now();
}
// Ручное закрытие организатором — просто переставляет closesAt на "сейчас",
// вся остальная логика (isGroupCardClosed, форма подписи скрыта/показана)
// уже умеет работать с этим полем, отдельный "closed"-флаг не нужен.
function closeGroupCard(shortId, userId){
  const group = findGroupCardByShortId(shortId);
  if(!group) return { ok:false, reason:'not_found' };
  if(!userId || group.userId !== userId) return { ok:false, reason:'forbidden' };
  if(isGroupCardClosed(group)) return { ok:false, reason:'already_closed' };
  group.closesAt = Date.now();
  persist();
  return { ok:true, group };
}
// Возвращает {ok:true, group} или {ok:false, reason:'closed'|'full'} — роут
// сам решает, каким статусом/текстом это обернуть для клиента.
function addGroupContribution(shortId, { name, message, flowerType, flowerColor }){
  const group = findGroupCardByShortId(shortId);
  if(!group) return { ok:false, reason:'not_found' };
  if(isGroupCardClosed(group)) return { ok:false, reason:'closed' };
  if(group.contributions.length >= MAX_CONTRIBUTIONS) return { ok:false, reason:'full' };
  const entry = {
    id: uid(),
    name: (name || '').slice(0, 30),
    message: (message || '').slice(0, 300),
    flowerType,
    flowerColor,
    createdAt: Date.now()
  };
  group.contributions.push(entry);
  persist();
  return { ok:true, group };
}

/* ---------------- admin: site status ---------------- */

function getSiteEnabled(){
  return data.meta.siteEnabled !== false;
}
function setSiteEnabled(enabled){
  data.meta.siteEnabled = !!enabled;
  persist();
}

/* ---------------- admin: traffic ---------------- */

function dayKey(ts){
  return new Date(ts).toISOString().slice(0, 10);
}

// Грубая, но практичная эвристика — по User-Agent нельзя доказать бота
// (подделывается тривиально), но для админ-панели важно не строгое
// доказательство, а "на глаз" отделить очевидных ботов/краулеров от реальных
// посетителей. Сюда попадают: поисковые роботы, боты предпросмотра ссылок
// в мессенджерах/соцсетях (именно они и дёргают "/" и "/c/<id>" — те же
// страницы, что смотрят живые люди, поэтому раньше смешивались с реальным
// трафиком), и типовые consej/скрипт-клиенты. Отсутствие User-Agent тоже
// считаем ботом — настоящие браузеры его всегда посылают.
const BOT_UA_RE = /bot|spider|crawl|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|vkshare|redditbot|skypeuripreview|applebot|preview|headless|curl|wget|python-requests|go-http-client|okhttp|node-fetch|axios\/|postmanruntime|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|bingpreview/i;
function isBotUserAgent(ua){
  if(!ua) return true;
  return BOT_UA_RE.test(ua);
}

// Считаем только "просмотры страниц" (см. вызов в server/index.js) — не каждый
// запрос подряд, иначе один визит раздувался бы в десятки записей за счёт
// статики (JS/CSS/шрифты). Люди и боты считаются в отдельные корзины —
// byDay/total остаются "чистыми" (только реальные посетители), боты видны
// отдельно (byDayBot) и помечены в списке последних визитов.
// Отдельная от isBotUserAgent эвристика — та ловит только ботов, которые сами
// себя выдают через User-Agent; аптайм-мониторы и скрейперы часто нарочно
// притворяются обычным Chrome/Safari и остаются невидимы для неё. Признак,
// который всё равно их выдаёт: несколько заходов на один и тот же путь за
// считанные секунды — ни один живой человек не обновляет страницу трижды
// за 8 секунд. Это тоже эвристика, не доказательство: помечаем "suspicious"
// только для отображения в списке, на подсчёт human/bot не влияет.
const BURST_WINDOW_MS = 8000;
const BURST_MIN_COUNT = 3;

function recordVisit(path, userAgent){
  const now = Date.now();
  const key = dayKey(now);
  const bot = isBotUserAgent(userAgent);
  if(bot){
    data.traffic.byDayBot[key] = (data.traffic.byDayBot[key] || 0) + 1;
  } else {
    data.traffic.byDay[key] = (data.traffic.byDay[key] || 0) + 1;
  }
  const burstSiblings = data.traffic.recent.filter(v => v.path === path && now - v.ts <= BURST_WINDOW_MS);
  const suspicious = burstSiblings.length + 1 >= BURST_MIN_COUNT;
  if(suspicious){
    burstSiblings.forEach(v => { v.suspicious = true; });
  }
  data.traffic.recent.unshift({ path, ts: now, bot, suspicious });
  if(data.traffic.recent.length > MAX_RECENT_VISITS){
    data.traffic.recent.length = MAX_RECENT_VISITS;
  }
  const cutoff = dayKey(now - TRAFFIC_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  for(const dayStr of Object.keys(data.traffic.byDay)){
    if(dayStr < cutoff) delete data.traffic.byDay[dayStr];
  }
  for(const dayStr of Object.keys(data.traffic.byDayBot)){
    if(dayStr < cutoff) delete data.traffic.byDayBot[dayStr];
  }
  persist();
}

function getTrafficSummary(){
  const days = [];
  for(let i = 6; i >= 0; i--){
    const key = dayKey(Date.now() - i * 24 * 60 * 60 * 1000);
    days.push({ date: key, count: data.traffic.byDay[key] || 0, botCount: data.traffic.byDayBot[key] || 0 });
  }
  const total = Object.values(data.traffic.byDay).reduce((sum, n) => sum + n, 0);
  const totalBot = Object.values(data.traffic.byDayBot).reduce((sum, n) => sum + n, 0);
  return {
    today: days[days.length - 1].count,
    todayBot: days[days.length - 1].botCount,
    last7Days: days,
    total,
    totalBot,
    recent: data.traffic.recent.slice(0, 30)
  };
}

/* ---------------- admin: client-side error reports ---------------- */

function recordClientError({ message, stack, url, userAgent }){
  const entry = {
    id: uid(),
    message: String(message || '').slice(0, 500),
    stack: String(stack || '').slice(0, 3000),
    url: String(url || '').slice(0, 500),
    userAgent: String(userAgent || '').slice(0, 300),
    ts: Date.now()
  };
  data.errors.unshift(entry);
  if(data.errors.length > MAX_CLIENT_ERRORS){
    data.errors.length = MAX_CLIENT_ERRORS;
  }
  persist();
  return entry;
}
function listClientErrors(){
  return data.errors;
}
function clearClientErrors(){
  data.errors = [];
  persist();
}

// cards — общее число созданных открыток, гостевых и аккаунтных вместе
// (cardsCreatedTotal, тот же счётчик, что и на публичной главной странице).
// cardsSaved — отдельно только те, что реально сохранены за аккаунтом
// (data.cards.length) — это раньше и показывалось в админке как "cards
// created", хотя гостевые открытки (большинство трафика) в него не попадали
// вообще, потому что никогда не долетают до сервера как данные.
function getCounts(){
  return { users: data.users.length, cards: getCardsCreatedTotal(), cardsSaved: data.cards.length };
}

/* ---------------- public "cards created" counter ---------------- */

function getCardsCreatedTotal(){
  return data.meta.cardsCreatedTotal || 0;
}
// Клиент зовёт это при успешном создании ЛЮБОЙ открытки — гостевой или
// сохранённой за аккаунтом (см. server/routes/stats.js) — просто "пинг",
// без данных самой открытки, поэтому гостевую приватность это не нарушает.
function incrementCardsCreated(){
  data.meta.cardsCreatedTotal = (data.meta.cardsCreatedTotal || 0) + 1;
  persist();
  return data.meta.cardsCreatedTotal;
}
function listRecentUsers(limit = 15){
  return [...data.users]
    .sort((a,b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map(u => ({ id: u.id, email: u.email, name: u.name, createdAt: u.createdAt }));
}
// Для панели администратора — раньше счётчик "cards created" был, а самого
// списка открыток не было нигде, поэтому не было способа увидеть, что и когда
// реально создавалось. encodedData (содержимое открытки) намеренно не отдаём —
// админке для обзора достаточно метаданных, а не текста чужого пожелания.
function listRecentCards(limit = 15){
  return [...data.cards]
    .sort((a,b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map(c => {
      const owner = findUserById(c.userId);
      return {
        id: c.id,
        shortId: c.shortId,
        occasion: c.occasion,
        to: c.to,
        from: c.from,
        createdAt: c.createdAt,
        ownerEmail: owner ? owner.email : null
      };
    });
}
function deleteClientError(id){
  const before = data.errors.length;
  data.errors = data.errors.filter(e => e.id !== id);
  const removed = data.errors.length !== before;
  if(removed) persist();
  return removed;
}

module.exports = {
  findUserByEmail, findUserById, createUser,
  setResetToken, findUserByResetTokenHash, updateUserPassword,
  listCardsByUser, createCard, deleteCard, findCardByShortId,
  createGroupCard, findGroupCardByShortId, listGroupCardsByUser, isGroupCardClosed, addGroupContribution, closeGroupCard, MAX_CONTRIBUTIONS,
  getSiteEnabled, setSiteEnabled,
  recordVisit, getTrafficSummary,
  recordClientError, listClientErrors, clearClientErrors, deleteClientError,
  getCounts, listRecentUsers, listRecentCards,
  getCardsCreatedTotal, incrementCardsCreated
};
