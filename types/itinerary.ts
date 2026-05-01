export interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

export interface ItineraryItem extends Place {
  type?: 'place' | 'meal' | 'note'
  cost?: number
  costCategory?: ExpenseCategory
  paymentStatus?: PaymentStatus
  reservationCode?: string
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

export type ExpenseCategory = 'meal' | 'transport' | 'lodging' | 'ticket' | 'shopping' | 'other'

export type PaymentStatus = 'unpaid' | 'paid' | 'reserved'

export interface TripBookingInfo {
  accommodation?: string
  accommodationAddress?: string
  accommodationCode?: string
  flightInfo?: string
  ticketInfo?: string
  documentNotes?: string
  emergencyContact?: string
}

export interface TripInfo {
  currency: string
  budgetLimit?: number
  booking: TripBookingInfo
}

export type TripVisibility = 'private' | 'public'

export type TripPermission = 'view' | 'edit'

export interface TripComment {
  id: string
  itemId?: string
  author: string
  text: string
  createdAt: string
}

export interface TripVote {
  itemId: string
  voter: string
  value: 1
}

export interface TripProject {
  id: string
  title: string
  visibility: TripVisibility
  permission: TripPermission
  ownerToken: string
  version: number
  updatedAt: string
  days: DayPlan[]
  tripInfo: TripInfo
  comments: TripComment[]
  votes: TripVote[]
}
