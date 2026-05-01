import assert from 'node:assert/strict'
import test from 'node:test'
import { createDefaultDay, parseStoredPlan, serializePlan, STORAGE_VERSION } from '../utils/storage'

test('storage serializes versioned plans', () => {
  const day = createDefaultDay()
  const raw = serializePlan([day], day.id, 'DRIVING', { currency: 'TWD', booking: {} })
  const parsed = parseStoredPlan(raw)

  assert.equal(parsed?.version, STORAGE_VERSION)
  assert.equal(parsed?.activeDayId, day.id)
  assert.equal(parsed?.tripInfo.currency, 'TWD')
})

test('storage upgrades legacy plans without tripInfo', () => {
  const legacy = JSON.stringify({ days: [createDefaultDay()], activeDayId: 'day-1', travelMode: 'WALKING' })
  const parsed = parseStoredPlan(legacy)

  assert.equal(parsed?.version, 1)
  assert.equal(parsed?.travelMode, 'WALKING')
  assert.equal(parsed?.tripInfo.currency, 'TWD')
})
