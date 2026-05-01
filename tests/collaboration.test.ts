import assert from 'node:assert/strict'
import test from 'node:test'
import { canReadProject, canWriteProject, createProjectDraft, toggleVote } from '../utils/collaboration'
import type { TripProject } from '../types/itinerary'

const project: TripProject = {
  id: 'trip-1',
  title: 'Trip',
  visibility: 'private',
  permission: 'view',
  ownerToken: 'owner',
  version: 1,
  updatedAt: '2026-05-02T00:00:00.000Z',
  days: [],
  tripInfo: { currency: 'TWD', booking: {} },
  comments: [],
  votes: [],
}

test('collaboration permissions protect private trips', () => {
  assert.equal(canReadProject(project), false)
  assert.equal(canReadProject(project, 'owner'), true)
  assert.equal(canWriteProject(project, 'owner'), true)
})

test('public editable trips can be written by guests', () => {
  const publicProject = { ...project, visibility: 'public' as const, permission: 'edit' as const }
  assert.equal(canReadProject(publicProject), true)
  assert.equal(canWriteProject(publicProject), true)
})

test('votes toggle by item and voter', () => {
  const added = toggleVote([], 'place-1', 'A')
  assert.equal(added.length, 1)
  assert.equal(toggleVote(added, 'place-1', 'A').length, 0)
})

test('project draft carries plan data', () => {
  const draft = createProjectDraft([{ id: 'day-1', title: 'Day 1', items: [] }], { currency: 'TWD', booking: {} }, 'private', 'view', 'A')
  assert.equal(draft.days.length, 1)
  assert.equal(draft.visibility, 'private')
})
