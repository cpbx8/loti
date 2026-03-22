import { useNavigate } from 'react-router-dom'

export default function TermsScreen() {
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
        <h1 className="text-xl font-bold text-text-primary">Terms of Service</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="prose prose-sm max-w-none text-text-secondary">
          <p className="text-xs text-text-tertiary mb-4">Last updated: March 2026</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Acceptance</h2>
          <p className="text-sm leading-relaxed mb-3">By using Loti, you agree to these terms. If you do not agree, please do not use the app.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Medical Disclaimer</h2>
          <p className="text-sm leading-relaxed mb-3">Loti AI is intended for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek advice from your healthcare provider before making any changes to your diabetes management or treatment plan. Nutritional values and glycemic impact ratings are estimates and may not be accurate for all individuals.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Use of Service</h2>
          <p className="text-sm leading-relaxed mb-3">You may use Loti for personal, non-commercial purposes. You are responsible for maintaining the security of your account credentials. Do not use the service to process data for others without their consent.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">AI-Generated Content</h2>
          <p className="text-sm leading-relaxed mb-3">Food suggestions, nutritional estimates, and glycemic impact ratings are generated using AI and third-party databases. These are approximations and should not be relied upon as medical guidance. Individual responses to food vary.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Limitation of Liability</h2>
          <p className="text-sm leading-relaxed mb-3">Loti and its creators are not liable for any health outcomes resulting from use of the app. You use Loti at your own risk. We do not guarantee the accuracy of nutritional data or AI recommendations.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Changes</h2>
          <p className="text-sm leading-relaxed mb-3">We may update these terms at any time. Continued use of Loti after changes constitutes acceptance of the updated terms.</p>

          <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">Contact</h2>
          <p className="text-sm leading-relaxed mb-3">Questions about these terms? Contact us at support@loti.app.</p>
        </div>
      </div>
    </div>
  )
}
