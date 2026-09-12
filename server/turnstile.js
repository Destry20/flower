// Проверка Cloudflare Turnstile — та же логика "опционально, пока не
// настроено", что и у Google-входа (см. GOOGLE_CLIENT_ID в routes/auth.js):
// TURNSTILE_SECRET_KEY не задан в .env -> verifyTurnstile всегда пропускает,
// капча просто выключена (клиент тоже не рисует виджет — см. appConfig в
// public/script/main.js, ключ берётся из GET /api/config). Так сайт не
// ломается, пока владелец не завёл сайт в дэшборде Cloudflare.
const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

if(!SECRET_KEY && process.env.NODE_ENV === 'production'){
  console.warn('[turnstile] TURNSTILE_SECRET_KEY не задан — проверка капчи выключена на гостевых открытках, регистрации и подписях под общими открытками.');
}

// Node 18+ даёт fetch глобально — отдельная зависимость (axios и т.п.) ради
// одного POST-запроса не нужна.
async function verifyTurnstile(token, remoteIp){
  if(!SECRET_KEY) return true;
  if(typeof token !== 'string' || !token) return false;
  try{
    const body = new URLSearchParams({ secret: SECRET_KEY, response: token });
    if(remoteIp) body.set('remoteip', remoteIp);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body
    });
    const data = await res.json();
    return !!data.success;
  }catch(e){
    // Сеть до Cloudflare недоступна/упала — отклоняем, а не тихо пропускаем:
    // при включённой капче отказ должен быть безопасным по умолчанию.
    console.error('[turnstile] verify failed:', e.message);
    return false;
  }
}

module.exports = { verifyTurnstile };
