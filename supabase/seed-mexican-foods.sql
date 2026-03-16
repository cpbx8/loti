-- seed-mexican-foods.sql
-- 200+ common Mexican foods with nutrition data (per serving)
-- Source: USDA-equivalent values adjusted for Mexican preparation
-- Confidence 1.0 = verified data, 0.75 = realistic estimate

BEGIN;

-- =============================================================================
-- STREET FOOD (~40 items)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
-- Tacos (per taco, with tortilla + filling)
('tacos al pastor', 'al pastor tacos', 210, 12.00, 18.00, 10.50, 1.50, 120, 'g', 'seed', 0.75),
('tacos de suadero', 'suadero tacos', 230, 13.00, 17.00, 12.50, 1.20, 120, 'g', 'seed', 0.75),
('tacos de carnitas', 'carnitas tacos', 240, 14.00, 17.00, 13.00, 1.20, 120, 'g', 'seed', 0.75),
('tacos de barbacoa', 'barbacoa tacos', 220, 15.00, 17.00, 10.00, 1.20, 120, 'g', 'seed', 0.75),
('tacos campechanos', 'campechanos tacos', 250, 13.50, 18.00, 14.00, 1.30, 130, 'g', 'seed', 0.75),
('tacos de canasta', 'basket tacos', 180, 8.00, 20.00, 8.00, 1.50, 100, 'g', 'seed', 0.75),
('tacos de birria', 'birria tacos', 260, 16.00, 18.00, 14.00, 1.20, 130, 'g', 'seed', 0.75),
('tacos dorados', 'crispy tacos', 280, 10.00, 22.00, 16.00, 2.00, 130, 'g', 'seed', 0.75),
('tacos de chicharron', 'chicharron tacos', 235, 11.00, 18.00, 13.00, 1.50, 115, 'g', 'seed', 0.75),
('tacos de guisado', 'stew tacos', 200, 10.00, 19.00, 9.00, 1.80, 120, 'g', 'seed', 0.75),
('tacos de lengua', 'tongue tacos', 225, 14.00, 17.00, 11.50, 1.20, 120, 'g', 'seed', 0.75),
('tacos de cabeza', 'head meat tacos', 215, 13.00, 17.00, 10.50, 1.20, 120, 'g', 'seed', 0.75),
('tacos de tripa', 'tripe tacos', 200, 11.00, 18.00, 9.50, 1.20, 110, 'g', 'seed', 0.75),

-- Quesadillas
('quesadilla de queso', 'cheese quesadilla', 320, 14.00, 28.00, 16.00, 2.00, 150, 'g', 'seed', 0.75),
('quesadilla de huitlacoche', 'corn truffle quesadilla', 290, 11.00, 30.00, 14.00, 3.00, 150, 'g', 'seed', 0.75),
('quesadilla de flor de calabaza', 'squash blossom quesadilla', 280, 10.00, 29.00, 13.50, 2.50, 150, 'g', 'seed', 0.75),
('quesadilla de chicharron prensado', 'pressed chicharron quesadilla', 340, 15.00, 28.00, 18.00, 2.00, 155, 'g', 'seed', 0.75),

-- Tamales (per tamal)
('tamales de mole', 'mole tamales', 310, 12.00, 32.00, 15.00, 3.00, 150, 'g', 'seed', 0.75),
('tamales verdes', 'green salsa tamales', 290, 11.00, 30.00, 14.00, 2.50, 150, 'g', 'seed', 0.75),
('tamales dulces', 'sweet tamales', 320, 6.00, 42.00, 14.00, 2.00, 140, 'g', 'seed', 0.75),
('tamales de rajas', 'rajas tamales', 280, 9.00, 30.00, 14.00, 2.50, 145, 'g', 'seed', 0.75),
('tamales de elote', 'sweet corn tamales', 260, 6.00, 38.00, 10.00, 3.00, 140, 'g', 'seed', 0.75),

-- Other street food
('gorditas', 'gorditas', 340, 12.00, 35.00, 16.00, 4.00, 160, 'g', 'seed', 0.75),
('sopes', 'sopes', 290, 10.00, 30.00, 14.00, 3.50, 140, 'g', 'seed', 0.75),
('tlacoyos', 'tlacoyos', 280, 10.00, 34.00, 12.00, 5.00, 150, 'g', 'seed', 0.75),
('elote asado', 'grilled corn on the cob', 210, 5.00, 32.00, 8.00, 4.00, 180, 'g', 'seed', 0.75),
('esquites', 'corn in a cup', 250, 6.00, 30.00, 12.00, 3.50, 200, 'g', 'seed', 0.75),
('torta de milanesa', 'milanesa sandwich', 580, 28.00, 52.00, 28.00, 3.00, 300, 'g', 'seed', 0.75),
('torta ahogada', 'drowned sandwich', 480, 22.00, 48.00, 22.00, 3.50, 280, 'g', 'seed', 0.75),
('torta cubana', 'cubana sandwich', 650, 32.00, 50.00, 35.00, 3.00, 350, 'g', 'seed', 0.75),
('pambazo', 'pambazo', 420, 18.00, 42.00, 20.00, 3.00, 250, 'g', 'seed', 0.75),
('huaraches', 'huaraches', 380, 15.00, 38.00, 18.00, 5.00, 200, 'g', 'seed', 0.75),
('tostadas de tinga', 'tinga tostadas', 260, 14.00, 22.00, 12.00, 3.00, 130, 'g', 'seed', 0.75),
('tostadas de ceviche', 'ceviche tostadas', 220, 15.00, 20.00, 8.00, 2.50, 130, 'g', 'seed', 0.75),
('flautas', 'flautas', 320, 14.00, 26.00, 18.00, 2.50, 150, 'g', 'seed', 0.75),
('molotes', 'molotes', 300, 8.00, 32.00, 16.00, 3.00, 140, 'g', 'seed', 0.75),
('memelas', 'memelas', 270, 9.00, 30.00, 12.00, 3.50, 140, 'g', 'seed', 0.75),
('garnachas', 'garnachas', 260, 10.00, 28.00, 12.00, 3.00, 130, 'g', 'seed', 0.75),
('chalupas', 'chalupas', 250, 10.00, 26.00, 12.00, 3.00, 120, 'g', 'seed', 0.75),
('empanadas de pollo', 'chicken empanadas', 310, 13.00, 28.00, 16.00, 2.00, 140, 'g', 'seed', 0.75),
('sincronizadas', 'sincronizadas', 380, 18.00, 32.00, 19.00, 2.00, 180, 'g', 'seed', 0.75);

