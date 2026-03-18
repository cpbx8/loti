#!/usr/bin/env python3
"""
Scrape OXXO products from Open Food Facts, estimate GI/GL, output TypeScript seed data.
"""
import requests
import json
import re
import time
import sys

# ─── Category mapping ──────────────────────────────────────────
CATEGORY_MAP = {
    # Water
    "waters": "drinks_water",
    "spring-waters": "drinks_water",
    "mineral-waters": "drinks_water",
    "natural-mineral-waters": "drinks_water",
    "flavored-waters": "drinks_flavored",
    # Sodas
    "sodas": "drinks_soda",
    "colas": "drinks_soda",
    "diet-sodas": "drinks_soda",
    "carbonated-drinks": "drinks_soda",
    "soft-drinks": "drinks_soda",
    # Juice
    "fruit-juices": "drinks_juice",
    "fruit-nectars": "drinks_juice",
    "iced-teas": "drinks_juice",
    "teas": "drinks_juice",
    "lemonades": "drinks_juice",
    "fruit-based-beverages": "drinks_juice",
    "vegetable-juices": "drinks_juice",
    # Energy & sports
    "energy-drinks": "drinks_energy",
    "sports-drinks": "drinks_sports",
    "isotonic-drinks": "drinks_sports",
    # Dairy drinks
    "milks": "drinks_dairy",
    "flavoured-milks": "drinks_dairy",
    "drinkable-yogurts": "drinks_dairy",
    "fermented-milk-drinks": "drinks_dairy",
    "fermented-milks": "drinks_dairy",
    "soy-milks": "drinks_dairy",
    "plant-based-beverages": "drinks_dairy",
    "plant-milks": "drinks_dairy",
    "almond-milks": "drinks_dairy",
    "oat-milks": "drinks_dairy",
    # Coffee
    "coffees": "drinks_coffee",
    "cappuccinos": "drinks_coffee",
    "instant-coffees": "drinks_coffee",
    # Candy & chocolate
    "chocolates": "snacks_candy",
    "candies": "snacks_candy",
    "confectioneries": "snacks_candy",
    "sweet-snacks": "snacks_candy",
    "cakes": "snacks_candy",
    "pastries": "snacks_candy",
    "gummies": "snacks_candy",
    "marshmallows": "snacks_candy",
    "lollipops": "snacks_candy",
    "chewing-gums": "snacks_candy",
    "jellies": "snacks_candy",
    "desserts": "snacks_candy",
    "chocolate-bars": "snacks_candy",
    # Bars & cookies
    "biscuits": "snacks_bars",
    "cookies": "snacks_bars",
    "cereal-bars": "snacks_bars",
    "breakfast-cereals": "snacks_bars",
    "cereals": "snacks_bars",
    "granola": "snacks_bars",
    # Chips & salty
    "chips": "snacks_chips",
    "crisps": "snacks_chips",
    "tortilla-chips": "snacks_chips",
    "popcorn": "snacks_chips",
    "snacks": "snacks_chips",
    "salty-snacks": "snacks_chips",
    "corn-snacks": "snacks_chips",
    "extruded-snacks": "snacks_chips",
    "appetizers": "snacks_chips",
    # Nuts & seeds
    "nuts": "snacks_nuts",
    "peanuts": "snacks_nuts",
    "seeds": "snacks_nuts",
    "dried-fruits": "snacks_nuts",
    "trail-mixes": "snacks_nuts",
    "mixed-nuts": "snacks_nuts",
    # Dairy
    "yogurts": "dairy_yogurt",
    "yoghurts": "dairy_yogurt",
    "yogourt": "dairy_yogurt",
    "greek-yogurts": "dairy_yogurt",
    "cheeses": "dairy_cheese",
    "cream-cheeses": "dairy_cheese",
    "fresh-cheeses": "dairy_cheese",
    # Bread & bakery
    "breads": "bread_bakery",
    "sandwich-breads": "bread_bakery",
    "tortillas": "bread_bakery",
    "croissants": "bread_bakery",
    # Prepared food
    "instant-noodles": "prepared_food",
    "sandwiches": "prepared_food",
    "meals": "prepared_food",
    "soups": "prepared_food",
    "sauces": "prepared_food",
    "condiments": "prepared_food",
    "canned-foods": "prepared_food",
    "tuna": "prepared_food",
    "sausages": "prepared_food",
    "deli-meats": "prepared_food",
    "cold-cuts": "prepared_food",
    "olives": "prepared_food",
    "salads": "prepared_food",
    # Frozen
    "ice-creams": "frozen_treats",
    "frozen-desserts": "frozen_treats",
    "ice-pops": "frozen_treats",
    "sorbets": "frozen_treats",
}

