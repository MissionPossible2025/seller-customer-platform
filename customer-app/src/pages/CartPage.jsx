import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileModal from '../components/ProfileModal'
import { useCart } from '../hooks/useCart'
import { getCurrentUser, getUserId, getUserObject, isProfileComplete } from '../utils/userUtils'

export default function CartPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [user, setUser] = useState(null)
  const { cart, loading, fetchCart, updateCartItem, removeFromCart, clearCart } = useCart()


  // Handle checkout process
  const handleCheckout = () => {
    const userData = getCurrentUser()
    
    if (!isProfileComplete(userData)) {
      setShowProfileModal(true)
      setMessage('⚠️ Please complete your profile to proceed with checkout')
      setTimeout(() => setMessage(''), 5000)
      return
    }

    // Proceed with checkout - navigate to order summary
    const actualUser = getUserObject(userData)

    const checkoutData = {
      user: {
        name: actualUser.name,
        email: actualUser.email,
        phone: actualUser.phone,
        address: actualUser.address
      },
      cart: cart,
      totalAmount: cart?.totalAmount || 0
    }

    // Navigate to order summary page
    navigate('/order-summary', { state: { orderData: checkoutData } })
  }

  // Fetch cart data
  const fetchCartData = async () => {
    try {
      const user = getCurrentUser()
      if (!user) {
        setError('Please log in to view your cart')
        return
      }

      const userId = getUserId(user)
      
      if (!userId) {
        setError('User ID not found. Please log in again.')
        return
      }

      await fetchCart()
    } catch (err) {
      setError('Failed to fetch cart')
    }
  }

  useEffect(() => {
    fetchCartData()
    const userData = getCurrentUser()
    setUser(userData)
  }, [])

  // Update item quantity
  const updateQuantity = async (productId, newQuantity) => {
    const result = await updateCartItem(productId, newQuantity)
    
    if (result.success) {
      setMessage(`✅ ${result.message}`)
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage(`❌ ${result.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Remove item from cart
  const removeItem = async (productId) => {
    const result = await removeFromCart(productId)
    
    if (result.success) {
      setMessage(`✅ ${result.message}`)
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage(`❌ ${result.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Clear entire cart
  const clearCartItems = async () => {
    const result = await clearCart()
    
    if (result.success) {
      setMessage(`✅ ${result.message}`)
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage(`❌ ${result.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading your cart...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        <div>Error: {error}</div>
        <button 
          onClick={fetchCart}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dc2626', background: 'white', color: '#dc2626', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    )
  }

  const cartItems = cart?.items || []
  const totalAmount = cart?.totalAmount || 0
  const profileComplete = isProfileComplete(user)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              onClick={() => navigate(-1)}
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
            <h1 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>Shopping Cart</h1>
          </div>
          
          {message && (
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              background: message.includes('✅') ? '#f0fdf4' : message.includes('❌') ? '#fef2f2' : message.includes('⚠️') ? '#fefce8' : '#fefce8',
              border: message.includes('✅') ? '1px solid #bbf7d0' : message.includes('❌') ? '1px solid #fecaca' : message.includes('⚠️') ? '1px solid #fde68a' : '1px solid #fde68a',
              color: message.includes('✅') ? '#166534' : message.includes('❌') ? '#dc2626' : message.includes('⚠️') ? '#d97706' : '#d97706',
              fontSize: '1rem',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#64748b', marginBottom: '1rem' }}>Your cart is empty</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Add some products to get started!</p>
            <button 
              onClick={() => window.location.href = '/products'}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Cart Items */}
            <div>
              <div style={{ 
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, color: '#0f172a' }}>Cart Items ({cartItems.length})</h2>
                  <button 
                    onClick={clearCartItems}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #dc2626',
                      background: 'white',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Clear Cart
                  </button>
                </div>

                {cartItems.map((item) => {
                  const product = item.product
                  const displayPrice = item.discountedPrice && item.discountedPrice < item.price 
                    ? item.discountedPrice 
                    : item.price
                  const itemTotal = displayPrice * item.quantity

                  return (
                    <div key={item.product._id} style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      alignItems: 'center'
                    }}>
                      {/* Product Image */}
                      {product.photo && (
                        <img 
                          src={product.photo} 
                          alt={product.name}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '6px'
                          }}
                        />
                      )}

                      {/* Product Details */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
                          {product.name}
                        </h3>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>
                          {product.description}
                        </p>
                        
                        {/* Show variant information if available */}
                        {item.variant && item.variant.combination && (
                          <div style={{ 
                            margin: '0 0 0.5rem 0', 
                            fontSize: '0.9rem', 
                            color: '#3b82f6',
                            fontWeight: '500',
                            background: '#eff6ff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            {Object.entries(item.variant.combination).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </div>
                        )}
                        
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                          Product ID: {product.productId}
                        </div>
                      </div>

                      {/* Price and Quantity */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669' }}>
                            ${displayPrice}
                          </span>
                          {item.discountedPrice && item.discountedPrice < item.price && (
                            <span style={{ 
                              fontSize: '0.9rem', 
                              color: '#64748b', 
                              textDecoration: 'line-through',
                              marginLeft: '0.5rem'
                            }}>
                              ${item.price}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <button 
                            onClick={() => updateQuantity(product._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              background: item.quantity <= 1 ? '#f9fafb' : 'white',
                              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '500' }}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(product._id, item.quantity + 1)}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
                          ${itemTotal.toFixed(2)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => removeItem(product._id)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #dc2626',
                          background: 'white',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div style={{ 
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: '1rem'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Order Summary</h3>
                
                {/* Profile Status */}
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  background: profileComplete ? '#f0fdf4' : '#fefce8',
                  border: profileComplete ? '1px solid #bbf7d0' : '1px solid #fde68a'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: profileComplete ? '#166534' : '#d97706'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: profileComplete ? '#10b981' : '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px'
                    }}>
                      {profileComplete ? '✓' : '!'}
                    </div>
                    {profileComplete 
                      ? 'Profile complete - Ready for checkout' 
                      : 'Complete profile for checkout'
                    }
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Items ({cartItems.length})</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '600', color: '#0f172a' }}>
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: profileComplete ? '#059669' : '#6b7280',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: profileComplete ? 'pointer' : 'not-allowed',
                    marginBottom: '1rem'
                  }}
                  onClick={handleCheckout}
                >
                  {profileComplete ? 'Proceed to Checkout' : 'Complete Profile First'}
                </button>

                <button 
                  onClick={() => window.location.href = '/products'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #3b82f6',
                    background: 'white',
                    color: '#3b82f6',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </div>
  )
}