-- =============================================================================
-- HOME COOKING (~50 items)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
-- Rice and beans
('arroz rojo', 'Mexican red rice', 210, 4.00, 38.00, 5.00, 1.50, 175, 'g', 'seed', 1.00),
('arroz blanco', 'white rice', 200, 4.00, 40.00, 3.00, 0.80, 175, 'g', 'seed', 1.00),
('frijoles de olla', 'pot beans', 180, 11.00, 30.00, 1.50, 8.00, 200, 'g', 'seed', 1.00),
('frijoles refritos', 'refried beans', 220, 10.00, 28.00, 8.00, 7.00, 175, 'g', 'seed', 1.00),
('frijoles charros', 'charro beans', 280, 14.00, 32.00, 10.00, 8.00, 250, 'g', 'seed', 0.75),
('frijoles negros', 'black beans', 190, 12.00, 32.00, 1.50, 9.00, 200, 'g', 'seed', 1.00),

-- Chilaquiles and enchiladas
('chilaquiles verdes', 'green chilaquiles', 380, 16.00, 30.00, 22.00, 4.00, 250, 'g', 'seed', 0.75),
('chilaquiles rojos', 'red chilaquiles', 370, 15.00, 30.00, 21.00, 3.50, 250, 'g', 'seed', 0.75),
('enchiladas verdes', 'green enchiladas', 340, 18.00, 26.00, 18.00, 3.00, 220, 'g', 'seed', 0.75),
('enchiladas rojas', 'red enchiladas', 330, 17.00, 26.00, 17.00, 3.00, 220, 'g', 'seed', 0.75),
('enchiladas suizas', 'Swiss-style enchiladas', 380, 20.00, 26.00, 22.00, 2.50, 240, 'g', 'seed', 0.75),
('enchiladas de mole', 'mole enchiladas', 390, 19.00, 30.00, 20.00, 3.50, 240, 'g', 'seed', 0.75),
('enfrijoladas', 'bean-sauced tortillas', 320, 15.00, 28.00, 16.00, 6.00, 220, 'g', 'seed', 0.75),
('entomatadas', 'tomato-sauced tortillas', 300, 14.00, 26.00, 15.00, 3.00, 220, 'g', 'seed', 0.75),

-- Pozole
('pozole rojo', 'red pozole', 350, 22.00, 32.00, 14.00, 5.00, 400, 'ml', 'seed', 0.75),
('pozole verde', 'green pozole', 340, 21.00, 30.00, 14.00, 5.00, 400, 'ml', 'seed', 0.75),
('pozole blanco', 'white pozole', 320, 20.00, 30.00, 12.00, 4.50, 400, 'ml', 'seed', 0.75),

-- Moles
('mole poblano', 'mole poblano', 380, 22.00, 18.00, 24.00, 3.00, 250, 'g', 'seed', 0.75),
('mole verde', 'green mole', 320, 20.00, 14.00, 20.00, 3.00, 250, 'g', 'seed', 0.75),
('mole negro', 'black mole', 390, 22.00, 20.00, 24.00, 3.50, 250, 'g', 'seed', 0.75),
('mole amarillo', 'yellow mole', 300, 18.00, 16.00, 18.00, 2.50, 250, 'g', 'seed', 0.75),
('pipian verde', 'green pipian', 350, 20.00, 12.00, 26.00, 3.00, 250, 'g', 'seed', 0.75),
('pipian rojo', 'red pipian', 360, 20.00, 14.00, 26.00, 3.00, 250, 'g', 'seed', 0.75),

