// routes/imagekitRoutes.js
// ImageKit upload routes
// Handles image uploads, transformations, and signed URL generation

import express from 'express';
import multer from 'multer';
import {
  uploadImage,
  getAuthParams,
  transformImage,
  createSignedUrl
} from '../controllers/imagekitController.js';

const router = express.Router();

// Configure Multer for file uploads (memory storage for ImageKit)
// Using memory storage since we'll upload directly to ImageKit without saving locally
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (adjust as needed)
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

/**
 * POST /api/imagekit/upload
 * Upload image to ImageKit
 * 
 * Accepts two formats:
 * 1. multipart/form-data with 'image' file field
 * 2. application/json with 'imageBase64' string
 * 
 * Optional parameters (JSON body or form data):
 * - fileName: Custom filename (default: original filename or timestamp)
 * - folder: ImageKit folder path (default: '/products')
 * - tags: Comma-separated tags
 * - useSignedUrl: Boolean - generate signed URL instead of public URL
 * - signedUrlExpire: Number - expiration time in seconds (default: 3600)
 * - transformations: Object - transformation parameters (width, height, crop, etc.)
 * 
 * Example with file upload:
 * POST /api/imagekit/upload
 * Content-Type: multipart/form-data
 * Body: image=[file], fileName="product-1.jpg", folder="/products"
 * 
 * Example with base64:
 * POST /api/imagekit/upload
 * Content-Type: application/json
 * Body: { "imageBase64": "data:image/png;base64,...", "fileName": "product-1.png" }
 */
router.post('/upload', (req, res, next) => {
  // Only use multer if content-type is multipart/form-data
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.single('image')(req, res, next);
  } else {
    // Skip multer for JSON requests with base64
    next();
  }
}, uploadImage);

/**
 * GET /api/imagekit/auth
 * Get ImageKit authentication parameters for client-side uploads
 * This allows frontend to upload directly to ImageKit without exposing private key
 * 
 * Returns:
 * - token: Authentication token
 * - signature: Authentication signature
 * - expire: Expiration timestamp
 * - publicKey: ImageKit public key (safe to expose)
 * - urlEndpoint: ImageKit URL endpoint
 */
router.get('/auth', getAuthParams);

/**
 * POST /api/imagekit/transform
 * Apply transformations to an existing ImageKit image URL
 * 
 * Body:
 * - imageUrl: Original ImageKit URL
 * - transformations: Object with transformation parameters
 *   Example: { width: 300, height: 300, crop: 'center', quality: 80 }
 * 
 * Returns transformed URL
 */
router.post('/transform', transformImage);

/**
 * POST /api/imagekit/signed-url
 * Generate a signed URL for a private image
 * 
 * Body:
 * - filePath: ImageKit file path or URL
 * - expireSeconds: URL expiration time in seconds (default: 3600)
 * - transformations: Optional transformation parameters
 * 
 * Returns signed URL with expiration
 */
router.post('/signed-url', createSignedUrl);

export default router;

