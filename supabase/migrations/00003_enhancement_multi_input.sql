-- ============================================================
-- Enhancement: Multi-Input Layer, Favorites, History
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ENUM UPDATES
-- ────────────────────────────────────────────────────────────

-- Add macro_estimated to data_source (for barcode nutrition label GI)
ALTER TYPE data_source_enum ADD VALUE IF NOT EXISTS 'macro_estimated';

-- ────────────────────────────────────────────────────────────
-- 2. FOODS TABLE — new columns for barcode/packaged products
-- ────────────────────────────────────────────────────────────

ALTER TABLE foods ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS is_packaged BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_barcode ON foods (barcode) WHERE barcode IS NOT NULL;

-- Rename calories_per_serving → calories_kcal for consistency with edge functions
ALTER TABLE foods RENAME COLUMN calories_per_serving TO calories_kcal;

-- ────────────────────────────────────────────────────────────
-- 3. SCAN LOGS — new columns for multi-input + history
-- ────────────────────────────────────────────────────────────

-- Rename identified_food_name → food_name
ALTER TABLE scan_logs RENAME COLUMN identified_food_name TO food_name;

-- Change match_method from enum to text (too many dynamic values now)
ALTER TABLE scan_logs ALTER COLUMN match_method TYPE TEXT USING match_method::TEXT;

-- New columns
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS input_method TEXT NOT NULL DEFAULT 'photo_scan';
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS meal_group_id UUID;

-- Index for meal groups (text input multi-item meals)
CREATE INDEX IF NOT EXISTS idx_scan_logs_meal_group ON scan_logs (meal_group_id) WHERE meal_group_id IS NOT NULL;

-- Index for input method filtering
CREATE INDEX IF NOT EXISTS idx_scan_logs_input_method ON scan_logs (user_id, input_method);

-- ────────────────────────────────────────────────────────────
-- 4. PACKAGED PRODUCTS CACHE (Open Food Facts barcode cache)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS packaged_products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode               TEXT UNIQUE NOT NULL,
  product_name          TEXT,
  brand                 TEXT,
  nutrition_label       JSONB,
  open_food_facts_data  JSONB,
  estimated_gi          INTEGER,
  gi_confidence         NUMERIC(3,2),
  first_scanned_at      TIMESTAMPTZ DEFAULT now(),
  last_scanned_at       TIMESTAMPTZ DEFAULT now(),
  scan_count            INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_packaged_products_barcode ON packaged_products (barcode);

-- ────────────────────────────────────────────────────────────
-- 5. USER FAVORITES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id           UUID REFERENCES foods(id) ON DELETE CASCADE,
  -- For favorites from non-DB foods (FatSecret/USDA/GPT results)
  food_name         TEXT,
  cached_result     JSONB,
  custom_quantity   INTEGER DEFAULT 1,
  custom_serving_g  NUMERIC(7,2),
  nickname          TEXT,
  last_used_at      TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT favorites_user_food UNIQUE (user_id, food_id),
  CONSTRAINT favorites_has_food CHECK (food_id IS NOT NULL OR food_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites (user_id, last_used_at DESC);

-- RLS for user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_update_own" ON user_favorites
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for packaged_products (public read, service role write)
ALTER TABLE packaged_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packaged_products_select" ON packaged_products FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- 6. UPDATE DAILY TOTALS TRIGGER for quantity awareness
-- ────────────────────────────────────────────────────────────

-- The existing trigger in 00002 already handles macro aggregation.
-- No changes needed — calories/macros in scan_logs are already
-- quantity-adjusted by the edge function before insert.

-- ────────────────────────────────────────────────────────────
-- 7. UPDATED_AT TRIGGER for user_favorites
-- ────────────────────────────────────────────────────────────

CREATE TRIGGER user_favorites_updated_last_used
  BEFORE UPDATE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
