/* ====================== DATA ====================== */

const BRAND = 'MySweetBouquet';
const SITE_DESCRIPTION = 'Соберите виртуальный букет, добавьте пожелание и отправьте открытку одной ссылкой.';

// anim — какая анимация частиц играет при раскрытии открытки (см. dropParticles):
// 'confetti' для праздничных поводов, 'hearts' для любви, 'petals' — мягкий вариант по умолчанию
const OCCASIONS = [
  {id:'foryou', label:'Для тебя', color:'#5C7457', stamp:'Для тебя', placeholder:'За то что ты есть!', anim:'petals'},
  {id:'birthday', label:'День рождения', color:'#C97B86', stamp:'С днём рождения', placeholder:'Пусть этот год принесёт тебе только самые тёплые дни...', anim:'confetti'},
  {id:'love', label:'Любовь', color:'#4B2E3D', stamp:'С любовью', placeholder:'Ты — моё самое доброе утро...', anim:'hearts'},
  {id:'thanks', label:'Спасибо', color:'#B98A4A', stamp:'Спасибо тебе', placeholder:'Хочу, чтобы ты знал(а), как я ценю тебя...', anim:'petals'},
  {id:'congrats', label:'Поздравляю', color:'#5C7457', stamp:'Поздравляю', placeholder:'Ты это заслужил(а). Горжусь тобой!', anim:'confetti'},
  {id:'sorry', label:'Поддержка', color:'#8CA087', stamp:'Я рядом', placeholder:'Просто хочу, чтобы ты знал(а) — я рядом, что бы ни случилось.', anim:'petals'},
  {id:'justbecause', label:'Просто так', color:'#C97B86', stamp:'Просто так', placeholder:'Без повода. Просто подумал(а) о тебе сегодня.', anim:'petals'}
];

const FLOWER_TYPES = [
  {id:'rose', label:'Роза', colors:['#C97B86','#E3B7BE','#B23A4E','#F2E1C8']},
  {id:'peony', label:'Пион', colors:['#F0C9D6','#E6A6BC','#FBEAD9','#D98CAE']},
  {id:'tulip', label:'Тюльпан', colors:['#D65B4A','#E8A03A','#B23A4E','#F2E1C8']},
  {id:'daisy', label:'Ромашка', colors:['#FBF7ED','#F2E1C8','#E3B7BE']},
  {id:'carnation', label:'Гвоздика', colors:['#C97B86','#D65B4A','#F0C9D6','#FBF7ED']},
  {id:'orchid', label:'Орхидея', colors:['#B27BC9','#E8D5F0','#7A4B96']},
  {id:'sunflower', label:'Подсолнух', colors:['#F2C94C','#E8A03A']}
];

const VASES = [
  {id:'A', label:'Глиняная'},
  {id:'B', label:'Стеклянная'},
  {id:'C', label:'Крафтовая'},
  {id:'D', label:'Мраморная'}
];

const RIBBONS = ['#B98A4A','#C97B86','#4B2E3D','#8CA087','#F2E1C8','#7e4ab9'];

const ENVELOPES = [
  {id:'classic', label:'Классика'},
  {id:'kraft', label:'Крафт'},
  {id:'seal', label:'С печатью'},
  {id:'pattern', label:'Узорный'},
  {id:'gold', label:'Золотой'}
];