-- Other main dishes
('chiles rellenos de queso', 'cheese-stuffed peppers', 320, 14.00, 18.00, 22.00, 3.00, 200, 'g', 'seed', 0.75),
('chiles rellenos de picadillo', 'picadillo-stuffed peppers', 350, 18.00, 22.00, 20.00, 3.50, 220, 'g', 'seed', 0.75),
('chiles en nogada', 'chiles in walnut sauce', 480, 20.00, 28.00, 32.00, 4.00, 280, 'g', 'seed', 0.75),
('cochinita pibil', 'slow-roasted pork', 320, 28.00, 6.00, 20.00, 1.00, 200, 'g', 'seed', 0.75),
('carnitas', 'braised pork', 340, 26.00, 2.00, 25.00, 0.00, 180, 'g', 'seed', 0.75),
('birria de res', 'beef birria', 350, 30.00, 6.00, 22.00, 1.00, 300, 'ml', 'seed', 0.75),
('barbacoa de res', 'beef barbacoa', 310, 28.00, 4.00, 20.00, 0.50, 200, 'g', 'seed', 0.75),
('tinga de pollo', 'chicken tinga', 240, 22.00, 10.00, 12.00, 2.00, 200, 'g', 'seed', 0.75),
('picadillo', 'ground beef hash', 280, 18.00, 14.00, 18.00, 3.00, 200, 'g', 'seed', 0.75),
('bistec de res', 'beef steak', 260, 28.00, 2.00, 16.00, 0.00, 180, 'g', 'seed', 1.00),
('milanesa de pollo', 'breaded chicken cutlet', 300, 26.00, 14.00, 16.00, 1.00, 180, 'g', 'seed', 0.75),
('milanesa de res', 'breaded beef cutlet', 320, 24.00, 14.00, 18.00, 1.00, 180, 'g', 'seed', 0.75),
('rajas con crema', 'peppers with cream', 220, 6.00, 14.00, 16.00, 2.50, 180, 'g', 'seed', 0.75),
('calabacitas', 'sauteed zucchini', 120, 5.00, 10.00, 7.00, 3.00, 180, 'g', 'seed', 0.75),
('chayotes', 'chayote squash', 80, 2.00, 14.00, 2.00, 4.00, 180, 'g', 'seed', 0.75),
('nopales', 'cactus paddles', 60, 3.00, 8.00, 1.00, 5.00, 150, 'g', 'seed', 1.00),
('nopales con huevo', 'cactus with eggs', 180, 12.00, 10.00, 10.00, 4.00, 200, 'g', 'seed', 0.75),

-- Soups and broths
('caldo de pollo', 'chicken broth/soup', 250, 20.00, 18.00, 10.00, 3.00, 400, 'ml', 'seed', 0.75),
('caldo de res', 'beef broth/soup', 280, 22.00, 20.00, 12.00, 4.00, 400, 'ml', 'seed', 0.75),
('caldo tlalpeno', 'Tlalpeno broth', 260, 22.00, 16.00, 12.00, 4.00, 400, 'ml', 'seed', 0.75),
('sopa de tortilla', 'tortilla soup', 220, 10.00, 22.00, 10.00, 3.00, 350, 'ml', 'seed', 0.75),
('sopa de fideo', 'vermicelli soup', 180, 6.00, 28.00, 5.00, 2.00, 300, 'ml', 'seed', 0.75),
('sopa de lima', 'lime soup', 200, 16.00, 14.00, 8.00, 2.00, 350, 'ml', 'seed', 0.75),
('menudo', 'tripe soup', 280, 20.00, 18.00, 14.00, 3.00, 400, 'ml', 'seed', 0.75),
('consomé de pollo', 'chicken consomme', 120, 10.00, 8.00, 5.00, 1.00, 300, 'ml', 'seed', 0.75);

-- =============================================================================
-- BREAKFAST (~20 items)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
('huevos rancheros', 'ranch-style eggs', 350, 18.00, 24.00, 20.00, 4.00, 250, 'g', 'seed', 0.75),
('huevos a la mexicana', 'Mexican-style eggs', 280, 16.00, 6.00, 22.00, 1.50, 180, 'g', 'seed', 0.75),
('huevos con chorizo', 'eggs with chorizo', 380, 20.00, 4.00, 32.00, 0.50, 200, 'g', 'seed', 0.75),
('huevos revueltos', 'scrambled eggs', 220, 14.00, 2.00, 18.00, 0.00, 150, 'g', 'seed', 1.00),
('huevos estrellados', 'fried eggs', 180, 12.00, 1.00, 14.00, 0.00, 120, 'g', 'seed', 1.00),
('huevos con nopales', 'eggs with cactus', 200, 14.00, 8.00, 13.00, 4.00, 200, 'g', 'seed', 0.75),
('molletes', 'open-faced bean sandwich', 340, 14.00, 36.00, 14.00, 6.00, 200, 'g', 'seed', 0.75),
('hotcakes', 'pancakes', 350, 8.00, 48.00, 14.00, 2.00, 180, 'g', 'seed', 0.75),
('chilaquiles con huevo', 'chilaquiles with egg', 420, 20.00, 32.00, 24.00, 4.00, 300, 'g', 'seed', 0.75),

-- Pan dulce (per piece)
('concha', 'concha sweet bread', 280, 6.00, 42.00, 10.00, 1.50, 90, 'g', 'seed', 0.75),
('cuerno', 'croissant-style sweet bread', 300, 6.00, 36.00, 14.00, 1.00, 80, 'g', 'seed', 0.75),
('polvoron', 'shortbread cookie', 260, 4.00, 32.00, 14.00, 0.50, 60, 'g', 'seed', 0.75),
('oreja', 'ear-shaped pastry', 240, 4.00, 30.00, 12.00, 0.50, 70, 'g', 'seed', 0.75),
('pan de muerto', 'Day of the Dead bread', 320, 7.00, 44.00, 12.00, 1.50, 100, 'g', 'seed', 0.75),
('rosca de reyes', 'Three Kings bread', 300, 6.00, 42.00, 12.00, 1.00, 100, 'g', 'seed', 0.75),

