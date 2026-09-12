'use strict';
// Сборка клиентского бандла для продакшена: минифицирует public/script/main.js
// и кладёт его под именем с хешем содержимого — public/build/main.<hash>.js.
// Хеш в имени означает, что файл можно кэшировать в браузере сколь угодно долго
// (Cache-Control: immutable, см. server/index.js), а любая правка исходника
// даёт новый URL — устаревшая версия из кэша больше не всплывает.
//
// Запуск:
//   npm run build         — вручную (проверить прод-режим локально)
//   на деплое Railway это делает сам (Nixpacks видит скрипт "build")
//
// В обычной разработке сборка НЕ нужна: при NODE_ENV != production сервер
// отдаёт сырой /script/main.js напрямую, правки видно сразу после перезагрузки.

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'public', 'script', 'main.js');
const OUT_DIR = path.join(ROOT, 'public', 'build');

async function build(){
  const source = fs.readFileSync(SRC);
  // Хеш по исходнику (а не по результату) — детерминированный и меняется ровно
  // тогда, когда меняется вход. 10 hex-символов — более чем достаточно, чтобы
  // не столкнуться.
  const hash = crypto.createHash('sha256').update(source).digest('hex').slice(0, 10);
  const outName = `main.${hash}.js`;

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await esbuild.build({
    entryPoints: [SRC],
    outfile: path.join(OUT_DIR, outName),
    minify: true,
    // main.js — обычный скрипт с функциями в глобальной области (их зовут из
    // onclick="..." в шаблонах). Без bundle esbuild просто минифицирует один
    // файл, не оборачивая его в замыкание, — семантика ровно та же.
    bundle: false,
    target: ['es2020'],
    legalComments: 'none',
    charset: 'utf8'
  });

  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ 'main.js': `/build/${outName}` }, null, 2) + '\n'
  );

  const kb = (n) => (n / 1024).toFixed(1) + ' KB';
  const outSize = fs.statSync(path.join(OUT_DIR, outName)).size;
  console.log(`[build] public/script/main.js  ${kb(source.length)}  ->  public/build/${outName}  ${kb(outSize)}`);
}

build().catch((err) => {
  console.error('[build] сборка не удалась:', err);
  process.exit(1);
});