// фон сцены — виден и в предпросмотре при сборке, и в реальной открытке
// у получателя (сохраняется вместе с остальными данными открытки в ссылке)
// dark:true — фон достаточно тёмный, чтобы текст поверх него нужно было
// перекрашивать в светлый (см. .stage-dark в main.css)
const BACKGROUNDS = [
  {id:'cream', label:'Кремовый', css:'linear-gradient(180deg,#F0E4CE,#FAF3E7)'},
  {id:'blush', label:'Румяна', css:'linear-gradient(180deg,#F6DDE2,#FBEFE9)'},
  {id:'sage', label:'Шалфей', css:'linear-gradient(180deg,#DCE6D6,#F2F5EE)'},
  {id:'night', label:'Ночь', css:'linear-gradient(180deg,#1B2038,#3A3159)', dark:true}
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
  return `<svg viewBox="0 0 ${size} ${size*1.15}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;" role="img" aria-label="Букет цветов">
    ${shadow}
    ${stemsSvg}
    ${headsSvg}
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
  {id:'chime', label:'Перезвон', notes:[523.25,659.25,783.99,1046.5], wave:'sine', step:0.18},
  {id:'bells', label:'Колокольчики', notes:[659.25,987.77,783.99,1318.51], wave:'triangle', step:0.14},
  {id:'harp', label:'Арфа', notes:[392.00,493.88,587.33,698.46,880.00], wave:'sine', step:0.11}
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
  setPageTitle('Собрать открытку');
  setMeta(`${BRAND} — соберите открытку с букетом`, SITE_DESCRIPTION);
  const occ = occasionById(state.occasion);
  document.getElementById('app').innerHTML = `
  ${topbarHtml()}
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
          <div class="chip-row" id="occasionChips" role="group" aria-label="Повод открытки"></div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">02</span>
            <div><div class="panel-title">Букет</div><div class="panel-sub">форма вазы, цветы, лента</div></div>
          </div>
          <span class="field-label" id="vaseLabel">Ваза</span>
          <div class="vase-row" id="vaseChips" role="group" aria-labelledby="vaseLabel" style="margin-bottom:20px;"></div>
          <span class="field-label" id="flowersLabel">Цветы <span class="hint">отметьте нужные, выберите цвет и количество</span></span>
          <div class="flower-row" id="flowerRows" role="group" aria-labelledby="flowersLabel"></div>
          <span class="field-label" id="ribbonLabel" style="margin-top:18px;">Лента</span>
          <div class="swatches" id="ribbonSwatches" role="group" aria-labelledby="ribbonLabel"></div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span class="step-num">03</span>
            <div><div class="panel-title">Послание</div><div class="panel-sub">кому и что хотите сказать</div></div>
          </div>
          <div class="row2" style="margin-bottom:12px;">
            <input type="text" id="toInput" placeholder="Имя получателя" aria-label="Имя получателя" maxlength="30" value="${esc(state.to)}">
            <input type="text" id="fromInput" placeholder="Ваше имя" aria-label="Ваше имя" maxlength="30" value="${esc(state.from)}">
          </div>
          <label for="msgInput" class="sr-only">Текст пожелания</label>
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
              <div style="font-size:14px;" id="musicLabel">Нежная мелодия при открытии</div>
              <div style="font-size:12px;opacity:.6;">Короткий сгенерированный перезвон, без сторонних файлов</div>
            </div>
            <div class="switch ${state.music?'on':''}" id="musicSwitch" tabindex="0" role="switch" aria-checked="${state.music}" aria-labelledby="musicLabel" onclick="toggleMusic()" onkeydown="activateOnKey(event)"><div class="dot"></div></div>
          </div>
          <div class="sub-inline ${state.music?'show':''}" id="melodyInline">
            <span class="field-label" id="melodyLabel">Мелодия <span class="hint">нажмите, чтобы прослушать</span></span>
            <div class="chip-row" id="melodyChips" role="group" aria-labelledby="melodyLabel"></div>
          </div>
          <div class="toggle-line">
            <div>
              <div style="font-size:14px;" id="revealLabel">Открыть в определённый момент</div>
              <div style="font-size:12px;opacity:.6;">До этого времени получатель увидит только конверт</div>
            </div>
            <div class="switch ${state.revealEnabled?'on':''}" id="revealSwitch" tabindex="0" role="switch" aria-checked="${state.revealEnabled}" aria-labelledby="revealLabel" onclick="toggleReveal()" onkeydown="activateOnKey(event)"><div class="dot"></div></div>
          </div>
          <div class="date-inline ${state.revealEnabled?'show':''}" id="dateInline">
            <div class="row2">
              <label for="revealDate" class="sr-only">Дата открытия</label>
              <input type="date" id="revealDate" value="${state.revealDate}">
              <label for="revealTime" class="sr-only">Время открытия</label>
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
        <div class="preview-stage ${BACKGROUNDS.find(b=>b.id===state.background).dark?'stage-dark':''}" id="previewStage" style="background:${BACKGROUNDS.find(b=>b.id===state.background).css}">
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

          <div class="scene-picker">
            <span class="field-label" id="bgLabel">Фон сцены <span class="hint">получатель увидит такой же</span></span>
            <div class="bg-row" id="bgChips" role="group" aria-labelledby="bgLabel"></div>
          </div>

          <div class="envelope-picker">
            <span class="field-label" id="envLabel">Конверт</span>
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
      <span class="chip-ic">${occasionIconSvg(o.id, state.occasion===o.id ? '#FAF3E7' : o.color)}</span>${o.label}
    </div>`
  ).join('');

  document.getElementById('vaseChips').innerHTML = VASES.map(v =>
    `<div class="vase-chip ${state.vase===v.id?'active':''}" tabindex="0" role="button" aria-pressed="${state.vase===v.id}" aria-label="${v.label}" onclick="setVase('${v.id}')" onkeydown="activateOnKey(event)">
      ${vaseThumbSvg(v.id)}<span>${v.label}</span>
    </div>`
  ).join('');

  document.getElementById('flowerRows').innerHTML = FLOWER_TYPES.map(f=>{
    const sel = state.flowers[f.id];
    const on = !!sel;
    const color = sel ? sel.color : f.colors[0];
    const count = sel ? sel.count : 3;
    return `<div class="flower-item ${on?'on':''}" id="fi-${f.id}">
      <div class="fi-thumb" tabindex="0" role="button" aria-pressed="${on}" aria-label="${(on?'Убрать':'Добавить')+' '+f.label.toLowerCase()}" onclick="toggleFlower('${f.id}')" onkeydown="activateOnKey(event)">
        ${flowerThumbSvg(f.id, color)}
        ${on?'<div class="fi-badge">✓</div>':''}
      </div>
      <div class="fi-body">
        <div class="fi-name" tabindex="0" role="button" aria-pressed="${on}" onclick="toggleFlower('${f.id}')" onkeydown="activateOnKey(event)">${f.label}</div>
        <div class="swatches">${f.colors.map((c,i)=>`<div class="swatch ${on&&color===c?'sel':''}" style="background:${c}" tabindex="0" role="button" aria-label="Цвет ${f.label.toLowerCase()} №${i+1}" aria-pressed="${on&&color===c}" onclick="setFlowerColor('${f.id}','${c}')" onkeydown="activateOnKey(event)"></div>`).join('')}</div>
      </div>
      <div class="stepper">
        <button aria-label="Меньше ${f.label.toLowerCase()}" onclick="stepFlower('${f.id}',-1)">−</button>
        <span aria-live="polite">${count}</span>
        <button aria-label="Больше ${f.label.toLowerCase()}" onclick="stepFlower('${f.id}',1)">+</button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('ribbonSwatches').innerHTML = RIBBONS.map((c,i)=>
    `<div class="swatch ${state.ribbon===c?'sel':''}" style="background:${c}" tabindex="0" role="button" aria-label="Цвет ленты №${i+1}" aria-pressed="${state.ribbon===c}" onclick="setRibbon('${c}')" onkeydown="activateOnKey(event)"></div>`
  ).join('');

  document.getElementById('bgChips').innerHTML = BACKGROUNDS.map(b=>
    `<div class="bg-chip ${state.background===b.id?'active':''}" style="background:${b.css}" tabindex="0" role="button" aria-label="Фон: ${b.label}" aria-pressed="${state.background===b.id}" onclick="setBackground('${b.id}')" onkeydown="activateOnKey(event)"></div>`
  ).join('');

  document.getElementById('envelopeChips').innerHTML = ENVELOPES.map(en=>
    `<div class="envelope-chip ${state.envelope===en.id?'active':''}" tabindex="0" role="button" aria-pressed="${state.envelope===en.id}" aria-label="${en.label}" onclick="setEnvelope('${en.id}')" onkeydown="activateOnKey(event)">
      ${envelopeSvg(occ.color, en.id, 44, 32)}
      <span>${en.label}</span>
    </div>`
  ).join('');

  document.getElementById('melodyChips').innerHTML = MELODIES.map(m =>
    `<div class="chip ${state.melody===m.id?'active':''}" tabindex="0" role="button" aria-pressed="${state.melody===m.id}" onclick="setMelody('${m.id}')" onkeydown="activateOnKey(event)">${m.label}</div>`
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
      <a class="topbar-link" href="#mine">Мои открытки</a>
      ${session.user
        ? `<button onclick="location.hash='account'">${esc(session.user.name || session.user.email.split('@')[0])}</button>`
        : `<button onclick="location.hash='login'">Войти</button>`}
    </div>
  </div>`;
}
function footerHtml(){
  return `${BRAND} — соберите открытку за пару минут и отправьте ссылкой · <a href="#privacy">Конфиденциальность</a> · <a href="#terms">Условия использования</a>`;
}

// Место под рекламные баннеры (Google AdSense / Яндекс.Директ). Сейчас — просто
// подписанная заглушка; чтобы подключить реальный AdSense, нужно:
//  1) добавить в index.html скрипт вида
//     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
//  2) заменить содержимое #adSlotBody на реальный <ins class="adsbygoogle">...</ins> и вызвать (adsbygoogle = window.adsbygoogle || []).push({})
//  3) разрешить домены AdSense в CSP (server/index.js: scriptSrc/frameSrc/connectSrc) — сейчас там только свой домен и cdnjs.
// Без пункта 1 у вас не будет ни publisher ID, ни одобренного AdSense-аккаунта — это нужно завести самостоятельно.
function adSlotHtml(id){
  return `<div class="ad-slot" aria-label="Рекламный блок">
    <div class="ad-slot-label">Реклама</div>
    <div class="ad-slot-body" id="${id}">Место для рекламного баннера</div>
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
  document.getElementById('pvTo').textContent = state.to ? `Для ${state.to}` : '';
  document.getElementById('pvText').innerHTML = esc(state.message) || '<span style="opacity:.4">Текст пожелания появится здесь…</span>';
  document.getElementById('pvFrom').textContent = state.from ? `— ${state.from}` : '';
  document.getElementById('pvBand').style.background = occ.color;
  document.getElementById('pvBand').textContent = occ.stamp;
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
function toggleFlower(id){
  if(state.flowers[id]) delete state.flowers[id];
  else { const f=FLOWER_TYPES.find(x=>x.id===id); state.flowers[id]={color:f.colors[0], count:3}; }
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
    music: state.music, melody: state.melody,
    envelope: state.envelope, background: state.background,
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

  if(session.user){
    // вошли в аккаунт — открытка сохраняется на сервере и доступна с любого устройства
    fetch('/api/cards', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ encodedData: encoded, occasion: state.occasion, to: state.to, from: state.from })
    }).catch(()=>{ /* не критично: ссылка всё равно рабочая сама по себе */ });
  } else {
    // гость — "Мои открытки" храним локально в этом браузере (localStorage)
    try{
      let list = [];
      try{ list = JSON.parse(localStorage.getItem('my-cards') || '[]'); }catch(e){ list = []; }
      list.unshift({ id: uid(), occasion: state.occasion, to: state.to, createdAt: payload.createdAt, data: encoded });
      localStorage.setItem('my-cards', JSON.stringify(list.slice(0,50)));
    }catch(e){ /* не критично, если локальное хранилище недоступно */ }
  }

  // ?data= (query-строка), а не #data= (хэш) — хэш никогда не уходит на сервер,
  // поэтому боты мессенджеров (WhatsApp/Telegram и т.д.) не могли увидеть
  // персональный og:title/og:description при вставке ссылки. Query-параметр
  // сервер видит и умеет отрендерить под него персональные meta-теги
  // (см. buildShareMeta в server/index.js), сама открытка при этом всё ещё
  // целиком лежит в самой ссылке — сервер её не обязан хранить.
  const url = location.origin + location.pathname + '?data=' + encoded;
  renderShareScreen(url);
}

