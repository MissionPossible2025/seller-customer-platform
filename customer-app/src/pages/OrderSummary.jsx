import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, getUserId } from '../utils/userUtils'

export default function OrderSummary() {
  const location = useLocation()
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const data = location.state?.orderData || JSON.parse(localStorage.getItem('currentOrder') || 'null')
    if (data) {
      setOrderData(data)
    } else {
      // If no order data, try to load from user profile
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        
        // Handle different user data structures
        let actualUser
        if (parsedUser.customer) {
          actualUser = parsedUser.customer
        } else if (parsedUser.user) {
          actualUser = parsedUser.user
        } else {
          actualUser = parsedUser
        }
        
        // Create order data with user profile
        const profileOrderData = {
          user: {
            name: actualUser.name || '',
            phone: actualUser.phone || '',
            address: actualUser.address || {
              street: '',
              city: '',
              state: '',
              pincode: '',
              country: 'India'
            }
          },
          cart: { items: [], totalAmount: 0 },
          totalAmount: 0
        }
        
        setOrderData(profileOrderData)
      } else {
        navigate('/cart')
      }
    }
    setLoading(false)
  }, [location.state, navigate])

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const unit = item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price
      return sum + unit * item.quantity
    }, 0)
  }

  const calculateTax = (items) => {
    return items.reduce((sum, item) => {
      const unit = item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price
      const taxPercentage = item.product?.taxPercentage || 0
      return sum + (unit * item.quantity * taxPercentage / 100)
    }, 0)
  }

  const calculateTotalWithTax = (items) => {
    return items.reduce((sum, item) => {
      const unit = item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price
      const taxPercentage = item.product?.taxPercentage || 0
      const itemTotal = unit * item.quantity
      const taxAmount = itemTotal * taxPercentage / 100
      return sum + itemTotal + taxAmount
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

  const handlePlaceOrder = async () => {
    const u = orderData.user
    const addr = u.address || {}
    if (!u.name || !u.phone || !addr.street || !addr.city || !addr.state || !addr.pincode) {
      setMessage('⚠️ Please complete all customer and address fields')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    try {
      setMessage('🔄 Placing your order...')
      
      // Get the actual customer ID from logged-in user
      const user = getCurrentUser()
      const userId = getUserId(user)
      
      if (!userId) {
        setMessage('❌ User ID not found. Please log in again.')
        setTimeout(() => setMessage(''), 3000)
        return
      }
      
      // Create order data
      const orderDataToSend = {
        customer: userId,
        customerDetails: {
          name: u.name,
          email: u.email || 'customer@example.com',
          phone: u.phone,
          address: addr
        },
        items: cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price,
          discountedPrice: item.discountedPrice,
          // Do not send seller; backend derives from product
          variant: item.variant || null
        })),
        totalAmount: calculateTotalWithTax(cartItems),
        notes: 'Order placed directly - no payment required'
      }
      
      console.log('Order data to send:', JSON.stringify(orderDataToSend, null, 2))
      
      // Create order via API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderDataToSend)
      })
      
      console.log('Order response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Order created successfully:', result)
        
        // Clear cart after successful order
        try {
          const user = getCurrentUser()
          const userId = getUserId(user)
          if (userId) {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/cart/clear`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ userId })
            })
          }
        } catch (cartError) {
          console.warn('Failed to clear cart:', cartError)
        }
        
        // Show success message box
        const orderId = result.order?.orderId || result.orderId || 'PENDING'
        alert(`✅ Your order has been placed successfully!\n\nOrder ID: ${orderId}\n\nThank you for your purchase!`)
        
        // Redirect to products page after showing alert
        setTimeout(() => {
          navigate('/products')
        }, 500)
      } else {
        const error = await response.json()
        console.error('Order creation failed:', error)
        setMessage(`❌ Failed to place order: ${error.error || error.message || 'Unknown error'}`)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Order placement error:', error)
      setMessage('❌ Failed to place order. Please try again.')
      setTimeout(() => setMessage(''), 3000)
    }
  }


  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setHasChanges(false)
    // Reset to original data if needed
    const originalData = location.state?.orderData || JSON.parse(localStorage.getItem('currentOrder') || 'null')
    if (originalData) {
      setOrderData(originalData)
    }
  }

  const handleSave = async () => {
    if (!hasChanges) return
    
    setSaving(true)
    setMessage('')
    
    try {
      const userData = localStorage.getItem('user')
      const parsedUser = JSON.parse(userData)
      
      // Handle different user data structures
      let userId
      if (parsedUser.customer && parsedUser.customer._id) {
        userId = parsedUser.customer._id
      } else if (parsedUser.user && parsedUser.user._id) {
        userId = parsedUser.user._id
      } else if (parsedUser._id) {
        userId = parsedUser._id
      } else if (parsedUser.id) {
        userId = parsedUser.id
      }
      
      if (!userId) {
        setMessage('❌ User ID not found. Please log in again.')
        setTimeout(() => setMessage(''), 3000)
        return
      }

      // Determine which API endpoint to use based on user data structure
      const isCustomerLogin = parsedUser.customer && parsedUser.customer._id
      const apiEndpoint = isCustomerLogin 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/${userId}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/${userId}`

      console.log('OrderSummary: Using API endpoint:', apiEndpoint)

      const response = await fetch(apiEndpoint, {
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
        let updatedUserData
        if (parsedUser.customer) {
          // Handle customer login structure
          updatedUserData = {
            ...parsedUser,
            customer: data.customer || data.user
          }
        } else if (parsedUser.user) {
          // Handle user login structure
          updatedUserData = {
            ...parsedUser,
            user: data.user
          }
        } else {
          // Handle direct user structure
          updatedUserData = data.user
        }
        localStorage.setItem('user', JSON.stringify(updatedUserData))
        
        setMessage('✅ Profile saved successfully!')
        setHasChanges(false)
        setIsEditing(false)
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>
                Customer Details
              </h2>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #3b82f6',
                    background: 'white',
                    color: '#3b82f6',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#3b82f6'
                    e.target.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.color = '#3b82f6'
                  }}
                >
                  ✏️ Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #dc2626',
                      background: 'white',
                      color: '#dc2626',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#dc2626'
                      e.target.style.color = 'white'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white'
                      e.target.style.color = '#dc2626'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: (!hasChanges || saving) ? '#9ca3af' : '#059669',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: (!hasChanges || saving) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {saving ? 'Saving...' : '💾 Save'}
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Full Name</label>
                <input
                  value={orderData.user.name || ''}
                  onChange={(e) => updateUserField('name', e.target.value)}
                  disabled={!isEditing}
                  style={{ 
                    width: '100%', 
                    padding: '0.7rem', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db',
                    background: isEditing ? 'white' : '#f9fafb',
                    color: isEditing ? '#0f172a' : '#6b7280'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Phone</label>
                <input
                  value={orderData.user.phone || ''}
                  onChange={(e) => updateUserField('phone', e.target.value)}
                  disabled={!isEditing}
                  style={{ 
                    width: '100%', 
                    padding: '0.7rem', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db',
                    background: isEditing ? 'white' : '#f9fafb',
                    color: isEditing ? '#0f172a' : '#6b7280'
                  }}
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
                  disabled={!isEditing}
                  style={{ 
                    width: '100%', 
                    padding: '0.7rem', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db', 
                    resize: 'vertical',
                    background: isEditing ? 'white' : '#f9fafb',
                    color: isEditing ? '#0f172a' : '#6b7280'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>City</label>
                  <input
                    value={orderData.user.address?.city || ''}
                    onChange={(e) => updateUserField('address.city', e.target.value)}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '0.7rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      background: isEditing ? 'white' : '#f9fafb',
                      color: isEditing ? '#0f172a' : '#6b7280'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>State</label>
                  <input
                    value={orderData.user.address?.state || ''}
                    onChange={(e) => updateUserField('address.state', e.target.value)}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '0.7rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      background: isEditing ? 'white' : '#f9fafb',
                      color: isEditing ? '#0f172a' : '#6b7280'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Pincode</label>
                  <input
                    value={orderData.user.address?.pincode || ''}
                    onChange={(e) => updateUserField('address.pincode', e.target.value)}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '0.7rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      background: isEditing ? 'white' : '#f9fafb',
                      color: isEditing ? '#0f172a' : '#6b7280'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#64748b' }}>Country</label>
                  <input
                    value={orderData.user.address?.country || 'India'}
                    onChange={(e) => updateUserField('address.country', e.target.value)}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '0.7rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      background: isEditing ? 'white' : '#f9fafb',
                      color: isEditing ? '#0f172a' : '#6b7280'
                    }}
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
                const hasDiscount = item.discountedPrice && item.discountedPrice < item.price
                const savings = hasDiscount ? (item.price - item.discountedPrice) * item.quantity : 0

                return (
                  <div key={item.product._id} style={{
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#fafafa'
                  }}>
                    {/* Product Header */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      {product.photo && (
                        <img 
                          src={product.photo} 
                          alt={product.name}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}>
                          {product.name}
                          {product.unit && (
                            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal', marginLeft: '0.25rem' }}>
                              ({product.unit})
                            </span>
                          )}
                        </h3>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b', lineHeight: '1.4' }}>
                          {product.description}
                        </p>
                        
                        {/* Show variant information if available */}
                        {item.variant && item.variant.combination && (
                          <div style={{ 
                            margin: "0 0 0.5rem 0", 
                            fontSize: "0.9rem", 
                            color: "#3b82f6",
                            fontWeight: "500",
                            background: "#eff6ff",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            display: "inline-block"
                          }}>
                            {Object.entries(item.variant.combination).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </div>
                        )}
                        
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          Category: <span style={{ fontWeight: '500', color: '#0f172a' }}>{product.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Quantity Details */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '1rem',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {/* Quantity Section */}
                      <div>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: '600' }}>
                          Quantity
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button 
                            onClick={() => updateItemQuantity(product._id, item.quantity - 1)} 
                            disabled={item.quantity <= 1} 
                            style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '8px', 
                              border: '2px solid #d1d5db', 
                              background: 'white', 
                              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              color: item.quantity <= 1 ? '#9ca3af' : '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            −
                          </button>
                          <div style={{
                            minWidth: '50px',
                            padding: '0.5rem',
                            textAlign: 'center',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            {item.quantity}
                          </div>
                          <button 
                            onClick={() => updateItemQuantity(product._id, item.quantity + 1)} 
                            style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '8px', 
                              border: '2px solid #d1d5db', 
                              background: 'white', 
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: '600' }}>
                          Price Details
                        </h4>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Unit Price:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                                ₹{displayPrice}
                              </span>
                              {hasDiscount && (
                                <span style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through' }}>
                                  ₹{item.price}
                                </span>
                              )}
                            </div>
                          </div>

                          {hasDiscount && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: '500' }}>You Save:</span>
                              <span style={{ fontSize: '1rem', fontWeight: '600', color: '#dc2626' }}>
                                ₹{savings.toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Quantity:</span>
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
                              {item.quantity}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Subtotal:</span>
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
                              ₹{itemTotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Tax Information */}
                          {product.taxPercentage && product.taxPercentage > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Tax ({product.taxPercentage}%):</span>
                              <span style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
                                ₹{(itemTotal * product.taxPercentage / 100).toFixed(2)}
                              </span>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>Final Amount:</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#059669' }}>
                              ₹{product.taxPercentage && product.taxPercentage > 0 ? (itemTotal + (itemTotal * product.taxPercentage / 100)).toFixed(2) : itemTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
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
            
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {/* Items Breakdown */}
              <div style={{ 
                padding: '1rem', 
                background: '#f8fafc', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: '600' }}>
                  Items Breakdown
                </h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {cartItems.map((item) => {
                    const displayPrice = item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price
                    const itemTotal = displayPrice * item.quantity
                    const taxAmount = item.product.taxPercentage ? (itemTotal * item.product.taxPercentage / 100) : 0
                    const finalTotal = itemTotal + taxAmount
                    return (
                      <div key={item.product._id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                            {item.product.name} × {item.quantity}
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#0f172a' }}>
                            ₹{itemTotal.toFixed(2)}
                          </span>
                        </div>
                        {item.product.taxPercentage && item.product.taxPercentage > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#059669' }}>
                              Final (inc. {item.product.taxPercentage}% tax)
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#059669' }}>
                              ₹{finalTotal.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '500', color: '#0f172a' }}>
                    Subtotal ({cartItems.length} items)
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', color: '#64748b' }}>Shipping</span>
                  <span style={{ color: '#059669', fontWeight: '600', fontSize: '1rem' }}>Free</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', color: '#64748b' }}>Tax</span>
                  <span style={{ fontSize: '1rem', fontWeight: '500', color: '#0f172a' }}>
                    ₹{calculateTax(cartItems).toFixed(2)}
                  </span>
                </div>
                
                <hr style={{ border: 'none', borderTop: '2px solid #e2e8f0', margin: '0.75rem 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a' }}>Total Amount</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a' }}>
                    ₹{calculateTotalWithTax(cartItems).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>


          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handleBack}
              style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}
            >
              Back
            </button>
            
            <button
              onClick={handlePlaceOrder}
              style={{ flex: 2, padding: '1rem', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
