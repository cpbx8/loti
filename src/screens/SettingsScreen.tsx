import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ActivityLevel, Sex } from '@/contexts/OnboardingContext'

const STORAGE_KEY = 'loti_onboarding'

interface ProfileData {
  healthState: string | null
  goal: string | null
  diagnosisDuration: string | null
  a1cValue: number | null
  medications: string[]
  age: number | null
  sex: Sex | null
  activityLevel: ActivityLevel | null
  dietaryRestrictions: string[]
  mealStruggles: string[]
}

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-free / Celiac', 'Lactose intolerant',
  'Dairy-free', 'Keto / Low carb', 'Paleo', 'Mediterranean',
  'Low sodium', 'Low fat', 'Nut allergy', 'Shellfish allergy',
  'Soy-free', 'Egg-free', 'Halal', 'Kosher',
]

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; subtitle: string }[] = [
  { key: 'sedentary', label: 'Sedentary', subtitle: 'Little to no exercise' },
  { key: 'light', label: 'Lightly active', subtitle: 'Light exercise 1-3 days/week' },
  { key: 'moderate', label: 'Moderately active', subtitle: 'Exercise 3-5 days/week' },
  { key: 'very_active', label: 'Very active', subtitle: 'Hard exercise 6-7 days/week' },
]

const SEX_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female', not_specified: 'Prefer not to say',
}

function readProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ProfileData
  } catch { /* ignore */ }
  return {
    healthState: null, goal: null, diagnosisDuration: null, a1cValue: null,
    medications: [], age: null, sex: null, activityLevel: null,
    dietaryRestrictions: [], mealStruggles: [],
  }
}

function saveProfile(profile: ProfileData) {
  try {
    // Merge with existing data to preserve fields we don't edit here (e.g. onboarding flow state)
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...profile }))
  } catch { /* ignore */ }
}

function a1cRange(value: number): string {
  if (value < 5.7) return 'Normal'
  if (value <= 6.4) return 'Prediabetic range'
  return 'Diabetic range'
}

