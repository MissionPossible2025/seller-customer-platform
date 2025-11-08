import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getUserId } from '../utils/userUtils'

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const user = getCurrentUser()
      const userId = getUserId(user)
      
      if (!userId) {
        console.error('User ID not found')
        setLoading(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/customer/${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        
        // Mark all accepted and cancelled orders with acceptance/cancellation dates as viewed when page loads
        try {
          const ordersData = data.orders || []
          
          // Only mark orders as viewed if they have been accepted or cancelled AND have acceptance/cancellation dates
          const hasUnviewedOrders = ordersData.some(order => 
            (order.status === 'accepted' && order.acceptedAt && !order.viewedByCustomer) ||
            (order.status === 'cancelled' && order.cancelledAt && !order.viewedByCustomer)
          )
          
          if (hasUnviewedOrders) {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/customer/${userId}/mark-viewed`, {
              method: 'PUT'
            })
            console.log('Marked orders as viewed')
          }
        } catch (error) {
          console.error('Error marking orders as viewed:', error)
        }
      } else {
        console.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'accepted': return '#22c55e'
      case 'shipped': return '#3b82f6'
      case 'delivered': return '#059669'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    }
    return statusMap[status] || status
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div>Loading orders...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        {/* Header */}
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
            <h1 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>
              My Orders
            </h1>
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: activeFilter === 'all' ? '#059669' : 'white',
                color: activeFilter === 'all' ? 'white' : '#64748b',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: activeFilter === 'all' ? 'none' : '1px solid #d1d5db',
                transition: 'all 0.2s ease'
              }}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: activeFilter === 'pending' ? '#f59e0b' : 'white',
                color: activeFilter === 'pending' ? 'white' : '#64748b',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: activeFilter === 'pending' ? 'none' : '1px solid #d1d5db',
                transition: 'all 0.2s ease'
              }}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter('accepted')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: activeFilter === 'accepted' ? '#22c55e' : 'white',
                color: activeFilter === 'accepted' ? 'white' : '#64748b',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: activeFilter === 'accepted' ? 'none' : '1px solid #d1d5db',
                transition: 'all 0.2s ease'
              }}
            >
              Accepted
            </button>
            <button
              onClick={() => setActiveFilter('cancelled')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: activeFilter === 'cancelled' ? '#ef4444' : 'white',
                color: activeFilter === 'cancelled' ? 'white' : '#64748b',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: activeFilter === 'cancelled' ? 'none' : '1px solid #d1d5db',
                transition: 'all 0.2s ease'
              }}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Filter and display orders */}
        {(() => {
          const filteredOrders = orders.filter(order => {
            if (activeFilter === 'all') return true
            return order.status === activeFilter
          })
          
          if (orders.length === 0) {
            return (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>No Orders Yet</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  You haven't placed any orders yet. Start shopping to see your orders here!
                </p>
                <button
                  onClick={() => navigate('/products')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#059669',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Browse Products
                </button>
              </div>
            )
          }
          
          if (filteredOrders.length === 0) {
            return (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>No {getStatusText(activeFilter)} Orders</h2>
                <p style={{ color: '#64748b' }}>
                  You don't have any {getStatusText(activeFilter).toLowerCase()} orders.
                </p>
              </div>
            )
          }
          
          return (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredOrders.map(order => (
              <div
                key={order._id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedOrder(order)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Seller Accepted Notification */}
                {order.status === 'accepted' && order.acceptedAt && !order.viewedByCustomer && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      ✓
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#065f46', fontSize: '1rem', marginBottom: '0.25rem' }}>
                        🎉 Order Accepted by Seller!
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#047857' }}>
                        Your order #{order.orderId} has been accepted and will be processed soon.
                      </div>
                    </div>
                  </div>
                )}

                {/* Seller Cancelled Notification */}
                {order.status === 'cancelled' && order.cancelledAt && !order.viewedByCustomer && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    border: '2px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      ✕
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#7f1d1d', fontSize: '1rem', marginBottom: '0.25rem' }}>
                        Order Cancelled by Seller
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>
                        Your order #{order.orderId} has been cancelled. Please contact support if you have questions.
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Order #{order.orderId}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white',
                    background: getStatusColor(order.status)
                  }}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Items</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      {order.items?.length || 0} item(s)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Total</div>
                    <div style={{ fontWeight: '600', color: '#059669', fontSize: '1.1rem' }}>
                      ₹{order.totalAmount?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Delivery</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      {order.deliveryStatus === 'delivered' ? 'Delivered' : 
                       order.deliveryStatus === 'shipped' ? 'Shipped' : 
                       order.deliveryStatus === 'out_for_delivery' ? 'Out for Delivery' : 
                       'Processing'}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  padding: '0.75rem', 
                  background: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Items:</div>
                  {order.items?.slice(0, 2).map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ color: '#374151' }}>
                        {item.product?.name || 'Product'} × {item.quantity}
                      </span>
                      <span style={{ color: '#059669', fontWeight: '600' }}>
                        ₹{((item.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                      +{order.items.length - 2} more item(s)
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/order/${order._id}`);
                  }}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #3b82f6',
                    background: 'white',
                    color: '#3b82f6',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  View Details
                </button>
              </div>
            ))}
            </div>
          )
        })()}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={() => setSelectedOrder(null)}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedOrder(null)}
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

            <h2 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.5rem' }}>
              Order Details - #{selectedOrder.orderId}
            </h2>

            {/* Order Status */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                padding: '1rem', 
                background: '#f0fdf4', 
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Order Status</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: getStatusColor(selectedOrder.status) }}>
                      {getStatusText(selectedOrder.status)}
                    </div>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Tracking Number</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>
                        {selectedOrder.trackingNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.2rem' }}>Order Items</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} style={{
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      {item.product?.photo && (
                        <img 
                          src={item.product.photo} 
                          alt={item.product.name}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                          {item.product?.name}
                          {item.product?.unit && (
                            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal', marginLeft: '0.25rem' }}>
                              ({item.product.unit})
                            </span>
                          )}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                          {item.product?.description}
                        </p>
                      </div>
                    </div>
                    
                    {item.variant && item.variant.combination && (
                      <div style={{ 
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem', 
                        color: '#3b82f6',
                        fontWeight: '500',
                        background: '#eff6ff',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        {Object.entries(item.variant.combination).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </div>
                    )}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Quantity</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.quantity}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Unit Price</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>₹{item.price?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Total</div>
                        <div style={{ fontWeight: '700', color: '#059669', fontSize: '1.1rem' }}>
                          ₹{((item.price || 0) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div style={{ 
              padding: '1.5rem', 
              background: '#f8fafc', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.2rem' }}>Order Summary</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>
                    ₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Shipping:</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>Free</span>
                </div>
                <hr style={{ border: 'none', borderTop: '2px solid #e2e8f0', margin: '0.75rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>
                  <span>Total:</span>
                  <span>₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

