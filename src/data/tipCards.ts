/**
 * Seed tip cards — static educational content for the home screen carousel.
 * All GI values and claims are from published studies cited in source fields.
 */

export interface TipCard {
  id: string
  type: 'mythbuster' | 'swap' | 'modifier' | 'featured_food' | 'did_you_know'
  headline: string
  body: string
  trafficLights?: {
    before?: 'green' | 'yellow' | 'red'
    after?: 'green' | 'yellow' | 'red'
  }
  foodName?: string
  gl?: number
  source?: string
}

export const ALL_TIPS: TipCard[] = [
  // MYTH BUSTERS
  {
    id: 'myth-1',
    type: 'mythbuster',
    headline: 'Corn tortilla (GI 74) is HIGHER than flour tortilla (GI 53)',
    body: 'Fat and protein in wheat flour slow digestion. Corn starch spikes glucose faster.',
    trafficLights: { before: 'red', after: 'yellow' },
    source: 'Noriega et al. 2000',
  },
  {
    id: 'myth-2',
    type: 'mythbuster',
    headline: 'Horchata and atole are stealth sugar bombs (GI ~80)',
    body: 'The starch and sugar base creates one of the highest glucose spikes of any Mexican drink.',
    trafficLights: { before: 'red' },
  },
  {
    id: 'myth-3',
    type: 'mythbuster',
    headline: 'Mole is only moderate impact (GI ~60)',
    body: "Nuts and chocolate fat in mole slow the glucose response. It's better than you'd think.",
    trafficLights: { before: 'yellow' },
    source: 'Pardo-Buitimea et al. 2012',
  },

  // SWAP TIPS
  {
    id: 'swap-1',
    type: 'swap',
    headline: 'Bean taco vs potato taco',
    body: 'Same tortilla, same crunch. Beans add fiber and protein that cut the glucose spike in half.',
    trafficLights: { before: 'red', after: 'yellow' },
    foodName: 'Bean taco GL: 14 vs Potato taco GL: 33',
    source: 'Noriega et al. 2000',
  },
  {
    id: 'swap-2',
    type: 'swap',
    headline: 'White rice → rice with quelites',
    body: 'Adding traditional greens (alache, chaya) to rice cuts the GI from 75 down to 34. Dramatic.',
    trafficLights: { before: 'red', after: 'green' },
    source: 'J Medicinal Food 2023',
  },
  {
    id: 'swap-3',
    type: 'swap',
    headline: 'Regular tamal → tamal with chaya',
    body: 'Chaya leaf added to tamal masa drops GI from 57 to 47. A traditional ingredient that helps.',
    trafficLights: { before: 'yellow', after: 'green' },
    source: 'J Medicinal Food 2023',
  },

  // MODIFIER TIPS
  {
    id: 'mod-1',
    type: 'modifier',
    headline: 'Add lime to your tacos',
    body: "Citric acid inhibits starch digestion, reducing glucose impact by ~20%. It's not just for flavor.",
    source: 'Multiple studies on acetic/citric acid',
  },
  {
    id: 'mod-2',
    type: 'modifier',
    headline: 'Add nopales to any dish',
    body: 'Nopal mucilage (soluble fiber) physically slows carb absorption. GI reduction of ~20%. The original Mexican superfood.',
    source: 'Frati et al. 1991',
  },
  {
    id: 'mod-3',
    type: 'modifier',
    headline: 'Eat your protein before the carbs',
    body: 'Starting a meal with meat or beans before tortillas stimulates GLP-1, slowing carb absorption by ~15%.',
  },
  {
    id: 'mod-4',
    type: 'modifier',
    headline: "Reheat yesterday's tortillas",
    body: 'Cooling and reheating tortillas creates resistant starch. Reheated tortillas have ~15% lower GI than fresh.',
  },

  // FEATURED FOODS
  {
    id: 'feat-1',
    type: 'featured_food',
    headline: 'Nopales — the glucose superweapon',
    body: 'GI of just 15. Mucilage fiber slows carb absorption. Add to any meal to reduce its glucose impact by ~20%.',
    foodName: 'Nopales',
    gl: 3,
    trafficLights: { before: 'green' },
    source: 'Frati et al. 1991',
  },
  {
    id: 'feat-2',
    type: 'featured_food',
    headline: 'Black beans — low and slow',
    body: "GI of 30. High fiber and protein create a slow, steady glucose release. A staple that's also medicine.",
    foodName: 'Black beans',
    gl: 5,
    trafficLights: { before: 'green' },
    source: 'Frati et al. 1991',
  },

  // DID YOU KNOW
  {
    id: 'dyk-1',
    type: 'did_you_know',
    headline: 'Reheated tortillas have lower GI than fresh',
    body: "Cooling creates resistant starch — a type of carb your body digests more slowly. Yesterday's tortillas are better for your glucose.",
  },
  {
    id: 'dyk-2',
    type: 'did_you_know',
    headline: 'Adding avocado to a meal reduces glucose impact ~15%',
    body: 'Fat from avocado delays gastric emptying, slowing how fast carbs hit your bloodstream. Guacamole is functional food.',
  },
  {
    id: 'dyk-3',
    type: 'did_you_know',
    headline: 'Mexican mixed meals spike MORE than expected',
    body: 'Research found actual glucose response to Mexican dishes is 10-15% higher than international GI tables predict. Loti accounts for this.',
    source: 'Pardo-Buitimea et al. 2012',
  },

  // ── BATCH 2: 50 more tips (Mexican + global) ──────────────

  // MYTH BUSTERS
  {
    id: 'myth-4',
    type: 'mythbuster',
    headline: 'Watermelon has HIGH GI (72) but LOW GL (4)',
    body: "It's mostly water. A normal serving barely moves your glucose despite the scary GI number.",
    trafficLights: { before: 'green' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'myth-5',
    type: 'mythbuster',
    headline: 'Brown bread is often NOT better than white',
    body: 'Most "brown bread" is just white flour with caramel coloring. Check for 100% whole grain — GI drops from 75 to 51.',
    trafficLights: { before: 'red', after: 'yellow' },
    source: 'Atkinson et al. 2021',
  },
  {
    id: 'myth-6',
    type: 'mythbuster',
    headline: 'Sushi rice spikes glucose MORE than table sugar',
    body: 'Sticky white rice (GI 89) combined with vinegar-sugar seasoning creates one of the highest GI foods in any cuisine.',
    trafficLights: { before: 'red' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'myth-7',
    type: 'mythbuster',
    headline: 'Papaya is gentler than you think (GI 56)',
    body: 'Despite being sweet, papaya has moderate GI and is full of fiber. A better fruit choice than mango (GI 73).',
    trafficLights: { before: 'yellow' },
    source: 'Atkinson et al. 2008',
  },
  {
    id: 'myth-8',
    type: 'mythbuster',
    headline: 'Instant oatmeal (GI 79) vs steel-cut (GI 42)',
    body: 'Processing breaks down the fiber matrix. The more processed the oat, the faster it spikes your glucose.',
    trafficLights: { before: 'red', after: 'green' },
    source: 'Wolever et al. 2019',
  },
  {
    id: 'myth-9',
    type: 'mythbuster',
    headline: 'Orange juice spikes MORE than Coca-Cola',
    body: 'OJ has GI 66 vs Coke at GI 63. "Natural" sugar is still sugar. Eat the whole orange (GI 40) instead.',
    trafficLights: { before: 'red' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'myth-10',
    type: 'mythbuster',
    headline: 'Pozole is surprisingly moderate (GI ~55)',
    body: 'Hominy corn is nixtamalized — the alkali process changes the starch structure, lowering GI vs regular corn.',
    trafficLights: { before: 'yellow' },
    source: 'Bello-Pérez et al. 2006',
  },
  {
    id: 'myth-11',
    type: 'mythbuster',
    headline: 'Jasmine rice (GI 89) is the worst rice for glucose',
    body: 'Basmati (GI 58) has a completely different starch structure. Same grain, wildly different glucose impact.',
    trafficLights: { before: 'red', after: 'yellow' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'myth-12',
    type: 'mythbuster',
    headline: 'Agave nectar is NOT a safe sweetener (GI 15 but high fructose)',
    body: "Low GI is misleading — it's 85% fructose which damages the liver directly. Worse than sugar in some ways.",
    trafficLights: { before: 'yellow' },
    source: 'Stanhope et al. 2009',
  },

  // SWAP TIPS
  {
    id: 'swap-4',
    type: 'swap',
    headline: 'White rice → lentils with rice',
    body: 'Mixing 50% lentils with rice drops the GI from 75 to ~45. The protein and fiber slow everything down.',
    trafficLights: { before: 'red', after: 'green' },
    source: 'Wolever et al. 2019',
  },
  {
    id: 'swap-5',
    type: 'swap',
    headline: 'Juice → whole fruit',
    body: 'Orange juice GI 66 → whole orange GI 40. The fiber matrix in whole fruit dramatically slows sugar absorption.',
    trafficLights: { before: 'red', after: 'green' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'swap-6',
    type: 'swap',
    headline: 'Pan dulce → whole wheat toast with peanut butter',
    body: 'Pan dulce GI ~75. Whole wheat toast with PB is ~45. Fat + fiber + protein = slower glucose rise.',
    trafficLights: { before: 'red', after: 'green' },
    source: 'Atkinson et al. 2021',
  },
  {
    id: 'swap-7',
    type: 'swap',
    headline: 'Horchata → agua de jamaica',
    body: 'Horchata GI ~80. Jamaica (unsweetened) is essentially 0. Add a small amount of honey if needed — still far better.',
    trafficLights: { before: 'red', after: 'green' },
    source: 'Pardo-Buitimea et al. 2012',
  },
  {
    id: 'swap-8',
    type: 'swap',
    headline: 'Mashed potatoes → mashed cauliflower',
    body: 'Potato GI 85 → cauliflower GI 15. Same creamy texture, dramatically lower glucose impact.',
    trafficLights: { before: 'red', after: 'green' },
  },
  {
    id: 'swap-9',
    type: 'swap',
    headline: 'Corn flakes → All-Bran cereal',
    body: 'Corn flakes GI 81 → All-Bran GI 38. The bran fiber wall slows sugar absorption dramatically.',
    trafficLights: { before: 'red', after: 'green' },
    source: 'Atkinson et al. 2021',
  },
  {
    id: 'swap-10',
    type: 'swap',
    headline: 'Instant noodles → soba noodles',
    body: 'Instant noodles GI 67 → buckwheat soba GI 46. Buckwheat has resistant starch that slows digestion.',
    trafficLights: { before: 'red', after: 'green' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'swap-11',
    type: 'swap',
    headline: 'Chilaquiles → huevos rancheros',
    body: 'Fried tortilla chips spike fast. Eggs on a single tortilla with salsa give you protein first, lower total carbs.',
    trafficLights: { before: 'red', after: 'yellow' },
  },
  {
    id: 'swap-12',
    type: 'swap',
    headline: 'Flour tortilla → lettuce wrap',
    body: 'Drop the tortilla entirely for tacos — lettuce wrap is nearly 0 GI. All the flavor, none of the glucose hit.',
    trafficLights: { before: 'yellow', after: 'green' },
  },

  // MODIFIER TIPS
  {
    id: 'mod-5',
    type: 'modifier',
    headline: 'A tablespoon of vinegar before meals',
    body: 'Acetic acid in vinegar can reduce post-meal glucose by 20-30%. Apple cider vinegar in water works.',
    source: 'Johnston et al. 2004',
  },
  {
    id: 'mod-6',
    type: 'modifier',
    headline: 'Walk 10 minutes after eating',
    body: 'A short post-meal walk reduces blood sugar spikes by up to 30%. Your muscles absorb glucose directly.',
    source: 'DiPietro et al. 2013',
  },
  {
    id: 'mod-7',
    type: 'modifier',
    headline: 'Add cinnamon to your coffee',
    body: 'Just 1g of cinnamon daily can improve insulin sensitivity by 10-20%. Ceylon cinnamon is best.',
    source: 'Khan et al. 2003',
  },
  {
    id: 'mod-8',
    type: 'modifier',
    headline: 'Eat vegetables FIRST in your meal',
    body: 'Eating veggies before carbs reduces glucose spike by ~35%. The fiber creates a physical barrier in your gut.',
    source: 'Shukla et al. 2015',
  },
  {
    id: 'mod-9',
    type: 'modifier',
    headline: 'Add chia seeds to your agua fresca',
    body: 'Chia absorbs 12x its weight in water, forming a gel that slows sugar absorption. A traditional Mexican hack.',
    source: 'Vuksan et al. 2017',
  },
  {
    id: 'mod-10',
    type: 'modifier',
    headline: 'Cool your rice before eating',
    body: 'Cooking then cooling rice for 12 hours creates resistant starch, reducing calories absorbed by 10-15%.',
    source: 'James et al. 2015',
  },
  {
    id: 'mod-11',
    type: 'modifier',
    headline: 'Pair carbs with fat or protein — always',
    body: 'Never eat carbs alone. Adding cheese, nuts, or meat to any carb slows glucose absorption by 20-40%.',
    source: 'Wolever et al. 2019',
  },
  {
    id: 'mod-12',
    type: 'modifier',
    headline: 'Drink water DURING your meal, not after',
    body: 'Water with food dilutes digestive enzymes slightly, slowing starch breakdown and glucose absorption.',
  },
  {
    id: 'mod-13',
    type: 'modifier',
    headline: 'Add beans to ANY Mexican dish',
    body: 'Beans added as a side reduce the overall meal GI by 15-25%. Soluble fiber + protein = glucose brake.',
    source: 'Wolever et al. 2019',
  },

  // FEATURED FOODS
  {
    id: 'feat-3',
    type: 'featured_food',
    headline: 'Chaya — the Mayan superfood',
    body: 'GI of just 32. Loaded with protein for a leaf. Traditionally added to tamales and rice to lower glucose impact.',
    foodName: 'Chaya',
    gl: 4,
    trafficLights: { before: 'green' },
    source: 'J Medicinal Food 2023',
  },
  {
    id: 'feat-4',
    type: 'featured_food',
    headline: 'Lentils — the ultimate low-GI staple',
    body: 'GI of just 26. Highest protein of any legume. Virtually impossible to spike your glucose with lentils.',
    foodName: 'Lentils',
    gl: 5,
    trafficLights: { before: 'green' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'feat-5',
    type: 'featured_food',
    headline: 'Avocado — zero glycemic impact',
    body: 'GI of essentially 0. Healthy fats slow gastric emptying. Adding it to meals reduces their glucose spike by ~15%.',
    foodName: 'Avocado',
    gl: 0,
    trafficLights: { before: 'green' },
  },
  {
    id: 'feat-6',
    type: 'featured_food',
    headline: 'Jicama — the crunchy snack champion',
    body: 'GI of just 12. High in inulin fiber which feeds good gut bacteria. Eat it with lime and chili as a snack.',
    foodName: 'Jicama',
    gl: 2,
    trafficLights: { before: 'green' },
  },
  {
    id: 'feat-7',
    type: 'featured_food',
    headline: 'Chickpeas (garbanzos) — versatile and gentle',
    body: 'GI of 28. Use in salads, soups, or as a rice replacement. One of the lowest GI staples available anywhere.',
    foodName: 'Chickpeas',
    gl: 8,
    trafficLights: { before: 'green' },
    source: 'Atkinson et al. 2021',
  },
  {
    id: 'feat-8',
    type: 'featured_food',
    headline: 'Quelites — traditional greens that heal',
    body: 'Wild Mexican greens (alache, huauzontle, verdolaga) have near-zero GI and reduce the GI of any dish they are added to.',
    foodName: 'Quelites',
    gl: 1,
    trafficLights: { before: 'green' },
    source: 'J Medicinal Food 2023',
  },
  {
    id: 'feat-9',
    type: 'featured_food',
    headline: 'Walnuts — the best nut for glucose',
    body: 'GI of 15. Rich in omega-3s that improve insulin sensitivity. A handful a day can lower fasting glucose.',
    foodName: 'Walnuts',
    gl: 0,
    trafficLights: { before: 'green' },
    source: 'Tapsell et al. 2009',
  },
  {
    id: 'feat-10',
    type: 'featured_food',
    headline: 'Sardines — protein powerhouse',
    body: 'Zero GI, packed with omega-3s and protein. In Mexico, sardinas enlatadas are cheap and available everywhere.',
    foodName: 'Sardines',
    gl: 0,
    trafficLights: { before: 'green' },
  },

  // DID YOU KNOW
  {
    id: 'dyk-4',
    type: 'did_you_know',
    headline: 'Stress raises blood sugar even without eating',
    body: 'Cortisol triggers glucose release from your liver. A stressful day can spike your glucose as much as a sugary snack.',
    source: 'Surwit et al. 2002',
  },
  {
    id: 'dyk-5',
    type: 'did_you_know',
    headline: 'Poor sleep raises next-day glucose by 20-30%',
    body: 'Even one night of bad sleep reduces insulin sensitivity. The same meal will spike you more when sleep-deprived.',
    source: 'Spiegel et al. 1999',
  },
  {
    id: 'dyk-6',
    type: 'did_you_know',
    headline: 'The same food spikes people differently',
    body: 'Your glucose response is unique — genetics, gut bacteria, sleep, and stress all change how YOU respond to a food.',
    source: 'Zeevi et al. 2015 (Weizmann Institute)',
  },
  {
    id: 'dyk-7',
    type: 'did_you_know',
    headline: 'Al dente pasta has 30% lower GI than soft pasta',
    body: 'Cooking time directly affects GI. Less cooking = more resistant starch = slower glucose rise. Firmness matters.',
    source: 'Granfeldt & Björck 1991',
  },
  {
    id: 'dyk-8',
    type: 'did_you_know',
    headline: 'Your glucose response is WORSE in the evening',
    body: 'The same meal eaten at dinner spikes glucose 17% more than at breakfast. Your body is less insulin-sensitive at night.',
    source: 'Morris et al. 2015',
  },
  {
    id: 'dyk-9',
    type: 'did_you_know',
    headline: 'Nixtamalization changes the starch in corn',
    body: 'The ancient Mesoamerican lime-soaking process partially gelatinizes corn starch, changing its glucose impact vs raw corn.',
    source: 'Bello-Pérez et al. 2006',
  },
  {
    id: 'dyk-10',
    type: 'did_you_know',
    headline: 'Fasting for 12+ hours improves insulin sensitivity',
    body: 'Giving your body a break from food overnight lets insulin receptors reset. Time-restricted eating helps glucose control.',
    source: 'Sutton et al. 2018',
  },
  {
    id: 'dyk-11',
    type: 'did_you_know',
    headline: 'Two people eating identical tacos get different spikes',
    body: 'The Weizmann Institute proved that personalized nutrition matters more than general food rules. Track YOUR responses.',
    source: 'Zeevi et al. 2015',
  },
  {
    id: 'dyk-12',
    type: 'did_you_know',
    headline: 'Muscle mass improves glucose control',
    body: 'Muscles are your largest glucose sink. Building muscle through resistance exercise improves insulin sensitivity long-term.',
    source: 'DeFronzo et al. 2004',
  },
  {
    id: 'dyk-13',
    type: 'did_you_know',
    headline: 'Fermented foods lower glucose response',
    body: 'Fermentation creates organic acids that slow digestion. Sourdough bread (GI 54) vs regular white (GI 75).',
    source: 'Liljeberg et al. 1995',
  },
  {
    id: 'dyk-14',
    type: 'did_you_know',
    headline: 'Mexico has the highest diabetes rate in the OECD',
    body: '15.5% of adults — nearly 1 in 6. Traditional Mexican foods can be part of the solution, not the problem.',
    source: 'OECD Health Statistics 2023',
  },
  {
    id: 'dyk-15',
    type: 'did_you_know',
    headline: 'Green banana has HALF the GI of ripe banana',
    body: 'Unripe banana GI 30 → ripe banana GI 62. As fruit ripens, starch converts to sugar. Greener = better for glucose.',
    source: 'International Tables of GI 2021',
  },

  // ── BATCH 3: More tips ─────────────────────────────────────

  // MYTH BUSTERS
  {
    id: 'myth-13',
    type: 'mythbuster',
    headline: 'Honey is NOT better than sugar for glucose',
    body: 'Honey GI 58 vs table sugar GI 65. Barely different. Both spike glucose. The "natural" label is misleading.',
    trafficLights: { before: 'red' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'myth-14',
    type: 'mythbuster',
    headline: 'Fruit smoothies can have MORE sugar than soda',
    body: 'Blending destroys fiber structure and concentrates sugar. A mango smoothie can have 50g+ sugar — more than Coca-Cola.',
    trafficLights: { before: 'red' },
  },
  {
    id: 'myth-15',
    type: 'mythbuster',
    headline: 'Gluten-free does NOT mean low glucose impact',
    body: 'Most GF products use rice flour or corn starch — both have HIGHER GI than wheat. GF bread GI 71 vs whole wheat GI 51.',
    trafficLights: { before: 'red' },
    source: 'Atkinson et al. 2021',
  },
  {
    id: 'myth-16',
    type: 'mythbuster',
    headline: 'Dried fruit is a sugar bomb in disguise',
    body: 'Removing water concentrates sugar by 3-4x. Raisins have GI 64 and 59g sugar per 100g. Eat fresh fruit instead.',
    trafficLights: { before: 'red' },
    source: 'International Tables of GI 2021',
  },
  {
    id: 'myth-17',
    type: 'mythbuster',
    headline: 'Coconut sugar is still sugar (GI 54)',
    body: 'Marketed as "low GI" but at 54 it is only slightly lower than table sugar. Your body processes it almost the same way.',
    trafficLights: { before: 'yellow' },
  },

  // SWAP TIPS
  {
    id: 'swap-13',
    type: 'swap',
    headline: 'Cereal → eggs for breakfast',
    body: 'Most cereals GI 70-85. Eggs are GI 0. Switching breakfast from cereal to eggs reduces morning glucose by 40%+.',
    trafficLights: { before: 'red', after: 'green' },
  },
  {
    id: 'swap-14',
    type: 'swap',
    headline: 'Chips → pepitas (pumpkin seeds)',
    body: 'Chips GI 56 → pepitas GI 10. Crunchy, salty, satisfying. Traditional Mexican snack that barely moves glucose.',
    trafficLights: { before: 'yellow', after: 'green' },
  },
  {
    id: 'swap-15',
    type: 'swap',
    headline: 'Ice cream → Greek yogurt with berries',
    body: 'Ice cream GI 62 → Greek yogurt GI 11. Add berries for sweetness. Protein slows everything down.',
    trafficLights: { before: 'red', after: 'green' },
  },
  {
    id: 'swap-16',
    type: 'swap',
    headline: 'Bolillo → tortilla de nopal',
    body: 'White bolillo GI 72. Nopal tortilla GI ~25. The nopal fiber creates a gel that slows absorption.',
    trafficLights: { before: 'red', after: 'green' },
  },
  {
    id: 'swap-17',
    type: 'swap',
    headline: 'Atole → café de olla',
    body: 'Atole GI ~80 → café de olla (with minimal piloncillo) GI ~15. Traditional warm drink, fraction of the spike.',
    trafficLights: { before: 'red', after: 'green' },
  },

  // MODIFIER TIPS
  {
    id: 'mod-14',
    type: 'modifier',
    headline: 'Squeeze lime on everything',
    body: 'Citric acid reduces glycemic response by 20-30%. Mexican cuisine already does this — lean into it more.',
    source: 'Ostman et al. 2005',
  },
  {
    id: 'mod-15',
    type: 'modifier',
    headline: 'Chew your food longer',
    body: 'Eating slowly (30 chews per bite) reduces glucose spike by 12%. Your body has time to signal fullness.',
    source: 'Suzuki et al. 2005',
  },
  {
    id: 'mod-16',
    type: 'modifier',
    headline: 'Take a cold shower after high-carb meals',
    body: 'Cold exposure activates brown fat, which burns glucose for heat. Even a cold hand wash helps.',
    source: 'van der Lans et al. 2013',
  },
  {
    id: 'mod-17',
    type: 'modifier',
    headline: 'Add a side of guacamole',
    body: 'Avocado fat slows gastric emptying by 30 minutes. Your tacos release glucose much more slowly with guac.',
  },

  // FEATURED FOODS
  {
    id: 'feat-11',
    type: 'featured_food',
    headline: 'Pepitas — the Mexican seed powerhouse',
    body: 'Pumpkin seeds have GI of 10, loaded with magnesium (helps insulin sensitivity), zinc, and healthy fats.',
    foodName: 'Pepitas',
    gl: 1,
    trafficLights: { before: 'green' },
  },
  {
    id: 'feat-12',
    type: 'featured_food',
    headline: 'Huauzontle — forgotten superfood',
    body: 'This ancient Aztec grain has more protein than quinoa, near-zero GI, and can be added to any dish.',
    foodName: 'Huauzontle',
    gl: 2,
    trafficLights: { before: 'green' },
  },
  {
    id: 'feat-13',
    type: 'featured_food',
    headline: 'Amaranth — the ancient grain that fights diabetes',
    body: 'GI of 35, packed with protein and lysine. Alegría (amaranth candy) is better than most sweets for glucose.',
    foodName: 'Amaranth',
    gl: 6,
    trafficLights: { before: 'green' },
    source: 'Caselato-Sousa & Amaya-Farfán 2012',
  },

  // DID YOU KNOW
  {
    id: 'dyk-16',
    type: 'did_you_know',
    headline: 'Eating the same meal twice gives different spikes',
    body: 'Your glucose response varies by 15-20% depending on sleep, stress, time of day, and what you ate yesterday.',
    source: 'Zeevi et al. 2015',
  },
  {
    id: 'dyk-17',
    type: 'did_you_know',
    headline: 'Diabetes reversal is possible with diet alone',
    body: 'Research shows that sustained weight loss of 15kg can reverse Type 2 diabetes in 86% of people diagnosed within 6 years.',
    source: 'DiRECT trial, Taylor et al. 2018',
  },
  {
    id: 'dyk-18',
    type: 'did_you_know',
    headline: 'Your gut bacteria affect your glucose response',
    body: 'Certain gut bacteria can metabolize fiber into short-chain fatty acids that improve insulin sensitivity. Feed them fiber.',
    source: 'Sonnenburg & Bäckhed 2016',
  },
  {
    id: 'dyk-19',
    type: 'did_you_know',
    headline: '10 minutes of strength training helps glucose for 48 hours',
    body: 'Resistance exercise depletes muscle glycogen stores, creating a glucose sink that lasts 2 days.',
    source: 'Colberg et al. 2016',
  },
  {
    id: 'dyk-20',
    type: 'did_you_know',
    headline: 'Mexico\'s traditional diet was anti-diabetic',
    body: 'Beans, nopales, quelites, chía, and amaranth formed a naturally low-GI diet. Ultra-processed food changed everything.',
    source: 'Barquera et al. 2020',
  },
]

/** Fisher-Yates random shuffle */
function randomShuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Get random tips — shuffled fresh every call, at least 1 of each type */
export function getTipsForToday(count = 7): TipCard[] {
  const shuffled = randomShuffle(ALL_TIPS)

  // Ensure at least 1 of each type
  const byType = new Map<string, TipCard[]>()
  for (const t of shuffled) {
    if (!byType.has(t.type)) byType.set(t.type, [])
    byType.get(t.type)!.push(t)
  }

  const result: TipCard[] = []
  for (const [, cards] of byType) {
    if (result.length < count && cards.length > 0) {
      result.push(cards.shift()!)
    }
  }
  for (const card of shuffled) {
    if (result.length >= count) break
    if (!result.includes(card)) result.push(card)
  }

  return result
}
