import { useCallback, useState } from 'react'
import type { DayPlan, ItineraryItem } from '../types/itinerary'
import { createDefaultDay } from '../utils/storage'

export const useItinerary = () => {
  const [days, setDays] = useState<DayPlan[]>([createDefaultDay()])
  const [activeDayId, setActiveDayId] = useState('day-1')

  const activeDay = days.find(day => day.id === activeDayId) || days[0]
  const itinerary = activeDay.items

  const updateActiveDay = useCallback((updates: Partial<DayPlan>) => {
    setDays(prev => prev.map(day => day.id === activeDayId ? { ...day, ...updates } : day))
  }, [activeDayId])

  const updateDayItems = useCallback((dayId: string, newItems: ItineraryItem[]) => {
    setDays(prev => prev.map(day => day.id === dayId ? { ...day, items: newItems } : day))
  }, [])

  const updateActiveDayItems = useCallback((newItems: ItineraryItem[]) => {
    updateDayItems(activeDayId, newItems)
  }, [activeDayId, updateDayItems])

  return {
    days,
    setDays,
    activeDay,
    activeDayId,
    setActiveDayId,
    itinerary,
    updateActiveDay,
    updateDayItems,
    updateActiveDayItems,
  }
}
