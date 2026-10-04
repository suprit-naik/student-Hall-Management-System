# Students Hall Management Center (SHMC)

Hostel room allotment and hall administration for C. V. Raman Global University, Bhubaneswar.
Software Engineering case study by Sk Mustakim Ali, Suprit Kumar Naik and Sweta Samantaray (guide: Sibun Nath).

## What it does
- **Score-based room allotment**: S = 0.30 seniority + 0.25 distance from home + 0.20 CGPA + 0.15 special need + 0.10 early application. Highest score is placed first.
- **Roommate matching**: a 5-question lifestyle survey; compatibility is 1 minus the weighted distance between answers. A student is not placed with occupants below 0.6 compatibility.
- **Fees**: invoices raised on allotment; payments are marked paid only from the gateway's HMAC-signed webhook (mock gateway in this prototype); late fine job.
- **Complaints with SLA**: deadline per category (electrical 12 h, plumbing 24 h, ...); the SLA job runs every 15 minutes and escalates breached complaints.
- **HMAC-signed QR gate pass**: approved leave issues a signed token; the guard's scanner rejects edited or reused passes.
- **3D hall ID card**: landing page and `/id/` page with an interactive lanyard showing the student's name, roll number and room. The QR on its back is the student's gate pass when a leave is approved.
- **Role-based portal** for students, wardens, accountant and security guard.

## Run locally
Requires Node.js 22+.
```bash
cd code
npm install
npm test        # 12 tests
npm start       # http://localhost:3000
```
- `/` landing page, `/portal/` the portal, `/id/` your 3D ID card (after login)
- Demo logins (password `pass123`): students `2301020456`, `2301020457`, `2301020459`; wardens `warden1`, `warden2`; accountant `accounts`; guard `guard1`
- Delete `code/shmc.db` to reset demo data.

## Adding more students or staff
**On the website:** log in as a warden (`warden1` or `warden2`) and open the **Students** tab. Fill in roll number, name, year, CGPA, distance from home and password, then click *Add student*. The student joins that warden's hall and can sign in at once.

**From the command line** (for staff accounts or many students at once), without resetting the data:
```bash
cd code
node add-student.js 2301020460 "Rohan Das" M 3 8.2 450              # password defaults to pass123
node add-student.js 2301020461 "Ankita Sahu" F 1 9.0 800 mypass123  # custom password
node add-student.js warden3 "Dr. A. Rath" M 0 0 0 pass123 warden    # staff: role = warden | accountant | guard
```
Arguments: roll/login, full name, gender (M/F, decides the hall), year, CGPA, distance from home in km, password, role.
To make an account part of the demo data permanently, add a row to the `S` list in `db.js` and delete `shmc.db`.

## Editing the landing page
The landing page (Next.js, React Three Fiber) is pre-built into `code/site/`, so the server needs no build step.
To change it:
```bash
cd landing
npm install
npm run build   # builds and copies the output into code/site/
```

## Structure
```
code/      Express API (server.js), allotment engine, gate pass signing, SQLite schema, portal (public/), built landing (site/)
landing/   Source of the landing page and 3D ID card (based on the v0 IRL event landing template)
api/       Vercel entry point
```
Deploy on Render with `render.yaml`. On Vercel the SQLite database lives in /tmp and is not shared between instances, so use Render for demos.
