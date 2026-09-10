// server/i18n.js — язык ответа API и писем. X-Lang (явный выбор клиента)
// приоритетнее Accept-Language; для запросов вовсе без языковых заголовков —
// откат на английский.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { pickLang, tServer, STRINGS } = require('../server/i18n');

// Мини-заглушка Express-запроса: get() ищет заголовок без учёта регистра.
function fakeReq(headers = {}) {
  const lower = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  return { headers: lower, get: (name) => lower[name.toLowerCase()] };
}

test('pickLang prefers X-Lang over Accept-Language', () => {
  assert.equal(pickLang(fakeReq({ 'X-Lang': 'ru', 'Accept-Language': 'en-US,en' })), 'ru');
  assert.equal(pickLang(fakeReq({ 'X-Lang': 'en', 'Accept-Language': 'ru-RU' })), 'en');
});

test('pickLang falls back to Accept-Language, then to English', () => {
  assert.equal(pickLang(fakeReq({ 'Accept-Language': 'ru-RU,ru;q=0.9' })), 'ru');
  assert.equal(pickLang(fakeReq({ 'Accept-Language': 'fr-FR' })), 'en');
  assert.equal(pickLang(fakeReq({})), 'en');
});

test('pickLang ignores an unsupported X-Lang value', () => {
  assert.equal(pickLang(fakeReq({ 'X-Lang': 'de', 'Accept-Language': 'ru' })), 'ru');
});

test('tServer returns the string for the picked language', () => {
  assert.equal(tServer(fakeReq({ 'X-Lang': 'ru' }), 'cardNotFound'), STRINGS.ru.cardNotFound);
  assert.equal(tServer(fakeReq({ 'X-Lang': 'en' }), 'cardNotFound'), STRINGS.en.cardNotFound);
});

test('tServer exposes function-valued strings (email bodies) intact', () => {
  const subject = tServer(fakeReq({ 'X-Lang': 'en' }), 'mailSubject');
  assert.equal(typeof subject, 'string');
  const body = tServer(fakeReq({ 'X-Lang': 'en' }), 'mailBodyText');
  assert.equal(typeof body, 'function');
  assert.ok(body('https://vivorose.com/reset?t=x').includes('https://vivorose.com/reset?t=x'));
});

test('ru and en dictionaries expose the same keys', () => {
  assert.deepEqual(Object.keys(STRINGS.ru).sort(), Object.keys(STRINGS.en).sort());
});
