// Students Hall Management Center - API server
const express = require('express'), crypto = require('crypto'), QR = require('qrcode'), path = require('node:path');
const db = require('./db'), { rank, allot } = require('./engine'), { sign, verify, checkPw } = require('./gate');

const KEY = process.env.SESSION_KEY || 'shmc-session-key', PASS_KEY = process.env.PASS_KEY || 'shmc-gate-key-2026';
const GW_KEY = process.env.GW_KEY || 'mock-razorpay-secret';
const FEES = { SINGLE: 45000, DOUBLE: 38000, TRIPLE: 32000 }, MESS = 24000, FINE = 500;
const VISIT_FROM = +(process.env.VISIT_FROM || 7), VISIT_TO = +(process.env.VISIT_TO || 20);
const SLA = { Electrical: 12, Plumbing: 24, Cleaning: 24, Furniture: 72, Internet: 48, Other: 72 };
const FLOW = { OPEN: ['ASSIGNED'], ASSIGNED: ['IN_PROGRESS'], IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'], REOPENED: ['ASSIGNED'], ESCALATED: ['ASSIGNED'], CLOSED: [] };

const app = express(), now = () => new Date().toISOString();
const one = (s, ...a) => db.prepare(s).get(...a), all = (s, ...a) => db.prepare(s).all(...a);
const run = (s, ...a) => db.prepare(s).run(...a);
// Normalize URL and req.originalUrl for serverless environments (e.g. Vercel)
app.use((req, res, next) => {
  let u = req.url;
  if (req.query && req.query._path) {
    u = req.query._path.startsWith('/') ? req.query._path : '/' + req.query._path;
    delete req.query._path;
    const q = new URLSearchParams(req.query).toString();
    u = u + (q ? '?' + q : '');
  }
  u = u.replace(/^\/server\.js/, '').replace(/^\/api\/index\.js/, '') || '/';
  req.url = u;
  req.originalUrl = u;
  next();
});
app.use(express.json());

// Explicit clean redirect for /portal -> /portal/
app.get('/portal', (req, res) => res.redirect(302, '/portal/'));
app.use('/portal', express.static(path.join(__dirname, 'public'), { redirect: false })); // role-based portal (SPA)
app.use(express.static(path.join(__dirname, 'site')));                                     // landing page + 3D ID card (static Next.js export)

// --- auth: HMAC-signed session token + role guard -------------------------
const auth = (...roles) => (req, res, next) => {
  const t = verify((req.headers.authorization || '').replace('Bearer ', '') || req.query.t, KEY);
  if (!t || t.exp < Date.now()) return res.status(401).json({ error: 'Please log in again' });
  if (roles.length && !roles.includes(t.role)) return res.status(403).json({ error: 'Not allowed for your role' });
  req.user = one('SELECT * FROM user WHERE user_id=?', t.uid); next();
};
const fail = (res, code, error) => res.status(code).json({ error });

app.post('/api/login', (req, res) => {
  const u = one('SELECT * FROM user WHERE login=?', req.body.login || '');
  if (!u || !checkPw(req.body.password || '', u.hash)) return fail(res, 401, 'Wrong login or password');
  res.json({ token: sign({ uid: u.user_id, role: u.role, exp: Date.now() + 8 * 3600e3 }, KEY),
    user: { name: u.name, role: u.role, login: u.login } });
});

// --- student profile, room and roommates ----------------------------------
app.get('/api/me', auth(), (req, res) => {
  const u = req.user, room = one(`SELECT r.*, h.name hall FROM allotment a JOIN room r USING(room_id)
    JOIN hall h USING(hall_id) WHERE a.student_id=?`, u.user_id);
  res.json({ name: u.name, login: u.login, role: u.role, year: u.year, cgpa: u.cgpa, home_km: u.home_km,
    survey: JSON.parse(u.survey || '[3,3,3,3,3]'), room,
    roommates: room ? all(`SELECT name, login FROM allotment a JOIN user u ON u.user_id=a.student_id WHERE a.room_id=? AND a.student_id<>?`,
      room.room_id, u.user_id) : [],
    application: one('SELECT status, prefs, submitted_at FROM application WHERE student_id=?', u.user_id) });
});

// --- room application and allotment ---------------------------------------
app.post('/api/applications', auth('student'), (req, res) => {
  const u = req.user, { prefs, survey } = req.body;
  if (one(`SELECT 1 FROM invoice WHERE student_id=? AND status='UNPAID' AND due<?`, u.user_id, now()))
    return fail(res, 422, 'Clear overdue dues before applying');
  if (!Array.isArray(prefs) || !prefs.length || prefs.some(p => !FEES[p])) return fail(res, 422, 'Pick valid room types');
  if (!Array.isArray(survey) || survey.length !== 5 || survey.some(v => v < 1 || v > 5)) return fail(res, 422, 'Answer all 5 survey questions (1-5)');
  if (one('SELECT 1 FROM allotment WHERE student_id=?', u.user_id)) return fail(res, 409, 'You already have a room');
  run('UPDATE user SET survey=? WHERE user_id=?', JSON.stringify(survey.map(Number)), u.user_id);
  run(`INSERT INTO application(student_id,hall_id,prefs,submitted_at) VALUES (?,?,?,?)
       ON CONFLICT(student_id) DO UPDATE SET prefs=excluded.prefs, status='SUBMITTED'`,
    u.user_id, u.gender === 'M' ? 1 : 2, JSON.stringify(prefs), now());
  res.status(201).json({ ok: true });
});

const pending = hall => all(`SELECT a.*, u.* FROM application a JOIN user u ON u.user_id=a.student_id
  WHERE a.hall_id=? AND a.status IN ('SUBMITTED','WAITLISTED')`, hall)
  .map(r => ({ student: { ...r, survey: JSON.parse(r.survey) }, prefs: JSON.parse(r.prefs), submitted_at: r.submitted_at }));

app.get('/api/applications', auth('warden'), (req, res) =>
  res.json(rank(pending(req.user.hall_id)).map(a => ({ name: a.student.name, login: a.student.login,
    year: a.student.year, cgpa: a.student.cgpa, home_km: a.student.home_km, need: a.student.special_need,
    prefs: a.prefs, submitted_at: a.submitted_at, status: a.student.status, score: a.score }))));

const roomsWithOccupants = hall => all('SELECT * FROM room WHERE hall_id=?', hall).map(r => ({ ...r,
  occupants: all('SELECT survey FROM allotment a JOIN user u ON u.user_id=a.student_id WHERE room_id=?', r.room_id)
    .map(o => JSON.parse(o.survey)) }));

app.post('/api/allotment/run', auth('warden'), (req, res) =>
  res.json(allot(pending(req.user.hall_id), roomsWithOccupants(req.user.hall_id))));

app.post('/api/allotment/publish', auth('warden'), (req, res) => {
  const { proposal, waitlist } = allot(pending(req.user.hall_id), roomsWithOccupants(req.user.hall_id));
  const due = new Date(Date.now() + 15 * 864e5).toISOString();
  db.exec('BEGIN');
  try {
    for (const p of proposal) {
      const r = one('SELECT version FROM room WHERE room_id=?', p.room_id);
      const ok = run('UPDATE room SET occupied=occupied+1, version=version+1 WHERE room_id=? AND version=? AND occupied<capacity',
        p.room_id, r.version).changes;
      if (ok !== 1) throw new Error(`Room ${p.room_no} changed meanwhile, run again`);
      run('INSERT INTO allotment(student_id,room_id,at) VALUES (?,?,?)', p.student_id, p.room_id, now());
      run(`UPDATE application SET status='ALLOTTED' WHERE student_id=?`, p.student_id);
      run('INSERT INTO invoice(student_id,head,amount,due) VALUES (?,?,?,?),(?,?,?,?)',
        p.student_id, `Hostel fee (${p.type})`, FEES[p.type], due, p.student_id, 'Mess fee', MESS, due);
    }
    waitlist.forEach(w => run(`UPDATE application SET status='WAITLISTED' WHERE student_id=?`, w.student_id));
    db.exec('COMMIT'); res.json({ allotted: proposal.length, waitlisted: waitlist.length });
  } catch (e) { db.exec('ROLLBACK'); fail(res, 409, e.message); }
});

// --- dashboard ------------------------------------------------------------
app.get('/api/dashboard', auth('warden', 'accountant'), (req, res) => {
  const hall = req.user.hall_id || 1;
  res.json({
    hall: one('SELECT name FROM hall WHERE hall_id=?', hall).name,
    occupancy: all(`SELECT type, SUM(capacity) beds, SUM(occupied) occupied FROM room WHERE hall_id=? GROUP BY type`, hall),
    dues: one(`SELECT COUNT(*) n, COALESCE(SUM(amount+fine),0) amt FROM invoice WHERE status='UNPAID'`),
    collected: one(`SELECT COALESCE(SUM(amount),0) amt FROM payment`).amt,
    openComplaints: one(`SELECT COUNT(*) c FROM complaint WHERE status NOT IN ('CLOSED','RESOLVED')`).c,
    escalated: one(`SELECT COUNT(*) c FROM complaint WHERE status='ESCALATED'`).c,
    studentsOut: one(`SELECT COUNT(*) c FROM leave_pass WHERE out_at IS NOT NULL AND in_at IS NULL`).c,
    rooms: all('SELECT room_no, type, capacity, occupied FROM room WHERE hall_id=? ORDER BY room_no', hall) });
});

// --- fees and mock payment gateway ----------------------------------------
app.get('/api/invoices', auth('student', 'accountant'), (req, res) => res.json(req.user.role === 'student'
  ? all('SELECT i.*, p.pay_id FROM invoice i LEFT JOIN payment p USING(invoice_id) WHERE student_id=?', req.user.user_id)
  : all('SELECT i.*, u.name, u.login, p.pay_id FROM invoice i JOIN user u ON u.user_id=i.student_id LEFT JOIN payment p USING(invoice_id) ORDER BY i.status DESC, u.name')));

const orders = new Map();
app.post('/api/gateway/checkout', auth('student'), (req, res) => {
  const inv = one('SELECT * FROM invoice WHERE invoice_id=? AND student_id=?', req.body.invoice_id, req.user.user_id);
  if (!inv || inv.status === 'PAID') return fail(res, 422, 'Invoice not payable');
  const order_id = 'order_' + crypto.randomBytes(6).toString('hex');
  orders.set(order_id, { invoice_id: inv.invoice_id, amount: inv.amount + inv.fine });
  res.json({ order_id, amount: inv.amount + inv.fine, head: inv.head });
});

// Simulates Razorpay: the "gateway" signs a webhook and calls our handler server-to-server
app.post('/api/gateway/pay', auth('student'), (req, res) => {
  const o = orders.get(req.body.order_id);
  if (!o) return fail(res, 404, 'Unknown order');
  const body = JSON.stringify({ order_id: req.body.order_id, payment_id: 'pay_' + crypto.randomBytes(6).toString('hex'), ...o });
  const r = webhook(body, crypto.createHmac('sha256', GW_KEY).update(body).digest('hex'));
  r.ok ? res.json(r) : fail(res, 400, r.error);
});

app.post('/api/payments/webhook', express.text({ type: '*/*' }), (req, res) => {
  const r = webhook(typeof req.body === 'string' ? req.body : JSON.stringify(req.body), req.headers['x-signature']);
  res.status(r.ok ? 200 : 400).json(r);
});

function webhook(body, sig) {
  const good = crypto.createHmac('sha256', GW_KEY).update(body).digest('hex');
  if (!sig || sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)))
    return { ok: false, error: 'Invalid gateway signature' };
  const p = JSON.parse(body), inv = one('SELECT * FROM invoice WHERE invoice_id=?', p.invoice_id);
  if (!inv || p.amount !== inv.amount + inv.fine) return { ok: false, error: 'Amount mismatch' };
  if (one('SELECT 1 FROM payment WHERE gateway_ref=?', p.payment_id)) return { ok: true, duplicate: true };
  const pay_id = run(`INSERT INTO payment(invoice_id,amount,gateway_ref,mode,at) VALUES (?,?,?,'ONLINE',?)`,
    p.invoice_id, p.amount, p.payment_id, now()).lastInsertRowid;
  run(`UPDATE invoice SET status='PAID' WHERE invoice_id=?`, p.invoice_id);
  return { ok: true, pay_id: Number(pay_id), payment_id: p.payment_id };
}

