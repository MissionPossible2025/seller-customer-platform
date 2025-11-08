// controllers/highlightedProductController.js
import HighlightedProduct from '../models/highlightedProductModel.js';

// Get highlighted products for a seller
export const getHighlightedProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    let highlighted = await HighlightedProduct.findOne({ seller: sellerId });
    
    // If no highlighted products exist, create an empty one
    if (!highlighted) {
      highlighted = new HighlightedProduct({
        seller: sellerId,
        productIds: []
      });
      await highlighted.save();
    }
    
    console.log(`[Highlighted] Fetched highlighted products for seller ${sellerId}:`, highlighted.productIds);
    res.json({ highlighted });
  } catch (error) {
    console.error('Error fetching highlighted products:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a product ID to highlighted products
export const addHighlightedProduct = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { productId } = req.body;
    
    if (!productId || !productId.trim()) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Normalize product ID to uppercase (matching product schema)
    const normalizedProductId = productId.trim().toUpperCase();
    
    let highlighted = await HighlightedProduct.findOne({ seller: sellerId });
    
    if (!highlighted) {
      highlighted = new HighlightedProduct({
        seller: sellerId,
        productIds: [normalizedProductId]
      });
    } else {
      // Check if product ID already exists (case-insensitive)
      const exists = highlighted.productIds.some(id => id.toUpperCase() === normalizedProductId);
      if (exists) {
        return res.status(400).json({ error: 'Product ID already exists in highlighted products' });
      }
      highlighted.productIds.push(normalizedProductId);
    }
    
    await highlighted.save();
    console.log(`[Highlighted] Added product ID ${normalizedProductId} for seller ${sellerId}`);
    res.json({ 
      message: 'Product added to highlighted products',
      highlighted 
    });
  } catch (error) {
    console.error('Error adding highlighted product:', error);
    res.status(500).json({ error: error.message });
  }
};

// Remove a product ID from highlighted products
export const removeHighlightedProduct = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { productId } = req.body;
    
    if (!productId || !productId.trim()) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Normalize product ID to uppercase for matching
    const normalizedProductId = productId.trim().toUpperCase();
    
    const highlighted = await HighlightedProduct.findOne({ seller: sellerId });
    
    if (!highlighted) {
      return res.status(404).json({ error: 'No highlighted products found' });
    }
    
    // Remove using case-insensitive matching
    highlighted.productIds = highlighted.productIds.filter(
      id => id.toUpperCase() !== normalizedProductId
    );
    
    await highlighted.save();
    console.log(`[Highlighted] Removed product ID ${normalizedProductId} for seller ${sellerId}`);
    res.json({ 
      message: 'Product removed from highlighted products',
      highlighted 
    });
  } catch (error) {
    console.error('Error removing highlighted product:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update highlighted products (replace entire list)
export const updateHighlightedProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }
    
    let highlighted = await HighlightedProduct.findOne({ seller: sellerId });
    
    if (!highlighted) {
      highlighted = new HighlightedProduct({
        seller: sellerId,
        productIds: productIds.map(id => id.trim())
      });
    } else {
      highlighted.productIds = productIds.map(id => id.trim());
    }
    
    await highlighted.save();
    res.json({ 
      message: 'Highlighted products updated',
      highlighted 
    });
  } catch (error) {
    console.error('Error updating highlighted products:', error);
    res.status(500).json({ error: error.message });
  }
};