function renderShareScreen(url){
  setPageTitle('Открытка готова');
  const isLong = url.length > LINK_WARN_LENGTH;
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="share-wrap">
      <div class="eyebrow">готово</div>
      <h1 style="font-size:30px;margin-top:8px;">Открытка собрана</h1>
      <p style="opacity:.75;margin-top:10px;">Отправьте эту ссылку — она откроется как раскрывающаяся открытка с вашим букетом.</p>
      <div class="link-box">
        <label for="shareUrl" class="sr-only">Ссылка на открытку</label>
        <input type="text" id="shareUrl" readonly value="${url}">
        <button class="btn btn-primary" style="padding:9px 16px;" onclick="copyLink()">Копировать</button>
      </div>
      ${isLong ? `<div class="link-warn">Ссылка получилась длинной (${url.length} симв.) — некоторые мессенджеры или SMS могут обрезать её. Если получатель не сможет открыть, попробуйте отправить QR-код ниже или сократить текст пожелания.</div>` : ''}
      ${shareChannelsHtml(url)}
      <div class="qr-box" id="qrBox">
        <div id="qrcode"></div>
        <div class="qr-label">Отсканируйте с телефона</div>
      </div>
      <div class="cta-row" style="justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-ghost" onclick="openView('${url}')">Предпросмотреть</button>
        <button class="btn btn-ghost" id="shareBtn" onclick="shareLink('${url}')">Поделиться</button>
        <button class="btn btn-ghost" onclick="renderCreator()">Редактировать</button>
        <button class="btn btn-ghost" onclick="location.href=location.pathname">Создать ещё одну</button>
      </div>
      <p style="font-size:12.5px;opacity:.5;margin-top:30px;">Ссылка полностью самодостаточна: вся открытка «зашита» в неё, отдельный сервер для её открытия не нужен.${session.user ? ' Копия также сохранена в разделе «Мои открытки» вашего аккаунта.' : ' Войдите в аккаунт, чтобы копия сохранялась и не терялась при очистке браузера.'}</p>
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

// Прямые ссылки в конкретные мессенджеры — обычный Web Share API (кнопка
// "Поделиться" выше) на десктопе часто просто недоступен, а получатели
// в основном ждут именно WhatsApp/Telegram/VK, а не системный шеринг-лист.
function shareChannelsHtml(url){
  const text = 'Вам открытка с букетом 🌿';
  const wa = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url);
  const tg = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
  const vk = 'https://vk.com/share.php?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(text);
  return `<div class="share-channels">
    <a class="share-channel-btn wa" href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <a class="share-channel-btn tg" href="${tg}" target="_blank" rel="noopener noreferrer">Telegram</a>
    <a class="share-channel-btn vk" href="${vk}" target="_blank" rel="noopener noreferrer">ВКонтакте</a>
  </div>`;
}
function openView(url){
  const data = new URL(url).searchParams.get('data');
  if(data) openCardLink(data);
}

