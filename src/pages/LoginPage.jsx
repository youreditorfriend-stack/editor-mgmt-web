import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../services'
import { useAuthStore } from '../store'
import { Btn, Input, Spinner } from '../components/shared/UI'

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
      justifyContent: 'center', padding: 24, background: '#FAFAF9',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-in">
        {/* Logo */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: '#191919',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 32,
        }}>E</div>

        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: '#73726C', marginBottom: 32 }}>
          Sign in to your editor workspace
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              type={show ? 'text' : 'password'}
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              style={{
                position: 'absolute', right: 10, bottom: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#73726C', fontSize: 13,
              }}
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && (
            <div style={{
              background: '#FFF0F0', border: '0.5px solid rgba(235,87,87,0.3)',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#EB5757',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 46, borderRadius: 8,
              background: loading ? '#888' : '#191919',
              color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4,
            }}
          >
            {loading ? <><Spinner size={16} color="#fff" /> Signing in...</> : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#AFAEA9', marginTop: 32 }}>
          Contact your admin if you don't have access.
        </p>
      </div>
    </div>
  )
}
