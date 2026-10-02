// SHMC single-page front end (vanilla JS)
const $ = s => document.querySelector(s), app = $('#app');
let S = JSON.parse(localStorage.getItem('shmc') || 'null');
const rs = n => 'Rs. ' + Number(n).toLocaleString('en-IN');
const dt = s => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
const pill = s => `<span class="pill ${s}">${s.replace('_', ' ')}</span>`;
const SURVEY = ['Sleep time (1 = before 10 pm, 5 = after 2 am)', 'Night study (1 = never, 5 = every night)',
  'Cleanliness (1 = relaxed, 5 = very tidy)', 'Noise tolerance (1 = need silence, 5 = fine with noise)', 'Guests (1 = rarely, 5 = often)'];

async function api(path, body, method) {
  const r = await fetch('/api' + path, { method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (S?.token || '') },
    body: body && JSON.stringify(body) });
  const j = await r.json();
  if (r.status === 401 && S) { logout(); throw j; }
  if (!r.ok) throw j; return j;
}
const err = (e, el = '#msg') => { const m = $(el); if (m) m.innerHTML = `<p class=err>${e.error || e}</p>`; };
function logout() { localStorage.removeItem('shmc'); S = null; boot(); }

const TABS = {
  student: { Home: home, 'Apply for room': apply, Fees: fees, Complaints: complaints, 'Leave & gate pass': leaves },
  warden: { Dashboard: dashboard, Allotment: allotment, Complaints: complaints, 'Leave requests': leaves },
  accountant: { Dues: fees, Dashboard: dashboard },
  guard: { 'Scan gate pass': scan, Visitors: visitors } };

function boot(tab) {
  if (!S) { $('#tabs').innerHTML = $('#who').innerHTML = ''; return login(); }
  $('#who').innerHTML = `${S.user.name} &middot; ${S.user.role} &nbsp;<button class="b g s" onclick="logout()">Log out</button>`;
  const t = TABS[S.user.role]; tab = tab || Object.keys(t)[0];
  $('#tabs').innerHTML = Object.keys(t).map(k => `<button class="${k === tab ? 'on' : ''}" onclick="boot('${k}')">${k}</button>`).join('');
  app.innerHTML = '<p class=muted>Loading...</p>'; t[tab]().catch(e => app.innerHTML = `<p class=err>${e.error || e}</p>`);
}

function login() {
  app.innerHTML = `<div class="card login"><img src="cgu.png"><h2 style="text-align:center">Sign in to SHMC</h2>
    <label>Roll number / Staff ID<input id=l value=""></label><label>Password<input id=p type=password></label>
    <button class="b" style="width:100%" id=go>Sign in</button><div id=msg></div>
    <p class=muted style="font-size:12px">Demo: 2301020456, warden1, accounts, guard1 &middot; password pass123</p></div>`;
  $('#go').onclick = async () => { try { S = await api('/login', { login: $('#l').value, password: $('#p').value });
    localStorage.setItem('shmc', JSON.stringify(S)); boot(); } catch (e) { err(e); } };
}

// ---------------- student ----------------
async function home() {
  const m = await api('/me');
  app.innerHTML = `<div class=grid>
    <div class="card stat"><span class=muted>My room</span><b>${m.room ? m.room.room_no : 'Not allotted'}</b>${m.room ? `${m.room.hall} &middot; ${m.room.type}` : ''}</div>
    <div class="card stat"><span class=muted>Application</span><b style="font-size:18px">${m.application ? pill(m.application.status) : 'Not applied'}</b>
      ${m.application ? 'Submitted ' + dt(m.application.submitted_at) : ''}</div>
    <div class="card stat"><span class=muted>Roll number</span><b style="font-size:20px">${m.login}</b>Year ${m.year} &middot; CGPA ${m.cgpa}</div></div>
    <div class=card><h2>Roommates</h2>${m.roommates.length ? m.roommates.map(r => `<p>${r.name} <span class=muted>(${r.login})</span></p>`).join('')
      : '<p class=muted>No roommates yet.</p>'}</div>`;
}

