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

export const getWeekdayIndex = (date?: string) => {
  const base = date ? new Date(`${date}T12:00:00`) : new Date()
  return Number.isNaN(base.getTime()) ? new Date().getDay() : base.getDay()
}

export const weekdayToGoogleIndex = (weekdayIndex: number) => (weekdayIndex + 6) % 7

export const parseClockToMinutes = (value: string) => {
  const clean = value.trim().toLowerCase()
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const period = match[3]
  if (period === 'pm' && hours < 12) hours += 12
  if (period === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export const parseOpeningIntervals = (openingText?: string) => {
  if (!openingText) return []
  if (/closed|休息|公休|不營業/i.test(openingText)) return []
  if (/24\s*hours|24 小時|24小時/i.test(openingText)) return [{ start: 0, end: 24 * 60 }]
  const ranges = openingText.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*[–—-]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/g) || []
  return ranges.flatMap(range => {
    const [startRaw, endRaw] = range.split(/[–—-]/)
    const start = parseClockToMinutes(startRaw)
    let end = parseClockToMinutes(endRaw)
    if (start === null || end === null) return []
    if (end <= start) end += 24 * 60
    return [{ start, end }]
  })
}

export const isWithinOpeningHours = (arrivalTime?: string, openingText?: string) => {
  if (!arrivalTime || !openingText) return true
  if (/closed|休息|公休|不營業/i.test(openingText)) return false
  const intervals = parseOpeningIntervals(openingText)
  if (intervals.length === 0) return true
  const arrival = timeToMinutes(arrivalTime)
  return intervals.some(interval => arrival >= interval.start && arrival <= interval.end)
}
