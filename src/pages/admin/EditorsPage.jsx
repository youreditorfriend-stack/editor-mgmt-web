import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store'
import { onMyEditors, onMyTasks, createEditor, deleteEditor, linkEditorByCode } from '../../services'
import {
  Btn, Input, Modal, ConfirmModal, Avatar, StatusBadge,
  StatCard, Empty, SectionHeader, Spinner, showToast
} from '../../components/shared/UI'
import AdminLayout from './AdminLayout'

const F = { fontFamily: 'Inter, sans-serif' }

export default function EditorsPage() {
  const user = useAuthStore(s => s.user)
  const [editors, setEditors] = useState([])
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)   // false | 'create' | 'link'
  const [delConf, setDelConf] = useState(null)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    if (!user) return
    const u1 = onMyEditors(user.id, data => { setEditors(data); setLoading(false) })
    const u2 = onMyTasks(user.id, setTasks)
    return () => { u1(); u2() }
  }, [user?.id])

  async function handleDelete() {
    try {
      await deleteEditor(delConf.id)
      showToast('Editor removed')
    } catch { showToast('Failed to remove editor', 'err') }
    setDelConf(null)
  }

  const filtered = editors.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPaid = tasks
    .filter(t => t.status === 'completed')
    .reduce((s, t) => s + (Number(t.editorAmount) || 0), 0)

  return (
    <AdminLayout>
      <div style={{ padding: '28px 28px 40px', maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', ...F, marginBottom: 5 }}>
            Editors
          </h1>
          <p style={{ fontSize: 13, color: 'var(--t3)', ...F }}>Manage your editing team and view their performance.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }} className="anim-up">
          <StatCard icon="✏" label="Total Editors" value={editors.length} color="var(--blue)" />
          <StatCard icon="✅" label="Tasks Completed" value={tasks.filter(t => t.status === 'completed').length} color="var(--green)" />
          <StatCard icon="💸" label="Total Paid Out" value={`₹${totalPaid.toLocaleString('en-IN')}`} color="var(--amber)" />
        </div>

        {/* Table */}
        <SectionHeader
          title="Your Editors"
          count={editors.length}
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Search…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  height: 36, padding: '0 12px', borderRadius: 8,
                  border: '1px solid var(--border2)', background: 'rgba(255,255,255,0.04)',
                  color: 'var(--t1)', ...F, fontSize: 13, outline: 'none',
                }}
              />
              <Btn variant="ghost" size="sm" onClick={() => setModal('link')}>Link by Code</Btn>
              <Btn variant="primary" size="sm" onClick={() => setModal('create')}>+ Add Editor</Btn>
            </div>
          }
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <Empty icon="✏" title="No Editors Yet"
            sub="Add editors to your team or link existing editors by their code."
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" onClick={() => setModal('link')}>Link Existing</Btn>
                <Btn variant="primary" onClick={() => setModal('create')}>+ Add First Editor</Btn>
              </div>
            }
          />
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  {['Editor', 'Email', 'Editor Code', 'Tasks', 'Earnings', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((editor, i) => {
                  const editorTasks   = tasks.filter(t => t.editorId === editor.id)
                  const completedT    = editorTasks.filter(t => t.status === 'completed')
                  const earnings      = completedT.reduce((s, t) => s + (Number(t.editorAmount) || 0), 0)
                  return (
                    <EditorRow
                      key={editor.id}
                      editor={editor}
                      index={i}
                      totalTasks={editorTasks.length}
                      completedTasks={completedT.length}
                      earnings={earnings}
                      onDelete={() => setDelConf(editor)}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'create' && <AddEditorModal adminId={user.id} onClose={() => setModal(false)} />}
      {modal === 'link'   && <LinkEditorModal adminId={user.id} onClose={() => setModal(false)} />}

      {delConf && (
        <ConfirmModal
          title="Remove Editor"
          message={`Remove ${delConf.name} from your team? Their tasks will remain but they'll lose access.`}
          onConfirm={handleDelete}
          onCancel={() => setDelConf(null)}
          confirmLabel="Remove"
        />
      )}
    </AdminLayout>
  )
}

function EditorRow({ editor, index, totalTasks, completedTasks, earnings, onDelete }) {
  return (
    <tr className="anim-up" style={{ animationDelay: `${index * 30}ms`, borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={editor.name} size={34} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--t1)', fontFamily: 'Inter, sans-serif' }}>{editor.name}</div>
            <StatusBadge status={editor.status} />
          </div>
        </div>
      </td>
      <td style={tdStyle}><span style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif' }}>{editor.email}</span></td>
      <td style={tdStyle}>
        {editor.editorCode && (
          <code style={{
            fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
            color: 'var(--blue)', background: 'var(--blue-bg)',
            border: '1px solid var(--blue-border)', borderRadius: 6,
            padding: '3px 8px', letterSpacing: 1,
          }}>{editor.editorCode}</code>
        )}
      </td>
      <td style={tdStyle}>
        <div style={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
          <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{completedTasks}</span>
          <span style={{ color: 'var(--t3)' }}>/{totalTasks}</span>
        </div>
      </td>
      <td style={tdStyle}><span style={{ color: 'var(--green)', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>₹{earnings.toLocaleString('en-IN')}</span></td>
      <td style={tdStyle}>
        <Btn variant="danger" size="sm" onClick={onDelete}>Remove</Btn>
      </td>
    </tr>
  )
}

function AddEditorModal({ adminId, onClose }) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !pass) return
    if (pass.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    try {
      const result = await createEditor(adminId, { name, email, password: pass })
      showToast(`✓ ${name} added — Code: ${result.editorCode}`)
      onClose()
    } catch (err) {
      const msg = err.message
      if (msg.includes('email-already-in-use')) setError('This email is already registered.')
      else setError('Failed to create editor. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Create New Editor" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={loading} onClick={handleSubmit}>Create Editor</Btn>
      </>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Full Name" placeholder="Editor's name" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Email" type="email" placeholder="editor@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Temporary Password" type="password" placeholder="Min. 6 characters"
          value={pass} onChange={e => setPass(e.target.value)} required
          hint="Share this with the editor. They can change it later."
        />
        {error && <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-bg)', borderRadius: 8, border: '1px solid var(--red-border)', fontFamily: 'Inter, sans-serif' }}>{error}</div>}
        <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 9, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
            A unique Editor Code (e.g. EF-XXXXX) will be auto-generated. The editor can share this code to connect their account to other admins.
          </p>
        </div>
      </form>
    </Modal>
  )
}

function LinkEditorModal({ adminId, onClose }) {
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim()) return
    setError(''); setLoading(true)
    try {
      const editor = await linkEditorByCode(adminId, code)
      showToast(`✓ ${editor.name} linked to your team!`)
      onClose()
    } catch (err) {
      if (err.message === 'editor-not-found') setError('No editor found with this code. Please check and try again.')
      else if (err.message === 'editor-has-admin') setError('This editor is already linked to another admin.')
      else setError('Failed to link editor. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Link Existing Editor" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={loading} onClick={handleSubmit}>Link Editor</Btn>
      </>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: '12px 16px', background: 'var(--blue-bg)', borderRadius: 10, border: '1px solid var(--blue-border)' }}>
          <p style={{ fontSize: 12, color: 'var(--blue)', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
            Ask your editor for their unique Editor Code (format: EF-XXXXX). Enter it below to link them to your admin account.
          </p>
        </div>
        <Input
          label="Editor Code"
          placeholder="e.g. EF-ABC12"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          required
          hint="Found in the editor's dashboard"
        />
        {error && <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-bg)', borderRadius: 8, border: '1px solid var(--red-border)', fontFamily: 'Inter, sans-serif' }}>{error}</div>}
      </form>
    </Modal>
  )
}

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }
const tdStyle = { padding: '13px 14px', verticalAlign: 'middle' }