async function apply() {
  const m = await api('/me'), opt = v => ['SINGLE', 'DOUBLE', 'TRIPLE'].map(t => `<option ${t === v ? 'selected' : ''}>${t}</option>`).join('');
  app.innerHTML = `<div class=card><h2>Room application, session 2026-27</h2>
    ${m.room ? `<p class=okmsg>You are already allotted ${m.room.room_no}.</p>` : ''}
    <div class=row><label>1st preference<select id=p1>${opt('DOUBLE')}</select></label>
    <label>2nd preference<select id=p2>${opt('TRIPLE')}</select></label><label>3rd preference<select id=p3>${opt('SINGLE')}</select></label></div>
    <h3>Lifestyle survey <span class=muted style="font-weight:400">(used to match compatible roommates)</span></h3>
    ${SURVEY.map((q, i) => `<label>${q}<input type=range min=1 max=5 id=s${i} value=${m.survey[i]} oninput="this.nextElementSibling.textContent=this.value"><span>${m.survey[i]}</span></label>`).join('')}
    <button class=b id=go>Submit application</button><div id=msg></div></div>`;
  $('#go').onclick = async () => { try {
    await api('/applications', { prefs: [...new Set(['#p1', '#p2', '#p3'].map(s => $(s).value))], survey: [0, 1, 2, 3, 4].map(i => +$('#s' + i).value) });
    $('#msg').innerHTML = '<p class=okmsg>Application submitted. You will get your room after the warden runs allotment.</p>'; } catch (e) { err(e); } };
}

async function fees() {
  const inv = await api('/invoices'), acc = S.user.role === 'accountant';
  const due = inv.filter(i => i.status === 'UNPAID').reduce((s, i) => s + i.amount + i.fine, 0);
  app.innerHTML = `<div class=grid><div class="card stat"><span class=muted>Outstanding</span><b>${rs(due)}</b></div>
    <div class="card stat"><span class=muted>Invoices</span><b>${inv.length}</b>${inv.filter(i => i.status === 'PAID').length} paid</div></div>
    <div class=card><h2>${acc ? 'All invoices' : 'My invoices'}</h2><table><tr>${acc ? '<th>Student</th>' : ''}<th>Fee head</th><th>Amount</th><th>Fine</th><th>Due</th><th>Status</th><th></th></tr>
    ${inv.map(i => `<tr>${acc ? `<td>${i.name}<br><span class=muted>${i.login}</span></td>` : ''}<td>${i.head}</td><td>${rs(i.amount)}</td><td>${i.fine ? rs(i.fine) : '-'}</td>
      <td>${dt(i.due)}</td><td>${pill(i.status)}</td><td>${i.status === 'PAID' ? `<a class="b g s" target=_blank href="/receipt/${i.pay_id}?t=${S.token}">Receipt</a>`
      : acc ? `<button class="b s" onclick="offline(${i.invoice_id})">Record challan</button>` : `<button class="b s" onclick="pay(${i.invoice_id})">Pay now</button>`}</td></tr>`).join('')
      || '<tr><td colspan=7 class=muted>No invoices yet.</td></tr>'}</table><div id=msg></div></div>`;
}
async function pay(id) {
  try { const o = await api('/gateway/checkout', { invoice_id: id });
    $('#modal').innerHTML = `<div class=bg><div class=box><div class=top><small>SHMC Pay &middot; test mode</small><b>${rs(o.amount)}</b>${o.head}</div>
      <div class=in><p class=muted>Order ${o.order_id}</p><label>UPI ID<input value="student@okaxis"></label>
      <button class=b style="width:100%" id=pp>Pay ${rs(o.amount)}</button> <button class="b g" style="width:100%;margin-top:6px" onclick="$('#modal').innerHTML=''">Cancel</button></div></div></div>`;
    $('#pp').onclick = async () => { const r = await api('/gateway/pay', { order_id: o.order_id }); $('#modal').innerHTML = '';
      await fees(); $('#msg').innerHTML = `<p class=okmsg>Payment ${r.payment_id} confirmed by gateway webhook.</p>`; };
  } catch (e) { err(e); }
}
async function offline(id) { const ref = prompt('Bank challan reference number'); if (ref) { await api('/payments/offline', { invoice_id: id, ref }); fees(); } }

