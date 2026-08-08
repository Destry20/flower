const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

// Ссылка на открытку уже полностью самодостаточна (данные закодированы в base64),
// сервер здесь просто хранит копию + метаданные для конкретного пользователя,
// чтобы список "Мои открытки" не терялся при очистке браузера/смене устройства.
// Лимит с запасом выше PHOTO_MAX_LEN (public/script/main.js) с учётом base64-
// накладных расходов JSON-обёртки — иначе открытки с фото не сохранялись бы
// на сервере (тихо, потому что запрос из saveAndShare не блокирует создание ссылки).
const MAX_ENCODED_LEN = 120000;

router.get('/', (req, res) => {
  res.json({ cards: db.listCardsByUser(req.user.id) });
});

router.post('/', (req, res) => {
  const { encodedData, occasion, to, from } = req.body || {};
  if(typeof encodedData !== 'string' || !encodedData || encodedData.length > MAX_ENCODED_LEN){
    return res.status(400).json({ error: 'Некорректные данные открытки' });
  }
  const card = db.createCard({ userId: req.user.id, encodedData, occasion, to, from });
  res.status(201).json({ card });
});

router.delete('/:id', (req, res) => {
  const removed = db.deleteCard(req.params.id, req.user.id);
  if(!removed) return res.status(404).json({ error: 'Открытка не найдена' });
  res.json({ ok: true });
});

module.exports = router;
