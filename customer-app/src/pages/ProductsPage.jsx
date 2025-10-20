import { useState, useEffect } from 'react'
import SearchBar from '../components/SearchBar'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

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
          <h1 style={{ marginTop: 0, marginBottom: '1rem', color: '#0f172a' }}>Products</h1>
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
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ProductCard({ product }) {
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
      
      <p style={{ 
        margin: '0 0 1rem 0', 
        color: '#64748b', 
        fontSize: '0.9rem',
        lineHeight: '1.4'
      }}>
        {product.description}
      </p>
      
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
      
      <div style={{ 
        fontSize: '0.85rem', 
        color: '#64748b',
        marginBottom: '1rem'
      }}>
        Stock: {product.stock} available
      </div>
      
      <div style={{ 
        fontSize: '0.85rem', 
        color: '#64748b' 
      }}>
        Sold by: {product.seller?.name || 'Unknown Seller'}
      </div>
    </div>
  )
}
