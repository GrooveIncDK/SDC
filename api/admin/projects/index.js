import { sql } from '../../../lib/db.js';
import { requireAdmin } from '../../../lib/auth.js';

// POST /api/admin/projects — create a new project.
// Body: { name, slug?, country?, status?, tagline?, summary? }
// slug is derived from name when not supplied. partners/sdgs/open_questions/
// photos are left at their schema defaults ('[]') — per db/schema.sql's own
// comment, that JSONB content is hand-edited SQL for now, out of scope here.
function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { name, slug: slugInput, country, status, tagline, summary } = req.body || {};
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const slug = slugify(slugInput || name);
  if (!slug) {
    res.status(400).json({ error: 'Could not derive a URL slug from that name — try setting one explicitly' });
    return;
  }
  try {
    const rows = await sql`
      INSERT INTO projects (slug, name, country, status, tagline, summary)
      VALUES (${slug}, ${name.trim()}, ${country || null}, ${status || 'defining'},
              ${tagline || null}, ${summary || null})
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err && err.code === '23505') {
      res.status(409).json({ error: `A project with the slug "${slug}" already exists` });
      return;
    }
    console.error('api/admin/projects/index.js: insert failed:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
}
