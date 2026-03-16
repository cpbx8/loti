import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTextScan } from '@/hooks/useTextScan'
import type { ScanResult } from '@/types/shared'

export default function TextInputScreen() {
  const navigate = useNavigate()
  const textScan = useTextScan()
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (trimmed.length < 2) return
    textScan.scan(trimmed)
  }

  const handleTryAnother = () => {
    textScan.reset()
    setInput('')
  }

  const handleLogAndReturn = () => {
    textScan.reset()
    setInput('')
    navigate('/')
  }

  // ─── Multi-item meal result ────────────────────────────────
  if (textScan.state === 'done' && textScan.mealResult) {
    const meal = textScan.mealResult
    const tlColor = meal.meal_total.traffic_light

    return (
      <div className="flex flex-1 flex-col bg-gray-950">
        <header className="flex items-center border-b border-gray-800 px-4 py-3">
          <button onClick={handleTryAnother} className="text-sm text-gray-400 hover:text-white">
            ← Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-white">Meal Summary</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Meal total card */}
          <div className={`rounded-xl p-4 ${
            tlColor === 'green' ? 'bg-green-900/20' :
            tlColor === 'yellow' ? 'bg-yellow-900/20' : 'bg-red-900/20'
          }`}>
            <div className="flex items-center gap-2">
              <TrafficDot color={tlColor} />
              <p className={`text-lg font-bold ${
                tlColor === 'green' ? 'text-green-400' :
                tlColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {tlColor === 'green' ? 'Low Impact Meal' :
                 tlColor === 'yellow' ? 'Medium Impact Meal' : 'High Impact Meal'}
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Total GL: {meal.meal_total.total_gl} · {meal.items.length} items
            </p>
          </div>

          {/* Meal total macros */}
          <div className="grid grid-cols-2 gap-3">
            <MacroCard label="Calories" value={meal.meal_total.total_calories} unit="kcal" />
            <MacroCard label="Protein" value={meal.meal_total.total_protein_g} unit="g" />
            <MacroCard label="Carbs" value={meal.meal_total.total_carbs_g} unit="g" />
            <MacroCard label="Fat" value={meal.meal_total.total_fat_g} unit="g" />
          </div>

          {/* Individual items */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400">Items</p>
            {meal.items.map((item, i) => (
              <MealItemRow key={i} item={item} />
            ))}
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-800 p-4">
          <button
            onClick={handleTryAnother}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
          >
            Try Another
          </button>
          <button
            onClick={handleLogAndReturn}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
          >
            Log All
          </button>
        </div>
      </div>
    )
  }

  // ─── Single item result ────────────────────────────────────
  if (textScan.state === 'done' && textScan.result) {
    const r = textScan.result
    const tlColor = r.traffic_light

    return (
      <div className="flex flex-1 flex-col bg-gray-950">
        <header className="flex items-center border-b border-gray-800 px-4 py-3">
          <button onClick={handleTryAnother} className="text-sm text-gray-400 hover:text-white">
            ← Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-white">{r.food_name}</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className={`rounded-xl p-4 ${
            tlColor === 'green' ? 'bg-green-900/20' :
            tlColor === 'yellow' ? 'bg-yellow-900/20' : 'bg-red-900/20'
          }`}>
            <p className={`text-lg font-bold ${
              tlColor === 'green' ? 'text-green-400' :
              tlColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {tlColor === 'green' ? 'Low Impact' :
               tlColor === 'yellow' ? 'Medium Impact' : 'High Impact'}
            </p>
            {r.glycemic_index != null && (
              <p className="mt-1 text-sm text-gray-400">
                GI: {r.glycemic_index} · GL: {r.glycemic_load ?? '—'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MacroCard label="Calories" value={r.calories_kcal} unit="kcal" />
            <MacroCard label="Protein" value={r.protein_g} unit="g" />
            <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
            <MacroCard label="Fat" value={r.fat_g} unit="g" />
          </div>

          {r.swap_suggestion && (
            <div className="rounded-lg bg-blue-900/20 px-3 py-2">
              <p className="text-sm text-blue-300">{r.swap_suggestion}</p>
            </div>
          )}

          <p className="text-xs text-gray-600">{r.disclaimer}</p>
        </div>

        <div className="flex gap-3 border-t border-gray-800 p-4">
          <button
            onClick={handleTryAnother}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
          >
            Try Another
          </button>
          <button
            onClick={handleLogAndReturn}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
          >
            Log This
          </button>
        </div>
      </div>
    )
  }

  // ─── Loading state ─────────────────────────────────────────
  if (textScan.state === 'scanning') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-950 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-primary" />
        <p className="text-lg text-gray-400">Analyzing your meal...</p>
      </div>
    )
  }

  // ─── Error state ───────────────────────────────────────────
  if (textScan.state === 'error') {
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
            <p className="text-sm text-red-300">{textScan.error}</p>
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

  // ─── Idle: text input form ─────────────────────────────────
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
          Describe what you ate in natural language
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., 2 tacos and a horchata"
          rows={4}
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
          Analyze
        </button>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-600">Examples:</p>
          {['2 tacos and a horchata', 'banana', 'arroz con pollo y frijoles'].map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
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

// ─── Sub-components ──────────────────────────────────────────

function MacroCard({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="rounded-lg bg-gray-900 p-3">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-bold text-white">
        {value != null ? value : '—'}<span className="text-sm font-normal text-gray-400"> {unit}</span>
      </p>
    </div>
  )
}

function TrafficDot({ color }: { color: 'green' | 'yellow' | 'red' }) {
  const bg = color === 'green' ? 'bg-green-400' : color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
  return <div className={`h-3 w-3 rounded-full ${bg}`} />
}

function MealItemRow({ item }: { item: ScanResult }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-900 px-3 py-2.5">
      <TrafficDot color={item.traffic_light} />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">
          {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.food_name}
        </p>
        <p className="text-xs text-gray-500">
          {item.calories_kcal ?? 0} kcal · GL: {item.glycemic_load ?? '—'}
        </p>
      </div>
    </div>
  )
}
