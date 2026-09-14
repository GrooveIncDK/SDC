# SDC — Postgres/Neon migration notes

What this adds, and what you still need to do by hand (account/DNS steps I
can't do from here).

## What changed in the repo

- `api/contact.js` — replaces `bat/rd-mailform.php`. Returns the same
  `MF000`/`MF003`/`MF004`/`MF255` codes the existing front-end JS
  (`js/script.js`, RD Mailform handler) already expects, so nothing in the
  JS needed to change.
- `api/projects/index.js`, `api/projects/[slug].js` — read-only endpoints
  over the `projects` table. `api/projects/[slug].js` now also returns
  `milestones` and `updates` (see the admin CMS section below) — it powers
  the new "Live Projects" section on `index.html`.
- `lib/db.js` — Neon connection helper (uses `@neondatabase/serverless`,
  not `pg` — see the comment in the file for why, given the pooling
  problem your WebDev notes already document from the ISL/Supabase build).
- `db/schema.sql` — `contact_submissions` + `projects` tables.
- `db/seed-westnile.sql` — seeds the West Nile project record from the
  original `westnile/index.html` content (partner descriptions, the 7
  SDGs, the 4 open questions, photo captions) — nothing invented. (That
  page itself has since been deleted from the site; the same content now
  lives directly on `index.html`. This seed file is unaffected — it feeds
  the `projects` table, not that page.)
- `index.html`, `who we are.html` — one line each: the contact form's
  `action` now points at `/api/contact` instead of `bat/rd-mailform.php`.
- `package.json` — the one dependency (`@neondatabase/serverless`).

`bat/*.php` is left in place but becomes dead code once you're live on
Vercel (Vercel doesn't execute PHP) — nothing currently points at it after
the action-attribute change, safe to delete whenever you want, no rush.

## Admin CMS (milestones + daily/monthly updates)

Added so project updates and milestones can be posted from a simple login
instead of direct SQL:

- `db/migration-001-admin-cms.sql` — adds `project_milestones` and
  `project_updates` tables (both FK'd to `projects`). Run this **after**
  `db/schema.sql` — it reuses the `set_updated_at()` function that file
  defines.
- `lib/auth.js` — single-shared-password auth (your choice, over per-user
  accounts): `ADMIN_PASSWORD` is checked with a timing-safe comparison,
  and a signed session cookie (HMAC'd with a separate `ADMIN_SESSION_SECRET`
  — not the password — so a leaked cookie can't be reversed into it) keeps
  you logged in for 12 hours.
- `api/admin/login.js`, `api/admin/logout.js`, `api/admin/session.js` —
  session endpoints.
- `api/admin/projects/[slug].js` — edit a project's name/status/tagline/
  summary. The JSONB partner/SDG/photo content is still hand-edited SQL,
  same as before — deliberately out of scope for this form (see "What's
  deliberately not built yet").
- `api/admin/milestones/{index,[id]}.js`, `api/admin/updates/{index,[id]}.js`
  — create/edit/delete milestones and daily/monthly progress entries.
  All of `api/admin/*` requires the session cookie; every write returns
  401 without it.
- `admin/index.html` — login page. `admin/dashboard.html` — the admin
  tool itself: pick a project, edit its details, add/edit/delete
  milestones and updates. Both are excluded from search indexing
  (`robots.txt` + a `noindex` meta tag) but are **not otherwise hidden**
  — anyone who finds the URL sees a login form; the password is what
  protects it, same as any shared-password admin tool.
- `index.html` — new "Live Projects" section (`#live-projects`), below
  the existing static "What We Do" tiles (which are unchanged). It fetches
  `/api/projects` and renders each project's milestones and latest updates
  client-side; if the migration below hasn't been run yet, or the fetch
  fails for any reason, it shows a plain "coming soon" note instead of
  breaking. Also added as a second item in the header nav's "Projects"
  dropdown ("Live Project Updates").
- `.env.example` — two new variables, see the Neon/Vercel steps below.

This was tested end-to-end (login, session expiry/logout, create/edit/
delete on both milestones and updates, the dashboard's date fields, and
the public Live Projects rendering) against a real local Postgres before
being written here — not just read through.

## Steps only you can do

1. **Neon**: open your project's SQL editor (or `psql "$DATABASE_URL" -f
   db/schema.sql`) and run, **in order**: `db/schema.sql`,
   `db/seed-westnile.sql`, then `db/migration-001-admin-cms.sql`.
2. **Vercel**: "Add New Project" -> Import `GrooveIncDK/SDC` from GitHub.
   Framework preset: Other (no build step needed, it's static + `/api`).
3. **Vercel env vars**: Project Settings -> Environment Variables -> add:
   - `DATABASE_URL` — the Neon *pooled* connection string (see
     `.env.example`).
   - `ADMIN_PASSWORD` — whatever password you want to log into
     `/admin/` with.
   - `ADMIN_SESSION_SECRET` — a random secret, *not* the password (run
     `openssl rand -hex 32` locally, or any equivalent, and paste the
     result). Rotating `ADMIN_PASSWORD` later doesn't require changing
     this.
   Redeploy after adding these.
4. **DNS**: the site is currently on GitHub Pages (the `CNAME` file at the
   repo root sets that up). To serve from Vercel instead, add
   `www.sustainabledevelopmentcrescent.uk` as a domain in the Vercel
   project, then update the DNS record at your registrar/DNS provider to
   point at Vercel (Vercel's domain settings screen gives you the exact
   record once you add the domain — usually a CNAME to
   `cname.vercel-dns.com`). The repo's `CNAME` file is GitHub-Pages-only
   and is simply ignored by Vercel — fine to leave or delete either way.
5. Push this branch/these files and confirm the deploy, then test the
   contact form and log into `/admin/` on the live site before switching
   DNS over, if you want a safety margin (Vercel gives you a
   `*.vercel.app` preview URL as soon as it's imported, before DNS changes
   anything).

## What's deliberately not built yet

- No admin UI for the JSONB partner/SDG/photo content on a project — that
  stays direct SQL ("extras worked out as we go", per `db/schema.sql`'s
  own comment). The admin form covers what's expected to change often
  (status, tagline, summary, milestones, daily/monthly updates); the
  partner/SDG content changes a few times a year and isn't worth a form
  yet.
- No "create a new project" UI — West Nile is the only row in `projects`
  right now, created by `db/seed-westnile.sql`. A second project needs an
  `INSERT` by hand for now; the admin dashboard will pick it up
  automatically (its project selector reads from `/api/projects`) once it
  exists.
- No email notification on new contact submissions, or on new admin
  updates (previously SMTP-via-PHPMailer, pointed at placeholder demo
  credentials in `bat/rd-mailform.config.json` — it's unclear that ever
  sent real mail). Submissions land in `contact_submissions`; wiring a
  notification (Resend, or reading the table periodically) is easy to add
  once you decide how you want to be notified.
- No rate limiting on `/api/admin/login` beyond a fixed ~400ms delay on a
  wrong password — enough friction against casual guessing, not a real
  brute-force defense. Fine for a low-traffic internal tool; revisit if
  that changes.
