import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCamera } from '@/hooks/useCamera'
import { useScan } from '@/hooks/useScan'

export default function ScanScreen() {
  const { t } = useTranslation('scan')
  const navigate = useNavigate()
  const camera = useCamera()
  const scan = useScan()

  const handleConfirm = async () => {
    if (!camera.base64) return
    await scan.scan(camera.base64)
  }

  const handleLogAndReturn = () => {
    camera.reset()
    scan.reset()
    navigate('/')
  }

  const handleScanAnother = () => {
    camera.reset()
    scan.reset()
  }

  // State: scan complete — show result
  if (scan.state === 'done' && scan.result) {
    const r = scan.result
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex items-center border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">{r.food_name}</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Traffic light */}
          <div className={`rounded-xl p-4 ${
            r.traffic_light === 'green' ? 'bg-gl-green/10' :
            r.traffic_light === 'yellow' ? 'bg-gl-yellow/10' :
            'bg-gl-red/10'
          }`}>
            <p className={`text-lg font-bold ${
              r.traffic_light === 'green' ? 'text-gl-green' :
              r.traffic_light === 'yellow' ? 'text-gl-yellow' :
              'text-gl-red'
            }`}>
              {t(`trafficLight.${r.traffic_light}`)}
            </p>
            {r.glycemic_index != null && (
              <p className="mt-1 text-sm text-gray-500">
                GI: {r.glycemic_index} · GL: {r.glycemic_load ?? '—'}
              </p>
            )}
          </div>

          {/* Macros */}
          <div className="grid grid-cols-2 gap-3">
            <MacroCard label={t('calories')} value={r.calories_kcal} unit="kcal" />
            <MacroCard label={t('protein')} value={r.protein_g} unit="g" />
            <MacroCard label={t('carbs')} value={r.carbs_g} unit="g" />
            <MacroCard label={t('fat')} value={r.fat_g} unit="g" />
          </div>

          <p className="text-sm text-gray-400">
            {t('serving', { grams: r.serving_size_g })} · {t(`confidence.${r.confidence}`)}
          </p>

          {/* Swap suggestion */}
          {r.swap_suggestion && (
            <div className="rounded-lg bg-blue-50 px-3 py-2">
              <p className="text-sm text-blue-800">{r.swap_suggestion}</p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-gray-300">{r.disclaimer}</p>
        </div>

        <div className="flex gap-3 border-t border-gray-200 p-4">
          <button
            onClick={handleScanAnother}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('scanAnother')}
          </button>
          <button
            onClick={handleLogAndReturn}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
          >
            {t('logThis')}
          </button>
        </div>
      </div>
    )
  }

  // State: scanning in progress
  if (scan.state === 'scanning') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
        <p className="text-lg text-gray-500">{t('scanning')}</p>
      </div>
    )
  }

  // State: no photo yet — show capture prompt
  if (!camera.previewUrl) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex items-center border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('back')}
          </button>
          <h1 className="ml-3 text-lg font-bold text-gray-900">{t('title')}</h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          {(camera.error || scan.error) && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {camera.error || scan.error}
            </p>
          )}

          <button
            onClick={camera.capture}
            disabled={camera.loading}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label={t('capture')}
          >
            {camera.loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>

          <p className="text-gray-500">{t('capture')}</p>
        </div>
      </div>
    )
  }

  // State: photo captured — show review
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center border-b border-gray-200 px-4 py-3">
        <button
          onClick={() => { camera.reset(); navigate('/') }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {t('back')}
        </button>
        <h1 className="ml-3 text-lg font-bold text-gray-900">{t('title')}</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-xl">
          <img
            src={camera.previewUrl}
            alt="Captured food"
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="mt-6 flex w-full max-w-sm gap-3">
          <button
            onClick={camera.reset}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('retake')}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

function MacroCard({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="rounded-lg bg-gray-800 p-3">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-bold text-white">
        {value != null ? value : '—'}<span className="text-sm font-normal text-gray-400"> {unit}</span>
      </p>
    </div>
  )
}
