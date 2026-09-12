// server/turnstile.js — проверка Cloudflare Turnstile. SECRET_KEY читается
// один раз из process.env при require() (тот же стиль, что и GOOGLE_CLIENT_ID
// в routes/auth.js) — чтобы проверить оба режима ("выключено"/"включено") в
// одном файле, перечитываем модуль заново через require.cache между блоками,
// каждый раз с нужным env.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const MODULE_PATH = require.resolve('../server/turnstile');
function freshTurnstile(secretKey){
  delete require.cache[MODULE_PATH];
  if(secretKey == null) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = secretKey;
  return require('../server/turnstile');
}

test('captcha disabled (no TURNSTILE_SECRET_KEY): everything passes, network never touched', async () => {
  const originalFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; return { json: async () => ({ success: false }) }; };
  try{
    const { verifyTurnstile } = freshTurnstile(null);
    assert.equal(await verifyTurnstile('', null), true);
    assert.equal(await verifyTurnstile(undefined, null), true);
    assert.equal(await verifyTurnstile('whatever-token', '1.2.3.4'), true);
    assert.equal(fetchCalled, false, 'disabled captcha must never call out to Cloudflare');
  }finally{
    global.fetch = originalFetch;
  }
});

test('captcha enabled: rejects a missing token without calling the network', async () => {
  const originalFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; return { json: async () => ({ success: true }) }; };
  try{
    const { verifyTurnstile } = freshTurnstile('test-secret');
    assert.equal(await verifyTurnstile('', null), false);
    assert.equal(await verifyTurnstile(undefined, null), false);
    assert.equal(fetchCalled, false);
  }finally{
    global.fetch = originalFetch;
  }
});

test('captcha enabled: posts to the Cloudflare siteverify endpoint and honours success/failure', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, opts) => {
    calls.push({ url, body: opts.body.toString() });
    const isValid = opts.body.toString().includes('response=good-token');
    return { json: async () => ({ success: isValid }) };
  };
  try{
    const { verifyTurnstile } = freshTurnstile('test-secret');
    assert.equal(await verifyTurnstile('good-token', '1.2.3.4'), true);
    assert.equal(await verifyTurnstile('bad-token', '1.2.3.4'), false);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.match(calls[0].body, /secret=test-secret/);
    assert.match(calls[0].body, /remoteip=1\.2\.3\.4/);
  }finally{
    global.fetch = originalFetch;
  }
});

test('captcha enabled: a network failure fails closed (rejects), not open', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error('network down'); };
  try{
    const { verifyTurnstile } = freshTurnstile('test-secret');
    assert.equal(await verifyTurnstile('some-token', null), false);
  }finally{
    global.fetch = originalFetch;
  }
});

