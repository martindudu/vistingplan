import type { DayPlan, TripInfo } from '../types/itinerary'

export const STORAGE_KEY = 'travel-architect-plan-v1'
export const STORAGE_VERSION = 2

export const defaultTripInfo: TripInfo = { currency: 'TWD', booking: {} }

export const createDefaultDay = (): DayPlan => ({
  id: 'day-1',
  title: 'Day 1',
  items: [],
  startTime: '09:00',
  date: new Date().toISOString().slice(0, 10),
})

export const normalizeTripInfo = (value?: Partial<TripInfo>): TripInfo => ({
  ...defaultTripInfo,
  ...(value || {}),
  booking: value?.booking || {},
})

export const serializePlan = (days: DayPlan[], activeDayId: string, travelMode: string, tripInfo: TripInfo) => {
  return JSON.stringify({ version: STORAGE_VERSION, days, activeDayId, travelMode, tripInfo })
}

export const parseStoredPlan = (raw: string | null) => {
  if (!raw) return null
  const decoded = JSON.parse(raw)
  if (!Array.isArray(decoded.days) || decoded.days.length === 0) return null
  return {
    version: decoded.version || 1,
    days: decoded.days as DayPlan[],
    activeDayId: decoded.activeDayId || decoded.days[0].id,
    travelMode: decoded.travelMode || 'DRIVING',
    tripInfo: normalizeTripInfo(decoded.tripInfo),
  }
}
