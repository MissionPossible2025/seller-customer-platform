// routes/orderRoutes.js
import express from 'express';
import {
  createOrder,
  getOrdersBySeller,
  getOrderById,
  updateOrderStatus,
  updateDeliveryStatus,
  getAllOrders
} from '../controllers/orderController.js';

const router = express.Router();

// Order routes
router.post('/', createOrder);                                    // Create new order
router.get('/seller/:sellerId', getOrdersBySeller);              // Get orders for specific seller
router.get('/:orderId', getOrderById);                           // Get order by ID
router.put('/:orderId/status', updateOrderStatus);               // Update order status
router.put('/:orderId/delivery', updateDeliveryStatus);          // Update delivery status
router.get('/', getAllOrders);                                   // Get all orders (admin)

export default router;
