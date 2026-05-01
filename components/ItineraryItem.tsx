import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import type { DayPlan, ExpenseCategory, ItineraryItem as ItineraryItemType, PaymentStatus } from '../types/itinerary'

const IconClock = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>)
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>)
const IconEye = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>)

const getWeatherIcon = (code?: number) => {
  if (code === undefined) return '☀️'
  if (code === 0) return '☀️'
  if (code < 4) return '☁️'
  if (code < 70) return '🌧️'
  return '❄️'
}

const expenseCategories: Array<{ value: ExpenseCategory, label: string }> = [
  { value: 'meal', label: '餐費' },
  { value: 'transport', label: '交通' },
  { value: 'lodging', label: '住宿' },
  { value: 'ticket', label: '門票' },
  { value: 'shopping', label: '購物' },
  { value: 'other', label: '其他' },
]

const paymentStatuses: Array<{ value: PaymentStatus, label: string }> = [
  { value: 'unpaid', label: '未付款' },
  { value: 'reserved', label: '已預約' },
  { value: 'paid', label: '已付款' },
]

interface ItineraryItemProps {
  item: ItineraryItemType
  days: DayPlan[]
  activeDayId: string
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<ItineraryItemType>) => void
  onMoveToDay: (id: string, targetDayId: string) => void
  onCopyToDay: (id: string, targetDayId: string) => void
  onPeek: (lat: number, lng: number) => void
  startTime?: string
  endTime?: string
}

export default function ItineraryItem({ item, days, activeDayId, onDelete, onUpdate, onMoveToDay, onCopyToDay, onPeek, startTime, endTime }: ItineraryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 1 }
  const otherDays = days.filter(day => day.id !== activeDayId)

  return (
    <div ref={setNodeRef} style={style} className={`itinerary-item ${isDragging ? 'dragging' : ''}`} {...attributes} {...listeners}>
      <div className="card-accent" />
      {item.photoUrl && (<div className="item-photo-box"><img src={item.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>)}
      <div className="item-details">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {startTime && <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent)', marginBottom: '4px' }}>{startTime} - {endTime}</div>}
            <div className="item-title-row">
              <h3 className="item-name">{item.name}</h3>
              {item.type && item.type !== 'place' && <span className={`item-type-badge ${item.type}`}>{item.type === 'meal' ? '用餐' : '備忘'}</span>}
            </div>
            {item.type !== 'note' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <button className="btn-peek" onClick={(e) => { e.stopPropagation(); onPeek(item.lat, item.lng); }} style={{ padding: '4px 10px', fontSize: '0.7rem', width: 'auto', gap: '4px' }}>
                  <IconEye /> 街景
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button className="delete-button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)' }}><IconTrash /></button>
            {item.weather && <div className="weather-tag">{getWeatherIcon(item.weather.code)} {item.weather.temp}°C</div>}
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '600' }}>停留:</span>
            <select value={item.stayDuration || 60} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { stayDuration: parseInt(e.target.value) })} style={{ fontSize: '0.75rem', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '2px 4px', background: 'transparent', color: '#fff' }}>
              {[30, 60, 90, 120, 180, 240].map(v => <option key={v} value={v} style={{ color: '#000' }}>{v >= 60 ? `${v/60} 小時` : `${v} 分鐘`}</option>)}
            </select>
          </div>
          <div className="item-budget-tools" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <label><span>費用</span><input type="number" min="0" value={item.cost || ''} onChange={(e) => onUpdate(item.id, { cost: Number(e.target.value) || undefined })} placeholder="0" /></label>
            <label><span>分類</span><select value={item.costCategory || 'other'} onChange={(e) => onUpdate(item.id, { costCategory: e.target.value as ExpenseCategory })}>{expenseCategories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
            <label><span>付款</span><select value={item.paymentStatus || 'unpaid'} onChange={(e) => onUpdate(item.id, { paymentStatus: e.target.value as PaymentStatus })}>{paymentStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label><span>編號</span><input value={item.reservationCode || ''} onChange={(e) => onUpdate(item.id, { reservationCode: e.target.value })} placeholder="票券/預約" /></label>
          </div>
          <textarea placeholder="新增備註..." value={item.notes || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { notes: e.target.value })} style={{ width: '100%', fontSize: '0.8rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px', padding: '8px', resize: 'none', fontFamily: 'inherit' }} rows={2} />
          {otherDays.length > 0 && (
            <div className="item-day-tools" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              <select defaultValue="" aria-label="移動景點到其他天" onChange={(e) => { if (e.target.value) { onMoveToDay(item.id, e.target.value); e.target.value = '' } }}>
                <option value="">移到...</option>
                {otherDays.map(day => <option key={day.id} value={day.id}>{day.title}</option>)}
              </select>
              <select defaultValue="" aria-label="複製景點到其他天" onChange={(e) => { if (e.target.value) { onCopyToDay(item.id, e.target.value); e.target.value = '' } }}>
                <option value="">複製到...</option>
                {otherDays.map(day => <option key={day.id} value={day.id}>{day.title}</option>)}
              </select>
            </div>
          )}
        </div>
        {item.travelTime && (<div className="travel-badge"><IconClock /> 下一站: {item.travelTime}</div>)}
        {item.openingHours?.[0] && <div className="opening-hours">營業時間：{item.openingHours[0]}</div>}
      </div>
    </div>
  )
}
