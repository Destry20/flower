// server/clientErrorNoise.js — отсев чужих ошибок из журнала "Ошибки от
// пользователей". Образцы шума — дословно из админки (ноябрь 2026); не менее
// важна обратная сторона: настоящие ошибки нашего кода фильтр пропускать
// обязан, иначе журнал станет красиво пустым и бесполезным.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isNoiseClientError } = require('../server/clientErrorNoise');

const OWN_URL = 'https://vivorose.com/c/SEm2mak';

test('"Script error." (cross-origin script, details hidden by the browser) is noise', () => {
  assert.equal(isNoiseClientError({ message: 'Script error.', stack: '', url: 'https://vivorose.com/' }), true);
  assert.equal(isNoiseClientError({ message: 'Script error', url: 'https://vivorose.com/birthday-card' }), true);
});

test('Meta in-app browser (Android) "Java object is gone" injected script is noise', () => {
  const message = 'Uncaught Error: Error invoking postMessage: Java object is gone\n'
    + 'Error: Error invoking postMessage: Java object is gone at sendDataToNative '
    + '(iabjs://navigation_performance_logger_android:1:11722) at sendJsBlockingTimeMessage '
    + '(iabjs://navigation_performance_logger_android:1:16303) at iabjs://navigation_performance_logger_android:1:20760';
  assert.equal(isNoiseClientError({ message, stack: '', url: OWN_URL }), true);
  // и вариант с sendBeforeUnloadMessage — другая функция того же скрипта
  assert.equal(isNoiseClientError({ message: message.replace('sendJsBlockingTimeMessage', 'sendBeforeUnloadMessage'), url: OWN_URL }), true);
});

test('browser-extension and Safari-masked scripts are noise', () => {
  for(const frame of ['chrome-extension://abcd/content.js:1:1', 'moz-extension://x/y.js:2:2', 'safari-web-extension://z/a.js:3:3', 'webkit-masked-url://hidden/:1:1']){
    assert.equal(isNoiseClientError({ message: 'TypeError: x is not a function', stack: 'TypeError: x is not a function\n    at ' + frame, url: OWN_URL }), true, frame);
  }
});

test('a real error in our own code is NOT noise', () => {
  const stack = "TypeError: Cannot read properties of null (reading 'classList')\n    at renderViewer (https://vivorose.com/script/main.js:1234:5)";
  assert.equal(isNoiseClientError({ message: "TypeError: Cannot read properties of null (reading 'classList')", stack, url: OWN_URL }), false);
  assert.equal(isNoiseClientError({ message: 'Failed to fetch', stack: '', url: OWN_URL }), false);
  assert.equal(isNoiseClientError({ message: 'Uncaught TurnstileError: [Cloudflare Turnstile] Error: 300010.', url: 'https://vivorose.com/#create' }), false);
});

test('a bug in OUR handler that merely passes through an extension frame is kept (own frame wins)', () => {
  const stack = 'TypeError: boom\n    at saveAndShare (https://vivorose.com/script/main.js:99:9)\n    at chrome-extension://abcd/inject.js:1:1';
  assert.equal(isNoiseClientError({ message: 'TypeError: boom', stack, url: OWN_URL }), false);
});

test('only an exact "Script error." is masked-noise — longer messages that mention it are kept', () => {
  assert.equal(isNoiseClientError({ message: 'Script error in render: undefined card', url: OWN_URL }), false);
  assert.equal(isNoiseClientError({ message: 'Failed to load Script error.js', url: OWN_URL }), false);
});

test('missing/garbage fields do not throw', () => {
  assert.equal(isNoiseClientError(), false);
  assert.equal(isNoiseClientError({ message: 'x', url: 'not a url' }), false);
  assert.equal(isNoiseClientError({ message: 'Script error.', url: 'not a url' }), true);
});
