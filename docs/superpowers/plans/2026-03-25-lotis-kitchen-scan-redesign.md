# Loti's Kitchen Scan Flow Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark camera-style scan screen with a warm, playful "Loti's Kitchen" interface featuring streaming ingredient chips during analysis and a bottom-sheet result transition.

**Architecture:** Rewrite `ScanScreen.tsx` as three visual states (Kitchen entry, Analysis with photo+chips, Bottom sheet result) driven by existing `useCamera` and `useWaterfallSearch` hooks. Add i18n keys for all copy. Add CSS keyframes for chip and sheet animations. No new dependencies.

**Tech Stack:** React, TypeScript, Tailwind CSS, Capacitor (camera)

**Spec:** `docs/superpowers/specs/2026-03-25-lotis-kitchen-scan-redesign.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/screens/ScanScreen.tsx` | Rewrite | Three-state scan flow: Kitchen, Analysis, Result sheet |
| `src/lib/i18n.tsx` | Modify | Add `scan.*` translation keys (EN + ES) |
| `src/index.css` | Modify | Add `chipIn` and `sheetUp` keyframes + utility classes |

No new files. No new dependencies. The `useCamera` hook and `useWaterfallSearch` hook are unchanged.

---

### Task 1: Add i18n keys

**Files:**
- Modify: `src/lib/i18n.tsx`

- [ ] **Step 1: Add Spanish scan keys to the `es` translations object**

Find the `// Scan menu` section in the `es` translations (around line 46). Add new keys after the existing scan keys:

```typescript
    // Scan - Loti's Kitchen
    'scan.greeting': '¿Qué vamos a comer?',
    'scan.greetingSub': 'Enséñale tu plato a Loti',
    'scan.takePhoto': 'Tomar foto',
    'scan.takePhotoSub': 'Apunta a tu plato',
    'scan.fromGallery': 'Elegir de galería',
    'scan.fromGallerySub': 'Selecciona una foto',
    'scan.typeInstead': 'O escribe lo que comiste',
    'scan.analyzing1': 'Déjame ver...',
    'scan.analyzing2': 'Hmm, interesante...',
    'scan.analyzing3': 'Buscando los ingredientes...',
    'scan.analyzing4': '¡Ya casi!',
    'scan.errorTitle': 'Hmm, no pude descifrar eso',
    'scan.errorNoFood': 'No pude identificar comida en esta foto',
    'scan.errorSub': 'Intenta con una foto más clara o escribe el alimento',
    'scan.tryAgain': 'Intentar de nuevo',
    'scan.errorTypeInstead': 'Escribir alimento',
    'scan.permissionNeeded': 'Loti necesita acceso a la cámara para escanear tu comida',
    'scan.openSettings': 'Abrir Ajustes',
    'scan.moreIngredients': '+{{count}} más',
```

- [ ] **Step 2: Add English scan keys to the `en` translations object**

Find the matching section in `en` translations. Add:

```typescript
    // Scan - Loti's Kitchen
    'scan.greeting': 'What are we eating?',
    'scan.greetingSub': 'Show Loti your plate',
    'scan.takePhoto': 'Take a photo',
    'scan.takePhotoSub': 'Point at your plate',
    'scan.fromGallery': 'Choose from gallery',
    'scan.fromGallerySub': 'Pick a food pic',
    'scan.typeInstead': 'Or type what you ate',
    'scan.analyzing1': 'Let me take a look...',
    'scan.analyzing2': 'Hmm, interesting...',
    'scan.analyzing3': 'Finding the ingredients...',
    'scan.analyzing4': 'Almost there!',
    'scan.errorTitle': "Hmm, I couldn't figure that out",
    'scan.errorNoFood': "I couldn't identify any food in this photo",
    'scan.errorSub': 'Try a clearer photo or type what you ate',
    'scan.tryAgain': 'Try again',
    'scan.errorTypeInstead': 'Type instead',
    'scan.permissionNeeded': 'Loti needs camera access to scan your food',
    'scan.openSettings': 'Open Settings',
    'scan.moreIngredients': '+{{count}} more',
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n.tsx
git commit -m "feat(i18n): add Loti's Kitchen scan screen translation keys"
```

