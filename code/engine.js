// Allotment engine: priority score, roommate compatibility, room assignment
const W = { year: .30, dist: .25, cgpa: .20, need: .15, early: .10 };
const SW = [2, 1.5, 1.5, 1, 1], THETA = 0.6;

const score = (s, rank, n) =>
  W.year * (s.year - 1) / 3 + W.dist * Math.min(s.home_km, 1500) / 1500 +
  W.cgpa * s.cgpa / 10 + W.need * (s.special_need ? 1 : 0) +
  W.early * (n > 1 ? 1 - (rank - 1) / (n - 1) : 1);

const compat = (a, b) =>
  1 - SW.reduce((d, w, k) => d + w * Math.abs(a[k] - b[k]), 0) / (4 * SW.reduce((x, y) => x + y));

// apps: [{student, prefs, submitted_at}], rooms: [{room_id, room_no, type, capacity, occupants:[survey]}]
function rank(apps) {
  const n = apps.length;
  return [...apps].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
    .map((a, i) => ({ ...a, score: +score(a.student, i + 1, n).toFixed(3) }))
    .sort((a, b) => b.score - a.score);
}

function allot(apps, rooms) {
  const R = rooms.map(r => ({ ...r, occupants: [...r.occupants] })), proposal = [], waitlist = [];
  for (const a of rank(apps)) {
    let done = false;
    for (const type of a.prefs) {
      const free = R.filter(r => r.type === type && r.occupants.length < r.capacity);
      if (!free.length) continue;
      const avg = r => r.occupants.length
        ? r.occupants.reduce((s, o) => s + compat(a.student.survey, o), 0) / r.occupants.length : THETA;
      const best = free.reduce((x, y) => avg(y) > avg(x) ? y : x);
      if (!best.occupants.length || avg(best) >= THETA) {
        const c = best.occupants.length ? +avg(best).toFixed(2) : null;
        best.occupants.push(a.student.survey);
        proposal.push({ student_id: a.student.user_id, name: a.student.name, room_id: best.room_id,
          room_no: best.room_no, type, score: a.score, compat: c });
        done = true; break;
      }
    }
    if (!done) waitlist.push({ student_id: a.student.user_id, name: a.student.name, score: a.score });
  }
  return { proposal, waitlist };
}

module.exports = { score, compat, rank, allot, THETA };
