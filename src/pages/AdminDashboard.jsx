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
        background: '#fff', borderBottom: '0.5px solid #E9E9E7',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: '#191919',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 600,
          }}>E</div>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Editor Mgmt</span>
          <span style={{
            fontSize: 11, background: '#EAF3EB', color: '#0F7B6C',
            padding: '2px 8px', borderRadius: 4, fontWeight: 500,
          }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/admin/columns" style={navLinkStyle}>⚙️ Columns</Link>
          <Link to="/admin/editors" style={navLinkStyle}>👥 Editors</Link>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#73726C',
          }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : (
          <>
            {/* Global stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }} className="animate-in">
              <StatBox value={editors.length} label="Editors" icon="👥" bg="#F7F7F5" />
              <StatBox value={completed} label="Completed" icon="✅" bg="#EAF3EB" />
              <StatBox value={pending} label="Pending" icon="⏳" bg="#FFF8E6" />
              <div style={{
                flex: 1, background: '#EAF3EB', borderRadius: 10, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>💰</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    ₹{totalEarnings.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 12, color: '#73726C' }}>Total earnings</div>
                </div>
              </div>
            </div>

            {/* Editors list */}
            <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#73726C', letterSpacing: 0.3 }}>
                EDITORS
              </span>
              <Link to="/admin/editors" style={{ fontSize: 12, color: '#0066CC', textDecoration: 'none' }}>
                Manage →
              </Link>
            </div>

            {editors.length === 0 ? (
              <Empty icon="👥" message="No editors yet"
                sub="Create editor accounts in Firebase Auth with role: editor" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
  fontSize: 13, color: '#73726C', textDecoration: 'none',
  padding: '6px 12px', borderRadius: 6, border: '0.5px solid #E9E9E7',
  display: 'flex', alignItems: 'center', gap: 4,
}

function StatBox({ value, label, icon, bg }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#73726C' }}>{label}</div>
    </div>
  )
}

function EditorRow({ editor, index, done, pending }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background: hovered ? '#F7F7F5' : '#fff',
        border: '0.5px solid #E9E9E7',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 0.1s',
      }}
      className="animate-in"
      style={{ animationDelay: `${index * 40}ms`, background: hovered ? '#F7F7F5' : '#fff',
        border: '0.5px solid #E9E9E7', borderRadius: 8, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.1s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar name={editor.name} index={index} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{editor.name}</div>
        <div style={{ fontSize: 12, color: '#73726C' }}>{editor.email}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <MiniStat value={done} label="done" color="#0F7B6C" />
        <MiniStat value={pending} label="pending" color="#DFAB01" />
        <Link
          to={`/admin/assign/${editor.uid}`}
          style={{
            fontSize: 12, color: '#0F7B6C', textDecoration: 'none',
            padding: '5px 12px', border: '0.5px solid #0F7B6C',
            borderRadius: 6, fontWeight: 500,
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
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#AFAEA9' }}>{label}</div>
    </div>
  )
}
