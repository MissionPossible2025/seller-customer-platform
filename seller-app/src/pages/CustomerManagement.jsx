import { useState, useEffect } from "react";
import axios from "axios";

export default function CustomerManagement({ user }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch customers when component mounts
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/customers/seller/${user?._id}`);
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
      const response = await axios.post('http://localhost:5000/api/customers', {
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
      const response = await axios.put(`http://localhost:5000/api/customers/${editingCustomer._id}`, {
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
      await axios.delete(`http://localhost:5000/api/customers/${customerId}`);
      setCustomers(customers.filter(c => c._id !== customerId));
      alert('Customer removed successfully!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error removing customer. Please try again.');
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

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
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
            gap: "1.5rem",
            textAlign: "left"
          }}>
            {filteredCustomers.map((customer) => (
              <div key={customer._id} style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Name</div>
                  <div style={{ color: "#fff", fontWeight: "600", fontSize: "1.1rem" }}>
                    {customer.name}
                  </div>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Phone</div>
                  <div style={{ color: "#fff", fontSize: "1rem" }}>
                    {customer.phone}
                  </div>
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Added</div>
                  <div style={{ color: "#ccc", fontSize: "0.9rem" }}>
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ 
                  display: "flex", 
                  gap: "0.75rem",
                  justifyContent: "flex-end"
                }}>
                  <button
                    onClick={() => setEditingCustomer(customer)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none"
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
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none"
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
      </div>
    </div>
  );
}
