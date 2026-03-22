import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { signOut, onMyClients, onMyEditors, onMyTasks } from '../../services'
import { LogoMark, Avatar } from '../../components/shared/UI'

const NAV = [
  { to: '/admin',         icon: '◈', label: 'Dashboard' },
  { to: '/admin/editors', icon: '✏', label: 'Editors' },
  { to: '/admin/clients', icon: '👥', label: 'Clients' },
  { to: '/admin/tasks',   icon: '📋', label: 'Tasks' },
]

export default function AdminLayout({ children }) {
  const user      = useAuthStore(s => s.user)
  const clearUser = useAuthStore(s => s.clearUser)
  const navigate  = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [clients,   setClients]   = useState([])
  const [editors,   setEditors]   = useState([])
  const [tasks,     setTasks]     = useState([])

  useEffect(() => {
    if (!user) return
    const u1 = onMyClients(user.id, setClients)
    const u2 = onMyEditors(user.id, setEditors)
    const u3 = onMyTasks(user.id, setTasks)
    return () => { u1(); u2(); u3() }
  }, [user?.id])

  async function handleLogout() {
    await signOut()
    clearUser()
    navigate('/login', { replace: true })
  }

  const W = collapsed ? 60 : 234

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <div style={{
        width: W, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        transition: 'width 0.2s ease', overflow: 'hidden',
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          height: 56, padding: '0 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <LogoMark size={30} />
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--blue)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', letterSpacing: -0.3 }}>
                Editor Friend
              </div>
              <div style={{ fontSize: 9, color: 'var(--t3)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/admin'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8, textDecoration: 'none',
              color: isActive ? 'var(--blue)' : 'var(--t3)',
              background: isActive ? 'var(--blue-bg)' : 'none',
              border: `1px solid ${isActive ? 'var(--blue-border)' : 'transparent'}`,
              fontWeight: 600, fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.12s',
            })}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* ─ Clients section ─ */}
        {!collapsed && clients.length > 0 && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '10px 14px 6px',
              fontSize: 9, fontWeight: 800, color: 'var(--t3)',
              textTransform: 'uppercase', letterSpacing: 1,
              borderTop: '1px solid var(--border)',
              marginTop: 4, flexShrink: 0,
            }}>
              Clients
            </div>
            <div style={{ overflow: 'auto', flex: 1, padding: '0 8px 8px' }}>
              {clients.map(client => {
                // Find which editor works for this client
                const clientTasks = tasks.filter(t => t.clientId === client.id)
                const editorIds = [...new Set(clientTasks.map(t => t.editorId).filter(Boolean))]
                const clientEditors = editorIds.map(id => editors.find(e => e.id === id)).filter(Boolean)
                const pendingCount = clientTasks.filter(t => t.status !== 'completed').length

                return (
                  <div key={client.id} style={{
                    padding: '7px 8px', borderRadius: 8, marginBottom: 2,
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 0.1s', cursor: 'default',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Avatar name={client.name} size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.name}
                      </div>
                      {clientEditors.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {clientEditors.map(e => e.name.split(' ')[0]).join(', ')}
                        </div>
                      )}
                    </div>
                    {pendingCount > 0 && (
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: 'var(--blue)', flexShrink: 0,
                      }}>{pendingCount > 9 ? '9+' : pendingCount}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {collapsed && <div style={{ flex: 1 }} />}

        {/* User + Collapse */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            width: '100%', padding: '7px 0', borderRadius: 8, border: '1px solid var(--border)',
            background: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12,
            transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--t2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t3)' }}
          >
            {collapsed ? '→' : '←'}
          </button>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', overflow: 'hidden' }}>
            <Avatar name={user?.name || ''} photoURL={user?.photoURL} size={28} />
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter, sans-serif' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} style={{
            width: '100%', padding: '7px 0', borderRadius: 8, border: 'none',
            background: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12,
            fontFamily: 'Inter, sans-serif', transition: 'all 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
          >
            {collapsed ? '⏻' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
