import { useState } from 'react'
import type { AiPlannerMode, AiPlannerRequest } from '../utils/aiPlanner'

interface AiPlannerDialogProps {
  defaultDestination?: string
  defaultStartDate?: string
  defaultAccommodation?: string
  onClose: () => void
  onGenerate: (request: AiPlannerRequest) => Promise<void>
}

export default function AiPlannerDialog({ defaultDestination = '', defaultStartDate = '', defaultAccommodation = '', onClose, onGenerate }: AiPlannerDialogProps) {
  const [destination, setDestination] = useState(defaultDestination)
  const [daysCount, setDaysCount] = useState(3)
  const [style, setStyle] = useState('平衡慢遊')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [accommodation, setAccommodation] = useState(defaultAccommodation)
  const [notes, setNotes] = useState('')
  const [mode, setMode] = useState<AiPlannerMode>('new-trip')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!destination.trim()) return
    setLoading(true)
    try {
      await onGenerate({ destination, daysCount, style, budget, startDate, accommodation, notes, mode })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-planner-title" onClick={(e) => e.stopPropagation()}>
        <div className="export-dialog-header">
          <div>
            <h2 id="ai-planner-title">AI 智慧規劃</h2>
            <p>輸入目的地、風格與限制，產生可編輯的初版行程。</p>
          </div>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="ai-form-grid">
          <label className="wide"><span>目的地</span><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="例如：東京、台南、首爾" /></label>
          <label><span>天數</span><input type="number" min="1" max="10" value={daysCount} onChange={(e) => setDaysCount(Math.max(1, Number(e.target.value) || 1))} /></label>
          <label><span>開始日期</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label><span>旅遊風格</span><select value={style} onChange={(e) => setStyle(e.target.value)}><option>平衡慢遊</option><option>親子友善</option><option>美食優先</option><option>攝影景點</option><option>購物逛街</option><option>高效率踩點</option></select></label>
          <label><span>預算</span><input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="例如：每天 TWD 3000" /></label>
          <label className="wide"><span>住宿位置</span><input value={accommodation} onChange={(e) => setAccommodation(e.target.value)} placeholder="飯店或主要住宿區域" /></label>
          <label className="wide"><span>補充需求</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="同行者、必去景點、避免太早起、交通偏好..." rows={3} /></label>
        </div>
        <div className="ai-mode-switch">
          <button className={mode === 'new-trip' ? 'active' : ''} onClick={() => setMode('new-trip')}>產生新行程</button>
          <button className={mode === 'active-day' ? 'active' : ''} onClick={() => setMode('active-day')}>重排目前 Day</button>
        </div>
        <button className="btn-primary ai-submit" onClick={submit} disabled={loading || !destination.trim()}>{loading ? '產生中...' : '產生 AI 行程'}</button>
      </section>
    </div>
  )
}
