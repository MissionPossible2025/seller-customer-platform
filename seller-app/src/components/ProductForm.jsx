import { useState, useEffect } from "react";
import axios from "axios";

export default function ProductForm({ product }) {
  const [prodData, setProdData] = useState(product);
  const [editing, setEditing] = useState(true);
  const [categories, setCategories] = useState([]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/categories`);
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProdData({ ...prodData, [name]: value });
  };

  const handleSave = () => {
    setEditing(false);
    console.log("Saved product:", prodData);
    // Add Axios POST/PUT to save in backend
  };

  const handleEdit = () => setEditing(true);

  return (
    <div style={{ border: "1px solid gray", padding: "10px", marginTop: "10px" }}>
      <h4>Product Details</h4>

      <input
        name="name"
        placeholder="Name"
        value={prodData.name}
        onChange={handleChange}
        disabled={!editing}
      /><br />

      <select
        name="category"
        value={prodData.category || ''}
        onChange={handleChange}
        disabled={!editing}
        style={{ marginBottom: "10px", padding: "5px" }}
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat.name || cat} value={cat.name || cat}>
            {cat.name || cat}
          </option>
        ))}
      </select><br />

      <input
        name="description"
        placeholder="Description"
        value={prodData.description}
        onChange={handleChange}
        disabled={!editing}
      /><br />

      <select
        name="stockStatus"
        value={prodData.stockStatus || 'in_stock'}
        onChange={handleChange}
        disabled={!editing}
        style={{ marginBottom: "10px", padding: "5px" }}
      >
        <option value="in_stock">In Stock</option>
        <option value="out_of_stock">Out of Stock</option>
      </select><br />

      <input
        name="price"
        type="number"
        placeholder="Price"
        value={prodData.price}
        onChange={handleChange}
        disabled={!editing}
      /><br />

      <input
        name="discount"
        type="number"
        placeholder="Discounted Price"
        value={prodData.discount}
        onChange={handleChange}
        disabled={!editing}
      /><br />

      <input
        name="photo"
        placeholder="Photo URL"
        value={prodData.photo}
        onChange={handleChange}
        disabled={!editing}
      /><br />

      <button onClick={handleEdit} disabled={editing}>Edit</button>
      <button onClick={handleSave} disabled={!editing}>Save</button>
    </div>
  );
}
