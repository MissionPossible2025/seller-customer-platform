import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1, variant } = req.body;

    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({ error: 'User ID and Product ID are required' });
    }

    console.log('Cart request - userId:', userId, 'productId:', productId, 'variant:', variant); // Debug log

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Handle pricing and stock based on whether product has multi-attribute variations
    let itemPrice, itemDiscountedPrice, availableStock;
    
    if (product.hasVariations && product.variants && product.variants.length > 0) {
      // Product has multi-attribute variations
      if (!variant || !variant.combination) {
        return res.status(400).json({ error: 'Variant selection is required for this product' });
      }
      
      // Find the specific variant by matching combination
      const selectedVariant = product.variants.find(v => {
        return Object.entries(variant.combination).every(([key, value]) => 
          v.combination.get && v.combination.get(key) === value
        );
      });
      
      if (!selectedVariant) {
        return res.status(400).json({ error: 'Selected variant not found' });
      }
      
      itemPrice = variant.price || selectedVariant.price;
      itemDiscountedPrice = variant.originalPrice && variant.price < variant.originalPrice 
        ? variant.price 
        : selectedVariant.discountedPrice;
      availableStock = selectedVariant.stock === 'in_stock' ? 999 : 0; // Convert to numeric for stock check
    } else {
      // Product without variations
      itemPrice = product.price;
      itemDiscountedPrice = product.discountedPrice;
      availableStock = product.stock;
    }

    // Check stock availability
    if (availableStock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock available' });
    }

    // Find existing cart or create new one
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if product already exists in cart (with same variant if applicable)
    const existingItemIndex = cart.items.findIndex(item => {
      const sameProduct = item.product.toString() === productId;
      const sameVariant = variant 
        ? (item.variant && JSON.stringify(item.variant.combination) === JSON.stringify(variant.combination))
        : (!item.variant || !item.variant.combination);
      return sameProduct && sameVariant;
    });

    if (existingItemIndex > -1) {
      // Update quantity if item already exists
      cart.items[existingItemIndex].quantity += quantity;
      
      // Check stock again after adding quantity
      if (availableStock < cart.items[existingItemIndex].quantity) {
        return res.status(400).json({ error: 'Insufficient stock available' });
      }
    } else {
      // Add new item to cart
      const newItem = {
        product: productId,
        quantity: quantity,
        price: itemPrice,
        discountedPrice: itemDiscountedPrice
      };
      
      // Add variant info if applicable
      if (variant && variant.combination) {
        newItem.variant = {
          combination: variant.combination,
          price: itemPrice,
          originalPrice: variant.originalPrice || itemPrice,
          stock: variant.stock || 'in_stock'
        };
      }
      
      cart.items.push(newItem);
    }

    await cart.save();
    
    // Populate product details for response
    await cart.populate('items.product');
    
    res.status(200).json({ 
      message: 'Item added to cart successfully',
      cart: cart
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      return res.status(200).json({ cart: { items: [], totalAmount: 0 } });
    }

    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity < 0) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity === 0) {
      // Remove item from cart
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock availability
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      if (product.stock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock available' });
      }
      
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({ 
      message: 'Cart updated successfully',
      cart: cart
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: 'User ID and Product ID are required' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({ 
      message: 'Item removed from cart successfully',
      cart: cart
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ 
      message: 'Cart cleared successfully',
      cart: cart
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
