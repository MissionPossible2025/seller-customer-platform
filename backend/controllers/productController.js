// controllers/productController.js
import Product from '../models/productModel.js';

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { 
      productId, 
      name, 
      description, 
      category, 
      price, 
      discountedPrice, 
      stockStatus, 
      seller, 
      sellerName, 
      sellerEmail,
      hasVariations,
      attributes,
      variants
    } = req.body;

    // Validate required fields
    if (!productId || !name || !description || !category || !seller || !sellerName || !sellerEmail) {
      return res.status(400).json({ 
        error: 'Missing required fields: productId, name, description, category, seller, sellerName, and sellerEmail are required' 
      });
    }

    // Validate category exists in database
    const Category = (await import('../models/categoryModel.js')).default;
    const categoryExists = await Category.findOne({ 
      name: category, 
      isActive: true 
    });
    
    if (!categoryExists) {
      return res.status(400).json({ 
        error: 'Invalid category. Please select a valid category.' 
      });
    }

    // Check if productId already exists
    const existingProduct = await Product.findOne({ productId: productId.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({ 
        error: 'Product ID already exists. Please use a different Product ID.' 
      });
    }

    // Parse multi-attribute data if provided
    let parsedAttributes = [];
    let parsedVariants = [];
    if (hasVariations === 'true' && attributes && variants) {
      try {
        parsedAttributes = JSON.parse(attributes);
        parsedVariants = JSON.parse(variants);
        
        if (!Array.isArray(parsedAttributes) || parsedAttributes.length === 0) {
          return res.status(400).json({ 
            error: 'Attributes must be a non-empty array when hasVariations is true' 
          });
        }
        
        if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
          return res.status(400).json({ 
            error: 'Variants must be a non-empty array when hasVariations is true' 
          });
        }
        
        // Validate attributes
        for (let i = 0; i < parsedAttributes.length; i++) {
          const attr = parsedAttributes[i];
          if (!attr.name || !attr.options || attr.options.length === 0) {
            return res.status(400).json({ 
              error: `Attribute ${i + 1} is missing required fields: name and options are required` 
            });
          }
          for (let j = 0; j < attr.options.length; j++) {
            const option = attr.options[j];
            if (!option.name) {
              return res.status(400).json({ 
                error: `Option ${j + 1} in attribute "${attr.name}" is missing name` 
              });
            }
          }
        }
        
        // Validate variants
        for (let i = 0; i < parsedVariants.length; i++) {
          const variant = parsedVariants[i];
          if (!variant.combination || !variant.price || !variant.stock) {
            return res.status(400).json({ 
              error: `Variant ${i + 1} is missing required fields: combination, price, and stock are required` 
            });
          }
        }
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid attributes or variants format. Must be valid JSON arrays.' 
        });
      }
    }

    // If file uploaded, construct public URL
    let photoUrl = undefined;
    if (req.file) {
      // Serve via /uploads; path configured in server.js
      const filename = req.file.filename;
      photoUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    }

    // Create product data object
    const productData = {
      productId: productId.toUpperCase(),
      name,
      description,
      category,
      photo: photoUrl || req.body.photo,
      seller,
      sellerName,
      sellerEmail,
      hasVariations: hasVariations === 'true',
      attributes: parsedAttributes,
      variants: parsedVariants
    };

    // Add base price/stockStatus only if no variations
    if (!productData.hasVariations) {
      if (!price || !stockStatus) {
        return res.status(400).json({ 
          error: 'Price and stockStatus are required when hasVariations is false' 
        });
      }
      productData.price = parseFloat(price);
      productData.discountedPrice = discountedPrice ? parseFloat(discountedPrice) : parseFloat(price);
      productData.stockStatus = stockStatus;
    }

    // Create new product
    const product = new Product(productData);
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
    const { name, description, category, price, discountedPrice, stockStatus, photo, isActive } = req.body;

    // Validate category if provided
    if (category) {
      const Category = (await import('../models/categoryModel.js')).default;
      const categoryExists = await Category.findOne({ 
        name: category, 
        isActive: true 
      });
      
      if (!categoryExists) {
        return res.status(400).json({ 
          error: 'Invalid category. Please select a valid category.' 
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (stockStatus !== undefined) updateData.stockStatus = stockStatus;
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
