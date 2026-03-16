-- ============================================================
-- Loti Seed Data
-- ~80 foods: 50 Mexican + ~30 global staples
-- 7 GI modifiers
-- Food aliases for matching
-- ============================================================

-- Helper: compute GI category
-- low <= 55, medium 56-69, high >= 70
-- Helper: compute GL category & traffic light
-- GL < 10 = green/low, GL 10-19 = yellow/medium, GL >= 20 = red/high

-- ============================================================
-- MEXICAN FOODS (50) — Published GI values where available
-- ============================================================

INSERT INTO foods (name, name_display, name_es, category, serving_size_g, serving_description, calories_per_serving, carbs_g, fiber_g, available_carbs_g, protein_g, fat_g, sugar_g, glycemic_index, gi_category, glycemic_load, gl_category, traffic_light, data_source, confidence_score, source_citation, photo_recognition_tags, swap_tip, swap_tip_es, is_mixed_meal) VALUES

-- === PUBLISHED GI VALUES (16 foods) ===

('black beans cooked', 'Black Beans (Cooked)', 'Frijoles negros cocidos', 'legumes', 172, '1 cup', 227, 40.8, 15.0, 25.8, 15.2, 0.9, 0.6,
  30, 'low', 7.7, 'low', 'green',
  'published_study', 0.95, 'Frati et al. 1991, Arch Invest Med',
  ARRAY['black beans', 'frijoles negros', 'cooked beans', 'beans'],
  'Already a great choice! Add lime for even lower glucose impact.', 'Ya es una gran elección. Agrega limón para un impacto aún menor.', false),

('pinto beans cooked', 'Pinto Beans (Cooked)', 'Frijoles pintos cocidos', 'legumes', 171, '1 cup', 245, 44.8, 15.4, 29.4, 15.4, 1.1, 0.5,
  19, 'low', 5.6, 'low', 'green',
  'published_study', 0.95, 'Noriega et al. 2000, Diabetes Nutr Metab',
  ARRAY['pinto beans', 'frijoles pintos', 'cooked pinto beans'],
  'Excellent low-GI choice. Pair with vegetables for a balanced meal.', NULL, false),

('refried beans', 'Refried Beans', 'Frijoles refritos', 'legumes', 126, '1/2 cup', 118, 19.8, 6.7, 13.1, 6.9, 1.6, 0.5,
  38, 'low', 5.0, 'low', 'green',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['refried beans', 'frijoles refritos', 'bean dip', 'mashed beans'],
  'Good choice! Skip the lard-heavy versions for an even healthier option.', NULL, false),

('flour tortilla', 'Flour Tortilla', 'Tortilla de harina', 'grains_bread', 45, '1 medium tortilla', 140, 23.6, 1.3, 22.3, 3.6, 3.5, 0.8,
  53, 'low', 11.8, 'medium', 'yellow',
  'published_study', 0.95, 'Noriega et al. 2000',
  ARRAY['flour tortilla', 'tortilla de harina', 'wheat tortilla', 'white tortilla'],
  'Try a corn tortilla instead — lower GI and fewer calories.', 'Prueba una tortilla de maíz — menor índice glucémico y menos calorías.', false),

('corn tortilla white', 'Corn Tortilla (White Nixtamal)', 'Tortilla de maíz blanca', 'grains_bread', 26, '1 medium tortilla', 52, 10.7, 1.5, 9.2, 1.4, 0.7, 0.2,
  74, 'high', 6.8, 'low', 'green',
  'published_study', 0.95, 'Noriega et al. 2000',
  ARRAY['corn tortilla', 'tortilla de maiz', 'white corn tortilla', 'tortilla'],
  'High GI but small serving keeps GL low. Pair with beans to reduce glucose spike.', 'Alto IG pero la porción pequeña mantiene la CG baja. Acompáñala con frijoles.', false),

('corn tortilla yellow', 'Corn Tortilla (Yellow)', 'Tortilla de maíz amarilla', 'grains_bread', 26, '1 medium tortilla', 52, 10.7, 1.5, 9.2, 1.4, 0.7, 0.2,
  70, 'high', 6.4, 'low', 'green',
  'published_study', 0.90, 'Frati et al. 1991',
  ARRAY['yellow corn tortilla', 'tortilla amarilla'],
  'Pair with beans and avocado to slow glucose absorption.', NULL, false),

('bean taco corn tortilla', 'Bean Taco (Corn Tortilla)', 'Taco de frijol', 'mixed_dishes', 80, '1 taco', 130, 21.0, 4.5, 16.5, 5.5, 3.0, 0.5,
  56, 'medium', 9.2, 'low', 'green',
  'published_study', 0.95, 'Noriega et al. 2000',
  ARRAY['bean taco', 'taco de frijol', 'frijol taco'],
  'Great balanced choice! The beans help moderate the glucose response.', 'Excelente elección balanceada. Los frijoles ayudan a moderar la glucosa.', true),

('potato taco corn tortilla', 'Potato Taco (Corn Tortilla)', 'Taco de papa', 'mixed_dishes', 90, '1 taco', 175, 28.0, 2.0, 26.0, 3.5, 6.0, 0.8,
  111, 'high', 28.9, 'high', 'red',
  'published_study', 0.95, 'Noriega et al. 2000',
  ARRAY['potato taco', 'taco de papa', 'papa taco'],
  'Very high glucose impact. Try a bean taco instead — same crunch, half the spike.', 'Impacto glucémico muy alto. Prueba un taco de frijol — mismo sabor, mitad del pico.', true),

