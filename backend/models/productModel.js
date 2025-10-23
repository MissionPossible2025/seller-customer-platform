// models/productModel.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  // Base price (for products without variations)
  price: {
    type: Number,
    min: 0
  },
  discountedPrice: {
    type: Number,
    min: 0
  },
  // Stock status (for products without variations)
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock'],
    default: 'in_stock'
  },
      // Multi-attribute variations system
      attributes: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        options: [{
          name: {
            type: String,
            required: true,
            trim: true
          },
          displayName: {
            type: String,
            trim: true
          }
        }]
      }],
      // All possible combinations of attributes
      variants: [{
        // Combination of attribute values (e.g., {Storage: "64GB", Color: "Black"})
        combination: {
          type: Map,
          of: String,
          required: true
        },
        price: {
          type: Number,
          required: true,
          min: 0
        },
        discountedPrice: {
          type: Number,
          min: 0
        },
        stock: {
          type: String,
          enum: ['in_stock', 'out_of_stock'],
          default: 'in_stock'
        },
        images: [{
          type: String,
          trim: true
        }],
        isActive: {
          type: Boolean,
          default: true
        }
      }],
      // Whether this product has multi-attribute variations
      hasVariations: {
        type: Boolean,
        default: false
      },
  photo: {
    type: String,
    trim: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: {
    type: String,
    required: true,
    trim: true
  },
  sellerEmail: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional fields for each category
  specifications: {
    type: Map,
    of: String
  }
}, { 
  timestamps: true 
});

// Index for better search performance
productSchema.index({ productId: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
