// TOTP (RFC 6238, поверх HOTP из RFC 4226) на голом crypto, без внешних
// зависимостей. Раньше здесь стоял otplib — он на Node 18 (именно эта версия
// на Railway) падал прямо при старте сервера: 'otplib' тянет транзитивно
// '@scure/base32', а тот собран только как ES-модуль, и обычный require()
// на нём падает с ERR_REQUIRE_ESM (в Node 18 require() ещё не умеет
// подключать ESM — это появилось в куда более новых версиях). Локально это
// не поймалось, потому что на машине разработки Node новее. TOTP — простой,
// стандартный, стабильный алгоритм — реализовать вручную безопаснее, чем
// таскать стороннюю библиотеку ради полусотни строк.
const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

function randomBase32Secret(byteLength = 20){
  return base32Encode(crypto.randomBytes(byteLength));
}

function base32Encode(buf){
  let bits = 0, value = 0, output = '';
  for(let i = 0; i < buf.length; i++){
    value = (value << 8) | buf[i];
    bits += 8;
    while(bits >= 5){
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if(bits > 0){
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(str){
  const clean = String(str || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0, value = 0;
  const bytes = [];
  for(let i = 0; i < clean.length; i++){
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if(idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if(bits >= 8){
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// RFC 4226 §5.3 — HMAC-SHA1 по секрету и 8-байтному big-endian счётчику,
// затем "динамическое усечение" до DIGITS цифр.
function hotp(secretBytes, counter){
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', secretBytes).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);
  const code = binCode % Math.pow(10, DIGITS);
  return String(code).padStart(DIGITS, '0');
}

function totpAt(secretBase32, timeMs){
  const counter = Math.floor(timeMs / 1000 / STEP_SECONDS);
  return hotp(base32Decode(secretBase32), counter);
}

// window=1 — принимаем код из соседнего 30-секундного шага в любую сторону
// (обычный запас на рассинхрон часов телефона/сервера и на то, что человек
// не всегда успевает ввести код в тот же самый 30-секундный интервал, в
// котором его увидел). Сравнение строк — через timingSafeEqual, та же
// причина, что и у сравнения пароля админа в routes/admin.js.
function verifyTotp(token, secretBase32, window = 1){
  const clean = String(token || '').trim();
  if(!/^\d{6}$/.test(clean) || !secretBase32) return false;
  const now = Date.now();
  for(let step = -window; step <= window; step++){
    const expected = totpAt(secretBase32, now + step * STEP_SECONDS * 1000);
    const a = Buffer.from(expected);
    const b = Buffer.from(clean);
    if(a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}

function keyUri(secretBase32, issuer, label){
  const path = encodeURIComponent(issuer) + ':' + encodeURIComponent(label);
  const params = new URLSearchParams({ secret: secretBase32, issuer });
  return `otpauth://totp/${path}?${params.toString()}`;
}

module.exports = { randomBase32Secret, verifyTotp, keyUri };
