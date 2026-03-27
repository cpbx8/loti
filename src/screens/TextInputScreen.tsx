import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useDailyLog, toLogEntry } from '@/hooks/useDailyLog'
import { useSubscription } from '@/hooks/useSubscription'
import { useLanguage } from '@/lib/i18n'
import { FoodResultCard, FoodResultList, isCompositeResult, SearchMeta } from '@/components/FoodResultCard'
import EditableMealCard from '@/components/EditableMealCard'
import type { FoodSearchResult } from '@/types/shared'

export default function TextInputScreen() {
  const navigate = useNavigate()
  const search = useWaterfallSearch()
  const { addEntry } = useDailyLog()
  const { t } = useLanguage()
  const { scans_today: scansToday, is_premium } = useSubscription()
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)
  const handleSubmit = () => {
    const trimmed = input.trim()
    if (trimmed.length < 2) return
    setSelected(null)
    search.searchText(trimmed)
  }

  const afterLogDest = scansToday === 0 && !is_premium ? '/paywall' : '/'

  const handleLog = () => {
    const item = selected ?? search.topResult
    if (!item) return
    addEntry(toLogEntry(item, 'text_input'))
    search.reset()
    setSelected(null)
    setInput('')
    navigate(afterLogDest)
  }

  const handleLogAll = () => {
    for (const item of search.results) {
      addEntry(toLogEntry(item, 'text_input'))
    }
    search.reset()
    setInput('')
    navigate(afterLogDest)
  }

  const handleLogComposite = (components: FoodSearchResult[]) => {
    for (const item of components) {
      addEntry(toLogEntry(item, 'text_input'))
    }
    search.reset()
    setInput('')
    navigate(afterLogDest)
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
      <div className="flex flex-1 flex-col bg-surface min-h-0">
        <header className="glass flex items-center px-5 py-3 z-10 flex-shrink-0">
          <button onClick={handleTryAnother} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-title text-on-surface">{t('text.analysis')}</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 pb-24">
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
              {selected && (
                <div className="mt-2 rounded-2xl bg-card p-4 shadow-sm">
                  <FoodResultCard result={selected} />
                </div>
              )}
            </>
          ) : (
            <FoodResultCard result={display} />
          )}

          <SearchMeta source={search.source} cached={search.cached} latencyMs={search.latencyMs} />
        </div>

        {!composite && (
        <div className="flex gap-3 glass p-4 sticky bottom-0">
          <button
            onClick={handleTryAnother}
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
    )
  }

  // ─── Loading ──────────────────────────────────────────────
  if (search.state === 'loading') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-lg text-text-secondary">{t('text.searching')} "{input}"...</p>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────
  if (search.state === 'error') {
    return (
      <div className="flex flex-1 flex-col bg-surface min-h-0">
        <header className="flex items-center border-b border-border bg-card px-5 py-3">
          <button onClick={() => navigate('/')} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-title text-on-surface">{t('text.title')}</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="rounded-2xl bg-error/10 px-4 py-3">
            <p className="text-body text-error">{search.error}</p>
          </div>
          <button
            onClick={handleTryAnother}
            className="ghost-border rounded-full px-4 py-3 text-body font-medium text-on-surface-variant hover:bg-surface-container-high min-h-[48px]"
          >
            {t('text.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  // ─── Idle: text input form ────────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      <header className="flex items-center border-b border-border bg-card px-5 py-3">
        <button onClick={() => navigate('/')} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-title text-on-surface">{t('text.title')}</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-body text-on-surface-variant">
          {t('text.description')}
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('text.placeholder')}
          rows={3}
          className="w-full resize-none rounded-2xl bg-surface-container-low px-4 py-3 text-body text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          className="w-full btn-gradient min-h-[48px] disabled:opacity-40"
        >
          {t('text.search')}
        </button>

        <div className="mt-4 space-y-2">
          <p className="text-label text-on-surface-variant">{t('text.examples')}</p>
          {['tacos al pastor', 'banana', 'arroz con leche', 'cheesecake'].map((example) => (
            <button
              key={example}
              onClick={() => { setInput(example); search.reset(); setSelected(null) }}
              className="block w-full surface-card px-4 py-3 text-left text-body text-on-surface hover:ring-1 hover:ring-primary/30 min-h-[44px]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
