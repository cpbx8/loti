#!/usr/bin/env python3
"""
Scrape 7-Eleven products from Open Food Facts, estimate GI/GL, output TypeScript seed data.
Reuses the same logic as scrape_oxxo_off.py but targets 7-Eleven stores.
"""
import requests
import json
import re
import time
import sys
import math

# ─── Category mapping ──────────────────────────────────────────
CATEGORY_MAP = {
    "waters": "drinks_water", "spring-waters": "drinks_water", "mineral-waters": "drinks_water",
    "natural-mineral-waters": "drinks_water", "flavored-waters": "drinks_flavored",
    "sodas": "drinks_soda", "colas": "drinks_soda", "diet-sodas": "drinks_soda",
    "carbonated-drinks": "drinks_soda", "soft-drinks": "drinks_soda",
    "fruit-juices": "drinks_juice", "fruit-nectars": "drinks_juice", "iced-teas": "drinks_juice",
    "teas": "drinks_juice", "lemonades": "drinks_juice", "fruit-based-beverages": "drinks_juice",
    "energy-drinks": "drinks_energy", "sports-drinks": "drinks_sports", "isotonic-drinks": "drinks_sports",
    "milks": "drinks_dairy", "flavoured-milks": "drinks_dairy", "drinkable-yogurts": "drinks_dairy",
    "chocolated-milks": "drinks_dairy", "plant-milks": "drinks_dairy",
    "coffees": "drinks_coffee", "instant-coffees": "drinks_coffee", "iced-coffees": "drinks_coffee",
    "peanuts": "snacks_nuts", "nuts": "snacks_nuts", "mixed-nuts": "snacks_nuts",
    "almonds": "snacks_nuts", "pistachios": "snacks_nuts", "cashew-nuts": "snacks_nuts",
    "seeds": "snacks_nuts", "sunflower-seeds": "snacks_nuts", "trail-mixes": "snacks_nuts",
    "chips": "snacks_chips", "potato-chips": "snacks_chips", "tortilla-chips": "snacks_chips",
    "corn-chips": "snacks_chips", "extruded-snacks": "snacks_chips", "popcorn": "snacks_chips",
    "crisps": "snacks_chips", "salty-snacks": "snacks_chips", "snacks": "snacks_chips",
    "candies": "snacks_candy", "chocolates": "snacks_candy", "confectioneries": "snacks_candy",
    "gummies": "snacks_candy", "lollipops": "snacks_candy", "chewing-gum": "snacks_candy",
    "cereal-bars": "snacks_bars", "granola-bars": "snacks_bars", "protein-bars": "snacks_bars",
    "energy-bars": "snacks_bars", "breakfast-bars": "snacks_bars",
    "beef-jerky": "snacks_jerky", "dried-meats": "snacks_jerky",
    "yogurts": "dairy_yogurt", "greek-yogurts": "dairy_yogurt",
    "cheeses": "dairy_cheese", "fresh-cheeses": "dairy_cheese", "cream-cheeses": "dairy_cheese",
    "breads": "bread_bakery", "pastries": "bread_bakery", "cakes": "bread_bakery",
    "donuts": "bread_bakery", "croissants": "bread_bakery", "muffins": "bread_bakery",
    "sandwiches": "prepared_food", "wraps": "prepared_food", "salads": "prepared_food",
    "prepared-meals": "prepared_food", "burritos": "prepared_food",
    "ice-creams": "frozen_treats", "frozen-desserts": "frozen_treats", "popsicles": "frozen_treats",
    "sorbets": "frozen_treats",
    "hot-dogs": "hot_food", "pizzas": "hot_food", "tacos": "hot_food",
    "taquitos": "hot_food", "nachos": "hot_food",
}

def estimate_gi(carbs, sugar, fiber, protein, fat):
    """Estimate GI from nutrition ratios"""
    if carbs is None or carbs <= 0:
        return 0, 0.3

    sugar_ratio = (sugar or 0) / carbs if carbs > 0 else 0
    fiber_ratio = (fiber or 0) / carbs if carbs > 0 else 0
    pf_ratio = ((protein or 0) + (fat or 0)) / carbs if carbs > 0 else 0

    # Base GI estimate
    gi = 55  # default medium

    if sugar_ratio > 0.7:
        gi = 75
    elif sugar_ratio > 0.4:
        gi = 65
    elif sugar_ratio < 0.1 and fiber_ratio > 0.1:
        gi = 35
    elif sugar_ratio < 0.2:
        gi = 45

    # Fiber lowers GI
    if fiber_ratio > 0.15:
        gi -= 10
    elif fiber_ratio > 0.05:
        gi -= 5

    # Protein + fat slow absorption
    if pf_ratio > 1.5:
        gi -= 10
    elif pf_ratio > 0.5:
        gi -= 5

    gi = max(0, min(100, gi))
    confidence = 0.4

    return gi, confidence

