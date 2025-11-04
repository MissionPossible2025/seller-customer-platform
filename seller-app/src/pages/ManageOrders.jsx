// src/pages/ManageOrders.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function ManageOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [isReturnedMode, setIsReturnedMode] = useState(false); // Track if opened via Returned button
  const [message, setMessage] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 640 : false);

  // Fetch orders for the logged-in seller
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch orders filtered by seller ID
        const response = await axios.get(`http://localhost:5000/api/orders/seller/${user._id}`);
        
        // Filter orders to show only items from this seller
        const ordersWithFilteredItems = (response.data.orders || []).map(order => ({
          ...order,
          items: order.items.filter(item => 
            item.seller?._id === user._id || item.seller?.toString() === user._id.toString()
          )
        })).filter(order => order.items.length > 0); // Only show orders that have items from this seller
        
        setOrders(ordersWithFilteredItems);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setMessage('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [user]);

  // Handle order status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
        status: newStatus,
        trackingNumber: trackingNumber
      });

      // Update local state
      setOrders(prev => prev.map(order =>
        order._id === orderId ? { ...order, status: newStatus, trackingNumber: trackingNumber } : order
      ));

      setMessage(`Order ${newStatus} successfully!`);
      setSelectedOrder(null);
      setTrackingNumber('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Failed to update order:", error);
      setMessage('Failed to update order status');
      setTimeout(() => setMessage(''), 3000);
    }
  };


  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const openEditMode = (order) => {
    setSelectedOrder(order);
    setIsEditMode(true);
    setIsReturnedMode(false);
    setEditItems((order.items || []).map(it => ({
      product: it.product?._id || it.product,
      quantity: it.quantity,
      variant: it.variant || null
    })));
  };

  const openReturnEdit = (order) => {
    setSelectedOrder(order);
    setIsReturnedMode(true); // Mark as opened via Returned button
    setIsEditMode(false); // Don't enable edit mode yet
    setEditItems((order.items || []).map(it => ({
      product: it.product?._id || it.product,
      quantity: it.quantity,
      variant: it.variant || null
    })));
  };

  const setItemQuantity = (index, qty) => {
    const q = Math.max(0, Math.floor(Number(qty) || 0));
    setEditItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: q } : it));
  };

  const removeItem = (index) => {
    // Remove from editItems immediately
    setEditItems(prev => prev.filter((_, i) => i !== index));
    // Also remove from the visible selectedOrder items so UI updates instantly
    setSelectedOrder(prev => prev ? { ...prev, items: (prev.items || []).filter((_, i) => i !== index) } : prev);
  };

  const saveEditedItems = async () => {
    try {
      // Filter out items with quantity 0 before sending
      const itemsToSave = editItems.filter(it => it.quantity > 0);
      
      if (itemsToSave.length === 0) {
        setMessage('Order must have at least one item');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const response = await axios.put(`http://localhost:5000/api/orders/${selectedOrder._id}/items`, {
        items: itemsToSave
      });
      
      // Get updated order from response
      const updatedOrder = response.data?.order;
      
      if (!updatedOrder) {
        throw new Error('No order data in response');
      }
      
      // Update orders list and selected order with the updated data
      setOrders(prev => prev.map(o => {
        if (o._id === updatedOrder._id) {
          // Also filter items to show only items from this seller
          return {
            ...updatedOrder,
            items: updatedOrder.items?.filter(item => 
              item.seller?._id === user._id || item.seller?.toString() === user._id.toString()
            ) || []
          };
        }
        return o;
      }));
      
      // Update selected order with filtered items (only this seller's items)
      const filteredOrder = {
        ...updatedOrder,
        items: updatedOrder.items?.filter(item => 
          item.seller?._id === user._id || item.seller?.toString() === user._id.toString()
        ) || []
      };
      setSelectedOrder(filteredOrder);
      
      setIsEditMode(false);
      setIsReturnedMode(false);
      setMessage('Order updated successfully');
      setTimeout(() => setMessage(''), 2500);
    } catch (e) {
      console.error('Failed to save edited items', e);
      const errorMessage = e.response?.data?.error || e.message || 'Failed to update order';
      setMessage(`Error: ${errorMessage}`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const computeLine = (item) => {
    const quantity = item?.quantity || 0;
    const unit = (item?.discountedPrice && item.discountedPrice < item.price) ? item.discountedPrice : item?.price || 0;
    const taxPct = item?.product?.taxPercentage ?? 0;
    const lineSubtotal = unit * quantity;
    const lineTax = (lineSubtotal * taxPct) / 100;
    const lineTotal = lineSubtotal + lineTax;
    return { quantity, unit, taxPct, lineSubtotal, lineTax, lineTotal };
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh" 
      }}>
        <p style={{ fontSize: "1.2rem" }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      maxWidth: isMobile ? '100%' : "1200px",
      margin: "0 auto",
      padding: isMobile ? "1rem" : "2rem"
    }}>
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: isMobile ? "1rem" : "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "100%",
        textAlign: "center"
      }}>
        <h2 style={{ marginBottom: isMobile ? "1rem" : "2rem", fontSize: isMobile ? "1.5rem" : "2rem" }}>Order Management</h2>
        <p style={{ marginBottom: isMobile ? "1rem" : "2rem", fontSize: isMobile ? "0.95rem" : "1.1rem", color: "#888" }}>
          Manage customer orders - Accept or Deny orders
        </p>

        {message && (
          <div style={{
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            backgroundColor: message.includes('successfully') ? '#f0fdf4' : '#fef2f2',
            border: message.includes('successfully') ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: message.includes('successfully') ? '#166534' : '#dc2626',
            fontSize: "0.95rem",
            fontWeight: "500"
          }}>
            {message}
          </div>
        )}

        {orders.length === 0 ? (
          <p style={{ fontSize: "1.1rem", color: "#888" }}>No orders found.</p>
        ) : (
          <div>
            {isMobile ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {orders.map(order => (
                  <div key={order._id} style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>#{order.orderId}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: getStatusColor(order.status),
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => openReturnEdit(order)}
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#111827', fontWeight: 600, fontSize: '0.7rem' }}
                          >Returned</button>
                        )}
                      </div>
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{order.customerDetails?.name}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{order.items?.length} item(s) • ₹{order.totalAmount?.toFixed(2)}</div>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                          {order.status === 'pending' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'accepted')}
                            style={{ padding: '0.6rem', borderRadius: '8px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 600 }}
                          >Accept</button>
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                            style={{ padding: '0.6rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 600 }}
                          >Deny</button>
                        </div>
                      ) : (
                        <>
                          {order.status === 'accepted' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'delivered')}
                              style={{ padding: '0.6rem', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontWeight: 600, width: '100%' }}
                            >Mark Delivered</button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsReturnedMode(false);
                        }}
                        style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #646cff', background: 'transparent', color: 'white', fontWeight: 600 }}
                      >View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  borderCollapse: 'collapse', 
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(100, 108, 255, 0.2)' }}>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #ccc', fontWeight: '600' }}>Order ID</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #ccc', fontWeight: '600' }}>Customer</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #ccc', fontWeight: '600' }}>Items</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #ccc', fontWeight: '600' }}>Total</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #ccc', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #ccc', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{order.orderId}</td>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: '600' }}>{order.customerDetails?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{order.customerDetails?.email}</div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.9rem' }}>
                            {order.items?.length} item(s)
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>₹{order.totalAmount?.toFixed(2)}</td>
                        <td style={{ padding: '1rem' }}>
                          {order.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={() => handleStatusUpdate(order._id, 'accepted')}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  backgroundColor: '#22c55e',
                                  color: 'white',
                                  border: 'none',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#16a34a'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#22c55e'}
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                              >
                                Deny
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                backgroundColor: getStatusColor(order.status),
                                color: 'white',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                              </span>
                              {order.status === 'accepted' && (
                                <button
                                  onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
                                >
                                  Mark Delivered
                                </button>
                              )}
                              {order.status === 'delivered' && (
                                <button 
                                  onClick={() => openReturnEdit(order)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    backgroundColor: '#ffffff',
                                    color: '#111827',
                                    border: '1px solid #e2e8f0',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  Returned
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button 
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsReturnedMode(false);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              backgroundColor: '#646cff',
                              color: 'white',
                              border: 'none',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#535bf2'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#646cff'}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "2rem"
        }}
        onClick={() => {
          setSelectedOrder(null);
          setTrackingNumber('');
          setIsReturnedMode(false);
          setIsEditMode(false);
        }}
        >
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            position: "relative"
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Top Right Action Buttons (Edit, Save, Cancel) */}
            <div style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              display: "flex",
              gap: "0.5rem",
              alignItems: "center"
            }}>
              {/* Show Edit button only when order was opened via Returned button */}
              {!isEditMode && isReturnedMode && selectedOrder.status === 'delivered' && (
                <button 
                  onClick={() => setIsEditMode(true)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    backgroundColor: "#646cff",
                    color: "white",
                    border: "none",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = "#535bf2"}
                  onMouseOut={(e) => e.target.style.backgroundColor = "#646cff"}
                >
                  Edit
                </button>
              )}

              {isEditMode && (
                <>
                  <button 
                    onClick={saveEditedItems}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => { 
                      setIsEditMode(false); 
                      setEditItems([]);
                      setIsReturnedMode(false);
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#4b5563"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#6b7280"}
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* Close Button */}
              <button 
                onClick={() => {
                  setSelectedOrder(null);
                  setTrackingNumber('');
                  setIsReturnedMode(false);
                  setIsEditMode(false);
                }}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                ×
              </button>
            </div>

            {/* Order Details */}
            <h2 style={{ margin: "0 0 1.5rem 0", color: "#0f172a", fontSize: "1.5rem" }}>
              Order Details - {selectedOrder.orderId}
            </h2>

            {/* Order Information */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Order Information</h3>
              <div style={{ 
                padding: "1.5rem", 
                background: "#f8fafc", 
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
                  gap: "2rem",
                  alignItems: "start"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: "600", minWidth: "120px", color: "#374151" }}>Order Date:</span>
                      <span style={{ color: "#6b7280" }}>
                        {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: "600", minWidth: "120px", color: "#374151" }}>Order Time:</span>
                      <span style={{ color: "#6b7280" }}>
                        {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Customer Information</h3>
              <div style={{ 
                padding: "1.5rem", 
                background: "#f8fafc", 
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                  gap: "1.5rem",
                  alignItems: "start"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: "600", minWidth: "80px", color: "#374151" }}>Name:</span>
                      <span style={{ color: "#6b7280" }}>{selectedOrder.customerDetails?.name || 'N/A'}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: "600", minWidth: "80px", color: "#374151" }}>Email:</span>
                      <span style={{ color: "#6b7280" }}>{selectedOrder.customerDetails?.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: "600", minWidth: "80px", color: "#374151" }}>Phone:</span>
                      <span style={{ color: "#6b7280" }}>{selectedOrder.customerDetails?.phone || 'N/A'}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <span style={{ fontWeight: "600", minWidth: "80px", color: "#374151", marginTop: "0.125rem" }}>Address:</span>
                      <span style={{ color: "#6b7280", lineHeight: "1.4" }}>
                        {selectedOrder.customerDetails?.address ? 
                          `${selectedOrder.customerDetails.address.street || ''}, ${selectedOrder.customerDetails.address.city || ''}, ${selectedOrder.customerDetails.address.state || ''} - ${selectedOrder.customerDetails.address.pincode || ''}`.replace(/^,\s*|,\s*\$/g, '') :
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items with tax details and returns edit */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Order Items</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} style={{
                    padding: "1.5rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    background: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                  }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      {item.product?.photo && (
                        <img 
                          src={item.product.photo} 
                          alt={item.product.name}
                          style={{ 
                            width: "80px", 
                            height: "80px", 
                            objectFit: "cover", 
                            borderRadius: "8px",
                            flexShrink: 0
                          }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: "600", 
                          marginBottom: "0.5rem", 
                          fontSize: "1rem",
                          color: "#111827"
                        }}>
                          {item.product?.name || 'Product Name'}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.5rem", lineHeight: "1.4" }}>
                          {item.product?.description || 'No description available'}
                        </div>
                        
                        {/* Show variant information if available */}
                        {item.variant && item.variant.combination && (
                          <div style={{ 
                            margin: "0 0 0.75rem 0", 
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
                        {(() => {
                          const { quantity, unit, taxPct, lineSubtotal, lineTax, lineTotal } = computeLine(item);
                          return (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem", alignItems: "center" }}>
                              <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                                <span style={{ fontWeight: 500 }}>Quantity:</span> {quantity}
                              </div>
                              <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                                <span style={{ fontWeight: 500 }}>Unit Price:</span> ₹{unit}
                              </div>
                              <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                                <span style={{ fontWeight: 500 }}>Tax:</span> {taxPct}% (₹{lineTax.toFixed(2)})
                              </div>
                              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", backgroundColor: "#f3f4f6", padding: "0.25rem 0.75rem", borderRadius: 6 }}>
                                Line Total: ₹{lineTotal.toFixed(2)}
                              </div>
                            </div>
                          );
                        })()}

                        {isEditMode && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label style={{ color: '#374151', fontSize: '0.9rem' }}>Edit quantity:</label>
                            <input
                              type="number"
                              min="0"
                              value={editItems[index]?.quantity ?? item.quantity}
                              onChange={(e) => setItemQuantity(index, e.target.value)}
                              style={{ width: '90px', padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                            <button
                              onClick={() => removeItem(index)}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #ef4444', background: '#fff1f2', color: '#b91c1c', fontWeight: 600 }}
                            >Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Returned Items (if any) */}
            {Array.isArray(selectedOrder.returnedItems) && selectedOrder.returnedItems.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Returned Items</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {selectedOrder.returnedItems.map((item, idx) => (
                    <div key={idx} style={{
                      padding: "1rem",
                      border: "1px dashed #ef4444",
                      borderRadius: "12px",
                      background: "#fff1f2"
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#991b1b' }}>{item.product?.name || 'Product'}</div>
                        <span style={{ color: '#b91c1c', fontWeight: 600 }}>Returned</span>
                      </div>
                      <div style={{ color: '#7f1d1d', marginTop: '0.25rem' }}>Qty returned: {item.quantity}</div>
                      {item.variant?.combination && (
                        <div style={{ color: '#7f1d1d', marginTop: '0.25rem' }}>
                          {Object.entries(item.variant.combination).map(([k, v]) => (
                            <span key={k} style={{ marginRight: '0.5rem' }}>{k}: {v}</span>
                          ))}
                        </div>
                      )}
                      {item.returnedAt && (
                        <div style={{ color: '#991b1b', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                          {new Date(item.returnedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary with tax */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Order Summary</h3>
              <div style={{ 
                padding: "1rem", 
                background: "#f8fafc", 
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                width: '100%'
              }}>
                {(() => {
                  const lines = (selectedOrder.items || []).map(computeLine);
                  const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
                  const totalTax = lines.reduce((s, l) => s + l.lineTax, 0);
                  const grandTotal = subtotal + totalTax;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {/* Per-item tax rows */}
                      {(selectedOrder.items || []).map((it, idx) => {
                        const { taxPct, lineSubtotal, lineTax } = computeLine(it);
                        return (
                          <div key={`tax-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{it.product?.name || 'Product'} (Tax {taxPct}%)</span>
                            <span style={{ color: '#111827', fontSize: '0.9rem' }}>₹{lineSubtotal.toFixed(2)} + ₹{lineTax.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
                        <span style={{ color: "#374151", fontSize: "0.9rem" }}>Subtotal:</span>
                        <span style={{ color: "#374151", fontWeight: "500", fontSize: '0.95rem' }}>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
                        <span style={{ color: "#374151", fontSize: "0.9rem" }}>Total Tax:</span>
                        <span style={{ color: "#374151", fontWeight: "500", fontSize: '0.95rem' }}>₹{totalTax.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
                        <span style={{ color: "#374151", fontSize: "0.9rem" }}>Shipping:</span>
                        <span style={{ color: "#059669", fontWeight: "600", fontSize: '0.95rem' }}>Free</span>
                      </div>
                      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0.4rem 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "0.75rem", marginTop: "0.25rem" }}>
                        <span style={{ fontSize: "1rem", fontWeight: "700", color: "#111827" }}>Total:</span>
                        <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#111827" }}>₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>


            {/* Order Notes */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Order Notes</h3>
              <div style={{ 
                padding: "1rem", 
                background: "#f8fafc", 
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}>
                <textarea
                  placeholder="Add internal notes about this order (visible only to sellers)..."
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.9rem",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  defaultValue={selectedOrder.sellerNotes || ''}
                  onChange={(e) => {
                    // You can add functionality to save notes here
                    console.log('Order notes updated:', e.target.value);
                  }}
                />
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>
                  These notes are for internal use only and won't be visible to customers.
                </div>
              </div>
            </div>


            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: 'wrap' }}>
              {!isEditMode && selectedOrder.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder._id, 'accepted')}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      backgroundColor: "#22c55e",
                      color: "white",
                      border: "none",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#16a34a"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#22c55e"}
                  >
                    Accept Order
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder._id, 'cancelled')}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#dc2626"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#ef4444"}
                  >
                    Deny Order
                  </button>
                </>
              )}

              {!isEditMode && selectedOrder.status === 'accepted' && (
                <button 
                  onClick={() => handleStatusUpdate(selectedOrder._id, 'delivered')}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    backgroundColor: "#059669",
                    color: "white",
                    border: "none",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = "#047857"}
                  onMouseOut={(e) => e.target.style.backgroundColor = "#059669"}
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
