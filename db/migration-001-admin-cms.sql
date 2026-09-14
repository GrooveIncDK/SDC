-- SDC website — migration 001: admin CMS (milestones + progress updates)
-- Run this AFTER db/schema.sql (it reuses the set_updated_at() function
-- schema.sql defines). Same routine as before: Neon SQL editor, or
-- `psql "$DATABASE_URL" -f db/migration-001-admin-cms.sql`.
--
-- Adds two tables behind the new admin login so a project owner can post
-- milestones and daily/monthly progress notes without touching SQL:
--   project_milestones — a small timeline per project (planned/in
--     progress/done), each with an optional target date and completed date.
--   project_updates — free-text progress notes per project, tagged
--     'daily' or 'monthly' and dated, newest first.
-- Both are read publicly (via GET /api/projects/:slug, which now includes
-- them) and written only through the admin-authenticated /api/admin/*
-- endpoints — see lib/auth.js.

CREATE TABLE IF NOT EXISTS project_milestones (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  target_date     DATE,
  completed_date  DATE,
  status          TEXT NOT NULL DEFAULT 'planned',  -- 'planned' | 'in_progress' | 'done'
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_updates (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL DEFAULT 'daily',    -- 'daily' | 'monthly'
  update_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  title           TEXT,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);

-- set_updated_at() is created by db/schema.sql — reused here, not redefined.
DROP TRIGGER IF EXISTS project_milestones_set_updated_at ON project_milestones;
CREATE TRIGGER project_milestones_set_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS project_updates_set_updated_at ON project_updates;
CREATE TRIGGER project_updates_set_updated_at
  BEFORE UPDATE ON project_updates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
