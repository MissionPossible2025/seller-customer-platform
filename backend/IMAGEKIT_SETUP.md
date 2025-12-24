# ImageKit Integration Setup

## Installation

First, install the ImageKit SDK:

```bash
cd backend
npm install imagekit
```

## Environment Variables

Make sure your `backend/.env` file contains:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## API Endpoints

### 1. Upload Image
**POST** `/api/imagekit/upload`

Uploads an image to ImageKit and returns the URL.

**With file upload (multipart/form-data):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('fileName', 'product-1.jpg');
formData.append('folder', '/products');
formData.append('useSignedUrl', 'false');

fetch('/api/imagekit/upload', {
  method: 'POST',
  body: formData
});
```

**With base64 (application/json):**
```javascript
fetch('/api/imagekit/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: 'data:image/png;base64,iVBORw0KGgo...',
    fileName: 'product-1.png',
    folder: '/products'
  })
});
```

**Optional parameters:**
- `fileName`: Custom filename
- `folder`: ImageKit folder path (default: '/products')
- `tags`: Comma-separated tags
- `useSignedUrl`: Boolean - generate signed URL (default: false)
- `signedUrlExpire`: Expiration time in seconds (default: 3600)
- `transformations`: Object with transformation parameters

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully to ImageKit",
  "data": {
    "url": "https://ik.imagekit.io/.../image.jpg",
    "fileId": "file_id",
    "filePath": "/products/image.jpg",
    "name": "image.jpg",
    "size": 12345,
    "width": 800,
    "height": 600,
    "fileType": "image/jpeg"
  }
}
```

### 2. Get Authentication Parameters
**GET** `/api/imagekit/auth`

Get authentication parameters for client-side direct uploads.

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "authentication_token",
    "signature": "signature",
    "expire": 1234567890,
    "publicKey": "your_public_key",
    "urlEndpoint": "https://ik.imagekit.io/..."
  }
}
```

### 3. Transform Image URL
**POST** `/api/imagekit/transform`

Apply transformations to an existing ImageKit URL.

**Request:**
```json
{
  "imageUrl": "https://ik.imagekit.io/.../image.jpg",
  "transformations": {
    "width": 300,
    "height": 300,
    "crop": "center",
    "quality": 80
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalUrl": "https://ik.imagekit.io/.../image.jpg",
    "transformedUrl": "https://ik.imagekit.io/.../tr:w-300,h-300,c-center,q-80/image.jpg",
    "transformations": { "width": 300, "height": 300, "crop": "center", "quality": 80 }
  }
}
```

### 4. Generate Signed URL
**POST** `/api/imagekit/signed-url`

Generate a signed URL for private images.

**Request:**
```json
{
  "filePath": "/products/image.jpg",
  "expireSeconds": 3600,
  "transformations": {
    "width": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "signedUrl": "https://ik.imagekit.io/.../image.jpg?ik-s=...",
    "expiresIn": 3600,
    "filePath": "/products/image.jpg"
  }
}
```

## Image Transformations

ImageKit supports various transformations via URL parameters. Common transformations:

- `width`: Resize width
- `height`: Resize height
- `crop`: Crop mode (center, top, bottom, left, right, etc.)
- `quality`: JPEG quality (1-100)
- `format`: Convert format (auto, jpg, png, webp, etc.)
- `blur`: Blur effect (0-100)
- `brightness`: Brightness adjustment (-100 to 100)
- `contrast`: Contrast adjustment (-100 to 100)

Example transformation object:
```javascript
{
  width: 500,
  height: 500,
  crop: 'center',
  quality: 80,
  format: 'auto'
}
```

## Security Notes

- Private keys are **never** exposed to the frontend
- All sensitive operations happen server-side
- Signed URLs can be used for private images with expiration
- File size limit: 10MB (configurable in routes/imagekitRoutes.js)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (missing parameters, invalid data)
- `500`: Server error (ImageKit upload failure, etc.)

