import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '../../store'
import {
  onEditorTasks, updateTaskStatus, calcEditorStats, signOut,
  createEditorTask, onAdminClients, evalMath, isMathExpr
} from '../../services'
import {
  Topbar, LogoMark, Avatar, StatCard, StatusBadge,
  Empty, Spinner, showToast, Tag, ProgressBar
} from '../../components/shared/UI'
import { ChartCard, EarningsBarChart } from '../../components/shared/Charts'

const F = { fontFamily: 'Inter, sans-serif' }

export default function EditorDashboard() {
  const user      = useAuthStore(s => s.user)
  const clearUser = useAuthStore(s => s.clearUser)
  const navigate  = useNavigate()
  const [tasks,      setTasks]      = useState([])
  const [clients,    setClients]    = useState([])
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('pending')
  const [inlineRow,  setInlineRow]  = useState(false)

  useEffect(() => {
    if (!user) return
    const u1 = onEditorTasks(user.id, data => {
      setTasks(data)
      setStats(calcEditorStats(data))
      setLoading(false)
    })
    // Load clients from admin
    const u2 = user.adminId ? onAdminClients(user.adminId, setClients) : () => {}
    return () => { u1(); u2() }
  }, [user?.id, user?.adminId])

  async function handleLogout() {
    await signOut()
    clearUser()
    navigate('/login', { replace: true })
  }

  async function cycleStatus(task) {
    const map = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' }
    await updateTaskStatus(task.id, map[task.status] || 'pending')
    showToast('Status updated')
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
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t1)', ...F }}>
                {greeting()}, {user?.name?.split(' ')[0]}
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', ...F }}>{format(new Date(), 'EEEE, d MMMM')}</div>
            </div>
          </>
        }
        right={
          <>
            <Tag children="EDITOR" />
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

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 48px' }}>

        {/* Editor ID card */}
        {user?.editorCode && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border2)',
            borderRadius: 14, padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }} className="anim-up">
            <div>
              <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 4, ...F }}>
                Your Editor Code
              </div>
              <code style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)', letterSpacing: 3, fontFamily: 'monospace' }}>
                {user.editorCode}
              </code>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, ...F }}>Share with your admin to connect</div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(user.editorCode); showToast('Code copied!') }}
              style={{
                background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
                borderRadius: 9, padding: '8px 14px', color: 'var(--blue)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', ...F,
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--blue-bg)'}
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
                <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, flexShrink: 0, ...F }}>Task Completion</div>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={completed.length} max={tasks.length} color="var(--green)" />
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)', flexShrink: 0, ...F }}>
                  {completed.length}/{tasks.length}
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
              {/* Header row with tab switcher + add button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    ['pending',   `Active (${inProgress.length + pending.length})`],
                    ['completed', `Completed (${completed.length})`],
                    ['all',       `All (${tasks.length})`],
                  ].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                      background: tab === key ? 'var(--blue-bg)' : 'none',
                      color: tab === key ? 'var(--blue)' : 'var(--t3)',
                      borderColor: tab === key ? 'var(--blue-border)' : 'var(--border)',
                      ...F, fontWeight: 600, fontSize: 12,
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}>{label}</button>
                  ))}
                </div>
                {user?.adminId && (
                  <button onClick={() => setInlineRow(true)} style={{
                    padding: '7px 16px', borderRadius: 8,
                    background: 'var(--blue)', color: '#fff',
                    border: 'none', cursor: 'pointer', ...F,
                    fontSize: 13, fontWeight: 700, transition: 'opacity 0.12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    + New Task
                  </button>
                )}
              </div>

              {/* Inline new task row */}
              {inlineRow && (
                <EditorInlineNewTask
                  editorId={user.id}
                  adminId={user.adminId}
                  clients={clients}
                  onSave={() => setInlineRow(false)}
                  onCancel={() => setInlineRow(false)}
                />
              )}

              {displayed.length === 0 && !inlineRow ? (
                <Empty icon="📭" title="No Tasks"
                  sub={tab === 'pending' ? 'No active tasks. Click "+ New Task" to add one.' : 'Nothing here yet.'} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {displayed.map((task, i) => (
                    <TaskRow key={task.id} task={task} index={i} clients={clients} onCycle={() => cycleStatus(task)} />
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

// ── Editor Inline New Task ────────────────────────────────────────────────────
function EditorInlineNewTask({ editorId, adminId, clients, onSave, onCancel }) {
  const [title,     setTitle]    = useState('')
  const [clientId,  setClientId] = useState('')
  const [editorAmt, setEditorAmt] = useState('')
  const [deadline,  setDeadline]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  async function handleSave() {
    if (!title.trim()) { titleRef.current?.focus(); return }
    setSaving(true)
    try {
      const eAmt = isMathExpr(editorAmt) ? (evalMath(editorAmt) ?? 0) : Number(editorAmt) || 0
      await createEditorTask(editorId, adminId, {
        clientId, title, editorAmount: eAmt, deadline: deadline || null,
      })
      showToast(`✓ "${title}" added`)
      onSave()
    } catch { showToast('Failed to create task', 'err') }
    setSaving(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="anim-in" style={{
      background: 'rgba(96,165,250,0.04)', border: '1px solid var(--blue-border)',
      borderRadius: 12, padding: '14px 18px', marginBottom: 8,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <input
        ref={titleRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title…"
        style={{
          background: 'none', border: 'none', outline: 'none',
          fontSize: 15, fontWeight: 700, color: 'var(--t1)', ...F,
          width: '100%',
        }}
      />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 7, padding: '6px 10px', color: 'var(--t1)',
            fontSize: 12, cursor: 'pointer', ...F, outline: 'none',
          }}
        >
          <option value="">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          value={editorAmt}
          onChange={e => setEditorAmt(e.target.value)}
          placeholder="My earnings ₹"
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 7, padding: '6px 10px', color: 'var(--t1)',
            fontSize: 12, ...F, outline: 'none', width: 140,
          }}
        />
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 7, padding: '6px 10px', color: 'var(--t2)',
            fontSize: 12, ...F, outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '6px 16px', borderRadius: 8,
          background: 'var(--blue)', color: '#fff',
          border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 700, ...F, opacity: saving ? 0.7 : 1,
        }}>
          {saving ? '…' : '↵ Add Task'}
        </button>
        <button onClick={onCancel} style={{
          padding: '6px 12px', borderRadius: 8,
          background: 'none', border: '1px solid var(--border2)',
          color: 'var(--t3)', cursor: 'pointer', fontSize: 13, ...F,
        }}>Cancel</button>
        <div style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', ...F }}>
          ⌘+Enter to save · Esc to cancel
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task, index, clients, onCycle }) {
  const [hov, setHov] = useState(false)
  const assigned  = task.assignedDate?.toDate?.()
  const deadline  = task.deadline
  const completedDate = task.completedDate?.toDate?.()
  const client    = clients.find(c => c.id === task.clientId)

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
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...F,
        }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...F }}>
            {task.description}
          </div>
        )}
        <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
          {assigned && <TaskMeta icon="📅" label={`Assigned ${format(assigned, 'd MMM')}`} />}
          {deadline  && <TaskMeta icon="⏰" label={`Due ${deadline}`} color="var(--amber)" />}
          {completedDate && <TaskMeta icon="✅" label={`Done ${format(completedDate, 'd MMM')}`} color="var(--green)" />}
          {client && <TaskMeta icon="👤" label={client.name} color="var(--blue)" />}
        </div>
      </div>

      {Number(task.editorAmount) > 0 && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', ...F }}>
            ₹{Number(task.editorAmount).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.4, ...F }}>Earnings</div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0, ...F }}>
        click badge
      </div>
    </div>
  )
}

function TaskMeta({ icon, label, color = 'var(--t3)' }) {
  return (
    <span style={{ fontSize: 11, color, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif' }}>
      <span>{icon}</span>{label}
    </span>
  )
}
