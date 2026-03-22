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
      justifyContent: 'center', padding: 24, background: '#F5F5F3',
      backgroundImage: 'radial-gradient(ellipse at 60% 0%, #EAF3EB 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-in">
        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E9E9E7',
          boxShadow: 'var(--shadow-lg)',
          padding: '36px 32px',
        }}>
          {/* Logo */}
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #1A1A1A 0%, #3D3D3D 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>E</div>

          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#191919' }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#73726C', marginBottom: 28 }}>
            Sign in to your editor workspace
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#73726C', fontWeight: 500 }}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#0F7B6C'; e.target.style.boxShadow = '0 0 0 3px rgba(15,123,108,0.1)'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#E9E9E7'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F7F7F5' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#73726C', fontWeight: 500 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 56 }}
                  onFocus={e => { e.target.style.borderColor = '#0F7B6C'; e.target.style.boxShadow = '0 0 0 3px rgba(15,123,108,0.1)'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = '#E9E9E7'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F7F7F5' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#73726C', fontSize: 12, fontWeight: 500,
                    fontFamily: 'DM Sans, sans-serif', padding: '2px 4px',
                  }}
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#FFF0F0', border: '1px solid rgba(235,87,87,0.25)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: '#EB5757',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ flexShrink: 0 }}>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 44, borderRadius: 8, marginTop: 4,
                background: loading ? '#888' : '#191919',
                color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : 'var(--shadow-sm)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.87' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {loading ? <><Spinner size={16} color="#fff" /> Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#AFAEA9', marginTop: 20 }}>
          Contact your admin if you don't have access.
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  padding: '10px 12px',
  border: '1px solid #E9E9E7',
  borderRadius: 8,
  background: '#F7F7F5',
  color: '#191919',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
}
