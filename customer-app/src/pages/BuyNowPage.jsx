import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ProfileModal from '../components/ProfileModal'

export default function BuyNowPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Get product data from navigation state
    const productData = location.state?.product
    if (productData) {
      setProduct(productData)
    } else {
      // Redirect to products if no product data
      navigate('/products')
    }
    
    // Get current user
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    setLoading(false)
  }, [location.state, navigate])

  // Check if profile is complete
  const isProfileComplete = (userData) => {
    if (!userData) return false
    const actualUser = userData.user || userData
    return actualUser.name && actualUser.phone && 
      actualUser.address?.street && actualUser.address?.city && 
      actualUser.address?.state && actualUser.address?.pincode
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity)
    }
  }

  const handleProceedToOrderSummary = () => {
    if (!isProfileComplete(user)) {
      setShowProfileModal(true)
      setMessage('⚠️ Please complete your profile to proceed with checkout')
      setTimeout(() => setMessage(''), 5000)
      return
    }

    // Create order data similar to cart checkout
    const actualUser = user.user || user
    const displayPrice = product.discountedPrice && product.discountedPrice < product.price 
      ? product.discountedPrice 
      : product.price
    const totalAmount = displayPrice * quantity

    const orderData = {
      user: {
        name: actualUser.name,
        email: actualUser.email,
        phone: actualUser.phone,
        address: actualUser.address
      },
      cart: {
        items: [{
          product: product,
          quantity: quantity,
          price: product.price,
          discountedPrice: product.discountedPrice
        }]
      },
      totalAmount: totalAmount,
      isBuyNow: true // Flag to indicate this is a buy now order
    }

    // Navigate to order summary
    navigate('/order-summary', { state: { orderData } })
  }

  const handleBackToProducts = () => {
    navigate('/products')
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading product details...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>No product data found. Redirecting to products...</div>
      </div>
    )
  }

  const displayPrice = product.discountedPrice && product.discountedPrice < product.price 
    ? product.discountedPrice 
    : product.price
  const totalAmount = displayPrice * quantity
  const savings = product.discountedPrice && product.discountedPrice < product.price 
    ? (product.price - product.discountedPrice) * quantity 
    : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <h1 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>
            Buy Now
          </h1>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            background: message.includes('✅') ? '#f0fdf4' : message.includes('❌') ? '#fef2f2' : '#fefce8',
            border: message.includes('✅') ? '1px solid #bbf7d0' : message.includes('❌') ? '1px solid #fecaca' : '1px solid #fde68a',
            color: message.includes('✅') ? '#166534' : message.includes('❌') ? '#dc2626' : '#d97706',
            fontSize: '0.875rem',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Product Details */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
              Product Details
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Product Image */}
              {product.photo && (
                <img 
                  src={product.photo} 
                  alt={product.name}
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    flexShrink: 0
                  }}
                />
              )}

              {/* Product Info */}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#0f172a' }}>
                  {product.name}
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                  {product.description}
                </p>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Product ID: {product.productId}
                </div>
                
                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#059669' }}>
                    ${displayPrice}
                  </span>
                  {product.discountedPrice && product.discountedPrice < product.price && (
                    <>
                      <span style={{ 
                        fontSize: '1rem', 
                        color: '#64748b', 
                        textDecoration: 'line-through'
                      }}>
                        ${product.price}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#dc2626',
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        Save ${(product.price - product.discountedPrice).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Selection */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
              Select Quantity
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: '500', color: '#374151' }}>
                Quantity:
              </span>
              
              {/* Quantity Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: quantity <= 1 ? '#f9fafb' : 'white',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: quantity <= 1 ? '#9ca3af' : '#374151'
                  }}
                >
                  -
                </button>
                
                <div style={{
                  minWidth: '60px',
                  textAlign: 'center',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#0f172a',
                  padding: '0.5rem'
                }}>
                  {quantity}
                </div>
                
                <button 
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 10}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: quantity >= 10 ? '#f9fafb' : 'white',
                    cursor: quantity >= 10 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: quantity >= 10 ? '#9ca3af' : '#374151'
                  }}
                >
                  +
                </button>
              </div>
              
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                (Max 10 items)
              </span>
            </div>
          </div>

          {/* Price Summary */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
              Price Summary
            </h2>
            
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>
                  Price per item:
                </span>
                <span style={{ fontWeight: '500' }}>
                  ${displayPrice}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>
                  Quantity:
                </span>
                <span style={{ fontWeight: '500' }}>
                  {quantity}
                </span>
              </div>
              
              {savings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#059669' }}>
                    You Save:
                  </span>
                  <span style={{ fontWeight: '500', color: '#059669' }}>
                    ${savings.toFixed(2)}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>
                  Shipping:
                </span>
                <span style={{ fontWeight: '500', color: '#059669' }}>
                  Free
                </span>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#0f172a' 
              }}>
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <button
              onClick={handleBackToProducts}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                fontSize: '1rem',
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
              Back to Products
            </button>
            
            <button
              onClick={handleProceedToOrderSummary}
              style={{
                flex: 2,
                padding: '1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#059669',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#047857'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#059669'
              }}
            >
              Proceed to Order Summary
            </button>
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
