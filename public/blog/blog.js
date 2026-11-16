// Клик по любой фразе в списке — копирует её текст в буфer обмена. Общий
// файл для всех статей блога (а не main.js — статьи не грузят SPA-скрипт,
// см. комментарий в index.html), поэтому язык подписи "Скопировано"/"Copied"
// берём из <html lang>, которое уже стоит правильно в каждом файле статьи.
(function(){
  var isEn = document.documentElement.lang === 'en';
  var hint = isEn ? 'Click to copy' : 'Нажмите, чтобы скопировать';
  var copiedHint = isEn ? 'Copied' : 'Скопировано';

  var COPY_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.5 10.5V3a1 1 0 0 1 1-1H11" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
  var CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5L6.3 12L13 4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Запасной путь — не только для старых браузеров без Clipboard API, но и
  // для случаев, когда сам API есть, а запись всё равно отклоняется
  // (NotAllowedError) — например, в некоторых автоматизированных/встроенных
  // браузерах политика буфера обмена строже, чем в обычном Chrome. execCommand
  // устаревший, но работает почти везде, где не сработал основной путь.
  function legacyCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }
  function copyText(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(text).catch(function(){ legacyCopy(text); });
    }
    legacyCopy(text);
    return Promise.resolve();
  }

  // Аналитика: на страницах блога стоит тот же счётчик GA4, что и на сайте
  // (gtag-init.js в <head>); gtag может отсутствовать (блокировщик) — тогда
  // события просто не уходят.
  function track(name, params){
    try{ if(typeof window.gtag === 'function') window.gtag('event', name, params || {}); }catch(e){}
  }

  // slug статьи (последний сегмент пути) и повод конструктора под неё (id из
  // OCCASIONS в main.js) — для кнопки "В открытку →" у каждой фразы.
  var slug = location.pathname.replace(/\/+$/, '').split('/').pop();
  var OCCASION_BY_SLUG = {
    'birthday-wishes': 'birthday', 'love-messages': 'love', 'thank-you-messages': 'thanks',
    'congrats-wishes': 'congrats', 'support-words': 'sorry', 'just-because-messages': 'justbecause',
    'sympathy-messages': 'sympathy', 'anniversary-wishes': 'love', 'get-well-wishes': 'sorry'
  };
  var occasion = OCCASION_BY_SLUG[slug] || null;

  var items = document.querySelectorAll('.wish-list li');
  items.forEach(function(li){
    var quote = li.textContent.trim();
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', hint);
    li.classList.add('wish-copyable');

    var icon = document.createElement('span');
    icon.className = 'wish-copy-icon';
    icon.innerHTML = COPY_ICON;
    li.appendChild(icon);

    // "В открытку →": открывает конструктор с этой фразой уже в поле послания
    // (см. ?msg= в bootstrap() main.js) — раньше фраза только копировалась, и
    // человек уходил с сайта с текстом в буфере. nofollow — это сотни
    // параметризованных URL, которые не должны попадать в индекс/краулинг.
    // Клик и Enter на ссылке не должны срабатывать как копирование фразы.
    if(occasion){
      var actions = document.createElement('div');
      actions.className = 'wish-actions';
      var toCard = document.createElement('a');
      toCard.className = 'wish-to-card';
      toCard.rel = 'nofollow';
      toCard.href = '/?occasion=' + occasion + '&msg=' + encodeURIComponent(quote.slice(0, 400)) + '#create';
      toCard.textContent = isEn ? 'Put in a card →' : 'В открытку →';
      toCard.addEventListener('click', function(e){ e.stopPropagation(); track('phrase_to_card', { article: slug }); });
      toCard.addEventListener('keydown', function(e){ e.stopPropagation(); });
      actions.appendChild(toCard);
      li.appendChild(actions);
    }

    var resetTimer;
    function markCopied(){
      icon.innerHTML = CHECK_ICON;
      li.classList.add('wish-copied');
      li.setAttribute('aria-label', copiedHint);
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function(){
        icon.innerHTML = COPY_ICON;
        li.classList.remove('wish-copied');
        li.setAttribute('aria-label', hint);
      }, 1500);
    }

    function trigger(){
      track('phrase_copy', { article: slug });
      copyText(quote).then(markCopied);
    }

    li.addEventListener('click', trigger);
    li.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        trigger();
      }
    });
  });

  // Рекламные блоки (Adsterra, 728x90, только блог — на главной и лендингах
  // Google Ads рекламы нет намеренно: именно скрипты рекламной сети раньше
  // стали причиной отклонения объявлений как "взломанный сайт"). Через JS в
  // общем blog.js, а не руками в каждый файл статьи, чтобы убрать/поменять
  // блок можно было в одном месте — достаточно удалить этот блок кода.
  // Раскладка (по центру колонки статьи) задана прямо здесь, а не в main.css:
  // blog.js и main.css кэшируются независимо (до 4 часов), и при старом кэше
  // стилей рамка рекламы вылезала нестилизованной и слева. iframe растянут на
  // 100% ширины колонки (до 728px), высоту держит aspect-ratio — сама реклама
  // внутри (/x/n3.html) масштабируется под эту ширину своим скриптом.
  function insertPromo(parent, beforeNode){
    var wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:680px;margin:28px auto;text-align:center;';
    var frame = document.createElement('iframe');
    frame.src = '/x/n3.html';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    frame.setAttribute('loading', 'lazy');
    frame.setAttribute('scrolling', 'no');
    frame.title = isEn ? 'Advertisement' : 'Реклама'; // только для скринридеров, на экране подписи нет
    frame.style.cssText = 'display:block;width:100%;max-width:728px;margin:0 auto;aspect-ratio:728/90;border:0;';
    wrap.appendChild(frame);
    parent.insertBefore(wrap, beforeNode); // beforeNode == null -> в конец parent
  }

  // Призыв собрать открытку сразу после вступления: раньше единственная кнопка
  // стояла в самом конце длинного списка фраз и до неё мало кто доскролливал.
  // Ссылку и подпись кнопки берём у нижнего блока .article-cta (там уже
  // стоит лендинг под повод этой статьи), текст — свой, одинаковый для всех.
  // Вставляется ДО рекламного блока, чтобы реклама не стояла между вступлением
  // и призывом.
  var endCtaLink = document.querySelector('.article-cta a.btn');
  function insertTopCta(parent, beforeNode){
    if(!endCtaLink) return;
    var box = document.createElement('div');
    box.className = 'blog-cta';
    var text = document.createElement('div');
    text.className = 'blog-cta-text';
    text.textContent = isEn
      ? 'Want to send it in style? Build a free card with a blooming bouquet — no sign-up needed.'
      : 'Хотите отправить красиво? Соберите открытку с живым букетом — бесплатно, без регистрации.';
    var btn = document.createElement('a');
    btn.className = 'btn btn-primary';
    btn.href = endCtaLink.getAttribute('href');
    btn.textContent = isEn ? 'Build a card' : 'Собрать открытку';
    btn.addEventListener('click', function(){ track('blog_cta_click', { article: slug, position: 'top' }); });
    box.appendChild(text);
    box.appendChild(btn);
    parent.insertBefore(box, beforeNode);
  }
  if(endCtaLink){
    endCtaLink.addEventListener('click', function(){ track('blog_cta_click', { article: slug, position: 'bottom' }); });
  }

  // Первый блок — после вступительного абзаца, перед первым <h2> статьи.
  var headings = document.querySelectorAll('.legal-wrap h2');
  var firstHeading = headings[0];
  if(firstHeading){
    insertTopCta(firstHeading.parentNode, firstHeading);
    insertPromo(firstHeading.parentNode, firstHeading);
    // Блок в середине статьи — перед <h2> посередине (между подборками фраз),
    // чтобы не лепить рекламу подряд у начала и у конца длинного списка.
    // querySelectorAll отдаёт статичный список, вставка выше его не сдвигает.
    var mid = Math.floor(headings.length / 2);
    if(headings.length >= 3 && mid >= 1) insertPromo(headings[mid].parentNode, headings[mid]);
  }else{
    // Страницы-каталоги (/blog/, /blog/en/) — там нет <h2>, зато сразу за
    // вступлением идёт список статей (.blog-list). Тот же блок, перед списком,
    // и ещё один — сразу после списка.
    var firstList = document.querySelector('.legal-wrap .blog-list');
    if(firstList){
      insertPromo(firstList.parentNode, firstList);
      insertPromo(firstList.parentNode, firstList.nextSibling);
    }
  }

  // Второй блок — в конце статьи, ПОСЛЕ кнопки "Собрать открытку" (.article-cta),
  // не до неё: иначе реклама перехватывала бы клик у собственной конверсии сайта.
  // На каталогах .article-cta нет — там второй блок не нужен, и так не появится.
  var cta = document.querySelector('.article-cta');
  if(cta) insertPromo(cta.parentNode, cta.nextSibling);
})();
