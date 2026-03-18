-- OXXO Products table + seed data + analytics tables

-- ─── Core products table ────────────────────────────────────
CREATE TABLE oxxo_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  brand text,
  category text NOT NULL,
  subcategory text,
  traffic_light text NOT NULL CHECK (traffic_light IN ('green', 'yellow', 'red')),
  estimated_gl numeric,
  glycemic_index integer,
  is_best_choice boolean DEFAULT false,
  swap_suggestion text,       -- product_name of the swap (must exist in this table)
  swap_suggestion_ids uuid[], -- optional references to swap products
  why_tip text,               -- short explanation
  why_detail text,            -- longer explanation for detail sheet
  price_mxn numeric,          -- approximate price
  barcode text,
  serving_size_g numeric,
  serving_label text,
  availability text DEFAULT 'national',
  data_source text DEFAULT 'nutrition_label_estimate',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_oxxo_products_category ON oxxo_products(category);
CREATE INDEX idx_oxxo_products_traffic ON oxxo_products(traffic_light);
CREATE INDEX idx_oxxo_products_best ON oxxo_products(is_best_choice) WHERE is_best_choice = true;
CREATE INDEX idx_oxxo_products_barcode ON oxxo_products(barcode) WHERE barcode IS NOT NULL;

-- Enable text search
CREATE INDEX idx_oxxo_products_name_trgm ON oxxo_products USING gin (product_name gin_trgm_ops);

-- RLS
ALTER TABLE oxxo_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oxxo_products_read" ON oxxo_products FOR SELECT USING (true);

-- ─── Analytics table ────────────────────────────────────────
CREATE TABLE oxxo_guide_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_oxxo_events_user ON oxxo_guide_events(user_id);
CREATE INDEX idx_oxxo_events_type ON oxxo_guide_events(event_type);

ALTER TABLE oxxo_guide_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oxxo_events_insert" ON oxxo_guide_events FOR INSERT WITH CHECK (true);

-- ─── Community scans table ──────────────────────────────────
CREATE TABLE oxxo_uncurated_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text NOT NULL UNIQUE,
  product_name text,
  brand text,
  nutrition_data jsonb,
  estimated_gi integer,
  estimated_gl numeric,
  traffic_light text,
  scan_count integer DEFAULT 1,
  first_scanned_at timestamptz DEFAULT now(),
  last_scanned_at timestamptz DEFAULT now(),
  curated boolean DEFAULT false
);

ALTER TABLE oxxo_uncurated_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oxxo_uncurated_insert" ON oxxo_uncurated_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "oxxo_uncurated_read" ON oxxo_uncurated_scans FOR SELECT USING (true);

-- ─── Seed data ──────────────────────────────────────────────
INSERT INTO oxxo_products (product_name, brand, category, traffic_light, estimated_gl, is_best_choice, swap_suggestion, why_tip, why_detail, price_mxn, serving_label) VALUES
-- DRINKS: Water & Mineral
('Ciel Mineralizada', 'Ciel', 'drinks_water', 'green', 0, true, NULL,
 'Always the safest choice', 'Zero calories, zero sugar, zero glucose impact. The best drink you can grab at OXXO, period.', 15, '600ml'),
('Ciel Natural', 'Ciel', 'drinks_water', 'green', 0, true, NULL,
 'Pure water, zero impact', 'Plain water is always green. Stay hydrated without any glucose spike.', 12, '600ml'),
('Peñafiel Mineral', 'Peñafiel', 'drinks_water', 'green', 0, true, NULL,
 'Sparkling and safe', 'Plain mineral water with zero sugar. The bubbles add no glucose impact.', 16, '600ml'),
('Topochico Original', 'Topochico', 'drinks_water', 'green', 0, true, NULL,
 'Mexico''s favorite mineral water', 'Iconic sparkling water, zero sugar. Perfect choice.', 18, '600ml'),

-- DRINKS: Zero/Diet sodas
('Coca-Cola Zero', 'Coca-Cola', 'drinks_soda', 'green', 0, true, NULL,
 'Zero sugar, full flavor', 'Artificial sweeteners don''t raise blood glucose. If you want soda, this is the way.', 22, '600ml'),
('Coca-Cola Light', 'Coca-Cola', 'drinks_soda', 'green', 0, false, NULL,
 'Diet option, zero glucose', 'Like Zero, uses artificial sweeteners with no glucose impact.', 22, '600ml'),
('Sprite Zero', 'Sprite', 'drinks_soda', 'green', 0, false, NULL,
 'Lemon-lime without the sugar', 'Zero sugar version keeps the taste without the glucose spike.', 22, '600ml'),
