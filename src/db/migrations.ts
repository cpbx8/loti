/**
 * SQLite migration DDL for Loti local-first database.
 * All user data lives on-device — no remote database.
 */

export const MIGRATION_001 = `
-- App metadata (db version, settings)
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- User profile (single row — one user, no auth)
CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  health_state TEXT NOT NULL DEFAULT 'healthy',
  goal TEXT,
  diagnosis_duration TEXT,
  a1c_value REAL,
  age INTEGER,
  sex TEXT DEFAULT 'not_specified',
  activity_level TEXT DEFAULT 'moderate',
  medications TEXT DEFAULT '[]',
  dietary_restrictions TEXT DEFAULT '[]',
  meal_struggles TEXT DEFAULT '[]',
  gl_threshold_green REAL NOT NULL DEFAULT 10,
  gl_threshold_yellow REAL NOT NULL DEFAULT 19,
  onboarding_completed INTEGER DEFAULT 0,
  language TEXT DEFAULT 'es',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert the single profile row
INSERT OR IGNORE INTO user_profile (id) VALUES (1);

-- Foods (the local GI database)
CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  glycemic_index INTEGER NOT NULL,
  glycemic_load REAL NOT NULL,
  default_traffic_light TEXT NOT NULL,
  swap_tip TEXT,
  swap_tip_en TEXT,
  confidence_score REAL DEFAULT 0.5,
  data_source TEXT DEFAULT 'expert_estimated',
  barcode TEXT,
  category TEXT,
  serving_size_g REAL,
  carbs_g REAL,
  fiber_g REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_name_en ON foods(name_en);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);

-- Scan logs (meal history)
CREATE TABLE IF NOT EXISTS scan_logs (
  id TEXT PRIMARY KEY,
  food_name TEXT NOT NULL,
  food_name_en TEXT,
  glycemic_index REAL,
  glycemic_load REAL NOT NULL,
  traffic_light TEXT NOT NULL,
  input_method TEXT NOT NULL DEFAULT 'unknown',
  quantity INTEGER DEFAULT 1,
  confidence_score REAL,
  serving_size_g REAL,
  calories_kcal REAL,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  fiber_g REAL,
  swap_tip TEXT,
  source TEXT,
  meal_type TEXT,
  raw_input TEXT,
  food_id TEXT,
  scanned_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scans_date ON scan_logs(scanned_at DESC);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  food_id TEXT,
  food_name TEXT NOT NULL,
  cached_result TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(food_name)
);

-- Store products (OXXO, 7-Eleven guides)
CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  category TEXT NOT NULL,
  store_chain TEXT NOT NULL DEFAULT 'oxxo',
  estimated_gl REAL,
  traffic_light TEXT NOT NULL,
  swap_suggestion TEXT,
  why_tip TEXT,
  why_detail TEXT,
  is_best_choice INTEGER DEFAULT 0,
  price_mxn REAL,
  serving_label TEXT,
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_store_barcode ON store_products(barcode);
CREATE INDEX IF NOT EXISTS idx_store_chain ON store_products(store_chain);

-- Barcode cache (caches external API lookups)
CREATE TABLE IF NOT EXISTS barcode_cache (
  barcode TEXT PRIMARY KEY,
  product_name TEXT,
  brand TEXT,
  source TEXT NOT NULL,
  estimated_gi REAL,
  estimated_gl REAL,
  traffic_light TEXT,
  confidence_score REAL,
  cached_at TEXT DEFAULT (datetime('now'))
);
`;