-- Breakfast drinks
('atole de vainilla', 'vanilla atole', 180, 4.00, 34.00, 4.00, 1.00, 300, 'ml', 'seed', 0.75),
('atole de fresa', 'strawberry atole', 190, 4.00, 36.00, 4.00, 1.00, 300, 'ml', 'seed', 0.75),
('champurrado', 'chocolate atole', 220, 5.00, 38.00, 6.00, 2.00, 300, 'ml', 'seed', 0.75),
('licuado de platano', 'banana smoothie', 220, 8.00, 36.00, 5.00, 2.00, 350, 'ml', 'seed', 0.75),
('licuado de mamey', 'mamey smoothie', 240, 6.00, 42.00, 5.00, 4.00, 350, 'ml', 'seed', 0.75),
('jugo verde', 'green juice', 90, 3.00, 18.00, 0.50, 3.00, 350, 'ml', 'seed', 0.75);

-- =============================================================================
-- DRINKS (~15 items)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
('agua de horchata', 'horchata', 160, 2.00, 32.00, 3.00, 0.50, 350, 'ml', 'seed', 0.75),
('agua de jamaica', 'hibiscus water', 100, 0.50, 24.00, 0.00, 0.50, 350, 'ml', 'seed', 0.75),
('agua de tamarindo', 'tamarind water', 130, 0.50, 32.00, 0.00, 1.00, 350, 'ml', 'seed', 0.75),
('agua de limon', 'limeade', 110, 0.20, 28.00, 0.00, 0.20, 350, 'ml', 'seed', 0.75),
('agua de sandia', 'watermelon water', 100, 0.50, 24.00, 0.00, 0.50, 350, 'ml', 'seed', 0.75),
('agua de guayaba', 'guava water', 120, 1.00, 28.00, 0.00, 3.00, 350, 'ml', 'seed', 0.75),
('cafe de olla', 'clay pot coffee', 80, 0.50, 18.00, 0.50, 0.00, 250, 'ml', 'seed', 0.75),
('jugo de naranja', 'orange juice', 112, 1.70, 26.00, 0.50, 0.50, 250, 'ml', 'seed', 1.00),
('tepache', 'fermented pineapple drink', 120, 0.50, 28.00, 0.00, 0.50, 350, 'ml', 'seed', 0.75),
('pulque', 'fermented agave', 150, 2.00, 18.00, 0.00, 0.00, 350, 'ml', 'seed', 0.75),
('michelada', 'beer with lime and spices', 180, 1.50, 14.00, 0.00, 0.50, 350, 'ml', 'seed', 0.75),
('Coca-Cola', 'Coca-Cola', 140, 0.00, 39.00, 0.00, 0.00, 355, 'ml', 'seed', 1.00),
('agua mineral', 'sparkling mineral water', 0, 0.00, 0.00, 0.00, 0.00, 355, 'ml', 'seed', 1.00),
('agua de coco', 'coconut water', 60, 0.50, 14.00, 0.00, 0.00, 350, 'ml', 'seed', 1.00);

-- =============================================================================
-- COMMON STAPLES (~20 items)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
('tortilla de maiz', 'corn tortilla', 52, 1.40, 10.70, 0.70, 1.50, 24, 'g', 'seed', 1.00),
('tortilla de harina', 'flour tortilla', 140, 3.60, 22.00, 4.00, 1.20, 45, 'g', 'seed', 1.00),
('bolillo', 'bolillo bread roll', 180, 6.00, 34.00, 2.00, 1.50, 70, 'g', 'seed', 0.75),
('telera', 'telera bread roll', 200, 6.00, 38.00, 2.50, 1.50, 80, 'g', 'seed', 0.75),
('aguacate', 'avocado', 240, 3.00, 12.00, 22.00, 10.00, 150, 'g', 'seed', 1.00),
('limon', 'Mexican lime', 12, 0.30, 4.00, 0.10, 1.00, 38, 'g', 'seed', 1.00),
('crema mexicana', 'Mexican cream', 60, 0.80, 1.00, 6.00, 0.00, 15, 'g', 'seed', 0.75),
('queso fresco', 'fresh cheese', 80, 5.00, 1.00, 6.00, 0.00, 30, 'g', 'seed', 1.00),
('queso Oaxaca', 'Oaxaca string cheese', 90, 6.00, 1.00, 7.00, 0.00, 30, 'g', 'seed', 0.75),
('queso panela', 'panela cheese', 70, 6.00, 1.00, 5.00, 0.00, 30, 'g', 'seed', 0.75),
('queso cotija', 'cotija cheese', 100, 6.50, 1.50, 8.00, 0.00, 30, 'g', 'seed', 0.75),
('chicharron', 'pork cracklings', 160, 17.00, 0.00, 9.50, 0.00, 30, 'g', 'seed', 1.00),
('chorizo mexicano', 'Mexican chorizo', 240, 12.00, 2.00, 20.00, 0.00, 60, 'g', 'seed', 0.75),
('longaniza', 'longaniza sausage', 250, 13.00, 2.00, 21.00, 0.00, 60, 'g', 'seed', 0.75),
('cecina', 'salted dried beef', 180, 26.00, 0.00, 8.00, 0.00, 100, 'g', 'seed', 0.75),
('tasajo', 'jerky-style beef', 190, 28.00, 0.00, 8.50, 0.00, 100, 'g', 'seed', 0.75),
('salsa verde', 'green salsa', 20, 0.50, 3.00, 0.50, 1.00, 30, 'g', 'seed', 0.75),
('salsa roja', 'red salsa', 18, 0.50, 3.50, 0.30, 0.80, 30, 'g', 'seed', 0.75),
('guacamole', 'guacamole', 110, 1.50, 6.00, 10.00, 4.50, 75, 'g', 'seed', 0.75),
('pico de gallo', 'pico de gallo', 15, 0.50, 3.00, 0.10, 0.80, 40, 'g', 'seed', 0.75);

