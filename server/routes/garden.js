const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../auth');
const { tServer } = require('../i18n');

const router = express.Router();
router.use(requireAuth);

// Тот же потолок на длину строки, что и у обычных открыток (routes/cards.js,
// MAX_ENCODED_LEN) — формат данных ровно тот же (base64 самой открытки),
// просто источник другой (получатель, а не отправитель).
const MAX_ENCODED_LEN = 20000;

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/', (req, res) => {
  res.json({ cards: db.listGardenByUser(req.user.id) });
});

router.post('/', createLimiter, (req, res) => {
  const { encodedData } = req.body || {};
  if(typeof encodedData !== 'string' || !encodedData || encodedData.length > MAX_ENCODED_LEN){
    return res.status(400).json({ error: tServer(req, 'cardInvalid') });
  }
  // Повторное сохранение уже сохранённой открытки — не ошибка, просто
  // ничего не делаем и возвращаем то, что уже есть (см. комментарий у
  // findGardenDuplicate в server/db.js).
  const existing = db.findGardenDuplicate(req.user.id, encodedData);
  if(existing) return res.json({ card: existing, duplicate: true });
  if(db.countGardenByUser(req.user.id) >= db.MAX_GARDEN_PER_USER){
    return res.status(403).json({ error: tServer(req, 'gardenLimitReached') });
  }
  const entry = db.createGardenEntry({ userId: req.user.id, encodedData });
  res.status(201).json({ card: entry, duplicate: false });
});

router.delete('/:id', (req, res) => {
  const removed = db.deleteGardenEntry(req.params.id, req.user.id);
  if(!removed) return res.status(404).json({ error: tServer(req, 'cardNotFound') });
  res.json({ ok: true });
});

module.exports = router;