('Fresca Original', 'Fresca', 'drinks_soda', 'green', 0, false, NULL,
 'A classic Mexican diet soda', 'Zero sugar grapefruit soda. Has been a staple in Mexico for decades.', 20, '600ml'),

-- DRINKS: Regular sodas (RED)
('Coca-Cola Original', 'Coca-Cola', 'drinks_soda', 'red', 33, false, 'Coca-Cola Zero',
 'Glucose bomb — 63g sugar', 'A 600ml Coca-Cola has 63g of sugar, hitting your bloodstream fast. One of the highest GL drinks at OXXO.', 22, '600ml'),
('Pepsi Regular', 'Pepsi', 'drinks_soda', 'red', 30, false, 'Coca-Cola Zero',
 'Almost as much sugar as Coke', 'Similar glucose impact to Coca-Cola. Switch to any zero-sugar soda instead.', 20, '600ml'),
('Sprite Regular', 'Sprite', 'drinks_soda', 'red', 31, false, 'Sprite Zero',
 'Clear doesn''t mean safe', 'Despite looking "lighter," Sprite has almost the same sugar as Coca-Cola.', 22, '600ml'),
('Fanta Orange', 'Fanta', 'drinks_soda', 'red', 32, false, 'Fresca Original',
 'Fruity but dangerous', 'Fanta''s orange flavor has even more sugar than Coca-Cola in some sizes.', 22, '600ml'),
('Manzanita Sol', 'Manzanita Sol', 'drinks_soda', 'red', 30, false, 'Fresca Original',
 'Apple soda, major spike', 'Mexico''s favorite apple soda, but loaded with sugar. Try Fresca instead.', 20, '600ml'),

-- DRINKS: Juice (RED)
('Jumex Mango (Tetra)', 'Jumex', 'drinks_juice', 'red', 28, false, 'Ciel Mineralizada',
 'Fruit juice is not fruit', 'Juice concentrates spike glucose fast — no fiber to slow absorption. Water + real lime is better.', 18, '335ml'),
('Jumex Guava (Tetra)', 'Jumex', 'drinks_juice', 'red', 26, false, 'Ciel Mineralizada',
 'High sugar despite being "natural"', 'Even 100% juice spikes glucose. The fiber from whole fruit is what protects you.', 18, '335ml'),
('Del Valle Nectar Durazno', 'Del Valle', 'drinks_juice', 'red', 27, false, 'Ciel Mineralizada',
 'Nectar = sugar water', 'Nectars have added sugar on top of fruit sugar. One of the worst choices.', 18, '335ml'),
('Boing! Mango', 'Boing!', 'drinks_juice', 'red', 29, false, 'Ciel Mineralizada',
 'Iconic but terrible for glucose', 'Boing! is beloved in Mexico but packed with sugar. Choose water instead.', 15, '500ml'),

-- DRINKS: Coffee
('Andatti Americano Negro', 'Andatti', 'drinks_coffee', 'green', 0, true, NULL,
 'Black coffee, zero impact', 'Plain black coffee has virtually zero glucose impact. Andatti is at every OXXO.', 29, '355ml'),
('Andatti Capuchino', 'Andatti', 'drinks_coffee', 'yellow', 8, false, 'Andatti Americano Negro',
 'Added milk and sugar raise GL', 'The milk and sweetener in capuchino adds moderate glucose impact. Go black if you can.', 35, '355ml'),
('Nescafé Latte (can)', 'Nescafé', 'drinks_coffee', 'yellow', 10, false, 'Andatti Americano Negro',
 'Canned coffee = added sugar', 'Pre-made coffee drinks almost always have added sugar. Check the label.', 25, '240ml'),

-- DRINKS: Energy & Sports
('Electrolit (600ml)', 'Electrolit', 'drinks_sports', 'yellow', 11, false, 'Ciel Mineralizada',
 'Electrolytes but also sugar', 'Electrolit has less sugar than soda but still a moderate glucose impact. Use when actually dehydrated.', 25, '600ml'),
('Red Bull Regular', 'Red Bull', 'drinks_energy', 'red', 22, false, 'Andatti Americano Negro',
 'Energy from sugar, not just caffeine', 'The energy comes partly from 27g of sugar. Get caffeine from black coffee instead.', 35, '250ml'),
('Monster Energy', 'Monster', 'drinks_energy', 'red', 25, false, 'Andatti Americano Negro',
 'Massive sugar load', 'Large can with tons of sugar. If you need caffeine, black coffee is the move.', 35, '473ml'),
