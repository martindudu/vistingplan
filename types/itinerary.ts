export interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

export interface ItineraryItem extends Place {
  type?: 'place' | 'meal' | 'note'
  travelTime?: string
  photoUrl?: string
  rating?: number
  userRatingsTotal?: number
  openingHours?: string[]
  notes?: string
  stayDuration?: number
  weather?: { temp: number, code: number }
}

export interface DayPlan {
  id: string
  title: string
  items: ItineraryItem[]
  startTime?: string
  date?: string
  notes?: string
}
