import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onWorkspaceSettings, saveWorkspaceSettings } from '../services'
import { Btn, Modal, Input, Spinner } from '../components/shared/UI'

const TYPES = [
  { value: 'text',   label: 'Text',           icon: 'T' },
  { value: 'number', label: 'Number',          icon: '#' },
  { value: 'math',   label: 'Math (20+30=50)', icon: '=' },
  { value: 'date',   label: 'Date',            icon: '📅' },
  { value: 'select', label: 'Dropdown',        icon: '▾' },
]

export default function ColumnManagerPage() {
  const [columns, setColumns] = useState([])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragIdx, setDragIdx] = useState(null)

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

  function openAdd()        { setEditing({ col: null, index: -1 }) }
  function openEdit(col, i) { setEditing({ col, index: i }) }
  function closeModal()     { setEditing(null) }

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
      <Spinner size={28} />
    </div>
  )

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
          <Link to="/admin" style={{
            fontSize: 12, color: 'var(--t2)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.04)',
          }}>
            ← Dashboard
          </Link>
          <span style={{ color: 'var(--border2)' }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>
            Column Manager
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            background: saved
              ? 'rgba(16,185,129,0.15)'
              : 'linear-gradient(135deg, #6d5fef, #8b7cf8)',
            color: saved ? '#34d399' : '#fff',
            outline: saved ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
            boxShadow: saved ? 'none' : '0 4px 12px rgba(109,95,239,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
        >
          {saving ? <><Spinner size={13} color="#fff" /> Saving...</> : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'rgba(109,95,239,0.08)',
        borderBottom: '1px solid rgba(109,95,239,0.15)',
        padding: '8px 24px', fontSize: 11, color: '#a89ff5',
        display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
      }}>
        ⚡ Changes push to all editors instantly via Firestore realtime sync.
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px' }}>

        {columns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(109,95,239,0.1)',
              border: '1px solid rgba(109,95,239,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px',
            }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>
              No columns yet
            </div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 24, lineHeight: 1.7 }}>
              Add columns to define what editors enter in their workspace
            </div>
            <Btn onClick={openAdd} variant="primary">+ Add first column</Btn>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {columns.length} column{columns.length !== 1 ? 's' : ''} · drag to reorder
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {columns.map((col, i) => {
                const typeInfo = TYPES.find(t => t.value === col.type)
                return (
                  <div
                    key={col.id}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={e => onDragOver(e, i)}
                    onDragEnd={onDragEnd}
                    className="animate-in"
                    style={{
                      background: dragIdx === i
                        ? 'rgba(109,95,239,0.12)'
                        : 'rgba(17,17,32,0.6)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: `1px solid ${dragIdx === i ? 'rgba(109,95,239,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 12,
                      padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'grab', animationDelay: `${i * 30}ms`,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (dragIdx !== i) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                    onMouseLeave={e => { if (dragIdx !== i) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    {/* Type icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      background: 'rgba(109,95,239,0.12)',
                      border: '1px solid rgba(109,95,239,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, flexShrink: 0, color: '#a89ff5', fontWeight: 700,
                    }}>
                      {typeInfo?.icon ?? 'T'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {col.name}
                        {col.required && (
                          <span style={{
                            fontSize: 9, color: '#fca5a5',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                          }}>required</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 1 }}>
                        {typeInfo?.label ?? col.type}
                        {col.type === 'select' && col.selectOptions?.length > 0 &&
                          ` · ${col.selectOptions.join(', ')}`}
                      </div>
                    </div>

                    <button
                      onClick={() => openEdit(col, i)}
                      style={iconBtn}
                      title="Edit"
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(109,95,239,0.15)'; e.currentTarget.style.color = '#a89ff5' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t2)' }}
                    >✏</button>
                    <button
                      onClick={() => deleteCol(i)}
                      style={iconBtn}
                      title="Delete"
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t2)' }}
                    >✕</button>
                    <span style={{ color: 'var(--t3)', fontSize: 14, cursor: 'grab', paddingLeft: 4 }}>⋮⋮</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div style={{ marginTop: 16 }}>
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
  background: 'transparent',
  border: 'none', cursor: 'pointer',
  fontSize: 13, padding: '5px 7px', borderRadius: 6, lineHeight: 1,
  color: 'var(--t2)', transition: 'all 0.12s',
  fontFamily: 'DM Sans, sans-serif',
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
          <div style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Type
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                style={{
                  padding: '7px 13px', borderRadius: 8, fontSize: 12,
                  border: `1px solid ${type === t.value ? 'rgba(109,95,239,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  background: type === t.value ? 'rgba(109,95,239,0.15)' : 'rgba(255,255,255,0.04)',
                  color: type === t.value ? '#a89ff5' : 'var(--t2)',
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.12s',
                  boxShadow: type === t.value ? '0 0 0 2px rgba(109,95,239,0.1)' : 'none',
                }}
              >
                <span style={{ fontWeight: 700 }}>{t.icon}</span> {t.label}
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

        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--t1)',
        }}>
          <input
            type="checkbox"
            checked={required}
            onChange={e => setReq(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: '#6d5fef' }}
          />
          Required field
        </label>
      </div>
    </Modal>
  )
}
