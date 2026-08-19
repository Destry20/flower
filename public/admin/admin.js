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
  if(!res.ok) throw new Error((body && body.error) || ('HTTP ' + res.status));
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

function renderUsers(users){
  const el = $('usersList');
  if(!users.length){
    el.innerHTML = '<div class="empty">No accounts yet.</div>';
    return;
  }
  el.innerHTML = `<table><thead><tr><th>Signed up</th><th>Email</th><th>Name</th></tr></thead><tbody>${
    users.map(u => `<tr><td>${fmtTime(u.createdAt)}</td><td class="msg">${escapeHtml(u.email)}</td><td class="msg">${escapeHtml(u.name || '—')}</td></tr>`).join('')
  }</tbody></table>`;
}

function renderCards(cards){
  const el = $('cardsList');
  if(!cards.length){
    el.innerHTML = '<div class="empty">No cards created yet.</div>';
    return;
  }
  el.innerHTML = `<table><thead><tr><th>Created</th><th>By</th><th>Occasion</th><th>To</th><th>Link</th></tr></thead><tbody>${
    cards.map(c => `<tr>
      <td>${fmtTime(c.createdAt)}</td>
      <td class="msg">${escapeHtml(c.ownerEmail || '—')}</td>
      <td class="msg">${escapeHtml(c.occasion || '—')}</td>
      <td class="msg">${escapeHtml(c.to || '—')}</td>
      <td><a href="/c/${encodeURIComponent(c.shortId)}" target="_blank" rel="noopener">/c/${escapeHtml(c.shortId)}</a></td>
    </tr>`).join('')
  }</tbody></table>`;
}

let currentSiteEnabled = true;
let refreshTimer = null;
const AUTO_REFRESH_MS = 60000;

async function loadDashboard(){
  const [stats, errorsRes, usersRes, cardsRes] = await Promise.all([api('/stats'), api('/errors'), api('/users'), api('/cards')]);
  currentSiteEnabled = stats.siteEnabled;
  renderTraffic(stats.traffic, stats.counts);
  renderStatus(stats.siteEnabled);
  renderRecent(stats.traffic.recent);
  renderErrors(errorsRes.errors);
  renderUsers(usersRes.users);
  renderCards(cardsRes.cards);
  $('updatedAt').textContent = 'Updated ' + new Date().toLocaleTimeString();
}

function showDashboard(){
  $('loginScreen').style.display = 'none';
  $('dashboard').style.display = '';
  $('logoutBtn').style.display = '';
  $('refreshBtn').style.display = '';
  loadDashboard().catch(err => console.error(err));
  if(refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => loadDashboard().catch(err => console.error(err)), AUTO_REFRESH_MS);
}

function showLogin(){
  $('loginScreen').style.display = '';
  $('dashboard').style.display = 'none';
  $('logoutBtn').style.display = 'none';
  $('refreshBtn').style.display = 'none';
  if(refreshTimer){ clearInterval(refreshTimer); refreshTimer = null; }
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginError').textContent = '';
  try{
    await api('/login', { method: 'POST', body: JSON.stringify({ password: $('passwordInput').value }) });
    $('passwordInput').value = '';
    showDashboard();
  }catch(err){
    $('loginError').textContent = 'Wrong password.';
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

api('/me').then(r => r.authenticated ? showDashboard() : showLogin()).catch(() => showLogin());
