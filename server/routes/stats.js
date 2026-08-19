const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');

const router = express.Router();

// Публичный, без авторизации — счётчик "открыток создано" на главной должны
// видеть и обновлять и гости тоже (гостевые открытки — большинство, они
// никогда не сохраняются на сервере, см. saveAndShare в public/script/main.js
// и комментарий в server/db.js). POST не принимает никаких данных самой
// открытки, только увеличивает число — гостевую приватность не затрагивает.
// Лимит здесь мягкий (это просто витринная цифра, не что-то чувствительное),
// но и без ограничений оставлять публичный "инкремент" эндпоинт не стоит.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false
});
router.use(limiter);

router.get('/', (req, res) => {
  res.json({ cardsCreated: db.getCardsCreatedTotal() });
});

router.post('/card-created', (req, res) => {
  const cardsCreated = db.incrementCardsCreated();
  res.status(201).json({ cardsCreated });
});

module.exports = router;
