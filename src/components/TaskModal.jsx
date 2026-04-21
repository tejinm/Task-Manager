import { useState, useEffect } from 'react'
import { createTask, updateTask } from '../lib/appwrite'
import { STATUSES } from '../lib/constants'

export default function TaskModal({ task, workspaceId, userId, userName, regions, tags, members, onSave, onClose }) {
  const editing = !!task

  const [form, setForm] = useState({
    title:          task?.title          || '',
    description:    task?.description    || '',
    priority:       task?.priority       || 'medium',
    status:         task?.status         || 'todo',
    dueDate:        task?.dueDate        || '',
    region:         task?.region         || '',
    assignedTo:     task?.assignedTo     || '',
    assignedToName: task?.assignedToName || '',
    tags:           task?.tags           || [],
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function toggleTag(name) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(name) ? f.tags.filter(t => t !== name) : [...f.tags, name]
    }))
  }

  function handleAssign(e) {
    const memberId = e.target.value
    const member   = members.find(m => m.userId === memberId)
    set('assignedTo',     memberId)
    set('assignedToName', member?.userName || '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        title:       form.title.trim(),
        description: form.description.trim(),
        dueDate:     form.dueDate || null,
        region:      form.region  || '',
      }
      const saved = editing
        ? await updateTask(task.id, payload)
        : await createTask(workspaceId, userId, userName, payload)
      onSave(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">{editing ? '✏️ Edit Task' : '➕ New Task'}</div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label>Title *</label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="What needs to be done?" required autoFocus />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Add details…" />
          </div>

          {/* Priority + Status */}
          <div className="form-row">
            <div className="form-group">
              <label>Priority *</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUSES).map(([key, s]) => (
                  <option key={key} value={key}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date + Region */}
          <div className="form-row">
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Region</label>
              <select value={form.region} onChange={e => set('region', e.target.value)}>
                <option value="">— None —</option>
                {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          </div>

          {/* Assign To (only shown if workspace has multiple members) */}
          {members.length > 1 && (
            <div className="form-group">
              <label>Assign To</label>
              <select value={form.assignedTo} onChange={handleAssign}>
                <option value="">— Unassigned —</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.userName || m.userId}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="form-group">
              <label>Tags</label>
              <div className="tag-selector">
                {tags.map(t => (
                  <button type="button" key={t.id}
                    className={`tag-option ${form.tags.includes(t.name) ? 'selected' : ''}`}
                    onClick={() => toggleTag(t.name)}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