def compute_gl(gi, carbs, fiber, serving_g):
    """GL = (GI * available_carbs) / 100"""
    available = max(0, (carbs or 0) - (fiber or 0))
    gl = (gi * available) / 100
    return round(gl, 1)

def traffic_light(gl):
    if gl < 10: return "green"
    if gl < 20: return "yellow"
    return "red"

def assign_category(categories_tags):
    """Map OFF category tags to our categories using priority order"""
    if not categories_tags:
        return "snacks_chips"

    for tag in categories_tags:
        clean = tag.replace("en:", "").replace("es:", "").replace("fr:", "")
        if clean in CATEGORY_MAP:
            return CATEGORY_MAP[clean]

    # Keyword fallback
    joined = " ".join(categories_tags).lower()
    if "water" in joined: return "drinks_water"
    if "soda" in joined or "cola" in joined: return "drinks_soda"
    if "juice" in joined or "nectar" in joined: return "drinks_juice"
    if "energy" in joined: return "drinks_energy"
    if "milk" in joined or "dairy" in joined: return "drinks_dairy"
    if "coffee" in joined: return "drinks_coffee"
    if "chip" in joined or "crisp" in joined: return "snacks_chips"
    if "nut" in joined or "peanut" in joined or "almond" in joined: return "snacks_nuts"
    if "candy" in joined or "chocolate" in joined or "sweet" in joined: return "snacks_candy"
    if "bar" in joined or "granola" in joined: return "snacks_bars"
    if "yogurt" in joined or "yoghurt" in joined: return "dairy_yogurt"
    if "cheese" in joined: return "dairy_cheese"
    if "bread" in joined or "pastry" in joined or "cake" in joined: return "bread_bakery"
    if "ice cream" in joined or "frozen" in joined: return "frozen_treats"
    if "sandwich" in joined or "wrap" in joined or "salad" in joined: return "prepared_food"

    return "snacks_chips"

def generate_swap(product_name, tl, category):
    """Generate swap suggestion for yellow/red products"""
    if tl == "green":
        return None

    swaps = {
        "drinks_soda": "Agua Mineral Peñafiel",
        "drinks_juice": "Agua Natural E-Pura 600ml",
        "drinks_energy": "Monster Energy Zero Ultra",
        "drinks_dairy": "Leche Santa Clara Entera",
        "drinks_coffee": "Café Americano (sin azúcar)",
        "snacks_chips": "Cacahuates Naturales",
        "snacks_candy": "Almendras Naturales",
        "snacks_bars": "Almendras Naturales",
        "bread_bakery": "Yogurt Griego Oikos Natural",
        "frozen_treats": "Yogurt Griego Oikos Natural",
        "hot_food": "Ensalada de Pollo",
        "prepared_food": "Ensalada de Pollo",
    }
    return swaps.get(category)

def generate_why_tip(gi, gl, tl, carbs, sugar, fiber):
    """Generate a short tip about why this product has its rating"""
    if tl == "green":
        if carbs and carbs < 5:
            return "Negligible carbs — minimal glucose impact."
        if fiber and fiber > 3:
            return "Good fiber content slows glucose absorption."
        return "Low glycemic load — safe for blood sugar."
    elif tl == "yellow":
        if sugar and sugar > 15:
            return f"Contains {int(sugar)}g sugar — moderate glucose impact."
        return "Moderate carb content — watch portions."
    else:
        if sugar and sugar > 30:
            return f"Very high sugar ({int(sugar)}g) — expect a significant glucose spike."
        if sugar and sugar > 15:
            return f"High sugar content ({int(sugar)}g) drives rapid glucose rise."
        return "High glycemic load — consider a lower-impact swap."


