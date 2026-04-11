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
}

interface DayPlan {
  id: string
  title: string
  items: ItineraryItem[]
}

const defaultCenter = {
  lat: 25.0330,
  lng: 121.5654,
}

interface SortableItemProps {
  item: ItineraryItem
  index: number
  onDelete: (id: string) => void
  getGoogleMapsUrl: (address: string) => string
  onStartNavigation?: () => void
  isLast?: boolean
}

// --- Icons ---
const IconMagic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2m0 12v-2M8 10H6m12 0h-2M9 4.5 7.5 3m10.5 10.5L16.5 12m-9 0L6 13.5M18 4.5 16.5 6"></path><path d="m3 21 9-9 3 3-9 9z"></path></svg>
)

const IconMapPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
)

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
)

const IconNavigation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
)

const IconDrag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
)

function SortableItem({ item, index, onDelete, getGoogleMapsUrl, onStartNavigation, isLast }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className={`itinerary-item ${isDragging ? 'dragging' : ''}`}>
      <div className="drag-handle" {...attributes} {...listeners}>
        <IconDrag />
      </div>
      
      {item.photoUrl && (
        <div className="item-photo" style={{ width: '120px', height: '100%', overflow: 'hidden', flexShrink: 0 }}>
          <img src={item.photoUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      
      <div className="item-content">
        <div className="item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="item-name" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{item.name}</div>
            {item.rating && (
              <div className="item-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#f59e0b', marginBottom: '8px' }}>
                <span>★ {item.rating}</span>
                <span style={{ color: 'var(--text-dim)' }}>({item.userRatingsTotal})</span>
              </div>
            )}
          </div>
          <button className="delete-button" onClick={() => onDelete(item.id)}>
            <IconTrash />
          </button>
        </div>
        
        <div className="item-address" style={{ marginBottom: '12px' }}>
          <a href={getGoogleMapsUrl(item.address)} target="_blank" rel="noopener noreferrer" className="address-link">
            <IconMapPin /> {item.address}
          </a>
        </div>

        {item.openingHours && (
          <div className="item-hours" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
            <div style={{ fontWeight: '600', marginBottom: '2px' }}>Opening Hours (Today):</div>
            <div>{item.openingHours[new Date().getDay() === 0 ? 6 : (new Date().getDay() - 1)] || 'N/A'}</div>
          </div>
        )}

        {item.travelTime && (
          <div className="travel-time" style={{ marginTop: '0', border: 'none', background: '#f1f5f9', padding: '8px 12px', borderRadius: '4px' }}>
            <IconClock /> {item.travelTime}
          </div>
        )}
      </div>
    </li>
  )
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [days, setDays] = useState<DayPlan[]>([
    { id: 'day-1', title: 'Day 1', items: [] }
  ])
  const [activeDayId, setActiveDayId] = useState('day-1')
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([])
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)

  const activeDay = days.find(d => d.id === activeDayId) || days[0]
  const itinerary = activeDay.items

  const setItinerary = (newItems: ItineraryItem[]) => {
    setDays(days.map(d => d.id === activeDayId ? { ...d, items: newItems } : d))
  }

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()
      if (place.geometry && place.geometry.location) {
        const newPlace: Place = {
          id: place.place_id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
          name: place.name || '',
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }
        setPlaces([...places, newPlace])
        setSelectedPlaces([newPlace])
        setMapCenter({ lat: newPlace.lat, lng: newPlace.lng })
        setSearchQuery('')
      }
    }
  }

  const fetchPlaceDetails = async (placeId: string): Promise<Partial<ItineraryItem>> => {
    if (!mapRef.current) return {}
    
    const service = new google.maps.places.PlacesService(mapRef.current)
    return new Promise((resolve) => {
      service.getDetails(
        { placeId, fields: ['photos', 'rating', 'user_ratings_total', 'opening_hours'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400 }),
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              openingHours: place.opening_hours?.weekday_text,
            })
          } else {
            resolve({})
          }
        }
      )
    })
  }

  const geocodePlace = async (query: string): Promise<Place | null> => {
    const geocoder = new google.maps.Geocoder()
    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) resolve(results)
        else reject(new Error(`找不到：${query}`))
      })
    })

    if (result && result.length > 0) {
      const place = result[0]
      const addressComponents = place.address_components || []
      const establishment = addressComponents.find(c => 
        c.types.includes('establishment') || c.types.includes('point_of_interest') || c.types.includes('tourist_attraction')
      )
      const placeName = establishment ? establishment.long_name : (place.formatted_address?.split(',')[0] || query)
      
      return {
        id: place.place_id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
        name: placeName,
        address: place.formatted_address || query,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      }
    }
    return null
  }

  const calculateTravelTimes = async (items: ItineraryItem[]) => {
    if (items.length < 2 || !directionsServiceRef.current) return

    const updatedItems = [...items]
    for (let i = 0; i < items.length - 1; i++) {
      const origin = { lat: items[i].lat, lng: items[i].lng }
      const destination = { lat: items[i + 1].lat, lng: items[i + 1].lng }

      try {
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsServiceRef.current!.route(
            { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
            (res, status) => {
              if (status === 'OK' && res) resolve(res)
              else reject(new Error('無法計算路線'))
            }
          )
        })
        const duration = result.routes[0].legs[0].duration?.text || '無法計算'
        updatedItems[i].travelTime = `Next Stop: ${duration}`
      } catch (err) {
        updatedItems[i].travelTime = 'N/A'
      }
    }
    setItinerary(updatedItems)
  }

  const calculateRoute = async (items: ItineraryItem[]) => {
    if (items.length < 2 || !directionsServiceRef.current) {
      setDirections(null)
      return
    }

    const waypoints = items.slice(1, -1).map(item => ({
      location: { lat: item.lat, lng: item.lng },
      stopover: true,
    }))

    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsServiceRef.current!.route(
          {
            origin: { lat: items[0].lat, lng: items[0].lng },
            destination: { lat: items[items.length - 1].lat, lng: items[items.length - 1].lng },
            waypoints: waypoints.length > 0 ? waypoints : undefined,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (res, status) => {
            if (status === 'OK' && res) resolve(res)
            else reject(new Error('無法計算路線'))
          }
        )
      })
      setDirections(result)
    } catch (err) {
      console.error('路線計算失敗:', err)
    }
  }

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    directionsServiceRef.current = new google.maps.DirectionsService()
    
    if (itinerary.length >= 2) {
      calculateTravelTimes(itinerary)
      calculateRoute(itinerary)
    }
  }, [itinerary])

  useEffect(() => {
    const savedDays = localStorage.getItem('travel-itinerary-days')
    if (savedDays) {
      try {
        const parsed = JSON.parse(savedDays)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDays(parsed)
          setActiveDayId(parsed[0].id)
        }
      } catch (e) {
        console.error('無法從 localStorage 讀取行程:', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('travel-itinerary-days', JSON.stringify(days))
  }, [days])

  const searchPlace = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError(null)

    try {
      const queries = searchQuery.split(/[\n,，]/).map(q => q.trim()).filter(q => q.length > 0)
      if (queries.length > 1 || isBatchMode) {
        const results = await Promise.allSettled(queries.map(q => geocodePlace(q)))
        const foundPlaces: Place[] = []
        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value) foundPlaces.push(res.value)
        })

        if (foundPlaces.length > 0) {
          setPlaces([...places, ...foundPlaces])
          setSelectedPlaces(foundPlaces)
          const avgLat = foundPlaces.reduce((sum, p) => sum + p.lat, 0) / foundPlaces.length
          const avgLng = foundPlaces.reduce((sum, p) => sum + p.lng, 0) / foundPlaces.length
          setMapCenter({ lat: avgLat, lng: avgLng })
        } else {
          setError('找不到景點')
        }
      } else {
        const place = await geocodePlace(queries[0])
        if (place) {
          setPlaces([...places, place])
          setSelectedPlaces([place])
          setMapCenter({ lat: place.lat, lng: place.lng })
        }
      }
      setSearchQuery('')
    } catch (err) {
      setError('搜尋失敗')
    } finally {
      setLoading(false)
    }
  }

  const addToItinerary = async (place: Place) => {
    if (itinerary.some(item => item.id === place.id)) {
      setError('該景點已在行程中')
      return
    }
    setLoading(true)
    const details = await fetchPlaceDetails(place.id)
    const newItem: ItineraryItem = { ...place, ...details }
    const updatedItinerary = [...itinerary, newItem]
    setItinerary(updatedItinerary)
    calculateTravelTimes(updatedItinerary)
    calculateRoute(updatedItinerary)
    setLoading(false)
  }

  const addMultipleToItinerary = async (placesToAdd: Place[]) => {
    setLoading(true)
    const newItems: ItineraryItem[] = []
    for (const p of placesToAdd) {
      if (!itinerary.some(item => item.id === p.id)) {
        const details = await fetchPlaceDetails(p.id)
        newItems.push({ ...p, ...details })
      }
    }
    const updatedItinerary = [...itinerary, ...newItems]
    setItinerary(updatedItinerary)
    calculateTravelTimes(updatedItinerary)
    calculateRoute(updatedItinerary)
    setLoading(false)
  }

  const removeFromItinerary = (id: string) => {
    const updatedItinerary = itinerary.filter(item => item.id !== id)
    setItinerary(updatedItinerary)
    calculateTravelTimes(updatedItinerary)
    calculateRoute(updatedItinerary)
  }

  const addDay = () => {
    const newDayId = `day-${days.length + 1}`
    setDays([...days, { id: newDayId, title: `Day ${days.length + 1}`, items: [] }])
    setActiveDayId(newDayId)
  }

  const removeDay = (id: string) => {
    if (days.length === 1) return
    const newDays = days.filter(d => d.id !== id)
    setDays(newDays)
    if (activeDayId === id) setActiveDayId(newDays[0].id)
  }

  const optimizeItinerary = async () => {
    if (itinerary.length < 3 || !directionsServiceRef.current) return
    setLoading(true)
    try {
      const origin = { lat: itinerary[0].lat, lng: itinerary[0].lng }
      const destination = { lat: itinerary[itinerary.length - 1].lat, lng: itinerary[itinerary.length - 1].lng }
      const waypoints = itinerary.slice(1, -1).map(item => ({ location: { lat: item.lat, lng: item.lng }, stopover: true }))

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsServiceRef.current!.route({ origin, destination, waypoints, travelMode: google.maps.TravelMode.DRIVING, optimizeWaypoints: true }, (res, status) => {
          if (status === 'OK' && res) resolve(res)
          else reject(new Error('Optimization failed'))
        })
      })

      const order = result.routes[0].waypoint_order
      const middleItems = itinerary.slice(1, -1)
      const optimizedMiddle = order.map(idx => middleItems[idx])
      const newItinerary = [itinerary[0], ...optimizedMiddle, itinerary[itinerary.length - 1]]

      setItinerary(newItinerary)
      calculateTravelTimes(newItinerary)
      setDirections(result)
    } catch (err) {
      setError('優化失敗')
    } finally {
      setLoading(false)
    }
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = itinerary.findIndex(item => item.id === active.id)
      const newIndex = itinerary.findIndex(item => item.id === over.id)
      const newItems = arrayMove(itinerary, oldIndex, newIndex)
      setItinerary(newItems)
      calculateTravelTimes(newItems)
      calculateRoute(newItems)
    }
  }

  const getGoogleMapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  const startNavigation = () => {
    if (itinerary.length === 0) return
    const waypoints = itinerary.slice(0, -1).map(item => encodeURIComponent(item.address)).join('|')
    const destination = encodeURIComponent(itinerary[itinerary.length - 1].address)
    window.open(`https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&destination=${destination}`, '_blank')
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  if (!apiKey) {
    return (
      <div className="container">
        <div className="header">
          <h1>Travel Architect</h1>
          <p>Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Environment Variables.</p>
        </div>
      </div>
    )
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={['places']}>
      <div className="container">
        <header className="header">
          <h1>Travel <br />Architect</h1>
          <p>Crafting seamless journeys through data and design. Start by adding your first destination.</p>
        </header>

        <main className="content">
          <section className="search-section">
            <div className="search-box">
              <label className="batch-mode-label">
                <input type="checkbox" className="batch-mode-checkbox" checked={isBatchMode} onChange={(e) => setIsBatchMode(e.target.checked)} />
                Batch Input Mode
              </label>
              
              {isBatchMode ? (
                <textarea className="search-input" placeholder="Enter multiple places, one per line..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} rows={5} style={{ resize: 'none' }} />
              ) : (
                <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                  <input type="text" className="search-input" placeholder="Where do you want to go?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </Autocomplete>
              )}
              <button className="search-button" onClick={searchPlace} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
              {error && <div className="error">{error}</div>}
            </div>

            {selectedPlaces.length > 0 && (
              <>
                <div className="map-container">
                  <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={selectedPlaces.length > 1 ? 12 : 15} onLoad={onMapLoad} options={{ streetViewControl: false, mapTypeControl: false, styles: [{ featureType: "water", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] }] }}>
                    {selectedPlaces.map(p => <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }} label={{ text: p.name, className: 'map-label' }} />)}
                    {directions && <DirectionsRenderer directions={directions} />}
                  </GoogleMap>
                </div>
                {selectedPlaces.length === 1 ? (
                  <div className="place-card">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>{selectedPlaces[0].name}</h3>
                    <p>{selectedPlaces[0].address}</p>
                    <button className="search-button" onClick={() => addToItinerary(selectedPlaces[0])} style={{ marginTop: '0', background: 'var(--primary)' }}>Add to Itinerary</button>
                  </div>
                ) : (
                  <div className="places-results">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'var(--font-display)' }}>Results ({selectedPlaces.length})</h3>
                      <button className="search-button" onClick={() => addMultipleToItinerary(selectedPlaces)} style={{ marginTop: '0', width: 'auto', padding: '10px 20px', background: 'var(--primary)' }}>Add All</button>
                    </div>
                    {selectedPlaces.map(p => (
                      <div key={p.id} className="place-card" style={{ marginBottom: '16px' }}>
                        <h4 style={{ marginBottom: '4px', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>{p.name}</h4>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '16px', fontSize: '0.9rem' }}>{p.address}</p>
                        <button className="delete-button" onClick={() => addToItinerary(p)} style={{ color: 'var(--primary)', fontWeight: '600', padding: 0 }}>+ ADD ITEM</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="itinerary-section">
            <div className="day-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {days.map(day => (
                <div key={day.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setActiveDayId(day.id)} style={{ padding: '10px 20px', background: activeDayId === day.id ? 'var(--text-main)' : 'transparent', color: activeDayId === day.id ? '#fff' : 'var(--text-dim)', border: `1px solid ${activeDayId === day.id ? 'var(--text-main)' : 'var(--border)'}`, borderRadius: '4px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>{day.title}</button>
                  {days.length > 1 && <button onClick={() => removeDay(day.id)} style={{ marginLeft: '-10px', marginTop: '-20px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', zIndex: 2 }}>×</button>}
                </div>
              ))}
              <button onClick={addDay} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--primary)', border: '1px dashed var(--primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>+ Add Day</button>
            </div>

            <div className="itinerary-header">
              <h2 className="itinerary-title" style={{ fontFamily: 'var(--font-display)', fontSize: '3rem' }}>Your Route</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                {itinerary.length >= 3 && <button className="navigation-button-main" onClick={optimizeItinerary} disabled={loading} style={{ background: 'var(--text-main)' }}><IconMagic /> {loading ? 'Optimizing...' : 'Optimize'}</button>}
                {itinerary.length > 0 && <button className="navigation-button-main" onClick={startNavigation}><IconNavigation /> Navigate</button>}
              </div>
            </div>

            {itinerary.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <p>Your journey is a blank canvas. Start adding destinations to begin.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={itinerary.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  <ul className="itinerary-list">
                    {itinerary.map((item, index) => (
                      <SortableItem key={item.id} item={item} index={index} onDelete={removeFromItinerary} getGoogleMapsUrl={getGoogleMapsUrl} isLast={index === itinerary.length - 1} />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </section>
        </main>
      </div>
    </LoadScript>
  )
}
