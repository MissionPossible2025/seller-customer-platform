// controllers/productController.js
import Product from '../models/productModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadImageToImageKit,
  uploadMultipleImagesToImageKit,
  deleteImageFromImageKit,
  isImageKitUrl
} from '../utils/imagekitUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Helper to build absolute file URLs that work across devices.
// Uses environment variable or falls back to hardcoded IP for consistent image URLs in database.
const getBaseUrl = (req) => {
  // Use PUBLIC_BASE_URL from environment if available, otherwise use hardcoded IP
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes
  }
  // Fallback to hardcoded IP (for backward compatibility)
  return 'http://10.253.19.114:5000';
};

// Helper to extract filename from URL
const extractFilenameFromUrl = (url) => {
  if (!url) return null;
  // Handle both full URLs and relative paths
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1];
  return filename || null;
};

// Helper to delete image from ImageKit or local storage
const deleteImageFile = async (imageUrl, fileId = null) => {
  try {
    if (!imageUrl) return;
    
    // If it's an ImageKit URL, delete from ImageKit
    if (isImageKitUrl(imageUrl) && fileId) {
      await deleteImageFromImageKit(fileId);
      return;
    }
    
    // Otherwise, try to delete from local storage (backward compatibility)
    const filename = extractFilenameFromUrl(imageUrl);
    if (!filename) return;
    
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted local image file: ${filename}`);
    }
  } catch (error) {
    console.error(`Error deleting image file ${imageUrl}:`, error);
    // Don't throw - continue even if file deletion fails
  }
};

// Helper to delete multiple image files
const deleteImageFiles = async (imageUrls, fileIds = {}) => {
  if (!Array.isArray(imageUrls)) return;
  for (const url of imageUrls) {
    const fileId = fileIds[url] || null;
    await deleteImageFile(url, fileId);
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { 
      productId, 
      name,
      brand,
      unit,
      description, 
      category, 
      price, 
      discountedPrice, 
      discountPercent,
      taxPercentage,
      stockStatus, 
      seller, 
      sellerName, 
      sellerEmail,
      hasVariations,
      attributes,
      variants
    } = req.body;

    // Validate required fields
    if (!productId || !name || !description || !category || !seller || !sellerName || !sellerEmail) {
      return res.status(400).json({ 
        error: 'Missing required fields: productId, name, description, category, seller, sellerName, and sellerEmail are required' 
      });
    }

    // Validate category exists in database
    const Category = (await import('../models/categoryModel.js')).default;
    const categoryExists = await Category.findOne({ 
      name: category, 
      isActive: true 
    });
    
    if (!categoryExists) {
      return res.status(400).json({ 
        error: 'Invalid category. Please select a valid category.' 
      });
    }

    // Check if productId already exists (case-sensitive exact match)
    const trimmedProductId = productId.trim();
    const existingProduct = await Product.findOne({ productId: trimmedProductId });
    if (existingProduct) {
      return res.status(400).json({ 
        error: 'Product ID already exists. Please use a different Product ID.' 
      });
    }

    // Parse multi-attribute data if provided
    let parsedAttributes = [];
    let parsedVariants = [];
    if (hasVariations === 'true' && attributes && variants) {
      try {
        parsedAttributes = JSON.parse(attributes);
        parsedVariants = JSON.parse(variants);
        
        if (!Array.isArray(parsedAttributes) || parsedAttributes.length === 0) {
          return res.status(400).json({ 
            error: 'Attributes must be a non-empty array when hasVariations is true' 
          });
        }
        
        if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
          return res.status(400).json({ 
            error: 'Variants must be a non-empty array when hasVariations is true' 
          });
        }
        
        // Validate attributes
        for (let i = 0; i < parsedAttributes.length; i++) {
          const attr = parsedAttributes[i];
          if (!attr.name || !attr.options || attr.options.length === 0) {
            return res.status(400).json({ 
              error: `Attribute ${i + 1} is missing required fields: name and options are required` 
            });
          }
          for (let j = 0; j < attr.options.length; j++) {
            const option = attr.options[j];
            if (!option.name) {
              return res.status(400).json({ 
                error: `Option ${j + 1} in attribute "${attr.name}" is missing name` 
              });
            }
          }
        }
        
        // Validate variants
        for (let i = 0; i < parsedVariants.length; i++) {
          const variant = parsedVariants[i];
          if (!variant.combination || !variant.price || !variant.stock) {
            return res.status(400).json({ 
              error: `Variant ${i + 1} is missing required fields: combination, price, and stock are required` 
            });
          }
        }
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid attributes or variants format. Must be valid JSON arrays.' 
        });
      }
    }

    // Handle photo uploads - upload to ImageKit instead of local storage
    let photoUrl = null;
    let photoUrls = [];
    let imageKitFileIds = {}; // Store ImageKit fileIds for future deletion

    // Debug logging for file uploads
    console.log('[createProduct] Files received:', req.files ? Object.keys(req.files) : 'none');
    if (req.files) {
      console.log('[createProduct] File details:', {
        photos: req.files.photos ? req.files.photos.length : 0,
        photo: req.files.photo ? req.files.photo.length : 0
      });
    }

    if (req.files && Object.keys(req.files).length > 0) {
      // Files are uploaded - upload them to ImageKit
      const photoFiles = req.files.photos || [];
      const singlePhoto = req.files.photo?.[0];
      
      try {
        if (photoFiles && photoFiles.length > 0) {
          // Multiple photos - upload all to ImageKit
          const folder = `/products/${trimmedProductId}`;
          const baseFileName = `${trimmedProductId}`;
          
          const uploadResults = await uploadMultipleImagesToImageKit(
            photoFiles,
            baseFileName,
            folder,
            { tags: [`product-${trimmedProductId}`, category] }
          );
          
          photoUrls = uploadResults.map(result => result.url);
          // Store fileIds for future deletion
          uploadResults.forEach((result, index) => {
            imageKitFileIds[result.url] = result.fileId;
          });
          
          // Set the first photo as the main photo
          if (photoUrls.length > 0) {
            photoUrl = photoUrls[0];
          }
          
          console.log('[createProduct] Uploaded', photoUrls.length, 'images to ImageKit');
        } else if (singlePhoto) {
          // Single photo - upload to ImageKit
          const folder = `/products/${trimmedProductId}`;
          const fileName = `${trimmedProductId}-${Date.now()}.${singlePhoto.originalname.split('.').pop() || 'jpg'}`;
          
          const uploadResult = await uploadImageToImageKit(
            singlePhoto,
            fileName,
            folder,
            { tags: [`product-${trimmedProductId}`, category] }
          );
          
          photoUrl = uploadResult.url;
          photoUrls = [photoUrl];
          imageKitFileIds[photoUrl] = uploadResult.fileId;
          
          console.log('[createProduct] Uploaded single image to ImageKit:', photoUrl);
        }
      } catch (uploadError) {
        console.error('[createProduct] Error uploading images to ImageKit:', uploadError);
        return res.status(500).json({
          error: 'Failed to upload images to ImageKit',
          details: uploadError.message
        });
      }
    } else {
      // Fallback: check if photo URLs are provided in body (already uploaded to ImageKit or external URLs)
      const isValidUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        // Accept any valid URL (ImageKit URLs, external URLs, or local paths for backward compatibility)
        return /^https?:\/\/|^\/uploads\//.test(url.trim());
      };
      
      if (req.body.photo && isValidUrl(req.body.photo)) {
        photoUrl = req.body.photo.trim();
        console.log('[createProduct] Using photo from body:', photoUrl);
      } else if (req.body.photo) {
        console.warn('[createProduct] Invalid photo URL in body, ignoring:', req.body.photo);
      }
      
      if (req.body.photos) {
        try {
          const parsedPhotos = Array.isArray(req.body.photos) ? req.body.photos : JSON.parse(req.body.photos);
          // Filter out invalid URLs
          photoUrls = parsedPhotos.filter(url => isValidUrl(url)).map(url => url.trim());
          if (photoUrls.length > 0 && !photoUrl) {
            photoUrl = photoUrls[0];
          }
          console.log('[createProduct] Using photos from body (filtered):', photoUrls);
        } catch (e) {
          console.error('[createProduct] Error parsing photos from body:', e);
        }
      }
    }
    
    // Ensure photo is set if we have photos array
    if (!photoUrl && photoUrls.length > 0) {
      photoUrl = photoUrls[0];
      console.log('[createProduct] Set photo from photos array:', photoUrl);
    }
    
    console.log('[createProduct] Final photo URLs - photo:', photoUrl, 'photos:', photoUrls);

    // Create product data object
    const productData = {
      productId: trimmedProductId, // Save exactly as entered (trimmed)
      name,
      brand: brand || '',
      unit: unit || 'piece',
      description,
      category,
      photo: photoUrl || req.body.photo || null,
      photos: photoUrls.length > 0 ? photoUrls : (req.body.photos ? (Array.isArray(req.body.photos) ? req.body.photos : JSON.parse(req.body.photos)) : []),
      seller,
      sellerName,
      sellerEmail,
      taxPercentage: taxPercentage ? parseFloat(taxPercentage) : 0,
      hasVariations: hasVariations === 'true',
      attributes: parsedAttributes,
      variants: parsedVariants,
      isActive: true // Products are always visible when created
    };
    
    console.log('[createProduct] Product data before save:', {
      name: productData.name,
      photo: productData.photo,
      photos: productData.photos,
      photosCount: productData.photos ? productData.photos.length : 0
    });

    // Add base price/stockStatus only if no variations
    if (!productData.hasVariations) {
      if (!price || !stockStatus) {
        return res.status(400).json({ 
          error: 'Price and stockStatus are required when hasVariations is false' 
        });
      }
      productData.price = parseFloat(price);
      productData.discountedPrice = discountedPrice ? parseFloat(discountedPrice) : parseFloat(price);
      productData.discountPercent = discountPercent ? parseFloat(discountPercent) : 0;
      productData.stockStatus = stockStatus;
    }

    // Create new product
    const product = new Product(productData);
    let savedProduct;
    try {
      savedProduct = await product.save();
      console.log('[createProduct] Product saved successfully:', {
        id: savedProduct._id,
        photo: savedProduct.photo,
        photos: savedProduct.photos,
        photosCount: savedProduct.photos ? savedProduct.photos.length : 0
      });
    } catch (error) {
      // If product creation fails, try to delete uploaded ImageKit images
      // Note: This is best effort - ImageKit images will remain if deletion fails
      if (photoUrls.length > 0) {
        console.warn('[createProduct] Product creation failed, attempting to clean up ImageKit images');
        await deleteImageFiles(photoUrls, imageKitFileIds);
      }
      throw error; // Re-throw to be caught by outer catch
    }
    
    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const { category, seller, search, page, limit } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    // Exclude electronics and clothing categories (case-insensitive)
    const excludedCategories = ['electronics', 'clothing', 'Electronics', 'Clothing', 'ELECTRONICS', 'CLOTHING'];
    
    if (category) {
      // If a specific category is requested, check if it's excluded
      const categoryLower = category.toLowerCase();
      if (categoryLower === 'electronics' || categoryLower === 'clothing') {
        // Return empty result if requesting excluded categories
        return res.json({
          products: [],
          pagination: {
            current: parseInt(page) || 1,
            pages: 0,
            total: 0
          }
        });
      }
      // Use $and to combine category match with exclusion
      filter.$and = [
        { category: category },
        { category: { $nin: excludedCategories } }
      ];
    } else {
      // No specific category requested, just exclude electronics and clothing
      filter.category = { $nin: excludedCategories };
    }
    
    if (seller) {
      filter.seller = seller;
    }
    
    if (search) {
      filter.$text = { $search: search };
    }

    // If no limit is specified, return all products (for customer app)
    // If limit is specified, use pagination (for other use cases)
    const usePagination = limit !== undefined && limit !== null && limit !== '';
    const limitValue = usePagination ? parseInt(limit) : 10000; // Very high limit when pagination not used
    const pageValue = parseInt(page) || 1;
    const skip = usePagination ? (pageValue - 1) * limitValue : 0;
    
    const products = await Product.find(filter)
      .populate('seller', 'name email')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitValue);

    // Log image data for debugging
    if (products.length > 0) {
      console.log('[getAllProducts] Sample product image data:', {
        name: products[0].name,
        photo: products[0].photo,
        photos: products[0].photos,
        photosCount: products[0].photos ? products[0].photos.length : 0
      });
    }

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: pageValue,
        pages: usePagination ? Math.ceil(total / limitValue) : 1,
        total
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message 
    });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error.message 
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { 
      name,
      brand,
      unit,
      description, 
      category, 
      price, 
      discountedPrice, 
      discountPercent,
      taxPercentage,
      stockStatus, 
      photo, 
      isActive,
      hasVariations,
      attributes,
      variants
    } = req.body;

    // Validate category if provided
    if (category) {
      const Category = (await import('../models/categoryModel.js')).default;
      const categoryExists = await Category.findOne({ 
        name: category, 
        isActive: true 
      });
      
      if (!categoryExists) {
        return res.status(400).json({ 
          error: 'Invalid category. Please select a valid category.' 
        });
      }
    }

    // Parse multi-attribute data if provided
    let parsedAttributes = [];
    let parsedVariants = [];
    if (hasVariations === 'true' && attributes && variants) {
      try {
        parsedAttributes = JSON.parse(attributes);
        parsedVariants = JSON.parse(variants);
        
        if (!Array.isArray(parsedAttributes) || parsedAttributes.length === 0) {
          return res.status(400).json({ 
            error: 'Attributes must be a non-empty array when hasVariations is true' 
          });
        }
        
        if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
          return res.status(400).json({ 
            error: 'Variants must be a non-empty array when hasVariations is true' 
          });
        }
        
        // Validate attributes
        for (let i = 0; i < parsedAttributes.length; i++) {
          const attr = parsedAttributes[i];
          if (!attr.name || !attr.options || attr.options.length === 0) {
            return res.status(400).json({ 
              error: `Attribute ${i + 1} is missing required fields: name and options are required` 
            });
          }
          for (let j = 0; j < attr.options.length; j++) {
            const option = attr.options[j];
            if (!option.name) {
              return res.status(400).json({ 
                error: `Option ${j + 1} in attribute "${attr.name}" is missing name` 
              });
            }
          }
        }
        
        // Validate variants
        for (let i = 0; i < parsedVariants.length; i++) {
          const variant = parsedVariants[i];
          if (!variant.combination || !variant.price || !variant.stock) {
            return res.status(400).json({ 
              error: `Variant ${i + 1} is missing required fields: combination, price, and stock are required` 
            });
          }
        }
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid JSON format for attributes or variants' 
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (req.body.brand !== undefined) updateData.brand = req.body.brand;
    if (unit !== undefined) updateData.unit = unit;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (discountPercent !== undefined) updateData.discountPercent = parseFloat(discountPercent);
    if (taxPercentage !== undefined) updateData.taxPercentage = parseFloat(taxPercentage);
    if (stockStatus !== undefined) updateData.stockStatus = stockStatus;
    if (hasVariations !== undefined) updateData.hasVariations = hasVariations === 'true';
    if (attributes !== undefined) updateData.attributes = parsedAttributes;
    if (variants !== undefined) updateData.variants = parsedVariants;
    
    // Handle photo uploads - upload to ImageKit instead of local storage
    let allPhotos = [];
    let imagesToDelete = []; // Track old ImageKit images to delete after successful update
    let imageKitFileIdsToDelete = {}; // Store fileIds for ImageKit deletion
    
    // Get existing product to preserve existing photos
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let existingPhotos = existingProduct?.photos || [];
    const existingPhoto = existingProduct?.photo;
    const productId = existingProduct.productId;
    
    // Handle image removal: if photo/photos are explicitly set to empty/null
    if (req.body.removePhotos === 'true' || req.body.photos === '' || req.body.photo === '') {
      // Mark all existing images for deletion from ImageKit
      if (existingPhoto && isImageKitUrl(existingPhoto)) {
        imagesToDelete.push(existingPhoto);
      }
      if (existingPhotos && existingPhotos.length > 0) {
        existingPhotos.forEach(url => {
          if (isImageKitUrl(url)) {
            imagesToDelete.push(url);
          }
        });
      }
      allPhotos = [];
      updateData.photos = [];
      updateData.photo = null;
    } else if (req.files && Object.keys(req.files).length > 0) {
      // New images are being uploaded - upload to ImageKit and replace existing ones
      const photoFiles = req.files.photos || [];
      const singlePhoto = req.files.photo?.[0];
      
      try {
        if (photoFiles && photoFiles.length > 0) {
          // Multiple photos - upload all to ImageKit
          const folder = `/products/${productId}`;
          const baseFileName = `${productId}`;
          
          const uploadResults = await uploadMultipleImagesToImageKit(
            photoFiles,
            baseFileName,
            folder,
            { tags: [`product-${productId}`, category || existingProduct.category] }
          );
          
          allPhotos = uploadResults.map(result => result.url);
          
          // Mark old images for deletion from ImageKit (only after successful save)
          if (existingPhoto && isImageKitUrl(existingPhoto)) {
            imagesToDelete.push(existingPhoto);
          }
          if (existingPhotos && existingPhotos.length > 0) {
            existingPhotos.forEach(url => {
              if (isImageKitUrl(url)) {
                imagesToDelete.push(url);
              }
            });
          }
          
          updateData.photos = allPhotos;
          if (allPhotos.length > 0) {
            updateData.photo = allPhotos[0];
          }
          
          console.log('[updateProduct] Uploaded', allPhotos.length, 'new images to ImageKit');
        } else if (singlePhoto) {
          // Single photo - upload to ImageKit
          const folder = `/products/${productId}`;
          const fileName = `${productId}-${Date.now()}.${singlePhoto.originalname.split('.').pop() || 'jpg'}`;
          
          const uploadResult = await uploadImageToImageKit(
            singlePhoto,
            fileName,
            folder,
            { tags: [`product-${productId}`, category || existingProduct.category] }
          );
          
          const newPhotoUrl = uploadResult.url;
          
          // Mark old images for deletion from ImageKit (only after successful save)
          if (existingPhoto && isImageKitUrl(existingPhoto)) {
            imagesToDelete.push(existingPhoto);
          }
          if (existingPhotos && existingPhotos.length > 0) {
            existingPhotos.forEach(url => {
              if (isImageKitUrl(url)) {
                imagesToDelete.push(url);
              }
            });
          }
          
          updateData.photo = newPhotoUrl;
          allPhotos = [newPhotoUrl];
          updateData.photos = allPhotos;
          
          console.log('[updateProduct] Uploaded single new image to ImageKit:', newPhotoUrl);
        }
      } catch (uploadError) {
        console.error('[updateProduct] Error uploading images to ImageKit:', uploadError);
        return res.status(500).json({
          error: 'Failed to upload images to ImageKit',
          details: uploadError.message
        });
      }
    } else {
      // No new files uploaded - keep existing photos unless explicitly changed
      if (photo !== undefined && photo !== null && photo !== '') {
        // Photo URL provided directly - replace existing
        if (existingPhoto && existingPhoto !== photo) {
          imagesToDelete.push(existingPhoto);
        }
        if (existingPhotos && existingPhotos.length > 0) {
          const photoInExisting = existingPhotos.includes(photo);
          if (!photoInExisting) {
            // New photo URL provided, mark old ones for deletion
            imagesToDelete.push(...existingPhotos);
          }
        }
        updateData.photo = photo;
        updateData.photos = Array.isArray(req.body.photos) ? req.body.photos : [photo];
      } else if (req.body.photos !== undefined) {
        // Photos array provided directly
        const newPhotos = Array.isArray(req.body.photos) ? req.body.photos : JSON.parse(req.body.photos || '[]');
        // Find photos to delete (ones not in new list)
        const photosToKeep = new Set(newPhotos);
        if (existingPhoto && !photosToKeep.has(existingPhoto)) {
          imagesToDelete.push(existingPhoto);
        }
        existingPhotos.forEach(existing => {
          if (!photosToKeep.has(existing)) {
            imagesToDelete.push(existing);
          }
        });
        updateData.photos = newPhotos;
        updateData.photo = newPhotos.length > 0 ? newPhotos[0] : null;
      } else {
        // Keep existing photos if no changes
        if (existingPhotos && existingPhotos.length > 0) {
          updateData.photos = existingPhotos;
          updateData.photo = existingPhotos[0];
        } else if (existingPhoto) {
          updateData.photo = existingPhoto;
          updateData.photos = [existingPhoto];
        }
      }
    }
    
    // Prevent hiding products through update - products can only be hidden via delete endpoint
    // Only allow setting isActive to true if explicitly provided (to re-activate if needed)
    if (isActive !== undefined && isActive === true) {
      updateData.isActive = true;
    }
    // If isActive is false, ignore it - products can only be hidden via deleteProduct endpoint

    let product;
    try {
      product = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('seller', 'name email');

      if (!product) {
        // If update failed, try to delete newly uploaded ImageKit images
        // Note: This is best effort - ImageKit doesn't provide easy rollback
        if (req.files && Object.keys(req.files).length > 0 && allPhotos.length > 0) {
          console.warn('[updateProduct] Update failed, but new images were uploaded to ImageKit');
          // Could implement rollback here if needed, but typically we keep the images
        }
        return res.status(404).json({ error: 'Product not found' });
      }

      // Delete old ImageKit images only after successful update
      if (imagesToDelete.length > 0) {
        await deleteImageFiles(imagesToDelete, imageKitFileIdsToDelete);
      }

      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (updateError) {
      // If update failed, log warning about newly uploaded ImageKit images
      // Note: ImageKit images will remain, but product wasn't updated
      if (req.files && Object.keys(req.files).length > 0 && allPhotos.length > 0) {
        console.warn('[updateProduct] Update failed, but new images were uploaded to ImageKit:', allPhotos);
        // Could implement rollback here if needed
      }
      throw updateError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: 'Failed to update product',
      details: error.message 
    });
  }
};

// Delete product (soft delete by setting isActive to false)
export const deleteProduct = async (req, res) => {
  try {
    // Get product first to access image URLs before deletion
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Collect all image URLs to delete from ImageKit
    const imagesToDelete = [];
    if (product.photo && isImageKitUrl(product.photo)) {
      imagesToDelete.push(product.photo);
    }
    if (product.photos && Array.isArray(product.photos)) {
      product.photos.forEach(photo => {
        if (photo && isImageKitUrl(photo) && !imagesToDelete.includes(photo)) {
          imagesToDelete.push(photo);
        }
      });
    }
    
    // Also check variant images
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(variant => {
        if (variant.images && Array.isArray(variant.images)) {
          variant.images.forEach(img => {
            if (img && isImageKitUrl(img) && !imagesToDelete.includes(img)) {
              imagesToDelete.push(img);
            }
          });
        }
      });
    }

    // Soft delete the product
    await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    // Delete all associated images from ImageKit
    if (imagesToDelete.length > 0) {
      await deleteImageFiles(imagesToDelete);
    }

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product',
      details: error.message 
    });
  }
};

// Update product display order (for arranging products within category)
export const updateProductOrder = async (req, res) => {
  try {
    const { productIds } = req.body; // Array of product IDs in desired order

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array is required' });
    }

    // Update displayOrder for each product based on its position in the array
    const updatePromises = productIds.map((productId, index) => {
      return Product.findByIdAndUpdate(
        productId,
        { displayOrder: index },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.json({ 
      message: 'Product order updated successfully',
      products: productIds 
    });

  } catch (error) {
    console.error('Error updating product order:', error);
    res.status(500).json({ 
      error: 'Failed to update product order',
      details: error.message 
    });
  }
};

// Get products by seller
export const getProductsBySeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId || req.user?.id;
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    const products = await Product.find({ 
      seller: sellerId, 
      isActive: true,
      category: { 
        $nin: ['electronics', 'clothing', 'Electronics', 'Clothing', 'ELECTRONICS', 'CLOTHING'] 
      }
    })
      .populate('seller', 'name email')
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json(products);

  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch seller products',
      details: error.message 
    });
  }
};

// Get product by productId field (not MongoDB _id)
export const getProductByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    const product = await Product.findOne({ productId: productId.trim() }) // Exact match, case-sensitive
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product by productId:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error.message 
    });
  }
};

// Get multiple products by productIds array
export const getProductsByProductIds = async (req, res) => {
  try {
    const { productIds, sellerId } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array is required' });
    }
    
    console.log(`[Products] Fetching products by productIds. Count: ${productIds.length}, sellerId: ${sellerId || 'not provided'}`);
    console.log(`[Products] Product IDs:`, productIds);
    
    // Use product IDs exactly as provided (case-sensitive matching)
    const trimmedIds = productIds.map(id => String(id).trim());
    console.log(`[Products] Product IDs to search (exact match):`, trimmedIds);
    
    // Build query filter - exact match, case-sensitive
    // Exclude electronics and clothing categories
    const filter = { 
      productId: { $in: trimmedIds },
      isActive: true,
      category: { 
        $nin: ['electronics', 'clothing', 'Electronics', 'Clothing', 'ELECTRONICS', 'CLOTHING'] 
      }
    };
    
    // If sellerId is provided, filter by seller
    if (sellerId) {
      const mongoose = (await import('mongoose')).default;
      try {
        filter.seller = new mongoose.Types.ObjectId(sellerId);
        console.log(`[Products] Filtering by seller: ${sellerId}`);
      } catch (err) {
        console.warn(`[Products] Invalid sellerId format: ${sellerId}`);
      }
    }
    
    console.log(`[Products] Query filter:`, filter);
    
    const products = await Product.find(filter)
      .populate('seller', 'name email')
      .sort({ displayOrder: 1 });
    
    console.log(`[Products] Found ${products.length} products matching the criteria`);
    console.log(`[Products] Found products:`, products.map(p => ({ name: p.name, productId: p.productId, seller: p.seller })));
    
    // Sort products to match the order in productIds array (exact match, case-sensitive)
    const sortedProducts = trimmedIds
      .map(id => products.find(p => p.productId === id))
      .filter(p => p !== undefined);
    
    console.log(`[Products] Returning ${sortedProducts.length} sorted products`);
    
    res.json({ products: sortedProducts });
  } catch (error) {
    console.error('Error fetching products by productIds:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message 
    });
  }
};