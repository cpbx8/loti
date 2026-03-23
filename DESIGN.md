# Design System — Loti

## Product Context
- **What this is:** Food glycemic impact tracker with AI-powered scanning
- **Who it's for:** People managing blood sugar (healthy, prediabetic, type 2) in Mexico and LATAM
- **Space/industry:** Health & wellness, diabetes management, food tracking
- **Project type:** Mobile-first web app (Capacitor/iOS)

## Aesthetic Direction
- **Direction:** Editorial Wellness
- **Decoration level:** Intentional — warm paper textures, tonal layering, no borders
- **Mood:** A thoughtful health magazine, not a medical device. Warm, cultured, approachable. The visual language says "beautiful cookbook" not "lab report."
- **Reference sites:** mySugr (gamified but clinical), One Drop (clean but cold), Noom (warm but generic)

### Creative Risks (what makes Loti distinctive)
- **Serif display font (Fraunces):** No diabetes app uses serifs. Says "editorial, cultured, warm." Risk: some associate serifs with "old-fashioned." Gain: instantly recognizable.
- **Rose as primary (#a62f4a):** Health apps use blue/teal/green. Rose is unexpected, warm, culturally resonant with Mexican aesthetics. Risk: may read as "feminine." Gain: unforgettable brand color.

## Typography
- **Display/Hero:** Fraunces — warm variable serif with optical sizing. Used for section titles, headlines, brand moments. Evokes editorial sophistication without pretension.
- **Body:** DM Sans — geometric but warm sans-serif. Excellent readability at 14px. Clean without being cold.
- **UI/Labels:** DM Sans 600 uppercase with letter-spacing 0.05em
- **Data/Tables:** DM Sans with `font-variant-numeric: tabular-nums` — numbers align in columns for glucose data
- **Code:** Not applicable (consumer app)
- **Loading:** Google Fonts CDN
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
  ```
- **Scale:**

| Class | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `.text-display` | 56px / 3.5rem | 800 | 1.0 | Glucose value (The Pulse) |
| `.text-headline` | 24px / 1.5rem | 600 | 1.25 | Section titles — Fraunces (The Narrative) |
| `.text-title` | 18px / 1.125rem | 600 | 1.3 | Card titles — Fraunces (The Context) |
| `.text-body` | 14px / 0.875rem | 400 | 1.6 | Content text — DM Sans (The Insight) |
| `.text-label` | 11px / 0.6875rem | 600 | 1.4 | Data labels, uppercase — DM Sans (The Data) |

## Color
- **Approach:** Restrained — rose primary + warm neutrals. Color is rare and meaningful.

### Brand — Editorial Rose
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | #a62f4a | Primary actions, brand accent |
| `primary-container` | #c74861 | Gradient endpoint |
| `primary-light` | rgba(166,47,74,0.08) | Subtle primary backgrounds |
| `primary-lighter` | #d4667a | Gradient highlights, streak glow |
| `primary-dark` | #8a2640 | Pressed states |
| `on-primary` | #ffffff | Text on primary backgrounds |

### Traffic Light (Sacred — GI ratings only)
These colors are ONLY for glycemic impact classification. Never use them decoratively.

| Token | Hex | Usage |
|-------|-----|-------|
| `tl-green-bg` | #E8F6ED | Green card/badge background |
| `tl-green-fill` | #2ECC71 | Green icon, text highlight |
| `tl-green-accent` | #27AE60 | Green active/pressed |
| `tl-yellow-bg` | #FEF5E7 | Yellow card/badge background |
| `tl-yellow-fill` | #F39C12 | Yellow icon, text highlight |
| `tl-yellow-accent` | #E67E22 | Yellow active/pressed |
| `tl-red-bg` | #FDECEC | Red card/badge background |
| `tl-red-fill` | #E74C3C | Red icon, text highlight |
| `tl-red-accent` | #C0392B | Red active/pressed |

### Surfaces — Warm Paper Stack
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `surface` | #f9f9f7 | #1a1c1b | Page background |
| `surface-container-low` | #f4f4f2 | #222423 | Section backgrounds |
| `surface-container-high` | #eeedeb | #2a2c2b | Hover, skeleton |
| `surface-container-highest` | #e8e7e5 | #333534 | Dividers, borders |
| `surface-container-lowest` | #ffffff | #161817 | Card backgrounds |

### Text — Never Pure Black
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `on-surface` | #1a1c1b | #e8e7e5 | Primary text |
| `on-surface-variant` | #44474e | #a0a3aa | Secondary text |
| `text-secondary` | #6b7280 | #9ca3af | Tertiary text |
| `text-tertiary` | #9ca3af | #6b7280 | Disabled, hints |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `info` | #2196F3 | Informational alerts |
| `error` | #B71C1C | System errors (not food ratings) |
| `success` | #1565C0 | System success (not food ratings) |

### Dark Mode Strategy
- Surfaces become dark warm grays (never pure black)
- Reduce traffic light saturation by 10-20% for OLED comfort
- Traffic light backgrounds become rgba overlays at 12% opacity
- Primary rose keeps its saturation — it's the brand anchor
- Text flips to warm light grays

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| `2xs` | 2px | Hairline gaps |
| `xs` | 4px | Icon padding, inline gaps |
| `sm` | 8px | Tight padding, small gaps |
| `md` | 16px | Standard padding, card padding |
| `lg` | 24px | Section gaps, generous padding |
| `xl` | 32px | Section separation |
| `2xl` | 48px | Major section separation |
| `3xl` | 64px | Page-level separation |

## Layout
- **Approach:** Grid-disciplined — single column, mobile-first
- **Max content width:** 430px (centered with `margin: 0 auto`)
- **Safe area insets:** `env(safe-area-inset-*)` for iOS notch/home indicator
- **Border radius:**

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Small elements, badges |
| `md` | 8px | Inputs, small cards |
| `lg` | 12px | Icon containers |
| `xl` | 16px | Cards |
| `2xl` | 20px | Section containers |
| `full` | 9999px | Pills, buttons, avatars |

## Motion
- **Approach:** Minimal-functional + streak milestone glow
- **Easing:**
  - Enter: `ease-out` (elements arriving)
  - Exit: `ease-in` (elements leaving)
  - Move: `ease-in-out` (position changes)
  - Spring: `cubic-bezier(0.32, 0.72, 0, 1)` (slide-up sheets)
- **Duration:**
  - Micro: 50-100ms (button press, toggle)
  - Short: 150ms (hover, focus)
  - Medium: 300ms (sheet slide, fade)
  - Long: 600ms (streak glow pulse)
- **Special:** `.streak-glow` — rose gradient text with single 0.6s pulse. Respects `prefers-reduced-motion`.
- **Rule:** All animations respect `prefers-reduced-motion: reduce` — disable or reduce to instant.

## Component Patterns

### Glassmorphism Header (`.glass`)
Semi-transparent background with 16px backdrop blur. Used for sticky navigation.

### Gradient Button (`.btn-gradient`)
Linear gradient from `primary` → `primary-container` at 135deg. White text, pill shape, subtle scale-on-press.

### Surface Cards (`.surface-card`, `.surface-section`)
No borders. Tonal layering only. Cards use `surface-container-lowest` (white), sections use `surface-container-low` (warm gray).

### Ghost Border (`.ghost-border`)
20% opacity outline. Only when a boundary is needed for clarity (rare).

### Streak Badge
Inline in the dashboard greeting area, next to the time-of-day greeting.

| State | Display | Style |
|-------|---------|-------|
| 0 days | "Start your streak!" | `text-body text-on-surface-variant` |
| 1-6 days | "N-day streak" | `text-body font-semibold text-primary` |
| 7+ days | "1 week!" | `text-body font-semibold` + `.streak-glow` |
| 30+ days | "1 month!" | `text-body font-semibold` + `.streak-glow` |

### Daily Insight
Placed after the glucose curve, before the summary bar. One sentence summarizing today's eating.

| State | Message | Color |
|-------|---------|-------|
| Zero entries | Hidden | — |
| 1 entry | "Great start!" | `text-on-surface-variant` |
| All green | "All green today!" | `text-on-surface-variant` |
| Mixed (green > 0) | "N green foods today" | Green count in `tl-green-fill` |
| All red | "Try adding a green food" | `text-on-surface-variant` |

Container: `surface-section p-4 mx-5 mt-4`

## Accessibility
- All emoji-only elements require `aria-label` (streak badge, mascot)
- Touch targets: 48px minimum for interactive elements
- Color contrast: text passes WCAG AA against all surface tokens
- Animations respect `prefers-reduced-motion: reduce`
- Traffic light colors are supplemented with text labels (never color-only)
- Font sizes never below 11px

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Initial design system created | Documented existing Editorial Wellness system during /plan-design-review |
| 2026-03-22 | Upgraded typography to Fraunces + DM Sans | Inter is overused. Fraunces serif gives editorial personality no competitor has. DM Sans is warm geometric for body. /design-consultation research showed all diabetes apps converge on cold clinical sans-serifs. |
| 2026-03-22 | Added dark mode strategy | Dark warm grays (never pure black), reduced traffic light saturation, rgba overlays |
| 2026-03-22 | Added spacing scale + motion spec | 4px base unit, comfortable density. Minimal-functional motion with streak glow exception. |
