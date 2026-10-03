// SQLite schema and demo seed data (Node 22+ built-in sqlite)
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path'), os = require('node:os');
const { hash, sign } = require('./gate');
const dbPath = process.env.DB || (process.env.VERCEL ? path.join(os.tmpdir(), 'shmc.db') : path.join(__dirname, 'shmc.db'));
const db = new DatabaseSync(dbPath);

db.exec(`PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS hall(hall_id INTEGER PRIMARY KEY, name TEXT, gender TEXT);
CREATE TABLE IF NOT EXISTS room(room_id INTEGER PRIMARY KEY, hall_id INT REFERENCES hall, room_no TEXT,
  type TEXT CHECK(type IN ('SINGLE','DOUBLE','TRIPLE')), capacity INT, occupied INT DEFAULT 0,
  version INT DEFAULT 0, CHECK(occupied BETWEEN 0 AND capacity));
CREATE TABLE IF NOT EXISTS user(user_id INTEGER PRIMARY KEY, login TEXT UNIQUE, name TEXT, role TEXT,
  hash TEXT, hall_id INT, gender TEXT, year INT, cgpa REAL, home_km INT, special_need INT DEFAULT 0, survey TEXT);
CREATE TABLE IF NOT EXISTS application(app_id INTEGER PRIMARY KEY, student_id INT UNIQUE REFERENCES user,
  hall_id INT, prefs TEXT, submitted_at TEXT, status TEXT DEFAULT 'SUBMITTED');
CREATE TABLE IF NOT EXISTS allotment(allot_id INTEGER PRIMARY KEY, student_id INT UNIQUE REFERENCES user,
  room_id INT REFERENCES room, at TEXT);
CREATE TABLE IF NOT EXISTS invoice(invoice_id INTEGER PRIMARY KEY, student_id INT REFERENCES user, head TEXT,
  amount INT, fine INT DEFAULT 0, due TEXT, status TEXT DEFAULT 'UNPAID');
CREATE TABLE IF NOT EXISTS payment(pay_id INTEGER PRIMARY KEY, invoice_id INT REFERENCES invoice, amount INT,
  gateway_ref TEXT UNIQUE, mode TEXT, at TEXT);
CREATE TABLE IF NOT EXISTS complaint(comp_id INTEGER PRIMARY KEY, student_id INT REFERENCES user, category TEXT,
  description TEXT, status TEXT DEFAULT 'OPEN', staff TEXT, raised_at TEXT, sla_deadline TEXT, escalated INT DEFAULT 0);
CREATE TABLE IF NOT EXISTS leave_pass(leave_id INTEGER PRIMARY KEY, student_id INT REFERENCES user, from_ts TEXT,
  to_ts TEXT, destination TEXT, reason TEXT, status TEXT DEFAULT 'PENDING', token TEXT, out_at TEXT, in_at TEXT);
CREATE TABLE IF NOT EXISTS visitor(visitor_id INTEGER PRIMARY KEY, name TEXT, phone TEXT, student TEXT, in_at TEXT);`);

const ago = h => new Date(Date.now() - h * 3600e3).toISOString();

