import type { DayPlan } from '../types/itinerary'
import { decodeSharePayload, encodeSharePayload } from './export'

export const buildShareLink = async (origin: string, pathname: string, days: DayPlan[], travelMode: string) => {
  const encoded = await encodeSharePayload(days, travelMode)
  return `${origin}${pathname}?plan=${encoded}`
}

export const parseSharePlan = (planData: string) => decodeSharePayload(planData)
