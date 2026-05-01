import type { ItineraryItem } from '../types/itinerary'

export const applyRouteTravelTimes = (items: ItineraryItem[], legs: Array<{ duration?: { text?: string } }>) => {
  const updatedItems = [...items]
  legs.forEach((leg, index) => {
    if (updatedItems[index]) updatedItems[index] = { ...updatedItems[index], travelTime: leg.duration?.text }
  })
  return updatedItems
}
