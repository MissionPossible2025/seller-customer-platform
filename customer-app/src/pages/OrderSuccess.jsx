import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function OrderSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const [paymentData, setPaymentData] = useState(null)

  useEffect(() => {
    const data = location.state?.paymentData
    if (data) {
      setPaymentData(data)
    } else {
      navigate('/dashboard')
    }
  }, [location.state, navigate])

  const handleContinueShopping = () => {
    navigate('/products')
  }

  const handleViewOrders = () => {
    navigate('/orders')
  }

  if (!paymentData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  const { orderId, paymentMethod, amount, orderData } = paymentData

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem' }}>
        {/* Header with Back */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <div style={{ color: '#0f172a', fontWeight: 600 }}>Order Status</div>
        </div>

        {/* Success Icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            fontSize: '40px',
            color: 'white'
          }}>
            ✓
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>
            Order Placed Successfully!
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {/* Order Details */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
            Order Details
          </h2>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Order ID:</span>
              <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{orderId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Payment Method:</span>
              <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                {paymentMethod === 'netbanking' ? 'Net Banking' : 
                 paymentMethod === 'upi' ? 'UPI Payment' : 
                 paymentMethod === 'Direct Order' ? 'Direct Order' :
                 paymentMethod?.charAt(0).toUpperCase() + paymentMethod?.slice(1)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Amount Paid:</span>
              <span style={{ fontWeight: '600', color: '#059669' }}>₹{amount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Delivery Address:</span>
              <span style={{ fontWeight: '500', textAlign: 'right', maxWidth: '200px' }}>
                {orderData.user.address.street}, {orderData.user.address.city}, {orderData.user.address.state} - {orderData.user.address.pincode}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items Summary */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>
            Items Ordered ({orderData.cart.items.length})
          </h3>
          
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {orderData.cart.items.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderBottom: index < orderData.cart.items.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                <span style={{ color: '#374151' }}>
                  {item.product.name} (Qty: {item.quantity})
                </span>
                <span style={{ fontWeight: '500' }}>
                  ₹{((item.discountedPrice || item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #bbf7d0',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#166534' }}>
            What's Next?
          </h3>
          <div style={{ color: '#166534', fontSize: '0.875rem', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              • You will receive an order confirmation email shortly
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              • Your order will be processed and shipped within 1-2 business days
            </p>
            <p style={{ margin: 0 }}>
              • You can track your order status in the "My Orders" section
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={handleContinueShopping}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #3b82f6',
              background: 'white',
              color: '#3b82f6',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#eff6ff'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white'
            }}
          >
            Continue Shopping
          </button>
          
          <button
            onClick={handleViewOrders}
            style={{
              flex: 1,
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
            View My Orders
          </button>
        </div>
      </div>
    </div>
  )
}
