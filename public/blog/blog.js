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
})();