/* ====================== VIEWER ====================== */

function renderViewer(encodedData){
  let rawData;
  try{
    rawData = decodeCardData(encodedData);
  }catch(e){
    setPageTitle('Открытка не найдена');
    document.getElementById('app').innerHTML = `<div class="view-stage"><div style="text-align:center;">
      <div class="eyebrow">не найдено</div>
      <h1 style="font-size:24px;margin-top:8px;">Эта открытка недоступна</h1>
      <p style="opacity:.7;margin-top:8px;">Ссылка повреждена или указана неверно.</p>
      <button class="btn btn-primary" style="margin-top:20px;" onclick="goHome();">Создать свою</button>
    </div></div>`;
    return;
  }

  // Ссылку могли обрезать, отредактировать вручную или прислать из другой,
  // более старой/новой версии сайта — sanitizeCardData подставляет безопасные
  // значения по умолчанию для всего, что не проходит проверку, вместо падения.
  const data = sanitizeCardData(rawData);

  const occ = occasionById(data.occasion);
  setPageTitle(data.to ? `Открытка для ${data.to}` : 'Открытка');
  setMeta(`Вам открытка от ${data.from || 'кого-то особенного'} 🌿`, `${occ.stamp}. Нажмите, чтобы открыть букет и пожелание.`);

  const now = Date.now();
  const locked = data.reveal && new Date(data.reveal).getTime() > now;

  if(locked){
    const bgLock = BACKGROUNDS.find(b=>b.id===data.background) || BACKGROUNDS[0];
    const d = new Date(data.reveal);
    document.getElementById('app').innerHTML = `<div class="view-stage ${bgLock.dark?'stage-dark':''}" style="background:${bgLock.css}"><div class="lock-screen">
      <div class="eyebrow">эта открытка ждёт своего момента</div>
      <h1 style="font-size:24px;margin-top:10px;">Откроется ${d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})} в ${d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</h1>
      <p class="num" style="margin-top:14px;">Загляните сюда чуть позже — и получите свой букет</p>
    </div></div>`;
    return;
  }

  const bg = BACKGROUNDS.find(b=>b.id===data.background) || BACKGROUNDS[0];
  document.getElementById('app').innerHTML = `
    <div class="view-stage ${bg.dark?'stage-dark':''}" style="background:${bg.css}">
      <div class="view-card">
        <button class="view-envelope" id="envelope" onclick="openCard(${data.music?'true':'false'}, '${data.occasion}', '${data.melody}')" aria-label="Открыть открытку">
          ${envelopeSvg(occ.color, data.envelope)}
          <div class="view-open-hint">Нажмите, чтобы открыть</div>
        </button>
        <div class="view-content" id="viewContent">
          <div class="view-occasion-band" style="background:${occ.color}">${occ.stamp}</div>
          <div class="view-bouquet-wrap" id="viewBouquet">${buildBouquetSVG(data, 300)}</div>
          <div class="view-msg" id="viewMsg">${esc(data.message)}</div>
          <div class="view-from" id="viewFrom">${data.to ? `Для ${esc(data.to)}` : ''}${data.to && data.from ? ' · ' : ''}${data.from ? `от ${esc(data.from)}` : ''}</div>
          <div class="view-footer">Открытка создана в <a href="#" onclick="goHome();return false;">${BRAND}</a> — соберите свою за пару минут</div>
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
  setPageTitle('Мои открытки');
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="mine-wrap">
      <div class="eyebrow">${session.user ? 'в вашем аккаунте' : 'на этом устройстве'}</div>
      <h1 style="font-size:26px;margin-top:8px;">Открытки, которые вы собрали</h1>
      <div class="mine-note">${session.user
        ? 'Открытки сохранены за вашим аккаунтом и доступны с любого устройства.'
        : 'Этот список хранится только в браузере на этом устройстве и пропадёт при очистке кэша. <a href="#login">Войдите</a>, чтобы открытки сохранялись за вами навсегда.'}</div>
      <div class="mine-list" id="mineList"><p style="opacity:.6;">Загрузка…</p></div>
    </div>
    <footer class="site-footer">${footerHtml()}</footer>
  `;

  let list = [];
  if(session.user){
    try{
      const res = await fetch('/api/cards');
      const json = await res.json();
      list = (json.cards || []).map(c => ({ id:c.id, occasion:c.occasion, to:c.to, createdAt:c.createdAt, data:c.encodedData, server:true }));
    }catch(e){ list = []; }
  } else {
    try{ list = JSON.parse(localStorage.getItem('my-cards') || '[]'); }catch(e){ list = []; }
  }

  const wrap = document.getElementById('mineList');
  if(!wrap) return; // пользователь мог уйти со страницы, пока шёл запрос
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
        <button onclick="openCardLink('${item.data}')">Открыть</button>
        <button onclick="copyMineLink('${item.data}')">Ссылка</button>
        <button onclick="deleteMineCard('${item.id}', ${item.server?'true':'false'})">Удалить</button>
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
function copyMineLink(encodedData){
  const url = location.origin + location.pathname + '?data=' + encodedData;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>showToast('Ссылка скопирована'));
  } else {
    showToast(url);
  }
}
async function deleteMineCard(id, isServer){
  if(isServer){
    try{
      const res = await fetch('/api/cards/'+encodeURIComponent(id), { method:'DELETE' });
      if(!res.ok) throw new Error();
    }catch(e){ showToast('Не удалось удалить открытку'); return; }
  } else {
    let list = JSON.parse(localStorage.getItem('my-cards') || '[]');
    list = list.filter(item => item.id !== id);
    localStorage.setItem('my-cards', JSON.stringify(list));
  }
  renderMyCards(); // перерисовать список без удалённой открытки
  showToast('Открытка удалена');
}

