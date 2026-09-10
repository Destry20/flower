// server/cardMeta.js собирает og:title/og:description для превью ссылки на
// открытку в мессенджерах. Значения идут прямо в content="...", поэтому тут
// важнее всего экранирование — данные открытки задаёт отправитель.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildShareMeta, escapeHtml } = require('../server/cardMeta');

function encodeCard(obj) {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

test('escapeHtml neutralises every HTML-significant character', () => {
  assert.equal(escapeHtml(`<script>&"'`), '&lt;script&gt;&amp;&quot;&#39;');
  assert.equal(escapeHtml(''), '');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(42), '42');
});

test('buildShareMeta returns escaped title/description for a valid card', () => {
  const meta = buildShareMeta(encodeCard({ occasion: 'love', from: 'Anna' }), 'en');
  assert.ok(meta);
  assert.ok(meta.title.includes('Anna'));
  assert.ok(meta.description.length > 0);
  // без вредных символов в норме
  assert.doesNotMatch(meta.title, /[<>]/);
});

test('buildShareMeta escapes an XSS attempt in the "from" field', () => {
  const evil = '"><img src=x onerror=alert(1)>';
  const meta = buildShareMeta(encodeCard({ occasion: 'birthday', from: evil }), 'en');
  assert.ok(meta);
  assert.doesNotMatch(meta.title, /<img/, 'raw tag must not survive');
  assert.ok(meta.title.includes('&lt;img') || meta.title.includes('&quot;'));
});

test('buildShareMeta caps an overlong "from" at 30 chars', () => {
  const meta = buildShareMeta(encodeCard({ occasion: 'love', from: 'x'.repeat(200) }), 'ru');
  assert.ok(meta);
  // 30 иксов внутри, 200 — нет
  assert.ok(meta.title.includes('x'.repeat(30)));
  assert.ok(!meta.title.includes('x'.repeat(31)));
});

test('buildShareMeta returns null for unreadable input', () => {
  assert.equal(buildShareMeta('!!!not base64!!!', 'en'), null);
  assert.equal(buildShareMeta(Buffer.from('not json', 'utf8').toString('base64url'), 'en'), null);
  assert.equal(buildShareMeta('', 'en'), null);
});

test('buildShareMeta falls back to ru strings for an unknown lang', () => {
  const meta = buildShareMeta(encodeCard({ occasion: 'love', from: 'Ann' }), 'de');
  assert.ok(meta);
  assert.ok(meta.title.length > 0);
});
