// controllers/imagekitController.js
// ImageKit upload controller - handles image uploads and URL generation
// Supports both file uploads (multipart/form-data) and base64 strings (JSON)

import imagekit, { getImageKitAuth } from '../config/imagekit.js';
import multer from 'multer';
import { Readable } from 'stream';

/**
 * Helper function to convert base64 string to buffer
 * Handles data URL format (e.g., "data:image/png;base64,...")
 * @param {string} base64String - Base64 encoded image string
 * @returns {Buffer} - Image buffer
 */
const base64ToBuffer = (base64String) => {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

/**
 * Helper function to extract file extension from base64 data URL or filename
 * @param {string} base64String - Base64 string or filename
 * @param {string} originalName - Original filename (optional)
 * @returns {string} - File extension (e.g., 'jpg', 'png')
 */
const getFileExtension = (base64String, originalName = null) => {
  // Try to get extension from original filename first
  if (originalName) {
    const match = originalName.match(/\.([^.]+)$/);
    if (match) return match[1].toLowerCase();
  }
  
  // Try to extract from data URL
  const dataUrlMatch = base64String.match(/data:image\/(\w+);base64,/);
  if (dataUrlMatch) {
    return dataUrlMatch[1].toLowerCase();
  }
  
  // Default to jpg if unable to determine
  return 'jpg';
};

/**
 * Upload image to ImageKit
 * Supports both file buffers and base64 strings
 * @param {Buffer|Object} file - File buffer or multer file object
 * @param {string} fileName - Desired filename for the uploaded image
 * @param {Object} options - Additional upload options (folder, tags, etc.)
 * @returns {Promise<Object>} - ImageKit upload response
 */
const uploadToImageKit = async (file, fileName, options = {}) => {
  try {
    let fileBuffer;
    let originalFileName = fileName;

    // Handle different file input types
    if (Buffer.isBuffer(file)) {
      // Direct buffer (from base64 conversion)
      fileBuffer = file;
    } else if (file.buffer) {
      // Multer memory storage buffer
      fileBuffer = file.buffer;
      originalFileName = file.originalname || fileName;
    } else if (file.path) {
      // Multer disk storage - read file from path
      const fs = await import('fs');
      fileBuffer = fs.readFileSync(file.path);
      originalFileName = file.originalname || fileName;
    } else {
      throw new Error('Invalid file format. Expected buffer, multer file object, or file path.');
    }

    // Prepare upload parameters
    const uploadParams = {
      file: fileBuffer,
      fileName: originalFileName,
      folder: options.folder || '/products', // Default folder structure
      ...options // Allow overriding any ImageKit parameters
    };

    // Upload to ImageKit
    const result = await imagekit.upload(uploadParams);

    return {
      success: true,
      fileId: result.fileId,
      url: result.url, // Public URL
      thumbnailUrl: result.thumbnailUrl, // Thumbnail URL (if generated)
      name: result.name,
      size: result.size,
      fileType: result.fileType,
      width: result.width,
      height: result.height,
      filePath: result.filePath
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw new Error(`Failed to upload image to ImageKit: ${error.message}`);
  }
};

/**
 * Generate a signed URL for private images
 * Signed URLs have an expiration time and can be used to access private images
 * @param {string} filePath - ImageKit file path or URL
 * @param {number} expireSeconds - URL expiration time in seconds (default: 3600 = 1 hour)
 * @param {Object} transformationParams - ImageKit transformation parameters
 * @returns {string} - Signed URL
 */
export const generateSignedUrl = (filePath, expireSeconds = 3600, transformationParams = {}) => {
  try {
    // Generate signed URL with optional transformations
    const signedUrl = imagekit.url({
      path: filePath,
      signed: true,
      expireSeconds: expireSeconds,
      transformation: transformationParams
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Apply ImageKit URL transformations
 * Transformations are applied via URL parameters (no re-upload needed)
 * @param {string} imageUrl - Original ImageKit URL
 * @param {Object} transformations - Transformation parameters (width, height, crop, quality, etc.)
 * @returns {string} - Transformed image URL
 */
export const applyTransformations = (imageUrl, transformations = {}) => {
  try {
    // Extract file path from full URL
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    const filePath = imageUrl.replace(urlEndpoint, '');

    // Build transformation string
    const transformationString = Object.entries(transformations)
      .map(([key, value]) => `${key}-${value}`)
      .join(',');

    // Generate transformed URL
    const transformedUrl = imagekit.url({
      path: filePath,
      transformation: transformations
    });

    return transformedUrl;
  } catch (error) {
    console.error('Error applying transformations:', error);
    // Return original URL if transformation fails
    return imageUrl;
  }
};

/**
 * POST /api/imagekit/upload
 * Upload image to ImageKit
 * Accepts: multipart/form-data (file) or application/json (base64)
 */
export const uploadImage = async (req, res) => {
  try {
    const { 
      imageBase64, 
      fileName, 
      folder, 
      tags,
      useSignedUrl = false,
      signedUrlExpire = 3600,
      transformations = null
    } = req.body;
    
    const file = req.file; // From multer middleware

    // Validate that an image is provided
    if (!file && !imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Image is required. Provide either a file upload (multipart/form-data) or base64 string (application/json).'
      });
    }

    // Determine filename
    let finalFileName = fileName;
    if (file && file.originalname && !fileName) {
      finalFileName = file.originalname;
    } else if (!finalFileName) {
      finalFileName = `image-${Date.now()}.jpg`;
    }

    // Prepare upload options
    const uploadOptions = {};
    if (folder) uploadOptions.folder = folder;
    if (tags) uploadOptions.tags = tags;

    let uploadResult;

    // Handle base64 upload
    if (imageBase64) {
      const imageBuffer = base64ToBuffer(imageBase64);
      const extension = getFileExtension(imageBase64, fileName);
      finalFileName = finalFileName.replace(/\.[^.]+$/, '') + '.' + extension;
      
      uploadResult = await uploadToImageKit(imageBuffer, finalFileName, uploadOptions);
    } 
    // Handle file upload
    else if (file) {
      uploadResult = await uploadToImageKit(file, finalFileName, uploadOptions);
    }

    // Determine which URL to return
    let imageUrl = uploadResult.url;
    
    // Apply transformations if provided
    if (transformations && typeof transformations === 'object') {
      imageUrl = applyTransformations(uploadResult.url, transformations);
    }

    // Generate signed URL if requested (for private images)
    if (useSignedUrl) {
      imageUrl = generateSignedUrl(
        uploadResult.filePath, 
        parseInt(signedUrlExpire), 
        transformations || {}
      );
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to ImageKit',
      data: {
        url: imageUrl,
        fileId: uploadResult.fileId,
        filePath: uploadResult.filePath,
        name: uploadResult.name,
        size: uploadResult.size,
        width: uploadResult.width,
        height: uploadResult.height,
        fileType: uploadResult.fileType,
        isSignedUrl: useSignedUrl,
        ...(useSignedUrl && { expiresIn: signedUrlExpire })
      }
    });

  } catch (error) {
    console.error('Error in uploadImage controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: error.message
    });
  }
};

/**
 * GET /api/imagekit/auth
 * Get ImageKit authentication parameters for client-side uploads
 * This allows frontend to upload directly to ImageKit without exposing private key
 */
export const getAuthParams = (req, res) => {
  try {
    const authParams = getImageKitAuth();
    
    res.status(200).json({
      success: true,
      data: authParams
    });
  } catch (error) {
    console.error('Error getting ImageKit auth params:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authentication parameters',
      details: error.message
    });
  }
};

/**
 * POST /api/imagekit/transform
 * Apply transformations to an existing ImageKit image URL
 * This endpoint is useful for generating transformed URLs without re-uploading
 */
export const transformImage = (req, res) => {
  try {
    const { imageUrl, transformations } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl is required'
      });
    }

    if (!transformations || typeof transformations !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'transformations object is required'
      });
    }

    const transformedUrl = applyTransformations(imageUrl, transformations);

    res.status(200).json({
      success: true,
      data: {
        originalUrl: imageUrl,
        transformedUrl: transformedUrl,
        transformations: transformations
      }
    });

  } catch (error) {
    console.error('Error transforming image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transform image',
      details: error.message
    });
  }
};

/**
 * POST /api/imagekit/signed-url
 * Generate a signed URL for a private image
 */
export const createSignedUrl = (req, res) => {
  try {
    const { filePath, expireSeconds = 3600, transformations = {} } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'filePath is required'
      });
    }

    const signedUrl = generateSignedUrl(
      filePath, 
      parseInt(expireSeconds), 
      transformations
    );

    res.status(200).json({
      success: true,
      data: {
        signedUrl: signedUrl,
        expiresIn: parseInt(expireSeconds),
        filePath: filePath
      }
    });

  } catch (error) {
    console.error('Error creating signed URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate signed URL',
      details: error.message
    });
  }
};

