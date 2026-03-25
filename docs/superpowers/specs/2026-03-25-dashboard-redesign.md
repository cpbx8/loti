# Dashboard Redesign: Score-as-Weather Hero

**Date:** 2026-03-25
**Status:** Design approved, pending implementation

## Problem

The current dashboard is a linear list of disconnected sections: greeting, streak, curve, tip, recent scans, insight, disclaimer. Nothing tells the user "how am I doing?" at a glance. The glucose curve is buried below the fold and requires context to interpret. Opening the app feels like reading a report, not getting an answer.

## Design Decisions

All decisions made collaboratively during brainstorming:

| Decision | Choice | Why |
|----------|--------|-----|
| Hero content | Today's glucose score | The single most important thing — instant answer to "how am I doing?" |
| Score style | Weather metaphor | Big number + mood phrase ("Smooth sailing", "Watch out") — emotional, not clinical |
| Below hero | Glucose curve | The score's evidence — shows the day's glucose journey |
| Food log style | Timeline | Meals connected to curve dots, creating cause-and-effect narrative |
| Engagement hook | Streak badge | Compact bar between header and hero. Proven retention mechanic. |
| Axolotl tips | Moved to post-scan | More contextually relevant after scanning, not competing for dashboard space |
| Empty state | Loti greets + scan prompt | Warm personality: "What's for breakfast?" with scan CTA |
| Quantity adjuster | Removed from result card | Simplifies result card. Users adjust portions after logging if needed. |

## Page Structure (top to bottom)

```
┌─────────────────────────────┐
│ 🌸 Loti              ⚙️    │  ← glass header, flex-shrink-0
├─────────────────────────────┤
│ 🔥 7-day streak             │  ← compact streak bar
├─────────────────────────────┤
│     TODAY'S GLUCOSE          │
│         82                   │  ← text-display (56px, 800wt)
│        mg/dL                 │
│   ● Smooth sailing           │  ← mood pill, traffic-light colored
│                              │
│   ╭──glucose curve──────╮    │  ← daily curve with food dots
│   │  ·    ·         ·   │    │     dots = meals, color = TL
│   ╰─6am──12pm──6pm─────╯    │
├─────────────────────────────┤
│   TODAY'S MEALS              │
│   │                          │
│   ● 8:30 AM                 │  ← timeline with vertical line
│   │ Scrambled eggs    GL 2   │     dot color = traffic light
│   │ 250 kcal · 18P 5C 18F   │     macros inline
│   │                          │
│   ● 12:15 PM                │
│   │ Tortilla chips    GL 22  │  ← yellow/red get left border accent
│   │ 250 kcal · 4P 32C 12F   │
│   │                          │
├─────────────────────────────┤
│   CGM disclaimer (10px)      │  ← existing disclaimer, bottom
└─────────────────────────────┘
```

## Empty State (zero meals today)

```
┌─────────────────────────────┐
│ 🌸 Loti              ⚙️    │
├─────────────────────────────┤
│ 🔥 3-day streak             │
├─────────────────────────────┤
│     TODAY'S GLUCOSE          │
│         —                    │  ← em dash placeholder
│   No meals logged yet        │  ← neutral pill
│                              │
│   ╭──flat dashed line───╮    │  ← empty curve placeholder
│   ╰─6am──12pm──6pm─────╯    │
├─────────────────────────────┤
│         🦎                   │
│   What's for breakfast?      │  ← Georgia serif, 18px
│   Scan or search your first  │
│   meal and I'll track your   │
│   glucose all day.           │
│                              │
│   [ Scan a meal ]            │  ← btn-gradient (rose)
└─────────────────────────────┘
```

## Sections Removed

| Removed | Reason |
|---------|--------|
| Greeting ("Good morning...") | Streak bar replaces the warm-open role. Score hero is more useful. |
| Axolotl tip card | Moved to post-scan context where tips are actionable |
| Daily insight card | Redundant with the mood phrase on the score hero |
| AI suggestion button | Moves to post-scan flow / future feature |
| Trial banner | Can overlay on top of header when needed, not a dashboard section |

## Component Mapping

### New: `GlucoseScoreHero`
- Props: `score: number | null`, `mood: string`, `trafficLight: TrafficLight`
- Score from daily average GL (computed from entries)
- Mood phrases:
  - Green: "Smooth sailing", "Looking great", "Steady as she goes"
  - Yellow: "Not bad — room to improve", "Watch the next one"
  - Red: "Rough day — tomorrow's a fresh start"
