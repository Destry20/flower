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

/* ====================== ТЕМА (светлая/тёмная) ====================== */
// В отличие от языка — НЕ подхватываем системную тему устройства, только
// явный выбор пользователя. По умолчанию всегда светлая: раньше уже пробовали
// ориентироваться на системную тёмную тему и это сбивало с толку (сайт
// внезапно оказывался тёмным без того, чтобы пользователь сам это выбрал).
function detectTheme(){
  try{
    const saved = localStorage.getItem('vr-theme');
    if(saved === 'dark' || saved === 'light') return saved;
  }catch(e){}
  return 'light';
}
let uiTheme = detectTheme();
function applyTheme(){
  document.documentElement.setAttribute('data-theme', uiTheme);
}
function toggleTheme(){
  uiTheme = uiTheme === 'dark' ? 'light' : 'dark';
  try{ localStorage.setItem('vr-theme', uiTheme); }catch(e){}
  applyTheme();
  renderRoute(); // перерисовать шапку — у кнопки переключения меняются иконка и aria-label
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
  'Открытка хранится на сервере ограниченное время и будет автоматически удалена.': 'The card is stored on the server for a limited time and will be deleted automatically.',
  'Ссылка временная: открытка будет автоматически удалена с сервера': 'This is a temporary link: the card will be automatically deleted from the server on',
  'Это короткая ссылка: открытка временно хранится на сервере без привязки к аккаунту, а ссылка лишь указывает на неё.': 'This is a short link: the card is temporarily stored on the server without an account, and the link just points to it.',
  'Войдите в аккаунт, чтобы открытка сохранялась без срока и не потерялась.': 'Log in to keep the card saved indefinitely so it doesn\'t get lost.',
  'Мои открытки': 'My cards',
  'Написать нам': 'Contact us',
  'Включить светлую тему': 'Switch to light theme',
  'Включить тёмную тему': 'Switch to dark theme',
  'Меню': 'Menu',
  'Или соберите её всей компанией →': 'Or build it together with a group →',
  'Собрать всей компанией': 'Build it as a group',
  'вместе': 'together',
  'Собрать открытку всей компанией': 'Build a card as a group',
  'Вы задаёте основу — повод и вазу. Дальше отправьте ссылку остальным: каждый добавит своё имя, пожелание и один цветок. Букет соберётся из цветов всех участников — вы сами закроете приём подписей, когда решите, что открытка готова.':
    'You set the base — the occasion and vase. Then send the link to everyone else: each person adds their name, a message, and one flower. The bouquet grows from everyone’s flowers — you decide when to close it for signatures.',
  'Букет пока пуст — его наполнят цветами те, кто подпишет открытку': 'The bouquet starts empty — it fills up as people sign the card',
  'Кому': 'To',
  'Создать ссылку-приглашение': 'Create invite link',
  'Введите имя получателя': 'Enter the recipient’s name',
  'Не удалось создать открытку': 'Couldn’t create the card',
  'Открытка всей компанией': 'Group card',
  'Ссылка повреждена или открытка уже удалена.': 'This link is broken or the card was already removed.',
  'Открыта для подписей': 'Open for signatures',
  'подписал(и)': 'signed',
  'Добавить свою подпись': 'Add your signature',
  'Ваше пожелание': 'Your message',
  'Выберите один цветок в букет': 'Pick one flower for the bouquet',
  'Добавить в открытку': 'Add to the card',
  'Спасибо! Ваша подпись добавлена.': 'Thanks! Your signature was added.',
  'Пока никто не подписал — станьте первым': 'No one has signed yet — be the first',
  'Скопировать ссылку-приглашение': 'Copy invite link',
  'Приём подписей завершён': 'Signatures are closed',
  'Вы организатор': 'You’re the organizer',
  'Когда открытка будет готова, закройте приём подписей — после этого добавить строку будет уже нельзя. Управлять этой открыткой можно и позже, из своего аккаунта.': 'When the card is ready, close it for signatures — after that, no one can add another line. You can also manage this card later, from your account.',
  'Закрыть приём подписей': 'Close for signatures',
  'Каждый добавляет своё имя, пожелание и один цветок — вместе они и складываются в букет выше.': 'Everyone adds their name, a message, and one flower — together they make up the bouquet above.',
  'Не удалось закрыть открытку': 'Couldn’t close the card',
  'Приём подписей закрыт': 'Closed for signatures',
  'Заполните имя и пожелание': 'Fill in your name and a message',
  'Не удалось добавить подпись': 'Couldn’t add your signature',
  'Открытки всей компанией': 'Group cards',
  'Пока нет ни одной. Начните — ссылка «Собрать всей компанией» есть на главной.': 'None yet. Get started — the "Build it as a group" link is on the homepage.',
  'Закрыта': 'Closed',
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
  'О сервисе': 'About the service',
  'VivoRose — это простой способ отправить тёплые слова не пустым текстом, а живой открыткой: соберите букет из цветов, ленты и вазы на свой вкус, добавьте короткое послание и отправьте всё одной ссылкой. Получатель открывает её как настоящую открытку — с разворотом конверта и постепенным цветением букета, без установки приложений.':
    'VivoRose is a simple way to send warm words not as plain text, but as a living card: build a bouquet from flowers, a ribbon and a vase to your taste, add a short message, and send it all as a single link. The recipient opens it like a real card — with an unfolding envelope and the bouquet blooming into view, no app install required.',
  'Нужна ли регистрация': 'Do I need to register',
  'Нет — собрать и отправить открытку можно без аккаунта, вся она целиком умещается в самой ссылке. Регистрация нужна только если хотите, чтобы список ваших открыток сохранялся и был доступен с любого устройства.':
    'No — you can build and send a card without an account, the whole card fits inside the link itself. An account is only useful if you want your list of cards saved and available from any device.',
  'Это бесплатно?': 'Is it free?',
  'Да, полностью. Все цветы, вазы, ленты, конверты и фоны доступны бесплатно — сервис существует за счёт показа рекламных баннеров, а не платных подписок.':
    'Yes, completely. All flowers, vases, ribbons, envelopes and backgrounds are free — the service runs on ad banners, not paid subscriptions.',
  'Для каких поводов': 'What occasions it fits',
  'Дни рождения, признания в любви, слова благодарности, поздравления или просто открытка "потому что вспомнили о человеке" — под каждый повод есть свой набор цветов, цвет ленты и тон открытки.':
    'Birthdays, love confessions, thank-yous, congratulations, or just a card "because you thought of someone" — each occasion gets its own set of flowers, ribbon color, and card tone.',
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
  'Подвеска на ленте': 'Charm on the ribbon',
  'Форма и цвет — под ваш повод: сердце, звезда, лист…': 'Shape and color match your occasion: heart, star, leaf…',
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
  'Какие данные мы собираем': 'What data we collect',
  'Email и (опционально) имя — при регистрации аккаунта. Пароль хранится не в открытом виде, а в виде хеша. Содержимое собранных вами открыток (текст, выбор цветов и т.д.) — если вы вошли в аккаунт, чтобы список «Мои открытки» не терялся между устройствами.':
    'Email and (optionally) name when you register an account. Passwords are stored hashed, never in plain text. The contents of the cards you build (text, flower choices, etc.) — only if you\'re logged in, so your "My cards" list survives across devices.',
  'Как используются данные': 'How the data is used',
  'Для входа в аккаунт и отображения ваших открыток. Мы не продаём и не передаём email третьим лицам, кроме случаев, предусмотренных законом.':
    'To log you in and show your cards. We don\'t sell or share your email with third parties except where required by law.',
  'Cookies и реклама': 'Cookies and advertising',
  'Один cookie используется для авторизации и не служит для рекламного трекинга. Рекламные сети (например, Google AdSense) могут устанавливать собственные cookies для показа объявлений.':
    'One cookie is used for authentication and is not used for ad tracking. Ad networks (e.g. Google AdSense) may set their own cookies to serve ads.',
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
const SITE_DESCRIPTION_EN = 'A virtual bouquet that never wilts — pick the flowers, write your message, and share it with one link.';
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

// Предел количества цветков одного типа (раньше было 8) — большие количества
// визуально перегружали купол букета, головки сливались в плотное пятно без
// читаемых промежутков между отдельными цветами.
const MAX_FLOWERS_PER_TYPE = 5;

const VASES = [
  {id:'A', label:{ru:'Глиняная',en:'Clay'}},
  {id:'B', label:{ru:'Стеклянная',en:'Glass'}},
  {id:'C', label:{ru:'Крафтовая',en:'Kraft-wrapped'}},
  {id:'D', label:{ru:'Мраморная',en:'Marble'}},
  {id:'E', label:{ru:'Плетёная корзина',en:'Wicker basket'}}
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
  background: 'cream',
  charm: false
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
    charm: !!data.charm,
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
// Тот же принцип, но с неглубокой выемкой-сердечком на кончике — именно эта
// деталь на практике и читается глазом как "лепесток розы", а не форма кольца
// лепестков в целом (кольцо одинаковых лепестков у розы и пиона и так почти
// не отличалось). На маленьком размере (значок цветка/бутон в букете, где
// весь цветок — 20-40px) сама выемка тонет в сглаживании, но она всё ещё
// сказывается на контуре, поэтому используется вместе со сдвигом тона по
// кругу ниже — который-то и выживает на маленьком размере.
function rosePetalPath(len, width){
  const w = width/2;
  return `M0,0 C${-w},${-len*0.25} ${-w*0.95},${-len*0.75} ${-w*0.32},${-len*0.94}
    C${-w*0.14},${-len*1.0} ${-w*0.14},${-len*1.0} 0,${-len*0.86}
    C${w*0.14},${-len*1.0} ${w*0.14},${-len*1.0} ${w*0.32},${-len*0.94}
    C${w*0.95},${-len*0.75} ${w},${-len*0.25} 0,0 Z`;
}
// тот же принцип, но с волнистым "рюшевым" краем — для гвоздики. Раньше край
// был острым зигзагом из прямых линий и на малом размере читался как колючий
// шарик репейника, а не цветок; волна на кривых Безье даёт мягкую бахрому.
function fringedPetal(len, width){
  const w = width/2;
  return `M0,0 C${-w*0.7},${-len*0.2} ${-w},${-len*0.32} ${-w*0.55},${-len*0.42}
    C${-w*0.85},${-len*0.5} ${-w*0.7},${-len*0.62} ${-w*0.25},${-len*0.7}
    C${-w*0.5},${-len*0.8} ${-w*0.22},${-len*0.92} 0,${-len}
    C${w*0.22},${-len*0.92} ${w*0.5},${-len*0.8} ${w*0.25},${-len*0.7}
    C${w*0.7},${-len*0.62} ${w*0.85},${-len*0.5} ${w*0.55},${-len*0.42}
    C${w},${-len*0.32} ${w*0.7},${-len*0.2} 0,0 Z`;
}
// маленький глянцевый блик — на светлом полупрозрачном пятне глаз считывает объём
function glint(x, y, rot, color){
  return `<ellipse cx="${x}" cy="${y}" rx="1.7" ry="1" fill="${color}" opacity=".55" transform="rotate(${rot} ${x} ${y})"/>`;
}
// радиальный градиент вместо плоской заливки — даёт лепестку выпуклость,
// а не плоское цветовое пятно. id генерится на каждый вызов, поэтому
// несколько цветков одного типа/цвета на холсте не делят один <defs> и не
// "ловят" чужую анимацию/изменение при частичном ре-рендере.
function petalGradient(color){
  const id = 'pg' + Math.random().toString(36).slice(2,10);
  const light = lighten(color, 34);
  const mid = color;
  const edge = darken(color, 14);
  const defs = `<radialGradient id="${id}" cx="38%" cy="26%" r="82%"><stop offset="0%" stop-color="${light}"/><stop offset="60%" stop-color="${mid}"/><stop offset="100%" stop-color="${edge}"/></radialGradient>`;
  return {url:`url(#${id})`, defs};
}

function flowerHead(type, cx, cy, color, rot, scale){
  const dark = darken(color, 42);
  const light = lighten(color, 26);
  // общий радиальный градиент для этого экземпляра цветка — заменяет плоскую
  // заливку основного яруса лепестков, даёт объём (светлый "выступ" к центру,
  // затемнение к краю) вместо одноцветного пятна
  const pg = petalGradient(color);
  let g = '';
  // все фигуры лепестков рисуются вокруг локального (0,0) — это гарантирует, что
  // rotate/scale ниже вращают и масштабируют цветок ровно вокруг его собственного
  // центра, а не "сползают" к углу холста при scale < 1
  if(type==='rose'){
    // два яруса лепестков (крупный внешний + плотный внутренний) дают
    // характерную спиральную розетку розы вместо плоского "цветка-ромашки".
    // Размер выровнен с пионом (8.5/9.5 у ringA пиона ниже) — раньше внешний
    // ярус был 10/11, заметно крупнее соседей по букету. Лепестки — та же
    // rosePetalPath с неглубокой выемкой на кончике, но без переливающегося
    // перехода тона по кругу: на практике "тень" читалась лишней деталью,
    // а не объёмом, поэтому вернулись к обычному чередованию светлый/тёмный
    // через один — как у пиона/гвоздики/ромашки ниже, для единообразия.
    const outer = 8, inner = 5;
    for(let i=0;i<outer;i++){
      const a = (i/outer)*360;
      g += `<g transform="rotate(${a})"><path d="${rosePetalPath(8.5,9.5)}" fill="${i%2?pg.url:light}" stroke="${dark}" stroke-width=".5" transform="translate(0,-3)"/></g>`;
    }
    for(let i=0;i<inner;i++){
      const a = (i/inner)*360 + 18;
      g += `<g transform="rotate(${a})"><path d="${petalPath(5.5,6)}" fill="${pg.url}" stroke="${dark}" stroke-width=".45" transform="translate(0,-0.9)"/></g>`;
    }
    // Раньше центр был просто плоской точкой — тем же самым рецептом
    // (кольцо одинаковых лепестков-капель вокруг точки) рисовался и пион,
    // поэтому роза от пиона отличалась только цветом, а не силуэтом. У
    // настоящей розы характерный признак — не кольцо, а туго скрученный
    // бутон в центре. Тёмный кружок остаётся как подложка (гарантирует, что
    // между тремя лепестками сверху не будет видно фоновой дыры), а сами три
    // маленьких лепестка стоят под НЕравными углами (10°/125°/235°, а не
    // ровно через 120°) — именно нарушенная симметрия и читается как лёгкая
    // скрутка, при равных углах снова получилось бы правильное колесо.
    g += `<circle cx="0" cy="0" r="1.9" fill="${dark}"/>`;
    [10,125,235].forEach((a,i) => {
      g += `<g transform="rotate(${a})"><path d="${petalPath(3.8,4.2)}" fill="${i===1?light:pg.url}" stroke="${dark}" stroke-width=".35" transform="translate(0,-0.9)"/></g>`;
    });
    g += glint(-2, -6, -20, lighten(color,42));
  } else if(type==='peony'){
    // пышные два яруса — пион узнаётся именно по обилию рыхлых лепестков
    const ringA = 9, ringB = 7;
    for(let i=0;i<ringA;i++){
      const a = (i/ringA)*360;
      g += `<g transform="rotate(${a})"><path d="${petalPath(8.5,9.5)}" fill="${i%3===0?light:pg.url}" stroke="${dark}" stroke-width=".45" transform="translate(0,-5)"/></g>`;
    }
    for(let i=0;i<ringB;i++){
      const a = (i/ringB)*360 + 22;
      g += `<g transform="rotate(${a})"><path d="${petalPath(5.5,6.5)}" fill="${lighten(color,10)}" stroke="${dark}" stroke-width=".4" transform="translate(0,-1.5)"/></g>`;
    }
    // На настоящем пионе в центре видна жёлтая метёлка тычинок, а не более
    // тёмный оттенок лепестка (это раньше рисовалось тем же приёмом, что и
    // у розы/центр-точка) — фиксированный жёлто-золотой тон, независимый от
    // выбранного цвета лепестков, как у ромашки/подсолнуха: у настоящего
    // цветка тычинки жёлтые вне зависимости от цвета самих лепестков.
    g += `<circle cx="0" cy="0" r="1.6" fill="#F2C94C"/>`;
    for(let i=0;i<7;i++){
      const aa = (i/7)*Math.PI*2;
      g += `<circle cx="${Math.cos(aa)*1.9}" cy="${Math.sin(aa)*1.9}" r=".5" fill="#D9A441"/>`;
    }
    g += glint(-1.5, -8, -15, lighten(color,45));
  } else if(type==='tulip'){
    // Все остальные цветы рисуются "вид сверху, кольцо лепестков вокруг центра" —
    // для тюльпана это не работает: раскрытый сверху тюльпан превращается в
    // плоскую звезду, ничего общего с узнаваемым силуэтом. Поэтому тюльпан —
    // единственный, кто рисуется сбоку, закрытым бутоном. Перебрал несколько
    // неудачных вариантов: гладкий сплошной купол читался как яйцо/ягода; три
    // острых лепестка с большим разлётом расходились слишком широко и превращали
    // бутон в "трезубец"; узкий бутон с проблесками лепестков внутри контура —
    // снова гладкое яйцо, просто в полоску. Рабочий вариант — те же острые
    // лепестки-"слёзы", что и во втором варианте, но с гораздо меньшим углом
    // разлёта и большим нахлёстом: кончики остаются близко друг к другу
    // (узнаваемые три острия), а не расходятся в стороны.
    g += `<g transform="translate(-2.5,4) rotate(-13)"><path d="${petalPath(16,10)}" fill="${darken(color,10)}" stroke="${dark}" stroke-width=".5"/></g>`;
    g += `<g transform="translate(2.5,4) rotate(13)"><path d="${petalPath(16,10)}" fill="${darken(color,10)}" stroke="${dark}" stroke-width=".5"/></g>`;
    g += `<g transform="translate(0,4)"><path d="${petalPath(18,11)}" fill="${pg.url}" stroke="${dark}" stroke-width=".55"/></g>`;
    // тонкая складка по центру переднего лепестка — читается как настоящий сгиб бутона
    g += `<path d="M0,-2 C-1.5,-10 -1,-17 0,-22" stroke="${dark}" stroke-width=".5" opacity=".3" fill="none"/>`;
    g += glint(-3, -13, -12, lighten(color,48));
  } else if(type==='daisy'){
    // узкие лепестки-слёзы вместо ровных эллипсов — кончики теперь мягко заострены
    const count = 12;
    for(let i=0;i<count;i++){
      const a = (i/count)*360;
      g += `<g transform="rotate(${a})"><path d="${petalPath(10.5,4.2)}" fill="${pg.url}" stroke="${dark}" stroke-width=".35" transform="translate(0,-2.5)"/></g>`;
    }
    g += `<circle cx="0" cy="0" r="5.3" fill="#D9A441"/>`;
    for(let i=0;i<8;i++){
      const a = (i/8)*Math.PI*2;
      g += `<circle cx="${Math.cos(a)*2.7}" cy="${Math.sin(a)*2.7}" r=".55" fill="#8A5E22" opacity=".55"/>`;
    }
  } else if(type==='carnation'){
    // два яруса лепестков с мягкой волнистой бахромой — цветок стал полнее и
    // менее "колючим", чем раньше
    const outer=12, inner=8;
    for(let i=0;i<outer;i++){
      const a = (i/outer)*360;
      g += `<g transform="rotate(${a})"><path d="${fringedPetal(8,6)}" fill="${i%2?pg.url:light}" stroke="${dark}" stroke-width=".35" transform="translate(0,-2.5)"/></g>`;
    }
    for(let i=0;i<inner;i++){
      const a = (i/inner)*360 + 20;
      g += `<g transform="rotate(${a})"><path d="${fringedPetal(5.5,4.5)}" fill="${pg.url}" stroke="${dark}" stroke-width=".3" transform="translate(0,-0.5)"/></g>`;
    }
    g += `<circle cx="0" cy="0" r="2" fill="${dark}"/>`;
  } else if(type==='orchid'){
    // Раньше 5 одинаковых лепестков через равные 72° + два крупных
    // симметричных кружка-крапинки на губе визуально читались как мордочка
    // (два "глаза" над "подбородком") — классическая парейдолия, а не
    // орхидея. Настоящая орхидея (фаленопсис) устроена зеркально, а не по
    // кругу: один верхний чашелистик, два широких боковых лепестка примерно
    // на уровне центра, два узких нижних чашелистика — плюс губа снизу.
    // Верхний чашелистик
    g += `<g transform="rotate(0)"><path d="${petalPath(8,5.5)}" fill="${light}" stroke="${dark}" stroke-width=".45" transform="translate(0,-2)"/></g>`;
    // Два широких боковых лепестка, зеркально — у настоящего фаленопсиса это
    // самая заметная деталь всего цветка: не вытянутая капля, а почти круглые
    // "крылья" (ширина больше длины), доминирующие над остальными частями.
    [-1,1].forEach(s => {
      g += `<g transform="rotate(${s*58})"><path d="${petalPath(7.5,10)}" fill="${pg.url}" stroke="${dark}" stroke-width=".45" transform="translate(0,-2.2)"/></g>`;
    });
    // Два узких нижних чашелистика, зеркально
    [-1,1].forEach(s => {
      g += `<g transform="rotate(${s*132})"><path d="${petalPath(8,5)}" fill="${pg.url}" stroke="${dark}" stroke-width=".4" transform="translate(0,-1.8)"/></g>`;
    });
    // Губа (лабеллум) — вытянута вниз, с небольшим острым выступом вместо
    // гладкого блина, и только ОДНА небольшая асимметричная крапинка вместо
    // пары "глаз" — этого достаточно, чтобы разрушить эффект лица
    g += `<path d="M -4.5 3.5 C -5 7 -2 9.5 0 9.8 C 2 9.5 5 7 4.5 3.5 C 4.5 1.2 2.2 -0.8 0 -0.6 C -2.2 -0.8 -4.5 1.2 -4.5 3.5 Z" fill="${lighten(color,16)}" stroke="${dark}" stroke-width=".5"/>`;
    g += `<circle cx="1.1" cy="4.6" r=".55" fill="${darken(color,20)}" opacity=".55"/>`;
    g += `<circle cx="0" cy="0" r="1.6" fill="${dark}"/>`;
  } else if(type==='sunflower'){
    // лепестки-слёзы вместо ромбов + спиральная (золотой угол) текстура семечек
    // в середине — та же природная закономерность, что и в общей раскладке букета
    const count=13;
    for(let i=0;i<count;i++){
      const a = (i/count)*360;
      g += `<g transform="rotate(${a})"><path d="${petalPath(9,4.6)}" fill="${pg.url}" stroke="${dark}" stroke-width=".35" transform="translate(0,-4.5)"/></g>`;
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
  // затем крутим и масштабируем строго вокруг этой самой точки — без сюрпризов рендера.
  // <defs> с градиентом кладём тут же, рядом с использующим его <g> — в SVG defs
  // не обязаны идти перед разметкой, которая на них ссылается.
  return `<defs>${pg.defs}</defs><g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${scale})">${g}</g>`;
}

// Наполнитель букета: мелкая зелень и веточки гипсофилы (белые "облачка" из
// точек), разбросанные между основными цветами золотым углом (та же
// закономерность, что и у самих голов букета в buildBouquetSVG) — придаёт
// пышность и заполняет "пустоты" между крупными цветами, как у настоящего
// собранного флористом букета, а не просто у пары одиночных бутонов.
function fillerSpray(cx, domeCenterY, domeR, n){
  // При 1-2 цветках наполнителю (веточки/мелкие соцветия между головками)
  // нечем замаскироваться — вместо фоновой текстуры он читается отдельным
  // случайным пятном рядом с цветком. Есть смысл только когда самих цветов
  // уже достаточно, чтобы наполнитель лёг именно между ними, а не сам по себе.
  if(n < 3) return '';
  const count = Math.min(9, 4 + Math.round(n*0.9));
  const GOLDEN = 137.508 * Math.PI/180;
  let s = '';
  for(let i=0;i<count;i++){
    const r = domeR * (0.1 + 0.62*((i+0.5)/count));
    const a = i*GOLDEN + 2.4; // сдвиг фазы — чтобы не совпадать с точками самих цветов
    const x = cx + r*Math.cos(a);
    const y = domeCenterY + r*Math.sin(a)*0.85 - 3;
    if(i%2===0){
      const rot = (a*180/Math.PI) % 360;
      s += `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0,2 C-3.4,-2 -3.2,-8 0,-12 C3.2,-8 3.4,-2 0,2 Z" fill="#7C9A6B" stroke="#4F6B45" stroke-width=".4"/></g>`;
    } else {
      [[-2,-1],[2.2,-2.4],[0,-5.4],[-1.4,1.2]].forEach(([dx,dy])=>{
        s += `<circle cx="${x+dx}" cy="${y+dy}" r="1.4" fill="#FBF6EA" stroke="#DFCBA0" stroke-width=".3"/>`;
      });
    }
  }
  return s;
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
  if(type==='E'){
    // плетёная корзина — отдельно от карты цветов вверху (как и мраморная):
    // это не гладкая заливка, а "полосы" плетения, изогнутые дугой, чтобы
    // читаться как обхват вокруг круглой корзины, а не ряд прямых линий
    const basket = '#C99A5B', basketDark = '#8F6B36', basketLight = lighten('#C99A5B', 20);
    let weave = '';
    for(let i=0;i<7;i++){
      const yy = topY + 9 + i*11.5;
      const wRatio = 1 - (i/7)*0.12; // корзина чуть сужается книзу — полосы тоже короче
      weave += `<path d="M ${cx-39*wRatio} ${yy} Q ${cx} ${yy+3} ${cx+39*wRatio} ${yy}" fill="none" stroke="${basketDark}" stroke-width="2.6" opacity=".28" stroke-linecap="round"/>`;
    }
    return `<path d="M ${cx-40} ${topY+2} L ${cx-30} ${topY+90} L ${cx+30} ${topY+90} L ${cx+40} ${topY+2} Z" fill="${basket}" stroke="${basketDark}" stroke-width="1"/>
      ${weave}
      <ellipse cx="${cx}" cy="${topY}" rx="42" ry="9" fill="${basketLight}" stroke="${basketDark}" stroke-width="1.5"/>
      <ellipse cx="${cx}" cy="${topY}" rx="42" ry="9" fill="none" stroke="${basketDark}" stroke-width=".7" opacity=".5"/>`;
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

// Подвеска на ленте — необязательный аксессуар (state.charm). Не пустое
// украшение: форма и цвет берутся от самого повода (та же логика, что и у
// иконок в шаге "Повод", см. OCCASION_ICON) — сердце для "Любви", звезда
// для дня рождения и т.д., так что подвеска что-то значит, а не просто висит.
const CHARM_SHAPE = {
  love:'heart', foryou:'heart',
  birthday:'star', congrats:'star',
  thanks:'gift', sorry:'leaf', justbecause:'leaf'
};
function bouquetCharmSvg(cx, y, occasionId){
  const occ = occasionById(occasionId);
  const shape = CHARM_SHAPE[occ.id] || 'heart';
  const color = occ.color, dark = darken(color, 30);
  const stringColor = '#8F6B36';
  // Металлическое колечко-крепление — тёплое золото, независимо от цвета
  // самой подвески (как у настоящей бижутерии, где эмаль/камень одного
  // цвета, а оправа/колечко — металл). Без этого штриха подвеска просто
  // "прилеплена" к нитке, а не подвешена, как физический предмет.
  const ringDark = '#8A6423';
  // Тот же радиальный градиент, что и у лепестков цветов (petalGradient) —
  // светлый блик со сдвигом к одному краю вместо плоской заливки, это и
  // отличает объёмный предмет от силуэта-стикера.
  const pg = petalGradient(color);
  const filterId = 'charmShadow' + Math.random().toString(36).slice(2,8);
  const tx = cx + 15, ty = y + 17; // чуть вбок и ниже узла, как будто подвязана отдельной нитью поверх хвостиков ленты
  const highlight = `<ellipse cx="-2.2" cy="-2.4" rx="1.5" ry=".8" fill="#FFFFFF" opacity=".5" transform="rotate(-25)"/>`;
  let body = '';
  if(shape==='heart'){
    body = `<path d="M0,7 C-8,0 -7,-8 0,-3 C7,-8 8,0 0,7 Z" fill="${pg.url}" stroke="${dark}" stroke-width="1"/>${highlight}`;
  } else if(shape==='star'){
    const pts = [];
    for(let i=0;i<5;i++){
      const a1 = -Math.PI/2 + i*(2*Math.PI/5);
      const a2 = a1 + Math.PI/5;
      pts.push(`${(7*Math.cos(a1)).toFixed(1)},${(7*Math.sin(a1)).toFixed(1)}`);
      pts.push(`${(2.8*Math.cos(a2)).toFixed(1)},${(2.8*Math.sin(a2)).toFixed(1)}`);
    }
    body = `<polygon points="${pts.join(' ')}" fill="${pg.url}" stroke="${dark}" stroke-width="1"/>${highlight}`;
  } else if(shape==='gift'){
    body = `<rect x="-6" y="-5" width="12" height="10" rx="1.5" fill="${pg.url}" stroke="${dark}" stroke-width="1"/><rect x="-1" y="-5" width="2" height="10" fill="${dark}" opacity=".7"/><rect x="-6" y="-1.5" width="12" height="2" fill="${dark}" opacity=".7"/><ellipse cx="-3.2" cy="-3" rx="1.3" ry=".8" fill="#FFFFFF" opacity=".4"/>`;
  } else { // leaf
    body = `<path d="M0,7 C-6,4 -6,-4 0,-7 C6,-4 6,4 0,7 Z" fill="${pg.url}" stroke="${dark}" stroke-width="1"/><path d="M0,6 L0,-6" stroke="${dark}" stroke-width=".5" opacity=".5"/>${highlight}`;
  }
  return `<defs>
    ${pg.defs}
    <filter id="${filterId}" x="-80%" y="-80%" width="260%" height="260%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#2F3B2A" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g>
    <path d="M ${cx+2} ${y+3} Q ${cx+10} ${y+10} ${tx} ${ty-15}" stroke="${stringColor}" stroke-width=".9" fill="none" opacity=".8"/>
    <g transform="translate(${tx} ${ty}) rotate(18)" filter="url(#${filterId})">
      <ellipse cx="0" cy="-11" rx="2.6" ry="3.4" fill="none" stroke="${ringDark}" stroke-width="1.1"/>
      ${body}
    </g>
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

  // купол букета: радиус растёт с количеством цветов, но всегда остаётся внутри холста.
  // Меньше прежнего — чем плотнее радиус, тем сильнее головки цветов
  // перекрывают друг друга и тем "пышнее" читается купол; широкий радиус
  // наоборот раскидывает цветы редкой россыпью с пустотами между ними.
  const domeR = n>0 ? Math.min(size*0.27, size*0.085 + Math.sqrt(n)*7.2) : 0;
  // купол подтянут ближе к вазе, но не вплотную — при большом числе цветов
  // нужен запас по высоте, иначе плотный купол ложится прямо на горлышко.
  // 0.33, а не прежние 0.27 (выше = ближе к верху холста): при паре цветов
  // (маленький купол) над ним оставалось ~74px пустого холста в карточке
  // предпросмотра — букет читался мелким и "подвешенным" в воздухе, а не
  // собранным у вазы. Проверено на обоих концах диапазона: при 2 цветках
  // отступ сверху ~54px (было 74), при максимуме (7 типов×5=35 головок,
  // самый большой купол) — ~27px, без обрезки по верхнему краю холста.
  const domeCenterY = vaseTopY - size*0.33;

  const GOLDEN = 137.508 * Math.PI/180;
  const pts = heads.map((h,i)=>{
    // золотой угол раскладывает точки плотным равномерным кругом, а не рядом в линию —
    // именно так растения/бутоны укладываются в реальном собранном букете.
    // степень 0.62 (а не 0.5) стягивает точки чуть ближе к центру, чтобы бутоны
    // перекрывались и слипались в единую массу, а не просто стояли рядом
    const r = n>1 ? domeR*Math.pow((i+0.5)/n, 0.62) : 0;
    const a = i*GOLDEN;
    const x = cx + r*Math.cos(a);
    // 0.85, а не почти круглые 1.0 — купол чуть приплюснут по вертикали,
    // читается как букет, а не шар, но раньше (0.7) был слишком плоским и
    // широким: при плотной посадке цветы почти не давали высоты, только ширину
    const y = domeCenterY + r*Math.sin(a)*0.85;
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

  const filler = fillerSpray(cx, domeCenterY, domeR, n);

  // головки цветов — от дальних (верх купола) к ближним (низ купола), чтобы передние перекрывали задние
  pts.slice().sort((a,b)=>a.y-b.y).forEach(p=>{
    const rot = (p.x-cx)*0.3;
    // ×1.35 — головки цветов были слишком мелкими относительно вазы и
    // "терялись" в композиции; крупнее и плотнее сидящие друг к другу
    // головки — то, что отличает настоящий букет от пары воткнутых бутонов
    headsSvg += flowerHead(p.type, p.x, p.y, p.color, rot, Math.max(0.78, p.scale) * 1.35);
  });

  const vase = vaseSvg(cfg.vase, cx, vaseTopY);
  const leaves = n > 0 ? leafSpray(cx, tieY) : '';
  const bow = ribbonBow(cx, vaseTopY-2, cfg.ribbon);
  const charm = cfg.charm ? bouquetCharmSvg(cx, vaseTopY-2, cfg.occasion) : '';
  // мягкая тень под вазой — без неё композиция выглядела "приклеенной" к верху холста
  const shadow = `<ellipse cx="${cx}" cy="${vaseTopY+94}" rx="46" ry="7" fill="#000000" opacity=".08"/>`;
  // Мягкая тень под каждой головкой цветка — раньше светлые/кремовые лепестки
  // (белая ромашка/гвоздика и т.п.) визуально сливались с фоном карточки,
  // у которой похожий тёплый кремовый тон. Тень даёт край независимо от того,
  // насколько светлый выбран цвет — работает для любого оттенка, а не только
  // для конкретных "проблемных" цветов.
  const headsFilterId = 'bqShadow' + Math.random().toString(36).slice(2,8);
  // Высота холста и была ×1.15 от ширины — сама композиция (купол цветов +
  // ваза + тень) заканчивается заметно раньше низа при любой вазе (тень —
  // самая нижняя точка — это vaseTopY+101, у самой высокой вазы всего
  // vaseTopY+95), так что снизу оставался ~17% пустого холста. ×1.03 —
  // с запасом под тень, но без лишнего воздуха, из-за которого букет в
  // карточке предпросмотра выглядел мельче и пустее, чем плотная левая колонка.
  return `<svg viewBox="0 0 ${size} ${size*1.03}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;" role="img" aria-label="${t('Букет цветов')}">
    <defs>
      <filter id="${headsFilterId}" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.6" flood-color="#2F3B2A" flood-opacity="0.4"/>
      </filter>
    </defs>
    ${shadow}
    ${stemsSvg}
    <g filter="url(#${headsFilterId})">${filler}${headsSvg}</g>
    ${vase}
    ${leaves}
    ${bow}
    ${charm}
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

// Русское склонение по числу — открытка/открытки/открыток. Ниже порога
// показа (CARD_COUNT_DISPLAY_THRESHOLD) счётчик и не запрашивается настолько
// точно, что там всегда 50+, но склонение всё равно нужно (51 — "открытка",
// 52 — "открытки", 55 — "открыток"), не одна фиксированная форма.
function pluralizeRu(n, one, few, many){
  const mod10 = n % 10, mod100 = n % 100;
  if(mod10===1 && mod100!==11) return one;
  if(mod10>=2 && mod10<=4 && (mod100<10 || mod100>=20)) return few;
  return many;
}
// Ниже этого числа счётчик на главной вообще не показываем — маленькое
// честное число ("создано 3 открытки") подрывает доверие сильнее, чем его
// отсутствие. Гостевые открытки раньше не считались вообще, так что счётчик
// стартует с нуля по факту введения этой фичи, а не подделывает прошлое.
const CARD_COUNT_DISPLAY_THRESHOLD = 50;
async function fetchHeroCardCount(){
  const el = document.getElementById('heroCardCount');
  if(!el) return;
  try{
    const res = await fetch('/api/stats');
    const json = await res.json();
    const n = json.cardsCreated || 0;
    if(n < CARD_COUNT_DISPLAY_THRESHOLD) return;
    const count = n.toLocaleString(uiLang==='ru'?'ru-RU':'en-US');
    const word = uiLang==='ru' ? pluralizeRu(n, 'открытка', 'открытки', 'открыток') : (n===1?'card':'cards');
    el.textContent = uiLang==='ru' ? `Уже создано ${count} ${word}` : `${count} ${word} created so far`;
  }catch(e){ /* тихо игнорируем — не критичная часть страницы */ }
}
// "Пинг" при успешном создании открытки — и гостевой, и сохранённой за
// аккаунтом (см. saveAndShare) — не блокирует основной поток и не важен,
// если не удался: это просто витринная цифра, а не часть сохранения открытки.
function pingCardCreated(){
  fetch('/api/stats/card-created', { method:'POST' }).catch(()=>{});
}

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
        <p id="heroCardCount" style="font-size:13px; opacity:.55; margin-top:10px;"></p>
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
          <div class="toggle-line" style="margin-top:18px; padding-top:18px; border-top:1px solid var(--line);">
            <div>
              <div style="font-size:14px;" id="charmLabel">${t('Подвеска на ленте')}</div>
              <div style="font-size:12px;opacity:.6;">${t('Форма и цвет — под ваш повод: сердце, звезда, лист…')}</div>
            </div>
            <div class="switch ${state.charm?'on':''}" id="charmSwitch" tabindex="0" role="switch" aria-checked="${state.charm}" aria-labelledby="charmLabel" onclick="toggleCharm()" onkeydown="activateOnKey(event)"><div class="dot"></div></div>
          </div>
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
        <a href="#group-new" class="topbar-link" style="display:inline-block;margin-top:16px;">${t('Или соберите её всей компанией →')}</a>
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

    <div class="legal-wrap" id="about" style="padding-top:10px; scroll-margin-top:24px;">
      <h2>${t('О сервисе')}</h2>
      <p>${t('VivoRose — это простой способ отправить тёплые слова не пустым текстом, а живой открыткой: соберите букет из цветов, ленты и вазы на свой вкус, добавьте короткое послание и отправьте всё одной ссылкой. Получатель открывает её как настоящую открытку — с разворотом конверта и постепенным цветением букета, без установки приложений.')}</p>

      <h2>${t('Нужна ли регистрация')}</h2>
      <p>${t('Нет — собрать и отправить открытку можно без аккаунта, вся она целиком умещается в самой ссылке. Регистрация нужна только если хотите, чтобы список ваших открыток сохранялся и был доступен с любого устройства.')}</p>

      <h2>${t('Это бесплатно?')}</h2>
      <p>${t('Да, полностью. Все цветы, вазы, ленты, конверты и фоны доступны бесплатно — сервис существует за счёт показа рекламных баннеров, а не платных подписок.')}</p>

      <h2>${t('Для каких поводов')}</h2>
      <p>${t('Дни рождения, признания в любви, слова благодарности, поздравления или просто открытка "потому что вспомнили о человеке" — под каждый повод есть свой набор цветов, цвет ленты и тон открытки.')}</p>
    </div>
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
  fetchHeroCardCount();
}

function leafIcon(){
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right:2px;" aria-hidden="true"><path d="M4 20C4 12 9 4 20 4C20 15 12 20 4 20Z" fill="#8CA087" stroke="#5C7457" stroke-width="1"/><path d="M4 20C8 15 12 11 18 6" stroke="#5C7457" stroke-width="1"/></svg>`;
}

// Открыта ли выпадающая панель "ещё" в шапке на узких экранах (RU/EN, тема,
// "О сервисе", "Мои открытки") — см. topbarHtml() и .topbar-more в main.css.
let topbarMenuOpen = false;
function toggleTopbarMenu(){ topbarMenuOpen = !topbarMenuOpen; renderRoute(); }
function closeTopbarMenu(){ if(topbarMenuOpen){ topbarMenuOpen = false; renderRoute(); } }
function menuIconSvg(){
  return `<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

// Общий топбар для всех "внутренних" страниц (конструктор, мои открытки,
// аккаунт, юридические страницы) — держит навигацию и состояние входа
// в одном месте, чтобы не дублировать разметку по страницам.
function topbarHtml(){
  return `<div class="topbar">
    <div class="brand" tabindex="0" role="link" onclick="goHome()" onkeydown="activateOnKey(event)" style="cursor:pointer;">${leafIcon()}${BRAND}</div>
    <div class="topbar-actions">
      <button class="topbar-menu-btn" onclick="toggleTopbarMenu()" aria-expanded="${topbarMenuOpen}" aria-label="${t('Меню')}">${menuIconSvg()}</button>
      <div class="topbar-more ${topbarMenuOpen?'open':''}" id="topbarMore">
        <div class="topbar-more-backdrop" onclick="if(event.target===this) closeTopbarMenu()"></div>
        <div class="topbar-more-panel">
          <div class="topbar-more-row">
            <div class="lang-switch" role="group" aria-label="Language / Язык">
              <button class="lang-btn ${uiLang==='ru'?'active':''}" aria-pressed="${uiLang==='ru'}" onclick="closeTopbarMenu();setLang('ru')">RU</button>
              <button class="lang-btn ${uiLang==='en'?'active':''}" aria-pressed="${uiLang==='en'}" onclick="closeTopbarMenu();setLang('en')">EN</button>
            </div>
            <button class="theme-toggle" onclick="closeTopbarMenu();toggleTheme()" aria-label="${uiTheme==='dark'?t('Включить светлую тему'):t('Включить тёмную тему')}" title="${uiTheme==='dark'?t('Включить светлую тему'):t('Включить тёмную тему')}">${themeIconSvg(uiTheme)}</button>
          </div>
          <a class="topbar-link" href="#" onclick="event.preventDefault();closeTopbarMenu();scrollToAbout()">${t('О сервисе')}</a>
          <a class="topbar-link" href="#mine" onclick="closeTopbarMenu()">${t('Мои открытки')}</a>
        </div>
      </div>
      ${session.user
        ? `<button onclick="location.hash='account'">${esc(session.user.name || session.user.email.split('@')[0])}</button>`
        : `<button onclick="location.hash='login'">${t('Войти')}</button>`}
    </div>
  </div>`;
}
// Ссылка "О сервисе" в шапке доступна на любой странице сайта — сам блок
// с описанием есть только на главной (renderCreator), поэтому если мы не там,
// сперва уходим на главную (как goHome), и только потом скроллим к блоку —
// иначе на, например, странице входа просто ничего не произошло бы.
function scrollToAbout(){
  const scroll = () => {
    const el = document.getElementById('about');
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  };
  if(location.pathname !== '/' || location.hash || location.search){
    history.replaceState(null, '', '/');
    renderRoute();
    requestAnimationFrame(scroll);
  } else {
    scroll();
  }
}
function footerHtml(){
  return `${BRAND} — ${t('соберите открытку за пару минут и отправьте ссылкой')} · <a href="#privacy">${t('Конфиденциальность')}</a> · <a href="#terms">${t('Условия использования')}</a> · <a href="mailto:vivorosesupport@gmail.com">${t('Написать нам')}</a>`;
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
// Кнопка показывает иконку того, во что переключит клик (не текущее состояние) —
// в светлой теме показываем луну ("нажми — станет тёмно"), в тёмной — солнце.
// Раньше иконка была тонким контуром 16px и терялась в интерфейсе — тут заливка
// сплошным цветом и покрупнее, чтобы кнопка сразу читалась как переключатель.
function themeIconSvg(theme){
  if(theme==='dark'){
    return `<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4.3" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="10" y1="1.2" x2="10" y2="3.6"/><line x1="10" y1="16.4" x2="10" y2="18.8"/><line x1="1.2" y1="10" x2="3.6" y2="10"/><line x1="16.4" y1="10" x2="18.8" y2="10"/><line x1="3.9" y1="3.9" x2="5.6" y2="5.6"/><line x1="14.4" y1="14.4" x2="16.1" y2="16.1"/><line x1="3.9" y1="16.1" x2="5.6" y2="14.4"/><line x1="14.4" y1="5.6" x2="16.1" y2="3.9"/></g></svg>`;
  }
  return `<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M17.5 12.8A7.3 7.3 0 1 1 7.2 2.5 5.8 5.8 0 0 0 17.5 12.8Z" fill="currentColor"/></svg>`;
}

function vaseThumbSvg(type){
  if(type==='A') return `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true"><path d="M6 6C4 18 6 32 17 32C28 32 30 18 28 6L23 3L11 3Z" fill="#C97B5A" stroke="#9B5738" stroke-width="1"/><ellipse cx="17" cy="6" rx="6" ry="1.6" fill="#E3A583"/></svg>`;
  if(type==='B') return `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true"><path d="M10 3L8 32L26 32L24 3Z" fill="#EDE7DA" opacity=".55" stroke="#B9AF9B" stroke-width="1"/><ellipse cx="17" cy="3" rx="7" ry="1.6" fill="#F5F1E6" stroke="#B9AF9B" stroke-width=".8"/></svg>`;
  if(type==='D') return `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true"><path d="M8 8L6 32L28 32L26 8Z" fill="#EDEBE4" stroke="#B7B2A6" stroke-width="1"/><path d="M10 14Q17 20 20 28" stroke="#C9C2B4" stroke-width="1" fill="none"/><ellipse cx="17" cy="8" rx="9" ry="1.8" fill="#F5F3ED" stroke="#B7B2A6" stroke-width="1"/></svg>`;
  if(type==='E') return `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true"><path d="M8 8L6 32L28 32L26 8Z" fill="#C99A5B" stroke="#8F6B36" stroke-width="1"/><path d="M8 15Q17 17.5 26 15" stroke="#8F6B36" stroke-width="1.2" opacity=".4" fill="none"/><path d="M7.3 22.5Q17 25 26.7 22.5" stroke="#8F6B36" stroke-width="1.2" opacity=".4" fill="none"/><ellipse cx="17" cy="8" rx="9" ry="1.8" fill="#DDB876" stroke="#8F6B36" stroke-width="1"/></svg>`;
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
  state.flowers[id].count = Math.max(0, Math.min(MAX_FLOWERS_PER_TYPE, v));
  if(state.flowers[id].count===0) delete state.flowers[id];
  renderFlowerRows(); renderFlowerSummary(); renderPreviewBouquet();
}
function toggleMusic(){
  state.music=!state.music;
  const el = document.getElementById('musicSwitch');
  el.classList.toggle('on'); el.setAttribute('aria-checked', state.music);
  document.getElementById('melodyInline').classList.toggle('show');
}
function toggleCharm(){
  state.charm=!state.charm;
  const el = document.getElementById('charmSwitch');
  el.classList.toggle('on'); el.setAttribute('aria-checked', state.charm);
  renderPreviewBouquet(); // сама подвеска рисуется внутри букета — превью нужно перерисовать
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
  state.charm = Math.random() < 0.4;
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
    music: state.music, melody: state.melody, charm: state.charm,
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
  // независимо от того, получится ли короткая ссылка ниже
  try{
    let list = [];
    try{ list = JSON.parse(localStorage.getItem('my-cards') || '[]'); }catch(e){ list = []; }
    list.unshift({ id: uid(), occasion: state.occasion, to: state.to, createdAt: payload.createdAt, data: encoded });
    localStorage.setItem('my-cards', JSON.stringify(list.slice(0,50)));
  }catch(e){ /* не критично, если локальное хранилище недоступно */ }

  // Короткая ссылка и для гостей — сервер хранит открытку временно, без
  // привязки к аккаунту (см. server/routes/guestCards.js), и сам удалит её
  // по истечении срока. Это удобство, не обещанная функция — если запрос не
  // прошёл (лимит запросов, сеть недоступна), молча остаёмся на длинной
  // самодостаточной ссылке, как и раньше.
  try{
    const res = await fetch('/api/guest-cards', {
      method: 'POST', headers: {'Content-Type':'application/json', 'X-Lang':uiLang},
      body: JSON.stringify({ encodedData: encoded, occasion: state.occasion, to: state.to, from: state.from })
    });
    if(res.ok){
      const json = await res.json();
      if(json.card && json.card.shortId){
        renderShareScreen(location.origin + '/c/' + json.card.shortId, json.card.expiresAt);
        return;
      }
    }
  }catch(e){ /* сеть недоступна — используем длинную ссылку как запасной вариант */ }

  renderShareScreen(longUrl);
}

// Дату истечения гостевой ссылки форматируем на клиенте (а не шлём готовую
// строку с сервера) — сервер уже локализует ошибки через X-Lang, но здесь
// проще переиспользовать текущий uiLang напрямую, без похода на бэкенд.
function guestExpiryText(expiresAt){
  if(!expiresAt) return t('Открытка хранится на сервере ограниченное время и будет автоматически удалена.');
  const dateStr = new Date(expiresAt).toLocaleDateString(uiLang === 'ru' ? 'ru-RU' : 'en-US', { day:'numeric', month:'long', year:'numeric' });
  const trailingDot = dateStr.endsWith('.') ? '' : '.';
  return t('Ссылка временная: открытка будет автоматически удалена с сервера') + ' ' + dateStr + trailingDot;
}
function shareFootnote(isShortLink, isGuestShortLink){
  if(isShortLink && !isGuestShortLink){
    return t('Это короткая ссылка: сама открытка хранится на сервере в вашем аккаунте, а ссылка лишь указывает на неё.')
      + ' ' + t('Копия также сохранена в разделе «Мои открытки» вашего аккаунта.');
  }
  if(isGuestShortLink){
    return t('Это короткая ссылка: открытка временно хранится на сервере без привязки к аккаунту, а ссылка лишь указывает на неё.')
      + ' ' + t('Войдите в аккаунт, чтобы открытка сохранялась без срока и не потерялась.');
  }
  return t('Ссылка полностью самодостаточна: вся открытка «зашита» в неё, отдельный сервер для её открытия не нужен.')
    + (session.user ? '' : ' ' + t('Войдите в аккаунт, чтобы копия сохранялась и не терялась при очистке браузера.'));
}
function renderShareScreen(url, expiresAt){
  // Единая точка для всех путей saveAndShare (аккаунт/гость/сетевой фолбэк на
  // длинную ссылку) — открытка успешно собрана и готова к отправке, значит
  // "создана" независимо от того, какой именно веткой сюда попали.
  // expiresAt приходит только для гостевой короткой ссылки (см. вызов в
  // saveAndShare) — открытки за аккаунтом и длинные самодостаточные ссылки
  // не истекают, поэтому для них он не передаётся.
  pingCardCreated();
  setPageTitle(t('Открытка готова'));
  const isLong = url.length > LINK_WARN_LENGTH;
  const isShortLink = /\/c\/[A-Za-z0-9]+$/.test(url);
  const isGuestShortLink = isShortLink && !session.user;
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
      ${isGuestShortLink ? `<div class="link-warn">${guestExpiryText(expiresAt)}</div>` : ''}
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
      <p style="font-size:12.5px;opacity:.5;margin-top:30px;">${shareFootnote(isShortLink, isGuestShortLink)}</p>
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

/* ====================== GROUP CARD (открытка всей компанией) ======================
   Организатор (обязательно вошедший в аккаунт — см. server/routes/group.js)
   задаёт только повод и вазу — сообщение и цветы приходят от участников по
   ссылке-приглашению (/group/<id>), подписать может кто угодно без аккаунта.
   Черновик живёт на сервере (см. server/db.js), поэтому у экрана два
   состояния: "открыта для подписей" (форма добавления + список кто уже
   подписал, и кнопка закрытия у организатора) и "закрыта" (просмотр, как
   обычная открытка, но с несколькими сообщениями вместо одного). Закрывает
   организатор сам, вручную, с любого устройства — не по заранее выбранному
   сроку. v1: без модерации подписей. */

const groupState = { to:'', occasion:'birthday', vase:'A' };

function renderGroupCreate(){
  // Создавать открытку "всей компанией" может только вошедший в аккаунт
  // организатор (см. server/routes/group.js) — иначе закрыть её позже было бы
  // просто неоткуда. Подписывать открытку по ссылке аккаунт по-прежнему не нужен.
  if(!session.user){ pendingRoute = 'group-new'; location.hash = 'login'; return; }
  setPageTitle(t('Собрать всей компанией'));
  const occ = occasionById(groupState.occasion);
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="mine-wrap">
      <div class="eyebrow">${t('вместе')}</div>
      <h1 style="font-size:26px;margin-top:8px;">${t('Собрать открытку всей компанией')}</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;line-height:1.6;">${t('Вы задаёте основу — повод и вазу. Дальше отправьте ссылку остальным: каждый добавит своё имя, пожелание и один цветок. Букет соберётся из цветов всех участников — вы сами закроете приём подписей, когда решите, что открытка готова.')}</p>

      <div style="max-width:180px;margin:20px auto 0;text-align:center;">
        <div class="preview-card" style="padding:16px 12px;" id="groupCreatePreview"></div>
        <p style="opacity:.55;font-size:12px;margin-top:8px;line-height:1.5;">${t('Букет пока пуст — его наполнят цветами те, кто подпишет открытку')}</p>
      </div>

      <div class="panel" style="margin-top:24px;">
        <span class="field-label">${t('Кому')}</span>
        <input type="text" id="groupTo" maxlength="30" placeholder="${t('Имя получателя')}" value="${esc(groupState.to)}">
      </div>

      <div class="panel">
        <span class="field-label">${t('Повод')}</span>
        <div class="chip-row" id="groupOccasionChips"></div>
      </div>

      <div class="panel">
        <span class="field-label">${t('Ваза')}</span>
        <div class="vase-row" id="groupVaseChips"></div>
      </div>

      <div class="cta-row">
        <button class="btn btn-primary" id="groupCreateBtn" onclick="createGroupCardSubmit()">${t('Создать ссылку-приглашение')}</button>
      </div>
      <div class="auth-error" id="groupCreateError"></div>
    </div>
    <footer class="site-footer">${footerHtml()}</footer>
  `;

  document.getElementById('groupTo').oninput = e => { groupState.to = e.target.value; };

  document.getElementById('groupOccasionChips').innerHTML = OCCASIONS.map(o =>
    `<div class="chip ${groupState.occasion===o.id?'active':''}" tabindex="0" role="button" aria-pressed="${groupState.occasion===o.id}" onclick="setGroupOccasion('${o.id}')" onkeydown="activateOnKey(event)">
      <span class="chip-ic">${occasionIconSvg(o.id, groupState.occasion===o.id ? '#FAF3E7' : o.color)}</span>${tr(o.label)}
    </div>`
  ).join('');

  document.getElementById('groupVaseChips').innerHTML = VASES.map(v =>
    `<div class="vase-chip ${groupState.vase===v.id?'active':''}" tabindex="0" role="button" aria-pressed="${groupState.vase===v.id}" aria-label="${tr(v.label)}" onclick="setGroupVase('${v.id}')" onkeydown="activateOnKey(event)">
      ${vaseThumbSvg(v.id)}<span>${tr(v.label)}</span>
    </div>`
  ).join('');

  // Пустой букет (ещё без цветов от участников) — только чтобы организатор
  // сразу видел выбранную вазу/ленту, а не гадал вслепую до самой отправки.
  document.getElementById('groupCreatePreview').innerHTML = buildBouquetSVG({ flowers:{}, vase: groupState.vase, ribbon: occ.color }, 150);
}
function setGroupOccasion(id){ groupState.occasion=id; renderGroupCreate(); }
function setGroupVase(id){ groupState.vase=id; renderGroupCreate(); }

async function createGroupCardSubmit(){
  const to = groupState.to.trim();
  const errEl = document.getElementById('groupCreateError');
  errEl.textContent = '';
  if(!to){ errEl.textContent = t('Введите имя получателя'); return; }
  const btn = document.getElementById('groupCreateBtn');
  btn.disabled = true;
  try{
    const res = await fetch('/api/group', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Lang':uiLang},
      body: JSON.stringify({ to, occasion: groupState.occasion, vase: groupState.vase })
    });
    const json = await res.json();
    if(!res.ok) throw new Error(json.error || t('Не удалось создать открытку'));
    history.pushState(null, '', '/group/' + json.group.shortId);
    renderRoute();
  }catch(e){
    errEl.textContent = e.message;
  }finally{
    btn.disabled = false;
  }
}

// Собирает cfg.flowers для buildBouquetSVG из подписей: у формата buildBouquetSVG
// один цвет на тип цветка, а не на подпись — если двое выбрали один и тот же
// тип разными цветами, в букете останется цвет последнего (упрощение для v1:
// букет всё равно растёт с каждой подписью, просто не у каждого лепестка свой
// оттенок при совпадении типа).
function mergeGroupFlowers(contributions){
  const flowers = {};
  contributions.forEach(c => {
    flowers[c.flowerType] = { color: c.flowerColor, count: (flowers[c.flowerType] ? flowers[c.flowerType].count : 0) + 1 };
  });
  return flowers;
}

const groupJoinPick = { name:'', message:'', flowerType: FLOWER_TYPES[0].id, flowerColor: FLOWER_TYPES[0].colors[0] };

async function renderGroupPage(shortId){
  setPageTitle(t('Открытка всей компанией'));
  document.getElementById('app').innerHTML = `${topbarHtml()}<div class="mine-wrap" id="groupPageBody"><p style="opacity:.6;">${t('Загрузка…')}</p></div><footer class="site-footer">${footerHtml()}</footer>`;
  try{
    const res = await fetch('/api/group/' + encodeURIComponent(shortId));
    if(!res.ok) throw new Error('not_found');
    const json = await res.json();
    renderGroupPageBody(shortId, json.group);
  }catch(e){
    const body = document.getElementById('groupPageBody');
    if(body) body.innerHTML = `
      <h1 style="font-size:22px;">${t('Открытка не найдена')}</h1>
      <p style="opacity:.7;margin-top:8px;">${t('Ссылка повреждена или открытка уже удалена.')}</p>`;
  }
}

function renderGroupPageBody(shortId, group){
  const el = document.getElementById('groupPageBody');
  if(!el) return; // ушли со страницы, пока грузился fetch
  const occ = occasionById(group.occasion);
  const bouquetSvg = buildBouquetSVG({ flowers: mergeGroupFlowers(group.contributions), vase: group.vase, ribbon: occ.color }, 260);

  if(group.closed){
    el.innerHTML = `
      <div class="eyebrow" style="text-align:center;display:block;">${t('вместе')}</div>
      <div style="text-align:center;">
        <div class="view-occasion-band" style="background:${occ.color};color:var(--pale);">${tr(occ.stamp)}</div>
      </div>
      <h1 style="font-size:22px;margin-top:14px;text-align:center;">${esc(group.to)}</h1>
      <div class="preview-card" style="max-width:260px;margin:16px auto 0;padding:18px;">${bouquetSvg}</div>
      <p style="opacity:.6;font-size:13px;margin-top:10px;text-align:center;">${t('Приём подписей завершён')} · ${group.contributions.length} ${t('подписал(и)')}</p>
      <div class="mine-list" style="margin-top:24px;">
        ${group.contributions.map(c => `
          <div class="mine-row" style="align-items:flex-start;">
            <div class="mine-info">
              <div class="mi-to" style="font-family:'Fraunces',serif;font-size:16px;white-space:pre-wrap;">${esc(c.message)}</div>
              <div class="mi-date">— ${esc(c.name)}</div>
            </div>
          </div>`).join('') || `<p style="text-align:center;opacity:.6;">${t('Пока никто не подписал — станьте первым')}</p>`}
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="eyebrow" style="text-align:center;display:block;">${t('вместе')}</div>
    <h1 style="font-size:24px;margin-top:8px;text-align:center;">${esc(group.to)}</h1>
    <p style="opacity:.7;font-size:13px;margin-top:4px;text-align:center;">${t('Открыта для подписей')}</p>

    <p style="text-align:center;font-size:12px;letter-spacing:.04em;text-transform:uppercase;opacity:.5;margin-top:22px;">${t('Букет')} · ${group.contributions.length} ${t('подписал(и)')}</p>
    <div class="preview-card" style="max-width:220px;margin:8px auto 0;padding:16px;">${bouquetSvg}</div>
    <p style="text-align:center;opacity:.6;font-size:13px;margin-top:8px;">
      ${group.contributions.length ? group.contributions.map(c=>esc(c.name)).join(', ') : t('Пока никто не подписал — станьте первым')}
    </p>

    ${group.isOwner ? `
    <div class="panel" style="margin-top:24px;">
      <span class="panel-title" style="display:block;">${t('Вы организатор')}</span>
      <p style="opacity:.65;font-size:13px;margin-top:8px;line-height:1.5;">${t('Когда открытка будет готова, закройте приём подписей — после этого добавить строку будет уже нельзя. Управлять этой открыткой можно и позже, из своего аккаунта.')}</p>
      <button class="btn btn-ghost" style="width:100%;margin-top:14px;" id="groupCloseBtn" onclick="closeGroupCardSubmit('${shortId}')">${t('Закрыть приём подписей')}</button>
    </div>` : ''}

    <div class="panel" style="margin-top:${group.isOwner?'18':'24'}px;">
      <button class="btn btn-ghost" style="width:100%;" onclick="copyGroupInviteLink('${shortId}')">${t('Скопировать ссылку-приглашение')}</button>
    </div>

    <div class="panel">
      <span class="panel-title" style="display:block;margin-bottom:6px;">${t('Добавить свою подпись')}</span>
      <p style="opacity:.6;font-size:12.5px;margin-bottom:14px;line-height:1.5;">${t('Каждый добавляет своё имя, пожелание и один цветок — вместе они и складываются в букет выше.')}</p>
      <label class="sr-only" for="groupJoinName">${t('Ваше имя')}</label>
      <input type="text" id="groupJoinName" maxlength="30" placeholder="${t('Ваше имя')}" value="${esc(groupJoinPick.name)}" style="margin-bottom:12px;">
      <label class="sr-only" for="groupJoinMessage">${t('Ваше пожелание')}</label>
      <textarea id="groupJoinMessage" maxlength="300" placeholder="${t('Ваше пожелание')}" style="margin-bottom:16px;">${esc(groupJoinPick.message)}</textarea>

      <span class="field-label">${t('Выберите один цветок в букет')}</span>
      <div class="vase-row" id="groupFlowerTypeChips"></div>
      <div class="swatches" id="groupFlowerColorSwatches" style="margin-top:12px;"></div>

      <button class="btn btn-primary" style="width:100%;margin-top:18px;" id="groupJoinBtn" onclick="submitGroupJoin('${shortId}')">${t('Добавить в открытку')}</button>
      <div class="auth-error" id="groupJoinError"></div>
    </div>
  `;

  document.getElementById('groupJoinName').oninput = e => { groupJoinPick.name = e.target.value; };
  document.getElementById('groupJoinMessage').oninput = e => { groupJoinPick.message = e.target.value; };
  renderGroupFlowerPicker(shortId);
}

async function closeGroupCardSubmit(shortId){
  const btn = document.getElementById('groupCloseBtn');
  if(btn) btn.disabled = true;
  try{
    const res = await fetch('/api/group/' + encodeURIComponent(shortId) + '/close', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Lang':uiLang}
    });
    const json = await res.json();
    if(!res.ok) throw new Error(json.error || t('Не удалось закрыть открытку'));
    showToast(t('Приём подписей закрыт'));
    renderGroupPageBody(shortId, json.group);
  }catch(e){
    showToast(e.message);
    if(btn) btn.disabled = false;
  }
}

function renderGroupFlowerPicker(shortId){
  document.getElementById('groupFlowerTypeChips').innerHTML = FLOWER_TYPES.map(f =>
    `<div class="vase-chip ${groupJoinPick.flowerType===f.id?'active':''}" tabindex="0" role="button" aria-pressed="${groupJoinPick.flowerType===f.id}" aria-label="${tr(f.label)}" onclick="setGroupJoinFlowerType('${shortId}','${f.id}')" onkeydown="activateOnKey(event)">
      ${flowerThumbSvg(f.id, groupJoinPick.flowerType===f.id ? groupJoinPick.flowerColor : f.colors[0])}<span>${tr(f.label)}</span>
    </div>`
  ).join('');
  const ft = FLOWER_TYPES.find(f=>f.id===groupJoinPick.flowerType);
  document.getElementById('groupFlowerColorSwatches').innerHTML = ft.colors.map((c,i) =>
    `<div class="swatch ${groupJoinPick.flowerColor===c?'sel':''}" style="background:${c}" tabindex="0" role="button" aria-label="${t('Цвет')} №${i+1}" aria-pressed="${groupJoinPick.flowerColor===c}" onclick="setGroupJoinFlowerColor('${shortId}','${c}')" onkeydown="activateOnKey(event)"></div>`
  ).join('');
}
function setGroupJoinFlowerType(shortId, id){
  groupJoinPick.flowerType = id;
  groupJoinPick.flowerColor = FLOWER_TYPES.find(f=>f.id===id).colors[0];
  renderGroupFlowerPicker(shortId);
}
function setGroupJoinFlowerColor(shortId, c){
  groupJoinPick.flowerColor = c;
  renderGroupFlowerPicker(shortId);
}

function copyGroupInviteLink(shortId){
  const url = location.origin + '/group/' + shortId;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>showToast(t('Ссылка скопирована')));
  } else {
    showToast(url);
  }
}

async function submitGroupJoin(shortId){
  const name = groupJoinPick.name.trim();
  const message = groupJoinPick.message.trim();
  const errEl = document.getElementById('groupJoinError');
  errEl.textContent = '';
  if(!name || !message){
    errEl.textContent = t('Заполните имя и пожелание');
    return;
  }
  const btn = document.getElementById('groupJoinBtn');
  btn.disabled = true;
  try{
    const res = await fetch('/api/group/' + encodeURIComponent(shortId) + '/join', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Lang':uiLang},
      body: JSON.stringify({ name, message, flowerType: groupJoinPick.flowerType, flowerColor: groupJoinPick.flowerColor })
    });
    const json = await res.json();
    if(!res.ok) throw new Error(json.error || t('Не удалось добавить подпись'));
    groupJoinPick.name = ''; groupJoinPick.message = '';
    showToast(t('Спасибо! Ваша подпись добавлена.'));
    renderGroupPageBody(shortId, json.group);
  }catch(e){
    errEl.textContent = e.message;
  }finally{
    btn.disabled = false;
  }
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

      ${session.user ? `
      <h2 style="font-size:18px;margin-top:36px;font-family:'Fraunces',serif;font-weight:500;">${t('Открытки всей компанией')}</h2>
      <div class="mine-list" id="groupMineList" style="margin-top:16px;"><p style="opacity:.6;">${t('Загрузка…')}</p></div>` : ''}
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
  if(wrap){
    if(!list.length){
      wrap.innerHTML = `<div class="mine-empty">${t('Пока пусто. Соберите первую открытку — она появится здесь.')}</div>`;
    } else {
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
  }

  if(session.user) await renderMyGroupCards();
}

async function renderMyGroupCards(){
  let groups = [];
  try{
    const res = await fetch('/api/group');
    const json = await res.json();
    groups = json.groups || [];
  }catch(e){ groups = []; }

  const wrap = document.getElementById('groupMineList');
  if(!wrap) return; // ушли со страницы, пока шёл запрос
  if(!groups.length){
    wrap.innerHTML = `<div class="mine-empty">${t('Пока нет ни одной. Начните — ссылка «Собрать всей компанией» есть на главной.')}</div>`;
    return;
  }
  const dateLocale = uiLang === 'ru' ? 'ru-RU' : 'en-US';
  wrap.innerHTML = groups.map(g=>{
    const occ = occasionById(g.occasion) || OCCASIONS[0];
    const d = new Date(g.createdAt);
    const status = g.closed ? t('Закрыта') : t('Открыта для подписей');
    return `<div class="mine-row">
      <div class="mine-dot" style="background:${occ.color}"></div>
      <div class="mine-info">
        <div class="mi-to">${t('Для')} ${esc(g.to)}</div>
        <div class="mi-date">${d.toLocaleDateString(dateLocale,{day:'numeric',month:'long',year:'numeric'})} · ${status} · ${g.contributions.length} ${t('подписал(и)')}</div>
      </div>
      <div class="mine-actions">
        <button onclick="openGroupLink('${g.shortId}')">${t('Открыть')}</button>
        ${!g.closed ? `<button onclick="closeGroupFromList('${g.shortId}')">${t('Закрыть приём подписей')}</button>` : ''}
      </div>
    </div>`;
  }).join('');
}
function openGroupLink(shortId){
  history.pushState(null, '', '/group/' + shortId);
  renderRoute();
}
async function closeGroupFromList(shortId){
  try{
    const res = await fetch('/api/group/' + encodeURIComponent(shortId) + '/close', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Lang':uiLang}
    });
    const json = await res.json();
    if(!res.ok) throw new Error(json.error || t('Не удалось закрыть открытку'));
    showToast(t('Приём подписей закрыт'));
    renderMyGroupCards();
  }catch(e){
    showToast(e.message);
  }
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
      <h2>${t('Какие данные мы собираем')}</h2>
      <p>${t('Email и (опционально) имя — при регистрации аккаунта. Пароль хранится не в открытом виде, а в виде хеша. Содержимое собранных вами открыток (текст, выбор цветов и т.д.) — если вы вошли в аккаунт, чтобы список «Мои открытки» не терялся между устройствами.')}</p>

      <h2>${t('Как используются данные')}</h2>
      <p>${t('Для входа в аккаунт и отображения ваших открыток. Мы не продаём и не передаём email третьим лицам, кроме случаев, предусмотренных законом.')}</p>

      <h2>${t('Cookies и реклама')}</h2>
      <p>${t('Один cookie используется для авторизации и не служит для рекламного трекинга. Рекламные сети (например, Google AdSense) могут устанавливать собственные cookies для показа объявлений.')}</p>

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
  if(hash === '#group-new') return renderGroupCreate();

  const shortMatch = location.pathname.match(/^\/c\/([A-Za-z0-9]+)$/);
  if(shortMatch) return renderShortViewer(shortMatch[1]);

  const groupMatch = location.pathname.match(/^\/group\/([A-Za-z0-9]+)$/);
  if(groupMatch) return renderGroupPage(groupMatch[1]);

  const cardData = new URLSearchParams(location.search).get('data');
  if(cardData) return renderViewer(cardData);
  renderCreator();
}

// Полный сброс на главный конструктор: чистит и хэш, и ?data= в query-строке
// разом (одной history.replaceState), иначе после просмотра открытки ссылка
// вида "Создать свою" молча оставалась бы на месте — renderRoute() увидел бы
// прежний ?data= и снова показал бы ту же открытку.
function goHome(){
  history.replaceState(null, '', '/');
  renderRoute();
}

async function bootstrap(){
  document.documentElement.lang = uiLang; // статичный <html lang> в index.html — только запасной вариант до этой строки
  applyTheme();
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