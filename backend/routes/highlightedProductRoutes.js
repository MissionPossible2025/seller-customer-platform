// routes/highlightedProductRoutes.js
import express from 'express';
import {
  getHighlightedProducts,
  addHighlightedProduct,
  removeHighlightedProduct,
  updateHighlightedProducts
} from '../controllers/highlightedProductController.js';

const router = express.Router();

router.get('/seller/:sellerId', getHighlightedProducts);
router.post('/seller/:sellerId/add', addHighlightedProduct);
router.post('/seller/:sellerId/remove', removeHighlightedProduct);
router.put('/seller/:sellerId', updateHighlightedProducts);

export default router;


