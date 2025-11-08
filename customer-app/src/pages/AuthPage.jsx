import { useState } from 'react'

export default function AuthPage() {
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
          Access Store App
        </h1>
        <p style={{ marginTop: 0, marginBottom: '1.5rem', color: '#cbd5e1' }}>
          Enter your details to access the store
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            setLoading(true)
            try {
              const form = new FormData(e.currentTarget)
              const phone = form.get('phone')
              const name = form.get('name')

              // Check if phone number is permitted by seller
              const checkRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
              })
              const checkData = await checkRes.json()
              
              if (!checkRes.ok) {
                throw new Error('Your phone number is not registered. Please contact the store owner to get access.')
              }

              // Check if it's been more than 3 months since last login
              const lastLogin = localStorage.getItem('lastLogin')
              if (lastLogin) {
                const lastLoginDate = new Date(lastLogin)
                const threeMonthsAgo = new Date()
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
                
                if (lastLoginDate < threeMonthsAgo) {
                  throw new Error('Your session has expired. Please contact the store owner to renew your access.')
                }
              }

              // Access the app (same as login/signup)
              const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, name })
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error || 'Access failed')
              
              localStorage.setItem('user', JSON.stringify(data))
              localStorage.setItem('lastLogin', new Date().toISOString())
              window.location.href = '/dashboard'
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
              placeholder="Enter your name"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5e1' }}>Phone Number</label>
            <input
              name="phone"
              type="tel"
              required
              placeholder="Enter your phone number"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ 
              color: '#fca5a5', 
              fontSize: '0.95rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(252, 165, 165, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(252, 165, 165, 0.2)'
            }}>
              {error}
            </div>
          )}

          <button type="submit" style={primaryButtonStyle}>
            {loading ? 'Accessing...' : 'Access Store'}
          </button>
        </form>

        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#93c5fd' }}>
            <strong>Note:</strong> Only phone numbers registered by the store owner can access this app. 
            If you can't access, please contact the store owner to get access.
          </p>
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


