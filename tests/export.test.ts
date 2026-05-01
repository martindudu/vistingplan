import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCsv, buildIcs, buildTextSummary } from '../utils/export'
import type { DayPlan } from '../types/itinerary'

const day: DayPlan = {
  id: 'day-1',
  title: 'Day 1',
  startTime: '09:00',
  date: '2026-05-02',
  items: [
    {
      id: 'place-1',
      name: 'Museum',
      address: 'Main St',
      lat: 1,
      lng: 2,
      stayDuration: 60,
      cost: 300,
      costCategory: 'ticket',
      paymentStatus: 'paid',
      reservationCode: 'ABC123',
    },
  ],
}

test('text summary includes budget and reservation data', () => {
  const text = buildTextSummary([day])
  assert.match(text, /費用 300/)
  assert.match(text, /編號：ABC123/)
})

test('csv exports phase 6 budget columns', () => {
  const csv = buildCsv([day])
  assert.match(csv, /Cost,Category,Payment,ReservationCode/)
  assert.match(csv, /ABC123/)
})

test('ics exports calendar events', () => {
  const ics = buildIcs([day])
  assert.match(ics, /BEGIN:VCALENDAR/)
  assert.match(ics, /SUMMARY:Day 1 - Museum/)
})
