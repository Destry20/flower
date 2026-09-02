const $ = (id) => document.getElementById(id);

async function api(path, options){
  const res = await fetch('/api/admin' + path, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  });
  let body = null;
  try{ body = await res.json(); }catch(e){ /* no body */ }
  if(!res.ok) throw Object.assign(new Error((body && body.error) || ('HTTP ' + res.status)), { body });
  return body;
}

function fmtTime(ts){
  return new Date(ts).toLocaleString();
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function renderTraffic(traffic, counts){
  $('statToday').textContent = traffic.today;
  $('statTotal').textContent = traffic.total;
  $('statUsers').textContent = counts.users;
  $('statCards').textContent = counts.cards;
  $('statCardsSaved').textContent = counts.cardsSaved;
  $('statBotToday').textContent = traffic.todayBot;

  const max = Math.max(1, ...traffic.last7Days.map(d => d.count));
  $('trafficBars').innerHTML = traffic.last7Days.map(d =>
    `<div class="bar" style="height:${Math.max(2, Math.round(d.count / max * 76))}px"><span>${d.count}</span></div>`
  ).join('');
  $('trafficLabels').innerHTML = traffic.last7Days.map(d =>
    `<div>${d.date.slice(5)}</div>`
  ).join('');
}

function renderStatus(siteEnabled){
  const dot = $('statusDot');
  const text = $('statusText');
  const btn = $('toggleSiteBtn');
  dot.className = 'status-dot ' + (siteEnabled ? 'on' : 'off');
  text.textContent = siteEnabled ? 'Site is online' : 'Site is OFF (maintenance page shown to visitors)';
  btn.textContent = siteEnabled ? 'Turn site off' : 'Turn site back on';
  btn.className = siteEnabled ? 'danger' : '';
}

function renderErrors(errors){
  const el = $('errorsList');
  if(!errors.length){
    el.innerHTML = '<div class="empty">No errors reported.</div>';
    return;
  }
  el.innerHTML = `<table><thead><tr><th>Time</th><th>Message</th><th>Page</th><th></th></tr></thead><tbody>${
    errors.map(e => `
      <tr>
        <td>${fmtTime(e.ts)}</td>
        <td class="msg">${escapeHtml(e.message)}${e.stack ? `<div class="stack">${escapeHtml(e.stack)}</div>` : ''}</td>
        <td class="msg">${escapeHtml(e.url)}</td>
        <td class="dismiss"><button data-id="${e.id}" title="Dismiss" aria-label="Dismiss">✕</button></td>
      </tr>
    `).join('')
  }</tbody></table>`;
  el.querySelectorAll('td.dismiss button').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try{ await api('/errors/' + btn.dataset.id, { method: 'DELETE' }); await loadDashboard(); }
      catch(e){ btn.disabled = false; }
    });
  });
}

// Раньше сервер уже считал последние посещения (traffic.recent), но экран
// их просто никак не показывал — данные уходили в никуда. Показываем здесь.
// Каждый визит теперь помечен bot:true/false (см. isBotUserAgent в db.js) —
// боты предпросмотра ссылок в мессенджерах дёргают те же "/" и "/c/<id>",
// что и живые люди, и раньше их было не отличить в этом списке.
function renderRecent(recent){
  const el = $('recentList');
  if(!recent.length){
    el.innerHTML = '<div class="empty">No visits recorded yet.</div>';
    return;
  }
  el.innerHTML = `<table><thead><tr><th>Time</th><th>Page</th><th>Type</th></tr></thead><tbody>${
    recent.map(r => `<tr><td>${fmtTime(r.ts)}</td><td class="msg">${escapeHtml(r.path)}</td><td>${
      r.bot ? '<span class="tag tag-bot">bot</span>'
        : (r.suspicious ? '<span class="tag tag-suspicious" title="Same page hit 3+ times within seconds — likely a monitor/scraper spoofing a real browser">rapid?</span>' : '<span class="tag tag-visitor">visitor</span>')
    }</td></tr>`).join('')
  }</tbody></table>`;
}

// Кнопка удаления — общий паттерн для users/cards/groups ниже: подтверждение,
// DELETE-запрос по указанному пути, перезагрузка всего дашборда после успеха
// (проще, чем точечно убирать одну строку из трёх разных списков — счётчики
// вверху тоже должны обновиться).
function bindDeleteButtons(container, pathPrefix, confirmMsg){
  container.querySelectorAll('td.del button').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(!confirm(confirmMsg)) return;
      btn.disabled = true;
      try{ await api(pathPrefix + encodeURIComponent(btn.dataset.id), { method: 'DELETE' }); await loadDashboard(); }
      catch(e){ btn.disabled = false; alert(e.message); }
    });
  });
}

