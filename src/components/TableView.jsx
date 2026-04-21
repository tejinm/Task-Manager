import { STATUSES, PRIORITIES, fmtDate } from '../lib/constants'

export default function TableView({ tasks, onEdit, onDelete }) {
  if (!tasks.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📭</div>
      <div className="empty-state-text">No tasks found</div>
    </div>
  )
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th><th>Priority</th><th>Status</th><th>Region</th>
            <th>Tags</th><th>Due</th><th>Owner</th><th>Assigned</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const s = STATUSES[t.status]    || { label: t.status,    color: '#6b7194', ltColor: '#f0f2f8', emoji: '' }
            const p = PRIORITIES[t.priority] || { label: t.priority, bg: '#f0f2f8',    color: '#6b7194' }
            return (
              <tr key={t.id}>
                <td><strong>{t.title}</strong></td>
                <td><span className="badge" style={{ background: p.bg, color: p.color }}>{t.priority.toUpperCase()}</span></td>
                <td><span className="status-pill" style={{ background: s.ltColor, color: s.color }}>{s.emoji} {s.label}</span></td>
                <td>{t.region || '—'}</td>
                <td>{(t.tags||[]).map(tag => <span key={tag} className="badge badge-tag" style={{ marginRight: 3 }}>{tag}</span>)}</td>
                <td>{fmtDate(t.dueDate) || '—'}</td>
                <td style={{ fontSize: 12, color: '#6b7194' }}>{t.createdByName || '—'}</td>
                <td style={{ fontSize: 12, color: '#6b7194' }}>{t.assignedToName || '—'}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(t)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(t.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
