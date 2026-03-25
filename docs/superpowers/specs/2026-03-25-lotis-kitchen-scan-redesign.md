# Loti's Kitchen — Scan Flow Redesign

## Problem

The current scan screen is a dark camera-style UI that feels generic and disconnected. On web, there's no live viewfinder — users see a dark screen with corner brackets and must press a button to open a file picker. On native, the system camera launches but the app's UI adds no personality. The analysis wait is a plain progress bar with hardcoded Spanish text. The result appears as an abrupt full-screen swap.

The scan is the most-used interaction in the app. It should feel like Loti's personality, not a utility.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Energy | Playful & curious (Duolingo-style) | Personality differentiates from MyFitnessPal; matches axolotl brand |
| Visual approach | Light mode "Loti's Kitchen" | Dark camera UI fights reality on web; warm light screen embraces the constraint |
| Analysis feedback | Streaming ingredient chips + one Loti line | Reduces perceived wait time; sets up the editable ingredient list |
| Result transition | Bottom sheet slide-up over photo | Native mobile pattern; photo stays visible for context |
| Mascot representation | Axolotl emoji for now | Custom illustration is a separate effort |

## Architecture

### Files Changed

- `src/screens/ScanScreen.tsx` — Complete rewrite of the camera/capture view (the "Camera / Capture view" section). Result view gets bottom-sheet transition wrapper.
- `src/hooks/useCamera.ts` — No changes needed. `capture()` and `uploadFromGallery()` already work correctly.
- `src/hooks/useWaterfallSearch.ts` — May need a streaming callback to emit ingredient names as they're identified (for chip animation). If the API doesn't support streaming, simulate by parsing the final response and staggering chip reveals.
- `src/lib/i18n.ts` — Add translation keys for all new Loti copy.

### No New Dependencies

All animations use CSS transitions/keyframes. Bottom sheet uses CSS `transform: translateY()`. No animation library needed.

## Screens

### Screen 1: Loti's Kitchen (Entry)

Replaces the dark camera view. Light background (`bg-surface`), centered layout.

**Layout (top to bottom):**
1. **Close button** (top-left) — navigates back to dashboard
2. **Loti greeting** (centered) — axolotl emoji (64px) + "What are we eating?" (title weight) + "Show Loti your plate" (subtitle, muted)
3. **Two action cards** (side by side, equal width):
   - **Take Photo** — camera icon, "Take a photo" label, "Point at your plate" subtitle. Calls `camera.capture()`.
   - **From Gallery** — image icon, "Choose from gallery" label, "Pick a food pic" subtitle. Calls `camera.uploadFromGallery()`.
4. **Bottom hint** — "Or type what you ate" link → navigates to `/text`

**Behavior:**
- On native Capacitor: do NOT auto-launch camera. Let the user see the Kitchen screen and tap. The personality IS the point — skipping it defeats the redesign. If users want speed, they'll tap immediately (one tap, not zero).
- On web: user taps one of the two cards.
- Cards have subtle hover/active states (scale down on press).
- All text uses `t()` translation keys.
- **Camera permission denied:** If `camera.capture()` fails with a permission error, show a gentle inline message below the action cards: "Loti needs camera access to scan your food" with a "Open Settings" button (on native) or just the message (on web, where the browser handles permissions). The Kitchen screen stays visible — no navigation away.
- **Gallery picker cancelled:** If the user opens the gallery picker and cancels without selecting, return silently to the Kitchen screen. No error, no state change. `camera.base64` remains null.
- **Photo processing delay:** Between photo selection and analysis start (base64 encoding of large images), show the photo immediately with a subtle shimmer/pulse overlay to indicate processing. This uses the `camera.loading` state that already exists.

### Screen 2: Analysis (Photo Captured)

Triggers when `camera.base64` is set and `search.state === 'loading'`.

**Layout:**
1. **Photo** — full-width rounded image of the captured food (not the tiny 96px thumbnail). Uses `object-fit: cover` with `aspect-ratio: 4/3` to normalize all photo shapes. Max height ~40vh. On small screens (<667px viewport), photo shrinks to ~30vh to leave room for the analysis card.
2. **Loti analysis card** (below photo) — white card with:
   - Loti emoji (28px) + single line: rotating messages like "Let me take a look..." → "Hmm, interesting..." → "Finding ingredients..."
   - Below the text: ingredient chips area. Chips appear one-by-one with a fade+slide-in animation as analysis progresses.
   - Each chip shows: ingredient name + checkmark or spinner. Green background for identified, gray+spinner for "still looking..."
3. **Progress indicator** — thin bar at the bottom of the analysis card (not a percentage — just a smooth indeterminate-to-determinate animation).

**Chip streaming logic:**
- The API returns all results at once (not streamed). To create the streaming feel:
  1. When results arrive, don't show them all immediately.
  2. Stagger chip reveals: first chip at 0ms, second at 400ms, third at 800ms, etc.
  3. Cap stagger at 5 chips. If >5 ingredients, show first 5 staggered, then reveal the rest as a batch with a "+N more" chip.
  4. During the stagger, each chip appears with a CSS animation (fade in + slide up from 8px below).
  5. After all chips are shown, pause 500ms, then trigger the bottom sheet transition.
  6. **Zero results:** If analysis succeeds but returns 0 results, skip chips entirely and show the error state (same as analysis failure). The message: "I couldn't identify any food in this photo."