---

### Task 2: Add CSS animations

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add keyframes and utility classes after the existing `@keyframes` block (after the `axolotl-wobble` animation)**

```css
/* Loti's Kitchen — chip reveal animation */
@keyframes chipIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-chip-in {
  animation: chipIn 300ms ease-out forwards;
  opacity: 0; /* start hidden, animation fills forward */
}

/* Loti's Kitchen — bottom sheet slide up */
@keyframes sheetUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-sheet-up {
  animation: sheetUp 400ms ease-out forwards;
}

/* Loti message crossfade */
.loti-message-enter {
  animation: fadeIn 200ms ease-out;
}
```

- [ ] **Step 2: Verify the app still loads (no CSS syntax errors)**

Run: `npx tsc --noEmit`
Expected: no errors (CSS doesn't affect TSC, but confirms nothing else broke)

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(css): add chipIn, sheetUp animations for Loti's Kitchen"
```

---

### Task 3: Rewrite ScanScreen — Kitchen entry view

Replace the dark camera capture view (lines 240-384) with the light Loti's Kitchen screen.

**Files:**
- Modify: `src/screens/ScanScreen.tsx`

- [ ] **Step 1: Remove the auto-launch effect and old SCAN_PHASES constant**

Delete the `hasLaunched` ref and the `useEffect` that auto-launches the camera on native (lines 72-79). Delete the `SCAN_PHASES` array (lines 38-43) and the `useScanPhase` hook (lines 45-53) — they'll be replaced with i18n keys.

- [ ] **Step 2: Add a new `useLotiPhase` hook at the top of the file**

Replace the old `useScanPhase` with one that uses i18n keys:

```typescript
const LOTI_PHASES = ['scan.analyzing1', 'scan.analyzing2', 'scan.analyzing3', 'scan.analyzing4'] as const

function useLotiPhase(active: boolean) {
  const [phase, setPhase] = useState(0)
  const { t } = useLanguage()
  useEffect(() => {
    if (!active) { setPhase(0); return }
    const timer = setInterval(() => setPhase(p => (p + 1) % LOTI_PHASES.length), 2500)
    return () => clearInterval(timer)
  }, [active])
  return t(LOTI_PHASES[phase])
}
```

Update line 65 from `useScanPhase(isAnalyzing)` to `useLotiPhase(isAnalyzing)`.

- [ ] **Step 3: Replace the camera/capture view return block (the last return statement, starting at the `// ─── Camera / Capture view` comment) with the Kitchen entry screen**

```tsx
  // ─── Loti's Kitchen (entry) ─────────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      {/* Close button */}
      <div className="flex items-center px-4 pt-4 flex-shrink-0">
        <button
          onClick={() => { camera.reset(); search.reset(); navigate('/') }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Loti greeting */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 gap-2">
        <div className="text-[64px] leading-none mb-2">🦎</div>
        <h1 className="text-2xl font-bold text-on-surface">{t('scan.greeting')}</h1>
        <p className="text-sm text-on-surface-variant">{t('scan.greetingSub')}</p>

        {/* Action cards */}
        <div className="flex gap-3 mt-8 w-full max-w-xs">
          <button
            onClick={() => camera.capture()}
            disabled={camera.loading}
            className="flex-1 flex flex-col items-center gap-2 rounded-2xl bg-card p-5 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
            aria-label={t('scan.takePhoto')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-sm font-semibold text-on-surface">{t('scan.takePhoto')}</span>
            <span className="text-xs text-on-surface-variant">{t('scan.takePhotoSub')}</span>
          </button>

          <button
            onClick={() => camera.uploadFromGallery()}
            disabled={camera.loading}
            className="flex-1 flex flex-col items-center gap-2 rounded-2xl bg-card p-5 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
            aria-label={t('scan.fromGallery')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-sm font-semibold text-on-surface">{t('scan.fromGallery')}</span>
            <span className="text-xs text-on-surface-variant">{t('scan.fromGallerySub')}</span>
          </button>
        </div>

        {/* Camera error / permission denied */}
        {camera.error && (
          <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-center">
            <p className="text-sm text-error">{t('scan.permissionNeeded')}</p>
            {/* Show "Open Settings" on native only */}
            {!!(window as any).Capacitor?.isNativePlatform?.() && (
              <button
                onClick={() => {
                  // Capacitor App plugin can open settings
                  import('@capacitor/app').then(m => m.App.openUrl({ url: 'app-settings:' })).catch(() => {})
                }}
                className="mt-2 text-sm font-medium text-primary min-h-[44px]"
              >
                {t('scan.openSettings')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="pb-8 text-center flex-shrink-0">
        <button
          onClick={() => navigate('/text')}
          className="text-sm text-primary font-medium min-h-[44px]"
        >
          {t('scan.typeInstead')}
        </button>
      </div>
    </div>
  )
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Verify visually in the preview server**

Open http://localhost:5173/loti/scan. Expected: light background, Loti emoji, "What are we eating?", two action cards, "Or type what you ate" link at bottom.

- [ ] **Step 6: Commit**

```bash
git add src/screens/ScanScreen.tsx
git commit -m "feat(scan): replace dark camera UI with Loti's Kitchen entry screen"
```

---

### Task 4: Analysis screen with streaming chips

Add the analysis view that shows when a photo is captured and analysis is running.

**Files:**
- Modify: `src/screens/ScanScreen.tsx`

- [ ] **Step 1: Add a `useChipStagger` hook for the streaming chip reveal**

Add this hook at the top of the file (after `useLotiPhase`):

```typescript
/** Stagger-reveal chips when results arrive */
function useChipStagger(results: FoodSearchResult[], isLoading: boolean) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [staggerDone, setStaggerDone] = useState(false)

  useEffect(() => {
    // Reset when loading starts
    if (isLoading) {
      setVisibleCount(0)
      setStaggerDone(false)
      return
    }

    // When results arrive, stagger reveals
    if (results.length === 0) return

    const maxStagger = Math.min(results.length, 5)
    let count = 0

    const timer = setInterval(() => {
      count++
      if (count >= maxStagger) {
        clearInterval(timer)
        // Show all remaining at once
        setVisibleCount(results.length)
        // Pause then signal done
        setTimeout(() => setStaggerDone(true), 500)
      } else {
        setVisibleCount(count)
      }
    }, 400)

    // Show first chip immediately
    setVisibleCount(1)

    return () => clearInterval(timer)
  }, [results, isLoading])

  return { visibleCount, staggerDone }
}
```

- [ ] **Step 2: Wire up the hook in the ScanScreen component**

After the existing `const scanPhase = useLotiPhase(isAnalyzing)` line, add:

```typescript
  const chipResults = search.state === 'done' ? search.results : []
  const { visibleCount, staggerDone } = useChipStagger(chipResults, isAnalyzing)
  const [showSheet, setShowSheet] = useState(false)

  // Trigger bottom sheet when chip stagger completes
  useEffect(() => {
    if (staggerDone && search.results.length > 0) {
      setShowSheet(true)
    }
  }, [staggerDone, search.results.length])
