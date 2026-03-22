// ─── AssignTaskPage ────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { onEditors, createTask } from '../services'
import { Btn, Input, Spinner } from '../components/shared/UI'

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
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      {/* Topbar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #F1F1EF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Link to="/admin" style={{
          fontSize: 13, color: '#73726C', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ← Dashboard
        </Link>
        <span style={{ color: '#E9E9E7' }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>Assign Task</span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px' }}>
        {editor && (
          <div style={{
            background: '#EAF3EB', borderRadius: 10, padding: '12px 16px',
            marginBottom: 24, fontSize: 13, color: '#0A6158',
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
            border: '1px solid rgba(15,123,108,0.15)',
          }}>
            👤 Assigning to: <strong style={{ color: '#191919' }}>{editor.name}</strong>
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: 12, padding: '24px',
          border: '1px solid #F1F1EF', boxShadow: 'var(--shadow-sm)',
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
              <label style={{ fontSize: 13, color: '#73726C', fontWeight: 500 }}>
                Description (optional)
              </label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Any specific instructions..."
                rows={4}
                style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                  padding: '10px 12px', border: '1px solid #E9E9E7',
                  borderRadius: 8, background: '#F7F7F5', color: '#191919',
                  outline: 'none', resize: 'vertical', width: '100%',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#0F7B6C'; e.target.style.boxShadow = '0 0 0 3px rgba(15,123,108,0.1)'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#E9E9E7'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F7F7F5' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 44, borderRadius: 8, background: loading ? '#888' : '#191919',
                color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : 'var(--shadow-sm)',
                transition: 'opacity 0.15s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.87' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
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
  const [editors, setEditors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onEditors(data => { setEditors(data); setLoading(false) })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      {/* Topbar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #F1F1EF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Link to="/admin" style={{
          fontSize: 13, color: '#73726C', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ← Dashboard
        </Link>
        <span style={{ color: '#E9E9E7' }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>Editors</span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner /></div>
        ) : editors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', color: '#73726C' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#F1F1EF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px',
            }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#191919', marginBottom: 8 }}>
              No editors yet
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: '#AFAEA9' }}>
              Create accounts in Firebase Auth<br />
              Then add a Firestore doc in <code style={{ background: '#F1F1EF', padding: '1px 5px', borderRadius: 4 }}>Users</code> with <code style={{ background: '#F1F1EF', padding: '1px 5px', borderRadius: 4 }}>role: "editor"</code>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editors.map((editor, i) => (
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
  const colors = ['#0F7B6C','#0066CC','#9333EA']
  const bg = colors[index % colors.length]
  const initials = editor.name?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{
      background: hovered ? '#FAFAF9' : '#fff',
      border: `1px solid ${hovered ? '#E9E9E7' : '#F1F1EF'}`,
      borderRadius: 10,
      padding: '13px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s',
      boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.08)' : 'var(--shadow-sm)',
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: bg, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 600,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{editor.name}</div>
        <div style={{ fontSize: 12, color: '#73726C' }}>{editor.email}</div>
      </div>
      <Link
        to={`/admin/assign/${editor.uid}`}
        style={{
          fontSize: 12, color: '#0F7B6C', textDecoration: 'none',
          padding: '6px 12px', border: '1px solid rgba(15,123,108,0.3)',
          borderRadius: 7, fontWeight: 600, background: '#EAF3EB',
        }}
      >
        + Assign task
      </Link>
    </div>
  )
}
