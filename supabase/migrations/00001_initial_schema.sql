-- ============================================================
-- Loti — Initial Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE food_category AS ENUM (
  'grains_bread', 'legumes', 'vegetables', 'fruits', 'dairy',
  'meat_poultry', 'seafood', 'eggs', 'nuts_seeds', 'beverages',
  'desserts_sweets', 'snacks', 'soups_stews', 'mixed_dishes',
  'sauces_condiments', 'fast_food', 'other'
);

CREATE TYPE gi_category_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE gl_category_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE traffic_light_enum AS ENUM ('green', 'yellow', 'red');

CREATE TYPE data_source_enum AS ENUM (
  'lab_tested', 'published_study', 'international_table',
  'cgm_community', 'ai_estimated', 'expert_estimated'
);

CREATE TYPE study_protocol_enum AS ENUM (
  'iso_26642', 'modified_iso', 'non_standard', 'estimated'
);

CREATE TYPE reference_food_enum AS ENUM ('glucose', 'white_bread');
CREATE TYPE subject_type_enum AS ENUM ('healthy', 'type2_diabetic', 'mixed');

CREATE TYPE match_method_enum AS ENUM (
  'exact', 'partial', 'weighted_average', 'ai_estimated'
);

CREATE TYPE modifier_type_enum AS ENUM ('addition', 'preparation', 'eating_order');
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- ============================================================
-- FOODS TABLE
-- ============================================================

CREATE TABLE foods (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  name_display          TEXT NOT NULL,
  name_es               TEXT,
  category              food_category NOT NULL DEFAULT 'other',
  serving_size_g        NUMERIC(7,2) NOT NULL DEFAULT 100,
  serving_description   TEXT,
  calories_per_serving  NUMERIC(7,2),
  carbs_g               NUMERIC(7,2),
  fiber_g               NUMERIC(7,2),
  available_carbs_g     NUMERIC(7,2),
  protein_g             NUMERIC(7,2),
  fat_g                 NUMERIC(7,2),
  sugar_g               NUMERIC(7,2),
  glycemic_index        INTEGER CHECK (glycemic_index BETWEEN 0 AND 150),
  gi_category           gi_category_enum,
  glycemic_load         NUMERIC(7,2),
  gl_category           gl_category_enum,
  traffic_light         traffic_light_enum,
  data_source           data_source_enum NOT NULL DEFAULT 'ai_estimated',
  confidence_score      NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  source_citation       TEXT,
  photo_recognition_tags TEXT[],
  swap_suggestion_ids   UUID[],
  swap_tip              TEXT,
  swap_tip_es           TEXT,
  is_mixed_meal         BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT foods_name_unique UNIQUE (name)
);

-- ============================================================
-- FOOD ALIASES
-- ============================================================

CREATE TABLE food_aliases (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id   UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  alias     TEXT NOT NULL,
  locale    TEXT NOT NULL DEFAULT 'en',

  CONSTRAINT food_aliases_unique UNIQUE (alias, locale)
);

-- ============================================================
-- GI MEASUREMENTS (published study data)
-- ============================================================

CREATE TABLE gi_measurements (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id                   UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  glycemic_index_measured   INTEGER NOT NULL,
  study_protocol            study_protocol_enum,
  reference_food            reference_food_enum,
  n_subjects                INTEGER,
  subject_type              subject_type_enum,
  institution               TEXT,
  authors                   TEXT,
  year                      INTEGER,
  journal                   TEXT,
  doi                       TEXT,
  notes                     TEXT
);

-- ============================================================
-- INGREDIENTS (per-100g nutritional data)
-- ============================================================

CREATE TABLE ingredients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL UNIQUE,
  calories_per_100g       NUMERIC(7,2),
  carbs_per_100g          NUMERIC(7,2),
  fiber_per_100g          NUMERIC(7,2),
  available_carbs_per_100g NUMERIC(7,2),
  protein_per_100g        NUMERIC(7,2),
  fat_per_100g            NUMERIC(7,2),
  glycemic_index          INTEGER,
  gi_source               TEXT
);

-- ============================================================
-- FOOD INGREDIENTS (recipe composition)
-- ============================================================

CREATE TABLE food_ingredients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id               UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  ingredient_id         UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  proportion_g          NUMERIC(7,2) NOT NULL,
  is_primary_carb_source BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================
-- GI MODIFIERS
-- ============================================================

CREATE TABLE gi_modifiers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  modifier_type     modifier_type_enum NOT NULL,
  multiplier        NUMERIC(4,3) NOT NULL,
  mechanism         TEXT,
  source_citation   TEXT
);

-- ============================================================
-- SCAN LOGS (food diary)
-- ============================================================