export default function SettingsScreen() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData>(readProfile)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [editingA1c, setEditingA1c] = useState(false)
  const [a1cDraft, setA1cDraft] = useState('')
  const [showDietaryEditor, setShowDietaryEditor] = useState(false)
  const [showActivityEditor, setShowActivityEditor] = useState(false)

  useEffect(() => {
    setProfile(readProfile())
  }, [])

  const updateProfile = useCallback((patch: Partial<ProfileData>) => {
    setProfile(prev => {
      const next = { ...prev, ...patch }
      saveProfile(next)
      return next
    })
  }, [])

  // A1C editing
  const startA1cEdit = () => {
    setA1cDraft(profile.a1cValue != null ? String(profile.a1cValue) : '')
    setEditingA1c(true)
  }
  const saveA1c = () => {
    const val = parseFloat(a1cDraft)
    if (!isNaN(val) && val >= 4.0 && val <= 14.0) {
      updateProfile({ a1cValue: Math.round(val * 10) / 10 })
    }
    setEditingA1c(false)
  }

  // Dietary toggle
  const toggleDietary = (item: string) => {
    const current = profile.dietaryRestrictions ?? []
    if (current.includes(item)) {
      updateProfile({ dietaryRestrictions: current.filter(r => r !== item) })
    } else {
      updateProfile({ dietaryRestrictions: [...current, item] })
    }
  }

  const handleClearData = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('loti_onboarding_complete')
    localStorage.removeItem('loti_food_log')
    localStorage.removeItem('loti_suggest_count')
    localStorage.removeItem('loti_store_oxxo')
    navigate('/onboarding')
  }

  const hs = profile.healthState
  const showMeds = hs && hs !== 'healthy'

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-screen">
      {/* Header */}
      <header className="flex items-center gap-3 bg-card px-5 py-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface min-h-[44px] min-w-[44px]"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Health Profile — A1C editable */}
        <div className="mx-5 mt-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Health Profile</h2>
          <div className="bg-card rounded-xl px-4">
            <button
              onClick={startA1cEdit}
              className="flex w-full items-center justify-between py-3 min-h-[44px]"
            >
              <div>
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">A1C</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {profile.a1cValue != null
                    ? `${profile.a1cValue}% · ${a1cRange(profile.a1cValue)}`
                    : "Not set"}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* About You — read-only summary */}
        <div className="mx-5 mt-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">About You</h2>
          <div className="bg-card rounded-xl px-4">
            {profile.age && (
              <div className="py-3 border-b border-border">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Age</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{profile.age} years old</p>
              </div>
            )}
            {profile.sex && (
              <div className="py-3 border-b border-border">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Sex</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{SEX_LABELS[profile.sex] ?? profile.sex}</p>
              </div>
            )}
            {/* Activity Level — tappable to edit */}
            <button
              onClick={() => setShowActivityEditor(true)}
              className="flex w-full items-center justify-between py-3 min-h-[44px]"
            >
              <div>
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Activity Level</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {ACTIVITY_OPTIONS.find(a => a.key === profile.activityLevel)?.label ?? 'Not set'}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Medications — read-only */}
        {showMeds && profile.medications && profile.medications.length > 0 && (
          <div className="mx-5 mt-4">
            <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Medications</h2>
            <div className="bg-card rounded-xl px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {profile.medications.map(m => (
                  <span key={m} className="rounded-full bg-surface border border-border px-3 py-1 text-xs font-medium text-text-primary">{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dietary Restrictions — editable */}
        <div className="mx-5 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Dietary Restrictions</h2>
            <button
              onClick={() => setShowDietaryEditor(e => !e)}
              className="text-xs font-semibold text-primary"
            >
              {showDietaryEditor ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className="bg-card rounded-xl px-4 py-3">
            {!showDietaryEditor ? (
              // Display mode
              (profile.dietaryRestrictions?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.dietaryRestrictions.map(r => (
                    <span key={r} className="rounded-full bg-primary-light border border-primary/20 px-3 py-1 text-xs font-medium text-primary-dark">{r}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">None set — tap Edit to add restrictions</p>
              )
            ) : (
              // Edit mode — toggleable chips
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(opt => {
                  const active = (profile.dietaryRestrictions ?? []).includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleDietary(opt)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                        active
                          ? 'bg-primary text-white'
                          : 'bg-surface border border-border text-text-primary'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}
            <p className="text-[10px] text-text-tertiary mt-2">
              AI suggestions and swap recommendations respect these restrictions.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mx-5 mt-6">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Actions</h2>
          <div className="bg-card rounded-xl">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex w-full items-center justify-between px-4 py-3.5 border-b border-border min-h-[44px]"
            >
              <span className="text-sm text-text-primary">Redo Onboarding</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex w-full items-center justify-between px-4 py-3.5 min-h-[44px]"
            >
              <span className="text-sm text-red-500">Clear All Data & Reset</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* App info */}
        <div className="mx-5 mt-6 mb-4 text-center">
          <p className="text-xs text-text-tertiary">Loti v1.0</p>
          <p className="text-xs text-text-tertiary mt-1">Not medical advice. Consult your doctor.</p>
        </div>
      </div>

      {/* A1C edit modal */}
      {editingA1c && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingA1c(false)}>
          <div className="mx-6 bg-card rounded-2xl p-5 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-1">Update A1C</h3>
            <p className="text-xs text-text-secondary mb-4">Enter your latest A1C percentage (4.0 – 14.0)</p>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="4.0"
              max="14.0"
              value={a1cDraft}
              onChange={e => setA1cDraft(e.target.value)}
              placeholder="e.g. 6.5"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {a1cDraft && !isNaN(parseFloat(a1cDraft)) && parseFloat(a1cDraft) >= 4.0 && (
              <p className="text-xs text-text-secondary mt-2">
                {a1cRange(parseFloat(a1cDraft))}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditingA1c(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-primary min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={saveA1c}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white min-h-[44px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Level editor modal */}
      {showActivityEditor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowActivityEditor(false)}>
          <div className="w-full max-w-[430px] bg-card rounded-t-2xl p-5 pb-8 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <h3 className="text-lg font-bold text-text-primary mb-4">Activity Level</h3>
            <div className="space-y-2">
              {ACTIVITY_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    updateProfile({ activityLevel: opt.key })
                    setShowActivityEditor(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 min-h-[44px] transition-colors ${
                    profile.activityLevel === opt.key
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    profile.activityLevel === opt.key ? 'border-primary' : 'border-border'
                  }`}>
                    {profile.activityLevel === opt.key && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                    <p className="text-xs text-text-secondary">{opt.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowClearConfirm(false)}>
          <div className="mx-6 bg-card rounded-2xl p-5 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-2">Reset Everything?</h3>
            <p className="text-sm text-text-secondary mb-5">
              This will clear your profile, food log, and all cached data. You'll need to go through onboarding again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-primary min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white min-h-[44px]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
