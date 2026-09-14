import { checkPassword, setSessionCookie } from '../../lib/auth.js';

// POST /api/admin/login — { password } -> sets the signed session cookie
// on success. See lib/auth.js for the single-shared-password design.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const { password } = req.body || {};
  if (!checkPassword(password)) {
    // Small fixed delay to blunt trivial brute-force scripting — not a
    // real rate limit, just enough friction that guessing isn't free.
    await new Promise((r) => setTimeout(r, 400));
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }
  setSessionCookie(res);
  res.status(200).json({ ok: true });
}
