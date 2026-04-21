export const STATUSES = {
  prep:       { label: 'In Preparation', color: '#8b5cf6', ltColor: '#f3eeff', emoji: '🔵' },
  todo:       { label: 'To Do',          color: '#3b82f6', ltColor: '#eff6ff', emoji: '📋' },
  inprogress: { label: 'In Progress',    color: '#f59e0b', ltColor: '#fffbeb', emoji: '🔄' },
  blocked:    { label: 'Blocked',        color: '#ef4444', ltColor: '#fef2f2', emoji: '🚫' },
  done:       { label: 'Done',           color: '#10b981', ltColor: '#ecfdf5', emoji: '✅' },
}

export const PRIORITIES = {
  high:   { label: 'High',   bg: '#fee2e2', color: '#b91c1c' },
  medium: { label: 'Medium', bg: '#fef9c3', color: '#92400e' },
  low:    { label: 'Low',    bg: '#d1fae5', color: '#065f46' },
}

export function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

export function randomJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
