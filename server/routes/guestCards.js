const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { tServer } = require('../i18n');
const { decodeCardDataServer } = require('../cardMeta');
const { scanCard } = require('../moderation');
const { verifyTurnstile } = require('../turnstile');

const router = express.Router();

// Публичный, без авторизации — короткая ссылка /c/<id> для тех, кто не
// вошёл в аккаунт (см. историю проблемы в server/routes/cards.js: до этого
// гостевая ссылка была полностью самодостаточной "?data=...", 500-1500+
// символов). Открытка при этом хранится временно — см. GUEST_CARD_TTL_MS
// в server/db.js — и никогда не попадает в listCardsByUser/"Мои открытки"
// на сервере (userId === null), только в localStorage у автора.
//
// Rate-limit заметно строже, чем у cards.js (там лимит держит уже
// авторизованный аккаунт) — тут единственная защита от злоупотребления
// это IP, поэтому лимитируем жёстче.
const MAX_ENCODED_LEN = 20000;
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many cards created. Please wait a bit and try again.' }
});

router.post('/', createLimiter, async (req, res) => {
  const { encodedData, occasion, to, from, turnstileToken } = req.body || {};
  if(typeof encodedData !== 'string' || !encodedData || encodedData.length > MAX_ENCODED_LEN){
    return res.status(400).json({ error: tServer(req, 'cardInvalid') });
  }
  // Капча (см. server/turnstile.js) — выключена, пока не задан
  // TURNSTILE_SECRET_KEY, тогда verifyTurnstile всегда true и эта проверка
  // не влияет на поведение. Гостевые открытки — самая незащищённая точка
  // (создать может кто угодно, без аккаунта), поэтому именно здесь она
  // нужнее всего.
  if(!(await verifyTurnstile(turnstileToken, req.ip))){
    return res.status(400).json({ error: tServer(req, 'captchaFailed') });
  }
  // Первый, самый дешёвый уровень модерации (см. server/moderation.js) —
  // сообщение сервер обычно не видит (оно живёт только внутри encodedData,
  // читает его лишь получатель в браузере), для флага декодируем сами; сбой
  // декодирования тут не страшнее, чем при сборке og:title — просто ничего
  // не флагуем и не роняем создание открытки.
  let message = '';
  try{ message = decodeCardDataServer(encodedData).message || ''; }catch(e){ /* битые данные — не наша забота здесь */ }
  const { flagged, flagReasons } = scanCard({ to, from, message });
  const card = db.createCard({ userId: null, encodedData, occasion, to, from, flagged, flagReasons });
  res.status(201).json({ card: { shortId: card.shortId, expiresAt: card.expiresAt } });
});

module.exports = router;
