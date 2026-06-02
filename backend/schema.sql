-- ============================================================
-- Zetech Events Hub — Complete Supabase SQL Setup
-- Paste this ENTIRE block into the Supabase SQL editor and run:
-- https://supabase.com/dashboard
-- ============================================================

-- ─── 1. CREATE ALL TABLES ─────────────────────────────────────

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  admin_email   VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100),
  role          VARCHAR(20)  NOT NULL DEFAULT 'admin'
                 CHECK (role IN ('admin','club_leader')),
  club          VARCHAR(100),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Student registrations table
CREATE TABLE IF NOT EXISTS student_registrations (
  id               SERIAL PRIMARY KEY,
  first_name       VARCHAR(100)  NOT NULL,
  last_name        VARCHAR(100)  NOT NULL,
  admission_number VARCHAR(50)   NOT NULL UNIQUE,
  email            VARCHAR(255)  NOT NULL UNIQUE,
  password         VARCHAR(255)  NOT NULL,
  phone            VARCHAR(20),
  status           VARCHAR(20)   NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','deleted')),
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  description      TEXT         NOT NULL,
  date             DATE         NOT NULL,
  end_date         DATE,
  time             TIME         NOT NULL,
  location         VARCHAR(255) NOT NULL,
  category         VARCHAR(100) NOT NULL DEFAULT 'General',
  max_participants INT CHECK (max_participants IS NULL OR max_participants > 0),
  image_url        VARCHAR(500),
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','upcoming','ongoing','completed','cancelled','rejected')),
  created_by       INT          NOT NULL REFERENCES admins(id),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id                SERIAL PRIMARY KEY,
  event_id          INT         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id        INT         NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            VARCHAR(20) NOT NULL DEFAULT 'registered'
                      CHECK (status IN ('registered','attended','cancelled')),
  UNIQUE (event_id, student_id)
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT         NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  display_order INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event subcategories table
CREATE TABLE IF NOT EXISTS event_subcategories (
  id            SERIAL PRIMARY KEY,
  category_id   INT          NOT NULL REFERENCES event_categories(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  display_order INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, name)
);

-- Event reactions table
CREATE TABLE IF NOT EXISTS event_reactions (
  id         SERIAL PRIMARY KEY,
  event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
  reaction   VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, student_id)
);

-- Event comments table
CREATE TABLE IF NOT EXISTS event_comments (
  id         SERIAL PRIMARY KEY,
  event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
  comment    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event waitlist table
CREATE TABLE IF NOT EXISTS event_waitlist (
  id         SERIAL PRIMARY KEY,
  event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, student_id)
);

-- Event gallery table
CREATE TABLE IF NOT EXISTS event_gallery (
  id          SERIAL PRIMARY KEY,
  event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url   VARCHAR(500) NOT NULL,
  caption     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security audit logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id          SERIAL PRIMARY KEY,
  event_type  VARCHAR(60)  NOT NULL,
  actor_type  VARCHAR(20)  NOT NULL,
  actor_id    INT,
  actor_email VARCHAR(255),
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  target_type VARCHAR(50),
  target_id   INT,
  details     TEXT,
  success     BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 2. CREATE INDEXES ───────────────────────────────────────

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_student_reg_admission  ON student_registrations(admission_number);
CREATE INDEX IF NOT EXISTS idx_student_reg_email      ON student_registrations(email);
CREATE INDEX IF NOT EXISTS idx_student_reg_status     ON student_registrations(status);
CREATE INDEX IF NOT EXISTS idx_events_status          ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date             ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_by       ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_reg_event               ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_reg_student             ON event_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_reactions_event         ON event_reactions(event_id);
CREATE INDEX IF NOT EXISTS idx_comments_event          ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_event          ON event_waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_gallery_event           ON event_gallery(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type        ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id          ON security_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at        ON security_audit_logs(created_at DESC);

-- ─── 3. CREATE TRIGGERS ───────────────────────────────────────

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 4. ENABLE ROW LEVEL SECURITY ───────────────────────────

ALTER TABLE admins                ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subcategories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_waitlist        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery         ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs   ENABLE ROW LEVEL SECURITY;

-- ─── 5. CREATE RLS POLICIES ───────────────────────────────────

-- Service role bypass (for backend - uses service role key)
CREATE POLICY "Service role can do anything" ON admins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON student_registrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON event_registrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON event_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON event_subcategories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON event_reactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON event_comments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON event_waitlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON event_gallery
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON security_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public read policies (for frontend - uses anon key)
CREATE POLICY "Public can read events" ON events
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('upcoming', 'ongoing', 'completed'));

CREATE POLICY "Public can read event categories" ON event_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read event subcategories" ON event_subcategories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read event gallery" ON event_gallery
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read system settings" ON system_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated user policies (for frontend - uses authenticated key)
CREATE POLICY "Students can read their own registration" ON student_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = email);

