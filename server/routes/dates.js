const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../auth');
const { tServer, pickLang } = require('../i18n');

const router = express.Router();
router.use(requireAuth);

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/', (req, res) => {
  res.json({ dates: db.listDatesByUser(req.user.id) });
});

router.post('/', createLimiter, (req, res) => {
  const { name, occasion, month, day } = req.body || {};
  const m = Number(month), d = Number(day);
  if(typeof name !== 'string' || !name.trim() || !Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1 || d > 31){
    return res.status(400).json({ error: tServer(req, 'dateInvalid') });
  }
  if(db.countDatesByUser(req.user.id) >= db.MAX_DATES_PER_USER){
    return res.status(403).json({ error: tServer(req, 'dateLimitReached') });
  }
  const entry = db.createDateReminder({
    userId: req.user.id,
    name: name.trim(),
    occasion: String(occasion || 'birthday'),
    month: m, day: d,
    lang: pickLang(req)
  });
  res.status(201).json({ date: entry });
});

router.delete('/:id', (req, res) => {
  const removed = db.deleteDateReminder(req.params.id, req.user.id);
  if(!removed) return res.status(404).json({ error: tServer(req, 'dateNotFound') });
  res.json({ ok: true });
});

module.exports = router;
