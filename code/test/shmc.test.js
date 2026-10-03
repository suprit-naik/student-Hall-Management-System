process.env.DB = ':memory:';
const test = require('node:test'), assert = require('node:assert');
const { score, compat, allot } = require('../engine'), { sign, verify } = require('../gate');
const { app, FLOW } = require('../server');

const st = (id, year, km, cgpa, need, survey) => ({ user_id: id, name: 'S' + id, year, home_km: km, cgpa, special_need: need, survey });
const room = (room_id, type, capacity, occupants = []) => ({ room_id, room_no: 'R' + room_id, type, capacity, occupants });

test('priority score matches the worked example (Section 8.1)', () => {
  assert.equal(+score(st(1, 4, 1200, 8.2, 0), 1, 4).toFixed(3), 0.764);
  assert.equal(+score(st(2, 2, 1800, 9.1, 0), 3, 4).toFixed(3), 0.565);
  assert.equal(+score(st(3, 1, 300, 7.0, 1), 2, 4).toFixed(3), 0.407);
  assert.equal(+score(st(4, 3, 50, 6.5, 0), 4, 4).toFixed(3), 0.338);
});

test('roommate compatibility matches Section 8.2', () => {
  assert.equal(+compat([2, 4, 5, 3, 2], [3, 4, 4, 3, 1]).toFixed(2), 0.84);
  assert.equal(+compat([2, 4, 5, 3, 2], [5, 1, 2, 1, 5]).toFixed(2), 0.29);
});

// basis paths of the allotment algorithm (Section 11.2)
const app1 = (s, prefs, t = '2026-01-01') => ({ student: s, prefs, submitted_at: t });
const A = st(1, 4, 1200, 8.2, 0, [2, 4, 5, 3, 2]);
test('P1: no applications', () => assert.deepEqual(allot([], [room(1, 'DOUBLE', 2)]), { proposal: [], waitlist: [] }));
test('P2: empty preference list is waitlisted', () => assert.equal(allot([app1(A, [])], [room(1, 'DOUBLE', 2)]).waitlist.length, 1));
test('P3: no vacancy of preferred type', () => assert.equal(allot([app1(A, ['SINGLE'])], [room(1, 'DOUBLE', 2)]).waitlist.length, 1));
test('P4: only vacancy is with an incompatible occupant', () =>
  assert.equal(allot([app1(A, ['DOUBLE'])], [room(1, 'DOUBLE', 2, [[5, 1, 2, 1, 5]])]).waitlist.length, 1));
test('P5: empty room is allotted', () => assert.equal(allot([app1(A, ['DOUBLE'])], [room(1, 'DOUBLE', 2)]).proposal[0].room_id, 1));
test('P6: two applicants, one bed: higher score wins', () => {
  const B = st(2, 1, 50, 6.0, 0, [2, 4, 5, 3, 2]);
  const r = allot([app1(B, ['SINGLE'], '2026-01-01'), app1(A, ['SINGLE'], '2026-01-02')], [room(1, 'SINGLE', 1)]);
  assert.equal(r.proposal[0].student_id, 1); assert.equal(r.waitlist[0].student_id, 2);
});
test('compatible roommate is preferred over an empty room', () =>
  assert.equal(allot([app1(A, ['DOUBLE'])], [room(1, 'DOUBLE', 2), room(2, 'DOUBLE', 2, [[3, 4, 4, 3, 1]])]).proposal[0].room_id, 2));

test('gate pass: valid token verifies, edited token fails', () => {
  const t = sign({ leaveId: 7, validTo: 100 }, 'k');
  assert.equal(verify(t, 'k').leaveId, 7);
  const forged = Buffer.from(JSON.stringify({ leaveId: 7, validTo: 999 })).toString('base64url') + '.' + t.split('.')[1];
  assert.equal(verify(forged, 'k'), null);
  assert.equal(verify(t, 'wrong-key'), null);
});

test('complaint state machine allows only legal moves', () => {
  assert.ok(FLOW.OPEN.includes('ASSIGNED'));
  assert.ok(!FLOW.OPEN.includes('CLOSED'));
  assert.ok(FLOW.ESCALATED.includes('ASSIGNED'));
  assert.deepEqual(FLOW.CLOSED, []);
});

test('API: login, role guard and allotment end to end', async () => {
  const srv = app.listen(0), base = `http://localhost:${srv.address().port}/api`;
  const call = async (p, body, tok, method) => {
    const r = await fetch(base + p, { method: method || (body ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (tok || '') }, body: body && JSON.stringify(body) });
    return { status: r.status, body: await r.json() };
  };
  try {
    assert.equal((await call('/login', { login: 'warden1', password: 'bad' })).status, 401);
    const w = (await call('/login', { login: 'warden1', password: 'pass123' })).body.token;
    const s = (await call('/login', { login: '2301020456', password: 'pass123' })).body.token;
    assert.equal((await call('/allotment/run', {}, s)).status, 403);
    assert.equal((await call('/applications', { prefs: ['DOUBLE'], survey: [2, 4, 4, 3, 2] }, s)).status, 201);
    const pub = await call('/allotment/publish', {}, w);
    assert.equal(pub.body.allotted, 16); assert.equal(pub.body.waitlisted, 5);   // 21 applicants, 16 free beds in Aryabhatta Hall
    const me = (await call('/me', null, s)).body;
    assert.ok(me.room, 'student has a room after publish');
    const inv = (await call('/invoices', null, s)).body;
    assert.equal(inv.length, 2);
    const o = (await call('/gateway/checkout', { invoice_id: inv[0].invoice_id }, s)).body;
    assert.ok((await call('/gateway/pay', { order_id: o.order_id }, s)).body.ok);
    const bad = await fetch(base + '/payments/webhook', { method: 'POST', headers: { 'x-signature': 'f'.repeat(64) },
      body: JSON.stringify({ invoice_id: inv[1].invoice_id, amount: 1, payment_id: 'x' }) });
    assert.equal(bad.status, 400);
  } finally { srv.close(); }
});
