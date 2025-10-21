import { useState, useEffect } from 'react'

export default function ProfileModal({ isOpen, onClose }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  })

  useEffect(() => {
    if (isOpen) {
      loadUserProfile()
    }
  }, [isOpen])

  const loadUserProfile = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        const actualUser = parsedUser.user || parsedUser
        
        setUser(actualUser)
        setFormData({
          name: actualUser.name || '',
          phone: actualUser.phone || '',
          address: {
            street: actualUser.address?.street || '',
            city: actualUser.address?.city || '',
            state: actualUser.address?.state || '',
            pincode: actualUser.address?.pincode || '',
            country: actualUser.address?.country || 'India'
          }
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const userData = localStorage.getItem('user')
      const parsedUser = JSON.parse(userData)
      const actualUser = parsedUser.user || parsedUser
      const userId = actualUser._id || actualUser.id

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (response.ok) {
        // Update localStorage with new user data
        const updatedUserData = {
          ...parsedUser,
          user: data.user
        }
        localStorage.setItem('user', JSON.stringify(updatedUserData))
        
        setMessage('✅ Profile updated successfully!')
        setTimeout(() => {
          setMessage('')
          onClose()
        }, 2000)
      } else {
        setMessage(`❌ ${data.error}`)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('❌ Failed to update profile')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const isProfileComplete = () => {
    return formData.name && formData.phone && 
      formData.address.street && formData.address.city && 
      formData.address.state && formData.address.pincode
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#0f172a'
            }}>
              Profile Details
            </h2>
            <p style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              Complete your profile for faster checkout
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {message && (
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              background: message.includes('✅') ? '#f0fdf4' : '#fef2f2',
              border: message.includes('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca',
              color: message.includes('✅') ? '#166534' : '#dc2626',
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            {/* Personal Information */}
            <div>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Personal Information
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    placeholder="+91 9876543210"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Delivery Address *
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Street Address *
                  </label>
                  <textarea
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    required
                    rows={3}
                    placeholder="House/Flat No., Building, Street"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={formData.address.pincode}
                      onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                      required
                      placeholder="110001"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Completion Status */}
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: isProfileComplete() ? '#f0fdf4' : '#fefce8',
              border: isProfileComplete() ? '1px solid #bbf7d0' : '1px solid #fde68a'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isProfileComplete() ? '#166534' : '#d97706'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: isProfileComplete() ? '#10b981' : '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '10px'
                }}>
                  {isProfileComplete() ? '✓' : '!'}
                </div>
                {isProfileComplete() 
                  ? 'Profile complete! You can proceed with checkout.' 
                  : 'Complete all required fields to enable faster checkout.'
                }
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white'
                }}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = '#2563eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = '#3b82f6'
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
