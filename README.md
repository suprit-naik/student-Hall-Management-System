# Students Hall Management Center (SHMC)

Automated Hostel Management and Room Allotment System for C. V. Raman Global University.

## Features
- **Deterministic Merit & Preference-Based Allotment**: 50/30/20 weighted criteria (CGPA, Distance, Seniority) with automated roommate compatibility scoring (Cosine similarity).
- **Automated Fine & Surcharge Invoicing**: Midnight cron jobs for fee deadlines and automated dues tracking.
- **SLA-Tracked Ticket Escalation**: 3-level complaint tracking with automated escalation based on service SLA deadlines.
- **HMAC-Signed Dynamic QR Gate Passes**: Tamper-proof digital gate passes with offline cryptographic validation and direction tracking (IN/OUT).
- **Role-Based Portals**: Unified portal with specialized views for Students, Wardens, Accounts, and Gate Security Guards.

## Technology Stack
- **Runtime**: Node.js v22+ (Built-in `node:sqlite` DatabaseSync)
- **Backend**: Express.js
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (Single Page Architecture)
- **Cryptography**: Node.js `crypto` (HMAC SHA-256)
- **QR Engine**: `qrcode`

## Running Locally

```bash
cd code
npm install
npm test
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials (Password: `pass123`)
- **Student**: `2301020457` (Suprit Kumar Naik)
- **Student**: `2301020456` (Sk Mustakim Ali)
- **Student**: `2301020459` (Sweta Samantaray)
- **Warden (Aryabhatta)**: `warden1`
- **Warden (Kalpana Chawla)**: `warden2`
- **Accounts**: `accounts`
- **Security Guard**: `guard1`