('nopales cooked', 'Nopales (Cooked Cactus Paddles)', 'Nopales cocidos', 'vegetables', 149, '1 cup diced', 22, 4.3, 2.9, 1.4, 1.7, 0.1, 1.1,
  15, 'low', 0.2, 'low', 'green',
  'published_study', 0.90, 'Frati et al. 1991 + INSP studies',
  ARRAY['nopales', 'cactus', 'nopal', 'cactus paddles', 'prickly pear cactus'],
  'Superfood! Ultra-low GI. Add to any meal to reduce overall glucose impact.', 'Superalimento. IG ultra bajo. Agrégalo a cualquier comida.', false),

('pozole rojo', 'Pozole Rojo', 'Pozole rojo', 'soups_stews', 350, '1 bowl', 320, 38.0, 5.5, 32.5, 22.0, 9.0, 2.0,
  62, 'medium', 20.2, 'high', 'red',
  'published_study', 0.85, 'Pardo-Buitimea et al. 2012, Int J Food Sci Nutr',
  ARRAY['pozole', 'pozole rojo', 'red pozole', 'posole'],
  'Try a smaller portion or add extra cabbage and radish toppings.', 'Prueba una porción más pequeña o agrega más col y rábano.', true),

('molletes', 'Molletes', 'Molletes', 'mixed_dishes', 180, '2 halves', 350, 42.0, 5.0, 37.0, 14.0, 13.0, 2.5,
  65, 'medium', 24.1, 'high', 'red',
  'published_study', 0.85, 'Pardo-Buitimea et al. 2012',
  ARRAY['molletes', 'bean and cheese bread'],
  'High GL from the bread. Try on a smaller bolillo or use corn tortilla instead.', 'Alta CG por el pan. Prueba con un bolillo más pequeño.', true),

('mole con pollo y arroz', 'Mole with Chicken and Rice', 'Mole con pollo y arroz', 'mixed_dishes', 350, '1 plate', 480, 52.0, 3.5, 48.5, 30.0, 16.0, 8.0,
  60, 'medium', 29.1, 'high', 'red',
  'published_study', 0.85, 'Pardo-Buitimea et al. 2012',
  ARRAY['mole', 'chicken mole', 'mole con pollo', 'mole poblano'],
  'Reduce the rice portion and add a side of nopales to lower GL.', 'Reduce la porción de arroz y agrega nopales para bajar la CG.', true),

('white rice plain', 'White Rice (Plain)', 'Arroz blanco', 'grains_bread', 158, '1 cup cooked', 206, 44.5, 0.6, 43.9, 4.3, 0.4, 0.1,
  75, 'high', 32.9, 'high', 'red',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['white rice', 'arroz blanco', 'plain rice', 'steamed rice', 'rice'],
  'Try cauliflower rice or mix half rice with lentils for lower GL.', 'Prueba arroz de coliflor o mezcla mitad arroz con lentejas.', false),

('rice with quelite', 'Rice with Quelite (Alache)', 'Arroz con quelite', 'grains_bread', 200, '1 cup', 230, 42.0, 4.0, 38.0, 6.0, 3.0, 1.0,
  34, 'low', 12.9, 'medium', 'yellow',
  'published_study', 0.85, 'J Medicinal Food 2023',
  ARRAY['rice with quelite', 'arroz con quelite', 'rice with greens'],
  'Good choice! The quelites dramatically lower the GI of rice.', 'Buena elección. Los quelites bajan dramáticamente el IG del arroz.', true),

('white tamal', 'White Tamal', 'Tamal blanco', 'grains_bread', 120, '1 tamal', 280, 32.0, 2.5, 29.5, 5.0, 14.0, 2.0,
  57, 'medium', 16.8, 'medium', 'yellow',
  'published_study', 0.85, 'J Medicinal Food 2023',
  ARRAY['tamal', 'tamale', 'tamal blanco', 'white tamale'],
  'Try a tamal with chaya filling — it reduces glucose impact by ~20%.', 'Prueba un tamal de chaya — reduce el impacto glucémico ~20%.', false),

('tamal with chaya', 'Tamal with Chaya', 'Tamal de chaya', 'grains_bread', 120, '1 tamal', 260, 30.0, 4.0, 26.0, 6.0, 12.0, 1.5,
  47, 'low', 12.2, 'medium', 'yellow',
  'published_study', 0.85, 'J Medicinal Food 2023',
  ARRAY['chaya tamal', 'tamal de chaya', 'tamale with chaya'],
  'Great swap from regular tamales! Chaya adds fiber and nutrients.', 'Excelente alternativa. La chaya agrega fibra y nutrientes.', false),

-- === EXPERT-ESTIMATED MEXICAN FOODS (34 foods) ===

('chilaquiles verdes', 'Chilaquiles Verdes', 'Chilaquiles verdes', 'mixed_dishes', 250, '1 plate', 370, 35.0, 4.0, 31.0, 14.0, 19.0, 3.0,
  58, 'medium', 18.0, 'medium', 'yellow',
  'expert_estimated', 0.65, NULL,
  ARRAY['chilaquiles', 'chilaquiles verdes', 'green chilaquiles'],
  'Add a fried egg on top for protein to slow glucose absorption.', 'Agrega un huevo encima para que la proteína retrase la absorción.', true),

('chilaquiles rojos', 'Chilaquiles Rojos', 'Chilaquiles rojos', 'mixed_dishes', 250, '1 plate', 380, 36.0, 3.5, 32.5, 14.0, 20.0, 4.0,
  60, 'medium', 19.5, 'medium', 'yellow',
  'expert_estimated', 0.65, NULL,
  ARRAY['chilaquiles rojos', 'red chilaquiles'],
  'Top with beans and avocado to moderate the glucose response.', NULL, true),

