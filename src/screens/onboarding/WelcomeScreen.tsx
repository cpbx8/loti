import { useOnboarding } from '@/contexts/OnboardingContext'
import { useLanguage } from '@/lib/i18n'
import FatSecretAttribution from '@/components/FatSecretAttribution'
import LotiMascot from '@/components/LotiMascot'

export default function WelcomeScreen() {
  const { next } = useOnboarding()
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-surface px-8 overflow-hidden" style={{ marginBottom: '-58px' }}>
      <LotiMascot expression="welcome" size="lg" className="mb-4" />

      {/* Language toggle */}
      <div className="flex items-center rounded-full bg-surface-container-high p-1 mb-6">
        <button
          onClick={() => setLanguage('es')}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all min-h-[36px] ${
            language === 'es'
              ? 'bg-white text-primary shadow-sm'
              : 'text-text-tertiary'
          }`}
        >
          Español
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all min-h-[36px] ${
            language === 'en'
              ? 'bg-white text-primary shadow-sm'
              : 'text-text-tertiary'
          }`}
        >
          English
        </button>
      </div>

      <h1 className="text-headline text-center text-on-surface">
        {t('onboarding.welcomeTitle')}
      </h1>
      <p className="mt-2 text-body text-center text-on-surface-variant">
        {t('onboarding.welcomeSub')}
      </p>

      <button
        onClick={next}
        className="mt-8 w-full rounded-3xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-dark transition-colors min-h-[52px]"
      >
        {t('onboarding.scanFirst')}
      </button>

      <div className="mt-4">
        <FatSecretAttribution />
      </div>
    </div>
  )
}
