// server/auth.js — хэш пароля, JWT сессии, токен ссылки сброса пароля.
// Проверяем то, что не требует req/res: сами криптографические примитивы.
'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// auth.js тянет ./db, а тот при загрузке читает файл базы — уводим на
// одноразовый путь, чтобы не коснуться реальной server/data/db.json.
const TMP_DB = path.join(os.tmpdir(), `vivorose-auth-test-${process.pid}-${Date.now()}.json`);
process.env.VIVOROSE_DB_FILE = TMP_DB;
after(() => {
  for (const f of [TMP_DB, TMP_DB + '.tmp']) {
    try { fs.rmSync(f, { force: true }); } catch { /* ignore */ }
  }
});

const jwt = require('jsonwebtoken');
const {
  hashPassword, verifyPassword, signToken,
  generateResetToken, hashResetToken, publicUser
} = require('../server/auth');

test('hashPassword / verifyPassword round-trip', () => {
  const hash = hashPassword('correct horse battery staple');
  assert.notEqual(hash, 'correct horse battery staple');
  assert.equal(verifyPassword('correct horse battery staple', hash), true);
  assert.equal(verifyPassword('wrong password', hash), false);
});

test('each hash of the same password is salted differently', () => {
  assert.notEqual(hashPassword('same'), hashPassword('same'));
});

test('signToken issues a JWT carrying the user id', () => {
  const token = signToken({ id: 'user-123' });
  const payload = jwt.decode(token);
  assert.equal(payload.uid, 'user-123');
  assert.ok(payload.exp > payload.iat, 'has an expiry');
});

test('reset token: random each time, hash is stable and one-way', () => {
  const a = generateResetToken();
  const b = generateResetToken();
  assert.notEqual(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);

  const h = hashResetToken(a);
  assert.equal(hashResetToken(a), h, 'deterministic');
  assert.notEqual(h, a, 'stored hash differs from the token in the link');
  assert.match(h, /^[a-f0-9]{64}$/);
});

test('publicUser drops the password hash and reset-token fields', () => {
  const safe = publicUser({
    id: 'u1', email: 'a@b.com', name: 'A', createdAt: 123,
    passwordHash: 'secret', resetTokenHash: 'secret2'
  });
  assert.deepEqual(safe, { id: 'u1', email: 'a@b.com', name: 'A', createdAt: 123 });
});