('enchiladas verdes', 'Enchiladas Verdes', 'Enchiladas verdes', 'mixed_dishes', 220, '3 enchiladas', 380, 30.0, 4.0, 26.0, 18.0, 20.0, 3.0,
  55, 'low', 14.3, 'medium', 'yellow',
  'expert_estimated', 0.60, NULL,
  ARRAY['enchiladas verdes', 'green enchiladas', 'enchiladas'],
  'The corn tortillas and salsa help. Choose chicken filling over cheese.', NULL, true),

('enchiladas rojas', 'Enchiladas Rojas', 'Enchiladas rojas', 'mixed_dishes', 220, '3 enchiladas', 390, 31.0, 3.5, 27.5, 17.0, 21.0, 4.0,
  57, 'medium', 15.7, 'medium', 'yellow',
  'expert_estimated', 0.60, NULL,
  ARRAY['enchiladas rojas', 'red enchiladas'],
  'Good moderate choice. Add beans on the side to lower overall GL.', NULL, true),

('quesadilla corn', 'Quesadilla (Corn Tortilla)', 'Quesadilla de maíz', 'mixed_dishes', 100, '1 quesadilla', 210, 18.0, 2.0, 16.0, 9.0, 11.0, 1.0,
  60, 'medium', 9.6, 'low', 'green',
  'expert_estimated', 0.60, NULL,
  ARRAY['quesadilla', 'quesadilla de maiz', 'corn quesadilla', 'cheese quesadilla'],
  'Cheese fat slows absorption. A solid moderate choice.', NULL, true),

('quesadilla flour', 'Quesadilla (Flour Tortilla)', 'Quesadilla de harina', 'mixed_dishes', 120, '1 quesadilla', 290, 26.0, 1.5, 24.5, 11.0, 15.0, 1.5,
  55, 'low', 13.5, 'medium', 'yellow',
  'expert_estimated', 0.60, NULL,
  ARRAY['flour quesadilla', 'quesadilla de harina'],
  'Switch to corn tortilla for lower GI and GL.', NULL, true),

('tacos al pastor', 'Tacos al Pastor', 'Tacos al pastor', 'mixed_dishes', 180, '3 tacos', 390, 30.0, 3.5, 26.5, 24.0, 18.0, 5.0,
  62, 'medium', 16.4, 'medium', 'yellow',
  'expert_estimated', 0.65, NULL,
  ARRAY['tacos al pastor', 'pastor tacos', 'al pastor', 'pork tacos with pineapple'],
  'Add lime and pair with a side of beans to reduce glucose impact.', 'Agrega limón y acompaña con frijoles para reducir el impacto.', true),

('tacos de carnitas', 'Tacos de Carnitas', 'Tacos de carnitas', 'mixed_dishes', 180, '3 tacos', 420, 27.0, 3.0, 24.0, 26.0, 22.0, 2.0,
  58, 'medium', 13.9, 'medium', 'yellow',
  'expert_estimated', 0.60, NULL,
  ARRAY['carnitas tacos', 'tacos de carnitas', 'carnitas'],
  'The fat in carnitas slows glucose absorption. Not bad for tacos!', NULL, true),

('tacos de barbacoa', 'Tacos de Barbacoa', 'Tacos de barbacoa', 'mixed_dishes', 180, '3 tacos', 400, 27.0, 3.0, 24.0, 28.0, 19.0, 2.0,
  56, 'medium', 13.4, 'medium', 'yellow',
  'expert_estimated', 0.60, NULL,
  ARRAY['barbacoa tacos', 'tacos de barbacoa', 'barbacoa'],
  'Protein-rich filling helps. Add salsa verde for extra benefit.', NULL, true),

('tacos de birria', 'Tacos de Birria', 'Tacos de birria', 'mixed_dishes', 200, '3 tacos', 450, 28.0, 2.5, 25.5, 28.0, 24.0, 3.0,
  58, 'medium', 14.8, 'medium', 'yellow',
  'expert_estimated', 0.60, NULL,
  ARRAY['birria tacos', 'tacos de birria', 'birria', 'quesabirria'],
  'High fat slows glucose but adds calories. Watch portion size.', NULL, true),

('burrito de frijol', 'Bean Burrito', 'Burrito de frijol', 'mixed_dishes', 200, '1 burrito', 330, 48.0, 8.0, 40.0, 13.0, 9.0, 2.0,
  50, 'low', 20.0, 'high', 'red',
  'expert_estimated', 0.55, NULL,
  ARRAY['bean burrito', 'burrito de frijol', 'burrito'],
  'Beans are great but the large flour tortilla drives GL up. Try a bowl instead.', NULL, true),

('sopes', 'Sopes', 'Sopes', 'mixed_dishes', 150, '2 sopes', 340, 32.0, 4.0, 28.0, 12.0, 18.0, 2.0,
  62, 'medium', 17.4, 'medium', 'yellow',
  'expert_estimated', 0.55, NULL,
  ARRAY['sopes', 'sope'],
  'The thick masa base raises GL. Choose bean topping over potato.', NULL, true),

('gorditas', 'Gorditas', 'Gorditas', 'mixed_dishes', 130, '1 gordita', 310, 30.0, 3.0, 27.0, 10.0, 16.0, 1.5,
  60, 'medium', 16.2, 'medium', 'yellow',
  'expert_estimated', 0.55, NULL,
  ARRAY['gorditas', 'gordita'],
  'Choose bean or cheese filling over chicharron for lower overall impact.', NULL, true),

