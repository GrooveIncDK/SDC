import { sql } from '../../lib/db.js';

// GET /api/projects/:slug — full record for one project, including the
// JSONB partner/SDG/open-question/photo content. See db/schema.sql for
// the shape, db/seed-westnile.sql for the West Nile record seeded from
// the real westnile/index.html content (not invented).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const { slug } = req.query;
  try {
    const rows = await sql`
      SELECT * FROM projects WHERE slug = ${slug} LIMIT 1
    `;
    if (!rows.length) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('api/projects/[slug].js: query failed:', err);
    res.status(500).json({ error: 'Failed to load project' });
  }
}
