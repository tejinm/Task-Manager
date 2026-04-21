import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWorkspaces, createWorkspace, joinWorkspaceByCode, getProfile, signOut } from '../lib/appwrite'

export default function WorkspacePicker({ user }) {
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState([])
  const [profile,    setProfile]    = useState(null)
  const [loading,    setLoading]    = useState(true)

  // Create form
  const [newName,   setNewName]   = useState('')
  const [creating,  setCreating]  = useState(false)
  const [createErr, setCreateErr] = useState('')

  // Join form
  const [joinCode,  setJoinCode]  = useState('')
  const [joining,   setJoining]   = useState(false)
  const [joinErr,   setJoinErr]   = useState('')

  const [tab, setTab] = useState('create') // 'create' | 'join'

  useEffect(() => {
    Promise.all([
      getWorkspaces(user.$id),
      getProfile(user.$id),
    ]).then(([ws, p]) => {
      setWorkspaces(ws)
      setProfile(p)
    }).finally(() => setLoading(false))
  }, [user])

  const userName = profile?.name || user.name || user.email?.split('@')[0] || 'You'

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true); setCreateErr('')
    try {
      const ws = await createWorkspace(newName.trim(), user.$id, userName)
      navigate(`/dashboard/${ws.id}`)
    } catch (err) { setCreateErr(err.message) }
    finally { setCreating(false) }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true); setJoinErr('')
    try {
      const ws = await joinWorkspaceByCode(joinCode, user.$id, userName)
      navigate(`/dashboard/${ws.id}`)
    } catch (err) { setJoinErr(err.message) }
    finally { setJoining(false) }
  }

  async function handleSignOut() { await signOut(); window.location.href = '/task-manager/' }

  if (loading) return (
    <div className="ws-picker">
      <div className="ws-card" style={{ textAlign: 'center', color: '#6b7194' }}>Loading…</div>
    </div>
  )

  return (
    <div className="ws-picker">
      <div className="ws-card">
        <h2>📋 Welcome, {userName}</h2>
        <p>Pick a workspace or create / join a new one.</p>

        {workspaces.length > 0 && (
          <ul className="ws-list">
            {workspaces.map(ws => (
              <li key={ws.id} className="ws-item" onClick={() => navigate(`/dashboard/${ws.id}`)}>
                <div>
                  <div className="ws-item-name">{ws.name}</div>
                  <div className="ws-item-role">{ws.role}</div>
                </div>
                <span style={{ color: '#6b7194' }}>→</span>
              </li>
            ))}
          </ul>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: '1.5px solid var(--border)' }}>
          {[['create', '+ Create New'], ['join', '🔑 Join by Code']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '9px 0', border: 'none', background: 'none',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: tab === key ? 'var(--purple)' : 'var(--muted)',
              borderBottom: `2px solid ${tab === key ? 'var(--purple)' : 'transparent'}`,
              marginBottom: -1.5,
            }}>{label}</button>
          ))}
        </div>

        {tab === 'create' && (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Workspace Name</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Team Alpha Tasks" required />
            </div>
            {createErr && <p className="form-error">{createErr}</p>}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create Workspace'}
            </button>
          </form>
        )}

        {tab === 'join' && (
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label>Join Code</label>
              <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. A3B9FX" maxLength={6} style={{ fontFamily: 'DM Mono, monospace', letterSpacing: 3, fontSize: 18 }}
                required />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5 }}>
                Ask the workspace owner for the 6-character join code from their ⚙️ Settings.
              </p>
            </div>
            {joinErr && <p className="form-error">{joinErr}</p>}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              type="submit" disabled={joining}>
              {joining ? 'Joining…' : 'Join Workspace'}
            </button>
          </form>
        )}

        <button className="btn btn-ghost btn-sm" onClick={handleSignOut}
          style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
