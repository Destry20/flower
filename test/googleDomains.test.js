// server/googleDomains.js — региональные домены Google для img-src в CSP
// (пиксель ремаркетинга Google Ads уходит на www.google.<страна посетителя>).
// Список лежит в коде явно, а не "https:", поэтому важно, чтобы он не
// превратился во что-то шире задуманного: ни подстановок, ни чужих хостов.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GOOGLE_REGIONAL_TLDS, GOOGLE_REGIONAL_IMG_SOURCES } = require('../server/googleDomains');

test('every source is exactly https://www.google.<tld> — no wildcards, no foreign hosts', () => {
  assert.ok(GOOGLE_REGIONAL_IMG_SOURCES.length > 150, 'expected the full official list, got ' + GOOGLE_REGIONAL_IMG_SOURCES.length);
  for(const src of GOOGLE_REGIONAL_IMG_SOURCES){
    assert.match(src, /^https:\/\/www\.google\.[a-z]{2,3}(\.[a-z]{2})?$/, src);
    assert.ok(!src.includes('*'), src);
  }
});

test('no duplicates, and plain .com is left out (index.js lists www.google.com itself)', () => {
  assert.equal(new Set(GOOGLE_REGIONAL_IMG_SOURCES).size, GOOGLE_REGIONAL_IMG_SOURCES.length);
  assert.equal(GOOGLE_REGIONAL_TLDS.length, GOOGLE_REGIONAL_IMG_SOURCES.length);
  assert.ok(!GOOGLE_REGIONAL_IMG_SOURCES.includes('https://www.google.com'));
});

test('covers the markets the site actually sees (kz was the one that got blocked) incl. two-part TLDs', () => {
  // У Украины домен Google — com.ua (а не ua), у Британии — co.uk.
  for(const host of ['kz', 'ru', 'by', 'com.ua', 'de', 'fr', 'co.uk', 'com.br', 'co.in', 'com.au', 'co.jp', 'ca']){
    assert.ok(GOOGLE_REGIONAL_IMG_SOURCES.includes('https://www.google.' + host), host);
  }
});
