import crypto from 'node:crypto';

// Single shared admin password (project decision — see MIGRATION.md): one
// password for whoever posts project updates, not per-user accounts.
//
// ADMIN_PASSWORD — the password itself, set as a Vercel env var, checked
//   with a timing-safe comparison.
// ADMIN_SESSION_SECRET — a separate random secret used only to sign the
//   session cookie, so a leaked cookie can't be reversed into the password
//   and rotating the password doesn't invalidate it. Generate one with
//   `openssl rand -hex 32` (see .env.example).
//
// Session is a small signed token (base64 JSON payload + HMAC-SHA256
// signature) in an httpOnly cookie — no session table, nothing to expire
// server-side, just a signature and an expiry timestamp checked on each
// request.

const SESSION_COOKIE = 'sdc_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set.');
  return secret;
}

function sign(body) {
  return crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
}

export function createSessionToken() {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const body = Buffer.from(payload).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  let sigBuf, expBuf;
  try {
    sigBuf = Buffer.from(sig);
    expBuf = Buffer.from(sign(body));
  } catch {
    return false;
  }
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Constant-time-ish password check: always runs a timingSafeEqual of equal
// length so a wrong-length guess doesn't return measurably faster than a
// right-length one.
export function checkPassword(candidate) {
  const actual = process.env.ADMIN_PASSWORD;
  if (!actual || typeof candidate !== 'string') return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  if (a.length !== b.length) {
    crypto.timingSafeEqual(Buffer.alloc(b.length), Buffer.alloc(b.length));
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function isAdminRequest(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

// Call at the top of any admin-only handler. Sends the 401 itself and
// returns false when the caller should stop; returns true when authorized.
export function requireAdmin(req, res) {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function setSessionCookie(res) {
  const token = createSessionToken();
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const secureFlag = isProd ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly${secureFlag}; SameSite=Strict; Path=/; Max-Age=${maxAge}`
  );
}

export function clearSessionCookie(res) {
  const secureFlag = isProd ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly${secureFlag}; SameSite=Strict; Path=/; Max-Age=0`
  );
}
