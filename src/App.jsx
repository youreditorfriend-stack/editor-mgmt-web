import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { Spinner } from './components/shared/UI'

import LoginPage       from './pages/LoginPage'
import EditorDashboard from './pages/EditorDashboard'
import WorkspacePage   from './pages/WorkspacePage'
import AdminDashboard  from './pages/AdminDashboard'
import ColumnManagerPage from './pages/ColumnManagerPage'
import { AssignTaskPage, EditorsPage } from './pages/AdminPages'

function AuthGuard({ children, requiredRole }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh',
        alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={24} />
    </div>
  )

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}

export default function App() {
  const init = useAuthStore(s => s.init)

  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Editor routes */}
        <Route path="/dashboard" element={
          <AuthGuard requiredRole="editor"><EditorDashboard /></AuthGuard>
        } />
        <Route path="/workspace" element={
          <AuthGuard requiredRole="editor"><WorkspacePage /></AuthGuard>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <AuthGuard requiredRole="admin"><AdminDashboard /></AuthGuard>
        } />
        <Route path="/admin/columns" element={
          <AuthGuard requiredRole="admin"><ColumnManagerPage /></AuthGuard>
        } />
        <Route path="/admin/editors" element={
          <AuthGuard requiredRole="admin"><EditorsPage /></AuthGuard>
        } />
        <Route path="/admin/assign/:editorId" element={
          <AuthGuard requiredRole="admin"><AssignTaskPage /></AuthGuard>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
