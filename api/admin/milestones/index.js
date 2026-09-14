import { sql } from '../../../lib/db.js';
import { requireAdmin } from '../../../lib/auth.js';

// POST /api/admin/milestones — create a milestone for a project.
// Body: { project_id, title, description?, target_date?, completed_date?,
//         status?, sort_order? }
// RETURNING casts the DATE columns to text — see api/projects/[slug].js
// for why (otherwise they'd come back as JS Date objects / full ISO
// timestamps, breaking the dashboard's <input type="date"> fields).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { project_id, title, description, target_date, completed_date, status, sort_order } =
    req.body || {};
  if (!project_id || !title) {
    res.status(400).json({ error: 'project_id and title are required' });
    return;
  }
  try {
    const rows = await sql`
      INSERT INTO project_milestones
        (project_id, title, description, target_date, completed_date, status, sort_order)
      VALUES
        (${project_id}, ${title}, ${description || null}, ${target_date || null},
         ${completed_date || null}, ${status || 'planned'}, ${sort_order ?? 0})
      RETURNING id, project_id, title, description,
                target_date::text AS target_date,
                completed_date::text AS completed_date,
                status, sort_order, created_at, updated_at
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('api/admin/milestones/index.js: insert failed:', err);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
}
