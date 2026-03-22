import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '../store'
import { onEditorTasks, calcEditorStats, signOut, updateTaskStatus, ensureEditorCode } from '../services'
import { StatusBadge, Empty, Spinner, showToast } from '../components/shared/UI'

export default function EditorDashboard() {
  const user = useAuthStore(s => s.user)
  const clearUser = useAuthStore(s => s.clearUser)
  const [tasks, setTasks]     = useState([])
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [editorCode, setEditorCode] = useState(user?.editorCode || '')

  useEffect(() => {
    if (!user) return
    const unsub = onEditorTasks(user.uid, (data) => {
      setTasks(data)
      setStats(calcEditorStats(data))
      setLoading(false)
    })
    // ensure editor has a code
    if (!editorCode) {
      ensureEditorCode(user.uid).then(code => { if (code) setEditorCode(code) })
    }
    return unsub
  }, [user?.uid])

  async function handleLogout() { await signOut(); clearUser() }

  function copyCode() {
    if (!editorCode) return
    navigator.clipboard.writeText(editorCode)
    showToast('✓ Your editor code copied!')
  }

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  }

  const pending   = tasks.filter(t => t.status !== 'completed')
  const completed = tasks.filter(t => t.status === 'completed')

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Topbar */}
      <div style={{
        background: 'rgba(12,12,20,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #6d5fef, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 800, fontFamily: 'Syne, sans-serif',
            boxShadow: '0 2px 8px rgba(109,95,239,0.4)',
          }}>YEF</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>
              Good {greeting()}, {user?.name?.split(' ')[0]}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>
              {format(new Date(), 'EEEE, d MMMM')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/workspace" style={{
            fontSize: 12, color: 'var(--t2)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid var(--border)',
            fontWeight: 500,
            background: 'rgba(255,255,255,0.04)',
            transition: 'all 0.12s',
          }}>
            ◫ Workspace
          </Link>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--t2)', padding: '6px 10px',
            borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--t1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t2)' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>

        {/* Editor ID Card */}
        {editorCode && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(109,95,239,0.1), rgba(34,211,238,0.06))',
            border: '1px solid rgba(109,95,239,0.2)',
            borderRadius: 14, padding: '14px 18px',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }} className="animate-in">
            <div>
              <div style={{ fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>
                Your Editor ID
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#a89ff5', letterSpacing: 2 }}>
                {editorCode}
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>
                Share this code with your admin to connect
              </div>
            </div>
            <button
              onClick={copyCode}
              style={{
                background: 'rgba(109,95,239,0.15)',
                border: '1px solid rgba(109,95,239,0.25)',
                borderRadius: 9, padding: '8px 14px',
                color: '#a89ff5', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(109,95,239,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(109,95,239,0.15)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Copy
            </button>
          </div>
        )}

        {/* Stat cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <Spinner size={28} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }} className="animate-in">
            <StatCard
              label="This Month"
              value={`₹${(stats?.monthEarnings ?? 0).toLocaleString('en-IN')}`}
              icon="₹"
              color="#a89ff5"
              accent="rgba(109,95,239,0.12)"
            />
            <StatCard
              label="Completed"
              value={stats?.completedCount ?? 0}
              icon="✓"
              color="#34d399"
              accent="rgba(16,185,129,0.12)"
            />
            <StatCard
              label="Pending"
              value={stats?.pendingCount ?? 0}
              icon="⏳"
              color={stats?.pendingCount > 0 ? '#fcd34d' : 'var(--t2)'}
              accent={stats?.pendingCount > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)'}
            />
          </div>
        )}

        {/* Task sections */}
        {!loading && tasks.length === 0 && (
          <Empty icon="📭" message="No tasks assigned yet"
            sub="Your admin will assign tasks to you" />
        )}

        {pending.length > 0 && (
          <TaskSection label="Pending" count={pending.length} dot="#f59e0b" tasks={pending} />
        )}

        {completed.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <TaskSection label="Completed" count={completed.length} dot="#10b981" tasks={completed} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, accent }) {
  return (
    <div style={{
      background: 'rgba(17,17,32,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '16px 18px',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, marginBottom: 10, color, fontWeight: 700,
      }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  )
}

function TaskSection({ label, count, dot, tasks }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--t2)',
          padding: '1px 7px', borderRadius: 10, fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>{count}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {tasks.map((task, i) => (
          <TaskRow key={task.id} task={task} index={i} />
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task, index }) {
  const date = task.assignedDate?.toDate?.()

  function cycleStatus() {
    const next = task.status === 'pending' ? 'in_progress'
      : task.status === 'in_progress' ? 'completed' : 'pending'
    updateTaskStatus(task.id, next)
  }

  return (
    <div
      className="animate-in"
      style={{
        animationDelay: `${index * 40}ms`,
        background: 'rgba(17,17,32,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 11,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(22,22,40,0.8)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(17,17,32,0.6)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <StatusBadge status={task.status} onClick={cycleStatus} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: task.status === 'completed' ? 'var(--t3)' : 'var(--t1)',
          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.description}
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>
        {date ? format(date, 'd MMM') : '—'}
      </div>
    </div>
  )
}
