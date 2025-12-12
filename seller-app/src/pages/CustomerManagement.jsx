import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CustomerManagement({ user }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
  // removed per updated UX: inline show/hide details

  // Fetch customers when component mounts
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/seller/${user?._id}`);
        setCustomers(response.data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchCustomers();
    }
  }, [user?._id]);

  // Add new customer
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers`, {
        ...newCustomer,
        sellerId: user._id
      });
      setCustomers([...customers, response.data]);
      setNewCustomer({ name: '', phone: '' });
      setShowAddForm(false);
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer. Please try again.');
    }
  };

  // Update customer
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer.name.trim() || !editingCustomer.phone.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/${editingCustomer._id}`, {
        name: editingCustomer.name,
        phone: editingCustomer.phone
      });
      setCustomers(customers.map(c => c._id === editingCustomer._id ? response.data : c));
      setEditingCustomer(null);
      alert('Customer updated successfully!');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error updating customer. Please try again.');
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to remove this customer? They will no longer be able to access the app.')) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/${customerId}`);
      setCustomers(customers.filter(c => c._id !== customerId));
      alert('Customer removed successfully!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error removing customer. Please try again.');
    }
  };

  // Open history modal and fetch orders for the customer
  const openHistory = async (customer) => {
    setShowHistory(true);
    setHistoryCustomer(customer);
    setHistoryOrders([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      // Fetch latest customer profile and orders
      const [custRes, ordersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/${customer._id}`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/customer/${customer._id}`)
      ]);

      const latestCustomer = custRes.data?.customer || customer;
      const orders = ordersRes.data?.orders || [];

      // Fallback to order.customer (populated) or order.customerDetails if name/phone missing
      const firstOrder = orders?.[0] || {};
      const firstOrderCustomer = firstOrder?.customer || {};
      const firstOrderDetails = firstOrder?.customerDetails || {};
      const mergedCustomer = {
        ...latestCustomer,
        name: (latestCustomer?.name && latestCustomer.name.trim())
          ? latestCustomer.name
          : (firstOrderCustomer?.name || firstOrderDetails?.name || ''),
        phone: (latestCustomer?.phone && latestCustomer.phone.trim())
          ? latestCustomer.phone
          : (firstOrderCustomer?.phone || firstOrderDetails?.phone || '')
      };

      setHistoryCustomer(mergedCustomer);
      setHistoryOrders(orders);
    } catch (error) {
      console.error('Error fetching customer history/profile:', error);
      setHistoryError('Failed to load history or profile.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Helper function to compute line totals with tax
  const computeLine = (item) => {
    const quantity = item?.quantity || 0;
    const unit = (item?.discountedPrice && item.discountedPrice < item.price) ? item.discountedPrice : item?.price || 0;
    const taxPct = item?.product?.taxPercentage ?? 0;
    const lineSubtotal = unit * quantity;
    const lineTax = (lineSubtotal * taxPct) / 100;
    const lineTotal = lineSubtotal + lineTax;
    return { quantity, unit, taxPct, lineSubtotal, lineTax, lineTotal };
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .customer-list-header {
            display: none !important;
          }
          .customer-list-row {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .customer-list-row > div {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 0.75rem;
          }
          .customer-list-row > div:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .customer-list-row > div > div:first-child {
            display: block !important;
            margin-bottom: 0.5rem;
          }
          .customer-actions {
            justify-content: flex-start !important;
          }
        }
      `}</style>
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
        <h1 style={{ marginBottom: "1rem", fontSize: "2.5rem" }}>Customer Management</h1>
        <p style={{ marginBottom: "2rem", fontSize: "1.1rem", color: "#888" }}>
          Manage which customers can access your app
        </p>

        {/* Search and Add Button */}
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          marginBottom: "2rem",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: "300px",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "1rem"
            }}
          />
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "#22c55e",
              color: "white",
              border: "none"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#16a34a"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#22c55e"}
          >
            Add Customer
          </button>
        </div>

        {/* Add Customer Form Modal */}
        {showAddForm && (
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
            setShowAddForm(false);
            setNewCustomer({ name: '', phone: '' });
          }}
          >
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: "0 0 1.5rem 0", color: "#0f172a", fontSize: "1.5rem" }}>
                Add New Customer
              </h2>
              <form onSubmit={handleAddCustomer}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="Enter customer name"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "1rem"
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="Enter phone number"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "1rem"
                    }}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCustomer({ name: '', phone: '' });
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      backgroundColor: "#22c55e",
                      color: "white",
                      border: "none"
                    }}
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Form Modal */}
        {editingCustomer && (
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
          onClick={() => setEditingCustomer(null)}
          >
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: "0 0 1.5rem 0", color: "#0f172a", fontSize: "1.5rem" }}>
                Edit Customer
              </h2>
              <form onSubmit={handleUpdateCustomer}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    placeholder="Enter customer name"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "1rem"
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                    placeholder="Enter phone number"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "1rem"
                    }}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none"
                    }}
                  >
                    Update Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customers List */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#888", fontSize: "1.2rem" }}>Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
              {searchTerm ? 'No customers found matching your search' : 'No customers added yet'}
            </p>
            <p>Start by adding your first customer!</p>
          </div>
        ) : (
          <div style={{ 
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            textAlign: "left",
            width: "100%"
          }}>
            {/* Table Header */}
            <div className="customer-list-header" style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 2fr 1fr",
              gap: "1rem",
              padding: "1rem",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontWeight: "600",
              fontSize: "0.95rem",
              color: "#fff"
            }}>
              <div>Name</div>
              <div>Phone Number</div>
              <div>Address</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>
            
            {/* Customer Rows */}
            {filteredCustomers.map((customer) => (
              <div key={customer._id} className="customer-list-row" style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 2fr 1fr",
                gap: "1rem",
                padding: "1.25rem 1rem",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                alignItems: "center"
              }}>
                {/* Name */}
                <div>
                  <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "0.25rem", display: "none" }}>Name</div>
                  <div style={{ color: "#ffffff", fontWeight: "600", fontSize: "1.1rem" }}>
                    {customer.name || '—'}
                  </div>
                </div>
                
                {/* Phone */}
                <div>
                  <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "0.25rem", display: "none" }}>Phone</div>
                  <div style={{ color: "#ffffff", fontSize: "1rem" }}>
                    {customer.phone || '—'}
                  </div>
                </div>
                
                {/* Address */}
                <div>
                  <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "0.25rem", display: "none" }}>Address</div>
                  <div style={{ color: "#ffffff", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {customer?.address?.street ? (
                      <>
                        <div style={{ fontWeight: "500", color: "#ffffff" }}>{customer.address.street}</div>
                        <div style={{ color: "#ffffff", fontSize: "0.9rem" }}>
                          {customer.address.city || ''}{customer.address.city && customer.address.state ? ', ' : ''}
                          {customer.address.state || ''}
                          {customer.address.pincode ? ` - ${customer.address.pincode}` : ''}
                        </div>
                        {customer.address.country && customer.address.country !== 'India' && (
                          <div style={{ color: "#ffffff", fontSize: "0.85rem" }}>{customer.address.country}</div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: "#ffffff", fontStyle: "italic" }}>No address provided</div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ 
                  display: "flex", 
                  gap: "0.5rem",
                  justifyContent: "flex-end",
                  flexWrap: "wrap"
                }}
                className="customer-actions"
                >
                  <button
                    onClick={() => openHistory(customer)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backgroundColor: "#0ea5e9",
                      color: "white",
                      border: "none",
                      whiteSpace: "nowrap"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#0284c7"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#0ea5e9"}
                  >
                    History
                  </button>
                  <button
                    onClick={() => setEditingCustomer(customer)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      whiteSpace: "nowrap"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer._id)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      whiteSpace: "nowrap"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#dc2626"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#ef4444"}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* History Modal */}
        {showHistory && (
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
            zIndex: 1100,
            padding: "2rem"
          }}
          onClick={() => {
            setShowHistory(false);
            setHistoryCustomer(null);
            setHistoryOrders([]);
            setHistoryError('');
          }}
          >
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: "1.5rem", letterSpacing: 0.2 }}>Customer History</h2>
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setHistoryCustomer(null);
                    setHistoryOrders([]);
                    setHistoryError('');
                  }}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: "#f3f4f6",
                    cursor: "pointer",
                    color: "#000000"
                  }}
                >
                  Close
                </button>
              </div>

              {/* Profile Details */}
              {historyCustomer && (
                <div style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1rem",
                  background: "#f9fafb",
                  position: "relative"
                }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.75rem", color: "#111827", fontSize: "1.25rem" }}>Profile</div>
                  
                  {/* Phone in right corner */}
                  <div style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    textAlign: "right"
                  }}>
                    <div style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Phone</div>
                    <div style={{ color: "#111827", fontWeight: 600 }}>{(historyCustomer?.phone && historyCustomer.phone.trim()) ? historyCustomer.phone : '—'}</div>
                  </div>

                  {/* Name, Email, and Address on the left */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "120px" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: "#6b7280", minWidth: 64 }}>Name:</span>
                      <span style={{ color: "#111827", fontWeight: 600 }}>{(historyCustomer?.name && historyCustomer.name.trim()) ? historyCustomer.name : '—'}</span>
                    </div>
                    {historyCustomer?.email && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <span style={{ color: "#6b7280", minWidth: 64 }}>Email:</span>
                        <span style={{ color: "#111827", fontWeight: 600 }}>{historyCustomer.email}</span>
                      </div>
                    )}
                    <div>
                      <div style={{ color: "#6b7280", marginBottom: "0.25rem" }}>Address</div>
                      <div style={{ color: "#111827", fontWeight: 500 }}>{historyCustomer?.address?.street || '—'}</div>
                      <div style={{ color: "#111827", fontWeight: 500 }}>
                        {(historyCustomer?.address?.city || '—')}, {(historyCustomer?.address?.state || '—')} {historyCustomer?.address?.pincode ? `- ${historyCustomer.address.pincode}` : ''}
                      </div>
                      <div style={{ color: "#111827", fontWeight: 500 }}>{historyCustomer?.address?.country || '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders List */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#111827" }}>Orders</div>
                {historyLoading && <div style={{ color: "#6b7280" }}>Loading orders...</div>}
                {historyError && <div style={{ color: "#b91c1c" }}>{historyError}</div>}
                {!historyLoading && !historyError && historyOrders.length === 0 && (
                  <div style={{ color: "#6b7280" }}>No orders found for this customer.</div>
                )}
                {!historyLoading && !historyError && historyOrders.length > 0 && (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {historyOrders.map((order) => (
                        <div key={order._id} style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "1rem",
                          background: "#ffffff"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                            <div style={{ fontWeight: 600 }}>#{order.orderId || order._id.slice(-6)}</div>
                            <div style={{ color: "#6b7280" }}>{new Date(order.createdAt).toLocaleString()}</div>
                          </div>

                          <div style={{ marginBottom: "0.5rem", color: "#111827", fontWeight: 600, textAlign: "left" }}>Total: ₹{order.totalAmount}</div>

                          {Array.isArray(order.items) && order.items.length > 0 && (
                            <div style={{
                              display: "grid",
                              gap: "0.5rem",
                              borderTop: "1px solid #e5e7eb",
                              paddingTop: "0.5rem",
                              textAlign: "left"
                            }}>
                              {order.items.map((it, idx) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ color: "#111827", fontWeight: 500, marginRight: "0.75rem" }}>{it.product?.name || 'Product'}</div>
                                  <div style={{ color: "#6b7280", minWidth: 48, textAlign: "left" }}>x{it.quantity}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Controls placed closer to the box, slightly lower */}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                            <button
                              onClick={async () => {
                                setSelectedOrderLoading(true);
                                try {
                                  const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/${order._id}`);
                                  setSelectedOrder(res.data?.order || res.data);
                                } catch (error) {
                                  console.error('Error fetching order details:', error);
                                  alert('Failed to load order details');
                                } finally {
                                  setSelectedOrderLoading(false);
                                }
                              }}
                              style={{
                                padding: "0.45rem 0.85rem",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                                background: "#f3f4f6",
                                cursor: "pointer",
                                color: "#111827",
                                fontWeight: 600
                              }}
                              disabled={selectedOrderLoading}
                            >
                              {selectedOrderLoading ? 'Loading...' : 'View more'}
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Order Details Modal - Same as ManageOrders */}
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
          zIndex: 1100,
          padding: "2rem"
        }}
        onClick={() => setSelectedOrder(null)}
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
              onClick={() => setSelectedOrder(null)}
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
                    {selectedOrder.trackingNumber && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: "600", minWidth: "120px", color: "#374151" }}>Tracking:</span>
                        <span style={{ color: "#6b7280", fontFamily: "monospace" }}>{selectedOrder.trackingNumber}</span>
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

            {/* Order Items with tax details */}
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
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  );
}
