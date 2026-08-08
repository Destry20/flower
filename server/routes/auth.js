const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const auth = require('../auth');
const { sendPasswordResetEmail } = require('../mailer');

const router = express.Router();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 час

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ограничиваем перебор паролей / спам-регистрацию с одного IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток. Подождите немного и попробуйте снова.' }
});
router.use(authLimiter);

router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if(typeof email !== 'string' || !EMAIL_RE.test(email.trim())){
    return res.status(400).json({ error: 'Введите корректный email' });
  }
  if(typeof password !== 'string' || password.length < 6){
    return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
  }
  if(db.findUserByEmail(email)){
    return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
  }
  const user = db.createUser({ email, passwordHash: auth.hashPassword(password), name });
  const token = auth.signToken(user);
  auth.setAuthCookie(res, token);
  res.status(201).json({ user: auth.publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = typeof email === 'string' ? db.findUserByEmail(email) : null;
  if(!user || !auth.verifyPassword(String(password || ''), user.passwordHash)){
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }
  const token = auth.signToken(user);
  auth.setAuthCookie(res, token);
  res.json({ user: auth.publicUser(user) });
});

router.post('/logout', (req, res) => {
  auth.clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if(!req.user) return res.json({ user: null });
  res.json({ user: auth.publicUser(req.user) });
});

function getBaseUrl(req){
  // За реверс-прокси/CDN req.protocol/host не всегда надёжны — тогда задайте
  // PUBLIC_URL в .env (например https://mysweetbouquet.ru) и он победит.
  if(process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

// Намеренно всегда отвечаем одинаковым сообщением независимо от того,
// зарегистрирован ли email — иначе по ответу можно было бы перебором узнать,
// какие email есть в базе (user enumeration).
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  const genericMsg = { message: 'Если такой email зарегистрирован, мы отправили на него ссылку для сброса пароля.' };
  if(typeof email !== 'string' || !EMAIL_RE.test(email.trim())){
    return res.status(400).json({ error: 'Введите корректный email' });
  }
  const user = db.findUserByEmail(email);
  if(!user) return res.json(genericMsg);

  const token = auth.generateResetToken();
  db.setResetToken(user.id, auth.hashResetToken(token), Date.now() + RESET_TOKEN_TTL_MS);
  const resetUrl = `${getBaseUrl(req)}/#reset=${token}`;
  try{
    await sendPasswordResetEmail(user.email, resetUrl);
  }catch(e){
    console.error('[auth] не удалось отправить письмо сброса пароля:', e.message);
    // пользователю всё равно отвечаем общей фразой — не раскрываем детали сбоя почты
  }
  res.json(genericMsg);
});

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body || {};
  if(typeof token !== 'string' || !token){
    return res.status(400).json({ error: 'Ссылка недействительна' });
  }
  if(typeof password !== 'string' || password.length < 6){
    return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
  }
  const user = db.findUserByResetTokenHash(auth.hashResetToken(token));
  if(!user){
    return res.status(400).json({ error: 'Ссылка недействительна или устарела — запросите сброс пароля ещё раз' });
  }
  db.updateUserPassword(user.id, auth.hashPassword(password));
  const jwtToken = auth.signToken(user);
  auth.setAuthCookie(res, jwtToken);
  res.json({ user: auth.publicUser(user) });
});

module.exports = router;
