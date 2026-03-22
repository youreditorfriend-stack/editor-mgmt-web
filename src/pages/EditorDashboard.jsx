import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '../store'
import { onEditorTasks, calcEditorStats, signOut, updateTaskStatus } from '../services'
import { StatCard, StatusBadge, Avatar, Empty, Spinner } from '../components/shared/UI'

export default function EditorDashboard() {
  const user = useAuthStore(s => s.user)
  const clearUser = useAuthStore(s => s.clearUser)
  const [tasks, setTasks]   = useState([])
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = onEditorTasks(user.uid, (data) => {
      setTasks(data)
      setStats(calcEditorStats(data))
      setLoading(false)
    })
    return unsub
  }, [user?.uid])

  async function handleLogout() {
    await signOut(); clearUser()
  }

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  }

  const pending   = tasks.filter(t => t.status !== 'completed')
  const completed = tasks.filter(t => t.status === 'completed')

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
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#191919' }}>
              Good {greeting()}, {user?.name?.split(' ')[0]}
            </div>
            <div style={{ fontSize: 11, color: '#AFAEA9' }}>
              {format(new Date(), 'EEEE, d MMMM')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/workspace" style={{
            fontSize: 13, color: '#191919', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            border: '1px solid #E9E9E7',
            fontWeight: 500, background: '#fff',
            boxShadow: 'var(--shadow-sm)',
          }}>
            📊 Workspace
          </Link>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#73726C', padding: '7px 10px',
            borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#F7F7F5'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>

        {/* Stat cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <Spinner />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }} className="animate-in">
            <StatCard
              label="This month"
              value={`₹${(stats?.monthEarnings ?? 0).toLocaleString('en-IN')}`}
              icon="💰"
              bg="#EAF3EB"
            />
            <StatCard
              label="Completed"
              value={stats?.completedCount ?? 0}
              icon="✅"
              bg="#EAF3EB"
            />
            <StatCard
              label="Pending"
              value={stats?.pendingCount ?? 0}
              icon="⏳"
              bg={stats?.pendingCount > 0 ? '#FFF8E6' : '#F7F7F5'}
              color={stats?.pendingCount > 0 ? '#DFAB01' : '#73726C'}
            />
          </div>
        )}

        {/* Task sections */}
        {!loading && tasks.length === 0 && (
          <Empty icon="📭" message="No tasks assigned yet"
            sub="Your admin will assign tasks to you" />
        )}

        {pending.length > 0 && (
          <TaskSection
            label="Pending"
            count={pending.length}
            dot="#DFAB01"
            tasks={pending}
          />
        )}

        {completed.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <TaskSection
              label="Completed"
              count={completed.length}
              dot="#0F7B6C"
              tasks={completed}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function TaskSection({ label, count, dot, tasks }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 10,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: 11, color: '#73726C', fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{
          fontSize: 11, background: '#F1F1EF', color: '#73726C',
          padding: '1px 7px', borderRadius: 10, fontWeight: 600,
        }}>{count}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        background: '#fff',
        border: '1px solid #F1F1EF',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#FAFAF9'
        e.currentTarget.style.borderColor = '#E9E9E7'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#fff'
        e.currentTarget.style.borderColor = '#F1F1EF'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      <StatusBadge status={task.status} onClick={cycleStatus} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500,
          color: task.status === 'completed' ? '#AFAEA9' : '#191919',
          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 12, color: '#73726C', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.description}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: '#AFAEA9', flexShrink: 0 }}>
        {date ? format(date, 'd MMM') : '—'}
      </div>
    </div>
  )
}
