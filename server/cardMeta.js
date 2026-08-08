// Урезанная серверная версия decodeCardData из public/script/main.js — нужна
// только чтобы вытащить occasion/from и собрать персональный og:title/description
// для превью ссылки в мессенджерах (WhatsApp/Telegram и т.д.). Полную проверку
// данных букета по-прежнему делает клиент при самом рендере открытки — здесь
// достаточно двух строковых полей, ошибка декодирования просто откатывает
// сайт к стандартным (общим) meta-тегам, ничего не ломая.
const { STRINGS } = require('./i18n');

function escapeHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function decodeCardDataServer(str){
  const binary = Buffer.from(String(str), 'base64url').toString('utf8');
  return JSON.parse(binary);
}

// Возвращает {title, description} (уже HTML-escaped, готовые к вставке в
// content="...") либо null, если ссылка битая/нечитаемая. lang выбирает бот
// (обычно по Accept-Language запроса — сам крауер messenger'а его присылает).
function buildShareMeta(encodedData, lang){
  const strings = STRINGS[lang] || STRINGS.ru;
  try{
    const data = decodeCardDataServer(encodedData);
    const from = typeof data.from === 'string' ? data.from.slice(0, 30).trim() : '';
    const stamp = strings.occasionStamps[data.occasion] || strings.cardNotFound;
    const title = strings.shareTitle(from);
    const description = strings.shareDescription(stamp);
    return { title: escapeHtml(title), description: escapeHtml(description) };
  }catch(e){
    return null;
  }
}

module.exports = { buildShareMeta, escapeHtml };
