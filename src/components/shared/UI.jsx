// ─── Spinner ──────────────────────────────────────────────────────────────

export function Spinner({ size = 18, color = '#0F7B6C' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid #E9E9E7`,
      borderTopColor: color,
      borderRadius: '50%',
    }} className="spin" />
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────

export function StatCard({ label, value, icon, color = '#0F7B6C', bg = '#EAF3EB' }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: 16, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#191919', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#73726C', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:     { color: '#DFAB01', bg: '#FFF8E6', label: 'Pending' },
  in_progress: { color: '#0066CC', bg: '#E8F0FF', label: 'In Progress' },
  completed:   { color: '#0F7B6C', bg: '#EAF3EB', label: 'Completed' },
}

export function StatusBadge({ status, onClick }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <span
      onClick={onClick}
      style={{
        background: s.bg, color: s.color,
        fontSize: 11, fontWeight: 500,
        padding: '3px 8px', borderRadius: 4,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style = {} }) {
  const base = {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 500,
    borderRadius: 8,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'opacity 0.15s',
  }
  const sizes = { sm: { fontSize: 12, padding: '6px 12px' }, md: { fontSize: 14, padding: '10px 18px' } }
  const variants = {
    primary:  { background: '#191919', color: '#fff' },
    green:    { background: '#0F7B6C', color: '#fff' },
    ghost:    { background: 'transparent', color: '#73726C', border: '0.5px solid #E9E9E7' },
    danger:   { background: '#EB5757', color: '#fff' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, color: '#73726C', fontWeight: 500 }}>{label}</label>}
      <input
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          padding: '10px 12px',
          border: `0.5px solid ${error ? '#EB5757' : '#E9E9E7'}`,
          borderRadius: 8,
          background: '#F7F7F5',
          color: '#191919',
          outline: 'none',
          width: '100%',
        }}
        onFocus={e => e.target.style.borderColor = '#0F7B6C'}
        onBlur={e => e.target.style.borderColor = error ? '#EB5757' : '#E9E9E7'}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: '#EB5757' }}>{error}</span>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────

export function Modal({ title, children, onClose, footer }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflow: 'auto',
        border: '0.5px solid #E9E9E7',
      }} className="animate-in">
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #E9E9E7',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none',
              cursor: 'pointer', color: '#73726C', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: 20 }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{ padding: '12px 20px', borderTop: '0.5px solid #E9E9E7',
              display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────

export function Empty({ icon = '📭', message, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#73726C' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#191919' }}>{message}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#0F7B6C','#0066CC','#9333EA','#DFAB01','#EB5757','#0891B2']

export function Avatar({ name = '', index = 0, size = 36 }) {
  const initials = name.split(' ').slice(0, 2).map(s => s[0] ?? '').join('').toUpperCase()
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}