CREATE TABLE scan_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_storage_path    TEXT,
  gpt_raw_response      JSONB,
  matched_food_id       UUID REFERENCES foods(id) ON DELETE SET NULL,
  match_method          match_method_enum,
  identified_food_name  TEXT,
  -- Macro snapshot (denormalized)
  calories_kcal         NUMERIC(7,2),
  protein_g             NUMERIC(7,2),
  carbs_g               NUMERIC(7,2),
  fat_g                 NUMERIC(7,2),
  fiber_g               NUMERIC(7,2),
  serving_size_g        NUMERIC(7,2),
  -- GI/GL snapshot
  result_gi             INTEGER,
  result_gl             NUMERIC(7,2),
  result_traffic_light  traffic_light_enum,
  confidence_score      NUMERIC(3,2),
  -- Meal context
  meal_type             meal_type_enum,
  swap_suggestion       TEXT,
  -- Performance
  response_time_ms      INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DAILY TOTALS (materialized daily summaries)
-- ============================================================

CREATE TABLE daily_totals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  total_calories    NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_protein_g   NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_carbs_g     NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_fat_g       NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_fiber_g     NUMERIC(7,2) NOT NULL DEFAULT 0,
  scan_count        INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT daily_totals_user_date UNIQUE (user_id, date)
);

-- ============================================================
-- USER GOALS (future: personalized targets from onboarding)
-- ============================================================

CREATE TABLE user_goals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_calories_target   NUMERIC(7,2),
  daily_protein_g_target  NUMERIC(7,2),
  daily_carbs_g_target    NUMERIC(7,2),
  daily_fat_g_target      NUMERIC(7,2),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CGM MEAL LOGS (future Phase 4 — schema only)
-- ============================================================

CREATE TABLE cgm_meal_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id               UUID REFERENCES foods(id) ON DELETE SET NULL,
  photo_storage_path    TEXT,
  glucose_pre_meal      NUMERIC(5,1),
  glucose_peak          NUMERIC(5,1),
  glucose_2h_post       NUMERIC(5,1),
  time_to_peak_min      INTEGER,
  cgm_device            TEXT,
  ai_predicted_gi       INTEGER,
  actual_measured_gi    INTEGER,
  prediction_delta      INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RATE LIMITS
-- ============================================================

CREATE TABLE rate_limits (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start  TIMESTAMPTZ NOT NULL,
  scan_count    INTEGER NOT NULL DEFAULT 1,

  PRIMARY KEY (user_id, window_start)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_foods_name_trgm ON foods USING gin (name gin_trgm_ops);
CREATE INDEX idx_foods_name_es_trgm ON foods USING gin (name_es gin_trgm_ops);
CREATE INDEX idx_foods_category ON foods (category);
CREATE INDEX idx_food_aliases_alias_trgm ON food_aliases USING gin (alias gin_trgm_ops);
CREATE INDEX idx_food_aliases_food_id ON food_aliases (food_id);
CREATE INDEX idx_gi_measurements_food_id ON gi_measurements (food_id);
CREATE INDEX idx_food_ingredients_food_id ON food_ingredients (food_id);
CREATE INDEX idx_scan_logs_user_created ON scan_logs (user_id, created_at DESC);
CREATE INDEX idx_daily_totals_user_date ON daily_totals (user_id, date DESC);
CREATE INDEX idx_rate_limits_lookup ON rate_limits (user_id, window_start);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER foods_updated_at
  BEFORE UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_totals_updated_at
  BEFORE UPDATE ON daily_totals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE gi_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE gi_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cgm_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Public read-only tables
CREATE POLICY "foods_select" ON foods FOR SELECT USING (true);
CREATE POLICY "food_aliases_select" ON food_aliases FOR SELECT USING (true);
CREATE POLICY "gi_measurements_select" ON gi_measurements FOR SELECT USING (true);
CREATE POLICY "ingredients_select" ON ingredients FOR SELECT USING (true);
CREATE POLICY "food_ingredients_select" ON food_ingredients FOR SELECT USING (true);
CREATE POLICY "gi_modifiers_select" ON gi_modifiers FOR SELECT USING (true);

-- User-scoped tables
CREATE POLICY "scan_logs_select_own" ON scan_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scan_logs_insert_own" ON scan_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_totals_select_own" ON daily_totals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_totals_insert_own" ON daily_totals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_totals_update_own" ON daily_totals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_goals_select_own" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_goals_insert_own" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_goals_update_own" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cgm_meal_logs_select_own" ON cgm_meal_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cgm_meal_logs_insert_own" ON cgm_meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rate_limits_select_own" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);
