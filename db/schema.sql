-- SDC website schema — Neon Postgres
-- Run against your Neon database (SQL editor in the Neon console, or `psql
-- "$DATABASE_URL" -f db/schema.sql`) before deploying the API functions.

CREATE TABLE IF NOT EXISTS contact_submissions (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT,
  email        TEXT NOT NULL,
  message      TEXT,
  form_type    TEXT NOT NULL DEFAULT 'contact',
  source_page  TEXT,          -- referer header, e.g. which page the form was on
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per project (West Nile today, more to follow). Partner/SDG/
-- open-question/photo content is stored as JSONB rather than normalized
-- join tables — this content is edited by hand a few times a year, not
-- queried relationally, and the exact shape is still expected to move
-- ("extras worked out as we go"). Revisit as a normalized schema only if
-- that stops being true.
CREATE TABLE IF NOT EXISTS projects (
  id                BIGSERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  country           TEXT,
  status            TEXT NOT NULL DEFAULT 'defining',  -- 'defining' | 'active' | 'completed'
  tagline           TEXT,
  summary           TEXT,
  partners          JSONB NOT NULL DEFAULT '[]',   -- [{name, kicker, description, logo}]
  sdgs              JSONB NOT NULL DEFAULT '[]',   -- [{number, title, caption}]
  open_questions    JSONB NOT NULL DEFAULT '[]',   -- [{number, text}]
  photos            JSONB NOT NULL DEFAULT '[]',   -- [{src, alt, caption}]
  broader_partners  JSONB NOT NULL DEFAULT '[]',   -- [{name, url, logo}]
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_set_updated_at ON projects;
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
