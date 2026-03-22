// ─── Spinner ──────────────────────────────────────────────────────────────

export function Spinner({ size = 18, color = '#6d5fef' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: color,
      borderRadius: '50%',
      flexShrink: 0,
    }} className="spin" />
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────

export function StatCard({ label, value, icon, color = '#a89ff5', accent }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(17,17,32,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '16px 18px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: accent || 'rgba(109,95,239,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, marginBottom: 10, flexShrink: 0,
      }}>{icon}</div>
      <div style={{
        fontSize: 24, fontWeight: 700, color, lineHeight: 1,
        fontFamily: 'Syne, DM Sans, sans-serif',
      }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:     { color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b', border: 'rgba(245,158,11,0.2)', label: 'Pending' },
  in_progress: { color: '#67e8f9', bg: 'rgba(34,211,238,0.12)', dot: '#22d3ee', border: 'rgba(34,211,238,0.2)', label: 'In Progress' },
  completed:   { color: '#34d399', bg: 'rgba(16,185,129,0.12)', dot: '#10b981', border: 'rgba(16,185,129,0.2)', label: 'Completed' },
}

export function StatusBadge({ status, onClick }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <span
      onClick={onClick}
      style={{
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 10, fontWeight: 600,
        padding: '3px 9px', borderRadius: 20,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none', whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        transition: 'opacity 0.15s, transform 0.1s',
        letterSpacing: 0.3,
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
    fontWeight: 600,
    borderRadius: 9,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'all 0.15s',
    letterSpacing: 0.1,
  }
  const sizes = {
    sm: { fontSize: 11, padding: '6px 12px', height: 30 },
    md: { fontSize: 13, padding: '9px 18px', height: 38 },
  }
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #6d5fef, #8b7cf8)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(109,95,239,0.35)',
    },
    green: {
      background: 'rgba(16,185,129,0.15)',
      color: '#34d399',
      border: '1px solid rgba(16,185,129,0.25)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.04)',
      color: 'var(--t2)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'rgba(239,68,68,0.12)',
      color: '#fca5a5',
      border: '1px solid rgba(239,68,68,0.2)',
    },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' } }}
    >
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </label>
      )}
      <input
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          padding: '10px 12px',
          border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 9,
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--t1)',
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'rgba(109,95,239,0.5)'
          e.target.style.boxShadow = '0 0 0 3px rgba(109,95,239,0.1)'
          e.target.style.background = 'rgba(109,95,239,0.06)'
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'
          e.target.style.boxShadow = 'none'
          e.target.style.background = 'rgba(255,255,255,0.04)'
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: '#fca5a5' }}>{error}</span>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────

export function Modal({ title, children, onClose, footer }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'rgba(14,14,26,0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(109,95,239,0.2)',
        borderRadius: 16,
        width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(109,95,239,0.1)',
      }} className="animate-in">
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Syne, sans-serif' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: 7, cursor: 'pointer', color: 'var(--t2)', fontSize: 13,
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--t1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--t2)' }}
          >✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: 20 }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
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
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'rgba(109,95,239,0.1)',
        border: '1px solid rgba(109,95,239,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, margin: '0 auto 16px',
      }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>{message}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>{sub}</div>}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6d5fef','#22d3ee','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#0891b2']

export function Avatar({ name = '', index = 0, size = 36 }) {
  const initials = name.split(' ').slice(0, 2).map(s => s[0] ?? '').join('').toUpperCase()
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg + '22',
      border: `2px solid ${bg}55`,
      color: bg, fontWeight: 700, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33,
    }}>
      {initials}
    </div>
  )
}

// ─── CodeBadge ────────────────────────────────────────────────────────────

export function CodeBadge({ code, onCopy }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(109,95,239,0.1)',
      border: '1px solid rgba(109,95,239,0.2)',
      borderRadius: 8, padding: '4px 10px',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#a89ff5', fontWeight: 700, letterSpacing: 1 }}>
        {code}
      </span>
      {onCopy && (
        <button
          onClick={onCopy}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--t2)', fontSize: 10, padding: '1px 4px',
            borderRadius: 4, fontFamily: 'DM Sans, sans-serif',
            transition: 'color 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#a89ff5'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--t2)'}
          title="Copy code"
        >
          copy
        </button>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────

let _toastTimeout = null
export function showToast(msg, type = 'ok') {
  let el = document.getElementById('__app-toast__')
  if (!el) {
    el = document.createElement('div')
    el.id = '__app-toast__'
    document.body.appendChild(el)
    Object.assign(el.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '9999',
      fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
      padding: '9px 14px', borderRadius: '10px',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      pointerEvents: 'none', transform: 'translateY(60px)', opacity: '0',
    })
  }
  el.textContent = msg
  if (type === 'err') {
    el.style.background = 'rgba(239,68,68,0.12)'
    el.style.border = '1px solid rgba(239,68,68,0.25)'
    el.style.color = '#fca5a5'
  } else {
    el.style.background = 'rgba(16,185,129,0.12)'
    el.style.border = '1px solid rgba(16,185,129,0.25)'
    el.style.color = '#34d399'
  }
  el.style.transform = 'translateY(0)'
  el.style.opacity = '1'
  clearTimeout(_toastTimeout)
  _toastTimeout = setTimeout(() => {
    el.style.transform = 'translateY(60px)'
    el.style.opacity = '0'
  }, 2400)
}
