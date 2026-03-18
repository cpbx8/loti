import { useTranslation } from 'react-i18next'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import FoodLogItem from './FoodLogItem'

interface Props {
  entries: FoodLogEntry[]
  onRemove?: (id: string) => void
  onUpdateServing?: (id: string, count: number) => void
}

export default function FoodLogList({ entries, onRemove, onUpdateServing }: Props) {
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
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <FoodLogItem
          key={entry.id}
          entry={entry}
          onRemove={onRemove}
          onUpdateServing={onUpdateServing}
        />
      ))}
    </div>
  )
}
