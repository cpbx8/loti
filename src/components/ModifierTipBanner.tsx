/**
 * ModifierTipBanner — educational tip shown below suggestion cards.
 * Pulls from a static list of GI modifier tips.
 */

const TIPS = [
  'Add lime to any meal to reduce glucose impact ~20%',
  'Eating protein before carbs can lower glucose spikes by up to 30%',
  'Adding nopal to any dish can help reduce glucose impact ~20%',
  'Cinnamon in your coffee may help improve insulin sensitivity',
  'A short walk after eating can reduce blood sugar spikes by 30%',
  'Vinegar-based dressings can lower the GI of a meal significantly',
  'Beans and lentils are among the lowest-GI foods available',
  'Choosing corn tortillas over flour reduces glycemic impact',
  'Avocado with meals slows glucose absorption thanks to healthy fats',
  'Chia seeds in agua fresca can lower the overall glycemic impact',
]

/** Get a random tip — stable per sheet open (call once per render cycle) */
export function getRandomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

export default function ModifierTipBanner({ tip }: { tip: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-tl-yellow-fill mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 00-3 13.326V18h6v-2.674A7 7 0 0012 2z" />
      </svg>
      <p className="text-sm text-text-secondary">{tip}</p>
    </div>
  )
}
