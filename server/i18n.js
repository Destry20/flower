// Серверный аналог t() из public/script/main.js — клиент теперь бывает и
// русским, и англоязычным, поэтому и сообщения об ошибках API, и письмо
// восстановления пароля должны отвечать на подходящем языке. Язык определяем
// по заголовку X-Lang (клиент шлёт его в каждом auth-запросе, зная свой
// текущий uiLang) с откатом на Accept-Language для запросов без него
// (например, если письмо открыли не из этого сайта, или бот-краулер).
const STRINGS = {
  ru: {
    invalidEmail: 'Введите корректный email',
    passwordTooShort: 'Пароль должен быть не короче 8 символов',
    emailTaken: 'Этот email уже зарегистрирован',
    invalidLogin: 'Неверный email или пароль',
    googleNotConfigured: 'Вход через Google пока не настроен',
    tooManyAttempts: 'Слишком много попыток. Подождите немного и попробуйте снова.',
    resetGeneric: 'Если такой email зарегистрирован, мы отправили на него ссылку для сброса пароля.',
    resetTokenMissing: 'Ссылка недействительна',
    resetTokenExpired: 'Ссылка недействительна или устарела — запросите сброс пароля ещё раз',
    unauthorized: 'Требуется вход в аккаунт',
    notFound: 'Не найдено',
    serverError: 'Внутренняя ошибка сервера',
    cardInvalid: 'Некорректные данные открытки',
    cardNotFound: 'Открытка не найдена',
    cardLimitReached: 'Достигнут лимит в 10 открыток. Удалите одну из старых в разделе «Мои открытки», чтобы создать новую.',
    groupInvalid: 'Некорректные данные',
    groupNotFound: 'Открытка не найдена',
    groupClosed: 'Приём подписей уже закрыт',
    groupFull: 'В этой открытке уже максимум подписей',
    groupForbidden: 'Закрыть эту открытку можете только вы, её организатор',
    mailSubject: 'Восстановление пароля — VivoRose',
    mailBodyText: (url) => `Чтобы задать новый пароль, перейдите по ссылке: ${url}\n\nЕсли вы не запрашивали сброс пароля, просто проигнорируйте это письмо.`,
    mailBodyHtml: (url) => `<p>Чтобы задать новый пароль, перейдите по ссылке:</p><p><a href="${url}">${url}</a></p><p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>`,
    occasionStamps: {
      foryou: 'Для тебя', birthday: 'С днём рождения', love: 'С любовью',
      thanks: 'Спасибо тебе', congrats: 'Поздравляю', sorry: 'Я рядом', justbecause: 'Просто так',
      sympathy: 'Соболезную'
    },
    shareTitle: (from) => `Вам открытка${from ? ' от ' + from : ''} 🌿`,
    shareDescription: (stamp) => `${stamp}. Нажмите, чтобы открыть букет и пожелание.`,
    groupInviteTitle: (to) => `Общая открытка для ${to} · VivoRose`
  },
  en: {
    invalidEmail: 'Enter a valid email',
    passwordTooShort: 'Password must be at least 8 characters',
    emailTaken: 'This email is already registered',
    invalidLogin: 'Incorrect email or password',
    googleNotConfigured: 'Google sign-in isn\'t set up yet',
    tooManyAttempts: 'Too many attempts. Please wait a bit and try again.',
    resetGeneric: 'If that email is registered, we\'ve sent a password reset link to it.',
    resetTokenMissing: 'This link is invalid',
    resetTokenExpired: 'This link is invalid or has expired — request a new password reset',
    unauthorized: 'You need to be logged in',
    notFound: 'Not found',
    serverError: 'Internal server error',
    cardInvalid: 'Invalid card data',
    cardNotFound: 'Card not found',
    cardLimitReached: 'You\'ve reached the 10-card limit. Delete an old one in "My cards" to create a new one.',
    groupInvalid: 'Invalid data',
    groupNotFound: 'Card not found',
    groupClosed: 'Signatures are closed for this card',
    groupFull: 'This card already has the maximum number of signatures',
    groupForbidden: 'Only the organizer can close this card',
    mailSubject: 'Password reset — VivoRose',
    mailBodyText: (url) => `To set a new password, follow this link: ${url}\n\nIf you didn't request a password reset, just ignore this email.`,
    mailBodyHtml: (url) => `<p>To set a new password, follow this link:</p><p><a href="${url}">${url}</a></p><p>If you didn't request a password reset, just ignore this email.</p>`,
    occasionStamps: {
      foryou: 'For you', birthday: 'Happy Birthday', love: 'With love',
      thanks: 'Thank you', congrats: 'Congratulations', sorry: "I'm here", justbecause: 'Just because',
      sympathy: 'With sympathy'
    },
    shareTitle: (from) => `You've got a card${from ? ' from ' + from : ''} 🌿`,
    shareDescription: (stamp) => `${stamp}. Tap to open the bouquet and the message.`,
    groupInviteTitle: (to) => `Group card for ${to} · VivoRose`
  }
};

function pickLang(req){
  const header = req.get && req.get('X-Lang');
  if(header === 'ru' || header === 'en') return header;
  const accept = ((req.get && req.get('Accept-Language')) || req.headers?.['accept-language'] || '').toLowerCase();
  return accept.startsWith('ru') ? 'ru' : 'en';
}

function tServer(req, key){
  const lang = pickLang(req);
  const dict = STRINGS[lang] || STRINGS.ru;
  return dict[key] !== undefined ? dict[key] : STRINGS.ru[key];
}

module.exports = { STRINGS, pickLang, tServer };