```

- [ ] **Step 3: Add the analysis view between the error check and the kitchen entry**

Insert this block before the `// ─── Loti's Kitchen` comment. This renders when a photo exists but the sheet hasn't opened yet:

```tsx
  // ─── Analysis view (photo captured, analyzing or staggering chips) ──
  if ((camera.base64 || camera.previewUrl) && !showSheet) {
    const isError = search.state === 'error' || (search.state === 'done' && search.results.length === 0)

    return (
      <div className="flex flex-1 flex-col bg-surface min-h-0">
        {/* Close button */}
        <div className="flex items-center px-4 pt-4 flex-shrink-0">
          <button
            onClick={handleScanAnother}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photo */}
        <div className="px-5 pt-2 flex-shrink-0">
          {camera.previewUrl && (
            <img
              src={camera.previewUrl}
              alt="Scanned food"
              className="w-full rounded-2xl object-cover shadow-sm"
              style={{ aspectRatio: '4/3', maxHeight: '40vh' }}
            />
          )}
        </div>

        {/* Loti analysis card */}
        <div className="px-5 pt-4 flex-1">
          {isError ? (
            /* Error state */
            <div className="rounded-2xl bg-card p-6 shadow-sm text-center">
              <div className="text-[48px] leading-none mb-3">🦎</div>
              <p className="text-base font-semibold text-on-surface">
                {t(search.state === 'error' ? 'scan.errorTitle' : 'scan.errorNoFood')}
              </p>
              <p className="text-sm text-on-surface-variant mt-1">{t('scan.errorSub')}</p>
              <div className="flex gap-3 mt-4 justify-center">
                <button
                  onClick={handleScanAnother}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-on-surface-variant min-h-[44px]"
                >
                  {t('scan.tryAgain')}
                </button>
                <button
                  onClick={() => navigate('/text')}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white min-h-[44px]"
                >
                  {t('scan.errorTypeInstead')}
                </button>
              </div>
            </div>
          ) : (
            /* Analysis + chips */
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="text-[28px] leading-none">🦎</div>
                <div className="flex-1 min-w-0" aria-live="polite">
                  <p className="text-sm font-semibold text-on-surface loti-message-enter" key={scanPhase}>
                    {scanPhase}
                  </p>
                </div>
              </div>

              {/* Ingredient chips */}
              <div className="flex flex-wrap gap-2 mt-3" aria-live="polite">
                {chipResults.slice(0, visibleCount).map((r, i) => {
                  const name = r.name_en || r.name_es || '...'
                  return (
                    <span
                      key={`${name}-${i}`}
                      className="animate-chip-in inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium bg-tl-green-fill/15 text-tl-green-fill border border-tl-green-fill/30"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {name} <span className="text-[10px]">✓</span>
                    </span>
                  )
                })}
                {visibleCount < chipResults.length && visibleCount > 0 && (
                  <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-surface text-on-surface-variant border border-border">
                    {t('scan.moreIngredients').replace('{{count}}', String(chipResults.length - visibleCount))}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {isAnalyzing && (
                <div className="mt-3 h-1 w-full rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
```

