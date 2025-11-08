import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/${id}`);
        setOrder(res.data?.order || res.data);
      } catch (e) {
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p>Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div>
          <p style={{ marginBottom: "1rem" }}>{error || "Order not found"}</p>
          <button onClick={() => navigate(-1)} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f3f4f6", cursor: "pointer" }}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      minHeight: "100vh", 
      width: "100%", 
      maxWidth: 1000, 
      margin: "0 auto", 
      padding: "2rem",
      background: "#f8fafc"
    }}>
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
      }}>
        {/* Close Button */}
        <button 
          onClick={() => navigate(-1)}
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
          Order Details - {order.orderId || id}
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
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: "600", minWidth: "120px", color: "#374151" }}>Order Time:</span>
                  <span style={{ color: "#6b7280" }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
                {order.trackingNumber && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: "600", minWidth: "120px", color: "#374151" }}>Tracking:</span>
                    <span style={{ color: "#6b7280" }}>{order.trackingNumber}</span>
                  </div>
                )}
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
                  <span style={{ color: "#6b7280" }}>{order.customerDetails?.name || 'N/A'}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: "600", minWidth: "80px", color: "#374151" }}>Email:</span>
                  <span style={{ color: "#6b7280" }}>{order.customerDetails?.email || 'N/A'}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: "600", minWidth: "80px", color: "#374151" }}>Phone:</span>
                  <span style={{ color: "#6b7280" }}>{order.customerDetails?.phone || 'N/A'}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <span style={{ fontWeight: "600", minWidth: "80px", color: "#374151", marginTop: "0.125rem" }}>Address:</span>
                  <span style={{ color: "#6b7280", lineHeight: "1.4" }}>
                    {order.customerDetails?.address ? 
                      `${order.customerDetails.address.street || ''}, ${order.customerDetails.address.city || ''}, ${order.customerDetails.address.state || ''} - ${order.customerDetails.address.pincode || ''}`.replace(/^,\s*|,\s*\$/g, '') :
                      'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items with tax details */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Order Items</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {order.items?.map((item, index) => (
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Returned Items (if any) */}
        {Array.isArray(order.returnedItems) && order.returnedItems.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>Returned Items</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {order.returnedItems.map((item, idx) => (
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
              const lines = (order.items || []).map(computeLine);
              const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
              const totalTax = lines.reduce((s, l) => s + l.lineTax, 0);
              const grandTotal = subtotal + totalTax;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {/* Per-item tax rows */}
                  {(order.items || []).map((it, idx) => {
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
      </div>
    </div>
  );
}
