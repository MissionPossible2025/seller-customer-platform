// src/pages/UpdateDelivery.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function UpdateDelivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch delivery orders when component mounts
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders`)
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch orders:", err);
        setLoading(false);
      });
  }, []);

  // Handle updating delivery status
  const handleUpdate = (orderId, newStatus) => {
    axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/${orderId}`, { status: newStatus })
      .then(res => {
        setOrders(prev => prev.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        alert("Delivery status updated successfully!");
      })
      .catch(err => alert("Failed to update delivery status"));
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      maxWidth: "1000px",
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
        <h2 style={{ marginBottom: "2rem", fontSize: "2rem" }}>Update Delivery</h2>
        {orders.length === 0 ? (
          <p style={{ fontSize: "1.1rem", color: "#888" }}>No delivery orders found.</p>
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
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Product</th>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Quantity</th>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "1rem", borderBottom: "1px solid #ccc", fontWeight: "600" }}>Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{order._id}</td>
                    <td style={{ padding: "1rem" }}>{order.customerName}</td>
                    <td style={{ padding: "1rem" }}>{order.productName}</td>
                    <td style={{ padding: "1rem" }}>{order.quantity}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        backgroundColor: order.status === "Delivered" ? "#22c55e" : order.status === "Shipped" ? "#3b82f6" : "#f59e0b",
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: "500"
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button 
                          onClick={() => handleUpdate(order._id, "Shipped")}
                          style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            cursor: "pointer",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            transition: "all 0.3s ease"
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"}
                          onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}
                        >
                          Shipped
                        </button>
                        <button 
                          onClick={() => handleUpdate(order._id, "Delivered")}
                          style={{
                            padding: "0.5rem 1rem",
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
                          Delivered
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
