-- ============================================================
-- Migration 00006: Add Glycemic Index / Load / Traffic Light
-- ============================================================
-- Core feature for Loti: tells diabetics whether a food is
-- green (low impact), yellow (moderate), or red (high impact)
-- on their blood glucose.
-- ============================================================

-- Add GI columns to foods_cache
ALTER TABLE foods_cache ADD COLUMN IF NOT EXISTS glycemic_index NUMERIC(5,1);
ALTER TABLE foods_cache ADD COLUMN IF NOT EXISTS glycemic_load NUMERIC(5,1);
ALTER TABLE foods_cache ADD COLUMN IF NOT EXISTS traffic_light TEXT; -- 'green', 'yellow', 'red'
ALTER TABLE foods_cache ADD COLUMN IF NOT EXISTS gi_source TEXT DEFAULT 'unknown'; -- 'published', 'estimated', 'unknown'

-- Drop existing functions (return type changed, CREATE OR REPLACE can't handle that)
DROP FUNCTION IF EXISTS search_foods_cache(TEXT, NUMERIC, INTEGER);
DROP FUNCTION IF EXISTS search_foods_cache_with_aliases(TEXT, NUMERIC, INTEGER);

-- Recreate search_foods_cache with new columns in return type
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
  glycemic_index NUMERIC,
  glycemic_load NUMERIC,
  traffic_light TEXT,
  gi_source TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id, fc.name_es, fc.name_en, fc.calories, fc.protein_g, fc.carbs_g,
    fc.fat_g, fc.fiber_g, fc.serving_size, fc.serving_unit, fc.source,
    fc.source_id, fc.barcode, fc.confidence, fc.image_url, fc.lookup_count,
    fc.verified, fc.metadata,
    fc.glycemic_index, fc.glycemic_load, fc.traffic_light, fc.gi_source,
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

-- Recreate search_foods_cache_with_aliases with new columns in return type
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
  glycemic_index NUMERIC,
  glycemic_load NUMERIC,
  traffic_light TEXT,
  gi_source TEXT,
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
    fc.glycemic_index, fc.glycemic_load, fc.traffic_light, fc.gi_source,
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
    fc.glycemic_index, fc.glycemic_load, fc.traffic_light, fc.gi_source,
    similarity(fca.alias, search_term) AS similarity_score
  FROM foods_cache_aliases fca
  JOIN foods_cache fc ON fc.id = fca.canonical_food_id
  WHERE similarity(fca.alias, search_term) > similarity_threshold

  ORDER BY similarity_score DESC, lookup_count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
