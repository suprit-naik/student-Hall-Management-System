// Add a student or staff account to the existing database (no reset needed).
// Usage: node add-student.js <roll/login> "<Full Name>" <M|F> <year> <cgpa> <home km> [password] [role]
// Example: node add-student.js 2301020460 "Rohan Das" M 3 8.2 450 mypass123
const db = require('./db'), { hash } = require('./gate');
const [login, name, gender = 'M', year = 1, cgpa = 0, km = 0, pw = 'pass123', role = 'student'] = process.argv.slice(2);
if (!login || !name) { console.log('Usage: node add-student.js <roll> "<Full Name>" <M|F> <year> <cgpa> <home km> [password] [role]'); process.exit(1); }
if (db.prepare('SELECT 1 FROM user WHERE login=?').get(login)) { console.log(`${login} already exists`); process.exit(1); }
db.prepare(`INSERT INTO user(login,name,role,hash,gender,year,cgpa,home_km,survey,hall_id) VALUES (?,?,?,?,?,?,?,?,'[3,3,3,3,3]',?)`)
  .run(login, name, role, hash(pw), gender.toUpperCase(), +year, +cgpa, +km, role === 'warden' ? (gender.toUpperCase() === 'F' ? 2 : 1) : null);
console.log(`Added ${role} ${login} (${name}), password: ${pw}`);
