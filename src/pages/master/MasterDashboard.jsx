import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store'
import { onPendingAdmins, onAllAdmins, approveAdmin, rejectAdmin, onSystemStats, signOut } from '../../services'
import {
  Topbar, LogoMark, Avatar, StatCard, StatusBadge,
  Btn, ConfirmModal, showToast, Empty, SectionHeader, Tag
} from '../../components/shared/UI'
import { format } from 'date-fns'

export default function MasterDashboard() {
  const clearUser = useAuthStore(s => s.clearUser)
  const [tab, setTab]         = useState('pending')  // 'pending' | 'all' | 'overview'
  const [pending, setPending] = useState([])
  const [admins,  setAdmins]  = useState([])
  const [stats,   setStats]   = useState(null)
  const [confirm, setConfirm] = useState(null)       // { uid, action: 'approve'|'reject', name }

  useEffect(() => {
    const u1 = onPendingAdmins(setPending)
    const u2 = onAllAdmins(setAdmins)
    const u3 = onSystemStats(setStats)
    return () => { u1(); u2(); u3() }
  }, [])

  async function handleAction() {
    if (!confirm) return
    try {
      if (confirm.action === 'approve') {
        await approveAdmin(confirm.uid)
        showToast(`✓ ${confirm.name} approved`)
      } else {
        await rejectAdmin(confirm.uid)
        showToast(`${confirm.name} rejected`, 'info')
      }
    } catch {
      showToast('Action failed', 'err')
    }
    setConfirm(null)
  }

  async function handleLogout() { await signOut(); clearUser() }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar
        left={
          <>
            <LogoMark size={32} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>
                Editor Friend
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>Master Admin</div>
            </div>
            <Tag children="MASTER ADMIN" color="var(--silver)" />
          </>
        }
        right={
          <Btn variant="ghost" size="sm" onClick={handleLogout}>Logout</Btn>
        }
      />

      <div style={{ flex: 1, maxWidth: 1100, margin: '0 auto', padding: '28px 24px', width: '100%' }}>

        {/* ── Stats ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 32 }} className="anim-up">
            <StatCard icon="🏢" label="Total Admins"   value={stats.totalAdmins}   color="var(--silver)" />
            <StatCard icon="✅" label="Active Admins"  value={stats.activeAdmins}  color="var(--green)" />
            <StatCard icon="⏳" label="Pending"        value={stats.pendingAdmins} color="var(--amber)" />
            <StatCard icon="✏️" label="Total Editors"  value={stats.totalEditors}  color="var(--t2)" />
            <StatCard icon="👤" label="Total Clients"  value={stats.totalClients}  color="var(--t2)" />
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {[['pending', `Pending (${pending.length})`], ['all', 'All Admins'], ['overview', 'System Overview']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: tab === key ? 'var(--surface2)' : 'none',
              color: tab === key ? 'var(--t1)' : 'var(--t3)',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Pending Approvals ── */}
        {tab === 'pending' && (
          <div className="anim-in">
            {pending.length === 0 ? (
              <Empty icon="✅" title="No Pending Requests" sub="All admin applications have been reviewed." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pending.map((admin, i) => (
                  <AdminCard
                    key={admin.id}
                    admin={admin}
                    index={i}
                    onApprove={() => setConfirm({ uid: admin.id, action: 'approve', name: admin.name })}
                    onReject={()  => setConfirm({ uid: admin.id, action: 'reject',  name: admin.name })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── All Admins ── */}
        {tab === 'all' && (
          <div className="anim-in">
            <SectionHeader title="All Admins" count={admins.length} />
            {admins.length === 0 ? (
              <Empty icon="🏢" title="No Admins" sub="No admins have registered yet." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {admins.map((admin, i) => (
                  <AdminCard
                    key={admin.id}
                    admin={admin}
                    index={i}
                    onApprove={admin.status !== 'active'  ? () => setConfirm({ uid: admin.id, action: 'approve', name: admin.name }) : null}
                    onReject={admin.status  !== 'rejected' ? () => setConfirm({ uid: admin.id, action: 'reject',  name: admin.name }) : null}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── System Overview ── */}
        {tab === 'overview' && (
          <div className="anim-in">
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 24,
            }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 20, color: 'var(--t1)' }}>
                Platform Overview
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <OverviewRow label="Registered Admins" value={stats?.totalAdmins ?? '—'} />
                <OverviewRow label="Active Admins"  value={stats?.activeAdmins ?? '—'} color="var(--green)" />
                <OverviewRow label="Pending Approvals" value={stats?.pendingAdmins ?? '—'} color="var(--amber)" />
                <OverviewRow label="Total Editors" value={stats?.totalEditors ?? '—'} />
                <OverviewRow label="Total Clients" value={stats?.totalClients ?? '—'} />
              </div>
              <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.8 }}>
                  As Master Admin, you have full control over all platform data. Approve or reject admin registrations to control who can use the platform.
                  Admins operate independently with their own editors, clients, and task data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.action === 'approve' ? 'Approve Admin' : 'Reject Admin'}
          message={`Are you sure you want to ${confirm.action} ${confirm.name}'s account?`}
          onConfirm={handleAction}
          onCancel={() => setConfirm(null)}
          confirmLabel={confirm.action === 'approve' ? 'Approve' : 'Reject'}
          danger={confirm.action === 'reject'}
        />
      )}
    </div>
  )
}

function AdminCard({ admin, index, onApprove, onReject }) {
  const createdAt = admin.createdAt?.toDate?.()
  return (
    <div
      className="anim-up"
      style={{
        animationDelay: `${index * 35}ms`,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <Avatar name={admin.name} photoURL={admin.photoURL} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>{admin.name}</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 1 }}>{admin.email}</div>
        {admin.businessName && (
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>🏢 {admin.businessName}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <StatusBadge status={admin.status} />
        {createdAt && (
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>
            {format(createdAt, 'd MMM yyyy')}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {onApprove && (
          <Btn variant="success" size="sm" onClick={onApprove}>Approve</Btn>
        )}
        {onReject && (
          <Btn variant="danger" size="sm" onClick={onReject}>Reject</Btn>
        )}
      </div>
    </div>
  )
}

function OverviewRow({ label, value, color = 'var(--t1)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--t2)' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'Syne, sans-serif' }}>{value}</span>
    </div>
  )
}
