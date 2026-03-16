import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useDailyLog } from '@/hooks/useDailyLog'
import { FoodResultCard, FoodResultList, SearchMeta } from '@/components/FoodResultCard'
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
    const multiple = search.results.length > 1

    return (
      <div className="flex flex-1 flex-col bg-gray-950">
        <header className="flex items-center border-b border-gray-800 px-4 py-3">
          <button onClick={handleTryAnother} className="text-sm text-gray-400 hover:text-white">
            ← Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-white">
            {multiple ? `${search.results.length} Results` : (display.name_en || display.name_es)}
          </h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {multiple ? (
            <>
              <FoodResultList
                results={search.results}
                onSelect={setSelected}
                selectedIndex={selected ? search.results.indexOf(selected) : 0}
              />
              {selected && (
                <div className="mt-2 rounded-xl bg-gray-900/50 p-4">
                  <FoodResultCard result={selected} />
                </div>
              )}
            </>
          ) : (
            <FoodResultCard result={display} />
          )}

          <SearchMeta source={search.source} cached={search.cached} latencyMs={search.latencyMs} />
        </div>

        <div className="flex gap-3 border-t border-gray-800 p-4">
          <button
            onClick={handleTryAnother}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
          >
            Try Another
          </button>
          {multiple ? (
            <button
              onClick={selected ? handleLog : handleLogAll}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
            >
              {selected ? 'Log Selected' : 'Log All'}
            </button>
          ) : (
            <button
              onClick={handleLog}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-950 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-primary" />
        <p className="text-lg text-gray-400">Looking up "{input}"...</p>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────
  if (search.state === 'error') {
    return (
      <div className="flex flex-1 flex-col bg-gray-950">
        <header className="flex items-center border-b border-gray-800 px-4 py-3">
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white">
            ← Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-white">Text Input</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="rounded-xl bg-red-900/20 px-4 py-3">
            <p className="text-sm text-red-300">{search.error}</p>
          </div>
          <button
            onClick={handleTryAnother}
            className="rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ─── Idle: text input form ────────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-gray-950">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white">
          ← Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-white">Text Input</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-sm text-gray-500">
          Type a food name to look it up
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., tacos al pastor, cheesecake, banana"
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-500 focus:border-primary focus:outline-none"
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
          className="w-full rounded-xl bg-primary px-4 py-3 text-base font-medium text-white disabled:opacity-40 hover:bg-primary-dark"
        >
          Look Up
        </button>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-600">Examples:</p>
          {['tacos al pastor', 'banana', 'arroz con leche', 'cheesecake'].map((example) => (
            <button
              key={example}
              onClick={() => { setInput(example); search.reset(); setSelected(null) }}
              className="block w-full rounded-lg border border-gray-800 px-3 py-2 text-left text-sm text-gray-400 hover:border-gray-600 hover:text-gray-300"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