def scrape_7eleven():
    """Scrape Open Food Facts for 7-Eleven products"""
    products = []
    seen_barcodes = set()
    seen_names = set()

    # Try multiple search queries
    queries = [
        "stores_tags=7-eleven&countries_tags=mexico",
        "stores_tags=seven-eleven&countries_tags=mexico",
        "stores_tags=7-eleven",
        "stores_tags=seven-eleven",
        "stores_tags=7eleven",
    ]

    for query in queries:
        for page in range(1, 10):
            url = f"https://mx.openfoodfacts.org/cgi/search.pl?{query}&page={page}&page_size=100&json=1"
            print(f"[7-Eleven] Fetching page {page} ({query[:30]}...)", file=sys.stderr)

            try:
                resp = requests.get(url, headers={"User-Agent": "Loti-App/1.0"}, timeout=15)
                if resp.status_code != 200:
                    print(f"  HTTP {resp.status_code}, skipping", file=sys.stderr)
                    break

                data = resp.json()
                page_products = data.get("products", [])

                if not page_products:
                    break

                for p in page_products:
                    barcode = p.get("code", "")
                    name = p.get("product_name") or p.get("product_name_es") or p.get("product_name_en")

                    if not name or len(name) < 2:
                        continue
                    if barcode in seen_barcodes:
                        continue

                    name_key = name.lower().strip()
                    if name_key in seen_names:
                        continue

                    nutriments = p.get("nutriments", {})
                    carbs = nutriments.get("carbohydrates_100g")
                    sugar = nutriments.get("sugars_100g")
                    fiber = nutriments.get("fiber_100g")
                    protein = nutriments.get("proteins_100g")
                    fat = nutriments.get("fat_100g")

                    if carbs is None and sugar is None and protein is None:
                        continue

                    carbs = carbs or 0

                    serving_qty = 100
                    try:
                        sq = float(p.get("serving_quantity", 0))
                        if sq > 0:
                            serving_qty = sq
                    except:
                        pass

                    # Scale to serving
                    s_carbs = carbs * serving_qty / 100
                    s_sugar = (sugar or 0) * serving_qty / 100
                    s_fiber = (fiber or 0) * serving_qty / 100
                    s_protein = (protein or 0) * serving_qty / 100
                    s_fat = (fat or 0) * serving_qty / 100

                    gi, conf = estimate_gi(s_carbs, s_sugar, s_fiber, s_protein, s_fat)
                    gl = compute_gl(gi, s_carbs, s_fiber, serving_qty)
                    tl = traffic_light(gl)

                    cats = p.get("categories_tags", [])
                    category = assign_category(cats)

                    brand = p.get("brands", "").split(",")[0].strip() or None
                    serving_label = p.get("serving_size") or f"{int(serving_qty)} g"

                    swap = generate_swap(name, tl, category)
                    why = generate_why_tip(gi, gl, tl, s_carbs, s_sugar, s_fiber)

                    products.append({
                        "name": name.strip(),
                        "brand": brand,
                        "category": category,
                        "traffic_light": tl,
                        "estimated_gl": gl,
                        "is_best_choice": tl == "green" and gl <= 5,
                        "swap_suggestion": swap,
                        "why_tip": why,
                        "barcode": barcode if barcode else None,
                        "serving_label": serving_label,
                    })

                    if barcode:
                        seen_barcodes.add(barcode)
                    seen_names.add(name_key)

                time.sleep(0.5)

            except Exception as e:
                print(f"  Error: {e}", file=sys.stderr)
                break

    print(f"\n[7-Eleven] Scraped {len(products)} products from OFF", file=sys.stderr)
    return products


def output_typescript(products):
    """Generate TypeScript file"""
    lines = [
        'import type { StoreProduct } from \'@/types/storeGuide\'',
        '',
        '/** Auto-generated from Open Food Facts + hand-curated products */',
        'export const SEVEN_ELEVEN_SEED_PRODUCTS: StoreProduct[] = [',
    ]

    for i, p in enumerate(products, 1):
        name = p["name"].replace("'", "\\'").replace('"', '\\"')
        brand = f'"{p["brand"]}"' if p["brand"] else "null"
        swap = f"'{p['swap_suggestion']}'" if p["swap_suggestion"] else "null"
        why = f"'{p['why_tip']}'" if p["why_tip"] else "null"
        barcode = f"'{p['barcode']}'" if p["barcode"] else "null"
        serving = f"'{p['serving_label']}'" if p["serving_label"] else "null"

        line = (
            f'  {{ id: \'7e{i}\', store_chain: \'seven_eleven\', '
            f'product_name: "{name}", brand: {brand}, '
            f'category: \'{p["category"]}\', traffic_light: \'{p["traffic_light"]}\', '
            f'estimated_gl: {p["estimated_gl"]}, is_best_choice: {str(p["is_best_choice"]).lower()}, '
            f'swap_suggestion: {swap}, why_tip: {why}, '
            f'why_detail: null, price_mxn: null, '
            f'barcode: {barcode}, serving_label: {serving}, image_url: null }},'
        )
        lines.append(line)

    lines.append(']')
    return '\n'.join(lines)


if __name__ == '__main__':
    # Scrape from OFF
    scraped = scrape_7eleven()

    # Load existing hand-curated products to merge
    # (we'll keep hand-curated as base and add scraped ones that don't overlap)
    existing_names = set()

    # Read existing seed data names
    import os
    seed_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'sevenElevenProducts.ts')
    if os.path.exists(seed_path):
        with open(seed_path) as f:
            content = f.read()
            for m in re.finditer(r"product_name:\s*['\"]([^'\"]+)", content):
                existing_names.add(m.group(1).lower().strip())

    print(f"[7-Eleven] {len(existing_names)} existing hand-curated products", file=sys.stderr)

    # Filter scraped to only new products
    new_products = []
    for p in scraped:
        if p["name"].lower().strip() not in existing_names:
            new_products.append(p)

    print(f"[7-Eleven] {len(new_products)} new products from scraping", file=sys.stderr)

    # Combine: hand-curated products stay, add new scraped ones
    # We output ONLY the new scraped products — they'll be appended to the existing file
    if new_products:
        ts = output_typescript(new_products)

        # Write combined file
        print(f"[7-Eleven] Writing {len(new_products)} scraped products", file=sys.stderr)
        print(ts)
    else:
        print("[7-Eleven] No new products to add", file=sys.stderr)
