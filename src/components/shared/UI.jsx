// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, color = 'var(--silver)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: color,
      flexShrink: 0,
    }} className="spin" />
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, loading, style = {}, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: 0.1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    border: 'none', borderRadius: 9,
    transition: 'all 0.13s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }
  const sizes = {
    sm: { fontSize: 12, padding: '6px 14px', height: 32 },
    md: { fontSize: 13, padding: '9px 20px', height: 40 },
    lg: { fontSize: 14, padding: '11px 28px', height: 46 },
  }
  const variants = {
    primary: {
      background: '#f2f2f2',
      color: '#0a0a0a',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.07)',
      color: 'var(--t1)',
      border: '1px solid var(--border2)',
    },
    ghost: {
      background: 'none',
      color: 'var(--t2)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--red-bg)',
      color: 'var(--red)',
      border: '1px solid var(--red-border)',
    },
    success: {
      background: 'var(--green-bg)',
      color: 'var(--green)',
      border: '1px solid var(--green-border)',
    },
    silver: {
      background: 'rgba(200,200,200,0.12)',
      color: 'var(--silver)',
      border: '1px solid rgba(200,200,200,0.2)',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? '0.45' : '1'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading ? <Spinner size={14} color={variant === 'primary' ? '#333' : 'var(--silver)'} /> : null}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, icon, type = 'text', style = {}, inputStyle = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: 14, pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          style={{
            width: '100%', fontFamily: 'Inter, sans-serif', fontSize: 13,
            padding: icon ? '10px 12px 10px 36px' : '10px 12px',
            border: `1px solid ${error ? 'var(--red-border)' : 'var(--border2)'}`,
            borderRadius: 9, background: 'rgba(255,255,255,0.04)',
            color: 'var(--t1)', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
            ...inputStyle,
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.3)'
            e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.05)'
            e.target.style.background = 'rgba(255,255,255,0.06)'
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? 'var(--red-border)' : 'var(--border2)'
            e.target.style.boxShadow = 'none'
            e.target.style.background = 'rgba(255,255,255,0.04)'
          }}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{hint}</span>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7 }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%', fontFamily: 'Inter, sans-serif', fontSize: 13,
          padding: '10px 12px',
          border: `1px solid ${error ? 'var(--red-border)' : 'var(--border2)'}`,
          borderRadius: 9, background: 'rgba(255,255,255,0.04)',
          color: 'var(--t1)', outline: 'none', cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, footer, width = 480 }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="anim-scale"
        style={{
          width: '100%', maxWidth: width, maxHeight: '90vh',
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Inter, sans-serif' }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--t2)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--t1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--t2)' }}
          >✕</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '14px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, hoverable = false }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      style={{
        background: hov && hoverable ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hov && hoverable ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 14,
        transition: 'all 0.15s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'var(--silver)', sub, trend }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 22px',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'var(--surface3)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>{icon}</div>
        {trend !== undefined && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: trend >= 0 ? 'var(--green)' : 'var(--red)',
            background: trend >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${trend >= 0 ? 'var(--green-border)' : 'var(--red-border)'}`,
            padding: '2px 8px', borderRadius: 10,
          }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: 'Inter, sans-serif', lineHeight: 1, marginBottom: 5 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:     { label: 'Pending',     color: 'var(--amber)',  bg: 'var(--amber-bg)',  border: 'var(--amber-border)' },
  in_progress: { label: 'In Progress', color: 'var(--blue)',   bg: 'var(--blue-bg)',   border: 'var(--blue-border)' },
  completed:   { label: 'Completed',   color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)' },
  active:      { label: 'Active',      color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)' },
  approved:    { label: 'Approved',    color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)' },
  rejected:    { label: 'Rejected',    color: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)' },
}

export function StatusBadge({ status, onClick }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
        padding: '3px 10px', borderRadius: 20,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none', whiteSpace: 'nowrap',
        transition: 'opacity 0.12s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.opacity = '0.75')}
      onMouseLeave={e => onClick && (e.currentTarget.style.opacity = '1')}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AV_COLORS = ['#c8c8c8','#a0a0a0','#808080','#707070','#606060']

export function Avatar({ name = '', size = 36, photoURL }) {
  const initials = name.trim().split(' ').slice(0, 2).map(s => s[0] ?? '').join('').toUpperCase() || '?'
  const idx = name.charCodeAt(0) % AV_COLORS.length || 0

  if (photoURL) return (
    <img src={photoURL} alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border2)' }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${AV_COLORS[idx]}18`,
      border: `2px solid ${AV_COLORS[idx]}44`,
      color: AV_COLORS[idx], fontWeight: 700, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontFamily: 'Inter, sans-serif',
    }}>
      {initials}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{
        width: 60, height: 60, borderRadius: 18,
        background: 'var(--surface2)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, margin: '0 auto 18px',
      }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 7, fontFamily: 'Inter, sans-serif' }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 20 }}>{sub}</div>}
      {action}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let _tt = null
