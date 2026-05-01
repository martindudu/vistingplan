import type { PosterTemplate } from '../utils/export'

type ExportScope = 'active' | 'all'

interface ExportDialogProps {
  exportScope: ExportScope
  posterTemplate: PosterTemplate
  onScopeChange: (scope: ExportScope) => void
  onPosterTemplateChange: (template: PosterTemplate) => void
  onClose: () => void
  onCopyText: () => void
  onExportCsv: () => void
  onExportXlsx: () => void
  onExportIcs: () => void
  onOpenGoogleCalendar: () => void
  onShareLine: () => void
  onExportPdf: () => void
  onExportPoster: () => void
}

export default function ExportDialog({
  exportScope,
  posterTemplate,
  onScopeChange,
  onPosterTemplateChange,
  onClose,
  onCopyText,
  onExportCsv,
  onExportXlsx,
  onExportIcs,
  onOpenGoogleCalendar,
  onShareLine,
  onExportPdf,
  onExportPoster,
}: ExportDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(e) => e.stopPropagation()}>
        <div className="export-dialog-header">
          <div>
            <h2 id="export-title">匯出行程</h2>
            <p>選擇單日或全部天數，再輸出成需要的格式。</p>
          </div>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="export-scope">
          <button className={exportScope === 'active' ? 'active' : ''} onClick={() => onScopeChange('active')}>目前 Day</button>
          <button className={exportScope === 'all' ? 'active' : ''} onClick={() => onScopeChange('all')}>全部天數</button>
        </div>
        <div className="poster-template-selector">
          <span>海報模板</span>
          <select value={posterTemplate} onChange={(e) => onPosterTemplateChange(e.target.value as PosterTemplate)}>
            <option value="classic">Classic</option>
            <option value="timeline">Timeline</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div className="export-actions">
          <button onClick={onCopyText}>複製文字摘要</button>
          <button onClick={onExportCsv}>匯出 CSV</button>
          <button onClick={onExportXlsx}>匯出 Excel</button>
          <button onClick={onExportIcs}>匯出 iCal</button>
          <button onClick={onOpenGoogleCalendar}>Google Calendar</button>
          <button onClick={onShareLine}>LINE 分享</button>
          <button onClick={onExportPdf}>列印 / PDF</button>
          <button onClick={onExportPoster}>海報 PNG</button>
        </div>
      </section>
    </div>
  )
}
