// Отсев "шума" из отчётов об ошибках на клиенте (POST /api/admin/report-error,
// см. reportClientError в public/script/main.js).
//
// Клиент шлёт любое необработанное событие 'error' со страницы — а на странице
// живёт не только наш код. В журнал "Ошибки от пользователей" таким образом
// попадало то, что исправить на сайте нельзя и что не даёт владельцу ничего,
// кроме пустых строк, за которыми теряются настоящие ошибки:
//
//  · "Script error." — так браузер маскирует ошибку, случившуюся в скрипте с
//    ЧУЖОГО домена (Google-теги, реклама, расширения): подробности по правилам
//    безопасности скрыты, ни файла, ни стека, ни строки. Наши собственные
//    скрипты отдаются с нашего же домена и так не маскируются — значит, это
//    заведомо не наш код, и разобрать такую запись нельзя в принципе;
//  · скрипты, которые в страницу подкладывает сам браузер посетителя: встроенный
//    браузер Meta (Facebook/Instagram/Messenger на Android — iabjs://, и его
//    "Java object is gone", когда страница уже выгружена), расширения
//    (chrome-extension:// и т.п.), Safari ("webkit-masked-url://" — так он
//    прячет адрес скрипта не с нашего домена).
//
// Защита от обратной ошибки — спрятать настоящую: если в стеке есть кадр с
// адреса нашего же сайта (origin страницы, с которой пришёл отчёт), запись
// считается нашей, даже если рядом есть чужие кадры — например, баг в нашем
// обработчике, вызванный скриптом расширения.

const MASKED_CROSS_ORIGIN = /^Script error\.?$/i;

const FOREIGN_SIGNATURES = [
  'iabjs://',
  'Java object is gone',
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'safari-web-extension://',
  'webkit-masked-url://'
];

function originOf(url){
  try{ return new URL(String(url || '')).origin; }catch(e){ return ''; }
}

function isNoiseClientError({ message, stack, url } = {}){
  const msg = String(message || '').trim();
  const text = msg + '\n' + String(stack || '');

  // Сначала "это наш код?" — кадр с нашего origin перевешивает любые чужие признаки.
  const origin = originOf(url);
  if(origin && origin !== 'null' && text.includes(origin + '/')) return false;

  if(MASKED_CROSS_ORIGIN.test(msg)) return true;
  return FOREIGN_SIGNATURES.some(sig => text.includes(sig));
}

module.exports = { isNoiseClientError };
