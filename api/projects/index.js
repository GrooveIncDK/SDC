import { sql } from '../../lib/db.js';

// GET /api/projects — list all projects (summary fields only).
// Not wired into any page yet — westnile/index.html is still static HTML.
// This is groundwork for converting project pages to DB-backed content,
// per the "content pages + forms, extras worked out as we go" scope.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  try {
    const rows = await sql`
      SELECT slug, name, country, status, summary, updated_at
      FROM projects
      ORDER BY created_at ASC
    `;
    res.status(200).json(rows);
  } catch (err) {
    console.error('api/projects/index.js: query failed:', err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
}
