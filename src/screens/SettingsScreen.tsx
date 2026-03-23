import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ActivityLevel, Sex } from '@/contexts/OnboardingContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useProfile } from '@/hooks/useProfile'
import { useLanguage } from '@/lib/i18n'

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
  male: 'Masculino', female: 'Femenino', not_specified: 'Prefiero no decir',
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

// a1cRange is now inline using t() — see component body

export default function SettingsScreen() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData>(readProfile)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [editingA1c, setEditingA1c] = useState(false)
  const [a1cDraft, setA1cDraft] = useState('')
  const [showDietaryEditor, setShowDietaryEditor] = useState(false)
  const [showActivityEditor, setShowActivityEditor] = useState(false)
  const sub = useSubscription()
  const { profile: serverProfile, updateProfile: updateServerProfile } = useProfile()
  const { language, setLanguage, t } = useLanguage()

  const a1cRange = (value: number): string => {
    if (value < 5.7) return t('settings.a1cNormal')
    if (value <= 6.4) return t('settings.a1cPrediabetic')
    return t('settings.a1cDiabetic')
  }

  // Seed local state from server profile when available
  useEffect(() => {
    if (serverProfile) {
      setProfile(prev => ({
        ...prev,
        healthState: serverProfile.health_state ?? prev.healthState,
        goal: serverProfile.goal ?? prev.goal,
        a1cValue: serverProfile.a1c_value ?? prev.a1cValue,
        age: serverProfile.age ?? prev.age,
        sex: (serverProfile.sex as Sex) ?? prev.sex,
        activityLevel: (serverProfile.activity_level as ActivityLevel) ?? prev.activityLevel,
        dietaryRestrictions: serverProfile.dietary_restrictions ?? prev.dietaryRestrictions,
        mealStruggles: serverProfile.meal_struggles ?? prev.mealStruggles,
        medications: serverProfile.medications ?? prev.medications,
      }))
    } else {
      setProfile(readProfile())
    }
  }, [serverProfile])

  const updateProfile = useCallback((patch: Partial<ProfileData>) => {
    setProfile(prev => {
      const next = { ...prev, ...patch }
      saveProfile(next)
      return next
    })
    // Sync to SQLite profile
    const dbPatch: Record<string, unknown> = {}
    if (patch.a1cValue !== undefined) dbPatch.a1c_value = patch.a1cValue
    if (patch.activityLevel !== undefined) dbPatch.activity_level = patch.activityLevel
    if (patch.dietaryRestrictions !== undefined) dbPatch.dietary_restrictions = patch.dietaryRestrictions
    if (patch.medications !== undefined) dbPatch.medications = patch.medications
    if (patch.age !== undefined) dbPatch.age = patch.age
    if (patch.sex !== undefined) dbPatch.sex = patch.sex
    if (Object.keys(dbPatch).length > 0) {
      updateServerProfile(dbPatch).catch(console.warn)
    }
  }, [updateServerProfile])

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
        <h1 className="text-xl font-bold text-text-primary">{t('settings.title')}</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Language Toggle */}
        <div className="mx-5 mt-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{t('settings.language')}</h2>
          <div className="bg-card rounded-2xl p-1 flex">
            <button
              onClick={() => setLanguage('es')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors min-h-[40px] ${
                language === 'es'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface'
              }`}
            >
              Español
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors min-h-[40px] ${
                language === 'en'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* {t('settings.healthProfile')} — A1C editable */}
        <div className="mx-5 mt-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{t('settings.healthProfile')}</h2>
          <div className="bg-card rounded-2xl px-4">
            <button
              onClick={startA1cEdit}
              className="flex w-full items-center justify-between py-3 min-h-[44px]"
            >
              <div>
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">A1C</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {profile.a1cValue != null
                    ? `${profile.a1cValue}% · ${a1cRange(profile.a1cValue)}`
                    : "Sin definir"}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sobre Ti — read-only summary */}
        <div className="mx-5 mt-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Sobre Ti</h2>
          <div className="bg-card rounded-2xl px-4">
            {profile.age && (
              <div className="py-3 border-b border-border">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Edad</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{profile.age} años</p>
              </div>
            )}
            {profile.sex && (
              <div className="py-3 border-b border-border">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Sexo</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{SEX_LABELS[profile.sex] ?? profile.sex}</p>
              </div>
            )}
            {/* Nivel de Actividad — tappable to edit */}
            <button
              onClick={() => setShowActivityEditor(true)}
              className="flex w-full items-center justify-between py-3 min-h-[44px]"
            >
              <div>
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Nivel de Actividad</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {ACTIVITY_OPTIONS.find(a => a.key === profile.activityLevel)?.label ?? 'Sin definir'}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Medicamentos — read-only */}
        {showMeds && profile.medications && profile.medications.length > 0 && (
          <div className="mx-5 mt-4">
            <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Medicamentos</h2>
            <div className="bg-card rounded-2xl px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {profile.medications.map(m => (
                  <span key={m} className="rounded-full bg-surface border border-border px-3 py-1 text-xs font-medium text-text-primary">{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Restricciones Alimentarias — editable */}
        <div className="mx-5 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Restricciones Alimentarias</h2>
            <button
              onClick={() => setShowDietaryEditor(e => !e)}
              className="text-xs font-semibold text-primary"
            >
              {showDietaryEditor ? 'Listo' : 'Editar'}
            </button>
          </div>
          <div className="bg-card rounded-2xl px-4 py-3">
            {!showDietaryEditor ? (
              // Display mode
              (profile.dietaryRestrictions?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.dietaryRestrictions.map(r => (
                    <span key={r} className="rounded-full bg-primary-light border border-primary/20 px-3 py-1 text-xs font-medium text-primary-dark">{r}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">Sin restricciones — toca Editar para agregar</p>
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
              Las sugerencias de IA y recomendaciones respetan estas restricciones.
            </p>
          </div>
        </div>

        {/* Subscription */}
        <div className="mx-5 mt-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Suscripción</h2>
          <div className="bg-card rounded-2xl px-4">
            <div className="py-3 border-b border-border">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Estado</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                {sub.is_premium
                  ? `Premium (${sub.subscription_type})`
                  : sub.isTrialActive
                    ? `Prueba gratuita — ${sub.trialDaysRemaining} día${sub.trialDaysRemaining !== 1 ? 's' : ''} restante${sub.trialDaysRemaining !== 1 ? 's' : ''}`
                    : 'Prueba expirada'}
              </p>
            </div>
            {!sub.is_premium && sub.isTrialActive && (
              <div className="py-3 border-b border-border">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Escaneos Hoy</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {sub.scans_today} / {sub.dailyScanLimit} usados · {sub.scansRemaining} restantes
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/paywall')}
              className="flex w-full items-center justify-between py-3 min-h-[44px]"
            >
              <span className="text-sm font-medium text-primary">
                {sub.is_premium ? 'Administrar suscripción' : 'Mejorar a Premium'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dev Tools (hidden behind 5-tap on version) */}
        <div className="mx-5 mt-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Desarrollador</h2>
          <div className="bg-card rounded-2xl">
            <button
              onClick={() => {
                localStorage.removeItem('loti_subscription')
                window.location.reload()
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 border-b border-border min-h-[44px]"
            >
              <span className="text-sm text-text-primary">Reiniciar prueba (5 días nuevos)</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => {
                sub.activatePremium('annual')
                window.location.reload()
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 border-b border-border min-h-[44px]"
            >
              <span className="text-sm text-text-primary">Activar Premium (prueba)</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
            <button
              onClick={() => {
                const s = JSON.parse(localStorage.getItem('loti_subscription') || '{}')
                s.trial_expires_at = new Date(Date.now() - 86400000).toISOString()
                s.is_premium = false
                localStorage.setItem('loti_subscription', JSON.stringify(s))
                window.location.reload()
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 min-h-[44px]"
            >
              <span className="text-sm text-text-primary">Expirar prueba (probar paywall)</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mx-5 mt-6">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Acciones</h2>
          <div className="bg-card rounded-2xl">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex w-full items-center justify-between px-4 py-3.5 border-b border-border min-h-[44px]"
            >
              <span className="text-sm text-text-primary">Repetir onboarding</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex w-full items-center justify-between px-4 py-3.5 min-h-[44px]"
            >
              <span className="text-sm text-red-500">Borrar datos y resetear</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* App info */}
        <div className="mx-5 mt-6 mb-4 text-center">
          <p className="text-xs text-text-tertiary">Loti v1.0</p>
          <p className="text-[11px] leading-relaxed text-text-tertiary mt-3">
            Loti AI es solo para fines informativos. No sustituye el consejo médico profesional, diagnóstico o tratamiento. Siempre consulta a tu médico antes de hacer cambios en tu plan de manejo de diabetes.
          </p>
        </div>
      </div>

      {/* A1C edit modal */}
      {editingA1c && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingA1c(false)}>
          <div className="mx-6 bg-card rounded-2xl p-5 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-1">Actualizar A1C</h3>
            <p className="text-xs text-text-secondary mb-4">Ingresa tu porcentaje de A1C más reciente (4.0 – 14.0)</p>
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
                Cancelar
              </button>
              <button
                onClick={saveA1c}
                className="flex-1 btn-gradient text-sm min-h-[44px]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nivel de Actividad editor modal */}
      {showActivityEditor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowActivityEditor(false)}>
          <div className="w-full max-w-[430px] bg-card rounded-t-2xl p-5 pb-8 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <h3 className="text-lg font-bold text-text-primary mb-4">Nivel de Actividad</h3>
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
            <h3 className="text-lg font-bold text-text-primary mb-2">¿Resetear todo?</h3>
            <p className="text-sm text-text-secondary mb-5">
              Esto eliminará tu perfil, registro de alimentos y todos los datos en caché. Tendrás que hacer el onboarding de nuevo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 ghost-border rounded-full px-4 py-2.5 text-sm font-medium text-text-primary min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white min-h-[44px]"
              >
                Resetear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
