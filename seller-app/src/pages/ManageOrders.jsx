// src/pages/ManageOrders.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function ManageOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

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
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "2rem"
    }}>
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "100%",
        textAlign: "center"
      }}>
        <h2 style={{ marginBottom: "2rem", fontSize: "2rem" }}>Order Management</h2>
        <p style={{ marginBottom: "2rem", fontSize: "1.1rem", color: "#888" }}>
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              borderCollapse: "collapse", 
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(100, 108, 255, 0.2)" }}>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Order ID</th>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Customer</th>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Items</th>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Total</th>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{order.orderId}</td>
                    <td style={{ padding: "1rem" }}>
                      <div>
                        <div style={{ fontWeight: "600" }}>{order.customerDetails?.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#888" }}>{order.customerDetails?.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.9rem" }}>
                        {order.items?.length} item(s)
                      </div>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>₹{order.totalAmount?.toFixed(2)}</td>
                    <td style={{ padding: "1rem" }}>
                      {order.status === 'pending' ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button 
                            onClick={() => handleStatusUpdate(order._id, 'accepted')}
                            style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: "500",
                              cursor: "pointer",
                              backgroundColor: "#22c55e",
                              color: "white",
                              border: "none",
                              transition: "all 0.3s ease"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#16a34a"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "#22c55e"}
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                            style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: "500",
                              cursor: "pointer",
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              transition: "all 0.3s ease"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#dc2626"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "#ef4444"}
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "12px",
                            backgroundColor: getStatusColor(order.status),
                            color: "white",
                            fontSize: "0.8rem",
                            fontWeight: "500"
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
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "500",
                          cursor: "pointer",
                          backgroundColor: "#646cff",
                          color: "white",
                          border: "none",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = "#535bf2"}
                        onMouseOut={(e) => e.target.style.backgroundColor = "#646cff"}
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
            {/* Close Button */}
            <button 
              onClick={() => {
                setSelectedOrder(null);
                setTrackingNumber('');
              }}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
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

            {/* Order Items */}
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
                        <div style={{ 
                          fontSize: "0.9rem", 
                          color: "#6b7280", 
                          marginBottom: "0.75rem",
                          lineHeight: "1.4"
                        }}>
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
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.5rem"
                        }}>
                          <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                            <span style={{ fontWeight: "500" }}>Quantity:</span> {item.quantity}
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                            <span style={{ fontWeight: "500" }}>Unit Price:</span> ₹{item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price}
                          </div>
                          <div style={{ 
                            fontSize: "1rem", 
                            fontWeight: "600", 
                            color: "#111827",
                            backgroundColor: "#f3f4f6",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "6px"
                          }}>
                            Total: ₹{((item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Order Summary</h3>
              <div style={{ 
                padding: "1.5rem", 
                background: "#f8fafc", 
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "0.5rem 0"
                  }}>
                    <span style={{ color: "#374151", fontSize: "0.95rem" }}>Subtotal:</span>
                    <span style={{ color: "#374151", fontWeight: "500" }}>₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "0.5rem 0"
                  }}>
                    <span style={{ color: "#374151", fontSize: "0.95rem" }}>Shipping:</span>
                    <span style={{ color: "#059669", fontWeight: "600" }}>Free</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "0.5rem 0"
                  }}>
                    <span style={{ color: "#374151", fontSize: "0.95rem" }}>Tax:</span>
                    <span style={{ color: "#374151", fontWeight: "500" }}>₹0.00</span>
                  </div>
                  <hr style={{ 
                    border: "none", 
                    borderTop: "2px solid #e5e7eb", 
                    margin: "0.5rem 0" 
                  }} />
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginTop: "0.5rem"
                  }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#111827" }}>Total:</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "#111827" }}>₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
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
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              {selectedOrder.status === 'pending' && (
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

              {selectedOrder.status === 'accepted' && (
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
