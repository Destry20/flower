// Ставит data-theme на <html> из сохранённого выбора (localStorage 'vr-theme',
// пишется toggleTheme() в main.js). Подключается в <head> статических страниц
// блога ДО стилей — сам main.js они не грузят, а строгий CSP (script-src без
// 'unsafe-inline', см. server/index.js) не даёт сделать это инлайн-скриптом.
// Без этого страницы блога всегда рендерились в светлой теме.
try {
  var t = localStorage.getItem('vr-theme');
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