async function complaints() {
  const list = await api('/complaints'), st = S.user.role === 'student';
  const next = { OPEN: 'ASSIGNED', ESCALATED: 'ASSIGNED', REOPENED: 'ASSIGNED', ASSIGNED: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED' };
  const verb = { ASSIGNED: 'Assign', IN_PROGRESS: 'Start work', RESOLVED: 'Mark resolved' };
  const left = c => { const h = (Date.parse(c.sla_deadline) - Date.now()) / 3600e3;
    return ['CLOSED', 'RESOLVED'].includes(c.status) ? '-' : h < 0 ? `<span class=err>Breached ${(-h).toFixed(1)} h ago</span>` : `${h.toFixed(1)} h left`; };
  app.innerHTML = (st ? `<div class=card><h2>Raise a complaint</h2><div class=row>
    <label>Category<select id=cat>${['Electrical', 'Plumbing', 'Cleaning', 'Furniture', 'Internet', 'Other'].map(c => `<option>${c}</option>`).join('')}</select></label>
    <label style="flex:3">Description<input id=desc placeholder="What is wrong and where?"></label><button class=b id=go style="flex:0 0 auto">Submit</button></div><div id=msg></div></div>`
    : `<div class=card style="display:flex;justify-content:space-between;align-items:center"><span>SLA checker runs every 15 minutes. Run it now to escalate overdue complaints.</span>
      <button class=b id=job>Run SLA check</button></div>`) +
    `<div class=card><h2>${st ? 'My complaints' : 'All complaints'}</h2><table><tr><th>#</th>${st ? '' : '<th>Student</th>'}<th>Category</th><th>Description</th><th>Status</th><th>Staff</th><th>SLA</th><th></th></tr>
    ${list.map(c => `<tr><td>${c.comp_id}</td>${st ? '' : `<td>${c.name}</td>`}<td>${c.category}</td><td>${c.description}</td><td>${pill(c.status)}</td><td>${c.staff || '-'}</td><td>${left(c)}</td>
      <td>${st ? (c.status === 'RESOLVED' ? `<button class="b s" onclick="mv(${c.comp_id},'CLOSED')">Confirm</button> <button class="b g s" onclick="mv(${c.comp_id},'REOPENED')">Reopen</button>` : '')
      : next[c.status] ? `<button class="b s" onclick="mv(${c.comp_id},'${next[c.status]}')">${verb[next[c.status]]}</button>` : ''}</td></tr>`).join('')
      || '<tr><td colspan=8 class=muted>No complaints.</td></tr>'}</table></div>`;
  if (st) $('#go').onclick = async () => { try { await api('/complaints', { category: $('#cat').value, description: $('#desc').value }); complaints(); } catch (e) { err(e); } };
  else $('#job').onclick = async () => { const r = await api('/jobs/run', {}); await complaints(); alert(`${r.escalated} complaint(s) escalated, ${r.fined} late fine(s) applied`); };
}
async function mv(id, status) {
  const staff = status === 'ASSIGNED' ? prompt('Assign to staff member', 'Electrician - Ramesh') : null;
  try { await api('/complaints/' + id, { status, staff }, 'PATCH'); complaints(); } catch (e) { alert(e.error); }
}

async function leaves() {
  const list = await api('/leaves'), st = S.user.role === 'student', d = n => new Date(Date.now() + n * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16), iso = v => new Date(v).toISOString();
  app.innerHTML = (st ? `<div class=card><h2>Apply for leave</h2><div class=row><label>From<input type=datetime-local id=f value="${d(0)}"></label>
    <label>To<input type=datetime-local id=t value="${d(3)}"></label><label>Destination<input id=dest value="Home, Balasore"></label>
    <label>Reason<input id=why value="Family function"></label><button class=b id=go style="flex:0 0 auto">Apply</button></div><div id=msg></div></div><div id=pass></div>` : '') +
    `<div class=card><h2>${st ? 'My leave requests' : 'Leave requests'}</h2><table><tr>${st ? '' : '<th>Student</th>'}<th>From</th><th>To</th><th>Destination</th><th>Status</th><th>Out</th><th>In</th><th></th></tr>
    ${list.map(l => `<tr>${st ? '' : `<td>${l.name}<br><span class=muted>${l.login}</span></td>`}<td>${dt(l.from_ts)}</td><td>${dt(l.to_ts)}</td><td>${l.destination}</td><td>${pill(l.status)}</td>
      <td>${dt(l.out_at)}</td><td>${dt(l.in_at)}</td><td>${st ? (l.status === 'APPROVED' ? `<button class="b s" onclick="qr(${l.leave_id})">Show QR pass</button>` : '')
      : l.status === 'PENDING' ? `<button class="b s" onclick="decide(${l.leave_id},true)">Approve</button> <button class="b g s" onclick="decide(${l.leave_id},false)">Reject</button>` : ''}</td></tr>`).join('')
      || '<tr><td colspan=8 class=muted>No leave requests.</td></tr>'}</table></div>`;
  if (st) $('#go').onclick = async () => { try { await api('/leaves', { from_ts: iso($('#f').value), to_ts: iso($('#t').value), destination: $('#dest').value, reason: $('#why').value }); leaves(); } catch (e) { err(e); } };
}
async function decide(id, approve) { await api('/leaves/' + id, { approve }, 'PATCH'); leaves(); }
async function qr(id) {
  const r = await api(`/leaves/${id}/qr`);
  $('#pass').innerHTML = `<div class="card qr"><img src="${r.qr}"><div><h2>Digital gate pass</h2><p>Show this QR at the gate. It is signed with HMAC-SHA256,
    so any edit makes it invalid.</p><code>${r.token}</code></div></div>`;
}

// ---------------- warden ----------------
async function dashboard() {
  const d = await api('/dashboard'), max = Math.max(...d.occupancy.map(o => o.beds));
  const bars = d.occupancy.map((o, i) => { const x = 60 + i * 150, h1 = o.beds / max * 160, h2 = o.occupied / max * 160;
    return `<rect x=${x} y=${190 - h1} width=44 height=${h1} fill="#e4dfdb"/><rect x=${x + 48} y=${190 - h2} width=44 height=${h2} fill="#be3e24"/>
      <text x=${x + 46} y=210 text-anchor=middle font-size=12>${o.type}</text><text x=${x + 22} y=${184 - h1} text-anchor=middle font-size=11>${o.beds}</text>
      <text x=${x + 70} y=${184 - h2} text-anchor=middle font-size=11>${o.occupied}</text>`; }).join('');
  const beds = d.occupancy.reduce((s, o) => s + o.beds, 0), occ = d.occupancy.reduce((s, o) => s + o.occupied, 0);
  app.innerHTML = `<div class=grid><div class="card stat"><span class=muted>Occupancy, ${d.hall}</span><b>${occ}/${beds}</b>${Math.round(occ / beds * 100)}% beds filled</div>
    <div class="card stat"><span class=muted>Pending dues</span><b>${rs(d.dues.amt)}</b>${d.dues.n} unpaid invoices</div>
    <div class="card stat"><span class=muted>Collected</span><b>${rs(d.collected)}</b>all halls</div>
    <div class="card stat"><span class=muted>Open complaints</span><b>${d.openComplaints}</b>${d.escalated} escalated &middot; ${d.studentsOut} students out</div></div>
    <div class=grid><div class=card><h2>Beds vs occupied, by room type</h2><svg viewBox="0 0 520 225" width=100%>${bars}
      <line x1=40 x2=500 y1=190 y2=190 stroke="#999"/><rect x=330 y=8 width=10 height=10 fill="#e4dfdb"/><text x=345 y=17 font-size=11>Beds</text>
      <rect x=390 y=8 width=10 height=10 fill="#be3e24"/><text x=405 y=17 font-size=11>Occupied</text></svg></div>
    <div class=card><h2>Room map</h2><div class=rooms>${d.rooms.map(r => `<div class=rm><b>${r.room_no}</b><br><span class=muted>${r.type}</span><br>
      ${Array.from({ length: r.capacity }, (_, i) => `<i class="${i < r.occupied ? 'f' : ''}"></i>`).join('')}</div>`).join('')}</div></div></div>`;
}

async function allotment() {
  const apps = await api('/applications');
  app.innerHTML = `<div class=card style="display:flex;justify-content:space-between;align-items:center"><div><h2 style="margin:0">Applications ranked by priority score</h2>
    <span class=muted>S = 0.30 seniority + 0.25 distance + 0.20 CGPA + 0.15 special need + 0.10 early application</span></div>
    <button class=b id=run>Run allotment engine</button></div><div id=prop></div>
    <div class=card><table><tr><th>#</th><th>Student</th><th>Year</th><th>CGPA</th><th>Home km</th><th>Preferences</th><th>Submitted</th><th>Status</th><th>Score</th></tr>
    ${apps.map((a, i) => `<tr><td>${i + 1}</td><td>${a.name}<br><span class=muted>${a.login}</span></td><td>${a.year}</td><td>${a.cgpa}</td><td>${a.home_km}${a.need ? ' &middot; need' : ''}</td>
      <td>${a.prefs.join(' > ')}</td><td>${dt(a.submitted_at)}</td><td>${pill(a.status)}</td><td><b>${a.score.toFixed(3)}</b></td></tr>`).join('') || '<tr><td colspan=9 class=muted>No pending applications.</td></tr>'}</table></div>`;
  $('#run').onclick = async () => {
    const p = await api('/allotment/run', {});
    $('#prop').innerHTML = `<div class=card><h2>Proposal: ${p.proposal.length} allotted, ${p.waitlist.length} waitlisted</h2><table><tr><th>Student</th><th>Score</th><th>Room</th><th>Type</th><th>Roommate compatibility</th></tr>
      ${p.proposal.map(x => `<tr><td>${x.name}</td><td>${x.score.toFixed(3)}</td><td><b>${x.room_no}</b></td><td>${x.type}</td><td>${x.compat ?? 'first in room'}</td></tr>`).join('')}
      ${p.waitlist.map(x => `<tr><td>${x.name}</td><td>${x.score.toFixed(3)}</td><td colspan=3>${pill('WAITLISTED')}</td></tr>`).join('')}</table>
      <p><button class=b id=pub>Publish allotment</button> <span id=msg></span></p></div>`;
    $('#pub').onclick = async () => { try { const r = await api('/allotment/publish', {}); await allotment();
      $('#prop').innerHTML = `<div class=card><p class=okmsg>Published: ${r.allotted} students allotted, ${r.waitlisted} waitlisted. Invoices raised.</p></div>`; } catch (e) { err(e); } };
  };
}

// ---------------- guard ----------------
async function scan() {
  app.innerHTML = `<div class=grid><div class=card><h2>Verify QR gate pass</h2><label>Scanned token<textarea id=tok rows=5 placeholder="Scan the QR or paste the token"></textarea></label>
    <div class=row><label>Direction<select id=dir><option>OUT</option><option>IN</option></select></label><button class=b id=go>Verify</button></div></div><div id=res></div></div>`;
  $('#go').onclick = async () => { const r = await api('/gate/scan', { token: $('#tok').value, direction: $('#dir').value });
    $('#res').innerHTML = `<div class="result ${r.valid ? 'y' : 'n'}">${r.valid ? (r.late ? 'VALID, LATE RETURN' : 'VALID PASS') : 'REJECTED'}
      <div style="font-size:14px;font-weight:400;margin-top:8px">${r.name ? `${r.name} (${r.rollNo})<br>Valid until ${dt(r.validTo)}<br>` : ''}${r.reason || 'Movement recorded at ' + dt(new Date())}</div></div>`; };
}
async function visitors() {
  const v = await api('/visitors');
  app.innerHTML = `<div class=card><h2>Visitor entry</h2><div class=row><label>Visitor name<input id=vn></label><label>Phone<input id=vp maxlength=10></label>
    <label>Visiting student (roll no.)<input id=vs></label><button class=b id=go style="flex:0 0 auto">Log entry</button></div><div id=msg></div></div>
    <div class=card><h2>Today's visitors</h2><table><tr><th>Name</th><th>Phone</th><th>Student</th><th>In</th></tr>
    ${v.map(x => `<tr><td>${x.name}</td><td>${x.phone}</td><td>${x.student}</td><td>${dt(x.in_at)}</td></tr>`).join('') || '<tr><td colspan=4 class=muted>None yet.</td></tr>'}</table></div>`;
  $('#go').onclick = async () => { try { await api('/visitors', { name: $('#vn').value, phone: $('#vp').value, student: $('#vs').value }); visitors(); } catch (e) { err(e); } };
}

boot();
