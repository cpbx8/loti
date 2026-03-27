import { useOnboarding } from '@/contexts/OnboardingContext'
import { useLanguage } from '@/lib/i18n'
import FatSecretAttribution from '@/components/FatSecretAttribution'
import LotiMascot from '@/components/LotiMascot'

export default function WelcomeScreen() {
  const { next } = useOnboarding()
  const { setLanguage } = useLanguage()

  const handleLanguage = (lang: 'es' | 'en') => {
    setLanguage(lang)
    next()
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-surface px-8" style={{ minHeight: '100svh', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <LotiMascot expression="welcome" size="xl" className="mb-8" />

      <h1 className="text-headline text-center text-on-surface">
        Mira cómo tu comida afecta tu glucosa
      </h1>
      <p className="mt-1 text-body text-center text-on-surface-variant/70">
        See how your food affects your glucose
      </p>

      <div className="mt-10 w-full flex flex-col gap-3">
        <button
          onClick={() => handleLanguage('es')}
          className="w-full rounded-3xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-dark transition-colors min-h-[52px]"
        >
          Continuar en Español
        </button>
        <button
          onClick={() => handleLanguage('en')}
          className="w-full rounded-3xl border-2 border-primary px-6 py-4 text-lg font-semibold text-primary hover:bg-primary/5 transition-colors min-h-[52px]"
        >
          Continue in English
        </button>
      </div>

      <div className="mt-8">
        <FatSecretAttribution />
      </div>
    </div>
  )
}
