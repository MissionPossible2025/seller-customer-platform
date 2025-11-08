import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddItem({ user }) {
  console.log('AddItem component rendered with user:', user); // Debug log
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productData, setProductData] = useState({
    productId: "",
    name: "",
    brand: "",
    unit: "piece",
    description: "",
    stockStatus: "in_stock",
    price: 0,
    discountedPrice: 0,
    discountPercent: 0,
    taxPercentage: 0,
    photo: "",
    category: "",
    seller: user?._id || user?.id || "",
    sellerName: user?.name || "",
    sellerEmail: user?.email || "",
    userId: user?._id || user?.id || "",
    hasVariations: false,
    attributes: [],
    variants: []
  });
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const navigate = useNavigate();

  // Product templates for each category
  const productTemplates = {
    Tools: {
      description: "Enter tool specifications, features, and technical details",
      placeholder: "e.g., Steel construction, Ergonomic handle, Professional grade, 2-year warranty",
      fields: {
        brand: "Brand",
        model: "Model",
        specifications: "Technical Specifications",
        warranty: "Warranty Period"
      }
    },
    Machineries: {
      description: "Enter machinery details, specifications, and operational requirements",
      placeholder: "e.g., Heavy duty construction, 220V operation, Safety features included, Operator manual provided",
      fields: {
        brand: "Brand",
        model: "Model",
        specifications: "Technical Specifications",
        powerRequirements: "Power Requirements"
      }
    },
    Fasteners: {
      description: "Enter fastener details, materials, and specifications",
      placeholder: "e.g., Stainless steel, Metric thread, Corrosion resistant, Industrial grade",
      fields: {
        material: "Material",
        threadType: "Thread Type",
        size: "Size",
        finish: "Finish"
      }
    },
    Gloves: {
      description: "Enter glove details, materials, and safety specifications",
      placeholder: "e.g., Cut resistant, Chemical resistant, Size M, EN388 certified",
      fields: {
        material: "Material",
        size: "Size",
        safetyRating: "Safety Rating",
        certification: "Certification"
      }
    },
    Others: {
      description: "Enter product details and specifications",
      placeholder: "e.g., Custom specifications, Special features, Usage instructions",
      fields: {
        brand: "Brand",
        specifications: "Specifications",
        features: "Special Features",
        instructions: "Usage Instructions"
      }
    }
  };

  // Resolve a template for the currently selected category, fallback to "Others"
  const getCurrentTemplate = () => {
    if (!selectedCategory) return null;
    return productTemplates[selectedCategory] || productTemplates.Others;
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories`);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Delete category (with cascade to delete all products under it)
  const handleDeleteCategory = async (category) => {
    try {
      const catId = category._id || category.id;
      if (!catId) {
        alert('Category ID not found');
        return;
      }

      if (!confirm(`Delete category "${category.name || category}" and ALL its products?`)) return;

      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories/${catId}?cascade=true`);
      await fetchCategories();
      // Optionally, if currently selected category got deleted, reset selection
      if (selectedCategory === (category.name || category)) {
        setSelectedCategory(null);
      }
      alert('Category and its products deleted.');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category: ' + (error.response?.data?.error || error.message));
    }
  };

  // Add new category
  const addNewCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories`, newCategory);
      setCategories(prev => [...prev, response.data.category]);
      setNewCategory({ name: '', description: '' });
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category: ' + (error.response?.data?.error || error.message));
    }
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setProductData(prev => ({ ...prev, category }));
  };

  const handleChange = (e) => {
    try {
      const { name, value, files } = e.target;
      if (name === 'photoFile') {
        setProductData(prev => ({ ...prev, photoFile: files && files[0] ? files[0] : null }));
        return;
      }
      if (name === 'hasVariations') {
        const boolValue = value === 'true' || value === true;
        console.log('hasVariations changed to:', boolValue); // Debug log
        setProductData(prev => ({ 
          ...prev, 
          [name]: boolValue,
          attributes: boolValue ? [] : [],
          variants: boolValue ? [] : []
        }));
        setAttributes([]);
        setVariants([]);
        return;
      }
      // Auto-calc discountedPrice when price or discountPercent changes (no variations case)
      if (name === 'price') {
        const newPrice = parseFloat(value) || 0;
        setProductData(prev => {
          const discountPct = parseFloat(prev.discountPercent) || 0;
          const computedDiscounted = discountPct > 0 ? Number((newPrice * (1 - discountPct / 100)).toFixed(2)) : 0;
          return { ...prev, price: newPrice, discountedPrice: computedDiscounted };
        });
        return;
      }
      if (name === 'discountPercent') {
        const pct = Math.max(0, Math.min(100, parseFloat(value) || 0));
        setProductData(prev => {
          const base = parseFloat(prev.price) || 0;
          const computedDiscounted = pct > 0 ? Number((base * (1 - pct / 100)).toFixed(2)) : 0;
          return { ...prev, discountPercent: pct, discountedPrice: computedDiscounted };
        });
        return;
      }
      setProductData(prev => ({ ...prev, [name]: value }));
    } catch (error) {
      console.error('Error in handleChange:', error);
      alert('An error occurred while updating the form. Please try again.');
    }
  };

  // Multi-attribute management functions
  const addAttribute = () => {
    try {
      const newAttribute = {
        name: "",
        options: []
      };
      setAttributes([...attributes, newAttribute]);
    } catch (error) {
      console.error('Error adding attribute:', error);
      alert('An error occurred while adding attribute. Please try again.');
    }
  };

  const updateAttribute = (index, field, value) => {
    try {
      const updatedAttributes = attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      );
      setAttributes(updatedAttributes);
    } catch (error) {
      console.error('Error updating attribute:', error);
      alert('An error occurred while updating attribute. Please try again.');
    }
  };

  const removeAttribute = (index) => {
    try {
      const updatedAttributes = attributes.filter((_, i) => i !== index);
      setAttributes(updatedAttributes);
      // Regenerate variants when attributes change
      generateVariants(updatedAttributes);
    } catch (error) {
      console.error('Error removing attribute:', error);
      alert('An error occurred while removing attribute. Please try again.');
    }
  };

  const addAttributeOption = (attributeIndex) => {
    try {
      const updatedAttributes = attributes.map((attr, i) => 
        i === attributeIndex 
          ? { ...attr, options: [...attr.options, { name: "", displayName: "" }] }
          : attr
      );
      setAttributes(updatedAttributes);
    } catch (error) {
      console.error('Error adding attribute option:', error);
      alert('An error occurred while adding attribute option. Please try again.');
    }
  };

  const updateAttributeOption = (attributeIndex, optionIndex, field, value) => {
    try {
      const updatedAttributes = attributes.map((attr, i) => 
        i === attributeIndex 
          ? {
              ...attr,
              options: attr.options.map((opt, j) => 
                j === optionIndex ? { ...opt, [field]: value } : opt
              )
            }
          : attr
      );
      setAttributes(updatedAttributes);
    } catch (error) {
      console.error('Error updating attribute option:', error);
      alert('An error occurred while updating attribute option. Please try again.');
    }
  };

  const removeAttributeOption = (attributeIndex, optionIndex) => {
    try {
      const updatedAttributes = attributes.map((attr, i) => 
        i === attributeIndex 
          ? { ...attr, options: attr.options.filter((_, j) => j !== optionIndex) }
          : attr
      );
      setAttributes(updatedAttributes);
      // Regenerate variants when options change
      generateVariants(updatedAttributes);
    } catch (error) {
      console.error('Error removing attribute option:', error);
      alert('An error occurred while removing attribute option. Please try again.');
    }
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

      // Create variants from combinations
      const newVariants = combinations.map((combo, index) => ({
        combination: combo,
        price: 0,
        discountedPrice: 0,
        discountPercent: 0,
        stock: 'in_stock',
        images: [],
        isActive: true
      }));

      setVariants(newVariants);
    } catch (error) {
      console.error('Error generating variants:', error);
      alert('An error occurred while generating variants. Please try again.');
    }
  };

  const updateVariant = (index, field, value) => {
    try {
      const updatedVariants = variants.map((variant, i) => {
        if (i === index) {
          const updatedVariant = { ...variant, [field]: value };
          
          // Auto-calculate discountedPrice when price or discountPercent changes
          if (field === 'price' || field === 'discountPercent') {
            const price = field === 'price' ? parseFloat(value) || 0 : parseFloat(variant.price) || 0;
            const discountPct = field === 'discountPercent' ? Math.max(0, Math.min(100, parseFloat(value) || 0)) : (parseFloat(variant.discountPercent) || 0);
            const computedDiscounted = discountPct > 0 ? Number((price * (1 - discountPct / 100)).toFixed(2)) : 0;
            updatedVariant.discountedPrice = computedDiscounted;
          }
          
          return updatedVariant;
        }
        return variant;
      });
      setVariants(updatedVariants);
    } catch (error) {
      console.error('Error updating variant:', error);
      alert('An error occurred while updating variant. Please try again.');
    }
  };

  // Auto-generate variants when attributes change
  useEffect(() => {
    generateVariants(attributes);
  }, [attributes]);

  const handleSave = async () => {
    if (!productData.productId || !productData.name || !productData.description) {
      alert("Please fill in Product ID, product name and description");
      return;
    }

    // Validate multi-attribute variations if hasVariations is true
    if (productData.hasVariations) {
      if (attributes.length === 0) {
        alert("Please add at least one attribute (e.g., Size, Color, Storage)");
        return;
      }
      
      // Validate attributes
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        if (!attr.name) {
          alert(`Please specify the name for attribute ${i + 1}`);
          return;
        }
        if (!attr.options || attr.options.length === 0) {
          alert(`Please add at least one option for attribute "${attr.name}"`);
          return;
        }
        for (let j = 0; j < attr.options.length; j++) {
          const option = attr.options[j];
          if (!option.name) {
            alert(`Please specify the name for option ${j + 1} in attribute "${attr.name}"`);
            return;
          }
        }
      }
      
      // Validate variants
      if (variants.length === 0) {
        alert("No variants generated. Please check your attributes and options.");
        return;
      }
      
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (variant.price <= 0) {
          alert(`Please enter a valid price for variant ${i + 1}`);
          return;
        }
      }
    } else {
      // For products without variations, validate base price and stock
      if (productData.price <= 0) {
        alert("Please enter a valid price");
        return;
      }
      if (!productData.stockStatus) {
        alert("Please select a stock status");
        return;
      }
    }

    // Ensure seller ID is included - user object from login contains _id
    const productToSave = {
      ...productData,
      seller: user?._id || user?.id || user?.seller,
      sellerName: user?.name || "",
      sellerEmail: user?.email || "",
      attributes: productData.hasVariations ? attributes : [],
      variants: productData.hasVariations ? variants : []
    };

    // If no valid seller ID, show error
    if (!productToSave.seller) {
      alert("Error: Seller information not found. Please login again.");
      return;
    }

    console.log("Saving product:", productToSave); // Debug log

    setLoading(true);
    try {
      // Build FormData for multipart upload
      const formData = new FormData();
      formData.append('productId', productToSave.productId);
      formData.append('name', productToSave.name);
      if (productToSave.taxPercentage !== undefined && productToSave.taxPercentage !== null) {
        formData.append('taxPercentage', productToSave.taxPercentage);
      }
      if (productToSave.brand !== undefined) {
        formData.append('brand', productToSave.brand);
      }
      formData.append('unit', productToSave.unit || 'piece');
      formData.append('description', productToSave.description);
      formData.append('category', productToSave.category);
      formData.append('hasVariations', productToSave.hasVariations);
      formData.append('attributes', JSON.stringify(productToSave.attributes)); // Send attributes as JSON string
      formData.append('variants', JSON.stringify(productToSave.variants)); // Send variants as JSON string
      
      // Only add base price/stock if no variations
      if (!productToSave.hasVariations) {
        formData.append('price', productToSave.price);
        if (productToSave.discountedPrice !== undefined && productToSave.discountedPrice !== null) {
          formData.append('discountedPrice', productToSave.discountedPrice);
        }
        if (productToSave.discountPercent !== undefined && productToSave.discountPercent !== null) {
          formData.append('discountPercent', productToSave.discountPercent);
        }
        formData.append('stockStatus', productToSave.stockStatus);
      }
      
      formData.append('seller', productToSave.seller);
      formData.append('sellerName', productToSave.sellerName);
      formData.append('sellerEmail', productToSave.sellerEmail);
      
      // Append multiple photos
      photoFiles.forEach((file) => {
        formData.append('photos', file);
      });
      
      // Keep backward compatibility with single photo
      if (productToSave.photoFile) {
        formData.append('photo', productToSave.photoFile);
      } else if (productToSave.photo) {
        formData.append('photo', productToSave.photo);
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Product added successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error details:", error.response?.data); // Debug log
      alert("Failed to add product: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setProductData({
      productId: "",
      name: "",
      brand: "",
      unit: "piece",
      description: "",
      stockStatus: "in_stock",
      price: 0,
      discountedPrice: 0,
      discountPercent: 0,
      taxPercentage: 0,
      photo: "",
      category: "",
      seller: user?._id || user?.id || "",
      sellerName: user?.name || "",
      sellerEmail: user?.email || "",
      userId: user?._id || user?.id || "",
      hasVariations: false,
      attributes: [],
      variants: []
    });
    setAttributes([]);
    setVariants([]);
    setPhotos([]);
    setPhotoFiles([]);
  };

  return (
    <>
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
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
        <h2 style={{ marginBottom: "2rem", fontSize: "2rem" }}>Add New Product</h2>

        <>
        {!selectedCategory ? (
          <>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Select Product Category</h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "1rem",
              marginBottom: "2rem"
            }}>
        {categories.map((cat) => (
          <div
            key={cat._id || cat.name || cat}
            style={{
              position: "relative",
              padding: "1.5rem",
              border: "2px solid #ccc",
              borderRadius: "8px",
              cursor: "pointer",
              background: "transparent",
              transition: "all 0.3s ease",
              fontWeight: "500",
              fontSize: "1.1rem"
            }}
            onClick={() => handleCategorySelect(cat.name || cat)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#646cff";
              e.currentTarget.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "inherit";
            }}
          >
            {/* Category Name */}
            {cat.name || cat}

            {/* Delete Category Button */}
            {cat._id && (
              <button
                type="button"
                title="Delete category"
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleDeleteCategory(cat);
                }}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  padding: "0.35rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid #dc2626",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
              >
                Delete
              </button>
            )}
          </div>
        ))}
              
              {/* Add Category Button */}
              <div
                style={{
                  padding: "1.5rem",
                  border: "2px dashed #646cff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: "transparent",
                  transition: "all 0.3s ease",
                  fontWeight: "500",
                  fontSize: "1.1rem",
                  color: "#646cff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
                onClick={() => setShowAddCategory(true)}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#646cff";
                  e.target.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#646cff";
                }}
              >
                + Add New Category
              </div>
            </div>
            
            {/* Add Category Modal */}
            {showAddCategory && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: "white",
                  padding: "2rem",
                  borderRadius: "8px",
                  width: "90%",
                  maxWidth: "500px"
                }}>
                  <h3 style={{ marginBottom: "1rem" }}>Add New Category</h3>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "1rem"
                      }}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Description
                    </label>
                    <textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "1rem",
                        minHeight: "80px",
                        resize: "vertical"
                      }}
                      placeholder="Enter category description (optional)"
                    />
                  </div>
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategory({ name: '', description: '' });
                      }}
                      style={{
                        padding: "0.75rem 1.5rem",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        background: "white",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addNewCategory}
                      disabled={!newCategory.name.trim()}
                      style={{
                        padding: "0.75rem 1.5rem",
                        border: "none",
                        borderRadius: "4px",
                        background: newCategory.name.trim() ? "#646cff" : "#ccc",
                        color: "white",
                        cursor: newCategory.name.trim() ? "pointer" : "not-allowed"
                      }}
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{selectedCategory} Product</h3>
              <p style={{ color: "#888", fontSize: "1rem", marginBottom: "1rem" }}>
                {getCurrentTemplate()?.description}
              </p>
            </div>

            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "1rem",
              textAlign: "left",
              maxWidth: "600px",
              margin: "0 auto"
            }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Product ID *
                </label>
                <input
                  type="text"
                  name="productId"
                  value={productData.productId}
                  onChange={handleChange}
                  placeholder="Enter unique product ID (e.g., ELEC001, CLOTH002)"
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={productData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={productData.brand}
                  onChange={handleChange}
                  placeholder="Enter brand (optional)"
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Unit *
                </label>
                <input
                  type="text"
                  name="unit"
                  value={productData.unit}
                  onChange={handleChange}
                  placeholder="Enter unit (e.g., piece, kg, pack)"
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={productData.description}
                  onChange={handleChange}
                  placeholder={getCurrentTemplate()?.placeholder}
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

              {/* Seller info removed from UI but still sent with request */}

              {/* Product Variations Toggle */}
              <div style={{ 
                padding: "1rem", 
                background: "#1e293b", 
                borderRadius: "8px", 
                border: "1px solid #334155",
                color: "white"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "500" }}>
                    <input
                      type="checkbox"
                      name="hasVariations"
                      checked={productData.hasVariations}
                      onChange={(e) => handleChange({ target: { name: 'hasVariations', value: e.target.checked.toString() } })}
                      style={{ transform: "scale(1.2)" }}
                    />
                    This product has variations (e.g., different sizes, colors, storage)
                  </label>
                </div>

                {productData.hasVariations && (
                  <div>
                    {/* Attributes Section */}
                    <div style={{ marginBottom: "2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "white" }}>Product Attributes</h3>
                        <button
                          type="button"
                          onClick={addAttribute}
                          style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            border: "1px solid #007bff",
                            background: "#007bff",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "0.9rem"
                          }}
                        >
                          + Add Attribute
                        </button>
                      </div>

                      {attributes.map((attribute, attrIndex) => (
                        <div key={attrIndex} style={{
                          padding: "1rem",
                          border: "1px solid #475569",
                          borderRadius: "6px",
                          marginBottom: "1rem",
                          background: "#334155",
                          color: "white"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h4 style={{ margin: 0, fontSize: "1rem" }}>Attribute {attrIndex + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeAttribute(attrIndex)}
                              style={{
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #dc3545",
                                background: "#dc3545",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "0.8rem"
                              }}
                            >
                              Remove
                            </button>
                          </div>

                          <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                              Attribute Name *
                            </label>
                            <input
                              type="text"
                              value={attribute.name}
                              onChange={(e) => updateAttribute(attrIndex, 'name', e.target.value)}
                              placeholder="e.g., Size, Color, Storage"
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                fontSize: "0.9rem"
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                              <label style={{ fontSize: "0.9rem", fontWeight: "500" }}>Options *</label>
                              <button
                                type="button"
                                onClick={() => addAttributeOption(attrIndex)}
                                style={{
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "4px",
                                  border: "1px solid #28a745",
                                  background: "#28a745",
                                  color: "white",
                                  cursor: "pointer",
                                  fontSize: "0.8rem"
                                }}
                              >
                                + Add Option
                              </button>
                            </div>

                            {attribute.options.map((option, optIndex) => (
                              <div key={optIndex} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <input
                                  type="text"
                                  value={option.name}
                                  onChange={(e) => updateAttributeOption(attrIndex, optIndex, 'name', e.target.value)}
                                  placeholder="Option name (e.g., Small, Red, 64GB)"
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
                                  onClick={() => removeAttributeOption(attrIndex, optIndex)}
                                  style={{
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "4px",
                                    border: "1px solid #dc3545",
                                    background: "#dc3545",
                                    color: "white",
                                    cursor: "pointer",
                                    fontSize: "0.8rem"
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Generated Variants Section */}
                    {variants.length > 0 && (
                      <div>
                        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "white" }}>
                          Generated Variants ({variants.length})
                        </h3>
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
                                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "white" }}>
                                    {Object.entries(variant.combination).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                  </h4>
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
                                      fontSize: "0.9rem",
                                      MozAppearance: "textfield",
                                      WebkitAppearance: "none"
                                    }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "500" }}>
                                    Discount percentage (%)
                                  </label>
                                  <input
                                    type="number"
                                    value={variant.discountPercent || 0}
                                    onChange={(e) => updateVariant(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      border: "1px solid #ccc",
                                      fontSize: "0.9rem",
                                      MozAppearance: "textfield",
                                      WebkitAppearance: "none"
                                    }}
                                    placeholder="Enter discount %"
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "500" }}>
                                    Discounted Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={variant.discountedPrice || 0}
                                    readOnly
                                    step="0.01"
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      border: "1px solid #ccc",
                                      fontSize: "0.9rem",
                                      backgroundColor: '#ffffff',
                                      color: '#000000'
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
                    
                    {/* Tax Percentage for Products with Variants */}
                    <div style={{ marginTop: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Tax Percentage (%)
                      </label>
                      <input
                        type="number"
                        name="taxPercentage"
                        value={productData.taxPercentage}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        max="100"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "1rem",
                          MozAppearance: "textfield",
                          WebkitAppearance: "none"
                        }}
                        placeholder="Enter tax percentage"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Base Price/Stock (only show if no variations) */}
              {!productData.hasVariations && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Stock Status
                      </label>
                      <select
                        name="stockStatus"
                        value={productData.stockStatus}
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
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={productData.price}
                        onChange={handleChange}
                        step="0.01"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "1rem"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Discount percentage (%)
                      </label>
                      <input
                        type="number"
                        name="discountPercent"
                        value={productData.discountPercent}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.01"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "1rem",
                          MozAppearance: "textfield",
                          WebkitAppearance: "none"
                        }}
                        placeholder="Enter discount %"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Discounted Price (₹)
                      </label>
                      <input
                        type="number"
                        name="discountedPrice"
                        value={productData.discountedPrice}
                        readOnly
                        step="0.01"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "1rem",
                          backgroundColor: '#ffffff',
                          color: '#000000'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Tax Percentage (%)
                      </label>
                      <input
                        type="number"
                        name="taxPercentage"
                        value={productData.taxPercentage}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        max="100"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "1rem",
                          MozAppearance: "textfield",
                          WebkitAppearance: "none"
                        }}
                        placeholder="Enter tax percentage"
                      />
                    </div>
                  </div>
                  </>
                )}

                {/* Multiple Product Photos */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                    Product Photos
                  </label>
                  
                  {/* Display uploaded photos */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {photos.map((photo, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={photo} 
                          alt={`Product ${index + 1}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #ccc'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPhotos = photos.filter((_, i) => i !== index);
                            const newPhotoFiles = photoFiles.filter((_, i) => i !== index);
                            setPhotos(newPhotos);
                            setPhotoFiles(newPhotoFiles);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add photo button */}
                  <label
                    htmlFor="photo-upload"
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      background: '#059669',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    + Add Photo
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setPhotos([...photos, e.target?.result]);
                          setPhotoFiles([...photoFiles, file]);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              <div style={{ 
                display: "flex", 
                gap: "1rem", 
                marginTop: "2rem",
                justifyContent: "center"
              }}>
                <button 
                  onClick={resetForm}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor: "#666",
                    color: "white",
                    border: "none"
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = "#555"}
                  onMouseOut={(e) => e.target.style.backgroundColor = "#666"}
                >
                  Back to Categories
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor: loading ? "#999" : "#646cff",
                    color: "white",
                    border: "none"
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.backgroundColor = "#535bf2")}
                  onMouseOut={(e) => !loading && (e.target.style.backgroundColor = "#646cff")}
                >
                  {loading ? "Saving..." : "Save Product"}
                </button>
              </div>
            </div>
          
        )}
        </>
      </div>
    </div>
    </>
  );
}
