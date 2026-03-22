// ─── Spinner ──────────────────────────────────────────────────────────────

export function Spinner({ size = 18, color = '#0F7B6C' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid #E9E9E7`,
      borderTopColor: color,
      borderRadius: '50%',
      flexShrink: 0,
    }} className="spin" />
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────

export function StatCard({ label, value, icon, color = '#0F7B6C', bg = '#EAF3EB' }) {
  return (
    <div style={{
      background: bg,
      borderRadius: 12,
      padding: '16px 18px',
      flex: 1,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'rgba(255,255,255,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, marginBottom: 10,
      }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#191919', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#73726C', marginTop: 5, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:     { color: '#B98000', bg: '#FFF8E6', dot: '#DFAB01', label: 'Pending' },
  in_progress: { color: '#0052A3', bg: '#E8F0FF', dot: '#0066CC', label: 'In Progress' },
  completed:   { color: '#0A6158', bg: '#EAF3EB', dot: '#0F7B6C', label: 'Completed' },
}

export function StatusBadge({ status, onClick }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <span
      onClick={onClick}
      style={{
        background: s.bg, color: s.color,
        fontSize: 11, fontWeight: 600,
        padding: '4px 9px', borderRadius: 20,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none', whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => onClick && (e.currentTarget.style.opacity = '1')}
    >
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: s.dot, display: 'inline-block', flexShrink: 0,
      }} />
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
    transition: 'all 0.15s',
  }
  const sizes = {
    sm: { fontSize: 12, padding: '7px 13px', height: 32 },
    md: { fontSize: 14, padding: '10px 18px', height: 40 },
  }
  const variants = {
    primary:  { background: '#191919', color: '#fff', boxShadow: 'var(--shadow-sm)' },
    green:    { background: '#0F7B6C', color: '#fff', boxShadow: 'var(--shadow-sm)' },
    ghost:    { background: 'transparent', color: '#73726C', border: '1px solid #E9E9E7' },
    danger:   { background: '#EB5757', color: '#fff', boxShadow: 'var(--shadow-sm)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
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
          border: `1px solid ${error ? '#EB5757' : '#E9E9E7'}`,
          borderRadius: 8,
          background: '#F7F7F5',
          color: '#191919',
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={e => {
          e.target.style.borderColor = '#0F7B6C'
          e.target.style.boxShadow = '0 0 0 3px rgba(15,123,108,0.1)'
          e.target.style.background = '#fff'
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? '#EB5757' : '#E9E9E7'
          e.target.style.boxShadow = 'none'
          e.target.style.background = '#F7F7F5'
        }}
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
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflow: 'auto',
        border: '1px solid #E9E9E7',
        boxShadow: 'var(--shadow-lg)',
      }} className="animate-in">
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #F1F1EF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{
            background: '#F7F7F5', border: 'none', borderRadius: 6,
            cursor: 'pointer', color: '#73726C', fontSize: 14,
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: 20 }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #F1F1EF',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}>
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
    <div style={{ textAlign: 'center', padding: '56px 24px', color: '#73726C' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: '#F1F1EF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, margin: '0 auto 16px',
      }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#191919', marginBottom: 6 }}>{message}</div>
      {sub && <div style={{ fontSize: 13, color: '#AFAEA9', lineHeight: 1.6 }}>{sub}</div>}
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
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    }}>
      {initials}
    </div>
  )
}