app.post('/api/payments/offline', auth('accountant'), (req, res) => {
  const inv = one(`SELECT * FROM invoice WHERE invoice_id=? AND status='UNPAID'`, req.body.invoice_id);
  if (!inv || !req.body.ref) return fail(res, 422, 'Unpaid invoice and challan reference required');
  run(`INSERT INTO payment(invoice_id,amount,gateway_ref,mode,at) VALUES (?,?,?,'CHALLAN',?)`, inv.invoice_id, inv.amount + inv.fine, req.body.ref, now());
  run(`UPDATE invoice SET status='PAID' WHERE invoice_id=?`, inv.invoice_id); res.json({ ok: true });
});

app.get('/receipt/:id', auth('student', 'accountant'), (req, res) => {
  const r = one(`SELECT p.*, i.head, u.name, u.login FROM payment p JOIN invoice i USING(invoice_id)
    JOIN user u ON u.user_id=i.student_id WHERE pay_id=?`, req.params.id);
  if (!r || (req.user.role === 'student' && r.login !== req.user.login)) return res.status(404).send('Not found');
  res.send(`<!doctype html><link rel=stylesheet href=/portal/style.css><div class="receipt card">
    <img src=/portal/cgu.png width=64><h2>Fee Receipt</h2><p class=muted>Students Hall Management Center, C. V. Raman Global University</p>
    <table><tr><td>Receipt no.</td><td><b>SHMC-${String(r.pay_id).padStart(5, '0')}</b></td></tr>
    <tr><td>Student</td><td>${r.name} (${r.login})</td></tr><tr><td>Fee head</td><td>${r.head}</td></tr>
    <tr><td>Amount</td><td><b>Rs. ${r.amount.toLocaleString('en-IN')}</b></td></tr><tr><td>Mode</td><td>${r.mode}</td></tr>
    <tr><td>Reference</td><td>${r.gateway_ref}</td></tr><tr><td>Paid on</td><td>${new Date(r.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr></table>
    <p class=paid>PAID</p></div>`);
});

