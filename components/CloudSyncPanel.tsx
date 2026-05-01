import { useMemo, useState } from 'react'
import type { DayPlan, TripInfo, TripPermission, TripProject, TripVisibility } from '../types/itinerary'
import { summarizeVotes } from '../utils/collaboration'

interface CloudSyncPanelProps {
  days: DayPlan[]
  activeDayId: string
  tripInfo: TripInfo
  cloudProject: TripProject | null
  cloudUserName: string
  onUserNameChange: (name: string) => void
  onCreateOrSave: (visibility: TripVisibility, permission: TripPermission) => Promise<void>
  onLoad: (tripId: string, ownerToken: string) => Promise<void>
  onComment: (itemId: string, text: string) => Promise<void>
  onVote: (itemId: string) => Promise<void>
}

export default function CloudSyncPanel({ days, activeDayId, cloudProject, cloudUserName, onUserNameChange, onCreateOrSave, onLoad, onComment, onVote }: CloudSyncPanelProps) {
  const [visibility, setVisibility] = useState<TripVisibility>('private')
  const [permission, setPermission] = useState<TripPermission>('view')
  const [loadId, setLoadId] = useState('')
  const [loadToken, setLoadToken] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const allItems = useMemo(() => days.flatMap(day => day.items.map(item => ({ ...item, dayTitle: day.title }))), [days])
  const voteSummary = summarizeVotes(cloudProject?.votes || [])
  const activeItemId = selectedItemId || allItems[0]?.id || ''

  const run = async (fn: () => Promise<void>) => {
    setLoading(true)
    try { await fn() } finally { setLoading(false) }
  }

  return (
    <section className="cloud-panel">
      <div className="panel-heading">
        <div>
          <h2>雲端協作</h2>
          <p>建立同步專案，讓旅伴載入同一份行程並留下投票與留言。</p>
        </div>
      </div>
      <div className="cloud-grid">
        <label><span>顯示名稱</span><input value={cloudUserName} onChange={(e) => onUserNameChange(e.target.value)} placeholder="你的名字" /></label>
        <label><span>可見性</span><select value={visibility} onChange={(e) => setVisibility(e.target.value as TripVisibility)}><option value="private">私人</option><option value="public">公開</option></select></label>
        <label><span>分享權限</span><select value={permission} onChange={(e) => setPermission(e.target.value as TripPermission)}><option value="view">僅檢視</option><option value="edit">可共同編輯</option></select></label>
        <button className="btn-outline" disabled={loading} onClick={() => run(() => onCreateOrSave(visibility, permission))}>{cloudProject ? '同步更新' : '建立雲端專案'}</button>
      </div>
      {cloudProject && (
        <div className="cloud-status">
          <div><span>Trip ID</span><strong>{cloudProject.id}</strong></div>
          <div><span>版本</span><strong>v{cloudProject.version}</strong></div>
          <div><span>更新</span><strong>{new Date(cloudProject.updatedAt).toLocaleString()}</strong></div>
        </div>
      )}
      <div className="cloud-load-row">
        <input value={loadId} onChange={(e) => setLoadId(e.target.value)} placeholder="Trip ID" />
        <input value={loadToken} onChange={(e) => setLoadToken(e.target.value)} placeholder="私人專案 token，可留空載入公開專案" />
        <button className="btn-outline" disabled={loading || !loadId.trim()} onClick={() => run(() => onLoad(loadId.trim(), loadToken.trim()))}>載入</button>
      </div>
      <div className="cloud-collab-box">
        <select value={activeItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
          {allItems.map(item => <option key={item.id} value={item.id}>{item.dayTitle} · {item.name} · {voteSummary[item.id] || 0} 票</option>)}
        </select>
        <div className="cloud-collab-actions">
          <button className="btn-outline" disabled={!cloudProject || !activeItemId || loading} onClick={() => run(() => onVote(activeItemId))}>投票 / 收回</button>
          <button className="btn-outline" disabled={!cloudProject || !comment.trim() || loading} onClick={() => run(async () => { await onComment(activeItemId, comment); setComment('') })}>留言</button>
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="給旅伴的留言..." rows={2} />
      </div>
      {cloudProject?.comments.length ? (
        <div className="cloud-comments">
          {cloudProject.comments.slice(-4).map(item => <div key={item.id}><strong>{item.author}</strong><span>{item.text}</span></div>)}
        </div>
      ) : null}
    </section>
  )
}
