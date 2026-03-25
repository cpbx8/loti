# Food Detail Screen

**Date:** 2026-03-25
**Status:** Design approved, pending implementation

## Problem

Users can't view details or edit logged foods after scanning. The meal timeline shows food name + GL badge but no macros, no portion editing, and no way to correct mistakes. The only action is swipe-to-delete, which is destructive with no confirmation.

## Design

Tapping a timeline entry navigates to `/food/:id`. The detail screen shows the full nutritional breakdown and lets users adjust portions or delete.

### Layout

```
┌─────────────────────────────┐
│ ← Back          🗑️ Delete   │  glass header
├─────────────────────────────┤
│                              │
│  [TL Badge]  Food Name       │  traffic light + name (text-title)
│                              │
│  ── Portion ──────────────── │
│  [-]  1 serving  [+]         │  stepper: 0.5 increments, min 0.5
│       150g                   │  tap to edit exact grams
│                              │
│  ── Nutrition ─────────────  │
│  Calories    210 kcal        │
│  Carbs       34g             │
│  Protein     8g              │
│  Fat         12g             │
│  Fiber       4g              │
│  GL          9               │
│                              │
│  ── Glucose Impact ────────  │
│  [GlucoseSpikeCurve]         │  existing component, compact
│                              │
│  [ Save Changes ]            │  btn-gradient, only if edited
└─────────────────────────────┘
```

### Behavior

**Portion stepper:**
- 0.5 serving increments (0.5, 1, 1.5, 2, 2.5...)
- Min 0.5, no max
- Changing serving count scales grams: `newGrams = originalGramsPerServing * servingCount`
- All macros recalculate live: `macro = originalMacro * (newGrams / originalGrams)`

**Grams input:**
- Tap the "150g" text to enter edit mode (inline input, same pattern as IngredientRow)
- Typing exact grams recalculates serving count: `servingCount = newGrams / originalGramsPerServing`
- All macros recalculate live

**Delete:**
- Tap trash icon → confirmation dialog ("Delete this food?")
- On confirm: remove entry, navigate back to dashboard
- On cancel: dismiss dialog

**Save:**
- Button only visible when portion changed (serving count or grams differ from original)
- On save: update DB entry with new serving_size_g and quantity, navigate back
- Back without saving: discard changes silently

**Data flow:**
- Read: new `getScanById(id)` query → mapped to FoodLogEntry
- Write: new `updateScanEntry(id, { serving_size_g, quantity })` query
- Delete: existing `deleteScanLog(id)`

### Scaling math

Store originals on mount: `originalGrams = entry.serving_size_g`, `originalServings = entry.serving_count ?? 1`

The "grams per serving" is: `gramsPerServing = originalGrams / originalServings`

When stepper changes serving count:
- `newGrams = gramsPerServing * newServingCount`
- `ratio = newGrams / originalGrams`
- All macros: `displayed = original * ratio`

When grams input changes:
- `ratio = newGrams / originalGrams`
- `newServingCount = newGrams / gramsPerServing`
- All macros: `displayed = original * ratio`

### Navigation

- From MealTimeline: `navigate('/food/' + entry.id)`
- Back: `navigate(-1)` or `navigate('/')`
- After delete: `navigate('/')`
- After save: `navigate(-1)`

## Files

| File | Change |
|------|--------|
| `src/screens/FoodDetailScreen.tsx` | New screen |
| `src/db/queries.ts` | Add `getScanById`, `updateScanEntry` |
| `src/hooks/useFoodDetail.ts` | New hook: load entry, mutations |
| `src/components/MealTimeline.tsx` | Add `onClick` navigation to entries |
| `src/App.tsx` | Add `/food/:id` route |
| `src/components/TabBar.tsx` | Add `/food` to HIDDEN_ROUTES |

## NOT in scope

- Editing food name (re-scan instead)
- Editing macros directly (only portion affects them)
- Composite meal editing (use EditableMealCard on scan screen)
- Undo after delete
