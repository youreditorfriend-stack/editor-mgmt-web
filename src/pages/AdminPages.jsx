// ─── AssignTaskPage ────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { onEditors, createTask, getEditorByCode } from '../services'
import { Btn, Input, Spinner, CodeBadge, showToast } from '../components/shared/UI'

export function AssignTaskPage() {
  const { editorId } = useParams()
  const navigate = useNavigate()
  const [editors, setEditors] = useState([])
  const [title, setTitle]     = useState('')
  const [desc, setDesc]       = useState('')
  const [loading, setLoading] = useState(false)
  const [titleErr, setTitleErr] = useState('')

  useEffect(() => { return onEditors(setEditors) }, [])

  const editor = editors.find(e => e.uid === editorId)

  async function handleAssign(e) {
    e.preventDefault()
    if (!title.trim()) { setTitleErr('Title is required'); return }
    setLoading(true)
    try {
      await createTask({ editorId, title: title.trim(), description: desc.trim() })
      navigate('/admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Topbar */}
      <div style={{
        background: 'rgba(12,12,20,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Link to="/admin" style={{
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
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>
          Assign Task
        </span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px' }}>
        {editor && (
          <div style={{
            background: 'rgba(109,95,239,0.08)',
            border: '1px solid rgba(109,95,239,0.2)',
            borderRadius: 12, padding: '12px 16px',
            marginBottom: 20, fontSize: 13, color: '#a89ff5',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>👤</span>
            <span>Assigning to: <strong style={{ color: 'var(--t1)' }}>{editor.name}</strong></span>
            {editor.editorCode && <CodeBadge code={editor.editorCode} />}
          </div>
        )}

        <div style={{
          background: 'rgba(17,17,32,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Task title"
              value={title}
              onChange={e => { setTitle(e.target.value); setTitleErr('') }}
              placeholder="e.g. Edit Instagram Reel #42"
              error={titleErr}
              autoFocus
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Description (optional)
              </label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Any specific instructions..."
                rows={4}
                style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                  padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 9,
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--t1)',
                  outline: 'none', resize: 'vertical', width: '100%',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(109,95,239,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(109,95,239,0.1)'; e.target.style.background = 'rgba(109,95,239,0.06)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 44, borderRadius: 10,
                background: loading ? 'rgba(109,95,239,0.4)' : 'linear-gradient(135deg, #6d5fef, #8b7cf8)',
                color: '#fff', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(109,95,239,0.35)',
                transition: 'all 0.15s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading ? <><Spinner size={16} color="#fff" /> Assigning...</> : 'Assign Task'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── EditorsPage ──────────────────────────────────────────────────────────

export function EditorsPage() {
  const navigate = useNavigate()
  const [editors, setEditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [codeSearching, setCodeSearching] = useState(false)
  const [codeErr, setCodeErr] = useState('')

  useEffect(() => {
    return onEditors(data => { setEditors(data); setLoading(false) })
  }, [])

  const filtered = editors.filter(e => {
    const q = search.toLowerCase()
    return (
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.editorCode?.toLowerCase().includes(q)
    )
  })

  async function accessByCode(e) {
    e.preventDefault()
    if (!codeInput.trim()) return
    setCodeSearching(true); setCodeErr('')
    try {
      const editor = await getEditorByCode(codeInput.trim())
      if (!editor) { setCodeErr('No editor found with this code.'); return }
      navigate(`/admin/editor/${editor.uid}`)
    } catch {
      setCodeErr('Something went wrong.')
    } finally {
      setCodeSearching(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Topbar */}
      <div style={{
        background: 'rgba(12,12,20,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
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
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>Editors</span>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 24px' }}>

        {/* Access by Code */}
        <div style={{
          background: 'rgba(109,95,239,0.08)',
          border: '1px solid rgba(109,95,239,0.18)',
          borderRadius: 14, padding: '16px 18px',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a89ff5', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Access Editor by Code
          </div>
          <form onSubmit={accessByCode} style={{ display: 'flex', gap: 8 }}>
            <input
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value); setCodeErr('') }}
              placeholder="YEF-XXXX"
              style={{
                flex: 1, fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                letterSpacing: 1.5,
                padding: '8px 12px', border: '1px solid rgba(109,95,239,0.25)',
                borderRadius: 8, background: 'rgba(109,95,239,0.06)', color: 'var(--t1)',
                outline: 'none', textTransform: 'uppercase',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(109,95,239,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(109,95,239,0.25)'}
            />
            <button type="submit" disabled={codeSearching} style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'linear-gradient(135deg, #6d5fef, #8b7cf8)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: codeSearching ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(109,95,239,0.3)',
              transition: 'all 0.15s',
            }}>
              {codeSearching ? <Spinner size={14} color="#fff" /> : null}
              Open
            </button>
          </form>
          {codeErr && (
            <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 8 }}>⚠ {codeErr}</div>
          )}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 9, padding: '7px 12px',
          marginBottom: 14,
          transition: 'border-color 0.15s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(109,95,239,0.4)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
        >
          <span style={{ color: 'var(--t3)', fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or code…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--t1)', fontSize: 12, fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(109,95,239,0.1)',
              border: '1px solid rgba(109,95,239,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px',
            }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 8, fontFamily: 'Syne, sans-serif' }}>
              {search ? 'No editors match your search' : 'No editors yet'}
            </div>
            {!search && (
              <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.8 }}>
                Create accounts in Firebase Auth<br />
                then add a Firestore doc in <code style={{ background: 'rgba(109,95,239,0.1)', padding: '1px 5px', borderRadius: 4, color: '#a89ff5' }}>Users</code> with <code style={{ background: 'rgba(109,95,239,0.1)', padding: '1px 5px', borderRadius: 4, color: '#a89ff5' }}>role: "editor"</code>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((editor, i) => (
              <EditorCard key={editor.id} editor={editor} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EditorCard({ editor, index }) {
  const [hovered, setHovered] = useState(false)

  function copyCode() {
    if (editor.editorCode) {
      navigator.clipboard.writeText(editor.editorCode)
      showToast('✓ Editor code copied!')
    }
  }

  return (
    <div style={{
      background: hovered ? 'rgba(22,22,40,0.8)' : 'rgba(17,17,32,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 12,
      padding: '13px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'all 0.15s',
      boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <EditorAvatar name={editor.name} index={index} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{editor.name}</div>
        <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 1 }}>{editor.email}</div>
        {editor.editorCode && (
          <div style={{ marginTop: 5 }}>
            <CodeBadge code={editor.editorCode} onCopy={copyCode} />
          </div>
        )}
        {!editor.editorCode && (
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
            No code yet — editor must log in once
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Link
          to={`/admin/editor/${editor.uid}`}
          style={{
            fontSize: 11, color: '#67e8f9', textDecoration: 'none',
            padding: '6px 12px', border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: 7, fontWeight: 600,
            background: 'rgba(34,211,238,0.08)',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.08)'}
        >
          View Workspace
        </Link>
        <Link
          to={`/admin/assign/${editor.uid}`}
          style={{
            fontSize: 11, color: '#a89ff5', textDecoration: 'none',
            padding: '6px 12px', border: '1px solid rgba(109,95,239,0.25)',
            borderRadius: 7, fontWeight: 600,
            background: 'rgba(109,95,239,0.1)',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,95,239,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(109,95,239,0.1)'}
        >
          + Assign Task
        </Link>
      </div>
    </div>
  )
}

const COLORS = ['#6d5fef','#22d3ee','#10b981','#f59e0b','#ef4444','#ec4899']
function EditorAvatar({ name, index }) {
  const initials = name?.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase() || '?'
  const color = COLORS[index % COLORS.length]
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: color + '20', border: `2px solid ${color}50`,
      color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700,
    }}>
      {initials}
    </div>
  )
}
