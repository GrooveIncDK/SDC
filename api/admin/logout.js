import { clearSessionCookie } from '../../lib/auth.js';

// POST /api/admin/logout — clears the session cookie.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
