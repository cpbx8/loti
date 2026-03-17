import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useDailyLog } from '@/hooks/useDailyLog'
import { FoodResultCard, FoodResultList, CompositeResultCard, isCompositeResult, SearchMeta } from '@/components/FoodResultCard'
import type { FoodSearchResult } from '@/types/shared'

export default function TextInputScreen() {
  const navigate = useNavigate()
  const search = useWaterfallSearch()
  const { addEntry } = useDailyLog()
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (trimmed.length < 2) return
    setSelected(null)
    search.searchText(trimmed)
  }

  const handleLog = () => {
    const item = selected ?? search.topResult
    if (!item) return
    addEntry({
      food_name: item.name_en || item.name_es,
      calories_kcal: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      fiber_g: item.fiber_g ?? null,
      serving_size_g: item.serving_size,
      input_method: 'text_input',
    })
    search.reset()
    setSelected(null)
    setInput('')
    navigate('/')
  }

  const handleLogAll = () => {
    for (const item of search.results) {
      addEntry({
        food_name: item.name_en || item.name_es,
        calories_kcal: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        fiber_g: item.fiber_g ?? null,
        serving_size_g: item.serving_size,
        input_method: 'text_input',
      })
    }
    search.reset()
    setInput('')
    navigate('/')
  }

  const handleTryAnother = () => {
    search.reset()
    setSelected(null)
    setInput('')
  }

  // ─── Results ──────────────────────────────────────────────
  if (search.state === 'done' && search.results.length > 0) {
    const display = selected ?? search.topResult!
    const composite = isCompositeResult(search.results)
    const multiple = search.results.length > 1 && !composite

    return (
      <div className="flex flex-1 flex-col bg-surface">
        <header className="flex items-center border-b border-border bg-card px-5 py-3">
          <button onClick={handleTryAnother} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-text-primary">
            {composite ? (display.name_en || display.name_es) :
             multiple ? `${search.results.length} Results` :
             (display.name_en || display.name_es)}
          </h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {composite ? (
            <CompositeResultCard
              total={search.results[0]}
              components={search.results.slice(1)}
            />
          ) : multiple ? (
            <>
              <FoodResultList
                results={search.results}
                onSelect={setSelected}
                selectedIndex={selected ? search.results.indexOf(selected) : 0}
              />
              {selected && (
                <div className="mt-2 rounded-xl bg-card p-4 shadow-sm">
                  <FoodResultCard result={selected} />
                </div>
              )}
            </>
          ) : (
            <FoodResultCard result={display} />
          )}

          <SearchMeta source={search.source} cached={search.cached} latencyMs={search.latencyMs} />
        </div>

        <div className="flex gap-3 border-t border-border bg-card p-4">
          <button
            onClick={handleTryAnother}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface min-h-[44px]"
          >
            Try Another
          </button>
          {multiple ? (
            <button
              onClick={selected ? handleLog : handleLogAll}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
            >
              {selected ? 'Log Selected' : 'Log All'}
            </button>
          ) : (
            <button
              onClick={handleLog}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
            >
              Log This
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Loading ──────────────────────────────────────────────
  if (search.state === 'loading') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-lg text-text-secondary">Looking up "{input}"...</p>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────
  if (search.state === 'error') {
    return (
      <div className="flex flex-1 flex-col bg-surface">
        <header className="flex items-center border-b border-border bg-card px-5 py-3">
          <button onClick={() => navigate('/')} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-text-primary">Text Input</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="rounded-xl bg-error/10 px-4 py-3">
            <p className="text-sm text-error">{search.error}</p>
          </div>
          <button
            onClick={handleTryAnother}
            className="rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-card min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ─── Idle: text input form ────────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="flex items-center border-b border-border bg-card px-5 py-3">
        <button onClick={() => navigate('/')} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-text-primary">Text Input</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm text-text-secondary">
          Type a food name to look it up
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., tacos al pastor, cheesecake, banana"
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-base text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 shadow-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={input.trim().length < 2}
          className="w-full rounded-xl bg-primary px-4 py-3 text-base font-medium text-white disabled:opacity-40 hover:bg-primary-dark min-h-[44px]"
        >
          Look Up
        </button>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-text-tertiary">Examples:</p>
          {['tacos al pastor', 'banana', 'arroz con leche', 'cheesecake'].map((example) => (
            <button
              key={example}
              onClick={() => { setInput(example); search.reset(); setSelected(null) }}
              className="block w-full rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm text-text-secondary hover:border-primary hover:text-primary min-h-[44px]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
