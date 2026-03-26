import { useOnboarding } from '@/contexts/OnboardingContext'
import { useLanguage } from '@/lib/i18n'
import FatSecretAttribution from '@/components/FatSecretAttribution'
import LotiMascot from '@/components/LotiMascot'

export default function WelcomeScreen() {
  const { next } = useOnboarding()
  const { t } = useLanguage()

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-surface min-h-[100svh] px-8">
      <LotiMascot expression="welcome" size="xl" className="mb-8" />

      <h1 className="text-headline text-center text-on-surface">
        {t('onboarding.welcomeTitle')}
      </h1>

      <p className="mt-3 text-body text-center text-on-surface-variant">
        {t('onboarding.welcomeSub')}
      </p>

      <button
        onClick={next}
        className="mt-10 w-full rounded-3xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-dark transition-colors min-h-[52px]"
      >
        {t('onboarding.scanFirst')}
      </button>

      <div className="mt-8">
        <FatSecretAttribution />
      </div>
    </div>
  )
}
