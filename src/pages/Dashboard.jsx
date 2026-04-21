import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getTasks, getRegions, getTags, getWorkspaceMembers, getProfile,
  deleteTask as apiDeleteTask, signOut, updateProfile, subscribeToTasks
} from '../lib/appwrite'
import KanbanBoard   from '../components/KanbanBoard'
import TableView     from '../components/TableView'
import CalendarView  from '../components/CalendarView'
import TodayPanel    from '../components/TodayPanel'
import TaskModal     from '../components/TaskModal'
import SettingsModal from '../components/SettingsModal'
import { showToast } from '../components/Toast'

export default function Dashboard({ user }) {
  const { workspaceId } = useParams()
  const navigate = useNavigate()

  const [tasks,   setTasks]   = useState([])
  const [regions, setRegions] = useState([])
  const [tags,    setTags]    = useState([])
  const [members, setMembers] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [view,    setView]    = useState('kanban')
  const [filters, setFilters] = useState({ search: '', region: '', tag: '', priority: '', status: '' })

  const [taskModal,    setTaskModal]    = useState(null)  // null | 'new' | task-object
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ── Initial load ──────────────────────────────────────────
  const reload = useCallback(async () => {
    try {
      const [t, r, g, m, p] = await Promise.all([
        getTasks(workspaceId),
        getRegions(workspaceId),
        getTags(workspaceId),
        getWorkspaceMembers(workspaceId),
        getProfile(user.$id),
      ])
      setTasks(t); setRegions(r); setTags(g); setMembers(m); setProfile(p)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, user])

  useEffect(() => { reload() }, [reload])

  // ── Appwrite Realtime ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToTasks(workspaceId, event => {
      const changed = event.payload
      const eventType = event.events?.[0] || ''

      if (eventType.includes('.delete')) {
        setTasks(prev => prev.filter(t => t.id !== changed.$id))
      } else if (eventType.includes('.create')) {
        const newTask = { ...changed, id: changed.$id }
        setTasks(prev => [newTask, ...prev.filter(t => t.id !== newTask.id)])
      } else if (eventType.includes('.update')) {
        const updated = { ...changed, id: changed.$id }
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
      }
    })
    return () => unsubscribe()
  }, [workspaceId])

  // ── Filtered tasks ────────────────────────────────────────
  const filtered = tasks.filter(t => {
    const f = filters
    if (f.search && !t.title.toLowerCase().includes(f.search.toLowerCase()) &&
        !(t.description || '').toLowerCase().includes(f.search.toLowerCase())) return false
    if (f.region   && t.region   !== f.region)           return false
    if (f.tag      && !(t.tags||[]).includes(f.tag))     return false
    if (f.priority && t.priority !== f.priority)         return false
    if (f.status   && t.status   !== f.status)           return false
    return true
  })

  // ── Handlers ──────────────────────────────────────────────
  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    try {
      await apiDeleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      showToast('Task deleted')
    } catch (e) { showToast(e.message, 'error') }
  }

  function handleTaskSaved(task) {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id)
      return idx >= 0 ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev]
    })
    setTaskModal(null)
    showToast('Task saved ✓', 'ok')
  }

  async function handleSignOut() { await signOut(); navigate('/login') }

  const userName = profile?.name || user.name || 'You'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7194' }}>
      Loading workspace…
    </div>
  )

  return (
    <div className="app-shell">

      {/* Header */}
      <header className="app-header">
        <h1>📋 Task Manager</h1>
        <div className="header-right">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/workspaces')}
            style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
            ← Workspaces
          </button>
          <div className="user-chip" onClick={() => setSettingsOpen(true)} title="Settings">
            <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
            <span>{userName}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}
            style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="view-tabs">
          {['kanban', 'table', 'calendar'].map(v => (
            <button key={v} className={`view-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v === 'kanban' ? '📊 Kanban' : v === 'table' ? '📝 Table' : '📅 Calendar'}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setTaskModal('new')}>➕ New Task</button>
          <button className="btn btn-ghost"   onClick={() => setSettingsOpen(true)}>⚙️ Settings</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>🔍 Search</label>
          <input type="text" placeholder="Search tasks…" value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        <div className="filter-group">
          <label>🌍 Region</label>
          <select value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}>
            <option value="">All Regions</option>
            {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>🏷️ Tag</label>
          <select value={filters.tag} onChange={e => setFilters(f => ({ ...f, tag: e.target.value }))}>
            <option value="">All Tags</option>
            {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>⚡ Priority</label>
          <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-group">
          <label>📌 Status</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            <option value="prep">In Preparation</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* Today Panel */}
      <TodayPanel tasks={tasks} onEdit={t => setTaskModal(t)} />

      {/* Main content */}
      <div className="content">
        {view === 'kanban'   && <KanbanBoard  tasks={filtered} onEdit={t => setTaskModal(t)} onDelete={handleDelete} />}
        {view === 'table'    && <TableView    tasks={filtered} onEdit={t => setTaskModal(t)} onDelete={handleDelete} />}
        {view === 'calendar' && <CalendarView tasks={filtered} onEdit={t => setTaskModal(t)} />}
      </div>

      {/* Modals */}
      {taskModal !== null && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          workspaceId={workspaceId}
          userId={user.$id}
          userName={userName}
          regions={regions}
          tags={tags}
          members={members}
          onSave={handleTaskSaved}
          onClose={() => setTaskModal(null)}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          workspaceId={workspaceId}
          userId={user.$id}
          profile={profile}
          regions={regions}
          tags={tags}
          members={members}
          onUpdate={reload}
          onProfileSave={async name => {
            await updateProfile(user.$id, name)
            setProfile(p => ({ ...p, name }))
            showToast('Profile updated ✓', 'ok')
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
