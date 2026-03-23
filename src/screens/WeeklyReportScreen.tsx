import { useNavigate } from 'react-router-dom'
import { useWeeklyReport } from '@/hooks/useWeeklyReport'
import { useStreak } from '@/hooks/useStreak'
import LotiMascot from '@/components/LotiMascot'

function ProgressRing({ pct, size = 120 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const filled = circ * (Math.min(pct, 100) / 100)
  const color = pct >= 70 ? '#2E7D32' : pct >= 40 ? '#E65100' : '#C62828'

  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 - 8} textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={800} fill={color}>
        {pct}%
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#6B7280">
        green
      </text>
    </svg>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-sm">
      <p className="text-xs text-text-tertiary uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-text-primary mt-0.5">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  )
}

export default function WeeklyReportScreen() {
  const navigate = useNavigate()
  const report = useWeeklyReport()
  const streak = useStreak()

  const mascotExpression = report.greenPct >= 70 ? 'happy' as const
    : report.greenPct >= 40 ? 'thoughtful' as const
    : 'concerned' as const

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
        <h1 className="text-title text-on-surface">Weekly Report</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-10">
        {!report.hasEnoughData ? (
          <div className="flex flex-col items-center justify-center gap-4 p-8 mt-12">
            <LotiMascot expression="neutral" size="lg" />
            <p className="text-base font-medium text-text-primary text-center">Not enough data yet</p>
            <p className="text-sm text-text-secondary text-center">Log at least 3 meals this week to see your report.</p>
            <button
              onClick={() => navigate('/')}
              className="rounded-3xl bg-primary px-6 py-3 text-base font-medium text-white min-h-[44px]"
            >
              Start Scanning
            </button>
          </div>
        ) : (
          <>
            {/* Hero: Progress Ring + Mascot */}
            <div className="flex flex-col items-center pt-6 pb-4">
              <div className="flex items-center gap-4">
                <ProgressRing pct={report.greenPct} />
                <LotiMascot expression={mascotExpression} size="md" />
              </div>
              <p className="text-base font-medium text-text-primary mt-3">
                {report.greenPct >= 70 ? 'Great week!' : report.greenPct >= 40 ? 'Room to improve' : 'Tough week — you got this'}
              </p>
              {report.greenDelta !== 0 && report.prevGreenPct > 0 && (
                <p className="text-sm text-text-secondary mt-1">
                  {report.greenDelta > 0 ? '↑' : '↓'} {Math.abs(report.greenDelta)}% vs last week
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="mx-5 grid grid-cols-3 gap-3">
              <StatCard label="Scanned" value={String(report.totalScans)} sub={`${report.daysLogged}/7 days`} />
              <StatCard label="Streak" value={streak.currentStreak > 0 ? `${streak.currentStreak}d` : '—'} sub={streak.currentStreak > 0 ? '🔥' : undefined} />
              <StatCard label="Avg Cal" value={String(report.avgCalories)} sub="per day" />
            </div>

            {/* Traffic light breakdown */}
            <div className="mx-5 mt-4">
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                {report.greenPct > 0 && <div className="bg-tl-green-fill" style={{ width: `${report.greenPct}%` }} />}
                {report.yellowPct > 0 && <div className="bg-tl-yellow-fill" style={{ width: `${report.yellowPct}%` }} />}
                {report.redPct > 0 && <div className="bg-tl-red-fill" style={{ width: `${report.redPct}%` }} />}
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-text-tertiary">
                <span>{report.greenPct}% green</span>
                <span>{report.yellowPct}% yellow</span>
                <span>{report.redPct}% red</span>
              </div>
            </div>

            {/* Top Green Foods */}
            {report.topGreenFoods.length > 0 && (
              <div className="mx-5 mt-5">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Your best choices</p>
                <div className="rounded-xl bg-tl-green-bg p-4">
                  {report.topGreenFoods.map((food, i) => (
                    <div key={food} className="flex items-center gap-2 py-1">
                      <span className="text-tl-green-fill font-medium text-sm">{i + 1}.</span>
                      <span className="text-sm text-text-primary">{food}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Watch Out */}
            {report.topRedFood && (
              <div className="mx-5 mt-4">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Watch out</p>
                <div className="rounded-xl bg-tl-red-bg p-4">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{report.topRedFood}</span> was your most frequent red food this week.
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Check the OXXO guide for a healthier swap.</p>
                </div>
              </div>
            )}

            {/* Macro Averages */}
            <div className="mx-5 mt-4 grid grid-cols-3 gap-3">
              <StatCard label="Avg Carbs" value={`${report.avgCarbs}g`} sub="per day" />
              <StatCard label="Avg Protein" value={`${report.avgProtein}g`} sub="per day" />
              <StatCard label="Avg Cal" value={String(report.avgCalories)} sub="per day" />
            </div>

            {/* Loti's Tip */}
            <div className="mx-5 mt-5">
              <div className="flex items-start gap-3 rounded-3xl bg-primary-light p-4">
                <LotiMascot expression="happy" size="sm" />
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Loti's Tip</p>
                  <p className="text-sm text-text-primary leading-relaxed">{report.tip}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mx-5 mt-6">
              <button
                onClick={() => navigate('/')}
                className="w-full rounded-3xl bg-primary px-4 py-3.5 text-base font-semibold text-white min-h-[44px]"
              >
                Keep Going
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
