import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeSharePayload, encodeSharePayload } from '../utils/export'
import type { DayPlan } from '../types/itinerary'

test('share payload can round-trip encoded itinerary data', async () => {
  const days: DayPlan[] = [{
    id: 'day-1',
    title: 'Day 1',
    startTime: '09:00',
    items: [{ id: 'a', name: 'A', address: 'Address', lat: 25.1, lng: 121.1 }],
  }]

  const encoded = await encodeSharePayload(days, 'DRIVING')
  const decoded = await decodeSharePayload(encoded)

  assert.equal(decoded.m, 'DRIVING')
  assert.equal(decoded.d[0].i[0].n, 'A')
})
