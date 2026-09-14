import { isAdminRequest } from '../../lib/auth.js';

// GET /api/admin/session — lets admin/index.html and admin/dashboard.html
// check login state without triggering a 401 in the console.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  res.status(200).json({ authenticated: isAdminRequest(req) });
}
