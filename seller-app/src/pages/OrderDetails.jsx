import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrderDetails({ user }) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#22c55e';
      case 'cancelled': return '#ef4444';
      case 'delivered': return '#059669';
      default: return '#6b7280';
    }
  };

  // Compute price breakdowns
  const items = order.items || [];
  const lines = items.map((it) => {
    const quantity = it.quantity || 0;
    const unit = (it.discountedPrice && it.discountedPrice < it.price) ? it.discountedPrice : it.price;
    const taxPct = it.product?.taxPercentage ?? 0;
    const lineSubtotal = unit * quantity;
    const lineTax = (lineSubtotal * taxPct) / 100;
    const lineTotal = lineSubtotal + lineTax;
    return { name: it.product?.name || 'Product', quantity, unit, taxPct, lineSubtotal, lineTax, lineTotal };
  });
  const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
  const totalTax = lines.reduce((s, l) => s + l.lineTax, 0);
  const grandTotal = subtotal + totalTax;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", width: "100%", maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
      <div style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "2rem", borderRadius: 12, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Order Details - {order.orderId || id}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ padding: '0.25rem 0.75rem', borderRadius: 9999, background: getStatusColor(order.status), color: '#fff', fontWeight: 600 }}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </span>
            <button onClick={() => navigate(-1)} style={{ padding: "0.5rem 0.9rem", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f3f4f6", cursor: "pointer" }}>Back</button>
          </div>
        </div>

        {/* Order Info (no customer info here per requirement) */}
        <div style={{ marginBottom: "1.25rem", background: "#f8fafc", border: "1px solid #e5e7f0", borderRadius: 12, padding: "1rem", textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            <div><span style={{ color: '#374151', fontWeight: 600 }}>Order Date: </span><span style={{ color: '#6b7280' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</span></div>
            <div><span style={{ color: '#374151', fontWeight: 600 }}>Order Time: </span><span style={{ color: '#6b7280' }}>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}</span></div>
            {order.trackingNumber && (<div><span style={{ color: '#374151', fontWeight: 600 }}>Tracking: </span><span style={{ color: '#6b7280' }}>{order.trackingNumber}</span></div>)}
          </div>
        </div>

        {/* Items: left-aligned name + quantity, with unit and line totals */}
        <div style={{ marginBottom: "1.25rem", textAlign: 'left' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Order Items</h3>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
            <div style={{ display: 'grid', gap: '0.5rem', padding: '0.75rem 1rem' }}>
              {lines.map((l, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ color: '#111827', fontWeight: 600, marginRight: 12 }}>{l.name}</div>
                  <div style={{ color: '#6b7280' }}>x{l.quantity}</div>
                  <div style={{ color: '#111827', fontWeight: 600 }}>₹{(l.unit * l.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary with tax percentage details and price details */}
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Order Summary</h3>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: '0.85rem', width: '100%' }}>
            {/* Per-item tax percentage details */}
            <div style={{ marginBottom: '0.4rem' }}>
              {lines.map((l, idx) => (
                <div key={`tax-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', padding: '0.15rem 0' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{l.name} (Tax {l.taxPct}%)</span>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>₹{l.lineSubtotal.toFixed(2)}</span>
                  <span style={{ color: '#111827', fontWeight: 600, fontSize: '0.9rem' }}>+ ₹{l.lineTax.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
              <span style={{ fontSize: '0.9rem' }}>Subtotal</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
              <span style={{ fontSize: '0.9rem' }}>Total Tax</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>₹{totalTax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
              <span style={{ fontSize: '0.9rem' }}>Shipping</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Free</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0.4rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Final Total (including tax) at the very end */}
        <div style={{
          marginTop: '0.85rem',
          textAlign: 'left',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '0.6rem 0.9rem',
          width: '100%'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Total Amount (incl. tax)</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