DISPLAY_CATEGORIES = {
    "drinks_water": "Water",
    "drinks_soda": "Sodas",
    "drinks_juice": "Juice",
    "drinks_coffee": "Coffee",
    "drinks_energy": "Energy Drinks",
    "drinks_sports": "Sports Drinks",
    "drinks_dairy": "Dairy Drinks",
    "drinks_flavored": "Flavored Water",
    "snacks_nuts": "Nuts & Seeds",
    "snacks_chips": "Chips & Salty Snacks",
    "snacks_candy": "Candy & Chocolate",
    "snacks_bars": "Bars & Cookies",
    "snacks_jerky": "Jerky & Meat Snacks",
    "hot_food": "Hot Food",
    "dairy_yogurt": "Yogurt",
    "dairy_cheese": "Cheese",
    "bread_bakery": "Bread & Bakery",
    "prepared_food": "Prepared Food",
    "frozen_treats": "Ice Cream & Frozen",
    "other": "Other",
}


NAME_CATEGORY_HINTS = {
    "yogu": "dairy_yogurt",
    "yogh": "dairy_yogurt",
    "yakult": "dairy_yogurt",
    "danone": "dairy_yogurt",
    "activia": "dairy_yogurt",
    "oikos": "dairy_yogurt",
    "yoplait": "dairy_yogurt",
    "danonino": "dairy_yogurt",
    "chamyto": "dairy_yogurt",
    "lala bio": "dairy_yogurt",
}


def map_category(off_categories, product_name=""):
    # First pass: exact tag matches (most specific)
    for tag in off_categories:
        clean_tag = tag.replace("en:", "").replace("es:", "").lower()
        if clean_tag in CATEGORY_MAP:
            return CATEGORY_MAP[clean_tag]

    # Second pass: substring matches, but prioritize specific over generic
    # Generic tags that should only match as last resort
    GENERIC_TAGS = {"snacks", "desserts", "appetizers", "condiments", "sauces"}
    best_match = None
    for tag in off_categories:
        clean_tag = tag.replace("en:", "").replace("es:", "").lower()
        for key, value in CATEGORY_MAP.items():
            if key in clean_tag:
                if key in GENERIC_TAGS:
                    if best_match is None:
                        best_match = value  # only use if nothing better
                else:
                    return value  # specific match, use immediately
    if best_match:
        return best_match

    # Last resort: check product name for hints
    name_lower = product_name.lower()
    for hint, cat in NAME_CATEGORY_HINTS.items():
        if hint in name_lower:
            return cat

    return "other"


def parse_serving_grams(serving_str):
    if not serving_str:
        return None
    g_match = re.search(r'(\d+\.?\d*)\s*g', serving_str.lower())
    if g_match:
        return float(g_match.group(1))
    ml_match = re.search(r'(\d+\.?\d*)\s*ml', serving_str.lower())
    if ml_match:
        return float(ml_match.group(1))
    return None


def estimate_gi(per_100g):
    carbs = per_100g.get("carbs", 0) or 0
    sugar = per_100g.get("sugar", 0) or 0
    fiber = per_100g.get("fiber", 0) or 0
    protein = per_100g.get("protein", 0) or 0
    fat = per_100g.get("fat", 0) or 0

    if carbs < 5:
        return 0, 0.8

    sugar_ratio = sugar / carbs if carbs > 0 else 0
    fiber_ratio = fiber / carbs if carbs > 0 else 0
    pf_ratio = (protein + fat) / carbs if carbs > 0 else 0

    gi = 65
    if sugar_ratio > 0.5:
        gi += 15
    elif sugar_ratio > 0.3:
        gi += 8
    if fiber_ratio > 0.15:
        gi -= 15
    elif fiber_ratio > 0.08:
        gi -= 8
    if pf_ratio > 1.0:
        gi -= 12
    elif pf_ratio > 0.5:
        gi -= 6

    gi = max(10, min(100, round(gi)))
    confidence = 0.55 if (sugar_ratio > 0.5 or fiber_ratio > 0.15) else 0.4
    return gi, confidence


def compute_gl(gi, available_carbs):
    return round((gi * available_carbs) / 100, 1)


def assign_traffic_light(gl):
    if gl < 10:
        return "green"
    elif gl < 20:
        return "yellow"
    else:
        return "red"


