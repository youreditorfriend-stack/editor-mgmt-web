import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../store'
import {
  onMyTasks, onMyEditors, onMyClients,
  createTask, updateTask, deleteTask, updateTaskStatus,
  calcAdminStats, evalMath, isMathExpr
} from '../../services'
import {
  Btn, Input, Select, Modal, ConfirmModal, Avatar, StatCard,
  StatusBadge, Empty, SectionHeader, Spinner, showToast
} from '../../components/shared/UI'
import { ChartCard, EarningsBarChart } from '../../components/shared/Charts'
import AdminLayout from './AdminLayout'
import { format } from 'date-fns'

export default function TasksPage() {
  const user = useAuthStore(s => s.user)
  const [tasks,   setTasks]   = useState([])
  const [editors, setEditors] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [delConf, setDelConf] = useState(null)
  const [filter,  setFilter]  = useState('all')  // all | pending | in_progress | completed
  const [search,  setSearch]  = useState('')
  const [stats,   setStats]   = useState(null)

  useEffect(() => {
    if (!user) return
    const u1 = onMyTasks(user.id, data => { setTasks(data); setLoading(false) })
    const u2 = onMyEditors(user.id, setEditors)
    const u3 = onMyClients(user.id, setClients)
    return () => { u1(); u2(); u3() }
  }, [user?.id])

  useEffect(() => { setStats(calcAdminStats(tasks)) }, [tasks])

  const filtered = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))

  const totalRevenue = tasks.filter(t => t.status === 'completed').reduce((s, t) => s + (Number(t.clientAmount) || 0), 0)
  const totalPaid    = tasks.filter(t => t.status === 'completed').reduce((s, t) => s + (Number(t.editorAmount) || 0), 0)
  const totalProfit  = totalRevenue - totalPaid

  async function handleDelete() {
    try {
      await deleteTask(delConf.id)
      showToast('Task deleted')
    } catch { showToast('Failed to delete', 'err') }
    setDelConf(null)
  }

  async function cycleStatus(task) {
    const next = task.status === 'pending' ? 'in_progress'
      : task.status === 'in_progress' ? 'completed' : 'pending'
    await updateTaskStatus(task.id, next)
  }

  return (
    <AdminLayout>
      <div style={{ padding: '28px 28px 40px', maxWidth: 1200 }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Syne, sans-serif', marginBottom: 5 }}>
            Tasks
          </h1>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>Assign and track work across your editing team.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }} className="anim-up">
          <StatCard icon="📋" label="Total Tasks" value={tasks.length} color="var(--silver)" />
          <StatCard icon="💰" label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} color="var(--t1)" />
          <StatCard icon="💸" label="Editor Payouts" value={`₹${totalPaid.toLocaleString('en-IN')}`} color="var(--amber)" />
          <StatCard icon="📈" label="Net Profit" value={`₹${totalProfit.toLocaleString('en-IN')}`} color="var(--green)" />
        </div>

        {/* Chart */}
        {stats?.monthly?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <ChartCard title="Monthly Revenue Trend" sub="Last 6 months" height={200}>
              <EarningsBarChart data={stats.monthly} dataKey="amount" />
            </ChartCard>
          </div>
        )}

        {/* Filters + Search + Add */}
        <SectionHeader
          title="All Tasks"
          count={filtered.length}
          action={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 4 }}>
                {[['all','All'], ['pending','Pending'], ['in_progress','In Progress'], ['completed','Done']].map(([key, label]) => (
                  <button key={key} onClick={() => setFilter(key)} style={{
                    padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
                    background: filter === key ? 'var(--surface2)' : 'none',
                    color: filter === key ? 'var(--t1)' : 'var(--t3)',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 11,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>{label}</button>
                ))}
              </div>
              <input
                placeholder="Search tasks…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  height: 34, padding: '0 12px', borderRadius: 8,
                  border: '1px solid var(--border2)', background: 'rgba(255,255,255,0.04)',
                  color: 'var(--t1)', fontFamily: 'DM Sans, sans-serif', fontSize: 12, outline: 'none',
                }}
              />
              <Btn variant="primary" size="sm" onClick={() => setModal(true)}>+ New Task</Btn>
            </div>
          }
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <Empty icon="📋" title="No Tasks"
            sub={filter !== 'all' ? `No ${filter.replace('_',' ')} tasks found.` : 'Create your first task to get started.'}
            action={filter === 'all' ? <Btn variant="primary" onClick={() => setModal(true)}>+ Create Task</Btn> : null}
          />
        ) : (
          <>
            {/* Task table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    {['Task', 'Editor', 'Client', 'Client Pay', 'Editor Pay', 'Profit', 'Status', 'Date', ''].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task, i) => {
                    const editor  = editors.find(e => e.id === task.editorId)
                    const client  = clients.find(c => c.id === task.clientId)
                    const profit  = (Number(task.clientAmount) || 0) - (Number(task.editorAmount) || 0)
                    const date    = task.assignedDate?.toDate?.()
                    return (
                      <tr key={task.id}
                        className="anim-up"
                        style={{ animationDelay: `${i * 25}ms`, borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: 'var(--t1)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {editor ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <Avatar name={editor.name} size={24} />
                              <span style={{ color: 'var(--t2)' }}>{editor.name}</span>
                            </div>
                          ) : <span style={{ color: 'var(--t3)', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={tdStyle}>
                          {client
                            ? <span style={{ color: 'var(--t2)' }}>{client.name}</span>
                            : <span style={{ color: 'var(--t3)', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={tdStyle}><span style={{ fontWeight: 600, color: 'var(--t1)' }}>₹{(Number(task.clientAmount) || 0).toLocaleString('en-IN')}</span></td>
                        <td style={tdStyle}><span style={{ color: 'var(--t2)' }}>₹{(Number(task.editorAmount) || 0).toLocaleString('en-IN')}</span></td>
                        <td style={tdStyle}>
                          <span style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                            ₹{profit.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={tdStyle}><StatusBadge status={task.status} onClick={() => cycleStatus(task)} /></td>
                        <td style={tdStyle}><span style={{ color: 'var(--t3)', fontSize: 11 }}>{date ? format(date, 'd MMM') : '—'}</span></td>
                        <td style={tdStyle}>
                          <Btn variant="danger" size="sm" onClick={() => setDelConf(task)}>✕</Btn>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Totals footer */}
              <div style={{
                borderTop: '1px solid var(--border)', padding: '12px 14px',
                background: 'var(--surface2)',
                display: 'flex', gap: 32, justifyContent: 'flex-end',
              }}>
                <TotalItem label="Revenue" value={`₹${filtered.filter(t=>t.status==='completed').reduce((s,t) => s+(Number(t.clientAmount)||0),0).toLocaleString('en-IN')}`} />
                <TotalItem label="Paid Out" value={`₹${filtered.filter(t=>t.status==='completed').reduce((s,t) => s+(Number(t.editorAmount)||0),0).toLocaleString('en-IN')}`} color="var(--amber)" />
                <TotalItem label="Profit" value={`₹${filtered.filter(t=>t.status==='completed').reduce((s,t) => s+(Number(t.clientAmount)||0)-(Number(t.editorAmount)||0),0).toLocaleString('en-IN')}`} color="var(--green)" />
              </div>
            </div>
          </>
        )}
      </div>

      {modal && (
        <CreateTaskModal
          adminId={user.id}
          editors={editors}
          clients={clients}
          onClose={() => setModal(false)}
        />
      )}

      {delConf && (
        <ConfirmModal
          title="Delete Task"
          message={`Delete "${delConf.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDelConf(null)}
        />
      )}
    </AdminLayout>
  )
}

function TotalItem({ label, value, color = 'var(--t1)' }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
    </div>
  )
}

function CreateTaskModal({ adminId, editors, clients, onClose }) {
  const [title,  setTitle]  = useState('')
  const [desc,   setDesc]   = useState('')
  const [editorId, setEditorId] = useState('')
  const [clientId, setClientId] = useState('')
  const [editorAmt, setEditorAmt] = useState('')
  const [clientAmt, setClientAmt] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState('')

  // Math eval display
  const evalDisplay = (val) => {
    if (isMathExpr(String(val))) {
      const r = evalMath(String(val))
      return r !== null ? ` = ₹${r.toLocaleString('en-IN')}` : ' (invalid)'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !editorId) { setError('Task title and editor are required.'); return }
    setError(''); setLoading(true)

    // Evaluate math expressions
    const eAmt = isMathExpr(editorAmt) ? (evalMath(editorAmt) ?? 0) : Number(editorAmt) || 0
    const cAmt = isMathExpr(clientAmt) ? (evalMath(clientAmt) ?? 0) : Number(clientAmt) || 0

    try {
      await createTask(adminId, {
        editorId, clientId,
        title, description: desc,
        editorAmount: eAmt, clientAmount: cAmt,
        deadline: deadline || null,
      })
      showToast(`✓ Task "${title}" created`)
      onClose()
    } catch { setError('Failed to create task. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <Modal title="Create Task" onClose={onClose} width={520}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={loading} onClick={handleSubmit}>Create Task</Btn>
      </>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Task Title *" placeholder="e.g. YouTube video edit" value={title} onChange={e => setTitle(e.target.value)} required />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7 }}>Description</label>
          <textarea
            placeholder="Task details…"
            value={desc} onChange={e => setDesc(e.target.value)}
            rows={2}
            style={{
              width: '100%', fontFamily: 'DM Sans, sans-serif', fontSize: 13,
              padding: '10px 12px', border: '1px solid var(--border2)', borderRadius: 9,
              background: 'rgba(255,255,255,0.04)', color: 'var(--t1)', outline: 'none',
              resize: 'vertical', transition: 'border-color 0.15s',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Assign Editor *" value={editorId} onChange={e => setEditorId(e.target.value)} required>
            <option value="">Select editor…</option>
            {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
          </Select>
          <Select label="Assign Client" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">None</option>
            {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
          </Select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Input
              label={`Editor Pay (₹)${evalDisplay(editorAmt)}`}
              placeholder="e.g. 500 or 200+300"
              value={editorAmt} onChange={e => setEditorAmt(e.target.value)}
              hint="Supports math: 200+300, 50*4"
            />
          </div>
          <div>
            <Input
              label={`Client Charge (₹)${evalDisplay(clientAmt)}`}
              placeholder="e.g. 1000 or 500*2"
              value={clientAmt} onChange={e => setClientAmt(e.target.value)}
              hint="Amount billed to client"
            />
          </div>
        </div>

        <Input label="Deadline (optional)" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />

        {/* Profit preview */}
        {(editorAmt || clientAmt) && (
          <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 9, border: '1px solid var(--border)', display: 'flex', gap: 20 }}>
            <ProfitLine label="Client Pay" value={`₹${((isMathExpr(clientAmt) ? evalMath(clientAmt) : Number(clientAmt)) || 0).toLocaleString('en-IN')}`} />
            <ProfitLine label="Editor Pay" value={`₹${((isMathExpr(editorAmt) ? evalMath(editorAmt) : Number(editorAmt)) || 0).toLocaleString('en-IN')}`} color="var(--amber)" />
            <ProfitLine label="Profit"
              value={`₹${(((isMathExpr(clientAmt) ? evalMath(clientAmt) : Number(clientAmt)) || 0) - ((isMathExpr(editorAmt) ? evalMath(editorAmt) : Number(editorAmt)) || 0)).toLocaleString('en-IN')}`}
              color="var(--green)"
            />
          </div>
        )}

        {error && <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-bg)', borderRadius: 8, border: '1px solid var(--red-border)' }}>{error}</div>}
      </form>
    </Modal>
  )
}

function ProfitLine({ label, value, color = 'var(--t1)' }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'Syne, sans-serif', marginTop: 2 }}>{value}</div>
    </div>
  )
}

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }
