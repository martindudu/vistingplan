import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFallbackAiPlan, normalizeAiPlan } from '../utils/aiPlanner'

test('fallback AI plan creates requested number of days', () => {
  const plan = buildFallbackAiPlan({ destination: '台南', daysCount: 2, style: '美食', mode: 'new-trip' })
  assert.equal(plan.days.length, 2)
  assert.ok(plan.days[0].items.length >= 3)
})

test('normalizeAiPlan repairs missing optional fields', () => {
  const plan = normalizeAiPlan({ days: [{ title: '', items: [{ name: '赤崁樓' }] }], explanation: '' }, { destination: '台南', daysCount: 1, style: '慢遊', mode: 'new-trip' })
  assert.equal(plan.days[0].startTime, '09:00')
  assert.equal(plan.days[0].items[0].stayDuration, 60)
  assert.match(plan.explanation, /初版行程/)
})