// --- complaints with SLA and state machine --------------------------------
app.post('/api/complaints', auth('student'), (req, res) => {
  const { category, description } = req.body;
  if (!SLA[category] || !(description || '').trim()) return fail(res, 422, 'Category and description are required');
  const t = Date.now();
  run('INSERT INTO complaint(student_id,category,description,raised_at,sla_deadline) VALUES (?,?,?,?,?)',
    req.user.user_id, category, description.trim(), new Date(t).toISOString(), new Date(t + SLA[category] * 3600e3).toISOString());
  res.status(201).json({ ok: true });
});

app.get('/api/complaints', auth('student', 'warden'), (req, res) => res.json(req.user.role === 'student'
  ? all('SELECT * FROM complaint WHERE student_id=? ORDER BY comp_id DESC', req.user.user_id)
  : all('SELECT c.*, u.name FROM complaint c JOIN user u ON u.user_id=c.student_id ORDER BY c.escalated DESC, c.comp_id DESC')));

app.patch('/api/complaints/:id', auth('warden', 'student'), (req, res) => {
  const c = one('SELECT * FROM complaint WHERE comp_id=?', req.params.id), to = req.body.status;
  if (!c) return fail(res, 404, 'No such complaint');
  if (!(FLOW[c.status] || []).includes(to)) return fail(res, 422, `Cannot move from ${c.status} to ${to}`);
  if (req.user.role === 'student' && (c.student_id !== req.user.user_id || c.status !== 'RESOLVED')) return fail(res, 403, 'Not allowed');
  run('UPDATE complaint SET status=?, staff=COALESCE(?,staff) WHERE comp_id=?', to, req.body.staff || null, c.comp_id);
  res.json({ ok: true });
});

