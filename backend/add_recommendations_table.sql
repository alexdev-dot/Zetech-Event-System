-- ============================================================
-- Add Recommendations Table Only
-- Run this to add the user_event_interactions table for the TikTok-style recommendation system
-- ============================================================

-- Create user event interactions table (for recommendations)
CREATE TABLE IF NOT EXISTS user_event_interactions (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
  event_id         INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'click', 'register')),
  time_spent       INT DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_user       ON user_event_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_event      ON user_event_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type       ON user_event_interactions(interaction_type);

-- Enable RLS
ALTER TABLE user_event_interactions ENABLE ROW LEVEL SECURITY;

-- Service role policy (for backend)
DROP POLICY IF EXISTS "Service role can do anything" ON user_event_interactions;
CREATE POLICY "Service role can do anything" ON user_event_interactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated user policy (for students to track their interactions)
DROP POLICY IF EXISTS "Students can track their interactions" ON user_event_interactions;
CREATE POLICY "Students can track their interactions" ON user_event_interactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = user_event_interactions.user_id
      AND email = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_registrations
      WHERE id = user_event_interactions.user_id
      AND email = auth.uid()::text
    )
  );
