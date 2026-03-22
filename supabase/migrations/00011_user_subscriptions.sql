-- ============================================================
-- User Subscriptions — trial/premium tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 days'),
  is_premium boolean NOT NULL DEFAULT false,
  subscription_type text, -- 'monthly', 'annual', null
  subscription_provider text DEFAULT 'apple_iap',
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  subscription_auto_renew boolean DEFAULT true,
  scans_today integer NOT NULL DEFAULT 0,
  scans_today_reset_at timestamptz NOT NULL DEFAULT now(),
  paywall_impressions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own subscription"
  ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own subscription"
  ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile + subscription on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO user_subscriptions (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill: create subscription rows for any existing users who don't have one
INSERT INTO user_subscriptions (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions (user_id);
