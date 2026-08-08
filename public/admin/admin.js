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
  el.innerHTML = `<table><thead><tr><th>Time</th><th>Message</th><th>Page</th></tr></thead><tbody>${
    errors.map(e => `
      <tr>
        <td>${fmtTime(e.ts)}</td>
        <td class="msg">${escapeHtml(e.message)}${e.stack ? `<div class="stack">${escapeHtml(e.stack)}</div>` : ''}</td>
        <td class="msg">${escapeHtml(e.url)}</td>
      </tr>
    `).join('')
  }</tbody></table>`;
}

let currentSiteEnabled = true;

async function loadDashboard(){
  const [stats, errorsRes] = await Promise.all([api('/stats'), api('/errors')]);
  currentSiteEnabled = stats.siteEnabled;
  renderTraffic(stats.traffic, stats.counts);
  renderStatus(stats.siteEnabled);
  renderErrors(errorsRes.errors);
}

function showDashboard(){
  $('loginScreen').style.display = 'none';
  $('dashboard').style.display = '';
  $('logoutBtn').style.display = '';
  loadDashboard().catch(err => console.error(err));
}

function showLogin(){
  $('loginScreen').style.display = '';
  $('dashboard').style.display = 'none';
  $('logoutBtn').style.display = 'none';
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