function renderUsers(users){
  const el = $('usersList');
  if(!users.length){
    el.innerHTML = '<div class="empty">No accounts found.</div>';
    return;
  }
  el.innerHTML = `<table><thead><tr><th>Signed up</th><th>Email</th><th>Name</th><th></th><th></th></tr></thead><tbody>${
    users.map(u => `<tr>
      <td>${fmtTime(u.createdAt)}</td>
      <td class="msg">${escapeHtml(u.email)}</td>
      <td class="msg">${escapeHtml(u.name || '—')}</td>
      <td>${u.provider === 'google' ? '<span class="tag tag-google">Google</span>' : ''}</td>
      <td class="del"><button data-id="${u.id}">Delete</button></td>
    </tr>`).join('')
  }</tbody></table>`;
  bindDeleteButtons(el, '/users/', 'Delete this account? This also removes any cards saved under it. This cannot be undone.');
}

function renderCards(cards){
  const el = $('cardsList');
  if(!cards.length){
    el.innerHTML = '<div class="empty">No cards found.</div>';
    return;
  }
  el.innerHTML = `<table><thead><tr><th>Created</th><th>By</th><th>Occasion</th><th>To</th><th>Link</th><th></th></tr></thead><tbody>${
    cards.map(c => `<tr>
      <td>${fmtTime(c.createdAt)}</td>
      <td class="msg">${escapeHtml(c.ownerEmail || 'guest')}</td>
      <td class="msg">${escapeHtml(c.occasion || '—')}</td>
      <td class="msg">${escapeHtml(c.to || '—')}</td>
      <td><a href="/c/${encodeURIComponent(c.shortId)}" target="_blank" rel="noopener">/c/${escapeHtml(c.shortId)}</a></td>
      <td class="del"><button data-id="${c.id}">Delete</button></td>
    </tr>`).join('')
  }</tbody></table>`;
  bindDeleteButtons(el, '/cards/', 'Delete this card? This cannot be undone.');
}

// Открытки "всей компанией" — раньше нигде не были видны в панели (см.
// listRecentGroupCards в db.js). closed берём уже посчитанным с сервера
// (isGroupCardClosed), а не пересчитываем closesAt здесь — источник истины
// один, на сервере.
function renderGroups(groups){
  const el = $('groupsList');
  if(!groups.length){
    el.innerHTML = '<div class="empty">No group cards found.</div>';
    return;
  }
  el.innerHTML = `<table><thead><tr><th>Created</th><th>Organizer</th><th>Occasion</th><th>To</th><th>Signed</th><th>Status</th><th>Link</th><th></th></tr></thead><tbody>${
    groups.map(g => `<tr>
      <td>${fmtTime(g.createdAt)}</td>
      <td class="msg">${escapeHtml(g.ownerEmail || '—')}</td>
      <td class="msg">${escapeHtml(g.occasion || '—')}</td>
      <td class="msg">${escapeHtml(g.to || '—')}</td>
      <td>${g.contributionsCount}</td>
      <td>${g.closed ? '<span class="tag tag-bot">closed</span>' : '<span class="tag tag-visitor">open</span>'}</td>
      <td><a href="/group/${encodeURIComponent(g.shortId)}" target="_blank" rel="noopener">/group/${escapeHtml(g.shortId)}</a></td>
      <td class="del"><button data-id="${g.shortId}">Delete</button></td>
    </tr>`).join('')
  }</tbody></table>`;
  bindDeleteButtons(el, '/groups/', 'Delete this group card? This cannot be undone.');
}

let currentSiteEnabled = true;
let refreshTimer = null;
const AUTO_REFRESH_MS = 60000;

// searchQuery — общий для users/cards/groups (см. .search-row в index.html):
// один запрос сразу фильтрует все три списка, а не три отдельных поля —
// проще для того единственного сценария, для которого это вообще нужно
// ("найти конкретного человека/открытку"), не три разных.
let searchQuery = '';

async function loadDashboard(){
  const q = searchQuery ? '?q=' + encodeURIComponent(searchQuery) : '';
  const [stats, errorsRes, usersRes, cardsRes, groupsRes] = await Promise.all([
    api('/stats'), api('/errors'), api('/users' + q), api('/cards' + q), api('/groups' + q)
  ]);
  currentSiteEnabled = stats.siteEnabled;
  renderTraffic(stats.traffic, stats.counts);
  renderStatus(stats.siteEnabled);
  renderRecent(stats.traffic.recent);
  renderErrors(errorsRes.errors);
  renderUsers(usersRes.users);
  renderCards(cardsRes.cards);
  renderGroups(groupsRes.groups);
  $('updatedAt').textContent = 'Updated ' + new Date().toLocaleTimeString();
}

