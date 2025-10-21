import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function OrderSummary() {
  const location = useLocation()
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const data = location.state?.orderData || JSON.parse(localStorage.getItem('currentOrder') || 'null')
    if (data) {
      setOrderData(data)
    } else {
      navigate('/cart')
    }
    setLoading(false)
  }, [location.state, navigate])

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const unit = item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price
      return sum + unit * item.quantity
    }, 0)
  }

  const updateUserField = (fieldPath, value) => {
    setOrderData(prev => {
      const next = { ...prev, user: { ...prev.user } }
      if (fieldPath.includes('.')) {
        const [parent, child] = fieldPath.split('.')
        next.user[parent] = { ...(prev.user[parent] || {}), [child]: value }
      } else {
        next.user[fieldPath] = value
      }
      setHasChanges(true)
      return next
    })
  }

  const updateItemQuantity = (productId, newQty) => {
    if (newQty < 1) return
    setOrderData(prev => {
      const items = prev.cart.items.map(it => it.product._id === productId ? { ...it, quantity: newQty } : it)
      const total = calculateTotal(items)
      return { ...prev, cart: { ...prev.cart, items }, totalAmount: total }
    })
  }

  const handleProceedToPayment = () => {
    const u = orderData.user
    const addr = u.address || {}
    if (!u.name || !u.phone || !addr.street || !addr.city || !addr.state || !addr.pincode) {
      setMessage('⚠️ Please complete all customer and address fields')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    localStorage.setItem('currentOrder', JSON.stringify(orderData))
    navigate('/payment', { state: { orderData } })
  }

  const handleSaveProfile = async () => {
    if (!hasChanges) return
    
    setSaving(true)
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
        body: JSON.stringify({
          name: orderData.user.name,
          phone: orderData.user.phone,
          address: orderData.user.address
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Update localStorage with new user data
        const updatedUserData = {
          ...parsedUser,
          user: data.user
        }
        localStorage.setItem('user', JSON.stringify(updatedUserData))
        
        setMessage('✅ Profile saved successfully!')
        setHasChanges(false)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(`❌ ${data.error}`)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('❌ Failed to save profile')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading order summary...</div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>No order data found. Redirecting to cart...</div>
      </div>
    )
  }

  const { user, cart, totalAmount } = orderData
  const cartItems = cart?.items || []

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleBack}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
          <h1 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>
            Order Summary
          </h1>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            background: '#fefce8',
            border: '1px solid #fde68a',
            color: '#d97706',
            fontSize: '0.95rem',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
              Customer Details
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Full Name</label>
                <input
                  value={orderData.user.name || ''}
                  onChange={(e) => updateUserField('name', e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Email</label>
                <input
                  value={orderData.user.email || ''}
                  disabled
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#6b7280' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Phone</label>
                <input
                  value={orderData.user.phone || ''}
                  onChange={(e) => updateUserField('phone', e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
              Delivery Address
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Street Address</label>
                <textarea
                  rows={3}
                  value={orderData.user.address?.street || ''}
                  onChange={(e) => updateUserField('address.street', e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>City</label>
                  <input
                    value={orderData.user.address?.city || ''}
                    onChange={(e) => updateUserField('address.city', e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>State</label>
                  <input
                    value={orderData.user.address?.state || ''}
                    onChange={(e) => updateUserField('address.state', e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Pincode</label>
                  <input
                    value={orderData.user.address?.pincode || ''}
                    onChange={(e) => updateUserField('address.pincode', e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Country</label>
                  <input
                    value={orderData.user.address?.country || 'India'}
                    onChange={(e) => updateUserField('address.country', e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
              Order Items ({cartItems.length})
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {cartItems.map((item) => {
                const product = item.product
                const displayPrice = item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price
                const itemTotal = displayPrice * item.quantity

                return (
                  <div key={item.product._id} style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    alignItems: 'center'
                  }}>
                    {product.photo && (
                      <img 
                        src={product.photo} 
                        alt={product.name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#0f172a' }}>{product.name}</h3>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#64748b' }}>{product.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Qty:</span>
                        <button onClick={() => updateItemQuantity(product._id, item.quantity - 1)} disabled={item.quantity <= 1} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer' }}>-</button>
                        <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                        <button onClick={() => updateItemQuantity(product._id, item.quantity + 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '600', color: '#059669' }}>${displayPrice}</span>
                        {item.discountedPrice && item.discountedPrice < item.price && (
                          <span style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'line-through', marginLeft: '0.5rem' }}>${item.price}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>${itemTotal.toFixed(2)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
              Order Total
            </h2>
            
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Items ({cartItems.length})</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping</span>
                <span style={{ color: '#059669', fontWeight: '500' }}>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
                <span>Total Amount</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Save Profile Button */}
          {hasChanges && (
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: saving ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? 'Saving...' : '💾 Save Profile Changes'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handleBack}
              style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}
            >
              Back
            </button>
            
            <button
              onClick={handleProceedToPayment}
              style={{ flex: 2, padding: '1rem', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
