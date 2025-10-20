// src/pages/EditItem.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, updateProduct } from "../services/productService";

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState({
    name: "",
    description: "",
    stock: 0,
    price: 0,
    discountedPrice: 0,
    photo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch item details when page loads
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError("");
    
    getProductById(id)
      .then(productData => {
        setItem(productData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching item:", err);
        setError(err.message || "Failed to load product details");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photoFile') {
      setItem(prev => ({ ...prev, photoFile: files && files[0] ? files[0] : null }));
      return;
    }
    setItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!id) {
      setError("Product ID is missing");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await updateProduct(id, item);
      
      if (response.message) {
        alert("Product updated successfully!");
        navigate("/");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setError(err.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        minHeight: "100vh",
        fontSize: "1.2rem"
      }}>
        Loading product details...
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
      maxWidth: "600px",
      margin: "0 auto",
      padding: "2rem"
    }}>
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "100%"
      }}>
        <h2 style={{ marginBottom: "2rem", fontSize: "2rem", textAlign: "center" }}>Edit Product</h2>
        
        {error && (
          <div style={{
            backgroundColor: "#fee",
            color: "#c33",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
            border: "1px solid #fcc"
          }}>
            {error}
          </div>
        )}
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Name:</label>
            <input 
              type="text" 
              name="name" 
              value={item.name} 
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Description:</label>
            <textarea 
              name="description" 
              value={item.description} 
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem",
                minHeight: "100px",
                resize: "vertical"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Current Stock:</label>
            <input 
              type="number" 
              name="stock" 
              value={item.stock} 
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Price:</label>
            <input 
              type="number" 
              name="price" 
              value={item.price} 
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Discounted Price:</label>
            <input 
              type="number" 
              name="discountedPrice" 
              value={item.discountedPrice} 
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Product Photo:</label>
            <input 
              type="file" 
              name="photoFile" 
              accept="image/*"
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem",
                background: "white"
              }}
            />
            {item.photoFile && (
              <div style={{ marginTop: "0.5rem", color: "#555", fontSize: "0.9rem" }}>
                Selected: <span style={{ fontWeight: 600 }}>{item.photoFile.name}</span>
              </div>
            )}
            {!item.photoFile && item.photo && (
              <div style={{ marginTop: "0.5rem", color: "#555", fontSize: "0.9rem" }}>
                Current photo will remain unchanged unless a new file is selected.
              </div>
            )}
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          marginTop: "2rem",
          justifyContent: "center"
        }}>
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              backgroundColor: saving ? "#999" : "#646cff",
              color: "white",
              border: "none",
              opacity: saving ? 0.7 : 1
            }}
            onMouseOver={(e) => !saving && (e.target.style.backgroundColor = "#535bf2")}
            onMouseOut={(e) => !saving && (e.target.style.backgroundColor = "#646cff")}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button 
            onClick={handleCancel}
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              backgroundColor: saving ? "#999" : "#666",
              color: "white",
              border: "none",
              opacity: saving ? 0.7 : 1
            }}
            onMouseOver={(e) => !saving && (e.target.style.backgroundColor = "#555")}
            onMouseOut={(e) => !saving && (e.target.style.backgroundColor = "#666")}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