const slaCheck = () => run(`UPDATE complaint SET status='ESCALATED', escalated=1
  WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS') AND sla_deadline<? AND escalated=0`, now()).changes;
const applyFines = () => run(`UPDATE invoice SET fine=? WHERE status='UNPAID' AND due<? AND fine=0`, FINE, now()).changes;
app.post('/api/jobs/run', auth('warden'), (req, res) => res.json({ escalated: slaCheck(), fined: applyFines() }));

// --- leave and QR gate pass -----------------------------------------------
app.post('/api/leaves', auth('student'), (req, res) => {
  const { from_ts, to_ts, destination, reason } = req.body, f = Date.parse(from_ts), t = Date.parse(to_ts);
  if (!f || !t || t <= f) return fail(res, 422, 'End must be after start');
  if (t - f > 30 * 864e5) return fail(res, 422, 'Leave cannot exceed 30 days');
  run('INSERT INTO leave_pass(student_id,from_ts,to_ts,destination,reason) VALUES (?,?,?,?,?)',
    req.user.user_id, new Date(f).toISOString(), new Date(t).toISOString(), destination, reason);
  res.status(201).json({ ok: true });
});

app.get('/api/leaves', auth('student', 'warden'), (req, res) => res.json(req.user.role === 'student'
  ? all('SELECT * FROM leave_pass WHERE student_id=? ORDER BY leave_id DESC', req.user.user_id)
  : all('SELECT l.*, u.name, u.login FROM leave_pass l JOIN user u ON u.user_id=l.student_id ORDER BY l.status DESC, leave_id DESC')));

