import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store'
import { onMyClients, onMyTasks, createClient, deleteClient } from '../../services'
import {
  Btn, Input, Modal, ConfirmModal, Avatar, StatCard,
  Empty, SectionHeader, Spinner, ProgressBar, StatusBadge, showToast
} from '../../components/shared/UI'
import AdminLayout from './AdminLayout'

export default function ClientsPage() {
  const user = useAuthStore(s => s.user)
  const [clients, setClients] = useState([])
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [delConf, setDelConf] = useState(null)
  const [search,  setSearch]  = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!user) return
    const u1 = onMyClients(user.id, data => { setClients(data); setLoading(false) })
    const u2 = onMyTasks(user.id, setTasks)
    return () => { u1(); u2() }
  }, [user?.id])

  async function handleDelete() {
    try {
      await deleteClient(delConf.id)
      showToast('Client removed')
    } catch { showToast('Failed to remove client', 'err') }
    setDelConf(null)
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = tasks
    .filter(t => t.status === 'completed')
    .reduce((s, t) => s + (Number(t.clientAmount) || 0), 0)

  return (
    <AdminLayout>
      <div style={{ padding: '28px 28px 40px', maxWidth: 1100 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Inter, sans-serif', marginBottom: 5 }}>
            Clients
          </h1>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>Manage your client accounts and project progress.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }} className="anim-up">
          <StatCard icon="👥" label="Total Clients"   value={clients.length} color="var(--silver)" />
          <StatCard icon="📁" label="Active Projects" value={tasks.filter(t => t.clientId && t.status !== 'completed').length} color="var(--amber)" />
          <StatCard icon="💰" label="Total Revenue"   value={`₹${totalRevenue.toLocaleString('en-IN')}`} color="var(--green)" />
        </div>

        <SectionHeader
          title="Clients"
          count={clients.length}
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Search…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  height: 36, padding: '0 12px', borderRadius: 8,
                  border: '1px solid var(--border2)', background: 'rgba(255,255,255,0.04)',
                  color: 'var(--t1)', fontFamily: 'Inter, sans-serif', fontSize: 13, outline: 'none',
                }}
              />
              <Btn variant="primary" size="sm" onClick={() => setModal(true)}>+ Add Client</Btn>
            </div>
          }
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <Empty icon="👥" title="No Clients Yet"
            sub="Add client accounts to share project progress and delivery timelines."
            action={<Btn variant="primary" onClick={() => setModal(true)}>+ Add First Client</Btn>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((client, i) => {
              const clientTasks = tasks.filter(t => t.clientId === client.id)
              const completed   = clientTasks.filter(t => t.status === 'completed').length
              const revenue     = clientTasks.filter(t => t.status === 'completed').reduce((s, t) => s + (Number(t.clientAmount) || 0), 0)
              const isExpanded  = expanded === client.id

              return (
                <div
                  key={client.id}
                  className="anim-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Client row */}
                  <div
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: isExpanded ? '14px 14px 0 0' : 14,
                      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onClick={() => setExpanded(isExpanded ? null : client.id)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = isExpanded ? 'var(--border2)' : 'var(--border)'}
                  >
                    <Avatar name={client.name} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 14 }}>{client.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>
                        {client.email}
                        {client.company && <span style={{ color: 'var(--t3)' }}> · {client.company}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                      <MiniStat label="Projects" value={clientTasks.length} />
                      <MiniStat label="Completed" value={completed} color="var(--green)" />
                      <MiniStat label="Revenue" value={`₹${revenue.toLocaleString('en-IN')}`} color="var(--silver)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--t3)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                      <Btn variant="danger" size="sm" onClick={e => { e.stopPropagation(); setDelConf(client) }}>Remove</Btn>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{
                      background: 'var(--surface2)', border: '1px solid var(--border2)',
                      borderTop: '1px solid var(--border)',
                      borderRadius: '0 0 14px 14px', padding: '16px 18px',
                    }} className="anim-in">
                      {/* Progress */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Overall Progress</span>
                          <span style={{ fontSize: 11, color: 'var(--t2)' }}>{completed}/{clientTasks.length} tasks</span>
                        </div>
                        <ProgressBar value={completed} max={clientTasks.length} color="var(--green)" />
                      </div>

                      {/* Task list */}
                      {clientTasks.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '12px 0' }}>No tasks assigned to this client yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {clientTasks.map(task => (
                            <div key={task.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 12px', background: 'var(--surface)', borderRadius: 9,
                              border: '1px solid var(--border)',
                            }}>
                              <span style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 500 }}>{task.title}</span>
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--t3)' }}>₹{(Number(task.clientAmount) || 0).toLocaleString('en-IN')}</span>
                                <StatusBadge status={task.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && <AddClientModal adminId={user.id} onClose={() => setModal(false)} />}

      {delConf && (
        <ConfirmModal
          title="Remove Client"
          message={`Remove ${delConf.name}? They will lose access to the platform.`}
          onConfirm={handleDelete}
          onCancel={() => setDelConf(null)}
        />
      )}
    </AdminLayout>
  )
}

function MiniStat({ label, value, color = 'var(--t2)' }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'Inter, sans-serif' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function AddClientModal({ adminId, onClose }) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [company, setCompany] = useState('')
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !pass) return
    if (pass.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    try {
      await createClient(adminId, { name, email, company, password: pass })
      showToast(`✓ ${name} added as client`)
      onClose()
    } catch (err) {
      if (err.message.includes('email-already-in-use')) setError('This email is already registered.')
      else setError('Failed to create client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Add Client" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={loading} onClick={handleSubmit}>Create Client</Btn>
      </>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Client Name" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Company / Brand" placeholder="Optional" value={company} onChange={e => setCompany(e.target.value)} />
        <Input label="Email" type="email" placeholder="client@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Temporary Password" type="password" placeholder="Min. 6 characters"
          value={pass} onChange={e => setPass(e.target.value)} required
          hint="Share this login with the client."
        />
        {error && <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-bg)', borderRadius: 8, border: '1px solid var(--red-border)' }}>{error}</div>}
      </form>
    </Modal>
  )
}
