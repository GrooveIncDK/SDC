import { sql } from '../../lib/db.js';

// GET /api/projects/:slug — full record for one project, including the
// JSONB partner/SDG/open-question/photo content. See db/schema.sql for
// the shape, db/seed-westnile.sql for the West Nile record seeded from
// the real westnile/index.html content (not invented).
//
// Also includes `milestones` and `updates` from the admin CMS tables added
// in db/migration-001-admin-cms.sql (see api/admin/* for the write side).
// That query is wrapped separately and falls back to empty arrays on
// failure, so this endpoint keeps working — with no milestones/updates
// yet — even before that migration has been run on a given database; the
// base project record is never held hostage to it.
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
    const project = rows[0];

    let milestones = [];
    let updates = [];
    try {
      [milestones, updates] = await Promise.all([
        // DATE columns cast to text: both pg and the Neon driver otherwise
        // parse them into JS Date objects, which JSON.stringify renders as
        // full ISO timestamps ("2026-09-14T00:00:00.000Z") instead of plain
        // "2026-09-14" — breaking the <input type="date"> fields on the
        // admin dashboard that read these values back.
        sql`
          SELECT id, title, description,
                 target_date::text AS target_date,
                 completed_date::text AS completed_date,
                 status, sort_order
          FROM project_milestones
          WHERE project_id = ${project.id}
          ORDER BY sort_order ASC, target_date ASC NULLS LAST, id ASC
        `,
        sql`
          SELECT id, kind, update_date::text AS update_date, title, content
          FROM project_updates
          WHERE project_id = ${project.id}
          ORDER BY update_date DESC, id DESC
          LIMIT 30
        `,
      ]);
    } catch (subErr) {
      console.warn(
        'api/projects/[slug].js: milestones/updates not available yet (migration-001 not run?):',
        subErr.message
      );
    }

    res.status(200).json({ ...project, milestones, updates });
  } catch (err) {
    console.error('api/projects/[slug].js: query failed:', err);
    res.status(500).json({ error: 'Failed to load project' });
  }
}
