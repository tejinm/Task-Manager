import { STATUSES, PRIORITIES, fmtDate } from '../lib/constants'

export default function KanbanBoard({ tasks, onEdit, onDelete }) {
  return (
    <div className="kanban-board">
      {Object.entries(STATUSES).map(([status, s]) => {
        const col = tasks.filter(t => t.status === status)
        return (
          <div key={status} className="kanban-column">
            <div className="kanban-col-header">
              <div className="col-label">
                <span className="col-dot" style={{ background: s.color }} />
                <span>{s.label}</span>
              </div>
              <span className="col-count">{col.length}</span>
            </div>
            {col.length === 0
              ? <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="empty-state-text" style={{ fontSize: 13 }}>No tasks</div>
                </div>
              : col.map(t => <TaskCard key={t.id} task={t} colColor={s.color} onEdit={onEdit} onDelete={onDelete} />)
            }
          </div>
        )
      })}
    </div>
  )
}

function TaskCard({ task: t, colColor, onEdit, onDelete }) {
  const p = PRIORITIES[t.priority] || { bg: '#f0f2f8', color: '#6b7194' }
  return (
    <div className="task-card" style={{ borderLeft: `3px solid ${colColor}` }} onClick={() => onEdit(t)}>
      <div className="task-card-title">{t.title}</div>
      {t.description && (
        <div className="task-card-desc">
          {t.description.length > 90 ? t.description.slice(0, 90) + '…' : t.description}
        </div>
      )}
      <div className="task-card-meta">
        <span className="badge" style={{ background: p.bg, color: p.color }}>{t.priority.toUpperCase()}</span>
        {t.region && <span className="badge badge-region">{t.region}</span>}
        {(t.tags || []).map(tag => <span key={tag} className="badge badge-tag">{tag}</span>)}
        {t.dueDate && (
          <span className="badge" style={{ background: '#f0f2f8', color: '#6b7194' }}>📅 {fmtDate(t.dueDate)}</span>
        )}
      </div>
      {(t.createdByName || t.assignedToName) && (
        <div className="task-card-footer">
          <span>👤 {t.createdByName || '—'}</span>
          {t.assignedToName && <span>→ {t.assignedToName}</span>}
        </div>
      )}
    </div>
  )
}
