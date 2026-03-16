-- ============================================================
-- Fuzzy food matching function using pg_trgm
-- ============================================================

CREATE OR REPLACE FUNCTION match_food_fuzzy(
  search_term TEXT,
  threshold FLOAT DEFAULT 0.3,
  result_limit INT DEFAULT 5
)
RETURNS SETOF foods AS $$
  SELECT *
  FROM foods
  WHERE similarity(name, search_term) > threshold
     OR similarity(COALESCE(name_es, ''), search_term) > threshold
  ORDER BY GREATEST(
    similarity(name, search_term),
    similarity(COALESCE(name_es, ''), search_term)
  ) DESC
  LIMIT result_limit;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- Upsert daily totals after scan log insert
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_daily_totals()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_totals (user_id, date, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, scan_count)
  VALUES (
    NEW.user_id,
    (NEW.created_at AT TIME ZONE 'UTC')::date,
    COALESCE(NEW.calories_kcal, 0),
    COALESCE(NEW.protein_g, 0),
    COALESCE(NEW.carbs_g, 0),
    COALESCE(NEW.fat_g, 0),
    COALESCE(NEW.fiber_g, 0),
    1
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_calories = daily_totals.total_calories + COALESCE(NEW.calories_kcal, 0),
    total_protein_g = daily_totals.total_protein_g + COALESCE(NEW.protein_g, 0),
    total_carbs_g = daily_totals.total_carbs_g + COALESCE(NEW.carbs_g, 0),
    total_fat_g = daily_totals.total_fat_g + COALESCE(NEW.fat_g, 0),
    total_fiber_g = daily_totals.total_fiber_g + COALESCE(NEW.fiber_g, 0),
    scan_count = daily_totals.scan_count + 1,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER scan_logs_upsert_daily
  AFTER INSERT ON scan_logs
  FOR EACH ROW EXECUTE FUNCTION upsert_daily_totals();
