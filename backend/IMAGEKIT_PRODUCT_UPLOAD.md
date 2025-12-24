# ImageKit Product Image Upload Integration

## Overview

The backend has been updated to upload product images directly to ImageKit instead of saving them locally. All images uploaded by sellers will now appear in your ImageKit Media Library.

## Changes Made

### 1. **Multer Configuration** (`backend/routes/productRoutes.js`)
   - Changed from disk storage to memory storage
   - Files are now uploaded directly to ImageKit, not saved locally
   - File size limit: 10MB
   - Only image files are accepted

### 2. **ImageKit Upload Utilities** (`backend/utils/imagekitUpload.js`)
   - `uploadImageToImageKit()` - Upload single image
   - `uploadMultipleImagesToImageKit()` - Upload multiple images
   - `deleteImageFromImageKit()` - Delete image by fileId
   - `isImageKitUrl()` - Check if URL is from ImageKit

### 3. **Product Controller Updates** (`backend/controllers/productController.js`)
   - `createProduct()` - Now uploads images to ImageKit
   - `updateProduct()` - Uploads new images to ImageKit and deletes old ones
   - `deleteProduct()` - Deletes images from ImageKit when product is deleted

## Image Storage Structure

Images are organized in ImageKit with the following folder structure:
```
/products/{productId}/
```

For example, if productId is "PROD-001", images will be stored in:
```
/products/PROD-001/
```

## How It Works

### Creating a Product with Images

1. Seller uploads images via POST `/api/products`
2. Images are received by multer (memory storage)
3. Images are uploaded to ImageKit using the SDK
4. ImageKit URLs are stored in MongoDB
5. Images appear in ImageKit Media Library

### Updating Product Images

1. Seller uploads new images
2. New images are uploaded to ImageKit
3. Old images are deleted from ImageKit (if they're ImageKit URLs)
4. Product is updated with new ImageKit URLs

### Deleting a Product

1. Product is soft-deleted (isActive = false)
2. All associated ImageKit images are deleted from ImageKit
3. Product record remains in database but is inactive

## Environment Variables Required

Make sure your `backend/.env` file contains:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## ImageKit URLs Stored in Database

The product model stores ImageKit URLs in:
- `photo` - Main product image (ImageKit URL)
- `photos` - Array of all product images (ImageKit URLs)

Example stored URL:
```
https://ik.imagekit.io/your_id/products/PROD-001/PROD-001-1.jpg
```

## Features

✅ **Direct ImageKit Upload** - Images go straight to ImageKit, not local storage
✅ **Automatic Organization** - Images organized by productId in folders
✅ **Tagging** - Images tagged with productId and category for easy search
✅ **Automatic Cleanup** - Old images deleted when products are updated/deleted
✅ **Backward Compatibility** - Still accepts ImageKit URLs in request body
✅ **Error Handling** - Proper error handling with rollback attempts

## Testing

1. **Create a product with images:**
   ```bash
   POST /api/products
   Content-Type: multipart/form-data
   Body: productId, name, description, category, seller, etc.
   Files: photo or photos (image files)
   ```

2. **Check ImageKit Media Library:**
   - Log into your ImageKit dashboard
   - Go to Media Library
   - You should see images in `/products/{productId}/` folder

3. **Update product images:**
   ```bash
   PUT /api/products/:id
   Content-Type: multipart/form-data
   Files: photo or photos (new image files)
   ```

4. **Verify old images are deleted:**
   - Check ImageKit Media Library
   - Old images should be removed

## Notes

- **File IDs**: ImageKit fileIds are not currently stored in the database. For perfect deletion, you may want to add a `imageKitFileIds` field to store fileIds mapped to URLs.
- **Local Files**: Old local files in `/uploads` folder are not automatically migrated. Existing products with local URLs will continue to work.
- **Error Recovery**: If product creation/update fails after ImageKit upload, the code attempts to delete the uploaded images, but this is best-effort.

## Troubleshooting

**Images not appearing in ImageKit:**
- Check environment variables are set correctly
- Verify ImageKit credentials are valid
- Check server logs for upload errors

**Images not deleting:**
- ImageKit deletion requires fileId, which may not be available for old images
- Check if URLs are ImageKit URLs (starts with ImageKit endpoint)

**Upload errors:**
- Check file size (max 10MB)
- Verify file is an image (jpg, png, etc.)
- Check ImageKit API limits

