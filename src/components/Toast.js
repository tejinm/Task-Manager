let _t
export function showToast(msg, type = '') {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = msg
  el.className = `show${type ? ' toast-' + type : ''}`
  clearTimeout(_t)
  _t = setTimeout(() => { el.className = '' }, 3000)
}
