import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store'
import { onEditors, onAllTasks, signOut } from '../services'
import { Avatar, Spinner, Empty, CodeBadge, showToast } from '../components/shared/UI'

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

  const completed     = tasks.filter(t => t.status === 'completed').length
  const pending       = tasks.filter(t => t.status !== 'completed').length
  const totalEarnings = editors.reduce((s, e) => s + (e.totalEarnings ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Topbar */}
      <div style={{
        background: 'rgba(12,12,20,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #6d5fef, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            boxShadow: '0 2px 8px rgba(109,95,239,0.4)',
          }}>YEF</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>
            Editor Mgmt
          </span>
          <span style={{
            fontSize: 9, background: 'rgba(109,95,239,0.2)', color: '#a89ff5',
            padding: '2px 8px', borderRadius: 10, fontWeight: 700, letterSpacing: 0.6,
            border: '1px solid rgba(109,95,239,0.25)',
          }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/admin/columns" style={navLinkStyle}>⚙ Columns</Link>
          <Link to="/admin/editors" style={navLinkStyle}>👥 Editors</Link>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--t2)', fontFamily: 'DM Sans, sans-serif',
            padding: '7px 10px', borderRadius: 8, transition: 'all 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--t1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t2)' }}
          >Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={28} /></div>
        ) : (
          <>
            {/* Global stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 28 }} className="animate-in">
              <StatBox value={editors.length} label="Total Editors" icon="👥" color="var(--t1)" accent="rgba(109,95,239,0.15)" />
              <StatBox value={completed} label="Completed" icon="✓" color="#34d399" accent="rgba(16,185,129,0.12)" />
              <StatBox value={pending} label="Pending" icon="⏳" color="#fcd34d" accent="rgba(245,158,11,0.12)" />
              <StatBox
                value={'₹' + totalEarnings.toLocaleString('en-IN')}
                label="Total Earnings"
                icon="₹"
                color="#a89ff5"
                accent="rgba(109,95,239,0.12)"
              />
            </div>

            {/* Editors list header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Editors ({editors.length})
              </span>
              <Link to="/admin/editors" style={{
                fontSize: 11, color: '#a89ff5', textDecoration: 'none',
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                padding: '5px 10px', borderRadius: 7,
                background: 'rgba(109,95,239,0.1)', border: '1px solid rgba(109,95,239,0.2)',
                transition: 'all 0.12s',
              }}>
                Manage all →
              </Link>
            </div>

            {editors.length === 0 ? (
              <Empty icon="👥" message="No editors yet"
                sub="Create editor accounts in Firebase Auth with role: editor" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
  fontSize: 12, color: 'var(--t2)', textDecoration: 'none',
  padding: '6px 12px', borderRadius: 8,
  border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500,
  background: 'rgba(255,255,255,0.04)',
  transition: 'all 0.12s',
}

function StatBox({ value, label, icon, color, accent }) {
  return (
    <div style={{
      background: 'rgba(17,17,32,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '16px 18px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, marginBottom: 10, color,
        fontWeight: 700,
      }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  )
}

function EditorRow({ editor, index, done, pending }) {
  const [hovered, setHovered] = useState(false)

  function copyCode() {
    if (editor.editorCode) {
      navigator.clipboard.writeText(editor.editorCode)
      showToast('✓ Code copied!')
    }
  }

  return (
    <div
      className="animate-in"
      style={{
        animationDelay: `${index * 40}ms`,
        background: hovered ? 'rgba(22,22,40,0.8)' : 'rgba(17,17,32,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all 0.15s',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar name={editor.name} index={index} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{editor.name}</div>
        <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>{editor.email}</div>
      </div>
      {editor.editorCode && (
        <CodeBadge code={editor.editorCode} onCopy={copyCode} />
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <MiniStat value={done} label="done" color="#34d399" />
        <MiniStat value={pending} label="pending" color="#fcd34d" />
        <Link
          to={`/admin/editor/${editor.uid}`}
          style={{
            fontSize: 11, color: '#67e8f9', textDecoration: 'none',
            padding: '5px 10px', border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: 7, fontWeight: 600,
            background: 'rgba(34,211,238,0.08)',
            transition: 'all 0.12s',
          }}
        >
          View
        </Link>
        <Link
          to={`/admin/assign/${editor.uid}`}
          style={{
            fontSize: 11, color: '#a89ff5', textDecoration: 'none',
            padding: '5px 10px', border: '1px solid rgba(109,95,239,0.25)',
            borderRadius: 7, fontWeight: 600,
            background: 'rgba(109,95,239,0.1)',
            transition: 'all 0.12s',
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
    <div style={{ textAlign: 'center', minWidth: 32 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  )
}
