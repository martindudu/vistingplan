import type { DayPlan } from '../types/itinerary'
import { buildSchedule, crossesTimeWindow, parseDur } from './time'

export const buildDayWarnings = (day: DayPlan) => {
  const schedule = buildSchedule(day)
  const totalStay = day.items.reduce((sum, item) => sum + (item.stayDuration || 60), 0)
  const totalTravel = day.items.reduce((sum, item) => sum + (item.travelTime ? parseDur(item.travelTime) : 0), 0)
  const daySpan = schedule.length ? totalStay + totalTravel : 0
  const textForMealCheck = day.items.map(item => `${item.name} ${item.notes || ''}`).join(' ')
  const hasMealStop = /(餐|食|飯|咖啡|茶|restaurant|cafe|lunch|dinner)/i.test(textForMealCheck)
  const warnings: string[] = []

  if (day.items.length >= 6) warnings.push('今日景點偏多，建議保留交通緩衝。')
  if (daySpan > 720) warnings.push('今日行程超過 12 小時，可能會太緊。')
  if (day.items.length >= 2 && totalTravel === 0) warnings.push('路線時間尚未完整計算，總時長可能偏低。')
  if (!hasMealStop && schedule.some(slot => crossesTimeWindow(slot.start, slot.end, 720, 810))) warnings.push('行程跨過午餐時段，可考慮安排用餐。')
  if (!hasMealStop && schedule.some(slot => crossesTimeWindow(slot.start, slot.end, 1080, 1170))) warnings.push('行程跨過晚餐時段，可考慮安排用餐。')

  return { totalStay, totalTravel, daySpan, warnings }
}
