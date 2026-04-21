import { STATUSES } from '../lib/constants'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView({ tasks, onEdit }) {
  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const start    = new Date(today)
  start.setDate(today.getDate() - today.getDay())

  const days = Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(start)
    d.setDate(start.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    return { d, ds, dayTasks: tasks.filter(t => t.dueDate === ds) }
  })

  return (
    <div className="calendar-grid">
      {days.map(({ d, ds, dayTasks }) => (
        <div key={ds} className={`cal-day ${ds === todayStr ? 'today' : ''}`}>
          <div className="cal-day-header">
            {DAYS[d.getDay()]}
            <div className="cal-day-date">{d.getDate()}/{d.getMonth() + 1}</div>
          </div>
          {dayTasks.map(t => {
            const s = STATUSES[t.status] || { color: '#6154e8' }
            return (
              <div key={t.id} className="cal-task" style={{ background: s.color }} onClick={() => onEdit(t)}>
                {t.title}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
