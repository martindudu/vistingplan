import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDayWarnings } from '../utils/validation'

test('buildDayWarnings reports dense long days', () => {
  const day = {
    id: 'day-1',
    title: 'Day 1',
    startTime: '08:00',
    items: Array.from({ length: 7 }, (_, index) => ({
      id: `p-${index}`,
      name: `Place ${index}`,
      address: '',
      lat: 0,
      lng: 0,
      stayDuration: 120,
    })),
  }

  const result = buildDayWarnings(day)
  assert.equal(result.totalStay, 840)
  assert.ok(result.warnings.some(warning => warning.includes('景點偏多')))
  assert.ok(result.warnings.some(warning => warning.includes('12 小時')))
})
