// Простое файловое хранилище (JSON) — без внешней БД и нативных зависимостей.
// Подходит для небольшого/среднего трафика. Если проект вырастет, этот модуль
// можно заменить на настоящую БД (Postgres/SQLite), не трогая роуты — они
// работают только через функции, экспортированные ниже.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function defaultData(){
  return { users: [], cards: [] };
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

function listCardsByUser(userId){
  return data.cards
    .filter(c => c.userId === userId)
    .sort((a,b) => b.createdAt - a.createdAt);
}
function createCard({ userId, encodedData, occasion, to, from }){
  const card = {
    id: uid(),
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

module.exports = {
  findUserByEmail, findUserById, createUser,
  setResetToken, findUserByResetTokenHash, updateUserPassword,
  listCardsByUser, createCard, deleteCard
};
