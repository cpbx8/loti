# Custom Meal Builder

**Date:** 2026-03-27
**Status:** Approved

## Problem

Users eat multi-ingredient meals (protein shakes, smoothies, homemade dishes) that a single photo can't identify. They need a way to compose a meal from individual ingredients, save it, and log it quickly in the future — with each ingredient tracked separately for accurate glycemic load calculation.

## Solution

A "Create Your Meal" feature that lets users build reusable multi-ingredient meals. Each ingredient is tracked individually when logged, preserving per-item GL data. The meal is saved for one-tap logging in the future.

## Data Model

### New Table: `custom_meals`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `name` | TEXT | User-given name, e.g. "Protein Shake" |
| `icon` | TEXT | Optional emoji chosen by user, defaults to "🍽️" if not set |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

### New Table: `custom_meal_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `meal_id` | TEXT FK | References `custom_meals.id` |
| `food_name` | TEXT | Display name |
| `food_name_en` | TEXT | English name for search |
| `serving_size_g` | REAL | Grams per serving |
| `quantity` | REAL | Number of servings (default 1) |
| `calories_kcal` | REAL | Per serving |
| `protein_g` | REAL | Per serving |
| `carbs_g` | REAL | Per serving |
| `fat_g` | REAL | Per serving |
| `fiber_g` | REAL | Per serving |
| `glycemic_load` | REAL | Per serving |
| `traffic_light` | TEXT | green/yellow/red |
| `sort_order` | INTEGER | Display ordering |

### Modified Table: `scan_logs`

Add nullable column `meal_group_id TEXT`. When logging a custom meal, generate a UUID and assign it to all ingredient entries. Regular single-food logs leave this `NULL`. The `input_method` field is set to `'custom_meal'`.

## UI Flow: Building a Custom Meal

### Entry Points

- "+" or "Create Meal" button on the main logging screen (alongside photo/search/barcode)
- "My Meals" section accessible from profile/settings

### Builder Screen

1. **Meal Name** — Text input at top with optional emoji picker for icon
2. **Add Ingredients** — Three input methods:
   - **Search bar** — text search against existing food DB
   - **Camera button** — snap a photo or barcode of individual ingredient
   - **Recent foods row** — scrollable chips of recently logged items, tap to add
3. **Ingredient List** — Stacked cards, each showing:
   - Food name
   - Macros as subtitle text (P/C/F)
   - GL value with traffic light dot (primary right-side metric)
   - Editable quantity
   - Swipe-to-delete or × button
   - Drag handles to reorder
4. **Totals Bar** — Sticky bottom section with:
   - Hero: GL circle (large, traffic-light colored) + verdict badge ("✓ Low Impact")
   - Secondary: macros row (protein, carbs, fat, fiber, calories)
5. **Save Button** — Gradient pill button, saves and returns to previous screen

### Visual Hierarchy

Glycemic Load is the hero metric throughout. The information priority order:

1. Traffic light badge — most prominent visual signal
2. Glycemic Load number — primary numeric metric
3. Macros (protein, carbs, fat, fiber) — secondary info
4. Calories — available but de-emphasized (end of macros row)

## UI Flow: Logging a Custom Meal

### Where Custom Meals Appear

- **Main logging screen** — "My Meals" section with saved meal cards (name, icon, GL)
- **Search results** — custom meal names surface in text search with "Custom Meal" badge

### Logging Flow

1. User taps a custom meal card
2. **Confirmation screen** shows:
   - Meal name, icon, GL circle + verdict badge at top
   - Quantity multiplier (1× default) with stepper for "I had two of these"
   - Ingredient list with per-item GL and "adjust" link for individual quantity changes
   - Macros row at bottom
3. User taps "Log Meal"
4. Each ingredient is inserted as a separate `scan_logs` entry sharing the same `meal_group_id`
5. In history, grouped entries display as a single collapsible card — tap to expand individual ingredients

### Editing Saved Meals

- Long-press or tap "..." on a meal card → Edit / Duplicate / Delete
- Edit opens the builder screen pre-populated
- Duplicate creates a copy for variations (e.g. "Protein Shake — no banana")

## UI Flow: History View

### Collapsed State

Standard history card showing:
- Meal icon + name
- "4 items · 12:30 PM" subtitle
- GL number in traffic-light color as headline metric
- Traffic light badge

### Expanded State

Tapping the card reveals:
- All individual ingredients listed below
- Each ingredient shows its name and individual GL in the appropriate traffic color
- Card gains a top border accent (primary maroon)

## Data Flow & Aggregation

### Nutritional Aggregation

- Total macros = sum of (per-serving value × quantity) for each ingredient
- Traffic light for the meal = worst color among all ingredients (any red ingredient → red meal)
- Glycemic load = sum of individual GLs (nutritionally valid — GL is additive)

### Edge Cases

1. **Empty meal** — Save button disabled until at least one ingredient added
2. **Deleted ingredient from DB** — Custom meal items store a snapshot of nutrition data at creation time. Source food updates don't affect saved meals. User can manually update by editing.
3. **Duplicate meal names** — Allowed. No uniqueness constraint on `name`.
4. **Logging an edited meal** — Editing updates future logs. Past `scan_logs` entries are immutable.
5. **Quantity bounds** — Minimum 0.1, maximum 99. Serving size minimum 1g.
6. **Offline** — Fully functional. Custom meals are local SQLite.

## Design System Compliance

All UI follows the existing Loti design system:

- **Backgrounds:** Warm paper stack (`#f9f9f7` surface, `#f4f4f2` containers, `#ffffff` cards)
- **Primary accent:** Maroon gradient (`#a62f4a` → `#c74861`)
- **Typography:** Fraunces serif for headings, DM Sans for body
- **Cards:** 16px radius, no borders, subtle shadow (`0 2px 8px rgba(26, 28, 27, 0.03)`)
- **Buttons:** Gradient pill shape, 9999px radius, shadow
- **Traffic lights:** Sacred — only for GI impact. Colorblind-safe icons (✓/⚠/⊘)
- **Tab bar:** Glassmorphic, 58px height

### Mockups

Interactive mockups saved at:
- `.superpowers/brainstorm/87905-1774619283/content/meal-builder-v3.html`

## Testing Strategy

### Unit Tests

- `custom_meals` CRUD — create, read, update, delete
- `custom_meal_items` — add, remove, reorder, quantity validation
- Nutritional aggregation — sum logic across ingredients
- Traffic light rollup — worst-of-ingredients (green + red = red)
- GL summation correctness
- Edge cases: empty meal rejection, min/max quantity bounds

### Integration Tests

- Full flow: create meal → log meal → verify `scan_logs` entries with correct `meal_group_id` and nutrition values
- Edit meal → log again → verify new values, old logs unchanged
- Duplicate meal → verify independent copy
- Search returning custom meals alongside regular foods
- History view grouping by `meal_group_id`

## Out of Scope (YAGNI)

- No sharing/exporting custom meals
- No "suggested meals" or templates
- No meal categories or tags
- No nutritional goals or warnings beyond traffic light
- No meal scheduling or meal planning
- No syncing custom meals across devices (local only)
