import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useAuthStore } from '../../store'
import { onClientTasks, calcClientStats, signOut } from '../../services'
import {
  Topbar, LogoMark, StatCard, StatusBadge,
  Empty, Spinner, Tag, ProgressBar
} from '../../components/shared/UI'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'

const F = { fontFamily: 'Inter, sans-serif' }

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

  // Monthly progress data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const start = startOfMonth(d)
    const end   = endOfMonth(d)
    const monthTasks = tasks.filter(t => {
      const date = t.assignedDate?.toDate?.() ?? null
      return date && date >= start && date <= end
    })
    const doneTasks = tasks.filter(t => {
      const date = t.completedDate?.toDate?.() ?? null
      return date && date >= start && date <= end
    })
    return {
      month: format(d, 'MMM'),
      assigned: monthTasks.length,
      completed: doneTasks.length,
    }
  })

  const pieData = stats ? [
    { name: 'Done',     value: stats.completed, color: '#22c55e' },
    { name: 'Active',   value: tasks.filter(t => t.status === 'in_progress').length, color: '#60a5fa' },
    { name: 'Pending',  value: tasks.filter(t => t.status === 'pending').length, color: '#484848' },
  ].filter(d => d.value > 0) : []

  return (
    <div style={{ minHeight: '100vh' }}>
      <Topbar
        left={
          <>
            <LogoMark size={30} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', ...F }}>
                {user?.name || 'Client Portal'}
              </div>
              {user?.company && <div style={{ fontSize: 10, color: 'var(--t3)', ...F }}>{user.company}</div>}
            </div>
          </>
        }
        right={
          <>
            <Tag children="CLIENT" />
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--t3)', fontSize: 13, ...F,
              padding: '6px 10px', borderRadius: 8, transition: 'color 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
            >Sign Out</button>
          </>
        }
      />

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px 48px' }}>

        {/* Welcome banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: '26px 30px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          overflow: 'hidden', position: 'relative',
        }} className="anim-up">
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(34,197,94,0.04)' }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 6, ...F }}>
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', ...F, marginBottom: 4 }}>
              {user?.name}'s Projects
            </h1>
            <p style={{ fontSize: 13, color: 'var(--t3)', ...F }}>Track your project progress and delivery status.</p>
          </div>
          {stats && (
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 8px' }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: 90, height: 90 }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface3)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green)" strokeWidth="3"
                    strokeDasharray={`${stats.pct} ${100 - stats.pct}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--green)', ...F, lineHeight: 1 }}>{stats.pct}%</div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', ...F }}>complete</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', ...F }}>{stats.completed} of {stats.total} done</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }} className="anim-up">
              <StatCard icon="📁" label="Total Projects" value={stats?.total ?? 0}     color="var(--silver)" />
              <StatCard icon="✅" label="Completed"      value={stats?.completed ?? 0} color="var(--green)" />
              <StatCard icon="🔄" label="In Progress"    value={tasks.filter(t => t.status === 'in_progress').length} color="var(--blue)" />
            </div>

            {/* Charts row */}
            {tasks.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>

                {/* Monthly progress bar chart */}
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '18px 20px',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', ...F, marginBottom: 2 }}>Monthly Progress</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', ...F, marginBottom: 16 }}>Assigned vs Completed</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthlyData} barGap={4} barCategoryGap={16}>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--t3)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="assigned"  name="Assigned"  fill="rgba(96,165,250,0.2)" radius={[4,4,0,0]} />
                      <Bar dataKey="completed" name="Completed" fill="var(--green)"           radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <LegendDot color="rgba(96,165,250,0.5)" label="Assigned" />
                    <LegendDot color="var(--green)" label="Completed" />
                  </div>
                </div>

                {/* Status pie */}
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '18px 20px',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', ...F, marginBottom: 2 }}>Status Breakdown</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', ...F, marginBottom: 8 }}>All-time overview</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 4 }}>
                    {pieData.map(d => <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />)}
                  </div>
                </div>
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
                  background: filter === key ? 'var(--green-bg)' : 'none',
                  color: filter === key ? 'var(--green)' : 'var(--t3)',
                  borderColor: filter === key ? 'var(--green-border)' : 'var(--border)',
                  ...F, fontWeight: 600, fontSize: 11,
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

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
    </div>
  )
}

function ProjectCard({ task, index, expanded, onToggle }) {
  const assigned  = task.assignedDate?.toDate?.()
  const completed = task.completedDate?.toDate?.()
  const deadline  = task.deadline

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
            background: task.status === 'completed' ? 'var(--green-bg)' : task.status === 'in_progress' ? 'var(--blue-bg)' : 'var(--surface3)',
            border: `1px solid ${task.status === 'completed' ? 'var(--green-border)' : task.status === 'in_progress' ? 'var(--blue-border)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏳'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...F }}>
              {task.title}
            </div>
            {task.description && (
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...F }}>
                {task.description}
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <ProgressBar value={pct} max={100} color={progressColor} showPct={false} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <StatusBadge status={task.status} />
            {assigned && <span style={{ fontSize: 10, color: 'var(--t3)', ...F }}>{format(assigned, 'd MMM yyyy')}</span>}
          </div>
          <span style={{ color: 'var(--t3)', fontSize: 13, flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border2)', borderTop: 'none',
          borderRadius: '0 0 14px 14px', padding: '18px 20px',
        }} className="anim-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 14 }}>
            <DetailItem label="Status"    value={task.status.replace('_', ' ')} />
            <DetailItem label="Assigned"  value={assigned ? format(assigned, 'd MMM yyyy') : '—'} />
            <DetailItem label="Deadline"  value={deadline ?? 'Not set'} color={deadline ? 'var(--amber)' : 'var(--t3)'} />
            <DetailItem label="Completed" value={completed ? format(completed, 'd MMM yyyy') : 'Pending'} color={completed ? 'var(--green)' : 'var(--t3)'} />
            <DetailItem label="Progress"  value={`${pct}%`} color={progressColor} />
          </div>
          {/* Visual progress bar in detail */}
          <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, ...F }}>Completion</span>
              <span style={{ fontSize: 11, color: progressColor, fontWeight: 700, ...F }}>{pct}%</span>
            </div>
            <div style={{ background: 'var(--surface3)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: progressColor,
                width: `${pct}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
          {task.description && (
            <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 9, border: '1px solid var(--border)', marginTop: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, ...F }}>{task.description}</p>
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
      <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 3, ...F }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color, textTransform: 'capitalize', ...F }}>{value}</div>
    </div>
  )
}
