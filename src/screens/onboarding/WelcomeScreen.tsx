import { useOnboarding } from '@/contexts/OnboardingContext'
import FatSecretAttribution from '@/components/FatSecretAttribution'
import LotiMascot from '@/components/LotiMascot'

export default function WelcomeScreen() {
  const { next } = useOnboarding()

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-surface min-h-[100svh] px-8">
      <LotiMascot expression="welcome" size="xl" className="mb-8" />

      <h1 className="text-center text-2xl font-bold text-text-primary leading-tight">
        See how your food affects your glucose
      </h1>

      <p className="mt-3 text-center text-base text-text-secondary leading-relaxed">
        Snap a photo. Get an instant red/yellow/green rating.
      </p>

      <button
        onClick={next}
        className="mt-10 w-full rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-dark transition-colors min-h-[52px]"
      >
        Scan your first food
      </button>

      <button className="mt-4 text-sm text-text-tertiary hover:text-text-secondary min-h-[44px]">
        Already have an account? Sign in
      </button>

      <div className="mt-8">
        <FatSecretAttribution />
      </div>
    </div>
  )
}
