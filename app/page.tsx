'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, Autocomplete } from '@react-google-maps/api'
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
  stayDuration?: number // in minutes
}

interface DayPlan {
  id: string
  title: string
  items: ItineraryItem[]
}

const defaultCenter = { lat: 25.0330, lng: 121.5654 }

// --- Icons ---
const IconMagic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2m0 12v-2M8 10H6m12 0h-2M9 4.5 7.5 3m10.5 10.5L16.5 12m-9 0L6 13.5M18 4.5 16.5 6"></path><path d="m3 21 9-9 3 3-9 9z"></path></svg>
)
const IconNavigation = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
)
const IconCar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>
)
const IconWalk = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 1.5-4 1.5 4"></path><path d="M10.5 14V8"></path><circle cx="10.5" cy="4.5" r="1.5"></circle><path d="M7 11h7"></path></svg>
)
const IconTrain = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="2" rx="2"></rect><path d="M4 11h16"></path><path d="M12 2v16"></path><path d="m8 22 2-4"></path><path d="m16 22-2-4"></path></svg>
)
const IconShare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
)

function SortableItem({ item, onDelete, onUpdate }: { item: ItineraryItem, onDelete: (id: string) => void, onUpdate: (id: string, updates: Partial<ItineraryItem>) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 1 }

  return (
    <div ref={setNodeRef} style={style} className={`itinerary-item ${isDragging ? 'dragging' : ''}`} {...attributes} {...listeners}>
      <div className="card-accent" />
      {item.photoUrl && (
        <div className="item-photo-box">
          <img src={item.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div className="item-details">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 className="item-name">{item.name}</h3>
          <button className="delete-button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
            <IconTrash />
          </button>
        </div>
        <div className="item-meta">
          {item.rating && <span>★ {item.rating}</span>}
          <span>{item.address.split(',')[0]}</span>
        </div>
        
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '600' }}>停留:</span>
            <select 
              value={item.stayDuration || 60} 
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onUpdate(item.id, { stayDuration: parseInt(e.target.value) })}
              style={{ fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px', background: 'transparent', color: '#fff' }}
            >
              <option value={30}>30 分鐘</option>
              <option value={60}>1 小時</option>
              <option value={90}>1.5 小時</option>
              <option value={120}>2 小時</option>
              <option value={180}>3 小時</option>
              <option value={240}>4 小時</option>
            </select>
          </div>
          <textarea 
            placeholder="新增備註 (如：預約號碼、必買清單...)"
            value={item.notes || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
            style={{ 
              width: '100%', 
              fontSize: '0.8rem', 
              border: 'none', 
              background: 'rgba(255,255,255,0.05)', 
              color: '#fff',
              borderRadius: '8px', 
              padding: '8px',
              resize: 'none',
              fontFamily: 'inherit'
            }}
            rows={2}
          />
        </div>

        {item.travelTime && (
          <div className="travel-badge">
            <IconClock /> {item.travelTime}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [days, setDays] = useState<DayPlan[]>([{ id: 'day-1', title: 'Day 1', items: [] }])
  const [activeDayId, setActiveDayId] = useState('day-1')
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [travelMode, setTravelMode] = useState<string>('DRIVING')
  const mapRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)

  const activeDay = days.find(d => d.id === activeDayId) || days[0]
  const itinerary = activeDay.items

  const updateActiveDayItems = (newItems: ItineraryItem[]) => {
    setDays(days.map(d => d.id === activeDayId ? { ...d, items: newItems } : d))
  }

  const handleUpdateItem = (id: string, updates: Partial<ItineraryItem>) => {
    const newItems = itinerary.map(item => item.id === id ? { ...item, ...updates } : item)
    updateActiveDayItems(newItems)
  }

  const fetchDetails = async (placeId: string): Promise<Partial<ItineraryItem>> => {
    if (!mapRef.current || typeof google === 'undefined') return {}
    const service = new google.maps.places.PlacesService(mapRef.current)
    return new Promise((resolve) => {
      service.getDetails({ placeId, fields: ['photos', 'rating', 'user_ratings_total', 'opening_hours'] }, (p, status) => {
        if (status === 'OK' && p) {
          resolve({
            photoUrl: p.photos?.[0]?.getUrl({ maxWidth: 200 }),
            rating: p.rating,
            openingHours: p.opening_hours?.weekday_text
          })
        } else resolve({})
      })
    })
  }

  const onPlaceChanged = async () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        setLoading(true)
        const details = await fetchDetails(place.place_id!)
        const newItem: ItineraryItem = {
          id: place.place_id || Date.now().toString(),
          name: place.name || '',
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          stayDuration: 60,
          ...details
        }
        const newItinerary = [...itinerary, newItem]
        updateActiveDayItems(newItinerary)
        setMapCenter({ lat: newItem.lat, lng: newItem.lng })
        calculateRoute(newItinerary, travelMode)
        setSearchQuery('')
        setLoading(false)
      }
    }
  }

  const calculateRoute = async (items: ItineraryItem[], mode: string = travelMode) => {
    if (items.length < 2 || !directionsServiceRef.current || typeof google === 'undefined') {
      setDirections(null)
      return
    }
    const res = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
      directionsServiceRef.current!.route({
        origin: { lat: items[0].lat, lng: items[0].lng },
        destination: { lat: items[items.length - 1].lat, lng: items[items.length - 1].lng },
        waypoints: items.slice(1, -1).map(i => ({ location: { lat: i.lat, lng: i.lng }, stopover: true })),
        travelMode: mode as google.maps.TravelMode
      }, (result, status) => resolve(status === 'OK' ? result : null))
    })
    if (res) {
      setDirections(res)
      const updatedItems = [...items]
      res.routes[0].legs.forEach((leg, i) => {
        if (updatedItems[i]) updatedItems[i].travelTime = leg.duration?.text
      })
      updateActiveDayItems(updatedItems)
    }
  }

  useEffect(() => {
    if (itinerary.length >= 2) {
      calculateRoute(itinerary, travelMode)
    }
  }, [travelMode])

  const optimize = async () => {
    if (itinerary.length < 3 || !directionsServiceRef.current || typeof google === 'undefined') return
    setLoading(true)
    const res = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
      directionsServiceRef.current!.route({
        origin: { lat: itinerary[0].lat, lng: itinerary[0].lng },
        destination: { lat: itinerary[itinerary.length - 1].lat, lng: itinerary[itinerary.length - 1].lng },
        waypoints: itinerary.slice(1, -1).map(i => ({ location: { lat: i.lat, lng: i.lng }, stopover: true })),
        travelMode: travelMode as google.maps.TravelMode,
        optimizeWaypoints: true
      }, (result, status) => resolve(status === 'OK' ? result : null))
    })
    if (res) {
      const order = res.routes[0].waypoint_order
      const middle = itinerary.slice(1, -1)
      const optimized = [itinerary[0], ...order.map(i => middle[i]), itinerary[itinerary.length - 1]]
      res.routes[0].legs.forEach((leg, i) => { optimized[i].travelTime = leg.duration?.text })
      updateActiveDayItems(optimized)
      setDirections(res)
    }
    setLoading(false)
  }

  const generateShareLink = () => {
    try {
      const simplifiedDays = days.map(day => ({
        t: day.title,
        i: day.items.map(item => ({
          p: item.id,
          n: item.name,
          a: item.address,
          lt: item.lat,
          lg: item.lng,
          no: item.notes || '',
          sd: item.stayDuration || 60
        }))
      }))
      const encoded = btoa(encodeURIComponent(JSON.stringify({ d: simplifiedDays, m: travelMode })))
      const url = `${window.location.origin}${window.location.pathname}?plan=${encoded}`
      return url
    } catch (e) {
      return null
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const planData = params.get('plan')
    if (planData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(planData)))
        const restoredDays: DayPlan[] = decoded.d.map((day: any, index: number) => ({
          id: `day-${index + 1}`,
          title: day.t,
          items: day.i.map((item: any) => ({
            id: item.p,
            name: item.n,
            address: item.a,
            lat: item.lt,
            lng: item.lg,
            notes: item.no,
            stayDuration: item.sd
          }))
        }))
        setDays(restoredDays)
        setTravelMode(decoded.m || 'DRIVING')
        window.history.replaceState({}, '', window.location.pathname)
      } catch (e) {}
    }
  }, [])

  const exportToText = () => {
    const shareLink = generateShareLink()
    let text = `📍 ${activeDay.title} 旅遊行程規劃\n\n`
    itinerary.forEach((item, index) => {
      text += `${index + 1}. ${item.name}\n`
      if (item.notes) text += `   📝 備註: ${item.notes}\n`
      if (item.travelTime && index < itinerary.length - 1) {
        text += `   ⬇️ 交通: ${item.travelTime}\n`
      }
      text += `\n`
    })
    text += `🌐 查看互動行程：\n${shareLink}\n\n--- 來自 Travel Architect ---`
    navigator.clipboard.writeText(text).then(() => {
      alert('行程摘要與分享連結已複製！')
    })
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = itinerary.findIndex(i => i.id === active.id)
      const newIdx = itinerary.findIndex(i => i.id === over.id)
      const newItems = arrayMove(itinerary, oldIdx, newIdx)
      updateActiveDayItems(newItems)
      calculateRoute(newItems)
    }
  }

  const startNav = () => {
    if (itinerary.length === 0) return
    const wp = itinerary.slice(0, -1).map(i => encodeURIComponent(i.address)).join('|')
    const dest = encodeURIComponent(itinerary[itinerary.length - 1].address)
    window.open(`https://www.google.com/maps/dir/?api=1&waypoints=${wp}&destination=${dest}`, '_blank')
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={['places']}>
      <div className="main-layout">
        <aside className="sidebar">
          <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Travel <br />Architect</h1>
              <p>您的專屬旅遊建築師。規劃完美旅程。</p>
            </div>
            <button className="btn-outline" onClick={exportToText} style={{ padding: '8px 12px', borderRadius: '8px' }}>
              <IconShare />
            </button>
          </header>

          <div className="search-container">
            <Autocomplete onLoad={setAutocomplete} onPlaceChanged={onPlaceChanged}>
              <input type="text" className="search-input" placeholder="您想去哪裡？" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </Autocomplete>
          </div>

          <div className="transport-selector">
            <button className={`day-tab-btn ${travelMode === 'DRIVING' ? 'active' : ''}`} onClick={() => setTravelMode('DRIVING')} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <IconCar /> 開車
            </button>
            <button className={`day-tab-btn ${travelMode === 'WALKING' ? 'active' : ''}`} onClick={() => setTravelMode('WALKING')} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <IconWalk /> 走路
            </button>
            <button className={`day-tab-btn ${travelMode === 'TRANSIT' ? 'active' : ''}`} onClick={() => setTravelMode('TRANSIT')} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <IconTrain /> 大眾運輸
            </button>
          </div>

          <div className="day-tabs">
            {days.map(d => (
              <button key={d.id} className={`day-tab-btn ${activeDayId === d.id ? 'active' : ''}`} onClick={() => setActiveDayId(d.id)}>
                {d.title}
              </button>
            ))}
            <button className="day-tab-btn" onClick={() => {
              const newId = `day-${days.length + 1}`
              setDays([...days, { id: newId, title: `Day ${days.length + 1}`, items: [] }])
              setActiveDayId(newId)
            }}>+ Add</button>
          </div>

          <div className="itinerary-scroll-area">
            {itinerary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>暫無行程，請從上方搜尋景點</div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={itinerary.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {itinerary.map(item => (
                    <SortableItem key={item.id} item={item} onUpdate={handleUpdateItem} onDelete={(id) => {
                      const updated = itinerary.filter(i => i.id !== id)
                      updateActiveDayItems(updated)
                      calculateRoute(updated)
                    }} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="action-bar">
            {itinerary.length >= 3 && (
              <button className="btn-outline" onClick={optimize} disabled={loading} style={{ flex: 1 }}>
                <IconMagic /> {loading ? '優化中...' : '智慧排序'}
              </button>
            )}
            {itinerary.length > 0 && (
              <button className="btn-primary" onClick={startNav} style={{ flex: 2 }}>
                <IconNavigation /> 開始導航
              </button>
            )}
          </div>
        </aside>

        <section className="map-viewport">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={12}
            onLoad={(map) => {
              mapRef.current = map
              if (typeof google !== 'undefined') {
                directionsServiceRef.current = new google.maps.DirectionsService()
              }
            }}
            options={{
              disableDefaultUI: true,
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
                { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
              ]
            }}
          >
            {itinerary.map(p => <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }} label={{ text: p.name, className: 'map-label' }} />)}
            {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
          </GoogleMap>
        </section>
      </div>
    </LoadScript>
  )
}
