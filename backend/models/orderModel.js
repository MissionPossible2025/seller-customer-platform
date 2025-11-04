// models/orderModel.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        default: 'India'
      }
    }
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    discountedPrice: {
      type: Number
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Variant information for products with multi-attribute variations
    variant: {
      combination: {
        type: Map,
        of: String
      },
      price: {
        type: Number,
        min: 0
      },
      originalPrice: {
        type: Number,
        min: 0
      },
      stock: {
        type: String,
        enum: ['in_stock', 'out_of_stock'],
        default: 'in_stock'
      }
    }
  }],
  // Track items that were returned/removed after order creation
  returnedItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    price: {
      type: Number
    },
    discountedPrice: {
      type: Number
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    variant: {
      combination: {
        type: Map,
        of: String
      },
      price: {
        type: Number
      },
      originalPrice: {
        type: Number
      },
      stock: {
        type: String,
        enum: ['in_stock', 'out_of_stock'],
        default: 'in_stock'
      }
    },
    returnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  acceptedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  viewedByCustomer: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'shipped', 'out_for_delivery', 'delivered'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  },
  trackingNumber: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

// Index for better search performance
orderSchema.index({ customer: 1 });
orderSchema.index({ 'items.seller': 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