-- =============================================================================
-- COMMON PACKAGED / BRANDED (~15 items)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
('Bimbo pan blanco', 'Bimbo white bread', 70, 2.00, 13.00, 1.00, 0.50, 26, 'g', 'seed', 1.00),
('Sabritas clasicas', 'Sabritas classic chips', 150, 2.00, 15.00, 9.00, 1.00, 28, 'g', 'seed', 1.00),
('Jumex mango', 'Jumex mango nectar', 110, 0.30, 28.00, 0.00, 0.50, 250, 'ml', 'seed', 1.00),
('Lala leche entera', 'Lala whole milk', 150, 8.00, 12.00, 8.00, 0.00, 250, 'ml', 'seed', 1.00),
('Yakult', 'Yakult', 50, 1.00, 11.00, 0.10, 0.00, 80, 'ml', 'seed', 1.00),
('Maruchan', 'Maruchan instant noodles', 380, 8.00, 50.00, 16.00, 2.00, 85, 'g', 'seed', 1.00),
('Barcel Takis Fuego', 'Takis Fuego', 140, 2.00, 17.00, 7.00, 1.00, 28, 'g', 'seed', 1.00),
('Gansito', 'Gansito snack cake', 170, 2.00, 24.00, 8.00, 0.50, 50, 'g', 'seed', 1.00),
('Zucaritas', 'Zucaritas cereal', 130, 1.50, 31.00, 0.20, 0.50, 35, 'g', 'seed', 1.00),
('Nescafe clasico', 'Nescafe classic instant', 5, 0.30, 0.70, 0.00, 0.00, 2, 'g', 'seed', 1.00),
('Boing mango', 'Boing mango juice', 130, 0.20, 32.00, 0.00, 0.50, 250, 'ml', 'seed', 0.75),
('Gamesa Marias', 'Maria cookies', 130, 2.00, 22.00, 4.00, 0.50, 30, 'g', 'seed', 1.00),
('Chokis', 'Chokis cookies', 160, 2.00, 22.00, 7.00, 1.00, 35, 'g', 'seed', 0.75),
('Carlos V chocolate', 'Carlos V chocolate bar', 230, 3.00, 28.00, 12.00, 1.00, 44, 'g', 'seed', 1.00),
('Mazapan De la Rosa', 'peanut mazapan', 120, 4.00, 10.00, 7.00, 1.00, 25, 'g', 'seed', 1.00);

-- =============================================================================
-- SEAFOOD (~15 items)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
('ceviche de pescado', 'fish ceviche', 180, 20.00, 12.00, 6.00, 2.00, 200, 'g', 'seed', 0.75),
('ceviche de camaron', 'shrimp ceviche', 170, 18.00, 14.00, 4.00, 2.00, 200, 'g', 'seed', 0.75),
('aguachile', 'aguachile', 160, 20.00, 6.00, 6.00, 1.00, 200, 'g', 'seed', 0.75),
('coctel de camaron', 'shrimp cocktail', 200, 18.00, 16.00, 6.00, 3.00, 250, 'g', 'seed', 0.75),
('pescado zarandeado', 'grilled marinated fish', 280, 30.00, 4.00, 16.00, 1.00, 250, 'g', 'seed', 0.75),
('camarones al mojo de ajo', 'garlic butter shrimp', 260, 22.00, 4.00, 18.00, 0.50, 200, 'g', 'seed', 0.75),
('camarones a la diabla', 'devil-style shrimp', 240, 22.00, 6.00, 14.00, 1.00, 200, 'g', 'seed', 0.75),
('huachinango a la veracruzana', 'Veracruz-style snapper', 280, 28.00, 8.00, 14.00, 2.00, 250, 'g', 'seed', 0.75),
('tilapia a la plancha', 'grilled tilapia', 180, 28.00, 2.00, 6.00, 0.00, 180, 'g', 'seed', 1.00),
('tacos de pescado', 'fish tacos', 220, 14.00, 20.00, 10.00, 2.00, 130, 'g', 'seed', 0.75),
('empanadas de camaron', 'shrimp empanadas', 290, 12.00, 26.00, 16.00, 1.50, 140, 'g', 'seed', 0.75),
('caldo de mariscos', 'seafood soup', 280, 24.00, 14.00, 14.00, 2.00, 400, 'ml', 'seed', 0.75),
('caldo de camaron', 'shrimp broth', 260, 22.00, 12.00, 12.00, 2.00, 400, 'ml', 'seed', 0.75),
('mojarra frita', 'fried whole tilapia', 320, 32.00, 8.00, 18.00, 0.50, 250, 'g', 'seed', 0.75),
('pulpo a la gallega', 'Galician-style octopus', 200, 22.00, 6.00, 10.00, 0.50, 180, 'g', 'seed', 0.75);

