# SDC — Postgres/Neon migration notes

What this adds, and what you still need to do by hand (account/DNS steps I
can't do from here).

## What changed in the repo

- `api/contact.js` — replaces `bat/rd-mailform.php`. Returns the same
  `MF000`/`MF003`/`MF004`/`MF255` codes the existing front-end JS
  (`js/script.js`, RD Mailform handler) already expects, so nothing in the
  JS needed to change.
- `api/projects/index.js`, `api/projects/[slug].js` — read-only endpoints
  over a new `projects` table. **Not wired into `westnile/index.html` yet**
  — that page is still static HTML. This is groundwork for converting
  project pages to DB-backed content; templating the page to fetch and
  render from these endpoints is the next piece, whenever you want it.
- `lib/db.js` — Neon connection helper (uses `@neondatabase/serverless`,
  not `pg` — see the comment in the file for why, given the pooling
  problem your WebDev notes already document from the ISL/Supabase build).
- `db/schema.sql` — `contact_submissions` + `projects` tables.
- `db/seed-westnile.sql` — seeds the West Nile project record from the
  exact copy already live in `westnile/index.html` (partner descriptions,
  the 7 SDGs, the 4 open questions, photo captions) — nothing invented.
- `index.html`, `who we are.html` — one line each: the contact form's
  `action` now points at `/api/contact` instead of `bat/rd-mailform.php`.
- `package.json` — the one dependency (`@neondatabase/serverless`).

`bat/*.php` is left in place but becomes dead code once you're live on
Vercel (Vercel doesn't execute PHP) — nothing currently points at it after
the action-attribute change, safe to delete whenever you want, no rush.

## Steps only you can do

1. **Neon**: open your project's SQL editor (or `psql "$DATABASE_URL" -f
   db/schema.sql`) and run `db/schema.sql`, then `db/seed-westnile.sql`.
2. **Vercel**: "Add New Project" -> Import `GrooveIncDK/SDC` from GitHub.
   Framework preset: Other (no build step needed, it's static + `/api`).
3. **Vercel env var**: Project Settings -> Environment Variables -> add
   `DATABASE_URL` = the Neon *pooled* connection string (see
   `.env.example`). Redeploy after adding it.
4. **DNS**: the site is currently on GitHub Pages (the `CNAME` file at the
   repo root sets that up). To serve from Vercel instead, add
   `www.sustainabledevelopmentcrescent.uk` as a domain in the Vercel
   project, then update the DNS record at your registrar/DNS provider to
   point at Vercel (Vercel's domain settings screen gives you the exact
   record once you add the domain — usually a CNAME to
   `cname.vercel-dns.com`). The repo's `CNAME` file is GitHub-Pages-only
   and is simply ignored by Vercel — fine to leave or delete either way.
5. Push this branch/these files and confirm the deploy, then test the
   contact form on the live site before switching DNS over, if you want a
   safety margin (Vercel gives you a `*.vercel.app` preview URL as soon as
   it's imported, before DNS changes anything).

## What's deliberately not built yet

- No admin UI for editing `projects` rows — that's direct SQL for now
  ("extras worked out as we go"). A simple admin form is a natural next
  piece once the schema proves out.
- `westnile/index.html` isn't reading from `/api/projects/west-nile` yet —
  it's still the static page. Converting it (and giving future projects a
  shared template instead of a copy-pasted HTML file) is the next real
  chunk of work, not done here.
- No email notification on new contact submissions (previously
  SMTP-via-PHPMailer, pointed at placeholder demo credentials in
  `bat/rd-mailform.config.json` — it's unclear that ever sent real mail).
  Submissions land in `contact_submissions`; wiring a notification
  (Resend, or reading the table periodically) is easy to add once you
  decide how you want to be notified.
