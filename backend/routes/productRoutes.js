// routes/productRoutes.js
import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductByProductId,
  getProductsByProductIds,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
  updateProductOrder
} from '../controllers/productController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Configure Multer for ImageKit uploads - use memory storage
// Files are uploaded directly to ImageKit, not saved locally
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Product routes
router.post('/', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'photos', maxCount: 10 }
]), createProduct);                    // Create new product
router.get('/', getAllProducts);                    // Get all products with filters
router.get('/seller/:sellerId', getProductsBySeller); // Get products by specific seller
router.get('/by-product-id/:productId', getProductByProductId); // Get product by productId field
router.post('/by-product-ids', getProductsByProductIds); // Get multiple products by productIds
router.get('/:id', getProductById);                 // Get single product by MongoDB _id
router.put('/:id', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'photos', maxCount: 10 }
]), updateProduct);                  // Update product
router.put('/order/update', updateProductOrder);    // Update product display order
router.delete('/:id', deleteProduct);               // Delete product (soft delete)

export default router;
