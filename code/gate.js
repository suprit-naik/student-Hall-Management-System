// HMAC-signed tokens: used for QR gate passes and for login sessions
const crypto = require('crypto');
const b64 = s => Buffer.from(s).toString('base64url');

const sign = (payload, key) => {
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(crypto.createHmac('sha256', key).update(body).digest())}`;
};

const verify = (token, key) => {
  const [body, mac] = String(token).trim().split('.');
  if (!body || !mac) return null;
  const good = crypto.createHmac('sha256', key).update(body).digest(), got = Buffer.from(mac, 'base64url');
  if (good.length !== got.length || !crypto.timingSafeEqual(good, got)) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url')); } catch { return null; }
};

const hash = (pw, salt = crypto.randomBytes(8).toString('hex')) =>
  `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
const checkPw = (pw, stored) => hash(pw, stored.split(':')[0]) === stored;

module.exports = { sign, verify, hash, checkPw };
