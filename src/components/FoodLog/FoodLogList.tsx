import { useTranslation } from 'react-i18next'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import FoodLogItem from './FoodLogItem'

interface Props {
  entries: FoodLogEntry[]
}

export default function FoodLogList({ entries }: Props) {
  const { t } = useTranslation('dashboard')

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <p className="text-lg text-text-secondary">{t('noMeals')}</p>
        <p className="mt-1 text-sm text-text-tertiary">{t('scanFirst')}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <FoodLogItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