-- =============================================================================
-- DESSERTS (~15 items)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
('flan napolitano', 'flan', 260, 6.00, 36.00, 10.00, 0.00, 150, 'g', 'seed', 0.75),
('arroz con leche', 'rice pudding', 240, 6.00, 40.00, 6.00, 0.50, 200, 'g', 'seed', 0.75),
('pastel tres leches', 'three milks cake', 350, 8.00, 44.00, 16.00, 0.00, 150, 'g', 'seed', 0.75),
('churros', 'churros', 240, 4.00, 30.00, 12.00, 1.00, 80, 'g', 'seed', 0.75),
('churros rellenos', 'filled churros', 300, 5.00, 36.00, 16.00, 1.00, 100, 'g', 'seed', 0.75),
('pay de limon', 'lime pie', 320, 5.00, 38.00, 16.00, 0.50, 120, 'g', 'seed', 0.75),
('gelatina de leche', 'milk gelatin', 140, 4.00, 24.00, 3.00, 0.00, 150, 'g', 'seed', 0.75),
('gelatina de agua', 'water gelatin', 80, 2.00, 18.00, 0.00, 0.00, 150, 'g', 'seed', 0.75),
('paleta de mango', 'mango popsicle', 90, 0.50, 22.00, 0.00, 1.00, 80, 'g', 'seed', 0.75),
('paleta de limon', 'lime popsicle', 70, 0.10, 18.00, 0.00, 0.10, 80, 'g', 'seed', 0.75),
('marquesita', 'marquesita crepe', 280, 6.00, 32.00, 14.00, 1.00, 100, 'g', 'seed', 0.75),
('bunuelos', 'bunuelos', 280, 4.00, 36.00, 14.00, 1.00, 80, 'g', 'seed', 0.75),
('capirotada', 'bread pudding', 340, 8.00, 48.00, 14.00, 2.00, 180, 'g', 'seed', 0.75),
('ate con queso', 'fruit paste with cheese', 200, 4.00, 34.00, 6.00, 1.00, 80, 'g', 'seed', 0.75),
('mazapan', 'peanut mazapan candy', 120, 4.00, 10.00, 7.00, 1.00, 25, 'g', 'seed', 0.75),
('alegria', 'amaranth candy bar', 130, 3.00, 18.00, 5.00, 2.00, 30, 'g', 'seed', 0.75),
('dulce de leche', 'caramelized milk', 80, 2.00, 14.00, 2.00, 0.00, 25, 'g', 'seed', 0.75),
('cajeta', 'goat milk caramel', 80, 1.50, 14.00, 2.50, 0.00, 25, 'g', 'seed', 0.75),
('cocada', 'coconut candy', 140, 2.00, 18.00, 7.00, 2.00, 35, 'g', 'seed', 0.75),
('camote', 'sweet potato candy', 100, 0.50, 24.00, 0.00, 1.50, 40, 'g', 'seed', 0.75);

-- =============================================================================
-- ADDITIONAL REGIONAL / POPULAR ITEMS (to reach 200+)
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
('tamal oaxaqueno', 'Oaxacan tamale', 350, 14.00, 34.00, 18.00, 3.00, 180, 'g', 'seed', 0.75),
('tlayuda', 'Oaxacan pizza', 480, 20.00, 42.00, 26.00, 6.00, 280, 'g', 'seed', 0.75),
('papadzules', 'egg-filled tortillas in pumpkin seed sauce', 360, 16.00, 24.00, 22.00, 3.00, 240, 'g', 'seed', 0.75),
('salbutes', 'Yucatecan puffed tortillas', 260, 10.00, 24.00, 14.00, 2.00, 130, 'g', 'seed', 0.75),
('panuchos', 'Yucatecan stuffed tortillas', 280, 12.00, 26.00, 14.00, 3.00, 140, 'g', 'seed', 0.75),
('poc chuc', 'grilled marinated pork', 290, 26.00, 6.00, 18.00, 1.00, 200, 'g', 'seed', 0.75),
('carne asada', 'grilled beef', 280, 30.00, 0.00, 17.00, 0.00, 180, 'g', 'seed', 1.00),
('pollo asado', 'grilled chicken', 220, 28.00, 0.00, 12.00, 0.00, 180, 'g', 'seed', 1.00),
('chicharron en salsa', 'pork cracklings in salsa', 280, 16.00, 12.00, 18.00, 2.00, 200, 'g', 'seed', 0.75),
('manitas de cerdo', 'pig feet', 300, 22.00, 2.00, 22.00, 0.00, 200, 'g', 'seed', 0.75),
('choriqueso', 'chorizo and cheese dip', 320, 16.00, 4.00, 26.00, 0.50, 120, 'g', 'seed', 0.75),
('queso fundido', 'melted cheese', 280, 16.00, 2.00, 22.00, 0.00, 100, 'g', 'seed', 0.75),
('tostada de pata', 'pig feet tostada', 240, 12.00, 22.00, 12.00, 2.00, 130, 'g', 'seed', 0.75),
('carne en su jugo', 'meat in its juice', 320, 28.00, 12.00, 16.00, 4.00, 350, 'ml', 'seed', 0.75),
('tortas ahogadas', 'drowned pork sandwiches', 480, 22.00, 48.00, 22.00, 3.50, 280, 'g', 'seed', 0.75),
('tacos de asada', 'grilled beef tacos', 230, 15.00, 17.00, 11.00, 1.20, 120, 'g', 'seed', 0.75),
('burrito de frijol', 'bean burrito', 340, 12.00, 46.00, 12.00, 8.00, 220, 'g', 'seed', 0.75),
('burrito de carne asada', 'grilled beef burrito', 450, 24.00, 42.00, 20.00, 4.00, 280, 'g', 'seed', 0.75),
('chimichangas', 'chimichangas', 480, 20.00, 38.00, 28.00, 3.00, 250, 'g', 'seed', 0.75);

