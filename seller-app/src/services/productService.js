// services/productService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/products';

// Create a new product
export const createProduct = async (productData) => {
  try {
    const response = await axios.post(API_BASE_URL, productData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create product');
  }
};

// Get all products with optional filters
export const getAllProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await axios.get(`${API_BASE_URL}?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch products');
  }
};

// Get a single product by ID
export const getProductById = async (productId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${productId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch product');
  }
};

// Update a product
export const updateProduct = async (productId, productData) => {
  try {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'photoFile') {
          if (value) formData.append('photo', value);
        } else if (key === 'attributes' || key === 'variants') {
          // Send attributes and variants as JSON strings
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    const response = await axios.put(`${API_BASE_URL}/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update product');
  }
};

// Delete a product (soft delete)
export const deleteProduct = async (productId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${productId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete product');
  }
};

// Get products by seller
export const getProductsBySeller = async (sellerId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/seller/${sellerId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch seller products');
  }
};
