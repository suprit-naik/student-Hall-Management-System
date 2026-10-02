// SQLite schema and demo seed data (Node 22+ built-in sqlite)
const { DatabaseSync } = require('node:sqlite');
const { hash } = require('./gate');
const db = new DatabaseSync(process.env.DB || 'shmc.db');

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
  [['A-101','SINGLE',1],['A-102','SINGLE',1],['A-201','DOUBLE',2],['A-202','DOUBLE',2],['A-203','DOUBLE',2],['A-301','TRIPLE',3]]
    .forEach(([n, t, c]) => q('INSERT INTO room(hall_id,room_no,type,capacity) VALUES (1,?,?,?)', n, t, c));
  [['K-101','SINGLE',1],['K-201','DOUBLE',2],['K-301','TRIPLE',3]]
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
    ['2301020201','Ipsita Mishra','F',2,8.5,700,0,[2,4,5,2,1],20]];
  for (const [l, n, g, y, c, km, need, sv, h] of S) {
    const id = q(`INSERT INTO user(login,name,role,hash,gender,year,cgpa,home_km,special_need,survey)
      VALUES (?,?,'student',?,?,?,?,?,?,?)`, l, n, pw, g, y, c, km, need, JSON.stringify(sv)).lastInsertRowid;
    if (h) q('INSERT INTO application(student_id,hall_id,prefs,submitted_at) VALUES (?,?,?,?)',
      id, g === 'M' ? 1 : 2, JSON.stringify(y > 2 ? ['SINGLE','DOUBLE','TRIPLE'] : ['DOUBLE','TRIPLE','SINGLE']), ago(h));
  }
  // returning resident already in A-202, so the engine has a roommate to match against
  const k = db.prepare("SELECT user_id FROM user WHERE login='2301020110'").get().user_id;
  q("INSERT INTO allotment(student_id,room_id,at) VALUES (?,(SELECT room_id FROM room WHERE room_no='A-202'),?)", k, ago(2000));
  q("UPDATE room SET occupied=1 WHERE room_no='A-202'");
  q(`INSERT INTO complaint(student_id,category,description,raised_at,sla_deadline,status,staff)
     VALUES (?,'Electrical','Tube light in A-202 flickering and switchboard sparks',?,?,'ASSIGNED','Electrician - Ramesh')`,
     k, ago(13), ago(1));
}

module.exports = db;
