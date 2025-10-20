// controllers/productController.js
import Product from '../models/productModel.js';

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, discountedPrice, stock, seller } = req.body;

    // Validate required fields
    if (!name || !description || !category || !price || !stock) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, description, category, price, and stock are required' 
      });
    }

    // Validate category
    const validCategories = ['Electronics', 'Clothing', 'Books', 'Furniture'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: Electronics, Clothing, Books, Furniture' 
      });
    }

    // If file uploaded, construct public URL
    let photoUrl = undefined;
    if (req.file) {
      // Serve via /uploads; path configured in server.js
      const filename = req.file.filename;
      photoUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    }

    // Create new product
    const product = new Product({
      name,
      description,
      category,
      price,
      discountedPrice: discountedPrice || price,
      stock,
      photo: photoUrl || req.body.photo,
      seller: seller || req.user?.id // Use seller from request or current user
    });

    const savedProduct = await product.save();
    
    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const { category, seller, search, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (seller) {
      filter.seller = seller;
    }
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message 
    });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error.message 
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { name, description, category, price, discountedPrice, stock, photo, isActive } = req.body;

    // Validate category if provided
    if (category) {
      const validCategories = ['Electronics', 'Clothing', 'Books', 'Furniture'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ 
          error: 'Invalid category. Must be one of: Electronics, Clothing, Books, Furniture' 
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (stock !== undefined) updateData.stock = stock;
    // If a new file is uploaded, override photo with the new public URL
    if (req.file) {
      const filename = req.file.filename;
      updateData.photo = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    } else if (photo !== undefined) {
      updateData.photo = photo;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: 'Failed to update product',
      details: error.message 
    });
  }
};

// Delete product (soft delete by setting isActive to false)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product',
      details: error.message 
    });
  }
};

// Get products by seller
export const getProductsBySeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId || req.user?.id;
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    const products = await Product.find({ 
      seller: sellerId, 
      isActive: true 
    })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });

    res.json(products);

  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch seller products',
      details: error.message 
    });
  }
};
