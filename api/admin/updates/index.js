import { sql } from '../../../lib/db.js';
import { requireAdmin } from '../../../lib/auth.js';

// POST /api/admin/updates — create a daily/monthly progress entry.
// Body: { project_id, kind?, update_date?, title?, content }
// RETURNING casts update_date to text — see api/projects/[slug].js for why
// (otherwise DATE columns come back as JS Date objects / full ISO
// timestamps, breaking the dashboard's <input type="date"> field).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { project_id, kind, update_date, title, content } = req.body || {};
  if (!project_id || !content) {
    res.status(400).json({ error: 'project_id and content are required' });
    return;
  }
  try {
    const rows = await sql`
      INSERT INTO project_updates (project_id, kind, update_date, title, content)
      VALUES (
        ${project_id},
        ${kind || 'daily'},
        ${update_date || new Date().toISOString().slice(0, 10)},
        ${title || null},
        ${content}
      )
      RETURNING id, project_id, kind, update_date::text AS update_date, title, content,
                created_at, updated_at
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('api/admin/updates/index.js: insert failed:', err);
    res.status(500).json({ error: 'Failed to create update' });
  }
}
