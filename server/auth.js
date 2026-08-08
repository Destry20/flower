const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-to-a-long-random-string';
const COOKIE_NAME = 'msb_token';
const TOKEN_TTL = '30d';

if(JWT_SECRET === 'change-me-to-a-long-random-string' && process.env.NODE_ENV === 'production'){
  console.warn('[auth] JWT_SECRET не задан в .env — используется небезопасное значение по умолчанию.');
}

function hashPassword(password){
  return bcrypt.hashSync(password, 10);
}
function verifyPassword(password, hash){
  return bcrypt.compareSync(password, hash);
}

function signToken(user){
  return jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function setAuthCookie(res, token){
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}
function clearAuthCookie(res){
  res.clearCookie(COOKIE_NAME);
}

// Проставляет req.user, если валидная кука есть; не блокирует запрос без неё —
// маршруты сами решают через requireAuth, обязателен ли вход.
function attachUser(req, res, next){
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if(token){
    try{
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.findUserById(payload.uid);
      if(user) req.user = user;
    }catch(e){ /* просроченный/битый токен — просто считаем гостем */ }
  }
  next();
}

function requireAuth(req, res, next){
  if(!req.user) return res.status(401).json({ error: 'Требуется вход в аккаунт' });
  next();
}

function publicUser(user){
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

// Токен для ссылки сброса пароля: сама ссылка содержит случайный токен в
// открытом виде (иначе её нельзя было бы использовать), а в базе хранится
// только его хеш — так же, как с паролями.
function generateResetToken(){
  return crypto.randomBytes(32).toString('hex');
}
function hashResetToken(token){
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  COOKIE_NAME, hashPassword, verifyPassword, signToken,
  setAuthCookie, clearAuthCookie, attachUser, requireAuth, publicUser,
  generateResetToken, hashResetToken
};
