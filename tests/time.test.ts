import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSchedule, crossesTimeWindow, formatMinutes, parseDur } from '../utils/time'
import type { DayPlan } from '../types/itinerary'

test('parseDur handles mixed hour and minute strings', () => {
  assert.equal(parseDur('1 hour 25 mins'), 85)
  assert.equal(parseDur('45 mins'), 45)
})

test('buildSchedule creates sequential item slots', () => {
  const day: DayPlan = {
    id: 'day-1',
    title: 'Day 1',
    startTime: '09:00',
    items: [
      { id: 'a', name: 'A', address: '', lat: 0, lng: 0, stayDuration: 60, travelTime: '30 mins' },
      { id: 'b', name: 'B', address: '', lat: 0, lng: 0, stayDuration: 45 },
    ],
  }

  assert.deepEqual(buildSchedule(day), [
    { start: '09:00', end: '10:00' },
    { start: '10:30', end: '11:15' },
  ])
})

test('time helpers format and detect meal windows', () => {
  assert.equal(formatMinutes(95), '1 小時 35 分鐘')
  assert.equal(crossesTimeWindow('11:30', '12:30', 720, 810), true)
})