async function loadTotpStatus(){
  const status = await api('/totp-status');
  $('totpEnabledBlock').style.display = status.enabled ? '' : 'none';
  $('totpDisabledBlock').style.display = status.enabled ? 'none' : '';
  if(status.enabled) $('totpSetupBlock').style.display = 'none';
  return status.enabled;
}

function showDashboard(){
  $('loginScreen').style.display = 'none';
  $('dashboard').style.display = '';
  $('logoutBtn').style.display = '';
  $('refreshBtn').style.display = '';
  loadDashboard().catch(err => console.error(err));
  loadTotpStatus().catch(err => console.error(err));
  if(refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => loadDashboard().catch(err => console.error(err)), AUTO_REFRESH_MS);
}

// Поле кода показываем на форме входа, только если 2FA вообще когда-либо
// включалась — иначе на каждый обычный вход (пока 2FA выключена) пришлось бы
// либо всегда держать лишнее поле, либо запрашивать статус уже после
// неудачной попытки. totp-status публичный и ничего чувствительного не
// раскрывает (см. комментарий в routes/admin.js).
async function showLogin(){
  $('loginScreen').style.display = '';
  $('dashboard').style.display = 'none';
  $('logoutBtn').style.display = 'none';
  $('refreshBtn').style.display = 'none';
  if(refreshTimer){ clearInterval(refreshTimer); refreshTimer = null; }
  try{
    const status = await api('/totp-status');
    $('totpInput').style.display = status.enabled ? '' : 'none';
  }catch(e){ /* форма входа и так работает без этого — не блокируем */ }
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginError').textContent = '';
  try{
    await api('/login', { method: 'POST', body: JSON.stringify({ password: $('passwordInput').value, code: $('totpInput').value }) });
    $('passwordInput').value = '';
    $('totpInput').value = '';
    showDashboard();
  }catch(err){
    if(err.body && err.body.needsTotp) $('totpInput').style.display = '';
    $('loginError').textContent = (err.body && err.body.error) || 'Wrong password.';
  }
});

$('refreshBtn').addEventListener('click', () => {
  loadDashboard().catch(err => console.error(err));
});

$('logoutBtn').addEventListener('click', async () => {
  await api('/logout', { method: 'POST' });
  showLogin();
});

$('toggleSiteBtn').addEventListener('click', async () => {
  const next = !currentSiteEnabled;
  const msg = next
    ? 'Turn the site back on for visitors?'
    : 'Turn the site OFF? Visitors will see a maintenance page until you turn it back on.';
  if(!confirm(msg)) return;
  const res = await api('/site-status', { method: 'POST', body: JSON.stringify({ enabled: next }) });
  currentSiteEnabled = res.siteEnabled;
  renderStatus(currentSiteEnabled);
});

$('clearErrorsBtn').addEventListener('click', async () => {
  if(!confirm('Clear the error log?')) return;
  await api('/errors/clear', { method: 'POST' });
  renderErrors([]);
});

function runSearch(){
  searchQuery = $('searchInput').value.trim();
  $('searchClearBtn').style.display = searchQuery ? '' : 'none';
  loadDashboard().catch(err => console.error(err));
}
$('searchBtn').addEventListener('click', runSearch);
$('searchInput').addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); runSearch(); } });
$('searchClearBtn').addEventListener('click', () => {
  $('searchInput').value = '';
  runSearch();
});

// --- 2FA setup flow ---
$('totpStartBtn').addEventListener('click', async () => {
  $('totpSetupError').textContent = '';
  const res = await api('/totp/setup', { method: 'POST' });
  $('totpSecretText').textContent = res.secret;
  $('totpQr').innerHTML = '';
  new QRCode($('totpQr'), { text: res.otpauth, width: 180, height: 180 });
  $('totpSetupBlock').style.display = '';
  $('totpConfirmInput').value = '';
  $('totpConfirmInput').focus();
});
$('totpConfirmBtn').addEventListener('click', async () => {
  $('totpSetupError').textContent = '';
  try{
    await api('/totp/confirm', { method: 'POST', body: JSON.stringify({ code: $('totpConfirmInput').value }) });
    await loadTotpStatus();
  }catch(err){
    $('totpSetupError').textContent = err.message;
  }
});
$('totpDisableBtn').addEventListener('click', async () => {
  if(!confirm('Disable 2FA? Logging in will only need the admin password again.')) return;
  await api('/totp/disable', { method: 'POST' });
  await loadTotpStatus();
});

api('/me').then(r => r.authenticated ? showDashboard() : showLogin()).catch(() => showLogin());