('Gatorade (600ml)', 'Gatorade', 'drinks_sports', 'yellow', 12, false, 'Electrolit (600ml)',
 'Sports drink sugar adds up', 'Designed for athletes burning glucose fast. For everyday hydration, water is better.', 22, '600ml'),

-- DRINKS: Dairy
('Yakult Original', 'Yakult', 'drinks_dairy', 'yellow', 7, false, NULL,
 'Small but sweet', 'Tiny bottle but has 11g sugar. The probiotics are good, but the sugar adds up if you drink multiple.', 12, '80ml'),
('Santa Clara Leche Entera', 'Santa Clara', 'drinks_dairy', 'yellow', 6, false, NULL,
 'Milk has natural lactose sugar', 'Whole milk has a moderate GL from lactose. Not bad, not great.', 25, '500ml'),

-- DRINKS: Flavored water (TRICKY)
('Ciel Limón', 'Ciel', 'drinks_flavored', 'yellow', 9, false, 'Ciel Mineralizada',
 'Flavored = added sugar', '"Flavored" water has added sugar. Plain Ciel is always the safer bet.', 16, '600ml'),
('Peñafiel Limón', 'Peñafiel', 'drinks_flavored', 'yellow', 8, false, 'Peñafiel Mineral',
 'Sparkling + sweet = moderate GL', 'The flavored version adds sugar to the mineral water. Stick with plain.', 17, '600ml'),
('Bonafont Juizzy', 'Bonafont', 'drinks_flavored', 'yellow', 10, false, 'Ciel Mineralizada',
 'Looks healthy but has sugar', 'Marketed as healthy water but check the label — sugar sneaks in.', 18, '600ml'),

-- SNACKS: Nuts & Seeds (GREEN)
('Cacahuates Japoneses', 'De La Rosa', 'snacks_nuts', 'green', 4, true, NULL,
 'Best snack at OXXO for glucose', 'Peanuts are high protein, high fat, low carb — the perfect low-GI snack. The light soy coating adds minimal glucose.', 18, '110g'),
('De La Rosa Cacahuates Enchilados', 'De La Rosa', 'snacks_nuts', 'green', 5, true, NULL,
 'Spicy peanuts, still great', 'Chili-coated peanuts. The coating adds minimal carbs, and the fat/protein keep GL low.', 18, '110g'),
('Cacahuates Salados', 'De La Rosa', 'snacks_nuts', 'green', 3, true, NULL,
 'Simple salted peanuts', 'Just peanuts and salt. One of the lowest GL snacks you can find anywhere.', 16, '70g'),
('Semillas de Girasol', 'Various', 'snacks_nuts', 'green', 3, true, NULL,
 'Sunflower seeds are excellent', 'High in healthy fats and protein, very low carb. Great for glucose control.', 15, '50g'),
('Pistaches', 'Wonderful', 'snacks_nuts', 'green', 4, false, NULL,
 'Premium nut, low GL', 'Pistachios are among the best nuts for glucose. The shelling slows you down too!', 35, '70g'),
('Almendras', 'Various', 'snacks_nuts', 'green', 2, true, NULL,
 'Almonds are near-zero GL', 'Extremely low carb, high protein and fat. One of the absolute best snacks.', 30, '50g'),

-- SNACKS: Chips (YELLOW - portion matters)
('Sabritas Original (45g)', 'Sabritas', 'snacks_chips', 'yellow', 9, false, 'Cacahuates Japoneses',
 'Small bag keeps it moderate', 'The 45g bag is yellow, not red — portion control matters! The larger bag would be red.', 18, '45g'),
('Doritos Nacho (45g)', 'Doritos', 'snacks_chips', 'yellow', 10, false, 'Cacahuates Japoneses',
 'Corn base raises GL a bit', 'Corn tortilla chips have moderate GI. The small bag keeps the total GL manageable.', 18, '45g'),
('Ruffles Queso (45g)', 'Ruffles', 'snacks_chips', 'yellow', 9, false, 'Cacahuates Japoneses',
 'Potato chips, moderate in small bag', 'Fried potatoes have moderate GI, but the fat slows absorption. Small bag = yellow.', 18, '45g'),
('Cheetos Flamin Hot (52g)', 'Cheetos', 'snacks_chips', 'yellow', 10, false, 'Cacahuates Japoneses',
 'Corn-based, moderate GL', 'Corn puffs with moderate GL. The spice doesn''t affect glucose, but the corn base does.', 18, '52g'),
('Takis Fuego (62g)', 'Takis', 'snacks_chips', 'yellow', 11, false, 'Cacahuates Japoneses',
 'Rolled tortilla = moderate GL', 'Corn tortilla-based with a higher GL than potato chips. Keep to one small bag.', 20, '62g'),

