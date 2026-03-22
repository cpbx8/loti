-- ============================================================
-- Server-side RPC functions
-- ============================================================

-- Check if user can scan (called by Edge Functions and frontend)
CREATE OR REPLACE FUNCTION check_scan_permission(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  sub record;
  scans integer;
  is_new_day boolean;
BEGIN
  SELECT * INTO sub FROM user_subscriptions WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN '{"allowed": false, "reason": "no_subscription"}'::jsonb;
  END IF;

  -- Premium users: always allowed
  IF sub.is_premium AND (sub.subscription_expires_at IS NULL OR sub.subscription_expires_at > now()) THEN
    RETURN '{"allowed": true, "reason": "premium"}'::jsonb;
  END IF;

  -- Trial expired
  IF now() >= sub.trial_expires_at THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'trial_expired',
      'scans_remaining', 0,
      'trial_days_remaining', 0
    );
  END IF;

  -- Daily limit check (reset at midnight)
  is_new_day := (sub.scans_today_reset_at::date != now()::date);
  scans := CASE WHEN is_new_day THEN 0 ELSE sub.scans_today END;

  IF scans >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'trial_scan_limit',
      'scans_remaining', 0,
      'trial_days_remaining', GREATEST(0, EXTRACT(DAY FROM sub.trial_expires_at - now())::integer)
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'trial_active',
    'scans_remaining', 3 - scans,
    'trial_days_remaining', GREATEST(0, EXTRACT(DAY FROM sub.trial_expires_at - now())::integer)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment scan counter (called after successful scan)
CREATE OR REPLACE FUNCTION increment_scan_count(p_user_id uuid)
RETURNS void AS $$
DECLARE
  is_new_day boolean;
BEGIN
  SELECT (scans_today_reset_at::date != now()::date) INTO is_new_day
  FROM user_subscriptions WHERE user_id = p_user_id;

  UPDATE user_subscriptions SET
    scans_today = CASE WHEN is_new_day THEN 1 ELSE scans_today + 1 END,
    scans_today_reset_at = CASE WHEN is_new_day THEN now() ELSE scans_today_reset_at END,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compute personalized GL thresholds from health profile
CREATE OR REPLACE FUNCTION compute_thresholds(
  p_health_state text,
  p_a1c numeric DEFAULT NULL,
  p_activity text DEFAULT 'moderate',
  p_age integer DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  green numeric;
  yellow numeric;
BEGIN
  -- Base thresholds by health state
  CASE p_health_state
    WHEN 'healthy' THEN green := 10; yellow := 20;
    WHEN 'prediabetic' THEN green := 8; yellow := 15;
    WHEN 'type2' THEN green := 7; yellow := 13;
    WHEN 'gestational' THEN green := 7; yellow := 12;
    WHEN 'type1' THEN green := 7; yellow := 13;
    ELSE green := 10; yellow := 20;
  END CASE;

  -- High A1C tightens thresholds
  IF p_a1c IS NOT NULL AND p_a1c > 8.0 THEN
    green := green - 1;
    yellow := yellow - 1;
  END IF;

  -- Sedentary tightens, active loosens
  IF p_activity = 'sedentary' THEN
    yellow := yellow - 1;
  ELSIF p_activity = 'active' THEN
    green := green + 1;
  END IF;

  -- Age > 65 tightens slightly
  IF p_age IS NOT NULL AND p_age > 65 THEN
    yellow := yellow - 1;
  END IF;

  RETURN jsonb_build_object('gl_threshold_green', green, 'gl_threshold_yellow', yellow);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
