import { sql } from '../../../lib/db.js';
import { requireAdmin } from '../../../lib/auth.js';

// PUT /api/admin/projects/:slug — update the fields an admin is expected to
// change day to day (name, status, tagline, summary). The JSONB partner/
// SDG/photo content stays hand-edited SQL for now, per db/schema.sql's own
// comment ("edited by hand a few times a year, not queried relationally") —
// out of scope for this form, not forgotten.
export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { slug } = req.query;
  const { name, status, tagline, summary } = req.body || {};
  if (!name || !status) {
    res.status(400).json({ error: 'name and status are required' });
    return;
  }
  try {
    const rows = await sql`
      UPDATE projects SET
        name = ${name},
        status = ${status},
        tagline = ${tagline || null},
        summary = ${summary || null}
      WHERE slug = ${slug}
      RETURNING *
    `;
    if (!rows.length) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('api/admin/projects/[slug].js: update failed:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
}
