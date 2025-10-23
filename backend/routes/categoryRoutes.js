// routes/categoryRoutes.js
import express from 'express';
import {
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById
} from '../controllers/categoryController.js';

const router = express.Router();

// Public routes
router.get('/', getCategories); // Get active categories
router.get('/all', getAllCategories); // Get all categories (for admin)
router.get('/:id', getCategoryById); // Get category by ID

// Protected routes (you may want to add authentication middleware)
router.post('/', createCategory); // Create new category
router.put('/:id', updateCategory); // Update category
router.delete('/:id', deleteCategory); // Delete category

export default router;