-- SNACKS: Chips large (RED)
('Sabritas Original (170g)', 'Sabritas', 'snacks_chips', 'red', 26, false, 'Sabritas Original (45g)',
 'Big bag = big spike', 'Same chip, but the large bag has 4x the carbs. Always grab the small bag instead.', 38, '170g'),

-- SNACKS: Candy & Chocolate
('Mazapán De La Rosa', 'De La Rosa', 'snacks_candy', 'yellow', 10, false, NULL,
 'Best candy option at OXXO', 'Pure peanut base means Mazapán has one of the lowest GLs of any candy. Mexico''s secret low-GI sweet.', 8, '28g'),
('Carlos V Chocolate', 'Nestlé', 'snacks_candy', 'yellow', 12, false, 'Mazapán De La Rosa',
 'Milk chocolate, moderate GL', 'Chocolate''s fat slows sugar absorption. Not ideal but better than pure sugar candy.', 15, '20g'),
('Pulparindo', 'De La Rosa', 'snacks_candy', 'yellow', 8, false, NULL,
 'Tamarind candy, surprisingly moderate', 'Small portion and tamarind base keep GL moderate. One of the less bad candies.', 8, '14g'),
('Duvalín', 'Ricolino', 'snacks_candy', 'yellow', 9, false, 'Mazapán De La Rosa',
 'Small cream candy, moderate', 'Tiny portion keeps total GL down despite being sweet.', 8, '18g'),
('Gansito', 'Marinela', 'snacks_candy', 'red', 28, false, 'Mazapán De La Rosa',
 'Triple glucose threat', 'Refined flour + sugar + chocolate coating = one of the worst snack cakes for glucose. A Mexican icon, but a glucose bomb.', 18, '50g'),
('Chocoroles', 'Marinela', 'snacks_candy', 'red', 25, false, 'Mazapán De La Rosa',
 'Chocolate cake roll, high GL', 'Similar to Gansito — refined flour base with sugar and chocolate. Very high GL.', 15, '40g'),
('Pingüinos', 'Marinela', 'snacks_candy', 'red', 26, false, 'Mazapán De La Rosa',
 'Chocolate cupcakes, high GL', 'Marinela''s chocolate cupcakes are refined flour + sugar. Bad for glucose.', 18, '80g'),
('Skittles', 'Skittles', 'snacks_candy', 'red', 30, false, 'Cacahuates Japoneses',
 'Pure sugar in candy form', 'Almost 100% sugar with no fat or protein to slow absorption. Maximum glucose spike.', 20, '54g'),
('Gomitas Ricolino', 'Ricolino', 'snacks_candy', 'red', 28, false, 'Mazapán De La Rosa',
 'Gummies = pure sugar', 'Gummy candy is essentially sugar and gelatin. Very high GL with no buffering.', 15, '100g'),

-- SNACKS: Bars & Cookies
('Barritas de Fresa', 'Marinela', 'snacks_bars', 'red', 22, false, 'Mazapán De La Rosa',
 'Strawberry bar is mostly sugar', 'Despite looking wholesome, the jam filling is high sugar on a refined flour base.', 12, '55g'),
('Emperador Chocolate', 'Gamesa', 'snacks_bars', 'red', 20, false, 'Cacahuates Japoneses',
 'Sandwich cookies spike glucose', 'Refined flour cookies with sugar cream filling. High GL despite small portion.', 15, '44g'),
('Nature Valley Granola Bar', 'Nature Valley', 'snacks_bars', 'yellow', 14, false, 'Cacahuates Japoneses',
 '"Healthy" but moderate GL', 'Granola bars look healthy but oats + honey + sugar still raise glucose moderately.', 18, '42g'),

-- HOT FOOD
('Hot Dog (sin pan)', 'OXXO', 'hot_food', 'green', 2, true, NULL,
 'Skip the bun, keep the sausage', 'The sausage alone is mostly protein and fat — very low GL. The bun is what spikes glucose.', 30, '1 unit'),
('Hot Dog (con pan)', 'OXXO', 'hot_food', 'yellow', 14, false, 'Hot Dog (sin pan)',
 'The bun is the problem', 'Refined flour bun adds significant GL. Ask for it without the bun or in a lettuce wrap.', 30, '1 unit'),
('Hamburguesa OXXO', 'OXXO', 'hot_food', 'yellow', 15, false, 'Hot Dog (sin pan)',
 'Burger bun raises GL', 'The meat patty is fine, but the white bread bun spikes glucose. Skip the bun if you can.', 45, '1 unit'),
