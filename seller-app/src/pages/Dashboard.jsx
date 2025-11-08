import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'products'
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const [arrangeMode, setArrangeMode] = useState({}); // per-category arrange mode
  const [dragState, setDragState] = useState({ category: null, productId: null });
  const [categoryBuffers, setCategoryBuffers] = useState({}); // local per-category order while arranging
  

  // Fetch products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/seller/${user?._id}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchProducts();
    }
  }, [user?._id]);

  // Fetch unread order count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/seller/${user?._id}`);
        const orders = response.data.orders || [];
        
        // Get last viewed timestamp from localStorage
        const lastViewedKey = `last_viewed_orders_${user?._id}`;
        const lastViewed = localStorage.getItem(lastViewedKey);
        const lastViewedTime = lastViewed ? new Date(lastViewed) : new Date(0);
        
        // Count orders created after last viewed
        const unreadCount = orders.filter(order => {
          const orderTime = new Date(order.createdAt);
          return orderTime > lastViewedTime;
        }).length;
        
        setUnreadOrderCount(unreadCount);
      } catch (error) {
        console.error('Error fetching unread order count:', error);
      }
    };

    if (user?._id) {
      fetchUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?._id]);

  

  // Group products by category and sort by displayOrder
  const groupedProducts = products.reduce((groups, product) => {
    const category = product.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {});
  
  // Sort products within each category by displayOrder
  Object.keys(groupedProducts).forEach(category => {
    groupedProducts[category].sort((a, b) => {
      const orderA = a.displayOrder !== undefined ? a.displayOrder : 999999;
      const orderB = b.displayOrder !== undefined ? b.displayOrder : 999999;
      return orderA - orderB;
    });
  });

  // (Removed modal filtering and grouping)

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      maxWidth: "800px",
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
        <h1 style={{ marginBottom: "1rem", fontSize: "2.5rem" }}>Welcome, {user.name}</h1>
        <h2 style={{ marginBottom: "2rem", fontSize: "1.5rem", color: "#888" }}>Seller Dashboard</h2>

        {/* Tab Navigation */}
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          marginBottom: "2rem",
          justifyContent: "center"
        }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === 'dashboard' ? "#646cff" : "transparent",
              color: activeTab === 'dashboard' ? "white" : "#646cff",
              border: "2px solid #646cff"
            }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === 'products' ? "#646cff" : "transparent",
              color: activeTab === 'products' ? "white" : "#646cff",
              border: "2px solid #646cff"
            }}
          >
            View Products
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "300px",
            margin: "0 auto"
          }}>
            <button 
              onClick={() => navigate("/add-item")}
              style={{
                padding: "1rem 2rem",
                borderRadius: "8px",
                fontSize: "1.1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backgroundColor: "#646cff",
                color: "white",
                border: "none"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#535bf2"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#646cff"}
            >
              Add New Product
            </button>
            {/* Edit Item button removed to keep single edit entry point */}
            <button 
              onClick={() => {
                // Update last viewed timestamp
                const lastViewedKey = `last_viewed_orders_${user?._id}`;
                localStorage.setItem(lastViewedKey, new Date().toISOString());
                setUnreadOrderCount(0);
                navigate("/manage-orders");
              }}
              style={{
                padding: "1rem 2rem",
                borderRadius: "8px",
                fontSize: "1.1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backgroundColor: "#646cff",
                color: "white",
                border: "none",
                position: "relative"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#535bf2"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#646cff"}
            >
              Order Management
              {unreadOrderCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
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
                  {unreadOrderCount > 9 ? '9+' : unreadOrderCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate("/customer-management")}
              style={{
                padding: "1rem 2rem",
                borderRadius: "8px",
                fontSize: "1.1rem",
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
              Customer Management
            </button>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div style={{ textAlign: "left", maxHeight: "600px", overflowY: "auto" }}>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontSize: "1rem"
                }}
              />
            </div>
            {loading ? (
              <p style={{ textAlign: "center", color: "#888" }}>Loading products...</p>
            ) : Object.keys(groupedProducts).length === 0 ? (
              <div style={{ textAlign: "center", color: "#888" }}>
                <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>No products found</p>
                <p>Start by adding your first product!</p>
              </div>
            ) : (
              Object.entries(groupedProducts).map(([category, categoryProducts]) => {
                const filtered = categoryProducts.filter(p => {
                  const q = searchTerm.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q) ||
                    (p.category || '').toLowerCase().includes(q)
                  );
                });
                if (filtered.length === 0) return null;
                
                // Sort filtered products by displayOrder
                const sortedFiltered = [...filtered].sort((a, b) => {
                  const orderA = a.displayOrder !== undefined ? a.displayOrder : 999999;
                  const orderB = b.displayOrder !== undefined ? b.displayOrder : 999999;
                  return orderA - orderB;
                });
                
                const isArranging = !!arrangeMode[category];
                const buffer = categoryBuffers[category] || sortedFiltered;
                const displayItems = isArranging ? buffer : sortedFiltered;
                
                const onDragStart = (product) => (e) => {
                  if (!isArranging) return;
                  setDragState({ category, productId: product._id });
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", product._id);
                };

                const onDragOver = (target) => (e) => {
                  if (!isArranging) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                };

                const onDrop = (target) => (e) => {
                  if (!isArranging) return;
                  e.preventDefault();
                  const sourceId = dragState.productId;
                  if (!sourceId || !buffer) return;
                  const fromIdx = buffer.findIndex((p) => p._id === sourceId);
                  const toIdx = buffer.findIndex((p) => p._id === target._id);
                  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
                  const newBuf = [...buffer];
                  const [moved] = newBuf.splice(fromIdx, 1);
                  newBuf.splice(toIdx, 0, moved);
                  setCategoryBuffers((prev) => ({ ...prev, [category]: newBuf }));
                  setDragState({ category: null, productId: null });
                };

                const startArrange = () => {
                  setArrangeMode((prev) => ({ ...prev, [category]: true }));
                  setCategoryBuffers((prev) => ({ ...prev, [category]: sortedFiltered.slice() }));
                };

                const cancelArrange = () => {
                  setArrangeMode((prev) => ({ ...prev, [category]: false }));
                  setCategoryBuffers((prev) => {
                    const copy = { ...prev };
                    delete copy[category];
                    return copy;
                  });
                  setDragState({ category: null, productId: null });
                };

                const saveArrange = async () => {
                  try {
                    const orderedIds = (categoryBuffers[category] || []).map((p) => p._id);
                    await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/order/update`, { productIds: orderedIds });
                    alert("Order saved successfully!");
                    setArrangeMode((prev) => ({ ...prev, [category]: false }));
                    setCategoryBuffers((prev) => {
                      const copy = { ...prev };
                      delete copy[category];
                      return copy;
                    });
                    // Refresh products to reflect displayOrder from backend
                    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/seller/${user?._id}`);
                    setProducts(response.data);
                  } catch (err) {
                    alert("Failed to save order: " + err.message);
                  }
                };
                
                return (
                <div key={category} style={{ marginBottom: "2rem" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "1rem"
                  }}>
                    <h3 style={{ 
                      color: "#646cff", 
                      fontSize: "1.5rem", 
                      margin: 0,
                      borderBottom: "2px solid #646cff",
                      paddingBottom: "0.5rem",
                      flex: 1
                    }}>
                      {category} ({filtered.length} items)
                    </h3>
                    {!isArranging ? (
                      <button 
                        onClick={startArrange} 
                        style={{ 
                          padding: "0.4rem 0.8rem", 
                          border: "1px solid #6366f1", 
                          background: "white", 
                          color: "#6366f1", 
                          borderRadius: 8, 
                          cursor: "pointer",
                          marginLeft: "1rem",
                          fontSize: "0.9rem",
                          fontWeight: "500"
                        }}
                      >
                        Arrange Products
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
                        <button 
                          onClick={saveArrange} 
                          style={{ 
                            padding: "0.4rem 0.8rem", 
                            border: "none", 
                            background: "#10b981", 
                            color: "white", 
                            borderRadius: 8, 
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: "500"
                          }}
                        >
                          Save
                        </button>
                        <button 
                          onClick={cancelArrange} 
                          style={{ 
                            padding: "0.4rem 0.8rem", 
                            border: "1px solid #ef4444", 
                            background: "white", 
                            color: "#ef4444", 
                            borderRadius: 8, 
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: "500"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
                    gap: "1rem" 
                  }}>
                    {displayItems.map((product, idx) => (
                      <div 
                        key={product._id} 
                        draggable={isArranging}
                        onDragStart={onDragStart(product)}
                        onDragOver={onDragOver(product)}
                        onDrop={onDrop(product)}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          padding: "1rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          cursor: isArranging ? "move" : "default",
                          position: "relative"
                        }}
                      >
                        {isArranging && (
                          <div style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "#6366f1",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                            zIndex: 10
                          }}>
                            {idx + 1}
                          </div>
                        )}
                        {product.photo && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <img 
                              src={product.photo}
                              alt={product.name}
                              style={{ 
                                width: "100%",
                                maxHeight: "220px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                cursor: "zoom-in",
                                backgroundColor: "#222"
                              }}
                              onError={(e) => e.target.style.display = 'none'}
                              onClick={() => setZoomImageUrl(product.photo)}
                            />
                          </div>
                        )}
                        <div style={{ marginBottom: "0.5rem" }}>
                          <div style={{ color: "#aaa", fontSize: "0.8rem" }}>Product Name</div>
                          <div style={{ color: "#fff", fontWeight: 600 }}>{product.name}</div>
                        </div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <div style={{ color: "#aaa", fontSize: "0.8rem" }}>Description</div>
                          <div style={{ color: "#ccc" }}>{product.description}</div>
                        </div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <div style={{ color: "#aaa", fontSize: "0.8rem" }}>Stock Status</div>
                          <div style={{ color: "#fff" }}>{product.stockStatus || product.hasVariations ? 'Has Variations' : 'Standard'}</div>
                        </div>
                        <div style={{ marginBottom: "1rem" }}>
                          <div style={{ color: "#aaa", fontSize: "0.8rem" }}>Price</div>
                          {product.discountedPrice && product.discountedPrice < product.price ? (
                            <div>
                              <span style={{ textDecoration: "line-through", marginRight: "0.5rem", color: "#bbb" }}>
                                ₹{product.price}
                              </span>
                              <span style={{ color: "#4caf50", fontWeight: 700 }}>
                                ₹{product.discountedPrice}
                              </span>
                            </div>
                          ) : (
                            <div style={{ color: "#fff" }}>₹{product.price}</div>
                          )}
                        </div>
                        <div style={{ 
                          display: "flex", 
                          gap: "0.5rem",
                          justifyContent: "flex-end"
                        }}>
                          <button
                            onClick={() => navigate(`/edit-item/${product._id}`)}
                            style={{
                              padding: "0.5rem 1rem",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              backgroundColor: "#646cff",
                              color: "white",
                              border: "none"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#535bf2"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "#646cff"}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })
            )}
          </div>
        )}
        {/* (Edit product selection modal removed) */}
        
        {/* Zoom Modal */}
        {zoomImageUrl && (
          <div 
            onClick={() => setZoomImageUrl(null)}
            style={{
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
              padding: "1rem"
            }}
          >
            <img 
              src={zoomImageUrl}
              alt="Zoomed product"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
