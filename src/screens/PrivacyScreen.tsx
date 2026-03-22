import { useNavigate } from 'react-router-dom'

export default function PrivacyScreen() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-screen">
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
        <h1 className="text-xl font-bold text-text-primary">Privacy Policy</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="prose prose-sm max-w-none text-text-secondary">
          <p className="text-xs text-text-tertiary mb-4">Last updated: March 2026</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">What We Collect</h2>
          <p className="text-sm leading-relaxed mb-3">Loti collects the health profile information you provide during onboarding (health status, A1C, age, dietary restrictions) to personalize your glucose impact ratings. Food scan data is processed to provide nutritional analysis.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">How We Use It</h2>
          <p className="text-sm leading-relaxed mb-3">Your profile data is used solely to customize traffic light thresholds and AI food suggestions. Photos are sent to our analysis service and are not stored permanently. Your food log is stored locally on your device.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Data Storage</h2>
          <p className="text-sm leading-relaxed mb-3">Most data is stored locally on your device using browser storage. Account data (email, profile) is stored securely on Supabase infrastructure. We do not sell your data to third parties.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Third-Party Services</h2>
          <p className="text-sm leading-relaxed mb-3">We use FatSecret Platform API and Open Food Facts for nutritional data, and OpenAI for photo analysis and food suggestions. These services may process data according to their own privacy policies.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Your Rights</h2>
          <p className="text-sm leading-relaxed mb-3">You can delete all your data at any time through Settings &gt; Clear All Data &amp; Reset. This removes all locally stored data and your account.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Contact</h2>
          <p className="text-sm leading-relaxed mb-3">For privacy concerns, contact us at privacy@loti.app.</p>
        </div>
      </div>
    </div>
  )
}