('Pizza Slice (OXXO)', 'OXXO', 'hot_food', 'red', 20, false, 'Hot Dog (sin pan)',
 'Refined dough + toppings', 'Pizza dough is high-GI refined flour. Combined with cheese and sauce, it''s a glucose trap.', 35, '1 slice'),
('Flautas (2 pcs)', 'OXXO', 'hot_food', 'yellow', 13, false, 'Hot Dog (sin pan)',
 'Fried tortilla, moderate GL', 'Corn tortilla is moderate GI, but frying adds fat that slightly slows absorption.', 35, '2 pieces'),

-- DAIRY
('Yogurt Griego Natural', 'Lala', 'dairy_yogurt', 'green', 3, true, NULL,
 'Best dairy choice at OXXO', 'Plain Greek yogurt is high protein, low sugar. One of the best snacks for glucose control. Usually in the back fridge.', 28, '150g'),
('Yogurt Activia Natural', 'Danone', 'dairy_yogurt', 'green', 4, false, NULL,
 'Probiotics + low sugar', 'Plain Activia without fruit has low GL. The probiotics may even help glucose metabolism.', 22, '150g'),
('Yogurt Danone Fresa', 'Danone', 'dairy_yogurt', 'yellow', 12, false, 'Yogurt Griego Natural',
 'Fruit yogurt = added sugar', 'Flavored yogurts have significant added sugar. Always choose plain over flavored.', 20, '150g'),

-- DAIRY: Cheese
('Queso Oaxaca (portion)', 'Various', 'dairy_cheese', 'green', 1, true, NULL,
 'Cheese is great for glucose', 'Almost zero carbs, high protein and fat. String cheese makes a perfect low-GI snack.', 20, '40g'),

-- BREAD & BAKERY
('Pan Bimbo Blanco (2 slices)', 'Bimbo', 'bread_bakery', 'red', 18, false, 'Queso Oaxaca (portion)',
 'White bread is pure glucose spike', 'Refined white flour has one of the highest GIs of any food. The staple bread of Mexico, but terrible for glucose.', 40, '2 slices'),
('Donas Bimbo', 'Bimbo', 'bread_bakery', 'red', 24, false, 'Mazapán De La Rosa',
 'Donuts = flour + sugar + glaze', 'Refined flour fried in oil with sugar glaze. Triple threat for glucose.', 22, '1 unit'),
('Mantecadas Bimbo', 'Bimbo', 'bread_bakery', 'red', 22, false, 'Mazapán De La Rosa',
 'Sweet muffins spike glucose', 'Muffins are basically cake — refined flour, sugar, and butter.', 20, '2 pack'),
('Tortillas de Maíz (pack)', 'Mission', 'bread_bakery', 'yellow', 11, false, NULL,
 'Corn is better than white flour', 'Corn tortillas have a lower GI than white bread. Nixtamalization helps!', 20, '6 pack'),

-- PREPARED/CONVENIENCE
('Maruchan Instant', 'Maruchan', 'prepared_food', 'red', 22, false, 'Hot Dog (sin pan)',
 'Instant noodles = refined carbs', 'White flour noodles with added sodium. Very high GI with minimal nutrition.', 15, '64g'),
('Burrito OXXO (Bean & Cheese)', 'OXXO', 'prepared_food', 'yellow', 15, false, 'Hot Dog (sin pan)',
 'Flour tortilla raises GL', 'Beans are actually low GI, but the large flour tortilla wrapper pushes GL up.', 40, '1 unit'),

-- SNACKS: Jerky & Meat
('Beef Jerky (Jack Links)', 'Jack Links', 'snacks_jerky', 'green', 2, true, NULL,
 'Protein snack, near-zero GL', 'Dried meat is almost pure protein. Excellent for glucose control.', 45, '50g'),
('Chicharrones de Cerdo', 'Various', 'snacks_jerky', 'green', 0, true, NULL,
 'Zero carb, zero GL', 'Pork rinds are 100% protein and fat. Literally zero glucose impact.', 20, '50g'),

-- FROZEN
('Helado Magnum Classic', 'Magnum', 'frozen_treats', 'red', 20, false, 'Yogurt Griego Natural',
 'Ice cream bar, high GL', 'Sugar + milk + chocolate coating. The fat slows it slightly but still high GL.', 35, '1 bar'),
('Paleta Helada de Fruta', 'Various', 'frozen_treats', 'yellow', 12, false, 'Yogurt Griego Natural',
 'Fruit popsicle has sugar', 'Less GL than ice cream but still significant sugar. Small portion helps.', 15, '1 bar');
