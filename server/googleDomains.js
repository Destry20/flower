// Региональные домены Google (google.kz, google.co.uk, google.com.br ...).
//
// Зачем они нужны в CSP. Тег Google Ads (AW-18385746090, подтягивается через
// gtag.js само, в коде явно нигде не вызывается) шлёт пиксель ремаркетинга
// /pagead/1p-user-list/ не на www.google.com, а на домен страны посетителя —
// в самом запросе это видно по rmt_tld=1: у посетителя из Казахстана запрос
// уходит на www.google.kz. В CSP нельзя написать «любой домен первого
// уровня» (подстановка * работает только слева, для поддоменов), а открывать
// img-src до https: ради пикселя нельзя — это канал, через который любой
// внедрённый разметкой <img> мог бы вынести данные наружу (по той же причине
// connect-src/script-src у нас не расширяются до https:, см. server/index.js).
// Поэтому домены перечислены явно.
//
// Источник: https://www.google.com/supported_domains (официальный список
// Google, снят 2026-10-07, 186 доменов без .com — тот уже в CSP отдельно). Если Google
// добавит новый домен, посетитель оттуда просто не попадёт в аудиторию
// ремаркетинга (пиксель заблокирует CSP, больше ничего не ломается) —
// обновить список можно той же ссылкой.
const GOOGLE_REGIONAL_TLDS = [
  'ad', 'ae', 'com.af', 'com.ag', 'al', 'am', 'co.ao', 'com.ar', 'as', 'at',
  'com.au', 'az', 'ba', 'com.bd', 'be', 'bf', 'bg', 'com.bh', 'bi', 'bj',
  'com.bn', 'com.bo', 'com.br', 'bs', 'bt', 'co.bw', 'by', 'com.bz', 'ca', 'cd',
  'cf', 'cg', 'ch', 'ci', 'co.ck', 'cl', 'cm', 'cn', 'com.co', 'co.cr',
  'com.cu', 'cv', 'com.cy', 'cz', 'de', 'dj', 'dk', 'dm', 'com.do', 'dz',
  'com.ec', 'ee', 'com.eg', 'es', 'com.et', 'fi', 'com.fj', 'fm', 'fr', 'ga',
  'ge', 'gg', 'com.gh', 'com.gi', 'gl', 'gm', 'gr', 'com.gt', 'gy', 'com.hk',
  'hn', 'hr', 'ht', 'hu', 'co.id', 'ie', 'co.il', 'im', 'co.in', 'iq',
  'is', 'it', 'je', 'com.jm', 'jo', 'co.jp', 'co.ke', 'com.kh', 'ki', 'kg',
  'co.kr', 'com.kw', 'kz', 'la', 'com.lb', 'li', 'lk', 'co.ls', 'lt', 'lu',
  'lv', 'com.ly', 'co.ma', 'md', 'me', 'mg', 'mk', 'ml', 'com.mm', 'mn',
  'com.mt', 'mu', 'mv', 'mw', 'com.mx', 'com.my', 'co.mz', 'com.na', 'com.ng', 'com.ni',
  'ne', 'nl', 'no', 'com.np', 'nr', 'nu', 'co.nz', 'com.om', 'com.pa', 'com.pe',
  'com.pg', 'com.ph', 'com.pk', 'pl', 'pn', 'com.pr', 'ps', 'pt', 'com.py', 'com.qa',
  'ro', 'ru', 'rw', 'com.sa', 'com.sb', 'sc', 'se', 'com.sg', 'sh', 'si',
  'sk', 'com.sl', 'sn', 'so', 'sm', 'sr', 'st', 'com.sv', 'td', 'tg',
  'co.th', 'com.tj', 'tl', 'tm', 'tn', 'to', 'com.tr', 'tt', 'com.tw', 'co.tz',
  'com.ua', 'co.ug', 'co.uk', 'com.uy', 'co.uz', 'com.vc', 'co.ve', 'co.vi', 'com.vn', 'vu',
  'ws', 'rs', 'co.za', 'co.zm', 'co.zw', 'cat'
];

const GOOGLE_REGIONAL_IMG_SOURCES = GOOGLE_REGIONAL_TLDS.map(tld => 'https://www.google.' + tld);

module.exports = { GOOGLE_REGIONAL_TLDS, GOOGLE_REGIONAL_IMG_SOURCES };
