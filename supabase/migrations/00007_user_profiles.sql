-- User profiles table for onboarding data and personalized thresholds
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users UNIQUE NOT NULL,

  -- Onboarding data
  health_state text NOT NULL DEFAULT 'healthy',
  goal text NOT NULL DEFAULT 'learn',
  diagnosis_duration text,
  a1c_value numeric,
  medications text[] DEFAULT '{}',
  age integer,
  sex text DEFAULT 'not_specified',
  activity_level text,
  dietary_restrictions text[] DEFAULT '{}',
  meal_struggles text[] DEFAULT '{}',

  -- Personalized thresholds (computed from health_state + profile)
  gl_threshold_green integer NOT NULL DEFAULT 10,
  gl_threshold_yellow integer NOT NULL DEFAULT 19,

  -- Onboarding metadata
  onboarding_completed_at timestamptz,
  onboarding_screens_completed integer DEFAULT 0,
  first_scan_id uuid,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
