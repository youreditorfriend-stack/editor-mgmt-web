import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { onEditorTasks, onWorkspaceSettings, onEditors } from '../services'
import { StatusBadge, Spinner, Empty, CodeBadge } from '../components/shared/UI'

export default function AdminEditorView() {
  const { editorId } = useParams()
  const [editor, setEditor]   = useState(null)
  const [columns, setColumns] = useState([])
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u1 = onEditors(list => {
      const found = list.find(e => e.uid === editorId)
      if (found) setEditor(found)
    })
    const u2 = onWorkspaceSettings(setColumns)
    const u3 = onEditorTasks(editorId, data => { setTasks(data); setLoading(false) })
    return () => { u1(); u2(); u3() }
  }, [editorId])

  const completed = tasks.filter(t => t.status === 'completed')
  const pending   = tasks.filter(t => t.status !== 'completed')
  const earnings  = completed.reduce((sum, t) => {
    const amt = t.dynamicData?.col_amount
    return sum + (typeof amt === 'number' ? amt : 0)
  }, 0)

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
          <Link to="/admin/editors" style={{
            fontSize: 12, color: 'var(--t2)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.04)',
          }}>
            ← Editors
          </Link>
          <span style={{ color: 'var(--border2)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {editor && (
              <>
                <EditorAvatar name={editor.name} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif', lineHeight: 1.2 }}>
                    {editor.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t2)' }}>{editor.email}</div>
                </div>
                {editor.editorCode && <CodeBadge code={editor.editorCode} />}
              </>
            )}
          </div>
        </div>
        {editor && (
          <Link
            to={`/admin/assign/${editorId}`}
            style={{
              fontSize: 12, color: '#a89ff5', textDecoration: 'none',
              padding: '7px 14px', borderRadius: 8, fontWeight: 700,
              background: 'rgba(109,95,239,0.1)',
              border: '1px solid rgba(109,95,239,0.25)',
              transition: 'all 0.12s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,95,239,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(109,95,239,0.1)'}
          >
            + Assign Task
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
            <MiniStatCard label="Total Tasks" value={tasks.length} color="var(--t1)" accent="rgba(255,255,255,0.04)" />
            <MiniStatCard label="Completed" value={completed.length} color="#34d399" accent="rgba(16,185,129,0.1)" />
            <MiniStatCard label="Pending" value={pending.length} color="#fcd34d" accent="rgba(245,158,11,0.1)" />
            <MiniStatCard label="Earnings" value={`₹${earnings.toLocaleString('en-IN')}`} color="#a89ff5" accent="rgba(109,95,239,0.1)" />
          </div>

          {/* View mode notice */}
          <div style={{
            background: 'rgba(34,211,238,0.07)',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 10, padding: '8px 14px',
            marginBottom: 16, fontSize: 11, color: '#67e8f9',
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
          }}>
            <span>👁</span> View-only mode — this is a live real-time snapshot of the editor's workspace
          </div>

          {tasks.length === 0 ? (
            <Empty icon="📭" message="No tasks yet" sub="Assign tasks to this editor to get started" />
          ) : columns.length === 0 ? (
            /* Simple task list if no workspace columns configured */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {tasks.map((task, i) => (
                <SimpleTaskRow key={task.id} task={task} index={i} />
              ))}
            </div>
          ) : (
            /* Full table view */
            <div style={{
              background: 'rgba(17,17,32,0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                  <thead>
                    <tr style={{ background: 'rgba(12,12,20,0.6)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Title</th>
                      {columns.map(col => (
                        <th key={col.id} style={thStyle}>{col.name.toUpperCase()}</th>
                      ))}
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, i) => (
                      <tr key={task.id}
                        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,95,239,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={tdStyle}>{i + 1}</td>
                        <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t1)' }}>
                          {task.title}
                        </td>
                        {columns.map(col => (
                          <td key={col.id} style={tdStyle}>
                            {renderCellValue(task.dynamicData?.[col.id], col)}
                          </td>
                        ))}
                        <td style={tdStyle}>
                          <StatusBadge status={task.status} />
                        </td>
                        <td style={tdStyle}>
                          {task.assignedDate?.toDate
                            ? format(task.assignedDate.toDate(), 'd MMM yy')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function renderCellValue(value, col) {
  if (value === undefined || value === null || value === '') return <span style={{ color: 'var(--t3)' }}>—</span>
  if (col.type === 'math' || col.type === 'number') return <span style={{ color: '#a89ff5', fontWeight: 600 }}>{value}</span>
  if (col.type === 'date') return <span style={{ color: 'var(--t2)' }}>{value}</span>
  return <span style={{ color: 'var(--t1)' }}>{String(value)}</span>
}

function SimpleTaskRow({ task, index }) {
  const date = task.assignedDate?.toDate?.()
  return (
    <div style={{
      background: 'rgba(17,17,32,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 11, padding: '11px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'all 0.12s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(22,22,40,0.7)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(17,17,32,0.6)' }}
    >
      <span style={{ fontSize: 10, color: 'var(--t3)', minWidth: 20, textAlign: 'right' }}>{index + 1}</span>
      <StatusBadge status={task.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

function MiniStatCard({ label, value, color, accent }) {
  return (
    <div style={{
      background: 'rgba(17,17,32,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  )
}

function EditorAvatar({ name }) {
  const initials = name?.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase() || '?'
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(109,95,239,0.2)', border: '2px solid rgba(109,95,239,0.3)',
      color: '#a89ff5', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700,
    }}>
      {initials}
    </div>
  )
}

const thStyle = {
  padding: '9px 12px',
  textAlign: 'left',
  fontSize: 9, fontWeight: 700,
  color: 'var(--t3)', letterSpacing: 0.7,
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '10px 12px',
  color: 'var(--t2)',
  fontSize: 12,
  verticalAlign: 'middle',
  borderRight: '0.5px solid rgba(255,255,255,0.04)',
}
