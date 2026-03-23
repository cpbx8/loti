# Loti Design System — Editorial Wellness

## Philosophy

Warm, editorial, never clinical. Loti feels like a thoughtful health magazine, not a medical device. Surfaces are warm paper tones, typography is confident but approachable, and the traffic light system is the only place where color carries semantic meaning.

## Colors

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

### Brand — Editorial Rose
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | #a62f4a | Primary actions, brand accent |
| `primary-container` | #c74861 | Gradient endpoint |
| `primary-light` | rgba(166,47,74,0.08) | Subtle primary backgrounds |
| `primary-lighter` | #d4667a | Gradient highlights, streak glow |
| `primary-dark` | #8a2640 | Pressed states |
| `on-primary` | #ffffff | Text on primary backgrounds |

### Surfaces — Warm Paper Stack
| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | #f9f9f7 | Page background |
| `surface-container-low` | #f4f4f2 | Section backgrounds |
| `surface-container-high` | #eeedeb | Hover, skeleton |
| `surface-container-highest` | #e8e7e5 | Dividers, borders |
| `surface-container-lowest` | #ffffff | Card backgrounds |

### Text — Never Pure Black
| Token | Hex | Usage |
|-------|-----|-------|
| `on-surface` | #1a1c1b | Primary text |
| `on-surface-variant` | #44474e | Secondary text, labels |
| `text-secondary` | #6b7280 | Tertiary text |
| `text-tertiary` | #9ca3af | Disabled, hints |

## Typography Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.text-display` | 56px | 800 | Glucose value (The Pulse) |
| `.text-headline` | 24px | 600 | Section titles (The Narrative) |
| `.text-title` | 18px | 600 | Card titles (The Context) |
| `.text-body` | 14px | 400 | Content text (The Insight) |
| `.text-label` | 11px | 600 | Data labels, uppercase (The Data) |

Font: Inter, system fallback stack.

## Component Patterns

### Glassmorphism Header (`.glass`)
Semi-transparent background with 16px backdrop blur. Used for sticky navigation.

### Gradient Button (`.btn-gradient`)
Linear gradient from `primary` → `primary-container` at 135°. White text, pill shape, subtle scale-on-press.

### Surface Cards (`.surface-card`, `.surface-section`)
No borders. Tonal layering only. Cards use `surface-container-lowest` (white), sections use `surface-container-low` (warm gray).

### Ghost Border (`.ghost-border`)
20% opacity outline. Only when a boundary is needed for clarity (rare).

## Streak Badge

Inline in the dashboard greeting area, next to the time-of-day greeting.

| State | Display | Style |
|-------|---------|-------|
| 0 days | "Start your streak!" | `text-body text-on-surface-variant` |
| 1-6 days | "🔥 N-day streak" | `text-body font-semibold text-primary` |
| 7+ days | "🎉 1 week!" | `text-body font-semibold` + `.streak-glow` |
| 30+ days | "🏆 1 month!" | `text-body font-semibold` + `.streak-glow` |

### Streak Glow (`.streak-glow`)
Rose gradient text (`primary` → `primary-lighter`) with a single 0.6s pulse animation. Respects `prefers-reduced-motion`.

## Daily Insight

Placed after the glucose curve, before the summary bar. One sentence summarizing today's eating.

| State | Message | Color |
|-------|---------|-------|
| Zero entries | Hidden | — |
| 1 entry | "Great start!" | `text-on-surface-variant` |
| All green | "All green today! 🌿" | `text-on-surface-variant` |
| Mixed (green > 0) | "N green foods today" | Green count in `tl-green-fill` |
| All red | "Try adding a green food" | `text-on-surface-variant` |

Container: `surface-section p-4 mx-5 mt-4`

## Accessibility

- All emoji-only elements require `aria-label` (streak badge, mascot)
- Touch targets: 48px minimum for interactive elements
- Color contrast: text passes WCAG AA against all surface tokens
- Animations respect `prefers-reduced-motion: reduce`
- Traffic light colors are supplemented with text labels (never color-only)

## Layout

- Max width: 430px (mobile-first, single column)
- Safe area insets via `env()` for iOS notch/home indicator
- Sticky glass header with z-10
- Tab bar fixed at bottom with 58px height