('tostadas de tinga', 'Tostadas de Tinga', 'Tostadas de tinga', 'mixed_dishes', 140, '2 tostadas', 310, 24.0, 3.0, 21.0, 16.0, 16.0, 3.0,
  58, 'medium', 12.2, 'medium', 'yellow',
  'expert_estimated', 0.55, NULL,
  ARRAY['tostadas', 'tostadas de tinga', 'tinga tostadas', 'chicken tostadas'],
  'The baked/fried tortilla is the main GL driver. Protein topping helps.', NULL, true),

('huevos rancheros', 'Huevos Rancheros', 'Huevos rancheros', 'mixed_dishes', 250, '1 plate', 350, 22.0, 4.0, 18.0, 16.0, 22.0, 4.0,
  52, 'low', 9.4, 'low', 'green',
  'expert_estimated', 0.60, NULL,
  ARRAY['huevos rancheros', 'ranchero eggs', 'ranch eggs'],
  'Great choice! Eggs + salsa + beans = balanced glucose response.', 'Excelente. Huevos + salsa + frijoles = respuesta balanceada.', true),

('huevos con jamon', 'Eggs with Ham', 'Huevos con jamón', 'mixed_dishes', 180, '1 plate', 280, 3.0, 0.2, 2.8, 20.0, 21.0, 1.0,
  40, 'low', 1.1, 'low', 'green',
  'expert_estimated', 0.65, NULL,
  ARRAY['huevos con jamon', 'eggs and ham', 'ham and eggs', 'scrambled eggs with ham'],
  'Very low GL — protein and fat dominant. Excellent breakfast choice.', NULL, true),

('enfrijoladas', 'Enfrijoladas', 'Enfrijoladas', 'mixed_dishes', 220, '3 enfrijoladas', 340, 32.0, 7.0, 25.0, 16.0, 16.0, 2.0,
  48, 'low', 12.0, 'medium', 'yellow',
  'expert_estimated', 0.55, NULL,
  ARRAY['enfrijoladas'],
  'Bean sauce is a great base — lower GI than enchilada sauce.', NULL, true),

('tamales de rajas', 'Tamales de Rajas', 'Tamales de rajas', 'mixed_dishes', 130, '1 tamal', 270, 28.0, 3.0, 25.0, 6.0, 15.0, 1.5,
  55, 'low', 13.8, 'medium', 'yellow',
  'expert_estimated', 0.55, NULL,
  ARRAY['tamales de rajas', 'rajas tamale', 'pepper tamale'],
  'Moderate GL. The peppers and cheese add protein and fiber.', NULL, false),

('arroz rojo', 'Mexican Red Rice', 'Arroz rojo', 'grains_bread', 160, '1 cup', 210, 42.0, 1.5, 40.5, 4.5, 3.0, 2.0,
  72, 'high', 29.2, 'high', 'red',
  'expert_estimated', 0.60, NULL,
  ARRAY['arroz rojo', 'mexican rice', 'red rice', 'spanish rice'],
  'High GL. Try half portion mixed with black beans.', 'Alta CG. Prueba media porción mezclada con frijoles negros.', false),

('frijoles de la olla', 'Pot Beans', 'Frijoles de la olla', 'legumes', 180, '1 cup', 220, 38.0, 14.0, 24.0, 14.0, 1.0, 1.0,
  32, 'low', 7.7, 'low', 'green',
  'expert_estimated', 0.70, NULL,
  ARRAY['frijoles de la olla', 'pot beans', 'whole beans', 'soupy beans'],
  'Excellent! Whole beans in broth — one of the best choices for blood sugar.', NULL, false),

('caldo de pollo', 'Chicken Soup', 'Caldo de pollo', 'soups_stews', 350, '1 bowl', 250, 18.0, 3.0, 15.0, 22.0, 8.0, 3.0,
  45, 'low', 6.8, 'low', 'green',
  'expert_estimated', 0.55, NULL,
  ARRAY['caldo de pollo', 'chicken broth', 'chicken soup', 'mexican chicken soup'],
  'Great low-GL meal. The protein and vegetables keep it balanced.', NULL, true),

('torta de jamon', 'Ham Torta', 'Torta de jamón', 'mixed_dishes', 250, '1 torta', 450, 48.0, 3.0, 45.0, 20.0, 18.0, 4.0,
  68, 'medium', 30.6, 'high', 'red',
  'expert_estimated', 0.55, NULL,
  ARRAY['torta', 'torta de jamon', 'ham sandwich', 'mexican sandwich'],
  'The bolillo bread drives GL high. Try half a torta with a side salad.', NULL, true),

('elote con mayonesa', 'Mexican Street Corn', 'Elote con mayonesa', 'snacks', 160, '1 ear', 210, 30.0, 3.5, 26.5, 5.0, 9.0, 6.0,
  55, 'low', 14.6, 'medium', 'yellow',
  'expert_estimated', 0.55, NULL,
  ARRAY['elote', 'corn on the cob', 'street corn', 'mexican corn', 'elote con mayo'],
  'Moderate GL. The mayo and cheese slow absorption somewhat.', NULL, false),

('esquites', 'Esquites (Corn Cup)', 'Esquites', 'snacks', 180, '1 cup', 220, 32.0, 3.5, 28.5, 5.5, 9.0, 6.0,
  55, 'low', 15.7, 'medium', 'yellow',
  'expert_estimated', 0.55, NULL,
  ARRAY['esquites', 'corn cup', 'corn in a cup', 'elote en vaso'],
  'Similar to elote. Add extra lime juice to help lower glucose response.', NULL, false),

