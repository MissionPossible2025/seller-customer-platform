// controllers/orderController.js
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { customer, customerDetails, items, totalAmount, notes } = req.body;

    console.log('Order creation request received:', {
      customer: customer ? 'present' : 'missing',
      customerDetails: customerDetails ? 'present' : 'missing',
      itemsCount: items?.length,
      totalAmount,
      hasNotes: !!notes
    });

    // Validate required fields
    if (!customer || !customerDetails || !items || !totalAmount) {
      const missingFields = [];
      if (!customer) missingFields.push('customer');
      if (!customerDetails) missingFields.push('customerDetails');
      if (!items || !Array.isArray(items)) missingFields.push('items');
      if (!totalAmount) missingFields.push('totalAmount');
      
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: missingFields 
      });
    }
    
    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      console.error('Invalid items array');
      return res.status(400).json({ error: 'Items must be a non-empty array' });
    }

    // Process items to ensure seller information is present
    const processedItems = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Processing item ${i + 1}:`, {
        product: item.product,
        quantity: item.quantity,
        hasSeller: !!item.seller
      });
      
      // Validate item has required fields
      if (!item.product || !item.quantity || item.quantity < 1) {
        console.error('Invalid item:', item);
        return res.status(400).json({ 
          error: `Item ${i + 1} is missing required fields: product, quantity` 
        });
      }
      
      // If seller is not provided, fetch it from the product
      if (!item.seller) {
        const product = await Product.findById(item.product);
        console.log(`Product for item ${i + 1}:`, {
          found: !!product,
          hasSeller: !!(product?.seller)
        });
        
        if (product && product.seller) {
          item.seller = product.seller;
        } else {
          console.error(`No seller found for product ${item.product}`);
          return res.status(400).json({ 
            error: `Product ${item.product} has no seller assigned` 
          });
        }
      }
      
      processedItems.push({
        ...item,
        seller: item.seller
      });
    }
    
    console.log('Processed items count:', processedItems.length);

    // Create order
    const order = new Order({
      customer,
      customerDetails,
      items: processedItems,
      totalAmount,
      notes: notes || ''
    });

    await order.save();
    await order.populate('items.product');
    await order.populate('items.seller');

    res.status(201).json({
      message: 'Order created successfully',
      order: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get orders for a specific seller
export const getOrdersBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const orders = await Order.find({
      'items.seller': sellerId
    })
    .populate('customer', 'name email phone')
    .populate('items.product', 'name description photo category taxPercentage')
    .populate('items.seller', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Orders fetched successfully',
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name description photo category taxPercentage')
      .populate('items.seller', 'name email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order fetched successfully',
      order: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, trackingNumber } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update status
    order.status = status || order.status;
    order.notes = notes || order.notes;
    order.trackingNumber = trackingNumber || order.trackingNumber;

    // Update delivery status based on order status
    if (status === 'accepted') {
      order.deliveryStatus = 'pending';
      order.acceptedAt = new Date(); // Track when order was accepted
      order.viewedByCustomer = false; // Mark as unviewed by customer
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date(); // Track when order was cancelled
      order.viewedByCustomer = false; // Mark as unviewed by customer
    } else if (status === 'shipped') {
      order.deliveryStatus = 'shipped';
    } else if (status === 'delivered') {
      order.deliveryStatus = 'delivered';
    }

    await order.save();
    await order.populate('customer', 'name email phone');
    await order.populate('items.product', 'name description photo category');
    await order.populate('items.seller', 'name email');

    res.status(200).json({
      message: 'Order status updated successfully',
      order: order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus, trackingNumber } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update delivery status
    order.deliveryStatus = deliveryStatus || order.deliveryStatus;
    order.trackingNumber = trackingNumber || order.trackingNumber;

    // Update order status based on delivery status
    if (deliveryStatus === 'delivered') {
      order.status = 'delivered';
    } else if (deliveryStatus === 'shipped') {
      order.status = 'shipped';
    }

    await order.save();
    await order.populate('customer', 'name email phone');
    await order.populate('items.product', 'name description photo category');
    await order.populate('items.seller', 'name email');

    res.status(200).json({
      message: 'Delivery status updated successfully',
      order: order
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update order items (returns editing: remove or reduce quantities)
export const updateOrderItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body; // expected: [{ product, quantity, variant }]

    console.log('Update order items request:', { orderId, itemsCount: items?.length });

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }

    if (items.length === 0) {
      return res.status(400).json({ error: 'items array cannot be empty' });
    }

    // Fetch order with lean() to avoid Mongoose document circular references
    const order = await Order.findById(orderId)
      .populate('items.product', 'taxPercentage')
      .lean();

    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Helper to safely convert variant to a plain object and create a key
    const getVariantKey = (variant) => {
      if (!variant || !variant.combination) return '';
      
      try {
        // Ensure we're working with a plain object
        let combination = variant.combination;
        
        // If it's a Mongoose subdocument, convert to plain object
        if (combination && typeof combination.toObject === 'function') {
          combination = combination.toObject();
        }
        
        // Ensure it's a plain object
        if (typeof combination === 'object' && !Array.isArray(combination)) {
          // Sort keys for consistent comparison
          const sorted = Object.fromEntries(
            Object.entries(combination).sort(([a], [b]) => a.localeCompare(b))
          );
          // Convert to JSON string for comparison (safe since it's a plain object now)
          return JSON.stringify(sorted);
        }
        
        // If it's already a string or other type, stringify it
        return JSON.stringify(combination);
      } catch (err) {
        console.error('Error processing variant:', err);
        return '';
      }
    };

    // Helper to safely extract variant as plain object
    const getPlainVariant = (variant) => {
      if (!variant) return null;
      
      try {
        // If it's a Mongoose subdocument, convert to plain object
        if (variant && typeof variant.toObject === 'function') {
          const plain = variant.toObject();
          // Ensure combination is also plain
          if (plain.combination && typeof plain.combination.toObject === 'function') {
            plain.combination = plain.combination.toObject();
          }
          return plain;
        }
        
        // If it's already a plain object, create a safe copy
        if (typeof variant === 'object' && variant !== null) {
          // Simple deep copy for plain objects (no circular refs)
          const copy = {};
          for (const key in variant) {
            if (variant.hasOwnProperty(key)) {
              const value = variant[key];
              if (value && typeof value.toObject === 'function') {
                copy[key] = value.toObject();
              } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                copy[key] = { ...value }; // Shallow copy for nested objects
              } else {
                copy[key] = value;
              }
            }
          }
          return copy;
        }
        
        return variant;
      } catch (err) {
        console.error('Error converting variant to plain object:', err);
        // Return a minimal safe structure
        return variant && typeof variant === 'object' ? { ...variant } : null;
      }
    };

    // Create a map of requested items by product ID and variant key
    const requestedMap = new Map();
    for (const it of items) {
      if (!it.product) {
        console.warn('Skipping item without product:', it);
        continue;
      }
      
      const productId = it.product.toString();
      const variantKey = getVariantKey(it.variant || null);
      const key = `${productId}::${variantKey}`;
      const qty = Math.max(0, Math.floor(Number(it.quantity) || 0));
      
      requestedMap.set(key, { 
        quantity: qty, 
        productId, 
        variant: getPlainVariant(it.variant || null)
      });
    }

    if (requestedMap.size === 0) {
      return res.status(400).json({ error: 'No valid items provided' });
    }

    // Build updated items array from existing order items and collect removed ones
    const updatedItems = [];
    const removedItems = [];
    
    for (const existingItem of order.items) {
      const productId = (existingItem.product?._id || existingItem.product).toString();
      const variantKey = getVariantKey(existingItem.variant || null);
      const key = `${productId}::${variantKey}`;
      
      if (requestedMap.has(key)) {
        const requested = requestedMap.get(key);

        // If quantity reduced, record the difference as returned
        const existingQty = Number(existingItem.quantity || 0);
        const newQty = Number(requested.quantity || 0);
        const deltaReturned = Math.max(0, existingQty - newQty);
        if (deltaReturned > 0) {
          removedItems.push({
            product: productId,
            quantity: deltaReturned,
            price: existingItem.price || 0,
            discountedPrice: existingItem.discountedPrice || null,
            seller: existingItem.seller ? (existingItem.seller._id || existingItem.seller).toString() : null,
            variant: requested.variant || getPlainVariant(existingItem.variant || null),
            returnedAt: new Date()
          });
        }

        if (newQty > 0) {
          // Keep the remaining quantity
          updatedItems.push({
            product: productId,
            quantity: newQty,
            price: existingItem.price || 0,
            discountedPrice: existingItem.discountedPrice || null,
            seller: existingItem.seller ? (existingItem.seller._id || existingItem.seller).toString() : null,
            variant: requested.variant || getPlainVariant(existingItem.variant || null)
          });
        }

        // Remove from map to track what was processed
        requestedMap.delete(key);
      } else {
        // Item was omitted from the request entirely => treat as returned/removed
        removedItems.push({
          product: productId,
          quantity: existingItem.quantity || 0,
          price: existingItem.price || 0,
          discountedPrice: existingItem.discountedPrice || null,
          seller: existingItem.seller ? (existingItem.seller._id || existingItem.seller).toString() : null,
          variant: getPlainVariant(existingItem.variant || null),
          returnedAt: new Date()
        });
      }
    }

    // Validate we have at least one item
    if (updatedItems.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item after update' });
    }

    console.log('Updated items count:', updatedItems.length);

    // Fetch order document (not lean) to update it
    const orderDoc = await Order.findById(orderId);
    if (!orderDoc) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order items
    orderDoc.items = updatedItems;

    // Append removed items to returnedItems log
    if (!Array.isArray(orderDoc.returnedItems)) {
      orderDoc.returnedItems = [];
    }
    if (removedItems.length > 0) {
      orderDoc.returnedItems.push(...removedItems);
    }

    // Recalculate totalAmount including tax for all items
    let subtotal = 0;
    let totalTax = 0;
    
    for (const item of updatedItems) {
      const product = await Product.findById(item.product).select('taxPercentage').lean();
      if (!product) {
        console.warn('Product not found for item:', item.product);
        continue;
      }
      
      const unitPrice = (item.discountedPrice && item.discountedPrice < item.price) 
        ? item.discountedPrice 
        : item.price;
      const lineSubtotal = (unitPrice || 0) * (item.quantity || 0);
      const taxPercentage = product.taxPercentage || 0;
      const lineTax = (lineSubtotal * taxPercentage) / 100;
      
      subtotal += lineSubtotal;
      totalTax += lineTax;
    }
    
    const grandTotal = subtotal + totalTax;
    orderDoc.totalAmount = Number(grandTotal.toFixed(2));

    console.log('Recalculated totals:', { subtotal, totalTax, grandTotal });

    await orderDoc.save();
    console.log('Order saved successfully');

    // Refetch with lean() to get plain objects without circular references
    const updatedOrder = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name description photo category taxPercentage')
      .populate('items.seller', 'name email')
      .populate('returnedItems.product', 'name description photo category taxPercentage')
      .populate('returnedItems.seller', 'name email')
      .lean();

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found after update' });
    }

    console.log('Order update completed successfully');
    return res.status(200).json({ message: 'Order items updated', order: updatedOrder });
    
  } catch (error) {
    console.error('Error updating order items:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update order items', 
      message: error.message 
    });
  }
};

// Get orders for a specific customer
export const getOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const orders = await Order.find({
      customer: customerId
    })
    .populate('customer', 'name email phone')
    .populate('items.product', 'name description photo category taxPercentage')
    .populate('items.seller', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Orders fetched successfully',
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email phone')
      .populate('items.product', 'name description photo category taxPercentage')
      .populate('items.seller', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Orders fetched successfully',
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark customer orders as viewed
export const markOrdersAsViewed = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Update all accepted and cancelled orders (with dates) for this customer to viewed
    await Order.updateMany(
      { 
        customer: customerId,
        $or: [
          { status: 'accepted', acceptedAt: { $exists: true }, viewedByCustomer: false },
          { status: 'cancelled', cancelledAt: { $exists: true }, viewedByCustomer: false }
        ]
      },
      { 
        viewedByCustomer: true
      }
    );

    res.status(200).json({
      message: 'Orders marked as viewed'
    });
  } catch (error) {
    console.error('Error marking orders as viewed:', error);
    res.status(500).json({ error: error.message });
  }
};
