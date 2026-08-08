// Минимальный service worker — нужен только для того, чтобы браузер считал
// сайт "устанавливаемым" (это одно из условий PWA-installability в Chrome).
// Сознательно НИЧЕГО не кэширует: сайт активно меняется, а агрессивный кэш
// service worker'а — куда более коварный источник "показывает старую версию"
// багов, чем обычный HTTP-кэш (с которым мы уже один раз намучились, см.
// no-cache в server/index.js). Каждый запрос просто уходит в сеть как обычно.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
