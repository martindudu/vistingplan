import type { DayPlan, TripInfo, TripPermission, TripProject, TripVisibility, TripVote } from '../types/itinerary'

export const CLOUD_USER_KEY = 'travel-architect-cloud-user-v1'
export const CLOUD_SESSION_KEY = 'travel-architect-cloud-session-v1'

export interface CloudSession {
  tripId: string
  ownerToken: string
}

export const createProjectDraft = (
  days: DayPlan[],
  tripInfo: TripInfo,
  visibility: TripVisibility,
  permission: TripPermission,
  _ownerName: string,
): Omit<TripProject, 'id' | 'ownerToken' | 'version' | 'updatedAt' | 'comments' | 'votes'> => ({
  title: days[0]?.title ? `${days[0].title} Trip` : 'Travel Architect Trip',
  visibility,
  permission,
  days,
  tripInfo,
})

export const canReadProject = (project: TripProject, token?: string) => project.visibility === 'public' || project.ownerToken === token

export const canWriteProject = (project: TripProject, token?: string) => project.ownerToken === token || (project.visibility === 'public' && project.permission === 'edit')

export const summarizeVotes = (votes: TripVote[]) => {
  return votes.reduce<Record<string, number>>((acc, vote) => {
    acc[vote.itemId] = (acc[vote.itemId] || 0) + vote.value
    return acc
  }, {})
}

export const toggleVote = (votes: TripVote[], itemId: string, voter: string): TripVote[] => {
  const exists = votes.some(vote => vote.itemId === itemId && vote.voter === voter)
  if (exists) return votes.filter(vote => !(vote.itemId === itemId && vote.voter === voter))
  return [...votes, { itemId, voter, value: 1 }]
}
