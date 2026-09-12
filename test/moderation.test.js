// server/moderation.js — первый, локальный уровень модерации новых открыток
// (ссылки/телефоны/крипто-адреса/явные угрозы). Не блокирует ничего, поэтому
// самое важное тут — не путать безобидный текст с подозрительным.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { scanText, scanCard } = require('../server/moderation');

test('scanText flags a link', () => {
  assert.deepEqual(scanText('заходи на promo-site.xyz за призом'), ['link']);
  assert.deepEqual(scanText('check this out: https://example.com/win'), ['link']);
});

test('scanText flags a phone number', () => {
  assert.deepEqual(scanText('call me at +1 415 555 0187'), ['phone']);
});

test('scanText flags a crypto address', () => {
  assert.deepEqual(scanText('send to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'), ['crypto_address']);
});

test('scanText flags an explicit threat phrase', () => {
  assert.deepEqual(scanText('я тебя найду и убью'), ['threat']);
  assert.deepEqual(scanText('I will kill you'), ['threat']);
});

test('scanText returns multiple reasons at once', () => {
  const reasons = scanText('call +1 415 555 0187 or visit scam-site.xyz');
  assert.ok(reasons.includes('phone'));
  assert.ok(reasons.includes('link'));
});

test('scanText leaves ordinary warm messages alone', () => {
  const messages = [
    'С днём рождения! Пусть этот год будет самым счастливым.',
    'Happy birthday! Wishing you all the best.',
    'Спасибо, что ты рядом — это очень много для меня значит.',
    'Ты одна из тех редких людей, рядом с которыми легче дышать.',
    'Killing it at your new job — so proud of you!', // "killing" не должно ловиться как угроза
  ];
  for (const m of messages) {
    assert.deepEqual(scanText(m), [], `should not flag: "${m}"`);
  }
});

test('scanText handles empty/non-string input safely', () => {
  assert.deepEqual(scanText(''), []);
  assert.deepEqual(scanText(undefined), []);
  assert.deepEqual(scanText(null), []);
});

test('scanCard combines to/from/message without duplicate reasons', () => {
  const r = scanCard({ to: 'visit scam-site.xyz', from: 'also scam-site.xyz', message: 'hi' });
  assert.equal(r.flagged, true);
  assert.deepEqual(r.flagReasons, ['link']); // одна и та же причина в двух полях -> одна запись
});

test('scanCard is not flagged when nothing matches', () => {
  const r = scanCard({ to: 'Ann', from: 'Bo', message: 'С днём рождения!' });
  assert.deepEqual(r, { flagged: false, flagReasons: [] });
});
