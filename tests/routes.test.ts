import assert from 'node:assert/strict'
import test from 'node:test'
import type { ItineraryItem } from '../types/itinerary'
import { applyRouteTravelTimes } from '../utils/routes'

test('applyRouteTravelTimes returns updated items without mutating source', () => {
  const source: ItineraryItem[] = [
    { id: 'a', name: 'A', address: '', lat: 0, lng: 0 },
    { id: 'b', name: 'B', address: '', lat: 0, lng: 0 },
  ]
  const result = applyRouteTravelTimes(source, [{ duration: { text: '12 mins' } }])

  assert.equal(result[0].travelTime, '12 mins')
  assert.equal(source[0].travelTime, undefined)
})
