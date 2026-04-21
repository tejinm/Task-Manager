import { useState } from 'react'
import { STATUSES, PRIORITIES } from '../lib/constants'

export default function TodayPanel({ tasks, onEdit }) {
  const [collapsed, setCollapsed] = useState(false)
  const today      = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter(t => t.dueDate === today && t.status !== 'done')
  const dateLabel  = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="today-panel">
      <div className="today-header" onClick={() => setCollapsed(c => !c)}>
        <div className="today-header-left">
          <span>☀️</span>
          <span className="today-title">Today's To-Do's</span>
          <span className="today-date">{dateLabel}</span>
          <span className="today-count">{todayTasks.length}</span>
        </div>
        <span className="today-toggle">{collapsed ? '▸ Show' : '▾ Hide'}</span>
      </div>

      {!collapsed && (
        <div className="today-body">
          {todayTasks.length === 0
            ? <div className="today-empty">🎉 Nothing due today — you're all clear!</div>
            : todayTasks.map(t => {
                const s = STATUSES[t.status]    || { color: '#6b7194', ltColor: '#f0f2f8', label: t.status, emoji: '' }
                const p = PRIORITIES[t.priority] || { bg: '#f0f2f8', color: '#6b7194' }
                return (
                  <div key={t.id} className="today-task" onClick={() => onEdit(t)}>
                    <span>{s.emoji}</span>
                    <span className="today-task-title">{t.title}</span>
                    <span className="badge" style={{ background: p.bg, color: p.color }}>{t.priority.toUpperCase()}</span>
                    {t.region && <span className="badge badge-region">{t.region}</span>}
                    <span className="status-pill" style={{ background: s.ltColor, color: s.color }}>{s.label}</span>
                  </div>
                )
              })
          }
        </div>
      )}
    </div>
  )
}
