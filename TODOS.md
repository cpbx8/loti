# TODOs

## P2 — Third-party analytics SDK
**What:** Integrate PostHog, Mixpanel, or Amplitude for real analytics (funnels, cohorts, retention curves).
**Why:** Local SQLite analytics can't do cohort analysis or funnel visualization. Need to measure if retention features actually work.
**Pros:** Data-driven product decisions, A/B testing, retention measurement.
**Cons:** Privacy implications (need consent UI), dependency, potential cost.
**Context:** Local `analytics_events` table exists as of the retention PR. Export events from SQLite → analytics service, or switch to SDK that sends directly. PostHog has a generous free tier. Consider privacy-first options for LATAM market.
**Effort:** M (human) → S with CC (~30 min)
**Depends on:** Local analytics table (shipped).

## P3 — Dark mode
**What:** Add dark color tokens and `prefers-color-scheme: dark` media queries to the Editorial Wellness design system.
**Why:** Many diabetes patients check blood sugar and log meals at night. Dark mode reduces eye strain and battery usage.
**Pros:** Better nighttime UX, modern app expectation, OLED battery savings.
**Cons:** Need dark variants for ~30 color tokens, test all screens in both modes.
**Context:** Design system is in `src/index.css` with CSS custom properties. DESIGN.md documents all tokens. Dark variants should maintain the "warm paper" feel — not pure black backgrounds.
**Effort:** M (human) → S with CC (~30 min)
**Depends on:** Nothing.
