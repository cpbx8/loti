import { useTranslation } from 'react-i18next'
import { DEFAULT_GOALS } from '@/lib/constants'
import type { DailyTotals } from '@/hooks/useDailyLog'
import MacroBar from './MacroBar'

interface Props {
  totals: DailyTotals
}

export default function MacroSummary({ totals }: Props) {
  const { t } = useTranslation('dashboard')
  const goals = DEFAULT_GOALS

  const calPercent = Math.min((totals.total_calories / goals.calories) * 100, 100)
  const remaining = Math.max(goals.calories - totals.total_calories, 0)

  // SVG ring dimensions
  const size = 120
  const stroke = 9
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (calPercent / 100) * circumference

  return (
    <div className="flex items-center gap-4 px-4 py-5">
      {/* Calorie ring */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-primary transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{totals.total_calories}</span>
          <span className="text-xs text-gray-400">{t('eaten')}</span>
        </div>
      </div>

      {/* Macro bars */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="mb-1 text-sm text-gray-400">
          {remaining} kcal {t('remaining')}
        </div>
        <MacroBar
          label={t('protein')}
          value={totals.total_protein_g}
          goal={goals.protein_g}
          color="bg-blue-500"
        />
        <MacroBar
          label={t('carbs')}
          value={totals.total_carbs_g}
          goal={goals.carbs_g}
          color="bg-amber-500"
        />
        <MacroBar
          label={t('fat')}
          value={totals.total_fat_g}
          goal={goals.fat_g}
          color="bg-pink-500"
        />
      </div>
    </div>
  )
}
