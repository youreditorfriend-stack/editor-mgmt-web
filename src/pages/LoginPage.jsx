import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../services'
import { useAuthStore } from '../store'
import { Spinner } from '../components/shared/UI'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [show, setShow]   = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !pass) return
    setLoading(true); setError('')
    try {
      const user = await signIn(email, pass)
      if (!user) throw new Error('User not found')
      setUser(user)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  function friendlyError(msg) {
    if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
      return 'Email or password is incorrect.'
    if (msg.includes('too-many-requests')) return 'Too many attempts. Please wait.'
    if (msg.includes('network')) return 'No internet connection.'
    return 'Something went wrong. Please try again.'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-in">

        {/* Card */}
        <div style={{
          background: 'rgba(17,17,32,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 20,
          border: '1px solid rgba(109,95,239,0.2)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(109,95,239,0.08)',
          padding: '36px 32px',
        }}>
          {/* Logo */}
          <div style={{
            width: 46, height: 46, borderRadius: 13,
            background: 'linear-gradient(135deg, #6d5fef, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            marginBottom: 28,
            boxShadow: '0 4px 16px rgba(109,95,239,0.4)',
          }}>YEF</div>

          <h1 style={{
            fontSize: 22, fontWeight: 800, marginBottom: 6,
            color: 'var(--t1)', fontFamily: 'Syne, sans-serif',
          }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 28 }}>
            Sign in to your editor workspace
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(109,95,239,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(109,95,239,0.1)'; e.target.style.background = 'rgba(109,95,239,0.06)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 56 }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(109,95,239,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(109,95,239,0.1)'; e.target.style.background = 'rgba(109,95,239,0.06)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--t2)', fontSize: 11, fontWeight: 500,
                    fontFamily: 'DM Sans, sans-serif', padding: '2px 4px',
                  }}
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 9, padding: '10px 14px',
                fontSize: 12, color: '#fca5a5',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 44, borderRadius: 10, marginTop: 4,
                background: loading ? 'rgba(109,95,239,0.4)' : 'linear-gradient(135deg, #6d5fef, #8b7cf8)',
                color: '#fff', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700,
                fontFamily: 'DM Sans, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(109,95,239,0.4)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading ? <><Spinner size={16} color="#fff" /> Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 20 }}>
          Contact your admin if you don't have access.
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 13,
  padding: '10px 12px',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 9,
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--t1)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
}
