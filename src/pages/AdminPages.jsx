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
      <div style={{
        background: '#fff', borderBottom: '0.5px solid #E9E9E7',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Link to="/admin" style={{ fontSize: 13, color: '#73726C', textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <span style={{ color: '#E9E9E7' }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Assign Task</span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
        {editor && (
          <div style={{
            background: '#F7F7F5', borderRadius: 8, padding: '12px 16px',
            marginBottom: 24, fontSize: 13, color: '#73726C',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            👤 Assigning to: <strong style={{ color: '#191919' }}>{editor.name}</strong>
          </div>
        )}

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
                padding: '10px 12px', border: '0.5px solid #E9E9E7',
                borderRadius: 8, background: '#F7F7F5', color: '#191919',
                outline: 'none', resize: 'vertical', width: '100%',
              }}
              onFocus={e => e.target.style.borderColor = '#0F7B6C'}
              onBlur={e => e.target.style.borderColor = '#E9E9E7'}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              height: 46, borderRadius: 8, background: loading ? '#888' : '#191919',
              color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? <><Spinner size={16} color="#fff" /> Assigning...</> : 'Assign Task'}
          </button>
        </form>
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
      <div style={{
        background: '#fff', borderBottom: '0.5px solid #E9E9E7',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Link to="/admin" style={{ fontSize: 13, color: '#73726C', textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <span style={{ color: '#E9E9E7' }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Editors</span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : editors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#73726C' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#191919', marginBottom: 8 }}>
              No editors yet
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              Create accounts in Firebase Auth<br />
              Then add a Firestore doc in <code>Users</code> with <code>role: "editor"</code>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editors.map((editor, i) => (
              <div key={editor.id} style={{
                background: '#fff', border: '0.5px solid #E9E9E7',
                borderRadius: 8, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: ['#0F7B6C','#0066CC','#9333EA'][i % 3],
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, fontWeight: 600,
                }}>
                  {editor.name?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{editor.name}</div>
                  <div style={{ fontSize: 12, color: '#73726C' }}>{editor.email}</div>
                </div>
                <Link
                  to={`/admin/assign/${editor.uid}`}
                  style={{
                    fontSize: 12, color: '#0F7B6C', textDecoration: 'none',
                    padding: '5px 12px', border: '0.5px solid #0F7B6C',
                    borderRadius: 6, fontWeight: 500,
                  }}
                >
                  + Assign task
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
