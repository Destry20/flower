const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../auth');
const { tServer } = require('../i18n');

const router = express.Router();
router.use(requireAuth);

// Ссылка на открытку уже полностью самодостаточна (данные закодированы в base64),
// сервер здесь просто хранит копию + метаданные для конкретного пользователя,
// чтобы список "Мои открытки" не терялся при очистке браузера/смене устройства.
const MAX_ENCODED_LEN = 20000;
const MAX_CARDS_PER_USER = 10;

// Без лимита залогиненный аккаунт мог бы в цикле наштамповать сколько угодно
// открыток — база растёт без ограничений (в отличие от traffic/errors, у
// которых есть capped-массивы). GET/DELETE лимитом не ограничиваем — их
// злоупотребление само собой ограничено количеством уже существующих открыток.
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many cards created. Please wait a bit and try again.' }
});

router.get('/', (req, res) => {
  res.json({ cards: db.listCardsByUser(req.user.id) });
});

router.post('/', createLimiter, (req, res) => {
  const { encodedData, occasion, to, from } = req.body || {};
  if(typeof encodedData !== 'string' || !encodedData || encodedData.length > MAX_ENCODED_LEN){
    return res.status(400).json({ error: tServer(req, 'cardInvalid') });
  }
  if(db.listCardsByUser(req.user.id).length >= MAX_CARDS_PER_USER){
    return res.status(403).json({ error: tServer(req, 'cardLimitReached') });
  }
  const card = db.createCard({ userId: req.user.id, encodedData, occasion, to, from });
  res.status(201).json({ card });
});

router.delete('/:id', (req, res) => {
  const removed = db.deleteCard(req.params.id, req.user.id);
  if(!removed) return res.status(404).json({ error: tServer(req, 'cardNotFound') });
  res.json({ ok: true });
});

module.exports = router;
