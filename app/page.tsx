'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { LoadScript, Autocomplete } from '@react-google-maps/api'
import html2canvas from 'html2canvas'
import dynamic from 'next/dynamic'
import AiPlannerDialog from '../components/AiPlannerDialog'
import BookingPanel from '../components/BookingPanel'
import BudgetPanel from '../components/BudgetPanel'
import ExportDialog from '../components/ExportDialog'
import ItineraryCard from '../components/ItineraryItem'
import MapView from '../components/MapView'
import PosterRender from '../components/PosterRender'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useItinerary } from '../hooks/useItinerary'
import type { ItineraryItem, TripInfo } from '../types/itinerary'
import { buildCsv, buildGoogleCalendarUrl, buildIcs, buildLineShareText, buildTextSummary, buildXlsxBlob, type PosterTemplate } from '../utils/export'
import { buildShareLink, parseSharePlan } from '../utils/share'
import { createDefaultDay, defaultTripInfo, parseStoredPlan, serializePlan, STORAGE_KEY } from '../utils/storage'
import { applyRouteTravelTimes } from '../utils/routes'
import { buildSchedule, crossesTimeWindow, formatMinutes, getWeekdayIndex, isWithinOpeningHours, parseDur, weekdayToGoogleIndex } from '../utils/time'
import { buildDayWarnings } from '../utils/validation'
import type { AiPlannerRequest, AiPlannerResponse, AiPlanPlace } from '../utils/aiPlanner'

type ToastType = 'success' | 'error' | 'info'
type MobileView = 'plan' | 'map'
type ExportScope = 'active' | 'all'
type CustomItemType = 'place' | 'note'
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

const defaultCenter = { lat: 25.0330, lng: 121.5654 }

