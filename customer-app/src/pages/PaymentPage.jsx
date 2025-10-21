import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Get order data from navigation state or localStorage
    const data = location.state?.orderData || JSON.parse(localStorage.getItem('currentOrder') || 'null')
    if (data) {
      setOrderData(data)
    } else {
      // Redirect to cart if no order data
      navigate('/cart')
    }
    setLoading(false)
  }, [location.state, navigate])

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method)
    setMessage('')
  }

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      setMessage('⚠️ Please select a payment method')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setProcessing(true)
    setMessage('')

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create order data for success page
      const orderId = `ORD-${Date.now()}`
      const paymentData = {
        orderId,
        paymentMethod: selectedPaymentMethod,
        amount: orderData.totalAmount,
        status: 'success',
        timestamp: new Date().toISOString(),
        orderData
      }

      // Save order to localStorage (in real app, this would go to backend)
      const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]')
      existingOrders.push(paymentData)
      localStorage.setItem('userOrders', JSON.stringify(existingOrders))

      // Clear current order
      localStorage.removeItem('currentOrder')

      // Navigate to success page
      navigate('/order-success', { state: { paymentData } })
    } catch (error) {
      setMessage('❌ Payment failed. Please try again.')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const handleBackToOrderSummary = () => {
    navigate('/order-summary', { state: { orderData } })
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading payment page...</div>
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

  const { totalAmount } = orderData

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate(-1)}
            disabled={processing}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              cursor: processing ? 'not-allowed' : 'pointer',
              opacity: processing ? 0.6 : 1
            }}
          >
            ← Back
          </button>
          <h1 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>
            Payment
          </h1>
        </div>

        {/* Order Amount */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '1.125rem', fontWeight: '500', color: '#374151' }}>
              Amount to Pay
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#059669' }}>
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>
            Select Payment Method
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Net Banking */}
            <button
              onClick={() => handlePaymentMethodSelect('netbanking')}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: selectedPaymentMethod === 'netbanking' ? '2px solid #059669' : '1px solid #d1d5db',
                background: selectedPaymentMethod === 'netbanking' ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}>
                🏦
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontWeight: '500', color: '#0f172a', marginBottom: '0.25rem' }}>
                  Net Banking
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Pay using your bank account
                </div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedPaymentMethod === 'netbanking' ? '2px solid #059669' : '2px solid #d1d5db',
                background: selectedPaymentMethod === 'netbanking' ? '#059669' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {selectedPaymentMethod === 'netbanking' && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white'
                  }} />
                )}
              </div>
            </button>

            {/* UPI */}
            <button
              onClick={() => handlePaymentMethodSelect('upi')}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: selectedPaymentMethod === 'upi' ? '2px solid #059669' : '1px solid #d1d5db',
                background: selectedPaymentMethod === 'upi' ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}>
                📱
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontWeight: '500', color: '#0f172a', marginBottom: '0.25rem' }}>
                  UPI Payment
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Pay using UPI apps like PhonePe, Google Pay, Paytm
                </div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedPaymentMethod === 'upi' ? '2px solid #059669' : '2px solid #d1d5db',
                background: selectedPaymentMethod === 'upi' ? '#059669' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {selectedPaymentMethod === 'upi' && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white'
                  }} />
                )}
              </div>
            </button>
          </div>
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

        {/* Payment Details */}
        {selectedPaymentMethod && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>
              Payment Details
            </h3>
            
            {selectedPaymentMethod === 'netbanking' && (
              <div style={{ color: '#374151' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  You will be redirected to your bank's secure payment page.
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  Supported banks: SBI, HDFC, ICICI, Axis, Kotak, and 50+ more
                </p>
              </div>
            )}
            
            {selectedPaymentMethod === 'upi' && (
              <div style={{ color: '#374151' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  You will be redirected to your UPI app for payment.
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  Supported apps: PhonePe, Google Pay, Paytm, BHIM, and more
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={handleBackToOrderSummary}
            disabled={processing}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: processing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: processing ? 0.6 : 1
            }}
          >
            Back
          </button>
          
          <button
            onClick={handlePayment}
            disabled={processing || !selectedPaymentMethod}
            style={{
              flex: 2,
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: processing || !selectedPaymentMethod ? '#9ca3af' : '#059669',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: processing || !selectedPaymentMethod ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {processing ? 'Processing Payment...' : `Pay $${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
