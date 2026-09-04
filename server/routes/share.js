const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { tServer } = require('../i18n');

const router = express.Router();

// Публичный, без авторизации — этим эндпоинтом пользуется получатель ссылки,
// который никак не залогинен на сайте. Отдаём только encodedData, ничего
// про владельца (email/userId) наружу не уходит.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});
router.use(limiter);

router.get('/:shortId', (req, res) => {
  const card = db.findCardByShortId(req.params.shortId);
  if(!card) return res.status(404).json({ error: tServer(req, 'cardNotFound') });
  // Этот запрос шлёт клиентский JS (renderShortViewer в main.js), а не сама
  // страница — боты превью ссылок в мессенджерах (WhatsApp/Telegram и т.п.)
  // до него не доходят, они читают только HTML главного /c/:shortId (см.
  // server/index.js), JS не выполняют. Так что момент реалистичный: это и
  // есть открытие получателем — см. db.markCardOpened для статуса в
  // "Мои открытки" отправителя.
  db.markCardOpened(req.params.shortId, req.get('user-agent'));
  res.json({ encodedData: card.encodedData });
});

module.exports = router;
