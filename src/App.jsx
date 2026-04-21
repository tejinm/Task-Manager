import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser } from './lib/appwrite'
import Login           from './pages/Login'
import Register        from './pages/Register'
import WorkspacePicker from './pages/WorkspacePicker'
import Dashboard       from './pages/Dashboard'

export default function App() {
  const [user, setUser]       = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getCurrentUser().then(u => setUser(u || null))
  }, [])

  if (user === undefined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#6b7194', fontSize: 14 }}>Loading…</span>
    </div>
  )

  const authed   = !!user
  const unauthed = !user

  return (
    <>
      <Routes>
        <Route path="/login"    element={unauthed ? <Login    onLogin={setUser} />    : <Navigate to="/workspaces" />} />
        <Route path="/register" element={unauthed ? <Register onLogin={setUser} />    : <Navigate to="/workspaces" />} />
        <Route path="/workspaces"          element={authed ? <WorkspacePicker user={user} /> : <Navigate to="/login" />} />
        <Route path="/dashboard/:workspaceId" element={authed ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={authed ? '/workspaces' : '/login'} />} />
      </Routes>
      <div id="toast" />
    </>
  )
}
