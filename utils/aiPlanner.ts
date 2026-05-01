import type { DayPlan, ItineraryItem } from '../types/itinerary'

export type AiPlannerMode = 'new-trip' | 'active-day'

export interface AiPlannerRequest {
  destination: string
  daysCount: number
  style: string
  budget?: string
  startDate?: string
  accommodation?: string
  notes?: string
  mode: AiPlannerMode
  currentDays?: DayPlan[]
  activeDayId?: string
}

export interface AiPlanPlace {
  name: string
  address?: string
  type?: 'place' | 'meal' | 'note'
  notes?: string
  stayDuration?: number
  cost?: number
  costCategory?: ItineraryItem['costCategory']
}

export interface AiPlanDay {
  title: string
  date?: string
  startTime?: string
  notes?: string
  items: AiPlanPlace[]
}

export interface AiPlannerResponse {
  days: AiPlanDay[]
  explanation: string
}

export const aiPlanSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['days', 'explanation'],
  properties: {
    explanation: { type: 'string' },
    days: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'items'],
        properties: {
          title: { type: 'string' },
          date: { type: 'string' },
          startTime: { type: 'string' },
          notes: { type: 'string' },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name'],
              properties: {
                name: { type: 'string' },
                address: { type: 'string' },
                type: { type: 'string', enum: ['place', 'meal', 'note'] },
                notes: { type: 'string' },
                stayDuration: { type: 'number' },
                cost: { type: 'number' },
                costCategory: { type: 'string', enum: ['meal', 'transport', 'lodging', 'ticket', 'shopping', 'other'] },
              },
            },
          },
        },
      },
    },
  },
}

export const normalizeAiPlan = (plan: Partial<AiPlannerResponse>, request: AiPlannerRequest): AiPlannerResponse => {
  const safeDays = Array.isArray(plan.days) && plan.days.length > 0 ? plan.days : buildFallbackAiPlan(request).days
  return {
    explanation: String(plan.explanation || '已產生可編輯的初版行程，可再依交通時間與喜好調整。'),
    days: safeDays.slice(0, Math.max(1, request.daysCount || 1)).map((day, dayIndex) => ({
      title: String(day.title || `Day ${dayIndex + 1}`),
      date: day.date || addDate(request.startDate, dayIndex),
      startTime: day.startTime || '09:00',
      notes: day.notes || '',
      items: (Array.isArray(day.items) ? day.items : []).slice(0, 8).map((item, itemIndex) => ({
        name: String(item.name || `行程 ${itemIndex + 1}`),
        address: item.address || `${item.name || request.destination}, ${request.destination}`,
        type: item.type || inferItemType(item.name || ''),
        notes: item.notes || '',
        stayDuration: clampDuration(item.stayDuration),
        cost: typeof item.cost === 'number' ? Math.max(0, Math.round(item.cost)) : undefined,
        costCategory: item.costCategory || inferCostCategory(item.name || '', item.type),
      })),
    })),
  }
}

export const buildFallbackAiPlan = (request: AiPlannerRequest): AiPlannerResponse => {
  const dayCount = Math.max(1, request.daysCount || 1)
  const days = Array.from({ length: dayCount }, (_, index) => ({
    title: `Day ${index + 1} ${request.destination}`,
    date: addDate(request.startDate, index),
    startTime: '09:00',
    notes: `${request.style || '平衡'}風格初版，可依實際交通與營業時間微調。`,
    items: [
      { name: `${request.destination} 代表景點`, address: request.destination, type: 'place' as const, stayDuration: 90, notes: '安排主要地標與拍照時間。', costCategory: 'ticket' as const },
      { name: '午餐 / 休息', address: request.accommodation || request.destination, type: 'meal' as const, stayDuration: 60, notes: '依現場餐廳或訂位調整。', costCategory: 'meal' as const },
      { name: `${request.destination} 在地街區`, address: request.destination, type: 'place' as const, stayDuration: 120, notes: '保留散步與購物彈性。', costCategory: 'shopping' as const },
      { name: '晚餐', address: request.destination, type: 'meal' as const, stayDuration: 75, notes: '可改成實際餐廳。', costCategory: 'meal' as const },
    ],
  }))

  return {
    days,
    explanation: '目前未連上 AI 服務，已產生一份可編輯的 fallback 初版行程。',
  }
}

const clampDuration = (value?: number) => {
  if (!value || Number.isNaN(value)) return 60
  return Math.min(240, Math.max(15, Math.round(value)))
}

const inferItemType = (name: string): AiPlanPlace['type'] => /(午餐|晚餐|早餐|餐|咖啡|tea|lunch|dinner|breakfast|cafe)/i.test(name) ? 'meal' : 'place'

const inferCostCategory = (name: string, type?: AiPlanPlace['type']): ItineraryItem['costCategory'] => {
  if (type === 'meal' || /(餐|咖啡|tea|lunch|dinner|breakfast|cafe)/i.test(name)) return 'meal'
  if (/(票|展|館|museum|ticket)/i.test(name)) return 'ticket'
  return 'other'
}

const addDate = (startDate: string | undefined, offset: number) => {
  if (!startDate) return undefined
  const date = new Date(`${startDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return undefined
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}
