// routes/productRoutes.js
import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsBySeller
} from '../controllers/productController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Configure Multer storage with absolute path and ensure directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Product routes
router.post('/', upload.single('photo'), createProduct);                    // Create new product
router.get('/', getAllProducts);                    // Get all products with filters
router.get('/seller/:sellerId', getProductsBySeller); // Get products by specific seller
router.get('/:id', getProductById);                 // Get single product by ID
router.put('/:id', upload.single('photo'), updateProduct);                  // Update product
router.delete('/:id', deleteProduct);               // Delete product (soft delete)

export default router;
