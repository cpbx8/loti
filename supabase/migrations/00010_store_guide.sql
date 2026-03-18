-- Store Guide: multi-store product database (OXXO first)
-- Migrates data from oxxo_products (00009) into new store_products schema

-- ─── Store chains reference ───────────────────────────────────
CREATE TABLE IF NOT EXISTS store_chains (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  icon_emoji text DEFAULT '🏪',
  created_at timestamptz DEFAULT now()
);

INSERT INTO store_chains (id, display_name, icon_emoji)
VALUES ('oxxo', 'OXXO', '🏪')
ON CONFLICT (id) DO NOTHING;

-- ─── Store products (multi-store) ─────────────────────────────
CREATE TABLE store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_chain text NOT NULL REFERENCES store_chains(id),
  product_name text NOT NULL,
  brand text,
  category text NOT NULL,
  traffic_light text NOT NULL CHECK (traffic_light IN ('green', 'yellow', 'red')),
  estimated_gl numeric,
  is_best_choice boolean DEFAULT false,
  swap_suggestion text,
  why_tip text,
  why_detail text,
  price_mxn numeric,
  barcode text,
  serving_size_g numeric,
  serving_label text,
  -- Internal nutrition columns (never sent to client)
  carbs_g numeric,
  sugar_g numeric,
  fiber_g numeric,
  protein_g numeric,
  fat_g numeric,
  gi_confidence numeric DEFAULT 0.4,
  data_source text DEFAULT 'curated',
  image_url text,
  availability text DEFAULT 'national',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_store_products_chain ON store_products(store_chain);
CREATE INDEX idx_store_products_category ON store_products(store_chain, category);
CREATE INDEX idx_store_products_traffic ON store_products(store_chain, traffic_light);
CREATE INDEX idx_store_products_barcode ON store_products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_store_products_name_trgm ON store_products USING gin (product_name gin_trgm_ops);

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_products_public_read" ON store_products FOR SELECT USING (true);

-- ─── Store guide analytics ────────────────────────────────────
CREATE TABLE store_guide_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  store_chain text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_store_events_chain ON store_guide_events(store_chain);
CREATE INDEX idx_store_events_type ON store_guide_events(store_chain, event_type);

ALTER TABLE store_guide_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_events_insert" ON store_guide_events FOR INSERT WITH CHECK (true);

-- ─── Community uncurated scans ────────────────────────────────
CREATE TABLE store_uncurated_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text NOT NULL,
  store_chain text NOT NULL REFERENCES store_chains(id),
  product_name text,
  brand text,
  nutrition_data jsonb,
  estimated_gi integer,
  estimated_gl numeric,
  traffic_light text,
  scan_count integer DEFAULT 1,
  first_scanned_at timestamptz DEFAULT now(),
  last_scanned_at timestamptz DEFAULT now(),
  promoted_to_products boolean DEFAULT false,
  UNIQUE(barcode, store_chain)
);

ALTER TABLE store_uncurated_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_uncurated_insert" ON store_uncurated_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "store_uncurated_read" ON store_uncurated_scans FOR SELECT USING (true);

-- ─── Migrate seed data from oxxo_products ─────────────────────
INSERT INTO store_products (
  product_name, brand, category, traffic_light, estimated_gl,
  is_best_choice, swap_suggestion, why_tip, why_detail,
  price_mxn, barcode, serving_size_g, serving_label,
  data_source, store_chain
)
SELECT
  product_name, brand, category, traffic_light, estimated_gl,
  is_best_choice, swap_suggestion, why_tip, why_detail,
  price_mxn, barcode, serving_size_g, serving_label,
  data_source, 'oxxo'
FROM oxxo_products;
