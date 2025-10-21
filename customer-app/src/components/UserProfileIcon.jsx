import { useState, useEffect } from 'react'

export default function UserProfileIcon({ onProfileClick }) {
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser.user || parsedUser)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/auth'
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
  }

  const getProfileStatus = () => {
    if (!user) return { complete: false, message: 'Profile incomplete' }
    
    const hasRequiredFields = user.name && user.phone && 
      user.address?.street && user.address?.city && 
      user.address?.state && user.address?.pincode
    
    return {
      complete: hasRequiredFields,
      message: hasRequiredFields ? 'Profile complete' : 'Complete your profile'
    }
  }

  const profileStatus = getProfileStatus()

  return (
    <div style={{ position: 'relative' }}>
      {/* Profile Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          background: profileStatus.complete 
            ? 'linear-gradient(135deg, #10b981, #059669)' 
            : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
        }}
      >
        {getInitials(user?.name)}
        
        {/* Status indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: profileStatus.complete ? '#10b981' : '#f59e0b',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'white'
            }}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div
            style={{
              position: 'absolute',
              top: '50px',
              right: '0',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              minWidth: '280px',
              zIndex: 20,
              overflow: 'hidden'
            }}
          >
            {/* User Info Header */}
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '0.25rem'
              }}>
                {user?.name || 'User'}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '0.5rem'
              }}>
                {user?.email || 'user@example.com'}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '12px',
                color: profileStatus.complete ? '#059669' : '#d97706',
                fontWeight: '500'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: profileStatus.complete ? '#10b981' : '#f59e0b'
                }} />
                {profileStatus.message}
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '0.5rem' }}>
              <button
                onClick={() => {
                  setShowDropdown(false)
                  onProfileClick()
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  👤
                </div>
                Manage Profile
              </button>

              <hr style={{
                border: 'none',
                borderTop: '1px solid #e5e7eb',
                margin: '0.5rem 0'
              }} />

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fef2f2'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  🚪
                </div>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