app.patch('/api/leaves/:id', auth('warden'), (req, res) => {
  const l = one(`SELECT l.*, u.login FROM leave_pass l JOIN user u ON u.user_id=l.student_id WHERE leave_id=? AND status='PENDING'`, req.params.id);
  if (!l) return fail(res, 404, 'No pending leave');
  const token = req.body.approve ? sign({ kid: 'k2026', leaveId: l.leave_id, rollNo: l.login,
    validFrom: Date.parse(l.from_ts), validTo: Date.parse(l.to_ts), nonce: crypto.randomBytes(4).toString('hex') }, PASS_KEY) : null;
  run('UPDATE leave_pass SET status=?, token=? WHERE leave_id=?', req.body.approve ? 'APPROVED' : 'REJECTED', token, l.leave_id);
  res.json({ ok: true });
});

app.get('/api/leaves/:id/qr', auth('student'), async (req, res) => {
  const l = one(`SELECT token FROM leave_pass WHERE leave_id=? AND student_id=? AND status='APPROVED'`, req.params.id, req.user.user_id);
  l ? res.json({ qr: await QR.toDataURL(l.token, { margin: 1, width: 220 }), token: l.token }) : fail(res, 404, 'No pass');
});

app.post('/api/gate/scan', auth('guard'), (req, res) => {
  const p = verify(req.body.token, PASS_KEY), dir = req.body.direction;
  if (!p) return res.json({ valid: false, reason: 'Invalid signature: pass is forged or edited' });
  const l = one('SELECT l.*, u.name FROM leave_pass l JOIN user u ON u.user_id=l.student_id WHERE leave_id=?', p.leaveId);
  const t = Date.now(), who = { name: l.name, rollNo: p.rollNo, validTo: new Date(p.validTo).toISOString() };
  if (dir === 'OUT') {
    if (t < p.validFrom || t > p.validTo) return res.json({ valid: false, reason: 'Outside leave window', ...who });
    if (l.out_at) return res.json({ valid: false, reason: 'Pass already used for exit', ...who });
    run('UPDATE leave_pass SET out_at=? WHERE leave_id=?', now(), l.leave_id);
  } else {
    if (!l.out_at || l.in_at) return res.json({ valid: false, reason: 'No matching exit on record', ...who });
    run('UPDATE leave_pass SET in_at=? WHERE leave_id=?', now(), l.leave_id);
    if (t > p.validTo) return res.json({ valid: true, late: true, ...who });
  }
  res.json({ valid: true, ...who });
});

app.post('/api/visitors', auth('guard'), (req, res) => {
  const { name, phone, student } = req.body, h = +new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23' });
  if (!name || !/^\d{10}$/.test(phone || '')) return fail(res, 422, 'Name and 10-digit phone required');
  if (h >= VISIT_TO || h < VISIT_FROM) return fail(res, 422, `Visiting hours are ${VISIT_FROM}:00 to ${VISIT_TO}:00`);
  run('INSERT INTO visitor(name,phone,student,in_at) VALUES (?,?,?,?)', name, phone, student, now()); res.status(201).json({ ok: true });
});
app.get('/api/visitors', auth('guard'), (req, res) => res.json(all('SELECT * FROM visitor ORDER BY visitor_id DESC LIMIT 20')));

if (require.main === module) {
  setInterval(() => { slaCheck(); applyFines(); }, 15 * 60e3);
  app.listen(process.env.PORT || 3000, () => console.log('SHMC running on http://localhost:' + (process.env.PORT || 3000)));
}
app.app = app;
app.FLOW = FLOW;
app.slaCheck = slaCheck;
module.exports = app;
