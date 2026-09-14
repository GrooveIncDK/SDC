import { sql } from '../lib/db.js';

// Replaces bat/rd-mailform.php. Deliberately mirrors its response-code
// contract (MF000/MF001/.../MF255) so the existing front end — js/script.js's
// RD Mailform handler, on both index.html and "who we are.html" — keeps
// working unmodified once the form's `action` attribute is repointed here.
// See MIGRATION.md for the two one-line HTML changes this requires.
const CODE = {
  TYPE_MISSING: 'MF004',
  EMAIL_MISSING: 'MF003',
  SERVER_ERROR: 'MF255',
  SUCCESS: 'MF000',
};

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const body = req.body || {};
  const formType = body['form-type'];
  const { name, email, message } = body;

  if (!formType) {
    res.status(200).send(CODE.TYPE_MISSING);
    return;
  }
  if (!email) {
    res.status(200).send(CODE.EMAIL_MISSING);
    return;
  }

  try {
    await sql`
      INSERT INTO contact_submissions
        (name, email, message, form_type, source_page, ip_address, user_agent)
      VALUES
        (${name || null}, ${email}, ${message || null}, ${formType},
         ${req.headers.referer || null}, ${getClientIp(req)}, ${req.headers['user-agent'] || null})
    `;
    res.status(200).send(CODE.SUCCESS);
  } catch (err) {
    console.error('api/contact.js: insert failed:', err);
    res.status(200).send(CODE.SERVER_ERROR);
  }
}
