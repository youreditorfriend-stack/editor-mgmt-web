import { useEffect, useState, useRef } from 'react'
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
  const [columns, setColumns]   = useState([])
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)

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
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <Spinner />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAF9' }}>
      {/* Topbar */}
      <div style={{
        background: '#fff', borderBottom: '0.5px solid #E9E9E7',
        padding: '0 24px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/dashboard" style={{ fontSize: 13, color: '#73726C', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <span style={{ color: '#E9E9E7' }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Workspace</span>
        </div>
        <span style={{ fontSize: 12, color: '#AFAEA9' }}>
          {tasks.length} rows · {columns.length} columns
        </span>
      </div>

      {columns.length === 0 ? (
        <Empty icon="🗂️" message="No columns configured"
          sub="Ask your admin to set up the workspace columns" />
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DynamicTable
            columns={columns}
            tasks={tasks}
            editorId={user.uid}
          />
        </div>
      )}

      {/* Add row */}
      <div style={{
        borderTop: '0.5px solid #E9E9E7', background: '#fff',
        flexShrink: 0,
      }}>
        <button
          onClick={addRow}
          style={{
            width: '100%', padding: '12px 24px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontSize: 13, color: '#73726C',
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F7F7F5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          + Add row
        </button>
      </div>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────

function DynamicTable({ columns, tasks, editorId }) {
  const COL_W = 150
  const NUM_W = 40
  const STATUS_W = 120
  const totalW = NUM_W + columns.length * COL_W + STATUS_W

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', height: '100%' }}>
      <table style={{
        width: totalW, borderCollapse: 'collapse',
        fontSize: 13, fontFamily: 'DM Sans, sans-serif',
      }}>
        {/* Header */}
        <thead>
          <tr style={{ background: '#F7F7F5', position: 'sticky', top: 0, zIndex: 10 }}>
            <th style={{ width: NUM_W, ...thStyle }}>#</th>
            {columns.map(col => (
              <th key={col.id} style={{ width: COL_W, ...thStyle }}>
                <span>{col.name.toUpperCase()}</span>
                {col.required && <span style={{ color: '#EB5757', marginLeft: 3 }}>*</span>}
              </th>
            ))}
            <th style={{ width: STATUS_W, ...thStyle }}>STATUS</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 2} style={{ textAlign: 'center',
                  padding: 40, color: '#73726C', fontSize: 13 }}>
                Click "+ Add row" to start logging work
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
  padding: '8px 10px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 500,
  color: '#73726C',
  letterSpacing: 0.5,
  borderBottom: '0.5px solid #E9E9E7',
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

  const rowStyle = {
    background: hovered ? '#F7F7F5' : 'transparent',
    borderBottom: '0.5px solid #E9E9E7',
    transition: 'background 0.1s',
  }
  const tdBase = { padding: 0, verticalAlign: 'middle', borderRight: '0.5px solid #E9E9E7' }

  return (
    <tr
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Row number */}
      <td style={{ ...tdBase, width: numWidth, textAlign: 'center',
          color: '#AFAEA9', fontSize: 11, padding: '0 4px' }}>
        {index + 1}
      </td>

      {/* Dynamic cells */}
      {columns.map(col => (
        <td key={col.id} style={{ ...tdBase, width: colWidth }}>
          <Cell
            col={col}
            value={task.dynamicData?.[col.id]}
            onSave={val => handleCellSave(col.id, val)}
          />
        </td>
      ))}

      {/* Status */}
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
  const [raw, setRaw] = useState(String(value ?? ''))
  const [focused, setFocused] = useState(false)
  const [evaluated, setEvaluated] = useState(null)
  useEffect(() => { setRaw(String(value ?? '')) }, [value])

  function handleBlur() {
    setFocused(false)
    const result = evalMath(raw)
    if (result !== null) {
      setEvaluated(result)
      const num = Number(result)
      onSave(isNaN(num) ? result : num)
    } else {
      setEvaluated(null)
      onSave(raw)
    }
  }

  const isExpr  = isMathExpr(raw)
  const isInvalid = isExpr && evalMath(raw) === null
  const showResult = !focused && evaluated !== null && isExpr

  return (
    <input
      className="cell-input"
      value={focused ? raw : (showResult ? evaluated : raw)}
      style={{ color: isInvalid ? '#EB5757' : '#191919', fontWeight: showResult ? 500 : 400 }}
      placeholder="0 or 20+30"
      onChange={e => { setRaw(e.target.value); setEvaluated(null) }}
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
      style={{ color: value ? '#191919' : '#AFAEA9' }}
    />
  )
}

function SelectCell({ value, options = [], onSave }) {
  return (
    <select
      className="cell-input"
      value={value ?? ''}
      onChange={e => onSave(e.target.value)}
      style={{ cursor: 'pointer', color: value ? '#191919' : '#AFAEA9' }}
    >
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
