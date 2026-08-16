const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../auth');
const { tServer } = require('../i18n');

const router = express.Router();

// Создать/закрыть/посмотреть-свой-список открытку "всей компанией" может
// только вошедший в аккаунт организатор (requireAuth ниже, выборочно —
// см. комментарий в server/db.js). Подписать открытку по ссылке-приглашению
// может кто угодно без аккаунта — /:shortId и /:shortId/join нарочно вне
// requireAuth. Валидация здесь строже, чем у обычных открыток: там сервер
// хранит уже готовый непрозрачный encodedData-блоб клиента, а тут сервер сам
// накапливает структурированные данные от многих разных людей, так что
// именно он должен проверять форму каждого значения.
const OCCASION_IDS = ['foryou','birthday','love','thanks','congrats','sorry','justbecause'];
const VASE_IDS = ['A','B','C','D'];
const FLOWER_COLORS = {
  rose: ['#C97B86','#E3B7BE','#B23A4E','#E6C88A'],
  peony: ['#F0C9D6','#E6A6BC','#FBEAD9','#D98CAE'],
  tulip: ['#D65B4A','#E8A03A','#B23A4E','#E6C88A'],
  daisy: ['#FFFFFF','#E6C88A','#E3B7BE'],
  carnation: ['#C97B86','#D65B4A','#F0C9D6','#FFFFFF'],
  orchid: ['#B27BC9','#E8D5F0','#7A4B96'],
  sunflower: ['#F2C94C','#E8A03A']
};
// Организатор закрывает приём подписей сам, вручную (см. server/db.js) —
// closesAt тут не то, что выбирает пользователь, а только страховка от
// забытых черновиков, чтобы они не висели открытыми вечно.
const AUTO_CLOSE_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

// Наружу группу отдаём только через это — userId никогда не должен уходить
// клиенту напрямую (незачем светить внутренний id организатора перед кем
// попало по ссылке); вместо него — вычисленный isOwner для текущего req.user.
function publicGroup(group, req){
  const { userId, ...rest } = group;
  return { ...rest, closed: db.isGroupCardClosed(group), isOwner: !!(req.user && req.user.id === userId) };
}

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false
});
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/', requireAuth, readLimiter, (req, res) => {
  res.json({ groups: db.listGroupCardsByUser(req.user.id).map(g => publicGroup(g, req)) });
});

router.post('/', requireAuth, createLimiter, (req, res) => {
  const { to, occasion, vase } = req.body || {};
  if(typeof to !== 'string' || !to.trim()){
    return res.status(400).json({ error: tServer(req, 'groupInvalid') });
  }
  if(!OCCASION_IDS.includes(occasion) || !VASE_IDS.includes(vase)){
    return res.status(400).json({ error: tServer(req, 'groupInvalid') });
  }
  const group = db.createGroupCard({
    to, occasion, vase,
    closesAt: Date.now() + AUTO_CLOSE_MS,
    userId: req.user.id
  });
  res.status(201).json({ group: publicGroup(group, req) });
});

router.get('/:shortId', readLimiter, (req, res) => {
  const group = db.findGroupCardByShortId(req.params.shortId);
  if(!group) return res.status(404).json({ error: tServer(req, 'groupNotFound') });
  res.json({ group: publicGroup(group, req) });
});

router.post('/:shortId/join', joinLimiter, (req, res) => {
  const { name, message, flowerType, flowerColor } = req.body || {};
  if(typeof name !== 'string' || !name.trim()){
    return res.status(400).json({ error: tServer(req, 'groupInvalid') });
  }
  if(typeof message !== 'string' || !message.trim()){
    return res.status(400).json({ error: tServer(req, 'groupInvalid') });
  }
  const allowedColors = FLOWER_COLORS[flowerType];
  if(!allowedColors || !allowedColors.includes(flowerColor)){
    return res.status(400).json({ error: tServer(req, 'groupInvalid') });
  }
  const result = db.addGroupContribution(req.params.shortId, { name, message, flowerType, flowerColor });
  if(!result.ok){
    if(result.reason === 'not_found') return res.status(404).json({ error: tServer(req, 'groupNotFound') });
    if(result.reason === 'closed') return res.status(409).json({ error: tServer(req, 'groupClosed') });
    if(result.reason === 'full') return res.status(409).json({ error: tServer(req, 'groupFull') });
    return res.status(400).json({ error: tServer(req, 'groupInvalid') });
  }
  res.status(201).json({ group: publicGroup(result.group, req) });
});

router.post('/:shortId/close', requireAuth, joinLimiter, (req, res) => {
  const result = db.closeGroupCard(req.params.shortId, req.user.id);
  if(!result.ok){
    if(result.reason === 'not_found') return res.status(404).json({ error: tServer(req, 'groupNotFound') });
    if(result.reason === 'forbidden') return res.status(403).json({ error: tServer(req, 'groupForbidden') });
    if(result.reason === 'already_closed') return res.status(409).json({ error: tServer(req, 'groupClosed') });
    return res.status(400).json({ error: tServer(req, 'groupInvalid') });
  }
  res.json({ group: publicGroup(result.group, req) });
});

module.exports = router;
