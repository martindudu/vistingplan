import type { DayPlan } from '../types/itinerary'

export const addMinutes = (time: string, mins: number) => {
  if (!time) return '09:00'
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m + mins)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const parseDur = (t?: string) => {
  if (!t) return 0
  const m = t.match(/(\d+)\s*(h|m)/gi)
  let total = 0
  m?.forEach(x => {
    const v = parseInt(x)
    if (x.includes('h')) total += v * 60
    else total += v
  })
  return total || 30
}

export const formatMinutes = (mins: number) => {
  if (mins <= 0) return '0 分鐘'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (!h) return `${m} 分鐘`
  if (!m) return `${h} 小時`
  return `${h} 小時 ${m} 分鐘`
}

export const timeToMinutes = (time?: string) => {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const crossesTimeWindow = (start?: string, end?: string, from = 0, to = 0) => {
  if (!start || !end) return false
  const startMins = timeToMinutes(start)
  let endMins = timeToMinutes(end)
  if (endMins < startMins) endMins += 24 * 60
  return startMins <= to && endMins >= from
}

export const buildSchedule = (day: DayPlan) => {
  return day.items.reduce((acc: { start: string, end: string }[], item, idx) => {
    const start = idx === 0 ? (day.startTime || '09:00') : addMinutes(acc[idx - 1].end, parseDur(day.items[idx - 1].travelTime))
    const end = addMinutes(start, item.stayDuration || 60)
    acc.push({ start, end })
    return acc
  }, [])
}
