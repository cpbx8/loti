/**
 * Seed data for local SQLite database.
 * Mexican foods with published GI/GL values + store products from existing data files.
 */

export const SEED_FOODS = `
INSERT OR IGNORE INTO foods (id, name, name_en, glycemic_index, glycemic_load, default_traffic_light, swap_tip, swap_tip_en, confidence_score, data_source, category) VALUES
('f001', 'Frijoles negros (cocidos)', 'Black beans (cooked)', 30, 5, 'green', NULL, NULL, 0.95, 'published_study', 'legumes'),
('f002', 'Tortilla de maíz (blanca)', 'White corn tortilla', 74, 22, 'red', 'Agrega frijoles o nopal para reducir el impacto glucémico', 'Add beans or nopal to reduce glucose impact', 0.9, 'published_study', 'grains'),
('f003', 'Tortilla de harina', 'Flour tortilla', 53, 15, 'yellow', 'Prueba tortilla de maíz con frijoles para menor impacto', 'Try corn tortilla with beans for lower impact', 0.9, 'published_study', 'grains'),
('f004', 'Nopal', 'Cactus paddle', 15, 2, 'green', NULL, NULL, 0.85, 'published_study', 'vegetables'),
('f005', 'Arroz blanco', 'White rice', 73, 23, 'red', 'Prueba arroz integral o mezcla con frijoles', 'Try brown rice or mix with beans', 0.9, 'published_study', 'grains'),
('f006', 'Pollo a la plancha', 'Grilled chicken', 0, 0, 'green', NULL, NULL, 0.95, 'published_study', 'protein'),
('f007', 'Aguacate', 'Avocado', 15, 1, 'green', NULL, NULL, 0.95, 'published_study', 'fats'),
('f008', 'Pan dulce (concha)', 'Sweet bread (concha)', 72, 25, 'red', 'Fruta fresca con yogurt natural', 'Fresh fruit with plain yogurt', 0.8, 'expert_estimated', 'bakery'),
('f009', 'Plátano', 'Banana', 51, 13, 'yellow', NULL, NULL, 0.9, 'published_study', 'fruits'),
('f010', 'Mango', 'Mango', 56, 16, 'yellow', 'Medio mango en lugar de uno entero', 'Half a mango instead of a whole one', 0.85, 'published_study', 'fruits'),
('f011', 'Huevo (cocido)', 'Boiled egg', 0, 0, 'green', NULL, NULL, 0.95, 'published_study', 'protein'),
('f012', 'Tortilla de nopal', 'Nopal tortilla', 20, 4, 'green', NULL, NULL, 0.7, 'expert_estimated', 'grains'),
('f013', 'Avena cocida', 'Cooked oatmeal', 55, 13, 'yellow', 'Agrega canela y nueces para reducir el pico', 'Add cinnamon and nuts to reduce spike', 0.85, 'published_study', 'grains'),
('f014', 'Jícama', 'Jicama', 35, 5, 'green', NULL, NULL, 0.8, 'published_study', 'vegetables'),
('f015', 'Papaya', 'Papaya', 60, 17, 'yellow', 'Porción pequeña con limón y chile', 'Small portion with lime and chile', 0.85, 'published_study', 'fruits');
`;

/**
 * Generate INSERT statements for store products from the existing TypeScript seed arrays.
 * Called at runtime during database initialization.
 */
export function generateStoreProductInserts(products: Array<{
  id: string
  store_chain: string
  product_name: string
  brand: string | null
  category: string
  traffic_light: string
  estimated_gl: number | null
  is_best_choice: boolean
  swap_suggestion: string | null
  why_tip: string | null
  why_detail: string | null
  price_mxn: number | null
  barcode: string | null
  serving_label: string | null
  image_url: string | null
}>): Array<{ statement: string; values: unknown[] }> {
  return products.map(p => ({
    statement: `INSERT OR IGNORE INTO store_products (id, product_name, brand, barcode, category, store_chain, estimated_gl, traffic_light, swap_suggestion, why_tip, why_detail, is_best_choice, price_mxn, serving_label, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values: [
      p.id, p.product_name, p.brand, p.barcode, p.category, p.store_chain,
      p.estimated_gl, p.traffic_light, p.swap_suggestion, p.why_tip, p.why_detail,
      p.is_best_choice ? 1 : 0, p.price_mxn, p.serving_label, p.image_url,
    ],
  }))
}
