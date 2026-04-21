import { useState } from 'react'
import {
  addRegion,  deleteRegion  as apiDeleteRegion,
  addTag,     deleteTag     as apiDeleteTag,
  removeMember, getWorkspaceJoinCode, regenerateJoinCode,
} from '../lib/appwrite'

export default function SettingsModal({
  workspaceId, userId, profile, regions, tags, members,
  onUpdate, onProfileSave, onClose
}) {
  const [tab, setTab] = useState('profile')

  // Profile
  const [name,         setName]         = useState(profile?.name || '')
  const [savingProfile,setSavingProfile] = useState(false)

  // Regions / Tags
  const [newRegion, setNewRegion] = useState('')
  const [newTag,    setNewTag]    = useState('')

  // Join code
  const [joinCode,      setJoinCode]      = useState(null)  // null = not loaded yet
  const [loadingCode,   setLoadingCode]   = useState(false)
  const [regenLoading,  setRegenLoading]  = useState(false)
  const [codeCopied,    setCodeCopied]    = useState(false)

  const isOwner = members.find(m => m.userId === userId)?.role === 'owner'

  // ── Profile ───────────────────────────────────────────────
  async function saveProfile() {
    setSavingProfile(true)
    await onProfileSave(name)
    setSavingProfile(false)
  }

  // ── Regions ───────────────────────────────────────────────
  async function handleAddRegion() {
    if (!newRegion.trim()) return
    await addRegion(workspaceId, newRegion.trim())
    setNewRegion(''); onUpdate()
  }
  async function handleDeleteRegion(id) {
    if (!confirm('Delete this region?')) return
    await apiDeleteRegion(id); onUpdate()
  }

  // ── Tags ──────────────────────────────────────────────────
  async function handleAddTag() {
    if (!newTag.trim()) return
    await addTag(workspaceId, newTag.trim())
    setNewTag(''); onUpdate()
  }
  async function handleDeleteTag(id) {
    if (!confirm('Delete this tag?')) return
    await apiDeleteTag(id); onUpdate()
  }

  // ── Members ───────────────────────────────────────────────
  async function handleRemove(member) {
    if (member.userId === userId) { alert("You can't remove yourself."); return }
    if (!confirm(`Remove ${member.userName || 'this member'}?`)) return
    await removeMember(member.id); onUpdate()
  }

  // ── Join code ─────────────────────────────────────────────
  async function loadJoinCode() {
    setLoadingCode(true)
    const code = await getWorkspaceJoinCode(workspaceId)
    setJoinCode(code); setLoadingCode(false)
  }

  async function handleRegen() {
    if (!confirm('Generate a new join code? The old one will stop working immediately.')) return
    setRegenLoading(true)
    const code = await regenerateJoinCode(workspaceId)
    setJoinCode(code); setRegenLoading(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(joinCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // ── Tabs ──────────────────────────────────────────────────
  const TABS = [
    { key: 'profile', label: '👤 Profile'  },
    { key: 'members', label: '👥 Members'  },
    { key: 'regions', label: '🌍 Regions'  },
    { key: 'tags',    label: '🏷️ Tags'    },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 620 }}>
        <div className="modal-title">⚙️ Settings</div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '8px 0', border: 'none', background: 'none',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: tab === t.key ? 'var(--purple)' : 'var(--muted)',
              borderBottom: `2px solid ${tab === t.key ? 'var(--purple)' : 'transparent'}`,
              marginBottom: -1.5,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Profile ── */}
        {tab === 'profile' && (
          <div>
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        )}

        {/* ── Members ── */}
        {tab === 'members' && (
          <div>
            {/* Join code panel */}
            {isOwner && (
              <div style={{
                background: '#f8faff', border: '1.5px solid #d0d8f5',
                borderRadius: 10, padding: 16, marginBottom: 20
              }}>
                <div style={{ fontWeight: 700, color: 'var(--purple-dk)', marginBottom: 6, fontSize: 14 }}>
                  🔑 Workspace Join Code
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
                  Share this code with colleagues. They enter it on the Workspaces screen to join.
                  Works for all 6 team members — no user IDs needed.
                </p>
                {joinCode === null ? (
                  <button className="btn btn-ghost btn-sm" onClick={loadJoinCode} disabled={loadingCode}>
                    {loadingCode ? 'Loading…' : 'Show Join Code'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace', fontSize: 28, fontWeight: 700,
                      letterSpacing: 6, color: 'var(--purple-dk)',
                      background: 'var(--purple-lt)', padding: '8px 16px', borderRadius: 8
                    }}>{joinCode}</span>
                    <button className="btn btn-success btn-sm" onClick={copyCode}>
                      {codeCopied ? '✓ Copied!' : 'Copy'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleRegen} disabled={regenLoading}>
                      {regenLoading ? '…' : '↻ New Code'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Member list */}
            <div className="settings-section">
              <ul className="settings-list">
                {members.map(m => (
                  <li key={m.id} className="member-item">
                    <div className="member-avatar">
                      {(m.userName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.userName || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
                        {m.userId}
                      </div>
                    </div>
                    <span className="member-role">{m.role}</span>
                    {isOwner && m.userId !== userId && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m)}>
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Regions ── */}
        {tab === 'regions' && (
          <div className="settings-section">
            <ul className="settings-list">
              {regions.length === 0
                ? <li className="settings-item" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No regions yet</li>
                : regions.map(r => (
                    <li key={r.id} className="settings-item">
                      <span>{r.name}</span>
                      {isOwner && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRegion(r.id)}>Remove</button>
                      )}
                    </li>
                  ))
              }
            </ul>
            {isOwner && (
              <div className="add-row">
                <input type="text" value={newRegion} onChange={e => setNewRegion(e.target.value)}
                  placeholder="New region…" onKeyDown={e => e.key === 'Enter' && handleAddRegion()} />
                <button className="btn btn-primary" onClick={handleAddRegion}>Add</button>
              </div>
            )}
          </div>
        )}

        {/* ── Tags ── */}
        {tab === 'tags' && (
          <div className="settings-section">
            <ul className="settings-list">
              {tags.length === 0
                ? <li className="settings-item" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No tags yet</li>
                : tags.map(t => (
                    <li key={t.id} className="settings-item">
                      <span>{t.name}</span>
                      {isOwner && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTag(t.id)}>Remove</button>
                      )}
                    </li>
                  ))
              }
            </ul>
            {isOwner && (
              <div className="add-row">
                <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                  placeholder="New tag…" onKeyDown={e => e.key === 'Enter' && handleAddTag()} />
                <button className="btn btn-primary" onClick={handleAddTag}>Add</button>
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