/* ====================== АККАУНТ (вход/регистрация/профиль) ====================== */

function renderLogin(){
  if(session.user){ goHome(); return; }
  setPageTitle('Вход');
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap">
      <div class="eyebrow">аккаунт</div>
      <h1 style="font-size:26px;margin-top:8px;">Вход</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;">Чтобы открытки сохранялись за вами, а не только в этом браузере.</p>
      <form id="loginForm" class="auth-form">
        <label class="sr-only" for="loginEmail">Email</label>
        <input type="email" id="loginEmail" placeholder="Email" required autocomplete="username">
        <label class="sr-only" for="loginPassword">Пароль</label>
        <input type="password" id="loginPassword" placeholder="Пароль" required autocomplete="current-password">
        <div class="auth-error" id="loginError"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;">Войти</button>
      </form>
      <p class="auth-switch">Нет аккаунта? <a href="#register">Зарегистрироваться</a></p>
      <p class="auth-switch">Забыли пароль? <a href="#forgot">Восстановить</a></p>
    </div>
  `;
  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    try{
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || 'Не удалось войти');
      session.user = json.user;
      showToast('Добро пожаловать!');
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
  setPageTitle('Регистрация');
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap">
      <div class="eyebrow">аккаунт</div>
      <h1 style="font-size:26px;margin-top:8px;">Регистрация</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;">Займёт полминуты. Пароль — не короче 6 символов.</p>
      <form id="registerForm" class="auth-form">
        <label class="sr-only" for="regName">Имя</label>
        <input type="text" id="regName" placeholder="Имя (необязательно)" maxlength="60" autocomplete="name">
        <label class="sr-only" for="regEmail">Email</label>
        <input type="email" id="regEmail" placeholder="Email" required autocomplete="username">
        <label class="sr-only" for="regPassword">Пароль</label>
        <input type="password" id="regPassword" placeholder="Пароль" required minlength="6" autocomplete="new-password">
        <div class="auth-error" id="registerError"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;">Создать аккаунт</button>
      </form>
      <p class="auth-switch">Уже есть аккаунт? <a href="#login">Войти</a></p>
    </div>
  `;
  document.getElementById('registerForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const errEl = document.getElementById('registerError');
    errEl.textContent = '';
    try{
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password, name }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || 'Не удалось зарегистрироваться');
      session.user = json.user;
      showToast('Аккаунт создан');
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
  setPageTitle('Восстановление пароля');
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap">
      <div class="eyebrow">аккаунт</div>
      <h1 style="font-size:26px;margin-top:8px;">Восстановление пароля</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;">Укажите email, на который зарегистрирован аккаунт — пришлём ссылку для сброса пароля.</p>
      <form id="forgotForm" class="auth-form">
        <label class="sr-only" for="forgotEmail">Email</label>
        <input type="email" id="forgotEmail" placeholder="Email" required autocomplete="username">
        <div class="auth-error" id="forgotError"></div>
        <div class="auth-note" id="forgotNote" style="display:none;"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;" id="forgotSubmit">Отправить ссылку</button>
      </form>
      <p class="auth-switch">Вспомнили пароль? <a href="#login">Войти</a></p>
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
      const res = await fetch('/api/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || 'Не удалось отправить ссылку');
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
  setPageTitle('Новый пароль');
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap">
      <div class="eyebrow">аккаунт</div>
      <h1 style="font-size:26px;margin-top:8px;">Новый пароль</h1>
      <p style="opacity:.7;margin-top:8px;font-size:14px;">Придумайте новый пароль — не короче 6 символов.</p>
      <form id="resetForm" class="auth-form">
        <label class="sr-only" for="resetPassword">Новый пароль</label>
        <input type="password" id="resetPassword" placeholder="Новый пароль" required minlength="6" autocomplete="new-password">
        <div class="auth-error" id="resetError"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;">Сохранить пароль</button>
      </form>
    </div>
  `;
  document.getElementById('resetForm').onsubmit = async (e) => {
    e.preventDefault();
    const password = document.getElementById('resetPassword').value;
    const errEl = document.getElementById('resetError');
    errEl.textContent = '';
    try{
      const res = await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, password }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || 'Не удалось сохранить пароль');
      session.user = json.user;
      showToast('Пароль обновлён, вы вошли в аккаунт');
      goHome();
    }catch(err){
      errEl.textContent = err.message;
    }
  };
}

function renderAccount(){
  if(!session.user){ pendingRoute = 'account'; location.hash = 'login'; return; }
  setPageTitle('Аккаунт');
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="auth-wrap" style="max-width:520px;">
      <div class="eyebrow">аккаунт</div>
      <h1 style="font-size:26px;margin-top:8px;">${esc(session.user.name || session.user.email)}</h1>
      <p style="opacity:.6;margin-top:4px;font-size:13.5px;">${esc(session.user.email)}</p>

      <button class="btn btn-ghost" style="margin-top:22px;" onclick="doLogout()">Выйти из аккаунта</button>
    </div>
  `;
}

async function doLogout(){
  try{ await fetch('/api/auth/logout', { method:'POST' }); }catch(e){}
  session.user = null;
  showToast('Вы вышли из аккаунта');
  goHome();
}

/* ====================== ЮРИДИЧЕСКИЕ СТРАНИЦЫ ====================== */

function renderPrivacy(){
  setPageTitle('Конфиденциальность');
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="legal-wrap">
      <div class="eyebrow">документ</div>
      <h1 style="font-size:28px;margin-top:8px;">Политика конфиденциальности</h1>
      <p class="legal-updated">Последнее обновление: черновик — перед публикацией согласуйте с юристом.</p>

      <h2>Какие данные мы собираем</h2>
      <p>Email и (опционально) имя — при регистрации аккаунта. Пароль хранится не в открытом виде, а в виде хеша. Содержимое собранных вами открыток (текст, выбор цветов и т.д.) — если вы вошли в аккаунт, чтобы список «Мои открытки» не терялся между устройствами.</p>

      <h2>Как используются данные</h2>
      <p>Для входа в аккаунт и отображения ваших открыток. Мы не продаём и не передаём email третьим лицам, кроме случаев, предусмотренных законом.</p>

      <h2>Cookies и реклама</h2>
      <p>Один технический cookie используется для авторизации (хранит подписанный токен сессии) и не используется для рекламного трекинга. Отдельно на сайте могут показываться рекламные баннеры (например, Google AdSense или Яндекс.Директ) — рекламная сеть может устанавливать собственные cookies для показа объявлений. Эту секцию нужно будет дополнить точной формулировкой из политики выбранной рекламной сети перед подключением реальной рекламы.</p>

      <h2>Открытки без аккаунта</h2>
      <p>Если вы не входите в аккаунт, вся открытка целиком хранится в самой ссылке (в её части после «#») — сервер её не видит и не сохраняет. Список «Мои открытки» в этом случае хранится только в вашем браузере (localStorage).</p>

      <h2>Удаление данных</h2>
      <p>Вы можете удалить любую открытку из списка «Мои открытки». Чтобы удалить аккаунт целиком, напишите на <a href="mailto:support@mysweetbouquet.example">support@mysweetbouquet.example</a> (замените на реальный адрес поддержки перед запуском).</p>
    </div>
    <footer class="site-footer">${footerHtml()}</footer>
  `;
}

function renderTerms(){
  setPageTitle('Условия использования');
  document.getElementById('app').innerHTML = `
    ${topbarHtml()}
    <div class="legal-wrap">
      <div class="eyebrow">документ</div>
      <h1 style="font-size:28px;margin-top:8px;">Условия использования</h1>
      <p class="legal-updated">Последнее обновление: черновик — перед публикацией согласуйте с юристом.</p>

      <h2>Сервис</h2>
      <p>${BRAND} позволяет собрать виртуальный букет-открытку и отправить её ссылкой. Все цветы, вазы, конверты и фоны бесплатны. Сервис поддерживается показом рекламных баннеров.</p>

      <h2>Реклама</h2>
      <p>На страницах сайта могут показываться рекламные объявления от сторонних рекламных сетей (например, Google AdSense, Яндекс.Директ). Мы не отвечаем за содержание конкретных объявлений — их подбирает рекламная сеть.</p>

      <h2>Ответственность</h2>
      <p>Вы несёте ответственность за содержание текста, который добавляете в открытку. Запрещено использовать сервис для рассылки незаконного, оскорбительного или спам-контента.</p>

      <h2>Изменения</h2>
      <p>Мы можем обновлять эти условия; актуальная версия всегда доступна на этой странице.</p>
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
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}