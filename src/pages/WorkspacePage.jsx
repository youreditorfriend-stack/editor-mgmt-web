import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '../store'
import {
  onEditorTasks, onWorkspaceSettings,
  createTask, updateTaskDynamicData, updateTaskStatus
} from '../services'
import { evalMath, isMathExpr } from '../utils/math'
import { StatusBadge, Spinner, Empty } from '../components/shared/UI'

export default function WorkspacePage() {
  const user = useAuthStore(s => s.user)
  const [columns, setColumns] = useState([])
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const u1 = onWorkspaceSettings(setColumns)
    const u2 = onEditorTasks(user.uid, (data) => { setTasks(data); setLoading(false) })
    return () => { u1(); u2() }
  }, [user?.uid])

  async function addRow() {
    await createTask({
      editorId: user.uid,
      title: `Task ${format(new Date(), 'd MMM')}`,
    })
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner size={28} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{
        background: 'rgba(12,12,20,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/dashboard" style={{
            fontSize: 12, color: 'var(--t2)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.04)',
            transition: 'all 0.12s',
          }}>
            ← Dashboard
          </Link>
          <span style={{ color: 'var(--border2)' }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>Workspace</span>
        </div>
        <span style={{
          fontSize: 10, color: 'var(--t3)', fontWeight: 600,
          background: 'rgba(255,255,255,0.04)', padding: '3px 10px',
          borderRadius: 10, border: '1px solid var(--border)',
          textTransform: 'uppercase', letterSpacing: 0.4,
        }}>
          {tasks.length} rows · {columns.length} cols
        </span>
      </div>

      {columns.length === 0 ? (
        <Empty icon="🗂" message="No columns configured"
          sub="Ask your admin to set up the workspace columns" />
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DynamicTable columns={columns} tasks={tasks} editorId={user.uid} />
        </div>
      )}

      {/* Add row */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(12,12,20,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <button
          onClick={addRow}
          style={{
            width: '100%', padding: '11px 24px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontSize: 12, color: 'var(--t2)',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(109,95,239,0.06)'; e.currentTarget.style.color = '#a89ff5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          <span style={{
            width: 18, height: 18, borderRadius: 4,
            background: 'rgba(109,95,239,0.15)', color: '#a89ff5',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, lineHeight: 1, flexShrink: 0,
          }}>+</span>
          New row
        </button>
      </div>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────

function DynamicTable({ columns, tasks }) {
  const COL_W    = 150
  const NUM_W    = 40
  const STATUS_W = 130
  const totalW   = NUM_W + columns.length * COL_W + STATUS_W

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', height: '100%' }}>
      <table style={{
        width: totalW, borderCollapse: 'collapse',
        fontSize: 13, fontFamily: 'DM Sans, sans-serif',
      }}>
        <thead>
          <tr style={{
            background: 'rgba(12,12,20,0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <th style={{ width: NUM_W, ...thStyle }}>#</th>
            {columns.map(col => (
              <th key={col.id} style={{ width: COL_W, ...thStyle }}>
                <span>{col.name.toUpperCase()}</span>
                {col.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
              </th>
            ))}
            <th style={{ width: STATUS_W, ...thStyle }}>STATUS</th>
          </tr>
        </thead>

        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 2} style={{
                textAlign: 'center', padding: 48,
                color: 'var(--t2)', fontSize: 13,
              }}>
                Click "New row" below to start logging work
              </td>
            </tr>
          ) : tasks.map((task, i) => (
            <TableRow
              key={task.id}
              task={task}
              index={i}
              columns={columns}
              colWidth={COL_W}
              numWidth={NUM_W}
              statusWidth={STATUS_W}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const thStyle = {
  padding: '9px 10px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--t3)',
  letterSpacing: 0.7,
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  whiteSpace: 'nowrap',
}

// ─── Table Row ────────────────────────────────────────────────────────────

function TableRow({ task, index, columns, colWidth, numWidth, statusWidth }) {
  const [hovered, setHovered] = useState(false)

  async function handleCellSave(colId, value) {
    const newData = { ...task.dynamicData, [colId]: value }
    await updateTaskDynamicData(task.id, newData)
  }

  function cycleStatus() {
    const next = task.status === 'pending' ? 'in_progress'
      : task.status === 'in_progress' ? 'completed' : 'pending'
    updateTaskStatus(task.id, next)
  }

  const rowBg = hovered ? 'rgba(109,95,239,0.04)' : 'transparent'
  const tdBase = {
    padding: 0,
    verticalAlign: 'middle',
    borderRight: '0.5px solid rgba(255,255,255,0.05)',
    borderBottom: '0.5px solid rgba(255,255,255,0.05)',
  }

  return (
    <tr
      style={{ background: rowBg, transition: 'background 0.1s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={{ ...tdBase, width: numWidth, textAlign: 'center',
          color: 'var(--t3)', fontSize: 11, padding: '0 4px' }}>
        {index + 1}
      </td>

      {columns.map(col => (
        <td key={col.id} style={{ ...tdBase, width: colWidth }}>
          <Cell
            col={col}
            value={task.dynamicData?.[col.id]}
            onSave={val => handleCellSave(col.id, val)}
          />
        </td>
      ))}

      <td style={{ ...tdBase, width: statusWidth, padding: '0 10px' }}>
        <StatusBadge status={task.status} onClick={cycleStatus} />
      </td>
    </tr>
  )
}

// ─── Cell ─────────────────────────────────────────────────────────────────

function Cell({ col, value, onSave }) {
  switch (col.type) {
    case 'date':   return <DateCell value={value} onSave={onSave} />
    case 'select': return <SelectCell value={value} options={col.selectOptions} onSave={onSave} />
    case 'math':   return <MathCell value={value} onSave={onSave} />
    default:       return <TextCell value={value} onSave={onSave} type={col.type === 'number' ? 'number' : 'text'} />
  }
}

function TextCell({ value, onSave, type = 'text' }) {
  const [val, setVal] = useState(value ?? '')
  useEffect(() => setVal(value ?? ''), [value])

  return (
    <input
      className="cell-input"
      type={type}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => onSave(val)}
      onKeyDown={e => e.key === 'Enter' && e.target.blur()}
    />
  )
}

function MathCell({ value, onSave }) {
  const [raw, setRaw]         = useState(String(value ?? ''))
  const [focused, setFocused] = useState(false)
  const [evaluated, setEval]  = useState(null)
  useEffect(() => { setRaw(String(value ?? '')) }, [value])

  function handleBlur() {
    setFocused(false)
    const result = evalMath(raw)
    if (result !== null) {
      setEval(result)
      const num = Number(result)
      onSave(isNaN(num) ? result : num)
    } else {
      setEval(null)
      onSave(raw)
    }
  }

  const isExpr    = isMathExpr(raw)
  const isInvalid = isExpr && evalMath(raw) === null
  const showResult = !focused && evaluated !== null && isExpr

  return (
    <input
      className="cell-input"
      value={focused ? raw : (showResult ? evaluated : raw)}
      style={{ color: isInvalid ? '#ef4444' : '#a89ff5', fontWeight: showResult ? 600 : 400 }}
      placeholder="0 or 20+30"
      onChange={e => { setRaw(e.target.value); setEval(null) }}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={e => e.key === 'Enter' && e.target.blur()}
    />
  )
}

function DateCell({ value, onSave }) {
  return (
    <input
      className="cell-input"
      type="date"
      value={value ?? ''}
      onChange={e => onSave(e.target.value)}
      style={{ color: value ? 'var(--t1)' : 'var(--t3)' }}
    />
  )
}

function SelectCell({ value, options = [], onSave }) {
  return (
    <select
      className="cell-input"
      value={value ?? ''}
      onChange={e => onSave(e.target.value)}
      style={{ cursor: 'pointer', color: value ? 'var(--t1)' : 'var(--t3)' }}
    >
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
