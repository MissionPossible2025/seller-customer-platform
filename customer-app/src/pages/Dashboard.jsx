import { useState } from 'react'
import SearchBar from '../components/SearchBar'

export default function Dashboard() {
  const userPayload = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const name = userPayload?.user?.name || 'Customer'
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ marginTop: 0, marginBottom: '0.75rem', color: '#0f172a' }}>Hello, {name}</h1>

        <div style={{ marginBottom: '1rem' }}>
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
        </div>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
          <button 
            style={cardButtonStyle}
            onClick={() => window.location.href = '/products'}
          >
            View Products
          </button>
          <button style={cardButtonStyle}>Your Cart</button>
          <button style={cardButtonStyle}>View Orders</button>
        </div>
      </div>
    </div>
  )
}

const cardButtonStyle = {
  padding: '1.2rem 1rem',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: 'linear-gradient(135deg,#ffffff,#f8fafc)',
  color: '#0f172a',
  fontWeight: 600,
  cursor: 'pointer'
}


