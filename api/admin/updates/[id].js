import { sql } from '../../../lib/db.js';
import { requireAdmin } from '../../../lib/auth.js';

// PUT /api/admin/updates/:id — replace a progress entry's fields.
// DELETE /api/admin/updates/:id — remove it.
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { kind, update_date, title, content } = req.body || {};
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    try {
      const rows = await sql`
        UPDATE project_updates SET
          kind = ${kind || 'daily'},
          update_date = ${update_date || new Date().toISOString().slice(0, 10)},
          title = ${title || null},
          content = ${content}
        WHERE id = ${id}
        RETURNING id, project_id, kind, update_date::text AS update_date, title, content,
                  created_at, updated_at
      `;
      if (!rows.length) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error('api/admin/updates/[id].js: update failed:', err);
      res.status(500).json({ error: 'Failed to update entry' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM project_updates WHERE id = ${id}`;
      res.status(204).end();
    } catch (err) {
      console.error('api/admin/updates/[id].js: delete failed:', err);
      res.status(500).json({ error: 'Failed to delete entry' });
    }
    return;
  }

  res.status(405).send('Method Not Allowed');
}
