const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-to-a-long-random-string';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_COOKIE_NAME = 'vr_admin_token';
const ADMIN_TOKEN_TTL = '12h';

if(!ADMIN_PASSWORD && process.env.NODE_ENV === 'production'){
  console.warn('[admin] ADMIN_PASSWORD не задан — панель администратора недоступна.');
}

// Сравнение через хеш фиксированной длины + timingSafeEqual — то же соображение,
// что и с токеном сброса пароля в auth.js: не даём отличить "почти совпало"
// от "совсем не совпало" по времени ответа.
function passwordMatches(candidate){
  if(!ADMIN_PASSWORD) return false;
  const a = crypto.createHash('sha256').update(String(candidate || '')).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' }
});

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reports.' }
});

function requireAdmin(req, res, next){
  const token = req.cookies && req.cookies[ADMIN_COOKIE_NAME];
  if(!token) return res.status(401).json({ error: 'Not authenticated' });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    if(!payload.admin) throw new Error('not admin');
  }catch(e){
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body || {};
  if(!passwordMatches(password)){
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: ADMIN_TOKEN_TTL });
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 60 * 60 * 1000
  });
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const token = req.cookies && req.cookies[ADMIN_COOKIE_NAME];
  if(!token) return res.json({ authenticated: false });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: !!payload.admin });
  }catch(e){
    return res.json({ authenticated: false });
  }
});

router.get('/stats', requireAdmin, (req, res) => {
  res.json({
    traffic: db.getTrafficSummary(),
    counts: db.getCounts(),
    siteEnabled: db.getSiteEnabled()
  });
});

router.get('/errors', requireAdmin, (req, res) => {
  res.json({ errors: db.listClientErrors() });
});

router.post('/errors/clear', requireAdmin, (req, res) => {
  db.clearClientErrors();
  res.json({ ok: true });
});

router.delete('/errors/:id', requireAdmin, (req, res) => {
  const removed = db.deleteClientError(req.params.id);
  if(!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.get('/users', requireAdmin, (req, res) => {
  res.json({ users: db.listRecentUsers(15) });
});

router.get('/cards', requireAdmin, (req, res) => {
  res.json({ cards: db.listRecentCards(15) });
});

router.post('/site-status', requireAdmin, (req, res) => {
  const { enabled } = req.body || {};
  db.setSiteEnabled(!!enabled);
  res.json({ siteEnabled: db.getSiteEnabled() });
});

// Публичный эндпоинт — сюда шлёт client-side скрипт (public/script/main.js)
// при неотловленных ошибках/rejection'ах. Без авторизации, поэтому вход
// нарочно узкий: только текст, никаких object/JSON-тел произвольной формы.
router.post('/report-error', reportLimiter, (req, res) => {
  const { message, stack, url, userAgent } = req.body || {};
  if(typeof message !== 'string' || !message){
    return res.status(400).json({ error: 'Invalid report' });
  }
  db.recordClientError({ message, stack, url, userAgent });
  res.status(201).json({ ok: true });
});

module.exports = router;
