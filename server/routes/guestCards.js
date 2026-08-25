const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { tServer } = require('../i18n');

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

router.post('/', createLimiter, (req, res) => {
  const { encodedData, occasion, to, from } = req.body || {};
  if(typeof encodedData !== 'string' || !encodedData || encodedData.length > MAX_ENCODED_LEN){
    return res.status(400).json({ error: tServer(req, 'cardInvalid') });
  }
  const card = db.createCard({ userId: null, encodedData, occasion, to, from });
  res.status(201).json({ card: { shortId: card.shortId, expiresAt: card.expiresAt } });
});

module.exports = router;