- [ ] **Step 4: Reset `showSheet` in `handleScanAnother`**

Update `handleScanAnother` to also reset `showSheet`:

```typescript
  const handleScanAnother = () => {
    camera.reset()
    search.reset()
    setSelected(null)
    setShowSheet(false)
  }
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Test the analysis flow visually**

In preview, go to /scan, tap "Choose from gallery", select a food photo. Expected: photo appears full-width, Loti analysis card with rotating messages and progress bar. When results arrive, chips appear one-by-one with fade-in animation.

- [ ] **Step 7: Commit**

```bash
git add src/screens/ScanScreen.tsx
git commit -m "feat(scan): add analysis screen with streaming ingredient chips"
```

---

### Task 5: Bottom sheet result transition

Wrap the existing result view in a bottom sheet that slides up over the photo.

**Files:**
- Modify: `src/screens/ScanScreen.tsx`

- [ ] **Step 1: Replace the existing result view block**

Replace the `// ─── Result view` section (the first `if` block that checks `search.state === 'done'`) with a bottom sheet overlay:

```tsx
  // ─── Result view (bottom sheet over photo) ──────────────────
  if (showSheet && search.state === 'done' && search.results.length > 0) {
    const display = selected ?? search.topResult!
    const composite = isCompositeResult(search.results)
    const multiple = search.results.length > 1 && !composite

    return (
      <div className="flex flex-1 flex-col bg-surface min-h-0 relative">
        {/* Photo background (shrunk) */}
        {camera.previewUrl && (
          <div className="px-5 pt-4 flex-shrink-0">
            <img
              src={camera.previewUrl}
              alt="Scanned food"
              className="w-full rounded-2xl object-cover shadow-sm"
              style={{ aspectRatio: '4/3', maxHeight: '25vh' }}
            />
          </div>
        )}

        {/* Bottom sheet */}
        <div
          className="flex-1 flex flex-col bg-card rounded-t-3xl shadow-lg animate-sheet-up min-h-0 -mt-4 relative z-10"
          role="dialog"
          aria-label={t('text.analysis')}
        >
          {/* Drag handle (cosmetic) */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Scrollable result content */}
          <div className="flex-1 overflow-y-auto px-5 pb-24">
            {composite ? (
              <EditableMealCard
                total={search.results[0]}
                initialComponents={search.results.slice(1)}
                onLog={handleLogComposite}
              />
            ) : multiple ? (
              <>
                <FoodResultList
                  results={search.results}
                  onSelect={setSelected}
                  selectedIndex={selected ? search.results.indexOf(selected) : 0}
                />
                {selected && <FoodResultCard result={selected} />}
              </>
            ) : (
              <FoodResultCard result={display} />
            )}

            <SearchMeta source={search.source} cached={search.cached} latencyMs={search.latencyMs} />
          </div>

          {/* Action buttons pinned at bottom of sheet */}
          {!composite && (
            <div className="flex gap-3 p-4 border-t border-border bg-card flex-shrink-0">
              <button
                onClick={handleScanAnother}
                className="flex-1 ghost-border rounded-full px-4 py-3 text-body font-medium text-on-surface-variant hover:bg-surface-container-high min-h-[48px]"
              >
                {t('text.searchAnother')}
              </button>
              {multiple ? (
                <button
                  onClick={selected ? handleLog : handleLogAll}
                  className="flex-1 btn-gradient min-h-[48px]"
                >
                  {selected ? t('text.logSelected') : t('text.logAll')}
                </button>
              ) : (
                <button
                  onClick={handleLog}
                  className="flex-1 btn-gradient min-h-[48px]"
                >
                  {t('text.log')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
```