**Loti message rotation:** Messages cycle every 2.5 seconds (matching the existing `useScanPhase` pattern). Crossfade between messages.

**Loti messages (i18n keys):**
- `scan.analyzing1`: "Let me take a look..."
- `scan.analyzing2`: "Hmm, interesting..."
- `scan.analyzing3`: "Finding the ingredients..."
- `scan.analyzing4`: "Almost there!"

### Screen 3: Result (Bottom Sheet)

Triggers after chip stagger completes.

**Transition:**
1. Photo stays in place (or shrinks slightly to ~60% height).
2. A white bottom sheet slides up from below the viewport with `transform: translateY(100%)` → `translateY(0)`. CSS transition, 400ms ease-out.
3. The bottom sheet contains the existing result view: `FoodResultCard` (single item), `EditableMealCard` (composite), or `FoodResultList` (multi-item).
4. Sheet is scrollable independently. Has a small drag handle indicator at the top (cosmetic only — no drag-to-dismiss).
5. Action buttons ("Log", "Search another") are pinned at the bottom of the sheet, not the screen.

**Bottom sheet height:** starts at ~65% of viewport. Content scrolls within it.

### Error State

Covers both analysis failure AND zero-result success. Shown on the analysis screen (not a separate screen):
- Loti emoji (48px)
- "Hmm, I couldn't figure that out" (or "I couldn't identify any food in this photo" for zero results)
- "Try a clearer photo or type what you ate"
- Two buttons:
  - "Try again" — resets camera state and returns to the Kitchen screen (Screen 1). Does NOT re-launch the system camera directly.
  - "Type instead" — navigates to `/text`

## i18n

All hardcoded Spanish strings in the current ScanScreen must be replaced with `t()` calls. New keys needed:

```
scan.greeting: "What are we eating?"
scan.greetingSub: "Show Loti your plate"
scan.takePhoto: "Take a photo"
scan.takePhotoSub: "Point at your plate"
scan.fromGallery: "Choose from gallery"
scan.fromGallerySub: "Pick a food pic"
scan.typeInstead: "Or type what you ate"
scan.analyzing1: "Let me take a look..."
scan.analyzing2: "Hmm, interesting..."
scan.analyzing3: "Finding the ingredients..."
scan.analyzing4: "Almost there!"
scan.errorTitle: "Hmm, I couldn't figure that out"
scan.errorNoFood: "I couldn't identify any food in this photo"
scan.errorSub: "Try a clearer photo or type what you ate"
scan.tryAgain: "Try again"
scan.errorTypeInstead: "Type instead"
scan.permissionNeeded: "Loti needs camera access to scan your food"
scan.openSettings: "Open Settings"
```

### Spanish Translations

```
scan.greeting: "Que vamos a comer?"
scan.greetingSub: "Ensenale tu plato a Loti"
scan.takePhoto: "Tomar foto"
scan.takePhotoSub: "Apunta a tu plato"
scan.fromGallery: "Elegir de galeria"
scan.fromGallerySub: "Selecciona una foto"
scan.typeInstead: "O escribe lo que comiste"
scan.analyzing1: "Dejame ver..."
scan.analyzing2: "Hmm, interesante..."
scan.analyzing3: "Buscando los ingredientes..."
scan.analyzing4: "Ya casi!"
scan.errorTitle: "Hmm, no pude descifrar eso"
scan.errorNoFood: "No pude identificar comida en esta foto"
scan.errorSub: "Intenta con una foto mas clara o escribe el alimento"
scan.tryAgain: "Intentar de nuevo"
scan.errorTypeInstead: "Escribir alimento"
scan.permissionNeeded: "Loti necesita acceso a la camara para escanear tu comida"
scan.openSettings: "Abrir Ajustes"
```

## Animations

All CSS, no JS animation libraries:

1. **Chip fade-in**: `@keyframes chipIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }` — 300ms ease-out
2. **Bottom sheet slide**: `transform: translateY(100%)` → `translateY(0)` — 400ms ease-out
3. **Loti message crossfade**: opacity transition between rotating messages — 200ms
4. **Progress bar**: width transition with ease-out (existing pattern, keep it)
5. **Card press**: `active:scale-95` on the action cards — instant feedback

## Accessibility

- **Chip reveals:** Wrap the chips area in an `aria-live="polite"` region so screen readers announce new ingredients as they appear.
- **Bottom sheet:** When the sheet slides up, move focus to the sheet's first heading. Add `role="dialog"` and `aria-label="Food analysis results"`.
- **Loti messages:** The rotating analysis messages should be in an `aria-live="polite"` region (low priority — screen reader will announce when idle).
- **Action cards:** Each card is a `<button>` with descriptive `aria-label` (e.g., "Take a photo to scan food").
- **Touch targets:** All buttons meet 44px minimum.

## Not In Scope

- Custom axolotl illustration/mascot art (using emoji for now)
- Barcode scanner redesign (separate flow, untouched)
- FoodResultCard or EditableMealCard visual changes (result cards stay as-is)
- Live camera viewfinder (not possible on web; native uses system camera)
- Drag-to-dismiss on the bottom sheet (cosmetic handle only)
- Dark mode variant of the Kitchen screen
