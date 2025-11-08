import { useState, useEffect } from "react";
import axios from "axios";

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [arrangeMode, setArrangeMode] = useState({}); // per-category arrange mode
  const [dragState, setDragState] = useState({ category: null, productId: null });
  const [categoryBuffers, setCategoryBuffers] = useState({}); // local per-category order while arranging

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`);
      setProducts(res.data.products || res.data);
    } catch (err) {
      alert("Failed to fetch products: " + err.message);
    }
  };

  const addProduct = async () => {
    if (!name || !price) return alert("Enter name and price");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`, { name, price });
      setName("");
      setPrice("");
      fetchProducts();
    } catch (err) {
      alert("Failed to add product: " + err.message);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Product Management</h1>

      <input
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginRight: "1rem", padding: "0.5rem" }}
      />
      <input
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        style={{ marginRight: "1rem", padding: "0.5rem" }}
      />
      <button onClick={addProduct} style={{ padding: "0.5rem 1rem" }}>
        Add Product
      </button>

      {/* Grouped by Category with Arrange Items */}
      <div style={{ marginTop: "2rem" }}>
        {Object.entries(
          products.reduce((acc, p) => {
            const cat = p.category || "Uncategorized";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
          }, {})
        ).map(([category, items]) => {
          // Sort items by displayOrder (backend should already sort, but ensure it here too)
          const sortedItems = [...items].sort((a, b) => {
            const orderA = a.displayOrder !== undefined ? a.displayOrder : 999999;
            const orderB = b.displayOrder !== undefined ? b.displayOrder : 999999;
            return orderA - orderB;
          });
          const isArranging = !!arrangeMode[category];
          const buffer = categoryBuffers[category] || sortedItems;
          const displayItems = isArranging ? buffer : sortedItems;

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
            setCategoryBuffers((prev) => ({ ...prev, [category]: sortedItems.slice() }));
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
              alert("Order saved");
              setArrangeMode((prev) => ({ ...prev, [category]: false }));
              setCategoryBuffers((prev) => {
                const copy = { ...prev };
                delete copy[category];
                return copy;
              });
              // refresh to reflect displayOrder from backend
              fetchProducts();
            } catch (err) {
              alert("Failed to save order: " + err.message);
            }
          };

          return (
            <div key={category} style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h2 style={{ margin: 0 }}>{category}</h2>
                {!isArranging ? (
                  <button onClick={startArrange} style={{ padding: "0.4rem 0.8rem", border: "1px solid #6366f1", background: "white", color: "#6366f1", borderRadius: 8, cursor: "pointer" }}>Arrange Products</button>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={saveArrange} style={{ padding: "0.4rem 0.8rem", border: "none", background: "#10b981", color: "white", borderRadius: 8, cursor: "pointer" }}>Save</button>
                    <button onClick={cancelArrange} style={{ padding: "0.4rem 0.8rem", border: "1px solid #ef4444", background: "white", color: "#ef4444", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                {displayItems.map((p, idx) => (
                  <div
                    key={p._id}
                    draggable={isArranging}
                    onDragStart={onDragStart(p)}
                    onDragOver={onDragOver(p)}
                    onDrop={onDrop(p)}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: "white",
                      padding: "0.75rem",
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
                        fontSize: 12
                      }}>
                        {idx + 1}
                      </div>
                    )}
                    {p.photo && (
                      <img src={p.photo} alt={p.name} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
                    )}
                    <div style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>{p.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 14 }}>{p.brand || ""}</div>
                    <div style={{ marginTop: 6, fontWeight: 700, color: "#059669" }}>₹{p.discountedPrice && p.discountedPrice < p.price ? p.discountedPrice : p.price}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