def generate_why_tip(product):
    gl = product["estimated_gl"]
    tl = product["traffic_light"]
    sugar = product.get("sugar_serving", 0) or 0
    fiber = product.get("fiber_serving", 0) or 0
    protein = product.get("protein_serving", 0) or 0
    carbs = product.get("carbs_serving", 0) or 0

    if carbs < 5:
        return "Negligible carbs — minimal glucose impact."

    if tl == "green":
        if protein > 10:
            return "High protein slows glucose absorption. Good choice."
        if fiber > 5:
            return "High fiber slows carb digestion. Good choice."
        if carbs < 10:
            return "Low carbs per serving keeps glucose impact minimal."
        return "Low glycemic load per serving."

    if tl == "yellow":
        if sugar > 15:
            return f"{sugar:.0f}g sugar per serving — moderate impact. Watch your portion."
        return "Moderate glucose impact. Fine occasionally, not every day."

    # Red
    if sugar > 30:
        return f"{sugar:.0f}g of sugar per serving — one of the highest glucose spikes at OXXO."
    if sugar > 20:
        return f"{sugar:.0f}g of sugar — significant glucose spike."
    if carbs > 30 and fiber < 2:
        return "Refined carbs with almost no fiber — spikes glucose fast."
    return "High glycemic load per serving — consider a swap."


def scrape_oxxo_products(max_pages=15):
    all_products = []
    page = 1

    while page <= max_pages:
        print(f"  Fetching page {page}...", end=" ", flush=True)
        url = "https://mx.openfoodfacts.org/api/v2/search"
        params = {
            "stores_tags": "oxxo",
            "countries_tags": "mexico",
            "fields": (
                "code,product_name,brands,categories_tags,"
                "nutriments,serving_size,serving_quantity,"
                "nutriscore_grade,image_front_url"
            ),
            "page_size": 100,
            "page": page,
            "json": 1
        }

        data = None
        for attempt in range(3):
            try:
                response = requests.get(url, params=params, timeout=60)
                data = response.json()
                break
            except Exception as e:
                if attempt < 2:
                    print(f"retry({attempt+1})...", end=" ", flush=True)
                    time.sleep(5)
                else:
                    print(f"ERROR after 3 attempts: {e}")
        if data is None:
            break

        products = data.get("products", [])
        if not products:
            print("no more products")
            break

        count = 0
        for product in products:
            nutriments = product.get("nutriments", {})
            carbs = nutriments.get("carbohydrates_100g")
            name = (product.get("product_name") or "").strip()

            if carbs is not None and name:
                serving_g = product.get("serving_quantity") or parse_serving_grams(product.get("serving_size", ""))
                if not serving_g:
                    serving_g = 100

                factor = serving_g / 100
                per_100g = {
                    "carbs": carbs,
                    "sugar": nutriments.get("sugars_100g", 0) or 0,
                    "fiber": nutriments.get("fiber_100g", 0) or 0,
                    "protein": nutriments.get("proteins_100g", 0) or 0,
                    "fat": nutriments.get("fat_100g", 0) or 0,
                }

                gi, confidence = estimate_gi(per_100g)
                avail_carbs = max(0, (carbs - (per_100g["fiber"])) * factor)
                gl = compute_gl(gi, avail_carbs)
                tl = assign_traffic_light(gl)

                categories = product.get("categories_tags", [])
                category = map_category(categories, name)

                p = {
                    "barcode": product.get("code"),
                    "product_name": name,
                    "brand": (product.get("brands") or "Unknown").strip(),
                    "category": category,
                    "serving_size_g": round(serving_g, 1),
                    "serving_label": product.get("serving_size", ""),
                    "carbs_serving": round(carbs * factor, 1),
                    "sugar_serving": round((per_100g["sugar"]) * factor, 1),
                    "fiber_serving": round((per_100g["fiber"]) * factor, 1),
                    "protein_serving": round((per_100g["protein"]) * factor, 1),
                    "fat_serving": round((per_100g["fat"]) * factor, 1),
                    "estimated_gi": gi,
                    "estimated_gl": gl,
                    "traffic_light": tl,
                    "gi_confidence": confidence,
                    "image_url": product.get("image_front_url"),
                }
                all_products.append(p)
                count += 1

        print(f"{count} products")
        page += 1
        time.sleep(3)

    return all_products