export function showToast(msg, type = 'ok') {
  let el = document.getElementById('__toast__')
  if (!el) {
    el = document.createElement('div')
    el.id = '__toast__'
    document.body.appendChild(el)
    Object.assign(el.style, {
      position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
      fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '500',
      padding: '10px 16px', borderRadius: '10px',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      pointerEvents: 'none', transform: 'translateY(60px)', opacity: '0',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    })
  }
  el.textContent = msg
  const styles = {
    ok:   { bg: 'rgba(34,197,94,0.15)',  border: '1px solid rgba(34,197,94,0.25)',  color: '#4ade80' },
    err:  { bg: 'rgba(239,68,68,0.15)',  border: '1px solid rgba(239,68,68,0.25)',  color: '#f87171' },
    info: { bg: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#e0e0e0' },
  }
  const s = styles[type] || styles.info
  el.style.background = s.bg; el.style.border = s.border; el.style.color = s.color
  el.style.transform = 'translateY(0)'; el.style.opacity = '1'
  clearTimeout(_tt)
  _tt = setTimeout(() => { el.style.transform = 'translateY(60px)'; el.style.opacity = '0' }, 3000)
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  return (
    <Modal title={title} onClose={onCancel} width={400}
      footer={<>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Btn>
      </>}
    >
      <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7 }}>{message}</p>
    </Modal>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, count, action, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Inter, sans-serif' }}>{title}</h2>
          {count !== undefined && (
            <span style={{
              fontSize: 10, background: 'var(--surface3)', color: 'var(--t3)',
              padding: '2px 8px', borderRadius: 10, fontWeight: 600,
              border: '1px solid var(--border)',
            }}>{count}</span>
          )}
        </div>
        {sub && <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'var(--silver)', showPct = true }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, height: 5, background: 'var(--surface3)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>
      {showPct && <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600, minWidth: 32 }}>{pct}%</span>}
    </div>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
export function Topbar({ left, right, border = true }) {
  return (
    <div style={{
      height: 56, padding: '0 24px',
      background: 'rgba(8,8,8,0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: border ? '1px solid var(--border)' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{left}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
    </div>
  )
}

// ─── Logo Mark ────────────────────────────────────────────────────────────────
export function LogoMark({ size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: 'linear-gradient(135deg, #e0e0e0, #888)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#0a0a0a', fontSize: size * 0.38, fontWeight: 800,
      fontFamily: 'Inter, sans-serif', flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    }}>EF</div>
  )
}

// ─── Tag / Chip ───────────────────────────────────────────────────────────────
export function Tag({ children, color = 'var(--t2)' }) {
  return (
    <span style={{
      fontSize: 10, color, background: 'var(--surface3)',
      border: '1px solid var(--border)', borderRadius: 6,
      padding: '2px 8px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

// Need React import for useState
import { useState } from 'react'