if (!db.prepare('SELECT COUNT(*) c FROM user').get().c) {
  const pw = hash('pass123'), q = (s, ...a) => db.prepare(s).run(...a);
  q(`INSERT INTO hall VALUES (1,'Aryabhatta Hall','M'),(2,'Kalpana Chawla Hall','F')`);
  [['A-101','SINGLE',1],['A-102','SINGLE',1],['A-103','SINGLE',1],['A-201','DOUBLE',2],['A-202','DOUBLE',2],['A-203','DOUBLE',2],
   ['A-204','DOUBLE',2],['A-205','DOUBLE',2],['A-301','TRIPLE',3],['A-302','TRIPLE',3],['A-303','TRIPLE',3]]
    .forEach(([n, t, c]) => q('INSERT INTO room(hall_id,room_no,type,capacity) VALUES (1,?,?,?)', n, t, c));
  [['K-101','SINGLE',1],['K-102','SINGLE',1],['K-201','DOUBLE',2],['K-202','DOUBLE',2],['K-203','DOUBLE',2],['K-301','TRIPLE',3],['K-302','TRIPLE',3]]
    .forEach(([n, t, c]) => q('INSERT INTO room(hall_id,room_no,type,capacity) VALUES (2,?,?,?)', n, t, c));
  [['warden1','Dr. R. K. Mishra','warden',1],['warden2','Dr. S. Pattnaik','warden',2],
   ['accounts','P. Behera','accountant',null],['guard1','Gate 1 Security','guard',null]]
    .forEach(([l, n, r, h]) => q('INSERT INTO user(login,name,role,hash,hall_id) VALUES (?,?,?,?,?)', l, n, r, pw, h));
  // login, name, gender, year, cgpa, km, need, survey, applied hours ago (null = not applied)
  const S = [
    ['2301020456','Sk Mustakim Ali','M',4,8.4,420,0,[2,4,4,3,2],null],
    ['2301020457','Suprit Kumar Naik','M',4,8.1,260,0,[2,4,5,3,2],30],
    ['2301020459','Sweta Samantaray','F',4,8.9,180,0,[1,3,5,2,1],null],
    ['2301020101','Ankit Mohanty','M',2,7.6,1450,0,[4,2,2,4,4],50],
    ['2301020102','Rahul Sahoo','M',3,6.9,40,0,[5,1,2,5,5],49],
    ['2301020103','Priyanshu Das','M',1,9.2,1800,0,[2,5,4,2,1],48],
    ['2301020104','Debasish Rout','M',1,7.1,300,1,[4,2,3,4,4],47],
    ['2301020105','Arjun Panda','M',2,8.8,900,0,[1,4,5,2,1],46],
    ['2301020106','Soumya Ranjan Jena','M',3,7.9,650,0,[4,2,3,4,4],45],
    ['2301020107','Biswajit Nayak','M',4,6.5,120,0,[5,1,1,5,5],44],
    ['2301020108','Manas Pradhan','M',1,8.0,1100,0,[2,4,4,3,2],43],
    ['2301020109','Ritesh Swain','M',2,7.3,75,0,[3,3,4,3,2],42],
    ['2301020110','Kiran Sethi','M',3,8.2,500,0,[2,4,5,2,2],null],
    ['2301020201','Ipsita Mishra','F',2,8.5,700,0,[2,4,5,2,1],20],
    // more applicants for the 2026-27 allotment run
    ['2301020111','Sai Prasad Behera','M',2,7.8,1320,0,[3,3,4,3,3],41],
    ['2301020112','Aditya Mahapatra','M',1,8.6,600,0,[2,4,4,2,2],40],
    ['2301020113','Om Prakash Sahu','M',3,7.2,220,0,[4,2,3,4,4],39],
    ['2301020114','Chinmay Dash','M',1,6.9,1500,0,[5,1,2,5,4],38],
    ['2301020115','Abhishek Tripathy','M',2,8.3,980,0,[2,5,4,2,1],37],
    ['2301020116','Satyajit Biswal','M',4,7.5,350,0,[3,3,3,3,3],36],
    ['2301020117','Pratik Rath','M',1,9.0,90,0,[1,5,5,1,1],35],
    ['2301020118','Asutosh Pati','M',3,6.8,1200,1,[4,2,2,4,5],34],
    ['2301020119','Nihar Ranjan Senapati','M',2,7.9,430,0,[2,4,4,3,2],33],
    ['2301020120','Smruti Ranjan Barik','M',1,8.1,770,0,[3,4,4,2,2],32],
    ['2301020121','Amit Kumar Sethy','M',3,7.0,60,0,[4,3,3,4,3],null],
    ['2301020202','Subhashree Panda','F',1,8.7,880,0,[2,4,5,2,1],19],
    ['2301020203','Priyadarshini Sahoo','F',2,8.0,1400,0,[3,3,4,3,2],18],
    ['2301020204','Monalisa Behera','F',3,7.4,300,0,[4,2,3,4,4],17],
    ['2301020205','Sasmita Nayak','F',1,9.1,1600,0,[1,5,5,1,1],16],
    ['2301020206','Rashmi Rekha Das','F',4,8.2,520,1,[2,3,4,3,2],15],
    ['2301020207','Lopamudra Mishra','F',2,7.7,160,0,[3,3,4,2,3],14]];
  for (const [l, n, g, y, c, km, need, sv, h] of S) {
    const id = q(`INSERT INTO user(login,name,role,hash,gender,year,cgpa,home_km,special_need,survey)
      VALUES (?,?,'student',?,?,?,?,?,?,?)`, l, n, pw, g, y, c, km, need, JSON.stringify(sv)).lastInsertRowid;
    if (h) q('INSERT INTO application(student_id,hall_id,prefs,submitted_at) VALUES (?,?,?,?)',
      id, g === 'M' ? 1 : 2, JSON.stringify(y > 2 ? ['SINGLE','DOUBLE','TRIPLE'] : ['DOUBLE','TRIPLE','SINGLE']), ago(h));
  }
  const uid = l => db.prepare('SELECT user_id FROM user WHERE login=?').get(l).user_id;
  const due = new Date(Date.now() - 20 * 864e5).toISOString(), FEE = { SINGLE: 45000, DOUBLE: 38000, TRIPLE: 32000 };
  // returning residents (already in a room, so the engine has roommates to match against)
  // login, name, gender, year, cgpa, km, survey, room, fee status (ONLINE / CHALLAN paid, null = unpaid)
  const R = [
    ['2301020110','Kiran Sethi','M',3,8.2,500,[2,4,5,2,2],'A-202','ONLINE'],
    ['2201020301','Bikash Moharana','M',4,7.6,840,[3,3,4,3,3],'A-204','ONLINE'],
    ['2201020302','Jyoti Ranjan Parida','M',4,8.0,310,[4,2,3,4,4],'A-302','CHALLAN'],
    ['2201020303','Sourav Kar','M',4,7.1,1050,[4,2,2,4,4],'A-302',null],
    ['2201020304','Deepak Jena','M',4,8.9,1380,[1,5,5,1,1],'A-103','ONLINE'],
    ['2201020305','Tapas Nanda','M',3,7.4,95,[2,4,4,3,2],'A-205',null],
    ['2201020401','Swagatika Rout','F',4,8.6,620,[2,4,5,2,1],'K-202','ONLINE'],
    ['2201020402','Itishree Pradhan','F',3,7.8,410,[3,3,4,3,2],'K-302','CHALLAN'],
    ['2201020403','Barsha Mohanty','F',3,8.1,1150,[3,3,3,3,3],'K-302','ONLINE'],
    ['2201020404','Pragyan Parida','F',4,9.0,250,[1,4,5,2,1],'K-102',null]];
  for (const [l, n, g, y, c, km, sv, room, paid] of R) {
    let id = db.prepare('SELECT user_id FROM user WHERE login=?').get(l)?.user_id;
    id ??= q(`INSERT INTO user(login,name,role,hash,gender,year,cgpa,home_km,survey) VALUES (?,?,'student',?,?,?,?,?,?)`,
      l, n, pw, g, y, c, km, JSON.stringify(sv)).lastInsertRowid;
    const r = db.prepare('SELECT room_id, type FROM room WHERE room_no=?').get(room);
    q('INSERT INTO allotment(student_id,room_id,at) VALUES (?,?,?)', id, r.room_id, ago(2000));
    q('UPDATE room SET occupied=occupied+1 WHERE room_id=?', r.room_id);
    for (const [head, amt] of [[`Hostel fee (${r.type})`, FEE[r.type]], ['Mess fee', 24000]]) {
      const inv = q('INSERT INTO invoice(student_id,head,amount,fine,due,status) VALUES (?,?,?,?,?,?)',
        id, head, amt, paid ? 0 : 500, due, paid ? 'PAID' : 'UNPAID').lastInsertRowid;
      if (paid) q('INSERT INTO payment(invoice_id,amount,gateway_ref,mode,at) VALUES (?,?,?,?,?)',
        inv, amt, `${paid === 'ONLINE' ? 'pay' : 'CHN'}_${l}_${inv}`, paid, ago(500 + inv));
    }
  }
  // complaints in every state of the lifecycle; the first one breaches its 12 h SLA for the escalation demo
  // login, category, description, status, staff, raised hours ago
  const C = [
    ['2301020110','Electrical','Tube light in A-202 flickering and switchboard sparks','ASSIGNED','Electrician - Ramesh',13],
    ['2201020302','Plumbing','Bathroom tap leaking on the 3rd floor near A-302','OPEN',null,2],
    ['2201020304','Internet','Wi-Fi drops every evening in the A-103 corridor','IN_PROGRESS','IT cell - Prakash',20],
    ['2201020401','Cleaning','Common washroom on 2nd floor not cleaned since Monday','RESOLVED','Housekeeping - Sabita',30],
    ['2201020403','Furniture','Study table drawer broken in K-302','CLOSED','Carpenter - Jagannath',96],
    ['2201020305','Other','Water cooler on 2nd floor not cooling','ASSIGNED','Maintenance - Bapi',6]];
  const SLA = { Electrical: 12, Plumbing: 24, Cleaning: 24, Furniture: 72, Internet: 48, Other: 72 };
  for (const [l, cat, d, st, staff, h] of C) q(`INSERT INTO complaint(student_id,category,description,status,staff,raised_at,sla_deadline)
    VALUES (?,?,?,?,?,?,?)`, uid(l), cat, d, st, staff, ago(h), ago(h - SLA[cat]));
  // leave requests: two pending for the warden, one student out on an approved pass, one returned
  const PASS_KEY = process.env.PASS_KEY || 'shmc-gate-key-2026', at = h => new Date(Date.now() + h * 3600e3).toISOString();
  const L = [['2201020303','Home, Cuttack','Sister\'s wedding',24,96,'PENDING'],['2201020402','Home, Berhampur','Medical check-up',12,60,'PENDING'],
    ['2201020301','Home, Sambalpur','Durga Puja',-30,48,'OUT'],['2201020404','Puri','Family visit',-120,-72,'RETURNED']];
  for (const [l, dest, why, f, t, st] of L) {
    const id = q('INSERT INTO leave_pass(student_id,from_ts,to_ts,destination,reason) VALUES (?,?,?,?,?)', uid(l), at(f), at(t), dest, why).lastInsertRowid;
    if (st === 'PENDING') continue;
    const token = sign({ kid: 'k2026', leaveId: Number(id), rollNo: l, validFrom: Date.parse(at(f)), validTo: Date.parse(at(t)), nonce: 'seed' + id }, PASS_KEY);
    q(`UPDATE leave_pass SET status='APPROVED', token=?, out_at=?, in_at=? WHERE leave_id=?`, token, at(f + 1), st === 'RETURNED' ? at(t - 2) : null, id);
  }
  // today's visitors at Gate 1
  [['Ramakanta Sethi','9437011122','2301020110',5],['Sunita Moharana','9861023344','2201020301',4],['Rajesh Parida','7008912345','2201020302',3],
   ['Anjali Rout','9938776655','2201020401',2],['Prasanta Kar','8249001122','2201020303',1]]
    .forEach(([n, p, st, h]) => q('INSERT INTO visitor(name,phone,student,in_at) VALUES (?,?,?,?)', n, p, st, ago(h)));
}

module.exports = db;