('pan dulce concha', 'Pan Dulce (Concha)', 'Concha', 'desserts_sweets', 70, '1 piece', 260, 40.0, 1.0, 39.0, 4.0, 9.0, 16.0,
  75, 'high', 29.3, 'high', 'red',
  'expert_estimated', 0.65, NULL,
  ARRAY['pan dulce', 'concha', 'sweet bread', 'mexican sweet bread', 'conchas'],
  'Very high GL. Try with a glass of milk (protein) to slow the spike.', 'CG muy alta. Acompáñalo con un vaso de leche para moderar el pico.', false),

('atole', 'Atole', 'Atole', 'beverages', 240, '1 cup', 180, 38.0, 1.0, 37.0, 3.0, 2.0, 18.0,
  70, 'high', 25.9, 'high', 'red',
  'expert_estimated', 0.55, NULL,
  ARRAY['atole', 'atole de vainilla', 'champurrado'],
  'High GL from corn starch and sugar. Try café con leche instead.', NULL, false),

('horchata', 'Horchata', 'Horchata', 'beverages', 240, '1 glass', 150, 34.0, 0.5, 33.5, 1.0, 2.0, 28.0,
  68, 'medium', 22.8, 'high', 'red',
  'expert_estimated', 0.55, NULL,
  ARRAY['horchata', 'agua de horchata', 'rice water'],
  'Very sugary. Try agua de jamaica (hibiscus water) without sugar instead.', NULL, false),

('agua de jamaica', 'Jamaica Water (Hibiscus)', 'Agua de jamaica', 'beverages', 240, '1 glass', 45, 11.0, 0.3, 10.7, 0.2, 0.0, 10.0,
  40, 'low', 4.3, 'low', 'green',
  'expert_estimated', 0.50, NULL,
  ARRAY['agua de jamaica', 'jamaica', 'hibiscus water', 'hibiscus tea'],
  'Great choice if made with little sugar. Ask for it "sin azúcar".', NULL, false),

('guacamole', 'Guacamole', 'Guacamole', 'sauces_condiments', 75, '1/3 cup', 120, 6.0, 4.0, 2.0, 1.5, 11.0, 0.5,
  15, 'low', 0.3, 'low', 'green',
  'expert_estimated', 0.70, NULL,
  ARRAY['guacamole', 'guac', 'avocado dip'],
  'Excellent! Healthy fats and fiber. Add to any meal to lower GL.', 'Excelente. Grasas saludables y fibra. Agrégalo a cualquier comida.', false),

('salsa verde', 'Salsa Verde', 'Salsa verde', 'sauces_condiments', 30, '2 tablespoons', 10, 1.5, 0.5, 1.0, 0.3, 0.2, 0.8,
  15, 'low', 0.2, 'low', 'green',
  'expert_estimated', 0.70, NULL,
  ARRAY['salsa verde', 'green salsa', 'tomatillo salsa'],
  'Negligible glucose impact. Use freely!', NULL, false),

('salsa roja', 'Salsa Roja', 'Salsa roja', 'sauces_condiments', 30, '2 tablespoons', 10, 1.8, 0.5, 1.3, 0.3, 0.1, 1.0,
  15, 'low', 0.2, 'low', 'green',
  'expert_estimated', 0.70, NULL,
  ARRAY['salsa roja', 'red salsa', 'tomato salsa', 'salsa'],
  'Negligible glucose impact. Use freely!', NULL, false),

('jicama con limon', 'Jicama with Lime', 'Jícama con limón', 'snacks', 120, '1 cup sliced', 46, 10.6, 5.9, 4.7, 0.9, 0.1, 2.0,
  38, 'low', 1.8, 'low', 'green',
  'expert_estimated', 0.60, NULL,
  ARRAY['jicama', 'jicama con limon', 'jicama with lime', 'jicama sticks'],
  'Great low-calorie, low-GL snack. The fiber is excellent.', NULL, false),

('papaya', 'Papaya', 'Papaya', 'fruits', 145, '1 cup cubed', 55, 13.7, 2.5, 11.2, 0.9, 0.2, 8.0,
  60, 'medium', 6.7, 'low', 'green',
  'expert_estimated', 0.65, NULL,
  ARRAY['papaya', 'papaya fruit'],
  'Moderate GI but low GL per serving. A good fruit choice.', NULL, false),

('mango', 'Mango', 'Mango', 'fruits', 165, '1 cup sliced', 99, 24.7, 2.6, 22.1, 1.4, 0.6, 22.5,
  56, 'medium', 12.4, 'medium', 'yellow',
  'expert_estimated', 0.65, NULL,
  ARRAY['mango', 'mango fruit', 'mango slices'],
  'Moderate GL. Stick to one cup serving and pair with protein.', NULL, false);

-- ============================================================
-- GLOBAL STAPLE FOODS (~30)
-- ============================================================

INSERT INTO foods (name, name_display, name_es, category, serving_size_g, serving_description, calories_per_serving, carbs_g, fiber_g, available_carbs_g, protein_g, fat_g, sugar_g, glycemic_index, gi_category, glycemic_load, gl_category, traffic_light, data_source, confidence_score, source_citation, photo_recognition_tags, swap_tip, is_mixed_meal) VALUES

('white bread', 'White Bread', 'Pan blanco', 'grains_bread', 30, '1 slice', 79, 14.3, 0.6, 13.7, 2.7, 1.0, 1.4,
  75, 'high', 10.3, 'medium', 'yellow',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['white bread', 'bread', 'toast', 'sliced bread'],
  'Switch to whole grain bread (GI ~50) for a lower glucose impact.', false),