-- =============================================================================
-- FRUITS AND SNACKS
-- =============================================================================

INSERT INTO foods_cache (name_es, name_en, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, source, confidence) VALUES
('mango con chile', 'mango with chili', 130, 1.50, 30.00, 1.00, 3.00, 200, 'g', 'seed', 0.75),
('jicama con chile', 'jicama with chili', 70, 1.50, 16.00, 0.20, 6.00, 150, 'g', 'seed', 0.75),
('pepino con chile', 'cucumber with chili', 30, 1.00, 6.00, 0.20, 1.00, 150, 'g', 'seed', 0.75),
('sandia con chile', 'watermelon with chili', 60, 1.00, 14.00, 0.20, 1.00, 200, 'g', 'seed', 0.75),
('papaya', 'papaya', 62, 0.70, 16.00, 0.20, 2.50, 150, 'g', 'seed', 1.00),
('tuna (fruta)', 'prickly pear fruit', 60, 1.00, 14.00, 0.50, 5.00, 150, 'g', 'seed', 0.75),
('guayaba', 'guava', 68, 2.50, 14.00, 1.00, 5.00, 100, 'g', 'seed', 1.00),
('cacahuates japoneses', 'Japanese-style peanuts', 160, 5.00, 16.00, 8.00, 2.00, 30, 'g', 'seed', 0.75),
('chicharrones de harina', 'wheat chicharrones', 140, 2.00, 18.00, 7.00, 1.00, 30, 'g', 'seed', 0.75),
('duros de harina', 'wheat snack wheels', 130, 2.00, 18.00, 6.00, 1.00, 30, 'g', 'seed', 0.75),
('tostilocos', 'tostitos with toppings', 280, 6.00, 34.00, 14.00, 4.00, 200, 'g', 'seed', 0.75),
('dorilocos', 'Doritos with toppings', 300, 6.00, 36.00, 14.00, 3.50, 200, 'g', 'seed', 0.75),
('fruta con crema', 'fruit with cream', 220, 4.00, 32.00, 8.00, 3.00, 250, 'g', 'seed', 0.75);


-- =============================================================================
-- ALIASES (using CTE to look up canonical food IDs by name_es)
-- =============================================================================

