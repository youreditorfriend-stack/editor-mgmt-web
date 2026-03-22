import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '../../store'
import { onClientTasks, calcClientStats, signOut } from '../../services'
import {
  Topbar, LogoMark, StatCard, StatusBadge,
  Empty, Spinner, Tag, ProgressBar
} from '../../components/shared/UI'
import { ChartCard, StatusPieChart } from '../../components/shared/Charts'

export default function ClientDashboard() {
  const user      = useAuthStore(s => s.user)
  const clearUser = useAuthStore(s => s.clearUser)
  const navigate  = useNavigate()
  const [tasks,   setTasks]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!user) return
    return onClientTasks(user.id, data => {
      setTasks(data)
      setStats(calcClientStats(data))
      setLoading(false)
    })
  }, [user?.id])

  async function handleLogout() {
    await signOut()
    clearUser()
    navigate('/login', { replace: true })
  }

  const displayed = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const pieData = stats ? [
    { name: 'Completed', value: stats.completed },
    { name: 'Active',    value: stats.active    },
  ] : []

  return (
    <div style={{ minHeight: '100vh' }}>
      <Topbar
        left={
          <>
            <LogoMark size={30} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>
                {user?.name || 'Client Portal'}
              </div>
              {user?.company && <div style={{ fontSize: 10, color: 'var(--t3)' }}>{user.company}</div>}
            </div>
          </>
        }
        right={
          <>
            <Tag children="CLIENT" />
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

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 48px' }}>

        {/* Welcome banner */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '22px 26px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }} className="anim-up">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>
              Project Overview
            </h1>
            <p style={{ fontSize: 13, color: 'var(--t3)' }}>
              Track your project progress and delivery status.
            </p>
          </div>
          {stats && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--silver)', fontFamily: 'Syne, sans-serif' }}>
                {stats.pct}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Complete</div>
              <div style={{ marginTop: 8, width: 160 }}>
                <ProgressBar value={stats.completed} max={stats.total} color="var(--green)" />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={32} />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }} className="anim-up">
              <StatCard icon="📁" label="Total Projects" value={stats?.total ?? 0}     color="var(--silver)" />
              <StatCard icon="✅" label="Completed"      value={stats?.completed ?? 0} color="var(--green)" />
              <StatCard icon="🔄" label="In Progress"    value={stats?.active ?? 0}    color="var(--amber)" />
            </div>

            {/* Charts row */}
            {tasks.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <ChartCard title="Project Status" sub="All-time breakdown" height={220}>
                  <StatusPieChart data={pieData} />
                </ChartCard>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {[
                ['all',         `All (${tasks.length})`],
                ['pending',     `Pending (${tasks.filter(t=>t.status==='pending').length})`],
                ['in_progress', `In Progress (${tasks.filter(t=>t.status==='in_progress').length})`],
                ['completed',   `Done (${tasks.filter(t=>t.status==='completed').length})`],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  background: filter === key ? 'var(--surface2)' : 'none',
                  color: filter === key ? 'var(--t1)' : 'var(--t3)',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 11,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}>{label}</button>
              ))}
            </div>

            {/* Project list */}
            {displayed.length === 0 ? (
              <Empty icon="📦" title="No Projects" sub="Your admin will assign projects to your account." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {displayed.map((task, i) => (
                  <ProjectCard
                    key={task.id}
                    task={task}
                    index={i}
                    expanded={expanded === task.id}
                    onToggle={() => setExpanded(expanded === task.id ? null : task.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ task, index, expanded, onToggle }) {
  const assigned  = task.assignedDate?.toDate?.()
  const completed = task.completedDate?.toDate?.()
  const deadline  = task.deadline

  // Completion percentage (simple: completed = 100, in_progress = 50, pending = 0)
  const pct = task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0
  const progressColor = task.status === 'completed' ? 'var(--green)' : task.status === 'in_progress' ? 'var(--blue)' : 'var(--t3)'

  return (
    <div className="anim-up" style={{ animationDelay: `${index * 30}ms` }}>
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: expanded ? '14px 14px 0 0' : 14,
          padding: '16px 20px', cursor: 'pointer', transition: 'all 0.14s',
        }}
        onClick={onToggle}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = expanded ? 'var(--border2)' : 'var(--border)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Status indicator */}
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏳'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </div>
            {task.description && (
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.description}
              </div>
            )}
            {/* Progress bar */}
            <div style={{ marginTop: 8 }}>
              <ProgressBar value={pct} max={100} color={progressColor} showPct={false} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <StatusBadge status={task.status} />
            {assigned && <span style={{ fontSize: 10, color: 'var(--t3)' }}>{format(assigned, 'd MMM yyyy')}</span>}
          </div>
          <span style={{ color: 'var(--t3)', fontSize: 13, flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border2)', borderTop: 'none',
          borderRadius: '0 0 14px 14px', padding: '16px 20px',
        }} className="anim-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 12 }}>
            <DetailItem label="Status" value={task.status.replace('_', ' ')} />
            <DetailItem label="Assigned" value={assigned ? format(assigned, 'd MMM yyyy') : '—'} />
            <DetailItem label="Deadline" value={deadline ?? 'Not set'} color={deadline ? 'var(--amber)' : 'var(--t3)'} />
            <DetailItem label="Completed" value={completed ? format(completed, 'd MMM yyyy') : 'Pending'} color={completed ? 'var(--green)' : 'var(--t3)'} />
            <DetailItem label="Progress" value={`${pct}%`} color={progressColor} />
          </div>
          {task.description && (
            <div style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 9, border: '1px solid var(--border)', marginTop: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>{task.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value, color = 'var(--t1)' }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
    </div>
  )
}
