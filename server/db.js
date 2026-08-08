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
    users: [], cards: [],
    meta: { siteEnabled: true },
    traffic: { byDay: {}, recent: [] },
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

// Считаем только "просмотры страниц" (см. вызов в server/index.js) — не каждый
// запрос подряд, иначе один визит раздувался бы в десятки записей за счёт
// статики (JS/CSS/шрифты).
function recordVisit(path){
  const now = Date.now();
  const key = dayKey(now);
  data.traffic.byDay[key] = (data.traffic.byDay[key] || 0) + 1;
  data.traffic.recent.unshift({ path, ts: now });
  if(data.traffic.recent.length > MAX_RECENT_VISITS){
    data.traffic.recent.length = MAX_RECENT_VISITS;
  }
  const cutoff = dayKey(now - TRAFFIC_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  for(const dayStr of Object.keys(data.traffic.byDay)){
    if(dayStr < cutoff) delete data.traffic.byDay[dayStr];
  }
  persist();
}

function getTrafficSummary(){
  const days = [];
  for(let i = 6; i >= 0; i--){
    const key = dayKey(Date.now() - i * 24 * 60 * 60 * 1000);
    days.push({ date: key, count: data.traffic.byDay[key] || 0 });
  }
  const total = Object.values(data.traffic.byDay).reduce((sum, n) => sum + n, 0);
  return {
    today: days[days.length - 1].count,
    last7Days: days,
    total,
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

function getCounts(){
  return { users: data.users.length, cards: data.cards.length };
}
function listRecentUsers(limit = 15){
  return [...data.users]
    .sort((a,b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map(u => ({ id: u.id, email: u.email, name: u.name, createdAt: u.createdAt }));
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
  getSiteEnabled, setSiteEnabled,
  recordVisit, getTrafficSummary,
  recordClientError, listClientErrors, clearClientErrors, deleteClientError,
  getCounts, listRecentUsers
};