WITH food_lookup AS (
  SELECT id, name_es FROM foods_cache WHERE source = 'seed'
)
INSERT INTO foods_cache_aliases (alias, canonical_food_id)
SELECT alias, fl.id
FROM (VALUES
  -- Street food aliases
  ('taco al pastor',         'tacos al pastor'),
  ('taco de pastor',         'tacos al pastor'),
  ('pastor',                 'tacos al pastor'),
  ('taco',                   'tacos al pastor'),
  ('taco de suadero',        'tacos de suadero'),
  ('suadero',                'tacos de suadero'),
  ('taco de carnitas',       'tacos de carnitas'),
  ('taco de barbacoa',       'tacos de barbacoa'),
  ('taco campechano',        'tacos campechanos'),
  ('taco de canasta',        'tacos de canasta'),
  ('taco sudado',            'tacos de canasta'),
  ('taco de birria',         'tacos de birria'),
  ('birria taco',            'tacos de birria'),
  ('taco dorado',            'tacos dorados'),
  ('taco de lengua',         'tacos de lengua'),
  ('lengua',                 'tacos de lengua'),
  ('taco de tripa',          'tacos de tripa'),
  ('quesadilla',             'quesadilla de queso'),
  ('quesa',                  'quesadilla de queso'),
  ('huitlacoche',            'quesadilla de huitlacoche'),
  ('cuitlacoche',            'quesadilla de huitlacoche'),
  ('flor de calabaza',       'quesadilla de flor de calabaza'),
  ('tamal',                  'tamales verdes'),
  ('tamal de mole',          'tamales de mole'),
  ('tamal verde',            'tamales verdes'),
  ('tamal dulce',            'tamales dulces'),
  ('tamal de rajas',         'tamales de rajas'),
  ('tamal de elote',         'tamales de elote'),
  ('gordita',                'gorditas'),
  ('sope',                   'sopes'),
  ('tlacoyo',                'tlacoyos'),
  ('elote',                  'elote asado'),
  ('elote en vaso',          'esquites'),
  ('torta',                  'torta de milanesa'),
  ('huarache',               'huaraches'),
  ('tostada',                'tostadas de tinga'),
  ('flauta',                 'flautas'),
  ('molote',                 'molotes'),
  ('memela',                 'memelas'),
  ('garnacha',               'garnachas'),
  ('chalupa',                'chalupas'),
  ('sincrón',                'sincronizadas'),
  ('sincronizada',           'sincronizadas'),

  -- Home cooking aliases
  ('arroz mexicano',         'arroz rojo'),
  ('arroz a la mexicana',    'arroz rojo'),
  ('frijoles',               'frijoles de olla'),
  ('frijol',                 'frijoles de olla'),
  ('refritos',               'frijoles refritos'),
  ('chilaquiles',            'chilaquiles verdes'),
  ('enchiladas',             'enchiladas verdes'),
  ('enchiladas suisas',      'enchiladas suizas'),
  ('pozole',                 'pozole rojo'),
  ('mole',                   'mole poblano'),
  ('chile relleno',          'chiles rellenos de queso'),
  ('chiles rellenos',        'chiles rellenos de queso'),
  ('nogada',                 'chiles en nogada'),
  ('cochinita',              'cochinita pibil'),
  ('birria',                 'birria de res'),
  ('barbacoa',               'barbacoa de res'),
  ('tinga',                  'tinga de pollo'),
  ('milanesa',               'milanesa de pollo'),
  ('bistec',                 'bistec de res'),
  ('rajas',                  'rajas con crema'),
  ('nopal',                  'nopales'),
  ('nopalitos',              'nopales'),
  ('caldo',                  'caldo de pollo'),
  ('sopa azteca',            'sopa de tortilla'),
  ('fideo',                  'sopa de fideo'),
  ('sopa de fideos',         'sopa de fideo'),
  ('pancita',                'menudo'),
  ('mondongo',               'menudo'),

  -- Breakfast aliases
  ('hot cake',               'hotcakes'),
  ('hot cakes',              'hotcakes'),
  ('pan cake',               'hotcakes'),
  ('pancakes',               'hotcakes'),
  ('huevos',                 'huevos revueltos'),
  ('mollete',                'molletes'),
  ('pan dulce',              'concha'),

  -- Drink aliases
  ('horchata',               'agua de horchata'),
  ('jamaica',                'agua de jamaica'),
  ('agua de flor de jamaica', 'agua de jamaica'),
  ('tamarindo',              'agua de tamarindo'),
  ('limonada',               'agua de limon'),
  ('atole',                  'atole de vainilla'),
  ('cafe olla',              'cafe de olla'),
  ('jugo naranja',           'jugo de naranja'),
  ('coca',                   'Coca-Cola'),
  ('coca cola',              'Coca-Cola'),
  ('refresco',               'Coca-Cola'),

  -- Staple aliases
  ('tortilla',               'tortilla de maiz'),
  ('tortillas',              'tortilla de maiz'),
  ('tortilla de corn',       'tortilla de maiz'),
  ('pan',                    'bolillo'),
  ('pan blanco',             'bolillo'),
  ('avocado',                'aguacate'),
  ('lima',                   'limon'),
  ('crema',                  'crema mexicana'),
  ('queso',                  'queso fresco'),
  ('chicharrón',             'chicharron'),
  ('chorizo',                'chorizo mexicano'),
  ('guacamole',              'guacamole'),
  ('guac',                   'guacamole'),

  -- Branded aliases
  ('takis',                  'Barcel Takis Fuego'),
  ('takis fuego',            'Barcel Takis Fuego'),
  ('sabritas',               'Sabritas clasicas'),
  ('papas sabritas',         'Sabritas clasicas'),
  ('maruchan',               'Maruchan'),
  ('sopa instantanea',       'Maruchan'),
  ('sopa maruchan',          'Maruchan'),
  ('galletas marias',        'Gamesa Marias'),
  ('marias',                 'Gamesa Marias'),
  ('nescafe',                'Nescafe clasico'),
  ('mazapán',                'mazapan'),

  -- Seafood aliases
  ('ceviche',                'ceviche de pescado'),
  ('coctel',                 'coctel de camaron'),
  ('coctel de camarones',    'coctel de camaron'),
  ('zarandeado',             'pescado zarandeado'),
  ('camarones al ajillo',    'camarones al mojo de ajo'),
  ('mojarra',                'mojarra frita'),

  -- Dessert aliases
  ('flan',                   'flan napolitano'),
  ('tres leches',            'pastel tres leches'),
  ('churro',                 'churros'),
  ('pay de limón',           'pay de limon'),
  ('gelatina',               'gelatina de leche'),
  ('paleta',                 'paleta de mango'),
  ('buñuelo',                'bunuelos'),

  -- Regional aliases
  ('asada',                  'carne asada'),
  ('pollo',                  'pollo asado'),
  ('burrito',                'burrito de frijol'),
  ('chimichanga',            'chimichangas'),
  ('tlayudas',               'tlayuda')
) AS aliases(alias, food_name)
JOIN food_lookup fl ON fl.name_es = aliases.food_name;

COMMIT;
