'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, Autocomplete, StreetViewPanorama } from '@react-google-maps/api'
import html2canvas from 'html2canvas'
import dynamic from 'next/dynamic'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

interface ItineraryItem extends Place {
  travelTime?: string
  photoUrl?: string
  rating?: number
  userRatingsTotal?: number
  openingHours?: string[]
  notes?: string
  stayDuration?: number
  weather?: { temp: number, code: number }
}

const getWeatherIcon = (code?: number) => {
  if (code === undefined) return '☀️'
  if (code === 0) return '☀️'
  if (code < 4) return '☁️'
  if (code < 70) return '🌧️'
  return '❄️'
}

interface DayPlan {
  id: string
  title: string
  items: ItineraryItem[]
  startTime?: string
}

const addMinutes = (time: string, mins: number) => {
  if (!time) return '09:00'
  const [h, m] = time.split(':').map(Number)
  const d = new Date(); d.setHours(h, m + mins)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const parseDur = (t?: string) => {
  if (!t) return 0
  const m = t.match(/(\d+)\s*(h|m)/gi); let total = 0
  m?.forEach(x => { const v = parseInt(x); if (x.includes('h')) total += v * 60; else total += v })
  return total || 30
}

const defaultCenter = { lat: 25.0330, lng: 121.5654 }

// --- Icons ---
const IconMagic = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2m0 12v-2M8 10H6m12 0h-2M9 4.5 7.5 3m10.5 10.5L16.5 12m-9 0L6 13.5M18 4.5 16.5 6"></path><path d="m3 21 9-9 3 3-9 9z"></path></svg>)
const IconNavigation = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>)
const IconClock = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>)
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>)
const IconCar = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>)
const IconWalk = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 1.5-4 1.5 4"></path><path d="M10.5 14V8"></path><circle cx="10.5" cy="4.5" r="1.5"></circle><path d="M7 11h7"></path></svg>)
const IconTrain = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="2" rx="2"></rect><path d="M4 11h16"></path><path d="M12 2v16"></path><path d="m8 22 2-4"></path><path d="m16 22-2-4"></path></svg>)
const IconShare = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>)
const IconSparkles = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>)
const IconEye = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>)
const IconImage = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>)

