import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import type { TripComment, TripProject } from '../../../types/itinerary'
import { canReadProject, canWriteProject, toggleVote } from '../../../utils/collaboration'

const STORE_DIR = path.join(process.cwd(), '.data')
const STORE_FILE = path.join(STORE_DIR, 'trips.json')

type Store = Record<string, TripProject>

const readStore = async (): Promise<Store> => {
  try {
    return JSON.parse(await readFile(STORE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

const writeStore = async (store: Store) => {
  await mkdir(STORE_DIR, { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8')
}

const newId = () => Math.random().toString(36).slice(2, 10)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id') || ''
  const token = url.searchParams.get('token') || undefined
  const store = await readStore()
  const project = store[id]

  if (!project) return NextResponse.json({ error: 'trip not found' }, { status: 404 })
  if (!canReadProject(project, token)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  return NextResponse.json(project)
}

export async function POST(request: Request) {
  const body = await request.json()
  const action = body.action || 'save'
  const store = await readStore()
  const now = new Date().toISOString()

  if (action === 'save') {
    const incoming = body.project as Partial<TripProject>
    const id = incoming.id || newId()
    const existing = store[id]
    const ownerToken = existing?.ownerToken || body.ownerToken || crypto.randomUUID()

    if (existing && !canWriteProject(existing, body.ownerToken)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const nextProject: TripProject = {
      id,
      title: incoming.title || existing?.title || 'Travel Architect Trip',
      visibility: incoming.visibility || existing?.visibility || 'private',
      permission: incoming.permission || existing?.permission || 'view',
      ownerToken,
      version: (existing?.version || 0) + 1,
      updatedAt: now,
      days: incoming.days || existing?.days || [],
      tripInfo: incoming.tripInfo || existing?.tripInfo || { currency: 'TWD', booking: {} },
      comments: existing?.comments || [],
      votes: existing?.votes || [],
    }
    store[id] = nextProject
    await writeStore(store)
    return NextResponse.json(nextProject)
  }

  const project = store[body.id]
  if (!project) return NextResponse.json({ error: 'trip not found' }, { status: 404 })
  if (!canReadProject(project, body.ownerToken)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  if (action === 'comment') {
    const comment: TripComment = {
      id: crypto.randomUUID(),
      itemId: body.itemId || undefined,
      author: body.author || 'Guest',
      text: String(body.text || '').slice(0, 500),
      createdAt: now,
    }
    project.comments = [...project.comments, comment]
  }

  if (action === 'vote') {
    project.votes = toggleVote(project.votes, body.itemId, body.author || 'Guest')
  }

  project.version += 1
  project.updatedAt = now
  store[project.id] = project
  await writeStore(store)
  return NextResponse.json(project)
}
