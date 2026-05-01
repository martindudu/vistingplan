import type { DayPlan, TripInfo } from '../types/itinerary'

interface BudgetPanelProps {
  days: DayPlan[]
  activeDayId: string
  tripInfo: TripInfo
  onTripInfoChange: (updates: Partial<TripInfo>) => void
}

const categoryLabels: Record<string, string> = {
  meal: '餐費',
  transport: '交通',
  lodging: '住宿',
  ticket: '門票',
  shopping: '購物',
  other: '其他',
}

const formatMoney = (value: number, currency: string) => `${currency} ${Math.round(value).toLocaleString()}`

export default function BudgetPanel({ days, activeDayId, tripInfo, onTripInfoChange }: BudgetPanelProps) {
  const activeDay = days.find(day => day.id === activeDayId) || days[0]
  const activeTotal = (activeDay?.items || []).reduce((sum, item) => sum + (item.cost || 0), 0)
  const tripTotal = days.reduce((sum, day) => sum + day.items.reduce((daySum, item) => daySum + (item.cost || 0), 0), 0)
  const remaining = (tripInfo.budgetLimit || 0) - tripTotal
  const categoryTotals = days.flatMap(day => day.items).reduce<Record<string, number>>((acc, item) => {
    const category = item.costCategory || 'other'
    acc[category] = (acc[category] || 0) + (item.cost || 0)
    return acc
  }, {})

  return (
    <section className="budget-panel">
      <div className="panel-heading">
        <div>
          <h2>預算</h2>
          <p>追蹤每日與整趟旅程花費。</p>
        </div>
      </div>
      <div className="budget-settings">
        <label>
          <span>幣別</span>
          <input value={tripInfo.currency} onChange={(e) => onTripInfoChange({ currency: e.target.value || 'TWD' })} />
        </label>
        <label>
          <span>總預算</span>
          <input type="number" min="0" value={tripInfo.budgetLimit || ''} onChange={(e) => onTripInfoChange({ budgetLimit: Number(e.target.value) || undefined })} />
        </label>
      </div>
      <div className="budget-summary-grid">
        <div><span>今日</span><strong>{formatMoney(activeTotal, tripInfo.currency)}</strong></div>
        <div><span>全旅程</span><strong>{formatMoney(tripTotal, tripInfo.currency)}</strong></div>
        <div className={tripInfo.budgetLimit && remaining < 0 ? 'over-budget' : undefined}><span>剩餘</span><strong>{tripInfo.budgetLimit ? formatMoney(remaining, tripInfo.currency) : '未設定'}</strong></div>
      </div>
      <div className="budget-category-list">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{formatMoney(categoryTotals[key] || 0, tripInfo.currency)}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