function SortableItem({ item, onDelete, onUpdate, onPeek, startTime, endTime }: { item: ItineraryItem, onDelete: (id: string) => void, onUpdate: (id: string, updates: Partial<ItineraryItem>) => void, onPeek: (lat: number, lng: number) => void, startTime?: string, endTime?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 1 }

  return (
    <div ref={setNodeRef} style={style} className={`itinerary-item ${isDragging ? 'dragging' : ''}`} {...attributes} {...listeners}>
      <div className="card-accent" />
      {item.photoUrl && (<div className="item-photo-box"><img src={item.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>)}
      <div className="item-details">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {startTime && <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent)', marginBottom: '4px' }}>{startTime} - {endTime}</div>}
            <h3 className="item-name">{item.name}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
              <button className="btn-peek" onClick={(e) => { e.stopPropagation(); onPeek(item.lat, item.lng); }} style={{ padding: '4px 10px', fontSize: '0.7rem', width: 'auto', gap: '4px' }}>
                <IconEye /> 街景
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button className="delete-button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)' }}><IconTrash /></button>
            {item.weather && (
              <div className="weather-tag">
                {getWeatherIcon(item.weather.code)} {item.weather.temp}°C
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '600' }}>停留:</span>
            <select value={item.stayDuration || 60} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { stayDuration: parseInt(e.target.value) })} style={{ fontSize: '0.75rem', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '2px 4px', background: 'transparent', color: '#fff' }}>
              {[30, 60, 90, 120, 180, 240].map(v => <option key={v} value={v} style={{ color: '#000' }}>{v >= 60 ? `${v/60} 小時` : `${v} 分鐘`}</option>)}
            </select>
          </div>
          <textarea placeholder="新增備註..." value={item.notes || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { notes: e.target.value })} style={{ width: '100%', fontSize: '0.8rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px', padding: '8px', resize: 'none', fontFamily: 'inherit' }} rows={2} />
        </div>
        {item.travelTime && (<div className="travel-badge"><IconClock /> 下一站: {item.travelTime}</div>)}
      </div>
    </div>
  )
}

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [days, setDays] = useState<DayPlan[]>([{ id: 'day-1', title: 'Day 1', items: [], startTime: '09:00' }])
  const [activeDayId, setActiveDayId] = useState('day-1')
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
  const mapRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const posterRef = useRef<HTMLDivElement>(null)

  const activeDay = days.find(d => d.id === activeDayId) || days[0]
  const itinerary = activeDay.items

  const updateActiveDay = useCallback((updates: Partial<DayPlan>) => {
    setDays(prev => prev.map(d => d.id === activeDayId ? { ...d, ...updates } : d))
  }, [activeDayId])

  const updateActiveDayItems = useCallback((newItems: ItineraryItem[]) => {
    updateActiveDay({ items: newItems })
  }, [updateActiveDay])

  const handleUpdateItem = useCallback((id: string, updates: Partial<ItineraryItem>) => {
    updateActiveDayItems(itinerary.map(i => i.id === id ? { ...i, ...updates } : i))
  }, [itinerary, updateActiveDayItems])

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const schedule = useMemo(() => {
    return itinerary.reduce((acc: { start: string, end: string }[], item, idx) => {
      const start = idx === 0 ? (activeDay.startTime || '09:00') : addMinutes(acc[idx - 1].end, parseDur(itinerary[idx - 1].travelTime))
      const end = addMinutes(start, item.stayDuration || 60)
      acc.push({ start, end }); return acc
    }, [])
  }, [itinerary, activeDay.startTime])

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
      const data = await res.json()
      return { temp: data.current_weather.temperature, code: data.current_weather.weathercode }
    } catch (e) { return undefined }
  }

  const fetchDetails = async (placeId: string, lat: number, lng: number): Promise<Partial<ItineraryItem>> => {
    if (!mapRef.current || typeof google === 'undefined') return {}
    const service = new google.maps.places.PlacesService(mapRef.current)
    const weather = await fetchWeather(lat, lng)
    return new Promise((resolve) => {
      service.getDetails({ placeId, fields: ['photos', 'rating', 'opening_hours'] }, (p, status) => {
        if (status === 'OK' && p) resolve({ photoUrl: p.photos?.[0]?.getUrl({ maxWidth: 200 }), rating: p.rating, weather })
        else resolve({ weather })
      })
    })
  }

  const searchNearby = useCallback(async (location?: { lat: number, lng: number }) => {
    if (typeof google === 'undefined' || !mapRef.current) return
    setDiscoveryLoading(true)
    const service = new google.maps.places.PlacesService(mapRef.current)
    let center = location || (itinerary.length > 0 ? { lat: itinerary[itinerary.length - 1].lat, lng: itinerary[itinerary.length - 1].lng } : defaultCenter)
    service.nearbySearch({ location: center, radius: 3000, type: discoveryCategory as any }, (results, status) => {
      if (status === 'OK' && results) {
        setDiscoveryResults(results.slice(0, 10).map(r => ({ id: r.place_id || Date.now().toString(), name: r.name || '', address: r.vicinity || '', lat: r.geometry?.location?.lat() || 0, lng: r.geometry?.location?.lng() || 0, rating: r.rating, photoUrl: r.photos?.[0]?.getUrl({ maxWidth: 200 }), stayDuration: 60 })))
      }
      setDiscoveryLoading(false)
    })
  }, [discoveryCategory, itinerary])

  useEffect(() => { if (itinerary.length > 0 || discoveryResults.length > 0) searchNearby() }, [discoveryCategory, searchNearby])

  const onPlaceChanged = async () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        setLoading(true); const lat = place.geometry.location.lat(); const lng = place.geometry.location.lng()
        const details = await fetchDetails(place.place_id!, lat, lng)
        const newItem = { id: place.place_id || Date.now().toString(), name: place.name || '', address: place.formatted_address || '', lat, lng, stayDuration: 60, ...details }
        const newItinerary = [...itinerary, newItem]
        updateActiveDayItems(newItinerary); setMapCenter({ lat, lng }); calculateRoute(newItinerary); setSearchQuery(''); setLoading(false); searchNearby({ lat, lng })
      }
    }
  }

  const calculateRoute = useCallback(async (items: ItineraryItem[], mode: string = travelMode) => {
    if (items.length < 2 || !directionsServiceRef.current || typeof google === 'undefined') { setDirections(null); return }
    const res = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
      directionsServiceRef.current!.route({ origin: { lat: items[0].lat, lng: items[0].lng }, destination: { lat: items[items.length - 1].lat, lng: items[items.length - 1].lng }, waypoints: items.slice(1, -1).map(i => ({ location: { lat: i.lat, lng: i.lng }, stopover: true })), travelMode: mode as google.maps.TravelMode }, (result, status) => resolve(status === 'OK' ? result : null))
    })
    if (res) {
      setDirections(res); const updatedItems = [...items]
      res.routes[0].legs.forEach((leg, i) => { if (updatedItems[i]) updatedItems[i].travelTime = leg.duration?.text })
      updateActiveDayItems(updatedItems)
    }
  }, [travelMode, updateActiveDayItems])

  useEffect(() => { calculateRoute(itinerary, travelMode) }, [travelMode])

  const optimize = async () => {
    if (itinerary.length < 3 || !directionsServiceRef.current || typeof google === 'undefined') return
    setLoading(true)
    const res = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
      directionsServiceRef.current!.route({ origin: { lat: itinerary[0].lat, lng: itinerary[0].lng }, destination: { lat: itinerary[itinerary.length - 1].lat, lng: itinerary[itinerary.length - 1].lng }, waypoints: itinerary.slice(1, -1).map(i => ({ location: { lat: i.lat, lng: i.lng }, stopover: true })), travelMode: travelMode as google.maps.TravelMode, optimizeWaypoints: true }, (result, status) => resolve(status === 'OK' ? result : null))
    })
    if (res) {
      const order = res.routes[0].waypoint_order; const middle = itinerary.slice(1, -1); const optimized = [itinerary[0], ...order.map(i => middle[i]), itinerary[itinerary.length - 1]]
      res.routes[0].legs.forEach((leg, i) => { optimized[i].travelTime = leg.duration?.text })
      updateActiveDayItems(optimized); setDirections(res)
    }
    setLoading(false)
  }

  const generateShareLink = () => {
    try {
      const simplified = days.map(d => ({ t: d.title, s: d.startTime, i: d.items.map(item => ({ p: item.id, n: item.name, a: item.address, lt: item.lat, lg: item.lng, no: item.notes, sd: item.stayDuration })) }))
      const encoded = btoa(encodeURIComponent(JSON.stringify({ d: simplified, m: travelMode })))
      return `${window.location.origin}${window.location.pathname}?plan=${encoded}`
    } catch (e) { return null }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search); const planData = params.get('plan')
    if (planData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(planData)))
        setDays(decoded.d.map((day: any, idx: number) => ({ id: `day-${idx + 1}`, title: day.t, startTime: day.s || '09:00', items: day.i.map((item: any) => ({ id: item.p, name: item.n, address: item.a, lat: item.lt, lng: item.lg, notes: item.no, stayDuration: item.sd })) })))
        setTravelMode(decoded.m || 'DRIVING'); window.history.replaceState({}, '', window.location.pathname)
      } catch (e) {}
    }
  }, [])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = itinerary.findIndex(i => i.id === active.id), newIdx = itinerary.findIndex(i => i.id === over.id)
      const newItems = arrayMove(itinerary, oldIdx, newIdx); updateActiveDayItems(newItems); calculateRoute(newItems)
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={['places']}>
      <div className="main-layout">
        <aside className="sidebar">
          <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><h1>Travel <br />Architect</h1><p>您的專屬旅遊建築師。</p></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-outline" onClick={async () => { if (!posterRef.current) return; setLoading(true); const canvas = await html2canvas(posterRef.current, { useCORS: true, backgroundColor: '#0a0a0c' }); const link = document.createElement('a'); link.download = `TravelPlan.png`; link.href = canvas.toDataURL(); link.click(); setLoading(false); }}><IconImage /></button>
              <button className="btn-outline" onClick={() => { const link = generateShareLink(); if (link) { navigator.clipboard.writeText(link); alert('分享連結已複製！'); } }}><IconShare /></button>
            </div>
          </header>
          <div className="search-container"><Autocomplete onLoad={setAutocomplete} onPlaceChanged={onPlaceChanged}><input type="text" className="search-input" placeholder="您想去哪裡？" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></Autocomplete></div>
          <div className="transport-selector">{['DRIVING', 'WALKING', 'TRANSIT'].map(m => (<button key={m} className={`day-tab-btn ${travelMode === m ? 'active' : ''}`} onClick={() => setTravelMode(m)}>{m === 'DRIVING' ? <IconCar /> : m === 'WALKING' ? <IconWalk /> : <IconTrain />} {m === 'DRIVING' ? '開車' : m === 'WALKING' ? '走路' : '大眾運輸'}</button>))}</div>
          <div className="discovery-section"><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent)' }}><IconSparkles /> <h2 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase' }}>探索周邊</h2></div><div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>{['tourist_attraction', 'restaurant', 'lodging'].map(c => <button key={c} className={`day-tab-btn ${discoveryCategory === c ? 'active' : ''}`} onClick={() => setDiscoveryCategory(c)} style={{ fontSize: '0.7rem' }}>{c==='tourist_attraction'?'景點':c==='restaurant'?'美食':'住宿'}</button>)}</div><div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>{discoveryLoading ? <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>探索中...</div> : discoveryResults.map(res => (<div key={res.id} onClick={async () => { setLoading(true); const details = await fetchDetails(res.id, res.lat, res.lng); const updated = [...itinerary, { ...res, ...details }]; updateActiveDayItems(updated); calculateRoute(updated); setLoading(false) }} style={{ width: '120px', flexShrink: 0, cursor: 'pointer' }}><div style={{ width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', background: 'var(--glass-surface)', border: '1px solid var(--glass-border)' }}>{res.photoUrl ? <img src={res.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-dim)' }}>無照片</div>}</div><div style={{ fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.name}</div><div style={{ fontSize: '0.65rem', color: '#f59e0b' }}>★ {res.rating || 'N/A'}</div></div>))}</div></div>
          <div className="day-tabs">{days.map(d => (<button key={d.id} className={`day-tab-btn ${activeDayId === d.id ? 'active' : ''}`} onClick={() => setActiveDayId(d.id)}>{d.title}</button>))}<button className="day-tab-btn" onClick={() => { const newId = `day-${days.length + 1}`; setDays([...days, { id: newId, title: `Day ${days.length + 1}`, items: [], startTime: '09:00' }]); setActiveDayId(newId) }}>+ Add</button></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}><span style={{ fontSize: '0.85rem', fontWeight: '600' }}>今日出發時間:</span><input type="time" value={activeDay.startTime || '09:00'} onChange={(e) => updateActiveDay({ startTime: e.target.value })} style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: '800', cursor: 'pointer' }} /></div>
          <div className="itinerary-scroll-area">{itinerary.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>暫無行程</div> : (<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={itinerary.map(i => i.id)} strategy={verticalListSortingStrategy}>{itinerary.map((item, idx) => (<SortableItem key={item.id} item={item} onUpdate={handleUpdateItem} onDelete={(id) => { const updated = itinerary.filter(i => i.id !== id); updateActiveDayItems(updated); calculateRoute(updated); }} onPeek={(lat, lng) => { setStreetViewPos({lat, lng}); setShowStreetView(true); }} startTime={schedule[idx]?.start} endTime={schedule[idx]?.end} />))}</SortableContext></DndContext>)}</div>
          <div className="action-bar">{itinerary.length >= 3 && <button className="btn-outline" onClick={optimize} disabled={loading} style={{ flex: 1 }}><IconMagic /> 智慧排序</button>}{itinerary.length > 0 && <button className="btn-primary" onClick={() => { const wp = itinerary.slice(0, -1).map(i => encodeURIComponent(i.address)).join('|'), dest = encodeURIComponent(itinerary[itinerary.length - 1].address); window.open(`https://www.google.com/maps/dir/?api=1&waypoints=${wp}&destination=${dest}`, '_blank') }} style={{ flex: 2 }}><IconNavigation /> 開始導航</button>}</div>
        </aside>
        <section className="map-viewport">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={12}
            onLoad={(map) => { mapRef.current = map; if (typeof google !== 'undefined') directionsServiceRef.current = new google.maps.DirectionsService(); }}
            options={{ disableDefaultUI: true, styles: [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }, { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] }, { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] }, { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] }, { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }, { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] }, { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] }, { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] }, { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] }, { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] }, { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] }, { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }, { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] }, { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }] }}
          >
            {itinerary.map(p => <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }} label={{ text: p.name, className: 'map-label' }} />)}
            {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
            {showStreetView && streetViewPos && (<StreetViewPanorama options={{ position: streetViewPos, visible: showStreetView }} onCloseclick={() => setShowStreetView(false)} />)}
          </GoogleMap>
        </section>
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}><div ref={posterRef} style={{ width: '500px', padding: '40px', background: '#0a0a0c', color: '#fff', fontFamily: 'var(--font-body)' }}><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '8px' }}>Travel Plan</h1><p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '40px' }}>{activeDay.title} · Crafted by Travel Architect</p>{itinerary.map((item, idx) => (<div key={item.id} style={{ marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}><div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden' }}>{item.photoUrl && <img src={item.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div><div><div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#3b82f6' }}>{schedule[idx]?.start} - {schedule[idx]?.end}</div><h3 style={{ fontSize: '1.2rem', margin: '4px 0' }}>{item.name}</h3><p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{item.address}</p></div></div>))}</div></div>
      </div>
    </LoadScript>
  )
}

const DynamicHome = dynamic(() => Promise.resolve(HomeContent), { ssr: false })
export default DynamicHome
