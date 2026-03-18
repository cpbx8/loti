-- Suggestion logs — track AI food suggestion usage for analytics
CREATE TABLE IF NOT EXISTS suggestion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  context_type text NOT NULL,
  meal_type text,
  freetext_input text,
  suggestions_returned jsonb NOT NULL,
  suggestion_tapped text,
  scan_summary_snapshot jsonb,
  response_time_ms integer,
  token_count integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_suggestion_logs_user ON suggestion_logs(user_id);
CREATE INDEX idx_suggestion_logs_created ON suggestion_logs(created_at);

ALTER TABLE suggestion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own suggestions"
  ON suggestion_logs FOR ALL
  USING (auth.uid() = user_id);