- [ ] **Step 2: Remove the old error view block**

Delete the entire `// ─── Error` section (the `if (search.state === 'error')` block). Error handling is now inside the analysis screen (Task 4, Step 3).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Test the full flow visually**

In preview: tap gallery → select photo → see analysis with chips → bottom sheet slides up with result card. Verify: photo shrinks to top, sheet has drag handle, content scrolls, action buttons pinned.

- [ ] **Step 5: Commit**

```bash
git add src/screens/ScanScreen.tsx
git commit -m "feat(scan): add bottom sheet result transition over photo"
```

---

### Task 6: Replace remaining hardcoded Spanish in result header

**Files:**
- Modify: `src/screens/ScanScreen.tsx`

- [ ] **Step 1: Check for any remaining hardcoded strings**

Search for any Spanish text still in ScanScreen.tsx. The result view header had "Análisis de Alimento" — this should now be inside the sheet. Verify all visible text uses `t()`.

Grep: `grep -n "Análisis\|Escaneo\|Atrás\|Reintentar\|Escribir\|Toma una\|Procesando\|Cerrar\|Escanear" src/screens/ScanScreen.tsx`

Expected: zero matches.

- [ ] **Step 2: If any remain, replace with `t()` calls**

- [ ] **Step 3: Commit if changes were needed**

```bash
git add src/screens/ScanScreen.tsx
git commit -m "fix(i18n): remove remaining hardcoded Spanish from ScanScreen"
```

---

### Task 7: Verify and build

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Test in preview — full scan flow**

1. Open /scan — see Kitchen entry with Loti greeting
2. Tap "Choose from gallery" → select photo
3. See analysis screen: photo, Loti message rotating, progress bar
4. When results arrive: chips fade in one-by-one
5. After chips: bottom sheet slides up with result card
6. Content scrolls in sheet, action buttons pinned at bottom
7. Tap "Search another" → back to Kitchen

- [ ] **Step 3: Test error flow**

1. Upload a non-food image (or trigger an error)
2. See error state with Loti, friendly message, two buttons
3. Tap "Try again" → back to Kitchen
4. Tap "Type instead" → navigates to /text

- [ ] **Step 4: Test language toggle**

Switch to English in settings. Return to /scan. All text should be in English.

- [ ] **Step 5: Build for production**

Run: `CAPACITOR_BUILD=true npm run build`
Expected: build succeeds

- [ ] **Step 6: Sync to iOS**

Run: `npx cap sync ios`
Expected: sync succeeds

- [ ] **Step 7: Commit build artifacts and push**

```bash
git push origin main
```
