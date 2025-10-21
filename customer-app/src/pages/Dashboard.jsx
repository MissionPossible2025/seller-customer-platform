import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import UserProfileIcon from '../components/UserProfileIcon'
import ProfileModal from '../components/ProfileModal'

export default function Dashboard() {
  const navigate = useNavigate()
  
  const userPayload = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const name = userPayload?.user?.name || 'Customer'
  const [searchTerm, setSearchTerm] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Handle search functionality
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Navigate to products page with search term
      navigate('/products', { state: { searchTerm: searchTerm.trim() } })
    } else {
      // Navigate to products page without search term
      navigate('/products')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header with Profile Icon */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '600' }}>
              Hello, {name}
            </h1>
            <UserProfileIcon onProfileClick={() => setShowProfileModal(true)} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
        </form>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
          <button 
            style={cardButtonStyle}
            onClick={() => navigate('/products')}
          >
            View Products
          </button>
          <button 
            style={cardButtonStyle}
            onClick={() => navigate('/cart')}
          >
            Your Cart
          </button>
          <button style={cardButtonStyle}>View Orders</button>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
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