// --- Icons ---
const IconMagic = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2m0 12v-2M8 10H6m12 0h-2M9 4.5 7.5 3m10.5 10.5L16.5 12m-9 0L6 13.5M18 4.5 16.5 6"></path><path d="m3 21 9-9 3 3-9 9z"></path></svg>)
const IconNavigation = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>)
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>)
const IconCar = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>)
const IconWalk = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 1.5-4 1.5 4"></path><path d="M10.5 14V8"></path><circle cx="10.5" cy="4.5" r="1.5"></circle><path d="M7 11h7"></path></svg>)
const IconTrain = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="2" rx="2"></rect><path d="M4 11h16"></path><path d="M12 2v16"></path><path d="m8 22 2-4"></path><path d="m16 22-2-4"></path></svg>)
const IconShare = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>)
const IconSparkles = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>)

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const { days, setDays, activeDay, activeDayId, setActiveDayId, itinerary, updateActiveDay, updateDayItems, updateActiveDayItems } = useItinerary()
  const [tripInfo, setTripInfo] = useState<TripInfo>(defaultTripInfo)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [discoveryResults, setDiscoveryResults] = useState<ItineraryItem[]>([])
  const [discoveryCategory, setDiscoveryCategory] = useState<string>('tourist_attraction')
  const [discoveryLoading, setDiscoveryLoading] = useState(false)
  const [travelMode, setTravelMode] = useState<string>('DRIVING')
  const [showStreetView, setShowStreetView] = useState(false)
  const [streetViewPos, setStreetViewPos] = useState<{lat: number, lng: number} | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [hasRestored, setHasRestored] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>('plan')
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showAiPlanner, setShowAiPlanner] = useState(false)
  const [aiExplanation, setAiExplanation] = useState('')
  const [exportScope, setExportScope] = useState<ExportScope>('all')
  const [posterTemplate, setPosterTemplate] = useState<PosterTemplate>('classic')
  const [showOverview, setShowOverview] = useState(false)
  const [showCustomItemForm, setShowCustomItemForm] = useState(false)
  const [customItemType, setCustomItemType] = useState<CustomItemType>('place')
  const [customItemName, setCustomItemName] = useState('')
  const [customItemAddress, setCustomItemAddress] = useState('')
  const [customStayDuration, setCustomStayDuration] = useState(60)
  const mapRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { id, type, message }])
    window.setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3600)
  }, [])

  const updateTripInfo = useCallback((updates: Partial<TripInfo>) => {
    setTripInfo(prev => ({ ...prev, ...updates, booking: updates.booking || prev.booking }))
  }, [])

  const handleUpdateItem = useCallback((id: string, updates: Partial<ItineraryItem>) => {
    updateActiveDayItems(itinerary.map(i => i.id === id ? { ...i, ...updates } : i))
  }, [itinerary, updateActiveDayItems])

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const schedule = useMemo(() => {
    return buildSchedule(activeDay)
  }, [activeDay])

  const itinerarySummary = useMemo(() => {
    const validation = buildDayWarnings(activeDay)
    const endTime = schedule[schedule.length - 1]?.end || activeDay.startTime || '09:00'
    const googleWeekday = weekdayToGoogleIndex(getWeekdayIndex(activeDay.date))
    const warnings = [...validation.warnings]
    itinerary.forEach((item, idx) => {
      const openingText = item.openingHours?.[googleWeekday]
      if (openingText && !isWithinOpeningHours(schedule[idx]?.start, openingText)) {
        warnings.push(`${item.name} 抵達時可能未營業。`)
      }
    })

    return { ...validation, endTime, warnings }
  }, [activeDay, itinerary, schedule])

  const overviewDays = useMemo(() => {
    return days.map(day => {
      const daySchedule = buildSchedule(day)
      const totalStay = day.items.reduce((sum, item) => sum + (item.stayDuration || 60), 0)
      const totalTravel = day.items.reduce((sum, item) => sum + (item.travelTime ? parseDur(item.travelTime) : 0), 0)
      return {
        day,
        schedule: daySchedule,
        totalStay,
        totalTravel,
        endTime: daySchedule[daySchedule.length - 1]?.end || day.startTime || '09:00',
      }
    })
  }, [days])

  const fetchWeather = async (lat: number, lng: number, date?: string) => {
    try {
      const weatherUrl = date
        ? `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max&timezone=auto&start_date=${date}&end_date=${date}`
        : `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
      const res = await fetch(weatherUrl)
      if (!res.ok) throw new Error('weather failed')
      const data = await res.json()
      if (date && data.daily) return { temp: Math.round(data.daily.temperature_2m_max[0]), code: data.daily.weather_code[0] }
      return { temp: data.current_weather.temperature, code: data.current_weather.weathercode }
    } catch (e) {
      showToast('天氣資料暫時無法取得，行程仍可繼續編輯。', 'info')
      return undefined
    }
  }

  const fetchDetails = async (placeId: string, lat: number, lng: number): Promise<Partial<ItineraryItem>> => {
    if (!mapRef.current || typeof google === 'undefined') return {}
    const service = new google.maps.places.PlacesService(mapRef.current)
    const weather = await fetchWeather(lat, lng, activeDay.date)
    return new Promise((resolve) => {
      service.getDetails({ placeId, fields: ['photos', 'rating', 'opening_hours'] }, (p, status) => {
        if (status === 'OK' && p) resolve({ photoUrl: p.photos?.[0]?.getUrl({ maxWidth: 200 }), rating: p.rating, openingHours: p.opening_hours?.weekday_text, weather })
        else resolve({ weather })
      })
    })
  }

  const geocodeAiPlace = async (place: AiPlanPlace, destination: string, fallback?: ItineraryItem): Promise<ItineraryItem> => {
    const query = place.address || `${place.name}, ${destination}`
    const base = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: place.type || 'place',
      name: place.name,
      address: query || 'AI 建議地點',
      lat: fallback?.lat || mapCenter.lat || defaultCenter.lat,
      lng: fallback?.lng || mapCenter.lng || defaultCenter.lng,
      notes: place.notes,
      stayDuration: place.stayDuration || 60,
      cost: place.cost,
      costCategory: place.costCategory,
    } as ItineraryItem

    if (typeof google === 'undefined') return base

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location
          resolve({ ...base, address: results[0].formatted_address || base.address, lat: loc.lat(), lng: loc.lng() })
        } else {
          resolve(base)
        }
      })
    })
  }

  const generateAiPlan = async (request: AiPlannerRequest) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, currentDays: days, activeDayId }),
      })
      if (!res.ok) throw new Error('AI planner failed')
      const plan = await res.json() as AiPlannerResponse
      const generatedDays = await Promise.all(plan.days.map(async (day, dayIndex) => {
        const items: ItineraryItem[] = []
        for (const place of day.items) {
          items.push(await geocodeAiPlace(place, request.destination, items[items.length - 1] || itinerary[itinerary.length - 1]))
        }
        return {
          id: request.mode === 'active-day' && dayIndex === 0 ? activeDayId : `ai-day-${Date.now()}-${dayIndex}`,
          title: day.title || `Day ${dayIndex + 1}`,
          date: day.date,
          startTime: day.startTime || '09:00',
          notes: day.notes,
          items,
        }
      }))

      if (request.mode === 'active-day') {
        const nextDay = { ...activeDay, ...generatedDays[0], id: activeDayId }
        setDays(prev => prev.map(day => day.id === activeDayId ? nextDay : day))
        calculateRoute(nextDay.items, travelMode, activeDayId)
      } else {
        setDays(generatedDays)
        setActiveDayId(generatedDays[0].id)
        calculateRoute(generatedDays[0].items, travelMode, generatedDays[0].id)
      }
      setAiExplanation(plan.explanation)
      setShowAiPlanner(false)
      showToast('AI 行程已產生，可直接編輯。', 'success')
    } catch (error) {
      showToast('AI 行程產生失敗，請稍後再試。', 'error')
    } finally {
      setLoading(false)
    }
  }

  const searchNearby = useCallback(async (location?: { lat: number, lng: number }) => {
    if (typeof google === 'undefined' || !mapRef.current) return
    setDiscoveryLoading(true)
    const service = new google.maps.places.PlacesService(mapRef.current)
    let center = location || (itinerary.length > 0 ? { lat: itinerary[itinerary.length - 1].lat, lng: itinerary[itinerary.length - 1].lng } : defaultCenter)
    service.nearbySearch({ location: center, radius: 3000, type: discoveryCategory as any }, (results, status) => {
      if (status === 'OK' && results) {
        setDiscoveryResults(results.slice(0, 10).map(r => ({ id: r.place_id || Date.now().toString(), name: r.name || '', address: r.vicinity || '', lat: r.geometry?.location?.lat() || 0, lng: r.geometry?.location?.lng() || 0, rating: r.rating, photoUrl: r.photos?.[0]?.getUrl({ maxWidth: 200 }), stayDuration: 60 })))
      } else {
        setDiscoveryResults([])
        if (status !== 'ZERO_RESULTS') showToast('周邊探索暫時無法取得結果。', 'error')
      }
      setDiscoveryLoading(false)
    })
  }, [discoveryCategory, itinerary, showToast])

  useEffect(() => { if (itinerary.length > 0 || discoveryResults.length > 0) searchNearby() }, [discoveryCategory, searchNearby])

  const onPlaceChanged = async () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        setLoading(true); const lat = place.geometry.location.lat(); const lng = place.geometry.location.lng()
        const details = place.place_id ? await fetchDetails(place.place_id, lat, lng) : {}
        const newItem = { id: place.place_id || Date.now().toString(), name: place.name || '', address: place.formatted_address || '', lat, lng, stayDuration: 60, ...details }
        const newItinerary = [...itinerary, newItem]
        updateActiveDayItems(newItinerary); setMapCenter({ lat, lng }); calculateRoute(newItinerary); setSearchQuery(''); setLoading(false); searchNearby({ lat, lng })
      }
    }
  }

  const calculateRoute = useCallback(async (items: ItineraryItem[], mode: string = travelMode, dayId: string = activeDayId) => {
    if (items.length < 2 || !directionsServiceRef.current || typeof google === 'undefined') { setDirections(null); return }
    const res = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
      directionsServiceRef.current!.route({ origin: { lat: items[0].lat, lng: items[0].lng }, destination: { lat: items[items.length - 1].lat, lng: items[items.length - 1].lng }, waypoints: items.slice(1, -1).map(i => ({ location: { lat: i.lat, lng: i.lng }, stopover: true })), travelMode: mode as google.maps.TravelMode }, (result, status) => {
        if (status !== 'OK') showToast('路線暫時無法計算，請稍後再試或調整交通方式。', 'error')
        resolve(status === 'OK' ? result : null)
      })
    })
    if (res) {
      setDirections(res)
      updateDayItems(dayId, applyRouteTravelTimes(items, res.routes[0].legs))
    }
  }, [travelMode, activeDayId, updateDayItems, showToast])

  useEffect(() => { calculateRoute(itinerary, travelMode) }, [travelMode])

  const optimize = async () => {
    if (itinerary.length < 3 || !directionsServiceRef.current || typeof google === 'undefined') return
    setLoading(true)
    const res = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
      directionsServiceRef.current!.route({ origin: { lat: itinerary[0].lat, lng: itinerary[0].lng }, destination: { lat: itinerary[itinerary.length - 1].lat, lng: itinerary[itinerary.length - 1].lng }, waypoints: itinerary.slice(1, -1).map(i => ({ location: { lat: i.lat, lng: i.lng }, stopover: true })), travelMode: travelMode as google.maps.TravelMode, optimizeWaypoints: true }, (result, status) => {
        if (status !== 'OK') showToast('智慧排序失敗，請確認景點是否都能規劃路線。', 'error')
        resolve(status === 'OK' ? result : null)
      })
    })
    if (res) {
      const order = res.routes[0].waypoint_order; const middle = itinerary.slice(1, -1); const optimized = [itinerary[0], ...order.map(i => middle[i]), itinerary[itinerary.length - 1]]
      updateActiveDayItems(applyRouteTravelTimes(optimized, res.routes[0].legs)); setDirections(res); showToast('已依目前交通方式重新排序行程。', 'success')
    }
    setLoading(false)
  }

  const downloadBlob = (filename: string, blob: Blob) => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const generateShareLink = async () => {
    try {
      return await buildShareLink(window.location.origin, window.location.pathname, days, travelMode)
    } catch (e) { return null }
  }

  const getExportDays = () => exportScope === 'active' ? [activeDay] : days

  const copyTextSummary = async () => {
    try {
      await navigator.clipboard.writeText(buildTextSummary(getExportDays()))
      showToast('文字版行程摘要已複製。', 'success')
    } catch (e) {
      showToast('無法複製文字摘要，請檢查瀏覽器權限。', 'error')
    }
  }

  const exportCsv = () => {
    downloadBlob('TravelPlan.csv', new Blob([`\uFEFF${buildCsv(getExportDays())}`], { type: 'text/csv;charset=utf-8' }))
    showToast('CSV 行程已匯出。', 'success')
  }

  const exportXlsx = () => {
    downloadBlob('TravelPlan.xlsx', buildXlsxBlob(getExportDays()))
    showToast('Excel xlsx 行程已匯出。', 'success')
  }

  const exportIcs = () => {
    downloadBlob('TravelPlan.ics', new Blob([buildIcs(getExportDays())], { type: 'text/calendar;charset=utf-8' }))
    showToast('iCal 行程已匯出。', 'success')
  }

  const openGoogleCalendar = () => {
    const url = buildGoogleCalendarUrl(getExportDays())
    if (!url) {
      showToast('目前沒有可加入 Google Calendar 的行程。', 'info')
      return
    }
    window.open(url, '_blank')
    showToast('已開啟 Google Calendar 新增事件視窗。', 'success')
  }

  const shareLine = () => {
    const text = buildLineShareText(getExportDays())
    window.open(`https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(text)}`, '_blank')
    showToast('已開啟 LINE 分享格式。', 'success')
  }

  const exportPdf = () => {
    const printableDays = getExportDays()
    const htmlMap: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    const escapeHtml = (value?: string | number) => String(value ?? '').replace(/[&<>"']/g, char => htmlMap[char] || char)
    const body = printableDays.map(day => {
      const daySchedule = buildSchedule(day)
      const items = day.items.map((item, idx) => {
        const slot = daySchedule[idx]
        return `
          <section class="item">
            <div class="time">${escapeHtml(slot?.start)} - ${escapeHtml(slot?.end)}</div>
            <div>
              <h2>${escapeHtml(item.name)}</h2>
              <p>${escapeHtml(item.address)}</p>
              <small>停留 ${escapeHtml(formatMinutes(item.stayDuration || 60))}${item.travelTime ? ` · 下一站 ${escapeHtml(item.travelTime)}` : ''}</small>
              ${item.notes ? `<p class="note">${escapeHtml(item.notes)}</p>` : ''}
            </div>
          </section>
        `
      }).join('')
      return `
        <article class="day">
          <h1>${escapeHtml(day.title)}</h1>
          <p class="meta">出發 ${escapeHtml(day.startTime || '09:00')}</p>
          ${day.notes ? `<p class="note">${escapeHtml(day.notes)}</p>` : ''}
          ${items || '<p class="empty">暫無行程</p>'}
        </article>
      `
    }).join('')
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('無法開啟 PDF 列印視窗，請檢查瀏覽器彈窗權限。', 'error')
      return
    }
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Travel Plan</title>
          <style>
            body { margin: 40px; color: #161616; font-family: Arial, sans-serif; }
            .day { page-break-after: always; }
            .day:last-child { page-break-after: auto; }
            h1 { font-size: 32px; margin: 0 0 4px; }
            .meta, .note, .empty { color: #666; }
            .item { display: grid; grid-template-columns: 110px 1fr; gap: 20px; padding: 18px 0; border-top: 1px solid #ddd; }
            .time { color: #2563eb; font-weight: 800; }
            h2 { margin: 0 0 6px; font-size: 20px; }
            p { margin: 0 0 6px; line-height: 1.5; }
            small { color: #444; font-weight: 700; }
            @media print { body { margin: 24px; } }
          </style>
        </head>
        <body>${body}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    showToast('PDF 列印視窗已開啟，可選擇另存成 PDF。', 'success')
  }

  const exportPoster = async () => {
    if (!posterRef.current) return
    setLoading(true)
    try {
      const canvas = await html2canvas(posterRef.current, { useCORS: true, backgroundColor: '#0a0a0c' })
      const link = document.createElement('a')
      link.download = 'TravelPlan.png'
      link.href = canvas.toDataURL()
      link.click()
      showToast('海報已匯出。', 'success')
    } catch (e) {
      showToast('海報匯出失敗，請稍後再試。', 'error')
    } finally {
      setLoading(false)
    }
  }

  const refreshActiveDayWeather = async () => {
    if (!activeDay.date || itinerary.length === 0) return
    setLoading(true)
    try {
      const updated = await Promise.all(itinerary.map(async item => ({
        ...item,
        weather: await fetchWeather(item.lat, item.lng, activeDay.date),
      })))
      updateActiveDayItems(updated)
      showToast('已依行程日期更新天氣。', 'success')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadSavedPlan = async () => {
      const params = new URLSearchParams(window.location.search)
      const planData = params.get('plan')
      if (planData) {
        let loadedFromPlan = false
        try {
          const decoded = await parseSharePlan(planData)
          setDays(decoded.d.map((day: any, idx: number) => ({ id: `day-${idx + 1}`, title: day.t, startTime: day.s || '09:00', date: day.dt, notes: day.no, items: day.i.map((item: any) => ({ id: item.p, name: item.n, address: item.a, lat: item.lt, lng: item.lg, notes: item.no, stayDuration: item.sd, type: item.ty, cost: item.c, costCategory: item.cc, paymentStatus: item.ps, reservationCode: item.rc })) })))
          setActiveDayId('day-1')
          setTravelMode(decoded.m || 'DRIVING')
          window.history.replaceState({}, '', window.location.pathname)
          showToast('已載入分享行程。', 'success')
          loadedFromPlan = true
        } catch (e) {
          showToast('分享連結無法讀取，已改用本機保存行程。', 'error')
        }

        if (loadedFromPlan) {
          setHasRestored(true)
          return
        }
      }

      try {
        const decoded = parseStoredPlan(window.localStorage.getItem(STORAGE_KEY))
        if (decoded) {
          setDays(decoded.days)
          setActiveDayId(decoded.activeDayId)
          setTravelMode(decoded.travelMode)
          setTripInfo(decoded.tripInfo)
          showToast('已復原上次編輯的行程。', 'success')
        }
      } catch (e) {
        showToast('本機行程資料讀取失敗，已使用新的空白行程。', 'error')
      } finally {
        setHasRestored(true)
      }
    }

    loadSavedPlan()
  }, [showToast])

  useEffect(() => {
    if (!hasRestored) return
    try {
      window.localStorage.setItem(STORAGE_KEY, serializePlan(days, activeDayId, travelMode, tripInfo))
    } catch (e) {
      showToast('本機自動儲存失敗，請確認瀏覽器儲存空間。', 'error')
    }
  }, [days, activeDayId, travelMode, tripInfo, hasRestored, showToast])

  useEffect(() => {
    if (!apiKey) showToast('尚未設定 Google Maps API Key，地圖與搜尋功能可能無法使用。', 'error')
  }, [apiKey, showToast])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        showToast('離線快取啟用失敗，仍可正常線上使用。', 'info')
      })
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleAppInstalled = () => {
      setInstallPrompt(null)
      showToast('已安裝到裝置。', 'success')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [showToast])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = itinerary.findIndex(i => i.id === active.id), newIdx = itinerary.findIndex(i => i.id === over.id)
      const newItems = arrayMove(itinerary, oldIdx, newIdx); updateActiveDayItems(newItems); calculateRoute(newItems)
    }
  }

  const clearAllPlans = () => {
    if (!window.confirm('確定要清空所有行程嗎？')) return
    const freshDay = createDefaultDay()
    setDays([freshDay])
    setTripInfo(defaultTripInfo)
    setActiveDayId(freshDay.id)
    setDirections(null)
    setDiscoveryResults([])
    window.localStorage.removeItem(STORAGE_KEY)
    showToast('已清空所有行程。', 'success')
  }

  const addDay = () => {
    const newId = `day-${Date.now()}`
    const newDay = { id: newId, title: `Day ${days.length + 1}`, items: [], startTime: activeDay.startTime || '09:00', date: activeDay.date }
    setDays(prev => [...prev, newDay])
    setActiveDayId(newId)
    setDirections(null)
  }

  const duplicateActiveDay = () => {
    const newId = `day-${Date.now()}`
    const copiedDay = {
      ...activeDay,
      id: newId,
      title: `${activeDay.title} Copy`,
      items: activeDay.items.map(item => ({ ...item, id: `${item.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2)}`, travelTime: undefined })),
    }
    setDays(prev => [...prev, copiedDay])
    setActiveDayId(newId)
    setDirections(null)
    showToast('已複製目前 Day。', 'success')
  }

  const deleteActiveDay = () => {
    if (days.length === 1) {
      const freshDay = { ...activeDay, title: 'Day 1', items: [], startTime: activeDay.startTime || '09:00', date: activeDay.date || new Date().toISOString().slice(0, 10) }
      setDays([freshDay])
      setDirections(null)
      showToast('已清空目前 Day。', 'success')
      return
    }

    if (!window.confirm(`確定要刪除 ${activeDay.title} 嗎？`)) return
    const remainingDays = days.filter(day => day.id !== activeDayId)
    setDays(remainingDays)
    setActiveDayId(remainingDays[0].id)
    setDirections(null)
    showToast('已刪除目前 Day。', 'success')
  }

  const moveItemToDay = (itemId: string, targetDayId: string) => {
    if (targetDayId === activeDayId) return
    const item = itinerary.find(i => i.id === itemId)
    const targetDay = days.find(day => day.id === targetDayId)
    if (!item || !targetDay) return

    const movedItem = { ...item, travelTime: undefined }
    const nextActiveItems = itinerary.filter(i => i.id !== itemId)
    setDays(prev => prev.map(day => {
      if (day.id === activeDayId) return { ...day, items: nextActiveItems }
      if (day.id === targetDayId) return { ...day, items: [...day.items, movedItem] }
      return day
    }))
    calculateRoute(nextActiveItems)
    showToast(`已將 ${item.name} 移到 ${targetDay.title}。`, 'success')
  }

  const copyItemToDay = (itemId: string, targetDayId: string) => {
    const item = itinerary.find(i => i.id === itemId)
    const targetDay = days.find(day => day.id === targetDayId)
    if (!item || !targetDay) return

    const copiedItem = { ...item, id: `${item.id}-copy-${Date.now()}`, travelTime: undefined }
    setDays(prev => prev.map(day => day.id === targetDayId ? { ...day, items: [...day.items, copiedItem] } : day))
    showToast(`已將 ${item.name} 複製到 ${targetDay.title}。`, 'success')
  }

  const insertMealBreak = (meal: 'lunch' | 'dinner') => {
    const label = meal === 'lunch' ? '午餐' : '晚餐'
    const windowStart = meal === 'lunch' ? 720 : 1080
    const windowEnd = meal === 'lunch' ? 810 : 1170
    const insertAfterIndex = schedule.findIndex(slot => crossesTimeWindow(slot.start, slot.end, windowStart, windowEnd))
    const source = insertAfterIndex >= 0 ? itinerary[insertAfterIndex] : itinerary[itinerary.length - 1]
    const mealItem: ItineraryItem = {
      id: `${meal}-${Date.now()}`,
      type: 'meal',
      name: `${label} / 休息`,
      address: '自行安排用餐地點',
      lat: source?.lat || defaultCenter.lat,
      lng: source?.lng || defaultCenter.lng,
      stayDuration: 60,
      notes: '自動插入，可改成實際餐廳或休息點。',
    }
    const nextItems = [...itinerary]
    nextItems.splice(insertAfterIndex >= 0 ? insertAfterIndex + 1 : nextItems.length, 0, mealItem)
    updateActiveDayItems(nextItems)
    calculateRoute(nextItems)
    showToast(`已插入${label}時間。`, 'success')
  }

  const addCustomItem = () => {
    const name = customItemName.trim()
    if (!name) {
      showToast('請先輸入自訂項目名稱。', 'info')
      return
    }

    const anchor = itinerary[itinerary.length - 1]
    const customItem: ItineraryItem = {
      id: `custom-${customItemType}-${Date.now()}`,
      type: customItemType,
      name,
      address: customItemType === 'note' ? '備忘項目' : customItemAddress.trim() || '自訂地點',
      lat: anchor?.lat || mapCenter.lat || defaultCenter.lat,
      lng: anchor?.lng || mapCenter.lng || defaultCenter.lng,
      stayDuration: customStayDuration,
      notes: customItemType === 'note' ? customItemAddress.trim() : undefined,
    }

    const nextItems = [...itinerary, customItem]
    updateActiveDayItems(nextItems)
    calculateRoute(nextItems)
    setCustomItemName('')
    setCustomItemAddress('')
    setShowCustomItemForm(false)
    showToast(customItemType === 'note' ? '已新增備忘項目。' : '已新增自訂地點。', 'success')
  }

  const openNavigation = () => {
    if (itinerary.length === 0) return
    const waypoints = itinerary.slice(0, -1).map(i => encodeURIComponent(i.address || i.name)).join('|')
    const destination = encodeURIComponent(itinerary[itinerary.length - 1].address || itinerary[itinerary.length - 1].name)
    window.open(`https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&destination=${destination}`, '_blank')
  }

  const installPwa = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    showToast(choice.outcome === 'accepted' ? '正在安裝 Travel Architect。' : '已取消安裝。', choice.outcome === 'accepted' ? 'success' : 'info')
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={['places']}>
      <div className={`main-layout mobile-view-${mobileView}`}>
        <div className="toast-stack" aria-live="polite">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</div>
          ))}
        </div>
        {!apiKey && (
          <div className="api-warning">
            Google Maps API Key 尚未設定，請在 `.env.local` 加入 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`。
          </div>
        )}
        {showExportDialog && (
          <ExportDialog
            exportScope={exportScope}
            posterTemplate={posterTemplate}
            onScopeChange={setExportScope}
            onPosterTemplateChange={setPosterTemplate}
            onClose={() => setShowExportDialog(false)}
            onCopyText={copyTextSummary}
            onExportCsv={exportCsv}
            onExportXlsx={exportXlsx}
            onExportIcs={exportIcs}
            onOpenGoogleCalendar={openGoogleCalendar}
            onShareLine={shareLine}
            onExportPdf={exportPdf}
            onExportPoster={exportPoster}
          />
        )}
        {showAiPlanner && (
          <AiPlannerDialog
            defaultStartDate={activeDay.date || ''}
            defaultAccommodation={tripInfo.booking.accommodationAddress || tripInfo.booking.accommodation || ''}
            onClose={() => setShowAiPlanner(false)}
            onGenerate={generateAiPlan}
          />
        )}
        {showOverview && (
          <div className="modal-backdrop" role="presentation" onClick={() => setShowOverview(false)}>
            <section className="overview-dialog" role="dialog" aria-modal="true" aria-labelledby="overview-title" onClick={(e) => e.stopPropagation()}>
              <div className="export-dialog-header">
                <div>
                  <h2 id="overview-title">行程總覽</h2>
                  <p>快速檢視所有天數的時間、停留、交通與備註。</p>
                </div>
                <button className="dialog-close" onClick={() => setShowOverview(false)}>×</button>
              </div>
              <div className="overview-list">
                {overviewDays.map(({ day, schedule: daySchedule, totalStay, totalTravel, endTime }) => (
                  <article key={day.id} className="overview-day">
                    <div className="overview-day-header">
                      <div>
                        <h3>{day.title}</h3>
                        <p>{day.date || '未設定日期'} · {day.startTime || '09:00'} - {endTime}</p>
                      </div>
                      <button className={activeDayId === day.id ? 'active' : ''} onClick={() => { setActiveDayId(day.id); calculateRoute(day.items, travelMode, day.id); setShowOverview(false) }}>
                        {activeDayId === day.id ? '目前 Day' : '前往'}
                      </button>
                    </div>
                    <div className="overview-stats">
                      <span>{day.items.length} 項</span>
                      <span>停留 {formatMinutes(totalStay)}</span>
                      <span>交通 {formatMinutes(totalTravel)}</span>
                    </div>
                    {day.notes && <p className="overview-note">{day.notes}</p>}
                    <ol className="overview-items">
                      {day.items.length === 0 ? <li>暫無行程</li> : day.items.map((item, idx) => (
                        <li key={item.id}>
                          <span>{daySchedule[idx]?.start || '--:--'}</span>
                          <strong>{item.name}</strong>
                          {item.type === 'note' && <em>備忘</em>}
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
        <aside className="sidebar">
          <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><h1>Travel <br />Architect</h1><p>您的專屬旅遊建築師。</p></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {installPrompt && <button className="btn-outline install-button" onClick={installPwa}>安裝</button>}
              <button className="btn-outline export-button" onClick={() => setShowAiPlanner(true)}>AI</button>
              <button className="btn-outline export-button" onClick={() => setShowExportDialog(true)}>匯出</button>
              <button className="btn-outline" onClick={async () => { const link = await generateShareLink(); if (!link) { showToast('分享連結產生失敗。', 'error'); return } try { await navigator.clipboard.writeText(link); showToast('壓縮分享連結已複製。', 'success') } catch (e) { showToast('無法複製到剪貼簿，請檢查瀏覽器權限。', 'error') } }}><IconShare /></button>
            </div>
          </header>
          <div className="search-container"><Autocomplete onLoad={setAutocomplete} onPlaceChanged={onPlaceChanged}><input type="text" className="search-input" placeholder="您想去哪裡？" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></Autocomplete></div>
          <div className="transport-selector">{['DRIVING', 'WALKING', 'TRANSIT'].map(m => (<button key={m} className={`day-tab-btn ${travelMode === m ? 'active' : ''}`} onClick={() => setTravelMode(m)}>{m === 'DRIVING' ? <IconCar /> : m === 'WALKING' ? <IconWalk /> : <IconTrain />} {m === 'DRIVING' ? '開車' : m === 'WALKING' ? '走路' : '大眾運輸'}</button>))}</div>
          <div className="discovery-section"><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent)' }}><IconSparkles /> <h2 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase' }}>探索周邊</h2></div><div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>{['tourist_attraction', 'restaurant', 'lodging'].map(c => <button key={c} className={`day-tab-btn ${discoveryCategory === c ? 'active' : ''}`} onClick={() => setDiscoveryCategory(c)} style={{ fontSize: '0.7rem' }}>{c==='tourist_attraction'?'景點':c==='restaurant'?'美食':'住宿'}</button>)}</div><div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>{discoveryLoading ? <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>探索中...</div> : discoveryResults.map(res => (<div key={res.id} onClick={async () => { setLoading(true); const details = await fetchDetails(res.id, res.lat, res.lng); const updated = [...itinerary, { ...res, ...details }]; updateActiveDayItems(updated); calculateRoute(updated); setLoading(false) }} style={{ width: '120px', flexShrink: 0, cursor: 'pointer' }}><div style={{ width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', background: 'var(--glass-surface)', border: '1px solid var(--glass-border)' }}>{res.photoUrl ? <img src={res.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-dim)' }}>無照片</div>}</div><div style={{ fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.name}</div><div style={{ fontSize: '0.65rem', color: '#f59e0b' }}>★ {res.rating || 'N/A'}</div></div>))}</div></div>
          <div className="day-tabs">{days.map(d => (<button key={d.id} className={`day-tab-btn ${activeDayId === d.id ? 'active' : ''}`} onClick={() => { setActiveDayId(d.id); calculateRoute(d.items, travelMode, d.id) }}>{d.title}</button>))}<button className="day-tab-btn" onClick={addDay}>+ Add</button></div>
          <div className="day-editor">
            <input aria-label="Day 名稱" value={activeDay.title} onChange={(e) => updateActiveDay({ title: e.target.value })} />
            <button className="btn-outline" onClick={() => setShowOverview(true)} disabled={loading}>總覽</button>
            <button className="btn-outline" onClick={duplicateActiveDay} disabled={loading}>複製 Day</button>
            <button className="btn-outline" onClick={deleteActiveDay} disabled={loading}>{days.length === 1 ? '清空 Day' : '刪除 Day'}</button>
          </div>
          <div className="day-time-panel">
            <label><span>日期</span><input type="date" value={activeDay.date || ''} onChange={(e) => updateActiveDay({ date: e.target.value })} /></label>
            <label><span>出發</span><input type="time" value={activeDay.startTime || '09:00'} onChange={(e) => updateActiveDay({ startTime: e.target.value })} /></label>
            <button className="btn-outline" onClick={refreshActiveDayWeather} disabled={loading || itinerary.length === 0 || !activeDay.date}>更新天氣</button>
          </div>
          <div className="custom-item-panel">
            <div className="custom-item-header">
              <strong>自訂項目</strong>
              <button className="btn-outline" onClick={() => setShowCustomItemForm(prev => !prev)}>{showCustomItemForm ? '收合' : '+ 自訂'}</button>
            </div>
            {showCustomItemForm && (
              <div className="custom-item-form">
                <select value={customItemType} onChange={(e) => setCustomItemType(e.target.value as CustomItemType)}>
                  <option value="place">自訂地點</option>
                  <option value="note">備忘項目</option>
                </select>
                <input value={customItemName} onChange={(e) => setCustomItemName(e.target.value)} placeholder={customItemType === 'note' ? '例如：集合 / 休息 / 購物時間' : '地點名稱'} />
                <input value={customItemAddress} onChange={(e) => setCustomItemAddress(e.target.value)} placeholder={customItemType === 'note' ? '備忘內容，可留空' : '地址，可留空'} />
                <select value={customStayDuration} onChange={(e) => setCustomStayDuration(parseInt(e.target.value))}>
                  {[15, 30, 45, 60, 90, 120, 180].map(v => <option key={v} value={v}>{v >= 60 ? `${v / 60} 小時` : `${v} 分鐘`}</option>)}
                </select>
                <button className="btn-primary" onClick={addCustomItem}>加入目前 Day</button>
              </div>
            )}
          </div>
          <textarea className="day-notes" placeholder="今日備註，例如集合資訊、訂位、攜帶物品..." value={activeDay.notes || ''} onChange={(e) => updateActiveDay({ notes: e.target.value })} rows={2} />
          <div className="summary-panel">
            <div className="summary-grid">
              <div><span>預估結束</span><strong>{itinerarySummary.endTime}</strong></div>
              <div><span>景點</span><strong>{itinerary.length}</strong></div>
              <div><span>停留</span><strong>{formatMinutes(itinerarySummary.totalStay)}</strong></div>
              <div><span>交通</span><strong>{formatMinutes(itinerarySummary.totalTravel)}</strong></div>
            </div>
            {itinerarySummary.warnings.length > 0 && (
              <div className="summary-warnings">
                {itinerarySummary.warnings.map(warning => <div key={warning}>{warning}</div>)}
              </div>
            )}
            <div className="meal-actions">
              <button onClick={() => insertMealBreak('lunch')}>插入午餐</button>
              <button onClick={() => insertMealBreak('dinner')}>插入晚餐</button>
            </div>
          </div>
          <BudgetPanel days={days} activeDayId={activeDayId} tripInfo={tripInfo} onTripInfoChange={updateTripInfo} />
          <BookingPanel booking={tripInfo.booking} onChange={(booking) => updateTripInfo({ booking })} />
          {aiExplanation && <div className="ai-explanation"><strong>AI 說明</strong><p>{aiExplanation}</p></div>}
          <div className="itinerary-scroll-area">{itinerary.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>暫無行程</div> : (<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={itinerary.map(i => i.id)} strategy={verticalListSortingStrategy}>{itinerary.map((item, idx) => (<ItineraryCard key={item.id} item={item} days={days} activeDayId={activeDayId} onUpdate={handleUpdateItem} onMoveToDay={moveItemToDay} onCopyToDay={copyItemToDay} onDelete={(id) => { const updated = itinerary.filter(i => i.id !== id); updateActiveDayItems(updated); calculateRoute(updated); }} onPeek={(lat, lng) => { setStreetViewPos({lat, lng}); setShowStreetView(true); }} startTime={schedule[idx]?.start} endTime={schedule[idx]?.end} />))}</SortableContext></DndContext>)}</div>
          <div className="action-bar">{days.some(day => day.items.length > 0) && <button className="btn-outline" onClick={clearAllPlans} disabled={loading} style={{ flex: 1 }}><IconTrash /> 清空</button>}{itinerary.length >= 3 && <button className="btn-outline" onClick={optimize} disabled={loading} style={{ flex: 1 }}><IconMagic /> 智慧排序</button>}{itinerary.length > 0 && <button className="btn-primary" onClick={openNavigation} style={{ flex: 2 }}><IconNavigation /> 開始導航</button>}</div>
        </aside>
        <MapView
          itinerary={itinerary}
          mapCenter={mapCenter}
          directions={directions}
          showStreetView={showStreetView}
          streetViewPos={streetViewPos}
          onMapLoad={(map) => { mapRef.current = map; if (typeof google !== 'undefined') directionsServiceRef.current = new google.maps.DirectionsService() }}
          onCloseStreetView={() => setShowStreetView(false)}
        />
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <PosterRender ref={posterRef} activeDay={activeDay} itinerary={itinerary} schedule={schedule} posterTemplate={posterTemplate} />
        </div>
        <nav className="mobile-switcher" aria-label="手機版檢視切換">
          <button className={mobileView === 'plan' ? 'active' : ''} onClick={() => setMobileView('plan')}>行程</button>
          <button className={mobileView === 'map' ? 'active' : ''} onClick={() => setMobileView('map')}>地圖</button>
          <button onClick={openNavigation} disabled={itinerary.length === 0}><IconNavigation /> 導航</button>
        </nav>
      </div>
    </LoadScript>
  )
}

const DynamicHome = dynamic(() => Promise.resolve(HomeContent), { ssr: false })
export default DynamicHome
