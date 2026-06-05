-- ============================================================
-- Event Lifecycle Migration
-- Adds support for missed and archived event statuses
-- Run this in Supabase SQL editor
-- ============================================================

-- 1. Add new status values to events table
ALTER TABLE events 
DROP CONSTRAINT events_status_check;

ALTER TABLE events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('pending','upcoming','ongoing','completed','cancelled','rejected','missed','archived'));

-- 2. Add archived_at timestamp
ALTER TABLE events ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 3. Add index for archive queries
CREATE INDEX IF NOT EXISTS idx_events_archived_at ON events(archived_at);
CREATE INDEX IF NOT EXISTS idx_events_status_missed ON events(status) WHERE status = 'missed';
CREATE INDEX IF NOT EXISTS idx_events_status_archived ON events(status) WHERE status = 'archived';

-- 4. Update RLS policy to include missed and archived for admin access
DROP POLICY IF EXISTS "Service role can do anything" ON events;
CREATE POLICY "Service role can do anything" ON events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Update public read policy to exclude missed and archived
DROP POLICY IF EXISTS "Public can read events" ON events;
CREATE POLICY "Public can read events" ON events
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('upcoming', 'ongoing', 'completed', 'missed'));

-- 6. Create function to update event lifecycle
CREATE OR REPLACE FUNCTION update_event_lifecycle()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Move ongoing events to missed if date has passed
  UPDATE events 
  SET status = 'missed'
  WHERE status = 'ongoing' 
  AND date < CURRENT_DATE;
  
  -- Move missed events to archived after 14 days
  UPDATE events 
  SET status = 'archived', archived_at = NOW()
  WHERE status = 'missed' 
  AND date < CURRENT_DATE - INTERVAL '14 days';
END;
$$;

-- 7. Create a scheduled task (requires pg_cron extension)
-- First, enable pg_cron if not already enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run daily at midnight
-- SELECT cron.schedule('update-event-lifecycle', '0 0 * * *', 'SELECT update_event_lifecycle()');
