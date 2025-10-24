import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import UserProfileIcon from '../components/UserProfileIcon'
import ProfileModal from '../components/ProfileModal'
import { useCart } from '../hooks/useCart'
import { getCurrentUser, getUserId } from '../utils/userUtils'

export default function Dashboard() {
  const navigate = useNavigate()
  
  const userPayload = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const name = userPayload?.user?.name || userPayload?.customer?.name || 'Customer'
  const [searchTerm, setSearchTerm] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { cartItemCount, fetchCartCount } = useCart()

  // Debug user data
  useEffect(() => {
    const user = getCurrentUser()
    const userId = getUserId(user)
    console.log('Dashboard: User data:', user)
    console.log('Dashboard: User ID:', userId)
  }, [])


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

  // Load cart count on component mount
  useEffect(() => {
    fetchCartCount()
  }, [])

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span>Your Cart</span>
              {cartItemCount > 0 && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {cartItemCount}
                </span>
              )}
            </div>
          </button>
          <button style={cardButtonStyle}>View Orders</button>
        </div>

        {/* Debug Section - Remove this in production */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#f8f9fa', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6' 
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Debug Info</h3>
          <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
            <div><strong>User Data:</strong> {JSON.stringify(getCurrentUser(), null, 2)}</div>
            <div style={{ marginTop: '0.5rem' }}><strong>User ID:</strong> {getUserId(getCurrentUser())}</div>
            <div style={{ marginTop: '0.5rem' }}><strong>Cart Count:</strong> {cartItemCount}</div>
          </div>
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


