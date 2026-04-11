'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api'
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
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '10px',
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`itinerary-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <IconDrag />
      </div>
      <div className="item-content">
        <div className="item-header">
          <div className="item-name">
            {item.name}
          </div>
          <button className="delete-button" onClick={() => onDelete(item.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconTrash /> REMOVE
            </div>
          </button>
        </div>
        <div className="item-address">
          <a
            href={getGoogleMapsUrl(item.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="address-link"
            onClick={(e) => {
              if (isDragging) e.preventDefault()
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconMapPin /> {item.address}
            </div>
          </a>
        </div>
        {item.travelTime && (
          <div className="travel-time">
            <IconClock /> {item.travelTime}
          </div>
        )}
        {isLast && onStartNavigation && (
          <button className="navigation-button" onClick={onStartNavigation} style={{ marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
            <IconNavigation /> Start Navigation
          </button>
        )}
      </div>
    </li>
  )
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([])
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)

  const geocodePlace = async (query: string): Promise<Place | null> => {
    const geocoder = new google.maps.Geocoder()
    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode(
        { address: query },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus
        ) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results)
          } else {
            reject(new Error(`找不到：${query}`))
          }
        }
      )
    })

    if (result && result.length > 0) {
      const place = result[0]
      const location = place.geometry.location
      
      let placeName = query
      const addressComponents: google.maps.GeocoderAddressComponent[] = place.address_components || []
      
      const establishment = addressComponents.find(
        (component: google.maps.GeocoderAddressComponent) =>
          component.types.includes('establishment') ||
          component.types.includes('point_of_interest') ||
          component.types.includes('tourist_attraction')
      )
      
      if (establishment) {
        placeName = establishment.long_name
      } else {
        const formattedAddress = place.formatted_address || ''
        placeName = formattedAddress.split(',')[0] || query
      }
      
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: placeName,
        address: place.formatted_address || query,
        lat: location.lat(),
        lng: location.lng(),
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
            {
              origin,
              destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (
              result: google.maps.DirectionsResult | null,
              status: google.maps.DirectionsStatus
            ) => {
              if (status === 'OK' && result) {
                resolve(result)
              } else {
                reject(new Error('無法計算路線'))
              }
            }
          )
        })

        const route = result.routes[0]
        const leg = route.legs[0]
        const duration = leg.duration?.text || '無法計算'
        updatedItems[i].travelTime = `前往下一站：${duration}`
      } catch (err) {
        updatedItems[i].travelTime = '無法計算行車時間'
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
          (
            result: google.maps.DirectionsResult | null,
            status: google.maps.DirectionsStatus
          ) => {
            if (status === 'OK' && result) {
              resolve(result)
            } else {
              reject(new Error('無法計算路線'))
            }
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
    const savedItinerary = localStorage.getItem('travel-itinerary')
    if (savedItinerary) {
      try {
        const parsed = JSON.parse(savedItinerary)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItinerary(parsed)
        }
      } catch (e) {
        console.error('無法從 localStorage 讀取行程:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (itinerary.length > 0) {
      localStorage.setItem('travel-itinerary', JSON.stringify(itinerary))
    } else {
      localStorage.removeItem('travel-itinerary')
    }
  }, [itinerary])

  const searchPlace = async () => {
    if (!searchQuery.trim()) {
      setError('請輸入景點名稱或地址')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const queries = searchQuery
        .split(/[\n,，]/)
        .map(q => q.trim())
        .filter(q => q.length > 0)

      if (queries.length > 1 || isBatchMode) {
        const searchPromises = queries.map(query => geocodePlace(query))
        const results = await Promise.allSettled(searchPromises)
        
        const foundPlaces: Place[] = []
        const errors: string[] = []

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            foundPlaces.push(result.value)
          } else {
            errors.push(queries[index])
          }
        })

        if (foundPlaces.length > 0) {
          setPlaces([...places, ...foundPlaces])
          setSelectedPlaces(foundPlaces)
          
          const avgLat = foundPlaces.reduce((sum, p) => sum + p.lat, 0) / foundPlaces.length
          const avgLng = foundPlaces.reduce((sum, p) => sum + p.lng, 0) / foundPlaces.length
          setMapCenter({ lat: avgLat, lng: avgLng })
          
          if (errors.length > 0) {
            setError(`部分景點找不到：${errors.join('、')}`)
          } else {
            setError(null)
          }
        } else {
          setError('所有景點都找不到，請檢查輸入')
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
      setError(err instanceof Error ? err.message : '搜尋失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const addToItinerary = (place: Place) => {
    if (itinerary.some(item => item.id === place.id)) {
      setError('該景點已在行程中')
      return
    }

    const newItem: ItineraryItem = { ...place }
    const updatedItinerary = [...itinerary, newItem]
    setItinerary(updatedItinerary)
    calculateTravelTimes(updatedItinerary)
    calculateRoute(updatedItinerary)
  }

  const addMultipleToItinerary = (placesToAdd: Place[]) => {
    const newItems: ItineraryItem[] = placesToAdd
      .filter(place => !itinerary.some(item => item.id === place.id))
      .map(place => ({ ...place }))
    
    if (newItems.length === 0) {
      setError('所有景點都已在行程中')
      return
    }

    const updatedItinerary = [...itinerary, ...newItems]
    setItinerary(updatedItinerary)
    calculateTravelTimes(updatedItinerary)
    calculateRoute(updatedItinerary)
    
    if (newItems.length < placesToAdd.length) {
      setError(`已加入 ${newItems.length} 個景點，${placesToAdd.length - newItems.length} 個已在行程中`)
    } else {
      setError(null)
    }
  }

  const removeFromItinerary = (id: string) => {
    const updatedItinerary = itinerary.filter(item => item.id !== id)
    setItinerary(updatedItinerary)
    calculateTravelTimes(updatedItinerary)
    calculateRoute(updatedItinerary)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = itinerary.findIndex((item) => item.id === active.id)
      const newIndex = itinerary.findIndex((item) => item.id === over.id)
      const newItems = arrayMove(itinerary, oldIndex, newIndex)
      
      setItinerary(newItems)
      calculateTravelTimes(newItems)
      calculateRoute(newItems)
    }
  }

  const getGoogleMapsUrl = (address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  const optimizeItinerary = async () => {
    if (itinerary.length < 3 || !directionsServiceRef.current) {
      if (itinerary.length < 3) setError('At least 3 destinations are needed for route optimization.')
      return
    }

    setLoading(true)
    setError(null)

    const origin = { lat: itinerary[0].lat, lng: itinerary[0].lng }
    const destination = { lat: itinerary[itinerary.length - 1].lat, lng: itinerary[itinerary.length - 1].lng }
    const waypoints = itinerary.slice(1, -1).map(item => ({
      location: { lat: item.lat, lng: item.lng },
      stopover: true,
    }))

    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsServiceRef.current!.route(
          {
            origin,
            destination,
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true,
          },
          (result, status) => {
            if (status === 'OK' && result) resolve(result)
            else reject(new Error('Optimization failed'))
          }
        )
      })

      const route = result.routes[0]
      const order = route.waypoint_order

      const middleItems = itinerary.slice(1, -1)
      const optimizedMiddle = order.map(index => middleItems[index])
      
      const newItinerary = [
        itinerary[0],
        ...optimizedMiddle,
        itinerary[itinerary.length - 1]
      ]

      setItinerary(newItinerary)
      calculateTravelTimes(newItinerary)
      setDirections(result)
      setError(null)
    } catch (err) {
      setError('Could not optimize route. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const startNavigation = () => {
    if (itinerary.length === 0) return

    if (itinerary.length === 1) {
      const destination = encodeURIComponent(itinerary[0].address)
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        '_blank'
      )
    } else {
      const waypoints = itinerary
        .slice(0, -1)
        .map((item) => encodeURIComponent(item.address))
        .join('|')
      const destination = encodeURIComponent(itinerary[itinerary.length - 1].address)
      
      window.open(
        `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&destination=${destination}`,
        '_blank'
      )
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  if (!apiKey) {
    return (
      <div className="container">
        <div className="header">
          <h1>旅遊規劃器</h1>
          <p>請設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 環境變數</p>
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
                <input
                  type="checkbox"
                  className="batch-mode-checkbox"
                  checked={isBatchMode}
                  onChange={(e) => setIsBatchMode(e.target.checked)}
                />
                Batch Input Mode
              </label>
              
              <textarea
                className="search-input"
                placeholder={isBatchMode ? "Enter multiple places, one per line..." : "Where do you want to go?"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rows={isBatchMode ? 5 : 1}
                style={{ resize: 'none' }}
              />
              <button className="search-button" onClick={searchPlace} disabled={loading}>
                {loading ? 'Searching...' : isBatchMode ? 'Process Batch' : 'Search Destination'}
              </button>
              {error && <div className="error">{error}</div>}
            </div>

            {selectedPlaces.length > 0 && (
              <>
                <div className="map-container">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={selectedPlaces.length > 1 ? 12 : 15}
                    onLoad={onMapLoad}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      styles: [
                        { featureType: "all", elementType: "labels.text.fill", color: "#334155" },
                        { featureType: "water", elementType: "geometry", color: "#e2e8f0" }
                      ]
                    }}
                  >
                    {selectedPlaces.map((place) => (
                      <Marker
                        key={place.id}
                        position={{ lat: place.lat, lng: place.lng }}
                        label={{ text: place.name, className: 'map-label' }}
                      />
                    ))}
                    {directions && <DirectionsRenderer directions={directions} />}
                  </GoogleMap>
                </div>

                {selectedPlaces.length === 1 ? (
                  <div className="place-card">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>{selectedPlaces[0].name}</h3>
                    <p>{selectedPlaces[0].address}</p>
                    <button
                      className="search-button"
                      onClick={() => addToItinerary(selectedPlaces[0])}
                      style={{ marginTop: '0', background: 'var(--primary)' }}
                    >
                      Add to Itinerary
                    </button>
                  </div>
                ) : (
                  <div className="places-results">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'var(--font-display)' }}>Results ({selectedPlaces.length})</h3>
                      <button
                        className="search-button"
                        onClick={() => addMultipleToItinerary(selectedPlaces)}
                        style={{ marginTop: '0', width: 'auto', padding: '10px 20px', background: 'var(--primary)' }}
                      >
                        Add All
                      </button>
                    </div>
                    {selectedPlaces.map((place) => (
                      <div key={place.id} className="place-card" style={{ marginBottom: '16px' }}>
                        <h4 style={{ marginBottom: '4px', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>{place.name}</h4>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '16px', fontSize: '0.9rem' }}>{place.address}</p>
                        <button
                          className="delete-button"
                          onClick={() => addToItinerary(place)}
                          style={{ color: 'var(--primary)', fontWeight: '600', padding: 0 }}
                        >
                          + ADD ITEM
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {places.length > 0 && (
              <div className="search-history">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '16px' }}>History</h3>
                {places.slice(-5).reverse().map((place) => (
                  <div
                    key={place.id}
                    className="history-item"
                    onClick={() => {
                      setSelectedPlaces([place])
                      setMapCenter({ lat: place.lat, lng: place.lng })
                    }}
                  >
                    <div className="history-item-name">{place.name}</div>
                    <div className="history-item-address">{place.address}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="itinerary-section">
            <div className="day-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {days.map((day) => (
                <div key={day.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => setActiveDayId(day.id)}
                    style={{
                      padding: '10px 20px',
                      background: activeDayId === day.id ? 'var(--text-main)' : 'transparent',
                      color: activeDayId === day.id ? '#fff' : 'var(--text-dim)',
                      border: `1px solid ${activeDayId === day.id ? 'var(--text-main)' : 'var(--border)'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {day.title}
                  </button>
                  {days.length > 1 && (
                    <button 
                      onClick={() => removeDay(day.id)}
                      style={{ 
                        marginLeft: '-10px', 
                        marginTop: '-20px', 
                        background: 'var(--danger)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '20px', 
                        height: '20px', 
                        fontSize: '12px', 
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addDay}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: 'var(--primary)',
                  border: '1px dashed var(--primary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}
              >
                + Add Day
              </button>
            </div>

            <div className="itinerary-header">
              <h2 className="itinerary-title" style={{ fontFamily: 'var(--font-display)', fontSize: '3rem' }}>Your Route</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                {itinerary.length >= 3 && (
                  <button 
                    className="navigation-button-main" 
                    onClick={optimizeItinerary}
                    disabled={loading}
                    style={{ background: 'var(--text-main)' }}
                  >
                    <IconMagic /> {loading ? 'Optimizing...' : 'Optimize'}
                  </button>
                )}
                {itinerary.length > 0 && (
                  <button className="navigation-button-main" onClick={startNavigation}>
                    <IconNavigation /> Navigate
                  </button>
                )}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={itinerary.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="itinerary-list">
                    {itinerary.map((item, index) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        index={index}
                        onDelete={removeFromItinerary}
                        getGoogleMapsUrl={getGoogleMapsUrl}
                        isLast={index === itinerary.length - 1}
                      />
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
 onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={itinerary.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="itinerary-list">
                    {itinerary.map((item, index) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        index={index}
                        onDelete={removeFromItinerary}
                        getGoogleMapsUrl={getGoogleMapsUrl}
                        isLast={index === itinerary.length - 1}
                      />
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
