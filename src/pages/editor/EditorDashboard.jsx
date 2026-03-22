import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { format } from 'date-fns'
import { useAuthStore } from '../../store'
import { onEditorTasks, updateTaskStatus, calcEditorStats, signOut } from '../../services'
import {
  Topbar, LogoMark, Avatar, StatCard, StatusBadge,
  Empty, Spinner, showToast, Tag, ProgressBar
} from '../../components/shared/UI'
import { ChartCard, EarningsBarChart } from '../../components/shared/Charts'

export default function EditorDashboard() {
  const user      = useAuthStore(s => s.user)
  const clearUser = useAuthStore(s => s.clearUser)
  const navigate  = useNavigate()
  const [tasks,   setTasks]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('pending')   // 'pending' | 'completed' | 'all'

  useEffect(() => {
    if (!user) return
    return onEditorTasks(user.id, data => {
      setTasks(data)
      setStats(calcEditorStats(data))
      setLoading(false)
    })
  }, [user?.id])

  async function handleLogout() {
    await signOut()
    clearUser()
    navigate('/login', { replace: true })
  }

  async function cycleStatus(task) {
    const map = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' }
    await updateTaskStatus(task.id, map[task.status] || 'pending')
    showToast(`Status updated`)
  }

  const pending    = tasks.filter(t => t.status === 'pending')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const completed  = tasks.filter(t => t.status === 'completed')

  const displayed = tab === 'pending'
    ? [...inProgress, ...pending]
    : tab === 'completed'
    ? completed
    : tasks

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Topbar
        left={
          <>
            <LogoMark size={30} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>
                {greeting()}, {user?.name?.split(' ')[0]}
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{format(new Date(), 'EEEE, d MMMM')}</div>
            </div>
          </>
        }
        right={
          <>
            <Tag children="EDITOR" />
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--t3)', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
              padding: '6px 10px', borderRadius: 8, transition: 'color 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
            >Sign Out</button>
          </>
        }
      />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 48px' }}>

        {/* Editor ID card */}
        {user?.editorCode && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border2)',
            borderRadius: 14, padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }} className="anim-up">
            <div>
              <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 4 }}>
                Your Editor Code
              </div>
              <code style={{ fontSize: 18, fontWeight: 800, color: 'var(--silver)', letterSpacing: 3, fontFamily: 'monospace' }}>
                {user.editorCode}
              </code>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Share this with your admin to connect</div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(user.editorCode); showToast('Code copied!') }}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: 9, padding: '8px 14px', color: 'var(--silver)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
            >
              Copy
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={32} />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }} className="anim-up">
              <StatCard icon="💰" label="Total Earned" value={`₹${(stats?.totalEarnings ?? 0).toLocaleString('en-IN')}`} color="var(--silver)" />
              <StatCard icon="📅" label="This Month"   value={`₹${(stats?.monthEarnings ?? 0).toLocaleString('en-IN')}`} color="var(--green)" />
              <StatCard icon="✅" label="Completed"    value={stats?.completedCount ?? 0} color="var(--t1)" />
              <StatCard icon="⏳" label="Pending"      value={(stats?.pendingCount ?? 0) + (stats?.inProgressCount ?? 0)} color="var(--amber)" />
            </div>

            {/* Completion progress */}
            {tasks.length > 0 && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 18px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, flexShrink: 0 }}>Task Completion</div>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={completed.length} max={tasks.length} color="var(--green)" />
                </div>
              </div>
            )}

            {/* Chart */}
            {stats?.monthly?.some(m => m.amount > 0) && (
              <div style={{ marginBottom: 28 }}>
                <ChartCard title="Monthly Earnings" sub="Last 6 months" height={200}>
                  <EarningsBarChart data={stats.monthly} dataKey="amount" />
                </ChartCard>
              </div>
            )}

            {/* Task List */}
            <div>
              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {[
                  ['pending',   `Active (${inProgress.length + pending.length})`],
                  ['completed', `Completed (${completed.length})`],
                  ['all',       `All (${tasks.length})`],
                ].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)} style={{
                    padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                    background: tab === key ? 'var(--surface2)' : 'none',
                    color: tab === key ? 'var(--t1)' : 'var(--t3)',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 12,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>{label}</button>
                ))}
              </div>

              {displayed.length === 0 ? (
                <Empty icon="📭" title="No Tasks"
                  sub={tab === 'pending' ? 'No active tasks. Check back later.' : 'Nothing here yet.'} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {displayed.map((task, i) => (
                    <TaskRow key={task.id} task={task} index={i} onCycle={() => cycleStatus(task)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TaskRow({ task, index, onCycle }) {
  const [hov, setHov] = useState(false)
  const assigned  = task.assignedDate?.toDate?.()
  const deadline  = task.deadline
  const completed = task.completedDate?.toDate?.()

  return (
    <div
      className="anim-up"
      style={{
        animationDelay: `${index * 30}ms`,
        background: hov ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hov ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.14s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.25)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <StatusBadge status={task.status} onClick={onCycle} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: task.status === 'completed' ? 'var(--t3)' : 'var(--t1)',
          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.description}
          </div>
        )}
        <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
          {assigned && <TaskMeta icon="📅" label={`Assigned ${format(assigned, 'd MMM')}`} />}
          {deadline  && <TaskMeta icon="⏰" label={`Due ${deadline}`} color="var(--amber)" />}
          {completed && <TaskMeta icon="✅" label={`Done ${format(completed, 'd MMM')}`} color="var(--green)" />}
        </div>
      </div>

      {/* Earnings (only shown for editor tasks) */}
      {Number(task.editorAmount) > 0 && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', fontFamily: 'Syne, sans-serif' }}>
            ₹{Number(task.editorAmount).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Earnings</div>
        </div>
      )}

      {/* Cycle hint */}
      <div style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>
        click badge to update
      </div>
    </div>
  )
}

function TaskMeta({ icon, label, color = 'var(--t3)' }) {
  return (
    <span style={{ fontSize: 11, color, display: 'flex', alignItems: 'center', gap: 4 }}>
      <span>{icon}</span>{label}
    </span>
  )
}

