// Тесты собственной реализации TOTP (server/totp.js) — без внешних библиотек,
// поэтому важно, что алгоритм совпадает со стандартом (RFC 6238) и что чужой
// код примет наши коды и наоборот.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { randomBase32Secret, verifyTotp, keyUri, totpAt } = require('../server/totp');

test('randomBase32Secret returns a valid base32 string', () => {
  const s = randomBase32Secret();
  assert.match(s, /^[A-Z2-7]+$/);
  assert.ok(s.length >= 16);
  assert.notEqual(randomBase32Secret(), randomBase32Secret());
});

test('matches the RFC 6238 SHA-1 test vector', () => {
  // RFC 6238 Appendix B: секрет — ASCII "12345678901234567890", в base32 это
  // GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ. На T = 59 с ожидаемый 8-значный код
  // 94287082, значит младшие 6 цифр — 287082.
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(totpAt(secret, 59 * 1000), '287082');
  assert.equal(totpAt(secret, 1111111109 * 1000), '081804');
});

test('verifyTotp accepts the current code and rejects a wrong one', () => {
  const secret = randomBase32Secret();
  const now = Date.now();
  assert.equal(verifyTotp(totpAt(secret, now), secret), true);

  // код из соседнего 30-секундного окна принимается (window = 1)
  assert.equal(verifyTotp(totpAt(secret, now - 30 * 1000), secret), true);
  assert.equal(verifyTotp(totpAt(secret, now + 30 * 1000), secret), true);

  // код из далёкого окна — нет
  assert.equal(verifyTotp(totpAt(secret, now + 5 * 60 * 1000), secret), false);
});

test('verifyTotp rejects malformed input and a missing secret', () => {
  const secret = randomBase32Secret();
  assert.equal(verifyTotp('', secret), false);
  assert.equal(verifyTotp('12345', secret), false);   // мало цифр
  assert.equal(verifyTotp('1234567', secret), false);  // много цифр
  assert.equal(verifyTotp('abcdef', secret), false);   // не цифры
  assert.equal(verifyTotp('123456', ''), false);       // нет секрета
  assert.equal(verifyTotp(null, secret), false);
});

test('keyUri builds a scannable otpauth:// URL', () => {
  const uri = keyUri('ABC234', 'VivoRose', 'admin@vivorose.com');
  assert.ok(uri.startsWith('otpauth://totp/'));
  assert.ok(uri.includes('secret=ABC234'));
  assert.ok(uri.includes('issuer=VivoRose'));
  assert.ok(uri.includes(encodeURIComponent('admin@vivorose.com')));
});