def deduplicate(products):
    """Remove duplicates by barcode, keeping first occurrence."""
    seen = set()
    unique = []
    for p in products:
        key = p.get("barcode") or p["product_name"]
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def generate_swaps(products):
    """For each red/yellow product, find the best green swap in the same category."""
    greens_by_cat = {}
    for p in products:
        if p["traffic_light"] == "green":
            cat = p["category"]
            if cat not in greens_by_cat:
                greens_by_cat[cat] = []
            greens_by_cat[cat].append(p)

    for cat in greens_by_cat:
        greens_by_cat[cat].sort(key=lambda x: x["estimated_gl"])

    category_swap_targets = {
        "drinks_soda": "drinks_water",
        "drinks_energy": "drinks_coffee",
        "drinks_flavored": "drinks_water",
        "drinks_juice": "drinks_water",
        "snacks_candy": "snacks_nuts",
        "snacks_bars": "snacks_nuts",
        "bread_bakery": "snacks_nuts",
        "prepared_food": "snacks_nuts",
        "frozen_treats": "dairy_yogurt",
    }

    for p in products:
        if p["traffic_light"] == "green":
            p["swap_suggestion"] = None
            continue

        cat = p["category"]

        # Same-category green
        if cat in greens_by_cat and greens_by_cat[cat]:
            best = greens_by_cat[cat][0]
            p["swap_suggestion"] = best["product_name"]
            continue

        # Cross-category
        target = category_swap_targets.get(cat)
        if target and target in greens_by_cat and greens_by_cat[target]:
            best = greens_by_cat[target][0]
            p["swap_suggestion"] = best["product_name"]
            continue

        p["swap_suggestion"] = None

    return products


def generate_typescript(products):
    """Generate TypeScript array for bundling as seed data."""
    lines = [
        "import type { StoreProduct } from '@/types/storeGuide'",
        "",
        "/** Auto-generated from Open Food Facts + hand-curated products */",
        "export const OXXO_SEED_PRODUCTS: StoreProduct[] = [",
    ]

    for i, p in enumerate(products):
        name = p["product_name"].replace("'", "\\'").replace('"', '\\"')
        brand = (p.get("brand") or "").replace("'", "\\'").replace('"', '\\"')
        swap = (p.get("swap_suggestion") or "")
        swap = swap.replace("'", "\\'").replace('"', '\\"') if swap else ""
        why = (p.get("why_tip") or "").replace("'", "\\'").replace('"', '\\"')
        serving = (p.get("serving_label") or "").replace("'", "\\'").replace('"', '\\"')

        swap_val = f"'{swap}'" if swap else "null"
        why_val = f"'{why}'" if why else "null"
        serving_val = f"'{serving}'" if serving else "null"

        lines.append(f"  {{ id: 'p{i+1}', store_chain: 'oxxo', product_name: \"{name}\", brand: \"{brand}\", category: '{p['category']}', traffic_light: '{p['traffic_light']}', estimated_gl: {p['estimated_gl']}, is_best_choice: {'true' if p['traffic_light'] == 'green' and p['estimated_gl'] <= 5 else 'false'}, swap_suggestion: {swap_val}, why_tip: {why_val}, why_detail: null, price_mxn: null, barcode: '{p.get('barcode', '')}', serving_label: {serving_val}, image_url: null }},")

    lines.append("]")
    return "\n".join(lines)


def main():
    print("Scraping OXXO products from Open Food Facts...")
    scraped = scrape_oxxo_products(max_pages=15)
    print(f"\nScraped {len(scraped)} products with nutrition data")

    # Deduplicate
    scraped = deduplicate(scraped)
    print(f"After dedup: {len(scraped)} unique products")

    # Generate why_tips
    for p in scraped:
        p["why_tip"] = generate_why_tip(p)

    # Generate swaps
    scraped = generate_swaps(scraped)

    # Also load hand-curated products to merge
    # (the hand-curated ones take priority for matching names)
    curated_names = set()

    # Stats
    greens = sum(1 for p in scraped if p["traffic_light"] == "green")
    yellows = sum(1 for p in scraped if p["traffic_light"] == "yellow")
    reds = sum(1 for p in scraped if p["traffic_light"] == "red")
    cats = {}
    for p in scraped:
        cats[p["category"]] = cats.get(p["category"], 0) + 1

    print(f"\nResults: {greens} green, {yellows} yellow, {reds} red")
    print(f"Categories:")
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        label = DISPLAY_CATEGORIES.get(cat, cat)
        print(f"  {label}: {count}")

    # Output TypeScript
    ts = generate_typescript(scraped)
    outpath = "src/data/oxxoProducts.ts"
    with open(outpath, "w") as f:
        f.write(ts)
    print(f"\nWrote {len(scraped)} products to {outpath}")

    # Also output JSON for inspection
    with open("scripts/oxxo_scraped.json", "w") as f:
        json.dump(scraped, f, ensure_ascii=False, indent=2)
    print(f"Wrote JSON to scripts/oxxo_scraped.json")


if __name__ == "__main__":
    main()