CREATE POLICY "Students can update their own registration" ON student_registrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = email)
  WITH CHECK (auth.uid()::text = email);

CREATE POLICY "Students can read their own event registrations" ON event_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = event_registrations.student_id
      AND email = auth.uid()::text
    )
  );

CREATE POLICY "Students can create event registrations" ON event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = event_registrations.student_id
      AND email = auth.uid()::text
    )
  );

CREATE POLICY "Students can react to events" ON event_reactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = event_reactions.student_id
      AND email = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = event_reactions.student_id
      AND email = auth.uid()::text
    )
  );

CREATE POLICY "Students can comment on events" ON event_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = event_comments.student_id
      AND email = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = event_comments.student_id
      AND email = auth.uid()::text
    )
  );

CREATE POLICY "Students can join waitlist" ON event_waitlist
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = event_waitlist.student_id
      AND email = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = event_waitlist.student_id
      AND email = auth.uid()::text
    )
  );

-- ─── 6. INSERT DEFAULT DATA ───────────────────────────────────

-- Insert default system settings
INSERT INTO system_settings (key, value)
VALUES
  ('system_name',        'Zetech Events Hub'),
  ('system_email',       'events@zetech.ac.ke'),
  ('allow_registration', 'true'),
  ('max_events_per_student', '10')
ON CONFLICT (key) DO NOTHING;

-- Insert default event categories
INSERT INTO event_categories (name, display_order) VALUES
  ('Tech & Academic',    0),
  ('Social & Community', 1),
  ('Sports & Fitness',  2),
  ('Arts & Culture',     3),
  ('Career & Professional', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default event subcategories
INSERT INTO event_subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM (VALUES
  ('Tech & Academic',    'IT Club (iTech)',                         0),
  ('Tech & Academic',    'Engineering Club',                        1),
  ('Tech & Academic',    'Mathematics Club',                         2),
  ('Tech & Academic',    'Science Club',                            3),
  ('Tech & Academic',    'Hackathons',                              4),
  ('Social & Community', 'Student Council',                          0),
  ('Social & Community', 'Community Service',                        1),
  ('Social & Community', 'Networking Events',                        2),
  ('Social & Community', 'Social Gatherings',                        3),
  ('Sports & Fitness',   'Football',                                 0),
  ('Sports & Fitness',   'Basketball',                               1),
  ('Sports & Fitness',   'Athletics',                                2),
  ('Sports & Fitness',   'Rugby',                                   3),
  ('Sports & Fitness',   'Swimming',                                4),
  ('Arts & Culture',     'Drama Club',                              0),
  ('Arts & Culture',     'Music Club',                              1),
  ('Arts & Culture',     'Art Club',                                2),
  ('Arts & Culture',     'Cultural Events',                         3),
  ('Career & Professional', 'Career Fair',                            0),
  ('Career & Professional', 'Workshops',                              1),
  ('Career & Professional', 'Mentorship Programs',                    2),
  ('Career & Professional', 'Alumni Events',                         3)
) AS v(cat, name, ord)
JOIN event_categories c ON c.name = v.cat
ON CONFLICT (category_id, name) DO NOTHING;
