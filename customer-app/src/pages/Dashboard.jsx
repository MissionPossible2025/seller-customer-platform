import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import UserProfileIcon from '../components/UserProfileIcon'
import ProfileModal from '../components/ProfileModal'
import Sidebar from '../components/Sidebar'
import ProductsList from '../components/ProductsList'
import { useCart } from '../hooks/useCart'
import { getCurrentUser, getUserId } from '../utils/userUtils'
import dreamSyncLogo from '../assets/dreamsync-logo.svg'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { fetchCartCount } = useCart()



  // Load cart count on component mount
  useEffect(() => {
    fetchCartCount()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header with Profile Icon, Menu Button, and Search Bar */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Menu/Dashboard Icon Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6'
                  e.target.style.borderColor = '#cbd5e1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.borderColor = '#e5e7eb'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>☰</span>
              </button>
              <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '600' }}>
                Hello, {name}
              </h1>
            </div>
            <UserProfileIcon onProfileClick={() => setShowProfileModal(true)} />
          </div>
          
          {/* Search Bar */}
          <div>
            <SearchBar 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search products..."
            />
          </div>
        </div>
      </div>

      {/* Products List */}
      <div style={{ flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
          <ProductsList searchTerm={searchTerm} />
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#f1f5f9', padding: '1.5rem 0', marginTop: 'auto' }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          textAlign: 'center'
        }}>
          <img
            src={dreamSyncLogo}
            alt="DreamSync Creations logo"
            style={{ height: '52px', width: 'auto' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
              DreamSync Creations
            </span>
            <a 
              href="mailto:dreamsynccreations@gmail.com"
              style={{ 
                fontSize: '0.9rem', 
                color: '#3b82f6', 
                textDecoration: 'none',
                fontWeight: 500
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              dreamsynccreations@gmail.com
            </a>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </div>
  )
}


