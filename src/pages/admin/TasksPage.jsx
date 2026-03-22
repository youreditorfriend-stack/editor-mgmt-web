import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../store'
import {
  onMyTasks, onMyEditors, onMyClients,
  createTask, updateTask, deleteTask, updateTaskStatus, markTaskPaid,
  calcAdminStats, evalMath, isMathExpr
} from '../../services'
import {
  Btn, Select, Avatar, StatCard,
  StatusBadge, Empty, SectionHeader, Spinner, showToast
} from '../../components/shared/UI'
import { ChartCard, EarningsBarChart } from '../../components/shared/Charts'
import AdminLayout from './AdminLayout'
import { format } from 'date-fns'

const F = { fontFamily: 'Inter, sans-serif' }

export default function TasksPage() {
  const user = useAuthStore(s => s.user)
  const [tasks,    setTasks]    = useState([])
  const [editors,  setEditors]  = useState([])
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [delConf,  setDelConf]  = useState(null)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [stats,    setStats]    = useState(null)
  const [inlineRow, setInlineRow] = useState(false)   // show new inline row
  const [paidPanel, setPaidPanel] = useState(null)    // { task } shown in side panel
  const [reportMenu, setReportMenu] = useState(false)

  useEffect(() => {
    if (!user) return
    const u1 = onMyTasks(user.id, data => { setTasks(data); setLoading(false) })
    const u2 = onMyEditors(user.id, setEditors)
    const u3 = onMyClients(user.id, setClients)
    return () => { u1(); u2(); u3() }
  }, [user?.id])

  useEffect(() => { setStats(calcAdminStats(tasks)) }, [tasks])

  // Close paid panel when clicking outside
  useEffect(() => {
    if (!paidPanel) return
    const close = e => {
      if (!e.target.closest('.paid-panel') && !e.target.closest('[data-paid-btn]')) {
        setPaidPanel(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [paidPanel])

  const filtered = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))

  const totalRevenue = tasks.filter(t => t.status === 'completed').reduce((s, t) => s + (Number(t.clientAmount) || 0), 0)
  const totalPaid    = tasks.filter(t => t.status === 'completed').reduce((s, t) => s + (Number(t.editorAmount) || 0), 0)
  const totalProfit  = totalRevenue - totalPaid

  async function handleDelete(task) {
    try {
      await deleteTask(task.id)
      showToast('Task deleted')
      if (paidPanel?.id === task.id) setPaidPanel(null)
    } catch { showToast('Failed to delete', 'err') }
    setDelConf(null)
  }

  async function cycleStatus(task) {
    const next = task.status === 'pending' ? 'in_progress'
      : task.status === 'in_progress' ? 'completed' : 'pending'
    await updateTaskStatus(task.id, next)
  }

  async function handleMarkPaid(task) {
    const today = new Date().toISOString().split('T')[0]
    await markTaskPaid(task.id, today)
    showToast('Payment recorded')
    // Update panel view with new paid date
    setPaidPanel({ ...task, paidAt: today })
  }

  // ─── Report Downloads ────────────────────────────────────────────────────
  function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function downloadClientReport(clientId) {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    const clientTasks = tasks.filter(t => t.clientId === clientId)
    const header = ['Task', 'Status', 'Editor Pay', 'Client Charge', 'Profit', 'Assigned Date', 'Completed Date']
    const rows = clientTasks.map(t => {
      const profit = (Number(t.clientAmount) || 0) - (Number(t.editorAmount) || 0)
      return [
        t.title,
        t.status,
        t.editorAmount ?? 0,
        t.clientAmount ?? 0,
        profit,
        t.assignedDate?.toDate ? format(t.assignedDate.toDate(), 'd MMM yyyy') : '',
        t.completedDate?.toDate ? format(t.completedDate.toDate(), 'd MMM yyyy') : '',
      ]
    })
    downloadCSV([header, ...rows], `report_${client.name.replace(/\s+/g,'_')}_${format(new Date(),'yyyyMMdd')}.csv`)
    setReportMenu(false)
  }

  function downloadMonthlyReport() {
    const now = new Date()
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return { label: format(d, 'MMM yyyy'), start: d, end: new Date(now.getFullYear(), now.getMonth() - i + 1, 1) }
    }).reverse()
    const header = ['Month', 'Revenue', 'Editor Payouts', 'Profit', 'Tasks Completed']
    const rows = months.map(({ label, start, end }) => {
      const monthTasks = tasks.filter(t => {
        if (t.status !== 'completed') return false
        const d = t.completedDate?.toDate?.()
        return d && d >= start && d < end
      })
      const rev    = monthTasks.reduce((s, t) => s + (Number(t.clientAmount) || 0), 0)
      const paid   = monthTasks.reduce((s, t) => s + (Number(t.editorAmount) || 0), 0)
      return [label, rev, paid, rev - paid, monthTasks.length]
    })
    downloadCSV([header, ...rows], `monthly_report_${format(new Date(),'yyyyMMdd')}.csv`)
    setReportMenu(false)
  }

  function downloadYearlyReport() {
    const years = [...new Set(tasks.filter(t => t.status === 'completed').map(t => {
      const d = t.completedDate?.toDate?.()
      return d ? d.getFullYear() : null
    }).filter(Boolean))].sort()
    const header = ['Year', 'Revenue', 'Editor Payouts', 'Profit', 'Tasks Completed']
    const rows = years.map(year => {
      const yearTasks = tasks.filter(t => {
        if (t.status !== 'completed') return false
        const d = t.completedDate?.toDate?.()
        return d && d.getFullYear() === year
      })
      const rev  = yearTasks.reduce((s, t) => s + (Number(t.clientAmount) || 0), 0)
      const paid = yearTasks.reduce((s, t) => s + (Number(t.editorAmount) || 0), 0)
      return [year, rev, paid, rev - paid, yearTasks.length]
    })
    downloadCSV([header, ...rows], `yearly_report_${format(new Date(),'yyyyMMdd')}.csv`)
    setReportMenu(false)
  }

  return (
    <AdminLayout>
      <div style={{ padding: '28px 28px 40px', maxWidth: 1300 }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', ...F, marginBottom: 5 }}>Tasks</h1>
            <p style={{ fontSize: 13, color: 'var(--t3)', ...F }}>Assign and track work across your editing team.</p>
          </div>
          {/* Report download */}
          <div style={{ position: 'relative' }}>
            <Btn variant="ghost" size="sm" onClick={() => setReportMenu(!reportMenu)}>
              ↓ Download Report
            </Btn>
            {reportMenu && (
              <div className="anim-scale" style={{
                position: 'absolute', right: 0, top: '110%', zIndex: 100,
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: 10, padding: '6px', minWidth: 220,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, ...F }}>Reports</div>
                <ReportMenuItem label="Monthly Income Report" onClick={downloadMonthlyReport} />
                <ReportMenuItem label="Yearly Income Report" onClick={downloadYearlyReport} />
                {clients.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <div style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, ...F }}>Per Client</div>
                    {clients.map(c => (
                      <ReportMenuItem key={c.id} label={c.name} onClick={() => downloadClientReport(c.id)} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }} className="anim-up">
          <StatCard icon="📋" label="Total Tasks"     value={tasks.length}                                             color="var(--silver)" />
          <StatCard icon="💰" label="Total Revenue"   value={`₹${totalRevenue.toLocaleString('en-IN')}`}              color="var(--blue)" />
          <StatCard icon="💸" label="Editor Payouts"  value={`₹${totalPaid.toLocaleString('en-IN')}`}                 color="var(--amber)" />
          <StatCard icon="📈" label="Net Profit"      value={`₹${totalProfit.toLocaleString('en-IN')}`}               color="var(--green)" />
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
              <div style={{ display: 'flex', gap: 4 }}>
                {[['all','All'], ['pending','Pending'], ['in_progress','In Progress'], ['completed','Done']].map(([key, label]) => (
                  <button key={key} onClick={() => setFilter(key)} style={{
                    padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
                    background: filter === key ? 'var(--blue-bg)' : 'none',
                    color: filter === key ? 'var(--blue)' : 'var(--t3)',
                    borderColor: filter === key ? 'var(--blue-border)' : 'var(--border)',
                    ...F, fontWeight: 600, fontSize: 11,
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
                  color: 'var(--t1)', ...F, fontSize: 12, outline: 'none',
                }}
              />
              <Btn variant="primary" size="sm" onClick={() => { setInlineRow(true) }}>+ New Task</Btn>
            </div>
          }
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={28} /></div>
        ) : (
          <>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    {['Task', 'Editor', 'Client', 'Client Pay', 'Editor Pay', 'Profit', 'Status', 'Paid', 'Date', ''].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Inline new row */}
                  {inlineRow && (
                    <InlineNewRow
                      adminId={user.id}
                      editors={editors}
                      clients={clients}
                      onSave={() => setInlineRow(false)}
                      onCancel={() => setInlineRow(false)}
                    />
                  )}

                  {filtered.length === 0 && !inlineRow ? (
                    <tr>
                      <td colSpan={10}>
                        <Empty icon="📋" title="No Tasks"
                          sub={filter !== 'all' ? `No ${filter.replace('_',' ')} tasks found.` : 'Click "+ New Task" to add your first task inline.'}
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((task, i) => {
                      const editor = editors.find(e => e.id === task.editorId)
                      const client = clients.find(c => c.id === task.clientId)
                      const profit = (Number(task.clientAmount) || 0) - (Number(task.editorAmount) || 0)
                      const date   = task.assignedDate?.toDate?.()
                      const isPaid = !!task.paidAt

                      return (
                        <tr key={task.id} className="anim-up"
                          style={{ animationDelay: `${i * 20}ms`, borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 600, color: 'var(--t1)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...F }}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180, ...F }}>
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td style={tdStyle}>
                            {editor ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <Avatar name={editor.name} size={24} />
                                <span style={{ color: 'var(--t2)', ...F }}>{editor.name}</span>
                              </div>
                            ) : <span style={{ color: 'var(--t3)', fontSize: 11 }}>—</span>}
                          </td>
                          <td style={tdStyle}>
                            {client
                              ? <span style={{ color: 'var(--t2)', ...F }}>{client.name}</span>
                              : <span style={{ color: 'var(--t3)', fontSize: 11 }}>—</span>}
                          </td>
                          <td style={tdStyle}><span style={{ fontWeight: 600, color: 'var(--t1)', ...F }}>₹{(Number(task.clientAmount) || 0).toLocaleString('en-IN')}</span></td>
                          <td style={tdStyle}><span style={{ color: 'var(--t2)', ...F }}>₹{(Number(task.editorAmount) || 0).toLocaleString('en-IN')}</span></td>
                          <td style={tdStyle}>
                            <span style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, ...F }}>
                              ₹{profit.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td style={tdStyle}><StatusBadge status={task.status} onClick={() => cycleStatus(task)} /></td>

                          {/* Paid column */}
                          <td style={tdStyle}>
                            {isPaid ? (
                              <button data-paid-btn="1" onClick={() => setPaidPanel(task)} style={{
                                background: 'var(--green-bg)', border: '1px solid var(--green-border)',
                                borderRadius: 7, padding: '4px 10px', color: 'var(--green)',
                                fontSize: 11, fontWeight: 700, cursor: 'pointer', ...F,
                                transition: 'all 0.12s',
                              }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--green-bg)'}
                              >
                                ✓ Paid
                              </button>
                            ) : task.status === 'completed' ? (
                              <button data-paid-btn="1" onClick={() => handleMarkPaid(task)} style={{
                                background: 'none', border: '1px dashed var(--border2)',
                                borderRadius: 7, padding: '4px 10px', color: 'var(--t3)',
                                fontSize: 11, fontWeight: 600, cursor: 'pointer', ...F,
                                transition: 'all 0.12s',
                              }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-border)'; e.currentTarget.style.color = 'var(--green)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--t3)' }}
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <span style={{ color: 'var(--t3)', fontSize: 11 }}>—</span>
                            )}
                          </td>

                          <td style={tdStyle}><span style={{ color: 'var(--t3)', fontSize: 11, ...F }}>{date ? format(date, 'd MMM') : '—'}</span></td>
                          <td style={tdStyle}>
                            <Btn variant="danger" size="sm" onClick={() => setDelConf(task)}>✕</Btn>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              {/* Totals footer */}
              {filtered.length > 0 && (
                <div style={{
                  borderTop: '1px solid var(--border)', padding: '12px 14px',
                  background: 'var(--surface2)',
                  display: 'flex', gap: 32, justifyContent: 'flex-end',
                }}>
                  <TotalItem label="Revenue"  value={`₹${filtered.filter(t=>t.status==='completed').reduce((s,t)=>s+(Number(t.clientAmount)||0),0).toLocaleString('en-IN')}`} />
                  <TotalItem label="Paid Out" value={`₹${filtered.filter(t=>t.status==='completed').reduce((s,t)=>s+(Number(t.editorAmount)||0),0).toLocaleString('en-IN')}`} color="var(--amber)" />
                  <TotalItem label="Profit"   value={`₹${filtered.filter(t=>t.status==='completed').reduce((s,t)=>s+(Number(t.clientAmount)||0)-(Number(t.editorAmount)||0),0).toLocaleString('en-IN')}`} color="var(--green)" />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Paid Side Panel ── */}
      {paidPanel && (
        <PaidSidePanel
          task={paidPanel}
          onClose={() => setPaidPanel(null)}
          onUpdate={updated => setPaidPanel(updated)}
        />
      )}

      {/* ── Delete Confirm ── */}
      {delConf && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setDelConf(null)}>
          <div className="anim-scale" onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', border: '1px solid var(--border2)',
            borderRadius: 16, padding: 24, maxWidth: 380, width: '90%',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 8, ...F }}>Delete Task</div>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20, ...F }}>Delete "{delConf.title}"? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setDelConf(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={() => handleDelete(delConf)}>Delete</Btn>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

// ── Inline New Row (Notion-style) ────────────────────────────────────────────
function InlineNewRow({ adminId, editors, clients, onSave, onCancel }) {
  const [title,     setTitle]     = useState('')
  const [editorId,  setEditorId]  = useState('')
  const [clientId,  setClientId]  = useState('')
  const [clientAmt, setClientAmt] = useState('')
  const [editorAmt, setEditorAmt] = useState('')
  const [deadline,  setDeadline]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  async function handleSave() {
    if (!title.trim()) { titleRef.current?.focus(); return }
    if (!editorId) { showToast('Please select an editor', 'err'); return }
    setSaving(true)
    try {
      const eAmt = isMathExpr(editorAmt) ? (evalMath(editorAmt) ?? 0) : Number(editorAmt) || 0
      const cAmt = isMathExpr(clientAmt) ? (evalMath(clientAmt) ?? 0) : Number(clientAmt) || 0
      await createTask(adminId, { editorId, clientId, title, description: '', editorAmount: eAmt, clientAmount: cAmt, deadline: deadline || null })
      showToast(`✓ "${title}" created`)
      onSave()
    } catch { showToast('Failed to create task', 'err') }
    setSaving(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    if (e.key === 'Escape') onCancel()
  }

  const inputStyle = {
    width: '100%', border: 'none', background: 'transparent',
    color: 'var(--t1)', outline: 'none', padding: '6px 0',
    fontSize: 13, ...F,
  }

  const cellStyle = {
    padding: '10px 14px', verticalAlign: 'middle',
    background: 'rgba(96,165,250,0.04)',
    borderBottom: '1px solid var(--blue-border)',
  }

  return (
    <tr style={{ borderBottom: '2px solid var(--blue-border)', background: 'rgba(96,165,250,0.03)' }}>
      {/* Title */}
      <td style={cellStyle}>
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Task title…"
          style={{ ...inputStyle, fontWeight: 600 }}
        />
      </td>

      {/* Editor select */}
      <td style={cellStyle}>
        <select
          value={editorId}
          onChange={e => setEditorId(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">Select editor…</option>
          {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
        </select>
      </td>

      {/* Client select */}
      <td style={cellStyle}>
        <select
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">No client</option>
          {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
        </select>
      </td>

      {/* Client pay */}
      <td style={cellStyle}>
        <input
          value={clientAmt}
          onChange={e => setClientAmt(e.target.value)}
          placeholder="₹0"
          style={inputStyle}
        />
      </td>

      {/* Editor pay */}
      <td style={cellStyle}>
        <input
          value={editorAmt}
          onChange={e => setEditorAmt(e.target.value)}
          placeholder="₹0"
          style={inputStyle}
        />
      </td>

      {/* Profit preview */}
      <td style={cellStyle}>
        <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, ...F }}>
          {clientAmt || editorAmt ? `₹${(((isMathExpr(clientAmt) ? evalMath(clientAmt) : Number(clientAmt)) || 0) - ((isMathExpr(editorAmt) ? evalMath(editorAmt) : Number(editorAmt)) || 0)).toLocaleString('en-IN')}` : '—'}
        </span>
      </td>

      {/* Status: always pending */}
      <td style={cellStyle}>
        <span style={{ fontSize: 11, color: 'var(--t3)', ...F }}>pending</span>
      </td>

      {/* Paid: N/A for new */}
      <td style={cellStyle}><span style={{ color: 'var(--t3)', fontSize: 11 }}>—</span></td>

      {/* Deadline */}
      <td style={cellStyle}>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          style={{ ...inputStyle, fontSize: 11, color: 'var(--t3)' }}
        />
      </td>

      {/* Actions */}
      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '5px 12px', borderRadius: 7,
            background: 'var(--blue)', color: '#fff',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 700, ...F, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? '…' : '↵ Save'}
          </button>
          <button onClick={onCancel} style={{
            padding: '5px 8px', borderRadius: 7,
            background: 'none', border: '1px solid var(--border2)',
            color: 'var(--t3)', cursor: 'pointer', fontSize: 12, ...F,
          }}>✕</button>
        </div>
      </td>
    </tr>
  )
}

// ── Paid Side Panel ──────────────────────────────────────────────────────────
function PaidSidePanel({ task, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [dateVal, setDateVal] = useState(task.paidAt || new Date().toISOString().split('T')[0])
  const [saving,  setSaving]  = useState(false)

  async function handleSaveDate() {
    setSaving(true)
    await markTaskPaid(task.id, dateVal)
    onUpdate({ ...task, paidAt: dateVal })
    setEditing(false)
    setSaving(false)
    showToast('Payment date updated')
  }

  return (
    <div className="paid-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', ...F }}>Payment Details</div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--t3)', fontSize: 18, lineHeight: 1, padding: '4px 8px',
        }}>×</button>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 4, ...F }}>{task.title}</div>
        {task.description && <div style={{ fontSize: 12, color: 'var(--t3)', ...F }}>{task.description}</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PanelRow label="Client Charge" value={`₹${(Number(task.clientAmount) || 0).toLocaleString('en-IN')}`} color="var(--t1)" />
        <PanelRow label="Editor Pay" value={`₹${(Number(task.editorAmount) || 0).toLocaleString('en-IN')}`} color="var(--amber)" />
        <PanelRow label="Profit" value={`₹${((Number(task.clientAmount) || 0) - (Number(task.editorAmount) || 0)).toLocaleString('en-IN')}`} color="var(--green)" />

        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* Paid date */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, ...F }}>
            Payment Date
          </div>
          {editing ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="date"
                value={dateVal}
                onChange={e => setDateVal(e.target.value)}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--blue-border)', background: 'var(--surface2)',
                  color: 'var(--t1)', fontSize: 13, ...F, outline: 'none',
                }}
              />
              <Btn variant="primary" size="sm" loading={saving} onClick={handleSaveDate}>Save</Btn>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 18 }}>×</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                fontSize: 18, fontWeight: 800, color: 'var(--green)',
                ...F, letterSpacing: -0.5,
              }}>
                {task.paidAt ? format(new Date(task.paidAt), 'd MMM yyyy') : '—'}
              </div>
              <button onClick={() => setEditing(true)} style={{
                background: 'none', border: '1px solid var(--border2)',
                borderRadius: 7, padding: '4px 10px', color: 'var(--t2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', ...F,
              }}>Edit</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 14px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 10, textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', ...F }}>✓ Payment Recorded</div>
        <div style={{ fontSize: 11, color: 'rgba(34,197,94,0.6)', marginTop: 2, ...F }}>Paid on {task.paidAt || 'today'}</div>
      </div>
    </div>
  )
}

function PanelRow({ label, value, color = 'var(--t1)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--t3)', ...F }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, ...F }}>{value}</span>
    </div>
  )
}

function TotalItem({ label, value, color = 'var(--t1)' }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, ...F }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color, ...F }}>{value}</div>
    </div>
  )
}

function ReportMenuItem({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '8px 12px',
      borderRadius: 7, border: 'none', background: 'none',
      color: 'var(--t1)', fontSize: 13, cursor: 'pointer', ...F,
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {label}
    </button>
  )
}

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }
const tdStyle = { padding: '11px 14px', verticalAlign: 'middle' }
