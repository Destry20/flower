/* ====================== DATA ====================== */

const BRAND = 'MySweetBouquet';

const OCCASIONS = [
  {id:'foryou', label:'Для тебя', color:'#5C7457', stamp:'Для тебя', placeholder:'За то что ты есть!'},
  {id:'birthday', label:'День рождения', color:'#C97B86', stamp:'С днём рождения', placeholder:'Пусть этот год принесёт тебе только самые тёплые дни...'},
  {id:'love', label:'Любовь', color:'#4B2E3D', stamp:'С любовью', placeholder:'Ты — моё самое доброе утро...'},
  {id:'thanks', label:'Спасибо', color:'#B98A4A', stamp:'Спасибо тебе', placeholder:'Хочу, чтобы ты знал(а), как я ценю тебя...'},
  {id:'congrats', label:'Поздравляю', color:'#5C7457', stamp:'Поздравляю', placeholder:'Ты это заслужил(а). Горжусь тобой!'},
  {id:'sorry', label:'Поддержка', color:'#8CA087', stamp:'Я рядом', placeholder:'Просто хочу, чтобы ты знал(а) — я рядом, что бы ни случилось.'},
  {id:'justbecause', label:'Просто так', color:'#C97B86', stamp:'Просто так', placeholder:'Без повода. Просто подумал(а) о тебе сегодня.'}
];

const FLOWER_TYPES = [
  {id:'rose', label:'Роза', colors:['#C97B86','#E3B7BE','#B23A4E','#F2E1C8']},
  {id:'peony', label:'Пион', colors:['#F0C9D6','#E6A6BC','#FBEAD9','#D98CAE']},
  {id:'tulip', label:'Тюльпан', colors:['#D65B4A','#E8A03A','#B23A4E','#F2E1C8']},
  {id:'daisy', label:'Ромашка', colors:['#FBF7ED','#F2E1C8','#E3B7BE']},
  {id:'greenery', label:'Зелень', colors:['#8CA087','#5C7457']}
];

const VASES = [
  {id:'A', label:'Глиняная'},
  {id:'B', label:'Стеклянная'},
  {id:'C', label:'Крафтовая'}
];

const RIBBONS = ['#B98A4A','#C97B86','#4B2E3D','#8CA087','#F2E1C8','#7e4ab9'];

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
  revealEnabled: false,
  revealDate: '',
  revealTime: '10:00'
};
state.flowers.rose = {color:FLOWER_TYPES[0].colors[0], count:3};
state.flowers.greenery = {color:'#8CA087', count:2};

/* ====================== HELPERS ====================== */

function darken(hex, amt){
  const c = hex.replace('#','');
  const num = parseInt(c,16);
  let r = (num>>16) - amt, g = ((num>>8)&0xff) - amt, b=(num&0xff) - amt;
  r=Math.max(0,r); g=Math.max(0,g); b=Math.max(0,b);
  return '#' + (r<<16 | g<<8 | b).toString(16).padStart(6,'0');
}
function lighten(hex, amt){ return darken(hex, -amt); }
function uid(){ return 'c' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
function esc(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---- кодирование открытки прямо в ссылку (без сервера) ---- */
// превращает объект открытки в компактную безопасную для URL строку
function encodeCardData(payload){
  const json = JSON.stringify(payload);
  // encodeURIComponent/unescape нужны, чтобы кириллица корректно прошла через btoa
  const b64 = btoa(unescape(encodeURIComponent(json)));
  // делаем строку url-safe: btoa даёт +, /, = — их нельзя просто вставлять в hash
  return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
// делает обратное превращение: строка из ссылки -> объект открытки
function decodeCardData(str){
  let b64 = str.replace(/-/g,'+').replace(/_/g,'/');
  while(b64.length % 4) b64 += '=';
  const json = decodeURIComponent(escape(atob(b64)));
  return JSON.parse(json);
}

/* ====================== FLOWER SVG RENDERING ====================== */

function stemPath(x1,y1,x2,y2,bow){
  const mx = (x1+x2)/2 + bow, my=(y1+y2)/2;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

function flowerHead(type, cx, cy, color, rot, scale){
  const dark = darken(color, 40);
  const light = lighten(color, 25);
  let g = '';
  // все фигуры лепестков рисуются вокруг локального (0,0) — это гарантирует, что
  // rotate/scale ниже вращают и масштабируют цветок ровно вокруг его собственного
  // центра, а не "сползают" к углу холста при scale < 1
  if(type==='rose'){
    for(let i=0;i<6;i++){
      const a = (i/6)*Math.PI*2;
      const ex = Math.cos(a)*5, ey = Math.sin(a)*5;
      g += `<ellipse cx="${ex}" cy="${ey}" rx="9" ry="6.5" fill="${i%2?color:light}" stroke="${dark}" stroke-width=".6" transform="rotate(${(a*180/Math.PI)+40} ${ex} ${ey})"/>`;
    }
    g += `<circle cx="0" cy="0" r="5" fill="${dark}"/>`;
  } else if(type==='peony'){
    for(let i=0;i<10;i++){
      const a = (i/10)*Math.PI*2;
      const rr = i%2? 12:8;
      const ex = Math.cos(a)*rr, ey = Math.sin(a)*rr*0.9;
      g += `<ellipse cx="${ex}" cy="${ey}" rx="10" ry="7" fill="${i%3===0?light:color}" stroke="${dark}" stroke-width=".5" transform="rotate(${a*180/Math.PI} ${ex} ${ey})"/>`;
    }
    g += `<circle cx="0" cy="0" r="4" fill="${dark}"/>`;
  } else if(type==='tulip'){
    g += `<path d="M 0 16 C -13 2 -11 -22 0 -14 C 11 -22 13 2 0 16 Z" fill="${color}" stroke="${dark}" stroke-width=".7"/>`;
    g += `<path d="M 0 15 C -6 3 -5 -10 0 -8 C 5 -10 6 3 0 15 Z" fill="${light}" opacity=".6"/>`;
  } else if(type==='daisy'){
    for(let i=0;i<10;i++){
      const a = (i/10)*Math.PI*2;
      const ex = Math.cos(a)*11, ey = Math.sin(a)*11;
      g += `<ellipse cx="${ex}" cy="${ey}" rx="3.6" ry="10" fill="${color}" stroke="${dark}" stroke-width=".4" transform="rotate(${a*180/Math.PI} ${ex} ${ey})"/>`;
    }
    g += `<circle cx="0" cy="0" r="6" fill="#B98A4A"/>`;
  }
  // translate → rotate → scale, в этом порядке: сначала ставим цветок на место стебля,
  // затем крутим и масштабируем строго вокруг этой самой точки — без сюрпризов рендера
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${scale})">${g}</g>`;
}

function greeneryStem(x1,y1,x2,y2,color){
  const dark = darken(color, 30);
  let g = `<path d="${stemPath(x1,y1,x2,y2,6)}" fill="none" stroke="${dark}" stroke-width="2"/>`;
  for(let t=0.25; t<1; t+=0.28){
    const lx = x1 + (x2-x1)*t, ly = y1 + (y2-y1)*t;
    const side = t*100%2<1?1:-1;
    g += `<ellipse cx="${lx+side*7}" cy="${ly}" rx="6" ry="2.6" fill="${color}" transform="rotate(${side*35} ${lx+side*7} ${ly})"/>`;
  }
  return g;
}

function vaseSvg(type, cx, topY){
  const c = {A:{fill:'#C97B5A', dark:'#9B5738'}, B:{fill:'#EDE7DA', dark:'#B9AF9B'}, C:{fill:'#DCC9A3', dark:'#B39B6D'}}[type];
  if(type==='A'){
    return `<path d="M ${cx-46} ${topY} C ${cx-52} ${topY+55} ${cx-38} ${topY+90} ${cx} ${topY+92} C ${cx+38} ${topY+90} ${cx+52} ${topY+55} ${cx+46} ${topY}
      L ${cx+38} ${topY-6} L ${cx-38} ${topY-6} Z" fill="${c.fill}" stroke="${c.dark}" stroke-width="1"/>
      <ellipse cx="${cx}" cy="${topY-6}" rx="38" ry="8" fill="${lighten(c.fill,15)}" stroke="${c.dark}" stroke-width="1"/>`;
  }
  if(type==='B'){
    return `<path d="M ${cx-34} ${topY} L ${cx-30} ${topY+95} L ${cx+30} ${topY+95} L ${cx+34} ${topY} Z" fill="${c.fill}" opacity=".55" stroke="${c.dark}" stroke-width="1"/>
      <ellipse cx="${cx}" cy="${topY}" rx="34" ry="7" fill="${lighten(c.fill,10)}" opacity=".7" stroke="${c.dark}" stroke-width="1"/>`;
  }
  return `<rect x="${cx-38}" y="${topY-4}" width="76" height="88" rx="6" fill="${c.fill}" stroke="${c.dark}" stroke-width="1"/>
    <rect x="${cx-40}" y="${topY-16}" width="80" height="16" rx="4" fill="${lighten(c.fill,10)}" stroke="${c.dark}" stroke-width="1"/>
    <path d="M ${cx-40} ${topY+10} L ${cx+40} ${topY+6}" stroke="${c.dark}" stroke-width="1" opacity=".4"/>`;
}

function ribbonBow(cx, y, color){
  const dark = darken(color, 35);
  return `<g>
    <ellipse cx="${cx-14}" cy="${y}" rx="14" ry="9" fill="${color}" stroke="${dark}" stroke-width="1" transform="rotate(-18 ${cx-14} ${y})"/>
    <ellipse cx="${cx+14}" cy="${y}" rx="14" ry="9" fill="${color}" stroke="${dark}" stroke-width="1" transform="rotate(18 ${cx+14} ${y})"/>
    <circle cx="${cx}" cy="${y}" r="6" fill="${dark}"/>
  </g>`;
}

function buildBouquetSVG(cfg, size){
  size = size || 300;
  const cx = size/2;
  const vaseTopY = size*0.62;
  const tieY = vaseTopY - 4; // все стебли сходятся в одну точку у горлышка — как перевязанный букет

  const flowerEntries = Object.entries(cfg.flowers).filter(([,v])=>v.count>0);
  const heads = [];
  const greens = [];
  flowerEntries.forEach(([type, v])=>{
    for(let i=0;i<v.count;i++){
      if(type==='greenery') greens.push(v.color);
      else heads.push({type, color:v.color});
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

  // зелень — широкий фон позади цветов, тоже сходится в точку завязки
  greens.forEach((color,i)=>{
    const a = (i/(Math.max(greens.length-1,1)))*Math.PI - Math.PI/2 + (i%2?0.25:-0.25);
    const r = domeR*1.3 + 16;
    const x = cx + Math.cos(a)*r;
    const y = domeCenterY - Math.abs(Math.sin(a))*r*0.55;
    stemsSvg += greeneryStem(cx, tieY, x, y, color);
  });

  // головки цветов — от дальних (верх купола) к ближним (низ купола), чтобы передние перекрывали задние
  pts.slice().sort((a,b)=>a.y-b.y).forEach(p=>{
    const rot = (p.x-cx)*0.3;
    headsSvg += flowerHead(p.type, p.x, p.y, p.color, rot, Math.max(0.72, p.scale));
  });

  const vase = vaseSvg(cfg.vase, cx, vaseTopY);
  const bow = ribbonBow(cx, vaseTopY-2, cfg.ribbon);
  return `<svg viewBox="0 0 ${size} ${size*1.15}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
    ${stemsSvg}
    ${headsSvg}
    ${vase}
    ${bow}
  </svg>`;
}

/* ====================== WEB AUDIO CHIME ====================== */

function playChime(){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f,i)=>{
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type='sine'; o.frequency.value=f;
      o.connect(g); g.connect(ctx.destination);
      const t0 = ctx.currentTime + i*0.18;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.09, t0+0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+1.1);
      o.start(t0); o.stop(t0+1.2);
    });
  }catch(e){}
}

/* ====================== RENDER: CREATOR ====================== */

function occasionById(id){ return OCCASIONS.find(o=>o.id===id); }

function renderCreator(){
  const occ = occasionById(state.occasion);
  document.getElementById('app').innerHTML = `
  <div class="topbar">
    <div class="brand">${leafIcon()}${BRAND}</div>
    <div class="topbar-actions"><button onclick="location.hash='mine'">Мои открытки</button></div>
  </div>
  <div class="wrap">
    <div class="hero">
      <div>
        <h1>Соберите букет и оставьте послание, которое захочется сохранить</h1>
        <p>Выберите повод, соберите цветы, добавьте пару строк — и отправьте одной ссылкой. Открывается как настоящая открытка: с разворотом и цветением.</p>
      </div>
      <div class="hero-stamp">${occ.stamp}</div>
    </div>

    <div class="builder">
      <div class="col-form">

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">01</span>
            <div><div class="panel-title">Повод</div><div class="panel-sub">задаёт тон открытки</div></div>
          </div>
          <div class="chip-row" id="occasionChips"></div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">02</span>
            <div><div class="panel-title">Букет</div><div class="panel-sub">форма вазы, цветы, лента</div></div>
          </div>
          <span class="field-label">Ваза</span>
          <div class="vase-row" id="vaseChips" style="margin-bottom:20px;"></div>
          <span class="field-label">Цветы <span class="hint">отметьте нужные, выберите цвет и количество</span></span>
          <div class="flower-row" id="flowerRows"></div>
          <span class="field-label" style="margin-top:18px;">Лента</span>
          <div class="swatches" id="ribbonSwatches"></div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">03</span>
            <div><div class="panel-title">Послание</div><div class="panel-sub">кому и что хотите сказать</div></div>
          </div>
          <div class="row2" style="margin-bottom:12px;">
            <input type="text" id="toInput" placeholder="Имя получателя" maxlength="30" value="${esc(state.to)}">
            <input type="text" id="fromInput" placeholder="Ваше имя" maxlength="30" value="${esc(state.from)}">
          </div>
          <textarea id="msgInput" maxlength="400" placeholder="${occ.placeholder}">${esc(state.message)}</textarea>
          <div class="char-count" id="charCount">${state.message.length}/400</div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">04</span>
            <div><div class="panel-title">Дополнительно</div><div class="panel-sub">необязательные штрихи</div></div>
          </div>
          <div class="toggle-line">
            <div>
              <div style="font-size:14px;">Нежная мелодия при открытии</div>
              <div style="font-size:12px;opacity:.6;">Короткий сгенерированный перезвон, без сторонних файлов</div>
            </div>
            <div class="switch ${state.music?'on':''}" id="musicSwitch" onclick="toggleMusic()"><div class="dot"></div></div>
          </div>
          <div class="toggle-line">
            <div>
              <div style="font-size:14px;">Открыть в определённый момент</div>
              <div style="font-size:12px;opacity:.6;">До этого времени получатель увидит только конверт</div>
            </div>
            <div class="switch ${state.revealEnabled?'on':''}" id="revealSwitch" onclick="toggleReveal()"><div class="dot"></div></div>
          </div>
          <div class="date-inline ${state.revealEnabled?'show':''}" id="dateInline">
            <div class="row2">
              <input type="date" id="revealDate" value="${state.revealDate}">
              <input type="time" id="revealTime" value="${state.revealTime}">
            </div>
          </div>
        </div>

        <div class="cta-row">
          <button class="btn btn-primary" onclick="saveAndShare()">Создать ссылку</button>
          <button class="btn btn-ghost" onclick="randomizeBouquet()" style="display:inline-flex;align-items:center;gap:7px;">${diceIconSvg()}Собрать наугад</button>
        </div>
      </div>

      <div class="col-preview">
        <div class="preview-stage">
          <div class="preview-card">
            <div class="preview-occasion-band" id="pvBand" style="background:${occ.color}">${occ.stamp}</div>
            <div class="preview-bouquet" id="pvBouquet"></div>
            <div class="preview-msg">
              <div class="to" id="pvTo"></div>
              <div class="text" id="pvText">${esc(state.message)||'<span style=\"opacity:.4\">Текст пожелания появится здесь…</span>'}</div>
              <div class="from" id="pvFrom"></div>
            </div>
          </div>
          <button class="pv-replay" onclick="replayPreview()">↻ Показать анимацию открытия</button>
          <div class="preview-note">Живой предпросмотр открытки. Получатель увидит анимацию раскрытия.</div>
        </div>
      </div>
    </div>
  </div>
  <footer class="site-footer">${BRAND} — сделайте открытку за пару минут и отправьте ссылкой</footer>
  `;

  document.getElementById('occasionChips').innerHTML = OCCASIONS.map(o =>
    `<div class="chip ${state.occasion===o.id?'active':''}" onclick="setOccasion('${o.id}')">
      <span class="chip-ic">${occasionIconSvg(o.id, state.occasion===o.id ? '#FAF3E7' : o.color)}</span>${o.label}
    </div>`
  ).join('');

  document.getElementById('vaseChips').innerHTML = VASES.map(v =>
    `<div class="vase-chip ${state.vase===v.id?'active':''}" onclick="setVase('${v.id}')">
      ${vaseThumbSvg(v.id)}<span>${v.label}</span>
    </div>`
  ).join('');

  document.getElementById('flowerRows').innerHTML = FLOWER_TYPES.map(f=>{
    const sel = state.flowers[f.id];
    const on = !!sel;
    const color = sel ? sel.color : f.colors[0];
    const count = sel ? sel.count : 3;
    return `<div class="flower-item ${on?'on':''}" id="fi-${f.id}">
      <div class="fi-thumb" onclick="toggleFlower('${f.id}')">
        ${flowerThumbSvg(f.id, color)}
        ${on?'<div class="fi-badge">✓</div>':''}
      </div>
      <div class="fi-body">
        <div class="fi-name" onclick="toggleFlower('${f.id}')">${f.label}</div>
        <div class="swatches">${f.colors.map(c=>`<div class="swatch ${on&&color===c?'sel':''}" style="background:${c}" onclick="setFlowerColor('${f.id}','${c}')"></div>`).join('')}</div>
      </div>
      <div class="stepper">
        <button onclick="stepFlower('${f.id}',-1)">−</button>
        <span>${count}</span>
        <button onclick="stepFlower('${f.id}',1)">+</button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('ribbonSwatches').innerHTML = RIBBONS.map(c=>
    `<div class="swatch ${state.ribbon===c?'sel':''}" style="background:${c}" onclick="setRibbon('${c}')"></div>`
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
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right:2px;"><path d="M4 20C4 12 9 4 20 4C20 15 12 20 4 20Z" fill="#8CA087" stroke="#5C7457" stroke-width="1"/><path d="M4 20C8 15 12 11 18 6" stroke="#5C7457" stroke-width="1"/></svg>`;
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
  return `<svg width="16" height="16" viewBox="0 0 16 16">${paths[name]}</svg>`;
}
function diceIconSvg(){
  return `<svg width="15" height="15" viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="5" r="1.1" fill="currentColor"/><circle cx="11" cy="5" r="1.1" fill="currentColor"/><circle cx="8" cy="8" r="1.1" fill="currentColor"/><circle cx="5" cy="11" r="1.1" fill="currentColor"/><circle cx="11" cy="11" r="1.1" fill="currentColor"/></svg>`;
}

function vaseThumbSvg(type){
  if(type==='A') return `<svg width="34" height="38" viewBox="0 0 34 38"><path d="M6 6C4 18 6 32 17 32C28 32 30 18 28 6L23 3L11 3Z" fill="#C97B5A" stroke="#9B5738" stroke-width="1"/><ellipse cx="17" cy="6" rx="6" ry="1.6" fill="#E3A583"/></svg>`;
  if(type==='B') return `<svg width="34" height="38" viewBox="0 0 34 38"><path d="M10 3L8 32L26 32L24 3Z" fill="#EDE7DA" opacity=".55" stroke="#B9AF9B" stroke-width="1"/><ellipse cx="17" cy="3" rx="7" ry="1.6" fill="#F5F1E6" stroke="#B9AF9B" stroke-width=".8"/></svg>`;
  return `<svg width="34" height="38" viewBox="0 0 34 38"><rect x="6" y="9" width="22" height="23" rx="3" fill="#DCC9A3" stroke="#B39B6D" stroke-width="1"/><rect x="5" y="4" width="24" height="7" rx="2" fill="#EAD9B0" stroke="#B39B6D" stroke-width="1"/></svg>`;
}

function flowerThumbSvg(type, color){
  if(type==='greenery') return `<svg width="46" height="46" viewBox="0 0 46 46">${greeneryStem(23,42,23,6,color)}</svg>`;
  return `<svg width="46" height="46" viewBox="0 0 46 46">${flowerHead(type, 23, 24, color, 0, 1)}</svg>`;
}

function renderPreviewBouquet(){
  document.getElementById('pvBouquet').innerHTML = buildBouquetSVG(state, 300);
}
function updatePreviewText(){
  const occ = occasionById(state.occasion);
  document.getElementById('pvTo').textContent = state.to ? `Для ${state.to}` : '';
  document.getElementById('pvText').innerHTML = esc(state.message) || '<span style="opacity:.4">Текст пожелания появится здесь…</span>';
  document.getElementById('pvFrom').textContent = state.from ? `— ${state.from}` : '';
  document.getElementById('pvBand').style.background = occ.color;
  document.getElementById('pvBand').textContent = occ.stamp;
}

function setOccasion(id){ state.occasion=id; renderCreator(); }
function setVase(id){ state.vase=id; renderPreviewBouquet(); document.querySelectorAll('#vaseChips .vase-chip').forEach(c=>c.classList.remove('active')); event.target.closest('.vase-chip').classList.add('active'); }
function setRibbon(c){ state.ribbon=c; renderPreviewBouquet(); document.querySelectorAll('#ribbonSwatches .swatch').forEach(s=>s.classList.remove('sel')); event.target.classList.add('sel'); }
function toggleFlower(id){
  if(state.flowers[id]) delete state.flowers[id];
  else { const f=FLOWER_TYPES.find(x=>x.id===id); state.flowers[id]={color:f.colors[0], count: id==='greenery'?2:3}; }
  renderCreator();
}
function setFlowerColor(id,c){
  if(!state.flowers[id]) return;
  state.flowers[id].color=c; renderCreator();
}
function stepFlower(id, d){
  if(!state.flowers[id]) return;
  const v = state.flowers[id].count + d;
  state.flowers[id].count = Math.max(0, Math.min(8, v));
  if(state.flowers[id].count===0) delete state.flowers[id];
  renderCreator();
}
function toggleMusic(){ state.music=!state.music; document.getElementById('musicSwitch').classList.toggle('on'); }
function toggleReveal(){
  state.revealEnabled=!state.revealEnabled;
  document.getElementById('revealSwitch').classList.toggle('on');
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
    state.flowers[f.id] = {color:c, count: f.id==='greenery' ? 2 : 2+Math.floor(Math.random()*3)};
  });
  if(!Object.keys(state.flowers).length){
    state.flowers.rose = {color:FLOWER_TYPES[0].colors[0], count:3};
  }
  renderCreator();
  showToast('Собрали для вас новый вариант');
}

function replayPreview(){
  const el = document.getElementById('pvBouquet');
  el.classList.remove('pv-bloom');
  void el.offsetWidth;
  el.classList.add('pv-bloom');
}

/* ====================== SAVE + SHARE (без сервера — данные лежат прямо в ссылке) ====================== */

function saveAndShare(){
  if(!state.message.trim()){
    showToast('Добавьте текст пожелания');
    return;
  }
  const payload = {
    occasion: state.occasion, vase: state.vase, ribbon: state.ribbon,
    flowers: state.flowers, message: state.message, from: state.from, to: state.to,
    music: state.music,
    reveal: state.revealEnabled ? (state.revealDate ? (state.revealDate+'T'+(state.revealTime||'00:00')) : null) : null,
    createdAt: Date.now()
  };

  let encoded;
  try{
    encoded = encodeCardData(payload);
  }catch(e){
    showToast('Не удалось создать ссылку, попробуйте ещё раз');
    return;
  }

  // "Мои открытки" храним локально в этом браузере (localStorage) —
  // это личный список только для устройства, на котором создавали открытку
  try{
    let list = [];
    try{ list = JSON.parse(localStorage.getItem('my-cards') || '[]'); }catch(e){ list = []; }
    list.unshift({ id: uid(), occasion: state.occasion, to: state.to, createdAt: payload.createdAt, data: encoded });
    localStorage.setItem('my-cards', JSON.stringify(list.slice(0,50)));
  }catch(e){ /* не критично, если локальное хранилище недоступно */ }

  const url = location.origin + location.pathname + '#data=' + encoded;
  renderShareScreen(url);
}

function renderShareScreen(url){
  document.getElementById('app').innerHTML = `
    <div class="topbar"><div class="brand">${leafIcon()}${BRAND}</div><div></div></div>
    <div class="share-wrap">
      <div class="eyebrow">готово</div>
      <h1 style="font-size:30px;margin-top:8px;">Открытка собрана</h1>
      <p style="opacity:.75;margin-top:10px;">Отправьте эту ссылку — она откроется как раскрывающаяся открытка с вашим букетом.</p>
      <div class="link-box">
        <input type="text" id="shareUrl" readonly value="${url}">
        <button class="btn btn-primary" style="padding:9px 16px;" onclick="copyLink()">Копировать</button>
      </div>
      <div class="qr-box" id="qrBox">
        <div id="qrcode"></div>
        <div class="qr-label">Отсканируйте с телефона</div>
      </div>
      <div class="cta-row" style="justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-ghost" onclick="openView('${url}')">Предпросмотреть</button>
        <button class="btn btn-ghost" id="shareBtn" onclick="shareLink('${url}')">Поделиться</button>
        <button class="btn btn-ghost" onclick="renderCreator()">Редактировать</button>
        <button class="btn btn-ghost" onclick="location.hash='';location.reload()">Создать ещё одну</button>
      </div>
      <p style="font-size:12.5px;opacity:.5;margin-top:30px;">Ссылка полностью самодостаточна: вся открытка "зашита" в неё, отдельный сервер не нужен. Можно выложить этот файл на любой хостинг — работать будет так же.</p>
    </div>
  `;
  try{
    if(window.QRCode){
      new QRCode(document.getElementById('qrcode'), {text:url, width:120, height:120, colorDark:'#4B2E3D', colorLight:'#FAF3E7'});
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
    navigator.clipboard.writeText(el.value).then(()=>showToast('Ссылка скопирована')).catch(()=>fallbackCopy());
  } else {
    fallbackCopy();
  }
  function fallbackCopy(){
    try{ document.execCommand('copy'); showToast('Ссылка скопирована'); }
    catch(e){ showToast('Скопируйте ссылку вручную'); }
  }
}
function shareLink(url){
  if(navigator.share){
    navigator.share({title: BRAND, text: 'Вам открытка с букетом 🌿', url}).catch(()=>{});
  }
}
function openView(url){ location.hash = url.split('#')[1]; renderRoute(); }

/* ====================== VIEWER ====================== */

function renderViewer(encodedData){
  let data;
  try{
    data = decodeCardData(encodedData);
  }catch(e){
    document.getElementById('app').innerHTML = `<div class="view-stage"><div style="text-align:center;">
      <div class="eyebrow">не найдено</div>
      <h1 style="font-size:24px;margin-top:8px;">Эта открытка недоступна</h1>
      <p style="opacity:.7;margin-top:8px;">Ссылка повреждена или указана неверно.</p>
      <button class="btn btn-primary" style="margin-top:20px;" onclick="location.hash='';renderRoute();">Создать свою</button>
    </div></div>`;
    return;
  }

  const occ = occasionById(data.occasion);
  const now = Date.now();
  const locked = data.reveal && new Date(data.reveal).getTime() > now;

  if(locked){
    const d = new Date(data.reveal);
    document.getElementById('app').innerHTML = `<div class="view-stage"><div class="lock-screen">
      <div class="eyebrow">эта открытка ждёт своего момента</div>
      <h1 style="font-size:24px;margin-top:10px;">Откроется ${d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})} в ${d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</h1>
      <p class="num" style="margin-top:14px;">Загляните сюда чуть позже — и получите свой букет</p>
    </div></div>`;
    return;
  }

  document.getElementById('app').innerHTML = `
    <div class="view-stage">
      <div class="view-card">
        <div class="view-envelope" id="envelope" onclick="openCard(${data.music?'true':'false'})">
          ${envelopeSvg(occ.color)}
          <div class="view-open-hint">Нажмите, чтобы открыть</div>
        </div>
        <div class="view-content" id="viewContent">
          <div class="view-occasion-band" style="background:${occ.color}">${occ.stamp}</div>
          <div class="view-bouquet-wrap" id="viewBouquet">${buildBouquetSVG(data, 300)}</div>
          <div class="view-msg" id="viewMsg">${esc(data.message)}</div>
          <div class="view-from" id="viewFrom">${data.to ? `Для ${esc(data.to)}` : ''}${data.to && data.from ? ' · ' : ''}${data.from ? `от ${esc(data.from)}` : ''}</div>
          <div class="view-footer">Открытка создана в <a href="#" onclick="location.hash='';renderRoute();return false;">${BRAND}</a> — соберите свою за пару минут</div>
        </div>
      </div>
    </div>
  `;
}

function envelopeSvg(color){
  return `<svg width="180" height="130" viewBox="0 0 180 130" style="margin:0 auto;display:block;">
    <rect x="4" y="14" width="172" height="112" rx="6" fill="${lighten(color,60)}" stroke="${color}" stroke-width="1.5"/>
    <path d="M4 16 L90 82 L176 16" fill="none" stroke="${color}" stroke-width="1.5"/>
    <path d="M4 14 L90 68 L176 14" fill="${color}" opacity=".15"/>
  </svg>`;
}

function openCard(withMusic){
  document.getElementById('envelope').style.display='none';
  document.getElementById('viewContent').classList.add('show');
  setTimeout(()=>document.getElementById('viewBouquet').classList.add('bloom'), 60);
  setTimeout(()=>document.getElementById('viewMsg').classList.add('show'), 500);
  setTimeout(()=>document.getElementById('viewFrom').classList.add('show'), 700);
  if(withMusic) playChime();
  dropPetals();
}

function dropPetals(){
  const colors=['#C97B86','#E3B7BE','#F2E1C8','#B98A4A'];
  for(let i=0;i<16;i++){
    setTimeout(()=>{
      const p=document.createElement('div');
      p.className='petal';
      const c=colors[i%colors.length];
      p.style.left = Math.random()*100+'vw';
      p.innerHTML=`<svg width="14" height="14" viewBox="0 0 14 14"><ellipse cx="7" cy="7" rx="7" ry="5" fill="${c}"/></svg>`;
      p.style.transition='transform 2.6s ease-in, opacity 2.6s ease-in';
      document.body.appendChild(p);
      requestAnimationFrame(()=>{
        p.style.transform=`translateY(${window.innerHeight+40}px) rotate(${300+Math.random()*200}deg)`;
        p.style.opacity='0';
      });
      setTimeout(()=>p.remove(), 2700);
    }, i*90);
  }
}

/* ====================== MY CARDS (локально, в этом браузере) ====================== */

function renderMyCards(){
  document.getElementById('app').innerHTML = `
    <div class="topbar"><div class="brand">${leafIcon()}${BRAND}</div>
      <div class="topbar-actions"><button onclick="location.hash=''">Создать открытку</button></div>
    </div>
    <div class="mine-wrap">
      <div class="eyebrow">на этом устройстве</div>
      <h1 style="font-size:26px;margin-top:8px;">Открытки, которые вы собрали</h1>
      <div class="mine-list" id="mineList"><p style="opacity:.6;">Загрузка…</p></div>
    </div>
  `;
  let list = [];
  try{ list = JSON.parse(localStorage.getItem('my-cards') || '[]'); }catch(e){ list = []; }
  const wrap = document.getElementById('mineList');
  if(!list.length){
    wrap.innerHTML = `<div class="mine-empty">Пока пусто. Соберите первую открытку — она появится здесь.</div>`;
    return;
  }
  wrap.innerHTML = list.map(item=>{
    const occ = occasionById(item.occasion) || OCCASIONS[0];
    const d = new Date(item.createdAt);
    return `<div class="mine-row">
      <div class="mine-dot" style="background:${occ.color}"></div>
      <div class="mine-info">
        <div class="mi-to">${item.to ? 'Для '+esc(item.to) : occ.label}</div>
        <div class="mi-date">${d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <div class="mine-actions">
        <button onclick="location.hash='data=${item.data}'">Открыть</button>
        <button onclick="copyMineLink('${item.data}')">Ссылка</button>
        <button onclick="deleteMineCard('${item.id}')">Удалить</button>
      </div>
    </div>`;
  }).join('');
}
function copyMineLink(encodedData){
  const url = location.origin + location.pathname + '#data=' + encodedData;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>showToast('Ссылка скопирована'));
  } else {
    showToast(url);
  }
}
function deleteMineCard(id){
  let list = JSON.parse(localStorage.getItem('my-cards') || '[]');
  list = list.filter(item => item.id !== id);
  localStorage.setItem('my-cards', JSON.stringify(list));
  renderMyCards(); // перерисовать список без удалённой открытки
  showToast('Открытка удалена');
}

/* ====================== ROUTER ====================== */

function renderRoute(){
  const hash = location.hash;
  if(hash.startsWith('#data=')){
    renderViewer(hash.slice(6));
  } else if(hash === '#mine'){
    renderMyCards();
  } else {
    renderCreator();
  }
}
window.addEventListener('hashchange', renderRoute);
renderRoute();