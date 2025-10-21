// controllers/orderController.js
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { customer, customerDetails, items, totalAmount, notes } = req.body;

    // Validate required fields
    if (!customer || !customerDetails || !items || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For single seller setup, we can simplify the order creation
    // All items will be from the same seller
    const processedItems = items.map(item => ({
      ...item,
      seller: item.seller || 'single-seller-id' // Default seller ID for single seller setup
    }));

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
    .populate('items.product', 'name description photo category')
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
      .populate('items.product', 'name description photo category')
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

// Get all orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email phone')
      .populate('items.product', 'name description photo category')
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
