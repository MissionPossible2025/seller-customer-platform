import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'

export default function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch products')
      
      setProducts(data.products || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const productsByCategory = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {})

  const categories = ['Electronics', 'Clothing', 'Books', 'Furniture']

  // Get current user from localStorage
  const getCurrentUser = () => {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }

  // Handle Add to Cart
  const handleAddToCart = async (product) => {
    try {
      const user = getCurrentUser()
      if (!user) {
        setCartMessage('Please log in to add items to cart')
        setTimeout(() => setCartMessage(''), 3000)
        return
      }

      console.log('User object:', user) // Debug log
      console.log('Product object:', product) // Debug log

      // Use user._id or user.id depending on what's available
      // Handle nested user object structure: {token: 'dummy-token', user: {...}}
      const actualUser = user.user || user
      const userId = actualUser._id || actualUser.id
      if (!userId) {
        setCartMessage('❌ User ID not found. Please log in again.')
        setTimeout(() => setCartMessage(''), 3000)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          productId: product._id,
          quantity: 1
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setCartMessage('✅ Item added to cart successfully!')
        setTimeout(() => setCartMessage(''), 3000)
      } else {
        setCartMessage(`❌ ${data.error}`)
        setTimeout(() => setCartMessage(''), 3000)
      }
    } catch (error) {
      setCartMessage('❌ Failed to add item to cart')
      setTimeout(() => setCartMessage(''), 3000)
    }
  }

  // Handle Buy Now
  const handleBuyNow = async (product) => {
    try {
      const user = getCurrentUser()
      if (!user) {
        setCartMessage('Please log in to proceed with purchase')
        setTimeout(() => setCartMessage(''), 3000)
        return
      }

      // Navigate to Buy Now page with product data
      navigate('/buy-now', { state: { product } })
    } catch (error) {
      setCartMessage('❌ Failed to proceed with purchase')
      setTimeout(() => setCartMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading products...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        <div>Error: {error}</div>
        <button 
          onClick={fetchProducts}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dc2626', background: 'white', color: '#dc2626', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              <h1 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>Products</h1>
            </div>
            <button 
              onClick={() => window.location.href = '/cart'}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid #3b82f6',
                background: 'white',
                color: '#3b82f6',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🛒 View Cart
            </button>
          </div>
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
        </div>

        {Object.keys(productsByCategory).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            {searchTerm ? 'No products found matching your search.' : 'No products available.'}
          </div>
        ) : (
          categories.map(category => {
            const categoryProducts = productsByCategory[category]
            if (!categoryProducts || categoryProducts.length === 0) return null

            return (
              <div key={category} style={{ marginBottom: '3rem' }}>
                <h2 style={{ 
                  marginBottom: '1rem', 
                  color: '#0f172a', 
                  fontSize: '1.5rem',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '0.5rem'
                }}>
                  {category}
                </h2>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '1.5rem' 
                }}>
                  {categoryProducts.map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={() => setSelectedProduct(null)}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              ×
            </button>

            {/* Product Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Product Image */}
              <div>
                {selectedProduct.photo && (
                  <img 
                    src={selectedProduct.photo} 
                    alt={selectedProduct.name}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                )}
              </div>
              
              {/* Product Information */}
              <div>
                <h2 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  color: '#0f172a',
                  lineHeight: '1.2'
                }}>
                  {selectedProduct.name}
                </h2>
                
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: '700', 
                      color: '#059669' 
                    }}>
                      ${selectedProduct.discountedPrice && selectedProduct.discountedPrice < selectedProduct.price 
                        ? selectedProduct.discountedPrice 
                        : selectedProduct.price}
                    </span>
                    {selectedProduct.discountedPrice && selectedProduct.discountedPrice < selectedProduct.price && (
                      <span style={{ 
                        fontSize: '1.5rem', 
                        color: '#64748b', 
                        textDecoration: 'line-through' 
                      }}>
                        ${selectedProduct.price}
                      </span>
                    )}
                  </div>
                  {selectedProduct.discountedPrice && selectedProduct.discountedPrice < selectedProduct.price && (
                    <div style={{ 
                      fontSize: '1.1rem', 
                      color: '#dc2626', 
                      fontWeight: '600',
                      background: '#fef2f2',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>
                      You Save: ${(selectedProduct.price - selectedProduct.discountedPrice).toFixed(2)}
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    color: '#0f172a', 
                    fontSize: '1.3rem',
                    fontWeight: '600'
                  }}>
                    Description
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: '#64748b', 
                    fontSize: '1.1rem',
                    lineHeight: '1.6'
                  }}>
                    {selectedProduct.description}
                  </p>
                </div>
                
                <div style={{ 
                  fontSize: '1.1rem', 
                  color: '#64748b',
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#0f172a' }}>Sold by:</strong> {selectedProduct.seller?.name || 'Unknown Seller'}
                </div>

                {/* Cart Message */}
                {cartMessage && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    background: cartMessage.includes('✅') ? '#f0fdf4' : cartMessage.includes('❌') ? '#fef2f2' : '#fefce8',
                    border: cartMessage.includes('✅') ? '1px solid #bbf7d0' : cartMessage.includes('❌') ? '1px solid #fecaca' : '1px solid #fde68a',
                    color: cartMessage.includes('✅') ? '#166534' : cartMessage.includes('❌') ? '#dc2626' : '#d97706',
                    fontSize: '1rem',
                    fontWeight: '500',
                    textAlign: 'center'
                  }}>
                    {cartMessage}
                  </div>
                )}

                {/* Debug User Info */}
                <div style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                  color: '#64748b'
                }}>
                  <strong>Debug Info:</strong>
                  <div>User ID: {(getCurrentUser()?.user || getCurrentUser())?._id || (getCurrentUser()?.user || getCurrentUser())?.id || 'Not found'}</div>
                  <div>Product ID: {selectedProduct?._id || 'Not found'}</div>
                  <div>User Object: {JSON.stringify(getCurrentUser(), null, 2)}</div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => handleAddToCart(selectedProduct)}
                    style={{
                      flex: 1,
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      border: '2px solid #3b82f6',
                      background: 'white',
                      color: '#3b82f6',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#3b82f6';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.color = '#3b82f6';
                    }}
                  >
                    🛒 Add to Cart
                  </button>
                  
                  <button 
                    onClick={() => handleBuyNow(selectedProduct)}
                    style={{
                      flex: 1,
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#059669',
                      color: 'white',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#047857';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#059669';
                    }}
                  >
                    🛍️ Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, onClick }) {
  const displayPrice = product.discountedPrice && product.discountedPrice < product.price 
    ? product.discountedPrice 
    : product.price

  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
    }}
    >
      {product.photo && (
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <img 
            src={product.photo} 
            alt={product.name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
      
      <h3 style={{ 
        margin: '0 0 0.5rem 0', 
        fontSize: '1.1rem', 
        fontWeight: '600',
        color: '#0f172a'
      }}>
        {product.name}
      </h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            fontSize: '1.2rem', 
            fontWeight: '700', 
            color: '#059669' 
          }}>
            ${displayPrice}
          </span>
          {hasDiscount && (
            <span style={{ 
              fontSize: '0.9rem', 
              color: '#64748b', 
              textDecoration: 'line-through' 
            }}>
              ${product.price}
            </span>
          )}
        </div>
        {hasDiscount && (
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#dc2626', 
            fontWeight: '600' 
          }}>
            Save ${(product.price - product.discountedPrice).toFixed(2)}
          </div>
        )}
      </div>

      {/* Click indicator */}
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Click to view details
      </div>
    </div>
  )
}
