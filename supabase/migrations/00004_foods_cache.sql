-- ============================================================
-- Migration 00004: Foods Cache for Waterfall Search
-- ============================================================
-- Core cache table for all food lookups. Every result from
-- FatSecret, Open Food Facts, GPT-4o, and user corrections
-- gets cached here. The more it's used, the smarter it gets.
-- ============================================================

-- Enable fuzzy text search (already enabled, but safe to re-run)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Core food cache — every food item ever looked up by any user
CREATE TABLE IF NOT EXISTS foods_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_es TEXT NOT NULL,               -- Spanish name (primary for Mexico)
  name_en TEXT,                         -- English name
  calories NUMERIC(7,2),                -- per serving
  protein_g NUMERIC(7,2),
  carbs_g NUMERIC(7,2),
  fat_g NUMERIC(7,2),
  fiber_g NUMERIC(7,2),
  serving_size NUMERIC(7,2),
  serving_unit TEXT DEFAULT 'g',        -- 'g', 'ml', 'piece', 'cup', etc.
  source TEXT NOT NULL,                 -- 'fatsecret', 'openfoodfacts', 'gpt4o', 'user', 'seed'
  source_id TEXT,                       -- external ID from the source API
  barcode TEXT,                         -- EAN/UPC if applicable
  confidence NUMERIC(3,2) DEFAULT 1.0,  -- 0.0-1.0, lower for GPT estimates
  image_url TEXT,
  lookup_count INTEGER DEFAULT 1,
  verified BOOLEAN DEFAULT FALSE,       -- true if confirmed by 3+ users or nutritionist
  metadata JSONB DEFAULT '{}',          -- flexible field for extra source data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_foods_cache_name_es_trgm ON foods_cache USING gin (name_es gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_foods_cache_name_en_trgm ON foods_cache USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_foods_cache_barcode ON foods_cache (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foods_cache_source ON foods_cache (source);
CREATE INDEX IF NOT EXISTS idx_foods_cache_lookup_count ON foods_cache (lookup_count DESC);

-- Search aliases for regional Mexican food names
CREATE TABLE IF NOT EXISTS foods_cache_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL,                   -- e.g., 'elote', 'esquite', 'bolillo'
  canonical_food_id UUID REFERENCES foods_cache(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foods_cache_aliases_trgm ON foods_cache_aliases USING gin (alias gin_trgm_ops);

-- Function to search foods_cache with trigram similarity
CREATE OR REPLACE FUNCTION search_foods_cache(
  search_term TEXT,
  similarity_threshold NUMERIC DEFAULT 0.3,
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name_es TEXT,
  name_en TEXT,
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  serving_size NUMERIC,
  serving_unit TEXT,
  source TEXT,
  source_id TEXT,
  barcode TEXT,
  confidence NUMERIC,
  image_url TEXT,
  lookup_count INTEGER,
  verified BOOLEAN,
  metadata JSONB,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id, fc.name_es, fc.name_en, fc.calories, fc.protein_g, fc.carbs_g,
    fc.fat_g, fc.fiber_g, fc.serving_size, fc.serving_unit, fc.source,
    fc.source_id, fc.barcode, fc.confidence, fc.image_url, fc.lookup_count,
    fc.verified, fc.metadata,
    GREATEST(
      similarity(fc.name_es, search_term),
      COALESCE(similarity(fc.name_en, search_term), 0)
    ) AS similarity_score
  FROM foods_cache fc
  WHERE
    similarity(fc.name_es, search_term) > similarity_threshold
    OR similarity(fc.name_en, search_term) > similarity_threshold
  ORDER BY similarity_score DESC, fc.lookup_count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to also check aliases
CREATE OR REPLACE FUNCTION search_foods_cache_with_aliases(
  search_term TEXT,
  similarity_threshold NUMERIC DEFAULT 0.3,
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name_es TEXT,
  name_en TEXT,
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  serving_size NUMERIC,
  serving_unit TEXT,
  source TEXT,
  source_id TEXT,
  barcode TEXT,
  confidence NUMERIC,
  image_url TEXT,
  lookup_count INTEGER,
  verified BOOLEAN,
  metadata JSONB,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  -- Direct name matches
  SELECT
    fc.id, fc.name_es, fc.name_en, fc.calories, fc.protein_g, fc.carbs_g,
    fc.fat_g, fc.fiber_g, fc.serving_size, fc.serving_unit, fc.source,
    fc.source_id, fc.barcode, fc.confidence, fc.image_url, fc.lookup_count,
    fc.verified, fc.metadata,
    GREATEST(
      similarity(fc.name_es, search_term),
      COALESCE(similarity(fc.name_en, search_term), 0)
    ) AS similarity_score
  FROM foods_cache fc
  WHERE
    similarity(fc.name_es, search_term) > similarity_threshold
    OR similarity(fc.name_en, search_term) > similarity_threshold

  UNION

  -- Alias matches
  SELECT
    fc.id, fc.name_es, fc.name_en, fc.calories, fc.protein_g, fc.carbs_g,
    fc.fat_g, fc.fiber_g, fc.serving_size, fc.serving_unit, fc.source,
    fc.source_id, fc.barcode, fc.confidence, fc.image_url, fc.lookup_count,
    fc.verified, fc.metadata,
    similarity(fca.alias, search_term) AS similarity_score
  FROM foods_cache_aliases fca
  JOIN foods_cache fc ON fc.id = fca.canonical_food_id
  WHERE similarity(fca.alias, search_term) > similarity_threshold

  ORDER BY similarity_score DESC, lookup_count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS: readable by all (including anon), writable only by service role
ALTER TABLE foods_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods_cache_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foods_cache_read_all" ON foods_cache
  FOR SELECT USING (true);

CREATE POLICY "foods_cache_aliases_read_all" ON foods_cache_aliases
  FOR SELECT USING (true);

-- Service role can do everything (edge functions use service role key)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated — only service role bypasses RLS