('whole wheat bread', 'Whole Wheat Bread', 'Pan integral', 'grains_bread', 30, '1 slice', 69, 11.6, 1.9, 9.7, 3.6, 1.1, 1.4,
  54, 'low', 5.2, 'low', 'green',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['whole wheat bread', 'wheat bread', 'brown bread', 'whole grain bread'],
  'Good choice! The fiber slows glucose absorption.', false),

('pasta white cooked', 'Pasta (White, Cooked)', 'Pasta cocida', 'grains_bread', 140, '1 cup', 221, 43.2, 2.5, 40.7, 8.1, 1.3, 0.8,
  49, 'low', 20.0, 'high', 'red',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['pasta', 'spaghetti', 'noodles', 'penne', 'fettuccine'],
  'Cook al dente for lower GI. Add olive oil and vegetables.', false),

('oatmeal', 'Oatmeal (Cooked)', 'Avena cocida', 'grains_bread', 234, '1 cup cooked', 154, 27.4, 4.0, 23.4, 5.3, 2.5, 0.6,
  55, 'low', 12.9, 'medium', 'yellow',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['oatmeal', 'oats', 'porridge', 'avena'],
  'Good fiber content. Top with nuts and berries, avoid added sugar.', false),

('banana', 'Banana', 'Plátano', 'fruits', 118, '1 medium', 105, 27.0, 3.1, 23.9, 1.3, 0.4, 14.4,
  51, 'low', 12.2, 'medium', 'yellow',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['banana', 'platano', 'plátano'],
  'Choose slightly green bananas for lower GI. Pair with peanut butter.', false),

('apple', 'Apple', 'Manzana', 'fruits', 182, '1 medium', 95, 25.1, 4.4, 20.7, 0.5, 0.3, 18.9,
  36, 'low', 7.4, 'low', 'green',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['apple', 'manzana', 'green apple', 'red apple'],
  'Great low-GL fruit. Eat with the skin for maximum fiber.', false),

('orange', 'Orange', 'Naranja', 'fruits', 131, '1 medium', 62, 15.4, 3.1, 12.3, 1.2, 0.2, 12.2,
  43, 'low', 5.3, 'low', 'green',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['orange', 'naranja'],
  'Great choice! Much better than orange juice for blood sugar.', false),

('watermelon', 'Watermelon', 'Sandía', 'fruits', 286, '2 cups diced', 86, 21.6, 1.1, 20.5, 1.7, 0.4, 17.7,
  76, 'high', 15.6, 'medium', 'yellow',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['watermelon', 'sandia', 'sandía'],
  'High GI but moderate GL per serving. Enjoy in smaller portions.', false),

('potato boiled', 'Potato (Boiled)', 'Papa cocida', 'vegetables', 150, '1 medium', 134, 31.0, 2.4, 28.6, 2.9, 0.2, 1.3,
  78, 'high', 22.3, 'high', 'red',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['potato', 'boiled potato', 'papa', 'papa cocida'],
  'Cool and reheat potatoes to create resistant starch and lower GI.', false),

('sweet potato', 'Sweet Potato (Boiled)', 'Camote cocido', 'vegetables', 150, '1 medium', 135, 31.6, 4.4, 27.2, 2.5, 0.2, 10.0,
  63, 'medium', 17.1, 'medium', 'yellow',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['sweet potato', 'camote', 'yam', 'boniato'],
  'Better than regular potato for GI. The fiber helps moderate glucose.', false),

('chicken breast grilled', 'Grilled Chicken Breast', 'Pechuga de pollo a la plancha', 'meat_poultry', 120, '1 breast', 187, 0.0, 0.0, 0.0, 35.0, 4.0, 0.0,
  0, 'low', 0.0, 'low', 'green',
  'international_table', 0.95, NULL,
  ARRAY['chicken breast', 'grilled chicken', 'pechuga', 'pollo a la plancha'],
  'Zero carbs, zero glucose impact. Pair with vegetables and whole grains.', false),

('egg whole', 'Egg (Whole, Cooked)', 'Huevo cocido', 'eggs', 50, '1 large egg', 78, 0.6, 0.0, 0.6, 6.3, 5.3, 0.6,
  0, 'low', 0.0, 'low', 'green',
  'international_table', 0.95, NULL,
  ARRAY['egg', 'fried egg', 'boiled egg', 'huevo', 'scrambled egg'],
  'Minimal glucose impact. A great protein source for any meal.', false),

('milk whole', 'Whole Milk', 'Leche entera', 'dairy', 244, '1 cup', 149, 12.0, 0.0, 12.0, 7.7, 7.9, 12.0,
  27, 'low', 3.2, 'low', 'green',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['milk', 'whole milk', 'leche', 'glass of milk'],
  'Low GI. The fat and protein slow glucose absorption.', false),

('yogurt plain', 'Plain Yogurt', 'Yogurt natural', 'dairy', 245, '1 cup', 149, 11.4, 0.0, 11.4, 8.5, 8.0, 11.4,
  36, 'low', 4.1, 'low', 'green',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['yogurt', 'plain yogurt', 'yogurt natural', 'greek yogurt'],
  'Great choice. Avoid flavored/sweetened varieties which spike GL.', false),

('cheese cheddar', 'Cheddar Cheese', 'Queso cheddar', 'dairy', 28, '1 slice', 113, 0.4, 0.0, 0.4, 7.1, 9.3, 0.1,
  0, 'low', 0.0, 'low', 'green',
  'international_table', 0.95, NULL,
  ARRAY['cheese', 'cheddar', 'queso', 'cheddar cheese'],
  'Zero glucose impact. Good for adding to meals to slow carb absorption.', false),

