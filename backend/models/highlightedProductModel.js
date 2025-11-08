// models/highlightedProductModel.js
import mongoose from 'mongoose';

const highlightedProductSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productIds: [{
    type: String,
    required: true,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
highlightedProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure one document per seller
highlightedProductSchema.index({ seller: 1 }, { unique: true });

const HighlightedProduct = mongoose.model('HighlightedProduct', highlightedProductSchema);

export default HighlightedProduct;


