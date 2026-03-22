import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { onMyTasks, onMyEditors, onMyClients, calcAdminStats } from '../../services'
import { StatCard, SectionHeader, StatusBadge, Avatar, Empty, Spinner } from '../../components/shared/UI'
import { ChartCard, RevenueAreaChart, EarningsBarChart, StatusPieChart } from '../../components/shared/Charts'
import AdminLayout from './AdminLayout'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const user = useAuthStore(s => s.user)
  const [tasks,   setTasks]   = useState([])
  const [editors, setEditors] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats,   setStats]   = useState(null)

  useEffect(() => {
    if (!user) return
    const u1 = onMyTasks(user.id, data => { setTasks(data); setLoading(false) })
    const u2 = onMyEditors(user.id, setEditors)
    const u3 = onMyClients(user.id, setClients)
    return () => { u1(); u2(); u3() }
  }, [user?.id])

  useEffect(() => {
    setStats(calcAdminStats(tasks))
  }, [tasks])

  const recentTasks = tasks.slice(0, 8)
  const pieData = stats ? [
    { name: 'Completed', value: stats.completedCount },
    { name: 'Active',    value: stats.activeCount },
  ] : []

  return (
    <AdminLayout>
      <div style={{ padding: '28px 28px 40px', maxWidth: 1200 }}>

        {/* ── Welcome ── */}
        <div style={{ marginBottom: 28 }} className="anim-up">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Syne, sans-serif', marginBottom: 5 }}>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>
            {format(new Date(), 'EEEE, d MMMM yyyy')}
            {user?.businessName && ` · ${user.businessName}`}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={32} />
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }} className="anim-up">
              <StatCard icon="💰" label="Total Revenue"   value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`} color="var(--silver)" />
              <StatCard icon="📈" label="Net Profit"      value={`₹${(stats?.totalProfit  ?? 0).toLocaleString('en-IN')}`} color="var(--green)" />
              <StatCard icon="📁" label="Active Projects" value={stats?.activeCount   ?? 0} color="var(--amber)" />
              <StatCard icon="✏" label="Total Editors"    value={editors.length}            color="var(--t1)" />
            </div>

            {/* ── Charts Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 28 }}>
              <ChartCard
                title="Monthly Revenue"
                sub="Last 6 months · Revenue from completed tasks"
                height={220}
              >
                <RevenueAreaChart data={stats?.monthly ?? []} dataKey="amount" label="Revenue" />
              </ChartCard>
              <ChartCard title="Task Breakdown" sub="All time completion rate" height={220}>
                <StatusPieChart data={pieData} />
              </ChartCard>
            </div>

            {/* ── Quick Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
              <QuickCard title="Total Tasks" value={tasks.length} icon="📋"
                sub={`${stats?.completedCount ?? 0} completed`} link="/admin/tasks" />
              <QuickCard title="Editors" value={editors.length} icon="✏"
                sub="Active team members" link="/admin/editors" />
              <QuickCard title="Clients" value={clients.length} icon="👥"
                sub="Managed accounts" link="/admin/clients" />
            </div>

            {/* ── Recent Tasks ── */}
            <div>
              <SectionHeader
                title="Recent Tasks"
                count={tasks.length}
                action={<Link to="/admin/tasks" style={{ fontSize: 12, color: 'var(--silver2)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>}
              />
              {recentTasks.length === 0 ? (
                <Empty icon="📋" title="No Tasks Yet" sub="Create tasks in the Tasks section."
                  action={<Link to="/admin/tasks"><button style={addBtnStyle}>+ Create First Task</button></Link>}
                />
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                        {['Task', 'Editor', 'Client Amount', 'Editor Pay', 'Profit', 'Status', 'Date'].map(h => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((task, i) => {
                        const editor = editors.find(e => e.id === task.editorId)
                        const profit = (Number(task.clientAmount) || 0) - (Number(task.editorAmount) || 0)
                        const date   = task.assignedDate?.toDate?.()
                        return (
                          <tr key={task.id} style={{ borderBottom: '1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600, color: 'var(--t1)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.title}
                              </div>
                              {task.description && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{task.description.slice(0, 40)}</div>}
                            </td>
                            <td style={tdStyle}>
                              {editor ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <Avatar name={editor.name} size={24} />
                                  <span style={{ color: 'var(--t2)' }}>{editor.name}</span>
                                </div>
                              ) : <span style={{ color: 'var(--t3)' }}>—</span>}
                            </td>
                            <td style={tdStyle}><span style={{ color: 'var(--t1)', fontWeight: 600 }}>₹{(Number(task.clientAmount) || 0).toLocaleString('en-IN')}</span></td>
                            <td style={tdStyle}><span style={{ color: 'var(--t2)' }}>₹{(Number(task.editorAmount) || 0).toLocaleString('en-IN')}</span></td>
                            <td style={tdStyle}><span style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>₹{profit.toLocaleString('en-IN')}</span></td>
                            <td style={tdStyle}><StatusBadge status={task.status} /></td>
                            <td style={tdStyle}><span style={{ color: 'var(--t3)', fontSize: 11 }}>{date ? format(date, 'd MMM') : '—'}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function QuickCard({ title, value, icon, sub, link }) {
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.15s', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.background = 'var(--surface)' }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'var(--surface3)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>{value}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{sub}</div>
        </div>
      </div>
    </Link>
  )
}

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle', transition: 'background 0.1s' }
const addBtnStyle = {
  padding: '10px 20px', borderRadius: 9, border: '1px solid var(--border2)',
  background: 'var(--surface2)', color: 'var(--t1)', fontFamily: 'DM Sans, sans-serif',
  fontWeight: 600, fontSize: 13, cursor: 'pointer',
}
