import { useState } from 'react'

export default function AuthPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        padding: '2rem',
        color: '#e5e7eb',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
      }}>
        <h1 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '1.75rem', fontWeight: 700 }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ marginTop: 0, marginBottom: '1.5rem', color: '#cbd5e1' }}>
          {mode === 'signin' ? 'Sign in to continue' : 'Sign up to get started'}
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            setLoading(true)
            try {
              const form = new FormData(e.currentTarget)
              const email = form.get('email')
              const password = form.get('password')
              const name = form.get('name')
              const uniqueCode = form.get('uniqueCode')

              if (mode === 'signup') {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, email, password, uniqueCode })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Signup failed')
                // After successful signup, allow entry
                localStorage.setItem('user', JSON.stringify(data))
                window.location.href = '/dashboard'
              } else {
                // Sign in: allow email-only for customers if no password provided, include name
                const body = password ? { email, password, name } : { email, name }
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Sign in failed')
                localStorage.setItem('user', JSON.stringify(data))
                window.location.href = '/dashboard'
              }
            } catch (err) {
              setError(err.message)
            } finally {
              setLoading(false)
            }
          }}
          style={{ display: 'grid', gap: '0.85rem' }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5e1' }}>Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Jane Doe"
              style={inputStyle}
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5e1' }}>Unique Code</label>
              <input
                name="uniqueCode"
                type="text"
                required
                placeholder="Enter unique code"
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5e1' }}>Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5e1' }}>Password</label>
            <input
              name="password"
              type="password"
              required={mode === 'signup'}
              placeholder={mode === 'signin' ? 'Your password' : 'Create a strong password'}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ color: '#fca5a5', fontSize: '0.95rem' }}>{error}</div>
          )}

          <button type="submit" style={primaryButtonStyle}>
            {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating...') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '1rem', fontSize: '0.95rem', color: '#cbd5e1' }}>
          {mode === 'signin' ? (
            <>Don't have an account?{' '}
              <button onClick={() => setMode('signup')} style={linkButtonStyle}>Sign Up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setMode('signin')} style={linkButtonStyle}>Sign In</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.18)',
  backgroundColor: 'rgba(15,23,42,0.55)',
  color: '#e5e7eb',
  outline: 'none',
}

const primaryButtonStyle = {
  marginTop: '0.5rem',
  width: '100%',
  padding: '0.9rem 1rem',
  borderRadius: '10px',
  border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#22d3ee)',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
}

const linkButtonStyle = {
  background: 'transparent',
  color: '#60a5fa',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: 0,
}


