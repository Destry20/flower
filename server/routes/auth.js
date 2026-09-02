const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const auth = require('../auth');
const { sendPasswordResetEmail } = require('../mailer');
const { tServer, pickLang } = require('../i18n');

const router = express.Router();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 час

// GOOGLE_CLIENT_ID не задан, пока владелец сайта не заведёт OAuth-клиент в
// Google Cloud Console — до этого /google просто отвечает "не настроено", а
// сама кнопка на клиенте не рендерится вовсе (см. GET /api/config в
// server/index.js и renderGoogleButton в public/script/main.js), так что
// это не "битая" кнопка, а отсутствующая.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ограничиваем перебор паролей / спам-регистрацию с одного IP. Сообщение тут
// статично на русском (express-rate-limit формирует его до того, как есть
// доступ к req в удобном месте) — небольшая, осознанная асимметрия с
// остальными, полностью двуязычными ответами.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток. Подождите немного и попробуйте снова. / Too many attempts, please wait and try again.' }
});
router.use(authLimiter);

router.post('/register', (req, res) => {
  const { email, password, name, website } = req.body || {};
  // Honeypot: настоящие пользователи это поле не видят и не заполняют (скрыто
  // за экраном, вне табуляции) — заполненное значение почти наверняка бот,
  // слепо забивающий все поля формы. Отвечаем обычной ошибкой валидации,
  // не намекая, что именно его выдало.
  if(typeof website === 'string' && website.trim()){
    return res.status(400).json({ error: tServer(req, 'invalidEmail') });
  }
  if(typeof email !== 'string' || !EMAIL_RE.test(email.trim())){
    return res.status(400).json({ error: tServer(req, 'invalidEmail') });
  }
  if(typeof password !== 'string' || password.length < 8){
    return res.status(400).json({ error: tServer(req, 'passwordTooShort') });
  }
  if(db.findUserByEmail(email)){
    return res.status(409).json({ error: tServer(req, 'emailTaken') });
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
    return res.status(401).json({ error: tServer(req, 'invalidLogin') });
  }
  const token = auth.signToken(user);
  auth.setAuthCookie(res, token);
  res.json({ user: auth.publicUser(user) });
});

// Кнопка "Войти через Google" на клиенте (Google Identity Services) отдаёт
// не пароль, а подписанный Google-ом JWT ("credential") с уже проверенным
// email пользователя — от нас требуется только проверить его подлинность
// (через google-auth-library, официальную библиотеку для этого — вручную
// сверять подпись/JWKS самим было бы лишним риском для кода, отвечающего
// за вход в аккаунт) и завести/найти пользователя по email. Пароль такому
// аккаунту не нужен, но поле passwordHash в остальном коде считается
// обязательным — ставим случайный, никому не известный хеш вместо него.
router.post('/google', async (req, res) => {
  if(!googleClient){
    return res.status(503).json({ error: tServer(req, 'googleNotConfigured') });
  }
  const { credential } = req.body || {};
  if(typeof credential !== 'string' || !credential){
    return res.status(400).json({ error: tServer(req, 'invalidLogin') });
  }
  let payload;
  try{
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  }catch(e){
    return res.status(401).json({ error: tServer(req, 'invalidLogin') });
  }
  if(!payload || !payload.email || payload.email_verified !== true){
    return res.status(401).json({ error: tServer(req, 'invalidLogin') });
  }
  let user = db.findUserByEmail(payload.email);
  if(!user){
    user = db.createUser({
      email: payload.email,
      passwordHash: auth.hashPassword(crypto.randomBytes(24).toString('hex')),
      name: payload.name || '',
      provider: 'google'
    });
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
  // PUBLIC_URL в .env (например https://vivorose.com) и он победит.
  if(process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

// Намеренно всегда отвечаем одинаковым сообщением независимо от того,
// зарегистрирован ли email — иначе по ответу можно было бы перебором узнать,
// какие email есть в базе (user enumeration).
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  const genericMsg = { message: tServer(req, 'resetGeneric') };
  if(typeof email !== 'string' || !EMAIL_RE.test(email.trim())){
    return res.status(400).json({ error: tServer(req, 'invalidEmail') });
  }
  const user = db.findUserByEmail(email);
  if(!user) return res.json(genericMsg);

  const token = auth.generateResetToken();
  db.setResetToken(user.id, auth.hashResetToken(token), Date.now() + RESET_TOKEN_TTL_MS);
  const resetUrl = `${getBaseUrl(req)}/#reset=${token}`;
  try{
    await sendPasswordResetEmail(user.email, resetUrl, pickLang(req));
  }catch(e){
    console.error('[auth] не удалось отправить письмо сброса пароля:', e.message);
    // пользователю всё равно отвечаем общей фразой — не раскрываем детали сбоя почты
  }
  res.json(genericMsg);
});

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body || {};
  if(typeof token !== 'string' || !token){
    return res.status(400).json({ error: tServer(req, 'resetTokenMissing') });
  }
  if(typeof password !== 'string' || password.length < 8){
    return res.status(400).json({ error: tServer(req, 'passwordTooShort') });
  }
  const user = db.findUserByResetTokenHash(auth.hashResetToken(token));
  if(!user){
    return res.status(400).json({ error: tServer(req, 'resetTokenExpired') });
  }
  db.updateUserPassword(user.id, auth.hashPassword(password));
  const jwtToken = auth.signToken(user);
  auth.setAuthCookie(res, jwtToken);
  res.json({ user: auth.publicUser(user) });
});

module.exports = router;