('brown rice cooked', 'Brown Rice (Cooked)', 'Arroz integral cocido', 'grains_bread', 195, '1 cup', 216, 44.8, 3.5, 41.3, 5.0, 1.8, 0.7,
  68, 'medium', 28.1, 'high', 'red',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['brown rice', 'arroz integral', 'whole grain rice'],
  'Better than white rice but still high GL. Try mixing with lentils.', false),

('lentils cooked', 'Lentils (Cooked)', 'Lentejas cocidas', 'legumes', 198, '1 cup', 230, 39.9, 15.6, 24.3, 17.9, 0.8, 3.6,
  32, 'low', 7.8, 'low', 'green',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['lentils', 'lentejas', 'lentil soup'],
  'Excellent! One of the best foods for blood sugar control.', false),

('chickpeas cooked', 'Chickpeas (Cooked)', 'Garbanzos cocidos', 'legumes', 164, '1 cup', 269, 45.0, 12.5, 32.5, 14.5, 4.2, 8.0,
  28, 'low', 9.1, 'low', 'green',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['chickpeas', 'garbanzos', 'garbanzo beans'],
  'Excellent low-GI choice. Great source of protein and fiber.', false),

('peanuts', 'Peanuts', 'Cacahuates', 'nuts_seeds', 28, '1 oz (handful)', 161, 4.6, 2.4, 2.2, 7.3, 14.0, 1.3,
  14, 'low', 0.3, 'low', 'green',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['peanuts', 'cacahuates', 'nuts', 'peanut'],
  'Great snack! Very low GL. Helps slow glucose when eaten with carbs.', false),

('coca cola', 'Coca-Cola', 'Coca-Cola', 'beverages', 355, '1 can (12 oz)', 140, 39.0, 0.0, 39.0, 0.0, 0.0, 39.0,
  63, 'medium', 24.6, 'high', 'red',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['coca cola', 'coke', 'soda', 'cola', 'refresco'],
  'Pure sugar, high GL. Switch to sparkling water with lime.', false),

('orange juice', 'Orange Juice', 'Jugo de naranja', 'beverages', 248, '1 cup', 112, 25.8, 0.5, 25.3, 1.7, 0.5, 20.8,
  50, 'low', 12.7, 'medium', 'yellow',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['orange juice', 'jugo de naranja', 'OJ', 'juice'],
  'Eat a whole orange instead — more fiber, lower GL, more satisfying.', false),

('honey', 'Honey', 'Miel de abeja', 'sauces_condiments', 21, '1 tablespoon', 64, 17.3, 0.0, 17.3, 0.1, 0.0, 17.2,
  61, 'medium', 10.6, 'medium', 'yellow',
  'international_table', 0.90, 'International Tables (Atkinson 2021)',
  ARRAY['honey', 'miel', 'bee honey'],
  'Use sparingly. Better than table sugar but still impacts glucose.', false),

('corn flakes', 'Corn Flakes', 'Hojuelas de maíz', 'grains_bread', 30, '1 cup', 113, 24.2, 0.3, 23.9, 1.9, 0.3, 2.8,
  81, 'high', 19.4, 'medium', 'yellow',
  'international_table', 0.95, 'International Tables (Atkinson 2021)',
  ARRAY['corn flakes', 'cereal', 'breakfast cereal', 'hojuelas'],
  'Very high GI. Switch to oatmeal or bran flakes for much lower impact.', false),

('avocado', 'Avocado', 'Aguacate', 'fruits', 68, '1/2 medium', 114, 6.0, 4.6, 1.4, 1.3, 10.5, 0.2,
  15, 'low', 0.2, 'low', 'green',
  'expert_estimated', 0.80, NULL,
  ARRAY['avocado', 'aguacate'],
  'Superfood! Healthy fats help slow glucose absorption from other foods.', false),

('salmon fillet', 'Salmon Fillet (Baked)', 'Filete de salmón', 'seafood', 125, '1 fillet', 233, 0.0, 0.0, 0.0, 25.0, 14.0, 0.0,
  0, 'low', 0.0, 'low', 'green',
  'international_table', 0.95, NULL,
  ARRAY['salmon', 'baked salmon', 'salmon fillet', 'fish'],
  'Zero carbs, zero glucose impact. Rich in omega-3 fatty acids.', false),

('quinoa cooked', 'Quinoa (Cooked)', 'Quinoa cocida', 'grains_bread', 185, '1 cup', 222, 39.4, 5.2, 34.2, 8.1, 3.6, 1.6,
  53, 'low', 18.1, 'medium', 'yellow',
  'international_table', 0.85, 'International Tables (Atkinson 2021)',
  ARRAY['quinoa', 'quinua'],
  'Better than rice for blood sugar. High in protein and fiber.', false),

('dark chocolate 70', 'Dark Chocolate (70%+)', 'Chocolate oscuro', 'desserts_sweets', 28, '1 oz (2-3 squares)', 170, 13.0, 3.1, 9.9, 2.2, 12.0, 6.8,
  23, 'low', 2.3, 'low', 'green',
  'international_table', 0.85, 'International Tables (Atkinson 2021)',
  ARRAY['dark chocolate', 'chocolate oscuro', 'chocolate'],
  'Surprisingly low GI! A good dessert choice in moderation.', false);

-- ============================================================
-- GI MODIFIERS (7)
-- ============================================================

