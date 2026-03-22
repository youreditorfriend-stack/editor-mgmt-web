import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, signInWithGoogle } from '../../services'
import { useAuthStore } from '../../store'
import { Btn, Input, Spinner, LogoMark, showToast } from '../../components/shared/UI'

export default function AuthPage({ mode = 'login' }) {
  const [tab, setTab]           = useState(mode) // 'login' | 'signup'
  const [loading, setLoading]   = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [error, setError]       = useState('')
  const navigate   = useNavigate()
  const setUser    = useAuthStore(s => s.setUser)

  // Login fields
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [showP, setShowP]   = useState(false)

  // Signup fields
  const [name,     setName]     = useState('')
  const [sEmail,   setSEmail]   = useState('')
  const [sPass,    setSPass]    = useState('')
  const [sPassC,   setSPassC]   = useState('')
  const [bizName,  setBizName]  = useState('')

  function redirectUser(user) {
    if (user.role === 'master_admin') navigate('/master', { replace: true })
    else if (user.role === 'admin')  navigate('/admin',  { replace: true })
    else if (user.role === 'editor') navigate('/editor', { replace: true })
    else if (user.role === 'client') navigate('/client', { replace: true })
    else navigate('/login', { replace: true })
  }

  function friendlyError(msg) {
    if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
      return 'Email or password is incorrect.'
    if (msg.includes('email-already-in-use')) return 'This email is already registered.'
    if (msg.includes('too-many-requests'))    return 'Too many attempts. Please wait a moment.'
    if (msg.includes('account-pending'))      return 'Your account is pending approval by the Master Admin.'
    if (msg.includes('account-rejected'))     return 'Your account has been rejected. Contact support.'
    if (msg.includes('account-not-found'))    return 'No account found. Please sign up first.'
    if (msg.includes('weak-password'))        return 'Password must be at least 6 characters.'
    if (msg.includes('network'))              return 'No internet connection. Please try again.'
    return 'Something went wrong. Please try again.'
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !pass) return
    setError(''); setLoading(true)
    try {
      const user = await signIn(email, pass)
      setUser(user)
      redirectUser(user)
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (!name || !sEmail || !sPass) return
    if (sPass !== sPassC) { setError('Passwords do not match.'); return }
    if (sPass.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    try {
      const user = await signUp(sEmail, sPass, { name, role: 'admin', businessName: bizName })
      if (user.status === 'pending') {
        showToast('Application submitted! Awaiting Master Admin approval.', 'info')
        setTab('login')
        setSEmail(''); setSPass(''); setSPassC(''); setName(''); setBizName('')
      } else {
        setUser(user)
        redirectUser(user)
      }
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(''); setGLoading(true)
    try {
      const user = await signInWithGoogle()
      setUser(user)
      redirectUser(user)
    } catch (err) {
      if (err.message.includes('account-pending')) {
        showToast('Application submitted! Awaiting Master Admin approval.', 'info')
      } else {
        setError(friendlyError(err.message))
      }
    } finally {
      setGLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      background: 'radial-gradient(ellipse at 20% 20%, rgba(200,200,200,0.03) 0%, transparent 60%), var(--bg)',
    }}>
      {/* Ambient grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }} className="anim-up">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <LogoMark size={38} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
              Editor Friend
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Platform Management</div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 18, padding: '28px 28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--surface2)',
            borderRadius: 10, padding: 4, marginBottom: 28,
            border: '1px solid var(--border)',
          }}>
            {[['login', 'Sign In'], ['signup', 'Register']].map(([key, label]) => (
              <button key={key} onClick={() => { setTab(key); setError('') }} style={{
                flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                background: tab === key ? 'var(--surface3)' : 'none',
                color: tab === key ? 'var(--t1)' : 'var(--t3)',
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: tab === key ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Email" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showP ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pass} onChange={e => setPass(e.target.value)} required
                    style={{
                      width: '100%', fontFamily: 'Inter, sans-serif', fontSize: 13,
                      padding: '10px 44px 10px 12px',
                      border: '1px solid var(--border2)', borderRadius: 9,
                      background: 'rgba(255,255,255,0.04)', color: 'var(--t1)', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.05)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                  />
                  <button type="button" onClick={() => setShowP(!showP)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--t3)', fontSize: 11, fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                  }}>{showP ? 'Hide' : 'Show'}</button>
                </div>
              </div>

              {error && <ErrorMsg msg={error} />}

              <Btn type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
                Sign In
              </Btn>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Full Name" placeholder="Your name"
                value={name} onChange={e => setName(e.target.value)} required />
              <Input label="Business / Studio Name" placeholder="Optional"
                value={bizName} onChange={e => setBizName(e.target.value)} />
              <Input label="Email" type="email" placeholder="you@example.com"
                value={sEmail} onChange={e => setSEmail(e.target.value)} required />
              <Input label="Password" type="password" placeholder="Min. 6 characters"
                value={sPass} onChange={e => setSPass(e.target.value)} required />
              <Input label="Confirm Password" type="password" placeholder="Repeat password"
                value={sPassC} onChange={e => setSPassC(e.target.value)} required />

              {error && <ErrorMsg msg={error} />}

              <div style={{
                padding: '10px 12px', background: 'rgba(245,158,11,0.08)',
                border: '1px solid var(--amber-border)', borderRadius: 9, marginTop: 2,
              }}>
                <p style={{ fontSize: 11, color: 'var(--amber)', lineHeight: 1.6 }}>
                  ⚠ Admin accounts require Master Admin approval before access is granted.
                </p>
              </div>

              <Btn type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
                Submit Application
              </Btn>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={gLoading}
            style={{
              width: '100%', height: 44, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border2)',
              color: 'var(--t1)', cursor: gLoading ? 'wait' : 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.13s',
            }}
            onMouseEnter={e => { if (!gLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {gLoading ? <Spinner size={16} /> : (
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M43.6 20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L38 8.7C34.4 5.4 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11 0 20-8 20-20.5 0-1.3-.1-2.7-.4-4z"/>
              </svg>
            )}
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 20 }}>
          {tab === 'login'
            ? 'Need access? Ask your admin or register as an owner.'
            : 'Editors & Clients are added by their Admin.'}
        </p>
      </div>
    </div>
  )
}

function ErrorMsg({ msg }) {
  return (
    <div style={{
      padding: '10px 14px', background: 'var(--red-bg)',
      border: '1px solid var(--red-border)', borderRadius: 9,
      fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      ⚠ {msg}
    </div>
  )
}
