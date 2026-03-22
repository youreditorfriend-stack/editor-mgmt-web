import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '../store'
import { onEditors, onAllTasks, signOut } from '../services'
import { Avatar, Spinner, Empty } from '../components/shared/UI'

export default function AdminDashboard() {
  const clearUser = useAuthStore(s => s.clearUser)
  const [editors, setEditors] = useState([])
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u1 = onEditors(setEditors)
    const u2 = onAllTasks(data => { setTasks(data); setLoading(false) })
    return () => { u1(); u2() }
  }, [])

  async function handleLogout() { await signOut(); clearUser() }

  const completed = tasks.filter(t => t.status === 'completed').length
  const pending   = tasks.filter(t => t.status !== 'completed').length
  const totalEarnings = editors.reduce((s, e) => s + (e.totalEarnings ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      {/* Topbar */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #F1F1EF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #1A1A1A 0%, #3D3D3D 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 15, fontWeight: 700,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>E</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>Editor Mgmt</span>
          <span style={{
            fontSize: 10, background: '#EAF3EB', color: '#0F7B6C',
            padding: '2px 8px', borderRadius: 10, fontWeight: 700, letterSpacing: 0.4,
          }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/admin/columns" style={navLinkStyle}>⚙️ Columns</Link>
          <Link to="/admin/editors" style={navLinkStyle}>👥 Editors</Link>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#73726C', fontFamily: 'DM Sans, sans-serif',
            padding: '7px 10px', borderRadius: 8,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#F7F7F5'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner /></div>
        ) : (
          <>
            {/* Global stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }} className="animate-in">
              <StatBox value={editors.length} label="Editors" icon="👥" bg="#F7F7F5" />
              <StatBox value={completed} label="Completed" icon="✅" bg="#EAF3EB" />
              <StatBox value={pending} label="Pending" icon="⏳" bg="#FFF8E6" />
              <div style={{
                flex: 1, background: '#EAF3EB', borderRadius: 12, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(255,255,255,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>💰</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#191919', lineHeight: 1 }}>
                    ₹{totalEarnings.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 12, color: '#73726C', marginTop: 5, fontWeight: 500 }}>Total earnings</div>
                </div>
              </div>
            </div>

            {/* Editors list */}
            <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#AFAEA9', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Editors
              </span>
              <Link to="/admin/editors" style={{
                fontSize: 12, color: '#0F7B6C', textDecoration: 'none',
                fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3,
              }}>
                Manage →
              </Link>
            </div>

            {editors.length === 0 ? (
              <Empty icon="👥" message="No editors yet"
                sub="Create editor accounts in Firebase Auth with role: editor" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {editors.map((editor, i) => {
                  const editorTasks = tasks.filter(t => t.editorID === editor.uid)
                  const done = editorTasks.filter(t => t.status === 'completed').length
                  const pend = editorTasks.filter(t => t.status !== 'completed').length
                  return (
                    <EditorRow
                      key={editor.id}
                      editor={editor}
                      index={i}
                      done={done}
                      pending={pend}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const navLinkStyle = {
  fontSize: 13, color: '#191919', textDecoration: 'none',
  padding: '7px 14px', borderRadius: 8, border: '1px solid #E9E9E7',
  display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500,
  background: '#fff', boxShadow: 'var(--shadow-sm)',
}

function StatBox({ value, label, icon, bg }) {
  return (
    <div style={{
      flex: 1, background: bg, borderRadius: 12, padding: '16px 18px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'rgba(255,255,255,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, marginBottom: 10,
      }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#191919', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#73726C', marginTop: 5, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function EditorRow({ editor, index, done, pending }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="animate-in"
      style={{
        animationDelay: `${index * 40}ms`,
        background: hovered ? '#FAFAF9' : '#fff',
        border: `1px solid ${hovered ? '#E9E9E7' : '#F1F1EF'}`,
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.08)' : 'var(--shadow-sm)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar name={editor.name} index={index} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{editor.name}</div>
        <div style={{ fontSize: 12, color: '#73726C' }}>{editor.email}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <MiniStat value={done} label="done" color="#0F7B6C" />
        <MiniStat value={pending} label="pending" color="#DFAB01" />
        <Link
          to={`/admin/assign/${editor.uid}`}
          style={{
            fontSize: 12, color: '#0F7B6C', textDecoration: 'none',
            padding: '6px 12px', border: '1px solid rgba(15,123,108,0.3)',
            borderRadius: 7, fontWeight: 600, background: '#EAF3EB',
          }}
        >
          + Assign
        </Link>
      </div>
    </div>
  )
}

function MiniStat({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#AFAEA9', fontWeight: 500 }}>{label}</div>
    </div>
  )
}
