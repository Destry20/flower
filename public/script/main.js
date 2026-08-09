/* ====================== ERROR REPORTING ====================== */
// Ловим неотловленные ошибки/rejection'ы и молча шлём их на сервер — админка
// (public/admin/) показывает их владельцу сайта. Не блокирует и не отвлекает
// пользователя: никакого UI, просто fire-and-forget запрос.
function reportClientError(message, stack){
  try{
    fetch('/api/admin/report-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, stack, url: location.href, userAgent: navigator.userAgent })
    }).catch(() => {});
  }catch(e){ /* fetch недоступен/заблокирован — молча игнорируем */ }
}
window.addEventListener('error', (e) => {
  reportClientError(e.message, e.error && e.error.stack);
});
window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  reportClientError(
    (reason && reason.message) || String(reason),
    reason && reason.stack
  );
});

/* ====================== I18N ====================== */
// Язык интерфейса: сначала смотрим сохранённый выбор в этом браузере, иначе —
// язык браузера (ru → русский, всё остальное → английский, так сайт по
// умолчанию понятен и иностранной аудитории). tr({ru,en,...}) — для полей
// данных (label/stamp/placeholder и т.п.), t('русская строка') — для строк
// интерфейса: русский текст одновременно служит ключом словаря EN_STRINGS,
// так что не нужно придумывать отдельные ключи и ничего не сломается, даже
// если перевод для какой-то строки забыли добавить (тогда просто останется RU).
function detectLang(){
  try{
    const saved = localStorage.getItem('msb-lang');
    if(saved === 'ru' || saved === 'en') return saved;
  }catch(e){}
  return (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
let uiLang = detectLang();
function setLang(lang){
  if(lang !== 'ru' && lang !== 'en') return;
  uiLang = lang;
  try{ localStorage.setItem('msb-lang', lang); }catch(e){}
  document.documentElement.lang = lang;
  renderRoute();
}
function tr(obj){
  if(obj == null) return '';
  if(typeof obj === 'string') return obj;
  return obj[uiLang] || obj.ru || obj.en || '';
}
function t(ru){
  return uiLang === 'ru' ? ru : (EN_STRINGS[ru] || ru);
}

const EN_STRINGS = {
  'Мои открытки': 'My cards',
  'Достигнут лимит открыток': 'You\'ve reached the card limit',
  'Цветы ещё не добавлены': 'No flowers added yet',
  'Изменить цветы': 'Edit flowers',
  'Добавить цветы': 'Add flowers',
  'Добавьте цветы в букет': 'Add flowers to the bouquet',
  'Готово': 'Done',
  'Закрыть': 'Close',
  'Войти': 'Log in',
  'Выйти из аккаунта': 'Log out',
  'Собрать открытку': 'Create a card',
  'Соберите букет и оставьте послание, которое захочется сохранить': 'Build a bouquet and leave a message worth keeping',
  'Выберите повод, соберите цветы, добавьте пару строк — и отправьте одной ссылкой. Открывается как настоящая открытка: с разворотом и цветением.':
    'Pick an occasion, arrange the flowers, add a few lines — and send it as a single link. It opens like a real card: unfolding and blooming.',
  'Повод': 'Occasion',
  'задаёт тон открытки': 'sets the tone of the card',
  'Букет': 'Bouquet',
  'форма вазы, цветы, лента': 'vase shape, flowers, ribbon',
  'Ваза': 'Vase',
  'Цветы': 'Flowers',
  'отметьте нужные, выберите цвет и количество': 'pick the ones you want, choose color and count',
  'Лента': 'Ribbon',
  'Послание': 'Message',
  'кому и что хотите сказать': 'who it\'s for and what you want to say',
  'Имя получателя': 'Recipient\'s name',
  'Ваше имя': 'Your name',
  'Текст пожелания': 'Message text',
  'Дополнительно': 'Extras',
  'необязательные штрихи': 'optional touches',
  'Нежная мелодия при открытии': 'Gentle melody on opening',
  'Короткий сгенерированный перезвон, без сторонних файлов': 'A short generated chime, no external files',
  'Мелодия': 'Melody',
  'нажмите, чтобы прослушать': 'click to preview',
  'Открыть в определённый момент': 'Open at a specific moment',
  'До этого времени получатель увидит только конверт': 'Until then the recipient will only see the envelope',
  'Создать ссылку': 'Create link',
  'Собрать наугад': 'Surprise me',
  'Фон сцены': 'Scene background',
  'получатель увидит такой же': 'the recipient will see the same one',
  'Конверт': 'Envelope',
  'Живой предпросмотр открытки. Получатель увидит анимацию раскрытия.': 'Live preview of the card. The recipient will see the opening animation.',
  '↻ Показать анимацию открытия': '↻ Replay opening animation',
  'Текст пожелания появится здесь…': 'Your message will appear here…',
  'РЕКЛАМА': 'ADVERTISEMENT',
  'Реклама': 'Advertisement',
  'Место для рекламного баннера': 'Ad banner placeholder',

  // occasion labels/stamps/placeholders — см. tr() в самих объектах OCCASIONS

  // flower/vase/envelope/background/melody labels — см. tr() в самих объектах

  'Убрать': 'Remove', 'Добавить': 'Add',
  'Цвет': 'Color',
  'Меньше': 'Fewer', 'Больше': 'More',

  'Открытка готова': 'Card ready',
  'Открытка собрана': 'Card is ready',
  'Отправьте эту ссылку — она откроется как раскрывающаяся открытка с вашим букетом.':
    'Send this link — it will open as an unfolding card with your bouquet.',
  'Ссылка на открытку': 'Card link',
  'Копировать': 'Copy',
  'Отсканируйте с телефона': 'Scan with your phone',
  'Предпросмотреть': 'Preview',
  'Поделиться': 'Share',
  'Редактировать': 'Edit',
  'Создать ещё одну': 'Create another',
  'Ссылка скопирована': 'Link copied',
  'Скопируйте ссылку вручную': 'Copy the link manually',
  'Добавьте текст пожелания': 'Add a message first',
  'Не удалось создать ссылку, попробуйте ещё раз': 'Could not create the link, please try again',
  'Собрали для вас новый вариант': 'Put together a new version for you',
  'Не удалось удалить открытку': 'Could not delete the card',
  'Открытка удалена': 'Card deleted',

  'Открытка не найдена': 'Card not found',
  'не найдено': 'not found',
  'Эта открытка недоступна': 'This card is unavailable',
  'Ссылка повреждена или указана неверно.': 'The link is broken or incorrect.',
  'Создать свою': 'Create your own',
  'эта открытка ждёт своего момента': 'this card is waiting for its moment',
  'Загляните сюда чуть позже — и получите свой букет': 'Come back a little later to get your bouquet',
  'Нажмите, чтобы открыть': 'Tap to open',
  'Открытка создана в': 'This card was made with',
  'соберите свою за пару минут': 'build your own in a couple of minutes',

  'на этом устройстве': 'on this device',
  'в вашем аккаунте': 'in your account',
  'Открытки, которые вы собрали': 'The cards you\'ve made',
  'Открытки сохранены за вашим аккаунтом и доступны с любого устройства.': 'Your cards are saved to your account and available from any device.',
  'Пока пусто. Соберите первую открытку — она появится здесь.': 'Nothing here yet. Make your first card and it will show up here.',
  'Открыть': 'Open',
  'Ссылка': 'Link',
  'Удалить': 'Delete',

  'аккаунт': 'account',
  'Вход': 'Log in',
  'Чтобы открытки сохранялись за вами, а не только в этом браузере.': 'So your cards are saved to you, not just to this browser.',
  'Email': 'Email',
  'Пароль': 'Password',
  'Нет аккаунта?': 'No account yet?',
  'Зарегистрироваться': 'Sign up',
  'Забыли пароль?': 'Forgot your password?',
  'Восстановить': 'Reset it',
  'Регистрация': 'Sign up',
  'Займёт полминуты. Пароль — не короче 8 символов.': 'Takes half a minute. Password must be at least 8 characters.',
  'Имя (необязательно)': 'Name (optional)',
  'Создать аккаунт': 'Create account',
  'Уже есть аккаунт?': 'Already have an account?',
  'Добро пожаловать!': 'Welcome!',
  'Аккаунт создан': 'Account created',
  'Восстановление пароля': 'Password reset',
  'Укажите email, на который зарегистрирован аккаунт — пришлём ссылку для сброса пароля.':
    'Enter the email your account is registered with — we\'ll send a password reset link.',
  'Отправить ссылку': 'Send link',
  'Вспомнили пароль?': 'Remembered your password?',
  'Новый пароль': 'New password',
  'Придумайте новый пароль — не короче 8 символов.': 'Choose a new password — at least 8 characters.',
  'Сохранить пароль': 'Save password',
  'Пароль обновлён, вы вошли в аккаунт': 'Password updated, you\'re logged in',
  'Вы вышли из аккаунта': 'You\'ve been logged out',

  'документ': 'document',
  'Конфиденциальность': 'Privacy',
  'Условия использования': 'Terms of use',
  'Политика конфиденциальности': 'Privacy Policy',
  'Последнее обновление: черновик — перед публикацией согласуйте с юристом.': 'Last updated: draft — have a lawyer review it before publishing.',
  'Какие данные мы собираем': 'What data we collect',
  'Email и (опционально) имя — при регистрации аккаунта. Пароль хранится не в открытом виде, а в виде хеша. Содержимое собранных вами открыток (текст, выбор цветов и т.д.) — если вы вошли в аккаунт, чтобы список «Мои открытки» не терялся между устройствами.':
    'Email and (optionally) name when you register an account. Passwords are stored hashed, never in plain text. The contents of the cards you build (text, flower choices, etc.) — only if you\'re logged in, so your "My cards" list survives across devices.',
  'Как используются данные': 'How the data is used',
  'Для входа в аккаунт и отображения ваших открыток. Мы не продаём и не передаём email третьим лицам, кроме случаев, предусмотренных законом.':
    'To log you in and show your cards. We don\'t sell or share your email with third parties except where required by law.',
  'Cookies и реклама': 'Cookies and advertising',
  'Один технический cookie используется для авторизации (хранит подписанный токен сессии) и не используется для рекламного трекинга. Отдельно на сайте могут показываться рекламные баннеры (например, Google AdSense или Яндекс.Директ) — рекламная сеть может устанавливать собственные cookies для показа объявлений. Эту секцию нужно будет дополнить точной формулировкой из политики выбранной рекламной сети перед подключением реальной рекламы.':
    'One technical cookie is used for authentication (holds a signed session token) and is not used for ad tracking. Separately, the site may show ad banners (e.g. Google AdSense or Yandex.Direct) — the ad network may set its own cookies to serve ads. This section will need the exact wording from the chosen ad network\'s policy before real ads go live.',
  'Открытки без аккаунта': 'Cards without an account',
  'Если вы не входите в аккаунт, вся открытка целиком хранится в самой ссылке (в её части после «#») — сервер её не видит и не сохраняет. Список «Мои открытки» в этом случае хранится только в вашем браузере (localStorage).':
    'If you\'re not logged in, the entire card is stored inside the link itself (the part after "#") — the server never sees or stores it. In that case, your "My cards" list only lives in this browser (localStorage).',
  'Удаление данных': 'Deleting your data',
  'Вы можете удалить любую открытку из списка «Мои открытки». Чтобы удалить аккаунт целиком, напишите на': 'You can delete any card from your "My cards" list. To delete your whole account, email',
  'Сервис': 'The service',
  'позволяет собрать виртуальный букет-открытку и отправить её ссылкой. Все цветы, вазы, конверты и фоны бесплатны. Сервис поддерживается показом рекламных баннеров.':
    'lets you build a virtual bouquet card and send it as a link. All flowers, vases, envelopes and backgrounds are free. The service is supported by ad banners.',
  'Реклама на сайте': 'Advertising',
  'На страницах сайта могут показываться рекламные объявления от сторонних рекламных сетей (например, Google AdSense, Яндекс.Директ). Мы не отвечаем за содержание конкретных объявлений — их подбирает рекламная сеть.':
    'Pages on this site may show ads from third-party ad networks (e.g. Google AdSense, Yandex.Direct). We are not responsible for the content of individual ads — they are selected by the ad network.',
  'Ответственность': 'Responsibility',
  'Вы несёте ответственность за содержание текста, который добавляете в открытку. Запрещено использовать сервис для рассылки незаконного, оскорбительного или спам-контента.':
    'You are responsible for the content of the text you add to a card. Using the service to send unlawful, abusive, or spam content is prohibited.',
  'Изменения': 'Changes',
  'Мы можем обновлять эти условия; актуальная версия всегда доступна на этой странице.': 'We may update these terms; the current version is always available on this page.',

  'Для': 'For',

  'Букет цветов': 'Bouquet of flowers',
  'соберите открытку с букетом': 'create a card with a bouquet',
  'Дата открытия': 'Reveal date',
  'Время открытия': 'Reveal time',
  'соберите открытку за пару минут и отправьте ссылкой': 'build a card in a couple of minutes and send it as a link',
  'Рекламный блок': 'Ad block',
  'готово': 'done',
  'Ссылка получилась длинной': 'The link turned out long',
  'симв.': 'chars',
  'некоторые мессенджеры или SMS могут обрезать её. Если получатель не сможет открыть, попробуйте отправить QR-код ниже или сократить текст пожелания.':
    'some messengers or SMS may truncate it. If the recipient can\'t open it, try sending the QR code below or shortening your message.',
  'Ссылка полностью самодостаточна: вся открытка «зашита» в неё, отдельный сервер для её открытия не нужен.':
    'The link is fully self-contained: the whole card is baked into it, no separate server is needed to open it.',
  'Это короткая ссылка: сама открытка хранится на сервере в вашем аккаунте, а ссылка лишь указывает на неё.':
    'This is a short link: the card itself is stored on the server under your account, and the link just points to it.',
  'Копия также сохранена в разделе «Мои открытки» вашего аккаунта.': 'A copy has also been saved to the "My cards" section of your account.',
  'Войдите в аккаунт, чтобы копия сохранялась и не терялась при очистке браузера.': 'Log in so a copy is saved and doesn\'t get lost when you clear your browser.',
  'Вам открытка с букетом 🌿': 'You\'ve got a card with a bouquet 🌿',
  'Открытка для': 'A card for',
  'Открытка': 'Card',
  'Вам открытка от': 'You\'ve got a card from',
  'кого-то особенного': 'someone special',
  'Нажмите, чтобы открыть букет и пожелание.': 'Tap to open the bouquet and the message.',
  'Откроется': 'Opens on',
  'в': 'at',
  'Открыть открытку': 'Open the card',
  'от': 'from',
  'Этот список хранится только в браузере на этом устройстве и пропадёт при очистке кэша.': 'This list is only stored in this browser on this device and will be lost if you clear your cache.',
  'Войдите': 'Log in',
  'чтобы открытки сохранялись за вами навсегда.': 'so your cards are saved to you for good.',
  'Загрузка…': 'Loading…',
  'Не удалось войти': 'Could not log in',
  'Имя': 'Name',
  'Не удалось зарегистрироваться': 'Could not sign up',
  'Не удалось отправить ссылку': 'Could not send the link',
  'Не удалось сохранить пароль': 'Could not save the password',
  'Аккаунт': 'Account'
};

/* ====================== DATA ====================== */

const BRAND = 'VivoRose';
const SITE_DESCRIPTION_RU = 'Соберите виртуальный букет, добавьте пожелание и отправьте открытку одной ссылкой.';
const SITE_DESCRIPTION_EN = 'Build a virtual bouquet, add a message, and send a card with a single link.';
function siteDescription(){ return uiLang === 'ru' ? SITE_DESCRIPTION_RU : SITE_DESCRIPTION_EN; }

// anim — какая анимация частиц играет при раскрытии открытки (см. dropParticles):
// 'confetti' для праздничных поводов, 'hearts' для любви, 'petals' — мягкий вариант по умолчанию
const OCCASIONS = [
  {id:'foryou', label:{ru:'Для тебя',en:'For you'}, color:'#5C7457', stamp:{ru:'Для тебя',en:'For you'}, placeholder:{ru:'За то что ты есть!',en:'Just for being you!'}, anim:'petals'},
  {id:'birthday', label:{ru:'День рождения',en:'Birthday'}, color:'#C97B86', stamp:{ru:'С днём рождения',en:'Happy Birthday'}, placeholder:{ru:'Пусть этот год принесёт тебе только самые тёплые дни...',en:'May this year bring you only warm, happy days...'}, anim:'confetti'},
  {id:'love', label:{ru:'Любовь',en:'Love'}, color:'#4B2E3D', stamp:{ru:'С любовью',en:'With love'}, placeholder:{ru:'Ты — моё самое доброе утро...',en:'You are my favorite good morning...'}, anim:'hearts'},
  {id:'thanks', label:{ru:'Спасибо',en:'Thank you'}, color:'#B98A4A', stamp:{ru:'Спасибо тебе',en:'Thank you'}, placeholder:{ru:'Хочу, чтобы ты знал(а), как я ценю тебя...',en:'I want you to know how much I appreciate you...'}, anim:'petals'},
  {id:'congrats', label:{ru:'Поздравляю',en:'Congrats'}, color:'#5C7457', stamp:{ru:'Поздравляю',en:'Congratulations'}, placeholder:{ru:'Ты это заслужил(а). Горжусь тобой!',en:'You earned this. So proud of you!'}, anim:'confetti'},
  {id:'sorry', label:{ru:'Поддержка',en:'Support'}, color:'#8CA087', stamp:{ru:'Я рядом',en:"I'm here"}, placeholder:{ru:'Просто хочу, чтобы ты знал(а) — я рядом, что бы ни случилось.',en:"Just want you to know — I'm here, no matter what."}, anim:'petals'},
  {id:'justbecause', label:{ru:'Просто так',en:'Just because'}, color:'#C97B86', stamp:{ru:'Просто так',en:'Just because'}, placeholder:{ru:'Без повода. Просто подумал(а) о тебе сегодня.',en:'No reason. Just thought of you today.'}, anim:'petals'}
];

const FLOWER_TYPES = [
  {id:'rose', label:{ru:'Роза',en:'Rose'}, colors:['#C97B86','#E3B7BE','#B23A4E','#E6C88A']},
  {id:'peony', label:{ru:'Пион',en:'Peony'}, colors:['#F0C9D6','#E6A6BC','#FBEAD9','#D98CAE']},
  {id:'tulip', label:{ru:'Тюльпан',en:'Tulip'}, colors:['#D65B4A','#E8A03A','#B23A4E','#E6C88A']},
  {id:'daisy', label:{ru:'Ромашка',en:'Daisy'}, colors:['#FFFFFF','#E6C88A','#E3B7BE']},
  {id:'carnation', label:{ru:'Гвоздика',en:'Carnation'}, colors:['#C97B86','#D65B4A','#F0C9D6','#FFFFFF']},
  {id:'orchid', label:{ru:'Орхидея',en:'Orchid'}, colors:['#B27BC9','#E8D5F0','#7A4B96']},
  {id:'sunflower', label:{ru:'Подсолнух',en:'Sunflower'}, colors:['#F2C94C','#E8A03A']}
];

const VASES = [
  {id:'A', label:{ru:'Глиняная',en:'Clay'}},
  {id:'B', label:{ru:'Стеклянная',en:'Glass'}},
  {id:'C', label:{ru:'Крафтовая',en:'Kraft-wrapped'}},
  {id:'D', label:{ru:'Мраморная',en:'Marble'}}
];

const RIBBONS = ['#B98A4A','#C97B86','#4B2E3D','#8CA087','#F2E1C8','#7e4ab9'];

const ENVELOPES = [
  {id:'classic', label:{ru:'Классика',en:'Classic'}},
  {id:'kraft', label:{ru:'Крафт',en:'Kraft'}},
  {id:'seal', label:{ru:'С печатью',en:'Wax seal'}},
  {id:'pattern', label:{ru:'Узорный',en:'Patterned'}},
  {id:'gold', label:{ru:'Золотой',en:'Gold'}}
];

// фон сцены — виден и в предпросмотре при сборке, и в реальной открытке
// у получателя (сохраняется вместе с остальными данными открытки в ссылке)
// dark:true — фон достаточно тёмный, чтобы текст поверх него нужно было
// перекрашивать в светлый (см. .stage-dark в main.css)
const BACKGROUNDS = [
  {id:'cream', label:{ru:'Кремовый',en:'Cream'}, css:'linear-gradient(180deg,#F0E4CE,#FAF3E7)'},
  {id:'blush', label:{ru:'Румяна',en:'Blush'}, css:'linear-gradient(180deg,#F6DDE2,#FBEFE9)'},
  {id:'sage', label:{ru:'Шалфей',en:'Sage'}, css:'linear-gradient(180deg,#DCE6D6,#F2F5EE)'},
  {id:'night', label:{ru:'Ночь',en:'Night'}, css:'linear-gradient(180deg,#1B2038,#3A3159)', dark:true}
];

// Ссылка, где всё "зашито" через base64, растёт с длиной сообщения и количеством
// цветов. После этой длины некоторые мессенджеры/SMS могут обрезать URL —
// предупреждаем пользователя, но не блокируем создание ссылки.
const LINK_WARN_LENGTH = 1800;

/* ====================== STATE ====================== */

const state = {
  occasion: 'birthday',
  vase: 'A',
  ribbon: RIBBONS[0],
  flowers: {}, // id -> {color, count}
  message: '',
  from: '',
  to: '',
  music: false,
  melody: 'chime',
  revealEnabled: false,
  revealDate: '',
  revealTime: '10:00',
  envelope: 'classic',
  background: 'cream'
};
state.flowers.rose = {color:FLOWER_TYPES[0].colors[0], count:3};
state.flowers.carnation = {color:FLOWER_TYPES[4].colors[0], count:2};

// Выбор цветов раньше всегда был развёрнут на странице и занимал много места —
// теперь прячем его за кнопку и всплывающее окошко, открытое/закрытое
// состояние которого просто гоняем через renderCreator(), как и всё остальное.
let flowerPickerOpen = false;

/* ====================== SESSION / ACCOUNT ====================== */
// session.user — текущий пользователь (или null для гостя), заполняется при
// загрузке из /api/auth/me.
const session = { user: null };
let pendingRoute = null; // куда вернуться после логина

async function loadMe(){
  try{
    const res = await fetch('/api/auth/me');
    const json = await res.json();
    session.user = json.user || null;
  }catch(e){ session.user = null; }
}

/* ====================== HELPERS ====================== */

function hexToHsl(hex){
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16)/255;
  const g = parseInt(c.substring(2,4),16)/255;
  const b = parseInt(c.substring(4,6),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0, s=0; const l=(max+min)/2;
  if(max!==min){
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    if(max===r) h=(g-b)/d + (g<b?6:0);
    else if(max===g) h=(b-r)/d + 2;
    else h=(r-g)/d + 4;
    h/=6;
  }
  return {h,s,l};
}
function hslToHex(h,s,l){
  const hue2rgb=(p,q,t)=>{
    if(t<0)t+=1; if(t>1)t-=1;
    if(t<1/6) return p+(q-p)*6*t;
    if(t<1/2) return q;
    if(t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  let r,g,b;
  if(s===0){ r=g=b=l; }
  else{
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  const toHex = x => Math.round(Math.min(1,Math.max(0,x))*255).toString(16).padStart(2,'0');
  return '#'+toHex(r)+toHex(g)+toHex(b);
}
// darken/lighten теперь считаются через HSL, а не через сырой RGB.
// Меняем только светлоту (L), тон и насыщенность не трогаем — поэтому
// результат выглядит естественно для ЛЮБОГО исходного цвета: и для тёмно-бордового,
// и для бледно-кремового. Раньше подсветление светлых цветов "переполняло" канал
// за 255 и ломало hex (например #F2E1C8 при lighten(25) превращался в мусорный
// 7-значный код вроде #10bfae1, который браузер не мог отрисовать).
function darken(hex, amt){
  const {h,s,l} = hexToHsl(hex);
  const newL = Math.min(1, Math.max(0, l - amt/255));
  return hslToHex(h, s, newL);
}
function lighten(hex, amt){ return darken(hex, -amt); }
function uid(){ return 'c' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
function esc(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}
function setPageTitle(title){
  document.title = title ? `${title} · ${BRAND}` : BRAND;
}
// обновляет og:/twitter: мета-теги, чтобы при вставке ссылки в мессенджеры и
// соцсети получатель видел осмысленное превью, а не голый URL
function setMeta(title, description){
  const setContent = (selector, value) => {
    const el = document.querySelector(selector);
    if(el) el.setAttribute('content', value);
  };
  setContent('meta[property="og:title"]', title);
  setContent('meta[name="twitter:title"]', title);
  setContent('meta[property="og:description"]', description);
  setContent('meta[name="twitter:description"]', description);
  setContent('meta[property="og:url"]', location.href);
}

/* ---- кодирование открытки прямо в ссылку (без сервера) ---- */
// превращает объект открытки в компактную безопасную для URL строку.
// TextEncoder/btoa с байтовой строкой — более надёжный способ прогнать кириллицу
// через base64, чем связка encodeURIComponent+unescape (последняя формально
// deprecated и может странно себя вести на не-UTF16 суррогатных парах, напр. эмодзи).
function encodeCardData(payload){
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  const b64 = btoa(binary);
  // делаем строку url-safe: btoa даёт +, /, = — их нельзя просто вставлять в hash
  return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
// делает обратное превращение: строка из ссылки -> объект открытки
function decodeCardData(str){
  let b64 = str.replace(/-/g,'+').replace(/_/g,'/');
  while(b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

// Ссылку на открытку может прислать кто угодно, руками обрезать её или
// отредактировать — а списки OCCASIONS/VASES/ENVELOPES/BACKGROUNDS в будущем
// могут измениться. sanitizeCardData гарантирует, что renderViewer всегда
// получит данные с валидными id, а не упадёт на "cannot read property of
// undefined" где-нибудь в середине отрисовки SVG.
function sanitizeCardData(raw){
  const data = raw && typeof raw === 'object' ? raw : {};

  const occasionOk = OCCASIONS.some(o => o.id === data.occasion);
  const vaseOk = VASES.some(v => v.id === data.vase);
  const envelopeOk = ENVELOPES.some(e => e.id === data.envelope);
  const backgroundOk = BACKGROUNDS.some(b => b.id === data.background);

  const flowers = {};
  if(data.flowers && typeof data.flowers === 'object'){
    Object.keys(data.flowers).forEach(id=>{
      const ft = FLOWER_TYPES.find(f=>f.id===id);
      const entry = data.flowers[id];
      if(!ft || !entry) return;
      const count = Math.max(0, Math.min(12, parseInt(entry.count,10) || 0));
      if(count<=0) return;
      const color = typeof entry.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(entry.color)
        ? entry.color : ft.colors[0];
      flowers[id] = {color, count};
    });
  }
  if(!Object.keys(flowers).length){
    flowers.rose = {color:FLOWER_TYPES[0].colors[0], count:3};
  }

  const ribbon = typeof data.ribbon === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.ribbon)
    ? data.ribbon : RIBBONS[0];

  return {
    occasion: occasionOk ? data.occasion : OCCASIONS[1].id,
    vase: vaseOk ? data.vase : VASES[0].id,
    envelope: envelopeOk ? data.envelope : ENVELOPES[0].id,
    background: backgroundOk ? data.background : BACKGROUNDS[0].id,
    ribbon,
    flowers,
    message: typeof data.message === 'string' ? data.message.slice(0,400) : '',
    from: typeof data.from === 'string' ? data.from.slice(0,30) : '',
    to: typeof data.to === 'string' ? data.to.slice(0,30) : '',
    music: !!data.music,
    melody: MELODIES.some(m=>m.id===data.melody) ? data.melody : MELODIES[0].id,
    reveal: data.reveal && !isNaN(new Date(data.reveal).getTime()) ? data.reveal : null
  };
}

/* ====================== FLOWER SVG RENDERING ====================== */

function stemPath(x1,y1,x2,y2,bow){
  const mx = (x1+x2)/2 + bow, my=(y1+y2)/2;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

// Тёплый лепесток-"слеза": основание в (0,0), кончик на (0,-len) — так его удобно
// расставлять кольцом вокруг центра цветка через rotate(угол) + translate(0,-r0).
// Изгиб краёв (через кубические Безье) делает лепесток мягким и живым, а не
// геометрическим эллипсом — именно это отличает иллюстрацию от "значка".
function petalPath(len, width){
  const w = width/2;
  return `M0,0 C${-w},${-len*0.22} ${-w*0.9},${-len*0.78} 0,${-len} C${w*0.9},${-len*0.78} ${w},${-len*0.22} 0,0 Z`;
}
// тот же принцип, но с рваным трёхзубым краем — для гвоздики
function fringedPetal(len, width){
  const w = width/2;
  return `M0,0 L${-w},${-len*0.55} L${-w*0.4},${-len*0.82} L${-w*0.15},${-len*0.55} L0,${-len} L${w*0.15},${-len*0.55} L${w*0.4},${-len*0.82} L${w},${-len*0.55} Z`;
}
// маленький глянцевый блик — на светлом полупрозрачном пятне глаз считывает объём
function glint(x, y, rot, color){
  return `<ellipse cx="${x}" cy="${y}" rx="1.7" ry="1" fill="${color}" opacity=".55" transform="rotate(${rot} ${x} ${y})"/>`;
}

function flowerHead(type, cx, cy, color, rot, scale){
  const dark = darken(color, 42);
  const light = lighten(color, 26);
  let g = '';
  // все фигуры лепестков рисуются вокруг локального (0,0) — это гарантирует, что
  // rotate/scale ниже вращают и масштабируют цветок ровно вокруг его собственного
  // центра, а не "сползают" к углу холста при scale < 1
  if(type==='rose'){
    // два яруса лепестков-слёз (крупный внешний + плотный внутренний) дают
    // характерную спиральную розетку розы вместо плоского "цветка-ромашки"
    const outer = 8, inner = 5;
    for(let i=0;i<outer;i++){
      const a = (i/outer)*360;
      g += `<g transform="rotate(${a})"><path d="${petalPath(10,11)}" fill="${i%2?color:light}" stroke="${dark}" stroke-width=".5" transform="translate(0,-3.5)"/></g>`;
    }
    for(let i=0;i<inner;i++){
      const a = (i/inner)*360 + 18;
      g += `<g transform="rotate(${a})"><path d="${petalPath(6.5,7)}" fill="${color}" stroke="${dark}" stroke-width=".45" transform="translate(0,-1)"/></g>`;
    }
    g += `<circle cx="0" cy="0" r="2.6" fill="${dark}"/>`;
    g += glint(-2, -6.5, -20, lighten(color,42));
  } else if(type==='peony'){
    // пышные два яруса — пион узнаётся именно по обилию рыхлых лепестков
    const ringA = 9, ringB = 7;
    for(let i=0;i<ringA;i++){
      const a = (i/ringA)*360;
      g += `<g transform="rotate(${a})"><path d="${petalPath(8.5,9.5)}" fill="${i%3===0?light:color}" stroke="${dark}" stroke-width=".45" transform="translate(0,-5)"/></g>`;
    }
    for(let i=0;i<ringB;i++){
      const a = (i/ringB)*360 + 22;
      g += `<g transform="rotate(${a})"><path d="${petalPath(5.5,6.5)}" fill="${lighten(color,10)}" stroke="${dark}" stroke-width=".4" transform="translate(0,-1.5)"/></g>`;
    }
    g += `<circle cx="0" cy="0" r="2.3" fill="${dark}"/>`;
    g += glint(-1.5, -8, -15, lighten(color,45));
  } else if(type==='tulip'){
    // три внешних лепестка врозь + просвечивающая внутренняя чаша — тюльпан
    // перестаёт быть одним "блобом" и получает лёгкую многослойность
    [-16, 0, 16].forEach((a,i)=>{
      const fill = i===1 ? color : darken(color,8);
      g += `<g transform="rotate(${a})"><path d="M 0 15 C -9 4 -8 -20 0 -15 C 8 -20 9 4 0 15 Z" fill="${fill}" stroke="${dark}" stroke-width=".6"/></g>`;
    });
    g += `<path d="M 0 13 C -5 4 -4.5 -9 0 -7.5 C 4.5 -9 5 4 0 13 Z" fill="${light}" opacity=".65"/>`;
    g += glint(-1.6, -9, -10, lighten(color,48));
  } else if(type==='daisy'){
    // узкие лепестки-слёзы вместо ровных эллипсов — кончики теперь мягко заострены
    const count = 12;
    for(let i=0;i<count;i++){
      const a = (i/count)*360;
      g += `<g transform="rotate(${a})"><path d="${petalPath(10.5,4.2)}" fill="${color}" stroke="${dark}" stroke-width=".35" transform="translate(0,-2.5)"/></g>`;
    }
    g += `<circle cx="0" cy="0" r="5.3" fill="#D9A441"/>`;
    for(let i=0;i<8;i++){
      const a = (i/8)*Math.PI*2;
      g += `<circle cx="${Math.cos(a)*2.7}" cy="${Math.sin(a)*2.7}" r=".55" fill="#8A5E22" opacity=".55"/>`;
    }
  } else if(type==='carnation'){
    // два яруса рваных лепестков — бахромчатый край остаётся, но цветок стал полнее
    const outer=14, inner=9;
    for(let i=0;i<outer;i++){
      const a = (i/outer)*360;
      g += `<g transform="rotate(${a})"><path d="${fringedPetal(8,6)}" fill="${i%2?color:light}" stroke="${dark}" stroke-width=".35" transform="translate(0,-2.5)"/></g>`;
    }
    for(let i=0;i<inner;i++){
      const a = (i/inner)*360 + 20;
      g += `<g transform="rotate(${a})"><path d="${fringedPetal(5.5,4.5)}" fill="${color}" stroke="${dark}" stroke-width=".3" transform="translate(0,-0.5)"/></g>`;
    }
    g += `<circle cx="0" cy="0" r="2" fill="${dark}"/>`;
  } else if(type==='orchid'){
    // пять лепестков-слёз вокруг + увеличенная нижняя губа (лабеллум) с крапом —
    // узнаваемый силуэт орхидеи, но с более мягкими, живыми краями лепестков
    for(let i=0;i<5;i++){
      const a = (i/5)*360 - 90;
      g += `<g transform="rotate(${a})"><path d="${petalPath(9,7)}" fill="${i===0?light:color}" stroke="${dark}" stroke-width=".45" transform="translate(0,-2)"/></g>`;
    }
    g += `<path d="M -6 4 C -6 9 6 9 6 4 C 6 1 3 -1 0 -1 C -3 -1 -6 1 -6 4 Z" fill="${lighten(color,16)}" stroke="${dark}" stroke-width=".5"/>`;
    g += `<circle cx="-1.6" cy="4.6" r=".7" fill="${dark}" opacity=".6"/><circle cx="1.6" cy="4.9" r=".6" fill="${dark}" opacity=".5"/>`;
    g += `<circle cx="0" cy="0" r="1.8" fill="${dark}"/>`;
  } else if(type==='sunflower'){
    // лепестки-слёзы вместо ромбов + спиральная (золотой угол) текстура семечек
    // в середине — та же природная закономерность, что и в общей раскладке букета
    const count=13;
    for(let i=0;i<count;i++){
      const a = (i/count)*360;
      g += `<g transform="rotate(${a})"><path d="${petalPath(9,4.6)}" fill="${color}" stroke="${dark}" stroke-width=".35" transform="translate(0,-4.5)"/></g>`;
    }
    g += `<circle cx="0" cy="0" r="6.8" fill="#6B4A2A"/>`;
    const GOLDEN = 137.508*Math.PI/180;
    for(let i=0;i<16;i++){
      const rr = Math.sqrt((i+0.5)/16)*5.7;
      const aa = i*GOLDEN;
      g += `<circle cx="${Math.cos(aa)*rr}" cy="${Math.sin(aa)*rr}" r=".55" fill="#4B2E3D" opacity=".45"/>`;
    }
  }
  // translate → rotate → scale, в этом порядке: сначала ставим цветок на место стебля,
  // затем крутим и масштабируем строго вокруг этой самой точки — без сюрпризов рендера
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${scale})">${g}</g>`;
}

// пара небольших листьев у горлышка вазы — лёгкий штрих зелени, который делает
// букет собранным, а не "цветы воткнули в вазу"
function leafSpray(cx, tieY, color){
  color = color || '#6E8B5E';
  const dark = darken(color, 30);
  const leaf = (x,y,angle,len) => {
    const w = len*0.36;
    return `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M0,0 C${-w},${-len*0.3} ${-w*0.9},${-len*0.75} 0,${-len} C${w*0.9},${-len*0.75} ${w},${-len*0.3} 0,0 Z" fill="${color}" stroke="${dark}" stroke-width=".5"/><path d="M0,-1 L0,${-len+2}" stroke="${dark}" stroke-width=".4" opacity=".5"/></g>`;
  };
  return leaf(cx-15, tieY-1, -58, 21) + leaf(cx+15, tieY-1, 58, 21) + leaf(cx-6, tieY-5, -16, 25) + leaf(cx+7, tieY-7, 14, 24);
}

function vaseSvg(type, cx, topY){
  const c = {A:{fill:'#C97B5A', dark:'#9B5738'}, B:{fill:'#EDE7DA', dark:'#B9AF9B'}, C:{fill:'#DCC9A3', dark:'#B39B6D'}}[type] || {fill:'#C97B5A', dark:'#9B5738'};
  if(type==='A'){
    // мягкий блик слева и тень справа поверх глины — без них ваза читалась плоским пятном
    return `<path d="M ${cx-46} ${topY} C ${cx-52} ${topY+55} ${cx-38} ${topY+90} ${cx} ${topY+92} C ${cx+38} ${topY+90} ${cx+52} ${topY+55} ${cx+46} ${topY}
      L ${cx+38} ${topY-6} L ${cx-38} ${topY-6} Z" fill="${c.fill}" stroke="${c.dark}" stroke-width="1"/>
      <path d="M ${cx-30} ${topY+6} C ${cx-34} ${topY+40} ${cx-26} ${topY+70} ${cx-6} ${topY+82}" stroke="${lighten(c.fill,22)}" stroke-width="7" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M ${cx+30} ${topY+10} C ${cx+34} ${topY+45} ${cx+22} ${topY+72} ${cx+8} ${topY+84}" stroke="${darken(c.fill,20)}" stroke-width="9" fill="none" opacity=".22" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${topY-6}" rx="38" ry="8" fill="${lighten(c.fill,15)}" stroke="${c.dark}" stroke-width="1"/>
      <ellipse cx="${cx}" cy="${topY-6}" rx="29" ry="5" fill="${darken(c.fill,12)}" opacity=".3"/>`;
  }
  if(type==='B'){
    // лёгкий тон "воды" у дна + пара стеклянных бликов — сразу читается как стекло, не пластик
    return `<path d="M ${cx-34} ${topY} L ${cx-30} ${topY+95} L ${cx+30} ${topY+95} L ${cx+34} ${topY} Z" fill="${c.fill}" opacity=".5" stroke="${c.dark}" stroke-width="1"/>
      <path d="M ${cx-27} ${topY+68} L ${cx-25} ${topY+92} L ${cx+25} ${topY+92} L ${cx+27} ${topY+68} Z" fill="#BFDCE6" opacity=".3"/>
      <path d="M ${cx-24} ${topY+6} L ${cx-20} ${topY+80}" stroke="#FFFFFF" stroke-width="3" opacity=".45" stroke-linecap="round" fill="none"/>
      <path d="M ${cx+16} ${topY+14} L ${cx+13} ${topY+60}" stroke="#FFFFFF" stroke-width="1.6" opacity=".3" stroke-linecap="round" fill="none"/>
      <ellipse cx="${cx}" cy="${topY}" rx="34" ry="7" fill="${lighten(c.fill,10)}" opacity=".7" stroke="${c.dark}" stroke-width="1"/>`;
  }
  if(type==='D'){
    // мраморная — прямые грани, тонкие "прожилки" и глянцевый блик, без цветного fill из карты выше
    return `<path d="M ${cx-40} ${topY} L ${cx-34} ${topY+92} L ${cx+34} ${topY+92} L ${cx+40} ${topY} Z" fill="#EDEBE4" stroke="#B7B2A6" stroke-width="1"/>
      <path d="M ${cx-30} ${topY+15} Q ${cx} ${topY+40} ${cx+18} ${topY+70}" stroke="#C9C2B4" stroke-width="1" fill="none" opacity=".7"/>
      <path d="M ${cx+25} ${topY+10} Q ${cx+10} ${topY+50} ${cx-15} ${topY+85}" stroke="#C9C2B4" stroke-width="1" fill="none" opacity=".5"/>
      <path d="M ${cx-22} ${topY+8} L ${cx-16} ${topY+70}" stroke="#FFFFFF" stroke-width="3" opacity=".4" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${topY}" rx="40" ry="8" fill="#F5F3ED" stroke="#B7B2A6" stroke-width="1"/>`;
  }
  // крафтовая — складки бумаги и верхняя светлая полоса вместо ровного прямоугольника
  return `<rect x="${cx-38}" y="${topY-4}" width="76" height="88" rx="6" fill="${c.fill}" stroke="${c.dark}" stroke-width="1"/>
    <rect x="${cx-40}" y="${topY-16}" width="80" height="16" rx="4" fill="${lighten(c.fill,10)}" stroke="${c.dark}" stroke-width="1"/>
    <path d="M ${cx-40} ${topY+10} L ${cx+40} ${topY+6}" stroke="${c.dark}" stroke-width="1" opacity=".4"/>
    <path d="M ${cx-30} ${topY+20} L ${cx-30} ${topY+80}" stroke="${c.dark}" stroke-width="1" opacity=".18"/>
    <path d="M ${cx+8} ${topY+16} L ${cx+8} ${topY+78}" stroke="${c.dark}" stroke-width="1" opacity=".18"/>
    <path d="M ${cx-38} ${topY+4} L ${cx+38} ${topY+4}" stroke="${lighten(c.fill,18)}" stroke-width="2" opacity=".5"/>`;
}

function ribbonBow(cx, y, color){
  const dark = darken(color, 35);
  const lightc = lighten(color, 22);
  // хвостики ленты с V-образным вырезом на конце — узнаваемая деталь банта
  const tail = (dx) => `<path d="M ${cx} ${y} L ${cx+dx*4} ${y+22} L ${cx+dx*9} ${y+18} L ${cx+dx*6} ${y+24} L ${cx+dx*11} ${y+21}" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`;
  // каждое "крыло" банта — не эллипс, а петля-безье, поэтому выглядит как ткань, а не леденец
  const wing = (dx) => `<path d="M ${cx} ${y} C ${cx+dx*4} ${y-11} ${cx+dx*18} ${y-11} ${cx+dx*16} ${y} C ${cx+dx*18} ${y+9} ${cx+dx*4} ${y+9} ${cx} ${y} Z" fill="${color}" stroke="${dark}" stroke-width="1"/>`;
  return `<g>
    ${tail(-1)}${tail(1)}
    ${wing(-1)}${wing(1)}
    <ellipse cx="${cx-9}" cy="${y-4}" rx="2.6" ry="1.4" fill="${lightc}" opacity=".55" transform="rotate(-25 ${cx-9} ${y-4})"/>
    <ellipse cx="${cx+9}" cy="${y-4}" rx="2.6" ry="1.4" fill="${lightc}" opacity=".55" transform="rotate(25 ${cx+9} ${y-4})"/>
    <circle cx="${cx}" cy="${y}" r="5.5" fill="${dark}"/>
    <circle cx="${cx}" cy="${y}" r="5.5" fill="none" stroke="${darken(color,50)}" stroke-width=".6"/>
  </g>`;
}

function buildBouquetSVG(cfg, size){
  size = size || 300;
  const cx = size/2;
  const vaseTopY = size*0.62;
  const tieY = vaseTopY - 4; // все стебли сходятся в одну точку у горлышка — как перевязанный букет

  const flowerEntries = Object.entries(cfg.flowers).filter(([,v])=>v.count>0);
  const heads = [];
  flowerEntries.forEach(([type, v])=>{
    for(let i=0;i<v.count;i++){
      heads.push({type, color:v.color});
    }
  });
  const n = heads.length;

  // купол букета: радиус растёт с количеством цветов, но всегда остаётся внутри холста
  const domeR = n>0 ? Math.min(size*0.30, size*0.10 + Math.sqrt(n)*8) : 0;
  const domeCenterY = vaseTopY - size*0.30;

  const GOLDEN = 137.508 * Math.PI/180;
  const pts = heads.map((h,i)=>{
    // золотой угол раскладывает точки плотным равномерным кругом, а не рядом в линию —
    // именно так растения/бутоны укладываются в реальном собранном букете.
    // степень 0.62 (а не 0.5) стягивает точки чуть ближе к центру, чтобы бутоны
    // перекрывались и слипались в единую массу, а не просто стояли рядом
    const r = n>1 ? domeR*Math.pow((i+0.5)/n, 0.62) : 0;
    const a = i*GOLDEN;
    const x = cx + r*Math.cos(a);
    const y = domeCenterY + r*Math.sin(a)*0.7; // приплюснуто по вертикали — читается как купол, не шар
    const scale = 1 - (r/(domeR||1))*0.18; // дальние бутоны чуть мельче — эффект глубины
    return {type:h.type, color:h.color, x, y, r, scale};
  });

  let stemsSvg = '', headsSvg = '';

  // стебли рисуем от дальних к ближним, все — из одной точки завязки ленты.
  // конец стебля — это сама точка центра цветка (не ниже неё), поэтому головка
  // цветка (рисуется поверх) всегда полностью скрывает стык, при любом масштабе бутона
  pts.slice().sort((a,b)=>b.r-a.r).forEach(p=>{
    const bow = (p.x-cx)*0.4;
    stemsSvg += `<path d="${stemPath(cx, tieY, p.x, p.y, bow)}" fill="none" stroke="#5C7457" stroke-width="1.6" opacity=".85"/>`;
  });

  // головки цветов — от дальних (верх купола) к ближним (низ купола), чтобы передние перекрывали задние
  pts.slice().sort((a,b)=>a.y-b.y).forEach(p=>{
    const rot = (p.x-cx)*0.3;
    headsSvg += flowerHead(p.type, p.x, p.y, p.color, rot, Math.max(0.72, p.scale));
  });

  const vase = vaseSvg(cfg.vase, cx, vaseTopY);
  const leaves = n > 0 ? leafSpray(cx, tieY) : '';
  const bow = ribbonBow(cx, vaseTopY-2, cfg.ribbon);
  // мягкая тень под вазой — без неё композиция выглядела "приклеенной" к верху холста
  const shadow = `<ellipse cx="${cx}" cy="${vaseTopY+94}" rx="46" ry="7" fill="#000000" opacity=".08"/>`;
  // Мягкая тень под каждой головкой цветка — раньше светлые/кремовые лепестки
  // (белая ромашка/гвоздика и т.п.) визуально сливались с фоном карточки,
  // у которой похожий тёплый кремовый тон. Тень даёт край независимо от того,
  // насколько светлый выбран цвет — работает для любого оттенка, а не только
  // для конкретных "проблемных" цветов.
  const headsFilterId = 'bqShadow' + Math.random().toString(36).slice(2,8);
  return `<svg viewBox="0 0 ${size} ${size*1.15}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;" role="img" aria-label="${t('Букет цветов')}">
    <defs>
      <filter id="${headsFilterId}" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.6" flood-color="#2F3B2A" flood-opacity="0.4"/>
      </filter>
    </defs>
    ${shadow}
    ${stemsSvg}
    <g filter="url(#${headsFilterId})">${headsSvg}</g>
    ${vase}
    ${leaves}
    ${bow}
  </svg>`;
}

/* ====================== WEB AUDIO CHIME ====================== */

// Три коротких сгенерированных мелодии (без аудиофайлов, только осциллятор Web
// Audio) — раньше был один жёстко зашитый перезвон, теперь выбор влияет и на
// набор нот, и на темп/тип волны, чтобы мелодии звучали заметно по-разному.
const MELODIES = [
  {id:'chime', label:{ru:'Перезвон',en:'Chime'}, notes:[523.25,659.25,783.99,1046.5], wave:'sine', step:0.18},
  {id:'bells', label:{ru:'Колокольчики',en:'Bells'}, notes:[659.25,987.77,783.99,1318.51], wave:'triangle', step:0.14},
  {id:'harp', label:{ru:'Арфа',en:'Harp'}, notes:[392.00,493.88,587.33,698.46,880.00], wave:'sine', step:0.11}
];
function melodyById(id){ return MELODIES.find(m=>m.id===id) || MELODIES[0]; }

function playChime(melodyId){
  try{
    const melody = melodyById(melodyId);
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const notes = melody.notes;
    notes.forEach((f,i)=>{
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type=melody.wave; o.frequency.value=f;
      o.connect(g); g.connect(ctx.destination);
      const t0 = ctx.currentTime + i*melody.step;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.09, t0+0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+1.1);
      o.start(t0); o.stop(t0+1.2);
    });
  }catch(e){}
}

/* ====================== A11Y HELPER ====================== */

// Общий обработчик для div-based "кнопок" (chip, swatch, bg-chip и т.п.):
// активирует элемент по Enter/Space так же, как клик мышью, и не даёт
// странице проскроллиться от пробела. Используется вместе с
// tabindex="0" role="button" на самом элементе.
function activateOnKey(event){
  if(event.key==='Enter' || event.key===' '){
    event.preventDefault();
    event.currentTarget.click();
  }
}
window.activateOnKey = activateOnKey;

/* ====================== RENDER: CREATOR ====================== */

function occasionById(id){ return OCCASIONS.find(o=>o.id===id) || OCCASIONS[0]; }

function renderCreator(){
  setPageTitle(t('Собрать открытку'));
  setMeta(`${BRAND} — ${t('соберите открытку с букетом')}`, siteDescription());
  const occ = occasionById(state.occasion);
  document.getElementById('app').innerHTML = `
  ${topbarHtml()}
  <div class="wrap">
    <div class="hero">
      <div>
        <h1>${t('Соберите букет и оставьте послание, которое захочется сохранить')}</h1>
        <p>${t('Выберите повод, соберите цветы, добавьте пару строк — и отправьте одной ссылкой. Открывается как настоящая открытка: с разворотом и цветением.')}</p>
      </div>
      <div class="hero-stamp">${tr(occ.stamp)}</div>
    </div>

    <div class="builder">
      <div class="col-form">

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">01</span>
            <div><div class="panel-title">${t('Повод')}</div><div class="panel-sub">${t('задаёт тон открытки')}</div></div>
          </div>
          <div class="chip-row" id="occasionChips" role="group" aria-label="${t('Повод')}"></div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">02</span>
            <div><div class="panel-title">${t('Букет')}</div><div class="panel-sub">${t('форма вазы, цветы, лента')}</div></div>
          </div>
          <span class="field-label" id="vaseLabel">${t('Ваза')}</span>
          <div class="vase-row" id="vaseChips" role="group" aria-labelledby="vaseLabel" style="margin-bottom:20px;"></div>
          <span class="field-label" id="flowersLabel">${t('Цветы')}</span>
          <div class="flower-summary" id="flowerSummaryBox">${flowerSummaryHtml()}</div>
          <div class="flower-modal-backdrop ${flowerPickerOpen?'show':''}" id="flowerModalBackdrop" onclick="if(event.target===this) closeFlowerPicker()">
            <div class="flower-modal" role="dialog" aria-modal="true" aria-labelledby="flowerModalTitle">
              <div class="flower-modal-head">
                <div class="flower-modal-head-icon">${plusIconSvg()}</div>
                <div class="flower-modal-head-text">
                  <span class="field-label" id="flowerModalTitle" style="margin-bottom:2px;">${t('Добавьте цветы в букет')}</span>
                  <span class="hint">${t('отметьте нужные, выберите цвет и количество')}</span>
                </div>
                <button type="button" class="flower-modal-close" onclick="closeFlowerPicker()" aria-label="${t('Закрыть')}">✕</button>
              </div>
              <div class="flower-row" id="flowerRows" role="group" aria-labelledby="flowersLabel"></div>
              <button type="button" class="btn btn-primary" onclick="closeFlowerPicker()">${t('Готово')}</button>
            </div>
          </div>
          <span class="field-label" id="ribbonLabel" style="margin-top:18px;">${t('Лента')}</span>
          <div class="swatches" id="ribbonSwatches" role="group" aria-labelledby="ribbonLabel"></div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">03</span>
            <div><div class="panel-title">${t('Послание')}</div><div class="panel-sub">${t('кому и что хотите сказать')}</div></div>
          </div>
          <div class="row2" style="margin-bottom:12px;">
            <input type="text" id="toInput" placeholder="${t('Имя получателя')}" aria-label="${t('Имя получателя')}" maxlength="30" value="${esc(state.to)}">
            <input type="text" id="fromInput" placeholder="${t('Ваше имя')}" aria-label="${t('Ваше имя')}" maxlength="30" value="${esc(state.from)}">
          </div>
          <label for="msgInput" class="sr-only">${t('Текст пожелания')}</label>
          <textarea id="msgInput" maxlength="400" placeholder="${tr(occ.placeholder)}">${esc(state.message)}</textarea>
          <div class="char-count" id="charCount">${state.message.length}/400</div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">04</span>
            <div><div class="panel-title">${t('Дополнительно')}</div><div class="panel-sub">${t('необязательные штрихи')}</div></div>
          </div>
          <div class="toggle-line">
            <div>
              <div style="font-size:14px;" id="musicLabel">${t('Нежная мелодия при открытии')}</div>
              <div style="font-size:12px;opacity:.6;">${t('Короткий сгенерированный перезвон, без сторонних файлов')}</div>
            </div>
            <div class="switch ${state.music?'on':''}" id="musicSwitch" tabindex="0" role="switch" aria-checked="${state.music}" aria-labelledby="musicLabel" onclick="toggleMusic()" onkeydown="activateOnKey(event)"><div class="dot"></div></div>
          </div>
          <div class="sub-inline ${state.music?'show':''}" id="melodyInline">
            <span class="field-label" id="melodyLabel">${t('Мелодия')} <span class="hint">${t('нажмите, чтобы прослушать')}</span></span>
            <div class="chip-row" id="melodyChips" role="group" aria-labelledby="melodyLabel"></div>
          </div>
          <div class="toggle-line">
            <div>
              <div style="font-size:14px;" id="revealLabel">${t('Открыть в определённый момент')}</div>
              <div style="font-size:12px;opacity:.6;">${t('До этого времени получатель увидит только конверт')}</div>
            </div>
            <div class="switch ${state.revealEnabled?'on':''}" id="revealSwitch" tabindex="0" role="switch" aria-checked="${state.revealEnabled}" aria-labelledby="revealLabel" onclick="toggleReveal()" onkeydown="activateOnKey(event)"><div class="dot"></div></div>
          </div>
          <div class="date-inline ${state.revealEnabled?'show':''}" id="dateInline">
            <div class="row2">
              <label for="revealDate" class="sr-only">${t('Дата открытия')}</label>
              <input type="date" id="revealDate" value="${state.revealDate}">
              <label for="revealTime" class="sr-only">${t('Время открытия')}</label>
              <input type="time" id="revealTime" value="${state.revealTime}">
            </div>
          </div>
        </div>

        <div class="cta-row">
          <button class="btn btn-primary" onclick="saveAndShare()">${t('Создать ссылку')}</button>
          <button class="btn btn-ghost" onclick="randomizeBouquet()" style="display:inline-flex;align-items:center;gap:7px;">${diceIconSvg()}${t('Собрать наугад')}</button>
        </div>
      </div>

      <div class="col-preview">
        <div class="preview-stage ${BACKGROUNDS.find(b=>b.id===state.background).dark?'stage-dark':''}" id="previewStage" style="background:${BACKGROUNDS.find(b=>b.id===state.background).css}">
          <div class="preview-card">
            <div class="preview-occasion-band" id="pvBand" style="background:${occ.color}">${tr(occ.stamp)}</div>
            <div class="preview-bouquet" id="pvBouquet"></div>
            <div class="preview-msg">
              <div class="to" id="pvTo"></div>
              <div class="text" id="pvText">${esc(state.message)||`<span style=\"opacity:.4\">${t('Текст пожелания появится здесь…')}</span>`}</div>
              <div class="from" id="pvFrom"></div>
            </div>
          </div>
          <button class="pv-replay" onclick="replayPreview()">${t('↻ Показать анимацию открытия')}</button>
          <div class="preview-note">${t('Живой предпросмотр открытки. Получатель увидит анимацию раскрытия.')}</div>

          <div class="scene-picker">
            <span class="field-label" id="bgLabel">${t('Фон сцены')} <span class="hint">${t('получатель увидит такой же')}</span></span>
            <div class="bg-row" id="bgChips" role="group" aria-labelledby="bgLabel"></div>
          </div>

          <div class="envelope-picker">
            <span class="field-label" id="envLabel">${t('Конверт')}</span>
            <div class="envelope-row" id="envelopeChips" role="group" aria-labelledby="envLabel"></div>
          </div>
        </div>
      </div>
    </div>
    ${adSlotHtml('adSlotBottom')}
  </div>
  <footer class="site-footer">${footerHtml()}</footer>
  `;

  document.getElementById('occasionChips').innerHTML = OCCASIONS.map(o =>
    `<div class="chip ${state.occasion===o.id?'active':''}" tabindex="0" role="button" aria-pressed="${state.occasion===o.id}" onclick="setOccasion('${o.id}')" onkeydown="activateOnKey(event)">
      <span class="chip-ic">${occasionIconSvg(o.id, state.occasion===o.id ? '#FAF3E7' : o.color)}</span>${tr(o.label)}
    </div>`
  ).join('');

  document.getElementById('vaseChips').innerHTML = VASES.map(v =>
    `<div class="vase-chip ${state.vase===v.id?'active':''}" tabindex="0" role="button" aria-pressed="${state.vase===v.id}" aria-label="${tr(v.label)}" onclick="setVase('${v.id}')" onkeydown="activateOnKey(event)">
      ${vaseThumbSvg(v.id)}<span>${tr(v.label)}</span>
    </div>`
  ).join('');

  document.getElementById('flowerRows').innerHTML = flowerRowsHtml();

  document.getElementById('ribbonSwatches').innerHTML = RIBBONS.map((c,i)=>
    `<div class="swatch ${state.ribbon===c?'sel':''}" style="background:${c}" tabindex="0" role="button" aria-label="${t('Цвет')} ${t('Лента').toLowerCase()} №${i+1}" aria-pressed="${state.ribbon===c}" onclick="setRibbon('${c}')" onkeydown="activateOnKey(event)"></div>`
  ).join('');

  document.getElementById('bgChips').innerHTML = BACKGROUNDS.map(b=>
    `<div class="bg-chip ${state.background===b.id?'active':''}" style="background:${b.css}" tabindex="0" role="button" aria-label="${t('Фон сцены')}: ${tr(b.label)}" aria-pressed="${state.background===b.id}" onclick="setBackground('${b.id}')" onkeydown="activateOnKey(event)"></div>`
  ).join('');

  document.getElementById('envelopeChips').innerHTML = ENVELOPES.map(en=>
    `<div class="envelope-chip ${state.envelope===en.id?'active':''}" tabindex="0" role="button" aria-pressed="${state.envelope===en.id}" aria-label="${tr(en.label)}" onclick="setEnvelope('${en.id}')" onkeydown="activateOnKey(event)">
      ${envelopeSvg(occ.color, en.id, 44, 32)}
      <span>${tr(en.label)}</span>
    </div>`
  ).join('');

  document.getElementById('melodyChips').innerHTML = MELODIES.map(m =>
    `<div class="chip ${state.melody===m.id?'active':''}" tabindex="0" role="button" aria-pressed="${state.melody===m.id}" onclick="setMelody('${m.id}')" onkeydown="activateOnKey(event)">${tr(m.label)}</div>`
  ).join('');

  document.getElementById('toInput').oninput = e=>{ state.to=e.target.value; updatePreviewText(); };
  document.getElementById('fromInput').oninput = e=>{ state.from=e.target.value; updatePreviewText(); };
  document.getElementById('msgInput').oninput = e=>{
    state.message=e.target.value; updatePreviewText();
    const cc = document.getElementById('charCount');
    cc.textContent = state.message.length+'/400';
    cc.classList.toggle('warn', state.message.length>360);
  };
  const rd = document.getElementById('revealDate'); if(rd) rd.onchange = e=>{ state.revealDate = e.target.value; };
  const rt = document.getElementById('revealTime'); if(rt) rt.onchange = e=>{ state.revealTime = e.target.value; };

  renderPreviewBouquet();
  updatePreviewText();
}

function leafIcon(){
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right:2px;" aria-hidden="true"><path d="M4 20C4 12 9 4 20 4C20 15 12 20 4 20Z" fill="#8CA087" stroke="#5C7457" stroke-width="1"/><path d="M4 20C8 15 12 11 18 6" stroke="#5C7457" stroke-width="1"/></svg>`;
}

// Общий топбар для всех "внутренних" страниц (конструктор, мои открытки,
// аккаунт, юридические страницы) — держит навигацию и состояние входа
// в одном месте, чтобы не дублировать разметку по страницам.
function topbarHtml(){
  return `<div class="topbar">
    <div class="brand" tabindex="0" role="link" onclick="goHome()" onkeydown="activateOnKey(event)" style="cursor:pointer;">${leafIcon()}${BRAND}</div>
    <div class="topbar-actions">
      <div class="lang-switch" role="group" aria-label="Language / Язык">
        <button class="lang-btn ${uiLang==='ru'?'active':''}" aria-pressed="${uiLang==='ru'}" onclick="setLang('ru')">RU</button>
        <button class="lang-btn ${uiLang==='en'?'active':''}" aria-pressed="${uiLang==='en'}" onclick="setLang('en')">EN</button>
      </div>
      <a class="topbar-link" href="#mine">${t('Мои открытки')}</a>
      ${session.user
        ? `<button onclick="location.hash='account'">${esc(session.user.name || session.user.email.split('@')[0])}</button>`
        : `<button onclick="location.hash='login'">${t('Войти')}</button>`}
    </div>
  </div>`;
}
function footerHtml(){
  return `${BRAND} — ${t('соберите открытку за пару минут и отправьте ссылкой')} · <a href="#privacy">${t('Конфиденциальность')}</a> · <a href="#terms">${t('Условия использования')}</a>`;
}

// Место под рекламные баннеры (Google AdSense / Яндекс.Директ). Сейчас — просто
// подписанная заглушка; чтобы подключить реальный AdSense, нужно:
//  1) добавить в index.html скрипт вида
//     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
//  2) заменить содержимое #adSlotBody на реальный <ins class="adsbygoogle">...</ins> и вызвать (adsbygoogle = window.adsbygoogle || []).push({})
//  3) разрешить домены AdSense в CSP (server/index.js: scriptSrc/frameSrc/connectSrc) — сейчас там только свой домен и cdnjs.
// Без пункта 1 у вас не будет ни publisher ID, ни одобренного AdSense-аккаунта — это нужно завести самостоятельно.
function adSlotHtml(id){
  return `<div class="ad-slot" aria-label="${t('Рекламный блок')}">
    <div class="ad-slot-label">${t('Реклама')}</div>
    <div class="ad-slot-body" id="${id}">${t('Место для рекламного баннера')}</div>
  </div>`;
}

const OCCASION_ICON = {birthday:'cake',foryou:'you', love:'heart', thanks:'gift', congrats:'star', sorry:'feather', justbecause:'sprout'};
function occasionIconSvg(id, color){
  const name = OCCASION_ICON[id];
  const paths = {
    
    cake:`<path d="M2 9 Q8 6.2 14 9" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round"/><rect x="2" y="9" width="12" height="5" rx="1" fill="none" stroke="${color}" stroke-width="1.3"/><line x1="8" y1="6" x2="8" y2="2.5" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="1.6" r="1" fill="${color}"/>`,
    heart:`<path d="M8 13.4C3 10 1.5 6.6 3.4 4.4C5 2.5 8 3.3 8 6C8 3.3 11 2.5 12.6 4.4C14.5 6.6 13 10 8 13.4Z" fill="${color}"/>`,
    gift:`<rect x="2.2" y="6.5" width="11.6" height="7" rx=".5" fill="none" stroke="${color}" stroke-width="1.2"/><line x1="2.2" y1="9.2" x2="13.8" y2="9.2" stroke="${color}" stroke-width="1.1"/><line x1="8" y1="6.5" x2="8" y2="13.5" stroke="${color}" stroke-width="1.1"/><path d="M8 6.5C6.3 6.5 5.4 4.8 6.3 3.8C7.2 3.2 8 4.6 8 6.5C8 4.6 8.8 3.2 9.7 3.8C10.6 4.8 9.7 6.5 8 6.5Z" fill="none" stroke="${color}" stroke-width="1.1"/>`,
    star:`<path d="M8 1.4L9.3 6.1L14 6.4L10.3 9.2L11.6 13.8L8 11L4.4 13.8L5.7 9.2L2 6.4L6.7 6.1Z" fill="${color}"/>`,
    you:`<circle cx="8" cy="4.2" r="2.3" fill="${color}"/><path d="M8 6.8C5.2 6.8 3.5 9 3.8 12.5L4.6 15L11.4 15L12.2 12.5C12.5 9 10.8 6.8 8 6.8Z" fill="${color}"/>`,
    feather:`<path d="M13 2.2C9.4 3 5.6 6.6 3.4 12.6M13 2.2C11.2 5 9.4 6.8 6.6 8.6M13 2.2C10.4 4 8.4 5 5.6 5.8" fill="none" stroke="${color}" stroke-width="1.1" stroke-linecap="round"/>`,
    sprout:`<circle cx="8" cy="8" r="1.6" fill="#B98A4A"/>${[0,60,120,180,240,300].map(a=>`<ellipse cx="${8+Math.cos(a*Math.PI/180)*4.2}" cy="${8+Math.sin(a*Math.PI/180)*4.2}" rx="2.6" ry="1.7" fill="${color}" transform="rotate(${a} ${8+Math.cos(a*Math.PI/180)*4.2} ${8+Math.sin(a*Math.PI/180)*4.2})"/>`).join('')}`
  };
  return `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">${paths[name]}</svg>`;
}
function plusIconSvg(){
  return `<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2V14M2 8H14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
}
function editIconSvg(){
  return `<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5L13.5 4.5L5 13L2 14L3 11L11.5 2.5Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
}
function diceIconSvg(){
  return `<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="5" r="1.1" fill="currentColor"/><circle cx="11" cy="5" r="1.1" fill="currentColor"/><circle cx="8" cy="8" r="1.1" fill="currentColor"/><circle cx="5" cy="11" r="1.1" fill="currentColor"/><circle cx="11" cy="11" r="1.1" fill="currentColor"/></svg>`;
}

function vaseThumbSvg(type){
  if(type==='A') return `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true"><path d="M6 6C4 18 6 32 17 32C28 32 30 18 28 6L23 3L11 3Z" fill="#C97B5A" stroke="#9B5738" stroke-width="1"/><ellipse cx="17" cy="6" rx="6" ry="1.6" fill="#E3A583"/></svg>`;
  if(type==='B') return `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true"><path d="M10 3L8 32L26 32L24 3Z" fill="#EDE7DA" opacity=".55" stroke="#B9AF9B" stroke-width="1"/><ellipse cx="17" cy="3" rx="7" ry="1.6" fill="#F5F1E6" stroke="#B9AF9B" stroke-width=".8"/></svg>`;
  if(type==='D') return `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true"><path d="M8 8L6 32L28 32L26 8Z" fill="#EDEBE4" stroke="#B7B2A6" stroke-width="1"/><path d="M10 14Q17 20 20 28" stroke="#C9C2B4" stroke-width="1" fill="none"/><ellipse cx="17" cy="8" rx="9" ry="1.8" fill="#F5F3ED" stroke="#B7B2A6" stroke-width="1"/></svg>`;
  return `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true"><rect x="6" y="9" width="22" height="23" rx="3" fill="#DCC9A3" stroke="#B39B6D" stroke-width="1"/><rect x="5" y="4" width="24" height="7" rx="2" fill="#EAD9B0" stroke="#B39B6D" stroke-width="1"/></svg>`;
}

function flowerThumbSvg(type, color){
  return `<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">${flowerHead(type, 23, 24, color, 0, 1)}</svg>`;
}

function renderPreviewBouquet(){
  document.getElementById('pvBouquet').innerHTML = buildBouquetSVG(state, 300);
}
function updatePreviewText(){
  const occ = occasionById(state.occasion);
  document.getElementById('pvTo').textContent = state.to ? `${t('Для')} ${state.to}` : '';
  document.getElementById('pvText').innerHTML = esc(state.message) || `<span style="opacity:.4">${t('Текст пожелания появится здесь…')}</span>`;
  document.getElementById('pvFrom').textContent = state.from ? `— ${state.from}` : '';
  document.getElementById('pvBand').style.background = occ.color;
  document.getElementById('pvBand').textContent = tr(occ.stamp);
}

function setOccasion(id){ state.occasion=id; renderCreator(); }
function setVase(id){
  state.vase=id; renderPreviewBouquet();
  document.querySelectorAll('#vaseChips .vase-chip').forEach(c=>{c.classList.remove('active'); c.setAttribute('aria-pressed','false');});
  const el = event.currentTarget.closest('.vase-chip');
  el.classList.add('active'); el.setAttribute('aria-pressed','true');
}
function setRibbon(c){
  state.ribbon=c; renderPreviewBouquet();
  document.querySelectorAll('#ribbonSwatches .swatch').forEach(s=>{s.classList.remove('sel'); s.setAttribute('aria-pressed','false');});
  event.currentTarget.classList.add('sel'); event.currentTarget.setAttribute('aria-pressed','true');
}
function setBackground(id){
  state.background = id;
  const bg = BACKGROUNDS.find(b=>b.id===id);
  const stage = document.getElementById('previewStage');
  stage.style.background = bg.css;
  stage.classList.toggle('stage-dark', !!bg.dark);
  document.querySelectorAll('#bgChips .bg-chip').forEach(c=>{c.classList.remove('active'); c.setAttribute('aria-pressed','false');});
  event.currentTarget.classList.add('active'); event.currentTarget.setAttribute('aria-pressed','true');
}
function setEnvelope(id){ state.envelope = id; renderCreator(); }
function openFlowerPicker(){ flowerPickerOpen = true; renderCreator(); }
function closeFlowerPicker(){ flowerPickerOpen = false; renderCreator(); }

// Разметка списка цветов внутри окошка и сводки-кнопки снаружи — вынесены в
// отдельные функции, чтобы toggleFlower/setFlowerColor/stepFlower могли
// точечно обновлять только эти два узла (см. ниже), а не весь renderCreator().
// Раньше выбор цветка внутри уже открытого окошка перерисовывал вообще всю
// страницу — окошко пересоздавалось заново и его css-анимация появления
// проигрывалась повторно, из-за чего оно заметно "мигало" при каждом клике.
function flowerRowsHtml(){
  return FLOWER_TYPES.map(f=>{
    const sel = state.flowers[f.id];
    const on = !!sel;
    const color = sel ? sel.color : f.colors[0];
    const count = sel ? sel.count : 3;
    const label = tr(f.label);
    return `<div class="flower-item ${on?'on':''}" id="fi-${f.id}">
      <div class="fi-thumb" tabindex="0" role="button" aria-pressed="${on}" aria-label="${(on?t('Убрать'):t('Добавить'))+' '+label.toLowerCase()}" onclick="toggleFlower('${f.id}')" onkeydown="activateOnKey(event)">
        ${flowerThumbSvg(f.id, color)}
        ${on?'<div class="fi-badge">✓</div>':''}
      </div>
      <div class="fi-body">
        <div class="fi-name" tabindex="0" role="button" aria-pressed="${on}" onclick="toggleFlower('${f.id}')" onkeydown="activateOnKey(event)">${label}</div>
        <div class="swatches">${f.colors.map((c,i)=>`<div class="swatch ${on&&color===c?'sel':''}" style="background:${c}" tabindex="0" role="button" aria-label="${t('Цвет')} ${label.toLowerCase()} №${i+1}" aria-pressed="${on&&color===c}" onclick="setFlowerColor('${f.id}','${c}')" onkeydown="activateOnKey(event)"></div>`).join('')}</div>
      </div>
      <div class="stepper">
        <button aria-label="${t('Меньше')} ${label.toLowerCase()}" onclick="stepFlower('${f.id}',-1)">−</button>
        <span aria-live="polite">${count}</span>
        <button aria-label="${t('Больше')} ${label.toLowerCase()}" onclick="stepFlower('${f.id}',1)">+</button>
      </div>
    </div>`;
  }).join('');
}
function flowerSummaryHtml(){
  const chosen = Object.keys(state.flowers).length;
  const dots = chosen
    ? FLOWER_TYPES.filter(f=>state.flowers[f.id]).map(f=>
        `<span class="flower-summary-dot" style="background:${state.flowers[f.id].color}" title="${tr(f.label)} ×${state.flowers[f.id].count}"></span>`
      ).join('')
    : `<span class="flower-summary-empty">${t('Цветы ещё не добавлены')}</span>`;
  return `${dots}
    <button type="button" class="flower-pick-btn" onclick="openFlowerPicker()">
      <span class="flower-pick-btn-icon">${chosen ? editIconSvg() : plusIconSvg()}</span>
      ${chosen ? t('Изменить цветы') : t('Добавить цветы')}
    </button>`;
}
function renderFlowerRows(){
  const el = document.getElementById('flowerRows');
  if(el) el.innerHTML = flowerRowsHtml();
}
function renderFlowerSummary(){
  const el = document.getElementById('flowerSummaryBox');
  if(el) el.innerHTML = flowerSummaryHtml();
}

function toggleFlower(id){
  if(state.flowers[id]) delete state.flowers[id];
  else { const f=FLOWER_TYPES.find(x=>x.id===id); state.flowers[id]={color:f.colors[0], count:3}; }
  renderFlowerRows(); renderFlowerSummary(); renderPreviewBouquet();
}
function setFlowerColor(id,c){
  if(!state.flowers[id]) return;
  state.flowers[id].color=c;
  renderFlowerRows(); renderFlowerSummary(); renderPreviewBouquet();
}
function stepFlower(id, d){
  if(!state.flowers[id]) return;
  const v = state.flowers[id].count + d;
  state.flowers[id].count = Math.max(0, Math.min(8, v));
  if(state.flowers[id].count===0) delete state.flowers[id];
  renderFlowerRows(); renderFlowerSummary(); renderPreviewBouquet();
}
function toggleMusic(){
  state.music=!state.music;
  const el = document.getElementById('musicSwitch');
  el.classList.toggle('on'); el.setAttribute('aria-checked', state.music);
  document.getElementById('melodyInline').classList.toggle('show');
}
function setMelody(id){
  state.melody = id;
  document.querySelectorAll('#melodyChips .chip').forEach(c=>{c.classList.remove('active'); c.setAttribute('aria-pressed','false');});
  event.currentTarget.classList.add('active'); event.currentTarget.setAttribute('aria-pressed','true');
  playChime(id); // сразу даём услышать выбранную мелодию
}
function toggleReveal(){
  state.revealEnabled=!state.revealEnabled;
  const el = document.getElementById('revealSwitch');
  el.classList.toggle('on'); el.setAttribute('aria-checked', state.revealEnabled);
  document.getElementById('dateInline').classList.toggle('show');
}

function randomizeBouquet(){
  state.vase = VASES[Math.floor(Math.random()*VASES.length)].id;
  state.ribbon = RIBBONS[Math.floor(Math.random()*RIBBONS.length)];
  state.flowers = {};
  const shuffled = [...FLOWER_TYPES].sort(()=>Math.random()-.5);
  const pickCount = 2 + Math.floor(Math.random()*2); // 2-3 types
  shuffled.slice(0, pickCount).forEach(f=>{
    const c = f.colors[Math.floor(Math.random()*f.colors.length)];
    state.flowers[f.id] = {color:c, count: 2+Math.floor(Math.random()*3)};
  });
  if(!Object.keys(state.flowers).length){
    state.flowers.rose = {color:FLOWER_TYPES[0].colors[0], count:3};
  }
  renderCreator();
  showToast(t('Собрали для вас новый вариант'));
}

function replayPreview(){
  const el = document.getElementById('pvBouquet');
  el.classList.remove('pv-bloom');
  void el.offsetWidth;
  el.classList.add('pv-bloom');
}

/* ====================== SAVE + SHARE (без сервера — данные лежат прямо в ссылке) ====================== */

async function saveAndShare(){
  if(!state.message.trim()){
    showToast(t('Добавьте текст пожелания'));
    return;
  }
  const payload = {
    occasion: state.occasion, vase: state.vase, ribbon: state.ribbon,
    flowers: state.flowers, message: state.message, from: state.from, to: state.to,
    music: state.music, melody: state.melody,
    envelope: state.envelope, background: state.background,
    reveal: state.revealEnabled ? (state.revealDate ? (state.revealDate+'T'+(state.revealTime||'00:00')) : null) : null,
    createdAt: Date.now()
  };

  let encoded;
  try{
    encoded = encodeCardData(payload);
  }catch(e){
    showToast(t('Не удалось создать ссылку, попробуйте ещё раз'));
    return;
  }

  // ?data= (query-строка), а не #data= (хэш) — хэш никогда не уходит на сервер,
  // поэтому боты мессенджеров (WhatsApp/Telegram и т.д.) не могли увидеть
  // персональный og:title/og:description при вставке ссылки. Сама открытка
  // при этом всё ещё целиком лежит в самой ссылке — сервер её не обязан хранить.
  const longUrl = location.origin + location.pathname + '?data=' + encoded;

  if(session.user){
    // Вошли в аккаунт — открытка сохраняется на сервере (доступна с любого
    // устройства), и это же даёт короткую ссылку /c/<id> вместо длинной
    // "?data=..." — сервер уже хранит открытку, отдавать ту же копию в самой
    // ссылке смысла нет. У гостей сервер открытку не видит и не хранит,
    // поэтому для них ссылка остаётся длинной (см. ветку else ниже).
    try{
      const res = await fetch('/api/cards', {
        method: 'POST', headers: {'Content-Type':'application/json', 'X-Lang':uiLang},
        body: JSON.stringify({ encodedData: encoded, occasion: state.occasion, to: state.to, from: state.from })
      });
      if(res.ok){
        const json = await res.json();
        if(json.card && json.card.shortId){
          renderShareScreen(location.origin + '/c/' + json.card.shortId);
          return;
        }
      } else if(res.status === 403){
        // Лимит открыток на аккаунт — не тихий фолбэк на длинную ссылку
        // (это выглядело бы как "сохранилось", хотя на деле нет), а явное
        // сообщение с подсказкой удалить старую открытку.
        const json = await res.json().catch(() => ({}));
        showToast(json.error || t('Достигнут лимит открыток'));
        return;
      }
    }catch(e){ /* сеть недоступна — используем длинную ссылку как запасной вариант */ }
    renderShareScreen(longUrl);
    return;
  }

  // гость — "Мои открытки" храним локально в этом браузере (localStorage)
  try{
    let list = [];
    try{ list = JSON.parse(localStorage.getItem('my-cards') || '[]'); }catch(e){ list = []; }
    list.unshift({ id: uid(), occasion: state.occasion, to: state.to, createdAt: payload.createdAt, data: encoded });
    localStorage.setItem('my-cards', JSON.stringify(list.slice(0,50)));
  }catch(e){ /* не критично, если локальное хранилище недоступно */ }

  renderShareScreen(longUrl);
}

function renderShareScreen(url){
  setPageTitle(t('Открытка готова'));
  const isLong = url.length > LINK_WARN_LENGTH;
  const isShortLink = /\/c\/[A-Za-z0-9]+$/.test(url);
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="share-wrap">
      <div class="eyebrow">${t('готово')}</div>
      <h1 style="font-size:30px;margin-top:8px;">${t('Открытка собрана')}</h1>
      <p style="opacity:.75;margin-top:10px;">${t('Отправьте эту ссылку — она откроется как раскрывающаяся открытка с вашим букетом.')}</p>
      <div class="link-box">
        <label for="shareUrl" class="sr-only">${t('Ссылка на открытку')}</label>
        <input type="text" id="shareUrl" readonly value="${url}">
        <button class="btn btn-primary" style="padding:9px 16px;" onclick="copyLink()">${t('Копировать')}</button>
      </div>
      ${isLong ? `<div class="link-warn">${t('Ссылка получилась длинной')} (${url.length} ${t('симв.')}) — ${t('некоторые мессенджеры или SMS могут обрезать её. Если получатель не сможет открыть, попробуйте отправить QR-код ниже или сократить текст пожелания.')}</div>` : ''}
      ${shareChannelsHtml(url)}
      <div class="qr-box" id="qrBox">
        <div id="qrcode"></div>
        <div class="qr-label">${t('Отсканируйте с телефона')}</div>
      </div>
      <div class="cta-row" style="justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-ghost" onclick="openView('${url}')">${t('Предпросмотреть')}</button>
        <button class="btn btn-ghost" id="shareBtn" onclick="shareLink('${url}')">${t('Поделиться')}</button>
        <button class="btn btn-ghost" onclick="renderCreator()">${t('Редактировать')}</button>
        <button class="btn btn-ghost" onclick="location.href=location.pathname">${t('Создать ещё одну')}</button>
      </div>
      <p style="font-size:12.5px;opacity:.5;margin-top:30px;">${isShortLink ? t('Это короткая ссылка: сама открытка хранится на сервере в вашем аккаунте, а ссылка лишь указывает на неё.') : t('Ссылка полностью самодостаточна: вся открытка «зашита» в неё, отдельный сервер для её открытия не нужен.')}${session.user ? ' '+t('Копия также сохранена в разделе «Мои открытки» вашего аккаунта.') : ' '+t('Войдите в аккаунт, чтобы копия сохранялась и не терялась при очистке браузера.')}</p>
    </div>
  `;
  try{
    if(window.QRCode){
      // typeNumber:0 — библиотека сама подбирает минимальную версию QR под
      // длину ссылки (по умолчанию она фиксирована и мала, а гостевые ссылки
      // могут быть по 500-1500+ символов — не помещались и давали то ли
      // ошибку, то ли код с тысячами модулей). correctLevel:L — минимальная
      // избыточность, оставляет больше места под сами данные. Размер 220px —
      // без него при таком количестве модулей код физически нечитаем камерой,
      // как бы верно он ни был закодирован.
      new QRCode(document.getElementById('qrcode'), {
        text:url, width:300, height:300,
        colorDark:'#4B2E3D', colorLight:'#FAF3E7',
        typeNumber:0, correctLevel:QRCode.CorrectLevel.L
      });
    } else {
      document.getElementById('qrBox').style.display='none';
    }
  }catch(e){ document.getElementById('qrBox').style.display='none'; }
  if(!navigator.share) document.getElementById('shareBtn').style.display='none';
}
function copyLink(){
  const el = document.getElementById('shareUrl');
  el.select(); el.setSelectionRange(0, 99999);
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(el.value).then(()=>showToast(t('Ссылка скопирована'))).catch(()=>fallbackCopy());
  } else {
    fallbackCopy();
  }
  function fallbackCopy(){
    try{ document.execCommand('copy'); showToast(t('Ссылка скопирована')); }
    catch(e){ showToast(t('Скопируйте ссылку вручную')); }
  }
}
function shareLink(url){
  if(navigator.share){
    navigator.share({title: BRAND, text: t('Вам открытка с букетом 🌿'), url}).catch(()=>{});
  }
}

// Прямые ссылки в конкретные мессенджеры — обычный Web Share API (кнопка
// "Поделиться" выше) на десктопе часто просто недоступен, а получатели
// в основном ждут именно WhatsApp/Telegram/VK, а не системный шеринг-лист.
function shareChannelsHtml(url){
  const text = t('Вам открытка с букетом 🌿');
  const wa = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url);
  const tg = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
  const vk = 'https://vk.com/share.php?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(text);
  return `<div class="share-channels">
    <a class="share-channel-btn wa" href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <a class="share-channel-btn tg" href="${tg}" target="_blank" rel="noopener noreferrer">Telegram</a>
    <a class="share-channel-btn vk" href="${vk}" target="_blank" rel="noopener noreferrer">${uiLang==='ru'?'ВКонтакте':'VK'}</a>
  </div>`;
}
function openView(url){
  const data = new URL(url).searchParams.get('data');
  if(data) openCardLink(data);
}

/* ====================== VIEWER ====================== */

function renderCardNotFound(){
  setPageTitle(t('Открытка не найдена'));
  document.getElementById('app').innerHTML = `<div class="view-stage"><div style="text-align:center;">
    <div class="eyebrow">${t('не найдено')}</div>
    <h1 style="font-size:24px;margin-top:8px;">${t('Эта открытка недоступна')}</h1>
    <p style="opacity:.7;margin-top:8px;">${t('Ссылка повреждена или указана неверно.')}</p>
    <button class="btn btn-primary" style="margin-top:20px;" onclick="goHome();">${t('Создать свою')}</button>
  </div></div>`;
}

// Короткая ссылка (/c/AbC123) — открытка хранится на сервере (сохранялась
// с аккаунта), тут просто вытягиваем её encodedData и рендерим тем же
// renderViewer, что и обычную "?data="-ссылку.
async function renderShortViewer(shortId){
  try{
    const res = await fetch('/api/share/' + encodeURIComponent(shortId));
    if(!res.ok) throw new Error('not found');
    const json = await res.json();
    renderViewer(json.encodedData);
  }catch(e){
    renderCardNotFound();
  }
}

function renderViewer(encodedData){
  let rawData;
  try{
    rawData = decodeCardData(encodedData);
  }catch(e){
    renderCardNotFound();
    return;
  }

  // Ссылку могли обрезать, отредактировать вручную или прислать из другой,
  // более старой/новой версии сайта — sanitizeCardData подставляет безопасные
  // значения по умолчанию для всего, что не проходит проверку, вместо падения.
  const data = sanitizeCardData(rawData);

  const occ = occasionById(data.occasion);
  setPageTitle(data.to ? `${t('Открытка для')} ${data.to}` : t('Открытка'));
  setMeta(`${t('Вам открытка от')} ${data.from || t('кого-то особенного')} 🌿`, `${tr(occ.stamp)}. ${t('Нажмите, чтобы открыть букет и пожелание.')}`);

  const now = Date.now();
  const locked = data.reveal && new Date(data.reveal).getTime() > now;
  const dateLocale = uiLang === 'ru' ? 'ru-RU' : 'en-US';

  if(locked){
    const bgLock = BACKGROUNDS.find(b=>b.id===data.background) || BACKGROUNDS[0];
    const d = new Date(data.reveal);
    document.getElementById('app').innerHTML = `<div class="view-stage ${bgLock.dark?'stage-dark':''}" style="background:${bgLock.css}"><div class="lock-screen">
      <div class="eyebrow">${t('эта открытка ждёт своего момента')}</div>
      <h1 style="font-size:24px;margin-top:10px;">${t('Откроется')} ${d.toLocaleDateString(dateLocale,{day:'numeric',month:'long'})} ${t('в')} ${d.toLocaleTimeString(dateLocale,{hour:'2-digit',minute:'2-digit'})}</h1>
      <p class="num" style="margin-top:14px;">${t('Загляните сюда чуть позже — и получите свой букет')}</p>
    </div></div>`;
    return;
  }

  const bg = BACKGROUNDS.find(b=>b.id===data.background) || BACKGROUNDS[0];
  document.getElementById('app').innerHTML = `
    <div class="view-stage ${bg.dark?'stage-dark':''}" style="background:${bg.css}">
      <div class="view-card">
        <button class="view-envelope" id="envelope" onclick="openCard(${data.music?'true':'false'}, '${data.occasion}', '${data.melody}')" aria-label="${t('Открыть открытку')}">
          ${envelopeSvg(occ.color, data.envelope)}
          <div class="view-open-hint">${t('Нажмите, чтобы открыть')}</div>
        </button>
        <div class="view-content" id="viewContent">
          <div class="view-occasion-band" style="background:${occ.color}">${tr(occ.stamp)}</div>
          <div class="view-bouquet-wrap" id="viewBouquet">${buildBouquetSVG(data, 300)}</div>
          <div class="view-msg" id="viewMsg">${esc(data.message)}</div>
          <div class="view-from" id="viewFrom">${data.to ? `${t('Для')} ${esc(data.to)}` : ''}${data.to && data.from ? ' · ' : ''}${data.from ? `${t('от')} ${esc(data.from)}` : ''}</div>
          <div class="view-footer">${t('Открытка создана в')} <a href="#" onclick="goHome();return false;">${BRAND}</a> — ${t('соберите свою за пару минут')}</div>
        </div>
      </div>
    </div>
  `;
}

// рельефный "зубчатый" край печати — гладкий круг читался бы как наклейка,
// а такой контур — как настоящий оттиск воска
function waxSealShape(cx, cy, r, fill, dark){
  const teeth = 14;
  let d = '';
  for(let i=0;i<teeth;i++){
    const a1 = (i/teeth)*Math.PI*2, a2 = ((i+0.5)/teeth)*Math.PI*2, a3 = ((i+1)/teeth)*Math.PI*2;
    const x1=cx+Math.cos(a1)*r, y1=cy+Math.sin(a1)*r;
    const x2=cx+Math.cos(a2)*(r+1.8), y2=cy+Math.sin(a2)*(r+1.8);
    const x3=cx+Math.cos(a3)*r, y3=cy+Math.sin(a3)*r;
    d += `${i===0?'M':'L'}${x1.toFixed(1)},${y1.toFixed(1)} Q${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} `;
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${dark}" stroke-width=".8"/>`;
}
// мягкая тень под конвертом — приподнимает его над сценой вместо плоской наклейки
function envelopeShadow(){
  return `<ellipse cx="90" cy="127" rx="76" ry="4.5" fill="#000000" opacity=".1"/>`;
}

function envelopeSvg(color, style, w, h){
  style = style || 'classic';
  w = w || 180; h = h || 130;
  const light = lighten(color, 60);
  const dark = darken(color, 15);

  if(style==='kraft'){
    // тёплая крафтовая бумага — цвет письма не зависит от повода, только тонкая деталь-марка в цвете повода
    const kraft = '#DCC9A3', kraftDark = '#B39B6D';
    return `<svg width="${w}" height="${h}" viewBox="0 0 180 130" style="margin:0 auto;display:block;" aria-hidden="true">
      ${envelopeShadow()}
      <rect x="4" y="14" width="172" height="112" rx="6" fill="${kraft}" stroke="${kraftDark}" stroke-width="1.5"/>
      <path d="M4 16 L90 82 L176 16" fill="none" stroke="${kraftDark}" stroke-width="1.5"/>
      <path d="M4 14 L90 68 L176 14" fill="${kraftDark}" opacity=".22"/>
      <rect x="66" y="70" width="46" height="15" rx="2" fill="${light}" stroke="${color}" stroke-width="1"/>
      <path d="M70 77.5 L108 77.5" stroke="${color}" stroke-width="1" opacity=".5"/>
    </svg>`;
  }
  if(style==='seal'){
    // классический конверт + восковая печать на стыке клапана
    return `<svg width="${w}" height="${h}" viewBox="0 0 180 130" style="margin:0 auto;display:block;" aria-hidden="true">
      ${envelopeShadow()}
      <rect x="4" y="14" width="172" height="112" rx="6" fill="${light}" stroke="${color}" stroke-width="1.5"/>
      <path d="M4 16 L90 82 L176 16" fill="none" stroke="${color}" stroke-width="1.5"/>
      <path d="M4 14 L90 68 L176 14" fill="${color}" opacity=".12"/>
      ${waxSealShape(90, 78, 13, color, dark)}
      <path d="M83 78 Q90 69 97 78 Q90 87 83 78Z" fill="${light}" opacity=".75"/>
    </svg>`;
  }
  if(style==='pattern'){
    // тонкий узор из точек в цвете повода поверх классического конверта
    let dots = '';
    for(let x=16; x<176; x+=17){
      for(let y=26; y<116; y+=17){
        dots += `<circle cx="${x}" cy="${y}" r="1.3" fill="${color}" opacity=".2"/>`;
      }
    }
    return `<svg width="${w}" height="${h}" viewBox="0 0 180 130" style="margin:0 auto;display:block;" aria-hidden="true">
      ${envelopeShadow()}
      <rect x="4" y="14" width="172" height="112" rx="6" fill="${light}" stroke="${color}" stroke-width="1.5"/>
      ${dots}
      <path d="M4 16 L90 82 L176 16" fill="none" stroke="${color}" stroke-width="1.5"/>
      <path d="M4 14 L90 68 L176 14" fill="${color}" opacity=".15"/>
    </svg>`;
  }
  if(style==='gold'){
    // золотой конверт: тёплое золото + восковая печать со звездой вместо цвета повода
    const goldFill = '#EAD9A0', goldDark = '#B98A4A', goldDeep = '#8A6423';
    return `<svg width="${w}" height="${h}" viewBox="0 0 180 130" style="margin:0 auto;display:block;" aria-hidden="true">
      ${envelopeShadow()}
      <rect x="4" y="14" width="172" height="112" rx="6" fill="${goldFill}" stroke="${goldDark}" stroke-width="1.5"/>
      <path d="M4 16 L90 82 L176 16" fill="none" stroke="${goldDark}" stroke-width="1.5"/>
      <path d="M4 14 L90 68 L176 14" fill="${goldDeep}" opacity=".18"/>
      ${waxSealShape(90, 60, 12, goldDark, goldDeep)}
      <path d="M90 52 L92.5 58 L98.5 58 L93.5 61.5 L95.5 67.5 L90 64 L84.5 67.5 L86.5 61.5 L81.5 58 L87.5 58 Z" fill="${goldFill}" stroke="${goldDeep}" stroke-width=".5"/>
    </svg>`;
  }
  // classic
  return `<svg width="${w}" height="${h}" viewBox="0 0 180 130" style="margin:0 auto;display:block;" aria-hidden="true">
    ${envelopeShadow()}
    <rect x="4" y="14" width="172" height="112" rx="6" fill="${light}" stroke="${color}" stroke-width="1.5"/>
    <path d="M4 16 L90 82 L176 16" fill="none" stroke="${color}" stroke-width="1.5"/>
    <path d="M4 14 L90 68 L176 14" fill="${color}" opacity=".15"/>
  </svg>`;
}

function openCard(withMusic, occasionId, melodyId){
  document.getElementById('envelope').style.display='none';
  document.getElementById('viewContent').classList.add('show');
  setTimeout(()=>document.getElementById('viewBouquet').classList.add('bloom'), 60);
  setTimeout(()=>document.getElementById('viewMsg').classList.add('show'), 500);
  setTimeout(()=>document.getElementById('viewFrom').classList.add('show'), 700);
  if(withMusic) playChime(melodyId);
  dropParticles(occasionById(occasionId).anim);
}

// Единая "падающая" анимация с тремя стилями частиц под настроение повода:
// petals (мягкий, по умолчанию), hearts (Любовь), confetti (праздничные поводы).
// Раньше был только один жёстко зашитый вариант (лепестки) — теперь форма/цвет/
// траектория частицы зависят от style, а сама механика (создать → уронить → убрать) общая.
function dropParticles(style){
  style = style || 'petals';
  const presets = {
    petals: {
      count: 16, colors:['#C97B86','#E3B7BE','#F2E1C8','#B98A4A'],
      shape: c => `<svg width="14" height="14" viewBox="0 0 14 14"><ellipse cx="7" cy="7" rx="7" ry="5" fill="${c}"/></svg>`,
      spin: () => 300+Math.random()*200, duration: 2.6
    },
    hearts: {
      count: 14, colors:['#C97B86','#B23A4E','#E3B7BE','#4B2E3D'],
      shape: c => `<svg width="14" height="14" viewBox="0 0 16 16"><path d="M8 13.4C3 10 1.5 6.6 3.4 4.4C5 2.5 8 3.3 8 6C8 3.3 11 2.5 12.6 4.4C14.5 6.6 13 10 8 13.4Z" fill="${c}"/></svg>`,
      spin: () => 60+Math.random()*40-20, duration: 3
    },
    confetti: {
      count: 22, colors:['#C97B86','#B98A4A','#8CA087','#4B2E3D','#E3B7BE','#5C7457'],
      shape: c => `<svg width="10" height="14" viewBox="0 0 10 14"><rect width="10" height="14" rx="2" fill="${c}"/></svg>`,
      spin: () => 400+Math.random()*400, duration: 2.3
    }
  };
  const p = presets[style] || presets.petals;
  for(let i=0;i<p.count;i++){
    setTimeout(()=>{
      const el=document.createElement('div');
      el.className='petal';
      const c=p.colors[i%p.colors.length];
      el.style.left = Math.random()*100+'vw';
      el.setAttribute('aria-hidden','true');
      el.innerHTML=p.shape(c);
      el.style.transition=`transform ${p.duration}s ease-in, opacity ${p.duration}s ease-in`;
      document.body.appendChild(el);
      requestAnimationFrame(()=>{
        el.style.transform=`translateY(${window.innerHeight+40}px) rotate(${p.spin()}deg)`;
        el.style.opacity='0';
      });
      setTimeout(()=>el.remove(), p.duration*1000+100);
    }, i*85);
  }
}

/* ====================== MY CARDS (сервер для вошедших, localStorage для гостей) ====================== */

async function renderMyCards(){
  setPageTitle(t('Мои открытки'));
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="mine-wrap">
      <div class="eyebrow">${session.user ? t('в вашем аккаунте') : t('на этом устройстве')}</div>
      <h1 style="font-size:26px;margin-top:8px;">${t('Открытки, которые вы собрали')}</h1>
      <div class="mine-note">${session.user
        ? t('Открытки сохранены за вашим аккаунтом и доступны с любого устройства.')
        : `${t('Этот список хранится только в браузере на этом устройстве и пропадёт при очистке кэша.')} <a href="#login">${t('Войдите')}</a>, ${t('чтобы открытки сохранялись за вами навсегда.')}`}</div>
      <div class="mine-list" id="mineList"><p style="opacity:.6;">${t('Загрузка…')}</p></div>
    </div>
    <footer class="site-footer">${footerHtml()}</footer>
  `;

  let list = [];
  if(session.user){
    try{
      const res = await fetch('/api/cards');
      const json = await res.json();
      list = (json.cards || []).map(c => ({ id:c.id, shortId:c.shortId, occasion:c.occasion, to:c.to, createdAt:c.createdAt, data:c.encodedData, server:true }));
    }catch(e){ list = []; }
  } else {
    try{ list = JSON.parse(localStorage.getItem('my-cards') || '[]'); }catch(e){ list = []; }
  }

  const wrap = document.getElementById('mineList');
  if(!wrap) return; // пользователь мог уйти со страницы, пока шёл запрос
  if(!list.length){
    wrap.innerHTML = `<div class="mine-empty">${t('Пока пусто. Соберите первую открытку — она появится здесь.')}</div>`;
    return;
  }
  const dateLocale = uiLang === 'ru' ? 'ru-RU' : 'en-US';
  wrap.innerHTML = list.map(item=>{
    const occ = occasionById(item.occasion) || OCCASIONS[0];
    const d = new Date(item.createdAt);
    return `<div class="mine-row">
      <div class="mine-dot" style="background:${occ.color}"></div>
      <div class="mine-info">
        <div class="mi-to">${item.to ? t('Для')+' '+esc(item.to) : tr(occ.label)}</div>
        <div class="mi-date">${d.toLocaleDateString(dateLocale,{day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <div class="mine-actions">
        <button onclick="openCardLink('${item.data}')">${t('Открыть')}</button>
        <button onclick="copyMineLink('${item.data}', ${item.shortId ? `'${item.shortId}'` : 'null'})">${t('Ссылка')}</button>
        <button onclick="deleteMineCard('${item.id}', ${item.server?'true':'false'})">${t('Удалить')}</button>
      </div>
    </div>`;
  }).join('');
}
// Переход к своей же открытке без полной перезагрузки страницы: меняем
// query-строку через history API (та же ссылка, что уходит адресату) и
// перерисовываем маршрут вручную — hashchange здесь не сработает, потому что
// хэш мы не трогаем.
function openCardLink(encodedData){
  history.pushState(null, '', '?data=' + encodedData);
  renderRoute();
}
function copyMineLink(encodedData, shortId){
  const url = shortId
    ? location.origin + '/c/' + shortId
    : location.origin + location.pathname + '?data=' + encodedData;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>showToast(t('Ссылка скопирована')));
  } else {
    showToast(url);
  }
}
async function deleteMineCard(id, isServer){
  if(isServer){
    try{
      const res = await fetch('/api/cards/'+encodeURIComponent(id), { method:'DELETE' });
      if(!res.ok) throw new Error();
    }catch(e){ showToast(t('Не удалось удалить открытку')); return; }
  } else {
    let list = JSON.parse(localStorage.getItem('my-cards') || '[]');
    list = list.filter(item => item.id !== id);
    localStorage.setItem('my-cards', JSON.stringify(list));
  }
  renderMyCards(); // перерисовать список без удалённой открытки
  showToast(t('Открытка удалена'));
}

/* ====================== АККАУНТ (вход/регистрация/профиль) ====================== */

function renderLogin(){
  if(session.user){ goHome(); return; }
  setPageTitle(t('Вход'));
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap">
      <div class="eyebrow">${t('аккаунт')}</div>
      <h1 style="font-size:26px;margin-top:8px;">${t('Вход')}</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;">${t('Чтобы открытки сохранялись за вами, а не только в этом браузере.')}</p>
      <form id="loginForm" class="auth-form">
        <label class="sr-only" for="loginEmail">${t('Email')}</label>
        <input type="email" id="loginEmail" placeholder="${t('Email')}" required autocomplete="username">
        <label class="sr-only" for="loginPassword">${t('Пароль')}</label>
        <input type="password" id="loginPassword" placeholder="${t('Пароль')}" required autocomplete="current-password">
        <div class="auth-error" id="loginError"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;">${t('Войти')}</button>
      </form>
      <p class="auth-switch">${t('Нет аккаунта?')} <a href="#register">${t('Зарегистрироваться')}</a></p>
      <p class="auth-switch">${t('Забыли пароль?')} <a href="#forgot">${t('Восстановить')}</a></p>
    </div>
  `;
  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    try{
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json', 'X-Lang':uiLang}, body: JSON.stringify({ email, password }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || t('Не удалось войти'));
      session.user = json.user;
      showToast(t('Добро пожаловать!'));
      const dest = pendingRoute; pendingRoute = null;
      location.hash = dest || '';
      renderRoute();
    }catch(err){
      errEl.textContent = err.message;
    }
  };
}

function renderRegister(){
  if(session.user){ goHome(); return; }
  setPageTitle(t('Регистрация'));
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap">
      <div class="eyebrow">${t('аккаунт')}</div>
      <h1 style="font-size:26px;margin-top:8px;">${t('Регистрация')}</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;">${t('Займёт полминуты. Пароль — не короче 8 символов.')}</p>
      <form id="registerForm" class="auth-form">
        <label class="sr-only" for="regName">${t('Имя')}</label>
        <input type="text" id="regName" placeholder="${t('Имя (необязательно)')}" maxlength="60" autocomplete="name">
        <label class="sr-only" for="regEmail">${t('Email')}</label>
        <input type="email" id="regEmail" placeholder="${t('Email')}" required autocomplete="username">
        <label class="sr-only" for="regPassword">${t('Пароль')}</label>
        <input type="password" id="regPassword" placeholder="${t('Пароль')}" required minlength="8" autocomplete="new-password">
        <input type="text" id="regWebsite" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">
        <div class="auth-error" id="registerError"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;">${t('Создать аккаунт')}</button>
      </form>
      <p class="auth-switch">${t('Уже есть аккаунт?')} <a href="#login">${t('Войти')}</a></p>
    </div>
  `;
  document.getElementById('registerForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const website = document.getElementById('regWebsite').value;
    const errEl = document.getElementById('registerError');
    errEl.textContent = '';
    try{
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json', 'X-Lang':uiLang}, body: JSON.stringify({ email, password, name, website }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || t('Не удалось зарегистрироваться'));
      session.user = json.user;
      showToast(t('Аккаунт создан'));
      const dest = pendingRoute; pendingRoute = null;
      location.hash = dest || '';
      renderRoute();
    }catch(err){
      errEl.textContent = err.message;
    }
  };
}

function renderForgotPassword(){
  if(session.user){ goHome(); return; }
  setPageTitle(t('Восстановление пароля'));
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap">
      <div class="eyebrow">${t('аккаунт')}</div>
      <h1 style="font-size:26px;margin-top:8px;">${t('Восстановление пароля')}</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;">${t('Укажите email, на который зарегистрирован аккаунт — пришлём ссылку для сброса пароля.')}</p>
      <form id="forgotForm" class="auth-form">
        <label class="sr-only" for="forgotEmail">${t('Email')}</label>
        <input type="email" id="forgotEmail" placeholder="${t('Email')}" required autocomplete="username">
        <div class="auth-error" id="forgotError"></div>
        <div class="auth-note" id="forgotNote" style="display:none;"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;" id="forgotSubmit">${t('Отправить ссылку')}</button>
      </form>
      <p class="auth-switch">${t('Вспомнили пароль?')} <a href="#login">${t('Войти')}</a></p>
    </div>
  `;
  document.getElementById('forgotForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const errEl = document.getElementById('forgotError');
    const noteEl = document.getElementById('forgotNote');
    const btn = document.getElementById('forgotSubmit');
    errEl.textContent = ''; noteEl.style.display = 'none';
    btn.disabled = true;
    try{
      const res = await fetch('/api/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json', 'X-Lang':uiLang}, body: JSON.stringify({ email }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || t('Не удалось отправить ссылку'));
      noteEl.textContent = json.message;
      noteEl.style.display = 'block';
      e.target.reset();
    }catch(err){
      errEl.textContent = err.message;
    }finally{
      btn.disabled = false;
    }
  };
}

function renderResetPassword(token){
  setPageTitle(t('Новый пароль'));
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap">
      <div class="eyebrow">${t('аккаунт')}</div>
      <h1 style="font-size:26px;margin-top:8px;">${t('Новый пароль')}</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;">${t('Придумайте новый пароль — не короче 8 символов.')}</p>
      <form id="resetForm" class="auth-form">
        <label class="sr-only" for="resetPassword">${t('Новый пароль')}</label>
        <input type="password" id="resetPassword" placeholder="${t('Новый пароль')}" required minlength="8" autocomplete="new-password">
        <div class="auth-error" id="resetError"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;">${t('Сохранить пароль')}</button>
      </form>
    </div>
  `;
  document.getElementById('resetForm').onsubmit = async (e) => {
    e.preventDefault();
    const password = document.getElementById('resetPassword').value;
    const errEl = document.getElementById('resetError');
    errEl.textContent = '';
    try{
      const res = await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json', 'X-Lang':uiLang}, body: JSON.stringify({ token, password }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || t('Не удалось сохранить пароль'));
      session.user = json.user;
      showToast(t('Пароль обновлён, вы вошли в аккаунт'));
      goHome();
    }catch(err){
      errEl.textContent = err.message;
    }
  };
}

function renderAccount(){
  if(!session.user){ pendingRoute = 'account'; location.hash = 'login'; return; }
  setPageTitle(t('Аккаунт'));
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap" style="max-width:520px;">
      <div class="eyebrow">${t('аккаунт')}</div>
      <h1 style="font-size:26px;margin-top:8px;">${esc(session.user.name || session.user.email)}</h1>
      <p style="opacity:.6;margin-top:4px;font-size:13.5px;">${esc(session.user.email)}</p>

      <button class="btn btn-ghost" style="margin-top:22px;" onclick="doLogout()">${t('Выйти из аккаунта')}</button>
    </div>
  `;
}

async function doLogout(){
  try{ await fetch('/api/auth/logout', { method:'POST' }); }catch(e){}
  session.user = null;
  showToast(t('Вы вышли из аккаунта'));
  goHome();
}

/* ====================== ЮРИДИЧЕСКИЕ СТРАНИЦЫ ====================== */

function renderPrivacy(){
  setPageTitle(t('Конфиденциальность'));
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="legal-wrap">
      <div class="eyebrow">${t('документ')}</div>
      <h1 style="font-size:28px;margin-top:8px;">${t('Политика конфиденциальности')}</h1>
      <p class="legal-updated">${t('Последнее обновление: черновик — перед публикацией согласуйте с юристом.')}</p>

      <h2>${t('Какие данные мы собираем')}</h2>
      <p>${t('Email и (опционально) имя — при регистрации аккаунта. Пароль хранится не в открытом виде, а в виде хеша. Содержимое собранных вами открыток (текст, выбор цветов и т.д.) — если вы вошли в аккаунт, чтобы список «Мои открытки» не терялся между устройствами.')}</p>

      <h2>${t('Как используются данные')}</h2>
      <p>${t('Для входа в аккаунт и отображения ваших открыток. Мы не продаём и не передаём email третьим лицам, кроме случаев, предусмотренных законом.')}</p>

      <h2>${t('Cookies и реклама')}</h2>
      <p>${t('Один технический cookie используется для авторизации (хранит подписанный токен сессии) и не используется для рекламного трекинга. Отдельно на сайте могут показываться рекламные баннеры (например, Google AdSense или Яндекс.Директ) — рекламная сеть может устанавливать собственные cookies для показа объявлений. Эту секцию нужно будет дополнить точной формулировкой из политики выбранной рекламной сети перед подключением реальной рекламы.')}</p>

      <h2>${t('Открытки без аккаунта')}</h2>
      <p>${t('Если вы не входите в аккаунт, вся открытка целиком хранится в самой ссылке (в её части после «#») — сервер её не видит и не сохраняет. Список «Мои открытки» в этом случае хранится только в вашем браузере (localStorage).')}</p>

      <h2>${t('Удаление данных')}</h2>
      <p>${t('Вы можете удалить любую открытку из списка «Мои открытки». Чтобы удалить аккаунт целиком, напишите на')} <a href="mailto:vivorosesupport@gmail.com">vivorosesupport@gmail.com</a>.</p>
    </div>
    <footer class="site-footer">${footerHtml()}</footer>
  `;
}

function renderTerms(){
  setPageTitle(t('Условия использования'));
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="legal-wrap">
      <div class="eyebrow">${t('документ')}</div>
      <h1 style="font-size:28px;margin-top:8px;">${t('Условия использования')}</h1>
      <p class="legal-updated">${t('Последнее обновление: черновик — перед публикацией согласуйте с юристом.')}</p>

      <h2>${t('Сервис')}</h2>
      <p>${BRAND} ${t('позволяет собрать виртуальный букет-открытку и отправить её ссылкой. Все цветы, вазы, конверты и фоны бесплатны. Сервис поддерживается показом рекламных баннеров.')}</p>

      <h2>${t('Реклама на сайте')}</h2>
      <p>${t('На страницах сайта могут показываться рекламные объявления от сторонних рекламных сетей (например, Google AdSense, Яндекс.Директ). Мы не отвечаем за содержание конкретных объявлений — их подбирает рекламная сеть.')}</p>

      <h2>${t('Ответственность')}</h2>
      <p>${t('Вы несёте ответственность за содержание текста, который добавляете в открытку. Запрещено использовать сервис для рассылки незаконного, оскорбительного или спам-контента.')}</p>

      <h2>${t('Изменения')}</h2>
      <p>${t('Мы можем обновлять эти условия; актуальная версия всегда доступна на этой странице.')}</p>
    </div>
    <footer class="site-footer">${footerHtml()}</footer>
  `;
}

/* ====================== ROUTER ====================== */

function renderRoute(){
  // Хэш-маршруты — это внутренняя навигация по SPA, они всегда в приоритете.
  // ?data= (ссылка на открытку) смотрим только когда хэша нет — иначе клик по
  // "Мои открытки"/"Войти" на странице открытой открытки не сработал бы: сам
  // ?data= в URL никуда не девается при смене одного только хэша.
  const hash = location.hash;
  if(hash === '#mine') return renderMyCards();
  if(hash === '#login') return renderLogin();
  if(hash === '#register') return renderRegister();
  if(hash === '#account') return renderAccount();
  if(hash === '#forgot') return renderForgotPassword();
  if(hash.startsWith('#reset=')) return renderResetPassword(hash.slice(7));
  if(hash === '#privacy') return renderPrivacy();
  if(hash === '#terms') return renderTerms();

  const shortMatch = location.pathname.match(/^\/c\/([A-Za-z0-9]+)$/);
  if(shortMatch) return renderShortViewer(shortMatch[1]);

  const cardData = new URLSearchParams(location.search).get('data');
  if(cardData) return renderViewer(cardData);
  renderCreator();
}

// Полный сброс на главный конструктор: чистит и хэш, и ?data= в query-строке
// разом (одной history.replaceState), иначе после просмотра открытки ссылка
// вида "Создать свою" молча оставалась бы на месте — renderRoute() увидел бы
// прежний ?data= и снова показал бы ту же открытку.
function goHome(){
  history.replaceState(null, '', location.pathname);
  renderRoute();
}

async function bootstrap(){
  document.documentElement.lang = uiLang; // статичный <html lang> в index.html — только запасной вариант до этой строки
  await loadMe();
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('popstate', renderRoute); // кнопки назад/вперёд для ?data=-ссылок
  renderRoute();
}
bootstrap();

// PWA: регистрируем service worker, чтобы сайт можно было добавить на
// главный экран. sw.js ничего не кэширует (см. комментарий в файле) —
// он нужен только для критерия "installability", а не для офлайн-режима.
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });
}