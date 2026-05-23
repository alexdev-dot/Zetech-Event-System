-- ============================================================
-- Zetech Events Hub — Supabase SQL Setup
-- Paste this ENTIRE block into the Supabase SQL editor and run:
-- https://supabase.com/dashboard/project/druqtjclfqcbzonjyjoi/sql/new
-- ============================================================

-- ─── 1. ADD MISSING COLUMNS TO EXISTING admins TABLE ─────────
-- (safe to re-run — uses IF NOT EXISTS)

ALTER TABLE admins ADD COLUMN IF NOT EXISTS name  VARCHAR(100);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role  VARCHAR(20)  NOT NULL DEFAULT 'admin'
  CHECK (role IN ('admin','club_leader'));
ALTER TABLE admins ADD COLUMN IF NOT EXISTS club  VARCHAR(100);

-- Ensure the default admin has role = 'admin'
UPDATE admins SET role = 'admin' WHERE role IS NULL;

-- ─── 2. CREATE MISSING TABLES ────────────────────────────────

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
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','upcoming','ongoing','completed','cancelled','rejected')),
  created_by       INT          NOT NULL REFERENCES admins(id),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'General';
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_participants INT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

CREATE TABLE IF NOT EXISTS event_registrations (
  id                SERIAL PRIMARY KEY,
  event_id          INT         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id        INT         NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            VARCHAR(20) NOT NULL DEFAULT 'registered'
                      CHECK (status IN ('registered','attended','cancelled')),
  UNIQUE (event_id, student_id)
);

-- ─── 3. AUTO-UPDATE updated_at TRIGGER ───────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 4. DISABLE ROW LEVEL SECURITY ───────────────────────────

ALTER TABLE admins                DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE events                DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations   DISABLE ROW LEVEL SECURITY;
