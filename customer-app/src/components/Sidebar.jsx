import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { getUserId, getCurrentUser } from '../utils/userUtils'

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { cartItemCount } = useCart()
  const [unreadAcceptedCount, setUnreadAcceptedCount] = useState(0)
  const [unreadCancelledCount, setUnreadCancelledCount] = useState(0)

  // Fetch unread accepted and cancelled orders count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const userId = getUserId(getCurrentUser())
        if (!userId) return

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/customer/${userId}`)
        if (response.ok) {
          const data = await response.json()
          const orders = data.orders || []
          
          const acceptedCount = orders.filter(order => 
            order.status === 'accepted' && order.acceptedAt && !order.viewedByCustomer
          ).length
          
          const cancelledCount = orders.filter(order => 
            order.status === 'cancelled' && order.cancelledAt && !order.viewedByCustomer
          ).length
          
          setUnreadAcceptedCount(acceptedCount)
          setUnreadCancelledCount(cancelledCount)
        }
      } catch (error) {
        console.error('Error fetching unread order count:', error)
      }
    }

    if (isOpen) {
      fetchUnreadCount()
    }
  }, [isOpen])

  const handleOrdersClick = () => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/customer/${getUserId(getCurrentUser())}/mark-viewed`, {
      method: 'PUT'
    }).catch(console.error)
    setUnreadAcceptedCount(0)
    setUnreadCancelledCount(0)
    navigate('/orders')
    onClose()
  }

  const handleCartClick = () => {
    navigate('/cart')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            transition: 'opacity 0.3s ease'
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-300px',
          width: '280px',
          height: '100vh',
          background: 'white',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          zIndex: 999,
          transition: 'left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem'
        }}
      >
        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '600' }}>Menu</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
            }}
          >
            ×
          </button>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleOrdersClick}
            style={{
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: 'linear-gradient(135deg,#ffffff,#f8fafc)',
              color: '#0f172a',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateX(4px)'
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateX(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            <span>View Orders</span>
            {(unreadAcceptedCount > 0 || unreadCancelledCount > 0) && (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {unreadAcceptedCount > 0 && (
                  <span style={{
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {unreadAcceptedCount > 9 ? '9+' : unreadAcceptedCount}
                  </span>
                )}
                {unreadCancelledCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {unreadCancelledCount > 9 ? '9+' : unreadCancelledCount}
                  </span>
                )}
              </div>
            )}
          </button>

          <button
            onClick={handleCartClick}
            style={{
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: 'linear-gradient(135deg,#ffffff,#f8fafc)',
              color: '#0f172a',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateX(4px)'
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateX(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            <span>Your Cart</span>
            {cartItemCount > 0 && (
              <span style={{
                background: '#3b82f6',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

