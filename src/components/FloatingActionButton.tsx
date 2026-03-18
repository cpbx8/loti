/**
 * FloatingActionButton — sparkle icon FAB for AI food suggestions.
 * Positioned bottom-right, above the existing action FABs.
 * Subtle pulse animation on first 3 sessions.
 */

interface FABProps {
  onClick: () => void
  showPulse?: boolean
}

export default function FloatingActionButton({ onClick, showPulse = false }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label="Get food suggestions"
    >
      {showPulse && (
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
      )}
      {/* Sparkles icon */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
      </svg>
    </button>
  )
}
