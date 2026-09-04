const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const totpLib = require('../totp');
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

// Публичный (без requireAdmin) — форма входа должна знать ДО попытки войти,
// показывать ли поле для кода, иначе пришлось бы либо всегда его показывать
// (лишний шаг для всех, пока 2FA не включена), либо угадывать. Ничего
// чувствительного не раскрывает — только сам факт "включена/нет".
router.get('/totp-status', (req, res) => {
  res.json({ enabled: !!db.getAdminTotp().enabled });
});

router.post('/login', loginLimiter, (req, res) => {
  const { password, code } = req.body || {};
  if(!passwordMatches(password)){
    return res.status(401).json({ error: 'Wrong password' });
  }
  const totpState = db.getAdminTotp();
  if(totpState.enabled){
    if(!totpLib.verifyTotp(code, totpState.secret)) return res.status(401).json({ error: 'Missing or invalid 2FA code', needsTotp: true });
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

// --- 2FA: настройка (требует уже открытой сессии — пароль без 2FA, пока она
// не подтверждена подтверждающим кодом, см. confirmAdminTotp в db.js) ---
router.post('/totp/setup', requireAdmin, (req, res) => {
  const secret = totpLib.randomBase32Secret();
  db.setAdminTotpPending(secret);
  const otpauth = totpLib.keyUri(secret, 'VivoRose', 'admin');
  res.json({ secret, otpauth });
});
router.post('/totp/confirm', requireAdmin, (req, res) => {
  const { code } = req.body || {};
  const totpState = db.getAdminTotp();
  if(!totpState.secret || !totpState.pending){
    return res.status(400).json({ error: 'No 2FA setup in progress' });
  }
  if(!totpLib.verifyTotp(code, totpState.secret)) return res.status(400).json({ error: 'Wrong code — check your authenticator app and try again' });
  db.confirmAdminTotp();
  res.json({ ok: true });
});
router.post('/totp/disable', requireAdmin, (req, res) => {
  db.disableAdminTotp();
  res.json({ ok: true });
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

// ?q= включает поиск (по email/имени/поводу/получателю/shortId — см. db.js) и
// поднимает лимит с 15 до 50: "последние 15" достаточно для ленты, но искать
// конкретную запись только среди последних 15 бессмысленно.
router.get('/users', requireAdmin, (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  res.json({ users: db.listRecentUsers(q ? 50 : 15, q) });
});
router.delete('/users/:id', requireAdmin, (req, res) => {
  const removed = db.adminDeleteUser(req.params.id);
  if(!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.get('/cards', requireAdmin, (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  res.json({ cards: db.listRecentCards(q ? 50 : 15, q) });
});
router.delete('/cards/:id', requireAdmin, (req, res) => {
  const removed = db.adminDeleteCard(req.params.id);
  if(!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.get('/groups', requireAdmin, (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  res.json({ groups: db.listRecentGroupCards(q ? 50 : 15, q) });
});
router.delete('/groups/:shortId', requireAdmin, (req, res) => {
  const removed = db.adminDeleteGroupCard(req.params.shortId);
  if(!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Ручной снимок базы "прямо сейчас" — независим от ежедневной автоотправки
// на почту (см. server/backup.js), не влияет на её отсчёт (lastBackupAt тут
// намеренно не трогаем: это разовое скачивание для админа, а не замена
// расписания).
router.get('/backup', requireAdmin, (req, res) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  res.set('Content-Disposition', `attachment; filename="db-backup-${dateStr}.json"`);
  res.type('application/json').send(db.getDbSnapshot());
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
