import { forwardRef } from 'react'
import type { DayPlan, ItineraryItem } from '../types/itinerary'
import type { PosterTemplate } from '../utils/export'

interface PosterRenderProps {
  activeDay: DayPlan
  itinerary: ItineraryItem[]
  schedule: Array<{ start: string, end: string }>
  posterTemplate: PosterTemplate
}

const PosterRender = forwardRef<HTMLDivElement, PosterRenderProps>(function PosterRender({ activeDay, itinerary, schedule, posterTemplate }, ref) {
  return (
    <div ref={ref} className={`poster-render poster-${posterTemplate}`}>
      <h1>Travel Plan</h1>
      <p className="poster-meta">{activeDay.title} · {activeDay.date || 'No date'} · Crafted by Travel Architect</p>
      <div className="poster-items">
        {itinerary.map((item, idx) => (
          <div key={item.id} className="poster-item">
            {posterTemplate !== 'compact' && <div className="poster-photo">{item.photoUrl && <img src={item.photoUrl} alt="" />}</div>}
            <div className="poster-copy">
              <div className="poster-time">{schedule[idx]?.start} - {schedule[idx]?.end}</div>
              <h3>{item.name}</h3>
              <p>{item.address}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

export default PosterRender
