// src/pages/EditItem.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, updateProduct, deleteProduct } from "../services/productService";
import axios from "axios";

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState({
    name: "",
    description: "",
    stockStatus: "in_stock",
    price: 0,
    discountedPrice: 0,
    taxPercentage: 0,
    photo: "",
    category: "",
    productId: "",
    hasVariations: false,
    attributes: [],
    variants: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);


  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/categories`);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch item details when page loads
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError("");
    
    // Fetch both product data and categories
    Promise.all([
      getProductById(id),
      fetchCategories()
    ])
      .then(([productData]) => {
        setItem(productData);
        // Set attributes and variants if they exist
        if (productData.attributes) {
          setAttributes(productData.attributes);
        }
        if (productData.variants) {
          setVariants(productData.variants);
        }
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
    if (name === 'hasVariations') {
      const boolValue = value === 'true' || value === true;
      setItem(prev => ({ 
        ...prev, 
        [name]: boolValue,
        attributes: boolValue ? attributes : [],
        variants: boolValue ? variants : []
      }));
      return;
    }
    setItem(prev => ({ ...prev, [name]: value }));
  };

  // Handle attribute changes
  const handleAttributeChange = (attrIndex, field, value) => {
    const newAttributes = [...attributes];
    if (field === 'options') {
      newAttributes[attrIndex].options = value;
    } else {
      newAttributes[attrIndex][field] = value;
    }
    setAttributes(newAttributes);
    setItem(prev => ({ ...prev, attributes: newAttributes }));
    // Regenerate variants when attributes change
    generateVariants(newAttributes);
  };

  // Add new attribute
  const addAttribute = () => {
    const newAttribute = {
      name: '',
      options: [{ name: '', displayName: '' }]
    };
    const newAttributes = [...attributes, newAttribute];
    setAttributes(newAttributes);
    setItem(prev => ({ ...prev, attributes: newAttributes }));
    // Regenerate variants when attributes change
    generateVariants(newAttributes);
  };

  // Remove attribute
  const removeAttribute = (index) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
    setItem(prev => ({ ...prev, attributes: newAttributes }));
    // Regenerate variants when attributes change
    generateVariants(newAttributes);
  };

  // Add option to attribute
  const addOption = (attrIndex) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex].options.push({ name: '', displayName: '' });
    setAttributes(newAttributes);
    setItem(prev => ({ ...prev, attributes: newAttributes }));
    // Regenerate variants when options change
    generateVariants(newAttributes);
  };

  // Remove option from attribute
  const removeOption = (attrIndex, optionIndex) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex].options = newAttributes[attrIndex].options.filter((_, i) => i !== optionIndex);
    setAttributes(newAttributes);
    setItem(prev => ({ ...prev, attributes: newAttributes }));
    // Regenerate variants when options change
    generateVariants(newAttributes);
  };

  // Generate all possible combinations of attributes
  const generateVariants = (attrs) => {
    try {
      if (attrs.length === 0) {
        setVariants([]);
        return;
      }

      // Get all valid attributes with at least one option
      const validAttributes = attrs.filter(attr => 
        attr.name && attr.options && attr.options.length > 0 && 
        attr.options.every(opt => opt.name)
      );

      if (validAttributes.length === 0) {
        setVariants([]);
        return;
      }

      // Generate cartesian product of all attribute options
      const combinations = validAttributes.reduce((acc, attr) => {
        if (acc.length === 0) {
          return attr.options.map(opt => ({ [attr.name]: opt.name }));
        }
        const newCombinations = [];
        acc.forEach(combo => {
          attr.options.forEach(opt => {
            newCombinations.push({ ...combo, [attr.name]: opt.name });
          });
        });
        return newCombinations;
      }, []);

      // Create variants from combinations, preserving existing prices if available
      const newVariants = combinations.map((combo, index) => {
        // Check if this combination already exists in current variants
        const existingVariant = variants.find(v => 
          JSON.stringify(v.combination) === JSON.stringify(combo)
        );
        
        return {
          combination: combo,
          price: existingVariant ? existingVariant.price : 0,
          discountedPrice: existingVariant ? existingVariant.discountedPrice : 0,
          stock: existingVariant ? existingVariant.stock : 'in_stock',
          images: existingVariant ? existingVariant.images : [],
          isActive: existingVariant ? existingVariant.isActive : true
        };
      });

      setVariants(newVariants);
    } catch (error) {
      console.error('Error generating variants:', error);
    }
  };

  // Update variant properties
  const updateVariant = (variantIndex, field, value) => {
    const newVariants = [...variants];
    newVariants[variantIndex] = {
      ...newVariants[variantIndex],
      [field]: value
    };
    setVariants(newVariants);
    setItem(prev => ({ ...prev, variants: newVariants }));
  };

  const handleSave = async () => {
    if (!id) {
      setError("Product ID is missing");
      return;
    }

    // Validate variants if hasVariations is true
    if (item.hasVariations) {
      if (variants.length === 0) {
        alert("No variants generated. Please check your attributes and options.");
        return;
      }
      
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (variant.price <= 0) {
          alert(`Please enter a valid price for variant ₹{i + 1}`);
          return;
        }
      }
    }

    setSaving(true);
    setError("");

    try {
      // Include attributes and variants in the item data
      const itemToSave = {
        ...item,
        attributes: item.hasVariations ? attributes : [],
        variants: item.hasVariations ? variants : []
      };

      const response = await updateProduct(id, itemToSave);
      
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

  // Delete product function
  const handleDelete = async () => {
    if (!id) {
      setError("Product ID is missing");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );
    
    if (!confirmDelete) return;

    setSaving(true);
    setError("");

    try {
      await deleteProduct(id);
      alert("Product deleted successfully!");
      navigate("/");
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(err.message || "Failed to delete product");
    } finally {
      setSaving(false);
    }
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
          {/* Product ID */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Product ID:</label>
            <input 
              type="text" 
              name="productId" 
              value={item.productId} 
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem"
              }}
              placeholder="Enter unique product ID"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Category:</label>
            <select 
              name="category" 
              value={item.category} 
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "1rem"
              }}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.name || cat} value={cat.name || cat}>
                  {cat.name || cat}
                </option>
              ))}
            </select>
          </div>


          {/* Product Name */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Product Name:</label>
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
              placeholder="Enter product name"
            />
          </div>

          {/* Description */}
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
              placeholder="Enter product description"
            />
          </div>


          {/* Variations Toggle */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "500" }}>
              <input 
                type="checkbox" 
                name="hasVariations" 
                checked={item.hasVariations} 
                onChange={(e) => handleChange({ target: { name: 'hasVariations', value: e.target.checked } })}
                style={{ transform: "scale(1.2)" }}
              />
              This product has variations (size, color, etc.)
            </label>
          </div>

          {/* Variations Section */}
          {item.hasVariations && (
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "#1e293b", 
              borderRadius: "8px", 
              border: "1px solid #334155",
              color: "white"
            }}>
              <h4 style={{ margin: "0 0 1rem 0", color: "white" }}>Product Variations</h4>
              
              {/* Attributes */}
              <div style={{ marginBottom: "1rem" }}>
                <h5 style={{ margin: "0 0 0.5rem 0", color: "white" }}>Attributes (Size, Color, etc.)</h5>
                {attributes.map((attr, attrIndex) => (
                  <div key={attrIndex} style={{ 
                    padding: "1rem", 
                    border: "1px solid #475569", 
                    borderRadius: "6px", 
                    marginBottom: "1rem",
                    backgroundColor: "#334155",
                    color: "white"
                  }}>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <input 
                        type="text" 
                        value={attr.name} 
                        onChange={(e) => handleAttributeChange(attrIndex, 'name', e.target.value)}
                        placeholder="Attribute name (e.g., Size, Color)"
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          fontSize: "0.9rem"
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => removeAttribute(attrIndex)}
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: "0.9rem", fontWeight: "500" }}>Options:</label>
                      {attr.options.map((option, optionIndex) => (
                        <div key={optionIndex} style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                          <input 
                            type="text" 
                            value={option.name} 
                            onChange={(e) => {
                              const newOptions = [...attr.options];
                              newOptions[optionIndex].name = e.target.value;
                              handleAttributeChange(attrIndex, 'options', newOptions);
                            }}
                            placeholder="Option value (e.g., Small, Red)"
                            style={{
                              flex: 1,
                              padding: "0.5rem",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                              fontSize: "0.9rem"
                            }}
                          />
                          <input 
                            type="text" 
                            value={option.displayName} 
                            onChange={(e) => {
                              const newOptions = [...attr.options];
                              newOptions[optionIndex].displayName = e.target.value;
                              handleAttributeChange(attrIndex, 'options', newOptions);
                            }}
                            placeholder="Display name (optional)"
                            style={{
                              flex: 1,
                              padding: "0.5rem",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                              fontSize: "0.9rem"
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => removeOption(attrIndex, optionIndex)}
                            style={{
                              padding: "0.5rem",
                              backgroundColor: "#6c757d",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => addOption(attrIndex)}
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.5rem 1rem",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.9rem"
                        }}
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addAttribute}
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  + Add Attribute
                </button>
              </div>

              {/* Generated Variants Section */}
              {variants.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                  <h5 style={{ margin: "0 0 1rem 0", color: "white" }}>
                    Generated Variants ({variants.length})
                  </h5>
                  <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #475569", borderRadius: "6px" }}>
                    {variants.map((variant, index) => (
                      <div key={index} style={{
                        padding: "1rem",
                        borderBottom: index < variants.length - 1 ? "1px solid #475569" : "none",
                        background: "#334155",
                        color: "white"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <div>
                            <h6 style={{ margin: 0, fontSize: "0.9rem", color: "white" }}>
                              {Object.entries(variant.combination).map(([key, value]) => `₹{key}: ₹{value}`).join(', ')}
                            </h6>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "1rem" }}>
                          <div>
                            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "500" }}>
                              Price (₹) *
                            </label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                              step="0.01"
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                fontSize: "0.9rem"
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "500" }}>
                              Discounted Price (₹)
                            </label>
                            <input
                              type="number"
                              value={variant.discountedPrice}
                              onChange={(e) => updateVariant(index, 'discountedPrice', parseFloat(e.target.value) || 0)}
                              step="0.01"
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                fontSize: "0.9rem"
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "500" }}>
                              Stock Status
                            </label>
                            <select
                              value={variant.stock}
                              onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                fontSize: "0.9rem"
                              }}
                            >
                              <option value="in_stock">In Stock</option>
                              <option value="out_of_stock">Out of Stock</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "500" }}>
                              Images (Optional)
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                const files = Array.from(e.target.files);
                                const imageUrls = files.map(file => URL.createObjectURL(file));
                                updateVariant(index, 'images', imageUrls);
                              }}
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                fontSize: "0.9rem"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tax Percentage for Products with Variants */}
          {item.hasVariations && (
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "#1e293b", 
              borderRadius: "8px", 
              marginBottom: "1rem" 
            }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "white" }}>
                Tax Percentage
              </h3>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Tax Percentage (%):</label>
                <input 
                  type="number" 
                  name="taxPercentage" 
                  value={item.taxPercentage || 0} 
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "1rem"
                  }}
                  placeholder="Enter tax percentage"
                />
              </div>
            </div>
          )}

          {/* Price and Stock - Only show if no variations */}
          {!item.hasVariations && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
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
                    placeholder="Enter price"
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
                    placeholder="Enter discounted price"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Tax Percentage (%):</label>
                  <input 
                    type="number" 
                    name="taxPercentage" 
                    value={item.taxPercentage || 0} 
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="100"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "1rem"
                    }}
                    placeholder="Enter tax amount"
                  />
                </div>
              </div>

              {/* Stock Status */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Stock Status:</label>
                <select 
                  name="stockStatus" 
                  value={item.stockStatus} 
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "1rem"
                  }}
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </>
          )}

          {/* Product Photo */}
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
          <button 
            onClick={handleDelete}
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              backgroundColor: saving ? "#999" : "#dc3545",
              color: "white",
              border: "none",
              opacity: saving ? 0.7 : 1
            }}
            onMouseOver={(e) => !saving && (e.target.style.backgroundColor = "#c82333")}
            onMouseOut={(e) => !saving && (e.target.style.backgroundColor = "#dc3545")}
          >
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}
