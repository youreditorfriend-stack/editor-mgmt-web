import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { signOut } from '../../services'
import { LogoMark, Avatar, Btn } from '../../components/shared/UI'

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

  async function handleLogout() {
    await signOut()
    clearUser()
    navigate('/login', { replace: true })
  }

  const W = collapsed ? 60 : 220

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
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap' }}>
                Editor Friend
              </div>
              <div style={{ fontSize: 9, color: 'var(--t3)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/admin'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 9, textDecoration: 'none',
              color: isActive ? 'var(--t1)' : 'var(--t3)',
              background: isActive ? 'var(--surface3)' : 'none',
              border: `1px solid ${isActive ? 'var(--border2)' : 'transparent'}`,
              fontWeight: 600, fontSize: 13,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.12s',
            })}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Collapse */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid var(--border)',
            background: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12,
            transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--t2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t3)' }}
          >
            {collapsed ? '→' : '←'}
          </button>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px', overflow: 'hidden' }}>
            <Avatar name={user?.name || ''} photoURL={user?.photoURL} size={28} />
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
            background: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12,
            fontFamily: 'DM Sans, sans-serif', transition: 'all 0.12s',
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
