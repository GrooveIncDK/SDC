import { sql } from '../../../lib/db.js';
import { requireAdmin } from '../../../lib/auth.js';

// PUT /api/admin/milestones/:id — replace a milestone's editable fields.
// DELETE /api/admin/milestones/:id — remove it.
// The dashboard always submits the full form on save, so PUT is a plain
// overwrite rather than a partial-field merge.
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { title, description, target_date, completed_date, status, sort_order } = req.body || {};
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    try {
      const rows = await sql`
        UPDATE project_milestones SET
          title = ${title},
          description = ${description || null},
          target_date = ${target_date || null},
          completed_date = ${completed_date || null},
          status = ${status || 'planned'},
          sort_order = ${sort_order ?? 0}
        WHERE id = ${id}
        RETURNING id, project_id, title, description,
                  target_date::text AS target_date,
                  completed_date::text AS completed_date,
                  status, sort_order, created_at, updated_at
      `;
      if (!rows.length) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error('api/admin/milestones/[id].js: update failed:', err);
      res.status(500).json({ error: 'Failed to update milestone' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM project_milestones WHERE id = ${id}`;
      res.status(204).end();
    } catch (err) {
      console.error('api/admin/milestones/[id].js: delete failed:', err);
      res.status(500).json({ error: 'Failed to delete milestone' });
    }
    return;
  }

  res.status(405).send('Method Not Allowed');
}
