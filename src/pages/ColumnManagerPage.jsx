import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onWorkspaceSettings, saveWorkspaceSettings } from '../services'
import { Btn, Modal, Input, Spinner } from '../components/shared/UI'

const TYPES = [
  { value: 'text',   label: 'Text',            icon: '🔤' },
  { value: 'number', label: 'Number',           icon: '🔢' },
  { value: 'math',   label: 'Math (20+30=50)',  icon: '➕' },
  { value: 'date',   label: 'Date',             icon: '📅' },
  { value: 'select', label: 'Dropdown',         icon: '🔽' },
]

export default function ColumnManagerPage() {
  const [columns, setColumns]   = useState([])
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(true)
  const [dragIdx, setDragIdx]   = useState(null)

  useEffect(() => {
    return onWorkspaceSettings(cols => { setColumns(cols); setLoading(false) })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await saveWorkspaceSettings(columns)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  function openAdd()           { setEditing({ col: null, index: -1 }) }
  function openEdit(col, i)    { setEditing({ col, index: i }) }
  function closeModal()        { setEditing(null) }

  function handleModalSave(col) {
    if (editing.index === -1) {
      setColumns(prev => [...prev, col])
    } else {
      setColumns(prev => prev.map((c, i) => i === editing.index ? col : c))
    }
    setEditing(null)
  }

  function deleteCol(i) {
    if (!confirm(`Remove "${columns[i].name}"?\n\nExisting data is preserved but hidden.`)) return
    setColumns(prev => prev.filter((_, idx) => idx !== i))
  }

  function onDragStart(i) { setDragIdx(i) }
  function onDragOver(e, i) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const newCols = [...columns]
    const [moved] = newCols.splice(dragIdx, 1)
    newCols.splice(i, 0, moved)
    setColumns(newCols)
    setDragIdx(i)
  }
  function onDragEnd() { setDragIdx(null) }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      {/* Topbar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #F1F1EF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/admin" style={{
            fontSize: 13, color: '#73726C', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ← Dashboard
          </Link>
          <span style={{ color: '#E9E9E7' }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>Column Manager</span>
        </div>
        <Btn onClick={handleSave} variant="green" size="sm" disabled={saving}>
          {saving ? <><Spinner size={13} color="#fff" /> Saving...</> : saved ? '✓ Saved!' : 'Save changes'}
        </Btn>
      </div>

      {/* Info banner */}
      <div style={{
        background: '#EEF4FF', borderBottom: '1px solid #C7DEFF',
        padding: '9px 24px', fontSize: 12, color: '#0052A3',
        display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
      }}>
        ⚡ Changes push to all editors instantly via Firestore realtime sync.
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px' }}>

        {columns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#F1F1EF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px',
            }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#191919' }}>No columns yet</div>
            <div style={{ fontSize: 13, color: '#AFAEA9', marginBottom: 24, lineHeight: 1.6 }}>
              Add columns to define what editors enter in their workspace
            </div>
            <Btn onClick={openAdd} variant="primary">+ Add first column</Btn>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#AFAEA9', fontWeight: 500 }}>
                {columns.length} column{columns.length !== 1 ? 's' : ''} · drag to reorder
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {columns.map((col, i) => (
                <div
                  key={col.id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  className="animate-in"
                  style={{
                    background: dragIdx === i ? '#F7F7F5' : '#fff',
                    border: `1px solid ${dragIdx === i ? '#E9E9E7' : '#F1F1EF'}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'grab', animationDelay: `${i * 30}ms`,
                    transition: 'background 0.1s, border-color 0.1s',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: '#F7F7F5', border: '1px solid #E9E9E7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>
                    {TYPES.find(t => t.value === col.type)?.icon ?? '🔤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {col.name}
                      {col.required && (
                        <span style={{
                          fontSize: 10, color: '#EB5757',
                          background: '#FFF0F0', padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                        }}>required</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#73726C', marginTop: 1 }}>
                      {TYPES.find(t => t.value === col.type)?.label ?? col.type}
                      {col.type === 'select' && col.selectOptions?.length > 0 &&
                        ` · ${col.selectOptions.join(', ')}`}
                    </div>
                  </div>
                  <button onClick={() => openEdit(col, i)} style={iconBtn}
                    onMouseEnter={e => e.currentTarget.style.background = '#F1F1EF'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >✏️</button>
                  <button onClick={() => deleteCol(i)} style={iconBtn}
                    onMouseEnter={e => e.currentTarget.style.background = '#FFF0F0'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >🗑️</button>
                  <span style={{ color: '#AFAEA9', fontSize: 16, cursor: 'grab', paddingLeft: 4 }}>⋮⋮</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 20 }}>
          <Btn onClick={openAdd} variant="ghost" size="sm">+ Add column</Btn>
        </div>
      </div>

      {editing && (
        <ColumnModal
          existing={editing.col}
          onSave={handleModalSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

const iconBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  fontSize: 15, padding: '4px 6px', borderRadius: 6, lineHeight: 1,
  transition: 'background 0.12s',
}

// ─── Column Modal ──────────────────────────────────────────────────────────

function ColumnModal({ existing, onSave, onClose }) {
  const [name, setName]       = useState(existing?.name ?? '')
  const [type, setType]       = useState(existing?.type ?? 'text')
  const [required, setReq]    = useState(existing?.required ?? false)
  const [opts, setOpts]       = useState(existing?.selectOptions?.join(', ') ?? '')
  const [nameErr, setNameErr] = useState('')

  function handleSave() {
    if (!name.trim()) { setNameErr('Name is required'); return }
    const col = {
      id: existing?.id ?? `col_${Date.now().toString(36)}`,
      name: name.trim(),
      type,
      required,
      order: existing?.order ?? 999,
      selectOptions: type === 'select'
        ? opts.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }
    onSave(col)
  }

  return (
    <Modal
      title={existing ? 'Edit column' : 'Add column'}
      onClose={onClose}
      footer={<>
        <Btn onClick={onClose} variant="ghost" size="sm">Cancel</Btn>
        <Btn onClick={handleSave} variant="primary" size="sm">Save</Btn>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Column name"
          value={name}
          onChange={e => { setName(e.target.value); setNameErr('') }}
          placeholder="e.g. Amount (₹)"
          error={nameErr}
          autoFocus
        />

        <div>
          <div style={{ fontSize: 13, color: '#73726C', fontWeight: 500, marginBottom: 8 }}>
            Type
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                style={{
                  padding: '7px 13px', borderRadius: 8, fontSize: 12,
                  border: `1px solid ${type === t.value ? '#0F7B6C' : '#E9E9E7'}`,
                  background: type === t.value ? '#EAF3EB' : '#F7F7F5',
                  color: type === t.value ? '#0A6158' : '#73726C',
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.12s',
                  boxShadow: type === t.value ? '0 0 0 2px rgba(15,123,108,0.15)' : 'none',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {type === 'select' && (
          <Input
            label="Options (comma separated)"
            value={opts}
            onChange={e => setOpts(e.target.value)}
            placeholder="Pending, In Review, Done"
          />
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#191919' }}>
          <input
            type="checkbox"
            checked={required}
            onChange={e => setReq(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: '#0F7B6C' }}
          />
          Required field
        </label>
      </div>
    </Modal>
  )
}