- When `score === null`: shows em dash + "No meals logged yet"

### Modified: `DailyGlucoseCurve` (already exists)
- File: `src/components/DailyGlucoseCurve.tsx` — modify, NOT create new
- Remove the score/status display from this component (moved to GlucoseScoreHero)
- Keep: the SVG curve, food dots, time axis labels
- Add: food dots colored by individual entry traffic light
- Time range: 6am–10pm (existing default), dynamically scales to data
- Empty state: flat dashed line with time labels
- 1 meal: single dot on timeline, no curve (not enough points for spline)

### New: `MealTimeline`
- Props: `entries: FoodLogEntry[]`, `onRemove: (id) => void`
- Vertical timeline with colored dots (12px, traffic light fill)
- Each entry: time, food name (truncate with ellipsis at 1 line), GL badge, inline macros
- Null macros: show dash for missing values, hide GL badge if glycemic_load is null
- Yellow/red entries: left border using `border-l-3` with `border-tl-yellow-fill` or `border-tl-red-fill`
- Swipe-to-delete: preserved from existing FoodLogList (keep `onRemove` callback)
- Tapping entry: no detail view navigation (no detail screen exists yet — defer)
- Loading state: shimmer placeholder matching timeline layout

### Modified: `DashboardScreen`
- Remove: greeting, axolotl tip, daily insight, AI button, SuggestionSheet import
- Remove: date navigation (DateNav) — dashboard always shows today
- Add: GlucoseScoreHero, modified DailyGlucoseCurve, MealTimeline
- Keep: glass header, streak badge, disclaimer, PaywallScreen (triggered from settings, not dashboard)
- Keep: TrialBanner as overlay on header when subscription is in trial period
- Layout: flex column, header + streak = flex-shrink-0, rest = overflow-y-auto with pb-24
- Loading state: spinner centered in scroll area (existing pattern)

### Existing: Streak badge
- Already exists, just repositioned below header

## Score Calculation

The hero score is the **average glycemic load** (unitless, not mg/dL):
- `score = sum(entry.glycemic_load) / entries.length` (skip entries where `glycemic_load` is null)
- Display: just the number, no unit suffix. E.g., "12" not "12 mg/dL"
- Traffic light: use existing `getPersonalizedTrafficLight(score, thresholds)`
- If no entries or all GL values are null: `null` → shows em dash
- If 1 entry: show that entry's GL as the score (valid — it's the day's only data point)
- Type: `averageGL: number | null` added to `DailyTotals` in `useDailyLog.ts`

## Mood Phrase Selection

Select based on traffic light + time of day:
- Morning (before noon): "breakfast"-flavored phrases
- Afternoon/evening: general phrases
- Pick deterministically: `phrases[entries.length % phrases.length]` so it changes as meals are added but is stable between renders
- All phrases must have i18n keys in the translation system (English + Spanish)

## Design System Alignment

All new components use existing DESIGN.md tokens:
- Score number: `text-display` (56px, 800wt)
- Section labels: `text-label` (11px, 600wt, uppercase, tracking-wide)
- Food names: `text-body` with `font-medium`
- Macros: `text-xs text-text-tertiary`
- Cards: `surface-card` (bg-card, rounded-2xl, shadow-sm)
- Timeline dots: traffic light fill colors (sacred usage)
- Mood pill: traffic light background with matching text
- Streak bar: existing `streak-glow` pattern

## Responsive & Accessibility

- Touch targets: all tappable timeline entries ≥ 44px min-height
- Timeline dots: 12px with 2px border (visible at small sizes)
- Score number: sufficient contrast on warm paper background
- Curve: purely decorative enhancement — score + mood phrase carry the information for screen readers
- `aria-label` on score hero: "Today's average glucose load is 82, status: smooth sailing"

## Files to Modify

1. `src/screens/DashboardScreen.tsx` — restructure to new layout
2. `src/components/GlucoseScoreHero.tsx` — new component
3. `src/components/DailyGlucoseCurve.tsx` — modify existing (remove score display, add food dots)
4. `src/components/MealTimeline.tsx` — new component
5. `src/hooks/useDailyLog.ts` — add `averageGL: number | null` to DailyTotals
6. `src/i18n/` — add mood phrase translation keys (en + es)

## NOT in Scope

- Barcode scanner redesign
- Result card (FoodResultCard/EditableMealCard) redesign — separate spec
- Loti mascot custom illustration — using emoji for now
- Dark mode — follows existing dark mode tokens when added
- Weekly/monthly dashboard views — future feature
- Push notifications — separate feature
