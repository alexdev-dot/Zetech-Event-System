-- ============================================================
-- Zetech Events Hub — PostgreSQL schema for Supabase
-- Run this ONCE in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/druqtjclfqcbzonjyjoi/sql/new
-- ============================================================

-- ─── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_registrations (
  id               SERIAL PRIMARY KEY,
  first_name       VARCHAR(100)  NOT NULL,
  last_name        VARCHAR(100)  NOT NULL,
  admission_number VARCHAR(50)   NOT NULL UNIQUE,
  email            VARCHAR(255)  NOT NULL UNIQUE,
  password         VARCHAR(255)  NOT NULL,
  status           VARCHAR(20)   NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','deleted')),
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20)  NOT NULL DEFAULT 'admin'
               CHECK (role IN ('admin','club_leader')),
  name       VARCHAR(100),
  club       VARCHAR(100),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  description      TEXT         NOT NULL,
  date             DATE         NOT NULL,
  time             TIME         NOT NULL,
  location         VARCHAR(255) NOT NULL,
  category         VARCHAR(100) NOT NULL,
  max_participants INT,
  image_url        VARCHAR(500),
  status           VARCHAR(20)  NOT NULL DEFAULT 'upcoming'
                     CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  created_by       INT          NOT NULL REFERENCES admins(id),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id                SERIAL PRIMARY KEY,
  event_id          INT         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id        INT         NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            VARCHAR(20) NOT NULL DEFAULT 'registered'
                      CHECK (status IN ('registered','attended','cancelled')),
  UNIQUE (event_id, student_id)
);

-- Auto-update updated_at on events
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── run_sql RPC — used by the Express backend ───────────────
-- Executes parameterised SQL sent from the backend via HTTPS.
-- Uses SECURITY DEFINER so it runs with the postgres role,
-- bypassing RLS on all tables (our Express API owns auth/authz).
CREATE OR REPLACE FUNCTION run_sql(query text, params text[] DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  i      int;
  p      text;
BEGIN
  -- Replace $1, $2 … with quoted literals from the params array
  i := 1;
  FOREACH p IN ARRAY params LOOP
    IF p IS NULL THEN
      query := replace(query, '$' || i::text, 'NULL');
    ELSE
      query := replace(query, '$' || i::text, quote_literal(p));
    END IF;
    i := i + 1;
  END LOOP;

  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query)
  INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION run_sql(text, text[]) TO anon, authenticated;

-- ─── DISABLE ROW LEVEL SECURITY ──────────────────────────────
-- Our Express API handles all auth/authz via JWT.
ALTER TABLE student_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins                DISABLE ROW LEVEL SECURITY;
ALTER TABLE events                DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations   DISABLE ROW LEVEL SECURITY;

-- ─── SEED DEFAULT ADMIN ───────────────────────────────────────
-- Password 'admin123' is upgraded to bcrypt on first login.
INSERT INTO admins (email, password, role, name)
VALUES ('admin@zetech.ac.ke', 'admin123', 'admin', 'Admin User')
ON CONFLICT (email) DO UPDATE
  SET role = EXCLUDED.role,
      name = COALESCE(admins.name, EXCLUDED.name);