INSERT INTO gi_modifiers (name, modifier_type, multiplier, mechanism, source_citation) VALUES
('add_beans', 'addition', 0.80, 'Fiber and protein in beans slow gastric emptying and reduce glucose absorption', 'Multiple studies — bean fiber + protein effect'),
('add_fat_avocado', 'addition', 0.85, 'Fat delays gastric emptying, slowing carbohydrate absorption', 'Fat-gastric emptying studies'),
('add_vinegar_lime', 'addition', 0.80, 'Acetic acid inhibits starch digestion enzymes', 'Vinegar-glucose studies (Ostman et al.)'),
('eat_protein_first', 'eating_order', 0.85, 'GLP-1 stimulation from protein delays carbohydrate absorption', 'Meal order studies (Shukla et al. 2015)'),
('reheated_tortilla', 'preparation', 0.85, 'Starch retrogradation creates resistant starch when cooled and reheated', 'Resistant starch studies'),
('add_nopal', 'addition', 0.80, 'Nopal mucilage (soluble fiber) forms a gel that slows glucose absorption', 'Frati et al., INSP nopal studies'),
('add_chaya_quelites', 'addition', 0.75, 'Quelites dramatically reduce GI when added to rice/corn dishes', 'J Medicinal Food 2023');

-- ============================================================
-- FOOD ALIASES (for GPT-4o output matching)
-- ============================================================

INSERT INTO food_aliases (food_id, alias, locale)
SELECT f.id, a.alias, a.locale
FROM foods f
CROSS JOIN LATERAL (VALUES
  -- Mexican foods
  ('black beans cooked', 'frijoles negros', 'es'),
  ('black beans cooked', 'black beans', 'en'),
  ('black beans cooked', 'cooked black beans', 'en'),
  ('pinto beans cooked', 'frijoles pintos', 'es'),
  ('pinto beans cooked', 'pinto beans', 'en'),
  ('refried beans', 'frijoles refritos', 'es'),
  ('refried beans', 'refried pinto beans', 'en'),
  ('flour tortilla', 'tortilla de harina', 'es'),
  ('flour tortilla', 'wheat tortilla', 'en'),
  ('corn tortilla white', 'tortilla de maiz', 'es'),
  ('corn tortilla white', 'corn tortilla', 'en'),
  ('corn tortilla white', 'tortilla', 'en'),
  ('corn tortilla yellow', 'tortilla amarilla', 'es'),
  ('nopales cooked', 'nopales', 'en'),
  ('nopales cooked', 'cactus paddles', 'en'),
  ('nopales cooked', 'nopal', 'es'),
  ('pozole rojo', 'pozole', 'en'),
  ('pozole rojo', 'posole', 'en'),
  ('tacos al pastor', 'al pastor tacos', 'en'),
  ('tacos al pastor', 'pastor', 'en'),
  ('tacos de carnitas', 'carnitas', 'en'),
  ('tacos de barbacoa', 'barbacoa', 'en'),
  ('tacos de birria', 'birria', 'en'),
  ('tacos de birria', 'quesabirria', 'en'),
  ('chilaquiles verdes', 'chilaquiles', 'en'),
  ('huevos rancheros', 'ranch style eggs', 'en'),
  ('arroz rojo', 'mexican rice', 'en'),
  ('arroz rojo', 'spanish rice', 'en'),
  ('arroz rojo', 'red rice', 'en'),
  ('pan dulce concha', 'concha', 'es'),
  ('pan dulce concha', 'pan dulce', 'en'),
  ('pan dulce concha', 'sweet bread', 'en'),
  ('horchata', 'agua de horchata', 'es'),
  ('horchata', 'rice milk drink', 'en'),
  ('guacamole', 'guac', 'en'),
  ('jicama con limon', 'jicama', 'en'),
  ('jicama con limon', 'jicama sticks', 'en'),
  -- Global foods
  ('white bread', 'toast', 'en'),
  ('white bread', 'bread', 'en'),
  ('pasta white cooked', 'spaghetti', 'en'),
  ('pasta white cooked', 'penne', 'en'),
  ('pasta white cooked', 'pasta', 'en'),
  ('oatmeal', 'oats', 'en'),
  ('oatmeal', 'porridge', 'en'),
  ('oatmeal', 'avena', 'es'),
  ('banana', 'platano', 'es'),
  ('apple', 'manzana', 'es'),
  ('orange', 'naranja', 'es'),
  ('potato boiled', 'potato', 'en'),
  ('potato boiled', 'papa', 'es'),
  ('sweet potato', 'camote', 'es'),
  ('chicken breast grilled', 'chicken breast', 'en'),
  ('chicken breast grilled', 'grilled chicken', 'en'),
  ('chicken breast grilled', 'pechuga', 'es'),
  ('egg whole', 'egg', 'en'),
  ('egg whole', 'huevo', 'es'),
  ('egg whole', 'fried egg', 'en'),
  ('milk whole', 'milk', 'en'),
  ('milk whole', 'leche', 'es'),
  ('brown rice cooked', 'brown rice', 'en'),
  ('brown rice cooked', 'arroz integral', 'es'),
  ('lentils cooked', 'lentils', 'en'),
  ('lentils cooked', 'lentejas', 'es'),
  ('coca cola', 'coke', 'en'),
  ('coca cola', 'soda', 'en'),
  ('coca cola', 'refresco', 'es'),
  ('avocado', 'aguacate', 'es'),
  ('salmon fillet', 'salmon', 'en'),
  ('quinoa cooked', 'quinoa', 'en'),
  ('dark chocolate 70', 'dark chocolate', 'en'),
  ('dark chocolate 70', 'chocolate', 'en')
) AS a(food_name, alias, locale)
WHERE f.name = a.food_name;
