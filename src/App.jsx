import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { Spinner } from './components/shared/UI'

import AuthPage         from './pages/auth/AuthPage'
import MasterDashboard  from './pages/master/MasterDashboard'
import AdminDashboard   from './pages/admin/AdminDashboard'
import EditorsPage      from './pages/admin/EditorsPage'
import ClientsPage      from './pages/admin/ClientsPage'
import TasksPage        from './pages/admin/TasksPage'
import EditorDashboard  from './pages/editor/EditorDashboard'
import ClientDashboard  from './pages/client/ClientDashboard'

// ─── Auth Guard ───────────────────────────────────────────────────────────────
function AuthGuard({ children, roles }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return (
    <div style={{
      display: 'flex', height: '100vh',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <Spinner size={32} />
      <p style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'DM Sans, sans-serif' }}>Loading…</p>
    </div>
  )

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'master_admin') return <Navigate to="/master"  replace />
    if (user.role === 'admin')        return <Navigate to="/admin"   replace />
    if (user.role === 'editor')       return <Navigate to="/editor"  replace />
    if (user.role === 'client')       return <Navigate to="/client"  replace />
    return <Navigate to="/login" replace />
  }

  return children
}

// ─── Root redirect based on role ─────────────────────────────────────────────
function RootRedirect() {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'master_admin') return <Navigate to="/master"  replace />
  if (user.role === 'admin')        return <Navigate to="/admin"   replace />
  if (user.role === 'editor')       return <Navigate to="/editor"  replace />
  if (user.role === 'client')       return <Navigate to="/client"  replace />
  return <Navigate to="/login" replace />
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<AuthPage mode="login"  />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />

        {/* Root — redirect by role */}
        <Route path="/" element={<RootRedirect />} />

        {/* Master Admin */}
        <Route path="/master" element={
          <AuthGuard roles={['master_admin']}>
            <MasterDashboard />
          </AuthGuard>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <AuthGuard roles={['admin']}>
            <AdminDashboard />
          </AuthGuard>
        } />
        <Route path="/admin/editors" element={
          <AuthGuard roles={['admin']}>
            <EditorsPage />
          </AuthGuard>
        } />
        <Route path="/admin/clients" element={
          <AuthGuard roles={['admin']}>
            <ClientsPage />
          </AuthGuard>
        } />
        <Route path="/admin/tasks" element={
          <AuthGuard roles={['admin']}>
            <TasksPage />
          </AuthGuard>
        } />

        {/* Editor */}
        <Route path="/editor" element={
          <AuthGuard roles={['editor']}>
            <EditorDashboard />
          </AuthGuard>
        } />

        {/* Client */}
        <Route path="/client" element={
          <AuthGuard roles={['client']}>
            <ClientDashboard />
          </AuthGuard>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
