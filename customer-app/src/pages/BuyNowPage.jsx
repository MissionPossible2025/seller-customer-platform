import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ProfileModal from '../components/ProfileModal'

export default function BuyNowPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [pendingCheckout, setPendingCheckout] = useState(false)

  useEffect(() => {
    // Get product data from navigation state
    const productData = location.state?.product
    const variantData = location.state?.selectedVariant
    
    if (productData) {
      setProduct(productData)
      
      // Set selected variant if provided
      if (variantData) {
        setSelectedVariant(variantData)
      } else if (productData.hasVariations && productData.variants && productData.variants.length > 0) {
        // If product has variations but no variant selected, use first variant
        setSelectedVariant(productData.variants[0])
      }
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
    
    // Handle different user data structures
    let actualUser
    if (userData.customer) {
      actualUser = userData.customer
    } else if (userData.user) {
      actualUser = userData.user
    } else {
      actualUser = userData
    }
    
    console.log('Profile check - Name:', actualUser.name, 'Phone:', actualUser.phone)
    console.log('Profile check - Address:', actualUser.address)
    
    const isComplete = actualUser.name && actualUser.phone && 
      actualUser.address?.street && actualUser.address?.city && 
      actualUser.address?.state && actualUser.address?.pincode
    
    console.log('Profile complete:', isComplete)
    return isComplete
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  const handleProceedToOrderSummary = async () => {
    // Always populate with existing profile data, even if incomplete
    let actualUser
    if (user.customer) {
      actualUser = user.customer
    } else if (user.user) {
      actualUser = user.user
    } else {
      actualUser = user
    }
    
    // Re-fetch user data to ensure we have the latest profile
    if (actualUser?._id) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/customers/${actualUser._id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          actualUser = data.customer || data.user || data
          
          // Update localStorage with latest data
          const updatedUserData = { ...user }
          if (updatedUserData.customer) {
            updatedUserData.customer = actualUser
          } else if (updatedUserData.user) {
            updatedUserData.user = actualUser
          }
          localStorage.setItem('user', JSON.stringify(updatedUserData))
          
          // Update state as well
          setUser(updatedUserData)
        } else {
          console.error('Failed to fetch customer data:', response.status)
        }
      } catch (error) {
        console.error('Error fetching latest user data:', error)
      }
    }
    
    // Calculate price based on variant if applicable
    let displayPrice, itemPrice, itemDiscountedPrice
    
    if (product.hasVariations && selectedVariant) {
      // Product has variations, use variant pricing
      itemPrice = selectedVariant.price
      itemDiscountedPrice = selectedVariant.discountedPrice
      displayPrice = itemDiscountedPrice && itemDiscountedPrice < itemPrice 
        ? itemDiscountedPrice 
        : itemPrice
    } else {
      // Product without variations
      itemPrice = product.price
      itemDiscountedPrice = product.discountedPrice
      displayPrice = itemDiscountedPrice && itemDiscountedPrice < itemPrice 
        ? itemDiscountedPrice 
        : itemPrice
    }
    
    const totalAmount = displayPrice * quantity

    const orderData = {
      user: {
        name: actualUser?.name || '',
        phone: actualUser?.phone || '',
        address: actualUser?.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        }
      },
      cart: {
        items: [{
          product: product,
          quantity: quantity,
          price: itemPrice,
          discountedPrice: itemDiscountedPrice,
          variant: selectedVariant ? {
            combination: selectedVariant.combination,
            price: selectedVariant.price,
            originalPrice: selectedVariant.originalPrice,
            stock: selectedVariant.stock
          } : null
        }]
      },
      totalAmount: totalAmount,
      isBuyNow: true // Flag to indicate this is a buy now order
    }

    // Debug logging
    console.log('BuyNowPage: User data:', user)
    console.log('BuyNowPage: Actual user:', actualUser)
    console.log('BuyNowPage: Profile complete:', isProfileComplete(actualUser))
    
    // Check if profile is complete, if not show modal
    if (!isProfileComplete(actualUser)) {
      console.log('BuyNowPage: Profile incomplete, showing modal')
      setPendingCheckout(true)
      setShowProfileModal(true)
      setMessage('⚠️ Please complete your profile to proceed with checkout')
      setTimeout(() => setMessage(''), 5000)
      return
    }
    
    console.log('BuyNowPage: Profile complete, proceeding to order summary')

    // Navigate to order summary with pre-filled data
    navigate('/order-summary', { state: { orderData } })
  }

  const handleBackToProducts = () => {
    navigate('/products')
  }

  // Handle profile modal close
  const handleProfileModalClose = () => {
    setShowProfileModal(false)
    if (pendingCheckout) {
      setPendingCheckout(false)
      // Automatically proceed with checkout after profile is saved
      setTimeout(() => {
        handleProceedToOrderSummary()
      }, 1000) // Small delay to ensure profile is saved
    }
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

  // Calculate price based on variant if applicable
  let displayPrice, itemPrice, itemDiscountedPrice, savings
  
  if (product.hasVariations && selectedVariant) {
    // Product has variations, use variant pricing
    itemPrice = selectedVariant.price
    itemDiscountedPrice = selectedVariant.discountedPrice
    displayPrice = itemDiscountedPrice && itemDiscountedPrice < itemPrice 
      ? itemDiscountedPrice 
      : itemPrice
    savings = itemDiscountedPrice && itemDiscountedPrice < itemPrice 
      ? (itemPrice - itemDiscountedPrice) * quantity 
      : 0
  } else {
    // Product without variations
    itemPrice = product.price
    itemDiscountedPrice = product.discountedPrice
    displayPrice = itemDiscountedPrice && itemDiscountedPrice < itemPrice 
      ? itemDiscountedPrice 
      : itemPrice
    savings = itemDiscountedPrice && itemDiscountedPrice < itemPrice 
      ? (itemPrice - itemDiscountedPrice) * quantity 
      : 0
  }
  
  const totalAmount = displayPrice * quantity
  
  // Check if product/variant is out of stock
  const isOutOfStock = product.hasVariations && selectedVariant 
    ? selectedVariant.stock === 'out_of_stock'
    : product.stockStatus === 'out_of_stock'

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
                {product.brand && (
                  <div style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#111827', fontWeight: 600 }}>
                    {product.brand}
                  </div>
                )}
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                  {product.description}
                </p>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Product ID: {product.productId}
                </div>
                
                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#059669' }}>
                    ₹{displayPrice}
                  </span>
                  {itemDiscountedPrice && itemDiscountedPrice < itemPrice && (
                    <>
                      <span style={{ 
                        fontSize: '1rem', 
                        color: '#64748b', 
                        textDecoration: 'line-through'
                      }}>
                        ₹{itemPrice}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#dc2626',
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        Save ₹{(itemPrice - itemDiscountedPrice).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Variant Selection */}
            {product.hasVariations && product.variants && product.variants.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Select Variant:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {product.variants.map((variant, index) => {
                    // Check if this variant matches the selected variant by comparing combination
                    const isSelected = selectedVariant && variant.combination && selectedVariant.combination
                      ? Object.keys(variant.combination).every(key => 
                          variant.combination[key] === selectedVariant.combination[key]
                        )
                      : false
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedVariant(variant)
                          // Reset quantity to 1 when variant changes
                          setQuantity(1)
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: `2px solid ${isSelected ? '#059669' : '#d1d5db'}`,
                          background: isSelected ? '#f0fdf4' : 'white',
                          color: isSelected ? '#059669' : '#374151',
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? '600' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.target.style.borderColor = '#059669'
                            e.target.style.color = '#059669'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.target.style.borderColor = '#d1d5db'
                            e.target.style.color = '#374151'
                          }
                        }}
                      >
                        {variant.combination && typeof variant.combination === 'object' 
                          ? Object.entries(variant.combination).map(([key, value]) => `${value}`).join(', ')
                          : 'Variant ' + (index + 1)
                        }
                        {' - ₹'}{variant.discountedPrice && variant.discountedPrice < variant.price ? variant.discountedPrice : variant.price}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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
                    color: quantity <= 1 ? '#9ca3af' : '#374151',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (quantity > 1) {
                      e.target.style.background = '#f1f5f9'
                      e.target.style.borderColor = '#cbd5e1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (quantity > 1) {
                      e.target.style.background = 'white'
                      e.target.style.borderColor = '#d1d5db'
                    }
                  }}
                >
                  -
                </button>
                
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    handleQuantityChange(value)
                  }}
                  min="1"
                  style={{
                    width: '100px',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                
                <button 
                  onClick={() => handleQuantityChange(quantity + 1)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#374151',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f1f5f9'
                    e.target.style.borderColor = '#cbd5e1'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.borderColor = '#d1d5db'
                  }}
                >
                  +
                </button>
              </div>
              
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                (No limit)
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
                  ₹{displayPrice}
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
                    ₹{savings.toFixed(2)}
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
                <span>₹{totalAmount.toFixed(2)}</span>
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
              disabled={isOutOfStock}
              style={{
                flex: 2,
                padding: '1rem',
                borderRadius: '8px',
                border: 'none',
                background: isOutOfStock ? '#9ca3af' : '#059669',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isOutOfStock ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isOutOfStock) {
                  e.target.style.background = '#047857'
                }
              }}
              onMouseLeave={(e) => {
                if (!isOutOfStock) {
                  e.target.style.background = '#059669'
                }
              }}
            >
              {isOutOfStock ? 'Out of Stock' : 'Proceed to Order Summary'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={handleProfileModalClose} 
      />
    </div>
  )
}
