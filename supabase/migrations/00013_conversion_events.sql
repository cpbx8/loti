-- ============================================================
-- Conversion Analytics
-- ============================================================

CREATE TABLE IF NOT EXISTS conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_user ON conversion_events (user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_type ON conversion_events (event_type);

-- RLS: users can insert their own events, only admins can read
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own events"
  ON conversion_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own events"
  ON conversion_events FOR SELECT USING (auth.uid() = user_id);
